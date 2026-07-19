export type FeatureVector = Record<string, number>

/** Eukleidovská vzdálenost mezi dvěma vektory koeficientů — chybějící klíč se počítá jako 0. */
export function featureDistance(a: FeatureVector, b: FeatureVector): number {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)])
  let sumSq = 0
  for (const key of keys) {
    const diff = (a[key] ?? 0) - (b[key] ?? 0)
    sumSq += diff * diff
  }
  return Math.sqrt(sumSq)
}

export interface HistoricalSample {
  drawingRecordId: number
  features: FeatureVector
  actualHours: number
}

export interface ForecastNeighbor {
  drawingRecordId: number
  distance: number
  actualHours: number
  weight: number
}

export interface ForecastResult {
  hasEnoughData: boolean
  sampleCount: number
  minRequiredSamples: number
  /** null, pokud hasEnoughData je false. */
  predictedHours: number | null
  neighbors: ForecastNeighbor[]
}

export interface ForecastOptions {
  /** Kolik nejbližších sousedů brát do váženého průměru. */
  k?: number
  /** Pod tímto počtem historických vzorků (stejné workCategory) je prognóza příliš nespolehlivá na zobrazení. */
  minRequiredSamples?: number
}

/**
 * Prognóza trudovitrat = vážený průměr skutečných hodin N nejpodobnějších
 * minulých objektů (kNN podle eukleidovské vzdálenosti koeficientů), váha =
 * 1/vzdálenost. Číslo počítá vždy kód (deterministicky) — LLM (pokud se
 * později připojí) smí výsledek jen interpretovat/vysvětlit, nikdy nahradit.
 */
export function forecastLaborHours(
  target: FeatureVector,
  history: HistoricalSample[],
  options: ForecastOptions = {},
): ForecastResult {
  const k = options.k ?? 5
  const minRequiredSamples = options.minRequiredSamples ?? 10
  const sampleCount = history.length

  if (sampleCount < minRequiredSamples) {
    return { hasEnoughData: false, sampleCount, minRequiredSamples, predictedHours: null, neighbors: [] }
  }

  const nearest = history
    .map((sample) => ({ ...sample, distance: featureDistance(target, sample.features) }))
    .sort((a, b) => a.distance - b.distance)
    .slice(0, k)

  // +epsilon brání dělení nulou, když je vzdálenost přesně 0 (identická shoda).
  const weighted: ForecastNeighbor[] = nearest.map((sample) => ({
    drawingRecordId: sample.drawingRecordId,
    distance: sample.distance,
    actualHours: sample.actualHours,
    weight: 1 / (sample.distance + 0.0001),
  }))
  const totalWeight = weighted.reduce((sum, n) => sum + n.weight, 0)
  const predictedHours = weighted.reduce((sum, n) => sum + n.actualHours * n.weight, 0) / totalWeight

  return { hasEnoughData: true, sampleCount, minRequiredSamples, predictedHours, neighbors: weighted }
}
