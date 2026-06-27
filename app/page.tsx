import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import type { UserRole } from '@/lib/supabase/types'

export default async function RootPage() {
  const supabase = await createServerClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) redirect('/login')

  const role = session.user.app_metadata?.role as UserRole | undefined

  switch (role) {
    case 'lecode_admin': redirect('/admin')
    case 'client_rep':   redirect('/client/team')
    case 'contractor':   redirect('/contractor')
    default: {
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', session.user.id).single()
      if (profile?.role === 'lecode_admin') redirect('/admin')
      if (profile?.role === 'client_rep')   redirect('/client/team')
      redirect('/contractor')
    }
  }
}
