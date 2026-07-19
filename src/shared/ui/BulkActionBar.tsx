import type { ReactNode } from 'react'
import { useT } from '../../i18n/I18nContext'
import { Button } from './Button'

interface BulkActionBarProps {
  count: number
  onClear: () => void
  children: ReactNode
}

/** Plovoucí lišta akcí nad hromadně vybranými řádky — schovaná, dokud není nic vybráno. */
export function BulkActionBar({ count, onClear, children }: BulkActionBarProps) {
  const t = useT()
  if (count === 0) return null

  return (
    <div className="fixed inset-x-0 bottom-16 z-20 flex justify-center px-4 md:bottom-6">
      <div className="flex flex-wrap items-center gap-3 rounded-xl bg-gray-900 px-4 py-3 text-sm text-white shadow-lg dark:bg-gray-100 dark:text-gray-900">
        <span className="font-medium">{t.common.selectedCount(count)}</span>
        <div className="flex flex-wrap items-center gap-2">{children}</div>
        <Button variant="ghost" onClick={onClear} className="text-white hover:bg-white/10 dark:text-gray-900 dark:hover:bg-black/10">
          {t.common.cancel}
        </Button>
      </div>
    </div>
  )
}
