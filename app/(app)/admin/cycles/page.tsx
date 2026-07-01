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
    .select('id, name, status, opens_at, closes_at, created_at, closed_at')
    .order('created_at', { ascending: false })

  const progressMap: Record<string, { done: number; total: number; pct: number }> = {}
  if (cycles && cycles.length > 0) {
    const cycleIds = cycles.map((c) => c.id)

    const [reviewsRes, allocsRes] = await Promise.all([
      supabase.from('reviews').select('cycle_id, contractor_id, type, status').in('cycle_id', cycleIds),
      supabase.from('allocations').select('contractor_id').is('ended_on', null),
    ])
    const allReviews = reviewsRes.data ?? []
    const activeContractorIds = new Set((allocsRes.data ?? []).map((a) => a.contractor_id))

    for (const cycle of cycles) {
      const reviews = allReviews.filter((r) => r.cycle_id === cycle.id)
      const contractorIds = cycle.status === 'open' ? activeContractorIds : new Set(reviews.map((r) => r.contractor_id))
      const total = contractorIds.size
      const done = [...contractorIds].filter((cId) =>
        reviews.some((r) => r.contractor_id === cId && r.type === 'self'   && r.status === 'submitted') &&
        reviews.some((r) => r.contractor_id === cId && r.type === 'client' && r.status === 'submitted')
      ).length
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
