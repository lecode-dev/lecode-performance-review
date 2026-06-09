import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { UserRole } from '@/lib/supabase/types'

const ROLE_PREFIXES: Record<string, UserRole> = {
  '/admin':      'lecode_admin',
  '/client':     'client_rep',
  '/contractor': 'contractor',
}

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Renova a sessão (essencial para manter tokens frescos)
  const { data: { session } } = await supabase.auth.getSession()

  const { pathname } = request.nextUrl

  // Rota pública: deixa passar
  if (pathname.startsWith('/login') || pathname.startsWith('/signup') || pathname.startsWith('/recover')) {
    // Redireciona usuário já autenticado para a área correta
    if (session) {
      const role = session.user.app_metadata?.role as UserRole | undefined
      return NextResponse.redirect(new URL(roleDefaultPath(role), request.url))
    }
    return response
  }

  // Área protegida: exige sessão
  if (!session) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Gate grosseiro por prefixo — autoridade real é sempre o RLS no banco
  const role = session.user.app_metadata?.role as UserRole | undefined

  for (const [prefix, required] of Object.entries(ROLE_PREFIXES)) {
    if (pathname.startsWith(prefix) && role !== required) {
      return NextResponse.redirect(new URL(roleDefaultPath(role), request.url))
    }
  }

  return response
}

function roleDefaultPath(role: UserRole | undefined): string {
  switch (role) {
    case 'lecode_admin': return '/admin'
    case 'client_rep':   return '/client/team'
    case 'contractor':   return '/contractor'
    default:             return '/login'
  }
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
