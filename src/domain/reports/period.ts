export type PeriodType = 'month' | 'quarter' | 'year'
export type Quarter = 1 | 2 | 3 | 4

export interface PeriodRange {
  /** ISO yyyy-mm-dd, inclusive */
  start: string
  /** ISO yyyy-mm-dd, inclusive */
  end: string
}

function pad(n: number): string {
  return String(n).padStart(2, '0')
}

function toIso(year: number, month: number, day: number): string {
  return `${year}-${pad(month)}-${pad(day)}`
}

/** Poslední den daného 1-indexovaného měsíce (5 = květen). */
function lastDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate()
}

export function monthRange(year: number, month: number): PeriodRange {
  return { start: toIso(year, month, 1), end: toIso(year, month, lastDayOfMonth(year, month)) }
}

export function quarterRange(year: number, quarter: Quarter): PeriodRange {
  const startMonth = (quarter - 1) * 3 + 1
  const endMonth = startMonth + 2
  return { start: toIso(year, startMonth, 1), end: toIso(year, endMonth, lastDayOfMonth(year, endMonth)) }
}

export function yearRange(year: number): PeriodRange {
  return { start: toIso(year, 1, 1), end: toIso(year, 12, 31) }
}

export function periodRange(type: PeriodType, year: number, monthOrQuarter: number): PeriodRange {
  if (type === 'month') return monthRange(year, monthOrQuarter)
  if (type === 'quarter') return quarterRange(year, monthOrQuarter as Quarter)
  return yearRange(year)
}

/** Rok + jednotka (měsíc 1–12 / kvartál 1–4 / rok = vždy 1) — jedna hodnota reprezentující zvolené období pro PeriodSwitcher. */
export interface PeriodValue {
  type: PeriodType
  year: number
  value: number
}

/** Posune období o jeden krok vpřed/zpět ve stejné jednotce (měsíc → měsíc, kvartál → kvartál, rok → rok), s přechodem přes hranici roku. */
export function stepPeriod(period: PeriodValue, direction: 1 | -1): PeriodValue {
  if (period.type === 'year') return { ...period, year: period.year + direction }

  const max = period.type === 'quarter' ? 4 : 12
  let next = period.value + direction
  let year = period.year
  if (next < 1) {
    next = max
    year -= 1
  } else if (next > max) {
    next = 1
    year += 1
  }
  return { type: period.type, year, value: next }
}

/** Inkluzivní porovnání ISO dat (yyyy-mm-dd), řetězcové řazení funguje díky pevné šířce. */
export function inRange(date: string, start: string, end: string): boolean {
  return date >= start && date <= end
}
