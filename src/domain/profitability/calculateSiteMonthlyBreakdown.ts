import { monthOf } from '../debt/dateUtils'
import { calculateSiteProfitability, type SiteProfitabilityInput } from './calculateSiteProfitability'

export interface SiteMonthlyBreakdown {
  /** 'YYYY-MM' */
  month: string
  revenue: number
  laborCost: number
  materialCost: number
  otherExpenses: number
  netProfit: number
}

/**
 * Rozpad ziskovosti stavby po měsících — na rozdíl od trendu dluhu NENÍ
 * kumulativní, každý měsíc ukazuje jen svou vlastní aktivitu (kolik se ten
 * měsíc udělalo a vydělalo), ne běžící součet od začátku.
 */
export function calculateSiteMonthlyBreakdown(input: SiteProfitabilityInput): SiteMonthlyBreakdown[] {
  const months = new Set<string>()
  for (const e of input.hoursEntries) months.add(monthOf(e.date))
  for (const e of input.outputEntries) months.add(monthOf(e.date))
  for (const e of input.salaryEntries) months.add(monthOf(e.date))
  for (const p of input.workProgress) months.add(monthOf(p.date))
  for (const m of input.materialCosts) months.add(monthOf(m.date))
  for (const p of input.customerPayments) months.add(monthOf(p.date))
  for (const e of input.siteExpenses) months.add(monthOf(e.date))

  return [...months]
    .sort((a, b) => a.localeCompare(b))
    .map((month) => {
      const profitability = calculateSiteProfitability({
        hoursEntries: input.hoursEntries.filter((e) => monthOf(e.date) === month),
        outputEntries: input.outputEntries.filter((e) => monthOf(e.date) === month),
        salaryEntries: input.salaryEntries.filter((e) => monthOf(e.date) === month),
        workProgress: input.workProgress.filter((p) => monthOf(p.date) === month),
        workTypes: input.workTypes,
        plans: input.plans,
        customerPayments: input.customerPayments.filter((p) => monthOf(p.date) === month),
        materialCosts: input.materialCosts.filter((m) => monthOf(m.date) === month),
        siteExpenses: input.siteExpenses.filter((e) => monthOf(e.date) === month),
      })
      return { month, ...profitability }
    })
}
