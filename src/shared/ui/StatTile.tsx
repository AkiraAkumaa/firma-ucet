import { Card } from './Card'
import { FormulaHint } from './FormulaHint'

interface StatTileProps {
  label: string
  value: string
  size?: 'md' | 'hero'
  valueClassName?: string
  hint?: string
}

export function StatTile({ label, value, size = 'md', valueClassName = '', hint }: StatTileProps) {
  return (
    <Card>
      <div className="text-sm text-gray-500">
        {label}
        {hint && <FormulaHint text={hint} />}
      </div>
      <p className={`mt-1 font-bold ${size === 'hero' ? 'text-4xl sm:text-5xl' : 'text-2xl'} ${valueClassName}`}>{value}</p>
    </Card>
  )
}
