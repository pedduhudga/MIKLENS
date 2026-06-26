import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { ChartCard } from './ChartCard'
import type { FinancialRecordWithMetrics } from '@/types'
import { formatLakh } from '@/lib/utils'

interface Props {
  data: FinancialRecordWithMetrics[]
  loading?: boolean
}

const COLORS = ['#ef4444', '#f59e0b', '#6366f1', '#8b5cf6', '#10b981']

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null
  const p = payload[0]
  return (
    <div className="bg-popover border border-border rounded-xl p-3 shadow-xl text-xs">
      <p className="font-semibold">{p.name}</p>
      <p className="text-muted-foreground">{formatLakh(p.value)}</p>
    </div>
  )
}

export function ExpenseBreakdownChart({ data, loading }: Props) {
  const totals = data.reduce(
    (acc, r) => ({
      COGS: acc.COGS + r.expenses.cogs,
      Employee: acc.Employee + r.expenses.employee,
      Finance: acc.Finance + r.expenses.finance,
      Depreciation: acc.Depreciation + r.expenses.depreciation,
      Other: acc.Other + r.expenses.other,
    }),
    { COGS: 0, Employee: 0, Finance: 0, Depreciation: 0, Other: 0 }
  )

  const chartData = Object.entries(totals)
    .filter(([, v]) => v > 0)
    .map(([name, value]) => ({ name, value }))

  return (
    <ChartCard title="Expense Breakdown" subtitle="Cost distribution analysis" loading={loading}>
      <ResponsiveContainer width="100%" height={260}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            outerRadius={100}
            paddingAngle={2}
            dataKey="value"
          >
            {chartData.map((_, index) => (
              <Cell key={index} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend formatter={(value) => <span style={{ fontSize: 12 }}>{value}</span>} />
        </PieChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}
