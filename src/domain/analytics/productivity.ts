import type { RebarFeatures, MonolithFeatures } from './types'

export interface RebarProductivity {
  kgPerPersonHour: number
  positionsPerPersonHour: number
}

export function calculateRebarProductivity(f: RebarFeatures, personHours: number): RebarProductivity {
  const totalMassKg = f.massByDiameter.reduce((sum, d) => sum + d.massKg, 0)
  return {
    kgPerPersonHour: personHours > 0 ? totalMassKg / personHours : 0,
    positionsPerPersonHour: personHours > 0 ? f.positionCount / personHours : 0,
  }
}

export interface MonolithProductivity {
  m3PerPersonHour: number
  formworkM2PerPersonHour: number
}

export function calculateMonolithProductivity(f: MonolithFeatures, personHours: number): MonolithProductivity {
  const totalConcreteVolumeM3 = f.concreteVolumeByThickness.reduce((sum, c) => sum + c.volumeM3, 0)
  return {
    m3PerPersonHour: personHours > 0 ? totalConcreteVolumeM3 / personHours : 0,
    formworkM2PerPersonHour: personHours > 0 ? f.formworkAreaM2 / personHours : 0,
  }
}

/**
 * Koeficient produktivity party = její produktivita / průměrná produktivita pro
 * daný druh práce. Prognóza pak vydá základní číslo (průměrná parta) + úpravu
 * podle konkrétní party. 1 = přesně průměrná, >1 rychlejší, <1 pomalejší.
 */
export function calculateBrigadeCoefficient(brigadeProductivity: number, averageProductivity: number): number {
  return averageProductivity > 0 ? brigadeProductivity / averageProductivity : 1
}

export interface BrigadeMembershipLike {
  personId: number
  brigadeId: number
  startDate: string
  endDate?: string
}

/**
 * Ke které partě osoba patřila v konkrétní den — podle datované historie
 * (BrigadeMembership), s fallbackem na aktuální Person.brigadeId, pokud pro ten
 * den žádný záznam historie neexistuje (např. uživatel historii ještě nezadal).
 */
export function brigadeIdForPersonOnDate(
  personId: number,
  date: string,
  memberships: BrigadeMembershipLike[],
  fallbackBrigadeId: number,
): number {
  const match = memberships.find(
    (m) => m.personId === personId && m.startDate <= date && (m.endDate == null || date <= m.endDate),
  )
  return match?.brigadeId ?? fallbackBrigadeId
}
