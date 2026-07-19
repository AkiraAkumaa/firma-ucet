import type { HoursEntry } from '../hours/types'
import type { OutputEntry } from '../output/types'
import type { SalaryEntry } from '../salary/types'
import type { Expense } from '../expenses/types'
import type { Payment } from '../payments/types'
import { hoursEntryAmount } from '../hours/calc'
import { outputEntryAmount } from '../output/calc'

export interface PeriodTotals {
  accrued: number
  expenses: number
  paid: number
  /** accrued + expenses − paid. Na rozdíl od PersonDebtSummary.totalDebt NENÍ omezeno na nulu — v období může vyjít i záporné. */
  net: number
}

export interface PeriodTotalsInput {
  hoursEntries: HoursEntry[]
  outputEntries: OutputEntry[]
  salaryEntries: SalaryEntry[]
  expenses: Expense[]
  payments: Payment[]
}

/**
 * Součty za předem vyfiltrované období (rok/kvartál/vše) — na rozdíl od
 * calculatePersonDebt NEDĚLÁ FIFO alokaci plateb podle měsíce dluhu, protože
 * platba datovaná v tomto období může splácet dluh z úplně jiného období.
 * Tady jde jen o to, kolik peněz se v tomto konkrétním okně reálně pohnulo.
 */
export function calculatePeriodTotals(input: PeriodTotalsInput): PeriodTotals {
  const accrued =
    input.hoursEntries.reduce((sum, e) => sum + hoursEntryAmount(e), 0) +
    input.outputEntries.reduce((sum, e) => sum + outputEntryAmount(e), 0) +
    input.salaryEntries.reduce((sum, e) => sum + e.amount, 0)
  const expensesTotal = input.expenses.reduce((sum, e) => sum + e.amount, 0)
  const paid = input.payments.reduce((sum, p) => sum + p.amount, 0)
  return { accrued, expenses: expensesTotal, paid, net: accrued + expensesTotal - paid }
}
