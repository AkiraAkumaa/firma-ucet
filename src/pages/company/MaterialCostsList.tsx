import { useT } from '../../i18n/I18nContext'
import { useSiteMaterialCosts, useSites } from '../../db/hooks'
import { formatMoney } from '../../shared/money'
import { Card } from '../../shared/ui/Card'

function viewAttachment(blob: Blob) {
  const url = URL.createObjectURL(blob)
  window.open(url, '_blank')
  setTimeout(() => URL.revokeObjectURL(url), 60_000)
}

export function MaterialCostsList() {
  const t = useT()
  const sites = useSites()
  const materialCosts = useSiteMaterialCosts()

  const siteName = (siteId: number) => sites.find((s) => s.id === siteId)?.name ?? ''
  const sorted = [...materialCosts].sort((a, b) => b.date.localeCompare(a.date))

  return (
    <Card className="p-0">
      <ul className="divide-y divide-gray-100 dark:divide-gray-800">
        {sorted.length === 0 && <li className="p-4 text-sm text-gray-500">{t.common.noData}</li>}
        {sorted.map((cost) => (
          <li key={cost.id} className="flex items-center justify-between gap-3 p-4 text-sm">
            <span>
              <span className="text-gray-500">{cost.date}</span> · <span className="font-medium">{siteName(cost.siteId)}</span>
              {cost.note && <span className="text-gray-500"> · {cost.note}</span>}
              {cost.attachment && (
                <>
                  {' · '}
                  <button
                    type="button"
                    onClick={() => viewAttachment(cost.attachment!.blob)}
                    className="text-blue-600 underline dark:text-blue-400"
                  >
                    {t.entry.attachment}
                  </button>
                </>
              )}
            </span>
            <span className="tabular-nums">{formatMoney(cost.amount)}</span>
          </li>
        ))}
      </ul>
    </Card>
  )
}
