import { useMemo } from 'react'
import { useExpenses, useHoursEntries, useOutputEntries, usePayments, useSalaryEntries } from '../../db/hooks'
import { calculatePersonDebt } from './calculateDebt'
import { calculateDebtTrend, type DebtTrendPoint } from './debtTrend'
import type { PersonDebtSummary } from './types'

export function usePersonDebt(personId: number): PersonDebtSummary {
  const hoursEntries = useHoursEntries()
  const outputEntries = useOutputEntries()
  const salaryEntries = useSalaryEntries()
  const expenses = useExpenses()
  const payments = usePayments()

  return useMemo(
    () =>
      calculatePersonDebt({
        hoursEntries: hoursEntries.filter((e) => e.personId === personId),
        outputEntries: outputEntries.filter((e) => e.personId === personId),
        salaryEntries: salaryEntries.filter((e) => e.personId === personId),
        expenses: expenses.filter((e) => e.paidByPersonId === personId),
        payments: payments.filter((p) => p.personId === personId),
      }),
    [hoursEntries, outputEntries, salaryEntries, expenses, payments, personId],
  )
}

/** Dluh každé osoby, klíčováno podle personId. */
export function useAllPeopleDebts(): Map<number, PersonDebtSummary> {
  const hoursEntries = useHoursEntries()
  const outputEntries = useOutputEntries()
  const salaryEntries = useSalaryEntries()
  const expenses = useExpenses()
  const payments = usePayments()

  return useMemo(() => {
    const personIds = new Set<number>()
    for (const e of hoursEntries) personIds.add(e.personId)
    for (const e of outputEntries) personIds.add(e.personId)
    for (const e of salaryEntries) personIds.add(e.personId)
    for (const e of expenses) {
      if (e.paidByPersonId != null) personIds.add(e.paidByPersonId)
    }
    for (const p of payments) personIds.add(p.personId)

    const result = new Map<number, PersonDebtSummary>()
    for (const personId of personIds) {
      result.set(
        personId,
        calculatePersonDebt({
          hoursEntries: hoursEntries.filter((e) => e.personId === personId),
          outputEntries: outputEntries.filter((e) => e.personId === personId),
          salaryEntries: salaryEntries.filter((e) => e.personId === personId),
          expenses: expenses.filter((e) => e.paidByPersonId === personId),
          payments: payments.filter((p) => p.personId === personId),
        }),
      )
    }
    return result
  }, [hoursEntries, outputEntries, salaryEntries, expenses, payments])
}

export function useDebtTrend(): DebtTrendPoint[] {
  const hoursEntries = useHoursEntries()
  const outputEntries = useOutputEntries()
  const salaryEntries = useSalaryEntries()
  const expenses = useExpenses()
  const payments = usePayments()

  return useMemo(
    () => calculateDebtTrend({ hoursEntries, outputEntries, salaryEntries, expenses, payments }),
    [hoursEntries, outputEntries, salaryEntries, expenses, payments],
  )
}
