import type { HoursEntry } from '../hours/types'
import type { OutputEntry } from '../output/types'
import type { SalaryEntry } from '../salary/types'
import type { Expense } from '../expenses/types'
import type { Payment } from '../payments/types'
import { calculatePersonDebt } from './calculateDebt'
import { monthOf } from './dateUtils'

export interface DebtTrendPoint {
  /** 'YYYY-MM' */
  month: string
  totalDebt: number
}

export interface DebtTrendInput {
  hoursEntries: HoursEntry[]
  outputEntries: OutputEntry[]
  salaryEntries: SalaryEntry[]
  expenses: Expense[]
  payments: Payment[]
}

function groupByPerson<T>(entries: T[], personIdOf: (entry: T) => number): Map<number, T[]> {
  const grouped = new Map<number, T[]>()
  for (const entry of entries) {
    const personId = personIdOf(entry)
    const list = grouped.get(personId)
    if (list) list.push(entry)
    else grouped.set(personId, [entry])
  }
  return grouped
}

/**
 * Celkový nesplacený dluh firmy ke konci každého měsíce, ve kterém existuje
 * alespoň jeden záznam. Pro každý měsíc znovu spočítá dluh každé osoby (FIFO)
 * jen z dat do konce daného měsíce — stejnou funkcí jako detail osoby, takže
 * číslo v grafu vždy odpovídá číslu na kartě osoby.
 */
export function calculateDebtTrend(input: DebtTrendInput): DebtTrendPoint[] {
  const months = new Set<string>()
  for (const e of input.hoursEntries) months.add(monthOf(e.date))
  for (const e of input.outputEntries) months.add(monthOf(e.date))
  for (const e of input.salaryEntries) months.add(monthOf(e.date))
  for (const e of input.expenses) months.add(monthOf(e.date))
  for (const p of input.payments) months.add(monthOf(p.date))

  const sortedMonths = [...months].sort((a, b) => a.localeCompare(b))

  return sortedMonths.map((cutoff) => {
    const hoursEntries = input.hoursEntries.filter((e) => monthOf(e.date) <= cutoff)
    const outputEntries = input.outputEntries.filter((e) => monthOf(e.date) <= cutoff)
    const salaryEntries = input.salaryEntries.filter((e) => monthOf(e.date) <= cutoff)
    const expenses = input.expenses.filter((e) => monthOf(e.date) <= cutoff)
    const payments = input.payments.filter((p) => monthOf(p.date) <= cutoff)

    const hoursByPerson = groupByPerson(hoursEntries, (e) => e.personId)
    const outputByPerson = groupByPerson(outputEntries, (e) => e.personId)
    const salaryByPerson = groupByPerson(salaryEntries, (e) => e.personId)
    const personExpenses = expenses.filter((e): e is Expense & { paidByPersonId: number } => e.paidByPersonId != null)
    const expensesByPerson = groupByPerson(personExpenses, (e) => e.paidByPersonId)
    const paymentsByPerson = groupByPerson(payments, (p) => p.personId)

    const personIds = new Set<number>([
      ...hoursByPerson.keys(),
      ...outputByPerson.keys(),
      ...salaryByPerson.keys(),
      ...expensesByPerson.keys(),
      ...paymentsByPerson.keys(),
    ])

    let totalDebt = 0
    for (const personId of personIds) {
      totalDebt += calculatePersonDebt({
        hoursEntries: hoursByPerson.get(personId) ?? [],
        outputEntries: outputByPerson.get(personId) ?? [],
        salaryEntries: salaryByPerson.get(personId) ?? [],
        expenses: expensesByPerson.get(personId) ?? [],
        payments: paymentsByPerson.get(personId) ?? [],
      }).totalDebt
    }

    return { month: cutoff, totalDebt }
  })
}
