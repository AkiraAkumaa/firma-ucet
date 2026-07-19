import { useLanguage } from './I18nContext'

const OPTIONS: { value: 'uk' | 'cs'; label: string }[] = [
  { value: 'uk', label: 'UA' },
  { value: 'cs', label: 'CZ' },
]

export function LanguageSwitcher() {
  const [language, setLanguage] = useLanguage()

  return (
    <div className="inline-flex rounded-lg border border-gray-300 p-0.5 dark:border-gray-700">
      {OPTIONS.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => setLanguage(option.value)}
          className={`rounded-md px-2.5 py-1 text-sm font-medium transition-colors ${
            language === option.value
              ? 'bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900'
              : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100'
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}
