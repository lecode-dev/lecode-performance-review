import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
      <div className="py-12 text-center">
        <p className="text-muted-foreground">Nenhum cliente associado.</p>
      </div>
    )
  }

  // Ciclos fechados com histórico de contratados alocados
  const { data: cycles } = await supabase
    .from('cycles')
    .select('id, name, status, closed_at')
    .eq('status', 'closed')
    .order('closed_at', { ascending: false })

  // Contratados alocados ao cliente (histórico completo, incluindo ex-alocados)
  const { data: allocations } = await supabase
    .from('allocations')
    .select('contractor_id')
    .eq('client_id', profile.client_id)

  const contractorIds = [...new Set(allocations?.map((a) => a.contractor_id) ?? [])]

  // Perfis dos contratados (query separada)
  const { data: contractorProfiles } = contractorIds.length
    ? await supabase.from('profiles').select('id, full_name').in('id', contractorIds)
    : { data: [] }

  // Histórico de scores
  const { data: history } = await supabase
    .from('contractor_history')
    .select('cycle_id, contractor_id, self_avg, client_avg, final_score, self_weight, client_weight')
    .in('contractor_id', contractorIds.length ? contractorIds : ['none'])
    .order('created_at', { ascending: false })

  const nameMap = new Map(
    contractorProfiles?.map((p) => [p.id, p.full_name]) ?? []
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Histórico</h1>
        <p className="text-muted-foreground text-sm mt-1">Scores de ciclos fechados do seu time</p>
      </div>

      {!cycles?.length ? (
        <p className="text-sm text-muted-foreground py-8 text-center">
          Nenhum ciclo fechado ainda.
        </p>
      ) : (
        cycles.map((cycle) => {
          const cycleHistory = history?.filter((h) => h.cycle_id === cycle.id) ?? []

          return (
            <Card key={cycle.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-base">{cycle.name}</CardTitle>
                  <CycleBadge status={cycle.status} />
                  {cycle.closed_at && (
                    <span className="text-xs text-muted-foreground">
                      Fechado em {new Date(cycle.closed_at).toLocaleDateString('pt-BR')}
                    </span>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {!cycleHistory.length ? (
                  <p className="text-sm text-muted-foreground">Sem dados para este ciclo.</p>
                ) : (
                  <div className="divide-y divide-border">
                    {cycleHistory.map((h) => (
                      <div key={h.contractor_id} className="py-3">
                        <div className="flex items-center justify-between mb-2">
                          <p className="font-medium text-sm">{nameMap.get(h.contractor_id)}</p>
                          <ScorePill score={h.final_score} />
                        </div>
                        <ScoreCard
                          selfAvg={h.self_avg}
                          clientAvg={h.client_avg}
                          finalScore={h.final_score}
                          selfWeight={h.self_weight ?? 0.3}
                          clientWeight={h.client_weight ?? 0.7}
                          className="mt-2"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })
      )}
    </div>
  )
}
