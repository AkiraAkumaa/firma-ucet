import type { Attachment } from '../attachments/types'

export interface Expense {
  id?: number
  tenantId: number
  /** ISO yyyy-mm-dd */
  date: string
  /**
   * Osoba, která zaplatila ze svého — vzniká jí tím dluh vůči firmě. Nepovinné:
   * chybí, pokud výdaj zaplatila přímo firma (paidByCompany) — pak nevzniká
   * žádný dluh vůči nikomu, jen se výdaj odečte ze zisku.
   */
  paidByPersonId?: number
  /** True, pokud výdaj zaplatila přímo firma, ne osoba ze svého. */
  paidByCompany?: boolean
  /** Brigáda dosazená automaticky z osoby v okamžiku vytvoření záznamu — chybí u paidByCompany. */
  brigadeIdSnapshot?: number
  categoryId: number
  amount: number
  /** Číslo účtenky apod. */
  note?: string
  /** Nepovinné — pokud je výdaj spojený s konkrétní stavbou, počítá se do její ziskovosti. */
  siteId?: number
  /** Vyfocená/naskenovaná faktura. */
  attachment?: Attachment
}
