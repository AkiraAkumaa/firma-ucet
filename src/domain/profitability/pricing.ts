import type { WorkType } from '../workTypes/types'
import type { SiteWorkPlan } from './types'

/** Cena pro zákazníka pro tuto stavbu — override z Plánu, pokud existuje, jinak výchozí cena druhu práce. */
export function effectiveCustomerPrice(workType: WorkType | undefined, plan: SiteWorkPlan | undefined): number {
  return plan?.customerPriceOverride ?? workType?.priceCustomer ?? 0
}
