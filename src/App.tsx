import { useEffect, useState } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { I18nProvider } from './i18n/I18nContext'
import { ThemeProvider } from './shared/theme/ThemeContext'
import { AppLayout } from './app/AppLayout'
import { ROUTES } from './app/routes'
import { ensureActiveTenant } from './tenant/bootstrap'
import { Overview } from './pages/Overview'
import { People } from './pages/People'
import { PersonDetail } from './pages/PersonDetail'
import { Brigades } from './pages/Brigades'
import { BrigadeDetail } from './pages/BrigadeDetail'
import { Sites } from './pages/Sites'
import { SiteDetail } from './pages/SiteDetail'
import { DataEntry } from './pages/DataEntry'
import { Company } from './pages/Company'
import { Summary } from './pages/Summary'
import { Analytics } from './pages/Analytics'
import { DrawingDetail } from './pages/analytics/DrawingDetail'
import { Settings } from './pages/Settings'
import { DebtSummaryPrint } from './pages/print/DebtSummaryPrint'
import { ReportPrint } from './pages/print/ReportPrint'
import { PersonPrint } from './pages/print/PersonPrint'
import { SitePrint } from './pages/print/SitePrint'
import { SummaryPrint } from './pages/print/SummaryPrint'
import { BrigadePrint } from './pages/print/BrigadePrint'

function App() {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    ensureActiveTenant().then(() => setReady(true))
  }, [])

  if (!ready) return null

  return (
    <I18nProvider>
      <ThemeProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<AppLayout />}>
              <Route path={ROUTES.overview} element={<Overview />} />
              <Route path={ROUTES.people} element={<People />} />
              <Route path={ROUTES.personDetail(':id')} element={<PersonDetail />} />
              <Route path={ROUTES.brigades} element={<Brigades />} />
              <Route path={ROUTES.brigadeDetail(':id')} element={<BrigadeDetail />} />
              <Route path={ROUTES.sites} element={<Sites />} />
              <Route path={ROUTES.siteDetail(':id')} element={<SiteDetail />} />
              <Route path={ROUTES.entry} element={<DataEntry />} />
              <Route path={ROUTES.company} element={<Company />} />
              <Route path={ROUTES.summary} element={<Summary />} />
              <Route path={ROUTES.analytics} element={<Analytics />} />
              <Route path={ROUTES.analyticsDrawingDetail(':id')} element={<DrawingDetail />} />
              <Route path={ROUTES.settings} element={<Settings />} />
            </Route>
            <Route path={ROUTES.printDebtSummary} element={<DebtSummaryPrint />} />
            <Route path={ROUTES.printReport} element={<ReportPrint />} />
            <Route path={ROUTES.printPerson(':id')} element={<PersonPrint />} />
            <Route path={ROUTES.printSite(':id')} element={<SitePrint />} />
            <Route path={ROUTES.printSummary} element={<SummaryPrint />} />
            <Route path={ROUTES.printBrigade(':id')} element={<BrigadePrint />} />
          </Routes>
        </BrowserRouter>
      </ThemeProvider>
    </I18nProvider>
  )
}

export default App
