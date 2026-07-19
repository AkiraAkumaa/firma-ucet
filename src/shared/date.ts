/** Dnešní datum jako 'YYYY-MM-DD' v místním čase (ne UTC, aby nedošlo k posunu kolem půlnoci). */
export function todayIso(): string {
  const d = new Date()
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

/** ISO datum posunuté o n dní (může být záporné) — pro výpočet dne "před" nebo "po" daném datu. */
export function addDaysIso(date: string, days: number): string {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}
