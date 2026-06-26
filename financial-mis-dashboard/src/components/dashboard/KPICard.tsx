import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'

interface KPICardProps {
  title: string
  value: string
  change?: number
  changeLabel?: string
  trend?: 'up' | 'down' | 'neutral'
  status?: 'positive' | 'negative' | 'neutral'
  icon: React.ReactNode
  gradient: string
  loading?: boolean
  subtitle?: string
  index?: number
}

export function KPICard({
  title,
  value,
  change,
  changeLabel,
  trend = 'neutral',
  status = 'neutral',
  icon,
  gradient,
  loading = false,
  subtitle,
  index = 0,
}: KPICardProps) {
  if (loading) {
    return (
      <div className="glass-card rounded-2xl p-5 space-y-3">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-10 rounded-xl" />
        </div>
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-4 w-20" />
      </div>
    )
  }

  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus

  const trendColor = status === 'positive'
    ? 'text-emerald-600 dark:text-emerald-400'
    : status === 'negative'
    ? 'text-red-500 dark:text-red-400'
    : 'text-gray-500 dark:text-gray-400'

  const trendBg = status === 'positive'
    ? 'bg-emerald-50 dark:bg-emerald-900/20'
    : status === 'negative'
    ? 'bg-red-50 dark:bg-red-900/20'
    : 'bg-gray-50 dark:bg-gray-900/20'

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      whileHover={{ y: -2, transition: { duration: 0.2 } }}
      className="glass-card rounded-2xl p-5 cursor-default group"
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{title}</p>
          {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
        </div>
        <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-lg', gradient)}>
          {icon}
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-2xl font-bold text-foreground tracking-tight">{value}</p>

        {change !== undefined && (
          <div className={cn('inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-semibold', trendBg, trendColor)}>
            <TrendIcon size={12} />
            <span>{Math.abs(change).toFixed(1)}%</span>
            {changeLabel && <span className="text-muted-foreground font-normal">{changeLabel}</span>}
          </div>
        )}
      </div>
    </motion.div>
  )
}
