import { NextRequest, NextResponse } from 'next/server';
import { globalPlanModeManager } from '@/lib/permissions/plan-mode';

export async function GET() {
  return NextResponse.json({ plan: globalPlanModeManager.getState() });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, content } = body;

    switch (action) {
      case 'enter':
        const state = globalPlanModeManager.enter(body.previousMode || 'default');
        return NextResponse.json({ plan: state });

      case 'update':
        if (!content) {
          return NextResponse.json({ error: 'Content is required' }, { status: 400 });
        }
        const updated = globalPlanModeManager.updatePlan(content);
        return NextResponse.json({ plan: updated });

      case 'approve':
        const result = globalPlanModeManager.approveAndExit();
        return NextResponse.json({ plan: result });

      case 'cancel':
        const previousMode = globalPlanModeManager.cancel();
        return NextResponse.json({ previousMode });

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
