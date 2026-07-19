import { describe, expect, it } from 'vitest'
import {
  calculateRebarProductivity,
  calculateMonolithProductivity,
  calculateBrigadeCoefficient,
  brigadeIdForPersonOnDate,
} from './productivity'
import type { RebarFeatures, MonolithFeatures } from './types'

describe('calculateRebarProductivity', () => {
  it('divides total mass and position count by person-hours actually spent', () => {
    const f: RebarFeatures = {
      massByDiameter: [{ diameterMm: 12, massKg: 500 }],
      positionCount: 50,
      bentFraction: 0,
      sponyCount: 0,
      concreteVolumeM3: 10,
    }
    const result = calculateRebarProductivity(f, 100)
    expect(result.kgPerPersonHour).toBe(5)
    expect(result.positionsPerPersonHour).toBe(0.5)
  })

  it('returns zero instead of dividing by zero when no hours are logged yet', () => {
    const f: RebarFeatures = { massByDiameter: [], positionCount: 0, bentFraction: 0, sponyCount: 0, concreteVolumeM3: 0 }
    expect(calculateRebarProductivity(f, 0).kgPerPersonHour).toBe(0)
  })
})

describe('calculateMonolithProductivity', () => {
  it('divides concrete volume and formwork area by person-hours', () => {
    const f: MonolithFeatures = { concreteVolumeByThickness: [{ thicknessMm: 200, volumeM3: 40 }], formworkAreaM2: 80, pourCount: 2 }
    const result = calculateMonolithProductivity(f, 20)
    expect(result.m3PerPersonHour).toBe(2)
    expect(result.formworkM2PerPersonHour).toBe(4)
  })
})

describe('calculateBrigadeCoefficient', () => {
  it('is 1 for an exactly average brigade, >1 for a faster one', () => {
    expect(calculateBrigadeCoefficient(10, 10)).toBe(1)
    expect(calculateBrigadeCoefficient(15, 10)).toBe(1.5)
    expect(calculateBrigadeCoefficient(5, 10)).toBe(0.5)
  })

  it('defaults to 1 (neutral) when there is no average to compare against yet', () => {
    expect(calculateBrigadeCoefficient(10, 0)).toBe(1)
  })
})

describe('brigadeIdForPersonOnDate', () => {
  const memberships = [
    { personId: 1, brigadeId: 10, startDate: '2026-01-01', endDate: '2026-03-31' },
    { personId: 1, brigadeId: 20, startDate: '2026-04-01' },
  ]

  it('picks the membership whose date range covers the given date', () => {
    expect(brigadeIdForPersonOnDate(1, '2026-02-15', memberships, 99)).toBe(10)
    expect(brigadeIdForPersonOnDate(1, '2026-05-01', memberships, 99)).toBe(20)
  })

  it('falls back to the current Person.brigadeId when no membership history covers that date', () => {
    expect(brigadeIdForPersonOnDate(2, '2026-02-15', memberships, 99)).toBe(99)
  })

  it('treats a membership with no endDate as still active indefinitely', () => {
    expect(brigadeIdForPersonOnDate(1, '2030-01-01', memberships, 99)).toBe(20)
  })
})
