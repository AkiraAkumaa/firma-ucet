import { useEffect } from 'react'
import { useT } from '../../i18n/I18nContext'
import { todayIso } from '../../shared/date'
import { DebtSummarySection } from './DebtSummarySection'

export function DebtSummaryPrint() {
  const t = useT()

  useEffect(() => {
    const timeout = setTimeout(() => window.print(), 300)
    return () => clearTimeout(timeout)
  }, [])

  return (
    <div className="mx-auto max-w-3xl bg-white p-8 text-gray-900">
      <h1 className="text-2xl font-bold">{t.common.appName}</h1>
      <p className="text-sm text-gray-500">{t.print.generatedOn} {todayIso()}</p>

      <div className="mt-6">
        <DebtSummarySection />
      </div>
    </div>
  )
}
