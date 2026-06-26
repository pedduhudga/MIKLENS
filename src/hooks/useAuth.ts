import { useEffect } from 'react'
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  createUserWithEmailAndPassword,
  updateProfile,
} from 'firebase/auth'
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db } from '@/lib/firebase'
import { useAuthStore } from '@/store/authStore'
import type { UserProfile, UserRole } from '@/types'

export function useAuthListener() {
  const { setUser, setLoading, setInitialized } = useAuthStore()

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid))
          let role: UserRole = 'viewer'
          if (userDoc.exists()) {
            role = userDoc.data().role || 'viewer'
          }
          const profile: UserProfile = {
            uid: firebaseUser.uid,
            email: firebaseUser.email || '',
            displayName: firebaseUser.displayName || firebaseUser.email || '',
            role,
            photoURL: firebaseUser.photoURL || undefined,
          }
          setUser(profile)
        } catch {
          setUser(null)
        }
      } else {
        setUser(null)
      }
      setLoading(false)
      setInitialized(true)
    })

    return () => unsubscribe()
  }, [setUser, setLoading, setInitialized])
}

export function useAuth() {
  const { user, isLoading } = useAuthStore()

  const login = async (email: string, password: string) => {
    return signInWithEmailAndPassword(auth, email, password)
  }

  const register = async (email: string, password: string, displayName: string, role: UserRole = 'viewer') => {
    const cred = await createUserWithEmailAndPassword(auth, email, password)
    await updateProfile(cred.user, { displayName })
    await setDoc(doc(db, 'users', cred.user.uid), {
      email,
      displayName,
      role,
      createdAt: serverTimestamp(),
    })
    return cred
  }

  const logout = async () => {
    await signOut(auth)
  }

  const hasPermission = (action: 'read' | 'write' | 'delete' | 'admin'): boolean => {
    if (!user) return false
    const rolePermissions: Record<UserRole, string[]> = {
      admin: ['read', 'write', 'delete', 'admin'],
      manager: ['read', 'write'],
      accountant: ['read', 'write'],
      viewer: ['read'],
    }
    return rolePermissions[user.role]?.includes(action) || false
  }

  const canWrite = () => hasPermission('write')
  const canDelete = () => hasPermission('delete')
  const isAdmin = () => user?.role === 'admin'

  return { user, isLoading, login, register, logout, hasPermission, canWrite, canDelete, isAdmin }
}
