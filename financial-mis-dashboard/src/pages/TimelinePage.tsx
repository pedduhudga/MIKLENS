import { motion } from 'framer-motion'
import { Clock, TrendingUp, TrendingDown } from 'lucide-react'
import { useFinancialStore } from '@/store/financialStore'
import { formatLakh, formatPercent } from '@/lib/utils'

export default function TimelinePage() {
  const { enrichedRecords, isLoading, availableYears } = useFinancialStore()

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1,2,3].map(i => (
          <div key={i} className="glass-card rounded-2xl p-5 space-y-3 animate-pulse">
            <div className="h-6 bg-muted rounded w-32" />
            <div className="grid grid-cols-4 gap-3">
              {[1,2,3,4].map(j => <div key={j} className="h-16 bg-muted rounded-xl" />)}
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (!enrichedRecords.length) {
    return (
      <div className="text-center py-20">
        <Clock size={48} className="mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">No History Yet</h3>
        <p className="text-sm text-muted-foreground">Add financial data to see your company timeline.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold">Financial Timeline</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Complete historical view of company finances</p>
      </motion.div>

      {availableYears.slice().reverse().map(year => {
        const yearRecords = enrichedRecords.filter(r => r.year === year)
        const totalRevenue = yearRecords.reduce((s, r) => s + r.revenue, 0)
        const totalProfit = yearRecords.reduce((s, r) => s + r.metrics.netMargin, 0)

        return (
          <motion.div
            key={year}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
            className="relative"
          >
            {/* Year Header */}
            <div className="flex items-center gap-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl gradient-primary flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-sm">{String(year).slice(2)}</span>
                </div>
                <div>
                  <h2 className="text-xl font-bold">FY {year}–{String(year + 1).slice(2)}</h2>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>Total: <span className="text-blue-600 font-medium">{formatLakh(totalRevenue)}</span></span>
                    <span>Profit: <span className={`font-medium ${totalProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{formatLakh(totalProfit)}</span></span>
                    <span>{yearRecords.length} months</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Month Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 ml-2 pl-4 border-l-2 border-border">
              {yearRecords.map((r, i) => (
                <motion.div
                  key={r.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="glass-card rounded-xl p-3 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-bold text-muted-foreground">{r.month.slice(0, 3)}</p>
                    {r.metrics.monthlyGrowth !== 0 && (
                      <span className={`text-xs ${r.metrics.monthlyGrowth > 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                        {r.metrics.monthlyGrowth > 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-bold text-foreground">{formatLakh(r.revenue)}</p>
                  <p className={`text-xs font-medium mt-1 ${r.metrics.netMargin >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    {formatLakh(r.metrics.netMargin)}
                  </p>
                  <div className="mt-2 pt-2 border-t border-border">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>GM</span>
                      <span className={r.metrics.grossMarginPercent >= 30 ? 'text-emerald-600' : 'text-amber-600'}>
                        {r.metrics.grossMarginPercent.toFixed(0)}%
                      </span>
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Col</span>
                      <span>{r.metrics.collectionPercent.toFixed(0)}%</span>
                    </div>
                  </div>
                  {r.notes && (
                    <p className="text-xs text-muted-foreground mt-2 truncate" title={r.notes}>
                      📝 {r.notes}
                    </p>
                  )}
                </motion.div>
              ))}
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}
