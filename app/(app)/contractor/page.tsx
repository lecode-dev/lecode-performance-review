import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createServerClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
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

  // Ciclo aberto
  const { data: cycle } = await supabase
    .from('cycles')
    .select('id, name, status, closes_at')
    .eq('status', 'open')
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  // Self-review atual
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

    // Total de perguntas
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

  // Histórico recente
  const { data: history } = await supabase
    .from('contractor_history')
    .select('cycle_id, final_score, cycles(name)')
    .eq('contractor_id', session.user.id)
    .order('created_at', { ascending: false })
    .limit(3)

  const progress = totalQuestions > 0 ? (answeredCount / totalQuestions) * 100 : 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Olá, {profile.full_name.split(' ')[0]} 👋
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Bem-vindo ao seu painel de performance review
        </p>
      </div>

      {/* Ciclo atual */}
      {cycle ? (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <CardTitle className="text-base">{cycle.name}</CardTitle>
              <CycleBadge status={cycle.status} />
            </div>
            <p className="text-xs text-muted-foreground">Prazo: {cycle.closes_at}</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium mb-1">Auto-avaliação</p>
                <ReviewBadge status={selfReview?.status as 'draft' | 'submitted' ?? 'not_started'} />
              </div>
              {selfReview?.status !== 'submitted' && (
                <Link href="/contractor/self-review">
                  <Button size="sm" className="gap-2">
                    <Star size={14} />
                    {selfReview ? 'Continuar' : 'Iniciar'}
                  </Button>
                </Link>
              )}
            </div>

            {selfReview && selfReview.status !== 'submitted' && (
              <div>
                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                  <span>Progresso</span>
                  <span>{answeredCount}/{totalQuestions} respostas</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-6 text-center">
            <p className="text-muted-foreground text-sm">Nenhum ciclo de avaliação aberto no momento.</p>
          </CardContent>
        </Card>
      )}

      {/* Histórico recente */}
      {history && history.length > 0 && (
        <Card>
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-base">Histórico recente</CardTitle>
            <Link href="/contractor/history" className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
              Ver tudo <ArrowRight size={12} />
            </Link>
          </CardHeader>
          <CardContent>
            <div className="divide-y divide-border">
              {history.map((h) => {
                const cycle = (h.cycles as { name: string } | null)
                return (
                  <div key={h.cycle_id} className="flex items-center justify-between py-3">
                    <div className="flex items-center gap-2">
                      <History size={15} className="text-muted-foreground" />
                      <span className="text-sm">{cycle?.name}</span>
                    </div>
                    <ScorePill score={h.final_score} />
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
