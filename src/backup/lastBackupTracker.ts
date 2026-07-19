import { useSyncExternalStore } from 'react'

function storageKey(tenantId: number): string {
  return `ucet-firm-last-backup-${tenantId}`
}

const listeners = new Set<() => void>()

/** ISO datetime posledního úspěšného exportu zálohy (JSON) této firmy, nebo null, pokud ještě žádná neproběhla. */
export function getLastBackupAt(tenantId: number): string | null {
  return localStorage.getItem(storageKey(tenantId))
}

export function recordBackupNow(tenantId: number): void {
  localStorage.setItem(storageKey(tenantId), new Date().toISOString())
  listeners.forEach((listener) => listener())
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

/** Reaktivní varianta pro Nastavení — re-renderuje hned po exportu zálohy. */
export function useLastBackupAt(tenantId: number | null): string | null {
  return useSyncExternalStore(subscribe, () => (tenantId == null ? null : getLastBackupAt(tenantId)))
}
