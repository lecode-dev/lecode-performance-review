import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createServerClient } from '@/lib/supabase/server'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ReviewBadge, CycleBadge } from '@/components/review/StatusBadge'
import { ClipboardList } from 'lucide-react'

export default async function ClientTeamPage() {
  const supabase = await createServerClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, client_id, full_name')
    .eq('id', session.user.id)
    .single()

  if (profile?.role !== 'client_rep') redirect('/login')
  if (!profile.client_id) {
    return (
      <div className="py-12 text-center">
        <p className="text-muted-foreground">Você não está associado a nenhum cliente.</p>
        <p className="text-sm text-muted-foreground mt-1">Solicite ao admin LeCode que atribua seu cliente.</p>
      </div>
    )
  }

  // Ciclo aberto
  const { data: cycle } = await supabase
    .from('cycles')
    .select('id, name, status, closes_at')
    .eq('status', 'open')
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  // Alocações ativas — apenas IDs
  const { data: allocations } = await supabase
    .from('allocations')
    .select('contractor_id')
    .eq('client_id', profile.client_id)
    .is('ended_on', null)

  const contractorIds = allocations?.map((a) => a.contractor_id) ?? []

  // Perfis dos contratados (query separada — allocations não tem FK direto a profiles)
  const { data: contractorProfiles } = contractorIds.length
    ? await supabase.from('profiles').select('id, full_name, email').in('id', contractorIds)
    : { data: [] }

  const profileMap = new Map(contractorProfiles?.map((p) => [p.id, p]) ?? [])

  // Reviews do cliente neste ciclo
  const reviewMap: Record<string, { status: string; id: string }> = {}
  if (cycle && contractorIds.length) {
    const { data: reviews } = await supabase
      .from('reviews')
      .select('id, contractor_id, status')
      .eq('cycle_id', cycle.id)
      .eq('author_id', session.user.id)
      .eq('type', 'client')

    for (const r of reviews ?? []) {
      reviewMap[r.contractor_id] = { status: r.status, id: r.id }
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Meu Time</h1>
        {cycle ? (
          <div className="flex items-center gap-2 mt-1">
            <p className="text-muted-foreground text-sm">Ciclo: {cycle.name}</p>
            <CycleBadge status={cycle.status} />
            <p className="text-muted-foreground text-xs">· prazo: {cycle.closes_at}</p>
          </div>
        ) : (
          <p className="text-muted-foreground text-sm mt-1">Nenhum ciclo aberto no momento.</p>
        )}
      </div>

      {!contractorIds.length ? (
        <p className="text-sm text-muted-foreground py-8 text-center">
          Nenhum contratado alocado ao seu cliente.
        </p>
      ) : (
        <div className="space-y-3">
          {contractorIds.map((contractorId) => {
            const p      = profileMap.get(contractorId)
            const review = reviewMap[contractorId] ?? null

            return (
              <Card key={contractorId}>
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <p className="font-medium truncate">{p?.full_name ?? '—'}</p>
                      <p className="text-xs text-muted-foreground truncate">{p?.email ?? '—'}</p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <ReviewBadge status={review?.status as 'draft' | 'submitted' ?? 'not_started'} />
                      {cycle && review?.status !== 'submitted' && (
                        <Link href={`/client/team/${contractorId}/evaluate`}>
                          <Button size="sm" variant={review ? 'outline' : 'default'} className="gap-2">
                            <ClipboardList size={14} />
                            {review ? 'Continuar' : 'Avaliar'}
                          </Button>
                        </Link>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
