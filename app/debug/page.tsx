import { createServerClient } from '@/lib/supabase/server'

export default async function DebugPage() {
  const supabase = await createServerClient()
  const { data: { session } } = await supabase.auth.getSession()

  const profile = session
    ? await supabase.from('profiles').select('role, full_name').eq('id', session.user.id).single()
    : null

  return (
    <pre style={{ padding: 24, fontFamily: 'monospace', fontSize: 13, whiteSpace: 'pre-wrap' }}>
      {JSON.stringify({
        hasSession:   !!session,
        sessionRole:  session?.user?.app_metadata?.role ?? null,
        userId:       session?.user?.id ?? null,
        userEmail:    session?.user?.email ?? null,
        profileRole:  profile?.data?.role ?? null,
        profileName:  profile?.data?.full_name ?? null,
        profileError: profile?.error?.message ?? null,
      }, null, 2)}
    </pre>
  )
}
