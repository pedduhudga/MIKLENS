import { useEffect } from 'react'
import { financialRepository } from '@/services/financialRepository'
import { useFinancialStore } from '@/store/financialStore'
import { useAuthStore } from '@/store/authStore'

export function useFinancialData() {
  const { setRecords, setLoading, setError } = useFinancialStore()
  const { user } = useAuthStore()

  useEffect(() => {
    if (!user) return

    setLoading(true)
    const unsubscribe = financialRepository.subscribeToAll(
      (records) => {
        setRecords(records)
        setLoading(false)
        setError(null)
      },
      (err) => {
        console.error('Firestore subscription failed:', err)
        setError(err.message || 'Failed to sync financial data')
        setLoading(false)
      }
    )

    return () => unsubscribe()
  }, [user, setRecords, setLoading, setError])
}

export function useFinancialActions() {
  const { user } = useAuthStore()

  const createRecord = async (data: Parameters<typeof financialRepository.create>[0]) => {
    if (!user) throw new Error('Not authenticated')
    return financialRepository.create(data, user.uid)
  }

  const updateRecord = async (id: string, data: Parameters<typeof financialRepository.update>[1]) => {
    if (!user) throw new Error('Not authenticated')
    return financialRepository.update(id, data, user.uid)
  }

  const deleteRecord = async (id: string) => {
    return financialRepository.delete(id)
  }

  return { createRecord, updateRecord, deleteRecord }
}
