import { useState } from 'react'
import { useT } from '../../i18n/I18nContext'
import { useExpenseCategories } from '../../db/hooks'
import { db } from '../../db/db'
import { deleteExpenseCategory, deleteExpenseCategories } from '../../db/cascadeDelete'
import { useActiveTenantId } from '../../tenant/activeTenant'
import { Button } from '../../shared/ui/Button'
import { TextField } from '../../shared/ui/TextField'
import { Card } from '../../shared/ui/Card'
import { ConfirmDialog } from '../../shared/ui/ConfirmDialog'
import { BulkActionBar } from '../../shared/ui/BulkActionBar'
import { useSelection } from '../../shared/ui/useSelection'
import type { ExpenseCategory } from '../../domain/expenseCategories/types'

export function ExpenseCategoriesManager() {
  const t = useT()
  const categories = useExpenseCategories()
  const tenantId = useActiveTenantId()
  const [name, setName] = useState('')
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editingName, setEditingName] = useState('')
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [bulkDeleting, setBulkDeleting] = useState(false)
  const selection = useSelection(categories.map((c) => c.id!))

  const addCategory = async () => {
    const trimmed = name.trim()
    if (!trimmed || tenantId == null) return
    await db.expenseCategories.add({ tenantId, name: trimmed })
    setName('')
  }

  const startEdit = (category: ExpenseCategory) => {
    setEditingId(category.id!)
    setEditingName(category.name)
  }

  const saveEdit = async () => {
    if (editingId == null) return
    const trimmed = editingName.trim()
    if (!trimmed) return
    await db.expenseCategories.update(editingId, { name: trimmed })
    setEditingId(null)
  }

  const confirmDelete = async () => {
    if (deletingId == null) return
    await deleteExpenseCategory(deletingId)
    setDeletingId(null)
  }

  const confirmBulkDelete = async () => {
    await deleteExpenseCategories(selection.selectedIds)
    selection.clear()
    setBulkDeleting(false)
  }

  return (
    <Card>
      <div className="flex items-end gap-2">
        <TextField label={t.expenseCategories.name} value={name} onChange={(e) => setName(e.target.value)} className="flex-1" />
        <Button onClick={addCategory}>{t.expenseCategories.addCategory}</Button>
      </div>

      {categories.length > 0 && (
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
        {categories.length === 0 && <li className="py-3 text-sm text-gray-500">{t.common.noData}</li>}
        {categories.map((category) => (
          <li key={category.id} className="flex items-center gap-2 py-2.5">
            <input
              type="checkbox"
              checked={selection.isSelected(category.id!)}
              onChange={() => selection.toggle(category.id!)}
              className="h-4 w-4"
            />
            {editingId === category.id ? (
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
                <span className="flex-1 text-sm">{category.name}</span>
                <Button variant="ghost" onClick={() => startEdit(category)}>
                  {t.common.edit}
                </Button>
                <Button variant="ghost" onClick={() => setDeletingId(category.id!)}>
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
