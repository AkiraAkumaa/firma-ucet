import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useT } from '../i18n/I18nContext'
import {
  useBrigades,
  useExpenseCategories,
  useExpenses,
  useHoursEntries,
  useOutputEntries,
  usePayments,
  usePeople,
  useSalaryEntries,
  useSites,
  useWorkHourEntries,
  useWorkTypes,
} from '../db/hooks'
import { usePersonDebt } from '../domain/debt/useDebt'
import { hoursEntryAmount } from '../domain/hours/calc'
import { outputEntryAmount } from '../domain/output/calc'
import { groupWorkHoursByMonth, summarizeWorkHours } from '../domain/analytics/summary'
import { inRange, periodRange, stepPeriod, type PeriodValue } from '../domain/reports/period'
import { formatMoney } from '../shared/money'
import { Card } from '../shared/ui/Card'
import { Button } from '../shared/ui/Button'
import { ConfirmDialog } from '../shared/ui/ConfirmDialog'
import { StatTile, type StatDelta } from '../shared/ui/StatTile'
import { PeriodSwitcher } from '../shared/ui/PeriodSwitcher'
import { BrigadeHistorySection } from './person/BrigadeHistorySection'
import { ROUTES } from '../app/routes'
import { db } from '../db/db'
import { exportPersonToExcel } from '../export/exportExcel'
import { EditHistoryEntryModal, type EditableHistoryEntry } from './person/EditHistoryEntryModal'

async function deleteHistoryEntry(target: EditableHistoryEntry) {
  const id = target.entry.id!
  if (target.kind === 'hours') await db.hoursEntries.delete(id)
  else if (target.kind === 'output') await db.outputEntries.delete(id)
  else if (target.kind === 'salary') await db.salaryEntries.delete(id)
  else if (target.kind === 'expense') await db.expenses.delete(id)
  else await db.payments.delete(id)
}

interface HistoryRow {
  key: string
  date: string
  type: string
  description: string
  amount: number
  attachment?: Blob
  edit: EditableHistoryEntry
}

function viewAttachment(blob: Blob) {
  const url = URL.createObjectURL(blob)
  window.open(url, '_blank')
  setTimeout(() => URL.revokeObjectURL(url), 60_000)
}

function currentMonthValue(): PeriodValue {
  const now = new Date()
  return { type: 'month', year: now.getFullYear(), value: now.getMonth() + 1 }
}

function delta(current: number, previous: number, label: string): StatDelta | undefined {
  if (previous === 0) return undefined
  return { percent: ((current - previous) / Math.abs(previous)) * 100, label }
}

