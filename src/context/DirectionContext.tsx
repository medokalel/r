import { createContext, useContext, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { getBrowserLanguage } from '@/i18n'

type Direction = 'ltr' | 'rtl'

type AppLanguage = 'ar' | 'en'

interface DirectionContextValue {
  dir: Direction
  lang: string
  setLanguage: (lang: AppLanguage) => void
  toggleLanguage: () => void
}

const initialLang = getBrowserLanguage()

const DirectionContext = createContext<DirectionContextValue>({
  dir: initialLang === 'ar' ? 'rtl' : 'ltr',
  lang: initialLang,
  setLanguage: () => {},
  toggleLanguage: () => {},
})

export function DirectionProvider({ children }: { children: React.ReactNode }) {
  const { i18n } = useTranslation()
  const [dir, setDir] = useState<Direction>(() =>
    i18n.language?.startsWith('ar') ? 'rtl' : 'ltr'
  )

  useEffect(() => {
    const newDir: Direction = i18n.language === 'ar' ? 'rtl' : 'ltr'
    setDir(newDir)
    document.documentElement.dir = newDir
    document.documentElement.lang = i18n.language
  }, [i18n.language])

  const setLanguage = (next: AppLanguage) => {
    if (i18n.language !== next) {
      i18n.changeLanguage(next)
    }
  }

  const toggleLanguage = () => {
    setLanguage(i18n.language === 'ar' ? 'en' : 'ar')
  }

  return (
    <DirectionContext.Provider value={{ dir, lang: i18n.language, setLanguage, toggleLanguage }}>
      {children}
    </DirectionContext.Provider>
  )
}

export const useDirection = () => useContext(DirectionContext)
