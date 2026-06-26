import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { ChartCard } from './ChartCard'
import type { FinancialRecordWithMetrics } from '@/types'
import { formatLakh } from '@/lib/utils'

interface Props {
  data: FinancialRecordWithMetrics[]
  loading?: boolean
}

const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b']

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null
  const p = payload[0]
  return (
    <div className="bg-popover border border-border rounded-xl p-3 shadow-xl text-xs">
      <p className="font-semibold">{p.name}</p>
      <p className="text-muted-foreground">{formatLakh(p.value)} ({p.payload.percent?.toFixed(1)}%)</p>
    </div>
  )
}

const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
  if (!percent || percent < 0.05) return null
  const RADIAN = Math.PI / 180
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5
  const x = cx + radius * Math.cos(-midAngle * RADIAN)
  const y = cy + radius * Math.sin(-midAngle * RADIAN)
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={600}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  )
}

export function RevenueCompositionChart({ data, loading }: Props) {
  const totals = data.reduce(
    (acc, r) => ({
      Export: acc.Export + r.sales.export,
      B2B: acc.B2B + r.sales.b2b,
      Retail: acc.Retail + r.sales.retail,
      Bulk: acc.Bulk + r.sales.bulk,
    }),
    { Export: 0, B2B: 0, Retail: 0, Bulk: 0 }
  )

  const total = Object.values(totals).reduce((s, v) => s + v, 0)
  const chartData = Object.entries(totals)
    .filter(([, v]) => v > 0)
    .map(([name, value]) => ({ name, value, percent: total > 0 ? (value / total) * 100 : 0 }))

  return (
    <ChartCard title="Revenue Composition" subtitle="Sales breakdown by channel" loading={loading}>
      <ResponsiveContainer width="100%" height={260}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={100}
            paddingAngle={3}
            dataKey="value"
            labelLine={false}
            label={({ cx, cy, midAngle, innerRadius, outerRadius, value }) => {
              if (!value || total === 0) return null
              const pct = (value / total) * 100
              if (pct < 5) return null
              const RADIAN = Math.PI / 180
              const radius = innerRadius + (outerRadius - innerRadius) * 0.5
              const x = cx + radius * Math.cos(-midAngle * RADIAN)
              const y = cy + radius * Math.sin(-midAngle * RADIAN)
              return (
                <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={600}>
                  {`${pct.toFixed(0)}%`}
                </text>
              )
            }}
          >
            {chartData.map((_, index) => (
              <Cell key={index} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend
            formatter={(value) => <span style={{ fontSize: 12 }}>{value}</span>}
          />
        </PieChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}
