'use client'

import { createContext, useContext, useEffect, useState } from 'react'

export type Language = 'en' | 'hi' | 'mr'

const languageLabels: Record<Language, string> = { en: 'EN', hi: 'हिं', mr: 'मर' }

const LanguageContext = createContext<{ language: Language; setLanguage: (language: Language) => void; labels: typeof languageLabels } | null>(null)

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en')
  const setLanguage = (nextLanguage: Language) => {
    setLanguageState(nextLanguage)
    document.cookie = `krishi-language=${nextLanguage}; path=/; max-age=31536000; samesite=lax`
    window.localStorage.setItem('krishi-language', nextLanguage)
  }
  useEffect(() => {
    const savedCookie = document.cookie.match(/(?:^|; )krishi-language=(en|hi|mr)/)?.[1] as Language | undefined
    const savedLocal = window.localStorage.getItem('krishi-language') as Language | null
    const saved = savedCookie ?? savedLocal
    if (saved === 'en' || saved === 'hi' || saved === 'mr') setLanguageState(saved)
  }, [])
  return <LanguageContext.Provider value={{ language, setLanguage, labels: languageLabels }}>{children}</LanguageContext.Provider>
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) throw new Error('useLanguage must be used inside LanguageProvider')
  return context
}

export { languageLabels }
