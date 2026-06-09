import type { ReactNode } from 'react'

interface BadgeProps {
  children: ReactNode
  kind?: string
  className?: string
  dot?: boolean
}

export function Badge({ children, kind = '', className = '', dot = false }: BadgeProps) {
  return (
    <span className={`badge ${kind ? 'badge-' + kind : ''} ${dot ? 'dot' : ''} ${className}`}>
      {children}
    </span>
  )
}
