import { useState } from 'react'
import { useT } from '../../i18n/I18nContext'
import { useExpenseCategories, useSites, useWorkTypes } from '../../db/hooks'
import { db } from '../../db/db'
import { Button } from '../../shared/ui/Button'
import { SelectField } from '../../shared/ui/SelectField'
import { TextField } from '../../shared/ui/TextField'
import type { HoursEntry } from '../../domain/hours/types'
import type { OutputEntry } from '../../domain/output/types'
import type { SalaryEntry } from '../../domain/salary/types'
import type { Expense } from '../../domain/expenses/types'
import type { Payment } from '../../domain/payments/types'

export type EditableHistoryEntry =
  | { kind: 'hours'; entry: HoursEntry }
  | { kind: 'output'; entry: OutputEntry }
  | { kind: 'salary'; entry: SalaryEntry }
  | { kind: 'expense'; entry: Expense }
  | { kind: 'payment'; entry: Payment }

interface EditHistoryEntryModalProps {
  target: EditableHistoryEntry | null
  onClose: () => void
}

interface Option {
  value: string
  label: string
}

/**
 * Pokud aktuální hodnota neodpovídá žádné reálné možnosti (osiřelý/neplatný odkaz —
 * viz siteId ukazující na smazaný/neexistující objekt), prohlížeč u <select> tiše
 * zobrazí první reálnou možnost, aniž by se to promítlo do stavu — uživatel pak
 * klidně uloží beze změny a myslí si, že opravil chybu. Přidání zjevné placeholder
 * možnosti tomu zabrání.
 */
function withUnknownPlaceholder(currentValue: string, realOptions: Option[], placeholderLabel: string): Option[] {
  if (currentValue === '' || realOptions.some((o) => o.value === currentValue)) return realOptions
  return [{ value: currentValue, label: placeholderLabel }, ...realOptions]
}

