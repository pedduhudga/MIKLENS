import {
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  limit,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { AuditLog } from '@/types'

const COLLECTION = 'auditLogs'

export const auditRepository = {
  async log(entry: Omit<AuditLog, 'id' | 'timestamp'>): Promise<void> {
    await addDoc(collection(db, COLLECTION), {
      ...entry,
      timestamp: serverTimestamp(),
    })
  },

  async getRecent(count = 50): Promise<AuditLog[]> {
    const q = query(
      collection(db, COLLECTION),
      orderBy('timestamp', 'desc'),
      limit(count)
    )
    const snap = await getDocs(q)
    return snap.docs.map(d => ({
      id: d.id,
      ...d.data(),
      timestamp: d.data().timestamp?.toDate?.() || new Date(),
    } as AuditLog))
  },
}
