import { Fragment, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useT } from '../i18n/I18nContext'
import {
  useBrigades,
  useDrawingRecords,
  useHoursEntries,
  useOutputEntries,
  usePeople,
  useSites,
  useWorkHourEntries,
  useWorkTypes,
} from '../db/hooks'
import { hoursEntryAmount } from '../domain/hours/calc'
import { outputEntryAmount } from '../domain/output/calc'
import { useSiteMonthlyBreakdown, useSitePlan, useSiteProfitability } from '../domain/profitability/useProfitability'
import { calculateJobTimeline } from '../domain/analytics/timeline'
import { inRange, periodRange, stepPeriod, type PeriodValue } from '../domain/reports/period'
import { monthOf } from '../domain/debt/dateUtils'
import { formatMoney } from '../shared/money'
import { todayIso } from '../shared/date'
import { Card } from '../shared/ui/Card'
import { Button } from '../shared/ui/Button'
import { StatTile, type StatDelta } from '../shared/ui/StatTile'
import { PeriodSwitcher } from '../shared/ui/PeriodSwitcher'
import { ROUTES } from '../app/routes'
import { exportSiteToExcel, exportSiteMonthToExcel } from '../export/exportExcel'

function currentMonthValue(): PeriodValue {
  const now = new Date()
  return { type: 'month', year: now.getFullYear(), value: now.getMonth() + 1 }
}

function delta(current: number, previous: number, label: string): StatDelta | undefined {
  if (previous === 0) return undefined
  return { percent: ((current - previous) / Math.abs(previous)) * 100, label }
}

