'use client'
import { useState } from 'react'
import Link from 'next/link'
import { getBrowserClient } from '@/lib/supabase/client'
import { useLang } from '@/lib/i18n'
import { Icon } from '@/components/lecode/Icon'

export default function RecoverPage() {
  const { t } = useLang()
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const supabase = getBrowserClient()
    const { error: authError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/update-password`,
    })

    if (authError) {
      setError(authError.message)
    } else {
      setSuccess(true)
    }
    setLoading(false)
  }

  if (success) {
    return (
      <>
        <div style={{ display: 'grid', placeItems: 'center', width: 48, height: 48, borderRadius: 12, background: 'var(--accent-soft)', color: 'var(--accent-ink)', marginBottom: 12 }}>
          <Icon name="send" size={24} />
        </div>
        <h1>{t('Link enviado')}</h1>
        <p className="sub">
          {t('Enviamos um link de redefinição de senha para')} <strong>{email}</strong>.
        </p>
        <p className="sub" style={{ marginTop: 8 }}>
          {t('Verifique sua caixa de entrada e a pasta de spam. O link expira em 60 minutos.')}
        </p>
        <Link href="/login" className="btn btn-primary btn-block" style={{ marginTop: 20 }}>
          {t('Voltar ao login')}
        </Link>
      </>
    )
  }

  return (
    <>
      <div style={{ display: 'grid', placeItems: 'center', width: 48, height: 48, borderRadius: 12, background: 'var(--accent-soft)', color: 'var(--accent-ink)', marginBottom: 12 }}>
        <Icon name="lock" size={24} />
      </div>
      <h1>{t('Recupere seu acesso')}</h1>
      <p className="sub">{t('Informe o e-mail da sua conta e enviaremos um link para redefinir a senha.')}</p>

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

        {error && (
          <div className="field-err">
            <Icon name="warning" size={16} />
            {error}
          </div>
        )}

        <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
          {loading ? t('Enviando...') : <><Icon name="send" size={15} /> {t('Enviar link de recuperação')}</>}
        </button>
      </form>

      <p className="auth-switch muted" style={{ fontSize: 12.5 }}>
        {t('Lembrou a senha?')}{' '}
        <Link href="/login" className="link">{t('Voltar ao login')}</Link>
      </p>
    </>
  )
}
