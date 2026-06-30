import { Filter } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { useFinancialStore } from '@/store/financialStore'
import { MONTHS } from '@/lib/utils'

export function DashboardFilters() {
  const { filter, setFilter, availableYears } = useFinancialStore()

  const viewMode = filter.year === 'all' && filter.month === 'all'
    ? 'ltd'
    : filter.month === 'all'
      ? 'year'
      : 'month'

  const handleViewModeChange = (mode: 'ltd' | 'year' | 'month') => {
    const defaultYear = availableYears[availableYears.length - 1] || new Date().getFullYear()
    if (mode === 'ltd') {
      setFilter({ year: 'all', month: 'all' })
    } else if (mode === 'year') {
      setFilter({
        year: filter.year === 'all' ? defaultYear : filter.year,
        month: 'all'
      })
    } else if (mode === 'month') {
      setFilter({
        year: filter.year === 'all' ? defaultYear : filter.year,
        month: filter.month === 'all' ? 'April' : filter.month
      })
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* View Mode Toggle */}
      <div className="flex items-center bg-muted p-1 rounded-xl border border-border">
        <Button
          variant={viewMode === 'ltd' ? 'default' : 'ghost'}
          size="sm"
          className="text-xs h-7 px-3 rounded-lg font-medium shadow-none"
          onClick={() => handleViewModeChange('ltd')}
        >
          LTD
        </Button>
        <Button
          variant={viewMode === 'year' ? 'default' : 'ghost'}
          size="sm"
          className="text-xs h-7 px-3 rounded-lg font-medium shadow-none"
          onClick={() => handleViewModeChange('year')}
        >
          Year Wise
        </Button>
        <Button
          variant={viewMode === 'month' ? 'default' : 'ghost'}
          size="sm"
          className="text-xs h-7 px-3 rounded-lg font-medium shadow-none"
          onClick={() => handleViewModeChange('month')}
        >
          Month Wise
        </Button>
      </div>

      <div className="flex items-center gap-2 text-sm text-muted-foreground ml-1">
        <Filter size={14} />
        <span className="font-medium">Filters:</span>
      </div>

      {/* Year Filter - Shown for Year Wise and Month Wise */}
      {viewMode !== 'ltd' && (
        <Select
          value={String(filter.year)}
          onValueChange={(v) => setFilter({ year: v === 'all' ? 'all' : parseInt(v) })}
        >
          <SelectTrigger className="w-[140px] h-9 text-sm">
            <SelectValue placeholder="Financial Year" />
          </SelectTrigger>
          <SelectContent>
            {availableYears.map(y => (
              <SelectItem key={y} value={String(y)}>FY {y}-{String(y + 1).slice(2)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {/* Month Filter - Shown only for Month Wise */}
      {viewMode === 'month' && (
        <Select
          value={filter.month}
          onValueChange={(v) => setFilter({ month: v })}
        >
          <SelectTrigger className="w-[140px] h-9 text-sm">
            <SelectValue placeholder="Month" />
          </SelectTrigger>
          <SelectContent>
            {MONTHS.map(m => (
              <SelectItem key={m} value={m}>{m}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {/* Category Filter */}
      <Select
        value={filter.category}
        onValueChange={(v) => setFilter({ category: v as typeof filter.category })}
      >
        <SelectTrigger className="w-[140px] h-9 text-sm">
          <SelectValue placeholder="Category" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Categories</SelectItem>
          <SelectItem value="export">Export Sales</SelectItem>
          <SelectItem value="b2b">B2B Sales</SelectItem>
          <SelectItem value="retail">Retail Sales</SelectItem>
          <SelectItem value="bulk">Bulk Sales</SelectItem>
        </SelectContent>
      </Select>

      {/* Reset */}
      {(filter.year !== 'all' || filter.month !== 'all' || filter.category !== 'all') && (
        <button
          onClick={() => setFilter({ year: 'all', month: 'all', category: 'all' })}
          className="text-xs text-muted-foreground hover:text-foreground underline transition-colors"
        >
          Reset filters
        </button>
      )}
    </div>
  )
}

