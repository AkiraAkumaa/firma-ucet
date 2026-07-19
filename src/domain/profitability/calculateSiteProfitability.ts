import type { HoursEntry } from '../hours/types'
import type { OutputEntry } from '../output/types'
import type { SalaryEntry } from '../salary/types'
import type { Expense } from '../expenses/types'
import type { WorkType } from '../workTypes/types'
import { hoursEntryAmount } from '../hours/calc'
import { outputEntryAmount } from '../output/calc'
import { effectiveCustomerPrice } from './pricing'
import type { SiteCustomerPayment, SiteMaterialCost, SiteWorkPlan, SiteWorkProgressEntry } from './types'

export interface SiteProfitabilityInput {
  hoursEntries: HoursEntry[]
  outputEntries: OutputEntry[]
  /** Ručně vložené částky (mimo hodiny/výrobek) — počítají se do mzdových nákladů stejně jako ostatní práce. */
  salaryEntries: SalaryEntry[]
  /**
   * Nahlášené hotové množství z Plánu po objektech (viz calculateSitePlan) — tržba
   * se počítá z NĚJ, ne z Output entries: Output slouží k výplatě mezd a nemusí
   * pokrývat všechnu nahlášenou práci, takže by tržbu podhodnocoval.
   */
  workProgress: SiteWorkProgressEntry[]
  /** Pro dohledání aktuální ceny pro zákazníka (WorkType.priceCustomer) k nahlášené práci. */
  workTypes: WorkType[]
  /** Pro per-stavbu override ceny (SiteWorkPlan.customerPriceOverride) — už předfiltrované na tuto stavbu. */
  plans: SiteWorkPlan[]
  customerPayments: SiteCustomerPayment[]
  materialCosts: SiteMaterialCost[]
  /** Výdaje (Vytrata) už předfiltrované na tuto stavbu — viz expensesForSite. */
  siteExpenses: Expense[]
}

/** Výdaje (Vytrata) mají siteId nepovinné — spočítat lze jen ty, co jsou k této stavbě přiřazené. */
export function expensesForSite(expenses: Expense[], siteId: number): Expense[] {
  return expenses.filter((e) => e.siteId === siteId)
}

export interface SiteProfitability {
  /** Paušální platby od zákazníka + tržba z nahlášeného hotového množství (quantity × priceCustomer). */
  revenue: number
  /** Mzdové náklady — hodiny + výrobek. */
  laborCost: number
  materialCost: number
  otherExpenses: number
  /** revenue − laborCost − materialCost − otherExpenses */
  netProfit: number
}

export function calculateSiteProfitability(input: SiteProfitabilityInput): SiteProfitability {
  const workTypeById = new Map(input.workTypes.map((w) => [w.id, w]))
  const planByWorkTypeId = new Map(input.plans.map((p) => [p.workTypeId, p]))
  const revenue =
    input.customerPayments.reduce((sum, p) => sum + p.amount, 0) +
    input.workProgress.reduce(
      (sum, p) => sum + p.quantity * effectiveCustomerPrice(workTypeById.get(p.workTypeId), planByWorkTypeId.get(p.workTypeId)),
      0,
    )

  const laborCost =
    input.hoursEntries.reduce((sum, e) => sum + hoursEntryAmount(e), 0) +
    input.outputEntries.reduce((sum, e) => sum + outputEntryAmount(e), 0) +
    input.salaryEntries.reduce((sum, e) => sum + e.amount, 0)

  const materialCost = input.materialCosts.reduce((sum, m) => sum + m.amount, 0)
  const otherExpenses = input.siteExpenses.reduce((sum, e) => sum + e.amount, 0)

  return {
    revenue,
    laborCost,
    materialCost,
    otherExpenses,
    netProfit: revenue - laborCost - materialCost - otherExpenses,
  }
}
