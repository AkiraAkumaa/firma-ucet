import { describe, expect, it } from 'vitest'
import { calculatePersonCompanyValue } from './personCompanyValue'
import type { OutputEntry } from '../output/types'
import type { WorkType } from '../workTypes/types'
import type { Expense } from '../expenses/types'
import type { Person } from '../people/types'
import type { SiteWorkPlan } from './types'

function output(siteId: number, workTypeId: number, quantity: number, unitPrice: number, date = '2026-05-10'): OutputEntry {
  return { tenantId: 1, date, personId: 1, siteId, workTypeId, quantity, unitPrice, priceOverridden: false }
}

function workType(priceCustomer: number): WorkType {
  return { id: 1, tenantId: 1, name: 'wt', unit: 'kg', priceOsvc: 6, priceZamestnanec: 5, priceCustomer }
}

function brigadeExpense(amount: number): Expense {
  return { tenantId: 1, date: '2026-05-01', paidByCompany: true, brigadeIdSnapshot: 1, categoryId: 1, amount }
}

function person(overrides: Partial<Person> = {}): Person {
  return { tenantId: 1, name: 'Bodya', brigadeId: 1, type: 'osvc', hourlyRate: 300, ...overrides }
}

describe('calculatePersonCompanyValue', () => {
  it('matches the worked example: 1000kg tied at 5 Kč wage vs 15 Kč customer price', () => {
    const result = calculatePersonCompanyValue({
      person: person(),
      outputEntries: [output(1, 1, 1000, 5)],
      workTypes: [workType(15)],
      plans: [],
      brigadeExpensesInPeriod: [],
      brigadeMemberCount: 1,
      insuranceOverrides: [],
      activeMonths: ['2026-05'],
    })

    expect(result.outputMargin).toBe(1000 * 15 - 1000 * 5)
    expect(result.companyValue).toBe(10000)
  })

  it('uses a per-site price override instead of the WorkType default when one exists', () => {
    const plan: SiteWorkPlan = { tenantId: 1, siteId: 1, workTypeId: 1, plannedQuantity: 0, customerPriceOverride: 20 }
    const result = calculatePersonCompanyValue({
      person: person(),
      outputEntries: [output(1, 1, 100, 5)],
      workTypes: [workType(15)],
      plans: [plan],
      brigadeExpensesInPeriod: [],
      brigadeMemberCount: 1,
      insuranceOverrides: [],
      activeMonths: ['2026-05'],
    })

    expect(result.outputMargin).toBe(100 * 20 - 100 * 5)
  })

  it('splits brigade expenses equally among current members', () => {
    const result = calculatePersonCompanyValue({
      person: person(),
      outputEntries: [],
      workTypes: [],
      plans: [],
      brigadeExpensesInPeriod: [brigadeExpense(4000)],
      brigadeMemberCount: 4,
      insuranceOverrides: [],
      activeMonths: [],
    })

    expect(result.allocatedBrigadeExpense).toBe(1000)
    expect(result.companyValue).toBe(-1000)
  })

  it('charges the default monthly insurance for each active month, only for zaměstnanec', () => {
    const result = calculatePersonCompanyValue({
      person: person({ type: 'zamestnanec', insuranceMonthly: 2000 }),
      outputEntries: [],
      workTypes: [],
      plans: [],
      brigadeExpensesInPeriod: [],
      brigadeMemberCount: 1,
      insuranceOverrides: [],
      activeMonths: ['2026-04', '2026-05'],
    })

    expect(result.insuranceCost).toBe(4000)
  })

  it('never charges insurance for an OSVČ, even with insuranceMonthly set', () => {
    const result = calculatePersonCompanyValue({
      person: person({ type: 'osvc', insuranceMonthly: 2000 }),
      outputEntries: [],
      workTypes: [],
      plans: [],
      brigadeExpensesInPeriod: [],
      brigadeMemberCount: 1,
      insuranceOverrides: [],
      activeMonths: ['2026-05'],
    })

    expect(result.insuranceCost).toBe(0)
  })

  it('uses a month-specific insurance override instead of the default when one exists', () => {
    const result = calculatePersonCompanyValue({
      person: person({ type: 'zamestnanec', insuranceMonthly: 2000 }),
      outputEntries: [],
      workTypes: [],
      plans: [],
      brigadeExpensesInPeriod: [],
      brigadeMemberCount: 1,
      insuranceOverrides: [{ tenantId: 1, personId: 1, month: '2026-05', amount: 500 }],
      activeMonths: ['2026-05'],
    })

    expect(result.insuranceCost).toBe(500)
  })
})
