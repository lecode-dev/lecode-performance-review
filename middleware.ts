import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import type { UserRole } from '@/lib/supabase/types'

const ROLE_PREFIX: Record<UserRole, string> = {
  lecode_admin: '/admin',
  client_rep: '/client',
  contractor: '/contractor',
}

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
        },
      },
    },
  )

  const { data: { user } } = await supabase.auth.getUser()
  const path = request.nextUrl.pathname
  const isAppRoute = ['/admin', '/client', '/contractor'].some((p) => path.startsWith(p))

  if (!user && isAppRoute) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (user && isAppRoute) {
    const role = (user.app_metadata?.role as UserRole | undefined) ?? null
    if (role && !path.startsWith(ROLE_PREFIX[role])) {
      return NextResponse.redirect(new URL(ROLE_PREFIX[role], request.url))
    }
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
