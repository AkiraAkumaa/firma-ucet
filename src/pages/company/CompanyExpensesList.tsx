import { useState } from 'react'
import { useT } from '../../i18n/I18nContext'
import { useExpenseCategories, useExpenses, useSites } from '../../db/hooks'
import { formatMoney } from '../../shared/money'
import { Card } from '../../shared/ui/Card'
import { SelectField } from '../../shared/ui/SelectField'

function viewAttachment(blob: Blob) {
  const url = URL.createObjectURL(blob)
  window.open(url, '_blank')
  setTimeout(() => URL.revokeObjectURL(url), 60_000)
}

/** Výdaje, které zaplatila přímo firma (ne osoba ze svého) — nikde jinde se nezobrazují, protože nejsou vázané na žádnou osobu. */
export function CompanyExpensesList() {
  const t = useT()
  const expenses = useExpenses()
  const sites = useSites()
  const categories = useExpenseCategories()
  const [siteFilter, setSiteFilter] = useState('')

  const siteName = (siteId?: number) => (siteId != null ? sites.find((s) => s.id === siteId)?.name ?? '' : '')
  const categoryName = (categoryId: number) => categories.find((c) => c.id === categoryId)?.name ?? ''
  const siteOptions = [{ value: '', label: t.company.allSitesOption }, ...sites.map((s) => ({ value: String(s.id), label: s.name }))]
  const total = expenses.filter((e) => e.paidByCompany).reduce((sum, e) => sum + e.amount, 0)
  const companyExpenses = expenses
    .filter((e) => e.paidByCompany && (siteFilter === '' || e.siteId === Number(siteFilter)))
    .sort((a, b) => b.date.localeCompare(a.date))

  return (
    <Card className="p-0">
      <div className="flex flex-wrap items-end justify-between gap-3 p-4 pb-0">
        <div className="w-56">
          <SelectField label={t.entry.site} options={siteOptions} value={siteFilter} onChange={(e) => setSiteFilter(e.target.value)} />
        </div>
        <p className="text-sm text-gray-500">
          {t.common.total}: <span className="font-semibold text-gray-900 dark:text-gray-100">{formatMoney(total)}</span>
        </p>
      </div>
      <ul className="mt-2 divide-y divide-gray-100 dark:divide-gray-800">
        {companyExpenses.length === 0 && <li className="p-4 text-sm text-gray-500">{t.common.noData}</li>}
        {companyExpenses.map((expense) => (
          <li key={expense.id} className="flex items-center justify-between gap-3 p-4 text-sm">
            <span>
              <span className="text-gray-500">{expense.date}</span> · <span className="font-medium">{categoryName(expense.categoryId)}</span>
              {expense.siteId != null && <span className="text-gray-500"> · {siteName(expense.siteId)}</span>}
              {expense.note && <span className="text-gray-500"> · {expense.note}</span>}
              {expense.attachment && (
                <>
                  {' · '}
                  <button
                    type="button"
                    onClick={() => viewAttachment(expense.attachment!.blob)}
                    className="text-blue-600 underline dark:text-blue-400"
                  >
                    {t.entry.attachment}
                  </button>
                </>
              )}
            </span>
            <span className="tabular-nums">{formatMoney(expense.amount)}</span>
          </li>
        ))}
      </ul>
    </Card>
  )
}
