import { monthOf } from '../debt/dateUtils'
import { hoursEntryAmount } from '../hours/calc'
import { outputEntryAmount } from '../output/calc'
import type { HoursEntry } from '../hours/types'
import type { OutputEntry } from '../output/types'
import type { Expense } from '../expenses/types'

export interface BrigadeMonthlyRow {
  /** 'YYYY-MM' */
  month: string
  labor: number
  expenses: number
  total: number
}

export interface BrigadeSummaryInput {
  /** Hodiny členů party — už předfiltrované na tuto partu. */
  hoursEntries: HoursEntry[]
  /** Výrobek členů party — už předfiltrovaný na tuto partu. */
  outputEntries: OutputEntry[]
  /** Výdaje s brigadeIdSnapshot rovným této partě — už předfiltrované. */
  expenses: Expense[]
}

/** Statistika party po měsících — stejná logika jako calculateSiteMonthlyBreakdown, jen pro partu místo stavby. */
export function calculateBrigadeMonthlyBreakdown(input: BrigadeSummaryInput): BrigadeMonthlyRow[] {
  const months = new Set<string>()
  for (const e of input.hoursEntries) months.add(monthOf(e.date))
  for (const e of input.outputEntries) months.add(monthOf(e.date))
  for (const e of input.expenses) months.add(monthOf(e.date))

  return [...months]
    .sort((a, b) => a.localeCompare(b))
    .map((month) => {
      const labor =
        input.hoursEntries.filter((e) => monthOf(e.date) === month).reduce((sum, e) => sum + hoursEntryAmount(e), 0) +
        input.outputEntries.filter((e) => monthOf(e.date) === month).reduce((sum, e) => sum + outputEntryAmount(e), 0)
      const expenses = input.expenses.filter((e) => monthOf(e.date) === month).reduce((sum, e) => sum + e.amount, 0)
      return { month, labor, expenses, total: labor + expenses }
    })
}
