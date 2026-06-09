'use client'

import { useEffect } from 'react'
import { useUiPrefs, applyUiPrefs } from '@/stores/useUiPrefs'
import { LANGS } from '@/lib/i18n'

/** Aplica data-theme/data-density/lang persistidos no <html> assim que o store reidrata. */
export function UiPrefsSync() {
  const theme = useUiPrefs((s) => s.theme)
  const density = useUiPrefs((s) => s.density)
  const lang = useUiPrefs((s) => s.lang)

  useEffect(() => {
    applyUiPrefs({ theme, density })
  }, [theme, density])

  useEffect(() => {
    document.documentElement.lang = LANGS.find((l) => l.code === lang)?.html ?? 'pt-BR'
  }, [lang])

  return null
}
