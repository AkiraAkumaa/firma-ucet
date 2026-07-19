import { useState } from 'react'
import { useT } from '../../i18n/I18nContext'
import { useBrigadeMemberships, useBrigades } from '../../db/hooks'
import { db } from '../../db/db'
import { useActiveTenantId } from '../../tenant/activeTenant'
import { Button } from '../../shared/ui/Button'
import { Card } from '../../shared/ui/Card'
import { SelectField } from '../../shared/ui/SelectField'
import { DateOrMonthField } from '../../shared/ui/DateOrMonthField'
import { addDaysIso, todayIso } from '../../shared/date'

interface BrigadeHistorySectionProps {
  personId: number
}

export function BrigadeHistorySection({ personId }: BrigadeHistorySectionProps) {
  const t = useT()
  const tenantId = useActiveTenantId()
  const brigades = useBrigades()
  const memberships = useBrigadeMemberships()
  const [adding, setAdding] = useState(false)
  const [brigadeId, setBrigadeId] = useState('')
  const [startDate, setStartDate] = useState(todayIso())

  const personMemberships = memberships
    .filter((m) => m.personId === personId)
    .sort((a, b) => b.startDate.localeCompare(a.startDate))

  const brigadeOptions = brigades.map((b) => ({ value: String(b.id), label: b.name }))
  const brigadeName = (id: number) => brigades.find((b) => b.id === id)?.name ?? ''

  const startAdding = () => {
    setBrigadeId(brigades[0] ? String(brigades[0].id) : '')
    setStartDate(todayIso())
    setAdding(true)
  }

  const submit = async () => {
    const newBrigadeId = Number(brigadeId)
    if (!newBrigadeId || !startDate || tenantId == null) return

    // Otevřená (probíhající) příslušnost, která začala dřív než nový přechod — uzavřeme ji
    // dnem před novým startem, ať historie nepřekrývá dvě party najednou.
    const openMembership = personMemberships.find((m) => m.endDate == null && m.startDate < startDate)
    if (openMembership) {
      await db.brigadeMemberships.update(openMembership.id!, { endDate: addDaysIso(startDate, -1) })
    }

    await db.brigadeMemberships.add({ tenantId, personId, brigadeId: newBrigadeId, startDate })
    setAdding(false)
  }

  const remove = async (id: number) => {
    await db.brigadeMemberships.delete(id)
  }

  if (brigades.length === 0) return null

  return (
    <div className="mt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{t.brigades.membershipHistory}</h2>
        {!adding && <Button onClick={startAdding}>{t.brigades.addMembership}</Button>}
      </div>
      <p className="mt-1 text-xs text-gray-500">{t.brigades.membershipHint}</p>

      {adding && (
        <Card className="mt-2">
          <div className="flex flex-wrap items-end gap-2">
            <SelectField label={t.people.brigade} options={brigadeOptions} value={brigadeId} onChange={(e) => setBrigadeId(e.target.value)} />
            <DateOrMonthField label={t.analytics.startDate} value={startDate} onChange={setStartDate} />
            <Button onClick={submit}>{t.common.save}</Button>
            <Button variant="ghost" onClick={() => setAdding(false)}>
              {t.common.cancel}
            </Button>
          </div>
        </Card>
      )}

      <Card className="mt-2 p-0">
        <ul className="divide-y divide-gray-100 dark:divide-gray-800">
          {personMemberships.length === 0 && <li className="p-4 text-sm text-gray-500">{t.common.noData}</li>}
          {personMemberships.map((m) => (
            <li key={m.id} className="flex items-center justify-between gap-3 p-4 text-sm">
              <span>
                <span className="font-medium">{brigadeName(m.brigadeId)}</span>{' '}
                <span className="text-gray-500">
                  · {m.startDate} – {m.endDate ?? t.common.present}
                </span>
              </span>
              <button type="button" onClick={() => remove(m.id!)} className="text-gray-400 hover:text-red-600 dark:hover:text-red-400">
                {t.common.delete}
              </button>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  )
}
