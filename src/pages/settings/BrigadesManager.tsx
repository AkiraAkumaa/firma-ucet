import { useState } from 'react'
import { useT } from '../../i18n/I18nContext'
import { useBrigades } from '../../db/hooks'
import { db } from '../../db/db'
import { deleteBrigade, deleteBrigades } from '../../db/cascadeDelete'
import { useActiveTenantId } from '../../tenant/activeTenant'
import { Button } from '../../shared/ui/Button'
import { TextField } from '../../shared/ui/TextField'
import { Card } from '../../shared/ui/Card'
import { ConfirmDialog } from '../../shared/ui/ConfirmDialog'
import { BulkActionBar } from '../../shared/ui/BulkActionBar'
import { useSelection } from '../../shared/ui/useSelection'
import type { Brigade } from '../../domain/brigades/types'

export function BrigadesManager() {
  const t = useT()
  const brigades = useBrigades()
  const tenantId = useActiveTenantId()
  const [name, setName] = useState('')
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editingName, setEditingName] = useState('')
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [bulkDeleting, setBulkDeleting] = useState(false)
  const selection = useSelection(brigades.map((b) => b.id!))

  const addBrigade = async () => {
    const trimmed = name.trim()
    if (!trimmed || tenantId == null) return
    await db.brigades.add({ tenantId, name: trimmed })
    setName('')
  }

  const startEdit = (brigade: Brigade) => {
    setEditingId(brigade.id!)
    setEditingName(brigade.name)
  }

  const saveEdit = async () => {
    if (editingId == null) return
    const trimmed = editingName.trim()
    if (!trimmed) return
    await db.brigades.update(editingId, { name: trimmed })
    setEditingId(null)
  }

  const confirmDelete = async () => {
    if (deletingId == null) return
    await deleteBrigade(deletingId)
    setDeletingId(null)
  }

  const confirmBulkDelete = async () => {
    await deleteBrigades(selection.selectedIds)
    selection.clear()
    setBulkDeleting(false)
  }

  return (
    <Card>
      <div className="flex items-end gap-2">
        <TextField label={t.brigades.name} value={name} onChange={(e) => setName(e.target.value)} className="flex-1" />
        <Button onClick={addBrigade}>{t.brigades.addBrigade}</Button>
      </div>

      {brigades.length > 0 && (
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
        {brigades.length === 0 && <li className="py-3 text-sm text-gray-500">{t.brigades.noBrigades}</li>}
        {brigades.map((brigade) => (
          <li key={brigade.id} className="flex items-center gap-2 py-2.5">
            <input
              type="checkbox"
              checked={selection.isSelected(brigade.id!)}
              onChange={() => selection.toggle(brigade.id!)}
              className="h-4 w-4"
            />
            {editingId === brigade.id ? (
              <>
                <input
                  className="flex-1 rounded-lg border border-gray-300 px-2 py-1.5 text-sm dark:border-gray-700 dark:bg-gray-900"
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  autoFocus
                />
                <Button onClick={saveEdit}>{t.common.save}</Button>
                <Button variant="ghost" onClick={() => setEditingId(null)}>
                  {t.common.cancel}
                </Button>
              </>
            ) : (
              <>
                <span className="flex-1 text-sm">{brigade.name}</span>
                <Button variant="ghost" onClick={() => startEdit(brigade)}>
                  {t.common.edit}
                </Button>
                <Button variant="ghost" onClick={() => setDeletingId(brigade.id!)}>
                  {t.common.delete}
                </Button>
              </>
            )}
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
