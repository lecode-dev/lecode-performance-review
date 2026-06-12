import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { createServerClient } from '@/lib/supabase/server'
import { ScoreCard, ScorePill } from '@/components/review/ScoreCard'
import { ArrowLeft } from 'lucide-react'

interface Props {
  params: Promise<{ id: string }>
}

export default async function ContractorDetailPage({ params }: Props) {
  const { id } = await params

  const supabase = await createServerClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/login')

  const { data: admin } = await supabase.from('profiles').select('role').eq('id', session.user.id).single()
  if (admin?.role !== 'lecode_admin') redirect('/admin')

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, email, role, client_id')
    .eq('id', id)
    .single()

  if (!profile) notFound()

  const { data: contractor } = await supabase
    .from('contractors')
    .select('github_handle, skills')
    .eq('id', id)
    .single()

  const { data: allocations } = await supabase
    .from('allocations')
    .select('id, started_on, ended_on, clients(name)')
    .eq('contractor_id', id)
    .order('started_on', { ascending: false })

  const { data: history } = await supabase
    .from('contractor_history')
    .select('*, cycles(name, status)')
    .eq('contractor_id', id)
    .order('created_at', { ascending: false })

  return (
    <div className="content anim-in">
    <div className="col" style={{ gap: 20, maxWidth: 720 }}>
      <div className="page-head">
        <Link href="/admin/contractors" className="btn btn-ghost btn-sm" style={{ display: 'inline-flex', marginBottom: 8 }}>
          <ArrowLeft size={14} /> Voltar
        </Link>
        <h2>{profile.full_name}</h2>
        <p>{profile.email}</p>
      </div>

      <div className="grid grid-2" style={{ gap: 12 }}>
        <div className="card">
          <div className="card-head"><h3>Dados</h3></div>
          <div className="card-pad col" style={{ gap: 10 }}>
            <Row label="Role"   value={profile.role} />
            <Row label="GitHub" value={contractor?.github_handle ?? '—'} />
            <Row label="Skills" value={contractor?.skills?.join(', ') ?? '—'} />
          </div>
        </div>

        <div className="card">
          <div className="card-head"><h3>Alocações</h3></div>
          <div className="card-pad">
            {allocations?.length ? (
              <div className="col" style={{ gap: 8 }}>
                {allocations.map((a) => {
                  const client = (a.clients as { name: string } | null)
                  return (
                    <div key={a.id} className="between" style={{ fontSize: 13 }}>
                      <span>{client?.name ?? '—'}</span>
                      <span className="mono muted" style={{ fontSize: 11.5 }}>
                        {a.started_on} → {a.ended_on ?? 'atual'}
                      </span>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="muted" style={{ fontSize: 13 }}>Sem alocações.</p>
            )}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-head"><h3>Histórico de Scores</h3></div>
        <div className="card-pad">
          {history?.length ? (
            <div className="col" style={{ gap: 0 }}>
              {history.map((h) => {
                const cycle = (h.cycles as { name: string; status: string } | null)
                return (
                  <div key={h.id} className="between" style={{ padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
                    <div className="col" style={{ gap: 2 }}>
                      <span style={{ fontWeight: 500, fontSize: 13.5 }}>{cycle?.name}</span>
                      <span className="muted" style={{ fontSize: 12 }}>
                        Self: {h.self_avg?.toFixed(2) ?? '—'} · Cliente: {h.client_avg?.toFixed(2) ?? '—'}
                      </span>
                    </div>
                    <ScorePill score={h.final_score} />
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="muted" style={{ fontSize: 13 }}>Nenhum ciclo fechado ainda.</p>
          )}
        </div>
      </div>
    </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="between" style={{ fontSize: 13 }}>
      <span className="muted">{label}</span>
      <span style={{ fontWeight: 500 }}>{value}</span>
    </div>
  )
}
