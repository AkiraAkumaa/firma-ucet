import { useMemo, useState } from 'react'
import { useT } from '../../i18n/I18nContext'
import { useBrigades, usePeople, useSites } from '../../db/hooks'
import { db } from '../../db/db'
import { Button } from '../../shared/ui/Button'
import { SelectField } from '../../shared/ui/SelectField'
import { Card } from '../../shared/ui/Card'
import { AttachmentField } from '../../shared/ui/AttachmentField'
import { useLastEntryDefaults } from './useLastEntryDefaults'
import { useActiveTenantId } from '../../tenant/activeTenant'
import type { Person } from '../../domain/people/types'
import type { Attachment } from '../../domain/attachments/types'

interface RowState {
  checked: boolean
  hours: string
}

const DEFAULT_ROW: RowState = { checked: false, hours: '8' }

export function HoursForm() {
  const t = useT()
  const people = usePeople()
  const sites = useSites()
  const brigades = useBrigades()
  const tenantId = useActiveTenantId()
  const { siteId, setSiteId, date, setDate } = useLastEntryDefaults()
  const [rows, setRows] = useState<Record<number, RowState>>({})
  const [attachment, setAttachment] = useState<Attachment | undefined>(undefined)
  const [savedFlash, setSavedFlash] = useState(false)

  const effectiveSiteId = siteId || (sites[0] ? String(sites[0].id) : '')
  const siteOptions = sites.map((s) => ({ value: String(s.id), label: s.name }))

  const groups = useMemo(() => {
    const byBrigade = new Map<number, Person[]>()
    for (const person of people) {
      const list = byBrigade.get(person.brigadeId)
      if (list) list.push(person)
      else byBrigade.set(person.brigadeId, [person])
    }
    return [...byBrigade.entries()]
      .map(([brigadeId, members]) => ({
        brigadeId,
        brigadeName: brigades.find((b) => b.id === brigadeId)?.name ?? '',
        members: [...members].sort((a, b) => a.name.localeCompare(b.name)),
      }))
      .sort((a, b) => a.brigadeName.localeCompare(b.brigadeName))
  }, [people, brigades])

  const rowFor = (personId: number): RowState => rows[personId] ?? DEFAULT_ROW

  const toggle = (personId: number) => {
    const current = rowFor(personId)
    setRows({ ...rows, [personId]: { ...current, checked: !current.checked } })
  }

  const setHours = (personId: number, hours: string) => {
    const current = rowFor(personId)
    setRows({ ...rows, [personId]: { ...current, hours } })
  }

  const selectAll = () => {
    const next: Record<number, RowState> = {}
    for (const person of people) {
      next[person.id!] = { checked: true, hours: rowFor(person.id!).hours }
    }
    setRows(next)
  }

  const toggleBrigade = (members: Person[]) => {
    const allChecked = members.every((p) => rowFor(p.id!).checked)
    const next = { ...rows }
    for (const p of members) {
      next[p.id!] = { checked: !allChecked, hours: rowFor(p.id!).hours }
    }
    setRows(next)
  }

  const selectedCount = people.filter((p) => rowFor(p.id!).checked).length
  const canSave = effectiveSiteId !== '' && selectedCount > 0

  const submit = async () => {
    if (!canSave || tenantId == null) return
    const targetSiteId = Number(effectiveSiteId)
    const entries = people
      .filter((p) => rowFor(p.id!).checked)
      .map((p) => ({
        tenantId,
        date,
        personId: p.id!,
        siteId: targetSiteId,
        hours: Number(rowFor(p.id!).hours),
        hourlyRateSnapshot: p.hourlyRate,
        ...(attachment ? { attachment } : {}),
      }))
      .filter((e) => Number.isFinite(e.hours) && e.hours > 0)

    if (entries.length === 0) return
    await db.hoursEntries.bulkAdd(entries)
    setSiteId(effectiveSiteId)
    setRows({})
    setAttachment(undefined)
    setSavedFlash(true)
    setTimeout(() => setSavedFlash(false), 1500)
  }

  if (sites.length === 0 || people.length === 0) {
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
        <AttachmentField
          label={`${t.entry.attachment} (${t.common.optional})`}
          value={attachment}
          onChange={setAttachment}
          className="sm:col-span-2"
        />
      </div>

      <div className="mt-4 flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{t.entry.people}</span>
        <Button variant="ghost" onClick={selectAll}>
          {t.entry.selectAll}
        </Button>
      </div>

      <div className="mt-2 space-y-4">
        {groups.map((group) => {
          const checkedCount = group.members.filter((p) => rowFor(p.id!).checked).length
          const allChecked = checkedCount === group.members.length
          const someChecked = checkedCount > 0 && !allChecked

          return (
            <div key={group.brigadeId}>
              <label className="flex items-center gap-2 border-b border-gray-100 pb-1.5 text-sm font-medium text-gray-600 dark:border-gray-800 dark:text-gray-400">
                <input
                  type="checkbox"
                  checked={allChecked}
                  ref={(el) => {
                    if (el) el.indeterminate = someChecked
                  }}
                  onChange={() => toggleBrigade(group.members)}
                  className="h-4 w-4"
                />
                {group.brigadeName}
              </label>
              <ul className="divide-y divide-gray-100 dark:divide-gray-800">
                {group.members.map((person) => {
                  const row = rowFor(person.id!)
                  return (
                    <li key={person.id} className="flex items-center gap-3 py-2 text-sm">
                      <input
                        type="checkbox"
                        checked={row.checked}
                        onChange={() => toggle(person.id!)}
                        className="h-4 w-4"
                      />
                      <span className="flex-1">
                        {person.name}{' '}
                        <span className="text-gray-500">
                          · {person.type === 'osvc' ? t.personType.osvc : t.personType.zamestnanec}
                        </span>
                      </span>
                      <input
                        type="number"
                        min="0"
                        step="0.5"
                        value={row.hours}
                        disabled={!row.checked}
                        onChange={(e) => setHours(person.id!, e.target.value)}
                        className="w-20 rounded-lg border border-gray-300 px-2 py-1.5 text-right disabled:opacity-40 dark:border-gray-700 dark:bg-gray-900"
                      />
                    </li>
                  )
                })}
              </ul>
            </div>
          )
        })}
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
