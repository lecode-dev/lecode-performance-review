import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { AdminAccountsView } from '@/components/lecode/screens/AdminAccountsView'

export default async function AccountsPage() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'lecode_admin') redirect('/admin')

  const [profilesRes, clientsRes] = await Promise.all([
    supabase.from('profiles').select('id, full_name, email, role, client_id, created_at').order('created_at', { ascending: false }),
    supabase.from('clients').select('id, name').order('name'),
  ])

  const profiles = profilesRes.data ?? []
  const clients = clientsRes.data ?? []
  const clientMap = new Map(clients.map((c) => [c.id, c.name]))

  const accounts = profiles.map((p) => ({
    id: p.id,
    name: p.full_name,
    email: p.email,
    role: p.role as string,
    clientName: p.client_id ? clientMap.get(p.client_id) ?? null : null,
    createdAt: p.created_at,
  }))

  return (
    <AdminAccountsView
      accounts={accounts}
      clients={clients}
    />
  )
}
