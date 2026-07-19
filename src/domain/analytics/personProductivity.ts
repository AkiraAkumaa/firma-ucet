import type { DrawingRecord, WorkCategory, WorkHourEntry } from './types'

export interface PersonProductivitySummary {
  personId: number
  workCategory: WorkCategory
  totalHours: number
  /** Vážený výkon na hodinu, přiřazený podle podílu osoby na hodinách daného kreslení. null = zatím žádná napojená data. */
  ratePerHour: number | null
  rateUnit: 'kg' | 'm3'
}

function drawingOutput(drawing: DrawingRecord): number {
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
 * Produktivita jedné osoby za daný druh práce — výkon kreslení (kg/m³) se
 * rozpočítá mezi lidi podle jejich podílu na odpracovaných hodinách na tom
 * kreslení, protože WorkHourEntry sám o sobě neříká, KOLIK KG udělala právě
 * tato osoba, jen kolik hodin tam strávila.
 */
export function calculatePersonProductivity(
  personId: number,
  workCategory: WorkCategory,
  entries: WorkHourEntry[],
  drawings: DrawingRecord[],
): PersonProductivitySummary {
  const personEntries = entries.filter((e) => e.personId === personId && e.workCategory === workCategory)
  const totalHours = personEntries.reduce((sum, e) => sum + e.hours, 0)

  let weightedOutput = 0
  let attributedHours = 0
  for (const drawing of drawings) {
    if (drawing.workCategory !== workCategory || drawing.id == null) continue
    const drawingTotalHours = calculateDrawingActualHours(drawing.id, entries)
    if (drawingTotalHours <= 0) continue
    const personHoursOnDrawing = personEntries
      .filter((e) => e.drawingRecordId === drawing.id)
      .reduce((sum, e) => sum + e.hours, 0)
    if (personHoursOnDrawing <= 0) continue

    const share = personHoursOnDrawing / drawingTotalHours
    weightedOutput += drawingOutput(drawing) * share
    attributedHours += personHoursOnDrawing
  }

  return {
    personId,
    workCategory,
    totalHours,
    ratePerHour: attributedHours > 0 ? weightedOutput / attributedHours : null,
    rateUnit: workCategory === 'armovani' ? 'kg' : 'm3',
  }
}
