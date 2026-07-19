import { useEffect, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useLanguage, useT } from '../../i18n/I18nContext'
import { intlLocale } from '../../i18n/translations'
import {
  useBrigades,
  useExpenseCategories,
  useExpenses,
  useHoursEntries,
  useOutputEntries,
  usePayments,
  usePeople,
  useSalaryEntries,
  useSiteCustomerPayments,
  useSiteMaterialCosts,
  useSites,
  useSiteWorkPlans,
  useSiteWorkProgress,
  useWorkTypes,
} from '../../db/hooks'
import { calculateSiteProfitability, expensesForSite } from '../../domain/profitability/calculateSiteProfitability'
import { calculateDebtTrend } from '../../domain/debt/debtTrend'
import { calculatePeriodTotals } from '../../domain/debt/periodTotals'
import { calculateSummaryRows } from '../../domain/reports/summaryRows'
import { useAllPeopleDebts } from '../../domain/debt/useDebt'
import { monthOf } from '../../domain/debt/dateUtils'
import { hoursEntryAmount } from '../../domain/hours/calc'
import { outputEntryAmount } from '../../domain/output/calc'
import { inRange, periodRange, type PeriodType } from '../../domain/reports/period'
import { formatMoney } from '../../shared/money'
import { todayIso } from '../../shared/date'
import { DebtTrendChart } from '../../shared/charts/DebtTrendChart'
import { MagnitudeBarChart, type MagnitudeDataPoint } from '../../shared/charts/MagnitudeBarChart'
import { DebtSummarySection } from './DebtSummarySection'

/** Malý barevný čtvereček + nadpis sekce — konzistentní vizuální hierarchie napříč celou zprávou. */
function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mt-8 flex items-center gap-2 border-b-2 border-gray-900 pb-1.5 text-lg font-bold">
      <span className="inline-block h-3 w-3 rounded-sm bg-blue-700" />
      {children}
    </h2>
  )
}

interface KpiCardProps {
  label: string
  value: string
  accent: 'green' | 'red' | 'blue' | 'gray'
}

const ACCENT_BORDER: Record<KpiCardProps['accent'], string> = {
  green: 'border-l-green-600',
  red: 'border-l-red-600',
  blue: 'border-l-blue-700',
  gray: 'border-l-gray-400',
}
const ACCENT_TEXT: Record<KpiCardProps['accent'], string> = {
  green: 'text-green-700',
  red: 'text-red-700',
  blue: 'text-blue-800',
  gray: 'text-gray-900',
}

function KpiCard({ label, value, accent }: KpiCardProps) {
  return (
    <div className={`rounded-md border border-gray-200 border-l-4 bg-gray-50 p-3 ${ACCENT_BORDER[accent]}`}>
      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{label}</p>
      <p className={`mt-1 text-xl font-bold tabular-nums ${ACCENT_TEXT[accent]}`}>{value}</p>
    </div>
  )
}

