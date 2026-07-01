'use client'

import { useState } from 'react'
import { useLang } from '@/lib/i18n'
import { Icon } from '@/components/lecode/Icon'
import { Modal } from '@/components/lecode/Modal'
import { createClient } from '@/app/(app)/admin/clients/actions'

interface Client {
  id: string
  name: string
  slug: string
  industry: string | null
  repName: string | null
  teamCount: number
  teamNames: string[]
}

interface AdminClientsViewProps {
  clients: Client[]
}

function colorFor(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0
  return `oklch(0.55 0.13 ${hash % 360})`
}

export function AdminClientsView({ clients }: AdminClientsViewProps) {
  const { t } = useLang()
  const [modal, setModal] = useState(false)

  const handleCreate = async (fd: FormData) => {
    await createClient(fd)
    setModal(false)
  }

  return (
    <div className="content anim-in">
      <div className="page-head between" style={{ alignItems: 'flex-end' }}>
        <div>
          <div className="eyebrow">{t('Contas')}</div>
          <h2>{t('Clientes')}</h2>
          <p>{t('Empresas onde os contratados da LeCode estão alocados.')}</p>
        </div>
        <button className="btn btn-primary" onClick={() => setModal(true)}>
          <Icon name="plus" size={16} />{t('Novo cliente')}
        </button>
      </div>

      <div className="grid grid-3">
        {clients.map((c) => (
          <div className="card card-pad" key={c.id}>
            <div className="row" style={{ gap: 12, marginBottom: 14 }}>
              <span className="avatar lg" style={{ background: colorFor(c.name) }}>{c.name[0]}</span>
              <div className="col">
                <span style={{ fontWeight: 600, fontSize: 15 }}>{c.name}</span>
                <span className="muted" style={{ fontSize: 12.5 }}>{c.industry ?? `/${c.slug}`}</span>
              </div>
            </div>
            <div className="divider" />
            <div className="between" style={{ fontSize: 12.5 }}>
              <span className="muted">{t('Representante')}</span>
              <span style={{ fontWeight: 500 }}>{c.repName ?? '—'}</span>
            </div>
            <div className="between" style={{ fontSize: 12.5, marginTop: 6 }}>
              <span className="muted">{t('Contratados')}</span>
              <span className="mono" style={{ fontWeight: 600 }}>{c.teamCount}</span>
            </div>
            {c.teamNames.length > 0 && (
              <div className="row" style={{ marginTop: 12 }}>
                {c.teamNames.map((name, i) => (
                  <span key={i} className="avatar sm"
                    style={{ background: colorFor(name), marginLeft: i > 0 ? -6 : 0, border: '2px solid var(--surface)' }}>
                    {name[0]}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {modal && (
        <Modal title={t('Cadastrar cliente')} onClose={() => setModal(false)}
          footer={<>
            <button className="btn btn-ghost" onClick={() => setModal(false)}>{t('Cancelar')}</button>
            <button className="btn btn-primary" type="submit" form="new-client-form">
              <Icon name="check" size={16} />{t('Cadastrar')}
            </button>
          </>}>
          <form id="new-client-form" action={handleCreate} className="col" style={{ gap: 16 }}>
            <div className="field">
              <label>{t('Nome da empresa')}</label>
              <input name="name" required className="input" placeholder="Ex.: Fintrack" />
            </div>
            <div className="field">
              <label>{t('Segmento')}</label>
              <input name="industry" className="input" placeholder="Ex.: Fintech · Pagamentos" />
            </div>
            <div className="grid grid-2" style={{ gap: 14 }}>
              <div className="field">
                <label>{t('Slug')}</label>
                <input name="slug" required className="input" placeholder="Ex.: fintrack" pattern="[a-z0-9\-]+" title={t('Apenas letras minúsculas, números e hífens (ex.: google, fin-tech)')} />
              </div>
              <div className="field">
                <label>{t('E-mail do representante')}</label>
                <input name="rep_email" className="input" placeholder="email@cliente.com" />
              </div>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
