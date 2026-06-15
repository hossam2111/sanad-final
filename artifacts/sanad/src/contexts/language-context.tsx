"use client"

import React, { createContext, useContext, useEffect, useMemo, useState } from "react"

export type Locale = "ar" | "en"

type LanguageContextValue = {
  locale: Locale
  dir: "rtl" | "ltr"
  setLocale: (locale: Locale) => void
  toggleLocale: () => void
  text: (english: string, arabic: string) => string
}

const LANGUAGE_KEY = "sanad_locale"

const LanguageContext = createContext<LanguageContextValue>({
  locale: "ar",
  dir: "rtl",
  setLocale: () => {},
  toggleLocale: () => {},
  text: (_english, arabic) => arabic,
})

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  // Always start from the SSR default ("ar") so server and client markup match;
  // the stored preference is adopted after mount. Reading localStorage in the
  // initializer caused a hydration mismatch for every stored-"en" visitor.
  const [locale, setLocaleState] = useState<Locale>("ar")
  const dir = locale === "ar" ? "rtl" : "ltr"

  useEffect(() => {
    if (localStorage.getItem(LANGUAGE_KEY) === "en") setLocaleState("en")
  }, [])

  const setLocale = (nextLocale: Locale) => {
    setLocaleState(nextLocale)
    localStorage.setItem(LANGUAGE_KEY, nextLocale)
  }

  useEffect(() => {
    document.documentElement.lang = locale
    document.documentElement.dir = dir
  }, [dir, locale])

  const value = useMemo<LanguageContextValue>(
    () => ({
      locale,
      dir,
      setLocale,
      toggleLocale: () => setLocale(locale === "ar" ? "en" : "ar"),
      text: (english, arabic) => (locale === "ar" ? arabic : english),
    }),
    [locale],
  )

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

export function useLanguage() {
  return useContext(LanguageContext)
}
