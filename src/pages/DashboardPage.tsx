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
  const { isLoading, getFilteredRecords, enrichedRecords, filter } = useFinancialStore()

  const filteredRecords = getFilteredRecords()

  const aggregates = useMemo(() => calculateAggregates(filteredRecords), [filteredRecords])

  const kpis = useMemo(() => {
    const isLTD = filter.year === 'all' && filter.month === 'all'
    const isYear = filter.month === 'all' && filter.year !== 'all'
    const isMonth = filter.month !== 'all' && filter.year !== 'all'

    let revenue = 0
    let grossMargin = 0
    let netMargin = 0
    let collections = 0
    let receivables = 0
    let payables = 0
    let cogsPercent = 0
    let growthPercent = 0

    let changeRevenue = 0
    let changeGrossMargin = 0
    let changeNetMargin = 0
    let changeCollections = 0
    let changeReceivables = 0
    let changePayables = 0
    let changeCogs = 0
    let changeGrowth = 0

    let revenueChangeLabel = 'vs prev month'
    let grossMarginChangeLabel = 'of revenue'
    let netMarginChangeLabel = 'of revenue'
    let collectionsChangeLabel = 'collection rate'
    let receivablesChangeLabel = 'change'
    let payablesChangeLabel = 'change'
    let cogsChangeLabel = 'of revenue'
    let growthChangeLabel = 'MoM growth'

    let revenueTrend: 'up' | 'down' | 'neutral' = 'neutral'
    let grossMarginTrend: 'up' | 'down' | 'neutral' = 'neutral'
    let netMarginTrend: 'up' | 'down' | 'neutral' = 'neutral'
    let collectionsTrend: 'up' | 'down' | 'neutral' = 'neutral'
    let receivablesTrend: 'up' | 'down' | 'neutral' = 'neutral'
    let payablesTrend: 'up' | 'down' | 'neutral' = 'neutral'
    let cogsTrend: 'up' | 'down' | 'neutral' = 'neutral'
    let growthTrend: 'up' | 'down' | 'neutral' = 'neutral'

    let revenueStatus: 'positive' | 'negative' | 'neutral' = 'neutral'
    let grossMarginStatus: 'positive' | 'negative' | 'neutral' = 'neutral'
    let netMarginStatus: 'positive' | 'negative' | 'neutral' = 'neutral'
    let collectionsStatus: 'positive' | 'negative' | 'neutral' = 'neutral'
    let receivablesStatus: 'positive' | 'negative' | 'neutral' = 'neutral'
    let payablesStatus: 'positive' | 'negative' | 'neutral' = 'neutral'
    let cogsStatus: 'positive' | 'negative' | 'neutral' = 'neutral'
    let growthStatus: 'positive' | 'negative' | 'neutral' = 'neutral'

    let subtitle: string | undefined = undefined

    if (isMonth) {
      const current = filteredRecords.find(r => r.year === filter.year && r.month === filter.month)
      const idx = enrichedRecords.findIndex(r => r.year === filter.year && r.month === filter.month)
      const prev = idx > 0 ? enrichedRecords[idx - 1] : null

      revenue = current?.revenue || 0
      grossMargin = current?.metrics.grossMargin || 0
      netMargin = current?.metrics.netMargin || 0
      collections = current?.collections || 0
      receivables = current?.receivables || 0
      payables = current?.payables || 0
      cogsPercent = current?.metrics.cogsPercent || 0
      growthPercent = current?.metrics.monthlyGrowth || 0

      changeRevenue = growthPercent
      revenueChangeLabel = 'vs prev month'
      revenueTrend = changeRevenue >= 0 ? 'up' : 'down'
      revenueStatus = changeRevenue >= 0 ? 'positive' : 'negative'

      changeGrossMargin = current?.metrics.grossMarginPercent || 0
      grossMarginTrend = changeGrossMargin >= 30 ? 'up' : 'down'
      grossMarginStatus = changeGrossMargin >= 30 ? 'positive' : 'negative'

      changeNetMargin = current?.metrics.netMarginPercent || 0
      netMarginTrend = changeNetMargin >= 0 ? 'up' : 'down'
      netMarginStatus = changeNetMargin >= 0 ? 'positive' : 'negative'

      changeCollections = current?.metrics.collectionPercent || 0
      collectionsTrend = changeCollections >= 80 ? 'up' : 'down'
      collectionsStatus = changeCollections >= 80 ? 'positive' : 'negative'

      changeReceivables = prev ? (receivables - prev.receivables) : 0
      receivablesTrend = receivables <= (prev?.receivables || 0) ? 'down' : 'up'
      receivablesStatus = receivables <= (prev?.receivables || 0) ? 'positive' : 'negative'

      changePayables = prev ? (payables - prev.payables) : 0
      payablesTrend = payables <= (prev?.payables || 0) ? 'down' : 'up'
      payablesStatus = payables <= (prev?.payables || 0) ? 'positive' : 'negative'

      changeCogs = cogsPercent
      cogsTrend = changeCogs <= 65 ? 'down' : 'up'
      cogsStatus = changeCogs <= 65 ? 'positive' : 'negative'

      changeGrowth = growthPercent
      growthTrend = changeGrowth >= 0 ? 'up' : 'down'
      growthStatus = changeGrowth >= 0 ? 'positive' : 'negative'

      subtitle = current ? `${current.month} ${current.year}` : undefined
    } else if (isYear) {
      const currentYearRecords = filteredRecords
      const totalRev = currentYearRecords.reduce((s, r) => s + r.revenue, 0)
      const totalCOGS = currentYearRecords.reduce((s, r) => s + r.expenses.cogs, 0)
      const totalGM = currentYearRecords.reduce((s, r) => s + r.metrics.grossMargin, 0)
      const totalNM = currentYearRecords.reduce((s, r) => s + r.metrics.netMargin, 0)
      const totalColl = currentYearRecords.reduce((s, r) => s + r.collections, 0)

      const lastMonthRecord = currentYearRecords.length > 0 ? currentYearRecords[currentYearRecords.length - 1] : null
      receivables = lastMonthRecord?.receivables || 0
      payables = lastMonthRecord?.payables || 0

      revenue = totalRev
      grossMargin = totalGM
      netMargin = totalNM
      collections = totalColl
      cogsPercent = totalRev > 0 ? (totalCOGS / totalRev) * 100 : 0

      const prevYear = (filter.year as number) - 1
      const prevYearRecords = enrichedRecords.filter(r => r.year === prevYear)
      const prevTotalRev = prevYearRecords.reduce((s, r) => s + r.revenue, 0)
      const prevLastRecord = prevYearRecords.length > 0 ? prevYearRecords[prevYearRecords.length - 1] : null

      const yoyRevenue = prevTotalRev > 0 ? ((totalRev - prevTotalRev) / prevTotalRev) * 100 : 0
      changeRevenue = yoyRevenue
      revenueChangeLabel = prevTotalRev > 0 ? 'YoY growth' : 'no prior year'
      revenueTrend = changeRevenue >= 0 ? 'up' : 'down'
      revenueStatus = changeRevenue >= 0 ? 'positive' : 'negative'

      changeGrossMargin = totalRev > 0 ? (totalGM / totalRev) * 100 : 0
      grossMarginTrend = changeGrossMargin >= 30 ? 'up' : 'down'
      grossMarginStatus = changeGrossMargin >= 30 ? 'positive' : 'negative'

      changeNetMargin = totalRev > 0 ? (totalNM / totalRev) * 100 : 0
      netMarginTrend = changeNetMargin >= 0 ? 'up' : 'down'
      netMarginStatus = changeNetMargin >= 0 ? 'positive' : 'negative'

      changeCollections = totalRev > 0 ? (totalColl / totalRev) * 100 : 0
      collectionsTrend = changeCollections >= 80 ? 'up' : 'down'
      collectionsStatus = changeCollections >= 80 ? 'positive' : 'negative'

      changeReceivables = prevLastRecord ? (receivables - prevLastRecord.receivables) : 0
      receivablesChangeLabel = prevLastRecord ? 'vs prev year end' : 'change'
      receivablesTrend = receivables <= (prevLastRecord?.receivables || 0) ? 'down' : 'up'
      receivablesStatus = receivables <= (prevLastRecord?.receivables || 0) ? 'positive' : 'negative'

      changePayables = prevLastRecord ? (payables - prevLastRecord.payables) : 0
      payablesChangeLabel = prevLastRecord ? 'vs prev year end' : 'change'
      payablesTrend = payables <= (prevLastRecord?.payables || 0) ? 'down' : 'up'
      payablesStatus = payables <= (prevLastRecord?.payables || 0) ? 'positive' : 'negative'

      changeCogs = cogsPercent
      cogsTrend = changeCogs <= 65 ? 'down' : 'up'
      cogsStatus = changeCogs <= 65 ? 'positive' : 'negative'

      growthPercent = yoyRevenue
      changeGrowth = yoyRevenue
      growthChangeLabel = 'YoY growth'
      growthTrend = changeGrowth >= 0 ? 'up' : 'down'
      growthStatus = changeGrowth >= 0 ? 'positive' : 'negative'

      subtitle = `FY ${filter.year}-${String((filter.year as number) + 1).slice(2)}`
    } else {
      const totalRev = enrichedRecords.reduce((s, r) => s + r.revenue, 0)
      const totalCOGS = enrichedRecords.reduce((s, r) => s + r.expenses.cogs, 0)
      const totalGM = enrichedRecords.reduce((s, r) => s + r.metrics.grossMargin, 0)
      const totalNM = enrichedRecords.reduce((s, r) => s + r.metrics.netMargin, 0)
      const totalColl = enrichedRecords.reduce((s, r) => s + r.collections, 0)

      const lastRecord = enrichedRecords.length > 0 ? enrichedRecords[enrichedRecords.length - 1] : null
      receivables = lastRecord?.receivables || 0
      payables = lastRecord?.payables || 0

      revenue = totalRev
      grossMargin = totalGM
      netMargin = totalNM
      collections = totalColl
      cogsPercent = totalRev > 0 ? (totalCOGS / totalRev) * 100 : 0

      changeRevenue = totalRev
      revenueChangeLabel = 'cumulative'
      revenueTrend = 'up'
      revenueStatus = 'positive'

      changeGrossMargin = totalRev > 0 ? (totalGM / totalRev) * 100 : 0
      grossMarginTrend = changeGrossMargin >= 30 ? 'up' : 'down'
      grossMarginStatus = changeGrossMargin >= 30 ? 'positive' : 'negative'

      changeNetMargin = totalRev > 0 ? (totalNM / totalRev) * 100 : 0
      netMarginTrend = changeNetMargin >= 0 ? 'up' : 'down'
      netMarginStatus = changeNetMargin >= 0 ? 'positive' : 'negative'

      changeCollections = totalRev > 0 ? (totalColl / totalRev) * 100 : 0
      collectionsTrend = changeCollections >= 80 ? 'up' : 'down'
      collectionsStatus = changeCollections >= 80 ? 'positive' : 'negative'

      changeReceivables = 0
      receivablesChangeLabel = 'current balance'
      receivablesTrend = 'neutral'
      receivablesStatus = 'neutral'

      changePayables = 0
      payablesChangeLabel = 'current balance'
      payablesTrend = 'neutral'
      payablesStatus = 'neutral'

      changeCogs = cogsPercent
      cogsTrend = changeCogs <= 65 ? 'down' : 'up'
      cogsStatus = changeCogs <= 65 ? 'positive' : 'negative'

      const nonZeroGrowth = enrichedRecords.filter(r => r.metrics.monthlyGrowth !== 0)
      const avgGrowth = nonZeroGrowth.length > 0 ? nonZeroGrowth.reduce((s, r) => s + r.metrics.monthlyGrowth, 0) / nonZeroGrowth.length : 0
      growthPercent = avgGrowth
      changeGrowth = avgGrowth
      growthChangeLabel = 'avg MoM growth'
      growthTrend = changeGrowth >= 0 ? 'up' : 'down'
      growthStatus = changeGrowth >= 0 ? 'positive' : 'negative'

      subtitle = 'Life To Date (LTD)'
    }

    return [
      {
        title: 'Revenue',
        value: formatLakh(revenue),
        change: changeRevenue,
        changeLabel: revenueChangeLabel,
        trend: revenueTrend,
        status: revenueStatus,
        icon: <DollarSign size={18} />,
        gradient: 'gradient-primary',
        subtitle,
      },
      {
        title: 'Gross Margin',
        value: formatLakh(grossMargin),
        change: changeGrossMargin,
        changeLabel: grossMarginChangeLabel,
        trend: grossMarginTrend,
        status: grossMarginStatus,
        icon: <TrendingUp size={18} />,
        gradient: 'gradient-success',
      },
      {
        title: 'Net Margin',
        value: formatLakh(netMargin),
        change: changeNetMargin,
        changeLabel: netMarginChangeLabel,
        trend: netMarginTrend,
        status: netMarginStatus,
        icon: <Target size={18} />,
        gradient: 'bg-gradient-to-br from-indigo-500 to-purple-600',
      },
      {
        title: 'Collections',
        value: formatLakh(collections),
        change: changeCollections,
        changeLabel: collectionsChangeLabel,
        trend: collectionsTrend,
        status: collectionsStatus,
        icon: <CreditCard size={18} />,
        gradient: 'bg-gradient-to-br from-cyan-500 to-blue-500',
      },
      {
        title: 'Receivables',
        value: formatLakh(receivables),
        change: changeReceivables,
        changeLabel: receivablesChangeLabel,
        trend: receivablesTrend,
        status: receivablesStatus,
        icon: <Receipt size={18} />,
        gradient: 'bg-gradient-to-br from-orange-500 to-amber-500',
      },
      {
        title: 'Payables',
        value: formatLakh(payables),
        change: changePayables,
        changeLabel: payablesChangeLabel,
        trend: payablesTrend,
        status: payablesStatus,
        icon: <ShoppingCart size={18} />,
        gradient: 'bg-gradient-to-br from-pink-500 to-rose-500',
      },
      {
        title: 'COGS %',
        value: formatPercent(cogsPercent),
        change: changeCogs,
        changeLabel: cogsChangeLabel,
        trend: cogsTrend,
        status: cogsStatus,
        icon: <Percent size={18} />,
        gradient: 'bg-gradient-to-br from-red-500 to-rose-600',
      },
      {
        title: 'Growth %',
        value: formatPercent(growthPercent),
        change: changeGrowth,
        changeLabel: growthChangeLabel,
        trend: growthTrend,
        status: growthStatus,
        icon: <Activity size={18} />,
        gradient: 'bg-gradient-to-br from-violet-500 to-purple-600',
      },
    ]
  }, [filteredRecords, enrichedRecords, filter])

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
      const ExcelJS = (await import('exceljs')).default
      const html2canvas = (await import('html2canvas')).default

      // 1. Capture Dashboard Chart elements using html2canvas
      const chartElements = document.querySelectorAll('.glass-card')
      const chartImages: string[] = []

      // Wait a moment for rendering
      await new Promise((resolve) => setTimeout(resolve, 150))

      for (let i = 0; i < chartElements.length; i++) {
        // Capture only the actual chart cards (indices 8 to 15 are the charts, or check by class/content)
        const el = chartElements[i] as HTMLElement
        const titleText = el.querySelector('h3')?.innerText || ''
        if (titleText.includes('Trend') || titleText.includes('Composition') || titleText.includes('Margin') || titleText.includes('Collections') || titleText.includes('Breakdown') || titleText.includes('Profit') || titleText.includes('Revenue')) {
          try {
            const chartCanvas = await html2canvas(el, {
              scale: 1.5,
              useCORS: true,
              backgroundColor: '#ffffff'
            })
            chartImages.push(chartCanvas.toDataURL('image/png'))
          } catch (err) {
            console.error('Failed capturing chart card:', err)
          }
        }
      }

      // 2. Create ExcelJS workbook
      const workbook = new ExcelJS.Workbook()
      const worksheet = workbook.addWorksheet('Financial Dashboard')

      // Styling parameters
      worksheet.views = [{ showGridLines: true }]

      // Add Document Header
      worksheet.mergeCells('A1:P1')
      const titleCell = worksheet.getCell('A1')
      titleCell.value = 'MIKLENS BIO - FINANCIAL PERFORMANCE REPORT'
      titleCell.font = { name: 'Arial', size: 16, bold: true, color: { argb: 'FFFFFFFF' } }
      titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F172A' } } // Slate 900
      titleCell.alignment = { horizontal: 'center', vertical: 'middle' }
      worksheet.getRow(1).height = 40

      // Add Headers Row
      const headers = [
        'Period', 'Revenue (Lakhs)', 'COGS (Lakhs)', 'Employee Cost (Lakhs)', 'Finance Cost (Lakhs)',
        'Depreciation (Lakhs)', 'Other Expenses (Lakhs)', 'Total Expenses (Lakhs)', 'Gross Margin (Lakhs)',
        'Gross Margin %', 'Net Profit (Lakhs)', 'Net Profit %', 'Collections (Lakhs)', 'Collection Rate %',
        'Receivables (Lakhs)', 'Payables (Lakhs)'
      ]
      worksheet.getRow(3).values = headers
      worksheet.getRow(3).font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFFFF' } }
      worksheet.getRow(3).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF334155' } } // Slate 700
      worksheet.getRow(3).alignment = { horizontal: 'center', vertical: 'middle' }
      worksheet.getRow(3).height = 25

      // Add Data Rows with Formulas
      filteredRecords.forEach((r, i) => {
        const rowNum = i + 4 // starts at row 4
        const totalExpenses = r.expenses.cogs + r.expenses.employee + r.expenses.finance + r.expenses.depreciation + r.expenses.other
        const grossMargin = r.revenue - r.expenses.cogs
        const grossMarginPercent = r.revenue > 0 ? (grossMargin / r.revenue) : 0
        const netProfit = grossMargin - (r.expenses.employee + r.expenses.finance + r.expenses.depreciation + r.expenses.other)
        const netProfitPercent = r.revenue > 0 ? (netProfit / r.revenue) : 0
        const collectionPercent = r.revenue > 0 ? (r.collections / r.revenue) : 0

        const rowValues = [
          `${r.month} ${r.year}`, // A
          r.revenue,             // B
          r.expenses.cogs,       // C
          r.expenses.employee,   // D
          r.expenses.finance,    // E
          r.expenses.depreciation,// F
          r.expenses.other,      // G
          { formula: `C${rowNum}+D${rowNum}+E${rowNum}+F${rowNum}+G${rowNum}`, result: totalExpenses }, // H
          { formula: `B${rowNum}-C${rowNum}`, result: grossMargin },                                  // I
          { formula: `IF(B${rowNum}>0, I${rowNum}/B${rowNum}, 0)`, result: grossMarginPercent },       // J
          { formula: `I${rowNum}-(D${rowNum}+E${rowNum}+F${rowNum}+G${rowNum})`, result: netProfit }, // K
          { formula: `IF(B${rowNum}>0, K${rowNum}/B${rowNum}, 0)`, result: netProfitPercent },       // L
          r.collections,         // M
          { formula: `IF(B${rowNum}>0, M${rowNum}/B${rowNum}, 0)`, result: collectionPercent },       // N
          r.receivables,         // O
          r.payables             // P
        ]
        
        const row = worksheet.addRow(rowValues)
        row.height = 20
        row.alignment = { vertical: 'middle' }
        row.getCell(1).alignment = { horizontal: 'center' }
        
        // Format numeric columns
        for (let col = 2; col <= 16; col++) {
          const cell = row.getCell(col)
          if (col === 10 || col === 12 || col === 14) {
            cell.numFmt = '0.0%'
          } else {
            cell.numFmt = '#,##0.00'
          }
        }
      })

      // Add Totals Row
      const totalRowNum = filteredRecords.length + 4
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

      const totalsRowValues = [
        'TOTALS',
        { formula: `SUM(B4:B${totalRowNum-1})`, result: aggRevenue },
        { formula: `SUM(C4:C${totalRowNum-1})`, result: aggCOGS },
        { formula: `SUM(D4:D${totalRowNum-1})`, result: aggEmployee },
        { formula: `SUM(E4:E${totalRowNum-1})`, result: aggFinance },
        { formula: `SUM(F4:F${totalRowNum-1})`, result: aggDepr },
        { formula: `SUM(G4:G${totalRowNum-1})`, result: aggOther },
        { formula: `SUM(H4:H${totalRowNum-1})`, result: aggTotalExp },
        { formula: `SUM(I4:I${totalRowNum-1})`, result: aggGrossMargin },
        { formula: `AVERAGE(J4:J${totalRowNum-1})`, result: aggGrossMarginPercent },
        { formula: `SUM(K4:K${totalRowNum-1})`, result: aggNetProfit },
        { formula: `AVERAGE(L4:L${totalRowNum-1})`, result: aggNetProfitPercent },
        { formula: `SUM(M4:M${totalRowNum-1})`, result: aggCollections },
        { formula: `AVERAGE(N4:N${totalRowNum-1})`, result: aggCollectionPercent },
        { formula: `SUM(O4:O${totalRowNum-1})`, result: aggReceivables },
        { formula: `SUM(P4:P${totalRowNum-1})`, result: aggPayables }
      ]
      
      const totalRow = worksheet.addRow(totalsRowValues)
      totalRow.height = 22
      totalRow.font = { name: 'Arial', size: 10, bold: true }
      totalRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2E8F0' } } // slate 200
      totalRow.alignment = { vertical: 'middle' }
      totalRow.getCell(1).alignment = { horizontal: 'center' }
      
      for (let col = 2; col <= 16; col++) {
        const cell = totalRow.getCell(col)
        if (col === 10 || col === 12 || col === 14) {
          cell.numFmt = '0.0%'
        } else {
          cell.numFmt = '#,##0.00'
        }
      }

      // Auto-fit Column Widths
      worksheet.columns.forEach((column: any) => {
        column.width = 18
      })
      worksheet.getColumn(1).width = 14 // Period

      // 3. Embed captured chart images into the sheet below the data
      let imageRowPosition = totalRowNum + 3
      chartImages.forEach((imgBase64, index) => {
        try {
          const imageId = workbook.addImage({
            base64: imgBase64,
            extension: 'png',
          })
          
          // Place 2 charts per row
          const colOffset = (index % 2 === 0) ? 'A' : 'I'
          const startRow = imageRowPosition + Math.floor(index / 2) * 16
          
          worksheet.addImage(imageId, {
            tl: { col: (index % 2 === 0) ? 0 : 8, row: startRow },
            ext: { width: 500, height: 280 }
          })
        } catch (e) {
          console.error('Failed to embed chart image in Excel:', e)
        }
      })

      // 4. Save workbook
      const buffer = await workbook.xlsx.writeBuffer()
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `Miklens_Executive_Dashboard_${new Date().toLocaleDateString()}.xlsx`
      a.click()
      window.URL.revokeObjectURL(url)
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
