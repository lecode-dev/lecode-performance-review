// =============================================================================
// lib/supabase/server.ts · cliente Supabase para Server Components / Route Handlers
// Lê os cookies da sessão → todas as queries rodam com o JWT do usuário,
// portanto a RLS é a barreira real. Requer @supabase/ssr.
// =============================================================================

import { cookies } from 'next/headers';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import type { Database } from '@/lib/database.types';

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }: { name: string; value: string; options: CookieOptions }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Chamado de um Server Component — ignore; o middleware renova a sessão.
          }
        },
      },
    },
  );
}
