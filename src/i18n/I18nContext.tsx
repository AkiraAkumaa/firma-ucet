import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import { dictionaries, type Dictionary, type Language } from './translations'

const STORAGE_KEY = 'ucet-firm:lang'

function readStoredLanguage(): Language {
  const stored = localStorage.getItem(STORAGE_KEY)
  return stored === 'uk' || stored === 'cs' ? stored : 'uk'
}

interface I18nContextValue {
  language: Language
  setLanguage: (language: Language) => void
  t: Dictionary
}

const I18nContext = createContext<I18nContextValue | null>(null)

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(readStoredLanguage)

  const setLanguage = (next: Language) => {
    localStorage.setItem(STORAGE_KEY, next)
    setLanguageState(next)
  }

  const value = useMemo<I18nContextValue>(
    () => ({ language, setLanguage, t: dictionaries[language] }),
    [language],
  )

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useI18n must be used within I18nProvider')
  return ctx
}

export function useT(): Dictionary {
  return useI18n().t
}

export function useLanguage(): [Language, (language: Language) => void] {
  const { language, setLanguage } = useI18n()
  return [language, setLanguage]
}
