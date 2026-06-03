import fs from 'fs'
import path from 'path'

function parseDotEnv(filePath: string): Record<string, string> {
  try {
    const raw = fs.readFileSync(filePath, 'utf8')
    const lines = raw.split(/\r?\n/)
    const out: Record<string, string> = {}
    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue
      const eq = trimmed.indexOf('=')
      if (eq === -1) continue
      const key = trimmed.slice(0, eq).trim()
      let val = trimmed.slice(eq + 1).trim()
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1)
      }
      out[key] = val
    }
    return out
  } catch {
    return {}
  }
}

export default () => {
  const envPath = path.resolve(__dirname, '.env')
  const env = parseDotEnv(envPath)
  for (const [k, v] of Object.entries(env)) {
    if (process.env[k] === undefined) process.env[k] = v
  }

  let base: any = {}
  try {
    base = require('./app.json')
  } catch {
    base = { expo: { name: 'SkinCondition', slug: 'skincondition' } }
  }

  const extra = (base.expo?.extra ?? {})
  extra.firebase = {
    apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
    measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID,
  }

  return {
    ...base.expo,
    extra,
  }
}
