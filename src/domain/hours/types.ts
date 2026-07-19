import type { Attachment } from '../attachments/types'

export interface HoursEntry {
  id?: number
  tenantId: number
  /** ISO yyyy-mm-dd */
  date: string
  personId: number
  siteId: number
  hours: number
  /**
   * Sazba osoby zaznamenaná v okamžiku vytvoření záznamu.
   * Pozdější změna sazby osoby nesmí přepočítat historické záznamy.
   */
  hourlyRateSnapshot: number
  /** Faktura za odvedenou práci — u hromadného zadání sdílená pro celou dávku. */
  attachment?: Attachment
}
