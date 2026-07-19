import { describe, expect, it } from 'vitest'
import { summarizeWorkHours, groupWorkHoursByMonth } from './summary'
import type { WorkHourEntry } from './types'

function entry(date: string, hours: number, workCategory: 'armovani' | 'monolit' = 'armovani'): WorkHourEntry {
  return { tenantId: 1, date, personId: 1, siteId: 1, hours, workCategory }
}

describe('summarizeWorkHours', () => {
  it('sums hours per category and overall', () => {
    const result = summarizeWorkHours([entry('2026-05-01', 8, 'armovani'), entry('2026-05-02', 6, 'monolit'), entry('2026-05-03', 4, 'armovani')])
    expect(result).toEqual({ armovani: 12, monolit: 6, total: 18 })
  })
})

describe('groupWorkHoursByMonth', () => {
  it('groups and sums by month, sorted chronologically', () => {
    const result = groupWorkHoursByMonth([
      entry('2026-06-01', 5, 'armovani'),
      entry('2026-05-01', 8, 'armovani'),
      entry('2026-05-15', 3, 'monolit'),
    ])
    expect(result).toEqual([
      { month: '2026-05', armovani: 8, monolit: 3, total: 11 },
      { month: '2026-06', armovani: 5, monolit: 0, total: 5 },
    ])
  })
})
