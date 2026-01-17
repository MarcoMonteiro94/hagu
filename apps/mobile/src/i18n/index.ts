import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import * as Localization from 'expo-localization'

import ptBR from './locales/pt-BR.json'
import enUS from './locales/en-US.json'

const resources = {
  'pt-BR': { translation: ptBR },
  'en-US': { translation: enUS },
}

const deviceLocale = Localization.getLocales()[0]?.languageTag || 'pt-BR'
const supportedLocales = ['pt-BR', 'en-US']
const defaultLocale = supportedLocales.includes(deviceLocale) ? deviceLocale : 'pt-BR'

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
