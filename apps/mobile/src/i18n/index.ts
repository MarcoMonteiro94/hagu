import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import * as Localization from 'expo-localization'
import { Platform } from 'react-native'

import ptBR from './locales/pt-BR.json'
import enUS from './locales/en-US.json'

const resources = {
  'pt-BR': { translation: ptBR },
  'en-US': { translation: enUS },
}

const supportedLocales = ['pt-BR', 'en-US']

function getDeviceLocale(): string {
  try {
    // On web, try navigator.language first
    if (Platform.OS === 'web' && typeof navigator !== 'undefined') {
      const browserLocale = navigator.language || 'pt-BR'
      if (supportedLocales.includes(browserLocale)) return browserLocale
      // Check for partial match (e.g., 'pt' matches 'pt-BR')
      const partial = supportedLocales.find((l) => l.startsWith(browserLocale.split('-')[0]))
      if (partial) return partial
    }
    // Fall back to expo-localization
    const locales = Localization.getLocales()
    const deviceLocale = locales?.[0]?.languageTag || 'pt-BR'
    if (supportedLocales.includes(deviceLocale)) return deviceLocale
    // Check for partial match
    const partial = supportedLocales.find((l) => l.startsWith(deviceLocale.split('-')[0]))
    if (partial) return partial
  } catch {
    // Silently fall back to default
  }
  return 'pt-BR'
}

const defaultLocale = getDeviceLocale()

i18n.use(initReactI18next).init({
  resources,
  lng: defaultLocale,
  fallbackLng: 'pt-BR',
  interpolation: {
    escapeValue: false,
  },
  react: {
    useSuspense: false,
  },
})

export default i18n
