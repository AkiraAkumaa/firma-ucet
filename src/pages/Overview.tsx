import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useT } from '../i18n/I18nContext'
import { useBrigades, useExpenses, useHoursEntries, useOutputEntries, usePayments, usePeople, useSalaryEntries, useSites } from '../db/hooks'
import { useAllPeopleDebts, useDebtTrend } from '../domain/debt/useDebt'
import { useCompanyProfitability } from '../domain/profitability/useProfitability'
import { calculatePeriodTotals } from '../domain/debt/periodTotals'
import { hoursEntryAmount } from '../domain/hours/calc'
import { outputEntryAmount } from '../domain/output/calc'
import { inRange, periodRange, stepPeriod, type PeriodValue } from '../domain/reports/period'
import { formatMoney } from '../shared/money'
import { StatTile, type StatDelta } from '../shared/ui/StatTile'
import { PeriodSwitcher } from '../shared/ui/PeriodSwitcher'
import { Card } from '../shared/ui/Card'
import { DebtTrendChart } from '../shared/charts/DebtTrendChart'
import { MagnitudeBarChart } from '../shared/charts/MagnitudeBarChart'
import { EmptyChartState } from '../shared/charts/EmptyChartState'
import { ROUTES } from '../app/routes'

const OVERDUE_THRESHOLD_DAYS = 14

function currentMonthValue(): PeriodValue {
  const now = new Date()
  return { type: 'month', year: now.getFullYear(), value: now.getMonth() + 1 }
}

function delta(current: number, previous: number, label: string): StatDelta | undefined {
  if (previous === 0) return undefined
  return { percent: ((current - previous) / Math.abs(previous)) * 100, label }
}

