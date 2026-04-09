import { NextResponse } from 'next/server';
import { createSession } from '@/lib/auth/session-manager';

const VALID_PASSWORD = process.env.LOGIN_PASSWORD || 'demo';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { password } = body;

    if (!password || typeof password !== 'string') {
      return NextResponse.json({ error: 'Password required' }, { status: 400 });
    }

    // Simple password validation
    // In production, use bcrypt or similar with a database
    if (password !== VALID_PASSWORD) {
      return NextResponse.json({ error: 'AUTHORIZATION DENIED' }, { status: 401 });
    }

    // Create session JWT
    await createSession('admin-user');

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Login API Error:', error.message);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
