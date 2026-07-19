import { useState } from 'react'
import { useT } from '../../i18n/I18nContext'

interface DateOrMonthFieldProps {
  label: string
  /** ISO yyyy-mm-dd */
  value: string
  onChange: (value: string) => void
  className?: string
}

/** Přepínač mezi přesným datem a jen měsícem — ukládá se vždy plné ISO datum (1. den měsíce, když je zadaný jen měsíc), ať navazující výpočty nemusí rozlišovat dva formáty. */
export function DateOrMonthField({ label, value, onChange, className = '' }: DateOrMonthFieldProps) {
  const t = useT()
  const [mode, setMode] = useState<'day' | 'month'>('day')

  return (
    <div className={`flex flex-col gap-1 text-sm ${className}`}>
      <div className="flex items-center justify-between gap-2">
        <span className="font-medium text-gray-700 dark:text-gray-300">{label}</span>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => setMode('day')}
            className={`rounded px-1.5 py-0.5 text-xs font-medium ${
              mode === 'day' ? 'bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900' : 'text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            }`}
          >
            {t.common.exactDate}
          </button>
          <button
            type="button"
            onClick={() => setMode('month')}
            className={`rounded px-1.5 py-0.5 text-xs font-medium ${
              mode === 'month' ? 'bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900' : 'text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            }`}
          >
            {t.common.monthOnly}
          </button>
        </div>
      </div>
      {mode === 'day' ? (
        <input
          type="date"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-gray-900"
        />
      ) : (
        <input
          type="month"
          value={value.slice(0, 7)}
          onChange={(e) => onChange(e.target.value ? `${e.target.value}-01` : '')}
          className="rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-gray-900"
        />
      )}
    </div>
  )
}
