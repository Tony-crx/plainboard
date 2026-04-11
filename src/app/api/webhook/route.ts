import { NextRequest, NextResponse } from 'next/server';
import { globalRealTimeBus } from '@/lib/communication/realtime-event-bus';

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const source = searchParams.get('source') || 'webhook';
    const body = await request.json();

    // Emit as real-time event
    globalRealTimeBus.emit({
      type: 'message_received',
      data: { source, payload: body },
    });

    return NextResponse.json({
      success: true,
      message: 'Webhook received',
      source,
      timestamp: Date.now(),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'Webhook listener active',
    usage: 'POST to /api/webhook?source=slack (or discord, github, etc)',
  });
}
