import { useLang } from '@/lib/i18n'
import { DIMENSIONS, fmt, tierOf } from '@/lib/domain'
import type { DimensionKey } from '@/lib/supabase/types'

interface DimensionBarsProps {
  dims: Record<DimensionKey, number> | null | undefined
  compact?: boolean
}

export function DimensionBars({ dims, compact }: DimensionBarsProps) {
  const { t } = useLang()

  if (!dims) {
    return <div className="muted" style={{ fontSize: 13, padding: '8px 0' }}>{t('Sem dados.')}</div>
  }

  return (
    <div>
      {DIMENSIONS.map((d) => {
        const v = dims[d.key]
        return (
          <div className="dimbar" key={d.key}>
            <span className="dl">{t(compact ? d.short : d.label)}</span>
            <span className="track">
              <span className={'fill fill-' + tierOf(v)} style={{ width: (v / 5) * 100 + '%' }} />
            </span>
            <span className="dv" style={{ color: `var(--s${tierOf(v)})` }}>{fmt(v)}</span>
          </div>
        )
      })}
    </div>
  )
}
