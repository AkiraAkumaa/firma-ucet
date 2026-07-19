import { useState } from 'react'
import { useT } from '../../i18n/I18nContext'
import { useBrigades, usePeople } from '../../db/hooks'
import { db } from '../../db/db'
import { Button } from '../../shared/ui/Button'
import { SelectField } from '../../shared/ui/SelectField'
import { TextField } from '../../shared/ui/TextField'
import { Card } from '../../shared/ui/Card'
import { todayIso } from '../../shared/date'
import { personLabel } from '../../domain/people/personLabel'
import { useActiveTenantId } from '../../tenant/activeTenant'

export function PaymentForm() {
  const t = useT()
  const people = usePeople()
  const brigades = useBrigades()
  const tenantId = useActiveTenantId()

  const [date, setDate] = useState(todayIso())
  const [personId, setPersonId] = useState('')
  const [amount, setAmount] = useState('')
  const [savedFlash, setSavedFlash] = useState(false)

  const effectivePersonId = personId || (people[0] ? String(people[0].id) : '')
  const personOptions = people.map((p) => ({ value: String(p.id), label: personLabel(p, brigades, t) }))

  const amountNumber = Number(amount)
  const canSave = effectivePersonId !== '' && Number.isFinite(amountNumber) && amountNumber > 0

  const submit = async () => {
    if (!canSave || tenantId == null) return
    await db.payments.add({ tenantId, date, personId: Number(effectivePersonId), amount: amountNumber })
    setAmount('')
    setSavedFlash(true)
    setTimeout(() => setSavedFlash(false), 1500)
  }

  if (people.length === 0) {
    return <p className="text-sm text-gray-500">{t.entry.setupNeeded}</p>
  }

  return (
    <Card>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-gray-700 dark:text-gray-300">{t.entry.date}</span>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 dark:border-gray-700 dark:bg-gray-900"
          />
        </label>
        <SelectField
          label={t.entry.person}
          options={personOptions}
          value={effectivePersonId}
          onChange={(e) => setPersonId(e.target.value)}
        />
        <TextField label={t.common.amount} type="number" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} />
      </div>

      <div className="mt-4 flex items-center gap-3">
        <Button onClick={submit} disabled={!canSave}>
          {t.entry.save}
        </Button>
        {savedFlash && <span className="text-sm text-green-600 dark:text-green-400">{t.entry.saved}</span>}
      </div>
    </Card>
  )
}
