import type { FinancialRecord, CalculatedMetrics, FinancialRecordWithMetrics } from '@/types'

export function calculateMetrics(
  record: FinancialRecord,
  previousRecord?: FinancialRecord
): CalculatedMetrics {
  const { revenue, expenses, collections } = record
  const { cogs, employee, finance, depreciation, other } = expenses

  // Gross Margin = Revenue - COGS
  const grossMargin = revenue - cogs
  const grossMarginPercent = revenue > 0 ? (grossMargin / revenue) * 100 : 0

  // Operating Expenses = Employee + Finance + Depreciation + Other
  const operatingExpenses = employee + finance + depreciation + other

  // Total Expenses = COGS + Operating Expenses
  const totalExpenses = cogs + operatingExpenses

  // Operating Profit = Gross Margin - Operating Expenses
  const operatingProfit = grossMargin - operatingExpenses

  // Net Margin = Operating Profit (simplified)
  const netMargin = operatingProfit
  const netMarginPercent = revenue > 0 ? (netMargin / revenue) * 100 : 0

  // Collection % = Collections / Revenue * 100
  const collectionPercent = revenue > 0 ? (collections / revenue) * 100 : 0

  // Expense % = Total Expenses / Revenue * 100
  const expensePercent = revenue > 0 ? (totalExpenses / revenue) * 100 : 0

  // COGS % = COGS / Revenue * 100
  const cogsPercent = revenue > 0 ? (cogs / revenue) * 100 : 0

  // Monthly Growth %
  const monthlyGrowth =
    previousRecord && previousRecord.revenue > 0
      ? ((revenue - previousRecord.revenue) / previousRecord.revenue) * 100
      : 0

  return {
    grossMargin,
    grossMarginPercent,
    totalExpenses,
    operatingExpenses,
    operatingProfit,
    netMargin,
    netMarginPercent,
    collectionPercent,
    expensePercent,
    cogsPercent,
    monthlyGrowth,
  }
}

export function enrichRecords(
  records: FinancialRecord[]
): FinancialRecordWithMetrics[] {
  return records.map((record, index) => {
    const previousRecord = index > 0 ? records[index - 1] : undefined
    return {
      ...record,
      metrics: calculateMetrics(record, previousRecord),
    }
  })
}

export function calculateAggregates(records: FinancialRecordWithMetrics[]) {
  if (!records.length) {
    return {
      totalRevenue: 0,
      totalCollections: 0,
      totalExpenses: 0,
      totalGrossMargin: 0,
      totalNetMargin: 0,
      avgMonthlyRevenue: 0,
      avgMonthlyMargin: 0,
      avgGrossMarginPercent: 0,
      avgNetMarginPercent: 0,
      avgCollectionPercent: 0,
      highestRevenueMonth: null as FinancialRecordWithMetrics | null,
      lowestRevenueMonth: null as FinancialRecordWithMetrics | null,
      bestCollectionMonth: null as FinancialRecordWithMetrics | null,
      worstCollectionMonth: null as FinancialRecordWithMetrics | null,
      yearlyGrowth: 0,
    }
  }

  const totalRevenue = records.reduce((s, r) => s + r.revenue, 0)
  const totalCollections = records.reduce((s, r) => s + r.collections, 0)
  const totalExpenses = records.reduce((s, r) => s + r.metrics.totalExpenses, 0)
  const totalGrossMargin = records.reduce((s, r) => s + r.metrics.grossMargin, 0)
  const totalNetMargin = records.reduce((s, r) => s + r.metrics.netMargin, 0)

  const avgMonthlyRevenue = totalRevenue / records.length
  const avgMonthlyMargin = totalNetMargin / records.length
  const avgGrossMarginPercent = totalRevenue > 0 ? (totalGrossMargin / totalRevenue) * 100 : 0
  const avgNetMarginPercent = totalRevenue > 0 ? (totalNetMargin / totalRevenue) * 100 : 0
  const avgCollectionPercent = totalRevenue > 0 ? (totalCollections / totalRevenue) * 100 : 0

  const highestRevenueMonth = records.reduce((max, r) => r.revenue > max.revenue ? r : max, records[0])
  const lowestRevenueMonth = records.reduce((min, r) => r.revenue < min.revenue ? r : min, records[0])
  const bestCollectionMonth = records.reduce((best, r) =>
    r.metrics.collectionPercent > best.metrics.collectionPercent ? r : best, records[0])
  const worstCollectionMonth = records.reduce((worst, r) =>
    r.metrics.collectionPercent < worst.metrics.collectionPercent ? r : worst, records[0])

  return {
    totalRevenue,
    totalCollections,
    totalExpenses,
    totalGrossMargin,
    totalNetMargin,
    avgMonthlyRevenue,
    avgMonthlyMargin,
    avgGrossMarginPercent,
    avgNetMarginPercent,
    avgCollectionPercent,
    highestRevenueMonth,
    lowestRevenueMonth,
    bestCollectionMonth,
    worstCollectionMonth,
    yearlyGrowth: 0, // calculated separately with prior year data
  }
}
