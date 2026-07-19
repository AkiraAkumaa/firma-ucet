import type { Attachment } from '../attachments/types'

export interface SiteCustomerPayment {
  id?: number
  tenantId: number
  siteId: number
  /** ISO yyyy-mm-dd */
  date: string
  amount: number
  /** Etapa, za kterou zákazník platí */
  stage: string
}

export interface SiteMaterialCost {
  id?: number
  tenantId: number
  siteId: number
  /** ISO yyyy-mm-dd */
  date: string
  amount: number
  note?: string
  /** Vyfocená/naskenovaná faktura. */
  attachment?: Attachment
}

/**
 * Plánované množství daného druhu práce na stavbě — obvykle známé už při
 * domluvě zakázky (např. 20 000 kg vázání armatury). Cena je vždy aktuální
 * WorkType.priceCustomer, tady se neduplikuje.
 */
export interface SiteWorkPlan {
  id?: number
  tenantId: number
  siteId: number
  workTypeId: number
  plannedQuantity: number
  /** Cena pro zákazníka jen pro tuto stavbu — přebíjí WorkType.priceCustomer, protože cena se stavbu od stavby může lišit. */
  customerPriceOverride?: number
}

/**
 * Datovaný záznam skutečně hotového množství — zadává majitel ručně podle
 * toho, co mu nahlásí parta, za konkrétní den/období. Záměrně NEpočítáno
 * automaticky z Output entries (Výrobek): ty slouží k výplatě mezd a nemusí
 * být vždy vyplněné do detailu v okamžiku, kdy majitel potřebuje vědět postup
 * práce. Součet těchto záznamů = celkové "Provedeno" pro daný druh práce.
 */
export interface SiteWorkProgressEntry {
  id?: number
  tenantId: number
  siteId: number
  workTypeId: number
  /** ISO yyyy-mm-dd */
  date: string
  quantity: number
  note?: string
  /** Doklad k nahlášenému postupu (např. akceptační protokol/faktura za období). */
  attachment?: Attachment
}
