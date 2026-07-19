import type { OutputEntry } from '../output/types'
import type { WorkType } from '../workTypes/types'
import type { Expense } from '../expenses/types'
import type { Person, InsuranceOverride } from '../people/types'
import { outputEntryAmount } from '../output/calc'
import { effectiveCustomerPrice } from './pricing'
import type { SiteWorkPlan } from './types'

export interface PersonCompanyValueInput {
  person: Person
  /** Výrobek (Output) této osoby, už předfiltrovaný na zvolené období. */
  outputEntries: OutputEntry[]
  workTypes: WorkType[]
  /** Všechny záznamy Plánu (kvůli per-stavba override ceny) — nemusí být předfiltrované. */
  plans: SiteWorkPlan[]
  /** Výdaje party (brigadeIdSnapshot === person.brigadeId) v tomto období, předfiltrované. */
  brigadeExpensesInPeriod: Expense[]
  /** Aktuální počet lidí v partě — pro rovný podíl na výdajích. */
  brigadeMemberCount: number
  insuranceOverrides: InsuranceOverride[]
  /** Měsíce ('YYYY-MM'), ve kterých měla osoba v tomto období nějakou nárokovanou aktivitu — jen za ně se počítá pojištění. */
  activeMonths: string[]
}

export interface PersonCompanyValue {
  /** Součet (množství × cena pro zákazníka − to, co bylo osobě zaplaceno) přes všechny záznamy Výrobku. */
  outputMargin: number
  /** Podíl osoby na výdajích party v tomto období (rovným dílem). */
  allocatedBrigadeExpense: number
  /** Sociální/zdravotní pojištění za odpracované měsíce — jen u zaměstnanců. */
  insuranceCost: number
  /** outputMargin − allocatedBrigadeExpense − insuranceCost. Orientační odhad, ne oficiální zisk stavby. */
  companyValue: number
}

/**
 * Orientační odhad přínosu jedné osoby pro firmu za období — na rozdíl od
 * SiteProfitability (která bere tržbu z Plánu/Provedeno, bez vazby na osobu)
 * tady vycházíme z Output entries osoby, protože jen ty mají personId.
 */
export function calculatePersonCompanyValue(input: PersonCompanyValueInput): PersonCompanyValue {
  const workTypeById = new Map(input.workTypes.map((w) => [w.id, w]))
  const planByKey = new Map(input.plans.map((p) => [`${p.siteId}-${p.workTypeId}`, p]))

  const outputMargin = input.outputEntries.reduce((sum, e) => {
    const price = effectiveCustomerPrice(workTypeById.get(e.workTypeId), planByKey.get(`${e.siteId}-${e.workTypeId}`))
    return sum + e.quantity * price - outputEntryAmount(e)
  }, 0)

  const allocatedBrigadeExpense =
    input.brigadeMemberCount > 0
      ? input.brigadeExpensesInPeriod.reduce((sum, e) => sum + e.amount, 0) / input.brigadeMemberCount
      : 0

  const overrideByMonth = new Map(input.insuranceOverrides.map((o) => [o.month, o.amount]))
  const insuranceCost =
    input.person.type === 'zamestnanec'
      ? input.activeMonths.reduce((sum, month) => sum + (overrideByMonth.get(month) ?? input.person.insuranceMonthly ?? 0), 0)
      : 0

  return {
    outputMargin,
    allocatedBrigadeExpense,
    insuranceCost,
    companyValue: outputMargin - allocatedBrigadeExpense - insuranceCost,
  }
}
