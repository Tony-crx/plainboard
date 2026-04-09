import { NextResponse } from 'next/server';
import { globalCostTracker } from '@/lib/observability/cost-tracker';

export async function GET() {
    const breakdown = globalCostTracker.getBreakdown();
    return NextResponse.json({
        totalCost: breakdown.total,
        byAgent: Object.fromEntries(breakdown.byAgent),
        byModel: Object.fromEntries(breakdown.byModel),
    });
}
