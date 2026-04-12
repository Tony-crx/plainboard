import { NextResponse } from 'next/server';
import { createSession } from '@/lib/auth/session-manager';
import { loginRateLimiter } from '@/lib/auth/login-rate-limiter';

const VALID_PASSWORD = process.env.LOGIN_PASSWORD;

// Skip auth during build time
if (VALID_PASSWORD === undefined && !process.env.__BUILD_TIME_SESSION_SECRET) {
  console.warn(
    'WARNING: LOGIN_PASSWORD environment variable is not set. ' +
    'Authentication is disabled. Set LOGIN_PASSWORD in your .env.local file.'
  );
}

function getClientIp(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return 'unknown';
}

export async function POST(req: Request) {
  try {
    const clientIp = getClientIp(req);

    // Check if IP is blocked
    const blockStatus = loginRateLimiter.isBlocked(clientIp);
    if (blockStatus.blocked) {
      return NextResponse.json(
        { error: `Too many failed attempts. Try again in ${blockStatus.retryAfter} seconds.` },
        { status: 429 }
      );
    }

    const body = await req.json();
    const { password } = body;

    if (!password || typeof password !== 'string') {
      return NextResponse.json({ error: 'Password required' }, { status: 400 });
    }

    if (!VALID_PASSWORD) {
      return NextResponse.json(
        { error: 'Authentication not configured. Set LOGIN_PASSWORD environment variable.' },
        { status: 503 }
      );
    }

    if (password !== VALID_PASSWORD) {
      loginRateLimiter.recordAttempt(clientIp, false);
      return NextResponse.json({ error: 'AUTHORIZATION DENIED' }, { status: 401 });
    }

    // Create session JWT
    loginRateLimiter.recordAttempt(clientIp, true);
    await createSession('admin-user');

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Login API Error:', error.message);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
