'use server'
import { revalidatePath } from 'next/cache'
import { createServerClient } from '@/lib/supabase/server'

export async function createClient(formData: FormData) {
  const supabase = await createServerClient()

  const name = formData.get('name') as string
  const slug = formData.get('slug') as string
  const industry = (formData.get('industry') as string) || null
  if (!name || !slug) throw new Error('Nome e slug são obrigatórios')

  const { error } = await supabase.from('clients').insert({ name, slug, industry })
  if (error) throw new Error(error.message)

  revalidatePath('/admin/clients')
  revalidatePath('/admin')
}

export async function assignClientRep(formData: FormData) {
  const supabase = await createServerClient()

  const profileId = formData.get('profile_id') as string
  const clientId  = formData.get('client_id')  as string
  if (!profileId || !clientId) throw new Error('Campos obrigatórios')

  const { error } = await supabase
    .from('profiles')
    .update({ role: 'client_rep', client_id: clientId })
    .eq('id', profileId)

  if (error) throw new Error(error.message)
  revalidatePath('/admin/clients')
}

export async function createAllocation(formData: FormData) {
  const supabase = await createServerClient()

  const contractor_id = formData.get('contractor_id') as string
  const client_id     = formData.get('client_id')     as string
  const started_on    = formData.get('started_on')    as string
  if (!contractor_id || !client_id || !started_on) throw new Error('Campos obrigatórios')

  // Fecha alocação ativa anterior se existir
  await supabase
    .from('allocations')
    .update({ ended_on: started_on })
    .eq('contractor_id', contractor_id)
    .is('ended_on', null)

  const { error } = await supabase.from('allocations').insert({ contractor_id, client_id, started_on })
  if (error) throw new Error(error.message)

  revalidatePath('/admin/clients')
}
