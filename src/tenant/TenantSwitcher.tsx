import { useState } from 'react'
import { useT } from '../i18n/I18nContext'
import { useTenants } from '../db/hooks'
import { db } from '../db/db'
import { setActiveTenantId, useActiveTenantId } from './activeTenant'

export function TenantSwitcher() {
  const t = useT()
  const tenants = useTenants()
  const activeTenantId = useActiveTenantId()
  const [adding, setAdding] = useState(false)
  const [newName, setNewName] = useState('')

  const createTenant = async () => {
    const trimmed = newName.trim()
    if (!trimmed) return
    const id = await db.tenants.add({ name: trimmed })
    setActiveTenantId(id as number)
    setNewName('')
    setAdding(false)
  }

  if (adding) {
    return (
      <div className="flex items-center gap-1">
        <input
          autoFocus
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') createTenant()
            if (e.key === 'Escape') setAdding(false)
          }}
          placeholder={t.tenant.namePlaceholder}
          className="w-32 rounded-lg border border-gray-300 px-2 py-1 text-sm dark:border-gray-700 dark:bg-gray-900 sm:w-40"
        />
        <button
          type="button"
          onClick={createTenant}
          className="rounded-lg bg-brand-700 px-2 py-1 text-sm font-medium text-white dark:bg-brand-500"
        >
          {t.common.add}
        </button>
        <button type="button" onClick={() => setAdding(false)} className="text-sm text-gray-500">
          {t.common.cancel}
        </button>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-1">
      <select
        value={activeTenantId ?? ''}
        onChange={(e) => setActiveTenantId(Number(e.target.value))}
        className="max-w-[9rem] truncate rounded-lg border border-gray-300 bg-white px-2 py-1 text-sm dark:border-gray-700 dark:bg-gray-900 sm:max-w-none"
      >
        {tenants.map((tenant) => (
          <option key={tenant.id} value={tenant.id}>
            {tenant.name}
          </option>
        ))}
      </select>
      <button
        type="button"
        onClick={() => setAdding(true)}
        title={t.tenant.addNew}
        aria-label={t.tenant.addNew}
        className="rounded-lg border border-gray-300 px-2 py-1 text-sm font-medium text-gray-600 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
      >
        +
      </button>
    </div>
  )
}
