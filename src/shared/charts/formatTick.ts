const compactFormatter = new Intl.NumberFormat('cs-CZ', { notation: 'compact', maximumFractionDigits: 1 })

export function formatCompactNumber(value: number): string {
  return compactFormatter.format(value)
}
