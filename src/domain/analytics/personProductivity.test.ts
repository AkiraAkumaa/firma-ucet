import { describe, expect, it } from 'vitest'
import { calculateDrawingActualHours, calculatePersonProductivity, calculateBrigadeProductivity } from './personProductivity'
import type { DrawingRecord, WorkHourEntry } from './types'

function hourEntry(
  personId: number,
  hours: number,
  drawingRecordId?: number,
  workCategory: 'armovani' | 'monolit' = 'armovani',
  date = '2026-05-01',
): WorkHourEntry {
  return { tenantId: 1, date, personId, siteId: 1, hours, workCategory, drawingRecordId }
}

function rebarDrawing(id: number, massKg: number): DrawingRecord {
  return {
    id,
    tenantId: 1,
    name: 'd',
    workCategory: 'armovani',
    rebar: { massByDiameter: [{ diameterMm: 12, massKg }], positionCount: 10, bentFraction: 0, sponyCount: 0, concreteVolumeM3: 10 },
    createdDate: '2026-01-01',
  }
}

describe('calculateDrawingActualHours', () => {
  it('sums only the hours linked to this specific drawing', () => {
    const entries = [hourEntry(1, 10, 5), hourEntry(2, 20, 5), hourEntry(3, 99, 6)]
    expect(calculateDrawingActualHours(5, entries)).toBe(30)
  })
})

describe('calculatePersonProductivity', () => {
  it('splits a drawing output between people proportionally to their hour share', () => {
    // person 1 worked 30 of 100 total hours on a 1000kg drawing -> attributed 300kg over 30h = 10 kg/h
    const drawing = rebarDrawing(1, 1000)
    const entries = [hourEntry(1, 30, 1), hourEntry(2, 70, 1)]
    const result = calculatePersonProductivity(1, 'armovani', entries, [drawing])

    expect(result.totalHours).toBe(30)
    expect(result.ratePerHour).toBeCloseTo(10, 5)
    expect(result.rateUnit).toBe('kg')
  })

  it('returns null rate when the person only has hours not linked to any drawing yet', () => {
    const entries = [hourEntry(1, 15, undefined)]
    const result = calculatePersonProductivity(1, 'armovani', entries, [])
    expect(result.totalHours).toBe(15)
    expect(result.ratePerHour).toBeNull()
  })

  it('ignores drawings of a different work category', () => {
    const monolithEntries = [hourEntry(1, 10, 1, 'monolit')]
    const result = calculatePersonProductivity(1, 'armovani', monolithEntries, [rebarDrawing(1, 500)])
    expect(result.totalHours).toBe(0)
    expect(result.ratePerHour).toBeNull()
  })
})

describe('calculateBrigadeProductivity', () => {
  it('attributes each entry to whichever brigade the resolver says for that entry, not a single static brigade', () => {
    // person 1 was in brigade 10 before 2026-06-01, then moved to brigade 20 — same person, two different drawings.
    const drawingEarly = rebarDrawing(1, 1000)
    const drawingLate = rebarDrawing(2, 2000)
    const entries = [
      hourEntry(1, 50, 1, 'armovani', '2026-05-01'), // brigade 10
      hourEntry(1, 50, 2, 'armovani', '2026-06-15'), // brigade 20
    ]
    const brigadeIdForEntry = (e: WorkHourEntry) => (e.date < '2026-06-01' ? 10 : 20)

    const brigade10 = calculateBrigadeProductivity(10, 'armovani', entries, [drawingEarly, drawingLate], brigadeIdForEntry)
    const brigade20 = calculateBrigadeProductivity(20, 'armovani', entries, [drawingEarly, drawingLate], brigadeIdForEntry)

    expect(brigade10.totalHours).toBe(50)
    expect(brigade10.ratePerHour).toBeCloseTo(20, 5) // 1000kg / 50h
    expect(brigade20.totalHours).toBe(50)
    expect(brigade20.ratePerHour).toBeCloseTo(40, 5) // 2000kg / 50h
  })
})
