'use client'

import { useState, useTransition } from 'react'
import { useLang } from '@/lib/i18n'
import { Icon, type IconName } from '@/components/lecode/Icon'
import { Modal } from '@/components/lecode/Modal'
import { inviteUser, resendInvite, revokeAccess, removeAccount } from '@/app/(app)/admin/accounts/actions'

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

const ROLE_CONFIG: Record<string, { label: string; icon: IconName; bg: string; fg: string }> = {
  lecode_admin: { label: 'Admin',          icon: 'shield',   bg: 'oklch(0.45 0.15 280)', fg: '#fff' },
  client_rep:   { label: 'Representante',  icon: 'building', bg: 'oklch(0.55 0.14 200)', fg: '#fff' },
  contractor:   { label: 'Contratado',     icon: 'users',    bg: 'oklch(0.55 0.14 155)', fg: '#fff' },
}

function avatarColor(name: string) {
  let h = 0
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0
  return `oklch(0.52 0.12 ${h % 360})`
}

function initials(name: string) {
  const parts = name.split(' ').filter(Boolean)
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  return name.slice(0, 2).toUpperCase()
}

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime()
  const days = Math.floor(diff / 86400000)
  if (days === 0) return 'Hoje'
  if (days === 1) return 'Ontem'
  if (days < 30) return `${days}d atrás`
  const months = Math.floor(days / 30)
  if (months < 12) return `${months}m atrás`
  return `${Math.floor(months / 12)}a atrás`
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
  const [activeMenu, setActiveMenu] = useState<string | null>(null)
  const [confirmAction, setConfirmAction] = useState<{ type: 'revoke' | 'remove'; account: Account } | null>(null)
  const [actionPending, setActionPending] = useState(false)

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

  const handleManageAction = async () => {
    if (!confirmAction) return
    setActionPending(true)
    const result = confirmAction.type === 'revoke'
      ? await revokeAccess(confirmAction.account.id)
      : await removeAccount(confirmAction.account.id)
    setActionPending(false)
    setConfirmAction(null)
    if (result.error) {
      setError(result.error)
      setTimeout(() => setError(null), 4000)
    } else {
      setSuccess(confirmAction.type === 'revoke' ? 'Acesso revogado.' : 'Conta removida.')
      setTimeout(() => setSuccess(null), 4000)
    }
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

  const FILTER_OPTIONS: { key: string; label: string; icon: IconName }[] = [
    { key: 'all',          label: 'Todos',          icon: 'users' },
    { key: 'contractor',   label: 'Contratados',    icon: 'users' },
    { key: 'client_rep',   label: 'Representantes', icon: 'building' },
    { key: 'lecode_admin', label: 'Admins',         icon: 'shield' },
  ]

  return (
    <div className="content anim-in">
      <div className="page-head between" style={{ alignItems: 'flex-end' }}>
        <div>
          <div className="eyebrow">{t('Configuração')}</div>
          <h2>{t('Gestão de contas')}</h2>
          <p>{t('Convide contratados e representantes de clientes. Eles receberão um e-mail para definir a própria senha.')}</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setModal(true); setError(null) }}>
          <Icon name="send" size={16} />{t('Convidar usuário')}
        </button>
      </div>

      {success && (
        <div className="card" style={{
          padding: '12px 18px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10,
          background: 'oklch(0.35 0.08 155)', borderLeft: '3px solid oklch(0.6 0.18 155)',
        }}>
          <Icon name="check" size={16} />
          <span style={{ fontSize: 13.5, fontWeight: 500 }}>{success}</span>
        </div>
      )}

      <div className="row" style={{ gap: 6, marginBottom: 18, flexWrap: 'wrap', alignItems: 'center' }}>
        {FILTER_OPTIONS.map((opt) => {
          const active = filter === opt.key
          return (
            <button
              key={opt.key}
              onClick={() => setFilter(opt.key)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '6px 14px', borderRadius: 8, fontSize: 12.5, fontWeight: 500,
                border: '1px solid ' + (active ? 'var(--accent)' : 'var(--border)'),
                background: active ? 'var(--accent-soft)' : 'transparent',
                color: active ? 'var(--accent-ink)' : 'var(--ink-2)',
                cursor: 'pointer', transition: 'all 0.15s',
              }}
            >
              <Icon name={opt.icon} size={13} />
              {t(opt.label)}
              <span style={{
                fontFamily: 'var(--mono)', fontSize: 11, fontWeight: 600,
                background: active ? 'var(--accent)' : 'var(--surface-3)',
                color: active ? '#fff' : 'var(--ink-3)',
                padding: '1px 6px', borderRadius: 4, marginLeft: 2,
              }}>
                {counts[opt.key as keyof typeof counts]}
              </span>
            </button>
          )
        })}

        <div style={{ marginLeft: 'auto', position: 'relative', display: 'flex', alignItems: 'center' }}>
          <span style={{ position: 'absolute', left: 10, color: 'var(--ink-3)', display: 'grid', placeItems: 'center' }}>
            <Icon name="search" size={14} />
          </span>
          <input
            className="input"
            placeholder={t('Buscar por nome ou e-mail...')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: 32, width: 260, fontSize: 13, height: 34 }}
          />
        </div>
      </div>

      <div className="col" style={{ gap: 6 }}>
        {filtered.length === 0 && (
          <div className="card card-pad" style={{ textAlign: 'center', padding: '48px 20px' }}>
            <Icon name="search" size={32} />
            <p className="muted" style={{ marginTop: 12 }}>{t('Nenhuma conta encontrada.')}</p>
          </div>
        )}

        {filtered.map((a) => {
          const rc = ROLE_CONFIG[a.role] ?? ROLE_CONFIG.contractor
          return (
            <div
              key={a.id}
              className="card"
              style={{
                display: 'flex', alignItems: 'center', gap: 14,
                padding: '12px 18px',
                transition: 'background 0.1s',
              }}
            >
              <span style={{
                width: 38, height: 38, borderRadius: 10, flexShrink: 0,
                display: 'grid', placeItems: 'center',
                background: avatarColor(a.name), color: '#fff',
                fontWeight: 700, fontSize: 13.5, fontFamily: 'var(--mono)',
                letterSpacing: 0.5,
              }}>
                {initials(a.name)}
              </span>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontWeight: 600, fontSize: 14 }}>{a.name}</span>
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: 4,
                    fontSize: 10.5, fontWeight: 600, padding: '2px 8px', borderRadius: 5,
                    background: rc.bg, color: rc.fg, letterSpacing: 0.3,
                    textTransform: 'uppercase',
                  }}>
                    <Icon name={rc.icon} size={10} />
                    {t(rc.label)}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 2 }}>
                  <span className="muted" style={{ fontSize: 12.5 }}>{a.email}</span>
                  {a.clientName && (
                    <span style={{
                      fontSize: 11.5, color: 'var(--ink-2)', display: 'flex', alignItems: 'center', gap: 4,
                    }}>
                      <Icon name="building" size={11} />
                      {a.clientName}
                    </span>
                  )}
                </div>
              </div>

              <span className="muted" style={{ fontSize: 12, flexShrink: 0, fontFamily: 'var(--mono)' }}>
                {timeAgo(a.createdAt)}
              </span>

              {a.role !== 'lecode_admin' ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0, position: 'relative' }}>
                  <button
                    className="btn btn-sm btn-ghost"
                    title={t('Reenviar convite')}
                    disabled={resending === a.id}
                    onClick={() => handleResend(a.id)}
                    style={{ gap: 5, fontSize: 12 }}
                  >
                    <Icon name="mail" size={13} />
                    {resending === a.id ? t('Enviando...') : t('Reenviar')}
                  </button>
                  <button
                    className="btn btn-sm btn-ghost"
                    title={t('Mais opções')}
                    onClick={() => setActiveMenu(activeMenu === a.id ? null : a.id)}
                    style={{ padding: '4px 6px' }}
                  >
                    <Icon name="moreVert" size={15} />
                  </button>
                  {activeMenu === a.id && (
                    <>
                      <div className="ui-menu-backdrop" onClick={() => setActiveMenu(null)} />
                      <div className="ui-menu" style={{ padding: 6, minWidth: 190 }}>
                        <button
                          className="ui-menu-item"
                          onClick={() => { setActiveMenu(null); setConfirmAction({ type: 'revoke', account: a }) }}
                          style={{ gap: 10 }}
                        >
                          <Icon name="ban" size={14} style={{ color: 'var(--s3)', flexShrink: 0 }} />
                          {t('Revogar acesso')}
                        </button>
                        <div style={{ height: 1, background: 'var(--border)', margin: '2px 8px' }} />
                        <button
                          className="ui-menu-item"
                          onClick={() => { setActiveMenu(null); setConfirmAction({ type: 'remove', account: a }) }}
                          style={{ gap: 10, color: 'var(--danger, oklch(0.65 0.22 25))' }}
                        >
                          <Icon name="trash" size={14} style={{ flexShrink: 0 }} />
                          {t('Remover conta')}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <div style={{ width: 90 }} />
              )}
            </div>
          )
        })}
      </div>

      <div className="muted" style={{ fontSize: 12, marginTop: 14, textAlign: 'center' }}>
        {filtered.length} {filtered.length === 1 ? t('conta') : t('contas')} {filter !== 'all' ? t('filtradas') : ''}
      </div>

      {confirmAction && (
        <Modal
          title={confirmAction.type === 'revoke' ? t('Revogar acesso') : t('Remover conta')}
          onClose={() => setConfirmAction(null)}
          footer={<>
            <button className="btn btn-ghost" onClick={() => setConfirmAction(null)} disabled={actionPending}>
              {t('Cancelar')}
            </button>
            <button
              className="btn"
              onClick={handleManageAction}
              disabled={actionPending}
              style={{
                background: confirmAction.type === 'remove' ? 'oklch(0.5 0.18 25)' : 'oklch(0.55 0.14 50)',
                color: '#fff',
              }}
            >
              {actionPending ? t('Aguarde...') : confirmAction.type === 'revoke' ? t('Revogar acesso') : t('Remover conta')}
            </button>
          </>}
        >
          <div className="col" style={{ gap: 16 }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '12px 14px', borderRadius: 10, background: 'var(--surface-2)',
            }}>
              <span style={{
                width: 38, height: 38, borderRadius: 10, flexShrink: 0,
                display: 'grid', placeItems: 'center',
                background: avatarColor(confirmAction.account.name), color: '#fff',
                fontWeight: 700, fontSize: 13.5, fontFamily: 'var(--mono)',
              }}>
                {initials(confirmAction.account.name)}
              </span>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{confirmAction.account.name}</div>
                <div className="muted" style={{ fontSize: 12.5 }}>{confirmAction.account.email}</div>
              </div>
            </div>
            <p style={{ fontSize: 13.5, color: 'var(--ink-2)', lineHeight: 1.6, margin: 0 }}>
              {confirmAction.type === 'revoke'
                ? t('Este usuário não conseguirá mais fazer login. Os dados são preservados e o acesso pode ser restaurado manualmente.')
                : t('Esta ação é irreversível. O usuário e todos os seus dados serão removidos permanentemente da plataforma.')}
            </p>
          </div>
        </Modal>
      )}

      {modal && (
        <Modal title={t('Convidar novo usuário')} onClose={() => setModal(false)}
          footer={<>
            <button className="btn btn-ghost" onClick={() => setModal(false)}>{t('Cancelar')}</button>
            <button className="btn btn-primary" type="submit" form="invite-form" disabled={isPending}>
              <Icon name="send" size={16} />
              {isPending ? t('Enviando...') : t('Enviar convite')}
            </button>
          </>}>
          <form id="invite-form" action={handleInvite} className="col" style={{ gap: 18 }}>
            {error && (
              <div style={{
                background: 'oklch(0.35 0.08 25)', borderLeft: '3px solid oklch(0.6 0.18 25)',
                padding: '10px 14px', borderRadius: 8, fontSize: 13, color: 'var(--ink)',
              }}>
                <div className="row" style={{ gap: 8 }}>
                  <Icon name="warning" size={14} />
                  <span>{error}</span>
                </div>
              </div>
            )}

            <div className="field">
              <label>{t('Nome completo')}</label>
              <input name="full_name" required className="input" placeholder="Ex.: João Silva" autoFocus />
            </div>

            <div className="field">
              <label>{t('E-mail')}</label>
              <input name="email" type="email" required className="input" placeholder="joao@empresa.com" />
            </div>

            <div className="field">
              <label style={{ marginBottom: 8 }}>{t('Tipo de conta')}</label>
              <div className="row" style={{ gap: 10 }}>
                {([
                  { key: 'contractor',   label: 'Contratado',    desc: 'Faz autoavaliação',       icon: 'users'    as IconName },
                  { key: 'client_rep',   label: 'Representante', desc: 'Avalia contratados',       icon: 'building' as IconName },
                  { key: 'lecode_admin', label: 'Admin',         desc: 'Acesso administrativo',    icon: 'shield'   as IconName },
                ]).map((opt) => {
                  const active = selectedRole === opt.key
                  return (
                    <button
                      key={opt.key}
                      type="button"
                      onClick={() => setSelectedRole(opt.key)}
                      style={{
                        flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                        padding: '14px 12px', borderRadius: 10, cursor: 'pointer', transition: 'all 0.15s',
                        border: '2px solid ' + (active ? 'var(--accent)' : 'var(--border)'),
                        background: active ? 'var(--accent-soft)' : 'transparent',
                      }}
                    >
                      <span style={{
                        width: 36, height: 36, borderRadius: 9, display: 'grid', placeItems: 'center',
                        background: active ? 'var(--accent)' : 'var(--surface-3)',
                        color: active ? '#fff' : 'var(--ink-3)',
                      }}>
                        <Icon name={opt.icon} size={18} />
                      </span>
                      <span style={{ fontWeight: 600, fontSize: 13 }}>{t(opt.label)}</span>
                      <span className="muted" style={{ fontSize: 11 }}>{t(opt.desc)}</span>
                    </button>
                  )
                })}
              </div>
              <input type="hidden" name="role" value={selectedRole} />
            </div>

            {selectedRole === 'contractor' && (
              <div className="field">
                <label>
                  {t('Cliente')}
                  <span className="muted" style={{ fontWeight: 400 }}> · {t('opcional')}</span>
                </label>
                <select name="client_id" className="input">
                  <option value="">{t('Selecione o cliente...')}</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            )}

            <div style={{
              display: 'flex', alignItems: 'flex-start', gap: 10,
              padding: '12px 14px', borderRadius: 10,
              background: 'var(--surface-2)', fontSize: 12.5, color: 'var(--ink-2)', lineHeight: 1.5,
            }}>
              <Icon name="mail" size={15} style={{ flexShrink: 0, marginTop: 1 }} />
              <span>{t('O usuário receberá um e-mail com link para definir sua senha e acessar a plataforma.')}</span>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
