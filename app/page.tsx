import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import type { UserRole } from '@/lib/supabase/types'

export default async function RootPage() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const role = user.app_metadata?.role as UserRole | undefined

  switch (role) {
    case 'lecode_admin': redirect('/admin')
    case 'client_rep':   redirect('/client/team')
    case 'contractor':   redirect('/contractor')
    default: {
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
      if (profile?.role === 'lecode_admin') redirect('/admin')
      if (profile?.role === 'client_rep')   redirect('/client/team')
      redirect('/contractor')
    }
  }
}
