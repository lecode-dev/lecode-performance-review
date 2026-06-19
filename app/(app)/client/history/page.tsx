import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { ClientHistoryView } from '@/components/lecode/screens/ClientHistoryView'
import { finalScore } from '@/lib/domain'
import type { DimensionKey } from '@/lib/supabase/types'

export default async function ClientHistoryPage() {
  const supabase = await createServerClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, client_id')
    .eq('id', session.user.id)
    .single()

  if (profile?.role !== 'client_rep') redirect('/login')
  if (!profile.client_id) {
    return (
      <div className="content anim-in">
        <div className="empty"><p>Nenhum cliente associado.</p></div>
      </div>
    )
  }

  const [clientRes, cyclesRes, allocationsRes] = await Promise.all([
    supabase.from('clients').select('name').eq('id', profile.client_id).single(),
    supabase.from('cycles').select('*').order('created_at', { ascending: false }),
    supabase.from('allocations').select('contractor_id').eq('client_id', profile.client_id),
  ])

  const clientName = clientRes.data?.name ?? ''
  const cycles = cyclesRes.data ?? []
  const contractorIds = [...new Set(allocationsRes.data?.map((a) => a.contractor_id) ?? [])]

  const { data: contractorProfiles } = contractorIds.length
    ? await supabase.from('profiles').select('id, full_name, email').in('id', contractorIds)
    : { data: [] }

  const profileMap = new Map((contractorProfiles ?? []).map((p) => [p.id, p]))

  type TeamRow = {
    contractorId: string; name: string; email: string
    myAvg: number | null; selfAvg: number | null; finalScoreVal: number | null
    selfDims: Record<DimensionKey, number> | null
    clientDims: Record<DimensionKey, number> | null
    selfDone: boolean; clientDone: boolean
    selfOpen: { strengths?: string; growth?: string; extra?: string } | null
    clientOpen: { strengths?: string; growth?: string; extra?: string } | null
  }

  const cycleTeamData: Record<string, TeamRow[]> = {}

  for (const cycle of cycles) {
    const rows: TeamRow[] = []

    for (const cId of contractorIds) {
      const p = profileMap.get(cId)
      const { data: reviews } = await supabase
        .from('reviews')
        .select('id, type, status, strengths, growth, extra')
        .eq('cycle_id', cycle.id)
        .eq('contractor_id', cId)

      const selfReview = reviews?.find((r) => r.type === 'self')
      const clientReview = reviews?.find((r) => r.type === 'client')

      let selfDims: Record<DimensionKey, number> | null = null
      let clientDims: Record<DimensionKey, number> | null = null
      let selfAvg: number | null = null
      let myAvg: number | null = null

      const reviewIds = [selfReview?.id, clientReview?.id].filter(Boolean) as string[]
      if (reviewIds.length > 0) {
        const { data: answers } = await supabase
          .from('review_answers')
          .select('review_id, score, form_questions(dimension)')
          .in('review_id', reviewIds)

        if (answers) {
          for (const entry of [{ review: selfReview, type: 'self' as const }, { review: clientReview, type: 'client' as const }]) {
            if (!entry.review) continue
            const rAnswers = answers.filter((a) => a.review_id === entry.review!.id)
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

            const avg = totalCount > 0 ? Math.round((totalSum / totalCount) * 100) / 100 : null
            if (entry.type === 'self') { selfDims = dims as Record<DimensionKey, number>; selfAvg = avg }
            else { clientDims = dims as Record<DimensionKey, number>; myAvg = avg }
          }
        }
      }

      rows.push({
        contractorId: cId,
        name: p?.full_name ?? '—',
        email: p?.email ?? '',
        myAvg, selfAvg,
        finalScoreVal: finalScore(selfAvg, myAvg),
        selfDims, clientDims,
        selfDone: selfReview?.status === 'submitted',
        clientDone: clientReview?.status === 'submitted',
        selfOpen: selfReview ? { strengths: selfReview.strengths ?? undefined, growth: selfReview.growth ?? undefined, extra: selfReview.extra ?? undefined } : null,
        clientOpen: clientReview ? { strengths: clientReview.strengths ?? undefined, growth: clientReview.growth ?? undefined, extra: clientReview.extra ?? undefined } : null,
      })
    }

    cycleTeamData[cycle.id] = rows
  }

  return (
    <ClientHistoryView
      clientName={clientName}
      cycles={cycles}
      cycleTeamData={cycleTeamData}
    />
  )
}
