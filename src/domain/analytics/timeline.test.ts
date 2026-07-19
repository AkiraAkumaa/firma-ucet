import { describe, expect, it } from 'vitest'
import { calculateJobTimeline } from './timeline'

describe('calculateJobTimeline', () => {
  it('returns an empty timeline when there is no data at all', () => {
    const result = calculateJobTimeline([], { today: '2026-07-19' })
    expect(result.startDate).toBeNull()
    expect(result.totalCalendarDays).toBe(0)
  })

  it('derives the start from worked dates but keeps the end at "today" when the job has no recorded finish', () => {
    const result = calculateJobTimeline(['2026-05-05', '2026-05-01', '2026-05-10'], { today: '2026-05-10' })
    expect(result.startDate).toBe('2026-05-01')
    expect(result.endDate).toBe('2026-05-10')
    expect(result.totalCalendarDays).toBe(10)
    expect(result.workedDaysCount).toBe(3)
    expect(result.pauseDaysCount).toBe(7)
  })

  it('treats an unfinished job (start set, no end) as still running through today', () => {
    const result = calculateJobTimeline(['2026-07-01'], { startDateOverride: '2026-07-01', today: '2026-07-19' })
    expect(result.endDate).toBe('2026-07-19')
    expect(result.totalCalendarDays).toBe(19)
  })

  it('lets a manual start date precede the first logged hour, creating a leading pause', () => {
    const result = calculateJobTimeline(['2026-05-10'], { startDateOverride: '2026-05-01', endDateOverride: '2026-05-10', today: '2026-07-19' })
    expect(result.pausePeriods).toEqual([{ from: '2026-05-01', to: '2026-05-09', days: 9 }])
    expect(result.pauseDaysCount).toBe(9)
    expect(result.workedDaysCount).toBe(1)
  })

  it('identifies a gap in the middle as its own pause period, distinct from a trailing pause', () => {
    const result = calculateJobTimeline(['2026-05-01', '2026-05-05', '2026-05-06', '2026-05-15'], {
      startDateOverride: '2026-05-01',
      endDateOverride: '2026-05-20',
      today: '2026-07-19',
    })
    // gap 05-02..05-04 (3 days), gap 05-07..05-14 (8 days), gap 05-16..05-20 (5 days)
    expect(result.pausePeriods).toEqual([
      { from: '2026-05-02', to: '2026-05-04', days: 3 },
      { from: '2026-05-07', to: '2026-05-14', days: 8 },
      { from: '2026-05-16', to: '2026-05-20', days: 5 },
    ])
    expect(result.pauseDaysCount).toBe(16)
    expect(result.workedDaysCount).toBe(4)
    expect(result.totalCalendarDays).toBe(20)
  })

  it('reports zero pauses when every day in a closed range was worked', () => {
    const result = calculateJobTimeline(['2026-05-01', '2026-05-02', '2026-05-03'], {
      endDateOverride: '2026-05-03',
      today: '2026-07-19',
    })
    expect(result.pauseDaysCount).toBe(0)
    expect(result.pausePeriods).toEqual([])
  })
})
