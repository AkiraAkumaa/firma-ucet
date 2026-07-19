import { useEffect, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { useT } from '../../i18n/I18nContext'
import { useBrigades, useExpenses, useHoursEntries, useOutputEntries, usePeople, useWorkHourEntries } from '../../db/hooks'
import { calculateBrigadeMonthlyBreakdown } from '../../domain/brigades/calculateBrigadeSummary'
import { hoursEntryAmount } from '../../domain/hours/calc'
import { outputEntryAmount } from '../../domain/output/calc'
import { groupWorkHoursByMonth, summarizeWorkHours } from '../../domain/analytics/summary'
import { formatMoney } from '../../shared/money'
import { todayIso } from '../../shared/date'

export function BrigadePrint() {
  const t = useT()
  const { id } = useParams()
  const brigadeId = Number(id)

  const brigades = useBrigades()
  const people = usePeople()
  const hoursEntries = useHoursEntries()
  const outputEntries = useOutputEntries()
  const expenses = useExpenses()
  const workHourEntries = useWorkHourEntries()

  const brigade = brigades.find((b) => b.id === brigadeId)
  const members = useMemo(() => people.filter((p) => p.brigadeId === brigadeId), [people, brigadeId])
  const memberIds = useMemo(() => new Set(members.map((p) => p.id)), [members])

  const brigadeHours = useMemo(() => hoursEntries.filter((e) => memberIds.has(e.personId)), [hoursEntries, memberIds])
  const brigadeOutput = useMemo(() => outputEntries.filter((e) => memberIds.has(e.personId)), [outputEntries, memberIds])
  const brigadeExpenses = useMemo(() => expenses.filter((e) => e.brigadeIdSnapshot === brigadeId), [expenses, brigadeId])

  const labor =
    brigadeHours.reduce((sum, e) => sum + hoursEntryAmount(e), 0) + brigadeOutput.reduce((sum, e) => sum + outputEntryAmount(e), 0)
  const expensesTotal = brigadeExpenses.reduce((sum, e) => sum + e.amount, 0)

  const monthly = useMemo(
    () => calculateBrigadeMonthlyBreakdown({ hoursEntries: brigadeHours, outputEntries: brigadeOutput, expenses: brigadeExpenses }),
    [brigadeHours, brigadeOutput, brigadeExpenses],
  )

  const brigadeWorkHours = useMemo(() => workHourEntries.filter((e) => memberIds.has(e.personId)), [workHourEntries, memberIds])
  const workHoursTotals = useMemo(() => summarizeWorkHours(brigadeWorkHours), [brigadeWorkHours])
  const workHoursByMonth = useMemo(() => groupWorkHoursByMonth(brigadeWorkHours), [brigadeWorkHours])

  useEffect(() => {
    const timeout = setTimeout(() => window.print(), 300)
    return () => clearTimeout(timeout)
  }, [])

  if (!brigade) return null

  return (
    <div className="mx-auto max-w-3xl bg-white p-8 text-gray-900">
      <h1 className="text-2xl font-bold">{t.common.appName}</h1>
      <p className="text-sm text-gray-500">
        {t.print.generatedOn} {todayIso()}
      </p>

      <h2 className="mt-6 text-xl font-semibold">{brigade.name}</h2>
      <p className="text-sm text-gray-500">
        {t.brigades.people}: {members.length}
      </p>

      <dl className="mt-4 grid grid-cols-3 gap-3 text-sm">
        <div>
          <dt className="text-gray-500">{t.brigades.labor}</dt>
          <dd className="text-xl font-bold tabular-nums">{formatMoney(labor)}</dd>
        </div>
        <div>
          <dt className="text-gray-500">{t.brigades.expenses}</dt>
          <dd className="text-xl font-bold tabular-nums">{formatMoney(expensesTotal)}</dd>
        </div>
        <div>
          <dt className="text-gray-500">{t.brigades.total}</dt>
          <dd className="text-xl font-bold tabular-nums">{formatMoney(labor + expensesTotal)}</dd>
        </div>
      </dl>

      <h3 className="mt-6 text-base font-semibold">{t.brigades.monthlyBreakdown}</h3>
      <table className="mt-2 w-full border-collapse text-sm">
        <thead>
          <tr className="border-b-2 border-gray-300 text-left">
            <th className="py-2 pr-2">{t.people.detail.month}</th>
            <th className="py-2 pr-2 text-right">{t.brigades.labor}</th>
            <th className="py-2 pr-2 text-right">{t.brigades.expenses}</th>
            <th className="py-2 text-right">{t.brigades.total}</th>
          </tr>
        </thead>
        <tbody>
          {monthly.length === 0 && (
            <tr>
              <td className="py-2 text-gray-500" colSpan={4}>
                {t.common.noData}
              </td>
            </tr>
          )}
          {monthly.map((m) => (
            <tr key={m.month} className="border-b border-gray-200">
              <td className="py-1.5 pr-2">{m.month}</td>
              <td className="py-1.5 pr-2 text-right tabular-nums">{formatMoney(m.labor)}</td>
              <td className="py-1.5 pr-2 text-right tabular-nums">{formatMoney(m.expenses)}</td>
              <td className="py-1.5 text-right font-medium tabular-nums">{formatMoney(m.total)}</td>
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

      <h3 className="mt-6 text-base font-semibold">{t.brigades.members}</h3>
      <ul className="mt-2 text-sm text-gray-700">
        {members.map((person) => (
          <li key={person.id}>{person.name}</li>
        ))}
      </ul>
    </div>
  )
}