export function PersonDetail() {
  const t = useT()
  const { id } = useParams()
  const personId = Number(id)
  const [editingTarget, setEditingTarget] = useState<EditableHistoryEntry | null>(null)
  const [deletingTarget, setDeletingTarget] = useState<EditableHistoryEntry | null>(null)

  const people = usePeople()
  const brigades = useBrigades()
  const sites = useSites()
  const workTypes = useWorkTypes()
  const expenseCategories = useExpenseCategories()
  const hoursEntries = useHoursEntries()
  const outputEntries = useOutputEntries()
  const expenses = useExpenses()
  const payments = usePayments()
  const salaryEntries = useSalaryEntries()
  const workHourEntries = useWorkHourEntries()

  const [period, setPeriod] = useState<PeriodValue>(currentMonthValue)

  const person = people.find((p) => p.id === personId)
  const debt = usePersonDebt(personId)

  const range = useMemo(() => periodRange(period.type, period.year, period.value), [period])
  const previousRange = useMemo(() => {
    const previous = stepPeriod(period, -1)
    return periodRange(previous.type, previous.year, previous.value)
  }, [period])

  const periodStats = useMemo(() => {
    const withinRange = (date: string, r: { start: string; end: string }) => inRange(date, r.start, r.end)
    const compute = (r: { start: string; end: string }) => {
      const hoursInPeriod = hoursEntries.filter((e) => e.personId === personId && withinRange(e.date, r))
      const outputInPeriod = outputEntries.filter((e) => e.personId === personId && withinRange(e.date, r))
      const paymentsInPeriod = payments.filter((p) => p.personId === personId && withinRange(p.date, r))
      const rawHours = hoursInPeriod.reduce((sum, e) => sum + e.hours, 0)
      const accrued = hoursInPeriod.reduce((sum, e) => sum + hoursEntryAmount(e), 0) + outputInPeriod.reduce((sum, e) => sum + outputEntryAmount(e), 0)
      const paid = paymentsInPeriod.reduce((sum, p) => sum + p.amount, 0)
      const siteIds = new Set([...hoursInPeriod.map((e) => e.siteId), ...outputInPeriod.map((e) => e.siteId)])
      const siteBreakdown = [...siteIds]
        .map((siteId) => {
          const cost =
            hoursInPeriod.filter((e) => e.siteId === siteId).reduce((sum, e) => sum + hoursEntryAmount(e), 0) +
            outputInPeriod.filter((e) => e.siteId === siteId).reduce((sum, e) => sum + outputEntryAmount(e), 0)
          const hours = hoursInPeriod.filter((e) => e.siteId === siteId).reduce((sum, e) => sum + e.hours, 0)
          return { siteId, name: sites.find((s) => s.id === siteId)?.name ?? '', hours, cost }
        })
        .sort((a, b) => b.cost - a.cost)
      return { rawHours, accrued, paid, sitesCount: siteIds.size, siteBreakdown }
    }
    return { current: compute(range), previous: compute(previousRange) }
  }, [hoursEntries, outputEntries, payments, personId, sites, range, previousRange])

  const personWorkHours = useMemo(() => workHourEntries.filter((e) => e.personId === personId), [workHourEntries, personId])
  const workHoursTotals = useMemo(() => summarizeWorkHours(personWorkHours), [personWorkHours])
  const workHoursByMonth = useMemo(() => groupWorkHoursByMonth(personWorkHours), [personWorkHours])

  const siteName = (siteId: number) => sites.find((s) => s.id === siteId)?.name ?? ''
  const workTypeName = (workTypeId: number) => workTypes.find((w) => w.id === workTypeId)?.name ?? ''
  const categoryName = (categoryId: number) => expenseCategories.find((c) => c.id === categoryId)?.name ?? ''

  const history = useMemo<HistoryRow[]>(() => {
    const rows: HistoryRow[] = []
    for (const e of hoursEntries) {
      if (e.personId !== personId) continue
      rows.push({
        key: `hours-${e.id}`,
        date: e.date,
        type: t.people.detail.historyHours,
        description: `${siteName(e.siteId)} · ${e.hours} h`,
        amount: hoursEntryAmount(e),
        attachment: e.attachment?.blob,
        edit: { kind: 'hours', entry: e },
      })
    }
    for (const e of outputEntries) {
      if (e.personId !== personId) continue
      rows.push({
        key: `output-${e.id}`,
        date: e.date,
        type: t.people.detail.historyOutput,
        description: `${siteName(e.siteId)} · ${workTypeName(e.workTypeId)} · ${e.quantity}`,
        amount: outputEntryAmount(e),
        attachment: e.attachment?.blob,
        edit: { kind: 'output', entry: e },
      })
    }
    for (const e of expenses) {
      if (e.paidByPersonId !== personId) continue
      rows.push({
        key: `expense-${e.id}`,
        date: e.date,
        type: t.people.detail.historyExpense,
        description: [categoryName(e.categoryId), e.note].filter(Boolean).join(' · '),
        amount: e.amount,
        attachment: e.attachment?.blob,
        edit: { kind: 'expense', entry: e },
      })
    }
    for (const p of payments) {
      if (p.personId !== personId) continue
      rows.push({
        key: `payment-${p.id}`,
        date: p.date,
        type: t.people.detail.historyPayment,
        description: '',
        amount: -p.amount,
        edit: { kind: 'payment', entry: p },
      })
    }
    for (const e of salaryEntries) {
      if (e.personId !== personId) continue
      rows.push({
        key: `salary-${e.id}`,
        date: e.date,
        type: t.people.detail.historySalary,
        description: [e.siteId != null ? siteName(e.siteId) : '', e.note].filter(Boolean).join(' · '),
        amount: e.amount,
        attachment: e.attachment?.blob,
        edit: { kind: 'salary', entry: e },
      })
    }
    return rows.sort((a, b) => b.date.localeCompare(a.date))
  }, [hoursEntries, outputEntries, expenses, payments, salaryEntries, personId, sites, workTypes, expenseCategories])

  if (!person) {
    return <p className="text-sm text-gray-500">{t.common.noData}</p>
  }

  const brigadeName = brigades.find((b) => b.id === person.brigadeId)?.name ?? ''

  return (
    <div>
      <Link to={ROUTES.people} className="text-sm text-gray-500 hover:underline">
        ← {t.common.back}
      </Link>

      <div className="mt-1 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">{person.name}</h1>
          <p className="text-sm text-gray-500">
            {brigadeName} · {person.type === 'osvc' ? t.personType.osvc : t.personType.zamestnanec}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => exportPersonToExcel(personId, t)}>
            {t.backup.exportExcel}
          </Button>
          <Button variant="secondary" onClick={() => window.open(ROUTES.printPerson(personId), '_blank')}>
            {t.backup.exportPdf}
          </Button>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card>
          <p className="text-sm text-gray-500">{t.people.detail.totalDebt}</p>
          <p className="mt-1 text-3xl font-bold tabular-nums text-red-600 dark:text-red-400">{formatMoney(debt.totalDebt)}</p>
        </Card>
        <Card>
          <p className="text-sm text-gray-500">{t.people.detail.oldestUnpaidMonth}</p>
          {debt.oldestUnpaidMonth ? (
            <>
              <p className="mt-1 text-xl font-semibold">{debt.oldestUnpaidMonth}</p>
              <p className="text-sm text-gray-500">
                {t.people.detail.delay}: {t.overview.delayDays(debt.delayDays)}
              </p>
            </>
          ) : (
            <p className="mt-1 text-xl font-semibold text-gray-400">{t.people.detail.noDebt}</p>
          )}
        </Card>
      </div>

      <PeriodSwitcher value={period} onChange={setPeriod} className="mt-6" />

      <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          label={t.entry.hours}
          value={String(periodStats.current.rawHours)}
          mono
          delta={delta(periodStats.current.rawHours, periodStats.previous.rawHours, t.common.vsPreviousPeriod(period.type))}
        />
        <StatTile
          label={t.people.detail.accrued}
          value={formatMoney(periodStats.current.accrued)}
          mono
          delta={delta(periodStats.current.accrued, periodStats.previous.accrued, t.common.vsPreviousPeriod(period.type))}
        />
        <StatTile label={t.people.detail.paid} value={formatMoney(periodStats.current.paid)} mono />
        <StatTile label={t.overview.activeSites} value={String(periodStats.current.sitesCount)} mono />
      </div>

      {periodStats.current.siteBreakdown.length > 0 && (
        <>
          <h2 className="mt-6 text-lg font-semibold">{t.sites.title}</h2>
          <Card className="mt-2 p-0">
            <ul className="divide-y divide-gray-100 dark:divide-gray-800">
              {periodStats.current.siteBreakdown.map((row) => (
                <li key={row.siteId} className="flex items-center justify-between gap-3 p-4 text-sm">
                  <span className="font-medium">{row.name}</span>
                  <span className="tabular-nums text-gray-500">
                    {row.hours} {t.common.hoursShort} · {formatMoney(row.cost)}
                  </span>
                </li>
              ))}
            </ul>
          </Card>
        </>
      )}

      <h2 className="mt-6 text-lg font-semibold">{t.people.detail.monthlyBreakdown}</h2>
      <Card className="mt-2 overflow-x-auto p-0">
        <table className="w-full min-w-[480px] text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-left text-gray-500 dark:border-gray-800">
              <th className="px-4 py-2 font-medium">{t.people.detail.month}</th>
              <th className="px-4 py-2 text-right font-medium">{t.people.detail.accrued}</th>
              <th className="px-4 py-2 text-right font-medium">{t.people.detail.expenses}</th>
              <th className="px-4 py-2 text-right font-medium">{t.people.detail.paid}</th>
              <th className="px-4 py-2 text-right font-medium">{t.people.detail.remaining}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {debt.months.length === 0 && (
              <tr>
                <td className="px-4 py-3 text-gray-500" colSpan={5}>
                  {t.common.noData}
                </td>
              </tr>
            )}
            {debt.months.map((month) => (
              <tr key={month.month}>
                <td className="px-4 py-2">{month.month}</td>
                <td className="px-4 py-2 text-right tabular-nums">{formatMoney(month.accrued)}</td>
                <td className="px-4 py-2 text-right tabular-nums">{formatMoney(month.expenses)}</td>
                <td className="px-4 py-2 text-right tabular-nums">{formatMoney(month.paid)}</td>
                <td className="px-4 py-2 text-right font-medium tabular-nums">{formatMoney(month.remaining)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <div className="mt-6">
        <h2 className="text-lg font-semibold">{t.analytics.personHours}</h2>
        <p className="mt-1 text-xs text-gray-500">{t.analytics.hoursHint}</p>
        <Card className="mt-2">
          {workHoursTotals.total === 0 ? (
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
          )}
        </Card>
        {workHoursByMonth.length > 0 && (
            <Card className="mt-2 overflow-x-auto p-0">
              <table className="w-full min-w-[420px] text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-left text-gray-500 dark:border-gray-800">
                    <th className="px-4 py-2 font-medium">{t.people.detail.month}</th>
                    <th className="px-4 py-2 text-right font-medium">{t.analytics.categoryArmovani}</th>
                    <th className="px-4 py-2 text-right font-medium">{t.analytics.categoryMonolit}</th>
                    <th className="px-4 py-2 text-right font-medium">{t.common.total}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {workHoursByMonth.map((row) => (
                    <tr key={row.month}>
                      <td className="px-4 py-2">{row.month}</td>
                      <td className="px-4 py-2 text-right tabular-nums">{row.armovani}</td>
                      <td className="px-4 py-2 text-right tabular-nums">{row.monolit}</td>
                      <td className="px-4 py-2 text-right font-medium tabular-nums">{row.total}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          )}
        </div>

      <BrigadeHistorySection personId={personId} />

      <h2 className="mt-6 text-lg font-semibold">{t.people.detail.history}</h2>
      <Card className="mt-2 p-0">
        <ul className="divide-y divide-gray-100 dark:divide-gray-800">
          {history.length === 0 && <li className="p-4 text-sm text-gray-500">{t.common.noData}</li>}
          {history.map((row) => (
            <li key={row.key} className="flex items-center justify-between gap-3 p-4 text-sm">
              <span>
                <span className="text-gray-500">{row.date}</span> · <span className="font-medium">{row.type}</span>{' '}
                {row.description && <span className="text-gray-500">· {row.description}</span>}
                {row.attachment && (
                  <>
                    {' · '}
                    <button
                      type="button"
                      onClick={() => viewAttachment(row.attachment!)}
                      className="text-blue-600 underline dark:text-blue-400"
                    >
                      {t.entry.attachment}
                    </button>
                  </>
                )}
              </span>
              <span className="flex items-center gap-3">
                <span className={`tabular-nums ${row.amount < 0 ? 'text-green-600 dark:text-green-400' : ''}`}>
                  {row.amount < 0 ? '−' : ''}
                  {formatMoney(Math.abs(row.amount))}
                </span>
                <button
                  type="button"
                  onClick={() => setEditingTarget(row.edit)}
                  className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                >
                  {t.common.edit}
                </button>
                <button
                  type="button"
                  onClick={() => setDeletingTarget(row.edit)}
                  className="text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                >
                  {t.common.delete}
                </button>
              </span>
            </li>
          ))}
        </ul>
      </Card>

      <EditHistoryEntryModal target={editingTarget} onClose={() => setEditingTarget(null)} />

      <ConfirmDialog
        open={deletingTarget != null}
        title={t.common.confirmDeleteTitle}
        body={t.common.confirmDeleteBody}
        danger
        onConfirm={async () => {
          if (deletingTarget) await deleteHistoryEntry(deletingTarget)
          setDeletingTarget(null)
        }}
        onCancel={() => setDeletingTarget(null)}
      />
    </div>
  )
}
