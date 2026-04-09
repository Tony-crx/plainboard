import { NextResponse } from 'next/server';
import { deleteSession } from '@/lib/auth/session-manager';

export async function POST() {
  try {
    await deleteSession();
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Logout API Error:', error.message);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
