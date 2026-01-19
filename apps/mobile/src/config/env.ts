import Constants from 'expo-constants'

// Get env vars from expo-constants or process.env
const getEnvVar = (key: string): string => {
  // Try expo-constants first (works in builds)
  const fromConstants = Constants.expoConfig?.extra?.[key]
  if (fromConstants) return fromConstants

  // Try process.env (works in development)
  const fromProcessEnv = process.env[key]
  if (fromProcessEnv) return fromProcessEnv

  // Log missing env var
  console.warn(`Environment variable ${key} is not set`)
  return ''
}

export const ENV = {
  SUPABASE_URL: getEnvVar('EXPO_PUBLIC_SUPABASE_URL'),
  SUPABASE_ANON_KEY: getEnvVar('EXPO_PUBLIC_SUPABASE_ANON_KEY'),
}

// Validate on initialization
if (!ENV.SUPABASE_URL || !ENV.SUPABASE_ANON_KEY) {
  console.error('❌ Missing Supabase configuration:')
  console.error('   SUPABASE_URL:', ENV.SUPABASE_URL ? '✓ Set' : '✗ Missing')
  console.error('   SUPABASE_ANON_KEY:', ENV.SUPABASE_ANON_KEY ? '✓ Set' : '✗ Missing')
  console.error('   Check your eas.json configuration')
}
