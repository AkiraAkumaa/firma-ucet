import { NavLink, Outlet } from 'react-router-dom'
import { useT } from '../i18n/I18nContext'
import { LanguageSwitcher } from '../i18n/LanguageSwitcher'
import { ThemeToggle } from '../shared/theme/ThemeToggle'
import {
  AnalyticsIcon,
  BriefcaseIcon,
  BrigadeIcon,
  ChartIcon,
  HomeIcon,
  PeopleIcon,
  PlusCircleIcon,
  SettingsIcon,
  SiteIcon,
} from '../shared/icons'
import { TenantSwitcher } from '../tenant/TenantSwitcher'
import { ROUTES } from './routes'

function useNavItems() {
  const t = useT()
  return [
    { to: ROUTES.overview, label: t.nav.overview, icon: HomeIcon, end: true },
    { to: ROUTES.people, label: t.nav.people, icon: PeopleIcon, end: false },
    { to: ROUTES.brigades, label: t.nav.brigades, icon: BrigadeIcon, end: false },
    { to: ROUTES.sites, label: t.nav.sites, icon: SiteIcon, end: false },
    { to: ROUTES.company, label: t.nav.company, icon: BriefcaseIcon, end: false },
    { to: ROUTES.entry, label: t.nav.entry, icon: PlusCircleIcon, end: false },
    { to: ROUTES.summary, label: t.nav.summary, icon: ChartIcon, end: false },
    { to: ROUTES.analytics, label: t.nav.analytics, icon: AnalyticsIcon, end: false },
    { to: ROUTES.settings, label: t.nav.settings, icon: SettingsIcon, end: false },
  ]
}

export function AppLayout() {
  const t = useT()
  const items = useNavItems()

  return (
    <div className="flex min-h-screen flex-col bg-gray-50 text-gray-900 dark:bg-gray-950 dark:text-gray-100">
      <header className="sticky top-0 z-10 border-t-2 border-brand-600 bg-white/90 backdrop-blur dark:border-brand-400 dark:bg-gray-950/90">
        <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3 dark:border-gray-800 md:px-6">
          <span className="flex items-center gap-2 text-base font-semibold">
            <span className="inline-block h-2.5 w-2.5 rounded-sm bg-brand-600 dark:bg-brand-400" />
            {t.common.appName}
          </span>
          <div className="flex items-center gap-2">
            <TenantSwitcher />
            <LanguageSwitcher />
            <ThemeToggle />
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        <nav className="hidden w-56 shrink-0 border-r border-gray-200 p-4 dark:border-gray-800 md:block">
          <ul className="space-y-1">
            {items.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium ${
                      isActive
                        ? 'bg-brand-700 text-white dark:bg-brand-600'
                        : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
                    }`
                  }
                >
                  <item.icon className="h-5 w-5" />
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <main className="flex-1 px-4 pb-24 pt-4 md:px-6 md:pb-8 md:pt-6">
          <Outlet />
        </main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-10 flex border-t border-gray-200 bg-white/95 backdrop-blur dark:border-gray-800 dark:bg-gray-950/95 md:hidden">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-medium ${
                isActive ? 'text-brand-700 dark:text-brand-300' : 'text-gray-400 dark:text-gray-500'
              }`
            }
          >
            <item.icon className="h-5 w-5" />
            {item.label}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
