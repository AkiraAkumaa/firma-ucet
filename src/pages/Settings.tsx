import { useState } from 'react'
import { useT } from '../i18n/I18nContext'
import { BrigadesManager } from './settings/BrigadesManager'
import { PeopleManager } from './settings/PeopleManager'
import { SitesManager } from './settings/SitesManager'
import { WorkTypesManager } from './settings/WorkTypesManager'
import { ExpenseCategoriesManager } from './settings/ExpenseCategoriesManager'
import { BackupManager } from './settings/BackupManager'

type Tab = 'brigades' | 'people' | 'sites' | 'workTypes' | 'expenseCategories' | 'backup'

export function Settings() {
  const t = useT()
  const [tab, setTab] = useState<Tab>('brigades')

  const tabs: { key: Tab; label: string }[] = [
    { key: 'brigades', label: t.settings.brigadesTab },
    { key: 'people', label: t.settings.peopleTab },
    { key: 'sites', label: t.settings.sitesTab },
    { key: 'workTypes', label: t.settings.workTypesTab },
    { key: 'expenseCategories', label: t.settings.expenseCategoriesTab },
    { key: 'backup', label: t.settings.backupTab },
  ]

  return (
    <div>
      <h1 className="text-2xl font-semibold">{t.settings.title}</h1>

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
        {tab === 'brigades' && <BrigadesManager />}
        {tab === 'people' && <PeopleManager />}
        {tab === 'sites' && <SitesManager />}
        {tab === 'workTypes' && <WorkTypesManager />}
        {tab === 'expenseCategories' && <ExpenseCategoriesManager />}
        {tab === 'backup' && <BackupManager />}
      </div>
    </div>
  )
}
