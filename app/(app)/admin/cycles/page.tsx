import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { AdminCyclesView } from '@/components/lecode/screens/AdminCyclesView'

export default async function CyclesPage() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'lecode_admin') redirect('/admin')

  const { data: cycles } = await supabase
    .from('cycles')
    .select('id, name, status, opens_at, closes_at, created_at, closed_at')
    .order('created_at', { ascending: false })

  const progressMap: Record<string, { done: number; total: number; pct: number }> = {}
  if (cycles && cycles.length > 0) {
    const cycleIds = cycles.map((c) => c.id)
    const { data: allReviews } = await supabase
      .from('reviews')
      .select('cycle_id, status')
      .in('cycle_id', cycleIds)

    if (allReviews) {
      for (const cycle of cycles) {
        const reviews = allReviews.filter((r) => r.cycle_id === cycle.id)
        const total = reviews.length
        const done = reviews.filter((r) => r.status === 'submitted').length
        progressMap[cycle.id] = { done, total, pct: total > 0 ? Math.round((done / total) * 100) : 0 }
      }
    }
  }

  return (
    <AdminCyclesView
      cycles={cycles ?? []}
      progressMap={progressMap}
    />
  )
}
