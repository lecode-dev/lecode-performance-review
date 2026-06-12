import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { createClient, assignClientRep, createAllocation } from './actions'

export default async function ClientsPage() {
  const supabase = await createServerClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', session.user.id).single()
  if (profile?.role !== 'lecode_admin') redirect('/admin')

  const [clients, contractors, allProfiles] = await Promise.all([
    supabase.from('clients').select('*').order('name'),
    supabase.from('contractors')
      .select('id, profiles(full_name, email)')
      .order('id'),
    supabase.from('profiles').select('id, full_name, email, role, client_id').order('full_name'),
  ])

  return (
    <div className="content anim-in">
      <div className="col" style={{ gap: 24, maxWidth: 860 }}>
        <div className="page-head">
          <div className="eyebrow">Admin</div>
          <h2>Clientes</h2>
          <p>Gerencie clientes, representantes e alocações de contratados.</p>
        </div>

        <div className="card">
          <div className="card-head"><h3>Novo Cliente</h3></div>
          <div className="card-pad">
            <form action={createClient} className="grid" style={{ gridTemplateColumns: '1fr 1fr auto', gap: 14, alignItems: 'end' }}>
              <div className="field">
                <label>Nome</label>
                <input name="name" required className="input" placeholder="Acme Corp" />
              </div>
              <div className="field">
                <label>Slug</label>
                <input name="slug" required className="input" placeholder="acme" pattern="[a-z0-9\-]+" />
              </div>
              <button type="submit" className="btn btn-primary" style={{ height: 40 }}>Criar</button>
            </form>
          </div>
        </div>

        {clients.data?.map((client) => {
          const reps = allProfiles.data?.filter(
            (p) => p.role === 'client_rep' && p.client_id === client.id
          ) ?? []

          return (
            <div key={client.id} className="card">
              <div className="card-head">
                <h3 style={{ marginBottom: 2 }}>{client.name}</h3>
                <span className="muted" style={{ fontSize: 12 }}>/{client.slug}</span>
              </div>
              <div className="card-pad col" style={{ gap: 20 }}>
                <div>
                  <p className="muted" style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600, marginBottom: 8 }}>
                    Representantes
                  </p>
                  {reps.length ? (
                    <div className="col" style={{ gap: 4 }}>
                      {reps.map((r) => (
                        <div key={r.id} style={{ fontSize: 13 }}>
                          {r.full_name} <span className="muted">({r.email})</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="muted" style={{ fontSize: 13 }}>Nenhum representante atribuído</p>
                  )}
                </div>

                <div>
                  <p className="muted" style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600, marginBottom: 8 }}>
                    Atribuir representante
                  </p>
                  <form action={assignClientRep} className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
                    <input type="hidden" name="client_id" value={client.id} />
                    <select name="profile_id" required className="input" style={{ flex: 1, minWidth: 200 }}>
                      <option value="">Selecionar perfil…</option>
                      {allProfiles.data
                        ?.filter((p) => p.role !== 'lecode_admin')
                        .map((p) => (
                          <option key={p.id} value={p.id}>{p.full_name} ({p.email})</option>
                        ))}
                    </select>
                    <button type="submit" className="btn btn-sm">Atribuir como Rep</button>
                  </form>
                </div>

                <div>
                  <p className="muted" style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600, marginBottom: 8 }}>
                    Alocar contratado
                  </p>
                  <form action={createAllocation} className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
                    <input type="hidden" name="client_id" value={client.id} />
                    <select name="contractor_id" required className="input" style={{ flex: 1, minWidth: 200 }}>
                      <option value="">Selecionar contratado…</option>
                      {contractors.data?.map((c) => {
                        const p = (c.profiles as { full_name: string; email: string } | null)
                        return p ? <option key={c.id} value={c.id}>{p.full_name} ({p.email})</option> : null
                      })}
                    </select>
                    <input type="date" name="started_on" required className="input" style={{ width: 160 }} />
                    <button type="submit" className="btn btn-sm">Alocar</button>
                  </form>
                </div>
              </div>
            </div>
          )
        })}
        {!clients.data?.length && (
          <div className="empty">
            <p>Nenhum cliente cadastrado.</p>
          </div>
        )}
      </div>
    </div>
  )
}
