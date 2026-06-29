import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { AdminContractorsView } from '@/components/lecode/screens/AdminContractorsView'

export default async function ContractorsListPage() {
  const supabase = await createServerClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', session.user.id).single()
  if (profile?.role !== 'lecode_admin') redirect('/admin')

  const [contractorsRes, allocationsRes, clientsRes, cyclesRes] = await Promise.all([
    supabase.from('contractors').select('id, seniority, track, profiles(full_name, email)').order('id'),
    supabase.from('allocations').select('contractor_id, client_id').is('ended_on', null),
    supabase.from('clients').select('id, name').order('name'),
    supabase.from('cycles').select('id, name, status').eq('status', 'closed').order('created_at', { ascending: false }).limit(1),
  ])

  const contractors = contractorsRes.data ?? []
  const allocations = allocationsRes.data ?? []
  const clients = clientsRes.data ?? []
  const lastClosed = cyclesRes.data?.[0] ?? null

  const allocMap = new Map(allocations.map((a) => [a.contractor_id, a.client_id]))
  const clientMap = new Map(clients.map((c) => [c.id, c.name]))

  let scoreMap: Record<string, number> = {}
  if (lastClosed) {
    const { data: history } = await supabase
      .from('contractor_history')
      .select('contractor_id, final_score')
      .eq('cycle_id', lastClosed.id)
      .not('final_score', 'is', null)

    scoreMap = Object.fromEntries((history ?? []).map((h) => [h.contractor_id, h.final_score!]))
  }

  const { data: allProfiles } = await supabase.from('profiles').select('id, role').in('id', contractors.map(c => c.id))
  const roleMap = new Map((allProfiles ?? []).map(p => [p.id, p.role]))

  const list = contractors
    .filter((c) => roleMap.get(c.id) === 'contractor')
    .map((c) => {
      const p = c.profiles as { full_name: string; email: string } | null
      const clientId = allocMap.get(c.id)
      return {
        id: c.id,
        name: p?.full_name ?? '—',
        email: p?.email ?? '',
        seniority: c.seniority,
        track: c.track,
        clientName: clientId ? clientMap.get(clientId) ?? null : null,
        score: scoreMap[c.id] ?? null,
      }
    })

  return (
    <AdminContractorsView
      contractors={list}
      lastCycleLabel={lastClosed?.name ?? null}
      clients={clients}
    />
  )
}
