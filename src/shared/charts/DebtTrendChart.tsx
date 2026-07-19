import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useTheme } from '../theme/ThemeContext'
import { CHART_COLORS, type ChartPalette } from './colors'
import { formatMoney } from '../money'
import { formatCompactNumber } from './formatTick'
import type { DebtTrendPoint } from '../../domain/debt/debtTrend'

interface TooltipPayloadItem {
  value: number
}

function ChartTooltip({
  active,
  payload,
  label,
  colors,
}: {
  active?: boolean
  payload?: TooltipPayloadItem[]
  label?: string
  colors: ChartPalette
}) {
  if (!active || !payload || payload.length === 0) return null
  return (
    <div
      className="rounded-lg border px-3 py-2 text-sm shadow-sm"
      style={{ background: colors.surface, borderColor: colors.gridline, color: colors.textPrimary }}
    >
      <p style={{ color: colors.textSecondary }}>{label}</p>
      <p className="font-semibold">{formatMoney(payload[0].value)}</p>
    </div>
  )
}

interface DebtTrendChartProps {
  data: DebtTrendPoint[]
  /** Přepíše aktuální téma aplikace — pro tisk, kde chceme vždy světlý graf. */
  theme?: 'light' | 'dark'
}

export function DebtTrendChart({ data, theme: themeProp }: DebtTrendChartProps) {
  const { theme: contextTheme } = useTheme()
  const theme = themeProp ?? contextTheme
  const colors = CHART_COLORS[theme]

  return (
    <div className="h-64 rounded-xl border border-gray-200 bg-white p-2 dark:border-gray-800 dark:bg-gray-900">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 16, bottom: 0, left: 0 }}>
          <CartesianGrid stroke={colors.gridline} vertical={false} />
          <XAxis
            dataKey="month"
            tick={{ fill: colors.muted, fontSize: 12 }}
            axisLine={{ stroke: colors.baseline }}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: colors.muted, fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={formatCompactNumber}
            width={48}
          />
          <Tooltip content={<ChartTooltip colors={colors} />} />
          <Line
            type="monotone"
            dataKey="totalDebt"
            stroke={colors.seq}
            strokeWidth={2}
            dot={{ r: 4, fill: colors.seq, stroke: colors.surface, strokeWidth: 2 }}
            activeDot={{ r: 5, fill: colors.seq, stroke: colors.surface, strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
