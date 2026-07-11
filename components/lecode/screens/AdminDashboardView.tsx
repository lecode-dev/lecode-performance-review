'use client'

import Link from 'next/link'
import { useLang } from '@/lib/i18n'
import { Stat, Progress } from '@/components/lecode/Stat'
import { CountUp } from '@/components/lecode/CountUp'
import { CycleBadge, PhaseBadge, CyclePhases } from '@/components/lecode/Cycle'
import { Icon } from '@/components/lecode/Icon'
import { decisionFor } from '@/lib/domain'
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

function tierColor(tier: number) {
  const map: Record<number, string> = {
    5: 'oklch(0.55 0.16 155)',
    4: 'oklch(0.62 0.16 155)',
    3: 'oklch(0.55 0.12 200)',
    2: 'oklch(0.58 0.16 30)',
    1: 'oklch(0.55 0.18 15)',
  }
  return map[tier] ?? 'var(--ink-3)'
}

function ScoreBar({ score }: { score: number }) {
  const pct = Math.max(0, Math.min(100, (score / 5) * 100))
  const dec = decisionFor(score)
  const color = dec ? tierColor(dec.tier) : 'var(--ink-3)'
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, flex: 1 }}>
      <div style={{
        flex: 1, height: 6, borderRadius: 3,
        background: 'var(--surface-3)', overflow: 'hidden',
      }}>
        <div style={{
          width: pct + '%', height: '100%', borderRadius: 3,
          background: color, transition: 'width 0.4s ease',
        }} />
      </div>
      <span style={{
        fontFamily: 'var(--mono)', fontSize: 14, fontWeight: 700,
        color, minWidth: 36, textAlign: 'right',
      }}>
        {score.toFixed(2)}
      </span>
    </div>
  )
}

export function AdminDashboardView({
  adminName, activeCycle, lastClosed, cycleProgress, clientProgress,
  decisions, activeContractors, clientsCount, unallocated,
}: AdminDashboardViewProps) {
  const { t } = useLang()

  const decisionsByTier = new Map<number, Decision[]>()
  for (const d of decisions) {
    const dec = decisionFor(d.score)
    const tier = dec?.tier ?? 0
    if (!decisionsByTier.has(tier)) decisionsByTier.set(tier, [])
    decisionsByTier.get(tier)!.push(d)
  }
  const sortedTiers = [...decisionsByTier.entries()].sort((a, b) => b[0] - a[0])

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

      {activeCycle ? (
        <div className="card" style={{ marginBottom: 18 }}>
          <div className="card-head">
            <Icon name="cycle" size={16} />
            <div className="col" style={{ gap: 1 }}>
              <h3>{t('Ciclo')} {activeCycle.name}</h3>
              <span className="sub">{fmtBR(activeCycle.opens_at)} → {fmtBR(activeCycle.closes_at)}</span>
            </div>
            <span style={{ marginLeft: 'auto' }} className="row wrap">
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
                      <div key={cp.clientId} className="between" style={{ flexWrap: 'wrap', gap: '6px 12px' }}>
                        <div className="row" style={{ gap: 10 }}>
                          <span className="avatar sm" style={{ background: `oklch(0.55 0.13 ${cp.name.charCodeAt(0) % 360})` }}>{cp.name[0]}</span>
                          <span style={{ fontSize: 13, fontWeight: 500 }}>{cp.name}</span>
                        </div>
                        <div className="row" style={{ gap: 12, flex: '0 0 160px', minWidth: 0 }}>
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
        <div className="card card-pad" style={{ marginBottom: 18 }}>
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
          <Icon name="award" size={16} />
          <div className="col" style={{ gap: 1 }}>
            <h3>{t('Decisões de carreira')}</h3>
            <span className="sub">{lastClosed ? `${t('Baseado no ciclo')} ${lastClosed.name}` : t('Nenhum ciclo fechado')}</span>
          </div>
          {decisions.length > 0 && (
            <span className="mono muted" style={{ marginLeft: 'auto', fontSize: 12 }}>
              {decisions.length} {t('contratados')}
            </span>
          )}
        </div>
        <div className="card-pad">
          {decisions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 20px' }}>
              <Icon name="trend" size={28} />
              <p className="muted" style={{ marginTop: 10, fontSize: 13 }}>{t('Nenhum score disponível ainda. Feche um ciclo para ver as decisões.')}</p>
            </div>
          ) : (
            <div className="col" style={{ gap: 20 }}>
              {sortedTiers.map(([tier, members]) => {
                const dec = decisionFor(members[0].score)
                return (
                  <div key={tier}>
                    <div className="row" style={{ gap: 8, marginBottom: 10 }}>
                      <Icon name={tier >= 4 ? 'award' : tier <= 2 ? 'warning' : 'trend'} size={14} style={{ color: tierColor(tier) }} />
                      <span style={{ fontSize: 12.5, fontWeight: 700, color: tierColor(tier), textTransform: 'uppercase', letterSpacing: 0.5 }}>
                        {dec?.short ?? '—'}
                      </span>
                      <span style={{
                        fontFamily: 'var(--mono)', fontSize: 11, fontWeight: 600,
                        background: 'var(--surface-3)', color: 'var(--ink-3)',
                        padding: '1px 6px', borderRadius: 4,
                      }}>
                        {members.length}
                      </span>
                    </div>
                    <div className="col" style={{ gap: 4 }}>
                      {members.map((d) => (
                        <Link
                          key={d.contractorId}
                          href={`/admin/contractors/${d.contractorId}`}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
                            padding: '10px 14px', borderRadius: 10, textDecoration: 'none', color: 'inherit',
                            background: 'var(--surface-2)',
                            transition: 'opacity 0.15s',
                          }}
                        >
                          <div style={{ flex: '1 1 140px', minWidth: 0 }}>
                            <PersonRow person={{ name: d.name, role: d.role }} sub={d.clientName} />
                          </div>
                          <div style={{ flex: '0 0 160px', minWidth: 0 }}>
                            <ScoreBar score={d.score} />
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
