import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  onSnapshot,
  type Unsubscribe,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { FinancialRecord } from '@/types'
import { getDocumentId } from '@/lib/utils'

const COLLECTION = 'financials'

export const financialRepository = {
  async create(record: Omit<FinancialRecord, 'id' | 'createdAt' | 'updatedAt'>, userId: string): Promise<string> {
    const docId = getDocumentId(record.year, record.month)
    const docRef = doc(db, COLLECTION, docId)

    const existing = await getDoc(docRef)
    if (existing.exists()) {
      throw new Error(`Data for ${record.month} ${record.year} already exists.`)
    }

    await setDoc(docRef, {
      ...record,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      createdBy: userId,
    })

    return docId
  },

  async update(id: string, data: Partial<FinancialRecord>, userId: string): Promise<void> {
    const docRef = doc(db, COLLECTION, id)
    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp(),
      updatedBy: userId,
    })
  },

  async delete(id: string): Promise<void> {
    await deleteDoc(doc(db, COLLECTION, id))
  },

  async getById(id: string): Promise<FinancialRecord | null> {
    const snap = await getDoc(doc(db, COLLECTION, id))
    if (!snap.exists()) return null
    return { id: snap.id, ...snap.data() } as FinancialRecord
  },

  async getByYear(year: number): Promise<FinancialRecord[]> {
    const q = query(
      collection(db, COLLECTION),
      where('year', '==', year),
      orderBy('month')
    )
    const snap = await getDocs(q)
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as FinancialRecord))
  },

  async getAll(): Promise<FinancialRecord[]> {
    const q = query(collection(db, COLLECTION), orderBy('year'), orderBy('month'))
    const snap = await getDocs(q)
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as FinancialRecord))
  },

  async getYears(): Promise<number[]> {
    const all = await this.getAll()
    const years = [...new Set(all.map(r => r.year))].sort()
    return years
  },

  subscribeToYear(year: number, callback: (records: FinancialRecord[]) => void): Unsubscribe {
    const q = query(
      collection(db, COLLECTION),
      where('year', '==', year)
    )
    return onSnapshot(q, snap => {
      const records = snap.docs.map(d => ({ id: d.id, ...d.data() } as FinancialRecord))
      callback(records)
    })
  },

  subscribeToAll(callback: (records: FinancialRecord[]) => void, onError?: (error: any) => void): Unsubscribe {
    const q = query(collection(db, COLLECTION), orderBy('year'))
    return onSnapshot(q, snap => {
      const records = snap.docs.map(d => ({ id: d.id, ...d.data() } as FinancialRecord))
      callback(records)
    }, error => {
      if (onError) onError(error)
    })
  },
}
