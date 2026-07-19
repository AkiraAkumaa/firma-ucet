import { useMemo } from 'react'
import {
  useExpenses,
  useHoursEntries,
  useOutputEntries,
  useSalaryEntries,
  useSiteCustomerPayments,
  useSiteMaterialCosts,
  useSites,
  useSiteWorkPlans,
  useSiteWorkProgress,
  useWorkTypes,
} from '../../db/hooks'
import { calculateSiteProfitability, expensesForSite, type SiteProfitability } from './calculateSiteProfitability'
import { calculateSitePlan, type WorkTypePlanRow } from './calculateSitePlan'
import { calculateSiteMonthlyBreakdown, type SiteMonthlyBreakdown } from './calculateSiteMonthlyBreakdown'

export function useSiteProfitability(siteId: number): SiteProfitability {
  const hoursEntries = useHoursEntries()
  const outputEntries = useOutputEntries()
  const salaryEntries = useSalaryEntries()
  const workProgress = useSiteWorkProgress()
  const workTypes = useWorkTypes()
  const expenses = useExpenses()
  const customerPayments = useSiteCustomerPayments()
  const materialCosts = useSiteMaterialCosts()
  const plans = useSiteWorkPlans()

  return useMemo(
    () =>
      calculateSiteProfitability({
        hoursEntries: hoursEntries.filter((e) => e.siteId === siteId),
        outputEntries: outputEntries.filter((e) => e.siteId === siteId),
        salaryEntries: salaryEntries.filter((e) => e.siteId === siteId),
        workProgress: workProgress.filter((p) => p.siteId === siteId),
        workTypes,
        plans: plans.filter((p) => p.siteId === siteId),
        customerPayments: customerPayments.filter((p) => p.siteId === siteId),
        materialCosts: materialCosts.filter((m) => m.siteId === siteId),
        siteExpenses: expensesForSite(expenses, siteId),
      }),
    [hoursEntries, outputEntries, salaryEntries, workProgress, workTypes, plans, expenses, customerPayments, materialCosts, siteId],
  )
}

/** Ziskovost každé stavby, klíčováno podle siteId — pro seznamy (hooky nelze volat ve smyčce). */
export function useAllSitesProfitability(): Map<number, SiteProfitability> {
  const sites = useSites()
  const hoursEntries = useHoursEntries()
  const outputEntries = useOutputEntries()
  const salaryEntries = useSalaryEntries()
  const workProgress = useSiteWorkProgress()
  const workTypes = useWorkTypes()
  const expenses = useExpenses()
  const customerPayments = useSiteCustomerPayments()
  const materialCosts = useSiteMaterialCosts()
  const plans = useSiteWorkPlans()

  return useMemo(() => {
    const result = new Map<number, SiteProfitability>()
    for (const site of sites) {
      const siteId = site.id!
      result.set(
        siteId,
        calculateSiteProfitability({
          hoursEntries: hoursEntries.filter((e) => e.siteId === siteId),
          outputEntries: outputEntries.filter((e) => e.siteId === siteId),
          salaryEntries: salaryEntries.filter((e) => e.siteId === siteId),
          workProgress: workProgress.filter((p) => p.siteId === siteId),
          workTypes,
          plans: plans.filter((p) => p.siteId === siteId),
          customerPayments: customerPayments.filter((p) => p.siteId === siteId),
          materialCosts: materialCosts.filter((m) => m.siteId === siteId),
          siteExpenses: expensesForSite(expenses, siteId),
        }),
      )
    }
    return result
  }, [sites, hoursEntries, outputEntries, salaryEntries, workProgress, workTypes, plans, expenses, customerPayments, materialCosts])
}

export function useSitePlan(siteId: number): WorkTypePlanRow[] {
  const plans = useSiteWorkPlans()
  const progress = useSiteWorkProgress()
  const workTypes = useWorkTypes()

  return useMemo(
    () =>
      calculateSitePlan(
        plans.filter((p) => p.siteId === siteId),
        progress.filter((p) => p.siteId === siteId),
        workTypes,
      ),
    [plans, progress, workTypes, siteId],
  )
}

export function useSiteMonthlyBreakdown(siteId: number): SiteMonthlyBreakdown[] {
  const hoursEntries = useHoursEntries()
  const outputEntries = useOutputEntries()
  const salaryEntries = useSalaryEntries()
  const workProgress = useSiteWorkProgress()
  const workTypes = useWorkTypes()
  const expenses = useExpenses()
  const customerPayments = useSiteCustomerPayments()
  const materialCosts = useSiteMaterialCosts()
  const plans = useSiteWorkPlans()

  return useMemo(
    () =>
      calculateSiteMonthlyBreakdown({
        hoursEntries: hoursEntries.filter((e) => e.siteId === siteId),
        outputEntries: outputEntries.filter((e) => e.siteId === siteId),
        salaryEntries: salaryEntries.filter((e) => e.siteId === siteId),
        workProgress: workProgress.filter((p) => p.siteId === siteId),
        workTypes,
        plans: plans.filter((p) => p.siteId === siteId),
        customerPayments: customerPayments.filter((p) => p.siteId === siteId),
        materialCosts: materialCosts.filter((m) => m.siteId === siteId),
        siteExpenses: expensesForSite(expenses, siteId),
      }),
    [hoursEntries, outputEntries, salaryEntries, workProgress, workTypes, plans, expenses, customerPayments, materialCosts, siteId],
  )
}

/** Souhrn za celou firmu — na rozdíl od jedné stavby počítá se všemi výdaji, i neoznačenými. */
export function useCompanyProfitability(): SiteProfitability {
  const hoursEntries = useHoursEntries()
  const outputEntries = useOutputEntries()
  const salaryEntries = useSalaryEntries()
  const workProgress = useSiteWorkProgress()
  const workTypes = useWorkTypes()
  const expenses = useExpenses()
  const customerPayments = useSiteCustomerPayments()
  const materialCosts = useSiteMaterialCosts()
  const plans = useSiteWorkPlans()

  return useMemo(
    () =>
      calculateSiteProfitability({
        hoursEntries,
        outputEntries,
        salaryEntries,
        workProgress,
        workTypes,
        plans,
        customerPayments,
        materialCosts,
        siteExpenses: expenses,
      }),
    [hoursEntries, outputEntries, salaryEntries, workProgress, workTypes, plans, expenses, customerPayments, materialCosts],
  )
}
