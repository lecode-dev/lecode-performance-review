import { type NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const supabase = await createServerClient()
  await supabase.auth.signOut()
  const url = new URL('/login', request.url)
  return NextResponse.redirect(url)
}
