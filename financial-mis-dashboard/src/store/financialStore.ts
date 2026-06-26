import { create } from 'zustand'
import type { FinancialRecord, FinancialRecordWithMetrics, DashboardFilter } from '@/types'
import { enrichRecords } from '@/lib/calculations'
import { MONTHS } from '@/lib/utils'

interface FinancialState {
  records: FinancialRecord[]
  enrichedRecords: FinancialRecordWithMetrics[]
  isLoading: boolean
  error: string | null
  filter: DashboardFilter
  availableYears: number[]

  setRecords: (records: FinancialRecord[]) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  setFilter: (filter: Partial<DashboardFilter>) => void

  // Derived selectors
  getFilteredRecords: () => FinancialRecordWithMetrics[]
  getRecordsByYear: (year: number) => FinancialRecordWithMetrics[]
  getLatestRecord: () => FinancialRecordWithMetrics | null
  getPreviousRecord: (year: number, month: string) => FinancialRecordWithMetrics | null
}

export const useFinancialStore = create<FinancialState>()((set, get) => ({
  records: [],
  enrichedRecords: [],
  isLoading: false,
  error: null,
  filter: {
    year: new Date().getMonth() >= 3 ? new Date().getFullYear() : new Date().getFullYear() - 1,
    month: 'all',
    category: 'all',
  },
  availableYears: [],

  setRecords: (records) => {
    // Sort by financial year order (April first)
    const sorted = [...records].sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year
      return MONTHS.indexOf(a.month) - MONTHS.indexOf(b.month)
    })
    const enriched = enrichRecords(sorted)
    const years = [...new Set(sorted.map(r => r.year))].sort()
    set({ records: sorted, enrichedRecords: enriched, availableYears: years })
  },

  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),

  setFilter: (partial) =>
    set((state) => ({ filter: { ...state.filter, ...partial } })),

  getFilteredRecords: () => {
    const { enrichedRecords, filter } = get()
    return enrichedRecords.filter(r => {
      if (filter.year !== 'all' && r.year !== filter.year) return false
      if (filter.month !== 'all' && r.month !== filter.month) return false
      return true
    })
  },

  getRecordsByYear: (year) => {
    const { enrichedRecords } = get()
    return enrichedRecords.filter(r => r.year === year)
  },

  getLatestRecord: () => {
    const { enrichedRecords } = get()
    if (!enrichedRecords.length) return null
    return enrichedRecords[enrichedRecords.length - 1]
  },

  getPreviousRecord: (year, month) => {
    const { enrichedRecords } = get()
    const idx = enrichedRecords.findIndex(r => r.year === year && r.month === month)
    if (idx <= 0) return null
    return enrichedRecords[idx - 1]
  },
}))
