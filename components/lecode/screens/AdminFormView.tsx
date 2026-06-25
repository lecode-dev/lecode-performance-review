'use client'

import { useLang } from '@/lib/i18n'
import { DIMENSIONS, SCALE, OPEN_QUESTIONS } from '@/lib/domain'
import { Icon } from '@/components/lecode/Icon'
import { Badge } from '@/components/lecode/Badge'
import { useConfirm } from '@/components/lecode/ConfirmDialog'
import { addQuestion, updateWeights, removeQuestion } from '@/app/(app)/admin/form/actions'
import type { DimensionKey } from '@/lib/supabase/types'

interface Question {
  id: string
  dimension: DimensionKey
  text: string
  order_index: number
  applies_to: string
}

interface AdminFormViewProps {
  cycleName: string | null
  formVersionId: string | null
  selfWeight: number
  clientWeight: number
  questions: Question[]
}

export function AdminFormView({ cycleName, formVersionId, selfWeight, clientWeight, questions }: AdminFormViewProps) {
  const { t } = useLang()
  const confirm = useConfirm()

  if (!cycleName || !formVersionId) {
    return (
      <div className="content anim-in">
        <div className="page-head">
          <div className="eyebrow">{t('Configuração')}</div>
          <h2>{t('Formulário de avaliação')}</h2>
          <p>{t('Crie um ciclo aberto para gerenciar o formulário.')}</p>
        </div>
        <div className="callout"><Icon name="info" />{t('Nenhum ciclo em andamento. Abra um ciclo para editar o formulário.')}</div>
      </div>
    )
  }

  return (
    <div className="content anim-in">
      <div className="page-head between" style={{ alignItems: 'flex-end' }}>
        <div>
          <div className="eyebrow">{t('Configuração')}</div>
          <h2>{t('Formulário de avaliação')}</h2>
          <p>{t('O mesmo formulário é usado na auto-avaliação e na avaliação do cliente. Escala de 1 a 5 em cinco dimensões.')}</p>
        </div>
        <button className="btn btn-primary" type="submit" form="weights-form">
          <Icon name="check" size={16} />{t('Salvar formulário')}
        </button>
      </div>

      <div className="grid grid-2" style={{ marginBottom: 18 }}>
        <div className="card card-pad">
          <div className="row" style={{ gap: 10, marginBottom: 12 }}>
            <Icon name="trend" size={16} className="muted" />
            <span style={{ fontWeight: 600 }}>{t('Pesos do score final')}</span>
          </div>
          <form id="weights-form" action={updateWeights}>
            <input type="hidden" name="form_version_id" value={formVersionId} />
            <div className="row" style={{ gap: 12 }}>
              <div className="field" style={{ flex: 1 }}>
                <label>{t('Self review')}</label>
                <div className="row" style={{ gap: 8 }}>
                  <input name="self_weight" className="input" defaultValue={Math.round(selfWeight * 100)} style={{ width: 70 }} type="number" min="0" max="100" />
                  <span className="muted">%</span>
                </div>
              </div>
              <div className="field" style={{ flex: 1 }}>
                <label>{t('Review cliente')}</label>
                <div className="row" style={{ gap: 8 }}>
                  <input name="client_weight" className="input" defaultValue={Math.round(clientWeight * 100)} style={{ width: 70 }} type="number" min="0" max="100" />
                  <span className="muted">%</span>
                </div>
              </div>
            </div>
            <div className="mono muted" style={{ fontSize: 12, marginTop: 12 }}>
              {t('Score = self ×')} {selfWeight.toFixed(2)} + {t('cliente ×')} {clientWeight.toFixed(2)}
            </div>
          </form>
        </div>
        <div className="card card-pad">
          <div className="row" style={{ gap: 10, marginBottom: 12 }}>
            <Icon name="star" size={16} className="muted" />
            <span style={{ fontWeight: 600 }}>{t('Escala de notas')}</span>
          </div>
          <div className="col" style={{ gap: 7 }}>
            {SCALE.map((sc) => (
              <div key={sc.v} className="row" style={{ gap: 10 }}>
                <span className={`score-chip tier-${sc.v}`} style={{ minWidth: 30 }}>{sc.v}</span>
                <span style={{ fontSize: 13 }}>{t(sc.label)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="col" style={{ gap: 16 }}>
        {DIMENSIONS.map((d) => {
          const dimQs = questions.filter((q) => q.dimension === d.key).sort((a, b) => a.order_index - b.order_index)
          return (
            <div className="card" key={d.key}>
              <div className="card-head">
                <span style={{
                  width: 26, height: 26, borderRadius: 7, background: 'var(--accent-soft)', color: 'var(--accent-ink)',
                  display: 'grid', placeItems: 'center', fontFamily: 'var(--mono)', fontWeight: 600, fontSize: 13,
                }}>{d.n}</span>
                <div className="col" style={{ gap: 1 }}>
                  <h3>{t(d.label)}</h3>
                  <span className="sub">{t(d.desc)}</span>
                </div>
                <span style={{ marginLeft: 'auto' }}><Badge>{dimQs.length} {t('perguntas')}</Badge></span>
              </div>
              <div className="card-pad col" style={{ gap: 8 }}>
                {dimQs.map((q, i) => (
                  <div key={q.id} className="row" style={{ gap: 10, alignItems: 'flex-start' }}>
                    <span className="mono muted" style={{ fontSize: 11, paddingTop: 11 }}>{d.n}.{i + 1}</span>
                    <span className="input" style={{ flex: 1, display: 'block', padding: '8px 12px', fontSize: 13 }}>{q.text}</span>
                    <button className="icon-btn" title={t('Remover')} onClick={async () => {
                      const ok = await confirm({
                        icon: 'warning', tone: 'danger',
                        title: t('Remover pergunta?'),
                        message: t('A pergunta será removida do formulário de avaliação. Você pode adicioná-la novamente depois.'),
                        confirmLabel: t('Remover pergunta'), cancelLabel: t('Cancelar'),
                      })
                      if (ok) {
                        const fd = new FormData()
                        fd.set('question_id', q.id)
                        removeQuestion(fd)
                      }
                    }}><Icon name="x" size={16} /></button>
                  </div>
                ))}
                <form action={addQuestion} className="row" style={{ gap: 8, marginTop: 4 }}>
                  <input type="hidden" name="form_version_id" value={formVersionId} />
                  <input type="hidden" name="dimension" value={d.key} />
                  <input type="hidden" name="order_index" value={dimQs.length + 1} />
                  <input name="text" className="input" placeholder={t('Nova pergunta...')} style={{ flex: 1 }} required />
                  <button type="submit" className="btn btn-ghost btn-sm">
                    <Icon name="plus" size={15} />{t('Adicionar')}
                  </button>
                </form>
              </div>
            </div>
          )
        })}

        <div className="card">
          <div className="card-head">
            <Icon name="form" size={16} />
            <div className="col" style={{ gap: 1 }}>
              <h3>{t('Perguntas abertas')}</h3>
              <span className="sub">{t('Campos de texto livre ao final de cada avaliação. Aplicadas automaticamente.')}</span>
            </div>
            <span style={{ marginLeft: 'auto' }}><Badge>{OPEN_QUESTIONS.length} {t('perguntas')}</Badge></span>
          </div>
          <div className="card-pad col" style={{ gap: 10 }}>
            {OPEN_QUESTIONS.map((oq, i) => (
              <div key={oq.key} className="row" style={{ gap: 10, alignItems: 'flex-start' }}>
                <span className="mono muted" style={{ fontSize: 11, paddingTop: 11 }}>T.{i + 1}</span>
                <div style={{ flex: 1 }}>
                  <span className="input" style={{ display: 'block', padding: '8px 12px', fontSize: 13 }}>{t(oq.label)}</span>
                  <span className="muted" style={{ fontSize: 11.5, marginTop: 4, display: 'block' }}>{t(oq.hint)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
