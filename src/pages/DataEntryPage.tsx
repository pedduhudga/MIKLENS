import { useState, useEffect, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion, AnimatePresence } from 'framer-motion'
import { Save, Trash2, Copy, Plus, Edit2, Upload, FileSpreadsheet, Check, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import * as XLSX from 'xlsx'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { useFinancialStore } from '@/store/financialStore'
import { useFinancialActions } from '@/hooks/useFinancialData'
import { useToast } from '@/components/ui/toast-provider'
import { useAuth } from '@/hooks/useAuth'
import { MONTHS, generateYears, getFinancialYear, getDocumentId } from '@/lib/utils'
import { financialRepository } from '@/services/financialRepository'
import { auditRepository } from '@/services/auditRepository'
import type { FinancialRecord } from '@/types'

const schema = z.object({
  year: z.number().int().min(2000).max(2100),
  month: z.string().min(1, 'Month is required'),
  revenue: z.number().min(0, 'Must be ≥ 0'),
  exportSales: z.number().min(0),
  b2bSales: z.number().min(0),
  retailSales: z.number().min(0),
  bulkSales: z.number().min(0),
  cogs: z.number().min(0),
  employeeCost: z.number().min(0),
  financeCost: z.number().min(0),
  depreciation: z.number().min(0),
  otherExpenses: z.number().min(0),
  collections: z.number().min(0),
  receivables: z.number().min(0),
  payables: z.number().min(0),
  notes: z.string().optional(),
})

type FormData = z.infer<typeof schema>

const numField = (label: string, name: keyof FormData, placeholder = '0') => ({ label, name, placeholder })

const formSections = [
  {
    title: 'Revenue Breakdown',
    color: 'from-blue-500 to-indigo-500',
    fields: [
      numField('Total Revenue', 'revenue'),
      numField('Export Sales', 'exportSales'),
      numField('B2B Sales', 'b2bSales'),
      numField('Retail Sales', 'retailSales'),
      numField('Bulk Sales', 'bulkSales'),
    ],
  },
  {
    title: 'Expenses',
    color: 'from-red-500 to-pink-500',
    fields: [
      numField('COGS', 'cogs'),
      numField('Employee Cost', 'employeeCost'),
      numField('Finance Cost', 'financeCost'),
      numField('Depreciation & Amortization', 'depreciation'),
      numField('Other Expenses', 'otherExpenses'),
    ],
  },
  {
    title: 'Cash Flow',
    color: 'from-emerald-500 to-teal-500',
    fields: [
      numField('Collections', 'collections'),
      numField('Receivables', 'receivables'),
      numField('Payables', 'payables'),
    ],
  },
]

const MONTH_MAP: { [key: string]: string } = {
  jan: 'January', feb: 'February', mar: 'March', apr: 'April', may: 'May', jun: 'June',
  jul: 'July', aug: 'August', sep: 'September', oct: 'October', nov: 'November', dec: 'December'
}

function parseCleanNumber(val: any): number {
  if (val === undefined || val === null || val === '') return 0
  if (typeof val === 'number') return val
  let str = String(val).trim()
  str = str.replace(/[₹%,]/g, '')
  if (str.startsWith('(') && str.endsWith(')')) {
    str = '-' + str.slice(1, -1)
  }
  const parsed = parseFloat(str)
  return isNaN(parsed) ? 0 : parsed
}

function parseHeaderMonthYear(header: string) {
  const clean = String(header).trim()
  const match = clean.match(/^([A-Za-z]{3})[-']?(\d{2}|\d{4})$/)
  if (match) {
    const mStr = match[1].toLowerCase()
    const yStr = match[2]
    const month = MONTH_MAP[mStr]
    let year = parseInt(yStr)
    if (yStr.length === 2) {
      year = 2000 + year
    }
    if (month && !isNaN(year)) {
      return { month, year }
    }
  }
  const lowerClean = clean.toLowerCase()
  for (const [key, val] of Object.entries(MONTH_MAP)) {
    if (lowerClean.includes(key)) {
      const yearMatch = clean.match(/\b(\d{4}|\d{2})\b/)
      if (yearMatch) {
        let year = parseInt(yearMatch[1])
        if (yearMatch[1].length === 2) year = 2000 + year
        return { month: val, year }
      }
    }
  }
  return null
}

function parseSpreadsheet2D(grid: any[][]) {
  if (!grid || grid.length === 0) return null

  let headerRowIndex = -1
  for (let i = 0; i < Math.min(grid.length, 10); i++) {
    const row = grid[i]
    if (row && row.some(cell => {
      const s = String(cell).toLowerCase()
      return s.includes('particular') || s.includes('ltd') || parseHeaderMonthYear(s) !== null
    })) {
      headerRowIndex = i
      break
    }
  }

  if (headerRowIndex === -1) {
    headerRowIndex = 0
  }

  const headers = grid[headerRowIndex] || []
  
  interface ColInfo {
    colIndex: number;
    header: string;
    month: string;
    year: number;
  }
  const monthCols: ColInfo[] = []

  for (let c = 1; c < headers.length; c++) {
    const parsed = parseHeaderMonthYear(headers[c])
    if (parsed) {
      monthCols.push({
        colIndex: c,
        header: String(headers[c]),
        month: parsed.month,
        year: parsed.year
      })
    }
  }

  if (monthCols.length === 0) {
    return null
  }

  const results = monthCols.map(col => {
    const values: { [key: string]: number } = {
      revenue: 0,
      exportSales: 0,
      b2bSales: 0,
      retailSales: 0,
      bulkSales: 0,
      cogs: 0,
      employeeCost: 0,
      financeCost: 0,
      depreciation: 0,
      otherExpenses: 0,
      collections: 0,
      receivables: 0,
      payables: 0,
    }

    let currentSection: 'revenue' | 'collection' | 'none' = 'none'

    for (let r = headerRowIndex + 1; r < grid.length; r++) {
      const row = grid[r]
      if (!row || row.length === 0) continue
      const label = String(row[0] || '').trim().toLowerCase()
      if (!label) continue

      const rawVal = row[col.colIndex]
      const val = parseCleanNumber(rawVal)

      if (label.includes('revenue')) {
        currentSection = 'revenue'
        values.revenue = val
        continue
      }
      if (label.includes('collection')) {
        currentSection = 'collection'
        values.collections = val
        continue
      }

      if (label.includes('export')) {
        if (currentSection === 'revenue') {
          values.exportSales = val
        }
      } else if (label.includes('b2b')) {
        if (currentSection === 'revenue') {
          values.b2bSales = val
        }
      } else if (label.includes('retail')) {
        if (currentSection === 'revenue') {
          values.retailSales = val
        }
      } else if (label.includes('bulk sales') || label.includes('bulk')) {
        if (currentSection === 'revenue') {
          values.bulkSales = val
        }
      } else if (label.includes('cogs')) {
        values.cogs = val
      } else if (label.includes('employee')) {
        values.employeeCost = val
      } else if (label.includes('finance')) {
        values.financeCost = val
      } else if (label.includes('depreciation') || label.includes('amorti')) {
        values.depreciation = val
      } else if (label.includes('other expense')) {
        values.otherExpenses += val
      } else if (label.includes('receivable')) {
        values.receivables = val
      } else if (label.includes('payable')) {
        values.payables = val
      }
    }

    return {
      month: col.month,
      year: col.year,
      header: col.header,
      values
    }
  })

  return results
}

function NumberInput({ label, name, register, error }: { label: string; name: string; register: any; error?: any }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={name} className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
        {label}
      </Label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-medium">₹</span>
        <Input
          id={name}
          type="number"
          min={0}
          step="any"
          placeholder="0"
          className="pl-7"
          {...register(name, { valueAsNumber: true })}
        />
      </div>
      {error && <p className="text-xs text-destructive">{error.message}</p>}
    </div>
  )
}

export default function DataEntryPage() {
  const years = generateYears()
  const currentFY = getFinancialYear()
  const { enrichedRecords, isLoading } = useFinancialStore()
  const { createRecord, updateRecord, deleteRecord } = useFinancialActions()
  const { success, error: toastError } = useToast()
  const { user, canWrite, canDelete } = useAuth()

  const [editingId, setEditingId] = useState<string | null>(null)
  const [selectedYear, setSelectedYear] = useState(currentFY)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Auto-fill state variables
  const [autoFillMode, setAutoFillMode] = useState<'upload' | 'paste'>('upload')
  const [pasteText, setPasteText] = useState('')
  const [parsedColumns, setParsedColumns] = useState<any[] | null>(null)
  const [selectedColIndex, setSelectedColIndex] = useState<number>(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      year: currentFY,
      month: '',
      revenue: 0,
      exportSales: 0, b2bSales: 0, retailSales: 0, bulkSales: 0,
      cogs: 0, employeeCost: 0, financeCost: 0, depreciation: 0, otherExpenses: 0,
      collections: 0, receivables: 0, payables: 0,
      notes: '',
    },
  })

  const watchYear = watch('year')
  const watchMonth = watch('month')

  const applyParsedData = (col: any) => {
    setValue('year', col.year)
    setValue('month', col.month)
    setValue('revenue', col.values.revenue)
    setValue('exportSales', col.values.exportSales)
    setValue('b2bSales', col.values.b2bSales)
    setValue('retailSales', col.values.retailSales)
    setValue('bulkSales', col.values.bulkSales)
    setValue('cogs', col.values.cogs)
    setValue('employeeCost', col.values.employeeCost)
    setValue('financeCost', col.values.financeCost)
    setValue('depreciation', col.values.depreciation)
    setValue('otherExpenses', col.values.otherExpenses)
    setValue('collections', col.values.collections)
    setValue('receivables', col.values.receivables)
    setValue('payables', col.values.payables)
  }

  const yearRecords = enrichedRecords.filter(r => r.year === selectedYear)
  const enteredMonths = new Set(yearRecords.map(r => r.month))

  const onSubmit = async (data: FormData) => {
    if (!canWrite()) {
      toastError('You do not have permission to enter data.')
      return
    }
    setIsSubmitting(true)
    try {
      const record = {
        year: data.year,
        month: data.month,
        revenue: data.revenue,
        sales: {
          export: data.exportSales,
          b2b: data.b2bSales,
          retail: data.retailSales,
          bulk: data.bulkSales,
        },
        expenses: {
          cogs: data.cogs,
          employee: data.employeeCost,
          finance: data.financeCost,
          depreciation: data.depreciation,
          other: data.otherExpenses,
        },
        collections: data.collections,
        receivables: data.receivables,
        payables: data.payables,
        notes: data.notes || '',
      }

      if (editingId) {
        await updateRecord(editingId, record)
        await auditRepository.log({
          userId: user?.uid || '',
          userEmail: user?.email || '',
          action: 'update',
          entityType: 'financial',
          entityId: editingId,
          field: 'full_record',
          newValue: JSON.stringify(record),
        })
        success(`${data.month} ${data.year} updated successfully!`)
        setEditingId(null)
      } else {
        // Warning before overwriting existing data for the same month/year
        if (enteredMonths.has(data.month)) {
          if (!confirm(`Data for ${data.month} ${data.year} already exists. Overwrite?`)) {
            setIsSubmitting(false)
            return
          }
        }
        const id = await createRecord(record)
        await auditRepository.log({
          userId: user?.uid || '',
          userEmail: user?.email || '',
          action: 'create',
          entityType: 'financial',
          entityId: id,
          newValue: JSON.stringify(record),
        })
        success(`${data.month} ${data.year} saved successfully!`)
      }

      reset({ year: currentFY, month: '' })
    } catch (err: any) {
      toastError(err.message || 'Failed to save data.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEdit = (record: FinancialRecord) => {
    setEditingId(getDocumentId(record.year, record.month))
    setValue('year', record.year)
    setValue('month', record.month)
    setValue('revenue', record.revenue)
    setValue('exportSales', record.sales.export)
    setValue('b2bSales', record.sales.b2b)
    setValue('retailSales', record.sales.retail)
    setValue('bulkSales', record.sales.bulk)
    setValue('cogs', record.expenses.cogs)
    setValue('employeeCost', record.expenses.employee)
    setValue('financeCost', record.expenses.finance)
    setValue('depreciation', record.expenses.depreciation)
    setValue('otherExpenses', record.expenses.other)
    setValue('collections', record.collections)
    setValue('receivables', record.receivables)
    setValue('payables', record.payables)
    setValue('notes', record.notes || '')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleDelete = async (record: FinancialRecord) => {
    if (!canDelete()) {
      toastError('You do not have permission to delete.')
      return
    }
    if (!confirm(`Delete data for ${record.month} ${record.year}?`)) return
    const id = getDocumentId(record.year, record.month)
    await deleteRecord(id)
    await auditRepository.log({
      userId: user?.uid || '',
      userEmail: user?.email || '',
      action: 'delete',
      entityType: 'financial',
      entityId: id,
      oldValue: JSON.stringify(record), // Save entire deleted record for data-loss prevention
    })
    success('Record deleted.')
    if (editingId === id) {
      setEditingId(null)
      reset()
    }
  }

  const handleDuplicate = async (record: FinancialRecord) => {
    handleEdit(record)
    setValue('month', '')
    setEditingId(null)
    success('Data copied. Select a new month and save.')
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold">{editingId ? 'Edit Financial Data' : 'Monthly Data Entry'}</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Enter summarized monthly financial data from Tally manually or auto-fill using an Excel/spreadsheet file.
        </p>
      </motion.div>

      {/* Auto-fill Panel */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card rounded-2xl p-5 border border-primary/20 bg-gradient-to-br from-primary/5 via-background to-background"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/10">
              <FileSpreadsheet className="text-white" size={20} />
            </div>
            <div>
              <h2 className="font-semibold text-base">Intelligent Auto-Fill</h2>
              <p className="text-xs text-muted-foreground">Upload Excel template or paste copied data to instantly populate form</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant={autoFillMode === 'upload' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setAutoFillMode('upload')}
              className="text-xs rounded-full"
            >
              Upload Excel
            </Button>
            <Button
              variant={autoFillMode === 'paste' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setAutoFillMode('paste')}
              className="text-xs rounded-full"
            >
              Paste Cells
            </Button>
          </div>
        </div>

        {autoFillMode === 'upload' ? (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-muted-foreground/20 hover:border-primary/50 rounded-xl p-8 text-center cursor-pointer transition-colors bg-accent/20 hover:bg-accent/40"
          >
            <input
              type="file"
              ref={fileInputRef}
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (!file) return
                const reader = new FileReader()
                reader.onload = (evt) => {
                  const bstr = evt.target?.result
                  const wb = XLSX.read(bstr, { type: 'binary' })
                  const wsname = wb.SheetNames[0]
                  const ws = wb.Sheets[wsname]
                  const data = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][]
                  const results = parseSpreadsheet2D(data)
                  if (results && results.length > 0) {
                    setParsedColumns(results)
                    setSelectedColIndex(0)
                    applyParsedData(results[0])
                    success(`Successfully parsed ${results.length} month column(s) from sheet.`)
                  } else {
                    toastError('Could not find any month-year columns (e.g. Apr-26) in the template.')
                  }
                }
                reader.readAsBinaryString(file)
              }}
            />
            <Upload className="mx-auto text-muted-foreground mb-2" size={28} />
            <p className="text-sm font-medium">Click to select or drag & drop corporate Excel file</p>
            <p className="text-xs text-muted-foreground mt-1">Supports .xlsx, .xls, .csv templates</p>
          </div>
        ) : (
          <div className="space-y-3">
            <textarea
              value={pasteText}
              onChange={(e) => {
                const text = e.target.value
                setPasteText(text)
                if (!text.trim()) return
                // Parse TSV/CSV from pasted cells
                const rows = text.split('\n').map(line => line.split('\t'))
                const results = parseSpreadsheet2D(rows)
                if (results && results.length > 0) {
                  setParsedColumns(results)
                  setSelectedColIndex(0)
                  applyParsedData(results[0])
                  success(`Successfully parsed ${results.length} month column(s) from pasted text.`)
                } else {
                  // try simple comma separation fallback
                  const csvRows = text.split('\n').map(line => line.split(','))
                  const resultsCsv = parseSpreadsheet2D(csvRows)
                  if (resultsCsv && resultsCsv.length > 0) {
                    setParsedColumns(resultsCsv)
                    setSelectedColIndex(0)
                    applyParsedData(resultsCsv[0])
                    success(`Successfully parsed ${resultsCsv.length} month column(s) from pasted CSV text.`)
                  } else {
                    toastError('Could not find any matching columns in the pasted data.')
                  }
                }
              }}
              rows={3}
              placeholder="Paste cells directly from your Excel sheet here (e.g. select Particular and LTD / Monthly columns and paste)..."
              className="w-full px-3 py-2 rounded-xl border border-input bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring transition-colors"
            />
          </div>
        )}

        <AnimatePresence>
          {parsedColumns && parsedColumns.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 pt-4 border-t border-border space-y-3"
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Select Month Column to Auto-Fill:</span>
                {parsedColumns.map((col, idx) => (
                  <Button
                    key={idx}
                    variant={selectedColIndex === idx ? 'default' : 'outline'}
                    size="sm"
                    className="text-xs h-7 px-3 rounded-full"
                    onClick={() => {
                      setSelectedColIndex(idx)
                      applyParsedData(col)
                    }}
                  >
                    {col.header} ({col.month} {col.year})
                  </Button>
                ))}
              </div>

              <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-3 flex gap-2.5 items-start">
                <Check className="text-emerald-500 shrink-0 mt-0.5" size={16} />
                <div>
                  <p className="text-xs font-medium text-emerald-800 dark:text-emerald-400">Intelligently Mapped Fields for {parsedColumns[selectedColIndex].month} {parsedColumns[selectedColIndex].year}:</p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-1 mt-1.5 text-[11px] text-muted-foreground">
                    <div>Revenue: ₹{(parsedColumns[selectedColIndex].values.revenue).toLocaleString('en-IN')}</div>
                    <div>COGS: ₹{(parsedColumns[selectedColIndex].values.cogs).toLocaleString('en-IN')}</div>
                    <div>Collections: ₹{(parsedColumns[selectedColIndex].values.collections).toLocaleString('en-IN')}</div>
                    <div>Receivables: ₹{(parsedColumns[selectedColIndex].values.receivables).toLocaleString('en-IN')}</div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Form */}
        <div className="xl:col-span-2 space-y-4">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Period Selection */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card rounded-2xl p-5"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center">
                  <Plus size={16} className="text-white" />
                </div>
                <h2 className="font-semibold">Reporting Period</h2>
                {editingId && <Badge variant="warning">Editing Mode</Badge>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Financial Year</Label>
                  <Select
                    value={String(watchYear)}
                    onValueChange={(v) => setValue('year', parseInt(v))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {years.map(y => (
                        <SelectItem key={y} value={String(y)}>FY {y}-{String(y + 1).slice(2)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.year && <p className="text-xs text-destructive">{errors.year.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Month</Label>
                  <Select
                    value={watchMonth}
                    onValueChange={(v) => setValue('month', v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select month" />
                    </SelectTrigger>
                    <SelectContent>
                      {MONTHS.map(m => (
                        <SelectItem
                          key={m}
                          value={m}
                          disabled={!editingId && enteredMonths.has(m)}
                        >
                          {m} {!editingId && enteredMonths.has(m) ? '✓' : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.month && <p className="text-xs text-destructive">{errors.month.message}</p>}
                </div>
              </div>
            </motion.div>

            {/* Data Sections */}
            {formSections.map((section, si) => (
              <motion.div
                key={section.title}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * (si + 1) }}
                className="glass-card rounded-2xl p-5"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${section.color} flex items-center justify-center`}>
                    <span className="text-white text-xs font-bold">{si + 1}</span>
                  </div>
                  <h2 className="font-semibold">{section.title}</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {section.fields.map(field => (
                    <NumberInput
                      key={field.name}
                      label={field.label}
                      name={field.name}
                      register={register}
                      error={errors[field.name as keyof FormData]}
                    />
                  ))}
                </div>
              </motion.div>
            ))}

            {/* Notes */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="glass-card rounded-2xl p-5"
            >
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">Notes</Label>
              <textarea
                {...register('notes')}
                rows={3}
                placeholder="Any additional notes or remarks for this month..."
                className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring transition-colors"
              />
            </motion.div>

            {/* Actions */}
            <div className="flex gap-3">
              <Button
                type="submit"
                disabled={isSubmitting || !canWrite()}
                variant="gradient"
                size="lg"
                className="flex-1"
              >
                <Save size={16} />
                {isSubmitting ? 'Saving...' : editingId ? 'Update Record' : 'Save Record'}
              </Button>
              {editingId && (
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  onClick={() => { setEditingId(null); reset() }}
                >
                  Cancel
                </Button>
              )}
            </div>
          </form>
        </div>

        {/* Records List */}
        <div className="space-y-4">
          <div className="glass-card rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-sm">Entered Records</h2>
              <Select
                value={String(selectedYear)}
                onValueChange={(v) => setSelectedYear(parseInt(v))}
              >
                <SelectTrigger className="w-[120px] h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {years.map(y => (
                    <SelectItem key={y} value={String(y)}>FY {y}-{String(y + 1).slice(2)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {isLoading ? (
              <div className="space-y-2">
                {Array(6).fill(0).map((_, i) => (
                  <div key={i} className="h-12 rounded-lg bg-muted animate-pulse" />
                ))}
              </div>
            ) : yearRecords.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No records for FY {selectedYear}
              </p>
            ) : (
              <div className="space-y-2">
                {MONTHS.filter(m => enteredMonths.has(m)).map(month => {
                  const rec = yearRecords.find(r => r.month === month)!
                  const isEditing = editingId === getDocumentId(rec.year, rec.month)
                  return (
                    <motion.div
                      key={month}
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={`flex items-center justify-between p-3 rounded-xl border transition-colors ${
                        isEditing ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/30 hover:bg-accent/50'
                      }`}
                    >
                      <div>
                        <p className="text-sm font-medium">{rec.month}</p>
                        <p className="text-xs text-muted-foreground">
                          ₹{(rec.revenue / 100000).toFixed(1)}L revenue
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleDuplicate(rec)}
                          className="p-1.5 rounded-lg hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
                          title="Duplicate"
                        >
                          <Copy size={12} />
                        </button>
                        <button
                          onClick={() => handleEdit(rec)}
                          className="p-1.5 rounded-lg hover:bg-accent transition-colors text-muted-foreground hover:text-blue-600"
                          title="Edit"
                        >
                          <Edit2 size={12} />
                        </button>
                        <button
                          onClick={() => handleDelete(rec)}
                          className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-muted-foreground hover:text-red-600"
                          title="Delete"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            )}

            {/* Month availability */}
            <div className="mt-4 pt-4 border-t border-border">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">All Months</p>
              <div className="grid grid-cols-3 gap-1.5">
                {MONTHS.map(m => (
                  <div
                    key={m}
                    className={`text-xs py-1 px-2 rounded text-center font-medium ${
                      enteredMonths.has(m)
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {m.slice(0, 3)}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
