import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createServerClient } from '@/lib/supabase/server'
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
      <div className="content anim-in">
        <div className="empty">
          <p>Você não está associado a nenhum cliente.</p>
          <p className="muted" style={{ fontSize: 13, marginTop: 4 }}>Solicite ao admin LeCode que atribua seu cliente.</p>
        </div>
      </div>
    )
  }

  const { data: cycle } = await supabase
    .from('cycles')
    .select('id, name, status, closes_at')
    .eq('status', 'open')
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  const { data: allocations } = await supabase
    .from('allocations')
    .select('contractor_id')
    .eq('client_id', profile.client_id)
    .is('ended_on', null)

  const contractorIds = allocations?.map((a) => a.contractor_id) ?? []

  const { data: contractorProfiles } = contractorIds.length
    ? await supabase.from('profiles').select('id, full_name, email').in('id', contractorIds)
    : { data: [] }

  const profileMap = new Map(contractorProfiles?.map((p) => [p.id, p]) ?? [])

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
    <div className="content anim-in">
      <div className="col" style={{ gap: 24, maxWidth: 720 }}>
        <div className="page-head">
          <div className="eyebrow">Representante</div>
          <h2>Meu Time</h2>
          {cycle ? (
            <div className="row" style={{ gap: 8, marginTop: 4 }}>
              <p style={{ margin: 0 }}>Ciclo: {cycle.name} · prazo: {cycle.closes_at}</p>
              <CycleBadge status={cycle.status} />
            </div>
          ) : (
            <p>Nenhum ciclo aberto no momento.</p>
          )}
        </div>

        {!contractorIds.length ? (
          <div className="empty">
            <p>Nenhum contratado alocado ao seu cliente.</p>
          </div>
        ) : (
          <div className="col" style={{ gap: 10 }}>
            {contractorIds.map((contractorId) => {
              const p      = profileMap.get(contractorId)
              const review = reviewMap[contractorId] ?? null

              return (
                <div key={contractorId} className="card">
                  <div className="card-pad between" style={{ gap: 16 }}>
                    <div className="col" style={{ gap: 2, minWidth: 0, flex: 1 }}>
                      <span style={{ fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {p?.full_name ?? '—'}
                      </span>
                      <span className="muted" style={{ fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {p?.email ?? '—'}
                      </span>
                    </div>
                    <div className="row" style={{ gap: 10, flexShrink: 0 }}>
                      <ReviewBadge status={review?.status as 'draft' | 'submitted' ?? 'not_started'} />
                      {cycle && review?.status !== 'submitted' && (
                        <Link
                          href={`/client/team/${contractorId}/evaluate`}
                          className={review ? 'btn btn-sm' : 'btn btn-primary btn-sm'}
                          style={{ display: 'inline-flex', gap: 6 }}
                        >
                          <ClipboardList size={13} />
                          {review ? 'Continuar' : 'Avaliar'}
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
