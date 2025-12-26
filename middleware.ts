import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          request.cookies.set({
            name,
            value,
            ...options,
          });
          supabaseResponse = NextResponse.next({
            request,
          });
          supabaseResponse.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: any) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          });
          supabaseResponse = NextResponse.next({
            request,
          });
          supabaseResponse.cookies.set({
            name,
            value: '',
            ...options,
          });
        },
      },
    }
  );

  // This will refresh session if expired - required for Server Components
  await supabase.auth.getUser();

  // Protect client routes
  const clientRoutes = [
    '/dashboard',
    '/balance',
    '/deposit',
    '/recipients',
    '/send',
    '/team',
    '/transactions',
  ];
  if (clientRoutes.some(route => request.nextUrl.pathname.startsWith(route))) {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      return NextResponse.redirect(url);
    }

    // TODO: Add role-based checks for client routes
  }

  // Protect admin routes
  if (
    request.nextUrl.pathname.startsWith('/admin/') ||
    request.nextUrl.pathname.startsWith('/(admin)')
  ) {
    // Check for admin session token in cookies or headers
    const adminSessionToken =
      request.cookies.get('admin_session_token')?.value ||
      request.headers.get('x-admin-session-token');

    if (!adminSessionToken) {
      const url = request.nextUrl.clone();
      url.pathname = '/admin-login';
      return NextResponse.redirect(url);
    }

    // Validate admin session token
    try {
      const validateResponse = await fetch(`${request.nextUrl.origin}/api/admin/auth/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_token: adminSessionToken }),
      });

      const validateResult = await validateResponse.json();

      if (!validateResponse.ok || !validateResult.valid) {
        // Clear invalid session token
        const response = NextResponse.redirect(new URL('/admin-login', request.url));
        response.cookies.set('admin_session_token', '', { maxAge: 0 });
        return response;
      }
    } catch (error) {
      console.error('Admin session validation failed:', error);
      const response = NextResponse.redirect(new URL('/admin-login', request.url));
      response.cookies.set('admin_session_token', '', { maxAge: 0 });
      return response;
    }
  }

  // Redirect authenticated users away from public routes
  if (request.nextUrl.pathname === '/login' || request.nextUrl.pathname === '/signup') {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const url = request.nextUrl.clone();
      url.pathname = '/dashboard';
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
