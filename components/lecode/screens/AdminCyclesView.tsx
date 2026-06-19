'use client'

import { useState } from 'react'
import { useLang } from '@/lib/i18n'
import { useConfirm } from '@/components/lecode/ConfirmDialog'
import { lastDayOfMonth } from '@/lib/domain'
import { Icon } from '@/components/lecode/Icon'
import { Modal } from '@/components/lecode/Modal'
import { CycleBadge, PhaseBadge, CyclePhases } from '@/components/lecode/Cycle'
import { Progress } from '@/components/lecode/Stat'
import { Badge } from '@/components/lecode/Badge'
import { createCycle, closeCycle } from '@/app/(app)/admin/cycles/actions'
import type { Database } from '@/lib/supabase/types'

type Cycle = Database['public']['Tables']['cycles']['Row']

interface AdminCyclesViewProps {
  cycles: Cycle[]
  progressMap: Record<string, { done: number; total: number; pct: number }>
}

function fmtBR(iso: string): string {
  const [, m, d] = iso.slice(0, 10).split('-')
  return `${d}/${m}`
}

export function AdminCyclesView({ cycles, progressMap }: AdminCyclesViewProps) {
  const { t } = useLang()
  const confirm = useConfirm()
  const [openModal, setOpenModal] = useState(false)
  const hasActive = cycles.some((c) => c.status === 'open')

  const askClose = async (cy: Cycle) => {
    const ok = await confirm({
      icon: 'lock', tone: 'danger',
      title: `${t('Encerrar ciclo')} ${cy.name}?`,
      message: t('Os scores finais serão consolidados e as avaliações cruzadas (autoavaliação ↔ cliente) ficarão visíveis para todas as partes. Nenhuma avaliação poderá ser alterada após o encerramento.'),
      detail: t('Esta ação é definitiva e não pode ser desfeita.'),
      confirmLabel: t('Encerrar ciclo'), cancelLabel: t('Cancelar'),
    })
    if (ok) closeCycle(cy.id)
  }

  return (
    <div className="content anim-in">
      <div className="page-head between" style={{ alignItems: 'flex-end' }}>
        <div>
          <div className="eyebrow">{t('Avaliações')}</div>
          <h2>{t('Ciclos de avaliação')}</h2>
          <p>{t('Abra janelas de avaliação e encerre-as quando todas as avaliações estiverem concluídas.')}</p>
        </div>
        <button className="btn btn-primary" disabled={hasActive} onClick={() => setOpenModal(true)}>
          <Icon name="plus" size={16} />{t('Abrir ciclo')}
        </button>
      </div>

      {hasActive && (
        <div className="callout" style={{ marginBottom: 16 }}>
          <Icon name="info" />
          {t('Já existe um ciclo em andamento')} ({cycles.find((c) => c.status === 'open')?.name}). {t('Encerre-o antes de abrir um novo.')}
        </div>
      )}

      <div className="col" style={{ gap: 14 }}>
        {cycles.map((cy) => {
          const prog = progressMap[cy.id] ?? { done: 0, total: 0, pct: 0 }
          const canClose = cy.status === 'open' && prog.total > 0 && prog.done === prog.total
          return (
            <div className="card card-pad" key={cy.id}>
              <div className="between" style={{ alignItems: 'flex-start' }}>
                <div className="row" style={{ gap: 14 }}>
                  <span style={{ width: 46, height: 46, borderRadius: 12, background: 'var(--accent-soft)', color: 'var(--accent-ink)', display: 'grid', placeItems: 'center' }}>
                    <Icon name="calendar" size={22} />
                  </span>
                  <div className="col">
                    <div className="row" style={{ gap: 10 }}>
                      <span style={{ fontWeight: 600, fontSize: 16 }}>{cy.name}</span>
                      <CycleBadge status={cy.status} />
                      <PhaseBadge cycle={cy} />
                    </div>
                    <span className="muted" style={{ fontSize: 12.5 }}>{cy.opens_at} → {cy.closes_at}</span>
                  </div>
                </div>
                {cy.status === 'open' && (
                  <button className="btn btn-primary btn-sm" disabled={!canClose} onClick={() => askClose(cy)}
                    title={canClose ? '' : t('Todas as avaliações precisam estar concluídas')}>
                    <Icon name="lock" size={15} />{t('Encerrar ciclo')}
                  </button>
                )}
              </div>
              <div className="divider" />
              <div style={{ marginBottom: 16 }}><CyclePhases cycle={cy} /></div>
              <div className="row" style={{ gap: 20 }}>
                <div style={{ flex: 1 }}>
                  <div className="between" style={{ marginBottom: 6 }}>
                    <span className="muted" style={{ fontSize: 12 }}>{t('Progresso das avaliações')}</span>
                    <span className="mono" style={{ fontSize: 12.5, fontWeight: 600 }}>
                      {prog.done}/{prog.total} · {prog.pct}%
                    </span>
                  </div>
                  <Progress pct={prog.pct} />
                </div>
                {cy.status === 'open' && !canClose && prog.total > 0 && (
                  <Badge kind="pending"><Icon name="warning" size={13} />{prog.total - prog.done} {t('pendentes')}</Badge>
                )}
                {cy.status === 'open' && canClose && (
                  <Badge kind="done"><Icon name="check" size={13} />{t('Pronto para encerrar')}</Badge>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {openModal && <OpenCycleModal onClose={() => setOpenModal(false)} />}
    </div>
  )
}

function OpenCycleModal({ onClose }: { onClose: () => void }) {
  const { t } = useLang()
  const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
  const [month, setMonth] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 2).padStart(2, '0')}`
  })

  const start = `${month}-01`
  const submitEnd = `${month}-15`
  const end = lastDayOfMonth(start)
  const [y, m] = month.split('-').map(Number)
  const label = `${MONTHS[m - 1]}/${y}`

  const handleCreate = async () => {
    const fd = new FormData()
    fd.set('name', label)
    fd.set('opens_at', start)
    fd.set('closes_at', end)
    await createCycle(fd)
    onClose()
  }

  return (
    <Modal title={t('Abrir ciclo de avaliação')} onClose={onClose}
      footer={<>
        <button className="btn btn-ghost" onClick={onClose}>{t('Cancelar')}</button>
        <button className="btn btn-primary" disabled={!month} onClick={handleCreate}>
          <Icon name="cycle" size={16} />{t('Abrir ciclo')}
        </button>
      </>}>
      <div className="col" style={{ gap: 16 }}>
        <div className="field">
          <label>{t('Mês do ciclo')}</label>
          <input className="input" type="month" value={month} onChange={(e) => setMonth(e.target.value)} />
        </div>
        <div className="grid grid-2" style={{ gap: 14 }}>
          <div className="card card-pad" style={{ padding: 14 }}>
            <div className="row" style={{ gap: 8, marginBottom: 8 }}>
              <Icon name="form" size={15} className="muted" />
              <span style={{ fontSize: 12.5, fontWeight: 600 }}>{t('Janela de envio')}</span>
            </div>
            <div className="mono" style={{ fontSize: 14, fontWeight: 600 }}>{fmtBR(start)} – {fmtBR(submitEnd)}</div>
            <div className="muted" style={{ fontSize: 11.5, marginTop: 2 }}>2 {t('semanas')}</div>
          </div>
          <div className="card card-pad" style={{ padding: 14 }}>
            <div className="row" style={{ gap: 8, marginBottom: 8 }}>
              <Icon name="trend" size={15} className="muted" />
              <span style={{ fontSize: 12.5, fontWeight: 600 }}>{t('Apuração e discussão')}</span>
            </div>
            <div className="mono" style={{ fontSize: 14, fontWeight: 600 }}>{fmtBR(submitEnd)} – {fmtBR(end)}</div>
            <div className="muted" style={{ fontSize: 11.5, marginTop: 2 }}>2 {t('semanas')}</div>
          </div>
        </div>
        <div className="callout">
          <Icon name="info" />{t('Envio das respostas (2 semanas) · apuração e discussão com clientes (2 semanas).')}
        </div>
      </div>
    </Modal>
  )
}
