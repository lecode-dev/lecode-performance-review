import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { AdminCyclesView } from '@/components/lecode/screens/AdminCyclesView'

export default async function CyclesPage() {
  const supabase = await createServerClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', session.user.id).single()
  if (profile?.role !== 'lecode_admin') redirect('/admin')

  const { data: cycles } = await supabase
    .from('cycles')
    .select('*')
    .order('created_at', { ascending: false })

  const progressMap: Record<string, { done: number; total: number; pct: number }> = {}
  if (cycles) {
    for (const cycle of cycles) {
      const { data: reviews } = await supabase
        .from('reviews')
        .select('contractor_id, type, status')
        .eq('cycle_id', cycle.id)

      if (!reviews) continue

      const total = reviews.length
      const done = reviews.filter((r) => r.status === 'submitted').length
      progressMap[cycle.id] = { done, total, pct: total > 0 ? Math.round((done / total) * 100) : 0 }
    }
  }

  return (
    <AdminCyclesView
      cycles={cycles ?? []}
      progressMap={progressMap}
    />
  )
}
