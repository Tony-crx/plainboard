import { NextRequest, NextResponse } from 'next/server';
import { globalTaskStore } from '@/lib/tasks/task-store';
import { getActiveWorkers, getWorker } from '@/lib/swarm/worker-manager';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const statusFilter = searchParams.get('status');

    const tasks = globalTaskStore.list(statusFilter as any);
    const workers = getActiveWorkers();

    // Merge task store with worker states
    const taskList = tasks.map(task => {
      const worker = workers.find(w => w.taskId === task.id);
      return {
        id: task.id,
        name: task.name,
        agentName: task.agentName,
        status: worker?.status ?? task.status,
        type: task.type,
        description: task.description,
        progress: worker?.progress ?? task.progress,
        createdAt: task.createdAt,
        updatedAt: task.updatedAt,
        result: task.result,
        error: task.error,
        runInBackground: task.runInBackground,
      };
    });

    return NextResponse.json({ tasks: taskList });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
