import { useMemo } from 'react'
import { useT } from '../../i18n/I18nContext'
import { useBrigadeMemberships, useBrigades, useDrawingRecords, usePeople, useWorkHourEntries } from '../../db/hooks'
import { calculateBrigadeProductivity, calculatePersonProductivity } from '../../domain/analytics/personProductivity'
import { calculateBrigadeCoefficient, brigadeIdForPersonOnDate } from '../../domain/analytics/productivity'
import { Card } from '../../shared/ui/Card'
import type { WorkCategory, WorkHourEntry } from '../../domain/analytics/types'

const CATEGORIES: WorkCategory[] = ['armovani', 'monolit']

export function ProductivityTab() {
  const t = useT()
  const people = usePeople()
  const brigades = useBrigades()
  const entries = useWorkHourEntries()
  const drawings = useDrawingRecords()
  const memberships = useBrigadeMemberships()

  const brigadeIdForEntry = useMemo(() => {
    const personBrigadeId = new Map(people.map((p) => [p.id!, p.brigadeId]))
    return (entry: WorkHourEntry) => {
      const fallback = personBrigadeId.get(entry.personId)
      if (fallback == null) return null
      return brigadeIdForPersonOnDate(entry.personId, entry.date, memberships, fallback)
    }
  }, [people, memberships])

  const categoryLabel = (c: WorkCategory) => (c === 'armovani' ? t.analytics.categoryArmovani : t.analytics.categoryMonolit)
  const unitLabel = (c: WorkCategory) => (c === 'armovani' ? t.analytics.kgPerHour : t.analytics.m3PerHour)

  const personRows = useMemo(() => {
    const rows: { personId: number; name: string; brigadeName: string; category: WorkCategory; totalHours: number; ratePerHour: number | null }[] = []
    for (const person of people) {
      for (const category of CATEGORIES) {
        const result = calculatePersonProductivity(person.id!, category, entries, drawings)
        if (result.totalHours <= 0) continue
        rows.push({
          personId: person.id!,
          name: person.name,
          brigadeName: brigades.find((b) => b.id === person.brigadeId)?.name ?? '',
          category,
          totalHours: result.totalHours,
          ratePerHour: result.ratePerHour,
        })
      }
    }
    return rows.sort((a, b) => (b.ratePerHour ?? 0) - (a.ratePerHour ?? 0))
  }, [people, brigades, entries, drawings])

  const brigadeRows = useMemo(() => {
    const rows: { brigadeId: number; name: string; category: WorkCategory; ratePerHour: number; coefficient: number }[] = []
    for (const category of CATEGORIES) {
      const brigadeIds = new Set(brigades.map((b) => b.id!))
      const brigadeResults = [...brigadeIds]
        .map((brigadeId) => calculateBrigadeProductivity(brigadeId, category, entries, drawings, brigadeIdForEntry))
        .filter((r) => r.totalHours > 0 && r.ratePerHour != null)

      const totalHours = brigadeResults.reduce((sum, r) => sum + r.totalHours, 0)
      const companyAverage =
        totalHours > 0 ? brigadeResults.reduce((sum, r) => sum + r.ratePerHour! * r.totalHours, 0) / totalHours : 0

      for (const r of brigadeResults) {
        rows.push({
          brigadeId: r.brigadeId,
          name: brigades.find((br) => br.id === r.brigadeId)?.name ?? '',
          category,
          ratePerHour: r.ratePerHour!,
          coefficient: calculateBrigadeCoefficient(r.ratePerHour!, companyAverage),
        })
      }
    }
    return rows
  }, [brigades, entries, drawings, brigadeIdForEntry])

  return (
    <div>
      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{t.analytics.productivityTitle}</p>
      <p className="mt-1 text-xs text-gray-500">{t.analytics.brigadeCoefficientHint}</p>

      <Card className="mt-3 overflow-x-auto p-0">
        <table className="w-full min-w-[560px] text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-left text-gray-500 dark:border-gray-800">
              <th className="px-4 py-2 font-medium">{t.brigades.name}</th>
              <th className="px-4 py-2 font-medium">{t.analytics.workCategory}</th>
              <th className="px-4 py-2 text-right font-medium">{t.analytics.brigadeCoefficient}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {brigadeRows.length === 0 && (
              <tr>
                <td className="px-4 py-3 text-gray-500" colSpan={3}>
                  {t.common.noData}
                </td>
              </tr>
            )}
            {brigadeRows.map((row) => (
              <tr key={`${row.brigadeId}-${row.category}`}>
                <td className="px-4 py-2">{row.name}</td>
                <td className="px-4 py-2 text-gray-500">{categoryLabel(row.category)}</td>
                <td className="px-4 py-2 text-right font-medium tabular-nums">{row.coefficient.toFixed(2)}×</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <p className="mt-6 text-sm font-medium text-gray-700 dark:text-gray-300">{t.analytics.personHours}</p>
      <Card className="mt-2 overflow-x-auto p-0">
        <table className="w-full min-w-[560px] text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-left text-gray-500 dark:border-gray-800">
              <th className="px-4 py-2 font-medium">{t.people.name}</th>
              <th className="px-4 py-2 font-medium">{t.analytics.workCategory}</th>
              <th className="px-4 py-2 text-right font-medium">{t.analytics.personHours}</th>
              <th className="px-4 py-2 text-right font-medium">{t.analytics.kgPerHour} / {t.analytics.m3PerHour}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {personRows.length === 0 && (
              <tr>
                <td className="px-4 py-3 text-gray-500" colSpan={4}>
                  {t.analytics.noEntries}
                </td>
              </tr>
            )}
            {personRows.map((row) => (
              <tr key={`${row.personId}-${row.category}`}>
                <td className="px-4 py-2">
                  {row.name}
                  {row.brigadeName && <span className="text-gray-500"> · {row.brigadeName}</span>}
                </td>
                <td className="px-4 py-2 text-gray-500">{categoryLabel(row.category)}</td>
                <td className="px-4 py-2 text-right tabular-nums">{row.totalHours}</td>
                <td className="px-4 py-2 text-right tabular-nums">
                  {row.ratePerHour != null ? `${Math.round(row.ratePerHour * 100) / 100} ${unitLabel(row.category)}` : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  )
}
