'use client'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type Lang = 'pt' | 'en' | 'es'

interface UiPrefsState {
  theme:       'light' | 'dark'
  density:     'comfortable' | 'compact'
  lang:        Lang
  toggleTheme: () => void
  setDensity:  (density: 'comfortable' | 'compact') => void
  setLang:     (lang: Lang) => void
}

export const useUiPrefs = create<UiPrefsState>()(
  persist(
    (set, get) => ({
      theme:       'dark',
      density:     'comfortable',
      lang:        'pt',
      toggleTheme: () => set({ theme: get().theme === 'light' ? 'dark' : 'light' }),
      setDensity:  (density) => set({ density }),
      setLang:     (lang) => set({ lang }),
    }),
    { name: 'lecode-ui-prefs' }
  )
)

/** Aplica os data-attributes no <html> — chamar num efeito no client root. */
export function applyUiPrefs({ theme, density }: Pick<UiPrefsState, 'theme' | 'density'>) {
  if (typeof document === 'undefined') return
  document.documentElement.setAttribute('data-theme', theme)
  document.documentElement.setAttribute('data-density', density === 'compact' ? 'compact' : 'regular')
}
