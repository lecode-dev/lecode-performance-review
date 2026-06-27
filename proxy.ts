import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { UserRole } from '@/lib/supabase/types'

const ROLE_PREFIXES: Record<string, UserRole> = {
  '/admin':      'lecode_admin',
  '/client':     'client_rep',
  '/contractor': 'contractor',
}

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request })

  const { pathname } = request.nextUrl

  // Rotas utilitárias: nunca interceptar
  if (pathname.startsWith('/logout') || pathname.startsWith('/debug')) {
    return response
  }

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

  const { data: { session } } = await supabase.auth.getSession()
  const role = session?.user?.app_metadata?.role as UserRole | undefined

  // Rotas públicas de auth
  if (pathname.startsWith('/login') || pathname.startsWith('/signup') || pathname.startsWith('/recover')) {
    if (session && role) {
      return NextResponse.redirect(new URL(roleDefaultPath(role), request.url))
    }
    return response
  }

  // Área protegida: exige sessão
  if (!session) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Gate por prefixo de role (só aplica se role está presente no JWT)
  if (role) {
    for (const [prefix, required] of Object.entries(ROLE_PREFIXES)) {
      if (pathname.startsWith(prefix) && role !== required) {
        return NextResponse.redirect(new URL(roleDefaultPath(role), request.url))
      }
    }
  }

  return response
}

function roleDefaultPath(role: UserRole): string {
  switch (role) {
    case 'lecode_admin': return '/admin'
    case 'client_rep':   return '/client/team'
    case 'contractor':   return '/contractor'
  }
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
