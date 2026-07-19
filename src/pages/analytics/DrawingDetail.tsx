import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useT } from '../../i18n/I18nContext'
import { useDrawingRecords, useSites, useWorkHourEntries } from '../../db/hooks'
import { db } from '../../db/db'
import { calculateRebarCoefficients, calculateMonolithCoefficients } from '../../domain/analytics/coefficients'
import { calculateDrawingActualHours } from '../../domain/analytics/personProductivity'
import { forecastLaborHours, type FeatureVector, type HistoricalSample } from '../../domain/analytics/forecast'
import { calculateJobTimeline } from '../../domain/analytics/timeline'
import { Button } from '../../shared/ui/Button'
import { Card } from '../../shared/ui/Card'
import { TextField } from '../../shared/ui/TextField'
import { DateOrMonthField } from '../../shared/ui/DateOrMonthField'
import { ROUTES } from '../../app/routes'
import { todayIso } from '../../shared/date'

const MIN_FORECAST_SAMPLES = 10

function round2(n: number): number {
  return Math.round(n * 100) / 100
}

export function DrawingDetail() {
  const t = useT()
  const { id } = useParams()
  const drawingId = Number(id)

  const drawings = useDrawingRecords()
  const sites = useSites()
  const entries = useWorkHourEntries()

  const [recording, setRecording] = useState(false)
  const [actualHoursDraft, setActualHoursDraft] = useState('')
  const [delayNotesDraft, setDelayNotesDraft] = useState('')
  const [editingStartDate, setEditingStartDate] = useState(false)
  const [startDateDraft, setStartDateDraft] = useState('')

  const drawing = drawings.find((d) => d.id === drawingId)
  const siteName = drawing?.siteId != null ? sites.find((s) => s.id === drawing.siteId)?.name ?? '' : ''

  const loggedHours = useMemo(() => calculateDrawingActualHours(drawingId, entries), [drawingId, entries])

  const timeline = useMemo(() => {
    if (!drawing) return null
    const workedDates = entries.filter((e) => e.drawingRecordId === drawingId).map((e) => e.date)
    return calculateJobTimeline(workedDates, {
      startDateOverride: drawing.startDate,
      endDateOverride: drawing.actualRecordedDate,
      today: todayIso(),
    })
  }, [drawing, entries, drawingId])

  const rebarCoefficients = useMemo(
    () => (drawing?.workCategory === 'armovani' && drawing.rebar ? calculateRebarCoefficients(drawing.rebar) : null),
    [drawing],
  )
  const monolithCoefficients = useMemo(
    () => (drawing?.workCategory === 'monolit' && drawing.monolith ? calculateMonolithCoefficients(drawing.monolith) : null),
    [drawing],
  )
  const coefficients: FeatureVector | null = rebarCoefficients ?? monolithCoefficients

  const forecast = useMemo(() => {
    if (!drawing || !coefficients) return null
    const history: HistoricalSample[] = drawings
      .filter((d) => d.id !== drawingId && d.workCategory === drawing.workCategory && d.actualHours != null)
      .map((d) => {
        const features =
          d.workCategory === 'armovani' && d.rebar
            ? (calculateRebarCoefficients(d.rebar) as unknown as FeatureVector)
            : d.monolith
              ? (calculateMonolithCoefficients(d.monolith) as unknown as FeatureVector)
              : {}
        return { drawingRecordId: d.id!, features, actualHours: d.actualHours! }
      })
    return forecastLaborHours(coefficients, history, { minRequiredSamples: MIN_FORECAST_SAMPLES })
  }, [drawing, drawings, drawingId, coefficients])

  if (!drawing) {
    return <p className="text-sm text-gray-500">{t.common.noData}</p>
  }

  const startRecording = () => {
    setActualHoursDraft(String(drawing.actualHours ?? loggedHours))
    setDelayNotesDraft(drawing.delayNotes ?? '')
    setRecording(true)
  }

  const saveActual = async () => {
    const actualHours = Number(actualHoursDraft)
    const delayNotes = delayNotesDraft.trim()
    if (!Number.isFinite(actualHours) || actualHours <= 0 || !delayNotes) return
    await db.drawingRecords.update(drawingId, { actualHours, delayNotes, actualRecordedDate: todayIso() })
    setRecording(false)
  }

  const startEditingStartDate = () => {
    setStartDateDraft(drawing!.startDate ?? todayIso())
    setEditingStartDate(true)
  }

  const saveStartDate = async () => {
    if (!startDateDraft) return
    await db.drawingRecords.update(drawingId, { startDate: startDateDraft })
    setEditingStartDate(false)
  }

  return (
    <div>
      <Link to={ROUTES.analytics} className="text-sm text-gray-500 hover:underline">
        ← {t.analytics.backToDrawings}
      </Link>

      <div className="mt-1 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">{drawing.name}</h1>
          <p className="text-sm text-gray-500">
            {drawing.workCategory === 'armovani' ? t.analytics.categoryArmovani : t.analytics.categoryMonolit}
            {siteName && ` · ${siteName}`} · {drawing.createdDate}
          </p>
        </div>
      </div>

      <Card className="mt-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{t.analytics.timelineTitle}</p>
          {!editingStartDate && (
            <Button variant="secondary" onClick={startEditingStartDate}>
              {drawing.startDate ? t.common.edit : t.analytics.setStartDate}
            </Button>
          )}
        </div>

        {editingStartDate ? (
          <div className="mt-3 flex flex-wrap items-end gap-2">
            <DateOrMonthField label={t.analytics.startDate} value={startDateDraft} onChange={setStartDateDraft} />
            <Button onClick={saveStartDate}>{t.common.save}</Button>
            <Button variant="ghost" onClick={() => setEditingStartDate(false)}>
              {t.common.cancel}
            </Button>
          </div>
        ) : (
          timeline &&
          timeline.startDate && (
            <div className="mt-3">
              <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                <div>
                  <dt className="text-gray-500">{t.analytics.startDate}</dt>
                  <dd className="font-medium">{timeline.startDate}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">{drawing.actualRecordedDate ? t.common.date : t.analytics.stillOngoing}</dt>
                  <dd className="font-medium">{timeline.endDate}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">{t.analytics.totalCalendarDays}</dt>
                  <dd className="font-medium tabular-nums">{timeline.totalCalendarDays}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">{t.analytics.workedDaysCount}</dt>
                  <dd className="font-medium tabular-nums">{timeline.workedDaysCount}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">{t.analytics.pauseDaysCount}</dt>
                  <dd className="font-medium tabular-nums">{timeline.pauseDaysCount}</dd>
                </div>
              </dl>

              <p className="mt-3 text-xs font-medium text-gray-600 dark:text-gray-400">{t.analytics.pausePeriods}</p>
              {timeline.pausePeriods.length === 0 ? (
                <p className="mt-1 text-xs text-gray-500">{t.analytics.noPauses}</p>
              ) : (
                <ul className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-600 dark:text-gray-400">
                  {timeline.pausePeriods.map((p, i) => (
                    <li key={i}>
                      {p.from} – {p.to} ({p.days})
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )
        )}

        {!editingStartDate && !drawing.startDate && !timeline?.startDate && (
          <p className="mt-2 text-xs text-gray-500">{t.common.noData}</p>
        )}
      </Card>

      {drawing.workCategory === 'armovani' && drawing.rebar && (
        <Card className="mt-4">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{t.analytics.rebarSection}</p>
          <dl className="mt-2 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
            {drawing.rebar.massByDiameter.map((m) => (
              <div key={m.diameterMm}>
                <dt className="text-gray-500">{t.analytics.diameterMass(m.diameterMm)}</dt>
                <dd className="font-medium tabular-nums">{m.massKg}</dd>
              </div>
            ))}
            <div>
              <dt className="text-gray-500">{t.analytics.positionCount}</dt>
              <dd className="font-medium tabular-nums">{drawing.rebar.positionCount}</dd>
            </div>
            <div>
              <dt className="text-gray-500">{t.analytics.bentFraction}</dt>
              <dd className="font-medium tabular-nums">{drawing.rebar.bentFraction}</dd>
            </div>
            <div>
              <dt className="text-gray-500">{t.analytics.sponyCount}</dt>
              <dd className="font-medium tabular-nums">{drawing.rebar.sponyCount}</dd>
            </div>
            <div>
              <dt className="text-gray-500">{t.analytics.concreteVolume}</dt>
              <dd className="font-medium tabular-nums">{drawing.rebar.concreteVolumeM3}</dd>
            </div>
          </dl>
          {drawing.rebar.complexNodesNote && <p className="mt-2 text-sm text-gray-500">{drawing.rebar.complexNodesNote}</p>}
        </Card>
      )}

      {drawing.workCategory === 'monolit' && drawing.monolith && (
        <Card className="mt-4">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{t.analytics.monolithSection}</p>
          <dl className="mt-2 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
            {drawing.monolith.concreteVolumeByThickness.map((c, i) => (
              <div key={i}>
                <dt className="text-gray-500">{c.thicknessMm} mm</dt>
                <dd className="font-medium tabular-nums">{c.volumeM3} m³</dd>
              </div>
            ))}
            <div>
              <dt className="text-gray-500">{t.analytics.formworkArea}</dt>
              <dd className="font-medium tabular-nums">{drawing.monolith.formworkAreaM2}</dd>
            </div>
            <div>
              <dt className="text-gray-500">{t.analytics.pourCount}</dt>
              <dd className="font-medium tabular-nums">{drawing.monolith.pourCount}</dd>
            </div>
          </dl>
        </Card>
      )}

      {(rebarCoefficients || monolithCoefficients) && (
        <Card className="mt-4">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{t.analytics.coefficientsTitle}</p>
          <dl className="mt-2 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
            {rebarCoefficients && (
              <>
                <div>
                  <dt className="text-gray-500">{t.analytics.density}</dt>
                  <dd className="font-medium tabular-nums">{round2(rebarCoefficients.densityKgPerM3)}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">{t.analytics.positionsPerM3}</dt>
                  <dd className="font-medium tabular-nums">{round2(rebarCoefficients.positionsPerM3)}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">{t.analytics.smallDiameterFraction}</dt>
                  <dd className="font-medium tabular-nums">{round2(rebarCoefficients.smallDiameterFraction)}</dd>
                </div>
              </>
            )}
            {monolithCoefficients && (
              <>
                <div>
                  <dt className="text-gray-500">{t.analytics.formworkToVolumeRatio}</dt>
                  <dd className="font-medium tabular-nums">{round2(monolithCoefficients.formworkToVolumeRatio)}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">{t.analytics.poursPerM3}</dt>
                  <dd className="font-medium tabular-nums">{round2(monolithCoefficients.poursPerM3)}</dd>
                </div>
              </>
            )}
          </dl>
        </Card>
      )}

      <Card className="mt-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{t.analytics.recordActual}</p>
            <p className="text-xs text-gray-500">
              {t.analytics.personHours}: {loggedHours}
            </p>
          </div>
          {!recording && <Button onClick={startRecording}>{t.analytics.recordActual}</Button>}
        </div>

        {drawing.actualHours != null && !recording && (
          <p className="mt-2 text-sm text-green-600 dark:text-green-400">
            {t.analytics.actualRecorded}: {drawing.actualHours} {t.analytics.personHours.toLowerCase()} · {drawing.delayNotes}
          </p>
        )}

        {recording && (
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <TextField
              label={t.analytics.actualHours}
              type="number"
              min="0"
              value={actualHoursDraft}
              onChange={(e) => setActualHoursDraft(e.target.value)}
            />
            <TextField
              label={t.analytics.delayNotes}
              value={delayNotesDraft}
              onChange={(e) => setDelayNotesDraft(e.target.value)}
              className="sm:col-span-2"
            />
            <div className="flex gap-2 sm:col-span-2">
              <Button onClick={saveActual} disabled={!actualHoursDraft || !delayNotesDraft.trim()}>
                {t.common.save}
              </Button>
              <Button variant="ghost" onClick={() => setRecording(false)}>
                {t.common.cancel}
              </Button>
            </div>
          </div>
        )}
      </Card>

      <Card className="mt-4">
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{t.analytics.forecastTitle}</p>
        <p className="mt-1 text-xs text-gray-500">{t.analytics.forecastHint}</p>
        {forecast && (
          <p className="mt-3 text-sm">
            {forecast.hasEnoughData ? (
              <span className="text-2xl font-bold tabular-nums">{t.analytics.forecastResult(round2(forecast.predictedHours!))}</span>
            ) : (
              <span className="text-gray-500">{t.analytics.forecastNotEnough(forecast.sampleCount, forecast.minRequiredSamples)}</span>
            )}
          </p>
        )}
      </Card>
    </div>
  )
}
