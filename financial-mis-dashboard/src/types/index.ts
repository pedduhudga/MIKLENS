export interface FinancialRecord {
  id?: string
  year: number
  month: string
  revenue: number
  sales: {
    export: number
    b2b: number
    retail: number
    bulk: number
  }
  expenses: {
    cogs: number
    employee: number
    finance: number
    depreciation: number
    other: number
  }
  collections: number
  receivables: number
  payables: number
  notes: string
  createdAt?: Date
  updatedAt?: Date
  createdBy?: string
}

export interface CalculatedMetrics {
  grossMargin: number
  grossMarginPercent: number
  totalExpenses: number
  operatingExpenses: number
  operatingProfit: number
  netMargin: number
  netMarginPercent: number
  collectionPercent: number
  expensePercent: number
  cogsPercent: number
  monthlyGrowth: number
}

export interface FinancialRecordWithMetrics extends FinancialRecord {
  metrics: CalculatedMetrics
}

export type UserRole = 'admin' | 'manager' | 'accountant' | 'viewer'

export interface UserProfile {
  uid: string
  email: string
  displayName: string
  role: UserRole
  photoURL?: string
  createdAt?: Date
}

export interface AuditLog {
  id?: string
  userId: string
  userEmail: string
  action: 'create' | 'update' | 'delete' | 'login' | 'logout'
  entityType: 'financial' | 'user' | 'settings'
  entityId: string
  field?: string
  oldValue?: string
  newValue?: string
  timestamp: Date
}

export interface CompanySettings {
  companyName: string
  financialYearStart: string // e.g., "April"
  currency: string
  currencySymbol: string
  theme: 'light' | 'dark' | 'system'
  logoUrl?: string
}

export interface DashboardFilter {
  year: number | 'all'
  month: string | 'all'
  category: 'all' | 'export' | 'b2b' | 'retail' | 'bulk'
}

export interface KPIData {
  title: string
  value: number
  formattedValue: string
  change: number
  changeLabel: string
  trend: 'up' | 'down' | 'neutral'
  status: 'positive' | 'negative' | 'neutral'
  icon: string
  color: string
}

export interface ChartDataPoint {
  month: string
  year: number
  [key: string]: number | string
}