export function SiteDetail() {
  const t = useT()
  const { id } = useParams()
  const siteId = Number(id)

  const sites = useSites()
  const people = usePeople()
  const brigades = useBrigades()
  const workTypes = useWorkTypes()
  const hoursEntries = useHoursEntries()
  const outputEntries = useOutputEntries()
  const workHourEntries = useWorkHourEntries()
  const drawingRecords = useDrawingRecords()

  const site = sites.find((s) => s.id === siteId)
  const profitability = useSiteProfitability(siteId)
  const hasProfitabilityData = profitability.revenue > 0 || profitability.materialCost > 0
  const plan = useSitePlan(siteId).filter((row) => row.plannedQuantity > 0)
  const monthly = useSiteMonthlyBreakdown(siteId)

  const { total, byBrigade, byWorkType } = useMemo(() => {
    const hoursForSite = hoursEntries.filter((e) => e.siteId === siteId)
    const outputForSite = outputEntries.filter((e) => e.siteId === siteId)

    const byBrigadeMap = new Map<number, number>()
    for (const e of hoursForSite) {
      const brigadeId = people.find((p) => p.id === e.personId)?.brigadeId
      if (brigadeId == null) continue
      byBrigadeMap.set(brigadeId, (byBrigadeMap.get(brigadeId) ?? 0) + hoursEntryAmount(e))
    }
    for (const e of outputForSite) {
      const brigadeId = people.find((p) => p.id === e.personId)?.brigadeId
      if (brigadeId == null) continue
      byBrigadeMap.set(brigadeId, (byBrigadeMap.get(brigadeId) ?? 0) + outputEntryAmount(e))
    }

    const byWorkTypeMap = new Map<number, number>()
    for (const e of outputForSite) {
      byWorkTypeMap.set(e.workTypeId, (byWorkTypeMap.get(e.workTypeId) ?? 0) + outputEntryAmount(e))
    }

    const laborTotal =
      hoursForSite.reduce((sum, e) => sum + hoursEntryAmount(e), 0) +
      outputForSite.reduce((sum, e) => sum + outputEntryAmount(e), 0)

    return {
      total: laborTotal,
      byBrigade: [...byBrigadeMap.entries()].sort(([, a], [, b]) => b - a),
      byWorkType: [...byWorkTypeMap.entries()].sort(([, a], [, b]) => b - a),
    }
  }, [hoursEntries, outputEntries, siteId, people])

  const siteWorkHours = useMemo(() => workHourEntries.filter((e) => e.siteId === siteId), [workHourEntries, siteId])
  const hoursByCategory = useMemo(() => {
    const armovani = siteWorkHours.filter((e) => e.workCategory === 'armovani').reduce((sum, e) => sum + e.hours, 0)
    const monolit = siteWorkHours.filter((e) => e.workCategory === 'monolit').reduce((sum, e) => sum + e.hours, 0)
    return { armovani, monolit, total: armovani + monolit }
  }, [siteWorkHours])

  const siteDrawings = useMemo(() => {
    const today = todayIso()
    return drawingRecords
      .filter((d) => d.siteId === siteId)
      .map((d) => {
        const workedDates = workHourEntries.filter((e) => e.drawingRecordId === d.id).map((e) => e.date)
        const timeline = calculateJobTimeline(workedDates, { startDateOverride: d.startDate, endDateOverride: d.actualRecordedDate, today })
        return { drawing: d, timeline }
      })
  }, [drawingRecords, workHourEntries, siteId])

  const [period, setPeriod] = useState<PeriodValue>(currentMonthValue())
  const range = periodRange(period.type, period.year, period.value)
  const previousPeriod = stepPeriod(period, -1)
  const previousRange = periodRange(previousPeriod.type, previousPeriod.year, previousPeriod.value)

  const periodStats = useMemo(() => {
    function statsFor(r: { start: string; end: string }) {
      const hoursForSite = hoursEntries.filter((e) => e.siteId === siteId && inRange(e.date, r.start, r.end))
      const outputForSite = outputEntries.filter((e) => e.siteId === siteId && inRange(e.date, r.start, r.end))
      const laborCost =
        hoursForSite.reduce((sum, e) => sum + hoursEntryAmount(e), 0) +
        outputForSite.reduce((sum, e) => sum + outputEntryAmount(e), 0)
      const peopleSet = new Set<number>([...hoursForSite.map((e) => e.personId), ...outputForSite.map((e) => e.personId)])
      const brigadeSet = new Set<number>()
      for (const personId of peopleSet) {
        const brigadeId = people.find((p) => p.id === personId)?.brigadeId
        if (brigadeId != null) brigadeSet.add(brigadeId)
      }
      return { laborCost, peopleCount: peopleSet.size, brigadeCount: brigadeSet.size }
    }
    return { current: statsFor(range), previous: statsFor(previousRange) }
  }, [hoursEntries, outputEntries, siteId, people, range, previousRange])

  const [expandedMonth, setExpandedMonth] = useState<string | null>(null)

  const monthlyPersonDetail = useMemo(() => {
    const raw = new Map<string, { personId: number; hours: number; cost: number }[]>()
    function addEntry(month: string, personId: number, hours: number, cost: number) {
      const list = raw.get(month) ?? []
      let row = list.find((r) => r.personId === personId)
      if (!row) {
        row = { personId, hours: 0, cost: 0 }
        list.push(row)
      }
      row.hours += hours
      row.cost += cost
      raw.set(month, list)
    }
    for (const e of hoursEntries) {
      if (e.siteId !== siteId) continue
      addEntry(monthOf(e.date), e.personId, e.hours, hoursEntryAmount(e))
    }
    for (const e of outputEntries) {
      if (e.siteId !== siteId) continue
      addEntry(monthOf(e.date), e.personId, 0, outputEntryAmount(e))
    }

    const result = new Map<string, { personId: number; name: string; brigadeName: string; hours: number; cost: number }[]>()
    for (const [month, rows] of raw) {
      result.set(
        month,
        rows
          .map((row) => {
            const person = people.find((p) => p.id === row.personId)
            const brigade = brigades.find((b) => b.id === person?.brigadeId)
            return { personId: row.personId, name: person?.name ?? '', brigadeName: brigade?.name ?? '', hours: row.hours, cost: row.cost }
          })
          .sort((a, b) => b.cost - a.cost),
      )
    }
    return result
  }, [hoursEntries, outputEntries, siteId, people, brigades])

  if (!site) {
    return <p className="text-sm text-gray-500">{t.common.noData}</p>
  }

  const brigadeName = (brigadeId: number) => brigades.find((b) => b.id === brigadeId)?.name ?? ''
  const workTypeName = (workTypeId: number) => workTypes.find((w) => w.id === workTypeId)?.name ?? ''

  return (
    <div>
      <Link to={ROUTES.sites} className="text-sm text-gray-500 hover:underline">
        ← {t.common.back}
      </Link>

      <div className="mt-1 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">{site.name}</h1>
          <p className="text-sm text-gray-500">
            {site.address} · {site.status === 'active' ? t.siteStatus.active : t.siteStatus.completed}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => exportSiteToExcel(siteId, t)}>
            {t.backup.exportExcel}
          </Button>
          <Button variant="secondary" onClick={() => window.open(ROUTES.printSite(siteId), '_blank')}>
            {t.backup.exportPdf}
          </Button>
        </div>
      </div>

      <div className="mt-4">
        <PeriodSwitcher value={period} onChange={setPeriod} />
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatTile
          label={t.sites.laborCost}
          value={formatMoney(periodStats.current.laborCost)}
          mono
          delta={delta(periodStats.current.laborCost, periodStats.previous.laborCost, t.common.vsPreviousPeriod(period.type))}
        />
        <StatTile label={t.sites.activePeople} value={String(periodStats.current.peopleCount)} mono />
        <StatTile label={t.sites.activeBrigades} value={String(periodStats.current.brigadeCount)} mono />
      </div>

      <Card className="mt-4">
        <p className="text-sm text-gray-500">{t.sites.allTimeLaborCost}</p>
        <p className="mt-1 text-2xl font-bold tabular-nums">{formatMoney(total)}</p>
      </Card>

      <div className="mt-4">
        <h2 className="text-lg font-semibold">{t.analytics.hoursOnSite}</h2>
        <Card className="mt-2">
          {hoursByCategory.total === 0 ? (
            <p className="text-sm text-gray-500">
              {t.common.noData} ·{' '}
              <Link to={ROUTES.analytics} className="text-blue-600 underline dark:text-blue-400">
                {t.analytics.tabHours}
              </Link>
            </p>
          ) : (
            <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-3">
              <div>
                <dt className="text-gray-500">{t.analytics.categoryArmovani}</dt>
                <dd className="font-medium tabular-nums">{hoursByCategory.armovani}</dd>
              </div>
              <div>
                <dt className="text-gray-500">{t.analytics.categoryMonolit}</dt>
                <dd className="font-medium tabular-nums">{hoursByCategory.monolit}</dd>
              </div>
              <div>
                <dt className="text-gray-500">{t.common.total}</dt>
                <dd className="font-medium tabular-nums">{hoursByCategory.total}</dd>
              </div>
            </dl>
          )}
        </Card>

        <h3 className="mt-4 text-sm font-medium text-gray-700 dark:text-gray-300">{t.analytics.drawingsOnSite}</h3>
        {siteDrawings.length === 0 ? (
          <Card className="mt-2">
            <p className="text-sm text-gray-500">
              {t.analytics.noDrawings} ·{' '}
              <Link to={ROUTES.analytics} className="text-blue-600 underline dark:text-blue-400">
                {t.analytics.tabDrawings}
              </Link>
            </p>
          </Card>
        ) : (
          <Card className="mt-2 p-0">
            <ul className="divide-y divide-gray-100 dark:divide-gray-800">
              {siteDrawings.map(({ drawing, timeline }) => (
                <li key={drawing.id}>
                  <Link
                    to={ROUTES.analyticsDrawingDetail(drawing.id!)}
                    className="flex flex-wrap items-center justify-between gap-2 p-4 text-sm hover:bg-gray-50 dark:hover:bg-gray-800/50"
                  >
                    <span>
                      <span className="font-medium">{drawing.name}</span>{' '}
                      <span className="text-gray-500">
                        · {drawing.workCategory === 'armovani' ? t.analytics.categoryArmovani : t.analytics.categoryMonolit}
                      </span>
                    </span>
                    {timeline.startDate ? (
                      <span className="text-xs text-gray-500">
                        {timeline.startDate} → {timeline.endDate} · {t.analytics.totalCalendarDays}: {timeline.totalCalendarDays} ·{' '}
                        {t.analytics.pauseDaysCount}: {timeline.pauseDaysCount}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400">{t.common.noData}</span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </Card>
        )}
      </div>

      {plan.length > 0 && (
        <div className="mt-4">
          <h2 className="text-lg font-semibold">{t.sites.planVsActual}</h2>
          <Card className="mt-2 overflow-x-auto p-0">
            <table className="w-full min-w-[480px] text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left text-gray-500 dark:border-gray-800">
                  <th className="px-4 py-2 font-medium">{t.workTypes.name}</th>
                  <th className="px-4 py-2 text-right font-medium">{t.company.plannedQuantity}</th>
                  <th className="px-4 py-2 text-right font-medium">{t.company.actualQuantity}</th>
                  <th className="px-4 py-2 text-right font-medium">{t.company.remainingQuantity}</th>
                  <th className="px-4 py-2 text-right font-medium">{t.sites.revenue}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {plan.map((row) => (
                  <tr key={row.workTypeId}>
                    <td className="px-4 py-2">{workTypeName(row.workTypeId)}</td>
                    <td className="px-4 py-2 text-right tabular-nums">{row.plannedQuantity}</td>
                    <td className="px-4 py-2 text-right tabular-nums">{row.actualQuantity}</td>
                    <td className="px-4 py-2 text-right tabular-nums">{row.remainingQuantity}</td>
                    <td className="px-4 py-2 text-right tabular-nums">
                      {formatMoney(row.actualRevenue)} / {formatMoney(row.plannedRevenue)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </div>
      )}

      {hasProfitabilityData && (
        <div className="mt-4">
          <h2 className="text-lg font-semibold">{t.sites.profitability}</h2>
          <Card className="mt-2">
            <p className="text-sm text-gray-500">{t.sites.netProfit}</p>
            <p
              className={`mt-1 text-3xl font-bold tabular-nums ${
                profitability.netProfit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
              }`}
            >
              {formatMoney(profitability.netProfit)}
            </p>
            <dl className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
              <div>
                <dt className="text-gray-500">{t.sites.revenue}</dt>
                <dd className="tabular-nums font-medium">{formatMoney(profitability.revenue)}</dd>
              </div>
              <div>
                <dt className="text-gray-500">{t.sites.laborCost}</dt>
                <dd className="tabular-nums font-medium">{formatMoney(profitability.laborCost)}</dd>
              </div>
              <div>
                <dt className="text-gray-500">{t.sites.materialCost}</dt>
                <dd className="tabular-nums font-medium">{formatMoney(profitability.materialCost)}</dd>
              </div>
              <div>
                <dt className="text-gray-500">{t.sites.otherExpenses}</dt>
                <dd className="tabular-nums font-medium">{formatMoney(profitability.otherExpenses)}</dd>
              </div>
            </dl>
          </Card>
        </div>
      )}

      {monthly.length > 0 && (
        <div className="mt-4">
          <h2 className="text-lg font-semibold">{t.sites.monthlyBreakdown}</h2>
          <p className="mt-1 text-xs text-gray-500">{t.sites.monthDetailHint}</p>
          <Card className="mt-2 overflow-x-auto p-0">
            <table className="w-full min-w-[520px] text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left text-gray-500 dark:border-gray-800">
                  <th className="px-4 py-2 font-medium">{t.people.detail.month}</th>
                  <th className="px-4 py-2 text-right font-medium">{t.sites.revenue}</th>
                  <th className="px-4 py-2 text-right font-medium">{t.sites.laborCost}</th>
                  <th className="px-4 py-2 text-right font-medium">{t.sites.materialCost}</th>
                  <th className="px-4 py-2 text-right font-medium">{t.sites.otherExpenses}</th>
                  <th className="px-4 py-2 text-right font-medium">{t.sites.netProfit}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {monthly.map((row) => {
                  const isExpanded = expandedMonth === row.month
                  const detail = monthlyPersonDetail.get(row.month) ?? []
                  return (
                    <Fragment key={row.month}>
                      <tr
                        onClick={() => setExpandedMonth(isExpanded ? null : row.month)}
                        className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50"
                      >
                        <td className="px-4 py-2">
                          <span className="inline-flex items-center gap-1.5">
                            <span
                              className={`inline-block text-gray-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                            >
                              ›
                            </span>
                            {row.month}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-right tabular-nums">{formatMoney(row.revenue)}</td>
                        <td className="px-4 py-2 text-right tabular-nums">{formatMoney(row.laborCost)}</td>
                        <td className="px-4 py-2 text-right tabular-nums">{formatMoney(row.materialCost)}</td>
                        <td className="px-4 py-2 text-right tabular-nums">{formatMoney(row.otherExpenses)}</td>
                        <td
                          className={`px-4 py-2 text-right font-medium tabular-nums ${
                            row.netProfit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                          }`}
                        >
                          {formatMoney(row.netProfit)}
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr>
                          <td colSpan={6} className="bg-gray-50 px-4 py-3 dark:bg-gray-800/40">
                            <div className="flex items-center justify-between gap-2">
                              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                                {t.sites.monthDetailTitle}
                              </h3>
                              <Button
                                variant="secondary"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  exportSiteMonthToExcel(siteId, row.month, t)
                                }}
                              >
                                {t.backup.exportExcel}
                              </Button>
                            </div>
                            {detail.length === 0 ? (
                              <p className="mt-2 text-sm text-gray-500">{t.sites.monthDetailEmpty}</p>
                            ) : (
                              <table className="mt-2 w-full text-sm">
                                <thead>
                                  <tr className="text-left text-gray-500">
                                    <th className="py-1 font-medium">{t.sites.monthDetailPerson}</th>
                                    <th className="py-1 font-medium">{t.sites.monthDetailBrigade}</th>
                                    <th className="py-1 text-right font-medium">{t.entry.hours}</th>
                                    <th className="py-1 text-right font-medium">{t.sites.laborCost}</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                  {detail.map((d) => (
                                    <tr key={d.personId}>
                                      <td className="py-1.5">
                                        <Link
                                          to={ROUTES.personDetail(d.personId)}
                                          className="hover:underline"
                                          onClick={(e) => e.stopPropagation()}
                                        >
                                          {d.name}
                                        </Link>
                                      </td>
                                      <td className="py-1.5 text-gray-500">{d.brigadeName}</td>
                                      <td className="py-1.5 text-right tabular-nums">{d.hours > 0 ? d.hours : '—'}</td>
                                      <td className="py-1.5 text-right tabular-nums">{formatMoney(d.cost)}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            )}
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  )
                })}
              </tbody>
            </table>
          </Card>
        </div>
      )}

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card>
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">{t.sites.byBrigade}</h2>
          <ul className="mt-2 divide-y divide-gray-100 text-sm dark:divide-gray-800">
            {byBrigade.length === 0 && <li className="py-2 text-gray-500">{t.common.noData}</li>}
            {byBrigade.map(([brigadeId, amount]) => (
              <li key={brigadeId} className="flex justify-between py-2">
                <span>{brigadeName(brigadeId)}</span>
                <span className="tabular-nums">{formatMoney(amount)}</span>
              </li>
            ))}
          </ul>
        </Card>
        <Card>
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">{t.sites.byWorkType}</h2>
          <ul className="mt-2 divide-y divide-gray-100 text-sm dark:divide-gray-800">
            {byWorkType.length === 0 && <li className="py-2 text-gray-500">{t.common.noData}</li>}
            {byWorkType.map(([workTypeId, amount]) => (
              <li key={workTypeId} className="flex justify-between py-2">
                <span>{workTypeName(workTypeId)}</span>
                <span className="tabular-nums">{formatMoney(amount)}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  )
}
