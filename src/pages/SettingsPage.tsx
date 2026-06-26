import { useState } from 'react'
import { motion } from 'framer-motion'
import { Settings, Moon, Sun, Monitor, Building, User, Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { useUIStore } from '@/store/uiStore'
import { useAuthStore } from '@/store/authStore'
import { useToast } from '@/components/ui/toast-provider'

export default function SettingsPage() {
  const { theme, setTheme, companyName, currency, setCompanyDetails } = useUIStore()
  const { user } = useAuthStore()
  const { success } = useToast()
  
  const [localCompanyName, setLocalCompanyName] = useState(companyName)
  const [localCurrency, setLocalCurrency] = useState(currency)

  const themes = [
    { id: 'light', label: 'Light', icon: Sun },
    { id: 'dark', label: 'Dark', icon: Moon },
    { id: 'system', label: 'System', icon: Monitor },
  ]

  const handleSaveCompanySettings = () => {
    setCompanyDetails(localCompanyName, localCurrency)
    success('Company settings saved successfully!')
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Manage your preferences and account</p>
      </motion.div>

      {/* Theme */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-2xl p-5">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
            <Monitor size={18} className="text-white" />
          </div>
          <h2 className="font-semibold">Appearance</h2>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {themes.map(t => {
            const Icon = t.icon
            const active = theme === t.id
            return (
              <button
                key={t.id}
                onClick={() => { setTheme(t.id as 'light' | 'dark' | 'system'); success(`Theme changed to ${t.label}`) }}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                  active ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40'
                }`}
              >
                <Icon size={20} className={active ? 'text-primary' : 'text-muted-foreground'} />
                <span className={`text-sm font-medium ${active ? 'text-primary' : 'text-muted-foreground'}`}>{t.label}</span>
              </button>
            )
          })}
        </div>
      </motion.div>

      {/* Company */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card rounded-2xl p-5">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
            <Building size={18} className="text-white" />
          </div>
          <h2 className="font-semibold">Company Settings</h2>
        </div>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Company Name</Label>
            <Input value={localCompanyName} onChange={e => setLocalCompanyName(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Currency</Label>
            <Input value={localCurrency} onChange={e => setLocalCurrency(e.target.value)} placeholder="INR" />
          </div>
          <Button onClick={handleSaveCompanySettings} className="w-full">Save Settings</Button>
        </div>
      </motion.div>

      {/* Profile */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card rounded-2xl p-5">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
            <User size={18} className="text-white" />
          </div>
          <h2 className="font-semibold">Profile</h2>
        </div>
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xl font-bold">
              {user?.displayName?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div>
              <p className="font-semibold">{user?.displayName}</p>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
              <span className="inline-flex mt-1 px-2 py-0.5 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 text-xs font-medium rounded-full capitalize">
                {user?.role}
              </span>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Display Name</Label>
            <Input defaultValue={user?.displayName || ''} />
          </div>
          <Button onClick={() => success('Profile updated')} className="w-full">Update Profile</Button>
        </div>
      </motion.div>

      {/* Security */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-card rounded-2xl p-5">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center">
            <Lock size={18} className="text-white" />
          </div>
          <h2 className="font-semibold">Security</h2>
        </div>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Current Password</Label>
            <Input type="password" placeholder="••••••••" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">New Password</Label>
            <Input type="password" placeholder="••••••••" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Confirm Password</Label>
            <Input type="password" placeholder="••••••••" />
          </div>
          <Button variant="destructive" onClick={() => success('Password updated')} className="w-full">Change Password</Button>
        </div>
      </motion.div>
    </div>
  )
}
