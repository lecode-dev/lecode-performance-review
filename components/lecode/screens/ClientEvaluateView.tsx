'use client'

import Link from 'next/link'
import { useLang } from '@/lib/i18n'
import { Icon } from '@/components/lecode/Icon'
import { EvaluationForm } from '@/components/review/EvaluationForm'
import { submitClientReview } from '@/app/(app)/client/team/[contractorId]/evaluate/actions'
import type { DimensionKey } from '@/lib/supabase/types'

interface ClientEvaluateViewProps {
  reviewId: string
  cycleName: string
  cycleSubmitEnd: string
  contractorName: string
  contractorEmail: string
  clientName: string
  questions: { id: string; dimension: DimensionKey; text: string; order_index: number }[]
  initialAnswers: Record<string, number>
  initialComments: { strengths: string; growth: string; extra: string }
  isSubmitted: boolean
}

export function ClientEvaluateView({
  reviewId, cycleName, cycleSubmitEnd, contractorName, contractorEmail,
  clientName, questions, initialAnswers, initialComments, isSubmitted,
}: ClientEvaluateViewProps) {
  const { t } = useLang()

  const handleSubmit = () => {
    submitClientReview(reviewId)
  }

  return (
    <div className="content">
      <Link href="/client/team" className="btn btn-ghost btn-sm" style={{ marginBottom: 8 }}>
        <Icon name="chevron" size={15} style={{ transform: 'rotate(180deg)' }} />{t('Minha equipe')}
      </Link>
      <EvaluationForm
        reviewId={reviewId}
        cycleName={cycleName}
        cycleSubmitEnd={cycleSubmitEnd}
        type="client"
        contractorName={contractorName}
        contractorRole={contractorEmail}
        contractorPerson={{ name: contractorName, role: contractorEmail }}
        clientName={clientName}
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
