import { useEffect, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { useT } from '../../i18n/I18nContext'
import { useBrigades, usePeople, useWorkHourEntries } from '../../db/hooks'
import { usePersonDebt } from '../../domain/debt/useDebt'
import { groupWorkHoursByMonth, summarizeWorkHours } from '../../domain/analytics/summary'
import { formatMoney } from '../../shared/money'
import { todayIso } from '../../shared/date'

export function PersonPrint() {
  const t = useT()
  const { id } = useParams()
  const personId = Number(id)

  const people = usePeople()
  const brigades = useBrigades()
  const workHourEntries = useWorkHourEntries()
  const person = people.find((p) => p.id === personId)
  const debt = usePersonDebt(personId)

  const personWorkHours = useMemo(() => workHourEntries.filter((e) => e.personId === personId), [workHourEntries, personId])
  const workHoursTotals = useMemo(() => summarizeWorkHours(personWorkHours), [personWorkHours])
  const workHoursByMonth = useMemo(() => groupWorkHoursByMonth(personWorkHours), [personWorkHours])

  useEffect(() => {
    const timeout = setTimeout(() => window.print(), 300)
    return () => clearTimeout(timeout)
  }, [])

  if (!person) return null
  const brigadeName = brigades.find((b) => b.id === person.brigadeId)?.name ?? ''

  return (
    <div className="mx-auto max-w-3xl bg-white p-8 text-gray-900">
      <h1 className="text-2xl font-bold">{t.common.appName}</h1>
      <p className="text-sm text-gray-500">
        {t.print.generatedOn} {todayIso()}
      </p>

      <h2 className="mt-6 text-xl font-semibold">{person.name}</h2>
      <p className="text-sm text-gray-500">
        {brigadeName} · {person.type === 'osvc' ? t.personType.osvc : t.personType.zamestnanec}
      </p>

      <div className="mt-4">
        <p className="text-sm text-gray-500">{t.people.detail.totalDebt}</p>
        <p className="mt-1 text-4xl font-bold">{formatMoney(debt.totalDebt)}</p>
        {debt.oldestUnpaidMonth && (
          <p className="mt-1 text-sm text-gray-500">
            {t.people.detail.oldestUnpaidMonth}: {debt.oldestUnpaidMonth} · {t.people.detail.delay}:{' '}
            {t.overview.delayDays(debt.delayDays)}
          </p>
        )}
      </div>

      <h3 className="mt-6 text-base font-semibold">{t.people.detail.monthlyBreakdown}</h3>
      <table className="mt-2 w-full border-collapse text-sm">
        <thead>
          <tr className="border-b-2 border-gray-300 text-left">
            <th className="py-2 pr-2">{t.people.detail.month}</th>
            <th className="py-2 pr-2 text-right">{t.people.detail.accrued}</th>
            <th className="py-2 pr-2 text-right">{t.people.detail.expenses}</th>
            <th className="py-2 pr-2 text-right">{t.people.detail.paid}</th>
            <th className="py-2 text-right">{t.people.detail.remaining}</th>
          </tr>
        </thead>
        <tbody>
          {debt.months.length === 0 && (
            <tr>
              <td className="py-2 text-gray-500" colSpan={5}>
                {t.common.noData}
              </td>
            </tr>
          )}
          {debt.months.map((month) => (
            <tr key={month.month} className="border-b border-gray-200">
              <td className="py-1.5 pr-2">{month.month}</td>
              <td className="py-1.5 pr-2 text-right tabular-nums">{formatMoney(month.accrued)}</td>
              <td className="py-1.5 pr-2 text-right tabular-nums">{formatMoney(month.expenses)}</td>
              <td className="py-1.5 pr-2 text-right tabular-nums">{formatMoney(month.paid)}</td>
              <td className="py-1.5 text-right font-medium tabular-nums">{formatMoney(month.remaining)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {workHoursTotals.total > 0 && (
        <>
          <h3 className="mt-6 text-base font-semibold">{t.analytics.personHours}</h3>
          <dl className="mt-2 grid grid-cols-3 gap-3 text-sm">
            <div>
              <dt className="text-gray-500">{t.analytics.categoryArmovani}</dt>
              <dd className="font-medium tabular-nums">{workHoursTotals.armovani}</dd>
            </div>
            <div>
              <dt className="text-gray-500">{t.analytics.categoryMonolit}</dt>
              <dd className="font-medium tabular-nums">{workHoursTotals.monolit}</dd>
            </div>
            <div>
              <dt className="text-gray-500">{t.common.total}</dt>
              <dd className="font-medium tabular-nums">{workHoursTotals.total}</dd>
            </div>
          </dl>
          {workHoursByMonth.length > 0 && (
            <table className="mt-3 w-full border-collapse text-sm">
              <thead>
                <tr className="border-b-2 border-gray-300 text-left">
                  <th className="py-2 pr-2">{t.people.detail.month}</th>
                  <th className="py-2 pr-2 text-right">{t.analytics.categoryArmovani}</th>
                  <th className="py-2 pr-2 text-right">{t.analytics.categoryMonolit}</th>
                  <th className="py-2 text-right">{t.common.total}</th>
                </tr>
              </thead>
              <tbody>
                {workHoursByMonth.map((row) => (
                  <tr key={row.month} className="border-b border-gray-200">
                    <td className="py-1.5 pr-2">{row.month}</td>
                    <td className="py-1.5 pr-2 text-right tabular-nums">{row.armovani}</td>
                    <td className="py-1.5 pr-2 text-right tabular-nums">{row.monolit}</td>
                    <td className="py-1.5 text-right font-medium tabular-nums">{row.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </>
      )}
    </div>
  )
}
