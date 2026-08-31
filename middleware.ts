import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: any[]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { pathname } = request.nextUrl

  // Explicitly allow public pages and API routes without interception
  const publicRoutes = ['/', '/farmer-login', '/buyer-login']
  if (publicRoutes.includes(pathname) || pathname.startsWith('/api/')) {
    return supabaseResponse
  }

  // Refresh session (required for SSR auth to work correctly)
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Protected routes that require auth (exact match or subdirectory, not matching /farmer-login or /buyer-login)
  const isFarmerRoute = pathname === '/farmer' || pathname.startsWith('/farmer/')
  const isBuyerRoute = pathname === '/buyer' || pathname.startsWith('/buyer/')

  if (!user && (isFarmerRoute || isBuyerRoute)) {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = '/'
    return NextResponse.redirect(loginUrl)
  }

  if (user) {
    // Fetch role from public.users metadata
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    const role = profile?.role as 'farmer' | 'buyer' | undefined

    // Role-based guard: farmer tries to access buyer route → redirect
    if (role === 'farmer' && isBuyerRoute) {
      const redirect = request.nextUrl.clone()
      redirect.pathname = '/'
      return NextResponse.redirect(redirect)
    }

    // Role-based guard: buyer tries to access farmer route → redirect
    if (role === 'buyer' && isFarmerRoute) {
      const redirect = request.nextUrl.clone()
      redirect.pathname = '/'
      return NextResponse.redirect(redirect)
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
