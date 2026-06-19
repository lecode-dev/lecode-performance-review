import { redirect, notFound } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { ContractorDetailView } from '@/components/lecode/screens/ContractorDetailView'
import { finalScore } from '@/lib/domain'
import type { DimensionKey } from '@/lib/supabase/types'

interface Props {
  params: Promise<{ id: string }>
}

export default async function ContractorDetailPage({ params }: Props) {
  const { id } = await params

  const supabase = await createServerClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/login')

  const { data: adminProfile } = await supabase.from('profiles').select('role, full_name').eq('id', session.user.id).single()
  if (adminProfile?.role !== 'lecode_admin') redirect('/admin')

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, email, role, client_id')
    .eq('id', id)
    .single()

  if (!profile) notFound()

  const [contractorRes, allocationsRes, cyclesRes, clientsRes, changelogRes] = await Promise.all([
    supabase.from('contractors').select('seniority, track, since').eq('id', id).single(),
    supabase.from('allocations').select('id, started_on, ended_on, client_id, clients(name)').eq('contractor_id', id).order('started_on', { ascending: false }),
    supabase.from('cycles').select('*').order('created_at', { ascending: false }),
    supabase.from('clients').select('id, name').order('name'),
    supabase.from('contractor_changelog').select('*').eq('contractor_id', id).order('changed_at', { ascending: false }),
  ])

  const contractor = contractorRes.data
  const currentAlloc = allocationsRes.data?.find((a) => !a.ended_on)
  const currentClientName = currentAlloc ? (currentAlloc.clients as { name: string } | null)?.name ?? null : null

  const cycles = cyclesRes.data ?? []
  const clients = clientsRes.data ?? []

  const cycleData: Record<string, {
    selfAvg: number | null; clientAvg: number | null; finalScore: number | null
    selfDims: Record<DimensionKey, number> | null; clientDims: Record<DimensionKey, number> | null
    selfDone: boolean; clientDone: boolean
    selfOpen: { strengths?: string; growth?: string; extra?: string } | null
    clientOpen: { strengths?: string; growth?: string; extra?: string } | null
    clientName: string | null
  }> = {}

  for (const cycle of cycles) {
    const { data: reviews } = await supabase
      .from('reviews')
      .select('id, type, status, strengths, growth, extra')
      .eq('cycle_id', cycle.id)
      .eq('contractor_id', id)

    const selfReview = reviews?.find((r) => r.type === 'self')
    const clientReview = reviews?.find((r) => r.type === 'client')

    let selfDims: Record<DimensionKey, number> | null = null
    let clientDims: Record<DimensionKey, number> | null = null
    let selfAvg: number | null = null
    let clientAvg: number | null = null

    const reviewIds = [selfReview?.id, clientReview?.id].filter(Boolean) as string[]
    if (reviewIds.length > 0) {
      const { data: answers } = await supabase
        .from('review_answers')
        .select('review_id, score, form_questions(dimension)')
        .in('review_id', reviewIds)

      if (answers) {
        for (const reviewEntry of [{ review: selfReview, type: 'self' as const }, { review: clientReview, type: 'client' as const }]) {
          if (!reviewEntry.review) continue
          const rAnswers = answers.filter((a) => a.review_id === reviewEntry.review!.id)
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

          if (reviewEntry.type === 'self') {
            selfDims = dims as Record<DimensionKey, number>
            selfAvg = totalCount > 0 ? Math.round((totalSum / totalCount) * 100) / 100 : null
          } else {
            clientDims = dims as Record<DimensionKey, number>
            clientAvg = totalCount > 0 ? Math.round((totalSum / totalCount) * 100) / 100 : null
          }
        }
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
      clientName: currentClientName,
    }
  }

  return (
    <ContractorDetailView
      contractorId={id}
      name={profile.full_name}
      email={profile.email}
      role={profile.role}
      seniority={contractor?.seniority ?? 'Pleno'}
      track={contractor?.track ?? 'Dev'}
      since={contractor?.since ?? null}
      currentClientName={currentClientName}
      cycles={cycles}
      cycleData={cycleData}
      clients={clients}
      adminName={adminProfile.full_name}
      allocations={(allocationsRes.data ?? []).map((a) => ({
        id: a.id,
        startedOn: a.started_on,
        endedOn: a.ended_on,
        clientName: (a.clients as { name: string } | null)?.name ?? '—',
      }))}
      changelog={(changelogRes.data ?? []).map((h) => ({
        id: h.id,
        field: h.field,
        from: h.old_value ?? '',
        to: h.new_value ?? '',
        note: h.note ?? null,
        at: h.changed_at,
        by: h.changed_by ?? '',
      }))}
    />
  )
}
