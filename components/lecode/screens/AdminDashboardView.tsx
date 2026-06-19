'use client'

import Link from 'next/link'
import { useLang } from '@/lib/i18n'
import { Stat, Progress } from '@/components/lecode/Stat'
import { CountUp } from '@/components/lecode/CountUp'
import { CycleBadge, PhaseBadge, CyclePhases } from '@/components/lecode/Cycle'
import { Icon } from '@/components/lecode/Icon'
import { ScoreChip } from '@/components/lecode/ScoreChip'
import { DecisionTag } from '@/components/lecode/Decision'
import { PersonRow } from '@/components/lecode/Avatar'
import type { Database } from '@/lib/supabase/types'

type Cycle = Database['public']['Tables']['cycles']['Row']

interface Decision {
  contractorId: string
  name: string
  role: string
  clientName: string | null
  score: number
}

interface AdminDashboardViewProps {
  adminName: string
  activeCycle: Cycle | null
  lastClosed: Cycle | null
  cycleProgress: { done: number; total: number; pct: number }
  clientProgress: { clientId: string; name: string; done: number; total: number }[]
  decisions: Decision[]
  activeContractors: number
  clientsCount: number
  unallocated: number
}

function fmtBR(iso: string): string {
  const [y, m, d] = iso.slice(0, 10).split('-')
  return `${d}/${m}/${y}`
}

export function AdminDashboardView({
  adminName, activeCycle, lastClosed, cycleProgress, clientProgress,
  decisions, activeContractors, clientsCount, unallocated,
}: AdminDashboardViewProps) {
  const { t } = useLang()

  return (
    <div className="content anim-in">
      <div className="page-head">
        <div className="eyebrow">{t('Visão geral')}</div>
        <h2>{t('Olá')}, {adminName}</h2>
        <p>{t('Acompanhe o andamento do ciclo de avaliação e as decisões recomendadas para os contratados da LeCode.')}</p>
      </div>

      <div className="grid grid-4 stagger" style={{ marginBottom: 18 }}>
        <Stat label={t('Contratados ativos')} icon="users" value={<CountUp end={activeContractors} />} />
        <Stat label={t('Clientes')} icon="building" value={<CountUp end={clientsCount} />} />
        <Stat label={t('Ciclo atual')} icon="cycle" value={<CountUp end={cycleProgress.pct} suffix="" />} unit="%" />
        <Stat label={t('Sem alocação')} icon="warning" value={<CountUp end={unallocated} />} />
      </div>

      <div className="l-split s360">
        {activeCycle ? (
          <div className="card">
            <div className="card-head">
              <Icon name="cycle" size={16} />
              <div className="col" style={{ gap: 1 }}>
                <h3>{t('Ciclo')} {activeCycle.name}</h3>
                <span className="sub">{fmtBR(activeCycle.opens_at)} → {fmtBR(activeCycle.closes_at)}</span>
              </div>
              <span style={{ marginLeft: 'auto' }} className="row">
                <PhaseBadge cycle={activeCycle} />
                <CycleBadge status={activeCycle.status} />
              </span>
            </div>
            <div className="card-pad">
              <div style={{ marginBottom: 14 }}><CyclePhases cycle={activeCycle} compact /></div>
              <div className="between" style={{ marginBottom: 6 }}>
                <span className="muted" style={{ fontSize: 12.5 }}>{t('Avaliações concluídas')}</span>
                <span className="mono" style={{ fontSize: 13, fontWeight: 600 }}>{cycleProgress.done}/{cycleProgress.total}</span>
              </div>
              <Progress pct={cycleProgress.pct} />
              {clientProgress.length > 0 && (
                <>
                  <div className="divider" />
                  <div className="col" style={{ gap: 10 }}>
                    {clientProgress.map((cp) => {
                      const pct = cp.total > 0 ? Math.round((cp.done / cp.total) * 100) : 0
                      return (
                        <div key={cp.clientId} className="between">
                          <div className="row" style={{ gap: 10 }}>
                            <span className="avatar sm" style={{ background: `oklch(0.55 0.13 ${cp.name.charCodeAt(0) % 360})` }}>{cp.name[0]}</span>
                            <span style={{ fontSize: 13, fontWeight: 500 }}>{cp.name}</span>
                          </div>
                          <div className="row" style={{ gap: 12, width: 200 }}>
                            <div className="progress" style={{ flex: 1 }}><span style={{ width: pct + '%' }} /></div>
                            <span className="mono muted" style={{ fontSize: 12, width: 40, textAlign: 'right' }}>{cp.done}/{cp.total}</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </>
              )}
              <div className="row" style={{ marginTop: 18, gap: 10 }}>
                <Link href="/admin/cycles" className="btn btn-primary btn-sm">
                  <Icon name="cycle" size={15} />{t('Gerenciar ciclo')}
                </Link>
                <Link href="/admin/contractors" className="btn btn-sm">{t('Ver contratados')}</Link>
              </div>
            </div>
          </div>
        ) : (
          <div className="card card-pad">
            <div className="col" style={{ gap: 12, alignItems: 'center', padding: 20 }}>
              <Icon name="cycle" size={28} className="muted" />
              <span className="muted" style={{ fontSize: 13 }}>{t('Nenhum ciclo em andamento')}</span>
              <Link href="/admin/cycles" className="btn btn-primary btn-sm">
                <Icon name="plus" size={15} />{t('Abrir ciclo')}
              </Link>
            </div>
          </div>
        )}

        <div className="card">
          <div className="card-head">
            <Icon name="trend" size={16} />
            <h3>{t('Decisões')}{lastClosed ? ` · ${lastClosed.name}` : ''}</h3>
          </div>
          <div className="card-pad col" style={{ gap: 4 }}>
            {decisions.length === 0 ? (
              <div className="muted" style={{ fontSize: 13 }}>{t('Nenhum score disponível ainda.')}</div>
            ) : (
              decisions.slice(0, 5).map((d) => (
                <Link key={d.contractorId} href={`/admin/contractors/${d.contractorId}`}
                  className="between clickable" style={{ padding: '8px 6px', borderRadius: 8, textDecoration: 'none', color: 'inherit' }}>
                  <PersonRow person={{ name: d.name, role: d.role }} sub={d.clientName} />
                  <div className="col" style={{ alignItems: 'flex-end', gap: 4 }}>
                    <ScoreChip value={d.score} />
                    <DecisionTag score={d.score} />
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
