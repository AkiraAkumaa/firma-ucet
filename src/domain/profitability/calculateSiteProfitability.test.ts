import { describe, expect, it } from 'vitest'
import { calculateSiteProfitability, expensesForSite } from './calculateSiteProfitability'
import type { HoursEntry } from '../hours/types'
import type { OutputEntry } from '../output/types'
import type { SalaryEntry } from '../salary/types'
import type { Expense } from '../expenses/types'
import type { WorkType } from '../workTypes/types'
import type { SiteCustomerPayment, SiteMaterialCost, SiteWorkProgressEntry } from './types'

function hours(hoursWorked: number, rate: number): HoursEntry {
  return { tenantId: 1, date: '2026-05-01', personId: 1, siteId: 1, hours: hoursWorked, hourlyRateSnapshot: rate }
}

function output(quantity: number, unitPrice: number): OutputEntry {
  return { tenantId: 1, date: '2026-05-01', personId: 1, siteId: 1, workTypeId: 1, quantity, unitPrice, priceOverridden: false }
}

function progress(workTypeId: number, quantity: number): SiteWorkProgressEntry {
  return { tenantId: 1, siteId: 1, workTypeId, date: '2026-05-01', quantity }
}

function salary(amount: number): SalaryEntry {
  return { tenantId: 1, date: '2026-05-01', personId: 1, siteId: 1, amount }
}

function workType(priceCustomer: number): WorkType {
  return { id: 1, tenantId: 1, name: 'Vazani armatury', unit: 'kg', priceOsvc: 6, priceZamestnanec: 5, priceCustomer }
}

function expense(amount: number, siteId?: number): Expense {
  return { tenantId: 1, date: '2026-05-01', paidByPersonId: 1, brigadeIdSnapshot: 1, categoryId: 1, amount, siteId }
}

function companyExpense(amount: number, siteId: number): Expense {
  return { tenantId: 1, date: '2026-05-01', paidByCompany: true, categoryId: 1, amount, siteId }
}

function customerPayment(amount: number): SiteCustomerPayment {
  return { tenantId: 1, siteId: 1, date: '2026-05-01', amount, stage: 'zaklady' }
}

function materialCost(amount: number): SiteMaterialCost {
  return { tenantId: 1, siteId: 1, date: '2026-05-01', amount }
}

