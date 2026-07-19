import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useT } from '../i18n/I18nContext'
import { useBrigades, useExpenses, useHoursEntries, useOutputEntries, usePeople } from '../db/hooks'
import { hoursEntryAmount } from '../domain/hours/calc'
import { outputEntryAmount } from '../domain/output/calc'
import { formatMoney } from '../shared/money'
import { Card } from '../shared/ui/Card'
import { ROUTES } from '../app/routes'

interface BrigadeSummary {
  id: number
  name: string
  memberNames: string[]
  labor: number
  expenses: number
  total: number
}

export function Brigades() {
  const t = useT()
  const brigades = useBrigades()
  const people = usePeople()
  const hoursEntries = useHoursEntries()
  const outputEntries = useOutputEntries()
  const expenses = useExpenses()

  const summaries = useMemo<BrigadeSummary[]>(() => {
    return brigades.map((brigade) => {
      const members = people.filter((p) => p.brigadeId === brigade.id)
      const memberIds = new Set(members.map((p) => p.id))

      const labor =
        hoursEntries.filter((e) => memberIds.has(e.personId)).reduce((sum, e) => sum + hoursEntryAmount(e), 0) +
        outputEntries.filter((e) => memberIds.has(e.personId)).reduce((sum, e) => sum + outputEntryAmount(e), 0)

      const brigadeExpenses = expenses
        .filter((e) => e.brigadeIdSnapshot === brigade.id)
        .reduce((sum, e) => sum + e.amount, 0)

      return {
        id: brigade.id!,
        name: brigade.name,
        memberNames: members.map((p) => p.name),
        labor,
        expenses: brigadeExpenses,
        total: labor + brigadeExpenses,
      }
    })
  }, [brigades, people, hoursEntries, outputEntries, expenses])

  return (
    <div>
      <h1 className="text-2xl font-semibold">{t.brigades.title}</h1>

      {summaries.length === 0 && <p className="mt-4 text-sm text-gray-500">{t.brigades.noBrigades}</p>}

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {summaries.map((brigade) => (
          <Link key={brigade.id} to={ROUTES.brigadeDetail(brigade.id)}>
            <Card className="h-full transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50">
              <div className="flex items-baseline justify-between">
                <h2 className="text-lg font-semibold">{brigade.name}</h2>
                <span className="text-lg font-bold tabular-nums">{formatMoney(brigade.total)}</span>
              </div>
              <p className="mt-1 text-sm text-gray-500">
                {t.brigades.labor}: {formatMoney(brigade.labor)} · {t.brigades.expenses}: {formatMoney(brigade.expenses)}
              </p>
              <p className="mt-3 text-sm font-medium text-gray-700 dark:text-gray-300">{t.brigades.members}</p>
              <p className="text-sm text-gray-500">
                {brigade.memberNames.length > 0 ? brigade.memberNames.join(', ') : t.common.noData}
              </p>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
