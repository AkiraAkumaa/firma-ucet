import { useState } from 'react'
import { useT } from '../../i18n/I18nContext'
import { useSites } from '../../db/hooks'
import { db } from '../../db/db'
import { deleteSite, deleteSites } from '../../db/cascadeDelete'
import { useActiveTenantId } from '../../tenant/activeTenant'
import { Button } from '../../shared/ui/Button'
import { TextField } from '../../shared/ui/TextField'
import { SelectField } from '../../shared/ui/SelectField'
import { Card } from '../../shared/ui/Card'
import { ConfirmDialog } from '../../shared/ui/ConfirmDialog'
import { BulkActionBar } from '../../shared/ui/BulkActionBar'
import { useSelection } from '../../shared/ui/useSelection'
import type { Site, SiteStatus } from '../../domain/sites/types'

interface SiteFormState {
  name: string
  address: string
  status: SiteStatus
}

const emptyForm: SiteFormState = { name: '', address: '', status: 'active' }

export function SitesManager() {
  const t = useT()
  const sites = useSites()
  const tenantId = useActiveTenantId()
  const [form, setForm] = useState<SiteFormState>(emptyForm)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [bulkDeleting, setBulkDeleting] = useState(false)
  const [bulkStatus, setBulkStatus] = useState('')
  const selection = useSelection(sites.map((s) => s.id!))

  const statusOptions: { value: SiteStatus; label: string }[] = [
    { value: 'active', label: t.siteStatus.active },
    { value: 'completed', label: t.siteStatus.completed },
  ]

  const resetForm = () => {
    setForm(emptyForm)
    setEditingId(null)
  }

  const startEdit = (site: Site) => {
    setEditingId(site.id!)
    setForm({ name: site.name, address: site.address, status: site.status })
  }

  const submit = async () => {
    const name = form.name.trim()
    const address = form.address.trim()
    if (!name || tenantId == null) return

    if (editingId != null) {
      await db.sites.update(editingId, { name, address, status: form.status })
    } else {
      await db.sites.add({ tenantId, name, address, status: form.status })
    }
    resetForm()
  }

  const confirmDelete = async () => {
    if (deletingId == null) return
    await deleteSite(deletingId)
    setDeletingId(null)
  }

  const confirmBulkDelete = async () => {
    await deleteSites(selection.selectedIds)
    selection.clear()
    setBulkDeleting(false)
  }

  const applyBulkStatus = async () => {
    if (!bulkStatus) return
    await db.sites.bulkUpdate(selection.selectedIds.map((id) => ({ key: id, changes: { status: bulkStatus as SiteStatus } })))
    selection.clear()
    setBulkStatus('')
  }

  return (
    <Card>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <TextField label={t.sites.name} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <TextField
          label={t.sites.address}
          value={form.address}
          onChange={(e) => setForm({ ...form, address: e.target.value })}
        />
        <SelectField
          label={t.sites.status}
          options={statusOptions}
          value={form.status}
          onChange={(e) => setForm({ ...form, status: e.target.value as SiteStatus })}
        />
      </div>
      <div className="mt-3 flex gap-2">
        <Button onClick={submit}>{editingId != null ? t.common.save : t.sites.addSite}</Button>
        {editingId != null && (
          <Button variant="ghost" onClick={resetForm}>
            {t.common.cancel}
          </Button>
        )}
      </div>

      {sites.length > 0 && (
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
        {sites.length === 0 && <li className="py-3 text-sm text-gray-500">{t.sites.noSites}</li>}
        {sites.map((site) => (
          <li key={site.id} className="flex items-center gap-3 py-2.5 text-sm">
            <input
              type="checkbox"
              checked={selection.isSelected(site.id!)}
              onChange={() => selection.toggle(site.id!)}
              className="h-4 w-4"
            />
            <span className="flex-1">
              <span className="font-medium">{site.name}</span>{' '}
              <span className="text-gray-500">
                · {site.address} · {site.status === 'active' ? t.siteStatus.active : t.siteStatus.completed}
              </span>
            </span>
            <Button variant="ghost" onClick={() => startEdit(site)}>
              {t.common.edit}
            </Button>
            <Button variant="ghost" onClick={() => setDeletingId(site.id!)}>
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
          value={bulkStatus}
          onChange={(e) => setBulkStatus(e.target.value)}
          className="rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
        >
          <option value="">{t.sites.bulkChangeStatus}</option>
          {statusOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <Button variant="secondary" onClick={applyBulkStatus} disabled={!bulkStatus}>
          {t.common.apply}
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
