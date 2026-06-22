import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createServerClient } from '@/lib/supabase/server'
import { SelfReviewView } from '@/components/lecode/screens/SelfReviewView'
import { midMonth } from '@/lib/domain'

export default async function SelfReviewPage() {
  const supabase = await createServerClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/login')

  const [profileRes, cycleRes] = await Promise.all([
    supabase.from('profiles').select('role, full_name').eq('id', session.user.id).single(),
    supabase.from('cycles').select('id, name, status, opens_at, closes_at').eq('status', 'open').order('created_at', { ascending: false }).limit(1).single(),
  ])

  const profile = profileRes.data
  if (profile?.role !== 'contractor') redirect('/login')

  const cycle = cycleRes.data
  if (!cycle) {
    return (
      <div className="content anim-in">
        <div className="empty">
          <p>Nenhum ciclo aberto para auto-avaliação.</p>
          <Link href="/contractor" className="btn btn-sm" style={{ marginTop: 12 }}>Voltar ao dashboard</Link>
        </div>
      </div>
    )
  }

  const [reviewRes, formVersionRes] = await Promise.all([
    supabase.from('reviews').select('id, status, strengths, growth, extra')
      .eq('cycle_id', cycle.id).eq('author_id', session.user.id).eq('type', 'self').single(),
    supabase.from('form_versions').select('id').eq('cycle_id', cycle.id).single(),
  ])

  let review = reviewRes.data
  if (!review) {
    const { data: newReview } = await supabase
      .from('reviews')
      .insert({ cycle_id: cycle.id, contractor_id: session.user.id, type: 'self', author_id: session.user.id })
      .select('id, status, strengths, growth, extra')
      .single()
    review = newReview
  }

  if (!review) redirect('/contractor')

  const [questionsRes, existingAnswersRes] = await Promise.all([
    supabase.from('form_questions').select('id, dimension, text, order_index')
      .eq('form_version_id', formVersionRes.data?.id ?? '')
      .eq('applies_to', 'self').order('dimension').order('order_index'),
    supabase.from('review_answers').select('question_id, score').eq('review_id', review.id),
  ])

  const questions = questionsRes.data
  const existingAnswers = existingAnswersRes.data

  const initialAnswers = Object.fromEntries(
    (existingAnswers ?? []).map((a) => [a.question_id, a.score])
  )

  const submitEnd = midMonth(cycle.opens_at)

  return (
    <SelfReviewView
      reviewId={review.id}
      cycleName={cycle.name}
      cycleSubmitEnd={submitEnd}
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
