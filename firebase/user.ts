import { auth, db } from './index'
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile, updateEmail, signOut } from 'firebase/auth'
import { doc, setDoc, getDoc, getDocFromServer, updateDoc, serverTimestamp, collection, addDoc, getDocs, query, orderBy } from 'firebase/firestore'

export async function registerUser(params: { name: string; email: string; password: string; age: number; gender: string }) {
  const { name, email, password, age, gender } = params
  if (!auth || !db) throw new Error('firebase_not_initialized')
  try {
    const cred = await createUserWithEmailAndPassword(auth, email, password)
    const user = cred.user
    try {
      await updateProfile(user, { displayName: name })
    } catch {}
    const ref = doc(db, 'users', user.uid)
    try {
      await setDoc(ref, { uid: user.uid, name, email, age, gender, createdAt: serverTimestamp() })
    } catch (e) {
      console.warn('registerUser: failed to write user doc', e)
    }
    return { uid: user.uid }
  } catch (e: any) {
    throw e
  }
}

export async function loginUser(params: { email: string; password: string }) {
  const { email, password } = params
  if (!auth) throw new Error('firebase_not_initialized')
  const cred = await signInWithEmailAndPassword(auth, email, password)
  // Ensure profile doc exists
  try {
    if (db) {
      const ref = doc(db, 'users', cred.user.uid)
      const snap = await getDoc(ref)
      if (!snap.exists()) {
        const base = {
          uid: cred.user.uid,
          name: cred.user.displayName || '',
          email: cred.user.email || email,
          createdAt: serverTimestamp(),
        }
        await setDoc(ref, base, { merge: true })
      }
    }
  } catch (e) {
    console.warn('loginUser: ensure profile doc failed', e)
  }
  return { uid: cred.user.uid }
}

export async function getCurrentUserProfile() {
  if (!auth || !db) throw new Error('firebase_not_initialized')
  const user = auth.currentUser
  if (!user) return null
  const ref = doc(db, 'users', user.uid)
  const snap = await getDoc(ref)
  if (!snap.exists()) return null
  return snap.data()
}

export async function updateUserProfile(params: { name?: string; email?: string; age?: number; gender?: string }) {
  if (!auth || !db) throw new Error('firebase_not_initialized')
  const user = auth.currentUser
  if (!user) throw new Error('not_authenticated')
  const ref = doc(db, 'users', user.uid)
  const updates: any = {}
  if (params.name !== undefined) updates.name = params.name
  if (params.age !== undefined) updates.age = params.age
  if (params.gender !== undefined) updates.gender = params.gender
  if (params.email !== undefined && params.email !== user.email) {
    try {
      await updateEmail(user, params.email)
      updates.email = params.email
    } catch (e) {}
  }
  if (params.name !== undefined) {
    try {
      await updateProfile(user, { displayName: params.name })
    } catch (e) {}
  }
  if (Object.keys(updates).length > 0) {
    await updateDoc(ref, updates)
  }
  return true
}

export async function signOutUser() {
  if (!auth) throw new Error('firebase_not_initialized')
  await signOut(auth)
  return true
}

// ── Skin Routine ────────────────────────────────────────────────────────────

export async function saveActiveRoutine(params: {
  productIndex: number
  product: { name: string; brand: string; type: string; category: string }
  routineTimes: string[]
  baseScan: { skinType: string; conditions: { label: string; confidence: number }[]; savedAt: number } | null
}) {
  if (!auth || !db) return
  const user = auth.currentUser
  if (!user) return
  const ref = doc(db, 'users', user.uid)
  try {
    await updateDoc(ref, {
      activeRoutine: {
        ...params,
        startedAt: serverTimestamp(),
        lastCheckedAt: null,
        noImprovementCount: 0,
      },
    })
  } catch (e) {
    console.warn('saveActiveRoutine failed', e)
  }
}

export async function saveRoutineProgressScan(params: {
  skinType: string
  conditions: { label: string; confidence: number }[]
}): Promise<boolean> { // true = first scan (new baseline), false = progress scan
  if (!auth || !db) return false
  const user = auth.currentUser
  if (!user) return false
  const ref = doc(db, 'users', user.uid)
  try {
    const snap = await getDocFromServer(ref) // bypass cache — always read fresh
    const data = snap.data()
    const routine = data?.activeRoutine
    console.log('[saveRoutineProgressScan] activeRoutine:', JSON.stringify(routine ? { hasBaseScan: !!routine.baseScan, hasLatest: !!routine.latestProgressScan } : null))
    if (!routine) {
      console.warn('[saveRoutineProgressScan] no activeRoutine found in doc')
      return false
    }
    const scanData = {
      skinType: params.skinType,
      conditions: params.conditions,
      savedAt: Date.now(), // plain number — reliable for comparison
    }
    const isFirstScan = !routine.baseScan
    const updates: Record<string, any> = {
      'activeRoutine.latestProgressScan': scanData,
    }
    if (isFirstScan) {
      updates['activeRoutine.baseScan'] = scanData
    }
    console.log('[saveRoutineProgressScan] isFirstScan:', isFirstScan, '— writing updates')
    await updateDoc(ref, updates) // single atomic write
    console.log('[saveRoutineProgressScan] write complete')
    return isFirstScan
  } catch (e) {
    console.warn('[saveRoutineProgressScan] FAILED:', e)
    return false
  }
}

