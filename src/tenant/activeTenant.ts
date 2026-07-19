import { useSyncExternalStore } from 'react'

const STORAGE_KEY = 'ucet-firm-active-tenant-id'
const listeners = new Set<() => void>()

/** Non-React getter — pro backup.ts/exportExcel.ts, které nejsou komponenty ani hooky. */
export function getActiveTenantId(): number | null {
  const raw = localStorage.getItem(STORAGE_KEY)
  return raw ? Number(raw) : null
}

export function setActiveTenantId(id: number): void {
  localStorage.setItem(STORAGE_KEY, String(id))
  listeners.forEach((listener) => listener())
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

/** Reaktivní varianta pro komponenty a hooky — re-renderuje při přepnutí firmy. */
export function useActiveTenantId(): number | null {
  return useSyncExternalStore(subscribe, getActiveTenantId)
}
