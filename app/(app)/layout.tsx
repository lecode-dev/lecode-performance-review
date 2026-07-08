import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { cachedProfile, cachedNavBadges, cachedClientName } from '@/lib/supabase/cached'
import { AppShell } from '@/components/layout/AppShell'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createServerClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) redirect('/login')

  const profile = await cachedProfile(session.user.id)
  if (!profile) redirect('/login')

  const [badges, clientName] = await Promise.all([
    cachedNavBadges(profile.role, session.user.id, profile.client_id),
    profile.role === 'client_rep' && profile.client_id
      ? cachedClientName(profile.client_id)
      : Promise.resolve(null),
  ])

  return (
    <AppShell role={profile.role} fullName={profile.full_name} badges={badges} clientName={clientName}>
      {children}
    </AppShell>
  )
}
