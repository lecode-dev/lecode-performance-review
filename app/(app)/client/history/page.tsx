import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { ScorePill, ScoreCard } from '@/components/review/ScoreCard'
import { CycleBadge } from '@/components/review/StatusBadge'

export default async function ClientHistoryPage() {
  const supabase = await createServerClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, client_id')
    .eq('id', session.user.id)
    .single()

  if (profile?.role !== 'client_rep') redirect('/login')
  if (!profile.client_id) {
    return (
      <div className="content anim-in">
        <div className="empty"><p>Nenhum cliente associado.</p></div>
      </div>
    )
  }

  const { data: cycles } = await supabase
    .from('cycles')
    .select('id, name, status, closed_at')
    .eq('status', 'closed')
    .order('closed_at', { ascending: false })

  const { data: allocations } = await supabase
    .from('allocations')
    .select('contractor_id')
    .eq('client_id', profile.client_id)

  const contractorIds = [...new Set(allocations?.map((a) => a.contractor_id) ?? [])]

  const { data: contractorProfiles } = contractorIds.length
    ? await supabase.from('profiles').select('id, full_name').in('id', contractorIds)
    : { data: [] }

  const { data: history } = await supabase
    .from('contractor_history')
    .select('cycle_id, contractor_id, self_avg, client_avg, final_score, self_weight, client_weight')
    .in('contractor_id', contractorIds.length ? contractorIds : ['none'])
    .order('created_at', { ascending: false })

  const nameMap = new Map(
    contractorProfiles?.map((p) => [p.id, p.full_name]) ?? []
  )

  return (
    <div className="content anim-in">
      <div className="col" style={{ gap: 24, maxWidth: 860 }}>
        <div className="page-head">
          <div className="eyebrow">Representante</div>
          <h2>Histórico</h2>
          <p>Scores de ciclos de avaliação fechados do seu time.</p>
        </div>

        {!cycles?.length ? (
          <div className="empty">
            <p>Nenhum ciclo fechado ainda.</p>
          </div>
        ) : (
          cycles.map((cycle) => {
            const cycleHistory = history?.filter((h) => h.cycle_id === cycle.id) ?? []

            return (
              <div key={cycle.id} className="card">
                <div className="card-head">
                  <div className="between">
                    <div className="row" style={{ gap: 8 }}>
                      <h3>{cycle.name}</h3>
                      <CycleBadge status={cycle.status} />
                    </div>
                    {cycle.closed_at && (
                      <span className="muted" style={{ fontSize: 12 }}>
                        Fechado em {new Date(cycle.closed_at).toLocaleDateString('pt-BR')}
                      </span>
                    )}
                  </div>
                </div>
                <div className="card-pad">
                  {!cycleHistory.length ? (
                    <p className="muted" style={{ fontSize: 13 }}>Sem dados para este ciclo.</p>
                  ) : (
                    <div className="col" style={{ gap: 0 }}>
                      {cycleHistory.map((h) => (
                        <div key={h.contractor_id} style={{ padding: '16px 0', borderBottom: '1px solid var(--border)' }}>
                          <div className="between" style={{ marginBottom: 12 }}>
                            <span style={{ fontWeight: 500, fontSize: 14 }}>{nameMap.get(h.contractor_id)}</span>
                            <ScorePill score={h.final_score} />
                          </div>
                          <ScoreCard
                            selfAvg={h.self_avg}
                            clientAvg={h.client_avg}
                            finalScore={h.final_score}
                            selfWeight={h.self_weight ?? 0.3}
                            clientWeight={h.client_weight ?? 0.7}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
