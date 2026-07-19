export type PersonType = 'osvc' | 'zamestnanec'

export interface Person {
  id?: number
  tenantId: number
  name: string
  brigadeId: number
  type: PersonType
  /** Kč za hodinu */
  hourlyRate: number
  /** Sociální/zdravotní pojištění, které firma platí měsíčně za tuto osobu — jen u zaměstnance (OSVČ si platí sám). Výchozí částka pro měsíce bez konkrétního záznamu v InsuranceOverride. */
  insuranceMonthly?: number
}

/** Skutečně zaplacené sociální/zdravotní pojištění za konkrétní měsíc — přebíjí Person.insuranceMonthly, protože částka se měsíc od měsíce může lišit. */
export interface InsuranceOverride {
  id?: number
  tenantId: number
  personId: number
  /** 'YYYY-MM' */
  month: string
  amount: number
}
