import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'
import { Save, Trash2, Copy, Plus, Edit2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
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
          Enter summarized monthly financial data from Tally
        </p>
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
