'use server'
import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/server'

export async function createContractor(data: {
  name: string; role: string; seniority: string; track: string; clientId: string | null
}) {
  const admin = createAdminClient()

  const email = `${data.name.toLowerCase().replace(/\s+/g, '.')}@placeholder.lecode.dev`
  const since = new Date().toISOString().slice(0, 7)

  const { data: authUser, error: authErr } = await admin.auth.admin.createUser({
    email,
    password: crypto.randomUUID(),
    email_confirm: true,
    user_metadata: { full_name: data.name },
  })
  if (authErr) throw new Error(authErr.message)
  const userId = authUser.user.id

  await admin.from('profiles').update({
    full_name: data.name, email,
  }).eq('id', userId)

  await admin.from('contractors').update({
    seniority: data.seniority, track: data.track, since,
  }).eq('id', userId)

  if (data.clientId) {
    await admin.from('allocations').insert({
      contractor_id: userId, client_id: data.clientId,
      started_on: new Date().toISOString().slice(0, 10),
    })
  }

  revalidatePath('/admin/contractors')
  revalidatePath('/admin')
}

export async function updateContractor(
  contractorId: string,
  data: { name: string; role: string; seniority: string; track: string },
  adminName: string,
) {
  const admin = createAdminClient()

  const { data: prev } = await admin
    .from('contractors').select('seniority, track').eq('id', contractorId).single()
  const { data: profile } = await admin
    .from('profiles').select('full_name').eq('id', contractorId).single()

  await admin.from('profiles').update({ full_name: data.name }).eq('id', contractorId)
  await admin.from('contractors').update({
    seniority: data.seniority, track: data.track,
  }).eq('id', contractorId)

  const changes: { field: string; old_value: string; new_value: string }[] = []
  if (prev && prev.seniority !== data.seniority) changes.push({ field: 'seniority', old_value: prev.seniority, new_value: data.seniority })
  if (prev && prev.track !== data.track) changes.push({ field: 'track', old_value: prev.track, new_value: data.track })
  if (profile && profile.full_name !== data.name) changes.push({ field: 'role', old_value: profile.full_name, new_value: data.name })

  for (const c of changes) {
    await admin.from('contractor_changelog').insert({
      contractor_id: contractorId, field: c.field,
      old_value: c.old_value, new_value: c.new_value,
      changed_by: adminName,
    })
  }

  revalidatePath(`/admin/contractors/${contractorId}`)
  revalidatePath('/admin/contractors')
}

export async function updateAllocation(
  contractorId: string,
  newClientId: string | null,
  adminName: string,
) {
  const admin = createAdminClient()
  const today = new Date().toISOString().slice(0, 10)

  const { data: currentAlloc } = await admin
    .from('allocations')
    .select('id, client_id, clients(name)')
    .eq('contractor_id', contractorId)
    .is('ended_on', null)
    .single()

  const oldClientName = currentAlloc
    ? (currentAlloc.clients as { name: string } | null)?.name ?? null
    : null

  if (currentAlloc) {
    await admin.from('allocations').update({ ended_on: today }).eq('id', currentAlloc.id)
  }

  if (newClientId) {
    await admin.from('allocations').insert({
      contractor_id: contractorId, client_id: newClientId, started_on: today,
    })
    const { data: newClient } = await admin.from('clients').select('name').eq('id', newClientId).single()
    await admin.from('contractor_changelog').insert({
      contractor_id: contractorId, field: 'allocation',
      old_value: oldClientName ?? 'Sem alocação',
      new_value: newClient?.name ?? '—',
      changed_by: adminName,
    })
  } else if (currentAlloc) {
    await admin.from('contractor_changelog').insert({
      contractor_id: contractorId, field: 'allocation',
      old_value: oldClientName ?? '—',
      new_value: 'Sem alocação',
      changed_by: adminName,
    })
  }

  revalidatePath(`/admin/contractors/${contractorId}`)
  revalidatePath('/admin/contractors')
  revalidatePath('/admin')
}
