import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useTheme } from '../theme/ThemeContext'
import { CHART_COLORS, type ChartPalette } from './colors'
import { formatMoney } from '../money'
import { formatCompactNumber } from './formatTick'

export interface MagnitudeDataPoint {
  name: string
  value: number
}

function BarTooltip({
  active,
  payload,
  colors,
}: {
  active?: boolean
  payload?: { value: number; payload: MagnitudeDataPoint }[]
  colors: ChartPalette
}) {
  if (!active || !payload || payload.length === 0) return null
  const point = payload[0].payload
  return (
    <div
      className="rounded-lg border px-3 py-2 text-sm shadow-sm"
      style={{ background: colors.surface, borderColor: colors.gridline, color: colors.textPrimary }}
    >
      <p style={{ color: colors.textSecondary }}>{point.name}</p>
      <p className="font-semibold">{formatMoney(point.value)}</p>
    </div>
  )
}

interface MagnitudeBarChartProps {
  data: MagnitudeDataPoint[]
  /** Přepíše aktuální téma aplikace — pro tisk, kde chceme vždy světlý graf. */
  theme?: 'light' | 'dark'
}

export function MagnitudeBarChart({ data, theme: themeProp }: MagnitudeBarChartProps) {
  const { theme: contextTheme } = useTheme()
  const theme = themeProp ?? contextTheme
  const colors = CHART_COLORS[theme]
  const height = Math.max(160, data.length * 40 + 24)
  const longestName = Math.max(...data.map((d) => d.name.length), 4)
  const yAxisWidth = Math.min(160, Math.max(70, longestName * 7))

  return (
    <div
      className="rounded-xl border border-gray-200 bg-white p-2 dark:border-gray-800 dark:bg-gray-900"
      style={{ height }}
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 8, right: 24, bottom: 8, left: 8 }}>
          <CartesianGrid stroke={colors.gridline} horizontal={false} />
          <XAxis
            type="number"
            tick={{ fill: colors.muted, fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={formatCompactNumber}
          />
          <YAxis
            type="category"
            dataKey="name"
            tick={{ fill: colors.textSecondary, fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            width={yAxisWidth}
          />
          <Tooltip content={<BarTooltip colors={colors} />} cursor={{ fill: colors.gridline, opacity: 0.4 }} />
          <Bar dataKey="value" fill={colors.seq} radius={[0, 4, 4, 0]} barSize={20} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
