import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { AdminDashboardView } from '@/components/lecode/screens/AdminDashboardView'

export default async function AdminDashboard() {
  const supabase = await createServerClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role, full_name').eq('id', session.user.id).single()
  if (profile?.role !== 'lecode_admin') redirect('/login')

  const [cyclesRes, contractorsRes, clientsRes, allocationsRes] = await Promise.all([
    supabase.from('cycles').select('id, name, status, opens_at, closes_at, created_at, closed_at').order('created_at', { ascending: false }),
    supabase.from('contractors').select('id'),
    supabase.from('clients').select('id, name').order('name'),
    supabase.from('allocations').select('contractor_id, client_id').is('ended_on', null),
  ])

  const cycles = cyclesRes.data ?? []
  const contractors = contractorsRes.data ?? []
  const clients = clientsRes.data ?? []
  const allocations = allocationsRes.data ?? []

  const activeCycle = cycles.find((c) => c.status === 'open') ?? null
  const lastClosed = cycles.find((c) => c.status === 'closed') ?? null

  let cycleProgress = { done: 0, total: 0, pct: 0 }
  const clientProgress: { clientId: string; name: string; done: number; total: number }[] = []

  if (activeCycle) {
    const { data: reviews } = await supabase
      .from('reviews')
      .select('contractor_id, type, status')
      .eq('cycle_id', activeCycle.id)

    if (reviews) {
      const contractorIds = [...new Set(reviews.map((r) => r.contractor_id))]
      const total = contractorIds.length * 2
      const done = reviews.filter((r) => r.status === 'submitted').length
      cycleProgress = { done, total, pct: total > 0 ? Math.round((done / total) * 100) : 0 }

      for (const cl of clients) {
        const clContractors = allocations.filter((a) => a.client_id === cl.id).map((a) => a.contractor_id)
        const clReviews = reviews.filter((r) => clContractors.includes(r.contractor_id))
        const clTotal = clReviews.length
        const clDone = clReviews.filter((r) => r.status === 'submitted').length
        if (clTotal > 0) {
          clientProgress.push({ clientId: cl.id, name: cl.name, done: clDone, total: clTotal })
        }
      }
    }
  }

  let decisions: { contractorId: string; name: string; role: string; clientName: string | null; score: number }[] = []
  if (lastClosed) {
    const { data: history } = await supabase
      .from('contractor_history')
      .select('contractor_id, final_score')
      .eq('cycle_id', lastClosed.id)
      .not('final_score', 'is', null)
      .order('final_score', { ascending: true })

    if (history) {
      const ids = history.map((h) => h.contractor_id)
      const { data: profiles } = ids.length
        ? await supabase.from('profiles').select('id, full_name, email').in('id', ids)
        : { data: [] }

      const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]))
      const allocMap = new Map(allocations.map((a) => [a.contractor_id, a.client_id]))
      const clientMap = new Map(clients.map((c) => [c.id, c.name]))

      decisions = history.map((h) => {
        const p = profileMap.get(h.contractor_id)
        const clientId = allocMap.get(h.contractor_id)
        return {
          contractorId: h.contractor_id,
          name: p?.full_name ?? '—',
          role: p?.email ?? '',
          clientName: clientId ? clientMap.get(clientId) ?? null : null,
          score: h.final_score!,
        }
      })
    }
  }

  const activeContractors = allocations.length
  const unallocated = contractors.length - new Set(allocations.map((a) => a.contractor_id)).size

  return (
    <AdminDashboardView
      adminName={profile.full_name.split(' ')[0]}
      activeCycle={activeCycle}
      lastClosed={lastClosed}
      cycleProgress={cycleProgress}
      clientProgress={clientProgress}
      decisions={decisions}
      activeContractors={activeContractors}
      clientsCount={clients.length}
      unallocated={unallocated}
    />
  )
}
