export interface Payment {
  id?: number
  tenantId: number
  /** ISO yyyy-mm-dd */
  date: string
  personId: number
  amount: number
}
