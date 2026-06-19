'use client'

import { useState } from 'react'
import { useLang } from '@/lib/i18n'
import { CycleBadge } from '@/components/lecode/Cycle'
import { ReviewDetail } from '@/components/review/ReviewDetail'
import type { Database, DimensionKey } from '@/lib/supabase/types'

type Cycle = Database['public']['Tables']['cycles']['Row']

interface CycleReviewData {
  selfAvg: number | null
  clientAvg: number | null
  finalScore: number | null
  selfDims: Record<DimensionKey, number> | null
  clientDims: Record<DimensionKey, number> | null
  selfDone: boolean
  clientDone: boolean
  selfOpen: { strengths?: string; growth?: string; extra?: string } | null
  clientOpen: { strengths?: string; growth?: string; extra?: string } | null
}

interface ContractorHistoryViewProps {
  name: string
  cycles: Cycle[]
  cycleData: Record<string, CycleReviewData>
  clientName: string | null
}

function fmtBR(iso: string): string {
  const [y, m, d] = iso.slice(0, 10).split('-')
  return `${d}/${m}/${y}`
}

export function ContractorHistoryView({ name, cycles, cycleData, clientName }: ContractorHistoryViewProps) {
  const { t } = useLang()
  const [cycleId, setCycleId] = useState(cycles[0]?.id ?? '')
  const cycle = cycles.find((c) => c.id === cycleId)
  const data = cycleData[cycleId]

  return (
    <div className="content anim-in">
      <div className="page-head">
        <div className="eyebrow">{name}</div>
        <h2>{t('Meu histórico')}</h2>
        <p>{t('Veja sua auto-avaliação e a avaliação do cliente em cada ciclo. A avaliação do cliente fica disponível após o encerramento do ciclo.')}</p>
      </div>

      {cycles.length > 0 && (
        <>
          <div className="row wrap" style={{ gap: 6, marginBottom: 16 }}>
            {cycles.map((cy) => (
              <button key={cy.id} className={'btn btn-sm ' + (cy.id === cycleId ? 'btn-primary' : '')}
                onClick={() => setCycleId(cy.id)}>
                {cy.name} {cy.status === 'open' && '·'}
              </button>
            ))}
          </div>

          {cycle && (
            <div className="between" style={{ marginBottom: 14 }}>
              <span className="muted" style={{ fontSize: 13 }}>
                {t('Ciclo')} {cycle.name} · {fmtBR(cycle.opens_at)} → {fmtBR(cycle.closes_at)}
              </span>
              <CycleBadge status={cycle.status} />
            </div>
          )}

          {data && cycle && (
            <ReviewDetail
              cycleStatus={cycle.status}
              perspective="contractor"
              selfAvg={data.selfAvg}
              clientAvg={data.clientAvg}
              finalScore={data.finalScore}
              selfDims={data.selfDims}
              clientDims={data.clientDims}
              selfDone={data.selfDone}
              clientDone={data.clientDone}
              selfOpen={data.selfOpen}
              clientOpen={data.clientOpen}
              clientName={clientName ?? undefined}
            />
          )}
        </>
      )}

      {cycles.length === 0 && (
        <div className="empty">
          <p>{t('Nenhum ciclo disponível ainda.')}</p>
        </div>
      )}
    </div>
  )
}
