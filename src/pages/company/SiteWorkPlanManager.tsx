import { useState } from 'react'
import { useT } from '../../i18n/I18nContext'
import { useSites, useSiteWorkPlans, useSiteWorkProgress, useWorkTypes } from '../../db/hooks'
import { useSitePlan } from '../../domain/profitability/useProfitability'
import { calculateMonthlyProgress } from '../../domain/profitability/calculateSitePlan'
import { db } from '../../db/db'
import { Button } from '../../shared/ui/Button'
import { SelectField } from '../../shared/ui/SelectField'
import { TextField } from '../../shared/ui/TextField'
import { Card } from '../../shared/ui/Card'
import { AttachmentField } from '../../shared/ui/AttachmentField'
import { formatMoney } from '../../shared/money'
import { todayIso } from '../../shared/date'
import { useActiveTenantId } from '../../tenant/activeTenant'
import type { Attachment } from '../../domain/attachments/types'
import type { SiteWorkProgressEntry } from '../../domain/profitability/types'

interface ProgressDraft {
  date: string
  quantity: string
  note: string
  attachment: Attachment | undefined
}

function emptyProgressDraft(): ProgressDraft {
  return { date: todayIso(), quantity: '', note: '', attachment: undefined }
}

function viewAttachment(blob: Blob) {
  const url = URL.createObjectURL(blob)
  window.open(url, '_blank')
  setTimeout(() => URL.revokeObjectURL(url), 60_000)
}

