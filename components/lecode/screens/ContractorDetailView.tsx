'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useLang } from '@/lib/i18n'
import { useConfirm } from '@/components/lecode/ConfirmDialog'
import { Icon } from '@/components/lecode/Icon'
import { Avatar } from '@/components/lecode/Avatar'
import { Badge } from '@/components/lecode/Badge'
import { CycleBadge } from '@/components/lecode/Cycle'
import { Modal } from '@/components/lecode/Modal'
import { ReviewDetail } from '@/components/review/ReviewDetail'
import { updateContractor, updateAllocation } from '@/app/(app)/admin/contractors/actions'
import type { Database, DimensionKey } from '@/lib/supabase/types'

type Cycle = Database['public']['Tables']['cycles']['Row']

interface CycleReviewData {
  selfAvg: number | null; clientAvg: number | null; finalScore: number | null
  selfDims: Record<DimensionKey, number> | null; clientDims: Record<DimensionKey, number> | null
  selfDone: boolean; clientDone: boolean
  selfOpen: { strengths?: string; growth?: string; extra?: string } | null
  clientOpen: { strengths?: string; growth?: string; extra?: string } | null
  clientName: string | null
}

interface ChangelogEntry {
  id: string; field: string; from: string; to: string; note: string | null; at: string; by: string
}

interface ContractorDetailViewProps {
  contractorId: string
  name: string; email: string; role: string
  seniority: string; track: string; since: string | null
  currentClientName: string | null
  cycles: Cycle[]
  cycleData: Record<string, CycleReviewData>
  clients: { id: string; name: string }[]
  adminName: string
  allocations: { id: string; startedOn: string; endedOn: string | null; clientName: string }[]
  changelog: ChangelogEntry[]
}

export function ContractorDetailView({
  contractorId, name, email, seniority, track, since,
  currentClientName, cycles, cycleData, clients, adminName, allocations, changelog,
}: ContractorDetailViewProps) {
  const { t } = useLang()
  const [cycleId, setCycleId] = useState(cycles[0]?.id ?? '')
  const [editOpen, setEditOpen] = useState(false)
  const [allocOpen, setAllocOpen] = useState(false)
  const cycle = cycles.find((c) => c.id === cycleId) ?? cycles[0]
  const data = cycleData[cycleId]

  return (
    <div className="content anim-in">
      <Link href="/admin/contractors/all" className="btn btn-ghost btn-sm" style={{ marginBottom: 14 }}>
        <Icon name="chevron" size={15} style={{ transform: 'rotate(180deg)' }} />{t('Contratados')}
      </Link>

      <div className="card card-pad" style={{ marginBottom: 18 }}>
        <div className="between" style={{ alignItems: 'flex-start' }}>
          <div className="row" style={{ gap: 14 }}>
            <Avatar person={{ name, role: email }} size="lg" />
            <div className="col">
              <h2 style={{ margin: 0, fontSize: 21 }}>{name}</h2>
              <span className="muted" style={{ fontSize: 13.5 }}>{email}</span>
              <div className="row wrap" style={{ gap: 8, marginTop: 8 }}>
                <Badge>{seniority} · {track}</Badge>
                <Badge dot>{currentClientName ?? t('Sem alocação')}</Badge>
                {since && <Badge>{t('desde')} {since}</Badge>}
              </div>
            </div>
          </div>
          <div className="row wrap" style={{ gap: 8 }}>
            <button className="btn btn-sm" onClick={() => setEditOpen(true)}>
              <Icon name="edit" size={15} />{t('Editar dados')}
            </button>
            <button className="btn btn-sm" onClick={() => setAllocOpen(true)}>
              <Icon name="link" size={15} />{currentClientName ? t('Realocar') : t('Vincular')}
            </button>
          </div>
        </div>
      </div>

      {cycles.length > 0 && (
        <>
          <div className="between" style={{ marginBottom: 14 }}>
            <div className="row wrap" style={{ gap: 6 }}>
              {cycles.map((cy) => (
                <button key={cy.id} className={'btn btn-sm ' + (cy.id === cycleId ? 'btn-primary' : '')}
                  onClick={() => setCycleId(cy.id)}>
                  {cy.name} {cy.status === 'open' && '·'}
                </button>
              ))}
            </div>
            {cycle && <CycleBadge status={cycle.status} />}
          </div>

          {data && cycle && (
            <ReviewDetail
              cycleStatus={cycle.status}
              perspective="admin"
              selfAvg={data.selfAvg}
              clientAvg={data.clientAvg}
              finalScore={data.finalScore}
              selfDims={data.selfDims}
              clientDims={data.clientDims}
              selfDone={data.selfDone}
              clientDone={data.clientDone}
              selfOpen={data.selfOpen}
              clientOpen={data.clientOpen}
              clientName={data.clientName ?? undefined}
            />
          )}
        </>
      )}

      <div style={{ marginTop: 18 }}>
        <ContractorHistoryCard changelog={changelog} />
      </div>

      {editOpen && (
        <EditContractorModal
          contractorId={contractorId}
          initialName={name} initialSeniority={seniority} initialTrack={track}
          adminName={adminName}
          onClose={() => setEditOpen(false)}
        />
      )}
      {allocOpen && (
        <AllocModal
          contractorId={contractorId} contractorName={name}
          currentClientName={currentClientName}
          clients={clients} adminName={adminName}
          onClose={() => setAllocOpen(false)}
        />
      )}
    </div>
  )
}

