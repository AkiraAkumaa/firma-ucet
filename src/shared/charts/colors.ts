export interface ChartPalette {
  surface: string
  textPrimary: string
  textSecondary: string
  muted: string
  gridline: string
  baseline: string
  /** Sekvenční odstín (jedna barva) pro grafy velikosti/trendu. */
  seq: string
}

export const CHART_COLORS: Record<'light' | 'dark', ChartPalette> = {
  light: {
    surface: '#fcfcfb',
    textPrimary: '#0b0b0b',
    textSecondary: '#52514e',
    muted: '#898781',
    gridline: '#e1e0d9',
    baseline: '#c3c2b7',
    seq: '#2a78d6',
  },
  dark: {
    surface: '#1a1a19',
    textPrimary: '#ffffff',
    textSecondary: '#c3c2b7',
    muted: '#898781',
    gridline: '#2c2c2a',
    baseline: '#383835',
    seq: '#3987e5',
  },
}
