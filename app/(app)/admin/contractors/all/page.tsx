import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createServerClient } from '@/lib/supabase/server'
import { ScorePill } from '@/components/review/ScoreCard'
import { ExternalLink } from 'lucide-react'

export default async function ContractorsListPage() {
  const supabase = await createServerClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', session.user.id).single()
  if (profile?.role !== 'lecode_admin') redirect('/admin')

  const { data: contractors } = await supabase
    .from('contractors')
    .select('id, profiles(full_name, email)')
    .order('id')

  const { data: latestHistory } = await supabase
    .from('contractor_history')
    .select('contractor_id, final_score, cycles(name)')
    .order('created_at', { ascending: false })

  const latestByContractor = new Map<string, { final_score: number | null; cycleName: string }>()
  for (const h of latestHistory ?? []) {
    if (!latestByContractor.has(h.contractor_id)) {
      const cycle = (h.cycles as { name: string } | null)
      latestByContractor.set(h.contractor_id, { final_score: h.final_score, cycleName: cycle?.name ?? '' })
    }
  }

  return (
    <div className="content anim-in">
      <div className="page-head">
        <div className="eyebrow">Admin</div>
        <h2>Contratados</h2>
        <p>Todos os contratados registrados na plataforma.</p>
      </div>

      <div className="grid grid-3 stagger" style={{ gap: 12 }}>
        {contractors?.map((c) => {
          const p       = (c.profiles as { full_name: string; email: string } | null)
          const history = latestByContractor.get(c.id)

          return (
            <div key={c.id} className="card">
              <div className="card-pad">
                <div className="between" style={{ gap: 8 }}>
                  <div className="person" style={{ minWidth: 0, flex: 1 }}>
                    <div className="col" style={{ gap: 2, minWidth: 0 }}>
                      <span className="pn" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {p?.full_name}
                      </span>
                      <span className="muted" style={{ fontSize: 11.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {p?.email}
                      </span>
                    </div>
                  </div>
                  <Link href={`/admin/contractors/${c.id}`} className="icon-btn" title="Ver detalhes">
                    <ExternalLink size={14} />
                  </Link>
                </div>
                {history && (
                  <div className="row" style={{ gap: 8, marginTop: 12 }}>
                    <ScorePill score={history.final_score} />
                    <span className="mono muted" style={{ fontSize: 11.5 }}>{history.cycleName}</span>
                  </div>
                )}
              </div>
            </div>
          )
        })}
        {!contractors?.length && (
          <div className="empty" style={{ gridColumn: '1 / -1' }}>
            <p>Nenhum contratado cadastrado.</p>
          </div>
        )}
      </div>
    </div>
  )
}
