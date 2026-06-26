import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'
import { DollarSign, Eye, EyeOff, LogIn, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/components/ui/toast-provider'
import { auditRepository } from '@/services/auditRepository'

const schema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})
type FormData = z.infer<typeof schema>

export default function LoginPage() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const { success, error: toastError } = useToast()
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    setIsLoading(true)
    console.log('Login onSubmit triggered for email:', data.email)
    try {
      console.log('Calling login function...')
      const cred = await login(data.email, data.password)
      console.log('Login credentials returned successfully:', cred.user?.uid)
      
      console.log('Dispatching audit log in background (non-blocking)...')
      auditRepository.log({
        userId: cred.user.uid,
        userEmail: data.email,
        action: 'login',
        entityType: 'user',
        entityId: cred.user.uid,
      }).catch((logErr) => {
        console.warn('Background audit log failed:', logErr)
      })

      console.log('Redirecting to dashboard...')
      success('Welcome back!')
      navigate('/dashboard')
    } catch (err: any) {
      console.error('Sign-in error caught:', err)
      const msg = err.code === 'auth/invalid-credential'
        ? 'Invalid email or password.'
        : err.message || 'Login failed.'
      toastError(msg)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 p-4">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/5 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="w-full max-w-md relative z-10"
      >
        {/* Card */}
        <div className="bg-white/10 backdrop-blur-2xl border border-white/20 rounded-3xl p-8 shadow-2xl">
          {/* Logo */}
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center mx-auto mb-4 shadow-xl"
            >
              <DollarSign size={32} className="text-white" />
            </motion.div>
            <h1 className="text-2xl font-bold text-white">Financial MIS</h1>
            <p className="text-blue-200 text-sm mt-1">Business Intelligence Dashboard</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-2">
              <Label className="text-blue-100 text-sm font-medium">Email Address</Label>
              <Input
                type="email"
                placeholder="you@company.com"
                autoComplete="email"
                className="bg-white/10 border-white/20 text-white placeholder:text-blue-200/50 focus:border-blue-400 focus:ring-blue-400/20"
                {...register('email')}
              />
              {errors.email && (
                <p className="text-red-400 text-xs">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-blue-100 text-sm font-medium">Password</Label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="bg-white/10 border-white/20 text-white placeholder:text-blue-200/50 focus:border-blue-400 pr-10"
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-200/60 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && (
                <p className="text-red-400 text-xs">{errors.password.message}</p>
              )}
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 gradient-primary text-white font-semibold rounded-xl shadow-lg hover:opacity-90 transition-opacity"
            >
              {isLoading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  <LogIn size={18} />
                  Sign In
                </>
              )}
            </Button>
          </form>

          {/* Demo hint */}
          <div className="mt-6 p-4 rounded-xl bg-white/5 border border-white/10">
            <p className="text-blue-200 text-xs text-center font-medium mb-2">🔒 Demo Credentials</p>
            <div className="text-xs text-blue-300/70 text-center space-y-1">
              <p>Email: <span className="text-blue-200 font-mono">admin@company.com</span></p>
              <p>Password: <span className="text-blue-200 font-mono">admin123</span></p>
            </div>
          </div>

          <p className="text-blue-300/60 text-xs text-center mt-5">
            Configure Firebase to enable authentication
          </p>
        </div>
      </motion.div>
    </div>
  )
}
