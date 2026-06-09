'use client'
import { useState } from 'react'
import Link from 'next/link'
import { getBrowserClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function RecoverPage() {
  const [email,   setEmail]   = useState('')
  const [error,   setError]   = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const supabase = getBrowserClient()
    const { error: authError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/login`,
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
      <div className="space-y-4 text-center">
        <h2 className="text-xl font-semibold">E-mail enviado</h2>
        <p className="text-sm text-muted-foreground">
          Verifique sua caixa de entrada para o link de recuperação.
        </p>
        <Link href="/login" className="block text-sm font-medium hover:underline">
          Voltar para o login
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Recuperar senha</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Enviaremos um link para redefinir sua senha
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email">E-mail</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="voce@empresa.com"
          />
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? 'Enviando…' : 'Enviar link de recuperação'}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Lembrou a senha?{' '}
        <Link href="/login" className="font-medium text-foreground hover:underline">
          Voltar para o login
        </Link>
      </p>
    </div>
  )
}
