import { describe, expect, it } from 'vitest'
import { calculateSiteMonthlyBreakdown } from './calculateSiteMonthlyBreakdown'
import type { HoursEntry } from '../hours/types'
import type { OutputEntry } from '../output/types'
import type { SalaryEntry } from '../salary/types'
import type { WorkType } from '../workTypes/types'
import type { SiteWorkProgressEntry } from './types'

function hours(date: string, hoursWorked: number, rate: number): HoursEntry {
  return { tenantId: 1, date, personId: 1, siteId: 1, hours: hoursWorked, hourlyRateSnapshot: rate }
}

function output(date: string, quantity: number): OutputEntry {
  return { tenantId: 1, date, personId: 1, siteId: 1, workTypeId: 1, quantity, unitPrice: 6, priceOverridden: false }
}

function progress(date: string, quantity: number): SiteWorkProgressEntry {
  return { tenantId: 1, siteId: 1, workTypeId: 1, date, quantity }
}

function salary(date: string, amount: number): SalaryEntry {
  return { tenantId: 1, date, personId: 1, siteId: 1, amount }
}

function workType(): WorkType {
  return { id: 1, tenantId: 1, name: 'wt', unit: 'kg', priceOsvc: 6, priceZamestnanec: 5, priceCustomer: 15 }
}

describe('calculateSiteMonthlyBreakdown', () => {
  it('reports each month independently, not as a running total', () => {
    const rows = calculateSiteMonthlyBreakdown({
      hoursEntries: [],
      outputEntries: [output('2026-05-10', 1000), output('2026-06-10', 500)],
      salaryEntries: [],
      workProgress: [progress('2026-05-10', 1000), progress('2026-06-10', 500)],
      workTypes: [workType()],
      plans: [],
      customerPayments: [],
      materialCosts: [],
      siteExpenses: [],
    })

    expect(rows).toEqual([
      { month: '2026-05', revenue: 15000, laborCost: 6000, materialCost: 0, otherExpenses: 0, netProfit: 9000 },
      { month: '2026-06', revenue: 7500, laborCost: 3000, materialCost: 0, otherExpenses: 0, netProfit: 4500 },
    ])
  })

  it('combines hours and output activity within the same month', () => {
    const rows = calculateSiteMonthlyBreakdown({
      hoursEntries: [hours('2026-05-05', 10, 300)],
      outputEntries: [output('2026-05-15', 100)],
      salaryEntries: [],
      workProgress: [progress('2026-05-15', 100)],
      workTypes: [workType()],
      plans: [],
      customerPayments: [],
      materialCosts: [],
      siteExpenses: [],
    })

    expect(rows).toEqual([
      { month: '2026-05', revenue: 1500, laborCost: 3000 + 600, materialCost: 0, otherExpenses: 0, netProfit: 1500 - 3600 },
    ])
  })

  it('includes manually entered salary amounts in the correct month', () => {
    const rows = calculateSiteMonthlyBreakdown({
      hoursEntries: [],
      outputEntries: [],
      salaryEntries: [salary('2026-05-05', 5000)],
      workProgress: [],
      workTypes: [],
      plans: [],
      customerPayments: [],
      materialCosts: [],
      siteExpenses: [],
    })

    expect(rows).toEqual([
      { month: '2026-05', revenue: 0, laborCost: 5000, materialCost: 0, otherExpenses: 0, netProfit: -5000 },
    ])
  })

  it('returns an empty list when there is no activity', () => {
    expect(
      calculateSiteMonthlyBreakdown({
        hoursEntries: [],
        outputEntries: [],
        salaryEntries: [],
        workProgress: [],
        workTypes: [],
        plans: [],
        customerPayments: [],
        materialCosts: [],
        siteExpenses: [],
      }),
    ).toEqual([])
  })
})
