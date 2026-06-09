// Supabase Auth Hook — injeta profiles.role em app_metadata.role
// Configurar em: Dashboard → Auth → Hooks → "Custom Access Token"
// Trigger: cada emissão de JWT
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface HookPayload {
  event: string
  user_id?: string
  record?: { id: string }
  user?: { id: string }
}

Deno.serve(async (req: Request) => {
  const payload: HookPayload = await req.json()
  const userId = payload.user_id ?? payload.record?.id ?? payload.user?.id

  if (!userId) {
    return new Response(JSON.stringify({ error: 'No user id in payload' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { auth: { persistSession: false } }
  )

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single()

  if (error && error.code !== 'PGRST116') {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const role = profile?.role ?? 'contractor'

  const { error: updateError } = await supabase.auth.admin.updateUserById(userId, {
    app_metadata: { role },
  })

  if (updateError) {
    return new Response(JSON.stringify({ error: updateError.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  return new Response(JSON.stringify({ role }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
})
