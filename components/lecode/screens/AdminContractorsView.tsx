'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useLang } from '@/lib/i18n'
import { Icon } from '@/components/lecode/Icon'
import { PersonRow } from '@/components/lecode/Avatar'
import { Badge } from '@/components/lecode/Badge'
import { ScoreChip } from '@/components/lecode/ScoreChip'
import { DecisionTag } from '@/components/lecode/Decision'
import { Modal } from '@/components/lecode/Modal'
import { createContractor } from '@/app/(app)/admin/contractors/actions'

interface Contractor {
  id: string
  name: string
  email: string
  seniority: string
  track: string
  clientName: string | null
  score: number | null
}

interface AdminContractorsViewProps {
  contractors: Contractor[]
  lastCycleLabel: string | null
  clients: { id: string; name: string }[]
}

export function AdminContractorsView({ contractors, lastCycleLabel, clients }: AdminContractorsViewProps) {
  const { t } = useLang()
  const [q, setQ] = useState('')
  const [modal, setModal] = useState(false)

  const list = contractors.filter((c) =>
    c.name.toLowerCase().includes(q.toLowerCase()) ||
    c.email.toLowerCase().includes(q.toLowerCase())
  )

  return (
    <div className="content anim-in">
      <div className="page-head between" style={{ alignItems: 'flex-end' }}>
        <div>
          <div className="eyebrow">{t('Pessoas')}</div>
          <h2>{t('Contratados')}</h2>
          <p>{t('Desenvolvedores e gestores de projeto alocados pela LeCode.')}</p>
        </div>
        <button className="btn btn-primary" onClick={() => setModal(true)}>
          <Icon name="plus" size={16} />{t('Novo contratado')}
        </button>
      </div>

      <div className="card" style={{ marginBottom: 14, padding: '10px 12px' }}>
        <div className="row" style={{ gap: 8 }}>
          <Icon name="search" size={16} className="muted" />
          <input className="input" style={{ border: 'none', padding: 4, background: 'none' }}
            placeholder={t('Buscar contratado...')} value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
      </div>

      <div className="card">
        <table className="tbl">
          <thead>
            <tr>
              <th>{t('Contratado')}</th>
              <th>{t('Senioridade')}</th>
              <th>{t('Cliente')}</th>
              <th className="th-num">{t('Último score')}{lastCycleLabel ? ` (${lastCycleLabel})` : ''}</th>
              <th>{t('Recomendação')}</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {list.map((c) => (
              <tr key={c.id} className="clickable">
                <td>
                  <Link href={`/admin/contractors/${c.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                    <PersonRow person={{ name: c.name, role: c.email }} />
                  </Link>
                </td>
                <td><Badge>{c.seniority} · {c.track}</Badge></td>
                <td>
                  {c.clientName ? (
                    <div className="row" style={{ gap: 8 }}>
                      <span className="avatar sm" style={{ background: `oklch(0.55 0.13 ${c.clientName.charCodeAt(0) % 360})` }}>{c.clientName[0]}</span>
                      <span style={{ fontSize: 13 }}>{c.clientName}</span>
                    </div>
                  ) : (
                    <Badge kind="pending">{t('sem alocação')}</Badge>
                  )}
                </td>
                <td className="td-num"><ScoreChip value={c.score} /></td>
                <td>{c.score != null ? <DecisionTag score={c.score} /> : <span className="muted" style={{ fontSize: 12 }}>—</span>}</td>
                <td className="td-num">
                  <Link href={`/admin/contractors/${c.id}`}>
                    <Icon name="chevron" size={16} className="muted" />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal && <NewContractorModal clients={clients} onClose={() => setModal(false)} />}
    </div>
  )
}

function NewContractorModal({ clients, onClose }: { clients: { id: string; name: string }[]; onClose: () => void }) {
  const { t } = useLang()
  const [f, setF] = useState({ name: '', role: '', seniority: 'Pleno', track: 'Dev', clientId: '' })
  const [saving, setSaving] = useState(false)

  const save = async () => {
    setSaving(true)
    try {
      await createContractor({ ...f, clientId: f.clientId || null })
      onClose()
    } catch { setSaving(false) }
  }

  return (
    <Modal title={t('Cadastrar contratado')} onClose={onClose}
      footer={<>
        <button className="btn btn-ghost" onClick={onClose}>{t('Cancelar')}</button>
        <button className="btn btn-primary" disabled={!f.name || !f.role || saving} onClick={save}>
          <Icon name="check" size={16} />{t('Cadastrar')}
        </button>
      </>}>
      <div className="col" style={{ gap: 16 }}>
        <div className="field"><label>{t('Nome completo')}</label>
          <input className="input" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="Ex.: Rafael Moreira" />
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
        <div className="field"><label>{t('Vincular a cliente')} <span className="muted">({t('opcional')})</span></label>
          <select className="select" value={f.clientId} onChange={(e) => setF({ ...f, clientId: e.target.value })}>
            <option value="">{t('Sem alocação')}</option>
            {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
      </div>
    </Modal>
  )
}
