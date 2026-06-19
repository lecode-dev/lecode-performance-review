#!/usr/bin/env node
/**
 * Cria 3 usuários de teste (admin, client_rep, contractor) com senha '12345'.
 *
 * Uso:
 *   node scripts/seed-users.mjs <SUPABASE_SERVICE_ROLE_KEY>
 *
 * Ou defina a env var:
 *   SUPABASE_SERVICE_ROLE_KEY=... node scripts/seed-users.mjs
 *
 * Pega a service role key no Supabase Dashboard:
 *   Settings → API → service_role (secret)
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://pwadgofokyteldlerodb.supabase.co'
const SERVICE_KEY  = process.argv[2] || process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SERVICE_KEY) {
  console.error('❌  Passe a service_role key como argumento ou via env SUPABASE_SERVICE_ROLE_KEY')
  console.error('   Encontre em: Supabase Dashboard → Settings → API → service_role (secret)')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const USERS = [
  { email: 'admin@lecode.dev',      password: '12345', fullName: 'Admin LeCode',       role: 'lecode_admin' },
  { email: 'cliente@lecode.dev',     password: '12345', fullName: 'Maria Representante', role: 'client_rep' },
  { email: 'contratado@lecode.dev',  password: '12345', fullName: 'João Desenvolvedor',  role: 'contractor' },
]

async function main() {
  console.log('🔧  Criando usuários de teste...\n')

  // 1 — Garante que existe pelo menos 1 cliente para vincular o client_rep
  let clientId = null
  const { data: existingClients } = await supabase.from('clients').select('id, name').limit(1)

  if (existingClients?.length) {
    clientId = existingClients[0].id
    console.log(`✔  Cliente existente: ${existingClients[0].name} (${clientId})`)
  } else {
    const { data: newClient, error: clientErr } = await supabase
      .from('clients')
      .insert({ name: 'Acme Corp', slug: 'acme', industry: 'Tecnologia' })
      .select('id')
      .single()

    if (clientErr) {
      console.error('❌  Erro ao criar cliente:', clientErr.message)
    } else {
      clientId = newClient.id
      console.log(`✔  Cliente criado: Acme Corp (${clientId})`)
    }
  }

  // 2 — Cria cada usuário
  for (const u of USERS) {
    // Verifica se já existe
    const { data: existingUsers } = await supabase.auth.admin.listUsers()
    const existing = existingUsers?.users?.find(usr => usr.email === u.email)

    if (existing) {
      console.log(`⏭  ${u.email} já existe (${existing.id}) — atualizando role...`)
      // Atualiza role
      await supabase
        .from('profiles')
        .update({
          role: u.role,
          full_name: u.fullName,
          ...(u.role === 'client_rep' && clientId ? { client_id: clientId } : {}),
        })
        .eq('id', existing.id)

      console.log(`   → role: ${u.role}`)
      continue
    }

    // Cria usuário com auto-confirm
    const { data: authData, error: authErr } = await supabase.auth.admin.createUser({
      email: u.email,
      password: u.password,
      email_confirm: true,
      user_metadata: { full_name: u.fullName },
    })

    if (authErr) {
      console.error(`❌  ${u.email}: ${authErr.message}`)
      continue
    }

    const userId = authData.user.id
    console.log(`✔  ${u.email} criado (${userId})`)

    // O trigger handle_new_user cria profile com role='contractor' e contractor row.
    // Agora atualiza para o role correto + vincula client_id se for client_rep.
    if (u.role !== 'contractor') {
      const updateData = { role: u.role }
      if (u.role === 'client_rep' && clientId) {
        updateData.client_id = clientId
      }

      const { error: profileErr } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', userId)

      if (profileErr) {
        console.error(`   ⚠  Erro ao atualizar profile: ${profileErr.message}`)
      } else {
        console.log(`   → role: ${u.role}${u.role === 'client_rep' ? ` (client_id: ${clientId})` : ''}`)
      }
    }

    // Se for contractor, cria uma alocação ao cliente (se existir)
    if (u.role === 'contractor' && clientId) {
      await supabase.from('allocations').insert({
        contractor_id: userId,
        client_id: clientId,
        started_on: new Date().toISOString().slice(0, 10),
      })
      console.log(`   → alocado em Acme Corp`)
    }
  }

  console.log('\n✅  Pronto! Credenciais:\n')
  console.log('   ┌──────────────────────────┬───────────────────┬─────────┐')
  console.log('   │ E-mail                   │ Role              │ Senha   │')
  console.log('   ├──────────────────────────┼───────────────────┼─────────┤')
  console.log('   │ admin@lecode.dev         │ lecode_admin      │ 12345   │')
  console.log('   │ cliente@lecode.dev       │ client_rep        │ 12345   │')
  console.log('   │ contratado@lecode.dev    │ contractor        │ 12345   │')
  console.log('   └──────────────────────────┴───────────────────┴─────────┘')
}

main().catch(err => {
  console.error('Erro fatal:', err)
  process.exit(1)
})
