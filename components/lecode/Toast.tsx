'use client'

import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'
import { Icon } from './Icon'

interface ToastItem {
  id: number
  message: string
  tone: 'success' | 'info' | 'warn' | 'danger'
}

type ShowToast = (message: string, tone?: ToastItem['tone']) => void

const ToastContext = createContext<ShowToast>(() => {})

export function useToast() {
  return useContext(ToastContext)
}

let nextId = 0

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([])

  const show = useCallback<ShowToast>((message, tone = 'success') => {
    const id = ++nextId
    setItems((prev) => [...prev, { id, message, tone }])
    setTimeout(() => setItems((prev) => prev.filter((t) => t.id !== id)), 3000)
  }, [])

  return (
    <ToastContext.Provider value={show}>
      {children}
      {items.length > 0 && (
        <div className="toast-stack">
          {items.map((t) => (
            <div key={t.id} className={`toast toast-${t.tone}`}>
              <Icon name={t.tone === 'success' ? 'check' : t.tone === 'danger' ? 'warning' : 'info'} size={16} />
              <span>{t.message}</span>
            </div>
          ))}
        </div>
      )}
    </ToastContext.Provider>
  )
}
