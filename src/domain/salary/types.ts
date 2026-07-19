import type { Attachment } from '../attachments/types'

/**
 * Ručně zadaná nárokovaná částka pro osobu — pro případy, kdy je odměna už
 * spočítaná mimo aplikaci (dohodou, mimo hodiny/výrobek) a majitel jen
 * zapisuje výslednou částku. Počítá se do "nárokováno" stejně jako hodiny
 * a výrobek (FIFO dluh, ziskovost stavby).
 */
export interface SalaryEntry {
  id?: number
  tenantId: number
  /** ISO yyyy-mm-dd */
  date: string
  personId: number
  /** Nepovinné — pokud je částka spojená s konkrétní stavbou, počítá se do její ziskovosti. */
  siteId?: number
  amount: number
  note?: string
  attachment?: Attachment
}
