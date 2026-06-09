'use client'
import { useEffect, useRef, useCallback } from 'react'
import { getBrowserClient } from '@/lib/supabase/client'
import { useReviewDraft } from '@/stores/useReviewDraft'
import { DIMENSION_LABELS } from '@/lib/supabase/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { DimensionKey } from '@/lib/supabase/types'

interface Question {
  id:          string
  dimension:   DimensionKey
  text:        string
  order_index: number
}

interface ReviewFormProps {
  reviewId:        string
  questions:       Question[]
  initialAnswers:  Record<string, number>
  initialComments: { strengths: string; growth: string; extra: string }
  isSubmitted:     boolean
}

const SCORE_LABELS = ['', 'Insuficiente', 'Abaixo do esperado', 'Atende', 'Acima do esperado', 'Excepcional']

export function ReviewForm({
  reviewId, questions, initialAnswers, initialComments, isSubmitted,
}: ReviewFormProps) {
  const { answers, comments, isDirty, isSaving, setReviewId, setAnswer, setComment, loadDraft, markSaving, markClean } =
    useReviewDraft()

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Inicializa store
  useEffect(() => {
    setReviewId(reviewId)
    loadDraft(initialAnswers as Record<string, 1|2|3|4|5>, initialComments)
  }, [reviewId]) // eslint-disable-line react-hooks/exhaustive-deps

  // Autosave debounced
  const autosave = useCallback(async () => {
    if (!isDirty || isSubmitted) return
    markSaving(true)
    const supabase = getBrowserClient()

    // Upsert answers
    const answerRows = Object.entries(answers).map(([question_id, score]) => ({
      review_id:   reviewId,
      question_id,
      score,
    }))

    if (answerRows.length > 0) {
      await supabase.from('review_answers').upsert(answerRows, {
        onConflict: 'review_id,question_id',
      })
    }

    // Update comments
    await supabase.from('reviews').update({
      strengths: comments.strengths || null,
      growth:    comments.growth    || null,
      extra:     comments.extra     || null,
    }).eq('id', reviewId)

    markSaving(false)
    markClean()
  }, [answers, comments, isDirty, reviewId, isSubmitted, markSaving, markClean])

  useEffect(() => {
    if (!isDirty) return
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(autosave, 1500)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [isDirty, autosave])

  // Agrupa por dimensão na ordem definida
  const dimensions: DimensionKey[] = ['tech', 'delivery', 'comm', 'collab', 'autonomy']
  const grouped = dimensions.reduce<Record<DimensionKey, Question[]>>(
    (acc, dim) => {
      acc[dim] = questions.filter((q) => q.dimension === dim).sort((a, b) => a.order_index - b.order_index)
      return acc
    },
    {} as Record<DimensionKey, Question[]>,
  )

  return (
    <div className="space-y-6">
      {/* Autosave indicator */}
      {!isSubmitted && (
        <p className="text-xs text-muted-foreground text-right h-4">
          {isSaving ? 'Salvando…' : isDirty ? 'Salvar em breve…' : 'Rascunho salvo'}
        </p>
      )}

      {dimensions.map((dim) => {
        const qs = grouped[dim]
        if (!qs?.length) return null

        const dimAnswers = qs.map((q) => answers[q.id] ?? 0)
        const dimAvg = dimAnswers.every(Boolean)
          ? (dimAnswers.reduce((s, v) => s + v, 0) / dimAnswers.length).toFixed(1)
          : null

        return (
          <Card key={dim}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{DIMENSION_LABELS[dim]}</CardTitle>
                {dimAvg && (
                  <span className="text-sm font-semibold tabular-nums text-muted-foreground">
                    Média: {dimAvg}
                  </span>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              {qs.map((q) => (
                <QuestionRow
                  key={q.id}
                  question={q}
                  value={(answers[q.id] ?? 0) as 0|1|2|3|4|5}
                  disabled={isSubmitted}
                  onChange={(score) => setAnswer(q.id, score as 1|2|3|4|5)}
                />
              ))}
            </CardContent>
          </Card>
        )
      })}

      {/* Comentários */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Comentários</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <CommentField
            label="Pontos fortes"
            value={comments.strengths}
            disabled={isSubmitted}
            onChange={(v) => setComment('strengths', v)}
          />
          <CommentField
            label="Pontos de crescimento"
            value={comments.growth}
            disabled={isSubmitted}
            onChange={(v) => setComment('growth', v)}
          />
          <CommentField
            label="Observações adicionais (opcional)"
            value={comments.extra}
            disabled={isSubmitted}
            onChange={(v) => setComment('extra', v)}
          />
        </CardContent>
      </Card>
    </div>
  )
}

// ─── sub-components ──────────────────────────────────────────────────────────

function QuestionRow({
  question, value, disabled, onChange,
}: {
  question: Question
  value:    0|1|2|3|4|5
  disabled: boolean
  onChange: (score: number) => void
}) {
  return (
    <div className="space-y-2">
      <p className="text-sm text-foreground leading-snug">{question.text}</p>
      <div className="flex gap-2 flex-wrap">
        {([1, 2, 3, 4, 5] as const).map((score) => (
          <button
            key={score}
            type="button"
            disabled={disabled}
            onClick={() => onChange(score)}
            title={SCORE_LABELS[score]}
            className={cn(
              'flex flex-col items-center gap-0.5 w-14 py-2 rounded-lg border text-xs font-medium transition-all',
              value === score
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-muted/40 text-muted-foreground border-border hover:border-primary hover:text-primary',
              disabled && 'opacity-60 cursor-default',
            )}
          >
            <span className="text-base font-bold">{score}</span>
            <span className="text-[10px] leading-tight text-center px-1 hidden sm:block">
              {SCORE_LABELS[score].split(' ')[0]}
            </span>
          </button>
        ))}
      </div>
      {value > 0 && (
        <p className="text-xs text-muted-foreground">{SCORE_LABELS[value]}</p>
      )}
    </div>
  )
}

function CommentField({
  label, value, disabled, onChange,
}: {
  label:    string
  value:    string
  disabled: boolean
  onChange: (v: string) => void
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-foreground">{label}</label>
      <textarea
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        rows={3}
        className={cn(
          'flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm',
          'ring-offset-background placeholder:text-muted-foreground',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          'disabled:cursor-not-allowed disabled:opacity-60 resize-none',
        )}
        placeholder={disabled ? '' : 'Escreva aqui…'}
      />
    </div>
  )
}
