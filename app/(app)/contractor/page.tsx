import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { ContractorHomeView } from '@/components/lecode/screens/ContractorHomeView'

export default async function ContractorDashboard() {
  const supabase = await createServerClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name, client_id')
    .eq('id', session.user.id)
    .single()

  if (profile?.role !== 'contractor') redirect('/login')

  const { data: cycle } = await supabase
    .from('cycles')
    .select('id, name, status, opens_at, closes_at, created_at, closed_at')
    .eq('status', 'open')
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  let selfDone = false
  if (cycle) {
    const { data: review } = await supabase
      .from('reviews')
      .select('status')
      .eq('cycle_id', cycle.id)
      .eq('author_id', session.user.id)
      .eq('type', 'self')
      .single()

    selfDone = review?.status === 'submitted'
  }

  let clientName: string | null = null
  const { data: alloc } = await supabase
    .from('allocations')
    .select('client_id, clients(name)')
    .eq('contractor_id', session.user.id)
    .is('ended_on', null)
    .limit(1)
    .single()

  if (alloc) {
    clientName = (alloc.clients as { name: string } | null)?.name ?? null
  }

  const { data: closedCycles } = await supabase
    .from('cycles')
    .select('id, name')
    .eq('status', 'closed')
    .order('created_at', { ascending: true })

  let series: { label: string; score: number }[] = []
  let lastScore: number | null = null
  if (closedCycles?.length) {
    const { data: history } = await supabase
      .from('contractor_history')
      .select('cycle_id, final_score')
      .eq('contractor_id', session.user.id)
      .not('final_score', 'is', null)

    if (history) {
      const scoreMap = new Map(history.map((h) => [h.cycle_id, h.final_score!]))
      series = closedCycles
        .filter((c) => scoreMap.has(c.id))
        .map((c) => ({ label: c.name, score: scoreMap.get(c.id)! }))

      if (series.length > 0) {
        lastScore = series[series.length - 1].score
      }
    }
  }

  const lastClosedName = closedCycles?.length ? closedCycles[closedCycles.length - 1].name : null

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
