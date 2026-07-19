import type { Brigade } from '../brigades/types'
import type { Dictionary } from '../../i18n/translations'
import type { Person } from './types'

/** "Jméno · Parta · OSVČ/Zaměstnanec" — pro rozlišení lidí ve výběrech a seznamech. */
export function personLabel(person: Person, brigades: Brigade[], t: Dictionary): string {
  const brigadeName = brigades.find((b) => b.id === person.brigadeId)?.name ?? ''
  const typeLabel = person.type === 'osvc' ? t.personType.osvc : t.personType.zamestnanec
  return `${person.name} · ${brigadeName} · ${typeLabel}`
}
