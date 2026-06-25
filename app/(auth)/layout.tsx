import Image from 'next/image'
import { AuthAside } from '@/components/layout/AuthAside'
import { LangToggle } from '@/components/lecode/LangToggle'
import { ThemeToggle } from '@/components/lecode/ThemeToggle'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="auth">
      <AuthAside />

      {/* ── Right panel ────────────────────────────── */}
      <div className="auth-main">
        <div className="auth-topbar">
          <LangToggle />
          <ThemeToggle />
        </div>

        <div className="auth-mark-sm">
          <Image src="/lecode-logo.png" alt="LeCode" width={32} height={26} priority />
          <span>LeCode</span>
        </div>

        <div className="auth-card">
          {children}
        </div>
      </div>
    </div>
  )
}
