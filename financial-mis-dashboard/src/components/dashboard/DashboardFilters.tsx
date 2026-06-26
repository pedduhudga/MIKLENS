import { Filter } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useFinancialStore } from '@/store/financialStore'
import { MONTHS } from '@/lib/utils'

export function DashboardFilters() {
  const { filter, setFilter, availableYears } = useFinancialStore()

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Filter size={14} />
        <span className="font-medium">Filters:</span>
      </div>

      {/* Year Filter */}
      <Select
        value={String(filter.year)}
        onValueChange={(v) => setFilter({ year: v === 'all' ? 'all' : parseInt(v) })}
      >
        <SelectTrigger className="w-[140px] h-9 text-sm">
          <SelectValue placeholder="Financial Year" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Years</SelectItem>
          {availableYears.map(y => (
            <SelectItem key={y} value={String(y)}>FY {y}-{String(y + 1).slice(2)}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Month Filter */}
      <Select
        value={filter.month}
        onValueChange={(v) => setFilter({ month: v })}
      >
        <SelectTrigger className="w-[140px] h-9 text-sm">
          <SelectValue placeholder="Month" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Months</SelectItem>
          {MONTHS.map(m => (
            <SelectItem key={m} value={m}>{m}</SelectItem>
          ))}
        </SelectContent>
      </Select>

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
