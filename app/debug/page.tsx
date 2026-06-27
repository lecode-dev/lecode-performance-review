import { createServerClient } from '@/lib/supabase/server'

export default async function DebugPage() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  const profile = user
    ? await supabase.from('profiles').select('role, full_name').eq('id', user.id).single()
    : null

  return (
    <pre style={{ padding: 24, fontFamily: 'monospace', fontSize: 13, whiteSpace: 'pre-wrap' }}>
      {JSON.stringify({
        hasUser:      !!user,
        userRole:     user?.app_metadata?.role ?? null,
        userId:       user?.id ?? null,
        userEmail:    user?.email ?? null,
        profileRole:  profile?.data?.role ?? null,
        profileName:  profile?.data?.full_name ?? null,
        profileError: profile?.error?.message ?? null,
      }, null, 2)}
    </pre>
  )
}
