import { fmt, tierOf } from '@/lib/domain'
import { CountUp } from './CountUp'

export function ScoreChip({ value, lg = false }: { value: number | null; lg?: boolean }) {
  if (value == null) {
    return (
      <span className="score-chip" style={{ color: 'var(--ink-3)', background: 'var(--surface-3)' }}>
        —
      </span>
    )
  }
  return (
    <span className={`score-chip tier-${tierOf(value)} ${lg ? 'lg' : ''}`}>
      {lg ? <CountUp end={value} decimals={2} /> : fmt(value)}
    </span>
  )
}
