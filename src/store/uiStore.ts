import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface UIState {
  theme: 'light' | 'dark' | 'system'
  sidebarCollapsed: boolean
  sidebarMobileOpen: boolean
  companyName: string
  currency: string

  setTheme: (theme: 'light' | 'dark' | 'system') => void
  toggleSidebar: () => void
  setSidebarCollapsed: (collapsed: boolean) => void
  toggleMobileSidebar: () => void
  setMobileSidebar: (open: boolean) => void
  setCompanyDetails: (name: string, currency: string) => void
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      theme: 'light',
      sidebarCollapsed: false,
      sidebarMobileOpen: false,
      companyName: 'My Company',
      currency: 'INR',

      setTheme: (theme) => {
        set({ theme })
        const root = document.documentElement
        if (theme === 'dark') root.classList.add('dark')
        else if (theme === 'light') root.classList.remove('dark')
        else {
          const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
          prefersDark ? root.classList.add('dark') : root.classList.remove('dark')
        }
      },

      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
      toggleMobileSidebar: () => set((s) => ({ sidebarMobileOpen: !s.sidebarMobileOpen })),
      setMobileSidebar: (open) => set({ sidebarMobileOpen: open }),
      setCompanyDetails: (companyName, currency) => set({ companyName, currency }),
    }),
    {
      name: 'ui-store',
      partialize: (state) => ({ 
        theme: state.theme, 
        sidebarCollapsed: state.sidebarCollapsed,
        companyName: state.companyName,
        currency: state.currency
      }),
    }
  )
)
