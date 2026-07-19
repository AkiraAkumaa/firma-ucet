import { db } from '../db/db'
import { getActiveTenantId, setActiveTenantId } from './activeTenant'

/**
 * Zajistí, že existuje aspoň jedna firma a že je jedna aktivní — volá se jednou
 * při startu aplikace. Pro upgrade z verze bez tenantů se výchozí firma vytvoří
 * v Dexie migraci (viz db.ts); tohle pokrývá čerstvou instalaci bez jakýchkoli dat.
 */
export async function ensureActiveTenant(): Promise<void> {
  const tenants = await db.tenants.toArray()

  if (tenants.length === 0) {
    const id = await db.tenants.add({ name: 'Моя компанія' })
    setActiveTenantId(id as number)
    return
  }

  const activeId = getActiveTenantId()
  if (activeId != null && tenants.some((tenant) => tenant.id === activeId)) return

  setActiveTenantId(tenants[0].id!)
}
