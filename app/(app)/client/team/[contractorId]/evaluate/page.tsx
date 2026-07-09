import { redirect, notFound } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { ClientEvaluateView } from '@/components/lecode/screens/ClientEvaluateView'
import { midMonth } from '@/lib/domain'

interface Props {
  params: Promise<{ contractorId: string }>
}

export default async function EvaluatePage({ params }: Props) {
  const { contractorId } = await params

  const supabase = await createServerClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/login')

  const [repProfileRes, contractorProfileRes, cycleRes] = await Promise.all([
    supabase.from('profiles').select('role, client_id').eq('id', session.user.id).single(),
    supabase.from('profiles').select('full_name, email').eq('id', contractorId).single(),
    supabase.from('cycles').select('id, name, status, opens_at, closes_at').eq('status', 'open').order('created_at', { ascending: false }).limit(1).single(),
  ])

  const repProfile = repProfileRes.data
  if (repProfile?.role !== 'client_rep' || !repProfile.client_id) redirect('/client/team')

  const { data: alloc } = await supabase
    .from('allocations')
    .select('id, clients(name)')
    .eq('contractor_id', contractorId)
    .eq('client_id', repProfile.client_id)
    .is('ended_on', null)
    .single()

  if (!alloc) notFound()

  const clientName = (alloc.clients as { name: string } | null)?.name ?? ''
  const contractorProfile = contractorProfileRes.data
  const cycle = cycleRes.data

  if (!cycle) {
    return (
      <div className="content anim-in">
        <div className="empty"><p>Nenhum ciclo aberto para avaliação.</p></div>
      </div>
    )
  }

  const [reviewRes, formVersionRes] = await Promise.all([
    supabase.from('reviews').select('id, status, strengths, growth, extra')
      .eq('cycle_id', cycle.id).eq('contractor_id', contractorId)
      .eq('author_id', session.user.id).eq('type', 'client').single(),
    supabase.from('form_versions').select('id').eq('cycle_id', cycle.id).single(),
  ])

  let review = reviewRes.data
  if (!review) {
    const { data: newReview } = await supabase
      .from('reviews')
      .insert({ cycle_id: cycle.id, contractor_id: contractorId, type: 'client', author_id: session.user.id})
      .select('id, status, strengths, growth, extra')
      .single()
    review = newReview
  }

  if (!review) redirect('/client/team')

  const [questionsRes, existingAnswersRes] = await Promise.all([
    supabase.from('form_questions').select('id, dimension, text, text_en, text_es, order_index')
      .eq('form_version_id', formVersionRes.data?.id ?? '')
      .eq('applies_to', 'client').order('dimension').order('order_index'),
    supabase.from('review_answers').select('question_id, score').eq('review_id', review.id),
  ])

  const questions = questionsRes.data
  const existingAnswers = existingAnswersRes.data

  const initialAnswers = Object.fromEntries(
    (existingAnswers ?? []).map((a) => [a.question_id, a.score])
  )

  const submitEnd = midMonth(cycle.opens_at)

  return (
    <ClientEvaluateView
      reviewId={review.id}
      cycleName={cycle.name}
      cycleSubmitEnd={submitEnd}
      contractorName={contractorProfile?.full_name ?? '—'}
      contractorEmail={contractorProfile?.email ?? ''}
      clientName={clientName}
      questions={questions ?? []}
      initialAnswers={initialAnswers}
      initialComments={{
        strengths: review.strengths ?? '',
        growth: review.growth ?? '',
        extra: review.extra ?? '',
      }}
      isSubmitted={review.status === 'submitted'}
    />
  )
}
