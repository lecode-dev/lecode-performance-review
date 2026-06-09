// =============================================================================
// stores/uiPrefs.ts · Zustand — preferências de UI (idioma, tema, densidade).
// Persistem em localStorage. Espelha o comportamento do protótipo.
// =============================================================================

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Lang = 'pt' | 'en' | 'es';
export type Theme = 'light' | 'dark';
export type Density = 'compact' | 'regular' | 'comfy';

interface UiPrefs {
  lang: Lang;
  theme: Theme;
  density: Density;
  setLang: (l: Lang) => void;
  toggleTheme: () => void;
  setTheme: (t: Theme) => void;
  setDensity: (d: Density) => void;
}

export const useUiPrefs = create<UiPrefs>()(
  persist(
    (set) => ({
      lang: 'pt',
      theme: 'dark',
      density: 'regular',
      setLang: (lang) => set({ lang }),
      toggleTheme: () => set((s) => ({ theme: s.theme === 'dark' ? 'light' : 'dark' })),
      setTheme: (theme) => set({ theme }),
      setDensity: (density) => set({ density }),
    }),
    { name: 'lecode-ui-prefs' },
  ),
);

/** Aplica os data-attributes no <html> (chamar num efeito no layout do cliente). */
export function applyUiPrefs({ theme, density }: Pick<UiPrefs, 'theme' | 'density'>) {
  if (typeof document === 'undefined') return;
  document.documentElement.setAttribute('data-theme', theme);
  document.documentElement.setAttribute('data-density', density);
}
