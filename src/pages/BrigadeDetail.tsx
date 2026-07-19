import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useT } from '../i18n/I18nContext'
import { useBrigades, useExpenses, useHoursEntries, useOutputEntries, usePeople, useWorkHourEntries } from '../db/hooks'
import { useAllPeopleDebts } from '../domain/debt/useDebt'
import { calculateBrigadeMonthlyBreakdown } from '../domain/brigades/calculateBrigadeSummary'
import { hoursEntryAmount } from '../domain/hours/calc'
import { outputEntryAmount } from '../domain/output/calc'
import { groupWorkHoursByMonth, summarizeWorkHours } from '../domain/analytics/summary'
import { formatMoney } from '../shared/money'
import { Card } from '../shared/ui/Card'
import { Button } from '../shared/ui/Button'
import { TextField } from '../shared/ui/TextField'
import { ConfirmDialog } from '../shared/ui/ConfirmDialog'
import { ROUTES } from '../app/routes'
import { db } from '../db/db'
import { deleteBrigade } from '../db/cascadeDelete'
import { exportBrigadeToExcel } from '../export/exportExcel'

export function BrigadeDetail() {
  const t = useT()
  const navigate = useNavigate()
  const { id } = useParams()
  const brigadeId = Number(id)

  const brigades = useBrigades()
  const people = usePeople()
  const hoursEntries = useHoursEntries()
  const outputEntries = useOutputEntries()
  const expenses = useExpenses()
  const debts = useAllPeopleDebts()
  const workHourEntries = useWorkHourEntries()

  const [renaming, setRenaming] = useState(false)
  const [nameDraft, setNameDraft] = useState('')
  const [deleting, setDeleting] = useState(false)

  const brigade = brigades.find((b) => b.id === brigadeId)
  const members = useMemo(() => people.filter((p) => p.brigadeId === brigadeId), [people, brigadeId])
  const memberIds = useMemo(() => new Set(members.map((p) => p.id)), [members])

  const brigadeHours = useMemo(() => hoursEntries.filter((e) => memberIds.has(e.personId)), [hoursEntries, memberIds])
  const brigadeOutput = useMemo(() => outputEntries.filter((e) => memberIds.has(e.personId)), [outputEntries, memberIds])
  const brigadeExpenses = useMemo(() => expenses.filter((e) => e.brigadeIdSnapshot === brigadeId), [expenses, brigadeId])

  const labor = useMemo(
    () =>
      brigadeHours.reduce((sum, e) => sum + hoursEntryAmount(e), 0) + brigadeOutput.reduce((sum, e) => sum + outputEntryAmount(e), 0),
    [brigadeHours, brigadeOutput],
  )
  const expensesTotal = useMemo(() => brigadeExpenses.reduce((sum, e) => sum + e.amount, 0), [brigadeExpenses])

  const monthly = useMemo(
    () => calculateBrigadeMonthlyBreakdown({ hoursEntries: brigadeHours, outputEntries: brigadeOutput, expenses: brigadeExpenses }),
    [brigadeHours, brigadeOutput, brigadeExpenses],
  )

  const brigadeWorkHours = useMemo(() => workHourEntries.filter((e) => memberIds.has(e.personId)), [workHourEntries, memberIds])
  const workHoursTotals = useMemo(() => summarizeWorkHours(brigadeWorkHours), [brigadeWorkHours])
  const workHoursByMonth = useMemo(() => groupWorkHoursByMonth(brigadeWorkHours), [brigadeWorkHours])

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

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <p className="text-sm text-gray-500">{t.brigades.labor}</p>
          <p className="mt-1 text-2xl font-bold tabular-nums">{formatMoney(labor)}</p>
        </Card>
        <Card>
          <p className="text-sm text-gray-500">{t.brigades.expenses}</p>
          <p className="mt-1 text-2xl font-bold tabular-nums">{formatMoney(expensesTotal)}</p>
        </Card>
        <Card>
          <p className="text-sm text-gray-500">{t.brigades.total}</p>
          <p className="mt-1 text-2xl font-bold tabular-nums">{formatMoney(labor + expensesTotal)}</p>
        </Card>
      </div>

      <h2 className="mt-6 text-lg font-semibold">{t.brigades.monthlyBreakdown}</h2>
      <Card className="mt-2 overflow-x-auto p-0">
        <table className="w-full min-w-[480px] text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-left text-gray-500 dark:border-gray-800">
              <th className="px-4 py-2 font-medium">{t.people.detail.month}</th>
              <th className="px-4 py-2 text-right font-medium">{t.brigades.labor}</th>
              <th className="px-4 py-2 text-right font-medium">{t.brigades.expenses}</th>
              <th className="px-4 py-2 text-right font-medium">{t.brigades.total}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {monthly.length === 0 && (
              <tr>
                <td className="px-4 py-3 text-gray-500" colSpan={4}>
                  {t.common.noData}
                </td>
              </tr>
            )}
            {monthly.map((m) => (
              <tr key={m.month}>
                <td className="px-4 py-2">{m.month}</td>
                <td className="px-4 py-2 text-right tabular-nums">{formatMoney(m.labor)}</td>
                <td className="px-4 py-2 text-right tabular-nums">{formatMoney(m.expenses)}</td>
                <td className="px-4 py-2 text-right font-medium tabular-nums">{formatMoney(m.total)}</td>
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

      <h2 className="mt-6 text-lg font-semibold">{t.brigades.members}</h2>
      <Card className="mt-2 p-0">
        <ul className="divide-y divide-gray-100 dark:divide-gray-800">
          {members.length === 0 && <li className="p-4 text-sm text-gray-500">{t.common.noData}</li>}
          {members.map((person) => (
            <li key={person.id}>
              <Link
                to={ROUTES.personDetail(person.id!)}
                className="flex items-center justify-between gap-3 p-4 text-sm hover:bg-gray-50 dark:hover:bg-gray-800/50"
              >
                <span className="font-medium">{person.name}</span>
                <span
                  className={`tabular-nums ${
                    (debts.get(person.id!)?.totalDebt ?? 0) > 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-400'
                  }`}
                >
                  {formatMoney(debts.get(person.id!)?.totalDebt ?? 0)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </Card>

      <p className="mt-3 text-xs text-gray-400">{t.brigades.renameHint}</p>

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
