import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { ClientTeamView } from '@/components/lecode/screens/ClientTeamView'
import { midMonth, fmt } from '@/lib/domain'

export default async function ClientTeamPage() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, client_id, full_name')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'client_rep') redirect('/login')
  if (!profile.client_id) {
    return (
      <div className="content anim-in">
        <div className="empty">
          <p>Você não está associado a nenhum cliente.</p>
          <p className="muted" style={{ fontSize: 13, marginTop: 4 }}>Solicite ao admin LeCode que atribua seu cliente.</p>
        </div>
      </div>
    )
  }

  const [clientRes, cycleRes, allocationsRes] = await Promise.all([
    supabase.from('clients').select('name, slug, industry').eq('id', profile.client_id).single(),
    supabase.from('cycles').select('id, name, status, opens_at, closes_at, created_at, closed_at').eq('status', 'open').order('created_at', { ascending: false }).limit(1).single(),
    supabase.from('allocations').select('contractor_id').eq('client_id', profile.client_id).is('ended_on', null),
  ])

  const clientName = clientRes.data?.name ?? ''
  const clientIndustry = clientRes.data?.industry ?? null
  const cycle = cycleRes.data ?? null
  const contractorIds = allocationsRes.data?.map((a) => a.contractor_id) ?? []

  const [profilesRes, contractorsRes] = await Promise.all([
    contractorIds.length
      ? supabase.from('profiles').select('id, full_name, email').in('id', contractorIds)
      : Promise.resolve({ data: [] as { id: string; full_name: string; email: string }[] }),
    contractorIds.length
      ? supabase.from('contractors').select('id, seniority, track').in('id', contractorIds)
      : Promise.resolve({ data: [] as { id: string; seniority: string; track: string }[] }),
  ])

  const contractorProfiles = profilesRes.data ?? []
  const contractorsData = contractorsRes.data ?? []
  const contractorMap = new Map(contractorsData.map((c) => [c.id, c]))

  type TeamMember = {
    id: string; name: string; email: string; seniority: string; track: string
    myStatus: string; selfStatus: string; myScore: string | null
  }

  const team: TeamMember[] = []

  if (cycle && contractorIds.length) {
    const [myReviewsRes, selfReviewsRes] = await Promise.all([
      supabase.from('reviews').select('id, contractor_id, status').eq('cycle_id', cycle.id).eq('author_id', user.id).eq('type', 'client'),
      supabase.from('reviews').select('contractor_id, status').eq('cycle_id', cycle.id).eq('type', 'self').in('contractor_id', contractorIds),
    ])

    const myMap = new Map((myReviewsRes.data ?? []).map((r) => [r.contractor_id, r]))
    const selfMap = new Map((selfReviewsRes.data ?? []).map((r) => [r.contractor_id, r.status]))

    const submittedReviewIds = (myReviewsRes.data ?? [])
      .filter((r) => r.status === 'submitted')
      .map((r) => r.id)

    let scoreMap: Record<string, number> = {}
    if (submittedReviewIds.length > 0) {
      const { data: answers } = await supabase
        .from('review_answers')
        .select('review_id, score')
        .in('review_id', submittedReviewIds)

      if (answers) {
        const byReview: Record<string, number[]> = {}
        for (const a of answers) {
          if (!byReview[a.review_id]) byReview[a.review_id] = []
          byReview[a.review_id].push(a.score)
        }
        for (const r of myReviewsRes.data ?? []) {
          if (r.status === 'submitted' && byReview[r.id]?.length) {
            const scores = byReview[r.id]
            scoreMap[r.contractor_id] = scores.reduce((a, b) => a + b, 0) / scores.length
          }
        }
      }
    }

    for (const cId of contractorIds) {
      const p = contractorProfiles.find((p) => p.id === cId)
      const c = contractorMap.get(cId)
      const myReview = myMap.get(cId)
      team.push({
        id: cId,
        name: p?.full_name ?? '—',
        email: p?.email ?? '',
        seniority: c?.seniority ?? 'Pleno',
        track: c?.track ?? 'Dev',
        myStatus: myReview?.status ?? 'not_started',
        selfStatus: selfMap.get(cId) ?? 'not_started',
        myScore: scoreMap[cId] != null ? fmt(scoreMap[cId]) : null,
      })
    }
  } else {
    for (const cId of contractorIds) {
      const p = contractorProfiles.find((p) => p.id === cId)
      const c = contractorMap.get(cId)
      team.push({
        id: cId, name: p?.full_name ?? '—', email: p?.email ?? '',
        seniority: c?.seniority ?? 'Pleno', track: c?.track ?? 'Dev',
        myStatus: 'no_cycle', selfStatus: 'no_cycle', myScore: null,
      })
    }
  }

  const submitEnd = cycle ? midMonth(cycle.opens_at) : null

  return (
    <ClientTeamView
      clientName={clientName}
      clientIndustry={clientIndustry}
      cycle={cycle}
      submitEnd={submitEnd}
      team={team}
      myDoneCount={team.filter((t) => t.myStatus === 'submitted').length}
    />
  )
}
