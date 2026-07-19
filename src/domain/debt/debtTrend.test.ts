import { describe, expect, it } from 'vitest'
import { calculateDebtTrend } from './debtTrend'
import type { HoursEntry } from '../hours/types'
import type { SalaryEntry } from '../salary/types'
import type { Payment } from '../payments/types'
import type { Expense } from '../expenses/types'

function hours(date: string, personId: number, hoursWorked: number, rate: number): HoursEntry {
  return { tenantId: 1, date, personId, siteId: 1, hours: hoursWorked, hourlyRateSnapshot: rate }
}

function salary(date: string, personId: number, amount: number): SalaryEntry {
  return { tenantId: 1, date, personId, amount }
}

function payment(date: string, personId: number, amount: number): Payment {
  return { tenantId: 1, date, personId, amount }
}

function personExpense(date: string, personId: number, amount: number): Expense {
  return { tenantId: 1, date, paidByPersonId: personId, brigadeIdSnapshot: 1, categoryId: 1, amount }
}

function companyExpense(date: string, amount: number): Expense {
  return { tenantId: 1, date, paidByCompany: true, categoryId: 1, amount }
}

describe('calculateDebtTrend', () => {
  it('accumulates debt across months and drops it once paid off', () => {
    const trend = calculateDebtTrend({
      hoursEntries: [
        hours('2026-05-10', 1, 200, 200), // 40000
        hours('2026-06-10', 1, 225, 200), // 45000
      ],
      outputEntries: [],
      salaryEntries: [],
      expenses: [],
      payments: [payment('2026-07-01', 1, 60000)],
    })

    expect(trend).toEqual([
      { month: '2026-05', totalDebt: 40000 },
      { month: '2026-06', totalDebt: 85000 },
      { month: '2026-07', totalDebt: 25000 },
    ])
  })

  it('sums debt across multiple people independently', () => {
    const trend = calculateDebtTrend({
      hoursEntries: [hours('2026-05-01', 1, 10, 100), hours('2026-05-01', 2, 10, 200)],
      outputEntries: [],
      salaryEntries: [],
      expenses: [],
      payments: [payment('2026-05-15', 1, 1000)],
    })

    expect(trend).toEqual([{ month: '2026-05', totalDebt: 2000 }])
  })

  it('includes manually entered salary amounts in the accrued debt', () => {
    const trend = calculateDebtTrend({
      hoursEntries: [],
      outputEntries: [],
      salaryEntries: [salary('2026-05-01', 1, 5000)],
      expenses: [],
      payments: [],
    })

    expect(trend).toEqual([{ month: '2026-05', totalDebt: 5000 }])
  })

  it('counts an expense paid by a person toward that person debt', () => {
    const trend = calculateDebtTrend({
      hoursEntries: [],
      outputEntries: [],
      salaryEntries: [],
      expenses: [personExpense('2026-05-01', 1, 3000)],
      payments: [],
    })

    expect(trend).toEqual([{ month: '2026-05', totalDebt: 3000 }])
  })

  it('does not attribute a company-paid expense to any person debt', () => {
    const trend = calculateDebtTrend({
      hoursEntries: [hours('2026-05-01', 1, 10, 100)], // 1000
      outputEntries: [],
      salaryEntries: [],
      expenses: [companyExpense('2026-05-05', 50000)],
      payments: [],
    })

    // Only the person's own 1000 counts — the 50000 company-paid expense must not
    // leak in as a phantom "undefined person" debt, silently inflating the total.
    expect(trend).toEqual([{ month: '2026-05', totalDebt: 1000 }])
  })

  it('returns an empty trend when there is no data', () => {
    expect(
      calculateDebtTrend({ hoursEntries: [], outputEntries: [], salaryEntries: [], expenses: [], payments: [] }),
    ).toEqual([])
  })
})