describe('calculateSiteProfitability', () => {
  it('matches the worked example from the request: 15 Kč/kg revenue vs 6 Kč/kg wage', () => {
    const result = calculateSiteProfitability({
      hoursEntries: [],
      outputEntries: [output(1000, 6)],
      salaryEntries: [],
      workProgress: [progress(1, 1000)],
      workTypes: [workType(15)],
      plans: [],
      customerPayments: [],
      materialCosts: [],
      siteExpenses: [],
    })

    expect(result.revenue).toBe(15000)
    expect(result.laborCost).toBe(6000)
    expect(result.netProfit).toBe(9000)
  })

  it('does not count an Output entry as revenue on its own — only reported Plan progress does', () => {
    // Someone logged piecework for wages (Output) but the owner hasn't reported the matching
    // progress in "План по об'єктах" yet — revenue must stay at 0, not silently assume it's billed.
    const result = calculateSiteProfitability({
      hoursEntries: [],
      outputEntries: [output(1000, 6)],
      salaryEntries: [],
      workProgress: [],
      workTypes: [workType(15)],
      plans: [],
      customerPayments: [],
      materialCosts: [],
      siteExpenses: [],
    })

    expect(result.revenue).toBe(0)
    expect(result.laborCost).toBe(6000)
  })

  it('uses the current WorkType customer price, not a historical snapshot', () => {
    // the progress entry was recorded before the customer price was ever set (still 0 at the time)
    const result = calculateSiteProfitability({
      hoursEntries: [],
      outputEntries: [],
      salaryEntries: [],
      workProgress: [progress(1, 1000)],
      workTypes: [workType(15)], // price set afterwards
      plans: [],
      customerPayments: [],
      materialCosts: [],
      siteExpenses: [],
    })

    // revenue reflects the price as it stands now, not "0" from when the entry was created
    expect(result.revenue).toBe(15000)
  })

  it('adds lump-sum customer stage payments on top of reported progress revenue', () => {
    const result = calculateSiteProfitability({
      hoursEntries: [hours(10, 300)],
      outputEntries: [output(100, 6)],
      salaryEntries: [],
      workProgress: [progress(1, 100)],
      workTypes: [workType(15)],
      plans: [],
      customerPayments: [customerPayment(50000)],
      materialCosts: [],
      siteExpenses: [],
    })

    expect(result.revenue).toBe(50000 + 1500)
    expect(result.laborCost).toBe(3000 + 600)
    expect(result.netProfit).toBe(51500 - 3600)
  })

  it('treats progress of an unknown or priceless work type as zero revenue', () => {
    const result = calculateSiteProfitability({
      hoursEntries: [],
      outputEntries: [output(100, 6)],
      salaryEntries: [],
      workProgress: [progress(1, 100)],
      workTypes: [],
      plans: [],
      customerPayments: [],
      materialCosts: [],
      siteExpenses: [],
    })

    expect(result.revenue).toBe(0)
    expect(result.laborCost).toBe(600)
  })

  it('counts manually entered salary amounts as labor cost', () => {
    const result = calculateSiteProfitability({
      hoursEntries: [],
      outputEntries: [],
      salaryEntries: [salary(5000)],
      workProgress: [],
      workTypes: [],
      plans: [],
      customerPayments: [],
      materialCosts: [],
      siteExpenses: [],
    })

    expect(result.laborCost).toBe(5000)
  })

  it('matches the request scenario: firm charged 50k for the job, hourly-paid workers ended up costing 60k', () => {
    const result = calculateSiteProfitability({
      hoursEntries: [hours(200, 300)], // 60 000 Kč paid by the hour
      outputEntries: [],
      salaryEntries: [],
      workProgress: [],
      workTypes: [],
      plans: [],
      customerPayments: [customerPayment(50000)], // fixed price agreed with the customer
      materialCosts: [],
      siteExpenses: [],
    })

    expect(result.revenue).toBe(50000)
    expect(result.laborCost).toBe(60000)
    expect(result.netProfit).toBe(-10000)
  })

  it('subtracts material costs and pre-filtered site expenses from net profit', () => {
    const result = calculateSiteProfitability({
      hoursEntries: [],
      outputEntries: [],
      salaryEntries: [],
      workProgress: [],
      workTypes: [],
      plans: [],
      customerPayments: [customerPayment(10000)],
      materialCosts: [materialCost(2000)],
      siteExpenses: [expense(500, 1)],
    })

    expect(result.otherExpenses).toBe(500)
    expect(result.materialCost).toBe(2000)
    expect(result.netProfit).toBe(10000 - 2000 - 500)
  })

  it('subtracts an expense paid directly by the company from net profit, same as a person-paid one', () => {
    const result = calculateSiteProfitability({
      hoursEntries: [],
      outputEntries: [],
      salaryEntries: [],
      workProgress: [],
      workTypes: [],
      plans: [],
      customerPayments: [customerPayment(10000)],
      materialCosts: [],
      siteExpenses: [companyExpense(4000, 1)],
    })

    expect(result.otherExpenses).toBe(4000)
    expect(result.netProfit).toBe(10000 - 4000)
  })

  it('expensesForSite excludes expenses tagged to another site or untagged', () => {
    const all = [expense(500, 1), expense(300, 2), expense(9999, undefined)]
    expect(expensesForSite(all, 1)).toEqual([expense(500, 1)])
  })

  it('reports zero profitability when there is no data', () => {
    const result = calculateSiteProfitability({
      hoursEntries: [],
      outputEntries: [],
      salaryEntries: [],
      workProgress: [],
      workTypes: [],
      plans: [],
      customerPayments: [],
      materialCosts: [],
      siteExpenses: [],
    })
    expect(result).toEqual({ revenue: 0, laborCost: 0, materialCost: 0, otherExpenses: 0, netProfit: 0 })
  })
})
