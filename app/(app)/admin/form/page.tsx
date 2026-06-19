import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { AdminFormView } from '@/components/lecode/screens/AdminFormView'
import type { DimensionKey } from '@/lib/supabase/types'

export default async function FormPage() {
  const supabase = await createServerClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', session.user.id).single()
  if (profile?.role !== 'lecode_admin') redirect('/admin')

  const { data: cycle } = await supabase
    .from('cycles')
    .select('id, name')
    .eq('status', 'open')
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  let formVersionId: string | null = null
  let selfWeight = 0.3
  let clientWeight = 0.7
  let questions: { id: string; dimension: DimensionKey; text: string; order_index: number; applies_to: string }[] = []

  if (cycle) {
    const { data: fv } = await supabase
      .from('form_versions')
      .select('*')
      .eq('cycle_id', cycle.id)
      .single()

    if (fv) {
      formVersionId = fv.id
      selfWeight = fv.self_weight
      clientWeight = fv.client_weight

      const { data: qs } = await supabase
        .from('form_questions')
        .select('id, dimension, text, order_index, applies_to')
        .eq('form_version_id', fv.id)
        .order('dimension')
        .order('order_index')

      questions = qs ?? []
    }
  }

  return (
    <AdminFormView
      cycleName={cycle?.name ?? null}
      formVersionId={formVersionId}
      selfWeight={selfWeight}
      clientWeight={clientWeight}
      questions={questions}
    />
  )
}
