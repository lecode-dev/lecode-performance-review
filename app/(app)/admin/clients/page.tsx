import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { AdminClientsView } from '@/components/lecode/screens/AdminClientsView'

export default async function ClientsPage() {
  const supabase = await createServerClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', session.user.id).single()
  if (profile?.role !== 'lecode_admin') redirect('/admin')

  const [clientsRes, allocationsRes, profilesRes] = await Promise.all([
    supabase.from('clients').select('*').order('name'),
    supabase.from('allocations').select('contractor_id, client_id').is('ended_on', null),
    supabase.from('profiles').select('id, full_name, email, role, client_id').order('full_name'),
  ])

  const clients = clientsRes.data ?? []
  const allocations = allocationsRes.data ?? []
  const profiles = profilesRes.data ?? []

  const clientList = clients.map((c) => {
    const reps = profiles.filter((p) => p.role === 'client_rep' && p.client_id === c.id)
    const teamIds = allocations.filter((a) => a.client_id === c.id).map((a) => a.contractor_id)
    const team = profiles.filter((p) => teamIds.includes(p.id)).map((p) => ({ name: p.full_name }))

    return {
      id: c.id,
      name: c.name,
      slug: c.slug,
      industry: c.industry ?? null,
      repName: reps[0]?.full_name ?? null,
      teamCount: team.length,
      teamNames: team.slice(0, 5).map((t) => t.name),
    }
  })

  return <AdminClientsView clients={clientList} />
}
