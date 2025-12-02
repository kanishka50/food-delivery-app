import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Routes that require authentication
const protectedRoutes = [
  '/profile',
  '/orders',
  '/addresses',
  '/checkout',
];

// Routes that should redirect authenticated users (e.g., login, register)
const authRoutes = [
  '/login',
  '/register',
];

// Routes that are always accessible
const publicRoutes = [
  '/',
  '/menu',
  '/categories',
  '/cart',
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Get auth token from cookies (set by the app)
  const token = request.cookies.get('auth-token')?.value;

  // Check if current path matches protected routes
  const isProtectedRoute = protectedRoutes.some(route =>
    pathname === route || pathname.startsWith(`${route}/`)
  );

  // Check if current path matches auth routes
  const isAuthRoute = authRoutes.some(route =>
    pathname === route || pathname.startsWith(`${route}/`)
  );

  // If user is not authenticated and trying to access protected route
  if (isProtectedRoute && !token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // If user is authenticated and trying to access auth routes
  if (isAuthRoute && token) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
