import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import { toEnglishDigits } from '@/lib/englishDigits'
import en from './locales/en.json'
import ar from './locales/ar.json'

export function getBrowserLanguage(): 'en' | 'ar' {
  if (typeof navigator === 'undefined') return 'en'
  return navigator.language.toLowerCase().startsWith('ar') ? 'ar' : 'en'
}

const englishDigitsPostProcessor = {
  type: 'postProcessor' as const,
  name: 'englishDigits',
  process(value: unknown, _key: string, _options: unknown, translator: { language?: string }) {
    if (!translator.language?.startsWith('ar')) return value
    if (typeof value !== 'string') return value
    return toEnglishDigits(value)
  },
}

i18n
  .use(LanguageDetector)
  .use(englishDigitsPostProcessor)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      ar: { translation: ar },
    },
    fallbackLng: getBrowserLanguage(),
    supportedLngs: ['en', 'ar'],
    nonExplicitSupportedLngs: true,
    interpolation: { escapeValue: false },
    postProcess: ['englishDigits'],
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'icasco-lang',
    },
  })

export default i18n
