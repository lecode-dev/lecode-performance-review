import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Clientes</h1>
        <p className="text-muted-foreground text-sm mt-1">Gerencie clientes, representantes e alocações</p>
      </div>

      {/* Criar cliente */}
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">Novo Cliente</CardTitle></CardHeader>
        <CardContent>
          <form action={createClient} className="flex flex-col sm:flex-row gap-4">
            <div className="space-y-1.5 flex-1">
              <Label>Nome</Label>
              <Input name="name" required placeholder="Acme Corp" />
            </div>
            <div className="space-y-1.5 flex-1">
              <Label>Slug</Label>
              <Input name="slug" required placeholder="acme" pattern="[a-z0-9\-]+" />
            </div>
            <div className="flex items-end">
              <Button type="submit">Criar</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Lista de clientes */}
      {clients.data?.map((client) => {
        const reps = allProfiles.data?.filter(
          (p) => p.role === 'client_rep' && p.client_id === client.id
        ) ?? []

        return (
          <Card key={client.id}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{client.name}</CardTitle>
              <p className="text-xs text-muted-foreground">/{client.slug}</p>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Representantes */}
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                  Representantes
                </p>
                {reps.length ? (
                  <ul className="text-sm space-y-1">
                    {reps.map((r) => <li key={r.id} className="text-foreground">{r.full_name} <span className="text-muted-foreground">({r.email})</span></li>)}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">Nenhum representante atribuído</p>
                )}
              </div>

              {/* Atribuir rep */}
              <form action={assignClientRep} className="flex flex-col sm:flex-row gap-2">
                <input type="hidden" name="client_id" value={client.id} />
                <select name="profile_id" required className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm">
                  <option value="">Selecionar perfil…</option>
                  {allProfiles.data
                    ?.filter((p) => p.role !== 'lecode_admin')
                    .map((p) => (
                      <option key={p.id} value={p.id}>{p.full_name} ({p.email})</option>
                    ))}
                </select>
                <Button type="submit" variant="outline" size="sm" className="shrink-0">
                  Atribuir como Rep
                </Button>
              </form>

              {/* Alocar contratado */}
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                  Alocar contratado
                </p>
                <form action={createAllocation} className="flex flex-col sm:flex-row gap-2">
                  <input type="hidden" name="client_id" value={client.id} />
                  <select name="contractor_id" required className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm">
                    <option value="">Selecionar contratado…</option>
                    {contractors.data?.map((c) => {
                      const p = (c.profiles as { full_name: string; email: string } | null)
                      return p ? <option key={c.id} value={c.id}>{p.full_name} ({p.email})</option> : null
                    })}
                  </select>
                  <Input type="date" name="started_on" required className="h-9 w-40 shrink-0" />
                  <Button type="submit" variant="outline" size="sm" className="shrink-0">Alocar</Button>
                </form>
              </div>
            </CardContent>
          </Card>
        )
      })}
      {!clients.data?.length && (
        <p className="text-sm text-muted-foreground text-center py-8">Nenhum cliente cadastrado.</p>
      )}
    </div>
  )
}
