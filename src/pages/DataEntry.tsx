import { useState } from 'react'
import { useT } from '../i18n/I18nContext'
import { HoursForm } from './entry/HoursForm'
import { OutputForm } from './entry/OutputForm'
import { ExpenseForm } from './entry/ExpenseForm'
import { PaymentForm } from './entry/PaymentForm'
import { SalaryForm } from './entry/SalaryForm'

type Tab = 'hours' | 'output' | 'salary' | 'expense' | 'payment'

export function DataEntry() {
  const t = useT()
  const [tab, setTab] = useState<Tab>('hours')

  const tabs: { key: Tab; label: string }[] = [
    { key: 'hours', label: t.entry.hoursTab },
    { key: 'output', label: t.entry.outputTab },
    { key: 'salary', label: t.entry.salaryTab },
    { key: 'expense', label: t.entry.expenseTab },
    { key: 'payment', label: t.entry.paymentTab },
  ]

  return (
    <div>
      <h1 className="text-2xl font-semibold">{t.entry.title}</h1>

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
        {tab === 'hours' && <HoursForm />}
        {tab === 'output' && <OutputForm />}
        {tab === 'salary' && <SalaryForm />}
        {tab === 'expense' && <ExpenseForm />}
        {tab === 'payment' && <PaymentForm />}
      </div>
    </div>
  )
}
