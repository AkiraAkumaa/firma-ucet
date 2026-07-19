import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useT } from '../../i18n/I18nContext'
import { useDrawingRecords, useSites } from '../../db/hooks'
import { db } from '../../db/db'
import { useActiveTenantId } from '../../tenant/activeTenant'
import { Button } from '../../shared/ui/Button'
import { Card } from '../../shared/ui/Card'
import { SelectField } from '../../shared/ui/SelectField'
import { TextField } from '../../shared/ui/TextField'
import { todayIso } from '../../shared/date'
import { ROUTES } from '../../app/routes'
import type { WorkCategory } from '../../domain/analytics/types'

const REBAR_DIAMETERS = [6, 8, 10, 12, 14, 16] as const

interface NewDrawingDraft {
  name: string
  siteId: string
  workCategory: WorkCategory
  massByDiameter: Record<number, string>
  positionCount: string
  bentFraction: string
  sponyCount: string
  concreteVolumeM3: string
  complexNodesNote: string
  thicknesses: { thicknessMm: string; volumeM3: string }[]
  formworkAreaM2: string
  pourCount: string
}

function emptyDraft(): NewDrawingDraft {
  return {
    name: '',
    siteId: '',
    workCategory: 'armovani',
    massByDiameter: {},
    positionCount: '',
    bentFraction: '',
    sponyCount: '',
    concreteVolumeM3: '',
    complexNodesNote: '',
    thicknesses: [{ thicknessMm: '', volumeM3: '' }],
    formworkAreaM2: '',
    pourCount: '',
  }
}

