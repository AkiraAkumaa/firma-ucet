const formatter = new Intl.NumberFormat('cs-CZ', { maximumFractionDigits: 0 })

/** Kč se standardní tisícovou mezerou, nezávisle na jazyce rozhraní. */
export function formatMoney(amount: number): string {
  return `${formatter.format(Math.round(amount))} Kč`
}
