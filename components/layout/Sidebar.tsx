'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useRole } from '@/components/providers/RoleProvider'
import { useConfirm } from '@/components/lecode/ConfirmDialog'
import { useLang } from '@/lib/i18n'
import { getBrowserClient } from '@/lib/supabase/client'
import { Icon, type IconName } from '@/components/lecode/Icon'
import { Avatar } from '@/components/lecode/Avatar'
import type { UserRole } from '@/lib/supabase/types'

interface NavItem {
  href:  string
  label: string
  icon:  IconName
}

interface NavGroup {
  group: string
  items: NavItem[]
}

const NAV_BY_ROLE: Record<UserRole, NavGroup[]> = {
  lecode_admin: [
    { group: 'Operação', items: [
      { href: '/admin',            label: 'Visão geral',         icon: 'dashboard' },
      { href: '/admin/cycles',     label: 'Ciclos de avaliação', icon: 'cycle' },
    ] },
    { group: 'Cadastros', items: [
      { href: '/admin/contractors', label: 'Contratados', icon: 'users' },
      { href: '/admin/clients',     label: 'Clientes',    icon: 'building' },
    ] },
    { group: 'Configuração', items: [
      { href: '/admin/form', label: 'Formulário', icon: 'form' },
    ] },
  ],
  client_rep: [
    { group: 'Avaliação', items: [
      { href: '/client/team',    label: 'Minha equipe', icon: 'users' },
      { href: '/client/history', label: 'Histórico',    icon: 'history' },
    ] },
  ],
  contractor: [
    { group: 'Minha avaliação', items: [
      { href: '/contractor',             label: 'Início',         icon: 'dashboard' },
      { href: '/contractor/self-review', label: 'Auto-avaliação', icon: 'form' },
      { href: '/contractor/history',     label: 'Histórico',      icon: 'history' },
    ] },
  ],
}

const ROLE_LABEL: Record<UserRole, string> = {
  lecode_admin: 'Gestor LeCode',
  client_rep:   'Representante Cliente',
  contractor:   'Contratado LeCode',
}

interface SidebarProps {
  fullName:    string
  badges?:     Record<string, string | number>
  onNavigate?: () => void
}

export function Sidebar({ fullName, badges, onNavigate }: SidebarProps) {
  const role     = useRole()
  const pathname = usePathname()
  const router   = useRouter()
  const confirm  = useConfirm()
  const { t }    = useLang()
  const groups   = NAV_BY_ROLE[role]
  const person   = { name: fullName, role: t(ROLE_LABEL[role]) }

  async function handleSignOut() {
    const ok = await confirm({
      icon: 'logout',
      tone: 'primary',
      title: t('Sair da plataforma?'),
      message: t('Você precisará entrar novamente para acessar seus ciclos de avaliação.'),
      confirmLabel: t('Sair'),
      cancelLabel: t('Cancelar'),
    })
    if (!ok) return
    const supabase = getBrowserClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-mark"><img src="/lecode-logo.png" alt="LeCode" /></div>
        <div className="brand-name">LeCode<small>performance_review</small></div>
      </div>

      {groups.map((g) => (
        <div key={g.group}>
          <div className="nav-group-label">{t(g.group)}</div>
          {g.items.map((item) => {
            const depth = item.href.split('/').length
            const active = pathname === item.href || (depth > 2 && pathname.startsWith(item.href + '/'))
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                className={'nav-item' + (active ? ' active' : '')}
              >
                <Icon name={item.icon} size={18} className="ni-icon" />
                <span>{t(item.label)}</span>
                {badges?.[item.href] != null && <span className="ni-badge">{badges[item.href]}</span>}
              </Link>
            )
          })}
        </div>
      ))}

      <div className="sidebar-foot">
        <div className="nav-item" style={{ cursor: 'default' }}>
          <Avatar person={person} size="sm" />
          <div className="col" style={{ minWidth: 0, gap: 0 }}>
            <span style={{ fontWeight: 600, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {fullName}
            </span>
            <span className="muted" style={{ fontSize: 11 }}>{person.role}</span>
          </div>
          <button className="icon-btn" title={t('Sair')} onClick={handleSignOut} style={{ marginLeft: 'auto' }}>
            <Icon name="logout" size={16} />
          </button>
        </div>
      </div>
    </aside>
  )
}
