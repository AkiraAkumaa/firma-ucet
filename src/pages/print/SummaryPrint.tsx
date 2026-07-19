import { useEffect, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useT } from '../../i18n/I18nContext'
import { useBrigades, useExpenses, useHoursEntries, useOutputEntries, usePayments, usePeople, useSalaryEntries } from '../../db/hooks'
import { useAllPeopleDebts } from '../../domain/debt/useDebt'
import { calculateSummaryRows } from '../../domain/reports/summaryRows'
import { monthRange, quarterRange, yearRange, type PeriodRange, type Quarter } from '../../domain/reports/period'
import { formatMoney } from '../../shared/money'
import { todayIso } from '../../shared/date'

export function SummaryPrint() {
  const t = useT()
  const [searchParams] = useSearchParams()

  const period = (searchParams.get('period') as 'all' | 'year' | 'quarter' | 'month') || 'all'
  const year = Number(searchParams.get('year')) || new Date().getFullYear()
  const quarter = (Number(searchParams.get('quarter')) || 1) as Quarter
  const month = Number(searchParams.get('month')) || 1

  const people = usePeople()
  const brigades = useBrigades()
  const hoursEntries = useHoursEntries()
  const outputEntries = useOutputEntries()
  const salaryEntries = useSalaryEntries()
  const expenses = useExpenses()
  const payments = usePayments()
  const debts = useAllPeopleDebts()

  const range: PeriodRange | null =
    period === 'year' ? yearRange(year) : period === 'quarter' ? quarterRange(year, quarter) : period === 'month' ? monthRange(year, month) : null

  const periodLabel =
    period === 'year' ? String(year) : period === 'quarter' ? t.print.quarterLabel(quarter, year) : period === 'month' ? `${month}/${year}` : t.summary.periodAll

  const rows = useMemo(
    () => calculateSummaryRows({ people, brigades, hoursEntries, outputEntries, salaryEntries, expenses, payments, debts, range }),
    [people, brigades, hoursEntries, outputEntries, salaryEntries, expenses, payments, debts, range],
  )

  const companyTotals = useMemo(
    () =>
      rows.reduce(
        (sum, row) => ({
          accrued: sum.accrued + row.totals.accrued,
          expenses: sum.expenses + row.totals.expenses,
          paid: sum.paid + row.totals.paid,
          net: sum.net + row.totals.net,
          outstanding: sum.outstanding + row.outstanding,
        }),
        { accrued: 0, expenses: 0, paid: 0, net: 0, outstanding: 0 },
      ),
    [rows],
  )

  useEffect(() => {
    const timeout = setTimeout(() => window.print(), 300)
    return () => clearTimeout(timeout)
  }, [])

  return (
    <div className="mx-auto max-w-4xl bg-white p-8 text-gray-900">
      <h1 className="text-2xl font-bold">{t.common.appName}</h1>
      <p className="text-sm text-gray-500">
        {t.summary.title} · {periodLabel} · {t.print.generatedOn} {todayIso()}
      </p>

      <table className="mt-6 w-full border-collapse text-sm">
        <thead>
          <tr className="border-b-2 border-gray-300 text-left">
            <th className="py-2 pr-2">{t.summary.person}</th>
            <th className="py-2 pr-2 text-right">{t.people.detail.accrued}</th>
            <th className="py-2 pr-2 text-right">{t.people.detail.expenses}</th>
            <th className="py-2 pr-2 text-right">{t.people.detail.paid}</th>
            <th className="py-2 text-right">{period === 'all' ? t.summary.outstanding : t.summary.net}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.personId} className="border-b border-gray-200">
              <td className="py-1.5 pr-2">
                {row.name}
                {row.brigadeName && <span className="text-gray-500"> · {row.brigadeName}</span>}
              </td>
              <td className="py-1.5 pr-2 text-right tabular-nums">{formatMoney(row.totals.accrued)}</td>
              <td className="py-1.5 pr-2 text-right tabular-nums">{formatMoney(row.totals.expenses)}</td>
              <td className="py-1.5 pr-2 text-right tabular-nums">{formatMoney(row.totals.paid)}</td>
              <td className="py-1.5 text-right font-medium tabular-nums">
                {formatMoney(period === 'all' ? row.outstanding : row.totals.net)}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t-2 border-gray-300 font-medium">
            <td className="py-2">{t.print.companyTotal}</td>
            <td className="py-2 pr-2 text-right tabular-nums">{formatMoney(companyTotals.accrued)}</td>
            <td className="py-2 pr-2 text-right tabular-nums">{formatMoney(companyTotals.expenses)}</td>
            <td className="py-2 pr-2 text-right tabular-nums">{formatMoney(companyTotals.paid)}</td>
            <td className="py-2 text-right tabular-nums">
              {formatMoney(period === 'all' ? companyTotals.outstanding : companyTotals.net)}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  )
}
