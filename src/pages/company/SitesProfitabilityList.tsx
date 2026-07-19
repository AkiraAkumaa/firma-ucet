import { Link } from 'react-router-dom'
import { useT } from '../../i18n/I18nContext'
import { useSites } from '../../db/hooks'
import { useAllSitesProfitability } from '../../domain/profitability/useProfitability'
import { formatMoney } from '../../shared/money'
import { Card } from '../../shared/ui/Card'
import { ROUTES } from '../../app/routes'

export function SitesProfitabilityList() {
  const t = useT()
  const sites = useSites()
  const profitability = useAllSitesProfitability()

  const sorted = [...sites].sort((a, b) => {
    const profitA = profitability.get(a.id!)?.netProfit ?? 0
    const profitB = profitability.get(b.id!)?.netProfit ?? 0
    return profitB - profitA
  })

  return (
    <Card className="p-0">
      <ul className="divide-y divide-gray-100 dark:divide-gray-800">
        {sorted.length === 0 && <li className="p-4 text-sm text-gray-500">{t.sites.noSites}</li>}
        {sorted.map((site) => {
          const netProfit = profitability.get(site.id!)?.netProfit ?? 0
          return (
            <li key={site.id}>
              <Link
                to={ROUTES.siteDetail(site.id!)}
                className="flex items-center justify-between gap-3 p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50"
              >
                <span className="font-medium">{site.name}</span>
                <span
                  className={`text-lg font-semibold tabular-nums ${
                    netProfit > 0
                      ? 'text-green-600 dark:text-green-400'
                      : netProfit < 0
                        ? 'text-red-600 dark:text-red-400'
                        : 'text-gray-400'
                  }`}
                >
                  {formatMoney(netProfit)}
                </span>
              </Link>
            </li>
          )
        })}
      </ul>
    </Card>
  )
}
