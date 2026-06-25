'use server'
import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/server'
import type { DimensionKey } from '@/lib/supabase/types'

export async function addQuestion(formData: FormData) {
  const admin = createAdminClient()

  const form_version_id = formData.get('form_version_id') as string
  const dimension       = formData.get('dimension')       as DimensionKey
  const text            = formData.get('text')            as string
  const order_index     = parseInt(formData.get('order_index') as string, 10) || 1

  if (!form_version_id || !dimension || !text) throw new Error('Campos obrigatórios')

  const { error } = await admin.from('form_questions').insert([
    { form_version_id, dimension, text, order_index, applies_to: 'self' },
    { form_version_id, dimension, text, order_index, applies_to: 'client' },
  ])

  if (error) throw new Error(error.message)
  revalidatePath('/admin/form')
}

export async function updateWeights(formData: FormData) {
  const admin = createAdminClient()

  const form_version_id = formData.get('form_version_id') as string
  const rawSelf   = parseFloat(formData.get('self_weight')   as string)
  const rawClient = parseFloat(formData.get('client_weight') as string)

  if (Math.abs(rawSelf + rawClient - 100) > 1) throw new Error('Pesos devem somar 100%')

  const self_weight   = rawSelf / 100
  const client_weight = rawClient / 100

  const { error } = await admin
    .from('form_versions')
    .update({ self_weight, client_weight })
    .eq('id', form_version_id)

  if (error) throw new Error(error.message)
  revalidatePath('/admin/form')
}

export async function removeQuestion(formData: FormData) {
  const admin = createAdminClient()

  const id = formData.get('question_id') as string
  if (!id) throw new Error('ID obrigatório')

  const { data: question } = await admin
    .from('form_questions')
    .select('form_version_id, dimension, text')
    .eq('id', id)
    .single()

  if (!question) throw new Error('Pergunta não encontrada')

  const { error } = await admin
    .from('form_questions')
    .delete()
    .eq('form_version_id', question.form_version_id)
    .eq('dimension', question.dimension)
    .eq('text', question.text)

  if (error) throw new Error(error.message)
  revalidatePath('/admin/form')
}
