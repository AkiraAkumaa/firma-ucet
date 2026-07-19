import { useState } from 'react'
import { useT } from '../../i18n/I18nContext'
import { useSites } from '../../db/hooks'
import { Button } from '../../shared/ui/Button'
import { SelectField } from '../../shared/ui/SelectField'
import { TextField } from '../../shared/ui/TextField'
import { Card } from '../../shared/ui/Card'
import { ROUTES } from '../../app/routes'
import type { PeriodType } from '../../domain/reports/period'

function currentParts() {
  const now = new Date()
  return { year: now.getFullYear(), month: now.getMonth() + 1 }
}

export function ReportGenerator() {
  const t = useT()
  const sites = useSites()
  const { year: currentYear, month: currentMonth } = currentParts()

  const [periodType, setPeriodType] = useState<PeriodType>('month')
  const [year, setYear] = useState(currentYear)
  const [month, setMonth] = useState(currentMonth)
  const [quarter, setQuarter] = useState(Math.ceil(currentMonth / 3))
  const [siteId, setSiteId] = useState('')

  const periodTypes: { key: PeriodType; label: string }[] = [
    { key: 'month', label: t.company.reportPeriodMonth },
    { key: 'quarter', label: t.company.reportPeriodQuarter },
    { key: 'year', label: t.company.reportPeriodYear },
  ]

  const quarterOptions = [1, 2, 3, 4].map((q) => ({ value: String(q), label: `Q${q}` }))
  const siteOptions = [{ value: '', label: t.company.reportAllSites }, ...sites.map((s) => ({ value: String(s.id), label: s.name }))]

  const generate = () => {
    const value = periodType === 'month' ? month : periodType === 'quarter' ? quarter : 1
    const params = new URLSearchParams({ type: periodType, year: String(year), value: String(value) })
    if (siteId) params.set('siteId', siteId)
    window.open(`${ROUTES.printReport}?${params.toString()}`, '_blank')
  }

  return (
    <Card>
      <div className="flex gap-1">
        {periodTypes.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => setPeriodType(item.key)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
              periodType === item.key
                ? 'bg-brand-700 text-white dark:bg-brand-600'
                : 'border border-gray-300 text-gray-600 dark:border-gray-700 dark:text-gray-300'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {periodType === 'month' && (
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-gray-700 dark:text-gray-300">{t.company.reportPeriodMonth}</span>
            <input
              type="month"
              value={`${year}-${String(month).padStart(2, '0')}`}
              onChange={(e) => {
                const [y, m] = e.target.value.split('-').map(Number)
                if (y && m) {
                  setYear(y)
                  setMonth(m)
                }
              }}
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 dark:border-gray-700 dark:bg-gray-900"
            />
          </label>
        )}
        {periodType === 'quarter' && (
          <>
            <TextField
              label={t.company.reportYear}
              type="number"
              value={String(year)}
              onChange={(e) => setYear(Number(e.target.value))}
            />
            <SelectField
              label={t.company.reportPeriodQuarter}
              options={quarterOptions}
              value={String(quarter)}
              onChange={(e) => setQuarter(Number(e.target.value))}
            />
          </>
        )}
        {periodType === 'year' && (
          <TextField
            label={t.company.reportYear}
            type="number"
            value={String(year)}
            onChange={(e) => setYear(Number(e.target.value))}
          />
        )}
        <SelectField
          label={t.entry.site}
          options={siteOptions}
          value={siteId}
          onChange={(e) => setSiteId(e.target.value)}
        />
      </div>

      <div className="mt-4">
        <Button onClick={generate}>{t.company.reportGenerate}</Button>
      </div>
    </Card>
  )
}
