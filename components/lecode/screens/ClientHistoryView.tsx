'use client'

import { useState } from 'react'
import { useLang } from '@/lib/i18n'
import { Icon } from '@/components/lecode/Icon'
import { Avatar } from '@/components/lecode/Avatar'
import { Badge } from '@/components/lecode/Badge'
import { PersonRow } from '@/components/lecode/Avatar'
import { ScoreChip } from '@/components/lecode/ScoreChip'
import { CycleBadge } from '@/components/lecode/Cycle'
import { ReviewDetail } from '@/components/review/ReviewDetail'
import type { Database, DimensionKey } from '@/lib/supabase/types'

type Cycle = Database['public']['Tables']['cycles']['Row']

interface TeamRow {
  contractorId: string
  name: string
  email: string
  myAvg: number | null
  selfAvg: number | null
  finalScoreVal: number | null
  selfDims: Record<DimensionKey, number> | null
  clientDims: Record<DimensionKey, number> | null
  selfDone: boolean
  clientDone: boolean
  selfOpen: { strengths?: string; growth?: string; extra?: string } | null
  clientOpen: { strengths?: string; growth?: string; extra?: string } | null
}

interface ClientHistoryViewProps {
  clientName: string
  cycles: Cycle[]
  cycleTeamData: Record<string, TeamRow[]>
}

export function ClientHistoryView({ clientName, cycles, cycleTeamData }: ClientHistoryViewProps) {
  const { t } = useLang()
  const [cycleId, setCycleId] = useState(cycles[0]?.id ?? '')
  const [openId, setOpenId] = useState<string | null>(null)
  const cycle = cycles.find((c) => c.id === cycleId)
  const team = cycleTeamData[cycleId] ?? []

  if (openId && cycle) {
    const c = team.find((t) => t.contractorId === openId)
    if (!c) { setOpenId(null); return null }
    return (
      <div className="content anim-in">
        <button className="btn btn-ghost btn-sm" style={{ marginBottom: 14 }} onClick={() => setOpenId(null)}>
          <Icon name="chevron" size={15} style={{ transform: 'rotate(180deg)' }} />{t('Histórico')}
        </button>
        <div className="page-head">
          <div className="eyebrow">{cycle.name}</div>
          <div className="row" style={{ gap: 12 }}>
            <Avatar person={{ name: c.name }} size="lg" />
            <div>
              <h2 style={{ margin: 0, fontSize: 20 }}>{c.name}</h2>
              <span className="muted">{c.email}</span>
            </div>
          </div>
        </div>
        <ReviewDetail
          cycleStatus={cycle.status}
          perspective="client"
          selfAvg={c.selfAvg}
          clientAvg={c.myAvg}
          finalScore={c.finalScoreVal}
          selfDims={c.selfDims}
          clientDims={c.clientDims}
          selfDone={c.selfDone}
          clientDone={c.clientDone}
          selfOpen={c.selfOpen}
          clientOpen={c.clientOpen}
          clientName={clientName}
        />
      </div>
    )
  }

  return (
    <div className="content anim-in">
      <div className="page-head">
        <div className="eyebrow">{clientName}</div>
        <h2>{t('Histórico de avaliações')}</h2>
        <p>{t('Avaliações realizadas pela')} {clientName} {t('e auto-avaliações dos colaboradores vinculados, filtradas por ciclo.')}</p>
      </div>

      {cycles.length > 0 && (
        <div className="row wrap" style={{ gap: 6, marginBottom: 16 }}>
          {cycles.map((cy) => (
            <button key={cy.id} className={'btn btn-sm ' + (cy.id === cycleId ? 'btn-primary' : '')}
              onClick={() => { setCycleId(cy.id); setOpenId(null) }}>
              {cy.name}
            </button>
          ))}
        </div>
      )}

      {cycle && (
        <div className="card">
          <div className="card-head">
            <Icon name="history" size={16} />
            <h3>{t('Ciclo')} {cycle.name}</h3>
            <span style={{ marginLeft: 'auto' }}><CycleBadge status={cycle.status} /></span>
          </div>
          <table className="tbl">
            <thead>
              <tr>
                <th>{t('Colaborador')}</th>
                <th className="th-num">{t('Minha avaliação')}</th>
                <th className="th-num">{t('Auto-avaliação')}</th>
                <th className="th-num">{t('Score final')}</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {team.map((c) => {
                const closed = cycle.status === 'closed'
                return (
                  <tr key={c.contractorId} className="clickable" onClick={() => setOpenId(c.contractorId)}>
                    <td><PersonRow person={{ name: c.name, role: c.email }} /></td>
                    <td className="td-num"><ScoreChip value={c.clientDone ? c.myAvg : null} /></td>
                    <td className="td-num">
                      {closed ? <ScoreChip value={c.selfDone ? c.selfAvg : null} /> : <Badge><Icon name="lock" size={11} /></Badge>}
                    </td>
                    <td className="td-num">
                      {closed ? <ScoreChip value={c.finalScoreVal} /> : <span className="muted" style={{ fontSize: 12 }}>{t('após encerrar')}</span>}
                    </td>
                    <td className="td-num"><Icon name="chevron" size={16} className="muted" /></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {cycle && cycle.status !== 'closed' && (
        <div className="callout" style={{ marginTop: 16 }}>
          <Icon name="lock" />{t('As auto-avaliações e o score final deste ciclo só ficam visíveis após o encerramento pelo gestor da LeCode.')}
        </div>
      )}

      {cycles.length === 0 && (
        <div className="empty"><p>{t('Nenhum ciclo disponível.')}</p></div>
      )}
    </div>
  )
}
