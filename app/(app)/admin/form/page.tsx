import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { DIMENSION_LABELS } from '@/lib/supabase/types'
import { addQuestion, updateWeights } from './actions'
import type { DimensionKey } from '@/lib/supabase/types'

const DIMENSIONS: DimensionKey[] = ['tech', 'delivery', 'comm', 'collab', 'autonomy']

export default async function FormPage() {
  const supabase = await createServerClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', session.user.id).single()
  if (profile?.role !== 'lecode_admin') redirect('/admin')

  // Busca ciclo aberto mais recente
  const { data: cycle } = await supabase
    .from('cycles')
    .select('id, name')
    .eq('status', 'open')
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  let formVersion = null
  let questions:   {id: string; dimension: DimensionKey; text: string; order_index: number; applies_to: string}[] = []

  if (cycle) {
    const { data: fv } = await supabase
      .from('form_versions')
      .select('*')
      .eq('cycle_id', cycle.id)
      .single()

    formVersion = fv

    if (fv) {
      const { data: qs } = await supabase
        .from('form_questions')
        .select('id, dimension, text, order_index, applies_to')
        .eq('form_version_id', fv.id)
        .order('dimension')
        .order('applies_to')
        .order('order_index')

      questions = qs ?? []
    }
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Formulário de Avaliação</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {cycle ? `Ciclo ativo: ${cycle.name}` : 'Nenhum ciclo aberto. Crie um ciclo primeiro.'}
        </p>
      </div>

      {!cycle && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Crie um ciclo aberto para gerenciar o formulário.
        </div>
      )}

      {formVersion && (
        <>
          {/* Pesos */}
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">Pesos do Score Final</CardTitle></CardHeader>
            <CardContent>
              <form action={updateWeights} className="flex flex-col sm:flex-row gap-4 items-end">
                <input type="hidden" name="form_version_id" value={formVersion.id} />
                <div className="space-y-1.5">
                  <Label>Auto-avaliação (%)</Label>
                  <Input
                    name="self_weight"
                    type="number"
                    step="0.05"
                    min="0"
                    max="1"
                    defaultValue={formVersion.self_weight}
                    className="w-28"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Cliente (%)</Label>
                  <Input
                    name="client_weight"
                    type="number"
                    step="0.05"
                    min="0"
                    max="1"
                    defaultValue={formVersion.client_weight}
                    className="w-28"
                  />
                </div>
                <Button type="submit" variant="outline">Salvar pesos</Button>
              </form>
              <p className="text-xs text-muted-foreground mt-2">
                Atual: Self {Math.round(formVersion.self_weight * 100)}% · Cliente {Math.round(formVersion.client_weight * 100)}% (devem somar 100%)
              </p>
            </CardContent>
          </Card>

          {/* Adicionar pergunta */}
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">Adicionar Pergunta</CardTitle></CardHeader>
            <CardContent>
              <form action={addQuestion} className="space-y-4">
                <input type="hidden" name="form_version_id" value={formVersion.id} />
                <div className="space-y-1.5">
                  <Label>Texto da pergunta</Label>
                  <Input name="text" required placeholder="Ex: O contratado cumpre os prazos acordados?" />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <Label>Dimensão</Label>
                    <select name="dimension" required className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm">
                      {DIMENSIONS.map((d) => (
                        <option key={d} value={d}>{DIMENSION_LABELS[d]}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Tipo</Label>
                    <select name="applies_to" required className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm">
                      <option value="self">Auto-avaliação</option>
                      <option value="client">Cliente</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Ordem</Label>
                    <Input name="order_index" type="number" min="1" defaultValue="1" />
                  </div>
                </div>
                <Button type="submit">Adicionar pergunta</Button>
              </form>
            </CardContent>
          </Card>

          {/* Perguntas existentes */}
          {DIMENSIONS.map((dim) => {
            const dimQs = questions.filter((q) => q.dimension === dim)
            if (!dimQs.length) return null
            return (
              <Card key={dim}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{DIMENSION_LABELS[dim]}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="divide-y divide-border">
                    {dimQs.map((q) => (
                      <div key={q.id} className="py-2.5 flex items-start gap-3">
                        <Badge variant="outline" className="shrink-0 mt-0.5 text-xs">
                          {q.applies_to === 'self' ? 'Self' : 'Cliente'}
                        </Badge>
                        <p className="text-sm flex-1">{q.text}</p>
                        <span className="text-xs text-muted-foreground shrink-0">#{q.order_index}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </>
      )}
    </div>
  )
}
