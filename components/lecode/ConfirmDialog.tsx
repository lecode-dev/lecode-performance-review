'use client'

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { useLang } from '@/lib/i18n'
import { Icon } from './Icon'

export type ConfirmTone = 'primary' | 'danger' | 'warn'

export interface ConfirmOptions {
  title: ReactNode
  message: ReactNode
  detail?: ReactNode
  confirmLabel?: string
  cancelLabel?: string
  tone?: ConfirmTone
  icon?: string
  challenge?: string  // se fornecido, usuário deve digitar esse texto para confirmar
}

type ConfirmFn = (opts: ConfirmOptions) => Promise<boolean>

const ConfirmContext = createContext<ConfirmFn>(() => Promise.resolve(false))

export function useConfirm() {
  return useContext(ConfirmContext)
}

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [cfg, setCfg] = useState<ConfirmOptions | null>(null)
  const resolver = useRef<((v: boolean) => void) | null>(null)

  const confirm = useCallback<ConfirmFn>((opts) => new Promise((resolve) => {
    resolver.current = resolve
    setCfg(opts)
  }), [])

  const settle = (val: boolean) => {
    setCfg(null)
    if (resolver.current) { resolver.current(val); resolver.current = null }
  }

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {cfg && <ConfirmDialog {...cfg} onConfirm={() => settle(true)} onCancel={() => settle(false)} />}
    </ConfirmContext.Provider>
  )
}

interface ConfirmDialogProps extends ConfirmOptions {
  onConfirm: () => void
  onCancel: () => void
}

function ConfirmDialog({ title, message, detail, confirmLabel, cancelLabel, tone = 'primary', icon, challenge, onConfirm, onCancel }: ConfirmDialogProps) {
  const { t } = useLang()
  const [input, setInput] = useState('')
  const canConfirm = !challenge || input === challenge

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel()
      if (e.key === 'Enter' && canConfirm) onConfirm()
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [onConfirm, onCancel, canConfirm])

  const ic = icon || (tone === 'danger' ? 'warning' : 'info')

  return (
    <div className="overlay" onClick={onCancel}>
      <div className="modal confirm" onClick={(e) => e.stopPropagation()} role="alertdialog" aria-modal="true">
        <div className="confirm-head">
          <span className={'confirm-ic ' + tone}><Icon name={ic} size={21} /></span>
          <h3>{title}</h3>
        </div>
        <div className="confirm-body">
          <p>{message}</p>
          {detail && <div className="confirm-detail">{detail}</div>}
          {challenge && (
            <div className="field" style={{ marginTop: 14 }}>
              <label style={{ fontSize: 12.5 }}>
                {t('Digite')} <span style={{ fontFamily: 'var(--mono)', fontWeight: 600 }}>{challenge}</span> {t('para confirmar')}
              </label>
              <input
                className="input"
                autoFocus
                autoComplete="off"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                style={{ marginTop: 6 }}
              />
            </div>
          )}
        </div>
        <div className="modal-foot">
          <button className="btn" onClick={onCancel}>{cancelLabel || t('Cancelar')}</button>
          <button
            className={'btn ' + (tone === 'danger' ? 'btn-danger-solid' : 'btn-primary')}
            onClick={onConfirm}
            disabled={!canConfirm}
            autoFocus={!challenge}
          >
            {confirmLabel || t('Confirmar')}
          </button>
        </div>
      </div>
    </div>
  )
}
