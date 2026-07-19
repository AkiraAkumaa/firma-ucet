export interface WorkType {
  id?: number
  tenantId: number
  name: string
  /** kg, m2, m3, ks, bm... */
  unit: string
  /** Kč za jednotku pro OSVČ */
  priceOsvc: number
  /** Kč za jednotku pro zaměstnance (nižší, firma platí odvody) */
  priceZamestnanec: number
  /** Kč za jednotku, které firma účtuje zákazníkovi (pro výpočet ziskovosti). 0 = neúčtuje se po jednotkách (např. paušál za etapu). */
  priceCustomer: number
}
