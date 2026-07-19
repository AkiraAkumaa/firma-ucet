import { describe, expect, it } from 'vitest'
import { calculateMonthlyProgress, calculateSitePlan } from './calculateSitePlan'
import type { WorkType } from '../workTypes/types'
import type { SiteWorkPlan, SiteWorkProgressEntry } from './types'

function plan(workTypeId: number, plannedQuantity: number): SiteWorkPlan {
  return { tenantId: 1, siteId: 1, workTypeId, plannedQuantity }
}

function progress(workTypeId: number, date: string, quantity: number): SiteWorkProgressEntry {
  return { tenantId: 1, siteId: 1, workTypeId, date, quantity }
}

function workType(id: number, priceCustomer: number): WorkType {
  return { id, tenantId: 1, name: 'wt', unit: 'kg', priceOsvc: 6, priceZamestnanec: 5, priceCustomer }
}

describe('calculateSitePlan', () => {
  it('matches the worked example: 20 000 kg planned at 15 Kč, 8 000 kg reported done', () => {
    const rows = calculateSitePlan([plan(1, 20000)], [progress(1, '2026-05-10', 8000)], [workType(1, 15)])

    expect(rows).toEqual([
      {
        workTypeId: 1,
        plannedQuantity: 20000,
        actualQuantity: 8000,
        remainingQuantity: 12000,
        plannedRevenue: 300000,
        actualRevenue: 120000,
      },
    ])
  })

  it('sums multiple dated progress entries into actual quantity, not from any output log', () => {
    const rows = calculateSitePlan(
      [plan(1, 1000)],
      [progress(1, '2026-05-01', 200), progress(1, '2026-06-01', 300)],
      [workType(1, 250)],
    )
    expect(rows[0].actualQuantity).toBe(500)
    expect(rows[0].remainingQuantity).toBe(500)
    expect(rows[0].actualRevenue).toBe(125000)
  })

  it('allows remaining quantity to go negative when actual overshoots the plan', () => {
    const rows = calculateSitePlan([plan(1, 100)], [progress(1, '2026-05-01', 150)], [workType(1, 10)])
    expect(rows[0].remainingQuantity).toBe(-50)
  })

  it('treats a work type missing from the price list as zero revenue', () => {
    const rows = calculateSitePlan([plan(1, 1000)], [progress(1, '2026-05-01', 200)], [])
    expect(rows[0].plannedRevenue).toBe(0)
    expect(rows[0].actualRevenue).toBe(0)
  })

  it('returns an empty list when there is no plan', () => {
    expect(calculateSitePlan([], [], [workType(1, 10)])).toEqual([])
  })
})

describe('calculateMonthlyProgress', () => {
  it('groups and sums progress entries by month, sorted chronologically', () => {
    const rows = calculateMonthlyProgress([
      progress(1, '2026-06-20', 3000),
      progress(1, '2026-07-05', 1500),
      progress(1, '2026-06-01', 2000),
    ])

    expect(rows).toEqual([
      { month: '2026-06', quantity: 5000 },
      { month: '2026-07', quantity: 1500 },
    ])
  })

  it('returns an empty list when there is no progress', () => {
    expect(calculateMonthlyProgress([])).toEqual([])
  })
})
