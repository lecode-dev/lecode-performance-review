'use client'

import { useEffect, type ReactNode } from 'react'
import { Icon } from './Icon'

interface ModalProps {
  title: ReactNode
  children: ReactNode
  onClose: () => void
  footer?: ReactNode
  wide?: boolean
}

export function Modal({ title, children, onClose, footer, wide }: ModalProps) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [onClose])

  return (
    <div className="overlay" onClick={onClose}>
      <div className={'modal ' + (wide ? 'wide' : '')} onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h3>{title}</h3>
          <button className="icon-btn" onClick={onClose}><Icon name="x" /></button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-foot">{footer}</div>}
      </div>
    </div>
  )
}