export function Overview() {
  const t = useT()
  const brigades = useBrigades()
  const people = usePeople()
  const sites = useSites()
  const hoursEntries = useHoursEntries()
  const outputEntries = useOutputEntries()
  const salaryEntries = useSalaryEntries()
  const expenses = useExpenses()
  const payments = usePayments()
  const debts = useAllPeopleDebts()
  const trend = useDebtTrend()
  const profitability = useCompanyProfitability()
  const hasProfitabilityData = profitability.revenue > 0 || profitability.materialCost > 0

  const totalDebt = useMemo(() => [...debts.values()].reduce((sum, d) => sum + d.totalDebt, 0), [debts])

  const longestDelay = useMemo(() => {
    let best: { personId: number; days: number } | null = null
    for (const [personId, d] of debts) {
      if (d.oldestUnpaidMonth && (!best || d.delayDays > best.days)) {
        best = { personId, days: d.delayDays }
      }
    }
    return best
  }, [debts])
  const longestDelayName = longestDelay ? (people.find((p) => p.id === longestDelay.personId)?.name ?? '') : ''

  const overdueCount = useMemo(
    () => [...debts.values()].filter((d) => d.oldestUnpaidMonth != null && d.delayDays > OVERDUE_THRESHOLD_DAYS).length,
    [debts],
  )

  const [period, setPeriod] = useState<PeriodValue>(currentMonthValue())
  const range = periodRange(period.type, period.year, period.value)
  const previousPeriod = stepPeriod(period, -1)
  const previousRange = periodRange(previousPeriod.type, previousPeriod.year, previousPeriod.value)

  const periodStats = useMemo(() => {
    function statsFor(r: { start: string; end: string }) {
      const hoursIn = hoursEntries.filter((e) => inRange(e.date, r.start, r.end))
      const outputIn = outputEntries.filter((e) => inRange(e.date, r.start, r.end))
      const salaryIn = salaryEntries.filter((e) => inRange(e.date, r.start, r.end))
      const paymentsIn = payments.filter((p) => inRange(p.date, r.start, r.end))
      const totals = calculatePeriodTotals({
        hoursEntries: hoursIn,
        outputEntries: outputIn,
        salaryEntries: salaryIn,
        expenses: [],
        payments: paymentsIn,
      })
      const laborCost =
        hoursIn.reduce((s, e) => s + hoursEntryAmount(e), 0) + outputIn.reduce((s, e) => s + outputEntryAmount(e), 0)
      const siteIds = new Set<number>([...hoursIn.map((e) => e.siteId), ...outputIn.map((e) => e.siteId)])
      const siteBreakdown = sites
        .filter((s) => siteIds.has(s.id!))
        .map((s) => {
          const cost =
            hoursIn.filter((e) => e.siteId === s.id).reduce((sum, e) => sum + hoursEntryAmount(e), 0) +
            outputIn.filter((e) => e.siteId === s.id).reduce((sum, e) => sum + outputEntryAmount(e), 0)
          return { siteId: s.id!, name: s.name, cost }
        })
        .sort((a, b) => b.cost - a.cost)
      return { laborCost, accrued: totals.accrued, paid: totals.paid, activeSitesCount: siteIds.size, siteBreakdown }
    }
    return { current: statsFor(range), previous: statsFor(previousRange) }
  }, [hoursEntries, outputEntries, salaryEntries, payments, sites, range, previousRange])

  const expensesByBrigadeData = useMemo(() => {
    return brigades
      .map((brigade) => {
        const memberIds = new Set(people.filter((p) => p.brigadeId === brigade.id).map((p) => p.id))
        const labor =
          hoursEntries.filter((e) => memberIds.has(e.personId)).reduce((s, e) => s + hoursEntryAmount(e), 0) +
          outputEntries.filter((e) => memberIds.has(e.personId)).reduce((s, e) => s + outputEntryAmount(e), 0)
        const brigadeExpenses = expenses
          .filter((e) => e.brigadeIdSnapshot === brigade.id)
          .reduce((s, e) => s + e.amount, 0)
        return { name: brigade.name, value: labor + brigadeExpenses }
      })
      .filter((d) => d.value > 0)
      .sort((a, b) => b.value - a.value)
  }, [brigades, people, hoursEntries, outputEntries, expenses])

  const laborCostBySiteData = useMemo(() => {
    return sites
      .map((site) => {
        const cost =
          hoursEntries.filter((e) => e.siteId === site.id).reduce((sum, e) => sum + hoursEntryAmount(e), 0) +
          outputEntries.filter((e) => e.siteId === site.id).reduce((sum, e) => sum + outputEntryAmount(e), 0)
        return { name: site.name, value: cost }
      })
      .filter((d) => d.value > 0)
      .sort((a, b) => b.value - a.value)
  }, [sites, hoursEntries, outputEntries])

  return (
    <div>
      <h1 className="text-2xl font-semibold">{t.overview.title}</h1>

      {overdueCount > 0 && (
        <Link
          to={ROUTES.people}
          className="mt-4 flex items-center justify-between gap-3 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800 hover:bg-red-100 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300 dark:hover:bg-red-950/60"
        >
          <span className="font-medium">⚠ {t.overview.overdueBanner(overdueCount, OVERDUE_THRESHOLD_DAYS)}</span>
          <span className="underline">{t.overview.overdueBannerLink}</span>
        </Link>
      )}

      <div className="mt-4">
        <StatTile
          label={t.overview.totalDebt}
          value={formatMoney(totalDebt)}
          size="hero"
          valueClassName={totalDebt > 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-400'}
        />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatTile
          label={t.overview.longestDelay}
          value={longestDelay ? `${longestDelayName} · ${t.overview.delayDays(longestDelay.days)}` : t.overview.noDelay}
        />
        {hasProfitabilityData && (
          <StatTile
            label={t.overview.totalProfit}
            value={formatMoney(profitability.netProfit)}
            valueClassName={profitability.netProfit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}
            hint={t.overview.totalProfitHint}
          />
        )}
      </div>

      <div className="mt-6">
        <PeriodSwitcher value={period} onChange={setPeriod} />
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile
          label={t.overview.laborCostPeriod}
          value={formatMoney(periodStats.current.laborCost)}
          mono
          hint={t.overview.laborCostThisMonthHint}
          delta={delta(periodStats.current.laborCost, periodStats.previous.laborCost, t.common.vsPreviousPeriod(period.type))}
        />
        <StatTile
          label={t.overview.accruedPeriod}
          value={formatMoney(periodStats.current.accrued)}
          mono
          delta={delta(periodStats.current.accrued, periodStats.previous.accrued, t.common.vsPreviousPeriod(period.type))}
        />
        <StatTile
          label={t.overview.paidPeriod}
          value={formatMoney(periodStats.current.paid)}
          mono
          delta={delta(periodStats.current.paid, periodStats.previous.paid, t.common.vsPreviousPeriod(period.type))}
        />
        <StatTile label={t.overview.activeSites} value={String(periodStats.current.activeSitesCount)} mono />
      </div>

      {periodStats.current.siteBreakdown.length > 0 && (
        <Card className="mt-3">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">{t.overview.siteBreakdown}</h2>
          <ul className="mt-2 divide-y divide-gray-100 text-sm dark:divide-gray-800">
            {periodStats.current.siteBreakdown.map((row) => (
              <li key={row.siteId} className="flex justify-between py-2">
                <Link to={ROUTES.siteDetail(row.siteId)} className="hover:underline">
                  {row.name}
                </Link>
                <span className="tabular-nums">{formatMoney(row.cost)}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <div className="mt-6">
        <h2 className="text-lg font-semibold">{t.overview.debtOverTime}</h2>
        <div className="mt-2">
          {trend.length >= 2 ? <DebtTrendChart data={trend} /> : <EmptyChartState text={t.overview.notEnoughData} />}
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div>
          <h2 className="text-lg font-semibold">{t.overview.expensesByBrigade}</h2>
          <div className="mt-2">
            {expensesByBrigadeData.length > 0 ? (
              <MagnitudeBarChart data={expensesByBrigadeData} />
            ) : (
              <EmptyChartState text={t.overview.notEnoughData} />
            )}
          </div>
        </div>
        <div>
          <h2 className="text-lg font-semibold">{t.overview.laborCostBySite}</h2>
          <div className="mt-2">
            {laborCostBySiteData.length > 0 ? (
              <MagnitudeBarChart data={laborCostBySiteData} />
            ) : (
              <EmptyChartState text={t.overview.notEnoughData} />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
