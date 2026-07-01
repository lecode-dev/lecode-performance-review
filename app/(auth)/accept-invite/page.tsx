'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getBrowserClient } from '@/lib/supabase/client'
import { useLang } from '@/lib/i18n'
import { Icon } from '@/components/lecode/Icon'
import Image from 'next/image'

export default function AcceptInvitePage() {
  const router = useRouter()
  const { t } = useLang()
  const [ready, setReady] = useState(false)
  const [invalid, setInvalid] = useState(false)
  const [userName, setUserName] = useState<string | null>(null)
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    const supabase = getBrowserClient()

    async function processInvite() {
      const hash = window.location.hash
      const params = new URLSearchParams(hash.startsWith('#') ? hash.slice(1) : hash)
      const type = params.get('type')
      const accessToken = params.get('access_token')
      const refreshToken = params.get('refresh_token') ?? ''

      if (type !== 'invite' || !accessToken) {
        setInvalid(true)
        return
      }

      // Clear any existing session so we don't accidentally modify the wrong user
      await supabase.auth.signOut()

      // Exchange the invite token for a real session
      const { data, error: sessionErr } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      })

      if (sessionErr || !data.session?.user) {
        setInvalid(true)
        return
      }

      const name = data.session.user.user_metadata?.full_name as string | undefined
      setUserName(name ?? null)
      // Remove hash from URL without reload
      window.history.replaceState(null, '', window.location.pathname)
      setReady(true)
    }

    processInvite()
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (password !== confirm) {
      setError(t('As senhas não coincidem.'))
      return
    }
    if (password.length < 8) {
      setError(t('A senha deve ter pelo menos 8 caracteres.'))
      return
    }
    setLoading(true)
    const supabase = getBrowserClient()
    const { error: updateError } = await supabase.auth.updateUser({ password })
    if (updateError) {
      setError(updateError.message)
      setLoading(false)
      return
    }
    setSuccess(true)
    await supabase.auth.signOut()
    setTimeout(() => router.push('/login'), 2500)
  }

  if (success) {
    return (
      <>
        <div style={{ display: 'grid', placeItems: 'center', width: 48, height: 48, borderRadius: 12, background: 'var(--accent-soft)', color: 'var(--accent-ink)', marginBottom: 12 }}>
          <Icon name="check" size={24} />
        </div>
        <h1>{t('Senha definida!')}</h1>
        <p className="sub">{t('Sua conta está pronta. Redirecionando para o login...')}</p>
      </>
    )
  }

  if (invalid) {
    return (
      <>
        <div style={{ display: 'grid', placeItems: 'center', width: 48, height: 48, borderRadius: 12, background: 'oklch(0.35 0.08 25)', color: 'oklch(0.7 0.18 25)', marginBottom: 12 }}>
          <Icon name="warning" size={24} />
        </div>
        <h1>{t('Link inválido')}</h1>
        <p className="sub">{t('Este link de convite é inválido ou já foi utilizado. Solicite um novo convite ao administrador.')}</p>
        <button className="btn btn-primary" style={{ marginTop: 8 }} onClick={() => router.push('/login')}>
          {t('Ir para o login')}
        </button>
      </>
    )
  }

  if (!ready) {
    return (
      <>
        <div style={{ display: 'grid', placeItems: 'center', width: 48, height: 48, borderRadius: 12, background: 'var(--surface-2)', color: 'var(--ink-3)', marginBottom: 12 }}>
          <Icon name="cycle" size={24} />
        </div>
        <h1>{t('Verificando convite...')}</h1>
        <p className="sub">{t('Aguarde enquanto validamos seu link.')}</p>
      </>
    )
  }

  return (
    <>
      <div className="row" style={{ gap: 10, marginBottom: 4 }}>
        <Image src="/lecode-logo.png" alt="LeCode" width={28} height={22} />
        <span style={{ fontWeight: 700, fontSize: 15 }}>LeCode Performance Review</span>
      </div>
      <h1 style={{ marginTop: 8 }}>
        {userName ? `${t('Bem-vindo')}, ${userName.split(' ')[0]}!` : t('Bem-vindo!')}
      </h1>
      <p className="sub">{t('Escolha uma senha para acessar sua conta na plataforma de avaliação de performance.')}</p>

      <form onSubmit={handleSubmit} className="auth-form">
        <div className="field">
          <label htmlFor="password">{t('Criar senha')}</label>
          <div className="pw-wrap">
            <input
              id="password"
              type={showPw ? 'text' : 'password'}
              className={'input' + (error ? ' err' : '')}
              autoComplete="new-password"
              required
              autoFocus
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(null) }}
              placeholder="Mínimo 8 caracteres"
            />
            <button
              type="button"
              className="pw-toggle"
              onClick={() => setShowPw((v) => !v)}
              tabIndex={-1}
              aria-label={showPw ? t('Ocultar senha') : t('Mostrar senha')}
            >
              <Icon name={showPw ? 'eyeOff' : 'eye'} size={15} />
            </button>
          </div>
        </div>

        <div className="field">
          <label htmlFor="confirm">{t('Confirmar senha')}</label>
          <input
            id="confirm"
            type={showPw ? 'text' : 'password'}
            className={'input' + (error ? ' err' : '')}
            autoComplete="new-password"
            required
            value={confirm}
            onChange={(e) => { setConfirm(e.target.value); setError(null) }}
            placeholder="Repita a senha"
          />
        </div>

        {error && (
          <div className="field-err">
            <Icon name="warning" size={16} />
            {error}
          </div>
        )}

        <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
          {loading ? t('Salvando...') : <><Icon name="check" size={15} /> {t('Acessar plataforma')}</>}
        </button>
      </form>
    </>
  )
}