export function ReportPrint() {
  const t = useT()
  const [language] = useLanguage()
  const [searchParams] = useSearchParams()

  const type: PeriodType = (searchParams.get('type') as PeriodType) || 'month'
  const year = Number(searchParams.get('year')) || new Date().getFullYear()
  const value = Number(searchParams.get('value')) || 1
  const siteIdParam = searchParams.get('siteId')
  const filterSiteId = siteIdParam ? Number(siteIdParam) : null

  const sites = useSites()
  const brigades = useBrigades()
  const people = usePeople()
  const workTypes = useWorkTypes()
  const expenseCategories = useExpenseCategories()
  const hoursEntries = useHoursEntries()
  const outputEntries = useOutputEntries()
  const salaryEntries = useSalaryEntries()
  const workProgress = useSiteWorkProgress()
  const workPlans = useSiteWorkPlans()
  const expenses = useExpenses()
  const payments = usePayments()
  const customerPayments = useSiteCustomerPayments()
  const materialCosts = useSiteMaterialCosts()
  const debts = useAllPeopleDebts()

  const { start, end } = periodRange(type, year, value)
  const selectedSite = filterSiteId != null ? sites.find((s) => s.id === filterSiteId) : null

  useEffect(() => {
    const timeout = setTimeout(() => window.print(), 500)
    return () => clearTimeout(timeout)
  }, [])

  const periodLabel = useMemo(() => {
    if (type === 'month') {
      return new Intl.DateTimeFormat(intlLocale[language], { year: 'numeric', month: 'long' }).format(
        new Date(year, value - 1, 1),
      )
    }
    if (type === 'quarter') return t.print.quarterLabel(value, year)
    return String(year)
  }, [type, year, value, language, t])

  const hoursInPeriod = useMemo(() => hoursEntries.filter((e) => inRange(e.date, start, end)), [hoursEntries, start, end])
  const outputInPeriod = useMemo(() => outputEntries.filter((e) => inRange(e.date, start, end)), [outputEntries, start, end])
  const salaryInPeriod = useMemo(
    () => salaryEntries.filter((e) => inRange(e.date, start, end)),
    [salaryEntries, start, end],
  )
  const paymentsInPeriod = useMemo(() => payments.filter((p) => inRange(p.date, start, end)), [payments, start, end])
  const workProgressInPeriod = useMemo(
    () => workProgress.filter((p) => inRange(p.date, start, end)),
    [workProgress, start, end],
  )
  const expensesInPeriod = useMemo(() => expenses.filter((e) => inRange(e.date, start, end)), [expenses, start, end])
  const materialCostsInPeriod = useMemo(
    () => materialCosts.filter((m) => inRange(m.date, start, end)),
    [materialCosts, start, end],
  )
  const customerPaymentsInPeriod = useMemo(
    () => customerPayments.filter((p) => inRange(p.date, start, end)),
    [customerPayments, start, end],
  )

  const siteProfitabilityRows = useMemo(
    () =>
      sites.map((site) => ({
        site,
        profitability: calculateSiteProfitability({
          hoursEntries: hoursInPeriod.filter((e) => e.siteId === site.id),
          outputEntries: outputInPeriod.filter((e) => e.siteId === site.id),
          salaryEntries: salaryInPeriod.filter((e) => e.siteId === site.id),
          workProgress: workProgressInPeriod.filter((p) => p.siteId === site.id),
          workTypes,
          plans: workPlans.filter((p) => p.siteId === site.id),
          customerPayments: customerPaymentsInPeriod.filter((p) => p.siteId === site.id),
          materialCosts: materialCostsInPeriod.filter((m) => m.siteId === site.id),
          siteExpenses: expensesForSite(expensesInPeriod, site.id!),
        }),
      })),
    [
      sites,
      hoursInPeriod,
      outputInPeriod,
      salaryInPeriod,
      workProgressInPeriod,
      workTypes,
      workPlans,
      customerPaymentsInPeriod,
      materialCostsInPeriod,
      expensesInPeriod,
    ],
  )

  const companyProfitability = useMemo(
    () =>
      calculateSiteProfitability({
        hoursEntries: hoursInPeriod,
        outputEntries: outputInPeriod,
        salaryEntries: salaryInPeriod,
        workProgress: workProgressInPeriod,
        workTypes,
        plans: workPlans,
        customerPayments: customerPaymentsInPeriod,
        materialCosts: materialCostsInPeriod,
        siteExpenses: expensesInPeriod,
      }),
    [
      hoursInPeriod,
      outputInPeriod,
      salaryInPeriod,
      workProgressInPeriod,
      workTypes,
      workPlans,
      customerPaymentsInPeriod,
      materialCostsInPeriod,
      expensesInPeriod,
    ],
  )

  const companyPeriodTotals = useMemo(
    () =>
      calculatePeriodTotals({
        hoursEntries: hoursInPeriod,
        outputEntries: outputInPeriod,
        salaryEntries: salaryInPeriod,
        expenses: [],
        payments: paymentsInPeriod,
      }),
    [hoursInPeriod, outputInPeriod, salaryInPeriod, paymentsInPeriod],
  )

  const totalDebtNow = useMemo(() => [...debts.values()].reduce((sum, d) => sum + d.totalDebt, 0), [debts])

  const peopleRows = useMemo(() => {
    const rows = calculateSummaryRows({
      people,
      brigades,
      hoursEntries,
      outputEntries,
      salaryEntries,
      expenses,
      payments,
      debts,
      range: { start, end },
    })
    return rows.map((row) => {
      const person = people.find((p) => p.id === row.personId)
      const hoursSum = hoursInPeriod.filter((e) => e.personId === row.personId).reduce((sum, e) => sum + e.hours, 0)
      return { ...row, hoursSum, rate: person?.hourlyRate ?? 0 }
    })
  }, [people, brigades, hoursEntries, outputEntries, salaryEntries, expenses, payments, debts, start, end, hoursInPeriod])

  const brigadeRows = useMemo(() => {
    return brigades
      .map((brigade) => {
        const memberIds = new Set(people.filter((p) => p.brigadeId === brigade.id).map((p) => p.id))
        const labor =
          hoursInPeriod.filter((e) => memberIds.has(e.personId)).reduce((sum, e) => sum + hoursEntryAmount(e), 0) +
          outputInPeriod.filter((e) => memberIds.has(e.personId)).reduce((sum, e) => sum + outputEntryAmount(e), 0) +
          salaryInPeriod.filter((e) => memberIds.has(e.personId)).reduce((sum, e) => sum + e.amount, 0)
        const brigadeExpenses = expensesInPeriod
          .filter((e) => e.brigadeIdSnapshot === brigade.id)
          .reduce((sum, e) => sum + e.amount, 0)
        return { brigade, memberCount: memberIds.size, labor, expenses: brigadeExpenses, total: labor + brigadeExpenses }
      })
      .filter((row) => row.total > 0)
      .sort((a, b) => b.total - a.total)
  }, [brigades, people, hoursInPeriod, outputInPeriod, salaryInPeriod, expensesInPeriod])

  const expensesByCategory = useMemo(() => {
    const byCategory = new Map<number, number>()
    for (const e of expensesInPeriod) {
      byCategory.set(e.categoryId, (byCategory.get(e.categoryId) ?? 0) + e.amount)
    }
    return [...byCategory.entries()]
      .map(([categoryId, amount]) => ({ categoryId, name: expenseCategories.find((c) => c.id === categoryId)?.name ?? '', amount }))
      .filter((row) => row.amount > 0)
      .sort((a, b) => b.amount - a.amount)
  }, [expensesInPeriod, expenseCategories])
  const expensesByCategoryTotal = useMemo(() => expensesByCategory.reduce((sum, r) => sum + r.amount, 0), [expensesByCategory])

  const selectedSiteProfitability =
    filterSiteId != null ? (siteProfitabilityRows.find((r) => r.site.id === filterSiteId)?.profitability ?? null) : null

  const debtTrendWindow = useMemo(() => {
    const fullTrend = calculateDebtTrend({ hoursEntries, outputEntries, salaryEntries, expenses, payments })
    const startMonth = monthOf(start)
    const endMonth = monthOf(end)
    return fullTrend.filter((point) => point.month >= startMonth && point.month <= endMonth)
  }, [hoursEntries, outputEntries, salaryEntries, expenses, payments, start, end])

  const expensesByBrigadeData = useMemo<MagnitudeDataPoint[]>(() => {
    return brigadeRows.map((row) => ({ name: row.brigade.name, value: row.total }))
  }, [brigadeRows])

  const laborCostBySiteData = useMemo<MagnitudeDataPoint[]>(() => {
    return sites
      .map((site) => {
        const cost =
          hoursInPeriod.filter((e) => e.siteId === site.id).reduce((sum, e) => sum + hoursEntryAmount(e), 0) +
          outputInPeriod.filter((e) => e.siteId === site.id).reduce((sum, e) => sum + outputEntryAmount(e), 0) +
          salaryInPeriod.filter((e) => e.siteId === site.id).reduce((sum, e) => sum + e.amount, 0)
        return { name: site.name, value: cost }
      })
      .filter((d) => d.value > 0)
      .sort((a, b) => b.value - a.value)
  }, [sites, hoursInPeriod, outputInPeriod, salaryInPeriod])

  const siteByBrigadeData = useMemo<MagnitudeDataPoint[]>(() => {
    if (filterSiteId == null) return []
    const hoursForSite = hoursInPeriod.filter((e) => e.siteId === filterSiteId)
    const outputForSite = outputInPeriod.filter((e) => e.siteId === filterSiteId)
    const salaryForSite = salaryInPeriod.filter((e) => e.siteId === filterSiteId)
    const map = new Map<number, number>()
    for (const e of hoursForSite) {
      const brigadeId = people.find((p) => p.id === e.personId)?.brigadeId
      if (brigadeId == null) continue
      map.set(brigadeId, (map.get(brigadeId) ?? 0) + hoursEntryAmount(e))
    }
    for (const e of outputForSite) {
      const brigadeId = people.find((p) => p.id === e.personId)?.brigadeId
      if (brigadeId == null) continue
      map.set(brigadeId, (map.get(brigadeId) ?? 0) + outputEntryAmount(e))
    }
    for (const e of salaryForSite) {
      const brigadeId = people.find((p) => p.id === e.personId)?.brigadeId
      if (brigadeId == null) continue
      map.set(brigadeId, (map.get(brigadeId) ?? 0) + e.amount)
    }
    return [...map.entries()]
      .map(([brigadeId, value]) => ({ name: brigades.find((b) => b.id === brigadeId)?.name ?? '', value }))
      .filter((d) => d.value > 0)
      .sort((a, b) => b.value - a.value)
  }, [filterSiteId, hoursInPeriod, outputInPeriod, salaryInPeriod, people, brigades])

  const siteByWorkTypeData = useMemo<MagnitudeDataPoint[]>(() => {
    if (filterSiteId == null) return []
    const outputForSite = outputInPeriod.filter((e) => e.siteId === filterSiteId)
    const map = new Map<number, number>()
    for (const e of outputForSite) {
      map.set(e.workTypeId, (map.get(e.workTypeId) ?? 0) + outputEntryAmount(e))
    }
    return [...map.entries()]
      .map(([workTypeId, value]) => ({ name: workTypes.find((w) => w.id === workTypeId)?.name ?? '', value }))
      .filter((d) => d.value > 0)
      .sort((a, b) => b.value - a.value)
  }, [filterSiteId, outputInPeriod, workTypes])

  return (
    <div className="mx-auto max-w-4xl bg-white p-8 text-gray-900">
      <div className="-mx-8 -mt-8 mb-6 bg-gray-900 px-8 py-6 text-white">
        <h1 className="text-3xl font-bold">{t.common.appName}</h1>
        <p className="mt-1 text-sm text-gray-300">
          {t.company.reportTitle} · {periodLabel} · {selectedSite ? selectedSite.name : t.print.allSites}
        </p>
        <p className="mt-0.5 text-xs text-gray-400">
          {t.print.generatedOn} {todayIso()}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <KpiCard
          label={t.sites.netProfit}
          value={formatMoney((selectedSiteProfitability ?? companyProfitability).netProfit)}
          accent={(selectedSiteProfitability ?? companyProfitability).netProfit >= 0 ? 'green' : 'red'}
        />
        <KpiCard label={t.people.detail.accrued} value={formatMoney(companyPeriodTotals.accrued)} accent="blue" />
        <KpiCard label={t.people.detail.paid} value={formatMoney(companyPeriodTotals.paid)} accent="blue" />
        <KpiCard label={t.overview.totalDebt} value={formatMoney(totalDebtNow)} accent={totalDebtNow > 0 ? 'red' : 'gray'} />
      </div>

      <SectionHeader>{t.company.profitabilityTitle}</SectionHeader>
      {selectedSiteProfitability ? (
        <dl className="mt-3 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
          <div>
            <dt className="text-gray-500">{t.sites.revenue}</dt>
            <dd className="font-medium tabular-nums">{formatMoney(selectedSiteProfitability.revenue)}</dd>
          </div>
          <div>
            <dt className="text-gray-500">{t.sites.laborCost}</dt>
            <dd className="font-medium tabular-nums">{formatMoney(selectedSiteProfitability.laborCost)}</dd>
          </div>
          <div>
            <dt className="text-gray-500">{t.sites.materialCost}</dt>
            <dd className="font-medium tabular-nums">{formatMoney(selectedSiteProfitability.materialCost)}</dd>
          </div>
          <div>
            <dt className="text-gray-500">{t.sites.otherExpenses}</dt>
            <dd className="font-medium tabular-nums">{formatMoney(selectedSiteProfitability.otherExpenses)}</dd>
          </div>
        </dl>
      ) : (
        <table className="mt-3 w-full border-collapse text-sm">
          <thead>
            <tr className="bg-gray-100 text-left">
              <th className="py-2 pl-2 pr-2 first:rounded-tl-md">{t.sites.name}</th>
              <th className="py-2 pr-2 text-right">{t.sites.revenue}</th>
              <th className="py-2 pr-2 text-right">{t.sites.laborCost}</th>
              <th className="py-2 pr-2 text-right">{t.sites.materialCost}</th>
              <th className="py-2 pr-2 text-right">{t.sites.otherExpenses}</th>
              <th className="py-2 pr-2 text-right last:rounded-tr-md">{t.sites.netProfit}</th>
            </tr>
          </thead>
          <tbody>
            {siteProfitabilityRows.map(({ site, profitability }, i) => (
              <tr key={site.id} className={i % 2 === 1 ? 'bg-gray-50' : ''}>
                <td className="py-1.5 pl-2 pr-2">{site.name}</td>
                <td className="py-1.5 pr-2 text-right tabular-nums">{formatMoney(profitability.revenue)}</td>
                <td className="py-1.5 pr-2 text-right tabular-nums">{formatMoney(profitability.laborCost)}</td>
                <td className="py-1.5 pr-2 text-right tabular-nums">{formatMoney(profitability.materialCost)}</td>
                <td className="py-1.5 pr-2 text-right tabular-nums">{formatMoney(profitability.otherExpenses)}</td>
                <td className="py-1.5 pr-2 text-right font-medium tabular-nums">{formatMoney(profitability.netProfit)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-gray-900 font-bold">
              <td className="py-1.5 pl-2 pr-2">{t.print.companyTotal}</td>
              <td className="py-1.5 pr-2 text-right tabular-nums">{formatMoney(companyProfitability.revenue)}</td>
              <td className="py-1.5 pr-2 text-right tabular-nums">{formatMoney(companyProfitability.laborCost)}</td>
              <td className="py-1.5 pr-2 text-right tabular-nums">{formatMoney(companyProfitability.materialCost)}</td>
              <td className="py-1.5 pr-2 text-right tabular-nums">{formatMoney(companyProfitability.otherExpenses)}</td>
              <td className="py-1.5 pr-2 text-right tabular-nums">{formatMoney(companyProfitability.netProfit)}</td>
            </tr>
          </tfoot>
        </table>
      )}

      <SectionHeader>{t.summary.title}</SectionHeader>
      <table className="mt-3 w-full border-collapse text-sm">
        <thead>
          <tr className="bg-gray-100 text-left">
            <th className="py-2 pl-2 pr-2">{t.summary.person}</th>
            <th className="py-2 pr-2">{t.people.brigade}</th>
            <th className="py-2 pr-2 text-right">{t.entry.hours}</th>
            <th className="py-2 pr-2 text-right">{t.people.hourlyRate}</th>
            <th className="py-2 pr-2 text-right">{t.people.detail.accrued}</th>
            <th className="py-2 pr-2 text-right">{t.people.detail.paid}</th>
            <th className="py-2 pr-2 text-right">{t.people.detail.totalDebt}</th>
          </tr>
        </thead>
        <tbody>
          {peopleRows.length === 0 && (
            <tr>
              <td className="py-2 pl-2 text-gray-500" colSpan={7}>
                {t.summary.noData}
              </td>
            </tr>
          )}
          {peopleRows.map((row, i) => (
            <tr key={row.personId} className={i % 2 === 1 ? 'bg-gray-50' : ''}>
              <td className="py-1.5 pl-2 pr-2">{row.name}</td>
              <td className="py-1.5 pr-2 text-gray-500">{row.brigadeName}</td>
              <td className="py-1.5 pr-2 text-right tabular-nums">{row.hoursSum}</td>
              <td className="py-1.5 pr-2 text-right tabular-nums">{row.rate}</td>
              <td className="py-1.5 pr-2 text-right tabular-nums">{formatMoney(row.totals.accrued)}</td>
              <td className="py-1.5 pr-2 text-right tabular-nums">{formatMoney(row.totals.paid)}</td>
              <td className="py-1.5 pr-2 text-right font-medium tabular-nums">{formatMoney(row.outstanding)}</td>
            </tr>
          ))}
        </tbody>
        {peopleRows.length > 0 && (
          <tfoot>
            <tr className="border-t-2 border-gray-900 font-bold">
              <td className="py-1.5 pl-2 pr-2" colSpan={4}>
                {t.print.companyTotal}
              </td>
              <td className="py-1.5 pr-2 text-right tabular-nums">
                {formatMoney(peopleRows.reduce((sum, r) => sum + r.totals.accrued, 0))}
              </td>
              <td className="py-1.5 pr-2 text-right tabular-nums">
                {formatMoney(peopleRows.reduce((sum, r) => sum + r.totals.paid, 0))}
              </td>
              <td className="py-1.5 pr-2 text-right tabular-nums">
                {formatMoney(peopleRows.reduce((sum, r) => sum + r.outstanding, 0))}
              </td>
            </tr>
          </tfoot>
        )}
      </table>

      <SectionHeader>{t.brigades.title}</SectionHeader>
      <table className="mt-3 w-full border-collapse text-sm">
        <thead>
          <tr className="bg-gray-100 text-left">
            <th className="py-2 pl-2 pr-2">{t.brigades.name}</th>
            <th className="py-2 pr-2 text-right">{t.brigades.people}</th>
            <th className="py-2 pr-2 text-right">{t.brigades.labor}</th>
            <th className="py-2 pr-2 text-right">{t.brigades.expenses}</th>
            <th className="py-2 pr-2 text-right">{t.brigades.total}</th>
          </tr>
        </thead>
        <tbody>
          {brigadeRows.length === 0 && (
            <tr>
              <td className="py-2 pl-2 text-gray-500" colSpan={5}>
                {t.brigades.noBrigades}
              </td>
            </tr>
          )}
          {brigadeRows.map((row, i) => (
            <tr key={row.brigade.id} className={i % 2 === 1 ? 'bg-gray-50' : ''}>
              <td className="py-1.5 pl-2 pr-2">{row.brigade.name}</td>
              <td className="py-1.5 pr-2 text-right tabular-nums">{row.memberCount}</td>
              <td className="py-1.5 pr-2 text-right tabular-nums">{formatMoney(row.labor)}</td>
              <td className="py-1.5 pr-2 text-right tabular-nums">{formatMoney(row.expenses)}</td>
              <td className="py-1.5 pr-2 text-right font-medium tabular-nums">{formatMoney(row.total)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <SectionHeader>{t.expenseCategories.title}</SectionHeader>
      <table className="mt-3 w-full border-collapse text-sm">
        <thead>
          <tr className="bg-gray-100 text-left">
            <th className="py-2 pl-2 pr-2">{t.expenseCategories.name}</th>
            <th className="py-2 pr-2 text-right">{t.common.amount}</th>
          </tr>
        </thead>
        <tbody>
          {expensesByCategory.length === 0 && (
            <tr>
              <td className="py-2 pl-2 text-gray-500" colSpan={2}>
                {t.common.noData}
              </td>
            </tr>
          )}
          {expensesByCategory.map((row, i) => (
            <tr key={row.categoryId} className={i % 2 === 1 ? 'bg-gray-50' : ''}>
              <td className="py-1.5 pl-2 pr-2">{row.name}</td>
              <td className="py-1.5 pr-2 text-right tabular-nums">{formatMoney(row.amount)}</td>
            </tr>
          ))}
        </tbody>
        {expensesByCategory.length > 0 && (
          <tfoot>
            <tr className="border-t-2 border-gray-900 font-bold">
              <td className="py-1.5 pl-2 pr-2">{t.print.companyTotal}</td>
              <td className="py-1.5 pr-2 text-right tabular-nums">{formatMoney(expensesByCategoryTotal)}</td>
            </tr>
          </tfoot>
        )}
      </table>

      <SectionHeader>{t.overview.totalDebt}</SectionHeader>
      <div className="mt-3">
        <DebtSummarySection />
      </div>

      {selectedSite ? (
        <>
          <SectionHeader>{t.sites.byBrigade}</SectionHeader>
          <div className="mt-3">
            {siteByBrigadeData.length > 0 ? (
              <MagnitudeBarChart data={siteByBrigadeData} theme="light" />
            ) : (
              <p className="text-sm text-gray-500">{t.overview.notEnoughData}</p>
            )}
          </div>
          <SectionHeader>{t.sites.byWorkType}</SectionHeader>
          <div className="mt-3">
            {siteByWorkTypeData.length > 0 ? (
              <MagnitudeBarChart data={siteByWorkTypeData} theme="light" />
            ) : (
              <p className="text-sm text-gray-500">{t.overview.notEnoughData}</p>
            )}
          </div>
        </>
      ) : (
        <>
          <SectionHeader>{t.overview.debtOverTime}</SectionHeader>
          <div className="mt-3">
            {debtTrendWindow.length >= 2 ? (
              <DebtTrendChart data={debtTrendWindow} theme="light" />
            ) : (
              <p className="text-sm text-gray-500">{t.overview.notEnoughData}</p>
            )}
          </div>
          <SectionHeader>{t.overview.expensesByBrigade}</SectionHeader>
          <div className="mt-3">
            {expensesByBrigadeData.length > 0 ? (
              <MagnitudeBarChart data={expensesByBrigadeData} theme="light" />
            ) : (
              <p className="text-sm text-gray-500">{t.overview.notEnoughData}</p>
            )}
          </div>
          <SectionHeader>{t.overview.laborCostBySite}</SectionHeader>
          <div className="mt-3">
            {laborCostBySiteData.length > 0 ? (
              <MagnitudeBarChart data={laborCostBySiteData} theme="light" />
            ) : (
              <p className="text-sm text-gray-500">{t.overview.notEnoughData}</p>
            )}
          </div>
        </>
      )}
    </div>
  )
}
