import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Users, Plus, Shield, Eye, Edit2, Trash2 } from 'lucide-react'
import { collection, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/components/ui/toast-provider'
import type { UserProfile, UserRole } from '@/types'

const roleColors: Record<UserRole, string> = {
  admin: 'danger',
  manager: 'warning',
  accountant: 'info',
  viewer: 'secondary',
}

export default function UsersPage() {
  const [users, setUsers] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)
  const { isAdmin } = useAuth()
  const { success, error } = useToast()

  const fetchUsers = async () => {
    try {
      const snap = await getDocs(collection(db, 'users'))
      setUsers(snap.docs.map(d => ({ uid: d.id, ...d.data() } as UserProfile)))
    } catch {
      error('Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchUsers() }, [])

  const changeRole = async (uid: string, role: UserRole) => {
    try {
      await updateDoc(doc(db, 'users', uid), { role })
      setUsers(prev => prev.map(u => u.uid === uid ? { ...u, role } : u))
      success('Role updated successfully')
    } catch {
      error('Failed to update role')
    }
  }

  const removeUser = async (uid: string) => {
    if (!confirm('Remove this user?')) return
    try {
      await deleteDoc(doc(db, 'users', uid))
      setUsers(prev => prev.filter(u => u.uid !== uid))
      success('User removed')
    } catch {
      error('Failed to remove user')
    }
  }

  if (!isAdmin()) {
    return (
      <div className="text-center py-20">
        <Shield size={48} className="mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">Access Denied</h3>
        <p className="text-sm text-muted-foreground">Only administrators can manage users.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">User Management</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Manage team members and their roles</p>
        </div>
      </motion.div>

      {/* Role Permissions Guide */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { role: 'Admin', perms: 'Full access', color: 'from-red-500 to-rose-600' },
          { role: 'Manager', perms: 'Dashboard + Reports + Entry', color: 'from-amber-500 to-orange-500' },
          { role: 'Accountant', perms: 'Entry only', color: 'from-blue-500 to-indigo-500' },
          { role: 'Viewer', perms: 'Read only', color: 'from-gray-500 to-slate-600' },
        ].map(r => (
          <div key={r.role} className="glass-card rounded-xl p-3">
            <div className={`inline-flex px-2 py-1 rounded-lg bg-gradient-to-r ${r.color} text-white text-xs font-bold mb-2`}>
              {r.role}
            </div>
            <p className="text-xs text-muted-foreground">{r.perms}</p>
          </div>
        ))}
      </motion.div>

      {/* Users Table */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="glass-card rounded-2xl overflow-hidden">
        <div className="p-5 border-b border-border flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
            <Users size={18} className="text-white" />
          </div>
          <div className="flex-1">
            <h2 className="font-semibold">Team Members</h2>
            <p className="text-xs text-muted-foreground">{users.length} users</p>
          </div>
        </div>

        {loading ? (
          <div className="p-5 space-y-4">
            {Array(4).fill(0).map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="w-10 h-10 rounded-full" />
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-3 w-28" />
                </div>
                <Skeleton className="h-8 w-24 rounded-lg" />
                <Skeleton className="h-8 w-8 rounded-lg" />
              </div>
            ))}
          </div>
        ) : users.length === 0 ? (
          <div className="p-16 text-center">
            <Users size={40} className="mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No users found.</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {users.map((u, i) => (
              <motion.div
                key={u.uid}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-center gap-4 p-4 hover:bg-accent/30 transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
                  {u.displayName?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{u.displayName}</p>
                  <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                </div>
                <Badge variant={roleColors[u.role] as any} className="shrink-0 capitalize">
                  {u.role}
                </Badge>
                <Select value={u.role} onValueChange={(v) => changeRole(u.uid, v as UserRole)}>
                  <SelectTrigger className="w-[120px] h-8 text-xs shrink-0">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="accountant">Accountant</SelectItem>
                    <SelectItem value="viewer">Viewer</SelectItem>
                  </SelectContent>
                </Select>
                <button
                  onClick={() => removeUser(u.uid)}
                  className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-muted-foreground hover:text-red-600 transition-colors shrink-0"
                >
                  <Trash2 size={14} />
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  )
}
