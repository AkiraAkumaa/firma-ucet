import { monthOf } from '../debt/dateUtils'
import type { WorkType } from '../workTypes/types'
import { effectiveCustomerPrice } from './pricing'
import type { SiteWorkPlan, SiteWorkProgressEntry } from './types'

export interface WorkTypePlanRow {
  workTypeId: number
  plannedQuantity: number
  actualQuantity: number
  remainingQuantity: number
  plannedRevenue: number
  actualRevenue: number
}

/**
 * Plán vs. skutečnost pro jednu stavbu — plans i progress musí být předfiltrované
 * na tuto stavbu (stejná konvence jako calculateSiteProfitability). actualQuantity
 * je součet ručně zadaných datovaných záznamů (progress), ne z Output entries.
 */
export function calculateSitePlan(
  plans: SiteWorkPlan[],
  progress: SiteWorkProgressEntry[],
  workTypes: WorkType[],
): WorkTypePlanRow[] {
  const workTypeById = new Map(workTypes.map((w) => [w.id, w]))

  return plans.map((plan) => {
    const price = effectiveCustomerPrice(workTypeById.get(plan.workTypeId), plan)
    const actualQuantity = progress
      .filter((p) => p.siteId === plan.siteId && p.workTypeId === plan.workTypeId)
      .reduce((sum, p) => sum + p.quantity, 0)

    return {
      workTypeId: plan.workTypeId,
      plannedQuantity: plan.plannedQuantity,
      actualQuantity,
      remainingQuantity: plan.plannedQuantity - actualQuantity,
      plannedRevenue: plan.plannedQuantity * price,
      actualRevenue: actualQuantity * price,
    }
  })
}

export interface MonthlyProgressRow {
  /** 'YYYY-MM' */
  month: string
  quantity: number
}

/** Rozpis "Provedeno" po měsících pro jeden druh práce na stavbě — progress musí být předfiltrovaný. */
export function calculateMonthlyProgress(progress: SiteWorkProgressEntry[]): MonthlyProgressRow[] {
  const byMonth = new Map<string, number>()
  for (const entry of progress) {
    const month = monthOf(entry.date)
    byMonth.set(month, (byMonth.get(month) ?? 0) + entry.quantity)
  }
  return [...byMonth.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([month, quantity]) => ({ month, quantity }))
}