export function DrawingsListTab() {
  const t = useT()
  const tenantId = useActiveTenantId()
  const drawings = useDrawingRecords()
  const sites = useSites()
  const [adding, setAdding] = useState(false)
  const [draft, setDraft] = useState<NewDrawingDraft>(emptyDraft())

  const categoryOptions: { value: WorkCategory; label: string }[] = [
    { value: 'armovani', label: t.analytics.categoryArmovani },
    { value: 'monolit', label: t.analytics.categoryMonolit },
  ]
  const siteOptions = [{ value: '', label: '—' }, ...sites.map((s) => ({ value: String(s.id), label: s.name }))]
  const siteName = (id?: number) => (id != null ? sites.find((s) => s.id === id)?.name ?? '' : '')

  const addThicknessRow = () => setDraft({ ...draft, thicknesses: [...draft.thicknesses, { thicknessMm: '', volumeM3: '' }] })
  const setThicknessRow = (index: number, patch: Partial<{ thicknessMm: string; volumeM3: string }>) => {
    const next = [...draft.thicknesses]
    next[index] = { ...next[index], ...patch }
    setDraft({ ...draft, thicknesses: next })
  }

  const submit = async () => {
    const name = draft.name.trim()
    if (!name || tenantId == null) return

    if (draft.workCategory === 'armovani') {
      const massByDiameter = REBAR_DIAMETERS.filter((d) => draft.massByDiameter[d]?.trim())
        .map((d) => ({ diameterMm: d, massKg: Number(draft.massByDiameter[d]) }))
        .filter((m) => Number.isFinite(m.massKg) && m.massKg > 0)

      await db.drawingRecords.add({
        tenantId,
        name,
        siteId: draft.siteId ? Number(draft.siteId) : undefined,
        workCategory: 'armovani',
        rebar: {
          massByDiameter,
          positionCount: Number(draft.positionCount) || 0,
          bentFraction: Number(draft.bentFraction) || 0,
          sponyCount: Number(draft.sponyCount) || 0,
          concreteVolumeM3: Number(draft.concreteVolumeM3) || 0,
          ...(draft.complexNodesNote.trim() ? { complexNodesNote: draft.complexNodesNote.trim() } : {}),
        },
        createdDate: todayIso(),
      })
    } else {
      const concreteVolumeByThickness = draft.thicknesses
        .filter((row) => row.thicknessMm.trim() && row.volumeM3.trim())
        .map((row) => ({ thicknessMm: Number(row.thicknessMm), volumeM3: Number(row.volumeM3) }))
        .filter((row) => Number.isFinite(row.thicknessMm) && Number.isFinite(row.volumeM3) && row.volumeM3 > 0)

      await db.drawingRecords.add({
        tenantId,
        name,
        siteId: draft.siteId ? Number(draft.siteId) : undefined,
        workCategory: 'monolit',
        monolith: {
          concreteVolumeByThickness,
          formworkAreaM2: Number(draft.formworkAreaM2) || 0,
          pourCount: Number(draft.pourCount) || 0,
        },
        createdDate: todayIso(),
      })
    }

    setDraft(emptyDraft())
    setAdding(false)
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{t.analytics.drawingsTitle}</p>
        {!adding && <Button onClick={() => setAdding(true)}>{t.analytics.newDrawing}</Button>}
      </div>

      {adding && (
        <Card className="mt-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <TextField label={t.analytics.drawingName} value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
            <SelectField label={t.entry.site} options={siteOptions} value={draft.siteId} onChange={(e) => setDraft({ ...draft, siteId: e.target.value })} />
            <SelectField
              label={t.analytics.workCategory}
              options={categoryOptions}
              value={draft.workCategory}
              onChange={(e) => setDraft({ ...draft, workCategory: e.target.value as WorkCategory })}
            />
          </div>

          {draft.workCategory === 'armovani' ? (
            <div className="mt-4">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{t.analytics.rebarSection}</p>
              <div className="mt-2 grid grid-cols-3 gap-3 sm:grid-cols-6">
                {REBAR_DIAMETERS.map((d) => (
                  <TextField
                    key={d}
                    label={t.analytics.diameterMass(d)}
                    type="number"
                    min="0"
                    value={draft.massByDiameter[d] ?? ''}
                    onChange={(e) => setDraft({ ...draft, massByDiameter: { ...draft.massByDiameter, [d]: e.target.value } })}
                  />
                ))}
              </div>
              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-4">
                <TextField
                  label={t.analytics.positionCount}
                  type="number"
                  min="0"
                  value={draft.positionCount}
                  onChange={(e) => setDraft({ ...draft, positionCount: e.target.value })}
                />
                <TextField
                  label={t.analytics.bentFraction}
                  type="number"
                  min="0"
                  max="1"
                  step="0.01"
                  value={draft.bentFraction}
                  onChange={(e) => setDraft({ ...draft, bentFraction: e.target.value })}
                />
                <TextField
                  label={t.analytics.sponyCount}
                  type="number"
                  min="0"
                  value={draft.sponyCount}
                  onChange={(e) => setDraft({ ...draft, sponyCount: e.target.value })}
                />
                <TextField
                  label={t.analytics.concreteVolume}
                  type="number"
                  min="0"
                  value={draft.concreteVolumeM3}
                  onChange={(e) => setDraft({ ...draft, concreteVolumeM3: e.target.value })}
                />
              </div>
              <TextField
                label={t.analytics.complexNodesNote}
                value={draft.complexNodesNote}
                onChange={(e) => setDraft({ ...draft, complexNodesNote: e.target.value })}
                className="mt-3"
              />
            </div>
          ) : (
            <div className="mt-4">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{t.analytics.monolithSection}</p>
              <div className="mt-2 space-y-2">
                {draft.thicknesses.map((row, i) => (
                  <div key={i} className="flex gap-2">
                    <TextField
                      label={t.analytics.thicknessMm}
                      type="number"
                      min="0"
                      value={row.thicknessMm}
                      onChange={(e) => setThicknessRow(i, { thicknessMm: e.target.value })}
                    />
                    <TextField
                      label={t.analytics.volumeM3}
                      type="number"
                      min="0"
                      value={row.volumeM3}
                      onChange={(e) => setThicknessRow(i, { volumeM3: e.target.value })}
                    />
                  </div>
                ))}
                <Button variant="secondary" onClick={addThicknessRow}>
                  {t.analytics.addThickness}
                </Button>
              </div>
              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <TextField
                  label={t.analytics.formworkArea}
                  type="number"
                  min="0"
                  value={draft.formworkAreaM2}
                  onChange={(e) => setDraft({ ...draft, formworkAreaM2: e.target.value })}
                />
                <TextField
                  label={t.analytics.pourCount}
                  type="number"
                  min="0"
                  value={draft.pourCount}
                  onChange={(e) => setDraft({ ...draft, pourCount: e.target.value })}
                />
              </div>
            </div>
          )}

          <div className="mt-4 flex gap-2">
            <Button onClick={submit}>{t.common.save}</Button>
            <Button
              variant="ghost"
              onClick={() => {
                setAdding(false)
                setDraft(emptyDraft())
              }}
            >
              {t.common.cancel}
            </Button>
          </div>
        </Card>
      )}

      <Card className="mt-4 p-0">
        <ul className="divide-y divide-gray-100 dark:divide-gray-800">
          {drawings.length === 0 && <li className="p-4 text-sm text-gray-500">{t.analytics.noDrawings}</li>}
          {drawings.map((d) => (
            <li key={d.id}>
              <Link
                to={ROUTES.analyticsDrawingDetail(d.id!)}
                className="flex items-center justify-between gap-3 p-4 text-sm hover:bg-gray-50 dark:hover:bg-gray-800/50"
              >
                <span>
                  <span className="font-medium">{d.name}</span>{' '}
                  <span className="text-gray-500">
                    · {d.workCategory === 'armovani' ? t.analytics.categoryArmovani : t.analytics.categoryMonolit}
                    {siteName(d.siteId) && ` · ${siteName(d.siteId)}`}
                  </span>
                </span>
                {d.actualHours != null ? (
                  <span className="text-xs text-green-600 dark:text-green-400">{t.analytics.actualRecorded}</span>
                ) : (
                  <span className="text-xs text-gray-400">{d.createdDate}</span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  )
}
