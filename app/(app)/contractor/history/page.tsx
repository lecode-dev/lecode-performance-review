import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { ContractorHistoryView } from '@/components/lecode/screens/ContractorHistoryView'
import { finalScore } from '@/lib/domain'
import type { DimensionKey } from '@/lib/supabase/types'

export default async function ContractorHistoryPage() {
  const supabase = await createServerClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/login')

  const [profileRes, cyclesRes, allocRes] = await Promise.all([
    supabase.from('profiles').select('role, full_name').eq('id', session.user.id).single(),
    supabase.from('cycles').select('id, name, status, opens_at, closes_at, created_at, closed_at').order('created_at', { ascending: false }),
    supabase.from('allocations').select('clients(name)').eq('contractor_id', session.user.id).is('ended_on', null).limit(1).single(),
  ])

  const profile = profileRes.data
  if (profile?.role !== 'contractor') redirect('/login')

  const cycles = cyclesRes.data
  const clientName = (allocRes.data?.clients as { name: string } | null)?.name ?? null

  const cycleData: Record<string, {
    selfAvg: number | null; clientAvg: number | null; finalScore: number | null
    selfDims: Record<DimensionKey, number> | null; clientDims: Record<DimensionKey, number> | null
    selfDone: boolean; clientDone: boolean
    selfOpen: { strengths?: string; growth?: string; extra?: string } | null
    clientOpen: { strengths?: string; growth?: string; extra?: string } | null
  }> = {}

  const cycleIds = (cycles ?? []).map((c) => c.id)

  const { data: allReviews } = cycleIds.length
    ? await supabase
        .from('reviews')
        .select('id, cycle_id, type, status, strengths, growth, extra')
        .in('cycle_id', cycleIds)
        .eq('contractor_id', session.user.id)
    : { data: [] }

  const allReviewIds = (allReviews ?? []).map((r) => r.id)
  const { data: allAnswers } = allReviewIds.length
    ? await supabase
        .from('review_answers')
        .select('review_id, score, form_questions(dimension)')
        .in('review_id', allReviewIds)
    : { data: [] }

  const answersByReview = new Map<string, typeof allAnswers>()
  for (const a of allAnswers ?? []) {
    const arr = answersByReview.get(a.review_id) ?? []
    arr.push(a)
    answersByReview.set(a.review_id, arr)
  }

  for (const cycle of cycles ?? []) {
    const reviews = (allReviews ?? []).filter((r) => r.cycle_id === cycle.id)
    const selfReview = reviews.find((r) => r.type === 'self')
    const clientReview = reviews.find((r) => r.type === 'client')

    let selfDims: Record<DimensionKey, number> | null = null
    let clientDims: Record<DimensionKey, number> | null = null
    let selfAvg: number | null = null
    let clientAvg: number | null = null

    for (const entry of [{ review: selfReview, type: 'self' as const }, { review: clientReview, type: 'client' as const }]) {
      if (!entry.review) continue
      const rAnswers = answersByReview.get(entry.review.id) ?? []
      if (rAnswers.length === 0) continue

      const dimScores: Record<string, number[]> = {}
      for (const a of rAnswers) {
        const dim = (a.form_questions as { dimension: DimensionKey } | null)?.dimension
        if (!dim) continue
        if (!dimScores[dim]) dimScores[dim] = []
        dimScores[dim].push(a.score)
      }

      const dims: Record<string, number> = {}
      let totalSum = 0, totalCount = 0
      for (const [dim, scores] of Object.entries(dimScores)) {
        dims[dim] = Math.round((scores.reduce((s, v) => s + v, 0) / scores.length) * 100) / 100
        totalSum += scores.reduce((s, v) => s + v, 0)
        totalCount += scores.length
      }

      if (entry.type === 'self') {
        selfDims = dims as Record<DimensionKey, number>
        selfAvg = totalCount > 0 ? Math.round((totalSum / totalCount) * 100) / 100 : null
      } else {
        clientDims = dims as Record<DimensionKey, number>
        clientAvg = totalCount > 0 ? Math.round((totalSum / totalCount) * 100) / 100 : null
      }
    }

    cycleData[cycle.id] = {
      selfAvg, clientAvg,
      finalScore: finalScore(selfAvg, clientAvg),
      selfDims, clientDims,
      selfDone: selfReview?.status === 'submitted',
      clientDone: clientReview?.status === 'submitted',
      selfOpen: selfReview ? { strengths: selfReview.strengths ?? undefined, growth: selfReview.growth ?? undefined, extra: selfReview.extra ?? undefined } : null,
      clientOpen: clientReview ? { strengths: clientReview.strengths ?? undefined, growth: clientReview.growth ?? undefined, extra: clientReview.extra ?? undefined } : null,
    }
  }

  return (
    <ContractorHistoryView
      name={profile.full_name}
      cycles={cycles ?? []}
      cycleData={cycleData}
      clientName={clientName}
    />
  )
}
