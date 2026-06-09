import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createServerClient } from '@/lib/supabase/server'
import { ReviewForm } from '@/components/review/ReviewForm'
import { ReviewBadge, CycleBadge } from '@/components/review/StatusBadge'
import { Button } from '@/components/ui/button'
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

  // Ciclo aberto
  const { data: cycle } = await supabase
    .from('cycles')
    .select('id, name, status')
    .eq('status', 'open')
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (!cycle) {
    return (
      <div className="py-12 text-center">
        <p className="text-muted-foreground">Nenhum ciclo aberto para auto-avaliação.</p>
        <Link href="/contractor" className="mt-4 block">
          <Button variant="outline">Voltar ao dashboard</Button>
        </Link>
      </div>
    )
  }

  // Get or create self-review
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

  // Form version + perguntas (self type)
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

  // Respostas existentes
  const { data: existingAnswers } = await supabase
    .from('review_answers')
    .select('question_id, score')
    .eq('review_id', review.id)

  const initialAnswers = Object.fromEntries(
    (existingAnswers ?? []).map((a) => [a.question_id, a.score])
  )

  const isSubmitted = review.status === 'submitted'

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <Link href="/contractor">
          <Button variant="ghost" size="sm" className="gap-1">
            <ArrowLeft size={15} /> Voltar
          </Button>
        </Link>
        <div>
          <h1 className="text-xl font-bold tracking-tight">Auto-avaliação</h1>
          <div className="flex items-center gap-2 mt-0.5">
            <p className="text-sm text-muted-foreground">Ciclo: {cycle.name}</p>
            <CycleBadge status={cycle.status} />
            <ReviewBadge status={review.status} />
          </div>
        </div>
      </div>

      {isSubmitted ? (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          Auto-avaliação submetida com sucesso. Aguarde o ciclo fechar para ver o resultado.
        </div>
      ) : (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Suas respostas são salvas automaticamente. Clique em <strong>Submeter</strong> quando concluir.
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
          <Button type="submit" className="w-full sm:w-auto">
            Submeter auto-avaliação
          </Button>
        </form>
      )}
    </div>
  )
}
