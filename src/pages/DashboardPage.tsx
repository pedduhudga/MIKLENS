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
      
      // Define headers and data rows manually to insert formula cells
      const headers = [
        'Period', 'Revenue (Lakhs)', 'COGS (Lakhs)', 'Employee Cost (Lakhs)', 'Finance Cost (Lakhs)',
        'Depreciation (Lakhs)', 'Other Expenses (Lakhs)', 'Total Expenses (Lakhs)', 'Gross Margin (Lakhs)',
        'Gross Margin %', 'Net Profit (Lakhs)', 'Net Profit %', 'Collections (Lakhs)', 'Collection Rate %',
        'Receivables (Lakhs)', 'Payables (Lakhs)'
      ]
      
      // SheetJS utility mapping values
      const dataRows = filteredRecords.map((r, i) => {
        const rowNum = i + 2 // data starts at row 2
        const totalExpenses = r.expenses.cogs + r.expenses.employee + r.expenses.finance + r.expenses.depreciation + r.expenses.other
        const grossMargin = r.revenue - r.expenses.cogs
        const grossMarginPercent = r.revenue > 0 ? (grossMargin / r.revenue) : 0
        const netProfit = grossMargin - (r.expenses.employee + r.expenses.finance + r.expenses.depreciation + r.expenses.other)
        const netProfitPercent = r.revenue > 0 ? (netProfit / r.revenue) : 0
        const collectionPercent = r.revenue > 0 ? (r.collections / r.revenue) : 0
        
        return [
          `${r.month} ${r.year}`, // A
          r.revenue,             // B
          r.expenses.cogs,       // C
          r.expenses.employee,   // D
          r.expenses.finance,    // E
          r.expenses.depreciation,// F
          r.expenses.other,      // G
          { t: 'n', f: `C${rowNum}+D${rowNum}+E${rowNum}+F${rowNum}+G${rowNum}`, v: totalExpenses }, // H
          { t: 'n', f: `B${rowNum}-C${rowNum}`, v: grossMargin },                                  // I
          { t: 'n', f: `IF(B${rowNum}>0, I${rowNum}/B${rowNum}, 0)`, v: grossMarginPercent, z: '0.0%' }, // J
          { t: 'n', f: `I${rowNum}-(D${rowNum}+E${rowNum}+F${rowNum}+G${rowNum})`, v: netProfit }, // K
          { t: 'n', f: `IF(B${rowNum}>0, K${rowNum}/B${rowNum}, 0)`, v: netProfitPercent, z: '0.0%' }, // L
          r.collections,         // M
          { t: 'n', f: `IF(B${rowNum}>0, M${rowNum}/B${rowNum}, 0)`, v: collectionPercent, z: '0.0%' }, // N
          r.receivables,         // O
          r.payables             // P
        ]
      })

      // Add a summary total row at the end
      const totalRowNum = dataRows.length + 2
      const aggRevenue = filteredRecords.reduce((s, r) => s + r.revenue, 0)
      const aggCOGS = filteredRecords.reduce((s, r) => s + r.expenses.cogs, 0)
      const aggEmployee = filteredRecords.reduce((s, r) => s + r.expenses.employee, 0)
      const aggFinance = filteredRecords.reduce((s, r) => s + r.expenses.finance, 0)
      const aggDepr = filteredRecords.reduce((s, r) => s + r.expenses.depreciation, 0)
      const aggOther = filteredRecords.reduce((s, r) => s + r.expenses.other, 0)
      const aggTotalExp = aggCOGS + aggEmployee + aggFinance + aggDepr + aggOther
      const aggGrossMargin = aggRevenue - aggCOGS
      const aggGrossMarginPercent = aggRevenue > 0 ? (aggGrossMargin / aggRevenue) : 0
      const aggNetProfit = aggGrossMargin - (aggEmployee + aggFinance + aggDepr + aggOther)
      const aggNetProfitPercent = aggRevenue > 0 ? (aggNetProfit / aggRevenue) : 0
      const aggCollections = filteredRecords.reduce((s, r) => s + r.collections, 0)
      const aggCollectionPercent = aggRevenue > 0 ? (aggCollections / aggRevenue) : 0
      const aggReceivables = filteredRecords.reduce((s, r) => s + r.receivables, 0)
      const aggPayables = filteredRecords.reduce((s, r) => s + r.payables, 0)

      dataRows.push([
        'TOTALS',
        { t: 'n', f: `SUM(B2:B${totalRowNum-1})`, v: aggRevenue },
        { t: 'n', f: `SUM(C2:C${totalRowNum-1})`, v: aggCOGS },
        { t: 'n', f: `SUM(D2:D${totalRowNum-1})`, v: aggEmployee },
        { t: 'n', f: `SUM(E2:E${totalRowNum-1})`, v: aggFinance },
        { t: 'n', f: `SUM(F2:F${totalRowNum-1})`, v: aggDepr },
        { t: 'n', f: `SUM(G2:G${totalRowNum-1})`, v: aggOther },
        { t: 'n', f: `SUM(H2:H${totalRowNum-1})`, v: aggTotalExp },
        { t: 'n', f: `SUM(I2:I${totalRowNum-1})`, v: aggGrossMargin },
        { t: 'n', f: `AVERAGE(J2:J${totalRowNum-1})`, v: aggGrossMarginPercent, z: '0.0%' },
        { t: 'n', f: `SUM(K2:K${totalRowNum-1})`, v: aggNetProfit },
        { t: 'n', f: `AVERAGE(L2:L${totalRowNum-1})`, v: aggNetProfitPercent, z: '0.0%' },
        { t: 'n', f: `SUM(M2:M${totalRowNum-1})`, v: aggCollections },
        { t: 'n', f: `AVERAGE(N2:N${totalRowNum-1})`, v: aggCollectionPercent, z: '0.0%' },
        { t: 'n', f: `SUM(O2:O${totalRowNum-1})`, v: aggReceivables },
        { t: 'n', f: `SUM(P2:P${totalRowNum-1})`, v: aggPayables }
      ])

      // Guidance on how to insert charts in Excel
      dataRows.push([])
      dataRows.push(['Instructions for Charts & Graphs in Excel:'])
      dataRows.push(['1. Select the columns you want to visualize (e.g., "Period" and "Revenue").'])
      dataRows.push(['2. In the top Excel ribbon menu, click on "Insert" > "Recommended Charts" or select a Bar/Line chart.'])
      dataRows.push(['3. Excel will generate a native interactive chart that automatically updates whenever you modify the values above!'])

      const worksheet = xlsx.utils.aoa_to_sheet([headers, ...dataRows])
      const workbook = xlsx.utils.book_new()
      xlsx.utils.book_append_sheet(workbook, worksheet, 'Dashboard Data')
      xlsx.writeFile(workbook, `Miklens_Dashboard_Formulas_${new Date().toLocaleDateString()}.xlsx`)
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
