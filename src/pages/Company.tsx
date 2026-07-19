import { useT } from '../i18n/I18nContext'
import { WorkTypePricingManager } from './company/WorkTypePricingManager'
import { SiteWorkPlanManager } from './company/SiteWorkPlanManager'
import { MaterialCostForm } from './company/MaterialCostForm'
import { MaterialCostsList } from './company/MaterialCostsList'
import { CompanyExpensesList } from './company/CompanyExpensesList'
import { SitesProfitabilityList } from './company/SitesProfitabilityList'
import { ReportGenerator } from './company/ReportGenerator'

export function Company() {
  const t = useT()

  return (
    <div>
      <h1 className="text-2xl font-semibold">{t.company.title}</h1>

      <section className="mt-6">
        <h2 className="text-lg font-semibold">{t.company.pricingTitle}</h2>
        <div className="mt-2">
          <WorkTypePricingManager />
        </div>
      </section>

      <section className="mt-6">
        <h2 className="text-lg font-semibold">{t.company.planTitle}</h2>
        <div className="mt-2">
          <SiteWorkPlanManager />
        </div>
      </section>

      <section className="mt-6">
        <h2 className="text-lg font-semibold">{t.company.materialsTitle}</h2>
        <div className="mt-2 space-y-4">
          <MaterialCostForm />
          <MaterialCostsList />
        </div>
      </section>

      <section className="mt-6">
        <h2 className="text-lg font-semibold">{t.company.companyExpensesTitle}</h2>
        <div className="mt-2">
          <CompanyExpensesList />
        </div>
      </section>

      <section className="mt-6">
        <h2 className="text-lg font-semibold">{t.company.profitabilityTitle}</h2>
        <div className="mt-2">
          <SitesProfitabilityList />
        </div>
      </section>

      <section className="mt-6">
        <h2 className="text-lg font-semibold">{t.company.reportTitle}</h2>
        <div className="mt-2">
          <ReportGenerator />
        </div>
      </section>
    </div>
  )
}
