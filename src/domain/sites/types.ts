export type SiteStatus = 'active' | 'completed'

export interface Site {
  id?: number
  tenantId: number
  name: string
  address: string
  status: SiteStatus
}
