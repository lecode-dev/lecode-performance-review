import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { AppShell } from '@/components/layout/AppShell'

async function getNavBadges(
  supabase: Awaited<ReturnType<typeof createServerClient>>,
  role: string,
  userId: string,
  clientId: string | null,
): Promise<Record<string, string | number>> {
  const badges: Record<string, string | number> = {}

  if (role === 'lecode_admin') {
    const [contractorsRes, cycleRes] = await Promise.all([
      supabase.from('contractors').select('id', { count: 'exact', head: true }),
      supabase.from('cycles').select('id').eq('status', 'open').limit(1),
    ])
    if (contractorsRes.count) badges['/admin/contractors'] = contractorsRes.count
    if (cycleRes.data?.length) badges['/admin/cycles'] = '•'
  } else if (role === 'client_rep' && clientId) {
    const [cycleRes, allocsRes] = await Promise.all([
      supabase.from('cycles').select('id').eq('status', 'open').limit(1).single(),
      supabase.from('allocations').select('contractor_id').eq('client_id', clientId).is('ended_on', null),
    ])
    const cycle = cycleRes.data
    const contractorIds = allocsRes.data?.map((a) => a.contractor_id) ?? []
    if (cycle && contractorIds.length) {
      const { data: myReviews } = await supabase.from('reviews').select('contractor_id')
        .eq('cycle_id', cycle.id).eq('author_id', userId).eq('type', 'client').eq('status', 'submitted')
      const doneIds = new Set(myReviews?.map((r) => r.contractor_id) ?? [])
      const pending = contractorIds.filter((id) => !doneIds.has(id)).length
      if (pending > 0) badges['/client/team'] = pending
    }
  } else if (role === 'contractor') {
    const { data: cycle } = await supabase.from('cycles').select('id').eq('status', 'open').limit(1).single()
    if (cycle) {
      const { data: selfReview } = await supabase.from('reviews').select('status')
        .eq('cycle_id', cycle.id).eq('contractor_id', userId).eq('type', 'self').limit(1).single()
      if (!selfReview || selfReview.status !== 'submitted') badges['/contractor/self-review'] = '•'
    }
  }

  return badges
}

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createServerClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) redirect('/login')

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('role, full_name, client_id')
    .eq('id', session.user.id)
    .single()

  if (error || !profile) redirect('/login')

  const [badges, clientName] = await Promise.all([
    getNavBadges(supabase, profile.role, session.user.id, profile.client_id),
    profile.role === 'client_rep' && profile.client_id
      ? supabase.from('clients').select('name').eq('id', profile.client_id).single().then(r => r.data?.name ?? null)
      : Promise.resolve(null),
  ])

  return (
    <AppShell role={profile.role} fullName={profile.full_name} badges={badges} clientName={clientName}>
      {children}
    </AppShell>
  )
}
