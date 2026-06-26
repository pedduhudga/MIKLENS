import { useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import { TrendingUp, TrendingDown, Award, AlertCircle } from 'lucide-react'
import { ChartCard } from '@/components/charts/ChartCard'
import { DashboardFilters } from '@/components/dashboard/DashboardFilters'
import { useFinancialStore } from '@/store/financialStore'
import { calculateAggregates } from '@/lib/calculations'
import { formatLakh, formatPercent } from '@/lib/utils'

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-popover border border-border rounded-xl p-3 shadow-xl text-xs">
      <p className="font-semibold mb-2">{label}</p>
      {payload.map((p: any) => (
        <div key={p.name} className="flex items-center gap-2 mb-1">
          <div className="w-2 h-2 rounded-full" style={{ background: p.color || p.stroke }} />
          <span className="text-muted-foreground">{p.name}:</span>
          <span className="font-medium">
            {typeof p.value === 'number' && p.name.includes('%')
              ? `${p.value.toFixed(1)}%`
              : formatLakh(p.value)}
          </span>
        </div>
      ))}
    </div>
  )
}

export default function AnalyticsPage() {
  const { isLoading, getFilteredRecords, enrichedRecords } = useFinancialStore()
  const filteredRecords = getFilteredRecords()
  const aggregates = useMemo(() => calculateAggregates(filteredRecords), [filteredRecords])

  const chartData = filteredRecords.map(r => ({
    name: `${r.month.slice(0, 3)} ${r.year}`,
    Revenue: r.revenue,
    Expenses: r.metrics.totalExpenses,
    Collections: r.collections,
    'Gross Margin %': parseFloat(r.metrics.grossMarginPercent.toFixed(1)),
    'Net Margin %': parseFloat(r.metrics.netMarginPercent.toFixed(1)),
    'Collection %': parseFloat(r.metrics.collectionPercent.toFixed(1)),
    Growth: parseFloat(r.metrics.monthlyGrowth.toFixed(1)),
  }))

  const highlights = [
    {
      label: 'Best Revenue Month',
      value: aggregates.highestRevenueMonth
        ? `${aggregates.highestRevenueMonth.month} ${aggregates.highestRevenueMonth.year}`
        : 'N/A',
      sub: aggregates.highestRevenueMonth ? formatLakh(aggregates.highestRevenueMonth.revenue) : '',
      icon: Award,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50 dark:bg-emerald-900/20',
    },
    {
      label: 'Lowest Revenue Month',
      value: aggregates.lowestRevenueMonth
        ? `${aggregates.lowestRevenueMonth.month} ${aggregates.lowestRevenueMonth.year}`
        : 'N/A',
      sub: aggregates.lowestRevenueMonth ? formatLakh(aggregates.lowestRevenueMonth.revenue) : '',
      icon: TrendingDown,
      color: 'text-red-600',
      bg: 'bg-red-50 dark:bg-red-900/20',
    },
    {
      label: 'Best Collection Month',
      value: aggregates.bestCollectionMonth
        ? `${aggregates.bestCollectionMonth.month} ${aggregates.bestCollectionMonth.year}`
        : 'N/A',
      sub: aggregates.bestCollectionMonth ? formatPercent(aggregates.bestCollectionMonth.metrics.collectionPercent) : '',
      icon: TrendingUp,
      color: 'text-blue-600',
      bg: 'bg-blue-50 dark:bg-blue-900/20',
    },
    {
      label: 'Avg Monthly Revenue',
      value: formatLakh(aggregates.avgMonthlyRevenue),
      sub: `Over ${filteredRecords.length} months`,
      icon: AlertCircle,
      color: 'text-purple-600',
      bg: 'bg-purple-50 dark:bg-purple-900/20',
    },
  ]

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Analytics</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Deep dive into financial trends and performance</p>
        </div>
        <DashboardFilters />
      </motion.div>

      {/* Highlights */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {highlights.map((h, i) => {
          const Icon = h.icon
          return (
            <motion.div
              key={h.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="glass-card rounded-2xl p-4"
            >
              <div className={`inline-flex p-2 rounded-lg ${h.bg} mb-3`}>
                <Icon size={16} className={h.color} />
              </div>
              <p className="text-xs text-muted-foreground font-medium">{h.label}</p>
              <p className={`text-lg font-bold ${h.color} mt-0.5`}>{h.value}</p>
              {h.sub && <p className="text-xs text-muted-foreground">{h.sub}</p>}
            </motion.div>
          )
        })}
      </div>

      {/* Revenue & Expense Growth */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="Revenue Growth" subtitle="Revenue vs Total Expenses trend" loading={isLoading}>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.5} />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} tickFormatter={formatLakh} width={70} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Line type="monotone" dataKey="Revenue" stroke="#3b82f6" strokeWidth={2.5} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="Expenses" stroke="#ef4444" strokeWidth={2} strokeDasharray="5 5" dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Margin Trends" subtitle="Gross & Net margin % over time" loading={isLoading}>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="gmGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="nmGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.5} />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} tickFormatter={v => `${v}%`} width={45} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Area type="monotone" dataKey="Gross Margin %" stroke="#10b981" fill="url(#gmGrad)" strokeWidth={2} dot={{ r: 2 }} />
              <Area type="monotone" dataKey="Net Margin %" stroke="#6366f1" fill="url(#nmGrad)" strokeWidth={2} dot={{ r: 2 }} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Collection & Growth */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="Collection Rate Trend" subtitle="Monthly collection efficiency %" loading={isLoading}>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.5} />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} tickFormatter={v => `${v}%`} width={45} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="Collection %" stroke="#3b82f6" fill="url(#colGrad)" strokeWidth={2.5} dot={{ r: 3 }} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Monthly Growth Rate" subtitle="Month-over-month revenue growth %" loading={isLoading}>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.5} />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} tickFormatter={v => `${v}%`} width={45} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="Growth" radius={[4, 4, 0, 0]}
                fill="#8b5cf6"
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Summary Table */}
      {filteredRecords.length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card rounded-2xl overflow-hidden">
          <div className="p-5 border-b border-border">
            <h3 className="font-semibold">Performance Summary</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Detailed monthly metrics</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  {['Period', 'Revenue', 'Gross Margin', 'GM%', 'Net Profit', 'NM%', 'Collections', 'Col%', 'MoM Growth'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredRecords.map((r, i) => (
                  <tr key={r.id} className={`border-b border-border/50 hover:bg-accent/30 transition-colors ${i % 2 === 0 ? '' : 'bg-muted/20'}`}>
                    <td className="px-4 py-3 font-medium whitespace-nowrap">{r.month.slice(0, 3)} {r.year}</td>
                    <td className="px-4 py-3 text-blue-600 font-medium">{formatLakh(r.revenue)}</td>
                    <td className="px-4 py-3 text-emerald-600">{formatLakh(r.metrics.grossMargin)}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${r.metrics.grossMarginPercent >= 30 ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                        {r.metrics.grossMarginPercent.toFixed(1)}%
                      </span>
                    </td>
                    <td className={`px-4 py-3 font-medium ${r.metrics.netMargin >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                      {formatLakh(r.metrics.netMargin)}
                    </td>
                    <td className="px-4 py-3 text-xs">{r.metrics.netMarginPercent.toFixed(1)}%</td>
                    <td className="px-4 py-3">{formatLakh(r.collections)}</td>
                    <td className="px-4 py-3 text-xs">{r.metrics.collectionPercent.toFixed(1)}%</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 text-xs font-medium ${r.metrics.monthlyGrowth >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                        {r.metrics.monthlyGrowth >= 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                        {Math.abs(r.metrics.monthlyGrowth).toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}
    </div>
  )
}
