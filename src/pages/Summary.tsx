import { useMemo, useState } from 'react'
import { useT } from '../i18n/I18nContext'
import { useBrigades, useExpenses, useHoursEntries, useOutputEntries, usePayments, usePeople, useSalaryEntries } from '../db/hooks'
import { useAllPeopleDebts } from '../domain/debt/useDebt'
import { calculateSummaryRows } from '../domain/reports/summaryRows'
import { monthRange, quarterRange, yearRange, type PeriodRange, type Quarter } from '../domain/reports/period'
import { formatMoney } from '../shared/money'
import { Card } from '../shared/ui/Card'
import { Button } from '../shared/ui/Button'
import { SelectField } from '../shared/ui/SelectField'
import { TextField } from '../shared/ui/TextField'
import { ROUTES } from '../app/routes'
import { exportSummaryToExcel } from '../export/exportExcel'

type SummaryPeriod = 'all' | 'year' | 'quarter' | 'month'

function currentParts() {
  const now = new Date()
  return { year: now.getFullYear(), quarter: (Math.floor(now.getMonth() / 3) + 1) as Quarter, month: now.getMonth() + 1 }
}

export function Summary() {
  const t = useT()
  const people = usePeople()
  const brigades = useBrigades()
  const hoursEntries = useHoursEntries()
  const outputEntries = useOutputEntries()
  const salaryEntries = useSalaryEntries()
  const expenses = useExpenses()
  const payments = usePayments()
  const debts = useAllPeopleDebts()

  const { year: currentYear, quarter: currentQuarter, month: currentMonth } = currentParts()
  const [period, setPeriod] = useState<SummaryPeriod>('all')
  const [year, setYear] = useState(currentYear)
  const [quarter, setQuarter] = useState<Quarter>(currentQuarter)
  const [month, setMonth] = useState(currentMonth)

  const periodOptions: { key: SummaryPeriod; label: string }[] = [
    { key: 'all', label: t.summary.periodAll },
    { key: 'year', label: t.summary.periodYear },
    { key: 'quarter', label: t.summary.periodQuarter },
    { key: 'month', label: t.summary.periodMonth },
  ]
  const quarterOptions = [1, 2, 3, 4].map((q) => ({ value: String(q), label: `Q${q}` }))

  const range: PeriodRange | null =
    period === 'year' ? yearRange(year) : period === 'quarter' ? quarterRange(year, quarter) : period === 'month' ? monthRange(year, month) : null

  const rows = useMemo(
    () => calculateSummaryRows({ people, brigades, hoursEntries, outputEntries, salaryEntries, expenses, payments, debts, range }),
    [people, brigades, hoursEntries, outputEntries, salaryEntries, expenses, payments, debts, range],
  )

  const companyTotals = useMemo(() => {
    return rows.reduce(
      (sum, row) => ({
        accrued: sum.accrued + row.totals.accrued,
        expenses: sum.expenses + row.totals.expenses,
        paid: sum.paid + row.totals.paid,
        net: sum.net + row.totals.net,
        outstanding: sum.outstanding + row.outstanding,
      }),
      { accrued: 0, expenses: 0, paid: 0, net: 0, outstanding: 0 },
    )
  }, [rows])

  const printParams = () => {
    const params = new URLSearchParams({ period })
    if (period !== 'all') params.set('year', String(year))
    if (period === 'quarter') params.set('quarter', String(quarter))
    if (period === 'month') params.set('month', String(month))
    return params.toString()
  }

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <h1 className="text-2xl font-semibold">{t.summary.title}</h1>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => exportSummaryToExcel(range, t)}>
            {t.backup.exportExcel}
          </Button>
          <Button variant="secondary" onClick={() => window.open(`${ROUTES.printSummary}?${printParams()}`, '_blank')}>
            {t.backup.exportPdf}
          </Button>
        </div>
      </div>

      <div className="mt-4 flex gap-1">
        {periodOptions.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => setPeriod(item.key)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
              period === item.key
                ? 'bg-brand-700 text-white dark:bg-brand-600'
                : 'border border-gray-300 text-gray-600 dark:border-gray-700 dark:text-gray-300'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {period !== 'all' && (
        <div className="mt-3 grid grid-cols-2 gap-3 sm:w-96">
          {period === 'month' ? (
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium text-gray-700 dark:text-gray-300">{t.summary.month}</span>
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
          ) : (
            <TextField label={t.summary.year} type="number" value={String(year)} onChange={(e) => setYear(Number(e.target.value))} />
          )}
          {period === 'quarter' && (
            <SelectField
              label={t.summary.quarter}
              options={quarterOptions}
              value={String(quarter)}
              onChange={(e) => setQuarter(Number(e.target.value) as Quarter)}
            />
          )}
        </div>
      )}

      <Card className="mt-4 overflow-x-auto p-0">
        <table className="w-full min-w-[760px] text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-left text-gray-500 dark:border-gray-800">
              <th className="px-4 py-2 font-medium">{t.summary.person}</th>
              <th className="px-4 py-2 text-right font-medium">{t.people.detail.accrued}</th>
              <th className="px-4 py-2 text-right font-medium">{t.people.detail.expenses}</th>
              <th className="px-4 py-2 text-right font-medium">{t.people.detail.paid}</th>
              <th className="px-4 py-2 text-right font-medium">{period === 'all' ? t.summary.outstanding : t.summary.net}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {rows.length === 0 && (
              <tr>
                <td className="px-4 py-3 text-gray-500" colSpan={5}>
                  {t.summary.noData}
                </td>
              </tr>
            )}
            {rows.map((row) => (
              <tr key={row.personId}>
                <td className="px-4 py-2">
                  {row.name}
                  {row.brigadeName && <span className="text-gray-500"> · {row.brigadeName}</span>}
                </td>
                <td className="px-4 py-2 text-right tabular-nums">{formatMoney(row.totals.accrued)}</td>
                <td className="px-4 py-2 text-right tabular-nums">{formatMoney(row.totals.expenses)}</td>
                <td className="px-4 py-2 text-right tabular-nums">{formatMoney(row.totals.paid)}</td>
                <td className="px-4 py-2 text-right font-medium tabular-nums">
                  {formatMoney(period === 'all' ? row.outstanding : row.totals.net)}
                </td>
              </tr>
            ))}
          </tbody>
          {rows.length > 0 && (
            <tfoot>
              <tr className="border-t border-gray-200 font-medium dark:border-gray-800">
                <td className="px-4 py-2">{t.print.companyTotal}</td>
                <td className="px-4 py-2 text-right tabular-nums">{formatMoney(companyTotals.accrued)}</td>
                <td className="px-4 py-2 text-right tabular-nums">{formatMoney(companyTotals.expenses)}</td>
                <td className="px-4 py-2 text-right tabular-nums">{formatMoney(companyTotals.paid)}</td>
                <td className="px-4 py-2 text-right tabular-nums">
                  {formatMoney(period === 'all' ? companyTotals.outstanding : companyTotals.net)}
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </Card>
    </div>
  )
}
