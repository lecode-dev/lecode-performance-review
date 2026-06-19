'use client'

import Link from 'next/link'
import { useLang } from '@/lib/i18n'
import { Icon } from '@/components/lecode/Icon'
import { PersonRow } from '@/components/lecode/Avatar'
import { Badge } from '@/components/lecode/Badge'
import { CycleBadge, PhaseBadge } from '@/components/lecode/Cycle'
import type { Database } from '@/lib/supabase/types'

type Cycle = Database['public']['Tables']['cycles']['Row']

interface TeamMember {
  id: string
  name: string
  email: string
  seniority: string
  track: string
  myStatus: string
  selfStatus: string
  myScore: string | null
}

interface ClientTeamViewProps {
  clientName: string
  clientIndustry: string | null
  cycle: Cycle | null
  submitEnd: string | null
  team: TeamMember[]
  myDoneCount: number
}

function fmtBR(iso: string): string {
  const [, m, d] = iso.slice(0, 10).split('-')
  return `${d}/${m}`
}

export function ClientTeamView({ clientName, clientIndustry, cycle, submitEnd, team, myDoneCount }: ClientTeamViewProps) {
  const { t } = useLang()

  return (
    <div className="content anim-in">
      <div className="page-head">
        <div className="eyebrow">{clientName}{clientIndustry ? ` · ${clientIndustry}` : ''}</div>
        <h2>{t('Minha equipe')}</h2>
        <p>{t('Contratados da LeCode alocados na')} {clientName}. {cycle ? t('Avalie cada colaborador durante o ciclo em andamento.') : t('Nenhum ciclo em andamento no momento.')}</p>
      </div>

      {cycle && (
        <div className="card card-pad" style={{ marginBottom: 16 }}>
          <div className="between">
            <div className="row" style={{ gap: 12 }}>
              <span style={{
                width: 42, height: 42, borderRadius: 11,
                background: 'var(--accent-soft)', color: 'var(--accent-ink)',
                display: 'grid', placeItems: 'center',
              }}>
                <Icon name="cycle" size={20} />
              </span>
              <div className="col">
                <div className="row" style={{ gap: 10 }}>
                  <span style={{ fontWeight: 600 }}>{t('Ciclo')} {cycle.name}</span>
                  <CycleBadge status="open" />
                  <PhaseBadge cycle={cycle} />
                </div>
                <span className="muted" style={{ fontSize: 12.5 }}>
                  {t('envios até')} {fmtBR(submitEnd ?? cycle.closes_at)}
                </span>
              </div>
            </div>
            <div className="col" style={{ alignItems: 'flex-end' }}>
              <span className="mono" style={{ fontSize: 15, fontWeight: 600 }}>{myDoneCount}/{team.length}</span>
              <span className="muted" style={{ fontSize: 12 }}>{t('avaliações concluídas')}</span>
            </div>
          </div>
        </div>
      )}

      {team.length === 0 ? (
        <div className="empty"><p>{t('Nenhum contratado alocado ao seu cliente.')}</p></div>
      ) : (
        <div className="card">
          <table className="tbl">
            <thead>
              <tr>
                <th>{t('Colaborador')}</th>
                <th>{t('Senioridade')}</th>
                <th>{t('Minha avaliação')}</th>
                <th>{t('Auto-avaliação')}</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {team.map((c) => {
                const myDone = c.myStatus === 'submitted'
                const hasCycle = c.myStatus !== 'no_cycle'
                return (
                  <tr key={c.id}>
                    <td><PersonRow person={{ name: c.name, role: c.email }} /></td>
                    <td><Badge>{c.seniority} · {c.track}</Badge></td>
                    <td>
                      {!hasCycle ? <span className="muted" style={{ fontSize: 12 }}>—</span>
                        : myDone ? <Badge kind="done"><Icon name="check" size={12} />{t('Concluída')}{c.myScore ? ` · ${c.myScore}` : ''}</Badge>
                        : <Badge kind="pending">{t('pendente')}</Badge>}
                    </td>
                    <td>
                      {!hasCycle ? <span className="muted" style={{ fontSize: 12 }}>—</span>
                        : c.selfStatus === 'submitted' ? <Badge><Icon name="lock" size={11} />{t('enviada')}</Badge>
                        : <Badge kind="pending">{t('pendente')}</Badge>}
                    </td>
                    <td className="td-num">
                      {hasCycle ? (
                        <Link href={`/client/team/${c.id}/evaluate`} className={'btn btn-sm ' + (myDone ? '' : 'btn-primary')}>
                          {myDone ? <><Icon name="edit" size={14} />{t('Revisar')}</> : <><Icon name="star" size={14} />{t('Avaliar')}</>}
                        </Link>
                      ) : (
                        <Link href="/client/history" className="btn btn-sm">{t('Histórico')}</Link>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <div className="callout" style={{ marginTop: 16 }}>
        <Icon name="lock" />{t('Para evitar viés, você só verá o conteúdo da auto-avaliação do colaborador após o encerramento do ciclo.')}
      </div>
    </div>
  )
}
