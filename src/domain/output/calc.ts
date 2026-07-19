import type { Person } from '../people/types'
import type { WorkType } from '../workTypes/types'
import type { OutputEntry } from './types'

export function outputEntryAmount(entry: OutputEntry): number {
  return entry.quantity * entry.unitPrice
}

export function defaultUnitPrice(workType: WorkType, personType: Person['type']): number {
  return personType === 'osvc' ? workType.priceOsvc : workType.priceZamestnanec
}
