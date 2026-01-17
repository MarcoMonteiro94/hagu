import 'react-native-url-polyfill/dist/polyfill'
import { createClient } from '@supabase/supabase-js'
import * as SecureStore from 'expo-secure-store'

const ExpoSecureStoreAdapter = {
  getItem: async (key: string): Promise<string | null> => {
    try {
      return await SecureStore.getItemAsync(key)
    } catch {
      return null
    }
  },
  setItem: async (key: string, value: string): Promise<void> => {
    try {
      await SecureStore.setItemAsync(key, value)
    } catch (error) {
      console.error('Error storing item:', error)
    }
  },
  removeItem: async (key: string): Promise<void> => {
    try {
      await SecureStore.deleteItemAsync(key)
    } catch (error) {
      console.error('Error removing item:', error)
    }
  },
}

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || ''

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: ExpoSecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})
