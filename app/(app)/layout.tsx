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
    const { data: cycle } = await supabase.from('cycles').select('id').eq('status', 'open').limit(1).single()
    if (cycle) {
      const { data: allocs } = await supabase.from('allocations').select('contractor_id').eq('client_id', clientId).is('ended_on', null)
      const contractorIds = allocs?.map((a) => a.contractor_id) ?? []
      if (contractorIds.length) {
        const { data: myReviews } = await supabase.from('reviews').select('contractor_id')
          .eq('cycle_id', cycle.id).eq('author_id', userId).eq('type', 'client').eq('status', 'submitted')
        const doneIds = new Set(myReviews?.map((r) => r.contractor_id) ?? [])
        const pending = contractorIds.filter((id) => !doneIds.has(id)).length
        if (pending > 0) badges['/client/team'] = pending
      }
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

  const badges = await getNavBadges(supabase, profile.role, session.user.id, profile.client_id)

  return (
    <AppShell role={profile.role} fullName={profile.full_name} badges={badges}>
      {children}
    </AppShell>
  )
}
