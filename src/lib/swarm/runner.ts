import { Agent, SwarmResponse, Message, SwarmContext } from './types';
import { generateChatCompletion } from '../llm/openrouter';
import { generateGroqChatCompletion } from '../llm/groq';
import { globalMemoryStore } from '../memory/memory-store';
import { globalContextBuilder } from '../memory/context-builder';
import { globalTracer } from '../observability/tracer';
import { globalMetrics } from '../observability/metrics';

const MAX_TURNS = 10;

export async function runSwarm(
    startingAgent: Agent,
    agentMemories: Record<string, Message[]>,
    contextVariables: Record<string, any> = {},
    maxTurns: number = MAX_TURNS,
    selectedModel: string = "meta-llama/llama-3.3-70b-instruct:free",
    enabledAgents: Record<string, boolean> = {},
    agentOverrides: Record<string, { name?: string, instructions?: string, model?: string }> = {},
    apiKeys: string[] = []
): Promise<SwarmResponse> {

    let activeAgent = startingAgent;
    let memories = { ...agentMemories };
    let turnCount = 0;

    if (!memories[activeAgent.name]) {
        memories[activeAgent.name] = [];
    }

    const runSpanId = globalTracer.startSpan('run_swarm_loop', activeAgent.name, { maxTurns });
    const startTime = Date.now();

    while (turnCount < maxTurns) {
        turnCount++;
        const iterSpanId = globalTracer.startSpan(`turn_${turnCount}`, activeAgent.name);

        let systemContent = typeof activeAgent.instructions === 'function'
            ? activeAgent.instructions(contextVariables)
            : activeAgent.instructions;

        const currentMessages = memories[activeAgent.name];

        const latestUserMsg = [...currentMessages].reverse().find(m => m.role === 'user');
        let relevantMemories: any[] = [];

        if (latestUserMsg?.content) {
            relevantMemories = await globalMemoryStore.search(latestUserMsg.content, 5);
        }

        let systemMessage: Message = { role: 'system', content: systemContent };

        let callMessages = [systemMessage, ...currentMessages];
        callMessages = globalContextBuilder.buildContext(callMessages, relevantMemories);
        callMessages = globalContextBuilder.truncateToContextLimit(callMessages);

        const llmSpanId = globalTracer.startSpan('llm_generation', activeAgent.name);
        let responseMessage: Message;
        try {
            const chosenModel = (agentOverrides && agentOverrides[activeAgent.name]?.model)
                || activeAgent.model
                || selectedModel
                || "meta-llama/llama-3.3-70b-instruct:free";

            // Determine if we should use Groq based on model name
            const isGroqModel = chosenModel.includes('groq') ||
                chosenModel.includes('llama-3') ||
                chosenModel.includes('mixtral') ||
                chosenModel.includes('gemma');

            // Try primary provider first, then fallback
            try {
                if (isGroqModel) {
                    responseMessage = await generateGroqChatCompletion(
                        callMessages,
                        chosenModel,
                        activeAgent.tools,
                        apiKeys
                    );
                } else {
                    responseMessage = await generateChatCompletion(
                        callMessages,
                        chosenModel,
                        activeAgent.tools,
                        apiKeys
                    );
                }
            } catch (primaryError: any) {
                // Check if error is retryable (rate limit, network, etc)
                const isRetryableError =
                    primaryError.message.includes('429') ||
                    primaryError.message.includes('Circuit breaker') ||
                    primaryError.message.includes('Rate limit');

                if (isRetryableError) {
                    // Try fallback provider
                    console.warn(`Primary provider failed (${primaryError.message}), trying fallback...`);

                    try {
                        if (isGroqModel) {
                            // If Groq failed, try OpenRouter with same model
                            responseMessage = await generateChatCompletion(
                                callMessages,
                                chosenModel,
                                activeAgent.tools,
                                apiKeys
                            );
                        } else {
                            // If OpenRouter failed, try Groq
                            responseMessage = await generateGroqChatCompletion(
                                callMessages,
                                chosenModel,
                                activeAgent.tools,
                                apiKeys
                            );
                        }
                    } catch (fallbackError: any) {
                        // Both providers failed, throw original error
                        console.error(`Fallback provider also failed: ${fallbackError.message}`);
                        throw primaryError;
                    }
                } else {
                    // Non-retryable error (auth, invalid model, etc), throw immediately
                    throw primaryError;
                }
            }

            // Responder Signature: Attaching name payload manually
            responseMessage.name = activeAgent.name;

            globalTracer.endSpan(llmSpanId, 'success');
        } catch (error) {
            globalTracer.endSpan(llmSpanId, 'error');
            globalTracer.endSpan(iterSpanId, 'error');
            throw error;
        }

        memories[activeAgent.name].push(responseMessage);

        if (latestUserMsg?.content && responseMessage.content) {
            await globalMemoryStore.add({
                id: crypto.randomUUID(),
                agentName: activeAgent.name,
                content: `User: ${latestUserMsg.content}\n${activeAgent.name}: ${responseMessage.content}`,
                timestamp: Date.now(),
                priority: 'medium',
                tags: [activeAgent.name]
            });
        }

        if (!responseMessage.tool_calls || responseMessage.tool_calls.length === 0) {
            globalTracer.endSpan(iterSpanId, 'success');
            break;
        }

        let agentSwitched = false;
        let originalAgentName = activeAgent.name;

        for (const toolCall of responseMessage.tool_calls) {
            const toolSpanId = globalTracer.startSpan(`tool_${toolCall.function.name}`, activeAgent.name);
            const toolName = toolCall.function.name;
            const toolArgsStr = toolCall.function.arguments;

            let args = {};
            try { args = JSON.parse(toolArgsStr); } catch (e) { /* ignore */ }

            const toolFunc = activeAgent.tools?.find(t => t.function.name === toolName);

            let toolResultContent = "";

            if (!toolFunc) {
                toolResultContent = `Error: Tool '${toolName}' not found.`;
                globalTracer.endSpan(toolSpanId, 'error');
            } else {
                try {
                    const ctx: SwarmContext = { variables: contextVariables, agentMemories: memories };
                    const output = await toolFunc.execute(args, ctx);

                    if (output && typeof output === 'object' && output.targetAgent) {
                        const target: Agent = { ...output.targetAgent };

                        // Apply instruction & name overrides
                        // However the output.targetAgent from execution is the original one. We use its original name to find overrides
                        const originalName = output.targetAgent.name;
                        if (agentOverrides && agentOverrides[originalName]) {
                            if (agentOverrides[originalName].name) target.name = agentOverrides[originalName].name;
                            if (agentOverrides[originalName].instructions) target.instructions = agentOverrides[originalName].instructions;
                        }

                        if (enabledAgents && enabledAgents[originalName] === false) {
                            toolResultContent = `System Error: Handed off target agent '${target.name}' is currently disabled in the matrix UI. Transfer refused.`;
                        } else {
                            const msgToTarget: string = output.messageToTarget || "Task handoff from previous agent.";

                            toolResultContent = `Successfully transferred to agent: ${target.name}.`;

                            if (!memories[target.name]) memories[target.name] = [];
                            memories[target.name].push({
                                role: 'user',
                                content: `[SYSTEM AUTO-ROUTING/HANDOFF FROM ${activeAgent.name}]: ${msgToTarget}`
                            });

                            activeAgent = target;
                            agentSwitched = true;
                        }
                    } else {
                        toolResultContent = typeof output === 'string' ? output : JSON.stringify(output);
                    }
                    globalTracer.endSpan(toolSpanId, 'success');
                } catch (err: any) {
                    toolResultContent = `Error executing tool: ${err.message}`;
                    globalTracer.endSpan(toolSpanId, 'error');
                }
            }

            memories[originalAgentName].push({
                role: 'tool',
                tool_call_id: toolCall.id,
                name: toolName,
                content: toolResultContent
            });

            if (agentSwitched) {
                break;
            }
        }
        globalTracer.endSpan(iterSpanId, 'success');
    }

    globalTracer.endSpan(runSpanId, 'success');
    globalMetrics.record('swarm_run_duration_ms', Date.now() - startTime);

    return {
        agentMemories: memories,
        targetAgent: activeAgent,
        variables: contextVariables
    };
}
