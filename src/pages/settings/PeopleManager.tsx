import { useState } from 'react'
import { useT } from '../../i18n/I18nContext'
import { useBrigades, usePeople } from '../../db/hooks'
import { db } from '../../db/db'
import { deletePerson, deletePeople } from '../../db/cascadeDelete'
import { useActiveTenantId } from '../../tenant/activeTenant'
import { Button } from '../../shared/ui/Button'
import { TextField } from '../../shared/ui/TextField'
import { SelectField } from '../../shared/ui/SelectField'
import { Card } from '../../shared/ui/Card'
import { ConfirmDialog } from '../../shared/ui/ConfirmDialog'
import { BulkActionBar } from '../../shared/ui/BulkActionBar'
import { useSelection } from '../../shared/ui/useSelection'
import { exportSelectedPeopleToExcel } from '../../export/exportExcel'
import type { Person, PersonType } from '../../domain/people/types'

interface PersonFormState {
  name: string
  brigadeId: string
  type: PersonType
  hourlyRate: string
  insuranceMonthly: string
}

const emptyForm: PersonFormState = { name: '', brigadeId: '', type: 'osvc', hourlyRate: '', insuranceMonthly: '' }

export function PeopleManager() {
  const t = useT()
  const people = usePeople()
  const brigades = useBrigades()
  const tenantId = useActiveTenantId()
  const [form, setForm] = useState<PersonFormState>(emptyForm)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [bulkDeleting, setBulkDeleting] = useState(false)
  const [bulkBrigadeId, setBulkBrigadeId] = useState('')
  const selection = useSelection(people.map((p) => p.id!))

  const brigadeOptions = brigades.map((b) => ({ value: String(b.id), label: b.name }))
  const typeOptions: { value: PersonType; label: string }[] = [
    { value: 'osvc', label: t.personType.osvc },
    { value: 'zamestnanec', label: t.personType.zamestnanec },
  ]
  const effectiveBrigadeId = form.brigadeId || (brigades[0] ? String(brigades[0].id) : '')

  const brigadeName = (id: number) => brigades.find((b) => b.id === id)?.name ?? '—'

  const resetForm = () => {
    setForm(emptyForm)
    setEditingId(null)
  }

  const startEdit = (person: Person) => {
    setEditingId(person.id!)
    setForm({
      name: person.name,
      brigadeId: String(person.brigadeId),
      type: person.type,
      hourlyRate: String(person.hourlyRate),
      insuranceMonthly: person.insuranceMonthly != null ? String(person.insuranceMonthly) : '',
    })
  }

  const submit = async () => {
    const name = form.name.trim()
    const brigadeId = Number(effectiveBrigadeId)
    const hourlyRate = Number(form.hourlyRate)
    if (!name || !brigadeId || !Number.isFinite(hourlyRate) || hourlyRate <= 0 || tenantId == null) return
    const insuranceMonthly =
      form.type === 'zamestnanec' && form.insuranceMonthly.trim() !== '' ? Number(form.insuranceMonthly) : undefined

    if (editingId != null) {
      await db.people.update(editingId, { name, brigadeId, type: form.type, hourlyRate, insuranceMonthly })
    } else {
      await db.people.add({ tenantId, name, brigadeId, type: form.type, hourlyRate, insuranceMonthly })
    }
    resetForm()
  }

  const confirmDelete = async () => {
    if (deletingId == null) return
    await deletePerson(deletingId)
    setDeletingId(null)
  }

  const confirmBulkDelete = async () => {
    await deletePeople(selection.selectedIds)
    selection.clear()
    setBulkDeleting(false)
  }

  const applyBulkBrigade = async () => {
    if (!bulkBrigadeId) return
    await db.people.bulkUpdate(
      selection.selectedIds.map((id) => ({ key: id, changes: { brigadeId: Number(bulkBrigadeId) } })),
    )
    selection.clear()
    setBulkBrigadeId('')
  }

  return (
    <Card>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
        <TextField label={t.people.name} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <SelectField
          label={t.people.brigade}
          options={brigadeOptions}
          value={effectiveBrigadeId}
          onChange={(e) => setForm({ ...form, brigadeId: e.target.value })}
          disabled={brigades.length === 0}
        />
        <SelectField
          label={t.people.type}
          options={typeOptions}
          value={form.type}
          onChange={(e) => setForm({ ...form, type: e.target.value as PersonType })}
        />
        <TextField
          label={t.people.hourlyRate}
          type="number"
          min="0"
          value={form.hourlyRate}
          onChange={(e) => setForm({ ...form, hourlyRate: e.target.value })}
        />
        {form.type === 'zamestnanec' && (
          <TextField
            label={t.people.insuranceMonthly}
            type="number"
            min="0"
            value={form.insuranceMonthly}
            onChange={(e) => setForm({ ...form, insuranceMonthly: e.target.value })}
            className="sm:col-span-2"
          />
        )}
      </div>
      {form.type === 'zamestnanec' && <p className="mt-1 text-xs text-gray-500">{t.people.insuranceMonthlyHint}</p>}
      <div className="mt-3 flex gap-2">
        <Button onClick={submit} disabled={brigades.length === 0}>
          {editingId != null ? t.common.save : t.people.addPerson}
        </Button>
        {editingId != null && (
          <Button variant="ghost" onClick={resetForm}>
            {t.common.cancel}
          </Button>
        )}
      </div>
      {brigades.length === 0 && <p className="mt-2 text-sm text-gray-500">{t.entry.setupNeeded}</p>}

      {people.length > 0 && (
        <label className="mt-4 flex items-center gap-2 border-b border-gray-100 pb-1.5 text-sm text-gray-500 dark:border-gray-800">
          <input
            type="checkbox"
            checked={selection.allSelected}
            ref={(el) => {
              if (el) el.indeterminate = selection.someSelected
            }}
            onChange={selection.toggleAll}
            className="h-4 w-4"
          />
          {t.common.selectAll}
        </label>
      )}

      <ul className="divide-y divide-gray-100 dark:divide-gray-800">
        {people.length === 0 && <li className="py-3 text-sm text-gray-500">{t.people.noPeople}</li>}
        {people.map((person) => (
          <li key={person.id} className="flex items-center gap-3 py-2.5 text-sm">
            <input
              type="checkbox"
              checked={selection.isSelected(person.id!)}
              onChange={() => selection.toggle(person.id!)}
              className="h-4 w-4"
            />
            <span className="flex-1">
              <span className="font-medium">{person.name}</span>{' '}
              <span className="text-gray-500">
                · {brigadeName(person.brigadeId)} ·{' '}
                {person.type === 'osvc' ? t.personType.osvc : t.personType.zamestnanec} · {person.hourlyRate} Kč/h
                {person.type === 'zamestnanec' && person.insuranceMonthly != null && ` · ${person.insuranceMonthly} Kč/měs`}
              </span>
            </span>
            <Button variant="ghost" onClick={() => startEdit(person)}>
              {t.common.edit}
            </Button>
            <Button variant="ghost" onClick={() => setDeletingId(person.id!)}>
              {t.common.delete}
            </Button>
          </li>
        ))}
      </ul>

      <ConfirmDialog
        open={deletingId != null}
        title={t.common.confirmDeleteTitle}
        body={t.common.confirmDeleteBody}
        onConfirm={confirmDelete}
        onCancel={() => setDeletingId(null)}
      />

      <BulkActionBar count={selection.selectedCount} onClear={selection.clear}>
        <select
          value={bulkBrigadeId}
          onChange={(e) => setBulkBrigadeId(e.target.value)}
          className="rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
        >
          <option value="">{t.people.bulkChangeBrigade}</option>
          {brigadeOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <Button variant="secondary" onClick={applyBulkBrigade} disabled={!bulkBrigadeId}>
          {t.common.apply}
        </Button>
        <Button variant="secondary" onClick={() => exportSelectedPeopleToExcel(selection.selectedIds, t)}>
          {t.backup.exportExcel}
        </Button>
        <Button variant="danger" onClick={() => setBulkDeleting(true)}>
          {t.common.deleteSelected}
        </Button>
      </BulkActionBar>

      <ConfirmDialog
        open={bulkDeleting}
        title={t.common.bulkDeleteConfirmTitle}
        body={t.common.bulkDeleteConfirmBody(selection.selectedCount)}
        confirmLabel={t.common.deleteSelected}
        danger
        onConfirm={confirmBulkDelete}
        onCancel={() => setBulkDeleting(false)}
      />
    </Card>
  )
}
