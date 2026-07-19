import type { HoursEntry } from '../hours/types'
import type { OutputEntry } from '../output/types'
import type { Expense } from '../expenses/types'
import type { Payment } from '../payments/types'
import type { SalaryEntry } from '../salary/types'
import { hoursEntryAmount } from '../hours/calc'
import { outputEntryAmount } from '../output/calc'
import type { MonthlyDebtBucket, PersonDebtSummary } from './types'
import { monthOf, startOfNextMonth, daysBetween } from './dateUtils'

export interface CalculateDebtInput {
  hoursEntries: HoursEntry[]
  outputEntries: OutputEntry[]
  /** Ručně vložené částky (mimo hodiny/výrobek) — počítají se do nárokováno stejně jako ostatní práce. */
  salaryEntries: SalaryEntry[]
  expenses: Expense[]
  payments: Payment[]
  /** Pro testy — jinak dnešní datum. */
  today?: Date
}

/**
 * Dluh vůči osobě = (nárokováno za práci) + (výdaje k proplacení) − (vyplaceno).
 * Platby nejsou vázané na konkrétní měsíc — hasí dluh počínaje nejstarším
 * nesplaceným měsícem (FIFO). Zjednodušení (potvrzeno): zálohy dopředu
 * neexistují a dluh nikdy nejde do mínusu — osoba nikdy nedluží firmě.
 */
export function calculatePersonDebt(input: CalculateDebtInput): PersonDebtSummary {
  const owedByMonth = new Map<string, { accrued: number; expenses: number }>()

  const bucket = (month: string) => {
    let entry = owedByMonth.get(month)
    if (!entry) {
      entry = { accrued: 0, expenses: 0 }
      owedByMonth.set(month, entry)
    }
    return entry
  }

  for (const hoursEntry of input.hoursEntries) {
    bucket(monthOf(hoursEntry.date)).accrued += hoursEntryAmount(hoursEntry)
  }
  for (const outputEntry of input.outputEntries) {
    bucket(monthOf(outputEntry.date)).accrued += outputEntryAmount(outputEntry)
  }
  for (const salaryEntry of input.salaryEntries) {
    bucket(monthOf(salaryEntry.date)).accrued += salaryEntry.amount
  }
  for (const expense of input.expenses) {
    bucket(monthOf(expense.date)).expenses += expense.amount
  }

  const months: MonthlyDebtBucket[] = [...owedByMonth.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, { accrued, expenses }]) => ({
      month,
      accrued,
      expenses,
      owed: accrued + expenses,
      paid: 0,
      remaining: accrued + expenses,
    }))

  let paymentPool = input.payments.reduce((sum, payment) => sum + payment.amount, 0)

  for (const month of months) {
    if (paymentPool <= 0) break
    const applied = Math.min(paymentPool, month.remaining)
    month.paid += applied
    month.remaining -= applied
    paymentPool -= applied
  }

  const totalDebt = months.reduce((sum, month) => sum + month.remaining, 0)
  const oldestUnpaid = months.find((month) => month.remaining > 0) ?? null
  const today = input.today ?? new Date()
  const delayDays = oldestUnpaid ? daysBetween(startOfNextMonth(oldestUnpaid.month), today) : 0

  return {
    totalDebt,
    oldestUnpaidMonth: oldestUnpaid?.month ?? null,
    delayDays,
    months,
  }
}
