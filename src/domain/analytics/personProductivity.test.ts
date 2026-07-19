import { describe, expect, it } from 'vitest'
import { calculateDrawingActualHours, calculatePersonProductivity } from './personProductivity'
import type { DrawingRecord, WorkHourEntry } from './types'

function hourEntry(personId: number, hours: number, drawingRecordId?: number, workCategory: 'armovani' | 'monolit' = 'armovani'): WorkHourEntry {
  return { tenantId: 1, date: '2026-05-01', personId, siteId: 1, hours, workCategory, drawingRecordId }
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
