import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import { ChartCard } from './ChartCard'
import type { FinancialRecordWithMetrics } from '@/types'
import { formatLakh } from '@/lib/utils'

interface Props {
  data: FinancialRecordWithMetrics[]
  loading?: boolean
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-popover border border-border rounded-xl p-3 shadow-xl text-xs">
      <p className="font-semibold mb-2">{label}</p>
      {payload.map((p: any) => (
        <div key={p.name} className="flex items-center gap-2 mb-1">
          <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-muted-foreground">{p.name}:</span>
          <span className="font-medium">{formatLakh(p.value)}</span>
        </div>
      ))}
    </div>
  )
}

export function RevenueTrendChart({ data, loading }: Props) {
  const chartData = data.map(r => ({
    name: `${r.month.slice(0, 3)} ${r.year}`,
    Revenue: r.revenue,
    COGS: r.expenses.cogs,
    'Gross Margin': r.metrics.grossMargin,
  }))

  return (
    <ChartCard title="Revenue vs COGS Trend" subtitle="Monthly revenue and cost comparison" loading={loading}>
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.5} />
          <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} tickFormatter={formatLakh} width={70} />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Line type="monotone" dataKey="Revenue" stroke="#3b82f6" strokeWidth={2.5} dot={{ r: 3, fill: '#3b82f6' }} activeDot={{ r: 5 }} />
          <Line type="monotone" dataKey="COGS" stroke="#ef4444" strokeWidth={2} strokeDasharray="5 5" dot={{ r: 3, fill: '#ef4444' }} activeDot={{ r: 5 }} />
          <Line type="monotone" dataKey="Gross Margin" stroke="#10b981" strokeWidth={2} dot={{ r: 3, fill: '#10b981' }} activeDot={{ r: 5 }} />
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}
