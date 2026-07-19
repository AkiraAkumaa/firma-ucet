import type { HoursEntry } from './types'

export function hoursEntryAmount(entry: HoursEntry): number {
  return entry.hours * entry.hourlyRateSnapshot
}
