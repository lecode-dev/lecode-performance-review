'use server'
import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/server'

export async function createCycle(formData: FormData) {
  const admin = createAdminClient()

  const name      = formData.get('name')      as string
  const opens_at  = formData.get('opens_at')  as string
  const closes_at = formData.get('closes_at') as string

  if (!name || !opens_at || !closes_at) throw new Error('Campos obrigatórios')

  const { data: cycle, error: cycleErr } = await admin
    .from('cycles')
    .insert({ name, opens_at, closes_at })
    .select()
    .single()

  if (cycleErr) throw new Error(cycleErr.message)

  await admin.from('form_versions').insert({ cycle_id: cycle.id })

  revalidatePath('/admin/cycles')
  revalidatePath('/admin')
}

export async function closeCycle(cycleId: string) {
  const admin = createAdminClient()
  const { error } = await admin.rpc('close_cycle', { p_cycle: cycleId })
  if (error) throw new Error(error.message)
  revalidatePath('/admin/cycles')
  revalidatePath('/admin')
}
