import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(value: number, currency = 'INR'): string {
  if (currency === 'INR') {
    // Indian number format
    const formatted = new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
    return formatted
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-IN').format(value)
}

export function formatLakh(value: number): string {
  if (Math.abs(value) >= 10000000) {
    return `₹${(value / 10000000).toFixed(2)}Cr`
  }
  if (Math.abs(value) >= 100000) {
    return `₹${(value / 100000).toFixed(2)}L`
  }
  if (Math.abs(value) >= 1000) {
    return `₹${(value / 1000).toFixed(1)}K`
  }
  return `₹${value}`
}

export function formatPercent(value: number, decimals = 1): string {
  return `${value >= 0 ? '' : ''}${value.toFixed(decimals)}%`
}

export function calculateGrowth(current: number, previous: number): number {
  if (!previous || previous === 0) return 0
  return ((current - previous) / previous) * 100
}

export const MONTHS = [
  'April', 'May', 'June', 'July', 'August', 'September',
  'October', 'November', 'December', 'January', 'February', 'March'
]

export const CALENDAR_MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

export function getFinancialYear(date: Date = new Date()): number {
  const month = date.getMonth() // 0-indexed
  const year = date.getFullYear()
  // Financial year starts in April (month index 3)
  return month >= 3 ? year : year - 1
}

export function getDocumentId(year: number, month: string): string {
  return `${year}-${month.substring(0, 3)}`
}

export function getMonthIndex(month: string): number {
  return MONTHS.indexOf(month)
}

export function sortByFinancialMonth(a: string, b: string): number {
  return getMonthIndex(a) - getMonthIndex(b)
}

export function getQuarter(month: string): number {
  const idx = MONTHS.indexOf(month)
  return Math.floor(idx / 3) + 1
}

export function generateYears(startYear = 2020): number[] {
  const currentYear = getFinancialYear()
  const years: number[] = []
  for (let y = startYear; y <= currentYear + 1; y++) {
    years.push(y)
  }
  return years
}
