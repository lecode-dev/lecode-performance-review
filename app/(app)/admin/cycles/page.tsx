import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { CycleBadge } from '@/components/review/StatusBadge'
import { createCycle, closeCycle } from './actions'
import { AlertCircle } from 'lucide-react'

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

  const progressMap: Record<string, { total: number; complete: number }> = {}
  if (cycles) {
    for (const cycle of cycles.filter((c) => c.status === 'open')) {
      const { data: reviews } = await supabase
        .from('reviews')
        .select('contractor_id, type, status')
        .eq('cycle_id', cycle.id)

      if (!reviews) continue

      const contractors = new Set(reviews.map((r) => r.contractor_id))
      const complete = [...contractors].filter((cId) => {
        const self   = reviews.find((r) => r.contractor_id === cId && r.type === 'self'   && r.status === 'submitted')
        const client = reviews.find((r) => r.contractor_id === cId && r.type === 'client' && r.status === 'submitted')
        return self && client
      })

      progressMap[cycle.id] = { total: contractors.size, complete: complete.length }
    }
  }

  return (
    <div className="content anim-in">
    <div className="col" style={{ gap: 24, maxWidth: 720 }}>
      <div className="page-head">
        <div className="eyebrow">Admin</div>
        <h2>Ciclos de Avaliação</h2>
        <p>Crie e gerencie os ciclos de performance review dos contratados.</p>
      </div>

      {/* Formulário de criação */}
      <div className="card">
        <div className="card-head">
          <h3>Novo Ciclo</h3>
        </div>
        <div className="card-pad">
          <form action={createCycle} className="grid" style={{ gridTemplateColumns: '1fr 1fr auto', gap: 14, alignItems: 'end' }}>
            <div className="field" style={{ gridColumn: '1 / -1' }}>
              <label htmlFor="name">Nome do ciclo</label>
              <input id="name" name="name" required className="input" placeholder="Ex: Q3 2026" />
            </div>
            <div className="field">
              <label htmlFor="opens_at">Abertura</label>
              <input id="opens_at" name="opens_at" type="date" required className="input" />
            </div>
            <div className="field">
              <label htmlFor="closes_at">Encerramento</label>
              <input id="closes_at" name="closes_at" type="date" required className="input" />
            </div>
            <button type="submit" className="btn btn-primary" style={{ height: 40 }}>Criar ciclo</button>
          </form>
        </div>
      </div>

      {/* Lista de ciclos */}
      <div className="col" style={{ gap: 10 }}>
        {cycles?.map((cycle) => {
          const progress = progressMap[cycle.id]
          const canClose = progress ? progress.total > 0 && progress.complete === progress.total : false

          return (
            <div key={cycle.id} className="card">
              <div className="card-pad">
                <div className="between">
                  <div className="col" style={{ gap: 4 }}>
                    <div className="row" style={{ gap: 8 }}>
                      <span style={{ fontWeight: 600, fontSize: 14 }}>{cycle.name}</span>
                      <CycleBadge status={cycle.status} />
                    </div>
                    <span className="mono muted" style={{ fontSize: 12 }}>
                      {cycle.opens_at} → {cycle.closes_at}
                    </span>

                    {progress && cycle.status === 'open' && (
                      <div className="col" style={{ gap: 4, marginTop: 6 }}>
                        <span className="muted" style={{ fontSize: 11.5 }}>
                          Progresso: {progress.complete}/{progress.total} pares completos
                        </span>
                        <div className="progress" style={{ width: 180 }}>
                          <span style={{ width: progress.total ? `${(progress.complete / progress.total) * 100}%` : '0%' }} />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="col" style={{ gap: 6, alignItems: 'flex-end' }}>
                    {cycle.status === 'open' && (
                      <form action={closeCycle.bind(null, cycle.id)}>
                        <button
                          type="submit"
                          className="btn btn-sm"
                          disabled={!canClose}
                        >
                          Fechar ciclo
                        </button>
                        {!canClose && progress && progress.total > 0 && (
                          <p className="muted" style={{ fontSize: 11, marginTop: 4, display: 'flex', gap: 4, alignItems: 'center' }}>
                            <AlertCircle size={10} />
                            Aguardando {progress.total - progress.complete} par(es)
                          </p>
                        )}
                      </form>
                    )}
                    {cycle.status === 'closed' && cycle.closed_at && (
                      <span className="muted" style={{ fontSize: 12 }}>
                        Fechado em {new Date(cycle.closed_at).toLocaleDateString('pt-BR')}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
        {!cycles?.length && (
          <div className="empty">
            <p>Nenhum ciclo criado ainda.</p>
          </div>
        )}
      </div>
    </div>
    </div>
  )
}
