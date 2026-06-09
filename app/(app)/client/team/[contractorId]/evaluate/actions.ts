'use server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'

export async function submitClientReview(reviewId: string) {
  const supabase = await createServerClient()
  const { error } = await supabase.rpc('submit_review', { p_review: reviewId })
  if (error) throw new Error(error.message)
  revalidatePath('/client/team')
  redirect('/client/team')
}
