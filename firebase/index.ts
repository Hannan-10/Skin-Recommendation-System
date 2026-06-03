import { initializeApp, getApps, FirebaseApp } from 'firebase/app'
import { getAuth, Auth } from 'firebase/auth'
import { getFirestore, Firestore } from 'firebase/firestore'
import { getStorage, FirebaseStorage } from 'firebase/storage'
import Constants from 'expo-constants'

type FirebaseConfig = {
  apiKey?: string
  authDomain?: string
  projectId?: string
  storageBucket?: string
  messagingSenderId?: string
  appId?: string
  measurementId?: string
}

function resolveConfig(): FirebaseConfig | null {
  const extra = (Constants.expoConfig as any)?.extra?.firebase ?? (Constants.manifest as any)?.extra?.firebase ?? null
  if (extra && extra.apiKey) return extra as FirebaseConfig
  const cfg: FirebaseConfig = {
    apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
    measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID,
  }
  if (cfg.apiKey && cfg.appId) return cfg
  return null
}

let app: FirebaseApp | null = null
export function getFirebaseApp(): FirebaseApp | null {
  if (app) return app
  const cfg = resolveConfig()
  if (!cfg) {
    console.warn('Firebase config not found. Add values in app.json extra.firebase or EXPO_PUBLIC_* env.')
    return null
  }
  const apps = getApps()
  app = apps.length ? apps[0] : initializeApp(cfg)
  return app
}

export const firebaseApp = getFirebaseApp()
export const auth: Auth | undefined = firebaseApp ? getAuth(firebaseApp) : undefined
export const db: Firestore | undefined = firebaseApp ? getFirestore(firebaseApp) : undefined
export const storage: FirebaseStorage | undefined = firebaseApp ? getStorage(firebaseApp) : undefined

export function validateFirebaseConfig(): { ready: boolean; missing: string[]; config: FirebaseConfig | null } {
  const cfg = resolveConfig()
  const required = ['apiKey', 'authDomain', 'projectId', 'storageBucket', 'messagingSenderId', 'appId']
  const missing: string[] = []
  if (!cfg) {
    return { ready: false, missing: required, config: null }
  }
  for (const key of required) {
    if (!((cfg as any)[key])) missing.push(key)
  }
  return { ready: missing.length === 0, missing, config: cfg }
}
