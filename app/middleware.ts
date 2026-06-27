import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Public routes that don't require authentication
const publicRoutes = ['/', '/signup', '/login']

export async function middleware(request: NextRequest) {
  const supabaseResponse = NextResponse.next({ request })
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value)
            supabaseResponse.cookies.set(name, value, options)
          })
        }
      }
    }
  )

  // Get the current user
  const { data: { user } } = await supabase.auth.getUser()

  // Check if the route is protected
  const currentPath = request.nextUrl.pathname
  const isPublicRoute = publicRoutes.some(route => 
    currentPath === route || currentPath.startsWith('/api/auth/')
  )
  const isApiRoute = currentPath.startsWith('/api/')

  // If user is not authenticated and trying to access protected route
  if (!user && !isPublicRoute) {
    if (isApiRoute) {
      // Return 401 for API routes
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    // Redirect to login page for non-API routes
    const loginUrl = new URL('/', request.url)
    loginUrl.searchParams.set('redirect', currentPath)
    return NextResponse.redirect(loginUrl)
  }

  // If user is authenticated and trying to access public auth pages, redirect to protected area
  if (user && (currentPath === '/' || currentPath === '/signup' || currentPath === '/login')) {
    return NextResponse.redirect(new URL('/feynman', request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)']
}
