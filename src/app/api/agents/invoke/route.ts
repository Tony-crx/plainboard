import { NextResponse } from 'next/server';
import { runSwarm } from '@/lib/swarm/runner';
import { allAgents } from '@/lib/agents/example-agents';
import { Message } from '@/lib/swarm/types';
import { InputValidator } from '@/lib/security/input-validator';
import { globalAuditLogger } from '@/lib/security/audit-logger';
import { verifySession } from '@/lib/auth/session-manager';

const ADMIN_TOKEN = process.env.ADMIN_PASSWORD;

export async function POST(req: Request) {
    // Basic API Key or JWT validation for integration
    const authHeader = req.headers.get('authorization');
    const sessionCookie = await verifySession();

    const hasValidToken = sessionCookie !== null;
    const hasValidAdminToken = ADMIN_TOKEN && authHeader === `Bearer ${ADMIN_TOKEN}`;

    if (!hasValidToken && !hasValidAdminToken) {
        return NextResponse.json(
            { error: 'External API access denied. Provide valid Bearer token or session.' },
            { status: 401 }
        );
    }

    try {
        const body = await req.json();
        const { message, agentName = 'Triage', model = 'meta-llama/llama-3.3-70b-instruct:free' } = body;

        const valRes = InputValidator.validate(message);
        if (!valRes.valid) {
            await globalAuditLogger.log({
                agentName: 'API_INVOCATION',
                action: 'EXTERNAL_SECURITY_BLOCK',
                details: { reason: valRes.error, payload: message },
                riskLevel: 'high'
            });
            return NextResponse.json({ error: valRes.error }, { status: 403 });
        }

        const startingAgent = allAgents[agentName] || allAgents['Triage'];
        const agentMemories: Record<string, Message[]> = {
            [startingAgent.name]: [{ role: 'user', content: message }]
        };

        const response = await runSwarm(startingAgent, agentMemories, {}, 5, model, {});

        const finalMessages = response.agentMemories[response.targetAgent.name] || [];
        const finalOutput = finalMessages[finalMessages.length - 1];

        return NextResponse.json({
            success: true,
            terminalAgent: response.targetAgent.name,
            output: finalOutput?.content || "No textual output produced."
        });

    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