export function EditHistoryEntryModal({ target, onClose }: EditHistoryEntryModalProps) {
  const t = useT()
  const sites = useSites()
  const workTypes = useWorkTypes()
  const categories = useExpenseCategories()

  const [draft, setDraft] = useState<Record<string, string>>({})

  if (!target) return null

  const realSiteOptions = sites.map((s) => ({ value: String(s.id), label: s.name }))
  const siteOptionsWithNone = [{ value: '', label: t.entry.noSite }, ...realSiteOptions]
  const workTypeOptions = workTypes.map((w) => ({ value: String(w.id), label: `${w.name} (${w.unit})` }))
  const categoryOptions = categories.map((c) => ({ value: String(c.id), label: c.name }))

  const field = (key: string, fallback: string): string => (draft[key] !== undefined ? draft[key] : fallback)
  const setField = (key: string, value: string) => setDraft((prev) => ({ ...prev, [key]: value }))

  const canSave =
    target.kind === 'hours'
      ? realSiteOptions.some((o) => o.value === field('siteId', String(target.entry.siteId)))
      : target.kind === 'output'
        ? realSiteOptions.some((o) => o.value === field('siteId', String(target.entry.siteId))) &&
          workTypeOptions.some((o) => o.value === field('workTypeId', String(target.entry.workTypeId)))
        : true

  const save = async () => {
    if (target.kind === 'hours') {
      const e = target.entry
      await db.hoursEntries.update(e.id!, {
        date: field('date', e.date),
        siteId: Number(field('siteId', String(e.siteId))),
        hours: Number(field('hours', String(e.hours))),
        hourlyRateSnapshot: Number(field('rate', String(e.hourlyRateSnapshot))),
      })
    } else if (target.kind === 'output') {
      const e = target.entry
      await db.outputEntries.update(e.id!, {
        date: field('date', e.date),
        siteId: Number(field('siteId', String(e.siteId))),
        workTypeId: Number(field('workTypeId', String(e.workTypeId))),
        quantity: Number(field('quantity', String(e.quantity))),
        unitPrice: Number(field('unitPrice', String(e.unitPrice))),
      })
    } else if (target.kind === 'salary') {
      const e = target.entry
      const siteIdRaw = field('siteId', e.siteId != null ? String(e.siteId) : '')
      await db.salaryEntries.update(e.id!, {
        date: field('date', e.date),
        siteId: siteIdRaw ? Number(siteIdRaw) : undefined,
        amount: Number(field('amount', String(e.amount))),
        note: field('note', e.note ?? '').trim() || undefined,
      })
    } else if (target.kind === 'expense') {
      const e = target.entry
      const siteIdRaw = field('siteId', e.siteId != null ? String(e.siteId) : '')
      await db.expenses.update(e.id!, {
        date: field('date', e.date),
        categoryId: Number(field('categoryId', String(e.categoryId))),
        siteId: siteIdRaw ? Number(siteIdRaw) : undefined,
        amount: Number(field('amount', String(e.amount))),
        note: field('note', e.note ?? '').trim() || undefined,
      })
    } else {
      const e = target.entry
      await db.payments.update(e.id!, {
        date: field('date', e.date),
        amount: Number(field('amount', String(e.amount))),
      })
    }
    setDraft({})
    onClose()
  }

  const cancel = () => {
    setDraft({})
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-5 dark:bg-gray-900">
        <h2 className="text-base font-semibold">{t.common.edit}</h2>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-gray-700 dark:text-gray-300">{t.entry.date}</span>
            <input
              type="date"
              value={field('date', target.entry.date)}
              onChange={(e) => setField('date', e.target.value)}
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 dark:border-gray-700 dark:bg-gray-900"
            />
          </label>

          {target.kind === 'hours' && (
            <>
              <SelectField
                label={t.entry.site}
                options={withUnknownPlaceholder(
                  field('siteId', String(target.entry.siteId)),
                  realSiteOptions,
                  t.entry.unknownReference,
                )}
                value={field('siteId', String(target.entry.siteId))}
                onChange={(e) => setField('siteId', e.target.value)}
              />
              <TextField
                label={t.entry.hours}
                type="number"
                min="0"
                value={field('hours', String(target.entry.hours))}
                onChange={(e) => setField('hours', e.target.value)}
              />
              <TextField
                label={t.people.hourlyRate}
                type="number"
                min="0"
                value={field('rate', String(target.entry.hourlyRateSnapshot))}
                onChange={(e) => setField('rate', e.target.value)}
              />
            </>
          )}

          {target.kind === 'output' && (
            <>
              <SelectField
                label={t.entry.site}
                options={withUnknownPlaceholder(
                  field('siteId', String(target.entry.siteId)),
                  realSiteOptions,
                  t.entry.unknownReference,
                )}
                value={field('siteId', String(target.entry.siteId))}
                onChange={(e) => setField('siteId', e.target.value)}
              />
              <SelectField
                label={t.entry.workType}
                options={withUnknownPlaceholder(
                  field('workTypeId', String(target.entry.workTypeId)),
                  workTypeOptions,
                  t.entry.unknownReference,
                )}
                value={field('workTypeId', String(target.entry.workTypeId))}
                onChange={(e) => setField('workTypeId', e.target.value)}
              />
              <TextField
                label={t.entry.quantity}
                type="number"
                min="0"
                value={field('quantity', String(target.entry.quantity))}
                onChange={(e) => setField('quantity', e.target.value)}
              />
              <TextField
                label={t.entry.unitPrice}
                type="number"
                min="0"
                value={field('unitPrice', String(target.entry.unitPrice))}
                onChange={(e) => setField('unitPrice', e.target.value)}
              />
            </>
          )}

          {target.kind === 'salary' && (
            <>
              <SelectField
                label={`${t.entry.site} (${t.common.optional})`}
                options={withUnknownPlaceholder(
                  field('siteId', target.entry.siteId != null ? String(target.entry.siteId) : ''),
                  siteOptionsWithNone,
                  t.entry.unknownReference,
                )}
                value={field('siteId', target.entry.siteId != null ? String(target.entry.siteId) : '')}
                onChange={(e) => setField('siteId', e.target.value)}
              />
              <TextField
                label={t.common.amount}
                type="number"
                min="0"
                value={field('amount', String(target.entry.amount))}
                onChange={(e) => setField('amount', e.target.value)}
              />
              <TextField
                label={`${t.common.note} (${t.common.optional})`}
                value={field('note', target.entry.note ?? '')}
                onChange={(e) => setField('note', e.target.value)}
                className="sm:col-span-2"
              />
            </>
          )}

          {target.kind === 'expense' && (
            <>
              <SelectField
                label={t.entry.category}
                options={withUnknownPlaceholder(
                  field('categoryId', String(target.entry.categoryId)),
                  categoryOptions,
                  t.entry.unknownReference,
                )}
                value={field('categoryId', String(target.entry.categoryId))}
                onChange={(e) => setField('categoryId', e.target.value)}
              />
              <SelectField
                label={`${t.entry.site} (${t.common.optional})`}
                options={withUnknownPlaceholder(
                  field('siteId', target.entry.siteId != null ? String(target.entry.siteId) : ''),
                  siteOptionsWithNone,
                  t.entry.unknownReference,
                )}
                value={field('siteId', target.entry.siteId != null ? String(target.entry.siteId) : '')}
                onChange={(e) => setField('siteId', e.target.value)}
              />
              <TextField
                label={t.common.amount}
                type="number"
                min="0"
                value={field('amount', String(target.entry.amount))}
                onChange={(e) => setField('amount', e.target.value)}
              />
              <TextField
                label={`${t.common.note} (${t.common.optional})`}
                value={field('note', target.entry.note ?? '')}
                onChange={(e) => setField('note', e.target.value)}
              />
            </>
          )}

          {target.kind === 'payment' && (
            <TextField
              label={t.common.amount}
              type="number"
              min="0"
              value={field('amount', String(target.entry.amount))}
              onChange={(e) => setField('amount', e.target.value)}
            />
          )}
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <Button variant="secondary" onClick={cancel}>
            {t.common.cancel}
          </Button>
          <Button onClick={save} disabled={!canSave}>
            {t.common.save}
          </Button>
        </div>
      </div>
    </div>
  )
}
