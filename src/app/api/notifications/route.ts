import { NextRequest, NextResponse } from 'next/server';
import { globalTaskStore } from '@/lib/tasks/task-store';

// Simple in-memory notification queue
const notificationQueue: Array<{
  taskId: string;
  agentName: string;
  status: string;
  summary: string;
  result: string;
  timestamp: number;
}> = [];

// Export so other modules can push notifications
export function pushNotification(
  taskId: string,
  agentName: string,
  status: string,
  summary: string,
  result: string
) {
  notificationQueue.push({
    taskId,
    agentName,
    status,
    summary,
    result,
    timestamp: Date.now(),
  });
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const limit = parseInt(searchParams.get('limit') || '20');

    // Return and clear the queue
    const notifications = notificationQueue.splice(0, limit);

    // Also include recent completed tasks
    const completedTasks = globalTaskStore.list('completed').slice(-5);
    const taskNotifications = completedTasks
      .map(t => {
        const n = globalTaskStore.generateNotification(t.id);
        if (n) {
          return {
            taskId: n.taskId,
            agentName: n.agentName,
            status: n.status,
            summary: n.summary,
            result: n.result,
            timestamp: t.updatedAt,
          };
        }
        return null;
      })
      .filter(Boolean);

    return NextResponse.json({
      notifications: [...notifications, ...taskNotifications],
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
