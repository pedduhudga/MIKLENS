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

  const handlePDFExport = async () => {
    try {
      const { jsPDF } = await import('jspdf')
      const html2canvas = (await import('html2canvas')).default
      
      // Target the scrollable dashboard container or main content wrapper
      const dashboardElement = document.querySelector('main > div') as HTMLElement
      if (!dashboardElement) return
      
      // Save scroll positions
      const originalScrollY = window.scrollY
      const originalScrollX = window.scrollX
      
      // Scroll to top to ensure complete layout capture by html2canvas
      window.scrollTo(0, 0)
      
      // Force element dimensions to full contents size for snapshot
      const originalWidth = dashboardElement.style.width
      const originalMaxHeight = dashboardElement.style.maxHeight
      const originalOverflow = dashboardElement.style.overflow
      
      dashboardElement.style.width = '1200px' // fixed page width for PDF standard aspect ratio
      dashboardElement.style.maxHeight = 'none'
      dashboardElement.style.overflow = 'visible'
      
      // Wait briefly for layout adjustment
      await new Promise((resolve) => setTimeout(resolve, 300))
      
      const canvas = await html2canvas(dashboardElement, {
        scale: 2, // High resolution crisp text and charts
        useCORS: true,
        allowTaint: true,
        logging: false,
        backgroundColor: '#ffffff',
        width: 1200,
        height: dashboardElement.scrollHeight,
        windowWidth: 1200,
        windowHeight: dashboardElement.scrollHeight,
        x: 0,
        y: 0,
        scrollX: 0,
        scrollY: 0,
        ignoreElements: (el) => {
          return el.tagName === 'BUTTON' || el.classList.contains('dashboard-filters')
        }
      })
      
      // Restore layout styles
      dashboardElement.style.width = originalWidth
      dashboardElement.style.maxHeight = originalMaxHeight
      dashboardElement.style.overflow = originalOverflow
      window.scrollTo(originalScrollX, originalScrollY)
      
      const imgWidth = 297 // A4 Landscape width in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width
      const pageHeight = 210 // A4 Landscape height in mm
      
      const pdf = new jsPDF('l', 'mm', 'a4')
      
      // Handle multi-page or single-page fitting dynamically
      let heightLeft = imgHeight
      let position = 0
      const imgData = canvas.toDataURL('image/png')
      
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
      heightLeft -= pageHeight
      
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight
        pdf.addPage()
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
        heightLeft -= pageHeight
      }
      
      pdf.save(`Miklens_Financial_Dashboard_${new Date().toLocaleDateString()}.pdf`)
    } catch (e) {
      console.error('Failed to export PDF:', e)
    }
  }

  const handleExcelExport = async () => {
    if (!filteredRecords.length) return
    try {
      const xlsx = await import('xlsx')
      const rows = filteredRecords.map(r => ({
        'Period': `${r.month} ${r.year}`,
        'Revenue (Lakhs)': r.revenue,
        'COGS (Lakhs)': r.expenses.cogs,
        'Employee Cost (Lakhs)': r.expenses.employee,
        'Finance Cost (Lakhs)': r.expenses.finance,
        'Depreciation (Lakhs)': r.expenses.depreciation,
        'Other Expenses (Lakhs)': r.expenses.other,
        'Total Expenses (Lakhs)': r.metrics.totalExpenses,
        'Gross Margin (Lakhs)': r.metrics.grossMargin,
        'Gross Margin %': `${r.metrics.grossMarginPercent.toFixed(1)}%`,
        'Net Profit (Lakhs)': r.metrics.netMargin,
        'Net Profit %': `${r.metrics.netMarginPercent.toFixed(1)}%`,
        'Collections (Lakhs)': r.collections,
        'Collection Rate %': `${r.metrics.collectionPercent.toFixed(1)}%`,
        'Receivables (Lakhs)': r.receivables,
        'Payables (Lakhs)': r.payables
      }))

      const worksheet = xlsx.utils.json_to_sheet(rows)
      const workbook = xlsx.utils.book_new()
      xlsx.utils.book_append_sheet(workbook, worksheet, 'Dashboard Data')
      xlsx.writeFile(workbook, `Miklens_Dashboard_Data_${new Date().toLocaleDateString()}.xlsx`)
    } catch (e) {
      console.error('Failed to export Excel:', e)
    }
  }

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
        <div className="flex flex-wrap items-center gap-3">
          <DashboardFilters />
          <div className="flex gap-2">
            <button
              onClick={handleExcelExport}
              disabled={isLoading || !filteredRecords.length}
              className="h-9 px-3 text-xs font-semibold rounded-lg border border-input bg-background hover:bg-accent text-foreground flex items-center gap-1.5 transition-colors disabled:opacity-50"
            >
              Excel
            </button>
            <button
              onClick={handlePDFExport}
              disabled={isLoading}
              className="h-9 px-3 text-xs font-semibold rounded-lg gradient-primary text-white flex items-center gap-1.5 shadow-sm hover:opacity-95 transition-opacity disabled:opacity-50"
            >
              Export PDF
            </button>
          </div>
        </div>
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
