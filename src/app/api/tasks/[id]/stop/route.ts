import { NextRequest, NextResponse } from 'next/server';
import { globalTaskStore } from '@/lib/tasks/task-store';
import { stopWorker } from '@/lib/swarm/worker-manager';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Try to stop as a worker first
    stopWorker(id);

    // Also update the task store
    globalTaskStore.stop(id);

    return NextResponse.json({ success: true, message: `Worker ${id} stopped` });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
