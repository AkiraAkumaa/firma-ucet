import { useMemo } from 'react'
import { useT } from '../i18n/I18nContext'
import { useBrigades, useExpenses, useHoursEntries, useOutputEntries, usePayments, usePeople, useSalaryEntries, useSites } from '../db/hooks'
import { useAllPeopleDebts, useDebtTrend } from '../domain/debt/useDebt'
import { useCompanyProfitability } from '../domain/profitability/useProfitability'
import { calculatePeriodTotals } from '../domain/debt/periodTotals'
import { monthOf } from '../domain/debt/dateUtils'
import { hoursEntryAmount } from '../domain/hours/calc'
import { outputEntryAmount } from '../domain/output/calc'
import { inRange, yearRange } from '../domain/reports/period'
import { formatMoney } from '../shared/money'
import { todayIso } from '../shared/date'
import { StatTile } from '../shared/ui/StatTile'
import { DebtTrendChart } from '../shared/charts/DebtTrendChart'
import { MagnitudeBarChart } from '../shared/charts/MagnitudeBarChart'
import { EmptyChartState } from '../shared/charts/EmptyChartState'

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

  const activeSitesCount = sites.filter((s) => s.status === 'active').length

  const currentMonth = monthOf(todayIso())
  const laborCostThisMonth = useMemo(() => {
    const hours = hoursEntries.filter((e) => monthOf(e.date) === currentMonth).reduce((s, e) => s + hoursEntryAmount(e), 0)
    const output = outputEntries
      .filter((e) => monthOf(e.date) === currentMonth)
      .reduce((s, e) => s + outputEntryAmount(e), 0)
    return hours + output
  }, [hoursEntries, outputEntries, currentMonth])

  const currentYear = new Date().getFullYear()
  const thisYearTotals = useMemo(() => {
    const { start, end } = yearRange(currentYear)
    return calculatePeriodTotals({
      hoursEntries: hoursEntries.filter((e) => inRange(e.date, start, end)),
      outputEntries: outputEntries.filter((e) => inRange(e.date, start, end)),
      salaryEntries: salaryEntries.filter((e) => inRange(e.date, start, end)),
      expenses: [],
      payments: payments.filter((p) => inRange(p.date, start, end)),
    })
  }, [hoursEntries, outputEntries, salaryEntries, payments, currentYear])

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
        <StatTile label={t.overview.activeSites} value={String(activeSitesCount)} />
        <StatTile
          label={t.overview.laborCostThisMonth}
          value={formatMoney(laborCostThisMonth)}
          hint={t.overview.laborCostThisMonthHint}
        />
        <StatTile label={t.overview.accruedThisYear(currentYear)} value={formatMoney(thisYearTotals.accrued)} />
        <StatTile label={t.overview.paidThisYear(currentYear)} value={formatMoney(thisYearTotals.paid)} />
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
