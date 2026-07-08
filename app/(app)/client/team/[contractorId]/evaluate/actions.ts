'use server'
import { revalidatePath, revalidateTag } from 'next/cache'
import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'

export async function submitClientReview(reviewId: string) {
  const supabase = await createServerClient()
  const { data: { session } } = await supabase.auth.getSession()
  const { error } = await supabase.rpc('submit_review', { p_review: reviewId })
  if (error) throw new Error(error.message)
  if (session) revalidateTag(`nav-badges:${session.user.id}`, { expire: 0 })
  revalidatePath('/client/team')
  redirect('/client/team')
}
