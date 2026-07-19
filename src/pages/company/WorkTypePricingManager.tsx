import { useState } from 'react'
import { useT } from '../../i18n/I18nContext'
import { useWorkTypes } from '../../db/hooks'
import { db } from '../../db/db'
import { Button } from '../../shared/ui/Button'
import { Card } from '../../shared/ui/Card'

export function WorkTypePricingManager() {
  const t = useT()
  const workTypes = useWorkTypes()
  const [drafts, setDrafts] = useState<Record<number, string>>({})

  const valueFor = (workTypeId: number, current: number) => drafts[workTypeId] ?? String(current)

  const save = async (workTypeId: number) => {
    const draft = drafts[workTypeId]
    if (draft === undefined) return
    const priceCustomer = draft.trim() === '' ? 0 : Number(draft)
    if (!Number.isFinite(priceCustomer)) return
    await db.workTypes.update(workTypeId, { priceCustomer })
    setDrafts((prev) => {
      const next = { ...prev }
      delete next[workTypeId]
      return next
    })
  }

  if (workTypes.length === 0) {
    return <p className="text-sm text-gray-500">{t.entry.setupNeeded}</p>
  }

  return (
    <Card>
      <ul className="divide-y divide-gray-100 dark:divide-gray-800">
        {workTypes.map((workType) => {
          const isDirty = drafts[workType.id!] !== undefined
          return (
            <li key={workType.id} className="flex items-center gap-3 py-2.5 text-sm">
              <span className="flex-1">
                <span className="font-medium">{workType.name}</span>{' '}
                <span className="text-gray-500">
                  ({workType.unit}) · OSVČ {workType.priceOsvc} Kč · zam. {workType.priceZamestnanec} Kč
                </span>
              </span>
              <input
                type="number"
                min="0"
                value={valueFor(workType.id!, workType.priceCustomer)}
                onChange={(e) => setDrafts({ ...drafts, [workType.id!]: e.target.value })}
                className="w-24 rounded-lg border border-gray-300 px-2 py-1.5 text-right dark:border-gray-700 dark:bg-gray-900"
              />
              <Button disabled={!isDirty} onClick={() => save(workType.id!)}>
                {t.common.save}
              </Button>
            </li>
          )
        })}
      </ul>
    </Card>
  )
}
