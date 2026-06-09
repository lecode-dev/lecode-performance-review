import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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

  // Para cada ciclo aberto, busca progresso
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
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Ciclos de Avaliação</h1>
        <p className="text-muted-foreground text-sm mt-1">Crie e gerencie ciclos de performance review</p>
      </div>

      {/* Formulário de criação */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Novo Ciclo</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createCycle} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5 sm:col-span-3">
              <Label htmlFor="name">Nome do ciclo</Label>
              <Input id="name" name="name" required placeholder="Ex: Q3 2026" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="opens_at">Abertura</Label>
              <Input id="opens_at" name="opens_at" type="date" required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="closes_at">Encerramento</Label>
              <Input id="closes_at" name="closes_at" type="date" required />
            </div>
            <div className="flex items-end">
              <Button type="submit" className="w-full">Criar ciclo</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Lista de ciclos */}
      <div className="space-y-3">
        {cycles?.map((cycle) => {
          const progress = progressMap[cycle.id]
          const canClose = progress
            ? progress.total > 0 && progress.complete === progress.total
            : false

          return (
            <Card key={cycle.id}>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold">{cycle.name}</p>
                      <CycleBadge status={cycle.status} />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {cycle.opens_at} → {cycle.closes_at}
                    </p>

                    {progress && cycle.status === 'open' && (
                      <div className="mt-2">
                        <p className="text-xs text-muted-foreground mb-1">
                          Progresso: {progress.complete}/{progress.total} pares completos
                        </p>
                        <div className="h-1.5 w-48 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full transition-all"
                            style={{ width: progress.total ? `${(progress.complete / progress.total) * 100}%` : '0%' }}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {cycle.status === 'open' && (
                    <form action={closeCycle.bind(null, cycle.id)}>
                      <Button
                        type="submit"
                        variant="outline"
                        size="sm"
                        disabled={!canClose}
                        className="shrink-0"
                      >
                        Fechar ciclo
                      </Button>
                      {!canClose && progress && progress.total > 0 && (
                        <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1">
                          <AlertCircle size={10} />
                          Aguardando {progress.total - progress.complete} par(es)
                        </p>
                      )}
                    </form>
                  )}

                  {cycle.status === 'closed' && cycle.closed_at && (
                    <p className="text-xs text-muted-foreground shrink-0">
                      Fechado em {new Date(cycle.closed_at).toLocaleDateString('pt-BR')}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
        {!cycles?.length && (
          <p className="text-sm text-muted-foreground text-center py-8">Nenhum ciclo criado ainda.</p>
        )}
      </div>
    </div>
  )
}
