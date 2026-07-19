import { useState } from 'react'
import { useT } from '../../i18n/I18nContext'
import { useSites } from '../../db/hooks'
import { db } from '../../db/db'
import { Button } from '../../shared/ui/Button'
import { SelectField } from '../../shared/ui/SelectField'
import { TextField } from '../../shared/ui/TextField'
import { Card } from '../../shared/ui/Card'
import { AttachmentField } from '../../shared/ui/AttachmentField'
import { todayIso } from '../../shared/date'
import { useActiveTenantId } from '../../tenant/activeTenant'
import type { SiteMaterialCost } from '../../domain/profitability/types'
import type { Attachment } from '../../domain/attachments/types'

export function MaterialCostForm() {
  const t = useT()
  const sites = useSites()
  const tenantId = useActiveTenantId()

  const [date, setDate] = useState(todayIso())
  const [siteId, setSiteId] = useState('')
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')
  const [attachment, setAttachment] = useState<Attachment | undefined>(undefined)
  const [savedFlash, setSavedFlash] = useState(false)

  const effectiveSiteId = siteId || (sites[0] ? String(sites[0].id) : '')
  const siteOptions = sites.map((s) => ({ value: String(s.id), label: s.name }))

  const amountNumber = Number(amount)
  const canSave = effectiveSiteId !== '' && Number.isFinite(amountNumber) && amountNumber > 0

  const submit = async () => {
    if (!canSave || tenantId == null) return
    const payload: SiteMaterialCost = { tenantId, date, siteId: Number(effectiveSiteId), amount: amountNumber }
    const trimmedNote = note.trim()
    if (trimmedNote) payload.note = trimmedNote
    if (attachment) payload.attachment = attachment

    await db.siteMaterialCosts.add(payload)
    setAmount('')
    setNote('')
    setAttachment(undefined)
    setSavedFlash(true)
    setTimeout(() => setSavedFlash(false), 1500)
  }

  if (sites.length === 0) {
    return <p className="text-sm text-gray-500">{t.entry.setupNeeded}</p>
  }

  return (
    <Card>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
          label={t.entry.site}
          options={siteOptions}
          value={effectiveSiteId}
          onChange={(e) => setSiteId(e.target.value)}
        />
        <TextField label={t.common.amount} type="number" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} />
        <TextField
          label={`${t.common.note} (${t.common.optional})`}
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
        <AttachmentField
          label={`${t.entry.attachment} (${t.common.optional})`}
          value={attachment}
          onChange={setAttachment}
        />
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
