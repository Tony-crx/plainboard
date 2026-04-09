import { NextResponse } from 'next/server';
import { runSwarm } from '@/lib/swarm/runner';
import { allAgents } from '@/lib/agents/example-agents';
import { Message } from '@/lib/swarm/types';
import { InputValidator } from '@/lib/security/input-validator';
import { globalAuditLogger } from '@/lib/security/audit-logger';

export const maxDuration = 60; 

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const agentMemories = body.agentMemories as Record<string, Message[]>;
    const activeAgentName = body.activeAgentName as string;
    const selectedModel = body.selectedModel as string;
    const enabledAgents = body.enabledAgents as Record<string, boolean>;
    const agentOverrides = body.agentOverrides as Record<string, {name?: string, instructions?: string, model?: string}>;
    const apiKeys = body.apiKeys as string[];

    // Security Phase 2: Input Validation
    const userMessages = agentMemories[activeAgentName]?.filter(m => m.role === 'user') || [];
    const lastUserMessage = userMessages[userMessages.length - 1];
    
    if (lastUserMessage && lastUserMessage.content) {
        const valRes = InputValidator.validate(lastUserMessage.content);
        if (!valRes.valid) {
            await globalAuditLogger.log({
                agentName: activeAgentName,
                action: 'SECURITY_BLOCK',
                details: { reason: valRes.error, payload: lastUserMessage.content },
                riskLevel: 'high'
            });
            return NextResponse.json({ error: valRes.error }, { status: 403 });
        }
    }

    const baseStartingAgent = allAgents[activeAgentName] || allAgents["Triage"];
    const startingAgent = { ...baseStartingAgent };

    // Apply UI Overrides to the starting agent
    if (agentOverrides && agentOverrides[activeAgentName]) {
        if (agentOverrides[activeAgentName].name) startingAgent.name = agentOverrides[activeAgentName].name as string;
        if (agentOverrides[activeAgentName].instructions) startingAgent.instructions = agentOverrides[activeAgentName].instructions as string;
        if (agentOverrides[activeAgentName].model) startingAgent.model = agentOverrides[activeAgentName].model;
    }
    
    if (enabledAgents && enabledAgents[activeAgentName] === false) {
        return NextResponse.json({ error: `Agent ${activeAgentName} is disabled. Enable it from the Cortisolboard UI.` }, { status: 403 });
    }
    
    if (!agentMemories || typeof agentMemories !== 'object') {
      return NextResponse.json({ error: "Invalid agentMemories body structure" }, { status: 400 });
    }

    const response = await runSwarm(startingAgent, agentMemories, {}, 10, selectedModel, enabledAgents, agentOverrides, apiKeys);
    
    // Map the new agent name back to the internal key for state consistency on the client
    // Since targetAgent.name might be customized, resolve the base key
    let terminalAgentUIKey = response.targetAgent.name;
    for (const baseKey in allAgents) {
       if (baseKey === terminalAgentUIKey || agentOverrides[baseKey]?.name === terminalAgentUIKey) {
           terminalAgentUIKey = baseKey;
           break;
       }
    }

    // Remap agentMemories keys back to pure IDs so React state aligns
    const pureMemories: Record<string, Message[]> = {};
    for (const key in response.agentMemories) {
       let pureKey = key;
       for (const baseKey in allAgents) {
          if (agentOverrides[baseKey]?.name === key) pureKey = baseKey;
       }
       pureMemories[pureKey] = response.agentMemories[key];
    }
    
    return NextResponse.json({
      agentMemories: pureMemories,
      newAgentName: terminalAgentUIKey
    });

  } catch (error: any) {
    console.error("Swarm API Error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
