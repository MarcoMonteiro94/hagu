import 'react-native-url-polyfill/auto'
import { createClient } from '@supabase/supabase-js'
import * as SecureStore from 'expo-secure-store'
import { Platform } from 'react-native'

// Web storage adapter using localStorage
const WebStorageAdapter = {
  getItem: async (key: string): Promise<string | null> => {
    if (typeof window === 'undefined') return null
    return window.localStorage.getItem(key)
  },
  setItem: async (key: string, value: string): Promise<void> => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(key, value)
  },
  removeItem: async (key: string): Promise<void> => {
    if (typeof window === 'undefined') return
    window.localStorage.removeItem(key)
  },
}

// Native storage adapter using SecureStore
const NativeStorageAdapter = {
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

// Use appropriate adapter based on platform
const StorageAdapter = Platform.OS === 'web' ? WebStorageAdapter : NativeStorageAdapter

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || ''

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: StorageAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: Platform.OS === 'web',
  },
})
