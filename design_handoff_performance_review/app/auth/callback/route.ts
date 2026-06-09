// =============================================================================
// app/auth/callback/route.ts · troca o code do magic-link/OAuth por sessão.
// =============================================================================

import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { HOME_BY_ROLE } from '@/lib/auth';
import type { UserRole } from '@/lib/database.types';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');

  if (code) {
    const supabase = await createClient();
    await supabase.auth.exchangeCodeForSession(code);

    const { data: { user } } = await supabase.auth.getUser();
    const role = (user?.app_metadata?.role as UserRole | undefined) ?? 'contractor';
    return NextResponse.redirect(`${origin}${HOME_BY_ROLE[role]}`);
  }
  return NextResponse.redirect(`${origin}/login`);
}
