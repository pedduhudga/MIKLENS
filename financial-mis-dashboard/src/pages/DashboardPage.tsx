import { useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  TrendingUp, DollarSign, Target, CreditCard,
  ShoppingCart, Receipt, Percent, Activity
} from 'lucide-react'
import { KPICard } from '@/components/dashboard/KPICard'
import { DashboardFilters } from '@/components/dashboard/DashboardFilters'
import { RevenueTrendChart } from '@/components/charts/RevenueTrendChart'
import { RevenueCompositionChart } from '@/components/charts/RevenueCompositionChart'
import { ExpenseBreakdownChart } from '@/components/charts/ExpenseBreakdownChart'
import { GrossMarginChart } from '@/components/charts/GrossMarginChart'
import { CollectionsChart } from '@/components/charts/CollectionsChart'
import { MonthlyProfitChart } from '@/components/charts/MonthlyProfitChart'
import { YearlyRevenueChart } from '@/components/charts/YearlyRevenueChart'
import { useFinancialStore } from '@/store/financialStore'
import { calculateAggregates } from '@/lib/calculations'
import { formatLakh, formatPercent } from '@/lib/utils'

export default function DashboardPage() {
  const { isLoading, getFilteredRecords, getLatestRecord, enrichedRecords } = useFinancialStore()

  const filteredRecords = getFilteredRecords()
  const latestRecord = getLatestRecord()
  const previousRecord = enrichedRecords.length >= 2
    ? enrichedRecords[enrichedRecords.length - 2]
    : null

  const aggregates = useMemo(() => calculateAggregates(filteredRecords), [filteredRecords])

  const kpis = useMemo(() => {
    const current = latestRecord
    const prev = previousRecord

    return [
      {
        title: 'Revenue',
        value: formatLakh(current?.revenue || 0),
        change: current?.metrics.monthlyGrowth || 0,
        changeLabel: 'vs prev month',
        trend: (current?.metrics.monthlyGrowth || 0) >= 0 ? 'up' : 'down',
        status: (current?.metrics.monthlyGrowth || 0) >= 0 ? 'positive' : 'negative',
        icon: <DollarSign size={18} />,
        gradient: 'gradient-primary',
        subtitle: current ? `${current.month} ${current.year}` : undefined,
      },
      {
        title: 'Gross Margin',
        value: formatLakh(current?.metrics.grossMargin || 0),
        change: current?.metrics.grossMarginPercent || 0,
        changeLabel: 'of revenue',
        trend: (current?.metrics.grossMarginPercent || 0) >= 30 ? 'up' : 'down',
        status: (current?.metrics.grossMarginPercent || 0) >= 30 ? 'positive' : 'negative',
        icon: <TrendingUp size={18} />,
        gradient: 'gradient-success',
      },
      {
        title: 'Net Margin',
        value: formatLakh(current?.metrics.netMargin || 0),
        change: current?.metrics.netMarginPercent || 0,
        changeLabel: 'of revenue',
        trend: (current?.metrics.netMarginPercent || 0) >= 0 ? 'up' : 'down',
        status: (current?.metrics.netMarginPercent || 0) >= 0 ? 'positive' : 'negative',
        icon: <Target size={18} />,
        gradient: 'bg-gradient-to-br from-indigo-500 to-purple-600',
      },
      {
        title: 'Collections',
        value: formatLakh(current?.collections || 0),
        change: current?.metrics.collectionPercent || 0,
        changeLabel: 'collection rate',
        trend: (current?.metrics.collectionPercent || 0) >= 80 ? 'up' : 'down',
        status: (current?.metrics.collectionPercent || 0) >= 80 ? 'positive' : 'negative',
        icon: <CreditCard size={18} />,
        gradient: 'bg-gradient-to-br from-cyan-500 to-blue-500',
      },
      {
        title: 'Receivables',
        value: formatLakh(current?.receivables || 0),
        change: prev ? ((current?.receivables || 0) - prev.receivables) : 0,
        changeLabel: 'change',
        trend: (current?.receivables || 0) <= (prev?.receivables || 0) ? 'down' : 'up',
        status: (current?.receivables || 0) <= (prev?.receivables || 0) ? 'positive' : 'negative',
        icon: <Receipt size={18} />,
        gradient: 'bg-gradient-to-br from-orange-500 to-amber-500',
      },
      {
        title: 'Payables',
        value: formatLakh(current?.payables || 0),
        change: prev ? ((current?.payables || 0) - prev.payables) : 0,
        changeLabel: 'change',
        trend: (current?.payables || 0) <= (prev?.payables || 0) ? 'down' : 'up',
        status: (current?.payables || 0) <= (prev?.payables || 0) ? 'positive' : 'negative',
        icon: <ShoppingCart size={18} />,
        gradient: 'bg-gradient-to-br from-pink-500 to-rose-500',
      },
      {
        title: 'COGS %',
        value: formatPercent(current?.metrics.cogsPercent || 0),
        change: current?.metrics.cogsPercent || 0,
        changeLabel: 'of revenue',
        trend: (current?.metrics.cogsPercent || 0) <= 65 ? 'down' : 'up',
        status: (current?.metrics.cogsPercent || 0) <= 65 ? 'positive' : 'negative',
        icon: <Percent size={18} />,
        gradient: 'bg-gradient-to-br from-red-500 to-rose-600',
      },
      {
        title: 'Growth %',
        value: formatPercent(current?.metrics.monthlyGrowth || 0),
        change: current?.metrics.monthlyGrowth || 0,
        changeLabel: 'MoM growth',
        trend: (current?.metrics.monthlyGrowth || 0) >= 0 ? 'up' : 'down',
        status: (current?.metrics.monthlyGrowth || 0) >= 0 ? 'positive' : 'negative',
        icon: <Activity size={18} />,
        gradient: 'bg-gradient-to-br from-violet-500 to-purple-600',
      },
    ]
  }, [latestRecord, previousRecord])

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl font-bold text-foreground">Financial Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Real-time business intelligence overview
          </p>
        </div>
        <DashboardFilters />
      </motion.div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {kpis.map((kpi, i) => (
          <KPICard
            key={kpi.title}
            title={kpi.title}
            value={kpi.value}
            change={kpi.change}
            changeLabel={kpi.changeLabel}
            trend={kpi.trend as 'up' | 'down' | 'neutral'}
            status={kpi.status as 'positive' | 'negative' | 'neutral'}
            icon={kpi.icon}
            gradient={kpi.gradient}
            loading={isLoading}
            subtitle={kpi.subtitle}
            index={i}
          />
        ))}
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <RevenueTrendChart data={filteredRecords} loading={isLoading} />
        </div>
        <RevenueCompositionChart data={filteredRecords} loading={isLoading} />
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <GrossMarginChart data={filteredRecords} loading={isLoading} />
        <CollectionsChart data={filteredRecords} loading={isLoading} />
        <ExpenseBreakdownChart data={filteredRecords} loading={isLoading} />
      </div>

      {/* Charts Row 3 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <MonthlyProfitChart data={filteredRecords} loading={isLoading} />
        <YearlyRevenueChart data={enrichedRecords} loading={isLoading} />
      </div>

      {/* Summary Cards */}
      {!isLoading && filteredRecords.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          {[
            { label: 'Avg Monthly Revenue', value: formatLakh(aggregates.avgMonthlyRevenue), color: 'text-blue-600' },
            { label: 'Avg Gross Margin %', value: formatPercent(aggregates.avgGrossMarginPercent), color: 'text-emerald-600' },
            { label: 'Avg Collection Rate', value: formatPercent(aggregates.avgCollectionPercent), color: 'text-cyan-600' },
            { label: 'Total Revenue', value: formatLakh(aggregates.totalRevenue), color: 'text-purple-600' },
          ].map((stat) => (
            <div key={stat.label} className="glass-card rounded-2xl p-4 text-center">
              <p className="text-xs text-muted-foreground font-medium mb-1">{stat.label}</p>
              <p className={`text-xl font-bold ${stat.color}`}>{stat.value}</p>
            </div>
          ))}
        </motion.div>
      )}

      {/* Empty state */}
      {!isLoading && filteredRecords.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="glass-card rounded-2xl p-16 text-center"
        >
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
            <Activity size={28} className="text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No Data Yet</h3>
          <p className="text-muted-foreground text-sm mb-6">
            Start by entering your first month's financial data.
          </p>
          <a
            href="/entry"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl gradient-primary text-white text-sm font-medium shadow-lg hover:opacity-90 transition-opacity"
          >
            Add First Entry
          </a>
        </motion.div>
      )}
    </div>
  )
}