export async function getActiveRoutine(): Promise<{
  productIndex: number
  product: { name: string; brand: string; type: string; category: string }
  routineTimes: string[]
  baseScan: { skinType: string; conditions: { label: string; confidence: number }[]; savedAt: number } | null
  latestProgressScan: { skinType: string; conditions: { label: string; confidence: number }[]; savedAt: number } | null
  startedAt: any
  lastCheckedAt: any
  noImprovementCount: number
} | null> {
  if (!auth || !db) return null
  const user = auth.currentUser
  if (!user) return null
  const ref = doc(db, 'users', user.uid)
  try {
    const snap = await getDoc(ref)
    if (!snap.exists()) return null
    return snap.data().activeRoutine || null
  } catch {
    return null
  }
}

export async function markRoutineChecked(noImprovement: boolean) {
  if (!auth || !db) return
  const user = auth.currentUser
  if (!user) return
  const ref = doc(db, 'users', user.uid)
  try {
    const snap = await getDoc(ref)
    const current = snap.data()?.activeRoutine || {}
    await updateDoc(ref, {
      'activeRoutine.lastCheckedAt': serverTimestamp(),
      'activeRoutine.noImprovementCount': noImprovement
        ? (current.noImprovementCount || 0) + 1
        : 0,
    })
  } catch (e) {
    console.warn('markRoutineChecked failed', e)
  }
}

export async function clearActiveRoutine() {
  if (!auth || !db) return
  const user = auth.currentUser
  if (!user) return
  const ref = doc(db, 'users', user.uid)
  try {
    await updateDoc(ref, { activeRoutine: null })
  } catch (e) {
    console.warn('clearActiveRoutine failed', e)
  }
}

export async function saveAllergyProfile(params: {
  allergens: string[]
  sensitivities: string[]
  customNotes: string
}) {
  if (!auth || !db) return
  const user = auth.currentUser
  if (!user) return
  const ref = doc(db, 'users', user.uid)
  try {
    await updateDoc(ref, {
      allergyProfile: {
        allergens: params.allergens,
        sensitivities: params.sensitivities,
        customNotes: params.customNotes,
        updatedAt: serverTimestamp(),
      },
    })
  } catch (e) {
    console.warn('saveAllergyProfile failed', e)
  }
}

export async function getAllergyProfile(): Promise<{
  allergens: string[]
  sensitivities: string[]
  customNotes: string
} | null> {
  if (!auth || !db) return null
  const user = auth.currentUser
  if (!user) return null
  const ref = doc(db, 'users', user.uid)
  try {
    const snap = await getDoc(ref)
    if (!snap.exists()) return null
    return snap.data().allergyProfile || null
  } catch {
    return null
  }
}

export async function saveScanResult(params: {
  skinType: string
  conditions: { label: string; confidence: number }[]
}) {
  if (!auth || !db) return
  const user = auth.currentUser
  if (!user) return
  const ref = doc(db, 'users', user.uid)
  try {
    await updateDoc(ref, {
      lastScan: {
        skinType: params.skinType,
        conditions: params.conditions,
        scannedAt: serverTimestamp(),
      },
    })
  } catch (e) {
    console.warn('saveScanResult failed', e)
  }
}

export async function getLastScanResult(): Promise<{
  skinType: string
  conditions: { label: string; confidence: number }[]
  scannedAt: any
} | null> {
  if (!auth || !db) return null
  const user = auth.currentUser
  if (!user) return null
  const ref = doc(db, 'users', user.uid)
  try {
    const snap = await getDoc(ref)
    if (!snap.exists()) return null
    return snap.data().lastScan || null
  } catch {
    return null
  }
}

export async function saveScanToHistory(params: {
  skinType: string
  conditions: { label: string; confidence: number }[]
}) {
  if (!auth || !db) return
  const user = auth.currentUser
  if (!user) return
  try {
    const col = collection(db, 'users', user.uid, 'scanHistory')
    await addDoc(col, {
      skinType: params.skinType,
      conditions: params.conditions,
      scannedAt: serverTimestamp(),
    })
  } catch (e) {
    console.warn('saveScanToHistory failed', e)
  }
}

export async function getScanHistory(): Promise<{
  id: string
  skinType: string
  conditions: { label: string; confidence: number }[]
  scannedAt: any
}[]> {
  if (!auth || !db) return []
  const user = auth.currentUser
  if (!user) return []
  try {
    const col = collection(db, 'users', user.uid, 'scanHistory')
    const q = query(col, orderBy('scannedAt', 'desc'))
    const snap = await getDocs(q)
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as any))
  } catch (e) {
    console.warn('getScanHistory failed', e)
    return []
  }
}
