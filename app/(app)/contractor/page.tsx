import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { ContractorHomeView } from '@/components/lecode/screens/ContractorHomeView'

export default async function ContractorDashboard() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name, client_id')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'contractor') redirect('/login')

  const [cycleRes, allocRes, closedCyclesRes, historyRes] = await Promise.all([
    supabase
      .from('cycles')
      .select('id, name, status, opens_at, closes_at, created_at, closed_at')
      .eq('status', 'open')
      .order('created_at', { ascending: false })
      .limit(1)
      .single(),
    supabase
      .from('allocations')
      .select('client_id, clients(name)')
      .eq('contractor_id', user.id)
      .is('ended_on', null)
      .limit(1)
      .single(),
    supabase
      .from('cycles')
      .select('id, name')
      .eq('status', 'closed')
      .order('created_at', { ascending: true }),
    supabase
      .from('contractor_history')
      .select('cycle_id, final_score')
      .eq('contractor_id', user.id)
      .not('final_score', 'is', null),
  ])

  const cycle = cycleRes.data
  const clientName = (allocRes.data?.clients as { name: string } | null)?.name ?? null
  const closedCycles = closedCyclesRes.data ?? []

  let selfDone = false
  if (cycle) {
    const { data: review } = await supabase
      .from('reviews')
      .select('status')
      .eq('cycle_id', cycle.id)
      .eq('author_id', user.id)
      .eq('type', 'self')
      .single()
    selfDone = review?.status === 'submitted'
  }

  let series: { label: string; score: number }[] = []
  let lastScore: number | null = null
  if (closedCycles.length && historyRes.data) {
    const scoreMap = new Map(historyRes.data.map((h) => [h.cycle_id, h.final_score!]))
    series = closedCycles
      .filter((c) => scoreMap.has(c.id))
      .map((c) => ({ label: c.name, score: scoreMap.get(c.id)! }))
    if (series.length > 0) lastScore = series[series.length - 1].score
  }

  const lastClosedName = closedCycles.length ? closedCycles[closedCycles.length - 1].name : null

  return (
    <ContractorHomeView
      name={profile.full_name}
      role="Contratado LeCode"
      clientName={clientName}
      cycle={cycle}
      selfDone={selfDone}
      series={series}
      lastScore={lastScore}
      lastCycleName={lastClosedName}
    />
  )
}
