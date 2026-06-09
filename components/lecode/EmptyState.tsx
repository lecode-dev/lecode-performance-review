import type { ReactNode } from 'react'
import { Icon } from './Icon'

interface EmptyStateProps {
  icon?: string
  title: ReactNode
  text?: ReactNode
}

export function EmptyState({ icon, title, text }: EmptyStateProps) {
  return (
    <div className="empty">
      <div className="ic"><Icon name={icon || 'info'} size={40} /></div>
      <div style={{ fontWeight: 600, color: 'var(--ink-2)' }}>{title}</div>
      {text && <div style={{ fontSize: 13, marginTop: 4 }}>{text}</div>}
    </div>
  )
}
