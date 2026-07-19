import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useT } from '../i18n/I18nContext'
import { useBrigades, useExpenses, useHoursEntries, useOutputEntries, usePeople, useSites, useWorkHourEntries } from '../db/hooks'
import { useAllPeopleDebts } from '../domain/debt/useDebt'
import { hoursEntryAmount } from '../domain/hours/calc'
import { outputEntryAmount } from '../domain/output/calc'
import { groupWorkHoursByMonth, summarizeWorkHours } from '../domain/analytics/summary'
import { inRange, periodRange, stepPeriod, type PeriodValue } from '../domain/reports/period'
import { formatMoney } from '../shared/money'
import { Card } from '../shared/ui/Card'
import { Button } from '../shared/ui/Button'
import { TextField } from '../shared/ui/TextField'
import { ConfirmDialog } from '../shared/ui/ConfirmDialog'
import { StatTile, type StatDelta } from '../shared/ui/StatTile'
import { PeriodSwitcher } from '../shared/ui/PeriodSwitcher'
import { ROUTES } from '../app/routes'
import { db } from '../db/db'
import { deleteBrigade } from '../db/cascadeDelete'
import { exportBrigadeToExcel } from '../export/exportExcel'

function currentMonthValue(): PeriodValue {
  const now = new Date()
  return { type: 'month', year: now.getFullYear(), value: now.getMonth() + 1 }
}

function delta(current: number, previous: number, label: string, positiveIsGood = true): StatDelta | undefined {
  if (previous === 0) return undefined
  return { percent: ((current - previous) / Math.abs(previous)) * 100, label, positiveIsGood }
}

