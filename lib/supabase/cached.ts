import { unstable_cache } from 'next/cache'
import { createAdminClient } from './server'

/**
 * Perfil do usuário — cache de 5 min.
 * Invalidado por revalidateTag(`profile:${userId}`) quando o perfil muda.
 */
export function cachedProfile(userId: string) {
  return unstable_cache(
    async () => {
      const admin = createAdminClient()
      const { data } = await admin
        .from('profiles')
        .select('role, full_name, client_id')
        .eq('id', userId)
        .single()
      return data
    },
    ['profile', userId],
    { revalidate: 300, tags: [`profile:${userId}`] },
  )()
}

/**
 * Badges de navegação (contadores/pontos no sidebar) — cache de 30 s.
 * Invalidado por revalidateTag(`nav-badges:${userId}`) ao submeter avaliação.
 */
export function cachedNavBadges(
  role: string,
  userId: string,
  clientId: string | null,
) {
  return unstable_cache(
    async () => {
      const admin = createAdminClient()
      const badges: Record<string, string | number> = {}

      if (role === 'lecode_admin') {
        const [contractorsRes, cycleRes] = await Promise.all([
          admin.from('contractors').select('id', { count: 'exact', head: true }),
          admin.from('cycles').select('id').eq('status', 'open').limit(1),
        ])
        if (contractorsRes.count) badges['/admin/contractors'] = contractorsRes.count
        if (cycleRes.data?.length) badges['/admin/cycles'] = '•'
      } else if (role === 'client_rep' && clientId) {
        // Paralelo: ciclo aberto + contratados alocados ao cliente
        const [cycleRes, allocsRes] = await Promise.all([
          admin.from('cycles').select('id').eq('status', 'open').limit(1).single(),
          admin.from('allocations').select('contractor_id').eq('client_id', clientId).is('ended_on', null),
        ])
        const cycle = cycleRes.data
        const contractorIds = allocsRes.data?.map((a) => a.contractor_id) ?? []
        if (cycle && contractorIds.length) {
          const { data: myReviews } = await admin
            .from('reviews')
            .select('contractor_id')
            .eq('cycle_id', cycle.id)
            .eq('author_id', userId)
            .eq('type', 'client')
            .eq('status', 'submitted')
          const doneIds = new Set(myReviews?.map((r) => r.contractor_id) ?? [])
          const pending = contractorIds.filter((id) => !doneIds.has(id)).length
          if (pending > 0) badges['/client/team'] = pending
        }
      } else if (role === 'contractor') {
        const { data: cycle } = await admin
          .from('cycles').select('id').eq('status', 'open').limit(1).single()
        if (cycle) {
          const { data: selfReview } = await admin
            .from('reviews').select('status')
            .eq('cycle_id', cycle.id).eq('contractor_id', userId)
            .eq('type', 'self').limit(1).single()
          if (!selfReview || selfReview.status !== 'submitted') {
            badges['/contractor/self-review'] = '•'
          }
        }
      }

      return badges
    },
    ['nav-badges', userId, role],
    { revalidate: 30, tags: [`nav-badges:${userId}`] },
  )()
}

/**
 * Nome do cliente — cache de 5 min.
 * Clientes raramente mudam de nome.
 */
export function cachedClientName(clientId: string) {
  return unstable_cache(
    async () => {
      const admin = createAdminClient()
      const { data } = await admin.from('clients').select('name').eq('id', clientId).single()
      return data?.name ?? null
    },
    ['client-name', clientId],
    { revalidate: 300, tags: [`client:${clientId}`] },
  )()
}
