'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getBrowserClient } from '@/lib/supabase/client'
import { useLang } from '@/lib/i18n'
import { Icon } from '@/components/lecode/Icon'

export default function UpdatePasswordPage() {
  const router = useRouter()
  const { t } = useLang()
  const [ready, setReady] = useState(false)
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    const supabase = getBrowserClient()
    // Supabase sets an active session when the recovery token is detected in the URL hash
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setReady(true)
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
    setTimeout(() => router.push('/'), 2000)
  }

  if (success) {
    return (
      <>
        <div style={{ display: 'grid', placeItems: 'center', width: 48, height: 48, borderRadius: 12, background: 'var(--accent-soft)', color: 'var(--accent-ink)', marginBottom: 12 }}>
          <Icon name="check" size={24} />
        </div>
        <h1>{t('Senha atualizada')}</h1>
        <p className="sub">{t('Sua senha foi redefinida com sucesso. Redirecionando...')}</p>
      </>
    )
  }

  if (!ready) {
    return (
      <>
        <div style={{ display: 'grid', placeItems: 'center', width: 48, height: 48, borderRadius: 12, background: 'var(--surface-2)', color: 'var(--ink-3)', marginBottom: 12 }}>
          <Icon name="lock" size={24} />
        </div>
        <h1>{t('Verificando link...')}</h1>
        <p className="sub">{t('Aguarde enquanto validamos seu link de recuperação.')}</p>
      </>
    )
  }

  return (
    <>
      <div style={{ display: 'grid', placeItems: 'center', width: 48, height: 48, borderRadius: 12, background: 'var(--accent-soft)', color: 'var(--accent-ink)', marginBottom: 12 }}>
        <Icon name="lock" size={24} />
      </div>
      <h1>{t('Criar nova senha')}</h1>
      <p className="sub">{t('Escolha uma senha segura para sua conta.')}</p>

      <form onSubmit={handleSubmit} className="auth-form">
        <div className="field">
          <label htmlFor="password">{t('Nova senha')}</label>
          <div className="pw-wrap">
            <input
              id="password"
              type={showPw ? 'text' : 'password'}
              className={'input' + (error ? ' err' : '')}
              autoComplete="new-password"
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
            placeholder="••••••••"
          />
        </div>

        {error && (
          <div className="field-err">
            <Icon name="warning" size={16} />
            {error}
          </div>
        )}

        <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
          {loading ? t('Salvando...') : <><Icon name="check" size={15} /> {t('Salvar nova senha')}</>}
        </button>
      </form>
    </>
  )
}
