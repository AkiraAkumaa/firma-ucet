import { useEffect, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { useT } from '../../i18n/I18nContext'
import { useDrawingRecords, useSites, useWorkHourEntries } from '../../db/hooks'
import { useSiteMonthlyBreakdown, useSiteProfitability } from '../../domain/profitability/useProfitability'
import { calculateJobTimeline } from '../../domain/analytics/timeline'
import { formatMoney } from '../../shared/money'
import { todayIso } from '../../shared/date'

export function SitePrint() {
  const t = useT()
  const { id } = useParams()
  const siteId = Number(id)

  const sites = useSites()
  const site = sites.find((s) => s.id === siteId)
  const profitability = useSiteProfitability(siteId)
  const monthly = useSiteMonthlyBreakdown(siteId)
  const workHourEntries = useWorkHourEntries()
  const drawingRecords = useDrawingRecords()

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

  useEffect(() => {
    const timeout = setTimeout(() => window.print(), 300)
    return () => clearTimeout(timeout)
  }, [])

  if (!site) return null

  return (
    <div className="mx-auto max-w-3xl bg-white p-8 text-gray-900">
      <h1 className="text-2xl font-bold">{t.common.appName}</h1>
      <p className="text-sm text-gray-500">
        {t.print.generatedOn} {todayIso()}
      </p>

      <h2 className="mt-6 text-xl font-semibold">{site.name}</h2>
      <p className="text-sm text-gray-500">
        {site.address} · {site.status === 'active' ? t.siteStatus.active : t.siteStatus.completed}
      </p>

      <div className="mt-4">
        <p className="text-sm text-gray-500">{t.sites.netProfit}</p>
        <p className="mt-1 text-4xl font-bold">{formatMoney(profitability.netProfit)}</p>
        <dl className="mt-3 grid grid-cols-4 gap-3 text-sm">
          <div>
            <dt className="text-gray-500">{t.sites.revenue}</dt>
            <dd className="font-medium tabular-nums">{formatMoney(profitability.revenue)}</dd>
          </div>
          <div>
            <dt className="text-gray-500">{t.sites.laborCost}</dt>
            <dd className="font-medium tabular-nums">{formatMoney(profitability.laborCost)}</dd>
          </div>
          <div>
            <dt className="text-gray-500">{t.sites.materialCost}</dt>
            <dd className="font-medium tabular-nums">{formatMoney(profitability.materialCost)}</dd>
          </div>
          <div>
            <dt className="text-gray-500">{t.sites.otherExpenses}</dt>
            <dd className="font-medium tabular-nums">{formatMoney(profitability.otherExpenses)}</dd>
          </div>
        </dl>
      </div>

      <h3 className="mt-6 text-base font-semibold">{t.sites.monthlyBreakdown}</h3>
      <table className="mt-2 w-full border-collapse text-sm">
        <thead>
          <tr className="border-b-2 border-gray-300 text-left">
            <th className="py-2 pr-2">{t.people.detail.month}</th>
            <th className="py-2 pr-2 text-right">{t.sites.revenue}</th>
            <th className="py-2 pr-2 text-right">{t.sites.laborCost}</th>
            <th className="py-2 pr-2 text-right">{t.sites.materialCost}</th>
            <th className="py-2 pr-2 text-right">{t.sites.otherExpenses}</th>
            <th className="py-2 text-right">{t.sites.netProfit}</th>
          </tr>
        </thead>
        <tbody>
          {monthly.length === 0 && (
            <tr>
              <td className="py-2 text-gray-500" colSpan={6}>
                {t.common.noData}
              </td>
            </tr>
          )}
          {monthly.map((row) => (
            <tr key={row.month} className="border-b border-gray-200">
              <td className="py-1.5 pr-2">{row.month}</td>
              <td className="py-1.5 pr-2 text-right tabular-nums">{formatMoney(row.revenue)}</td>
              <td className="py-1.5 pr-2 text-right tabular-nums">{formatMoney(row.laborCost)}</td>
              <td className="py-1.5 pr-2 text-right tabular-nums">{formatMoney(row.materialCost)}</td>
              <td className="py-1.5 pr-2 text-right tabular-nums">{formatMoney(row.otherExpenses)}</td>
              <td className="py-1.5 text-right font-medium tabular-nums">{formatMoney(row.netProfit)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {(hoursByCategory.total > 0 || siteDrawings.length > 0) && (
        <>
          <h3 className="mt-6 text-base font-semibold">{t.analytics.hoursOnSite}</h3>
          <dl className="mt-2 grid grid-cols-3 gap-3 text-sm">
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

          {siteDrawings.length > 0 && (
            <table className="mt-3 w-full border-collapse text-sm">
              <thead>
                <tr className="border-b-2 border-gray-300 text-left">
                  <th className="py-2 pr-2">{t.analytics.drawingName}</th>
                  <th className="py-2 pr-2">{t.analytics.startDate}</th>
                  <th className="py-2 pr-2 text-right">{t.analytics.totalCalendarDays}</th>
                  <th className="py-2 pr-2 text-right">{t.analytics.workedDaysCount}</th>
                  <th className="py-2 text-right">{t.analytics.pauseDaysCount}</th>
                </tr>
              </thead>
              <tbody>
                {siteDrawings.map(({ drawing, timeline }) => (
                  <tr key={drawing.id} className="border-b border-gray-200">
                    <td className="py-1.5 pr-2">{drawing.name}</td>
                    <td className="py-1.5 pr-2">{timeline.startDate ?? '—'}</td>
                    <td className="py-1.5 pr-2 text-right tabular-nums">{timeline.totalCalendarDays}</td>
                    <td className="py-1.5 pr-2 text-right tabular-nums">{timeline.workedDaysCount}</td>
                    <td className="py-1.5 text-right tabular-nums">{timeline.pauseDaysCount}</td>
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
