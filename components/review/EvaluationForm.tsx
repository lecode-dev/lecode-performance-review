'use client'

import { useEffect, useLayoutEffect, useRef, useCallback, useMemo, useState } from 'react'
import { getBrowserClient } from '@/lib/supabase/client'
import { useReviewDraft } from '@/stores/useReviewDraft'
import { useConfirm } from '@/components/lecode/ConfirmDialog'
import { useLang } from '@/lib/i18n'
import { DIMENSIONS, SCALE, OPEN_QUESTIONS, tierOf, fmt } from '@/lib/domain'
import { Icon } from '@/components/lecode/Icon'
import { useToast } from '@/components/lecode/Toast'
import { Avatar, type Person } from '@/components/lecode/Avatar'
import { ScoreChip } from '@/components/lecode/ScoreChip'
import { RatingInput } from '@/components/lecode/RatingInput'
import type { DimensionKey } from '@/lib/supabase/types'

interface Question {
  id: string
  dimension: DimensionKey
  text: string
  order_index: number
}

interface EvaluationFormProps {
  reviewId: string
  cycleName: string
  cycleSubmitEnd?: string
  type: 'self' | 'client'
  contractorName?: string
  contractorRole?: string
  contractorPerson?: Person
  clientName?: string
  questions: Question[]
  initialAnswers: Record<string, number>
  initialComments: { strengths: string; growth: string; extra: string }
  isSubmitted: boolean
  onSubmit: () => void
  onCancel?: () => void
}

