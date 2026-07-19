import { useState } from 'react'
import { useT } from '../../i18n/I18nContext'

interface FormulaHintProps {
  text: string
}

/** Malé nenápadné "?" tlačítko vedle popisku formulového čísla — po kliknutí ukáže vysvětlení výpočtu. */
export function FormulaHint({ text }: FormulaHintProps) {
  const t = useT()
  const [open, setOpen] = useState(false)

  return (
    <span className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        title={t.common.howCalculated}
        aria-label={t.common.howCalculated}
        className="ml-1 inline-flex h-4 w-4 items-center justify-center rounded-full border border-gray-300 text-[10px] leading-none text-gray-400 hover:border-gray-400 hover:text-gray-600 dark:border-gray-700 dark:text-gray-500 dark:hover:text-gray-300"
      >
        ?
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full z-50 mt-1 w-64 max-w-[80vw] rounded-lg border border-gray-200 bg-white p-3 text-xs font-normal normal-case text-gray-600 shadow-lg dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
            {text}
          </div>
        </>
      )}
    </span>
  )
}
