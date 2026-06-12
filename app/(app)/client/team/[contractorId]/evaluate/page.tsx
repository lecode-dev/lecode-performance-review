import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { createServerClient } from '@/lib/supabase/server'
import { ReviewForm } from '@/components/review/ReviewForm'
import { ReviewBadge } from '@/components/review/StatusBadge'
import { ArrowLeft } from 'lucide-react'
import { submitClientReview } from './actions'

interface Props {
  params: Promise<{ contractorId: string }>
}

export default async function EvaluatePage({ params }: Props) {
  const { contractorId } = await params

  const supabase = await createServerClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/login')

  const { data: repProfile } = await supabase
    .from('profiles')
    .select('role, client_id')
    .eq('id', session.user.id)
    .single()

  if (repProfile?.role !== 'client_rep' || !repProfile.client_id) redirect('/client/team')

  const { data: alloc } = await supabase
    .from('allocations')
    .select('id')
    .eq('contractor_id', contractorId)
    .eq('client_id', repProfile.client_id)
    .is('ended_on', null)
    .single()

  if (!alloc) notFound()

  const { data: contractorProfile } = await supabase
    .from('profiles')
    .select('full_name, email')
    .eq('id', contractorId)
    .single()

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
          <p>Nenhum ciclo aberto para avaliação.</p>
        </div>
      </div>
    )
  }

  let { data: review } = await supabase
    .from('reviews')
    .select('id, status, strengths, growth, extra')
    .eq('cycle_id', cycle.id)
    .eq('contractor_id', contractorId)
    .eq('author_id', session.user.id)
    .eq('type', 'client')
    .single()

  if (!review) {
    const { data: newReview } = await supabase
      .from('reviews')
      .insert({
        cycle_id:      cycle.id,
        contractor_id: contractorId,
        type:          'client',
        author_id:     session.user.id,
      })
      .select('id, status, strengths, growth, extra')
      .single()
    review = newReview
  }

  if (!review) redirect('/client/team')

  const { data: formVersion } = await supabase
    .from('form_versions')
    .select('id')
    .eq('cycle_id', cycle.id)
    .single()

  const { data: questions } = await supabase
    .from('form_questions')
    .select('id, dimension, text, order_index')
    .eq('form_version_id', formVersion?.id ?? '')
    .eq('applies_to', 'client')
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
          <Link href="/client/team" className="btn btn-ghost btn-sm" style={{ display: 'inline-flex', marginBottom: 8 }}>
            <ArrowLeft size={14} /> Voltar
          </Link>
          <div className="row" style={{ gap: 8, flexWrap: 'wrap', marginTop: 4 }}>
            <h2 style={{ margin: 0 }}>Avaliação de {contractorProfile?.full_name}</h2>
            <ReviewBadge status={review.status} />
          </div>
          <p>Ciclo: {cycle.name}</p>
        </div>

        {isSubmitted && (
          <div className="card card-pad" style={{ borderColor: 'var(--success, #22c55e)' }}>
            <p style={{ fontSize: 13 }}>
              Avaliação submetida. Respostas somente leitura até o ciclo fechar.
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
          <form action={submitClientReview.bind(null, review.id)}>
            <button type="submit" className="btn btn-primary">
              Submeter avaliação
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
