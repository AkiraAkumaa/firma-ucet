import type { DrawingRecord, WorkCategory, WorkHourEntry } from './types'

export interface PersonProductivitySummary {
  personId: number
  workCategory: WorkCategory
  totalHours: number
  /** Vážený výkon na hodinu, přiřazený podle podílu osoby na hodinách daného kreslení. null = zatím žádná napojená data. */
  ratePerHour: number | null
  rateUnit: 'kg' | 'm3'
}

export function drawingOutput(drawing: DrawingRecord): number {
  if (drawing.workCategory === 'armovani') return drawing.rebar?.massByDiameter.reduce((sum, d) => sum + d.massKg, 0) ?? 0
  return drawing.monolith?.concreteVolumeByThickness.reduce((sum, c) => sum + c.volumeM3, 0) ?? 0
}

/**
 * Sečte hodiny WorkHourEntry napojené na toto kreslení — "skutečné" hodiny pro
 * prognózu i pro dopočet produktivity, bez ohledu na to, kdo konkrétně dělal.
 */
export function calculateDrawingActualHours(drawingRecordId: number, entries: WorkHourEntry[]): number {
  return entries.filter((e) => e.drawingRecordId === drawingRecordId).reduce((sum, e) => sum + e.hours, 0)
}

/**
 * Výkon kreslení (kg/m³) rozpočítaný mezi skupiny (osoby/party) podle jejich
 * podílu na odpracovaných hodinách na tom kreslení — WorkHourEntry sám o sobě
 * neříká, KOLIK KG udělala právě tato skupina, jen kolik hodin tam strávila.
 * `groupKeyFor` mapuje záznam na klíč skupiny (personId, nebo brigadeId podle
 * data záznamu) — null = záznam se do žádné skupiny nepočítá.
 */
function calculateGroupProductivity(
  groupKey: number,
  workCategory: WorkCategory,
  entries: WorkHourEntry[],
  drawings: DrawingRecord[],
  groupKeyFor: (entry: WorkHourEntry) => number | null,
): { totalHours: number; ratePerHour: number | null } {
  const groupEntries = entries.filter((e) => e.workCategory === workCategory && groupKeyFor(e) === groupKey)
  const totalHours = groupEntries.reduce((sum, e) => sum + e.hours, 0)

  let weightedOutput = 0
  let attributedHours = 0
  for (const drawing of drawings) {
    if (drawing.workCategory !== workCategory || drawing.id == null) continue
    const drawingTotalHours = calculateDrawingActualHours(drawing.id, entries)
    if (drawingTotalHours <= 0) continue
    const groupHoursOnDrawing = groupEntries.filter((e) => e.drawingRecordId === drawing.id).reduce((sum, e) => sum + e.hours, 0)
    if (groupHoursOnDrawing <= 0) continue

    const share = groupHoursOnDrawing / drawingTotalHours
    weightedOutput += drawingOutput(drawing) * share
    attributedHours += groupHoursOnDrawing
  }

  return { totalHours, ratePerHour: attributedHours > 0 ? weightedOutput / attributedHours : null }
}

/** Produktivita jedné osoby za daný druh práce — viz calculateGroupProductivity. */
export function calculatePersonProductivity(
  personId: number,
  workCategory: WorkCategory,
  entries: WorkHourEntry[],
  drawings: DrawingRecord[],
): PersonProductivitySummary {
  const { totalHours, ratePerHour } = calculateGroupProductivity(personId, workCategory, entries, drawings, (e) => e.personId)
  return { personId, workCategory, totalHours, ratePerHour, rateUnit: workCategory === 'armovani' ? 'kg' : 'm3' }
}

export interface BrigadeProductivitySummary {
  brigadeId: number
  workCategory: WorkCategory
  totalHours: number
  ratePerHour: number | null
  rateUnit: 'kg' | 'm3'
}

/**
 * Produktivita party za daný druh práce — na rozdíl od osoby se příslušnost k
 * partě určuje PRO KAŽDÝ ZÁZNAM ZVLÁŠŤ podle jeho data (`brigadeIdForEntry`),
 * protože lidé mezi partami přechází a stará aktivita musí zůstat přiřazená
 * partě, ve které tehdy skutečně byli.
 */
export function calculateBrigadeProductivity(
  brigadeId: number,
  workCategory: WorkCategory,
  entries: WorkHourEntry[],
  drawings: DrawingRecord[],
  brigadeIdForEntry: (entry: WorkHourEntry) => number | null,
): BrigadeProductivitySummary {
  const { totalHours, ratePerHour } = calculateGroupProductivity(brigadeId, workCategory, entries, drawings, brigadeIdForEntry)
  return { brigadeId, workCategory, totalHours, ratePerHour, rateUnit: workCategory === 'armovani' ? 'kg' : 'm3' }
}
