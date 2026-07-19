import { describe, expect, it } from 'vitest'
import { forecastLaborHours, featureDistance, type HistoricalSample } from './forecast'

function sample(id: number, features: Record<string, number>, actualHours: number): HistoricalSample {
  return { drawingRecordId: id, features, actualHours }
}

describe('featureDistance', () => {
  it('treats a missing key in either vector as zero', () => {
    expect(featureDistance({ a: 3 }, { a: 0 })).toBe(3)
    expect(featureDistance({ a: 3, b: 4 }, {})).toBe(5)
  })
})

describe('forecastLaborHours', () => {
  it('refuses to predict below the minimum sample threshold, per the "insufficient data" requirement', () => {
    const history = [sample(1, { density: 20 }, 100), sample(2, { density: 22 }, 110)]
    const result = forecastLaborHours({ density: 21 }, history, { minRequiredSamples: 10 })

    expect(result.hasEnoughData).toBe(false)
    expect(result.predictedHours).toBeNull()
    expect(result.sampleCount).toBe(2)
  })

  it('weights closer neighbors more heavily than farther ones', () => {
    const history: HistoricalSample[] = Array.from({ length: 10 }, (_, i) => sample(i, { density: 10 + i }, 50 + i))
    // target is closest to density=15 (index 5, actualHours=55)
    const result = forecastLaborHours({ density: 15 }, history, { k: 3, minRequiredSamples: 10 })

    expect(result.hasEnoughData).toBe(true)
    expect(result.neighbors[0].drawingRecordId).toBe(5)
    expect(result.predictedHours).toBeGreaterThan(53)
    expect(result.predictedHours).toBeLessThan(57)
  })

  it('returns exactly the matching value when target is identical to one historical sample (distance 0)', () => {
    const history: HistoricalSample[] = Array.from({ length: 10 }, (_, i) => sample(i, { density: i * 10 }, i * 5))
    const result = forecastLaborHours({ density: 30 }, history, { k: 1, minRequiredSamples: 10 })

    expect(result.predictedHours).toBeCloseTo(15, 1)
  })
})
