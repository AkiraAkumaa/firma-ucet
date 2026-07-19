import { describe, expect, it } from 'vitest'
import { calculatePeriodTotals } from './periodTotals'
import type { HoursEntry } from '../hours/types'
import type { OutputEntry } from '../output/types'
import type { SalaryEntry } from '../salary/types'
import type { Expense } from '../expenses/types'
import type { Payment } from '../payments/types'

function hours(date: string, hoursWorked: number, rate: number): HoursEntry {
  return { tenantId: 1, date, personId: 1, siteId: 1, hours: hoursWorked, hourlyRateSnapshot: rate }
}

function output(date: string, quantity: number, unitPrice: number): OutputEntry {
  return { tenantId: 1, date, personId: 1, siteId: 1, workTypeId: 1, quantity, unitPrice, priceOverridden: false }
}

function salary(date: string, amount: number): SalaryEntry {
  return { tenantId: 1, date, personId: 1, amount }
}

function expense(date: string, amount: number): Expense {
  return { tenantId: 1, date, paidByPersonId: 1, brigadeIdSnapshot: 1, categoryId: 1, amount }
}

function payment(date: string, amount: number): Payment {
  return { tenantId: 1, date, personId: 1, amount }
}

describe('calculatePeriodTotals', () => {
  it('sums hours, output and salary as accrued, separately from expenses and paid', () => {
    const result = calculatePeriodTotals({
      hoursEntries: [hours('2026-05-10', 200, 200)],
      outputEntries: [output('2026-05-11', 100, 6)],
      salaryEntries: [salary('2026-05-12', 5000)],
      expenses: [expense('2026-05-13', 1000)],
      payments: [payment('2026-05-14', 30000)],
    })

    expect(result).toEqual({ accrued: 45600, expenses: 1000, paid: 30000, net: 16600 })
  })

  it('does not floor net at zero — a period can show more paid than accrued', () => {
    const result = calculatePeriodTotals({
      hoursEntries: [],
      outputEntries: [],
      salaryEntries: [],
      expenses: [],
      payments: [payment('2026-05-01', 10000)],
    })

    expect(result.net).toBe(-10000)
  })

  it('returns all zeros for an empty period', () => {
    expect(
      calculatePeriodTotals({ hoursEntries: [], outputEntries: [], salaryEntries: [], expenses: [], payments: [] }),
    ).toEqual({ accrued: 0, expenses: 0, paid: 0, net: 0 })
  })
})
