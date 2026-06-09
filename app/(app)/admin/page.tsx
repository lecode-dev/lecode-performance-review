import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { AdminDashboardView } from '@/components/lecode/screens/AdminDashboardView'

export default async function AdminDashboard() {
  const supabase = await createServerClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', session.user.id).single()
  if (profile?.role !== 'lecode_admin') redirect('/login')

  const [cycles, contractors, clients] = await Promise.all([
    supabase.from('cycles').select('*').order('created_at', { ascending: false }).limit(5),
    supabase.from('contractors').select('id'),
    supabase.from('clients').select('id'),
  ])

  return (
    <AdminDashboardView
      cycles={cycles.data ?? []}
      contractorsCount={contractors.data?.length ?? 0}
      clientsCount={clients.data?.length ?? 0}
    />
  )
}
