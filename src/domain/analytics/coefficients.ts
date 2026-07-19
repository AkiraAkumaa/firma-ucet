import type { MonolithFeatures, RebarFeatures } from './types'

export interface RebarCoefficients {
  totalMassKg: number
  /** kg vyztužení na m³ betonu — umožňuje srovnat malý a velký objekt. */
  densityKgPerM3: number
  /** počet pozic na m³ — hlavní ukazatel "roztříštěnosti" výkazu. */
  positionsPerM3: number
  /** 0..1, podíl hmotnosti malých průměrů (ø6–ø8) — malé průměry obvykle znamenají více vázání na kg. */
  smallDiameterFraction: number
  bentFraction: number
  sponyPerM3: number
}

/** Musí odpovídat FeatureVector (Record<string, number>) pro forecast.ts. */
export function calculateRebarCoefficients(f: RebarFeatures): RebarCoefficients {
  const totalMassKg = f.massByDiameter.reduce((sum, d) => sum + d.massKg, 0)
  const smallMassKg = f.massByDiameter.filter((d) => d.diameterMm <= 8).reduce((sum, d) => sum + d.massKg, 0)
  const volume = f.concreteVolumeM3

  return {
    totalMassKg,
    densityKgPerM3: volume > 0 ? totalMassKg / volume : 0,
    positionsPerM3: volume > 0 ? f.positionCount / volume : 0,
    smallDiameterFraction: totalMassKg > 0 ? smallMassKg / totalMassKg : 0,
    bentFraction: f.bentFraction,
    sponyPerM3: volume > 0 ? f.sponyCount / volume : 0,
  }
}

export interface MonolithCoefficients {
  totalConcreteVolumeM3: number
  /** m² bednění na m³ betonu — složitější tvar konstrukce = víc bednění na stejný objem. */
  formworkToVolumeRatio: number
  /** počet betonáží na m³ — hodně malých etap zpravidla znamená pomalejší postup. */
  poursPerM3: number
}

export function calculateMonolithCoefficients(f: MonolithFeatures): MonolithCoefficients {
  const totalConcreteVolumeM3 = f.concreteVolumeByThickness.reduce((sum, c) => sum + c.volumeM3, 0)

  return {
    totalConcreteVolumeM3,
    formworkToVolumeRatio: totalConcreteVolumeM3 > 0 ? f.formworkAreaM2 / totalConcreteVolumeM3 : 0,
    poursPerM3: totalConcreteVolumeM3 > 0 ? f.pourCount / totalConcreteVolumeM3 : 0,
  }
}
