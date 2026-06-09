import { useLang } from '@/lib/i18n'
import { decisionFor } from '@/lib/domain'
import { Icon } from './Icon'
import { Badge } from './Badge'

export function DecisionBanner({ score, compact }: { score: number | null; compact?: boolean }) {
  const { t } = useLang()
  const d = decisionFor(score)
  if (!d) return null
  return (
    <div className={'decision dec-' + d.tier}>
      <Icon name={d.tier >= 4 ? 'award' : d.tier <= 2 ? 'warning' : 'trend'} size={compact ? 18 : 22} />
      <div className="col">
        <span className="dt">{t(d.short)}</span>
        {!compact && <span className="dd">{t(d.desc)}</span>}
      </div>
    </div>
  )
}

export function DecisionTag({ score }: { score: number | null }) {
  const { t } = useLang()
  const d = decisionFor(score)
  if (!d) return <Badge kind="pending">{t('aguardando')}</Badge>
  return (
    <span className={'score-chip tier-' + d.tier} style={{ fontSize: 11.5, minWidth: 0, padding: '3px 9px', fontWeight: 600 }}>
      {t(d.short)}
    </span>
  )
}
