import { useState } from 'react'
import { useT } from '../../i18n/I18nContext'
import { useWorkTypes } from '../../db/hooks'
import { db } from '../../db/db'
import { deleteWorkType, deleteWorkTypes } from '../../db/cascadeDelete'
import { useActiveTenantId } from '../../tenant/activeTenant'
import { Button } from '../../shared/ui/Button'
import { TextField } from '../../shared/ui/TextField'
import { Card } from '../../shared/ui/Card'
import { ConfirmDialog } from '../../shared/ui/ConfirmDialog'
import { BulkActionBar } from '../../shared/ui/BulkActionBar'
import { useSelection } from '../../shared/ui/useSelection'
import type { WorkType } from '../../domain/workTypes/types'

interface WorkTypeFormState {
  name: string
  unit: string
  priceOsvc: string
  priceZamestnanec: string
}

const emptyForm: WorkTypeFormState = { name: '', unit: '', priceOsvc: '', priceZamestnanec: '' }

export function WorkTypesManager() {
  const t = useT()
  const workTypes = useWorkTypes()
  const tenantId = useActiveTenantId()
  const [form, setForm] = useState<WorkTypeFormState>(emptyForm)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [bulkDeleting, setBulkDeleting] = useState(false)
  const selection = useSelection(workTypes.map((w) => w.id!))

  const resetForm = () => {
    setForm(emptyForm)
    setEditingId(null)
  }

  const startEdit = (workType: WorkType) => {
    setEditingId(workType.id!)
    setForm({
      name: workType.name,
      unit: workType.unit,
      priceOsvc: String(workType.priceOsvc),
      priceZamestnanec: String(workType.priceZamestnanec),
    })
  }

  const submit = async () => {
    const name = form.name.trim()
    const unit = form.unit.trim()
    const priceOsvc = Number(form.priceOsvc)
    const priceZamestnanec = Number(form.priceZamestnanec)
    if (!name || !unit || !Number.isFinite(priceOsvc) || !Number.isFinite(priceZamestnanec) || tenantId == null) return

    if (editingId != null) {
      await db.workTypes.update(editingId, { name, unit, priceOsvc, priceZamestnanec })
    } else {
      await db.workTypes.add({ tenantId, name, unit, priceOsvc, priceZamestnanec, priceCustomer: 0 })
    }
    resetForm()
  }

  const confirmDelete = async () => {
    if (deletingId == null) return
    await deleteWorkType(deletingId)
    setDeletingId(null)
  }

  const confirmBulkDelete = async () => {
    await deleteWorkTypes(selection.selectedIds)
    selection.clear()
    setBulkDeleting(false)
  }

  return (
    <Card>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
        <TextField label={t.workTypes.name} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <TextField label={t.workTypes.unit} value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} />
        <TextField
          label={t.workTypes.priceOsvc}
          type="number"
          min="0"
          value={form.priceOsvc}
          onChange={(e) => setForm({ ...form, priceOsvc: e.target.value })}
        />
        <TextField
          label={t.workTypes.priceZamestnanec}
          type="number"
          min="0"
          value={form.priceZamestnanec}
          onChange={(e) => setForm({ ...form, priceZamestnanec: e.target.value })}
        />
      </div>
      <div className="mt-3 flex gap-2">
        <Button onClick={submit}>{editingId != null ? t.common.save : t.workTypes.addWorkType}</Button>
        {editingId != null && (
          <Button variant="ghost" onClick={resetForm}>
            {t.common.cancel}
          </Button>
        )}
      </div>

      {workTypes.length > 0 && (
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
        {workTypes.length === 0 && <li className="py-3 text-sm text-gray-500">{t.common.noData}</li>}
        {workTypes.map((workType) => (
          <li key={workType.id} className="flex items-center gap-3 py-2.5 text-sm">
            <input
              type="checkbox"
              checked={selection.isSelected(workType.id!)}
              onChange={() => selection.toggle(workType.id!)}
              className="h-4 w-4"
            />
            <span className="flex-1">
              <span className="font-medium">{workType.name}</span>{' '}
              <span className="text-gray-500">
                · {workType.unit} · OSVČ {workType.priceOsvc} Kč · zam. {workType.priceZamestnanec} Kč
              </span>
            </span>
            <Button variant="ghost" onClick={() => startEdit(workType)}>
              {t.common.edit}
            </Button>
            <Button variant="ghost" onClick={() => setDeletingId(workType.id!)}>
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
