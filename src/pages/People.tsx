import { Link } from 'react-router-dom'
import { useT } from '../i18n/I18nContext'
import { useBrigades, usePeople } from '../db/hooks'
import { useAllPeopleDebts } from '../domain/debt/useDebt'
import { formatMoney } from '../shared/money'
import { Card } from '../shared/ui/Card'
import { ROUTES } from '../app/routes'

export function People() {
  const t = useT()
  const people = usePeople()
  const brigades = useBrigades()
  const debts = useAllPeopleDebts()

  const brigadeName = (id: number) => brigades.find((b) => b.id === id)?.name ?? ''

  const sorted = [...people].sort((a, b) => {
    const debtA = debts.get(a.id!)?.totalDebt ?? 0
    const debtB = debts.get(b.id!)?.totalDebt ?? 0
    return debtB - debtA
  })

  return (
    <div>
      <h1 className="text-2xl font-semibold">{t.people.title}</h1>

      <Card className="mt-4 p-0">
        <ul className="divide-y divide-gray-100 dark:divide-gray-800">
          {sorted.length === 0 && <li className="p-4 text-sm text-gray-500">{t.people.noPeople}</li>}
          {sorted.map((person) => {
            const debt = debts.get(person.id!)?.totalDebt ?? 0
            return (
              <li key={person.id}>
                <Link
                  to={ROUTES.personDetail(person.id!)}
                  className="flex items-center justify-between gap-3 p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                >
                  <span>
                    <span className="font-medium">{person.name}</span>{' '}
                    <span className="text-sm text-gray-500">· {brigadeName(person.brigadeId)}</span>
                  </span>
                  <span
                    className={`text-lg font-semibold tabular-nums ${
                      debt > 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-400'
                    }`}
                  >
                    {formatMoney(debt)}
                  </span>
                </Link>
              </li>
            )
          })}
        </ul>
      </Card>
    </div>
  )
}
