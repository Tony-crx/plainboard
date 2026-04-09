import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifySession } from '@/lib/auth/session-manager';

const protectedRoutes = ['/', '/api/chat', '/api/metrics'];
const publicRoutes = ['/login'];

export async function proxy(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const isProtectedRoute = protectedRoutes.includes(path);
  const isPublicRoute = publicRoutes.includes(path);

  // Vercel Edge optimization: don't compute JWT logic if not strictly needing authorization
  if (!isProtectedRoute && !isPublicRoute) {
     return NextResponse.next();
  }

  const session = await verifySession();

  if (isProtectedRoute && !session) {
    return NextResponse.redirect(new URL('/login', req.nextUrl));
  }

  if (isPublicRoute && session && !path.startsWith('/')) {
    return NextResponse.redirect(new URL('/', req.nextUrl));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
