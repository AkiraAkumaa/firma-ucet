import { useT } from '../../i18n/I18nContext'
import { useBrigades, usePeople } from '../../db/hooks'
import { useAllPeopleDebts } from '../../domain/debt/useDebt'
import { formatMoney } from '../../shared/money'

export function DebtSummarySection() {
  const t = useT()
  const people = usePeople()
  const brigades = useBrigades()
  const debts = useAllPeopleDebts()

  const brigadeName = (id: number) => brigades.find((b) => b.id === id)?.name ?? ''
  const sorted = [...people].sort(
    (a, b) => (debts.get(b.id!)?.totalDebt ?? 0) - (debts.get(a.id!)?.totalDebt ?? 0),
  )
  const totalDebt = [...debts.values()].reduce((sum, d) => sum + d.totalDebt, 0)

  return (
    <div>
      <p className="text-sm text-gray-500">{t.overview.totalDebt}</p>
      <p className="mt-1 text-4xl font-bold">{formatMoney(totalDebt)}</p>

      <table className="mt-6 w-full border-collapse text-sm">
        <thead>
          <tr className="border-b-2 border-gray-300 text-left">
            <th className="py-2 pr-2">{t.people.name}</th>
            <th className="py-2 pr-2">{t.people.brigade}</th>
            <th className="py-2 pr-2">{t.people.type}</th>
            <th className="py-2 pr-2 text-right">{t.people.detail.totalDebt}</th>
            <th className="py-2 pr-2 text-right">{t.people.detail.oldestUnpaidMonth}</th>
            <th className="py-2 text-right">{t.people.detail.delay}</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((person) => {
            const debt = debts.get(person.id!)
            return (
              <tr key={person.id} className="border-b border-gray-200">
                <td className="py-1.5 pr-2">{person.name}</td>
                <td className="py-1.5 pr-2">{brigadeName(person.brigadeId)}</td>
                <td className="py-1.5 pr-2">{person.type === 'osvc' ? t.personType.osvc : t.personType.zamestnanec}</td>
                <td className="py-1.5 pr-2 text-right tabular-nums">{formatMoney(debt?.totalDebt ?? 0)}</td>
                <td className="py-1.5 pr-2 text-right tabular-nums">{debt?.oldestUnpaidMonth ?? '—'}</td>
                <td className="py-1.5 text-right tabular-nums">
                  {debt?.oldestUnpaidMonth ? t.overview.delayDays(debt.delayDays) : '—'}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
