import { Link, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, PlusCircle, BarChart3, TrendingUp, FileText,
  Clock, Shield, Settings, ChevronLeft, ChevronRight, Activity,
  DollarSign, X
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useUIStore } from '@/store/uiStore'
import { useAuthStore } from '@/store/authStore'
import { Separator } from '@/components/ui/separator'

const navItems = [
  {
    group: 'Main',
    items: [
      { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { path: '/entry', label: 'Data Entry', icon: PlusCircle },
    ],
  },
  {
    group: 'Analytics',
    items: [
      { path: '/analytics', label: 'Analytics', icon: TrendingUp },
      { path: '/reports', label: 'Reports', icon: FileText },
      { path: '/charts', label: 'Charts', icon: BarChart3 },
    ],
  },
  {
    group: 'History',
    items: [
      { path: '/timeline', label: 'Timeline', icon: Clock },
      { path: '/audit', label: 'Audit Log', icon: Shield },
    ],
  },
  {
    group: 'System',
    items: [
      { path: '/users', label: 'Users', icon: Activity, adminOnly: true },
      { path: '/settings', label: 'Settings', icon: Settings },
    ],
  },
]

export function Sidebar() {
  const { sidebarCollapsed, toggleSidebar, sidebarMobileOpen, setMobileSidebar } = useUIStore()
  const { user } = useAuthStore()
  const location = useLocation()

  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + '/')

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className={cn(
        'flex items-center gap-3 px-4 py-5 border-b border-white/10',
        sidebarCollapsed ? 'justify-center px-2' : ''
      )}>
        <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center shadow-lg shrink-0">
          <DollarSign className="w-5 h-5 text-white" />
        </div>
        <AnimatePresence>
          {!sidebarCollapsed && (
            <motion.div
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <p className="text-white font-bold text-sm leading-tight">Financial MIS</p>
              <p className="text-blue-200 text-xs">Dashboard</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto sidebar-scroll py-4 px-2 space-y-1">
        {navItems.map((group) => (
          <div key={group.group} className="mb-4">
            {!sidebarCollapsed && (
              <p className="text-xs font-semibold text-blue-300/60 uppercase tracking-wider px-3 mb-2">
                {group.group}
              </p>
            )}
            {group.items.map((item) => {
              if (item.adminOnly && user?.role !== 'admin') return null
              const Icon = item.icon
              const active = isActive(item.path)
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileSidebar(false)}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group relative',
                    sidebarCollapsed ? 'justify-center' : '',
                    active
                      ? 'bg-white/15 text-white shadow-sm'
                      : 'text-blue-100/70 hover:bg-white/10 hover:text-white'
                  )}
                >
                  {active && (
                    <motion.div
                      layoutId="sidebar-active"
                      className="absolute inset-0 bg-white/15 rounded-lg"
                      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    />
                  )}
                  <Icon className={cn('w-4.5 h-4.5 shrink-0 relative z-10', active ? 'text-white' : '')} size={18} />
                  {!sidebarCollapsed && (
                    <span className="text-sm font-medium relative z-10">{item.label}</span>
                  )}
                  {active && !sidebarCollapsed && (
                    <div className="ml-auto relative z-10 w-1.5 h-1.5 rounded-full bg-blue-300" />
                  )}
                </Link>
              )
            })}
            {!sidebarCollapsed && <Separator className="mt-3 bg-white/10" />}
          </div>
        ))}
      </nav>

      {/* User info */}
      {!sidebarCollapsed && user && (
        <div className="p-4 border-t border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
              {user.displayName?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium truncate">{user.displayName}</p>
              <p className="text-blue-300 text-xs capitalize">{user.role}</p>
            </div>
          </div>
        </div>
      )}

      {/* Collapse button - desktop */}
      <button
        onClick={toggleSidebar}
        className="hidden lg:flex items-center justify-center p-2 m-2 rounded-lg text-blue-200 hover:bg-white/10 hover:text-white transition-colors"
      >
        {sidebarCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
      </button>
    </div>
  )

  return (
    <>
      {/* Desktop Sidebar */}
      <motion.aside
        animate={{ width: sidebarCollapsed ? 64 : 240 }}
        transition={{ type: 'spring', stiffness: 300, damping: 35 }}
        className="hidden lg:flex flex-col h-screen bg-gradient-to-b from-slate-900 via-blue-950 to-slate-900 border-r border-white/10 relative shrink-0 z-30"
      >
        {sidebarContent}
      </motion.aside>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {sidebarMobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-40 lg:hidden"
              onClick={() => setMobileSidebar(false)}
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', stiffness: 300, damping: 35 }}
              className="fixed inset-y-0 left-0 w-[240px] bg-gradient-to-b from-slate-900 via-blue-950 to-slate-900 border-r border-white/10 z-50 lg:hidden flex flex-col"
            >
              <button
                onClick={() => setMobileSidebar(false)}
                className="absolute top-4 right-4 text-white/60 hover:text-white"
              >
                <X size={20} />
              </button>
              {sidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
