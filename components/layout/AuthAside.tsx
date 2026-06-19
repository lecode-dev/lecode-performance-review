'use client'
import { useLang, useTheme } from '@/lib/i18n'

export function AuthAside() {
  const { t } = useLang()
  const { theme } = useTheme()
  const logoSrc = theme === 'dark' ? '/lecode-logo.png' : '/lecode-logo-white.svg'

  return (
    <aside className="auth-aside">
      <div className="auth-brand">
        <img src={logoSrc} alt="LeCode" />
        <div>
          <div className="ab-name">LeCode</div>
          <div className="ab-sub">performance_review</div>
        </div>
      </div>

      <div className="auth-hero">
        <div className="auth-eyebrow">
          <span className="lg-dot" />
          {t('Outsourcing de engenharia · desde 2019')}
        </div>

        <h2>
          {t('Desenvolvimento')} <em>{t('Ágil,')}</em>{' '}
          {t('Gestão Simplificada.')}
        </h2>

        <p>
          {t('Acompanhe seus ciclos de avaliação e seu desenvolvimento ao longo do tempo na LeCode.')}
        </p>

        <div className="terminal" style={{ marginTop: 32 }}>
          <div className="terminal-bar">
            <span className="dot" style={{ background: '#ff5f57' }} />
            <span className="dot" style={{ background: '#febc2e' }} />
            <span className="dot" style={{ background: '#28c840' }} />
            <span className="tb-title">~/lecode/performance · zsh</span>
          </div>
          <div className="terminal-body">
            <div className="t-line">
              <span className="t-prompt">$</span> lecode review open --cycle &quot;Jul/2026&quot;
            </div>
            <div className="t-line t-ok">✓ Ciclo aberto com sucesso</div>
            <div className="t-line" style={{ marginTop: 8 }}>
              <span className="t-prompt">$</span> lecode score --self 0.30
              <span className="caret" />
            </div>
          </div>
        </div>
      </div>

      <div className="auth-foot">
        © {new Date().getFullYear()} LeCode · Todos os direitos reservados
      </div>
    </aside>
  )
}
