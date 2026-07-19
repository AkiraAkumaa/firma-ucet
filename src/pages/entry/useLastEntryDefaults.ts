import { useState } from 'react'
import { todayIso } from '../../shared/date'

const SITE_KEY = 'ucet-firm:lastSiteId'
const DATE_KEY = 'ucet-firm:lastDate'

/** Formulář hodin/výrobku si pamatuje naposledy použitou stavbu a datum. */
export function useLastEntryDefaults() {
  const [siteId, setSiteIdState] = useState(() => localStorage.getItem(SITE_KEY) ?? '')
  const [date, setDateState] = useState(() => localStorage.getItem(DATE_KEY) ?? todayIso())

  const setSiteId = (value: string) => {
    localStorage.setItem(SITE_KEY, value)
    setSiteIdState(value)
  }

  const setDate = (value: string) => {
    localStorage.setItem(DATE_KEY, value)
    setDateState(value)
  }

  return { siteId, setSiteId, date, setDate }
}
