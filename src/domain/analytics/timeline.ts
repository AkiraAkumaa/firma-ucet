import { daysBetween } from '../debt/dateUtils'
import { addDaysIso } from '../../shared/date'

export interface PausePeriod {
  /** ISO yyyy-mm-dd */
  from: string
  /** ISO yyyy-mm-dd */
  to: string
  days: number
}

export interface JobTimeline {
  startDate: string | null
  endDate: string | null
  /** Kalendářní dny od startu do konce, včetně obou — zahrnuje i pauzy. */
  totalCalendarDays: number
  /** Počet dní, kdy byl zaznamenán aspoň jeden WorkHourEntry. */
  workedDaysCount: number
  /** totalCalendarDays − workedDaysCount v rámci [startDate, endDate]. */
  pauseDaysCount: number
  pausePeriods: PausePeriod[]
}

const EMPTY_TIMELINE: JobTimeline = {
  startDate: null,
  endDate: null,
  totalCalendarDays: 0,
  workedDaysCount: 0,
  pauseDaysCount: 0,
  pausePeriods: [],
}

export interface JobTimelineOptions {
  /** Ruční datum začátku — přebíjí nejstarší zaznamenaný den, protože práce mohla začít dřív, než se první hodiny zapsaly. */
  startDateOverride?: string
  /** Ruční/skutečné datum konce — jinak poslední zaznamenaný den, nebo "dnes" (probíhá) pokud existuje start bez konce. */
  endDateOverride?: string
  /** ISO yyyy-mm-dd — "dnes" pro účely "práce stále probíhá". */
  today: string
}

/**
 * Časová osa jedné práce (kreslení/objektu) — kolik dní od startu do konce
 * uplynulo CELKEM (kalendářně, včetně pauz), kolik z nich se skutečně
 * pracovalo (podle WorkHourEntry dat) a kde přesně byly mezery (pauzy).
 */
export function calculateJobTimeline(workedDates: string[], options: JobTimelineOptions): JobTimeline {
  const sorted = [...new Set(workedDates)].sort()
  const startDate = options.startDateOverride ?? sorted[0] ?? null
  // Bez explicitního konce (viz DrawingRecord.actualRecordedDate) je práce považována
  // za stále probíhající — konec je "dnes", ne poslední odpracovaný den, protože
  // ticho od posledního záznamu do teď je taky pauza, kterou má timeline zachytit.
  const endDate = options.endDateOverride ?? (startDate ? options.today : null)

  if (startDate == null || endDate == null || startDate > endDate) return EMPTY_TIMELINE

  const totalCalendarDays = daysBetween(new Date(startDate), new Date(endDate)) + 1
  const workedInRange = new Set(sorted.filter((d) => d >= startDate && d <= endDate))

  const pausePeriods: PausePeriod[] = []
  let cursor = startDate
  let pauseStart: string | null = null
  while (cursor <= endDate) {
    if (!workedInRange.has(cursor)) {
      if (pauseStart == null) pauseStart = cursor
    } else if (pauseStart != null) {
      const to = addDaysIso(cursor, -1)
      pausePeriods.push({ from: pauseStart, to, days: daysBetween(new Date(pauseStart), new Date(to)) + 1 })
      pauseStart = null
    }
    cursor = addDaysIso(cursor, 1)
  }
  if (pauseStart != null) {
    pausePeriods.push({ from: pauseStart, to: endDate, days: daysBetween(new Date(pauseStart), new Date(endDate)) + 1 })
  }

  const pauseDaysCount = pausePeriods.reduce((sum, p) => sum + p.days, 0)

  return { startDate, endDate, totalCalendarDays, workedDaysCount: workedInRange.size, pauseDaysCount, pausePeriods }
}
