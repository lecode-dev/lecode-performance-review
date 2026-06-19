'use client'

import { fmt } from '@/lib/domain'

interface SparklineProps {
  series: { label: string; score: number }[]
}

export function Sparkline({ series }: SparklineProps) {
  const W = 560, H = 150, pad = 28
  const xs = (i: number) => pad + (i * (W - pad * 2)) / Math.max(1, series.length - 1)
  const ys = (v: number) => H - pad - ((v - 1) / 4) * (H - pad * 2)
  const pts = series.map((d, i) => [xs(i), ys(d.score)] as const)
  const path = pts.map((p, i) => (i ? 'L' : 'M') + p[0] + ' ' + p[1]).join(' ')

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ overflow: 'visible' }}>
      {[1, 2, 3, 4, 5].map((g) => (
        <line key={g} x1={pad} x2={W - pad} y1={ys(g)} y2={ys(g)} stroke="var(--border)" strokeWidth="1" />
      ))}
      <path d={path} fill="none" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {pts.map((p, i) => (
        <g key={i}>
          <circle cx={p[0]} cy={p[1]} r={5} fill="var(--surface)" stroke="var(--accent)" strokeWidth="2.5" />
          <text x={p[0]} y={p[1] - 14} fontSize="12" fontFamily="var(--mono)" fontWeight="600" fill="var(--ink)" textAnchor="middle">
            {fmt(series[i].score)}
          </text>
          <text x={p[0]} y={H - 6} fontSize="11" fontFamily="var(--mono)" fill="var(--ink-3)" textAnchor="middle">
            {series[i].label}
          </text>
        </g>
      ))}
    </svg>
  )
}
