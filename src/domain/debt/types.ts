export interface MonthlyDebtBucket {
  /** 'YYYY-MM' */
  month: string
  /** Nárokováno za práci (hodiny + výrobek) v tomto měsíci. */
  accrued: number
  /** Výdaje k proplacení vzniklé v tomto měsíci. */
  expenses: number
  /** accrued + expenses */
  owed: number
  /** Kolik z owed bylo uhrazeno (FIFO alokace plateb). */
  paid: number
  /** owed - paid */
  remaining: number
}

export interface PersonDebtSummary {
  /** Celkový nesplacený dluh (součet remaining přes všechny měsíce). */
  totalDebt: number
  /** Nejstarší měsíc s remaining > 0, nebo null pokud není žádný dluh. */
  oldestUnpaidMonth: string | null
  /** Zpoždění ve dnech od 1. dne měsíce následujícího po oldestUnpaidMonth. */
  delayDays: number
  /** Rozpis po měsících, chronologicky od nejstaršího. */
  months: MonthlyDebtBucket[]
}
