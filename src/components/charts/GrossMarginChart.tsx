import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer
} from 'recharts'
import { ChartCard } from './ChartCard'
import type { FinancialRecordWithMetrics } from '@/types'

interface Props {
  data: FinancialRecordWithMetrics[]
  loading?: boolean
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-popover border border-border rounded-xl p-3 shadow-xl text-xs">
      <p className="font-semibold mb-1">{label}</p>
      <p className="text-emerald-500 font-medium">Margin: {payload[0]?.value?.toFixed(1)}%</p>
    </div>
  )
}

export function GrossMarginChart({ data, loading }: Props) {
  const chartData = data.map(r => ({
    name: `${r.month.slice(0, 3)} ${r.year}`,
    margin: parseFloat(r.metrics.grossMarginPercent.toFixed(2)),
  }))

  return (
    <ChartCard title="Gross Margin Trend" subtitle="Monthly gross margin percentage" loading={loading}>
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
          <defs>
            <linearGradient id="marginGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.5} />
          <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} />
          <YAxis
            tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
            tickLine={false}
            tickFormatter={v => `${v}%`}
            width={45}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="margin"
            stroke="#10b981"
            strokeWidth={2.5}
            fill="url(#marginGrad)"
            dot={{ r: 3, fill: '#10b981' }}
            activeDot={{ r: 5 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}
