import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifySession } from '@/lib/auth/session-manager';

const protectedRoutes = ['/swarm', '/board', '/api/chat', '/api/metrics'];
const publicRoutes = ['/login', '/'];

export async function proxy(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const isProtectedRoute = protectedRoutes.includes(path);
  const isPublicRoute = publicRoutes.includes(path);

  if (!isProtectedRoute && !isPublicRoute) {
    return NextResponse.next();
  }

  const session = await verifySession();

  // Unauthenticated → protected route → redirect to login with ?next=
  if (isProtectedRoute && !session) {
    const loginUrl = new URL('/login', req.nextUrl);
    loginUrl.searchParams.set('next', path);
    return NextResponse.redirect(loginUrl);
  }

  // Authenticated on login → redirect to ?next= or /swarm
  if (path === '/login' && session) {
    const next = req.nextUrl.searchParams.get('next') || '/swarm';
    return NextResponse.redirect(new URL(next, req.nextUrl));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
