'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, AlertCircle } from 'lucide-react'
import { getBrowserClient } from '@/lib/supabase/client'
import { useLang } from '@/lib/i18n'

export default function LoginPage() {
  const router   = useRouter()
  const { t }    = useLang()
  const [email,   setEmail]   = useState('')
  const [password, setPassword] = useState('')
  const [showPw,  setShowPw]  = useState(false)
  const [error,   setError]   = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const supabase = getBrowserClient()
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password })
    if (authError) {
      setError(t('E-mail ou senha incorretos.'))
      setLoading(false)
      return
    }
    router.push('/')
    router.refresh()
  }

  return (
    <>
      <h1>{t('Bem-vindo de volta')}</h1>
      <p className="sub">{t('Acesse a plataforma de performance review da LeCode.')}</p>

      <form onSubmit={handleSubmit} className="auth-form">
        <div className="field">
          <label htmlFor="email">{t('E-mail corporativo')}</label>
          <input
            id="email"
            type="email"
            className={'input' + (error ? ' err' : '')}
            autoComplete="email"
            required
            value={email}
            onChange={(e) => { setEmail(e.target.value); setError(null) }}
            placeholder="voce@empresa.com"
          />
        </div>

        <div className="field">
          <div className="auth-row">
            <label htmlFor="password">{t('Senha')}</label>
            <Link href="/recover" className="link" style={{ fontSize: 12 }}>
              {t('Esqueceu a senha?')}
            </Link>
          </div>
          <div className="pw-wrap">
            <input
              id="password"
              type={showPw ? 'text' : 'password'}
              className={'input' + (error ? ' err' : '')}
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(null) }}
              placeholder="••••••••"
            />
            <button
              type="button"
              className="pw-toggle"
              onClick={() => setShowPw((v) => !v)}
              tabIndex={-1}
              aria-label={showPw ? t('Ocultar senha') : t('Mostrar senha')}
            >
              {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
        </div>

        {error && (
          <div className="field-err">
            <AlertCircle />
            {error}
          </div>
        )}

        <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
          {loading ? t('Entrando…') : <>{t('Entrar')} →</>}
        </button>
      </form>

      <div className="auth-or">{t('ou')}</div>

      <button type="button" className="btn btn-block" style={{ gap: 8 }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
        {t('Continuar com SSO')}
      </button>

      <p className="auth-switch">
        {t('Não tem conta?')}{' '}
        <Link href="/signup" className="link">{t('Cadastre-se')}</Link>
      </p>
    </>
  )
}
