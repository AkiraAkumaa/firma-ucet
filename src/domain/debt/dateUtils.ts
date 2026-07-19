/** Vrátí měsíc data ve formátu 'YYYY-MM'. Vstupní datum je ISO 'YYYY-MM-DD'. */
export function monthOf(date: string): string {
  return date.slice(0, 7)
}

/** První den měsíce následujícího po zadaném 'YYYY-MM'. */
export function startOfNextMonth(month: string): Date {
  const [year, monthNum] = month.split('-').map(Number)
  // monthNum je 1-indexovaný (5 = květen), takže new Date(year, monthNum, 1)
  // dá 1. den měsíce následujícího po květnu, tj. 1. června.
  return new Date(year, monthNum, 1)
}

/** Půlnoc daného data v místním čase — pro konzistentní počítání dní. */
export function atMidnight(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

/** Počet celých dní mezi dvěma daty (to - from), nikdy záporný. */
export function daysBetween(from: Date, to: Date): number {
  const msPerDay = 1000 * 60 * 60 * 24
  const diff = Math.floor((atMidnight(to).getTime() - atMidnight(from).getTime()) / msPerDay)
  return Math.max(0, diff)
}
