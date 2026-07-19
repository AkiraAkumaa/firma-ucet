import { useState } from 'react'
import { useT } from '../i18n/I18nContext'
import { ProductivityTab } from './analytics/ProductivityTab'
import { HoursEntryTab } from './analytics/HoursEntryTab'
import { DrawingsListTab } from './analytics/DrawingsListTab'

type Tab = 'productivity' | 'hours' | 'drawings'

export function Analytics() {
  const t = useT()
  const [tab, setTab] = useState<Tab>('drawings')

  const tabs: { key: Tab; label: string }[] = [
    { key: 'drawings', label: t.analytics.tabDrawings },
    { key: 'hours', label: t.analytics.tabHours },
    { key: 'productivity', label: t.analytics.tabProductivity },
  ]

  return (
    <div>
      <h1 className="text-2xl font-semibold">{t.analytics.title}</h1>

      <div className="mt-4 flex gap-1 overflow-x-auto border-b border-gray-200 dark:border-gray-800">
        {tabs.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => setTab(item.key)}
            className={`shrink-0 border-b-2 px-3 py-2 text-sm font-medium ${
              tab === item.key
                ? 'border-gray-900 text-gray-900 dark:border-gray-100 dark:text-gray-100'
                : 'border-transparent text-gray-500 hover:text-gray-800 dark:hover:text-gray-300'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="mt-4">
        {tab === 'drawings' && <DrawingsListTab />}
        {tab === 'hours' && <HoursEntryTab />}
        {tab === 'productivity' && <ProductivityTab />}
      </div>
    </div>
  )
}
