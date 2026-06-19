'use client'

import Link from 'next/link'
import { useLang } from '@/lib/i18n'
import { Icon } from '@/components/lecode/Icon'
import { EvaluationForm } from '@/components/review/EvaluationForm'
import { submitSelfReview } from '@/app/(app)/contractor/self-review/actions'
import type { DimensionKey } from '@/lib/supabase/types'

interface SelfReviewViewProps {
  reviewId: string
  cycleName: string
  cycleSubmitEnd: string
  questions: { id: string; dimension: DimensionKey; text: string; order_index: number }[]
  initialAnswers: Record<string, number>
  initialComments: { strengths: string; growth: string; extra: string }
  isSubmitted: boolean
}

export function SelfReviewView({
  reviewId, cycleName, cycleSubmitEnd, questions, initialAnswers, initialComments, isSubmitted,
}: SelfReviewViewProps) {
  const { t } = useLang()

  const handleSubmit = () => {
    submitSelfReview(reviewId)
  }

  return (
    <div className="content">
      <Link href="/contractor" className="btn btn-ghost btn-sm" style={{ marginBottom: 8 }}>
        <Icon name="chevron" size={15} style={{ transform: 'rotate(180deg)' }} />{t('Início')}
      </Link>
      <EvaluationForm
        reviewId={reviewId}
        cycleName={cycleName}
        cycleSubmitEnd={cycleSubmitEnd}
        type="self"
        questions={questions}
        initialAnswers={initialAnswers}
        initialComments={initialComments}
        isSubmitted={isSubmitted}
        onSubmit={handleSubmit}
        onCancel={undefined}
      />
    </div>
  )
}