function ContractorHistoryCard({ changelog }: { changelog: ChangelogEntry[] }) {
  const { t } = useLang()
  const fieldMeta: Record<string, { icon: string; label: string }> = {
    role: { icon: 'edit', label: t('Cargo') },
    seniority: { icon: 'trend', label: t('Senioridade') },
    track: { icon: 'users', label: t('Trilha') },
    allocation: { icon: 'link', label: t('Alocação') },
  }
  const fmtDate = (d: string) => d.split('-').reverse().join('/')

  return (
    <div className="card">
      <div className="card-head"><Icon name="history" size={16} /><h3>{t('Histórico de alterações')}</h3></div>
      <div className="card-pad">
        {changelog.length === 0 && <div className="muted" style={{ fontSize: 13 }}>{t('Sem alterações registradas.')}</div>}
        {changelog.map((h, i) => {
          const meta = fieldMeta[h.field] || fieldMeta.role
          return (
            <div key={h.id} className="row" style={{
              gap: 13, alignItems: 'flex-start', padding: '11px 0',
              borderBottom: i < changelog.length - 1 ? '1px solid var(--border)' : 'none',
            }}>
              <span style={{
                width: 30, height: 30, borderRadius: 8, flexShrink: 0,
                display: 'grid', placeItems: 'center',
                background: 'var(--surface-3)', color: 'var(--ink-2)',
              }}><Icon name={meta.icon} size={15} /></span>
              <div className="col" style={{ gap: 3, minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: 13.5 }}>
                  <span style={{ fontWeight: 600 }}>{meta.label}</span>
                  <span className="muted"> · </span>
                  <span style={{ color: 'var(--ink-3)' }}>{h.from}</span>
                  <Icon name="arrowRight" size={13} style={{ margin: '0 5px', verticalAlign: '-2px', color: 'var(--accent-ink)' }} />
                  <span style={{ fontWeight: 500 }}>{h.to}</span>
                </div>
                {h.note && <div className="muted" style={{ fontSize: 12, lineHeight: 1.45 }}>{h.note}</div>}
              </div>
              <div className="col" style={{ alignItems: 'flex-end', gap: 1, flexShrink: 0 }}>
                <span className="mono" style={{ fontSize: 11.5, color: 'var(--ink-3)' }}>{fmtDate(h.at)}</span>
                <span style={{ fontSize: 11, color: 'var(--ink-3)' }}>{h.by}</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function EditContractorModal({ contractorId, initialName, initialSeniority, initialTrack, adminName, onClose }: {
  contractorId: string; initialName: string; initialSeniority: string; initialTrack: string; adminName: string; onClose: () => void
}) {
  const { t } = useLang()
  const [f, setF] = useState({ name: initialName, role: '', seniority: initialSeniority, track: initialTrack })
  const [saving, setSaving] = useState(false)

  const save = async () => {
    setSaving(true)
    try {
      await updateContractor(contractorId, f, adminName)
      onClose()
    } catch { setSaving(false) }
  }

  return (
    <Modal title={t('Editar contratado')} onClose={onClose}
      footer={<>
        <button className="btn btn-ghost" onClick={onClose}>{t('Cancelar')}</button>
        <button className="btn btn-primary" disabled={!f.name || saving} onClick={save}>
          <Icon name="check" size={16} />{t('Salvar alterações')}
        </button>
      </>}>
      <div className="col" style={{ gap: 16 }}>
        <div className="field"><label>{t('Nome completo')}</label>
          <input className="input" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
        </div>
        <div className="field"><label>{t('Cargo')}</label>
          <input className="input" value={f.role} onChange={(e) => setF({ ...f, role: e.target.value })} placeholder="Ex.: Senior Frontend Engineer" />
        </div>
        <div className="grid grid-2" style={{ gap: 14 }}>
          <div className="field"><label>{t('Trilha')}</label>
            <select className="select" value={f.track} onChange={(e) => setF({ ...f, track: e.target.value })}>
              <option>Dev</option><option>Gestão</option>
            </select>
          </div>
          <div className="field"><label>{t('Senioridade')}</label>
            <select className="select" value={f.seniority} onChange={(e) => setF({ ...f, seniority: e.target.value })}>
              <option>Júnior</option><option>Pleno</option><option>Sênior</option>
            </select>
          </div>
        </div>
      </div>
    </Modal>
  )
}

function AllocModal({ contractorId, contractorName, currentClientName, clients, adminName, onClose }: {
  contractorId: string; contractorName: string; currentClientName: string | null
  clients: { id: string; name: string }[]; adminName: string; onClose: () => void
}) {
  const { t } = useLang()
  const confirm = useConfirm()
  const [cid, setCid] = useState('')
  const [saving, setSaving] = useState(false)

  const save = async () => {
    const newClient = cid ? clients.find((c) => c.id === cid)?.name : null
    const removing = !cid
    const changing = currentClientName || cid

    if (changing) {
      const ok = await confirm({
        icon: 'link', tone: removing ? 'danger' : 'primary',
        title: removing
          ? `${t('Desvincular')} ${contractorName}?`
          : `${t('Alterar vínculo')} · ${contractorName}?`,
        message: removing
          ? `${contractorName} ${t('deixará de ser avaliado por')} ${currentClientName} ${t('no ciclo em andamento. As avaliações já registradas permanecem no histórico.')}`
          : `${contractorName} ${t('passará a ser avaliado por')} ${newClient}.`,
        confirmLabel: removing ? t('Desvincular') : t('Salvar vínculo'),
        cancelLabel: t('Cancelar'),
      })
      if (!ok) return
    }

    setSaving(true)
    try {
      await updateAllocation(contractorId, cid || null, adminName)
      onClose()
    } catch { setSaving(false) }
  }

  return (
    <Modal title={`${t('Vincular')} ${contractorName}`} onClose={onClose}
      footer={<>
        <button className="btn btn-ghost" onClick={onClose}>{t('Cancelar')}</button>
        <button className="btn btn-primary" disabled={saving} onClick={save}>
          <Icon name="check" size={16} />{t('Salvar vínculo')}
        </button>
      </>}>
      <div className="field"><label>{t('Cliente')}</label>
        <select className="select" value={cid} onChange={(e) => setCid(e.target.value)}>
          <option value="">{t('Desvincular (sem alocação)')}</option>
          {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>
      <div className="callout" style={{ marginTop: 16 }}>
        <Icon name="info" />{t('O contratado só pode ser avaliado por um cliente enquanto estiver vinculado durante um ciclo em andamento.')}
      </div>
    </Modal>
  )
}
