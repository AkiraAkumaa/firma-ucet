import { describe, expect, it } from 'vitest'
import { calculatePersonDebt } from './calculateDebt'
import type { HoursEntry } from '../hours/types'
import type { OutputEntry } from '../output/types'
import type { SalaryEntry } from '../salary/types'
import type { Expense } from '../expenses/types'
import type { Payment } from '../payments/types'

function hours(date: string, hoursWorked: number, rate: number): HoursEntry {
  return { tenantId: 1, date, personId: 1, siteId: 1, hours: hoursWorked, hourlyRateSnapshot: rate }
}

function output(date: string, quantity: number, unitPrice: number): OutputEntry {
  return { tenantId: 1, date, personId: 1, siteId: 1, workTypeId: 1, quantity, unitPrice, priceOverridden: false }
}

function salary(date: string, amount: number): SalaryEntry {
  return { tenantId: 1, date, personId: 1, amount }
}

function expense(date: string, amount: number): Expense {
  return { tenantId: 1, date, paidByPersonId: 1, brigadeIdSnapshot: 1, categoryId: 1, amount }
}

function payment(date: string, amount: number): Payment {
  return { tenantId: 1, date, personId: 1, amount }
}

describe('calculatePersonDebt', () => {
  it('matches the worked example from the spec: partial payment splits across the oldest two months', () => {
    const result = calculatePersonDebt({
      hoursEntries: [hours('2026-05-10', 200, 200), hours('2026-06-10', 225, 200)],
      outputEntries: [],
      salaryEntries: [],
      expenses: [],
      payments: [payment('2026-07-01', 60000)],
    })

    expect(result.months).toEqual([
      { month: '2026-05', accrued: 40000, expenses: 0, owed: 40000, paid: 40000, remaining: 0 },
      { month: '2026-06', accrued: 45000, expenses: 0, owed: 45000, paid: 20000, remaining: 25000 },
    ])
    expect(result.totalDebt).toBe(25000)
    expect(result.oldestUnpaidMonth).toBe('2026-06')
  })

  it('accrues both hours and piecework output within the same month', () => {
    const result = calculatePersonDebt({
      hoursEntries: [hours('2026-05-05', 10, 300)],
      outputEntries: [output('2026-05-15', 50, 20)],
      salaryEntries: [],
      expenses: [],
      payments: [],
    })

    expect(result.months).toHaveLength(1)
    expect(result.months[0].accrued).toBe(3000 + 1000)
    expect(result.totalDebt).toBe(4000)
  })

  it('accrues manually entered salary amounts alongside hours and output', () => {
    const result = calculatePersonDebt({
      hoursEntries: [hours('2026-05-05', 10, 300)],
      outputEntries: [],
      salaryEntries: [salary('2026-05-20', 5000)],
      expenses: [],
      payments: [],
    })

    expect(result.months[0].accrued).toBe(3000 + 5000)
    expect(result.totalDebt).toBe(8000)
  })

  it('treats expenses paid by the person as debt owed to them', () => {
    const result = calculatePersonDebt({
      hoursEntries: [hours('2026-05-05', 10, 300)],
      outputEntries: [],
      salaryEntries: [],
      expenses: [expense('2026-05-20', 500)],
      payments: [],
    })

    expect(result.months[0]).toMatchObject({ accrued: 3000, expenses: 500, owed: 3500, remaining: 3500 })
  })

  it('never goes negative when a payment overshoots total debt', () => {
    const result = calculatePersonDebt({
      hoursEntries: [hours('2026-05-05', 10, 100)],
      outputEntries: [],
      salaryEntries: [],
      expenses: [],
      payments: [payment('2026-06-01', 5000)],
    })

    expect(result.totalDebt).toBe(0)
    expect(result.months[0].remaining).toBe(0)
    expect(result.oldestUnpaidMonth).toBeNull()
  })

  it('allocates a single payment FIFO across three consecutive months', () => {
    const result = calculatePersonDebt({
      hoursEntries: [
        hours('2026-01-01', 10, 100), // 1000
        hours('2026-02-01', 10, 100), // 1000
        hours('2026-03-01', 10, 100), // 1000
      ],
      outputEntries: [],
      salaryEntries: [],
      expenses: [],
      payments: [payment('2026-04-01', 1500)],
    })

    expect(result.months.map((m) => m.remaining)).toEqual([0, 500, 1000])
    expect(result.totalDebt).toBe(1500)
    expect(result.oldestUnpaidMonth).toBe('2026-02')
  })

  it('sums multiple payments before allocating them FIFO', () => {
    const result = calculatePersonDebt({
      hoursEntries: [hours('2026-05-01', 10, 1000), hours('2026-06-01', 10, 1000)],
      outputEntries: [],
      salaryEntries: [],
      expenses: [],
      payments: [payment('2026-06-15', 3000), payment('2026-07-01', 4000)],
    })

    // owed: 10000 + 10000 = 20000; payments: 3000 + 4000 = 7000
    expect(result.months[0].remaining).toBe(3000)
    expect(result.months[1].remaining).toBe(10000)
    expect(result.totalDebt).toBe(13000)
  })

  it('reports zero debt and no oldest month when there are no entries at all', () => {
    const result = calculatePersonDebt({
      hoursEntries: [],
      outputEntries: [],
      salaryEntries: [],
      expenses: [],
      payments: [],
    })

    expect(result.totalDebt).toBe(0)
    expect(result.oldestUnpaidMonth).toBeNull()
    expect(result.delayDays).toBe(0)
    expect(result.months).toEqual([])
  })

  it('computes delay in days from the 1st of the month after the oldest unpaid month', () => {
    const result = calculatePersonDebt({
      hoursEntries: [hours('2026-05-15', 10, 100)],
      outputEntries: [],
      salaryEntries: [],
      expenses: [],
      payments: [],
      today: new Date(2026, 6, 15), // 15. července 2026 (měsíc je 0-indexovaný)
    })

    // Dluh za květen je splatný od 1. června. Do 15. července je to 44 dní.
    expect(result.oldestUnpaidMonth).toBe('2026-05')
    expect(result.delayDays).toBe(44)
  })

  it('has zero delay when the oldest unpaid month is the current month', () => {
    const result = calculatePersonDebt({
      hoursEntries: [hours('2026-07-05', 10, 100)],
      outputEntries: [],
      salaryEntries: [],
      expenses: [],
      payments: [],
      today: new Date(2026, 6, 15),
    })

    expect(result.oldestUnpaidMonth).toBe('2026-07')
    expect(result.delayDays).toBe(0)
  })
})
