'use server'
import { revalidatePath } from 'next/cache'
import { createServerClient, createAdminClient } from '@/lib/supabase/server'
import type { UserRole } from '@/lib/supabase/types'

async function requireAdmin() {
  const supabase = await createServerClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) throw new Error('Não autenticado')
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', session.user.id).single()
  if (profile?.role !== 'lecode_admin') throw new Error('Acesso negado')
}

export async function inviteUser(formData: FormData) {
  try {
    await requireAdmin()
  } catch {
    return { error: 'Acesso negado.' }
  }

  const admin = createAdminClient()

  const email = (formData.get('email') as string)?.trim()
  const fullName = (formData.get('full_name') as string)?.trim()
  const role = formData.get('role') as string
  const clientId = (formData.get('client_id') as string) || null

  if (!email || !fullName || !role) {
    return { error: 'Nome, e-mail e perfil são obrigatórios.' }
  }

  if (!['contractor', 'client_rep'].includes(role)) {
    return { error: 'Perfil inválido.' }
  }

  if (role === 'client_rep' && !clientId) {
    return { error: 'Selecione o cliente para o representante.' }
  }

  const { data: authData, error: authErr } = await admin.auth.admin.inviteUserByEmail(email, {
    data: { full_name: fullName },
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'}/login`,
  })

  if (authErr) {
    if (authErr.message.includes('already been registered')) {
      return { error: 'Este e-mail já está cadastrado.' }
    }
    return { error: authErr.message }
  }

  const userId = authData.user.id

  const { error: profileErr } = await admin.from('profiles').update({
    full_name: fullName,
    role: role as UserRole,
    ...(role === 'client_rep' && clientId ? { client_id: clientId } : {}),
  }).eq('id', userId)

  if (profileErr) return { error: 'Erro ao configurar perfil do usuário.' }

  const { error: metaErr } = await admin.auth.admin.updateUserById(userId, {
    app_metadata: { role },
  })

  if (metaErr) return { error: 'Erro ao configurar permissões do usuário.' }

  if (role === 'contractor') {
    const since = new Date().toISOString().slice(0, 7)
    const { error: contractorErr } = await admin.from('contractors').upsert({ id: userId, since })
    if (contractorErr) return { error: 'Erro ao registrar contratado.' }

    if (clientId) {
      const { error: allocationErr } = await admin.from('allocations').insert({
        contractor_id: userId,
        client_id: clientId,
        started_on: new Date().toISOString().slice(0, 10),
      })
      if (allocationErr) return { error: 'Erro ao registrar alocação.' }
    }
  }

  revalidatePath('/admin/accounts')
  revalidatePath('/admin/contractors')
  revalidatePath('/admin/clients')
  revalidatePath('/admin')
  return { success: true }
}

export async function resendInvite(userId: string) {
  try {
    await requireAdmin()
  } catch {
    return { error: 'Acesso negado.' }
  }

  const admin = createAdminClient()

  const { data: user, error: fetchErr } = await admin.auth.admin.getUserById(userId)
  if (fetchErr || !user?.user?.email) {
    return { error: 'Usuário não encontrado.' }
  }

  const { error } = await admin.auth.admin.inviteUserByEmail(user.user.email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'}/login`,
  })

  if (error) return { error: error.message }
  return { success: true }
}