export function EvaluationForm({
  reviewId, cycleName, cycleSubmitEnd, type, contractorName, contractorRole,
  contractorPerson, clientName, questions, initialAnswers, initialComments,
  isSubmitted, onSubmit, onCancel,
}: EvaluationFormProps) {
  const { t } = useLang()
  const confirm = useConfirm()
  const toast = useToast()
  const [submitting, setSubmitting] = useState(false)
  const { answers, comments, isDirty, setReviewId, setAnswer, setComment, loadDraft, markSaving, markClean } =
    useReviewDraft()
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useLayoutEffect(() => {
    setReviewId(reviewId)
    loadDraft(
      initialAnswers as Record<string, 1 | 2 | 3 | 4 | 5>,
      initialComments,
    )
  }, [reviewId]) // eslint-disable-line react-hooks/exhaustive-deps

  const autosave = useCallback(async () => {
    if (!isDirty) return
    markSaving(true)
    const supabase = getBrowserClient()
    const answerRows = Object.entries(answers).map(([question_id, score]) => ({
      review_id: reviewId, question_id, score,
    }))
    if (answerRows.length > 0) {
      await supabase.from('review_answers').upsert(answerRows, { onConflict: 'review_id,question_id' })
    }
    await supabase.from('reviews').update({
      strengths: comments.strengths || null,
      growth: comments.growth || null,
      extra: comments.extra || null,
    }).eq('id', reviewId)
    markSaving(false)
    markClean()
  }, [answers, comments, isDirty, reviewId, markSaving, markClean])

  useEffect(() => {
    if (!isDirty) return
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(autosave, 1500)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [isDirty, autosave])

  const grouped = useMemo(() =>
    DIMENSIONS.map((d) => ({
      ...d,
      questions: questions.filter((q) => q.dimension === d.key).sort((a, b) => a.order_index - b.order_index),
    })).filter((d) => d.questions.length > 0),
    [questions],
  )

  const { dimAvgMap, dimCompleteMap, answeredCount, allComplete, overall } = useMemo(() => {
    const avgMap: Record<string, number | null> = {}
    const completeMap: Record<string, boolean> = {}
    let answered = 0

    for (const d of grouped) {
      const vals = d.questions.map((q) => answers[q.id]).filter((v) => v != null && v > 0) as number[]
      avgMap[d.key] = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null
      completeMap[d.key] = d.questions.length > 0 && d.questions.every((q) => answers[q.id] != null && answers[q.id] > 0)
      answered += vals.length
    }

    const avgs = Object.values(avgMap).filter((v): v is number => v != null)
    const ov = avgs.length === grouped.length ? avgs.reduce((a, b) => a + b, 0) / avgs.length : null

    return {
      dimAvgMap: avgMap,
      dimCompleteMap: completeMap,
      answeredCount: answered,
      allComplete: questions.length > 0 && answered === questions.length,
      overall: ov,
    }
  }, [answers, grouped, questions])

  const dimAvg = (dk: DimensionKey) => dimAvgMap[dk] ?? null
  const dimComplete = (dk: DimensionKey) => dimCompleteMap[dk] ?? false
  const totalQuestions = questions.length

  const handleSubmit = async () => {
    setSubmitting(true)
    if (debounceRef.current) { clearTimeout(debounceRef.current); await autosave() }
    const ok = await confirm(isSubmitted ? {
      icon: 'edit', tone: 'primary',
      title: t('Salvar alterações?'),
      message: `${t('Atualizaremos sua avaliação no ciclo')} ${cycleName}. ${t('Você ainda poderá editá-la enquanto o ciclo estiver aberto.')}`,
      confirmLabel: t('Salvar alterações'), cancelLabel: t('Continuar editando'),
    } : {
      icon: 'send', tone: 'primary',
      title: type === 'self' ? t('Enviar autoavaliação?') : t('Enviar avaliação?'),
      message: type === 'self'
        ? `${t('Suas respostas serão registradas no ciclo')} ${cycleName}. ${t('Você poderá ajustá-las a qualquer momento enquanto o ciclo estiver aberto. Após o encerramento, a avaliação não poderá mais ser alterada.')}`
        : `${t('Você está avaliando')} ${contractorName}. ${t('Suas respostas serão registradas no ciclo')} ${cycleName}. ${t('Você poderá ajustá-las a qualquer momento enquanto o ciclo estiver aberto. Após o encerramento, a avaliação não poderá mais ser alterada.')}`,
      confirmLabel: t('Enviar avaliação'), cancelLabel: t('Continuar editando'),
    })
    if (!ok) {
      setSubmitting(false)
      return
    }
    if (isSubmitted) {
      await autosave()
      toast(t('Alterações salvas com sucesso'))
      setSubmitting(false)
    } else {
      onSubmit()
    }
  }

  const isSelf = type === 'self'
  const subject = isSelf ? t('Auto-avaliação') : t('Avaliação do cliente')

  const handleAnswer = (qId: string, score: number) => {
    setAnswer(qId, score as 1 | 2 | 3 | 4 | 5)
  }

  return (
    <div className="anim-in">
      <div className="page-head">
        <div className="eyebrow">{cycleName} · {subject}</div>
        <div className="between" style={{ alignItems: 'flex-start' }}>
          <div>
            <h2>{isSelf ? t('Como você avalia seu desempenho?') : `${t('Avaliar')} ${contractorName}`}</h2>
            <p>{isSelf
              ? t('Reflita honestamente sobre o ciclo. Cada item usa a escala de 1 a 5. Sua nota tem peso de 30% no score final.')
              : `${contractorRole}${clientName ? ` · ${t('alocado em')} ${clientName}` : ''}. ${t('A avaliação do cliente tem peso de 70% no score final.')}`}</p>
          </div>
          {!isSelf && contractorPerson && <Avatar person={contractorPerson} size="lg" />}
        </div>
      </div>

      <div className="card card-pad" style={{ marginBottom: 18 }}>
        <div className="row wrap" style={{ gap: 14, justifyContent: 'space-between' }}>
          {SCALE.map((s) => (
            <div key={s.v} className="row" style={{ gap: 8 }}>
              <span className={`score-chip tier-${s.v}`} style={{ minWidth: 30 }}>{s.v}</span>
              <span style={{ fontSize: 12.5, color: 'var(--ink-2)' }}>{t(s.label)}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="l-form">
        <div className="l-form-rail">
          {grouped.map((d) => {
            const done = dimComplete(d.key)
            const av = dimAvg(d.key)
            return (
              <button key={d.key} className="nav-item" style={{ marginBottom: 2 }}
                onClick={() => {
                  const el = document.getElementById('dim-' + d.key)
                  if (el) window.scrollTo({ top: window.scrollY + el.getBoundingClientRect().top - 76, behavior: 'smooth' })
                }}>
                <span style={{
                  width: 20, height: 20, borderRadius: 6, display: 'grid', placeItems: 'center',
                  background: done ? `var(--s${tierOf(av!)})` : 'var(--surface-3)',
                  color: done ? '#fff' : 'var(--ink-3)',
                  fontFamily: 'var(--mono)', fontSize: 11, flexShrink: 0,
                }}>
                  {done ? av!.toFixed(1) : d.n}
                </span>
                <span style={{ fontSize: 12.5 }}>{t(d.short)}</span>
              </button>
            )
          })}
          <div className="divider" />
          <div style={{ padding: '0 10px' }}>
            <div className="muted" style={{ fontSize: 11.5 }}>{t('Respondidas')}</div>
            <div className="mono" style={{ fontSize: 14, fontWeight: 600 }}>{answeredCount}/{totalQuestions}</div>
            <div className="progress" style={{ marginTop: 8 }}>
              <span style={{ width: totalQuestions > 0 ? (answeredCount / totalQuestions * 100) + '%' : '0%' }} />
            </div>
          </div>
        </div>

        <div className="col" style={{ gap: 18 }}>
          {grouped.map((d) => (
            <div className="card" key={d.key} id={'dim-' + d.key}>
              <div className="card-head">
                <span style={{
                  width: 26, height: 26, borderRadius: 7, background: 'var(--accent-soft)', color: 'var(--accent-ink)',
                  display: 'grid', placeItems: 'center', fontFamily: 'var(--mono)', fontWeight: 600, fontSize: 13,
                }}>{d.n}</span>
                <div className="col" style={{ gap: 1 }}>
                  <h3>{t(d.label)}</h3>
                  <span className="sub">{t(d.desc)}</span>
                </div>
                <span style={{ marginLeft: 'auto' }}><ScoreChip value={dimAvg(d.key)} /></span>
              </div>
              <div className="card-pad" style={{ paddingTop: 6, paddingBottom: 8 }}>
                {d.questions.map((q, qi) => (
                  <div key={q.id} className="between q-row" style={{
                    alignItems: 'center', gap: 18, padding: '13px 0',
                    borderBottom: qi < d.questions.length - 1 ? '1px solid var(--border)' : 'none',
                  }}>
                    <div style={{ fontSize: 13.5, lineHeight: 1.45, maxWidth: '60ch' }}>
                      <span className="mono muted" style={{ fontSize: 11, marginRight: 8 }}>{d.n}.{qi + 1}</span>
                      {q.text}
                    </div>
                    <RatingInput value={answers[q.id] ?? null} onChange={(v) => handleAnswer(q.id, v)} />
                  </div>
                ))}
              </div>
            </div>
          ))}

          <div className="card">
            <div className="card-head">
              <Icon name="form" size={16} />
              <h3>{t('Perguntas abertas')} <span className="muted" style={{ fontWeight: 400 }}>· {t('opcionais')}</span></h3>
            </div>
            <div className="card-pad col" style={{ gap: 16 }}>
              {OPEN_QUESTIONS.map((o) => (
                <div className="field" key={o.key}>
                  <label>{t(o.label)}</label>
                  <textarea
                    className="textarea"
                    placeholder={t(o.hint)}
                    value={comments[o.key]}
                    onChange={(e) => setComment(o.key, e.target.value)}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="card submit-bar" style={{ position: 'sticky', bottom: 16, marginTop: 20, boxShadow: 'var(--shadow-lg)' }}>
        <div className="between" style={{ padding: '14px 20px' }}>
          <div className="row" style={{ gap: 16 }}>
            <div>
              <div className="muted" style={{ fontSize: 11.5 }}>{t('Média parcial')}</div>
              <div className="row" style={{ gap: 10 }}><ScoreChip value={overall} lg /></div>
            </div>
            {!allComplete && (
              <div className="muted" style={{ fontSize: 12.5, maxWidth: '32ch' }}>
                {t('Responda as')} {totalQuestions} {t('perguntas para concluir')} · {totalQuestions - answeredCount} {t('restantes')}
              </div>
            )}
          </div>
          <div className="row" style={{ gap: 10 }}>
            {onCancel && <button className="btn btn-ghost" onClick={onCancel}>{t('Cancelar')}</button>}
            <button className="btn btn-primary" disabled={!allComplete || submitting} onClick={handleSubmit}>
              <Icon name={submitting ? 'cycle' : 'check'} size={16} />
              {submitting ? t('Enviando...') : isSubmitted ? t('Salvar alterações') : t('Enviar avaliação')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
