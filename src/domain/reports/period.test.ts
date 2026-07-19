import { describe, expect, it } from 'vitest'
import { monthRange, periodRange, quarterRange, stepPeriod, yearRange } from './period'

describe('monthRange', () => {
  it('covers the full month including its last day', () => {
    expect(monthRange(2026, 5)).toEqual({ start: '2026-05-01', end: '2026-05-31' })
  })

  it('handles February in a leap year', () => {
    expect(monthRange(2028, 2)).toEqual({ start: '2028-02-01', end: '2028-02-29' })
  })

  it('handles February in a non-leap year', () => {
    expect(monthRange(2026, 2)).toEqual({ start: '2026-02-01', end: '2026-02-28' })
  })

  it('handles December rolling into the next year internally without leaking', () => {
    expect(monthRange(2026, 12)).toEqual({ start: '2026-12-01', end: '2026-12-31' })
  })
})

describe('quarterRange', () => {
  it('Q1 covers January through March', () => {
    expect(quarterRange(2026, 1)).toEqual({ start: '2026-01-01', end: '2026-03-31' })
  })

  it('Q3 covers July through September', () => {
    expect(quarterRange(2026, 3)).toEqual({ start: '2026-07-01', end: '2026-09-30' })
  })

  it('Q4 covers October through December', () => {
    expect(quarterRange(2026, 4)).toEqual({ start: '2026-10-01', end: '2026-12-31' })
  })
})

describe('yearRange', () => {
  it('covers the full calendar year', () => {
    expect(yearRange(2026)).toEqual({ start: '2026-01-01', end: '2026-12-31' })
  })
})

describe('periodRange', () => {
  it('dispatches to the right range function by type', () => {
    expect(periodRange('month', 2026, 5)).toEqual(monthRange(2026, 5))
    expect(periodRange('quarter', 2026, 3)).toEqual(quarterRange(2026, 3))
    expect(periodRange('year', 2026, 1)).toEqual(yearRange(2026))
  })
})

describe('stepPeriod', () => {
  it('steps a month forward within the same year', () => {
    expect(stepPeriod({ type: 'month', year: 2026, value: 5 }, 1)).toEqual({ type: 'month', year: 2026, value: 6 })
  })

  it('rolls a month backward over the year boundary', () => {
    expect(stepPeriod({ type: 'month', year: 2026, value: 1 }, -1)).toEqual({ type: 'month', year: 2025, value: 12 })
  })

  it('rolls a month forward over the year boundary', () => {
    expect(stepPeriod({ type: 'month', year: 2026, value: 12 }, 1)).toEqual({ type: 'month', year: 2027, value: 1 })
  })

  it('rolls a quarter backward over the year boundary', () => {
    expect(stepPeriod({ type: 'quarter', year: 2026, value: 1 }, -1)).toEqual({ type: 'quarter', year: 2025, value: 4 })
  })

  it('rolls a quarter forward over the year boundary', () => {
    expect(stepPeriod({ type: 'quarter', year: 2026, value: 4 }, 1)).toEqual({ type: 'quarter', year: 2027, value: 1 })
  })

  it('steps a year directly', () => {
    expect(stepPeriod({ type: 'year', year: 2026, value: 1 }, 1)).toEqual({ type: 'year', year: 2027, value: 1 })
    expect(stepPeriod({ type: 'year', year: 2026, value: 1 }, -1)).toEqual({ type: 'year', year: 2025, value: 1 })
  })
})
