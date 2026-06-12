import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
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

  const { data: cycle } = await supabase
    .from('cycles')
    .select('id, name')
    .eq('status', 'open')
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  let formVersion = null
  let questions: {id: string; dimension: DimensionKey; text: string; order_index: number; applies_to: string}[] = []

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
    <div className="content anim-in">
      <div className="col" style={{ gap: 24, maxWidth: 860 }}>
        <div className="page-head">
          <div className="eyebrow">Admin</div>
          <h2>Formulário de Avaliação</h2>
          <p>{cycle ? `Ciclo ativo: ${cycle.name}` : 'Nenhum ciclo aberto. Crie um ciclo primeiro.'}</p>
        </div>

        {!cycle && (
          <div className="card card-pad" style={{ borderColor: 'var(--warning)' }}>
            <p style={{ fontSize: 13 }}>Crie um ciclo aberto para gerenciar o formulário.</p>
          </div>
        )}

        {formVersion && (
          <>
            <div className="card">
              <div className="card-head"><h3>Pesos do Score Final</h3></div>
              <div className="card-pad">
                <form action={updateWeights} className="row" style={{ gap: 14, alignItems: 'flex-end', flexWrap: 'wrap' }}>
                  <input type="hidden" name="form_version_id" value={formVersion.id} />
                  <div className="field">
                    <label>Auto-avaliação (0–1)</label>
                    <input
                      name="self_weight"
                      type="number"
                      step="0.05"
                      min="0"
                      max="1"
                      defaultValue={formVersion.self_weight}
                      className="input"
                      style={{ width: 120 }}
                    />
                  </div>
                  <div className="field">
                    <label>Cliente (0–1)</label>
                    <input
                      name="client_weight"
                      type="number"
                      step="0.05"
                      min="0"
                      max="1"
                      defaultValue={formVersion.client_weight}
                      className="input"
                      style={{ width: 120 }}
                    />
                  </div>
                  <button type="submit" className="btn btn-sm" style={{ height: 40 }}>Salvar pesos</button>
                </form>
                <p className="muted" style={{ fontSize: 12, marginTop: 8 }}>
                  Atual: Self {Math.round(formVersion.self_weight * 100)}% · Cliente {Math.round(formVersion.client_weight * 100)}% (devem somar 100%)
                </p>
              </div>
            </div>

            <div className="card">
              <div className="card-head"><h3>Adicionar Pergunta</h3></div>
              <div className="card-pad">
                <form action={addQuestion} className="col" style={{ gap: 14 }}>
                  <input type="hidden" name="form_version_id" value={formVersion.id} />
                  <div className="field">
                    <label>Texto da pergunta</label>
                    <input name="text" required className="input" placeholder="Ex: O contratado cumpre os prazos acordados?" />
                  </div>
                  <div className="grid grid-3" style={{ gap: 14 }}>
                    <div className="field">
                      <label>Dimensão</label>
                      <select name="dimension" required className="input">
                        {DIMENSIONS.map((d) => (
                          <option key={d} value={d}>{DIMENSION_LABELS[d]}</option>
                        ))}
                      </select>
                    </div>
                    <div className="field">
                      <label>Tipo</label>
                      <select name="applies_to" required className="input">
                        <option value="self">Auto-avaliação</option>
                        <option value="client">Cliente</option>
                      </select>
                    </div>
                    <div className="field">
                      <label>Ordem</label>
                      <input name="order_index" type="number" min="1" defaultValue="1" className="input" />
                    </div>
                  </div>
                  <div>
                    <button type="submit" className="btn btn-primary">Adicionar pergunta</button>
                  </div>
                </form>
              </div>
            </div>

            {DIMENSIONS.map((dim) => {
              const dimQs = questions.filter((q) => q.dimension === dim)
              if (!dimQs.length) return null
              return (
                <div key={dim} className="card">
                  <div className="card-head"><h3>{DIMENSION_LABELS[dim]}</h3></div>
                  <div className="card-pad col" style={{ gap: 0 }}>
                    {dimQs.map((q) => (
                      <div key={q.id} className="between" style={{ padding: '10px 0', borderBottom: '1px solid var(--border)', gap: 12 }}>
                        <span className={q.applies_to === 'self' ? 'badge' : 'badge badge-done'} style={{ flexShrink: 0 }}>
                          {q.applies_to === 'self' ? 'Self' : 'Cliente'}
                        </span>
                        <p style={{ fontSize: 13, flex: 1 }}>{q.text}</p>
                        <span className="mono muted" style={{ fontSize: 12, flexShrink: 0 }}>#{q.order_index}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </>
        )}
      </div>
    </div>
  )
}
