import type { ReactNode } from 'react'
import { Icon } from './Icon'

interface StatProps {
  label: ReactNode
  icon?: string
  value: ReactNode
  unit?: ReactNode
  delta?: ReactNode
  deltaDir?: string
}

export function Stat({ label, icon, value, unit, delta, deltaDir }: StatProps) {
  return (
    <div className="card stat">
      <div className="label">{icon && <Icon name={icon} size={15} />}{label}</div>
      <div className="value">{value}{unit && <small> {unit}</small>}</div>
      {delta && <div className={'delta ' + (deltaDir || '')}>{delta}</div>}
    </div>
  )
}

export function Progress({ pct }: { pct: number }) {
  return (
    <div className="progress">
      <span style={{ width: pct + '%' }} />
    </div>
  )
}
