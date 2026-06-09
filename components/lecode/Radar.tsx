import { useLang } from '@/lib/i18n'
import { DIMENSIONS } from '@/lib/domain'
import type { DimensionKey } from '@/lib/supabase/types'

type Dims = Record<DimensionKey, number>

interface RadarProps {
  self?: Dims | null
  client?: Dims | null
  size?: number
}

export function Radar({ self, client, size = 260 }: RadarProps) {
  const { t } = useLang()
  const cx = size / 2
  const cy = size / 2
  const R = size / 2 - 38
  const axes = DIMENSIONS
  const N = axes.length
  const ang = (i: number) => (Math.PI * 2 * i) / N - Math.PI / 2
  const pt = (i: number, r: number): [number, number] => [cx + Math.cos(ang(i)) * r, cy + Math.sin(ang(i)) * r]
  const polygon = (dims?: Dims | null) => (dims ? axes.map((a, i) => pt(i, (dims[a.key] / 5) * R).join(',')).join(' ') : '')
  const rings = [1, 2, 3, 4, 5]

  return (
    <div style={{ display: 'grid', placeItems: 'center' }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {rings.map((r) => (
          <polygon
            key={r}
            points={axes.map((a, i) => pt(i, (r / 5) * R).join(',')).join(' ')}
            fill="none"
            stroke="var(--border)"
            strokeWidth="1"
          />
        ))}
        {axes.map((a, i) => {
          const [x, y] = pt(i, R)
          return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="var(--border)" strokeWidth="1" />
        })}
        {client && (
          <polygon points={polygon(client)} fill="color-mix(in oklab, var(--accent) 18%, transparent)" stroke="var(--accent)" strokeWidth="2" />
        )}
        {self && (
          <polygon points={polygon(self)} fill="color-mix(in oklab, var(--s3) 16%, transparent)" stroke="var(--s2)" strokeWidth="2" strokeDasharray="4 3" />
        )}
        {axes.map((a, i) => {
          const [x, y] = pt(i, R + 18)
          return (
            <text key={i} x={x} y={y} fontSize="10.5" fontFamily="var(--mono)" fill="var(--ink-3)" textAnchor="middle" dominantBaseline="middle">
              {t(a.short)}
            </text>
          )
        })}
      </svg>
      <div className="radar-legend">
        {client && <span><span className="lg-dot" style={{ background: 'var(--accent)' }} />{t('Cliente (70%)')}</span>}
        {self && <span><span className="lg-dot" style={{ background: 'var(--s2)' }} />{t('Self (30%)')}</span>}
      </div>
    </div>
  )
}
