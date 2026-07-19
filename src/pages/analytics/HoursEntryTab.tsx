import { useState } from 'react'
import { useT } from '../../i18n/I18nContext'
import { usePeople, useSites, useDrawingRecords, useWorkHourEntries } from '../../db/hooks'
import { db } from '../../db/db'
import { useActiveTenantId } from '../../tenant/activeTenant'
import { Button } from '../../shared/ui/Button'
import { Card } from '../../shared/ui/Card'
import { SelectField } from '../../shared/ui/SelectField'
import { TextField } from '../../shared/ui/TextField'
import { DateOrMonthField } from '../../shared/ui/DateOrMonthField'
import { todayIso } from '../../shared/date'
import type { WorkCategory } from '../../domain/analytics/types'

interface Draft {
  personId: string
  date: string
  hours: string
  siteId: string
  workCategory: WorkCategory
  drawingRecordId: string
  note: string
}

function emptyDraft(): Draft {
  return { personId: '', date: todayIso(), hours: '', siteId: '', workCategory: 'armovani', drawingRecordId: '', note: '' }
}

export function HoursEntryTab() {
  const t = useT()
  const tenantId = useActiveTenantId()
  const people = usePeople()
  const sites = useSites()
  const drawings = useDrawingRecords()
  const entries = useWorkHourEntries()
  const [draft, setDraft] = useState<Draft>(emptyDraft())

  const categoryOptions: { value: WorkCategory; label: string }[] = [
    { value: 'armovani', label: t.analytics.categoryArmovani },
    { value: 'monolit', label: t.analytics.categoryMonolit },
  ]
  const personOptions = people.map((p) => ({ value: String(p.id), label: p.name }))
  const siteOptions = sites.map((s) => ({ value: String(s.id), label: s.name }))
  const drawingOptions = [
    { value: '', label: '—' },
    ...drawings.filter((d) => d.workCategory === draft.workCategory).map((d) => ({ value: String(d.id), label: d.name })),
  ]

  const personName = (id: number) => people.find((p) => p.id === id)?.name ?? ''
  const siteName = (id: number) => sites.find((s) => s.id === id)?.name ?? ''

  const submit = async () => {
    const personId = Number(draft.personId)
    const siteId = Number(draft.siteId)
    const hours = Number(draft.hours)
    if (!personId || !siteId || !Number.isFinite(hours) || hours <= 0 || tenantId == null) return

    await db.workHourEntries.add({
      tenantId,
      date: draft.date,
      personId,
      siteId,
      hours,
      workCategory: draft.workCategory,
      ...(draft.drawingRecordId ? { drawingRecordId: Number(draft.drawingRecordId) } : {}),
      ...(draft.note.trim() ? { note: draft.note.trim() } : {}),
    })
    setDraft(emptyDraft())
  }

  const remove = async (id: number) => {
    await db.workHourEntries.delete(id)
  }

  const sorted = [...entries].sort((a, b) => b.date.localeCompare(a.date))

  if (people.length === 0 || sites.length === 0) {
    return <p className="text-sm text-gray-500">{t.entry.setupNeeded}</p>
  }

  return (
    <div>
      <p className="text-sm text-gray-500">{t.analytics.hoursHint}</p>

      <Card className="mt-3">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <SelectField label={t.entry.person} options={personOptions} value={draft.personId} onChange={(e) => setDraft({ ...draft, personId: e.target.value })} />
          <DateOrMonthField label={t.common.date} value={draft.date} onChange={(date) => setDraft({ ...draft, date })} />
          <TextField label={t.entry.hours} type="number" min="0" value={draft.hours} onChange={(e) => setDraft({ ...draft, hours: e.target.value })} />
          <SelectField label={t.entry.site} options={siteOptions} value={draft.siteId} onChange={(e) => setDraft({ ...draft, siteId: e.target.value })} />
          <SelectField
            label={t.analytics.workCategory}
            options={categoryOptions}
            value={draft.workCategory}
            onChange={(e) => setDraft({ ...draft, workCategory: e.target.value as WorkCategory, drawingRecordId: '' })}
          />
          <SelectField
            label={t.analytics.drawingsTitle}
            options={drawingOptions}
            value={draft.drawingRecordId}
            onChange={(e) => setDraft({ ...draft, drawingRecordId: e.target.value })}
          />
          <TextField
            label={t.analytics.hoursNote}
            value={draft.note}
            onChange={(e) => setDraft({ ...draft, note: e.target.value })}
            className="sm:col-span-3"
          />
        </div>
        <div className="mt-3">
          <Button onClick={submit}>{t.analytics.addHours}</Button>
        </div>
      </Card>

      <Card className="mt-4 p-0">
        <ul className="divide-y divide-gray-100 dark:divide-gray-800">
          {sorted.length === 0 && <li className="p-4 text-sm text-gray-500">{t.analytics.noEntries}</li>}
          {sorted.map((entry) => (
            <li key={entry.id} className="flex items-center justify-between gap-3 p-4 text-sm">
              <span>
                <span className="text-gray-500">{entry.date}</span> · <span className="font-medium">{personName(entry.personId)}</span> ·{' '}
                {siteName(entry.siteId)} · {entry.hours} h ·{' '}
                {entry.workCategory === 'armovani' ? t.analytics.categoryArmovani : t.analytics.categoryMonolit}
                {entry.note && <span className="text-gray-500"> · {entry.note}</span>}
              </span>
              <button type="button" onClick={() => remove(entry.id!)} className="text-gray-400 hover:text-red-600 dark:hover:text-red-400">
                {t.common.delete}
              </button>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  )
}
