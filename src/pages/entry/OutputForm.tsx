import { useState } from 'react'
import { useT } from '../../i18n/I18nContext'
import { useBrigades, usePeople, useSites, useWorkTypes } from '../../db/hooks'
import { db } from '../../db/db'
import { Button } from '../../shared/ui/Button'
import { SelectField } from '../../shared/ui/SelectField'
import { TextField } from '../../shared/ui/TextField'
import { Card } from '../../shared/ui/Card'
import { AttachmentField } from '../../shared/ui/AttachmentField'
import { defaultUnitPrice } from '../../domain/output/calc'
import { personLabel } from '../../domain/people/personLabel'
import { useLastEntryDefaults } from './useLastEntryDefaults'
import { useActiveTenantId } from '../../tenant/activeTenant'
import type { Attachment } from '../../domain/attachments/types'

export function OutputForm() {
  const t = useT()
  const people = usePeople()
  const sites = useSites()
  const workTypes = useWorkTypes()
  const brigades = useBrigades()
  const tenantId = useActiveTenantId()
  const { siteId, setSiteId, date, setDate } = useLastEntryDefaults()

  const [personId, setPersonId] = useState('')
  const [workTypeId, setWorkTypeId] = useState('')
  const [quantity, setQuantity] = useState('')
  const [manualUnitPrice, setManualUnitPrice] = useState('')
  const [priceOverridden, setPriceOverridden] = useState(false)
  const [attachment, setAttachment] = useState<Attachment | undefined>(undefined)
  const [savedFlash, setSavedFlash] = useState(false)

  const effectiveSiteId = siteId || (sites[0] ? String(sites[0].id) : '')
  const effectivePersonId = personId || (people[0] ? String(people[0].id) : '')
  const effectiveWorkTypeId = workTypeId || (workTypes[0] ? String(workTypes[0].id) : '')

  const selectedPerson = people.find((p) => String(p.id) === effectivePersonId)
  const selectedWorkType = workTypes.find((w) => String(w.id) === effectiveWorkTypeId)
  const defaultPrice = selectedPerson && selectedWorkType ? defaultUnitPrice(selectedWorkType, selectedPerson.type) : 0
  const effectiveUnitPrice = priceOverridden ? manualUnitPrice : String(defaultPrice)

  const siteOptions = sites.map((s) => ({ value: String(s.id), label: s.name }))
  const personOptions = people.map((p) => ({ value: String(p.id), label: personLabel(p, brigades, t) }))
  const workTypeOptions = workTypes.map((w) => ({ value: String(w.id), label: `${w.name} (${w.unit})` }))

  const quantityNumber = Number(quantity)
  const unitPriceNumber = Number(effectiveUnitPrice)
  const canSave =
    effectiveSiteId !== '' &&
    effectivePersonId !== '' &&
    effectiveWorkTypeId !== '' &&
    Number.isFinite(quantityNumber) &&
    quantityNumber > 0 &&
    Number.isFinite(unitPriceNumber) &&
    unitPriceNumber > 0

  const submit = async () => {
    if (!canSave || tenantId == null) return
    await db.outputEntries.add({
      tenantId,
      date,
      personId: Number(effectivePersonId),
      siteId: Number(effectiveSiteId),
      workTypeId: Number(effectiveWorkTypeId),
      quantity: quantityNumber,
      unitPrice: unitPriceNumber,
      priceOverridden,
      ...(attachment ? { attachment } : {}),
    })
    setSiteId(effectiveSiteId)
    setQuantity('')
    setManualUnitPrice('')
    setPriceOverridden(false)
    setAttachment(undefined)
    setSavedFlash(true)
    setTimeout(() => setSavedFlash(false), 1500)
  }

  if (sites.length === 0 || people.length === 0 || workTypes.length === 0) {
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
        <SelectField
          label={t.entry.person}
          options={personOptions}
          value={effectivePersonId}
          onChange={(e) => setPersonId(e.target.value)}
        />
        <SelectField
          label={t.entry.workType}
          options={workTypeOptions}
          value={effectiveWorkTypeId}
          onChange={(e) => {
            setWorkTypeId(e.target.value)
            setPriceOverridden(false)
          }}
        />
        <TextField
          label={t.entry.quantity}
          type="number"
          min="0"
          step="0.01"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
        />
        <div className="flex flex-col gap-1">
          <TextField
            label={t.entry.unitPrice}
            type="number"
            min="0"
            value={effectiveUnitPrice}
            onChange={(e) => {
              setManualUnitPrice(e.target.value)
              setPriceOverridden(true)
            }}
          />
          {priceOverridden && (
            <button
              type="button"
              onClick={() => setPriceOverridden(false)}
              className="self-start text-xs text-gray-500 underline dark:text-gray-400"
            >
              {t.entry.resetPrice}
            </button>
          )}
        </div>
        <AttachmentField
          label={`${t.entry.attachment} (${t.common.optional})`}
          value={attachment}
          onChange={setAttachment}
        />
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
