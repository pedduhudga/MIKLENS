import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell
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
      <p className="font-semibold mb-1">{label}</p>
      <p>Collections: <span className="text-blue-500 font-medium">{formatLakh(payload[0]?.value)}</span></p>
      {payload[1] && <p>Revenue: <span className="text-gray-500 font-medium">{formatLakh(payload[1]?.value)}</span></p>}
    </div>
  )
}

export function CollectionsChart({ data, loading }: Props) {
  const chartData = data.map(r => ({
    name: r.month.slice(0, 3),
    Collections: r.collections,
    Revenue: r.revenue,
    efficiency: r.metrics.collectionPercent,
  }))

  return (
    <ChartCard title="Collections Trend" subtitle="Monthly collection performance" loading={loading}>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.5} />
          <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} />
          <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} tickFormatter={formatLakh} width={65} />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="Collections" radius={[4, 4, 0, 0]}>
            {chartData.map((entry, index) => (
              <Cell
                key={index}
                fill={entry.efficiency >= 90 ? '#10b981' : entry.efficiency >= 70 ? '#3b82f6' : '#f59e0b'}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}
