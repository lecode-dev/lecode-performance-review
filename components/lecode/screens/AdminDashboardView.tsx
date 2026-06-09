'use client'
import Link from 'next/link'
import { useLang } from '@/lib/i18n'
import { Stat } from '@/components/lecode/Stat'
import { CountUp } from '@/components/lecode/CountUp'
import { CycleBadge, PhaseBadge } from '@/components/lecode/Cycle'
import { Icon } from '@/components/lecode/Icon'
import { EmptyState } from '@/components/lecode/EmptyState'
import type { Database } from '@/lib/supabase/types'

type Cycle = Database['public']['Tables']['cycles']['Row']

interface AdminDashboardViewProps {
  cycles:           Cycle[]
  contractorsCount: number
  clientsCount:     number
}

function fmtRange(opensAt: string, closesAt: string): string {
  const f = (iso: string) => {
    const [y, m, d] = iso.slice(0, 10).split('-')
    return `${d}/${m}/${y}`
  }
  return `${f(opensAt)} → ${f(closesAt)}`
}

export function AdminDashboardView({ cycles, contractorsCount, clientsCount }: AdminDashboardViewProps) {
  const { t } = useLang()
  const openCount   = cycles.filter((c) => c.status === 'open').length
  const closedCount = cycles.filter((c) => c.status === 'closed').length

  return (
    <div className="content anim-in">
      <div className="page-head between">
        <div>
          <div className="eyebrow">{t('Visão geral')}</div>
          <h2>{t('Bem-vindo de volta')}</h2>
          <p>{t('Acompanhe o andamento do ciclo de avaliação e as decisões recomendadas para os contratados da LeCode.')}</p>
        </div>
        <Link href="/admin/cycles" className="btn btn-primary btn-sm">
          <Icon name="cycle" size={15} />{t('Gerenciar ciclo')}
        </Link>
      </div>

      <div className="grid grid-3 stagger" style={{ marginBottom: 18 }}>
        <Stat label={t('Ciclos abertos')} icon="cycle" value={<CountUp end={openCount} />} />
        <Stat label={t('Contratados')} icon="users" value={<CountUp end={contractorsCount} />} />
        <Stat label={t('Clientes')} icon="building" value={<CountUp end={clientsCount} />} />
      </div>

      <div className="card">
        <div className="card-head">
          <Icon name="cycle" size={16} />
          <div className="col" style={{ gap: 1 }}>
            <h3>{t('Ciclos de avaliação')}</h3>
            <span className="sub">{t('Histórico')}</span>
          </div>
          <Link href="/admin/cycles" className="btn btn-sm" style={{ marginLeft: 'auto' }}>
            {t('Gerenciar ciclo')}<Icon name="arrowRight" size={14} />
          </Link>
        </div>
        <div className="card-pad">
          {cycles.length ? (
            <div className="col" style={{ gap: 2 }}>
              {cycles.map((cycle) => (
                <Link
                  key={cycle.id}
                  href="/admin/cycles"
                  className="between"
                  style={{ padding: '11px 6px', borderRadius: 8 }}
                >
                  <div className="col" style={{ gap: 2 }}>
                    <span style={{ fontSize: 13.5, fontWeight: 600 }}>{cycle.name}</span>
                    <span className="mono muted" style={{ fontSize: 12 }}>{fmtRange(cycle.opens_at, cycle.closes_at)}</span>
                  </div>
                  <span className="row" style={{ gap: 8 }}>
                    <PhaseBadge cycle={cycle} />
                    <CycleBadge status={cycle.status} />
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState
              icon="cycle"
              title={t('Nenhum ciclo de avaliação em andamento no momento.')}
              text={<Link href="/admin/cycles" className="btn btn-primary btn-sm">{t('Gerenciar ciclo')}</Link>}
            />
          )}
        </div>
      </div>

      {closedCount > 0 && (
        <p className="muted" style={{ fontSize: 12.5, textAlign: 'center', marginTop: 16 }}>
          {closedCount} {t('ciclo(s) encerrado(s)')} — {t('scores disponíveis em')}{' '}
          <Link href="/admin/cycles" className="underline">{t('Ciclos de avaliação')}</Link>
        </p>
      )}
    </div>
  )
}
