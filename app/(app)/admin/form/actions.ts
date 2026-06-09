'use server'
import { revalidatePath } from 'next/cache'
import { createServerClient } from '@/lib/supabase/server'
import type { DimensionKey, ReviewType } from '@/lib/supabase/types'

export async function addQuestion(formData: FormData) {
  const supabase = await createServerClient()

  const form_version_id = formData.get('form_version_id') as string
  const dimension       = formData.get('dimension')       as DimensionKey
  const text            = formData.get('text')            as string
  const order_index     = parseInt(formData.get('order_index') as string, 10)
  const applies_to      = formData.get('applies_to')      as ReviewType

  if (!form_version_id || !dimension || !text || !applies_to) throw new Error('Campos obrigatórios')

  const { error } = await supabase.from('form_questions').insert({
    form_version_id, dimension, text, order_index: order_index || 1, applies_to,
  })

  if (error) throw new Error(error.message)
  revalidatePath('/admin/form')
}

export async function updateWeights(formData: FormData) {
  const supabase = await createServerClient()

  const form_version_id = formData.get('form_version_id') as string
  const self_weight     = parseFloat(formData.get('self_weight')   as string)
  const client_weight   = parseFloat(formData.get('client_weight') as string)

  if (Math.abs(self_weight + client_weight - 1.0) > 0.001) throw new Error('Pesos devem somar 1.0')

  const { error } = await supabase
    .from('form_versions')
    .update({ self_weight, client_weight })
    .eq('id', form_version_id)

  if (error) throw new Error(error.message)
  revalidatePath('/admin/form')
}
