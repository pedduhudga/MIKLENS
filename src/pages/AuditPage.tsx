import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Shield, Plus, Edit, Trash, LogIn, RotateCcw } from 'lucide-react'
import { auditRepository } from '@/services/auditRepository'
import type { AuditLog } from '@/types'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/components/ui/toast-provider'
import { useFinancialActions } from '@/hooks/useFinancialData'
import { useAuth } from '@/hooks/useAuth'
import { getDocumentId } from '@/lib/utils'

const actionConfig = {
  create: { label: 'Created', icon: Plus, variant: 'success' as const },
  update: { label: 'Updated', icon: Edit, variant: 'info' as const },
  delete: { label: 'Deleted', icon: Trash, variant: 'danger' as const },
  login: { label: 'Login', icon: LogIn, variant: 'secondary' as const },
  logout: { label: 'Logout', icon: LogIn, variant: 'secondary' as const },
}

export default function AuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [restoringId, setRestoringId] = useState<string | null>(null)

  const { createRecord, deleteRecord } = useFinancialActions()
  const { user, canWrite } = useAuth()
  const { success, error: toastError } = useToast()
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const handleRestore = async (log: AuditLog) => {
    if (!canWrite()) {
      toastError('You do not have permission to restore data.')
      return
    }
    const dataStr = log.oldValue || log.newValue
    if (!dataStr) {
      toastError('No backup data found for this record version.')
      return
    }
    if (!confirm(`Are you sure you want to restore/rollback to this version of the record?`)) return

    setRestoringId(log.id || null)
    try {
      const parsedRecord = JSON.parse(dataStr)
      delete parsedRecord.id
      await createRecord(parsedRecord, true)
      
      // Log the restore/rollback action in audit log
      await auditRepository.log({
        userId: user?.uid || '',
        userEmail: user?.email || '',
        action: log.action === 'delete' ? 'create' : 'update',
        entityType: 'financial',
        entityId: getDocumentId(parsedRecord.year, parsedRecord.month),
        newValue: JSON.stringify(parsedRecord),
      })

      success(`Successfully restored/reverted record for ${parsedRecord.month} ${parsedRecord.year}!`)
      const data = await auditRepository.getRecent(100)
      setLogs(data)
    } catch (err: any) {
      toastError(err.message || 'Failed to restore record.')
    } finally {
      setRestoringId(null)
    }
  }

  const handleDeleteRecord = async (log: AuditLog) => {
    if (!canWrite()) {
      toastError('You do not have permission to delete data.')
      return
    }
    if (!confirm(`Are you sure you want to delete the active financial record for ${log.entityId}? This will remove the active data from dashboard charts.`)) return

    setDeletingId(log.id || null)
    try {
      await deleteRecord(log.entityId)
      // Log deletion activity in audit log
      const dataStr = log.newValue || log.oldValue || ''
      await auditRepository.log({
        userId: user?.uid || '',
        userEmail: user?.email || '',
        action: 'delete',
        entityType: 'financial',
        entityId: log.entityId,
        oldValue: dataStr,
      })
      success(`Successfully deleted financial record for ${log.entityId}!`)
      const data = await auditRepository.getRecent(100)
      setLogs(data)
    } catch (err: any) {
      toastError(err.message || 'Failed to delete record.')
    } finally {
      setDeletingId(null)
    }
  }

  useEffect(() => {
    auditRepository.getRecent(100).then(data => {
      setLogs(data)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold">Audit Log</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Complete activity history</p>
      </motion.div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card rounded-2xl overflow-hidden">
        <div className="p-5 border-b border-border flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-slate-600 to-slate-800 flex items-center justify-center">
            <Shield size={18} className="text-white" />
          </div>
          <div>
            <h2 className="font-semibold">Activity Records</h2>
            <p className="text-xs text-muted-foreground">{logs.length} recent activities</p>
          </div>
        </div>

        {loading ? (
          <div className="p-5 space-y-3">
            {Array(8).fill(0).map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="w-8 h-8 rounded-full" />
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-32" />
                </div>
                <Skeleton className="h-6 w-16 rounded-full" />
              </div>
            ))}
          </div>
        ) : logs.length === 0 ? (
          <div className="p-16 text-center">
            <Shield size={40} className="mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No audit records yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {logs.map((log, i) => {
              const config = actionConfig[log.action] || actionConfig.update
              const Icon = config.icon
              return (
                <motion.div
                  key={log.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.02 }}
                  className="flex items-center gap-4 p-4 hover:bg-accent/30 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                    <Icon size={14} className="text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {log.userEmail}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {log.entityType} · {log.entityId}
                      {log.field && ` · ${log.field}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {log.entityType === 'financial' && (log.oldValue || log.newValue) && (
                      <button
                        onClick={() => handleRestore(log)}
                        disabled={restoringId === log.id}
                        className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 hover:text-emerald-500 hover:bg-emerald-500/10 px-2 py-1 rounded transition-colors disabled:opacity-50 border border-emerald-500/20"
                        title={log.action === 'delete' ? "Restore Deleted Record" : "Rollback to this version"}
                      >
                        <RotateCcw size={10} className={restoringId === log.id ? 'animate-spin' : ''} />
                        {log.action === 'delete' ? 'Restore' : 'Revert to this'}
                      </button>
                    )}
                    {log.entityType === 'financial' && (log.action === 'create' || log.action === 'update') && (
                      <button
                        onClick={() => handleDeleteRecord(log)}
                        disabled={deletingId === log.id}
                        className="flex items-center gap-1 text-[11px] font-semibold text-destructive hover:text-red-500 hover:bg-destructive/10 px-2.5 py-1 rounded transition-colors disabled:opacity-50 border border-destructive/20"
                        title="Delete active record from database"
                      >
                        <Trash size={10} />
                        Delete Data
                      </button>
                    )}
                    <Badge variant={config.variant}>{config.label}</Badge>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {log.timestamp instanceof Date
                        ? log.timestamp.toLocaleString()
                        : String(log.timestamp)}
                    </span>
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
      </motion.div>
    </div>
  )
}
