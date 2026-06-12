import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createServerClient } from '@/lib/supabase/server'
import { ScorePill } from '@/components/review/ScoreCard'
import { ReviewBadge, CycleBadge } from '@/components/review/StatusBadge'
import { Star, History, ArrowRight } from 'lucide-react'

export default async function ContractorDashboard() {
  const supabase = await createServerClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name')
    .eq('id', session.user.id)
    .single()

  if (profile?.role !== 'contractor') redirect('/login')

  const { data: cycle } = await supabase
    .from('cycles')
    .select('id, name, status, closes_at')
    .eq('status', 'open')
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  let selfReview: { id: string; status: string } | null = null
  let answeredCount = 0
  let totalQuestions = 0

  if (cycle) {
    const { data: review } = await supabase
      .from('reviews')
      .select('id, status')
      .eq('cycle_id', cycle.id)
      .eq('author_id', session.user.id)
      .eq('type', 'self')
      .single()

    selfReview = review ?? null

    if (review) {
      const { count: answered } = await supabase
        .from('review_answers')
        .select('id', { count: 'exact' })
        .eq('review_id', review.id)

      answeredCount = answered ?? 0
    }

    const { data: fv } = await supabase
      .from('form_versions')
      .select('id')
      .eq('cycle_id', cycle.id)
      .single()

    if (fv) {
      const { count } = await supabase
        .from('form_questions')
        .select('id', { count: 'exact' })
        .eq('form_version_id', fv.id)
        .eq('applies_to', 'self')

      totalQuestions = count ?? 0
    }
  }

  const { data: history } = await supabase
    .from('contractor_history')
    .select('cycle_id, final_score, cycles(name)')
    .eq('contractor_id', session.user.id)
    .order('created_at', { ascending: false })
    .limit(3)

  const progress = totalQuestions > 0 ? (answeredCount / totalQuestions) * 100 : 0

  return (
    <div className="content anim-in">
      <div className="col" style={{ gap: 24, maxWidth: 720 }}>
        <div className="page-head">
          <div className="eyebrow">Contratado LeCode</div>
          <h2>Olá, {profile.full_name.split(' ')[0]}</h2>
          <p>Bem-vindo ao seu painel de performance review.</p>
        </div>

        {cycle ? (
          <div className="card">
            <div className="card-head">
              <div className="between">
                <div className="row" style={{ gap: 8 }}>
                  <h3>{cycle.name}</h3>
                  <CycleBadge status={cycle.status} />
                </div>
                <span className="muted" style={{ fontSize: 12 }}>Prazo: {cycle.closes_at}</span>
              </div>
            </div>
            <div className="card-pad col" style={{ gap: 16 }}>
              <div className="between">
                <div className="col" style={{ gap: 4 }}>
                  <span style={{ fontSize: 13, fontWeight: 500 }}>Auto-avaliação</span>
                  <ReviewBadge status={selfReview?.status as 'draft' | 'submitted' ?? 'not_started'} />
                </div>
                {selfReview?.status !== 'submitted' && (
                  <Link href="/contractor/self-review" className="btn btn-primary btn-sm" style={{ display: 'inline-flex', gap: 6 }}>
                    <Star size={13} />
                    {selfReview ? 'Continuar' : 'Iniciar'}
                  </Link>
                )}
              </div>

              {selfReview && selfReview.status !== 'submitted' && (
                <div className="col" style={{ gap: 4 }}>
                  <div className="between muted" style={{ fontSize: 12 }}>
                    <span>Progresso</span>
                    <span>{answeredCount}/{totalQuestions} respostas</span>
                  </div>
                  <div className="progress">
                    <span style={{ width: `${progress}%` }} />
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="empty">
            <p>Nenhum ciclo de avaliação aberto no momento.</p>
          </div>
        )}

        {history && history.length > 0 && (
          <div className="card">
            <div className="card-head between">
              <h3>Histórico recente</h3>
              <Link href="/contractor/history" className="muted" style={{ display: 'inline-flex', gap: 4, fontSize: 12, alignItems: 'center' }}>
                Ver tudo <ArrowRight size={12} />
              </Link>
            </div>
            <div className="card-pad col" style={{ gap: 0 }}>
              {history.map((h) => {
                const c = (h.cycles as { name: string } | null)
                return (
                  <div key={h.cycle_id} className="between" style={{ padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                    <div className="row" style={{ gap: 8 }}>
                      <History size={14} style={{ color: 'var(--muted-fg)' }} />
                      <span style={{ fontSize: 13 }}>{c?.name}</span>
                    </div>
                    <ScorePill score={h.final_score} />
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
