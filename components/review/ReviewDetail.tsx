'use client'

import { useLang } from '@/lib/i18n'
import { DIMENSIONS, OPEN_QUESTIONS, fmt, tierOf } from '@/lib/domain'
import { Icon } from '@/components/lecode/Icon'
import { ScoreChip } from '@/components/lecode/ScoreChip'
import { DecisionBanner } from '@/components/lecode/Decision'
import { Radar } from '@/components/lecode/Radar'
import type { CycleStatus, DimensionKey } from '@/lib/supabase/types'

interface ReviewDetailProps {
  cycleStatus: CycleStatus
  perspective: 'admin' | 'client' | 'contractor'
  selfAvg: number | null
  clientAvg: number | null
  finalScore: number | null
  selfDims: Record<DimensionKey, number> | null
  clientDims: Record<DimensionKey, number> | null
  selfDone: boolean
  clientDone: boolean
  selfOpen?: { strengths?: string; growth?: string; extra?: string } | null
  clientOpen?: { strengths?: string; growth?: string; extra?: string } | null
  clientName?: string
}

export function ReviewDetail({
  cycleStatus, perspective, selfAvg, clientAvg, finalScore,
  selfDims, clientDims, selfDone, clientDone, selfOpen, clientOpen, clientName,
}: ReviewDetailProps) {
  const { t } = useLang()
  const cycleClosed = cycleStatus === 'closed'

  let showSelf = true, showClient = true, blindReason: string | null = null
  if (perspective === 'client') {
    showSelf = cycleClosed
    if (!cycleClosed) blindReason = t('A auto-avaliação do contratado só fica visível após o encerramento do ciclo.')
  } else if (perspective === 'contractor') {
    showClient = cycleClosed
    if (!cycleClosed) blindReason = t('A avaliação do cliente só fica visível após o encerramento do ciclo, evitando viés na sua auto-avaliação.')
  }

  const bothVisible = showSelf && selfDone && showClient && clientDone

  return (
    <div className="col" style={{ gap: 18 }}>
      <div className="grid grid-3">
        <div className="card stat">
          <div className="label"><Icon name="users" size={15} />{t('Self review')} <span className="mono muted">30%</span></div>
          <div className="value">{showSelf ? <ScoreChip value={selfDone ? selfAvg : null} lg /> : <Icon name="lock" size={22} />}</div>
          <div className="muted" style={{ fontSize: 12, marginTop: 6 }}>
            {!selfDone ? t('Pendente') : showSelf ? t('Concluída') : t('Oculta até o encerramento')}
          </div>
        </div>
        <div className="card stat">
          <div className="label"><Icon name="building" size={15} />{t('Review cliente')} <span className="mono muted">70%</span></div>
          <div className="value">{showClient ? <ScoreChip value={clientDone ? clientAvg : null} lg /> : <Icon name="lock" size={22} />}</div>
          <div className="muted" style={{ fontSize: 12, marginTop: 6 }}>
            {!clientDone ? t('Pendente') : showClient ? t('Concluída') : t('Oculta até o encerramento')}
          </div>
        </div>
        <div className="card stat" style={{ outline: finalScore != null ? '2px solid var(--accent-soft)' : 'none' }}>
          <div className="label"><Icon name="award" size={15} />{t('Score final')}</div>
          <div className="value">
            {(perspective !== 'admin' && !cycleClosed) ? <span className="muted">—</span> : <ScoreChip value={finalScore} lg />}
          </div>
          <div className="muted mono" style={{ fontSize: 11.5, marginTop: 6 }}>{t('self·0.30 + cliente·0.70')}</div>
        </div>
      </div>

      {perspective === 'admin' && finalScore != null && <DecisionBanner score={finalScore} />}
      {blindReason && <div className="callout"><Icon name="lock" />{blindReason}</div>}

      <div className={'l-split s320' + (bothVisible ? '' : ' l-split-single')}>
        <div className="card">
          <div className="card-head"><Icon name="dashboard" size={16} /><h3>{t('Notas por dimensão')}</h3></div>
          <div className="card-pad">
            {DIMENSIONS.map((d) => {
              const sv = showSelf && selfDone && selfDims ? selfDims[d.key] : null
              const cv = showClient && clientDone && clientDims ? clientDims[d.key] : null
              return (
                <div key={d.key} style={{ padding: '9px 0', borderBottom: '1px solid var(--border)' }}>
                  <div className="between" style={{ marginBottom: 7 }}>
                    <span style={{ fontSize: 13, fontWeight: 500 }}>{t(d.label)}</span>
                    <div className="row" style={{ gap: 8 }}>
                      {sv != null && (
                        <span className="badge" title="Self">
                          <span className="lg-dot" style={{ background: 'var(--s2)', width: 7, height: 7 }} />{fmt(sv)}
                        </span>
                      )}
                      {cv != null && (
                        <span className="badge" title="Cliente">
                          <span className="lg-dot" style={{ background: 'var(--accent)', width: 7, height: 7 }} />{fmt(cv)}
                        </span>
                      )}
                    </div>
                  </div>
                  <div style={{ position: 'relative', height: 8, borderRadius: 6, background: 'var(--surface-3)' }}>
                    {cv != null && (
                      <div style={{
                        position: 'absolute', inset: 0, width: (cv / 5 * 100) + '%',
                        background: 'var(--accent)', borderRadius: 6, opacity: 0.9,
                      }} />
                    )}
                    {sv != null && (
                      <div style={{
                        position: 'absolute', top: -2, height: 12, width: 2,
                        left: `calc(${sv / 5 * 100}% - 1px)`,
                        background: 'var(--s2)', borderRadius: 2,
                      }} title="Self" />
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
        {bothVisible && selfDims && clientDims && (
          <div className="card card-pad">
            <Radar self={selfDims} client={clientDims} />
          </div>
        )}
      </div>

      {(showSelf || showClient) && (
        <div className="grid grid-2">
          {showSelf && selfDone && (
            <OpenCard title={t('Auto-avaliação')} icon="users" open={selfOpen} dotColor="var(--s2)" />
          )}
          {showClient && clientDone && (
            <OpenCard title={`${t('Cliente')}${clientName ? ` · ${clientName}` : ''}`} icon="building" open={clientOpen} dotColor="var(--accent)" />
          )}
        </div>
      )}
    </div>
  )
}

function OpenCard({ title, icon, open, dotColor }: {
  title: string; icon: string; open?: { strengths?: string; growth?: string; extra?: string } | null; dotColor: string
}) {
  const { t } = useLang()
  const has = open && Object.values(open).some((v) => v && v.trim())
  return (
    <div className="card">
      <div className="card-head">
        <span className="lg-dot" style={{ background: dotColor, width: 9, height: 9 }} />
        <h3>{title}</h3>
      </div>
      <div className="card-pad col" style={{ gap: 14 }}>
        {!has && <div className="muted" style={{ fontSize: 13 }}>{t('Sem comentários abertos neste ciclo.')}</div>}
        {OPEN_QUESTIONS.map((o) => open && open[o.key] ? (
          <div key={o.key}>
            <div className="mono" style={{ fontSize: 11, color: 'var(--ink-3)', marginBottom: 3 }}>{t(o.label)}</div>
            <div style={{ fontSize: 13.5, lineHeight: 1.5 }}>{open[o.key]}</div>
          </div>
        ) : null)}
      </div>
    </div>
  )
}
