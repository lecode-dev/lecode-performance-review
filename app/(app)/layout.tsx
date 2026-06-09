import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { AppShell } from '@/components/layout/AppShell'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createServerClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) redirect('/login')

  // Lê role diretamente do banco — fonte de verdade, não do JWT claim
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('role, full_name')
    .eq('id', session.user.id)
    .single()

  if (error || !profile) redirect('/login')

  return (
    <AppShell role={profile.role} fullName={profile.full_name}>
      {children}
    </AppShell>
  )
}
