'use server'
import { revalidatePath } from 'next/cache'
import { createServerClient, createAdminClient } from '@/lib/supabase/server'
import { DEFAULT_QUESTIONS } from '@/lib/form-defaults'

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

  const { data: newFv } = await admin
    .from('form_versions')
    .insert({ cycle_id: cycle.id })
    .select('id')
    .single()

  if (newFv) {
    await admin.from('form_questions').insert(
      DEFAULT_QUESTIONS.map((q) => ({ ...q, form_version_id: newFv.id }))
    )
  }

  revalidatePath('/admin/cycles')
  revalidatePath('/admin')
}

export async function closeCycle(cycleId: string) {
  const supabase = await createServerClient()
  const { error } = await supabase.rpc('close_cycle', { p_cycle: cycleId })
  if (error) return { error: error.message }
  revalidatePath('/admin/cycles')
  revalidatePath('/admin')
  return { success: true }
}