export function BrigadeDetail() {
  const t = useT()
  const navigate = useNavigate()
  const { id } = useParams()
  const brigadeId = Number(id)

  const brigades = useBrigades()
  const people = usePeople()
  const sites = useSites()
  const hoursEntries = useHoursEntries()
  const outputEntries = useOutputEntries()
  const expenses = useExpenses()
  const debts = useAllPeopleDebts()
  const workHourEntries = useWorkHourEntries()

  const [renaming, setRenaming] = useState(false)
  const [nameDraft, setNameDraft] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [period, setPeriod] = useState<PeriodValue>(currentMonthValue)

  const brigade = brigades.find((b) => b.id === brigadeId)
  const members = useMemo(() => people.filter((p) => p.brigadeId === brigadeId), [people, brigadeId])
  const memberIds = useMemo(() => new Set(members.map((p) => p.id)), [members])

  const brigadeHours = useMemo(() => hoursEntries.filter((e) => memberIds.has(e.personId)), [hoursEntries, memberIds])
  const brigadeOutput = useMemo(() => outputEntries.filter((e) => memberIds.has(e.personId)), [outputEntries, memberIds])
  const brigadeExpenses = useMemo(() => expenses.filter((e) => e.brigadeIdSnapshot === brigadeId), [expenses, brigadeId])

  const range = useMemo(() => periodRange(period.type, period.year, period.value), [period])
  const previousRange = useMemo(() => {
    const previous = stepPeriod(period, -1)
    return periodRange(previous.type, previous.year, previous.value)
  }, [period])

  const periodStats = useMemo(() => {
    const withinRange = (date: string, r: { start: string; end: string }) => inRange(date, r.start, r.end)

    const compute = (r: { start: string; end: string }) => {
      const hoursInPeriod = brigadeHours.filter((e) => withinRange(e.date, r))
      const outputInPeriod = brigadeOutput.filter((e) => withinRange(e.date, r))
      const expensesInPeriod = brigadeExpenses.filter((e) => withinRange(e.date, r))
      const rawHours = hoursInPeriod.reduce((sum, e) => sum + e.hours, 0)
      const laborCost = hoursInPeriod.reduce((sum, e) => sum + hoursEntryAmount(e), 0) + outputInPeriod.reduce((sum, e) => sum + outputEntryAmount(e), 0)
      const expensesTotal = expensesInPeriod.reduce((sum, e) => sum + e.amount, 0)
      const activeSiteIds = new Set([...hoursInPeriod.map((e) => e.siteId), ...outputInPeriod.map((e) => e.siteId)])

      const siteBreakdown = [...activeSiteIds]
        .map((siteId) => {
          const cost =
            hoursInPeriod.filter((e) => e.siteId === siteId).reduce((sum, e) => sum + hoursEntryAmount(e), 0) +
            outputInPeriod.filter((e) => e.siteId === siteId).reduce((sum, e) => sum + outputEntryAmount(e), 0)
          const hours = hoursInPeriod.filter((e) => e.siteId === siteId).reduce((sum, e) => sum + e.hours, 0)
          return { siteId, name: sites.find((s) => s.id === siteId)?.name ?? '', hours, cost }
        })
        .sort((a, b) => b.cost - a.cost)

      return { rawHours, laborCost, expensesTotal, activeSitesCount: activeSiteIds.size, siteBreakdown }
    }

    return { current: compute(range), previous: compute(previousRange) }
  }, [brigadeHours, brigadeOutput, brigadeExpenses, sites, range, previousRange])

  const brigadeWorkHours = useMemo(() => workHourEntries.filter((e) => memberIds.has(e.personId)), [workHourEntries, memberIds])
  const workHoursTotals = useMemo(() => summarizeWorkHours(brigadeWorkHours), [brigadeWorkHours])
  const workHoursByMonth = useMemo(() => groupWorkHoursByMonth(brigadeWorkHours), [brigadeWorkHours])

  const memberPeriodStats = useMemo(() => {
    const withinRange = (date: string) => inRange(date, range.start, range.end)
    return members.map((person) => {
      const personHours = brigadeHours.filter((e) => e.personId === person.id && withinRange(e.date))
      const personOutput = brigadeOutput.filter((e) => e.personId === person.id && withinRange(e.date))
      const rawHours = personHours.reduce((sum, e) => sum + e.hours, 0)
      const cost = personHours.reduce((sum, e) => sum + hoursEntryAmount(e), 0) + personOutput.reduce((sum, e) => sum + outputEntryAmount(e), 0)
      return { person, rawHours, cost }
    })
  }, [members, brigadeHours, brigadeOutput, range])

  if (!brigade) {
    return <p className="text-sm text-gray-500">{t.common.noData}</p>
  }

  const startRename = () => {
    setNameDraft(brigade.name)
    setRenaming(true)
  }

  const saveRename = async () => {
    const trimmed = nameDraft.trim()
    if (!trimmed) return
    await db.brigades.update(brigadeId, { name: trimmed })
    setRenaming(false)
  }

  const confirmDelete = async () => {
    await deleteBrigade(brigadeId)
    setDeleting(false)
    navigate(ROUTES.brigades)
  }

  return (
    <div>
      <Link to={ROUTES.brigades} className="text-sm text-gray-500 hover:underline">
        ← {t.common.back}
      </Link>

      <div className="mt-1 flex flex-wrap items-start justify-between gap-3">
        <div>
          {renaming ? (
            <div className="flex items-center gap-2">
              <TextField label="" value={nameDraft} onChange={(e) => setNameDraft(e.target.value)} autoFocus />
              <Button onClick={saveRename}>{t.common.save}</Button>
              <Button variant="ghost" onClick={() => setRenaming(false)}>
                {t.common.cancel}
              </Button>
            </div>
          ) : (
            <h1 className="text-2xl font-semibold">{brigade.name}</h1>
          )}
          <p className="mt-1 text-sm text-gray-500">
            {t.brigades.people}: {members.length}
          </p>
        </div>
        <div className="flex gap-2">
          {!renaming && (
            <Button variant="secondary" onClick={startRename}>
              {t.common.edit}
            </Button>
          )}
          <Button variant="secondary" onClick={() => exportBrigadeToExcel(brigadeId, t)}>
            {t.backup.exportExcel}
          </Button>
          <Button variant="secondary" onClick={() => window.open(ROUTES.printBrigade(brigadeId), '_blank')}>
            {t.backup.exportPdf}
          </Button>
          <Button variant="danger" onClick={() => setDeleting(true)}>
            {t.common.delete}
          </Button>
        </div>
      </div>

      <PeriodSwitcher value={period} onChange={setPeriod} className="mt-4" />

      <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          label={t.entry.hours}
          value={String(periodStats.current.rawHours)}
          mono
          delta={delta(periodStats.current.rawHours, periodStats.previous.rawHours, t.common.vsPreviousPeriod(period.type))}
        />
        <StatTile
          label={t.brigades.labor}
          value={formatMoney(periodStats.current.laborCost)}
          mono
          delta={delta(periodStats.current.laborCost, periodStats.previous.laborCost, t.common.vsPreviousPeriod(period.type))}
        />
        <StatTile label={t.brigades.expenses} value={formatMoney(periodStats.current.expensesTotal)} mono />
        <StatTile label={t.overview.activeSites} value={String(periodStats.current.activeSitesCount)} mono />
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

      <h2 className="mt-6 text-lg font-semibold">{t.brigades.members}</h2>
      <Card className="mt-2 p-0">
        <ul className="divide-y divide-gray-100 dark:divide-gray-800">
          {members.length === 0 && <li className="p-4 text-sm text-gray-500">{t.common.noData}</li>}
          {memberPeriodStats.map(({ person, rawHours, cost }) => (
            <li key={person.id}>
              <Link
                to={ROUTES.personDetail(person.id!)}
                className="flex items-center justify-between gap-3 p-4 text-sm hover:bg-gray-50 dark:hover:bg-gray-800/50"
              >
                <span className="font-medium">{person.name}</span>
                <span className="flex items-center gap-3 tabular-nums">
                  <span className="text-gray-500">
                    {rawHours} {t.common.hoursShort} · {formatMoney(cost)}
                  </span>
                  <span className={(debts.get(person.id!)?.totalDebt ?? 0) > 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-400'}>
                    {formatMoney(debts.get(person.id!)?.totalDebt ?? 0)}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
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

      <p className="mt-6 text-xs text-gray-400">{t.brigades.renameHint}</p>

      <ConfirmDialog
        open={deleting}
        title={t.common.confirmDeleteTitle}
        body={t.brigades.deleteWarning(members.length)}
        danger
        onConfirm={confirmDelete}
        onCancel={() => setDeleting(false)}
      />
    </div>
  )
}
