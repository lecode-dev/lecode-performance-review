import { useLang } from '@/lib/i18n'
import { cyclePhase, midMonth, type CyclePhase } from '@/lib/domain'
import type { CycleStatus } from '@/lib/supabase/types'
import { Icon } from './Icon'
import { Badge } from './Badge'

interface CycleLike {
  status: CycleStatus
  opens_at: string
  closes_at: string
}

export function CycleBadge({ status }: { status: CycleStatus }) {
  const { t } = useLang()
  const map: Record<string, [string, string]> = {
    open: ['open', 'Em andamento'],
    closed: ['closed', 'Encerrado'],
  }
  const [k, l] = map[status] ?? ['', status]
  return <Badge kind={k} dot>{t(l)}</Badge>
}

const PHASE_STYLE: Record<Exclude<CyclePhase, 'closed'>, { cls: string; label: string; icon: string }> = {
  submission: { cls: 'badge-open', label: 'Envio', icon: 'form' },
  apuracao:   { cls: 'badge-scheduled', label: 'Apuração', icon: 'trend' },
}

/** Pílula de fase: onde o ciclo está agora (envio / apuração / encerrado). */
export function PhaseBadge({ cycle }: { cycle: CycleLike }) {
  const { t } = useLang()
  const phase = cyclePhase(cycle)
  if (phase === 'closed') return null
  const { cls, label, icon } = PHASE_STYLE[phase]
  return <span className={'badge ' + cls}><Icon name={icon} size={12} />{t(label)}</span>
}

function fmtD(iso: string | null | undefined): string {
  if (!iso) return '—'
  const [y, m, d] = iso.slice(0, 10).split('-')
  return `${d}/${m}`
}

/** Linha do tempo de 2 fases: envio (dia 1→15) e apuração/discussão (15→fim do mês). */
export function CyclePhases({ cycle, compact }: { cycle: CycleLike; compact?: boolean }) {
  const { t } = useLang()
  const phase = cyclePhase(cycle)
  const submitEnd = midMonth(cycle.opens_at)

  const seg = (active: boolean, done: boolean, icon: string, label: string, range: string) => (
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ height: 6, borderRadius: 4, background: active ? 'var(--accent)' : done ? 'color-mix(in oklab, var(--accent) 45%, var(--surface-3))' : 'var(--surface-3)' }} />
      <div className="row" style={{ gap: 6, marginTop: 7, alignItems: 'center' }}>
        <Icon name={icon} size={13} className={active ? '' : 'muted'} style={active ? { color: 'var(--accent-ink)' } : undefined} />
        <span style={{ fontSize: 12, fontWeight: active ? 600 : 500, color: active ? 'var(--ink)' : 'var(--ink-3)' }}>{label}</span>
        {!compact && <span className="mono muted" style={{ fontSize: 11, marginLeft: 'auto' }}>{range}</span>}
      </div>
    </div>
  )

  return (
    <div className="row" style={{ gap: 12, alignItems: 'stretch' }}>
      {seg(phase === 'submission', phase === 'apuracao' || phase === 'closed', 'form', t('Envio'), `${fmtD(cycle.opens_at)}–${fmtD(submitEnd)}`)}
      {seg(phase === 'apuracao', phase === 'closed', 'trend', t('Apuração'), `${fmtD(submitEnd)}–${fmtD(cycle.closes_at)}`)}
    </div>
  )
}
