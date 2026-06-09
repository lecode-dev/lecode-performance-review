'use server'
import { revalidatePath } from 'next/cache'
import { createServerClient } from '@/lib/supabase/server'

export async function createCycle(formData: FormData) {
  const supabase = await createServerClient()

  const name      = formData.get('name')      as string
  const opens_at  = formData.get('opens_at')  as string
  const closes_at = formData.get('closes_at') as string

  if (!name || !opens_at || !closes_at) throw new Error('Campos obrigatórios')

  const { data: cycle, error: cycleErr } = await supabase
    .from('cycles')
    .insert({ name, opens_at, closes_at })
    .select()
    .single()

  if (cycleErr) throw new Error(cycleErr.message)

  // Cria form_version padrão (pesos 30/70)
  await supabase.from('form_versions').insert({ cycle_id: cycle.id })

  revalidatePath('/admin/cycles')
  revalidatePath('/admin')
}

export async function closeCycle(cycleId: string) {
  const supabase = await createServerClient()
  const { error } = await supabase.rpc('close_cycle', { p_cycle: cycleId })
  if (error) throw new Error(error.message)
  revalidatePath('/admin/cycles')
  revalidatePath('/admin')
}
