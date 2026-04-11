import { NextRequest, NextResponse } from 'next/server';
import { getWorker } from '@/lib/swarm/worker-manager';
import { globalTaskStore } from '@/lib/tasks/task-store';
import { Message } from '@/lib/swarm/types';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Try to get from active workers first
    const worker = getWorker(id);
    if (worker) {
      const messages = worker.memories[worker.agent.name] || [];
      const lastAssistant = [...messages].reverse().find((m: Message) => m.role === 'assistant');
      return NextResponse.json({
        taskId: id,
        status: worker.status,
        agentName: worker.agent.name,
        output: lastAssistant?.content || null,
        isRunning: worker.status === 'running',
        progress: worker.progress,
      });
    }

    // Fall back to task store
    const task = globalTaskStore.get(id);
    if (task) {
      return NextResponse.json({
        taskId: id,
        status: task.status,
        agentName: task.agentName,
        output: task.result || null,
        isRunning: false,
        progress: task.progress,
        error: task.error || null,
      });
    }

    return NextResponse.json(
      { error: `Task ${id} not found` },
      { status: 404 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