export function SiteWorkPlanManager() {
  const t = useT()
  const sites = useSites()
  const workTypes = useWorkTypes()
  const plans = useSiteWorkPlans()
  const progress = useSiteWorkProgress()
  const tenantId = useActiveTenantId()
  const [siteId, setSiteId] = useState('')
  const [plannedDrafts, setPlannedDrafts] = useState<Record<number, string>>({})
  const [priceDrafts, setPriceDrafts] = useState<Record<number, string>>({})
  const [progressDrafts, setProgressDrafts] = useState<Record<number, ProgressDraft>>({})

  const effectiveSiteId = siteId || (sites[0] ? String(sites[0].id) : '')
  const siteOptions = sites.map((s) => ({ value: String(s.id), label: s.name }))

  const planRows = useSitePlan(Number(effectiveSiteId) || 0)
  const totalPlannedRevenue = planRows.reduce((sum, r) => sum + r.plannedRevenue, 0)
  const totalActualRevenue = planRows.reduce((sum, r) => sum + r.actualRevenue, 0)

  const existingPlanFor = (workTypeId: number) =>
    plans.find((p) => p.siteId === Number(effectiveSiteId) && p.workTypeId === workTypeId)

  const progressFor = (workTypeId: number) =>
    progress
      .filter((p) => p.siteId === Number(effectiveSiteId) && p.workTypeId === workTypeId)
      .sort((a, b) => b.date.localeCompare(a.date))

  const plannedDraftFor = (workTypeId: number): string => {
    if (plannedDrafts[workTypeId] !== undefined) return plannedDrafts[workTypeId]
    return existingPlanFor(workTypeId) ? String(existingPlanFor(workTypeId)!.plannedQuantity) : ''
  }

  const priceDraftFor = (workTypeId: number): string => {
    if (priceDrafts[workTypeId] !== undefined) return priceDrafts[workTypeId]
    const override = existingPlanFor(workTypeId)?.customerPriceOverride
    return override != null ? String(override) : ''
  }

  const progressDraftFor = (workTypeId: number): ProgressDraft => progressDrafts[workTypeId] ?? emptyProgressDraft()

  const setProgressDraft = (workTypeId: number, patch: Partial<ProgressDraft>) => {
    setProgressDrafts({ ...progressDrafts, [workTypeId]: { ...progressDraftFor(workTypeId), ...patch } })
  }

  const savePlanned = async (workTypeId: number) => {
    const plannedQuantity = plannedDraftFor(workTypeId).trim() === '' ? 0 : Number(plannedDraftFor(workTypeId))
    if (!Number.isFinite(plannedQuantity) || tenantId == null) return

    const existing = existingPlanFor(workTypeId)
    if (existing) {
      await db.siteWorkPlans.update(existing.id!, { plannedQuantity })
    } else {
      await db.siteWorkPlans.add({ tenantId, siteId: Number(effectiveSiteId), workTypeId, plannedQuantity })
    }
    setPlannedDrafts((prev) => {
      const next = { ...prev }
      delete next[workTypeId]
      return next
    })
  }

  const savePrice = async (workTypeId: number) => {
    if (tenantId == null) return
    const trimmed = priceDraftFor(workTypeId).trim()
    if (trimmed === '') return
    const customerPriceOverride = Number(trimmed)
    if (!Number.isFinite(customerPriceOverride)) return

    const existing = existingPlanFor(workTypeId)
    if (existing) {
      await db.siteWorkPlans.update(existing.id!, { customerPriceOverride })
    } else {
      await db.siteWorkPlans.add({ tenantId, siteId: Number(effectiveSiteId), workTypeId, plannedQuantity: 0, customerPriceOverride })
    }
    setPriceDrafts((prev) => {
      const next = { ...prev }
      delete next[workTypeId]
      return next
    })
  }

  const resetPrice = async (workTypeId: number) => {
    const existing = existingPlanFor(workTypeId)
    if (existing?.id != null) {
      await db.siteWorkPlans.where('id').equals(existing.id).modify((plan) => {
        delete plan.customerPriceOverride
      })
    }
    setPriceDrafts((prev) => {
      const next = { ...prev }
      delete next[workTypeId]
      return next
    })
  }

  const addProgress = async (workTypeId: number) => {
    const draft = progressDraftFor(workTypeId)
    const quantity = Number(draft.quantity)
    if (!Number.isFinite(quantity) || quantity <= 0 || tenantId == null) return

    const record: SiteWorkProgressEntry = { tenantId, siteId: Number(effectiveSiteId), workTypeId, date: draft.date, quantity }
    const trimmedNote = draft.note.trim()
    if (trimmedNote) record.note = trimmedNote
    if (draft.attachment) record.attachment = draft.attachment

    await db.siteWorkProgress.add(record)
    setProgressDrafts((prev) => {
      const next = { ...prev }
      delete next[workTypeId]
      return next
    })
  }

  const deleteProgress = async (id: number) => {
    await db.siteWorkProgress.delete(id)
  }

  if (sites.length === 0 || workTypes.length === 0) {
    return <p className="text-sm text-gray-500">{t.entry.setupNeeded}</p>
  }

  return (
    <Card>
      <SelectField
        label={t.entry.site}
        options={siteOptions}
        value={effectiveSiteId}
        onChange={(e) => setSiteId(e.target.value)}
      />

      <p className="mt-3 text-sm text-gray-500">
        {t.company.plannedRevenueTotal}:{' '}
        <span className="font-semibold text-gray-900 dark:text-gray-100">{formatMoney(totalPlannedRevenue)}</span>
        {' · '}
        {t.company.actualQuantity}: <span className="font-semibold text-gray-900 dark:text-gray-100">{formatMoney(totalActualRevenue)}</span>
      </p>

      <ul className="mt-3 divide-y divide-gray-100 dark:divide-gray-800">
        {workTypes.map((workType) => {
          const isPlannedDirty = plannedDrafts[workType.id!] !== undefined
          const row = planRows.find((r) => r.workTypeId === workType.id)
          const entries = progressFor(workType.id!)
          const monthly = calculateMonthlyProgress(entries)
          const progressDraft = progressDraftFor(workType.id!)

          return (
            <li key={workType.id} className="py-3 text-sm">
              <span className="font-medium">{workType.name}</span> <span className="text-gray-500">({workType.unit})</span>

              <div className="mt-2 flex flex-wrap items-end gap-2">
                <label className="flex flex-col gap-1 text-xs text-gray-500">
                  {t.company.plannedQuantity}
                  <input
                    type="number"
                    min="0"
                    value={plannedDraftFor(workType.id!)}
                    onChange={(e) => setPlannedDrafts({ ...plannedDrafts, [workType.id!]: e.target.value })}
                    className="w-24 rounded-lg border border-gray-300 px-2 py-1.5 text-right dark:border-gray-700 dark:bg-gray-900"
                  />
                </label>
                <Button disabled={!isPlannedDirty} onClick={() => savePlanned(workType.id!)}>
                  {t.common.save}
                </Button>
                <label className="flex flex-col gap-1 text-xs text-gray-500">
                  {t.company.customerPriceOverrideLabel}
                  <input
                    type="number"
                    min="0"
                    placeholder={t.company.customerPriceDefault(workType.priceCustomer)}
                    value={priceDraftFor(workType.id!)}
                    onChange={(e) => setPriceDrafts({ ...priceDrafts, [workType.id!]: e.target.value })}
                    className="w-40 rounded-lg border border-gray-300 px-2 py-1.5 text-right dark:border-gray-700 dark:bg-gray-900"
                  />
                </label>
                <Button
                  variant="secondary"
                  disabled={priceDrafts[workType.id!] === undefined && existingPlanFor(workType.id!)?.customerPriceOverride == null}
                  onClick={() => savePrice(workType.id!)}
                >
                  {t.common.save}
                </Button>
                {existingPlanFor(workType.id!)?.customerPriceOverride != null && priceDrafts[workType.id!] === undefined && (
                  <Button variant="ghost" onClick={() => resetPrice(workType.id!)}>
                    {t.company.useDefaultPrice}
                  </Button>
                )}
              </div>

              {row && row.plannedQuantity > 0 && (
                <p className="mt-1 text-xs text-gray-500">
                  {t.company.actualQuantity}: {row.actualQuantity} · {t.company.remainingQuantity}: {row.remainingQuantity} ·{' '}
                  {formatMoney(row.actualRevenue)} / {formatMoney(row.plannedRevenue)}
                </p>
              )}

              <div className="mt-3 rounded-lg border border-gray-100 p-3 dark:border-gray-800">
                <p className="text-xs font-medium text-gray-600 dark:text-gray-400">{t.company.addProgress}</p>
                <div className="mt-2 flex flex-wrap items-end gap-2">
                  <label className="flex flex-col gap-1 text-xs text-gray-500">
                    {t.common.date}
                    <input
                      type="date"
                      value={progressDraft.date}
                      onChange={(e) => setProgressDraft(workType.id!, { date: e.target.value })}
                      className="rounded-lg border border-gray-300 px-2 py-1.5 dark:border-gray-700 dark:bg-gray-900"
                    />
                  </label>
                  <TextField
                    label={t.entry.quantity}
                    type="number"
                    min="0"
                    value={progressDraft.quantity}
                    onChange={(e) => setProgressDraft(workType.id!, { quantity: e.target.value })}
                    className="w-28"
                  />
                  <TextField
                    label={`${t.common.note} (${t.common.optional})`}
                    value={progressDraft.note}
                    onChange={(e) => setProgressDraft(workType.id!, { note: e.target.value })}
                  />
                  <AttachmentField
                    label={`${t.entry.attachment} (${t.common.optional})`}
                    value={progressDraft.attachment}
                    onChange={(a) => setProgressDraft(workType.id!, { attachment: a })}
                  />
                  <Button onClick={() => addProgress(workType.id!)}>{t.common.add}</Button>
                </div>

                {entries.length > 0 ? (
                  <>
                    <p className="mt-3 text-xs font-medium text-gray-600 dark:text-gray-400">{t.company.progressHistory}</p>
                    <ul className="mt-1 divide-y divide-gray-100 dark:divide-gray-800">
                      {entries.map((entry) => (
                        <li key={entry.id} className="flex items-center justify-between gap-2 py-1.5 text-xs">
                          <span>
                            <span className="text-gray-500">{entry.date}</span> · <span className="font-medium">{entry.quantity}</span>
                            {entry.note && <span className="text-gray-500"> · {entry.note}</span>}
                            {entry.attachment && (
                              <>
                                {' · '}
                                <button
                                  type="button"
                                  onClick={() => viewAttachment(entry.attachment!.blob)}
                                  className="text-blue-600 underline dark:text-blue-400"
                                >
                                  {t.entry.attachment}
                                </button>
                              </>
                            )}
                          </span>
                          <button
                            type="button"
                            onClick={() => deleteProgress(entry.id!)}
                            className="text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                          >
                            {t.common.delete}
                          </button>
                        </li>
                      ))}
                    </ul>

                    <p className="mt-3 text-xs font-medium text-gray-600 dark:text-gray-400">{t.company.monthlyProgress}</p>
                    <ul className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-600 dark:text-gray-400">
                      {monthly.map((m) => (
                        <li key={m.month}>
                          {m.month}: <span className="font-medium">{m.quantity}</span>
                        </li>
                      ))}
                    </ul>
                  </>
                ) : (
                  <p className="mt-3 text-xs text-gray-500">{t.company.noProgress}</p>
                )}
              </div>
            </li>
          )
        })}
      </ul>
    </Card>
  )
}
