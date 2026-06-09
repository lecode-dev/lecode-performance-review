'use client'

import { useState } from 'react'
import { useLang, LANGS } from '@/lib/i18n'

export function LangToggle() {
  const { lang, setLang, t } = useLang()
  const [open, setOpen] = useState(false)
  const cur = LANGS.find((l) => l.code === lang) ?? LANGS[0]

  return (
    <div className="ui-menu-wrap">
      <button className="icon-pill" onClick={() => setOpen((o) => !o)} title={t('Idioma')} aria-expanded={open}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="9" />
          <path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" />
        </svg>
        <span className="ip-code">{cur.short}</span>
      </button>
      {open && (
        <>
          <div className="ui-menu-backdrop" onClick={() => setOpen(false)} />
          <div className="ui-menu" role="listbox">
            {LANGS.map((l) => (
              <button
                key={l.code}
                role="option"
                aria-selected={lang === l.code}
                className={'ui-menu-item' + (lang === l.code ? ' sel' : '')}
                onClick={() => { setLang(l.code); setOpen(false) }}
              >
                <span className="umi-name">{l.name}</span>
                <span className="umi-code">{l.short}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
