import { monthOf } from '../debt/dateUtils'
import type { WorkHourEntry } from './types'

export interface WorkHoursTotals {
  armovani: number
  monolit: number
  total: number
}

export function summarizeWorkHours(entries: WorkHourEntry[]): WorkHoursTotals {
  const armovani = entries.filter((e) => e.workCategory === 'armovani').reduce((sum, e) => sum + e.hours, 0)
  const monolit = entries.filter((e) => e.workCategory === 'monolit').reduce((sum, e) => sum + e.hours, 0)
  return { armovani, monolit, total: armovani + monolit }
}

export interface MonthlyWorkHours extends WorkHoursTotals {
  /** 'YYYY-MM' */
  month: string
}

/** Rozpis analytických (nezpoplatněných) hodin po měsících — vstup už předfiltrovaný na osobu/partu/stavbu podle potřeby. */
export function groupWorkHoursByMonth(entries: WorkHourEntry[]): MonthlyWorkHours[] {
  const months = new Set(entries.map((e) => monthOf(e.date)))
  return [...months]
    .sort((a, b) => a.localeCompare(b))
    .map((month) => ({ month, ...summarizeWorkHours(entries.filter((e) => monthOf(e.date) === month)) }))
}
