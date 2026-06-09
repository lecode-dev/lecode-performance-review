import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScoreCard } from '@/components/review/ScoreCard'
import { ReviewBadge } from '@/components/review/StatusBadge'
import { DIMENSION_LABELS } from '@/lib/supabase/types'
import type { DimensionKey } from '@/lib/supabase/types'

export default async function ContractorHistoryPage() {
  const supabase = await createServerClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', session.user.id)
    .single()

  if (profile?.role !== 'contractor') redirect('/login')

  // Histórico completo
  const { data: history } = await supabase
    .from('contractor_history')
    .select('*, cycles(id, name, status, closed_at)')
    .eq('contractor_id', session.user.id)
    .order('created_at', { ascending: false })

  // Reviews fechadas (para ver as respostas — só disponível após ciclo fechar)
  const closedCycleIds = history?.map((h) => {
    const c = (h.cycles as { id: string } | null)
    return c?.id
  }).filter(Boolean) as string[] | undefined

  // Busca reviews e answers por ciclo fechado (RLS libera após fechar)
  let reviewsByDimension: Record<string, Record<string, number[]>> = {}
  if (closedCycleIds?.length) {
    const { data: reviews } = await supabase
      .from('reviews')
      .select('id, cycle_id, type')
      .eq('contractor_id', session.user.id)
      .in('cycle_id', closedCycleIds)
      .eq('status', 'submitted')

    if (reviews?.length) {
      const { data: answers } = await supabase
        .from('review_answers')
        .select('review_id, score, form_questions(dimension)')
        .in('review_id', reviews.map((r) => r.id))

      for (const answer of answers ?? []) {
        const review = reviews.find((r) => r.id === answer.review_id)
        if (!review) continue
        const dim = (answer.form_questions as { dimension: DimensionKey } | null)?.dimension
        if (!dim) continue

        const key = `${review.cycle_id}:${review.type}:${dim}`
        if (!reviewsByDimension[key]) reviewsByDimension[key] = {}
        if (!reviewsByDimension[key][review.cycle_id]) reviewsByDimension[key][review.cycle_id] = []
        reviewsByDimension[key][review.cycle_id].push(answer.score)
      }
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Meu Histórico</h1>
        <p className="text-muted-foreground text-sm mt-1">Resultados dos ciclos de avaliação fechados</p>
      </div>

      {!history?.length ? (
        <p className="text-sm text-muted-foreground py-8 text-center">
          Nenhum ciclo fechado ainda. Aguarde o fechamento do ciclo atual.
        </p>
      ) : (
        history.map((h) => {
          const cycle = (h.cycles as { id: string; name: string; status: string; closed_at: string | null } | null)
          const dims: DimensionKey[] = ['tech', 'delivery', 'comm', 'collab', 'autonomy']

          return (
            <Card key={h.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-base">{cycle?.name}</CardTitle>
                  {cycle?.closed_at && (
                    <span className="text-xs text-muted-foreground">
                      Fechado em {new Date(cycle.closed_at).toLocaleDateString('pt-BR')}
                    </span>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <ScoreCard
                  selfAvg={h.self_avg}
                  clientAvg={h.client_avg}
                  finalScore={h.final_score}
                  selfWeight={h.self_weight ?? 0.3}
                  clientWeight={h.client_weight ?? 0.7}
                />

                {/* Breakdown por dimensão */}
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
                    Por dimensão
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                    {dims.map((dim) => {
                      const selfKey   = `${cycle?.id}:self:${dim}`
                      const clientKey = `${cycle?.id}:client:${dim}`
                      const selfScores   = reviewsByDimension[selfKey]?.[cycle?.id ?? ''] ?? []
                      const clientScores = reviewsByDimension[clientKey]?.[cycle?.id ?? ''] ?? []

                      const selfAvg   = selfScores.length   ? selfScores.reduce((s,v) => s+v,0)   / selfScores.length   : null
                      const clientAvg = clientScores.length ? clientScores.reduce((s,v) => s+v,0) / clientScores.length : null

                      return (
                        <div key={dim} className="bg-muted/50 rounded-lg p-2 text-center">
                          <p className="text-[10px] text-muted-foreground font-medium uppercase mb-1">
                            {DIMENSION_LABELS[dim]}
                          </p>
                          <p className="text-sm font-semibold tabular-nums">
                            {selfAvg != null ? selfAvg.toFixed(1) : '—'}
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            cli: {clientAvg != null ? clientAvg.toFixed(1) : '—'}
                          </p>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })
      )}
    </div>
  )
}
