'use client'

import { useState, useTransition } from 'react'
import { useLang } from '@/lib/i18n'
import { Icon } from '@/components/lecode/Icon'
import { Modal } from '@/components/lecode/Modal'
import { inviteUser, resendInvite } from '@/app/(app)/admin/accounts/actions'

interface Account {
  id: string
  name: string
  email: string
  role: string
  clientName: string | null
  createdAt: string
}

interface Client {
  id: string
  name: string
}

interface AdminAccountsViewProps {
  accounts: Account[]
  clients: Client[]
}

const ROLE_LABELS: Record<string, string> = {
  lecode_admin: 'Admin',
  client_rep: 'Representante',
  contractor: 'Contratado',
}

const ROLE_COLORS: Record<string, string> = {
  lecode_admin: 'var(--s5)',
  client_rep: 'var(--s4)',
  contractor: 'var(--s3)',
}

export function AdminAccountsView({ accounts, clients }: AdminAccountsViewProps) {
  const { t } = useLang()
  const [modal, setModal] = useState(false)
  const [selectedRole, setSelectedRole] = useState<string>('contractor')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [filter, setFilter] = useState<string>('all')
  const [search, setSearch] = useState('')
  const [isPending, startTransition] = useTransition()
  const [resending, setResending] = useState<string | null>(null)

  const filtered = accounts.filter((a) => {
    if (filter !== 'all' && a.role !== filter) return false
    if (search) {
      const q = search.toLowerCase()
      return a.name.toLowerCase().includes(q) || a.email.toLowerCase().includes(q)
    }
    return true
  })

  const handleInvite = async (fd: FormData) => {
    setError(null)
    setSuccess(null)
    startTransition(async () => {
      const result = await inviteUser(fd)
      if (result.error) {
        setError(result.error)
      } else {
        setSuccess('Convite enviado com sucesso!')
        setModal(false)
        setTimeout(() => setSuccess(null), 4000)
      }
    })
  }

  const handleResend = async (userId: string) => {
    setResending(userId)
    const result = await resendInvite(userId)
    setResending(null)
    if (result.error) {
      setError(result.error)
      setTimeout(() => setError(null), 4000)
    } else {
      setSuccess('Convite reenviado!')
      setTimeout(() => setSuccess(null), 4000)
    }
  }

  const counts = {
    all: accounts.length,
    contractor: accounts.filter((a) => a.role === 'contractor').length,
    client_rep: accounts.filter((a) => a.role === 'client_rep').length,
    lecode_admin: accounts.filter((a) => a.role === 'lecode_admin').length,
  }

  return (
    <div className="content anim-in">
      <div className="page-head between" style={{ alignItems: 'flex-end' }}>
        <div>
          <div className="eyebrow">{t('Configuração')}</div>
          <h2>{t('Gestão de contas')}</h2>
          <p>{t('Convide contratados e representantes de clientes. Eles receberão um e-mail para definir a própria senha.')}</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setModal(true); setError(null) }}>
          <Icon name="mail" size={16} />{t('Convidar usuário')}
        </button>
      </div>

      {success && (
        <div className="card card-pad" style={{ background: 'var(--s3-soft)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
          <Icon name="check" size={16} />
          <span style={{ fontSize: 13.5 }}>{success}</span>
        </div>
      )}

      <div className="row" style={{ gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {(['all', 'contractor', 'client_rep', 'lecode_admin'] as const).map((key) => (
          <button
            key={key}
            className={'btn btn-sm ' + (filter === key ? 'btn-primary' : 'btn-ghost')}
            onClick={() => setFilter(key)}
          >
            {key === 'all' ? t('Todos') : t(ROLE_LABELS[key])}
            <span className="mono" style={{ marginLeft: 6, opacity: 0.7 }}>
              {counts[key]}
            </span>
          </button>
        ))}
        <div style={{ marginLeft: 'auto', position: 'relative' }}>
          <Icon name="search" size={15} />
          <input
            className="input"
            placeholder={t('Buscar por nome ou e-mail...')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: 8, width: 240, fontSize: 13 }}
          />
        </div>
      </div>

      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>{t('Nome')}</th>
              <th>{t('E-mail')}</th>
              <th>{t('Perfil')}</th>
              <th>{t('Cliente')}</th>
              <th>{t('Criado em')}</th>
              <th style={{ width: 50 }}></th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: 32, color: 'var(--ink-3)' }}>
                {t('Nenhuma conta encontrada.')}
              </td></tr>
            )}
            {filtered.map((a) => (
              <tr key={a.id}>
                <td style={{ fontWeight: 500 }}>{a.name}</td>
                <td className="muted">{a.email}</td>
                <td>
                  <span style={{
                    fontSize: 11.5, fontWeight: 600, padding: '2px 8px', borderRadius: 6,
                    background: ROLE_COLORS[a.role] ?? 'var(--surface-3)',
                    color: '#fff',
                  }}>
                    {ROLE_LABELS[a.role] ?? a.role}
                  </span>
                </td>
                <td>{a.clientName ?? '—'}</td>
                <td className="muted" style={{ fontSize: 12.5 }}>
                  {new Date(a.createdAt).toLocaleDateString('pt-BR')}
                </td>
                <td>
                  {a.role !== 'lecode_admin' && (
                    <button
                      className="icon-btn"
                      title={t('Reenviar convite')}
                      disabled={resending === a.id}
                      onClick={() => handleResend(a.id)}
                    >
                      <Icon name="mail" size={14} />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal && (
        <Modal title={t('Convidar usuário')} onClose={() => setModal(false)}
          footer={<>
            <button className="btn btn-ghost" onClick={() => setModal(false)}>{t('Cancelar')}</button>
            <button className="btn btn-primary" type="submit" form="invite-form" disabled={isPending}>
              <Icon name="send" size={16} />
              {isPending ? t('Enviando...') : t('Enviar convite')}
            </button>
          </>}>
          <form id="invite-form" action={handleInvite} className="col" style={{ gap: 16 }}>
            {error && (
              <div style={{ background: 'var(--s1-soft)', padding: '10px 14px', borderRadius: 8, fontSize: 13, color: 'var(--s1)' }}>
                {error}
              </div>
            )}
            <div className="field">
              <label>{t('Nome completo')}</label>
              <input name="full_name" required className="input" placeholder="Ex.: João Silva" />
            </div>
            <div className="field">
              <label>{t('E-mail')}</label>
              <input name="email" type="email" required className="input" placeholder="joao@empresa.com" />
            </div>
            <div className="field">
              <label>{t('Perfil')}</label>
              <div className="row" style={{ gap: 8 }}>
                <button
                  type="button"
                  className={'btn btn-sm ' + (selectedRole === 'contractor' ? 'btn-primary' : 'btn-ghost')}
                  onClick={() => setSelectedRole('contractor')}
                >
                  <Icon name="users" size={14} />{t('Contratado')}
                </button>
                <button
                  type="button"
                  className={'btn btn-sm ' + (selectedRole === 'client_rep' ? 'btn-primary' : 'btn-ghost')}
                  onClick={() => setSelectedRole('client_rep')}
                >
                  <Icon name="building" size={14} />{t('Representante')}
                </button>
              </div>
              <input type="hidden" name="role" value={selectedRole} />
            </div>
            <div className="field">
              <label>{t('Cliente')} {selectedRole === 'client_rep' ? '' : <span className="muted">({t('opcional para contratado')})</span>}</label>
              <select name="client_id" className="input" required={selectedRole === 'client_rep'}>
                <option value="">{t('Selecione...')}</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div className="card card-pad" style={{ background: 'var(--surface-2)', fontSize: 12.5, color: 'var(--ink-2)' }}>
              <div className="row" style={{ gap: 8 }}>
                <Icon name="info" size={14} />
                <span>{t('O usuário receberá um e-mail com link para definir sua senha e acessar a plataforma.')}</span>
              </div>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
