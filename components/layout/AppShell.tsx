'use client'
import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { Sidebar } from './Sidebar'
import { RoleProvider } from '@/components/providers/RoleProvider'
import { useLang } from '@/lib/i18n'
import { LangToggle } from '@/components/lecode/LangToggle'
import { ThemeToggle } from '@/components/lecode/ThemeToggle'
import { Icon } from '@/components/lecode/Icon'
import type { UserRole } from '@/lib/supabase/types'

interface AppShellProps {
  role:       UserRole
  fullName:   string
  badges?:    Record<string, string | number>
  clientName?: string | null
  children:   React.ReactNode
}

const PAGE_TITLES: Record<string, string> = {
  '/admin':                   'Visão geral',
  '/admin/cycles':            'Ciclos de avaliação',
  '/admin/contractors':       'Contratados',
  '/admin/clients':           'Clientes',
  '/admin/form':              'Formulário',
  '/client/team':             'Minha equipe',
  '/client/history':          'Histórico',
  '/contractor':              'Início',
  '/contractor/self-review':  'Auto-avaliação',
  '/contractor/history':      'Histórico',
}

function pageTitle(pathname: string): string {
  if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname]
  const prefix = Object.keys(PAGE_TITLES)
    .filter((p) => pathname.startsWith(p + '/'))
    .sort((a, b) => b.length - a.length)[0]
  return prefix ? PAGE_TITLES[prefix] : 'LeCode Review'
}

export function AppShell({ role, fullName, badges, clientName, children }: AppShellProps) {
  const [navOpen, setNavOpen] = useState(false)
  const pathname = usePathname()
  const { t } = useLang()

  return (
    <RoleProvider role={role}>
      <div className={'app' + (navOpen ? ' nav-open' : '')}>
        <div className="nav-backdrop" onClick={() => setNavOpen(false)} />
        <Sidebar fullName={fullName} badges={badges} clientName={clientName} onNavigate={() => setNavOpen(false)} />
        <div className="main">
          <header className="topbar">
            <button className="nav-toggle" aria-label="Menu" onClick={() => setNavOpen((v) => !v)}>
              <Icon name="menu" size={20} />
            </button>
            <h1>{t(pageTitle(pathname))}</h1>
            <div className="topbar-spacer" />
            <LangToggle />
            <ThemeToggle />
          </header>
          <main style={{ flex: 1, minWidth: 0 }}>{children}</main>
        </div>
      </div>
    </RoleProvider>
  )
}
