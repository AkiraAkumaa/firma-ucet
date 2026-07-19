import type { Attachment } from '../attachments/types'

export interface OutputEntry {
  id?: number
  tenantId: number
  /** ISO yyyy-mm-dd */
  date: string
  personId: number
  siteId: number
  workTypeId: number
  quantity: number
  /**
   * Cena za jednotku platná pro tento záznam. Výchozí se dosadí podle typu
   * osoby (OSVČ / zaměstnanec) z WorkType, ale lze ji ručně přebít.
   */
  unitPrice: number
  /** True, pokud byla unitPrice ručně změněna oproti výchozí ceně z WorkType. */
  priceOverridden: boolean
  /** Faktura OSVČ za odvedenou práci. */
  attachment?: Attachment
}
