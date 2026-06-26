import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
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
      <p className="font-semibold mb-2">FY {label}</p>
      {payload.map((p: any) => (
        <div key={p.name} className="flex items-center gap-2 mb-1">
          <div className="w-2 h-2 rounded-full" style={{ background: p.fill }} />
          <span className="text-muted-foreground">{p.name}:</span>
          <span className="font-medium">{formatLakh(p.value)}</span>
        </div>
      ))}
    </div>
  )
}

export function YearlyRevenueChart({ data, loading }: Props) {
  // Group by year
  const byYear = data.reduce<Record<number, { Revenue: number; Collections: number; Expenses: number }>>((acc, r) => {
    if (!acc[r.year]) acc[r.year] = { Revenue: 0, Collections: 0, Expenses: 0 }
    acc[r.year].Revenue += r.revenue
    acc[r.year].Collections += r.collections
    acc[r.year].Expenses += r.metrics.totalExpenses
    return acc
  }, {})

  const chartData = Object.entries(byYear).map(([year, vals]) => ({
    year,
    ...vals,
  }))

  return (
    <ChartCard title="Yearly Revenue Overview" subtitle="Annual revenue vs collections vs expenses" loading={loading}>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.5} />
          <XAxis dataKey="year" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} />
          <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} tickFormatter={formatLakh} width={70} />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Bar dataKey="Revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} />
          <Bar dataKey="Collections" fill="#10b981" radius={[4, 4, 0, 0]} />
          <Bar dataKey="Expenses" fill="#ef4444" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}
