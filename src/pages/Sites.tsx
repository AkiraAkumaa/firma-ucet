import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useT } from '../i18n/I18nContext'
import { useHoursEntries, useOutputEntries, useSites } from '../db/hooks'
import { hoursEntryAmount } from '../domain/hours/calc'
import { outputEntryAmount } from '../domain/output/calc'
import { formatMoney } from '../shared/money'
import { Card } from '../shared/ui/Card'
import { TextField } from '../shared/ui/TextField'
import { ROUTES } from '../app/routes'

export function Sites() {
  const t = useT()
  const sites = useSites()
  const hoursEntries = useHoursEntries()
  const outputEntries = useOutputEntries()
  const [search, setSearch] = useState('')

  const laborCostBySite = useMemo(() => {
    const map = new Map<number, number>()
    for (const e of hoursEntries) map.set(e.siteId, (map.get(e.siteId) ?? 0) + hoursEntryAmount(e))
    for (const e of outputEntries) map.set(e.siteId, (map.get(e.siteId) ?? 0) + outputEntryAmount(e))
    return map
  }, [hoursEntries, outputEntries])

  const filteredSites = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return sites
    return sites.filter((s) => s.name.toLowerCase().includes(query) || s.address.toLowerCase().includes(query))
  }, [sites, search])

  return (
    <div>
      <h1 className="text-2xl font-semibold">{t.sites.title}</h1>

      {sites.length > 0 && (
        <TextField
          label={t.common.search}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="mt-4 max-w-sm"
        />
      )}

      <Card className="mt-4 p-0">
        <ul className="divide-y divide-gray-100 dark:divide-gray-800">
          {filteredSites.length === 0 && (
            <li className="p-4 text-sm text-gray-500">{sites.length === 0 ? t.sites.noSites : t.common.noData}</li>
          )}
          {filteredSites.map((site) => (
            <li key={site.id}>
              <Link
                to={ROUTES.siteDetail(site.id!)}
                className="flex items-center justify-between gap-3 p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50"
              >
                <span>
                  <span className="font-medium">{site.name}</span>{' '}
                  <span className="text-sm text-gray-500">
                    · {site.address} · {site.status === 'active' ? t.siteStatus.active : t.siteStatus.completed}
                  </span>
                </span>
                <span className="text-lg font-semibold tabular-nums">{formatMoney(laborCostBySite.get(site.id!) ?? 0)}</span>
              </Link>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  )
}
