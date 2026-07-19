import type { Brigade } from '../brigades/types'
import type { HoursEntry } from '../hours/types'
import type { OutputEntry } from '../output/types'
import type { SalaryEntry } from '../salary/types'
import type { Expense } from '../expenses/types'
import type { Payment } from '../payments/types'
import type { Person } from '../people/types'
import type { PersonDebtSummary } from '../debt/types'
import { calculatePeriodTotals, type PeriodTotals } from '../debt/periodTotals'
import { inRange, type PeriodRange } from './period'

export interface SummaryRow {
  personId: number
  name: string
  brigadeName: string
  totals: PeriodTotals
  outstanding: number
}

export interface SummaryRowsInput {
  people: Person[]
  brigades: Brigade[]
  hoursEntries: HoursEntry[]
  outputEntries: OutputEntry[]
  salaryEntries: SalaryEntry[]
  expenses: Expense[]
  payments: Payment[]
  debts: Map<number, PersonDebtSummary>
  range: PeriodRange | null
}

/** Řádky Zvedení (Summary) — sdíleno mezi stránkou, Excel exportem a PDF tiskem, ať se nerozjedou. */
export function calculateSummaryRows(input: SummaryRowsInput): SummaryRow[] {
  const withinRange = (date: string) => input.range == null || inRange(date, input.range.start, input.range.end)

  return input.people
    .map((person) => {
      const personId = person.id!
      const totals = calculatePeriodTotals({
        hoursEntries: input.hoursEntries.filter((e) => e.personId === personId && withinRange(e.date)),
        outputEntries: input.outputEntries.filter((e) => e.personId === personId && withinRange(e.date)),
        salaryEntries: input.salaryEntries.filter((e) => e.personId === personId && withinRange(e.date)),
        expenses: input.expenses.filter((e) => e.paidByPersonId === personId && withinRange(e.date)),
        payments: input.payments.filter((p) => p.personId === personId && withinRange(p.date)),
      })

      return {
        personId,
        name: person.name,
        brigadeName: input.brigades.find((b) => b.id === person.brigadeId)?.name ?? '',
        totals,
        outstanding: input.debts.get(personId)?.totalDebt ?? 0,
      }
    })
    .filter((row) => row.totals.accrued !== 0 || row.totals.expenses !== 0 || row.totals.paid !== 0 || row.outstanding !== 0)
    .sort((a, b) => b.totals.net - a.totals.net)
}
