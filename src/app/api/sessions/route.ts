import { NextRequest, NextResponse } from 'next/server';
import { sessionManager } from '@/lib/storage/session-manager';
import { Message } from '@/lib/swarm/types';

const DEFAULT_AGENTS = ['Coordinator', 'Triage', 'Coder', 'Math', 'Cyn', 'Adso'];

export async function GET() {
  try {
    const sessions = await sessionManager.listSessions();
    return NextResponse.json({ sessions });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name } = body;

    // Create a fresh session with empty memories for all agents
    const emptyMemories: Record<string, Message[]> = {};
    for (const agentName of DEFAULT_AGENTS) {
      emptyMemories[agentName] = [];
    }

    const sessionId = await sessionManager.createSession(
      name || `Session ${new Date().toLocaleString()}`,
      emptyMemories,
      'Triage'
    );

    return NextResponse.json({ sessionId });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, agentMemories, activeAgentName, selectedModel } = body;

    if (!sessionId) {
      return NextResponse.json({ error: 'sessionId is required' }, { status: 400 });
    }

    sessionManager.updateSession(sessionId, {
      ...(agentMemories && { agentMemories }),
      ...(activeAgentName && { activeAgentName }),
      ...(selectedModel && { selectedModel }),
      updatedAt: Date.now(),
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const sessionId = searchParams.get('id');

    if (sessionId) {
      await sessionManager.deleteSession(sessionId);
      return NextResponse.json({ success: true });
    }

    // No ID = clear all
    await sessionManager.clearAllSessions();
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
