import { Card } from './Card'
import { FormulaHint } from './FormulaHint'

export interface StatDelta {
  /** Kladné = zlepšení (obvykle zelená), pokud positiveIsGood není false. */
  percent: number
  positiveIsGood?: boolean
  /** Krátký popisek, čemu se porovnává — "vs minulý měsíc". */
  label: string
}

interface StatTileProps {
  label: string
  value: string
  size?: 'md' | 'hero'
  valueClassName?: string
  hint?: string
  /** Zobrazí velké číslo tabulkovým monospace fontem — pro period-scoped dashboardy (ať čísla vypadají jako přesný výkaz, ne jen text). */
  mono?: boolean
  delta?: StatDelta
}

export function StatTile({ label, value, size = 'md', valueClassName = '', hint, mono = false, delta }: StatTileProps) {
  const deltaIsGood = delta ? (delta.positiveIsGood === false ? delta.percent < 0 : delta.percent >= 0) : false

  return (
    <Card>
      <div className="text-sm text-gray-500">
        {label}
        {hint && <FormulaHint text={hint} />}
      </div>
      <p
        className={`mt-1 font-bold ${size === 'hero' ? 'text-4xl sm:text-5xl' : 'text-2xl'} ${mono ? 'font-mono tabular-nums' : ''} ${valueClassName}`}
      >
        {value}
      </p>
      {delta && (
        <p className={`mt-1 text-xs font-medium ${deltaIsGood ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
          {delta.percent >= 0 ? '▲' : '▼'} {Math.abs(Math.round(delta.percent))}% {delta.label}
        </p>
      )}
    </Card>
  )
}
