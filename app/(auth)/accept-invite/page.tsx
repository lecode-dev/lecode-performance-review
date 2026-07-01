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
  const [userName, setUserName] = useState<string | null>(null)
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    const supabase = getBrowserClient()
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && session?.user) {
        const name = session.user.user_metadata?.full_name as string | undefined
        setUserName(name ?? null)
        setReady(true)
      }
    })
    return () => subscription.unsubscribe()
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
