import { NextResponse } from 'next/server';
import { createSession } from '@/lib/auth/session-manager';

export async function POST(req: Request) {
  try {
    const { password } = await req.json();
    
    // Hardcoded simple clearance for Cortisolboard demo
    if (password === 'demo' || password === process.env.ADMIN_PASSWORD) {
       await createSession('admin-001');
       return NextResponse.json({ success: true });
    }
    
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  } catch (err) {
    return NextResponse.json({ error: 'System Fault' }, { status: 500 });
  }
}
