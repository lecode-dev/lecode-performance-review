import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { createServerClient } from '@/lib/supabase/server'
import { ReviewForm } from '@/components/review/ReviewForm'
import { ReviewBadge } from '@/components/review/StatusBadge'
import { Button } from '@/components/ui/button'
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

  // Valida que o contractor está alocado ao cliente
  const { data: alloc } = await supabase
    .from('allocations')
    .select('id')
    .eq('contractor_id', contractorId)
    .eq('client_id', repProfile.client_id)
    .is('ended_on', null)
    .single()

  if (!alloc) notFound()

  // Perfil do contratado
  const { data: contractorProfile } = await supabase
    .from('profiles')
    .select('full_name, email')
    .eq('id', contractorId)
    .single()

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
        <p className="text-muted-foreground">Nenhum ciclo aberto para avaliação.</p>
      </div>
    )
  }

  // Get or create review
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

  // Form version + questions (client type)
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

  // Existing answers
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
        <Link href="/client/team">
          <Button variant="ghost" size="sm" className="gap-1">
            <ArrowLeft size={15} /> Voltar
          </Button>
        </Link>
        <div>
          <h1 className="text-xl font-bold tracking-tight">
            Avaliação de {contractorProfile?.full_name}
          </h1>
          <div className="flex items-center gap-2 mt-0.5">
            <p className="text-sm text-muted-foreground">Ciclo: {cycle.name}</p>
            <ReviewBadge status={review.status} />
          </div>
        </div>
      </div>

      {isSubmitted && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          Avaliação submetida. Respostas somente leitura até o ciclo fechar.
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
          <Button type="submit" className="w-full sm:w-auto">
            Submeter avaliação
          </Button>
        </form>
      )}
    </div>
  )
}
