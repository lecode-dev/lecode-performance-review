'use client'

import Link from 'next/link'
import { useLang } from '@/lib/i18n'
import { midMonth } from '@/lib/domain'
import { Icon } from '@/components/lecode/Icon'
import { ScoreChip } from '@/components/lecode/ScoreChip'
import { CycleBadge } from '@/components/lecode/Cycle'
import { Sparkline } from '@/components/lecode/Sparkline'
import { EmptyState } from '@/components/lecode/EmptyState'
import { PersonRow } from '@/components/lecode/Avatar'
import type { Database } from '@/lib/supabase/types'

type Cycle = Database['public']['Tables']['cycles']['Row']

interface ContractorHomeViewProps {
  name: string
  role: string
  clientName: string | null
  cycle: Cycle | null
  selfDone: boolean
  series: { label: string; score: number }[]
  lastScore: number | null
  lastCycleName: string | null
}

function fmtBR(iso: string): string {
  const [, m, d] = iso.slice(0, 10).split('-')
  return `${d}/${m}`
}

export function ContractorHomeView({
  name, role, clientName, cycle, selfDone, series, lastScore, lastCycleName,
}: ContractorHomeViewProps) {
  const { t } = useLang()
  const firstName = name.split(' ')[0]
  const submitEnd = cycle ? midMonth(cycle.opens_at) : null

  return (
    <div className="content anim-in">
      <div className="page-head">
        <div className="eyebrow">{role}{clientName ? ` · ${clientName}` : ''}</div>
        <h2>{t('Olá')}, {firstName}</h2>
        <p>{t('Acompanhe seus ciclos de avaliação e seu desenvolvimento ao longo do tempo na LeCode.')}</p>
      </div>

      {cycle ? (
        <div className="card card-pad" style={{
          marginBottom: 18,
          borderColor: selfDone ? 'var(--border)' : 'color-mix(in oklab, var(--accent) 35%, var(--border))',
        }}>
          <div className="between" style={{ alignItems: 'center', flexWrap: 'wrap', gap: 14 }}>
            <div className="row" style={{ gap: 14, flex: '1 1 200px', minWidth: 0 }}>
              <span style={{
                width: 46, height: 46, borderRadius: 12,
                background: selfDone ? 'var(--s5-soft)' : 'var(--accent-soft)',
                color: selfDone ? 'var(--s5)' : 'var(--accent-ink)',
                display: 'grid', placeItems: 'center', flexShrink: 0,
              }}>
                <Icon name={selfDone ? 'check' : 'form'} size={22} />
              </span>
              <div className="col" style={{ minWidth: 0 }}>
                <div className="row" style={{ gap: 10, flexWrap: 'wrap' }}>
                  <span style={{ fontWeight: 600, fontSize: 15 }}>{t('Auto-avaliação')} · {cycle.name}</span>
                  <CycleBadge status="open" />
                </div>
                <span className="muted" style={{ fontSize: 13 }}>
                  {selfDone
                    ? t('Você concluiu sua auto-avaliação. Pode revisá-la até o fim do ciclo.')
                    : `${t('Janela aberta até')} ${fmtBR(submitEnd ?? cycle.closes_at)}. ${t('Sua nota tem peso de 30% no score final.')}`}
                </span>
              </div>
            </div>
            <Link href="/contractor/self-review" className={'btn ' + (selfDone ? '' : 'btn-primary')} style={{ flexShrink: 0 }}>
              {selfDone ? <><Icon name="edit" size={16} />{t('Revisar')}</> : <><Icon name="star" size={16} />{t('Fazer auto-avaliação')}</>}
            </Link>
          </div>
        </div>
      ) : (
        <div className="callout" style={{ marginBottom: 18 }}>
          <Icon name="info" />{t('Nenhum ciclo de avaliação em andamento no momento.')}
        </div>
      )}

      <div className="l-split s320">
        <div className="card">
          <div className="card-head">
            <Icon name="trend" size={16} />
            <h3>{t('Minha evolução')}</h3>
            <span className="sub" style={{ marginLeft: 'auto' }}>{t('score final por ciclo')}</span>
          </div>
          <div className="card-pad">
            {series.length > 0
              ? <Sparkline series={series} />
              : <EmptyState icon="trend" title={t('Sem histórico ainda')} text={t('Seus scores aparecerão aqui após o primeiro ciclo encerrado.')} />
            }
          </div>
        </div>
        <div className="col" style={{ gap: 16 }}>
          <div className="card stat">
            <div className="label"><Icon name="award" size={15} />{t('Último score')}{lastCycleName ? ` · ${lastCycleName}` : ''}</div>
            <div className="value"><ScoreChip value={lastScore} lg /></div>
          </div>
          <div className="card card-pad">
            <div className="muted" style={{ fontSize: 12, marginBottom: 8 }}>{t('Alocação atual')}</div>
            {clientName
              ? <PersonRow person={{ name: clientName }} />
              : <span className="badge badge-pending">{t('sem alocação')}</span>
            }
          </div>
        </div>
      </div>
    </div>
  )
}
