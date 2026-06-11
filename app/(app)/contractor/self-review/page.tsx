import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createServerClient } from '@/lib/supabase/server'
import { ReviewForm } from '@/components/review/ReviewForm'
import { ReviewBadge, CycleBadge } from '@/components/review/StatusBadge'
import { ArrowLeft } from 'lucide-react'
import { submitSelfReview } from './actions'

export default async function SelfReviewPage() {
  const supabase = await createServerClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', session.user.id)
    .single()

  if (profile?.role !== 'contractor') redirect('/login')

  const { data: cycle } = await supabase
    .from('cycles')
    .select('id, name, status')
    .eq('status', 'open')
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (!cycle) {
    return (
      <div className="content anim-in">
        <div className="empty">
          <p>Nenhum ciclo aberto para auto-avaliação.</p>
          <Link href="/contractor" className="btn btn-sm" style={{ marginTop: 12 }}>
            Voltar ao dashboard
          </Link>
        </div>
      </div>
    )
  }

  let { data: review } = await supabase
    .from('reviews')
    .select('id, status, strengths, growth, extra')
    .eq('cycle_id', cycle.id)
    .eq('author_id', session.user.id)
    .eq('type', 'self')
    .single()

  if (!review) {
    const { data: newReview } = await supabase
      .from('reviews')
      .insert({
        cycle_id:      cycle.id,
        contractor_id: session.user.id,
        type:          'self',
        author_id:     session.user.id,
      })
      .select('id, status, strengths, growth, extra')
      .single()
    review = newReview
  }

  if (!review) redirect('/contractor')

  const { data: formVersion } = await supabase
    .from('form_versions')
    .select('id')
    .eq('cycle_id', cycle.id)
    .single()

  const { data: questions } = await supabase
    .from('form_questions')
    .select('id, dimension, text, order_index')
    .eq('form_version_id', formVersion?.id ?? '')
    .eq('applies_to', 'self')
    .order('dimension')
    .order('order_index')

  const { data: existingAnswers } = await supabase
    .from('review_answers')
    .select('question_id, score')
    .eq('review_id', review.id)

  const initialAnswers = Object.fromEntries(
    (existingAnswers ?? []).map((a) => [a.question_id, a.score])
  )

  const isSubmitted = review.status === 'submitted'

  return (
    <div className="content anim-in">
      <div className="col" style={{ gap: 24, maxWidth: 720 }}>
        <div className="page-head">
          <Link href="/contractor" className="btn btn-ghost btn-sm" style={{ display: 'inline-flex', marginBottom: 8 }}>
            <ArrowLeft size={14} /> Voltar
          </Link>
          <div className="row" style={{ gap: 8, flexWrap: 'wrap', marginTop: 4 }}>
            <h2 style={{ margin: 0 }}>Auto-avaliação</h2>
            <CycleBadge status={cycle.status} />
            <ReviewBadge status={review.status} />
          </div>
          <p>Ciclo: {cycle.name}</p>
        </div>

        {isSubmitted ? (
          <div className="card card-pad" style={{ borderColor: 'var(--success, #22c55e)' }}>
            <p style={{ fontSize: 13 }}>
              Auto-avaliação submetida com sucesso. Aguarde o ciclo fechar para ver o resultado.
            </p>
          </div>
        ) : (
          <div className="card card-pad" style={{ borderColor: 'var(--warning)' }}>
            <p style={{ fontSize: 13 }}>
              Suas respostas são salvas automaticamente. Clique em <strong>Submeter</strong> quando concluir.
            </p>
          </div>
        )}

        <ReviewForm
          reviewId={review.id}
          questions={questions ?? []}
          initialAnswers={initialAnswers}
          initialComments={{
            strengths: review.strengths ?? '',
            growth:    review.growth    ?? '',
            extra:     review.extra     ?? '',
          }}
          isSubmitted={isSubmitted}
        />

        {!isSubmitted && (
          <form action={submitSelfReview.bind(null, review.id)}>
            <button type="submit" className="btn btn-primary">
              Submeter auto-avaliação
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
