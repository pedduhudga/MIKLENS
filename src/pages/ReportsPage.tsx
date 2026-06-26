import { useState } from 'react'
import { motion } from 'framer-motion'
import { FileText, Download, Calendar, BarChart2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useFinancialStore } from '@/store/financialStore'
import { calculateAggregates } from '@/lib/calculations'
import { formatLakh, formatPercent, MONTHS, generateYears } from '@/lib/utils'
import { useToast } from '@/components/ui/toast-provider'

type ReportType = 'monthly' | 'quarterly' | 'half-year' | 'annual'

const QUARTERS = [
  { label: 'Q1 (Apr–Jun)', months: ['April', 'May', 'June'] },
  { label: 'Q2 (Jul–Sep)', months: ['July', 'August', 'September'] },
  { label: 'Q3 (Oct–Dec)', months: ['October', 'November', 'December'] },
  { label: 'Q4 (Jan–Mar)', months: ['January', 'February', 'March'] },
]

export default function ReportsPage() {
  const { enrichedRecords, availableYears, isLoading } = useFinancialStore()
  const [reportType, setReportType] = useState<ReportType>('annual')
  const [selectedYear, setSelectedYear] = useState(availableYears[availableYears.length - 1] || new Date().getFullYear())
  const [selectedMonth, setSelectedMonth] = useState(MONTHS[0])
  const [selectedQuarter, setSelectedQuarter] = useState(0)
  const { info } = useToast()

  const years = generateYears()

  const getReportData = () => {
    let records = enrichedRecords.filter(r => r.year === selectedYear)

    if (reportType === 'monthly') {
      records = records.filter(r => r.month === selectedMonth)
    } else if (reportType === 'quarterly') {
      records = records.filter(r => QUARTERS[selectedQuarter].months.includes(r.month))
    } else if (reportType === 'half-year') {
      const half = selectedQuarter < 2 ? QUARTERS.slice(0, 2) : QUARTERS.slice(2, 4)
      const halfMonths = half.flatMap(q => q.months)
      records = records.filter(r => halfMonths.includes(r.month))
    }

    return records
  }

  const reportData = getReportData()
  const aggregates = calculateAggregates(reportData)

  const exportCSV = () => {
    if (!reportData.length) { info('No data to export'); return }
    const headers = ['Month', 'Year', 'Revenue', 'Export', 'B2B', 'Retail', 'Bulk', 'COGS', 'Employee', 'Finance', 'Depreciation', 'Other', 'Collections', 'Receivables', 'Payables', 'Gross Margin', 'Gross Margin%', 'Net Margin', 'Net Margin%']
    const rows = reportData.map(r => [
      r.month, r.year, r.revenue, r.sales.export, r.sales.b2b, r.sales.retail, r.sales.bulk,
      r.expenses.cogs, r.expenses.employee, r.expenses.finance, r.expenses.depreciation, r.expenses.other,
      r.collections, r.receivables, r.payables,
      r.metrics.grossMargin, r.metrics.grossMarginPercent.toFixed(2),
      r.metrics.netMargin, r.metrics.netMarginPercent.toFixed(2),
    ])
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `financial-report-${reportType}-${selectedYear}.csv`
    a.click()
    URL.revokeObjectURL(url)
    info('CSV exported successfully')
  }

  const exportPDF = () => {
    info('PDF export requires jsPDF — printing window opened as fallback.')
    window.print()
  }

  const getTitle = () => {
    if (reportType === 'monthly') return `${selectedMonth} ${selectedYear} Report`
    if (reportType === 'quarterly') return `${QUARTERS[selectedQuarter].label} FY${selectedYear} Report`
    if (reportType === 'half-year') return `H${selectedQuarter < 2 ? 1 : 2} FY${selectedYear} Report`
    return `Annual Report FY${selectedYear}`
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold">Reports</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Generate and export financial reports</p>
      </motion.div>

      {/* Report Config */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-2xl p-5">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center">
            <FileText size={18} className="text-white" />
          </div>
          <div>
            <h2 className="font-semibold">Report Configuration</h2>
            <p className="text-xs text-muted-foreground">Select report type and period</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          {/* Report Type */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Report Type</label>
            <Select value={reportType} onValueChange={(v) => setReportType(v as ReportType)}>
              <SelectTrigger className="w-[160px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="quarterly">Quarterly</SelectItem>
                <SelectItem value="half-year">Half Year</SelectItem>
                <SelectItem value="annual">Annual</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Year */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Financial Year</label>
            <Select value={String(selectedYear)} onValueChange={v => setSelectedYear(parseInt(v))}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {years.map(y => (
                  <SelectItem key={y} value={String(y)}>FY {y}-{String(y+1).slice(2)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Month (if monthly) */}
          {reportType === 'monthly' && (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Month</label>
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MONTHS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Quarter */}
          {(reportType === 'quarterly' || reportType === 'half-year') && (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                {reportType === 'quarterly' ? 'Quarter' : 'Half'}
              </label>
              <Select value={String(selectedQuarter)} onValueChange={v => setSelectedQuarter(parseInt(v))}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {reportType === 'quarterly'
                    ? QUARTERS.map((q, i) => <SelectItem key={i} value={String(i)}>{q.label}</SelectItem>)
                    : [
                        <SelectItem key={0} value="0">H1 (Apr–Sep)</SelectItem>,
                        <SelectItem key={2} value="2">H2 (Oct–Mar)</SelectItem>,
                      ]
                  }
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Export Buttons */}
          <div className="space-y-1.5 ml-auto self-end">
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={exportCSV}>
                <Download size={14} /> CSV
              </Button>
              <Button variant="outline" size="sm" onClick={exportPDF}>
                <Download size={14} /> PDF
              </Button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Report Preview */}
      {isLoading ? (
        <div className="glass-card rounded-2xl p-8 text-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
        </div>
      ) : reportData.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card rounded-2xl p-16 text-center">
          <Calendar size={40} className="text-muted-foreground mx-auto mb-4" />
          <h3 className="font-semibold mb-2">No Data Available</h3>
          <p className="text-sm text-muted-foreground">No records found for the selected period.</p>
        </motion.div>
      ) : (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          {/* Report Title */}
          <div className="glass-card rounded-2xl p-6">
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold">{getTitle()}</h2>
              <p className="text-sm text-muted-foreground">Financial Management Information System</p>
            </div>

            {/* KPI Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {[
                { label: 'Total Revenue', value: formatLakh(aggregates.totalRevenue), color: 'text-blue-600' },
                { label: 'Gross Margin', value: formatLakh(aggregates.totalGrossMargin), color: 'text-emerald-600' },
                { label: 'Net Profit', value: formatLakh(aggregates.totalNetMargin), color: aggregates.totalNetMargin >= 0 ? 'text-emerald-600' : 'text-red-600' },
                { label: 'Collections', value: formatLakh(aggregates.totalCollections), color: 'text-cyan-600' },
                { label: 'Avg Gross Margin%', value: formatPercent(aggregates.avgGrossMarginPercent), color: 'text-purple-600' },
                { label: 'Avg Net Margin%', value: formatPercent(aggregates.avgNetMarginPercent), color: 'text-indigo-600' },
                { label: 'Total Expenses', value: formatLakh(aggregates.totalExpenses), color: 'text-red-600' },
                { label: 'Avg Collection%', value: formatPercent(aggregates.avgCollectionPercent), color: 'text-teal-600' },
              ].map(stat => (
                <div key={stat.label} className="bg-muted/40 rounded-xl p-3 text-center">
                  <p className="text-xs text-muted-foreground font-medium mb-1">{stat.label}</p>
                  <p className={`text-lg font-bold ${stat.color}`}>{stat.value}</p>
                </div>
              ))}
            </div>

            {/* Data Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b-2 border-border">
                    <th className="text-left py-3 px-3 font-semibold text-muted-foreground text-xs uppercase">Period</th>
                    <th className="text-right py-3 px-3 font-semibold text-muted-foreground text-xs uppercase">Revenue</th>
                    <th className="text-right py-3 px-3 font-semibold text-muted-foreground text-xs uppercase">COGS</th>
                    <th className="text-right py-3 px-3 font-semibold text-muted-foreground text-xs uppercase">Gross Margin</th>
                    <th className="text-right py-3 px-3 font-semibold text-muted-foreground text-xs uppercase">GM%</th>
                    <th className="text-right py-3 px-3 font-semibold text-muted-foreground text-xs uppercase">Opex</th>
                    <th className="text-right py-3 px-3 font-semibold text-muted-foreground text-xs uppercase">Net Profit</th>
                    <th className="text-right py-3 px-3 font-semibold text-muted-foreground text-xs uppercase">Collections</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.map((r, i) => (
                    <tr key={r.id} className={`border-b border-border/50 hover:bg-accent/30 ${i % 2 === 0 ? '' : 'bg-muted/20'}`}>
                      <td className="py-3 px-3 font-medium">{r.month.slice(0, 3)} {r.year}</td>
                      <td className="py-3 px-3 text-right font-medium text-blue-600">{formatLakh(r.revenue)}</td>
                      <td className="py-3 px-3 text-right text-red-600">{formatLakh(r.expenses.cogs)}</td>
                      <td className="py-3 px-3 text-right text-emerald-600">{formatLakh(r.metrics.grossMargin)}</td>
                      <td className="py-3 px-3 text-right">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${r.metrics.grossMarginPercent >= 30 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30'}`}>
                          {r.metrics.grossMarginPercent.toFixed(1)}%
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right text-orange-600">{formatLakh(r.metrics.operatingExpenses)}</td>
                      <td className={`py-3 px-3 text-right font-semibold ${r.metrics.netMargin >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                        {formatLakh(r.metrics.netMargin)}
                      </td>
                      <td className="py-3 px-3 text-right">{formatLakh(r.collections)}</td>
                    </tr>
                  ))}
                  {/* Totals */}
                  <tr className="border-t-2 border-border bg-muted/50 font-bold">
                    <td className="py-3 px-3">TOTAL</td>
                    <td className="py-3 px-3 text-right text-blue-600">{formatLakh(aggregates.totalRevenue)}</td>
                    <td className="py-3 px-3 text-right text-red-600">
                      {formatLakh(reportData.reduce((s, r) => s + r.expenses.cogs, 0))}
                    </td>
                    <td className="py-3 px-3 text-right text-emerald-600">{formatLakh(aggregates.totalGrossMargin)}</td>
                    <td className="py-3 px-3 text-right">
                      <span className="text-sm font-bold">{formatPercent(aggregates.avgGrossMarginPercent)}</span>
                    </td>
                    <td className="py-3 px-3 text-right text-orange-600">
                      {formatLakh(reportData.reduce((s, r) => s + r.metrics.operatingExpenses, 0))}
                    </td>
                    <td className={`py-3 px-3 text-right ${aggregates.totalNetMargin >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                      {formatLakh(aggregates.totalNetMargin)}
                    </td>
                    <td className="py-3 px-3 text-right">{formatLakh(aggregates.totalCollections)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  )
}
