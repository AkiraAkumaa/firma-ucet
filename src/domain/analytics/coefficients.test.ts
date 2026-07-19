import { describe, expect, it } from 'vitest'
import { calculateRebarCoefficients, calculateMonolithCoefficients } from './coefficients'
import type { RebarFeatures, MonolithFeatures } from './types'

describe('calculateRebarCoefficients', () => {
  it('normalizes mass and position count by concrete volume so different-sized objects compare fairly', () => {
    const f: RebarFeatures = {
      massByDiameter: [
        { diameterMm: 6, massKg: 200 },
        { diameterMm: 12, massKg: 800 },
      ],
      positionCount: 100,
      bentFraction: 0.3,
      sponyCount: 50,
      concreteVolumeM3: 50,
    }
    const result = calculateRebarCoefficients(f)

    expect(result.totalMassKg).toBe(1000)
    expect(result.densityKgPerM3).toBe(20)
    expect(result.positionsPerM3).toBe(2)
    expect(result.smallDiameterFraction).toBe(0.2)
    expect(result.sponyPerM3).toBe(1)
  })

  it('returns zero ratios instead of dividing by zero when concrete volume is not known yet', () => {
    const f: RebarFeatures = {
      massByDiameter: [{ diameterMm: 8, massKg: 100 }],
      positionCount: 10,
      bentFraction: 0,
      sponyCount: 0,
      concreteVolumeM3: 0,
    }
    const result = calculateRebarCoefficients(f)

    expect(result.densityKgPerM3).toBe(0)
    expect(result.positionsPerM3).toBe(0)
  })
})

describe('calculateMonolithCoefficients', () => {
  it('sums concrete volume across thicknesses and derives formwork/pour ratios', () => {
    const f: MonolithFeatures = {
      concreteVolumeByThickness: [
        { thicknessMm: 200, volumeM3: 30 },
        { thicknessMm: 180, volumeM3: 20 },
      ],
      formworkAreaM2: 100,
      pourCount: 5,
    }
    const result = calculateMonolithCoefficients(f)

    expect(result.totalConcreteVolumeM3).toBe(50)
    expect(result.formworkToVolumeRatio).toBe(2)
    expect(result.poursPerM3).toBe(0.1)
  })
})
