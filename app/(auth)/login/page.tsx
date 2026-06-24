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

      <p className="auth-switch muted" style={{ fontSize: 12.5 }}>
        {t('Solicite suas credenciais ao administrador LeCode.')}
      </p>
    </>
  )
}
