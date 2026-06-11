import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { ScoreCard } from '@/components/review/ScoreCard'
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

  const { data: history } = await supabase
    .from('contractor_history')
    .select('*, cycles(id, name, status, closed_at)')
    .eq('contractor_id', session.user.id)
    .order('created_at', { ascending: false })

  const closedCycleIds = history?.map((h) => {
    const c = (h.cycles as { id: string } | null)
    return c?.id
  }).filter(Boolean) as string[] | undefined

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

  const dims: DimensionKey[] = ['tech', 'delivery', 'comm', 'collab', 'autonomy']

  return (
    <div className="content anim-in">
      <div className="col" style={{ gap: 24, maxWidth: 720 }}>
        <div className="page-head">
          <div className="eyebrow">Contratado LeCode</div>
          <h2>Meu Histórico</h2>
          <p>Resultados dos ciclos de avaliação fechados.</p>
        </div>

        {!history?.length ? (
          <div className="empty">
            <p>Nenhum ciclo fechado ainda. Aguarde o fechamento do ciclo atual.</p>
          </div>
        ) : (
          history.map((h) => {
            const cycle = (h.cycles as { id: string; name: string; status: string; closed_at: string | null } | null)

            return (
              <div key={h.id} className="card">
                <div className="card-head">
                  <div className="between">
                    <h3>{cycle?.name}</h3>
                    {cycle?.closed_at && (
                      <span className="muted" style={{ fontSize: 12 }}>
                        Fechado em {new Date(cycle.closed_at).toLocaleDateString('pt-BR')}
                      </span>
                    )}
                  </div>
                </div>
                <div className="card-pad col" style={{ gap: 16 }}>
                  <ScoreCard
                    selfAvg={h.self_avg}
                    clientAvg={h.client_avg}
                    finalScore={h.final_score}
                    selfWeight={h.self_weight ?? 0.3}
                    clientWeight={h.client_weight ?? 0.7}
                  />

                  <div>
                    <p className="muted" style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600, marginBottom: 10 }}>
                      Por dimensão
                    </p>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8 }}>
                      {dims.map((dim) => {
                        const selfKey   = `${cycle?.id}:self:${dim}`
                        const clientKey = `${cycle?.id}:client:${dim}`
                        const selfScores   = reviewsByDimension[selfKey]?.[cycle?.id ?? ''] ?? []
                        const clientScores = reviewsByDimension[clientKey]?.[cycle?.id ?? ''] ?? []

                        const selfAvg   = selfScores.length   ? selfScores.reduce((s, v) => s + v, 0)   / selfScores.length   : null
                        const clientAvg = clientScores.length ? clientScores.reduce((s, v) => s + v, 0) / clientScores.length : null

                        return (
                          <div key={dim} style={{ background: 'var(--surface-2)', borderRadius: 8, padding: '10px 8px', textAlign: 'center' }}>
                            <p className="muted" style={{ fontSize: 10, textTransform: 'uppercase', fontWeight: 600, marginBottom: 4 }}>
                              {DIMENSION_LABELS[dim]}
                            </p>
                            <p className="mono" style={{ fontSize: 14, fontWeight: 600 }}>
                              {selfAvg != null ? selfAvg.toFixed(1) : '—'}
                            </p>
                            <p className="muted" style={{ fontSize: 10 }}>
                              cli: {clientAvg != null ? clientAvg.toFixed(1) : '—'}
                            </p>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
