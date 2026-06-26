import { motion } from 'framer-motion'
import { DashboardFilters } from '@/components/dashboard/DashboardFilters'
import { RevenueTrendChart } from '@/components/charts/RevenueTrendChart'
import { RevenueCompositionChart } from '@/components/charts/RevenueCompositionChart'
import { ExpenseBreakdownChart } from '@/components/charts/ExpenseBreakdownChart'
import { GrossMarginChart } from '@/components/charts/GrossMarginChart'
import { CollectionsChart } from '@/components/charts/CollectionsChart'
import { MonthlyProfitChart } from '@/components/charts/MonthlyProfitChart'
import { YearlyRevenueChart } from '@/components/charts/YearlyRevenueChart'
import { useFinancialStore } from '@/store/financialStore'

export default function ChartsPage() {
  const { isLoading, getFilteredRecords, enrichedRecords } = useFinancialStore()
  const filteredRecords = getFilteredRecords()

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Charts</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Comprehensive visual analytics</p>
        </div>
        <DashboardFilters />
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <RevenueTrendChart data={filteredRecords} loading={isLoading} />
        </div>
        <RevenueCompositionChart data={filteredRecords} loading={isLoading} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <GrossMarginChart data={filteredRecords} loading={isLoading} />
        <CollectionsChart data={filteredRecords} loading={isLoading} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <MonthlyProfitChart data={filteredRecords} loading={isLoading} />
        <ExpenseBreakdownChart data={filteredRecords} loading={isLoading} />
      </div>

      <YearlyRevenueChart data={enrichedRecords} loading={isLoading} />
    </div>
  )
}
