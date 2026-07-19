import { useMemo } from 'react'
import { useLanguage, useT } from '../../i18n/I18nContext'
import { intlLocale } from '../../i18n/translations'
import { stepPeriod, type PeriodValue } from '../../domain/reports/period'
import type { PeriodType } from '../../domain/reports/period'

interface PeriodSwitcherProps {
  value: PeriodValue
  onChange: (next: PeriodValue) => void
  className?: string
}

/** Přepínač měsíc/kvartál/rok + šipky vpřed/zpět — jednotný vzor pro period-scoped dashboardy (osoba/parta/stavba/firma). */
export function PeriodSwitcher({ value, onChange, className = '' }: PeriodSwitcherProps) {
  const t = useT()
  const [language] = useLanguage()

  const typeOptions: { type: PeriodType; label: string }[] = [
    { type: 'month', label: t.summary.periodMonth },
    { type: 'quarter', label: t.summary.periodQuarter },
    { type: 'year', label: t.summary.periodYear },
  ]

  const switchType = (type: PeriodType) => {
    if (type === value.type) return
    if (type === 'month') onChange({ type, year: value.year, value: 1 })
    else if (type === 'quarter') onChange({ type, year: value.year, value: Math.floor((value.value - 1) / 3) + 1 || 1 })
    else onChange({ type, year: value.year, value: 1 })
  }

  const label = useMemo(() => {
    if (value.type === 'month') {
      return new Intl.DateTimeFormat(intlLocale[language], { year: 'numeric', month: 'long' }).format(
        new Date(value.year, value.value - 1, 1),
      )
    }
    if (value.type === 'quarter') return t.print.quarterLabel(value.value, value.year)
    return String(value.year)
  }, [value, language, t])

  return (
    <div className={`flex flex-wrap items-center justify-between gap-3 ${className}`}>
      <div className="flex gap-1">
        {typeOptions.map((item) => (
          <button
            key={item.type}
            type="button"
            onClick={() => switchType(item.type)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
              value.type === item.type
                ? 'bg-brand-700 text-white dark:bg-brand-600'
                : 'border border-gray-300 text-gray-600 dark:border-gray-700 dark:text-gray-300'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onChange(stepPeriod(value, -1))}
          aria-label="Previous"
          className="rounded-lg border border-gray-300 px-2.5 py-1.5 text-sm text-gray-600 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
        >
          ‹
        </button>
        <span className="min-w-[9rem] text-center text-sm font-semibold tabular-nums">{label}</span>
        <button
          type="button"
          onClick={() => onChange(stepPeriod(value, 1))}
          aria-label="Next"
          className="rounded-lg border border-gray-300 px-2.5 py-1.5 text-sm text-gray-600 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
        >
          ›
        </button>
      </div>
    </div>
  )
}
