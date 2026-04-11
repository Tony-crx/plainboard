import { Agent, SwarmResponse, Message, SwarmContext, Tool, WorkerState } from './types';
import { generateChatCompletion } from '../llm/openrouter';
import { generateGroqChatCompletion } from '../llm/groq';
import { globalMemoryStore } from '../memory/memory-store';
import { globalContextBuilder } from '../memory/context-builder';
import { globalTracer } from '../observability/tracer';
import { globalMetrics } from '../observability/metrics';
import { globalTaskStore } from '../tasks/task-store';
import { ProgressTracker } from '../tasks/progress-tracker';
import { globalPermissionEngine } from '../permissions/engine';
import {
    isCoordinatorMode,
    getCoordinatorSystemPrompt,
    getCoordinatorTools,
    buildTaskNotificationXml,
} from './coordinator-mode';
import {
    launchWorker,
    stopWorker,
    getActiveWorkers,
    buildWorkerNotification,
} from './worker-manager';
import { partitionTools, buildLoadedToolSchema } from '../tools/tool-deferral';
import { globalPlanModeManager } from '../permissions/plan-mode';

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

    // Build permission context for the agent
    const permissionCtx = globalPermissionEngine.buildContextForAgent(
        activeAgent.permissionMode || 'default',
        activeAgent.allowedTools,
        activeAgent.workingDirectories
    );
    permissionCtx.shouldAvoidPermissionPrompts = activeAgent.avoidPermissionPrompts ?? false;

    // Partition tools into loaded vs deferred (token savings)
    const allTools = activeAgent.tools || [];
    const { loaded, deferred } = partitionTools(allTools);

    // If coordinator mode, replace system prompt and filter tools
    let currentTools = loaded;
    let systemOverride: string | null = null;

    if (isCoordinatorMode()) {
        systemOverride = getCoordinatorSystemPrompt(
            typeof activeAgent.instructions === 'string'
                ? activeAgent.instructions
                : activeAgent.instructions({})
        );
        currentTools = getCoordinatorTools(loaded);
    }

    // Build initial swarm context for full context transfer
    // This ensures handoffs include relevant history, not just a single message
    const contextSnapshot = memories[activeAgent.name] ? [...memories[activeAgent.name]] : [];

    while (turnCount < maxTurns) {
        turnCount++;
        const iterSpanId = globalTracer.startSpan(`turn_${turnCount}`, activeAgent.name);

        // Use coordinator system prompt if in coordinator mode
        let systemContent = systemOverride ?? (
            typeof activeAgent.instructions === 'function'
                ? activeAgent.instructions(contextVariables)
                : activeAgent.instructions
        );

        // Inject plan mode system prompt suffix if active
        const planState = globalPlanModeManager.getState();
        if (planState.isActive) {
            systemContent += globalPlanModeManager.getSystemPromptSuffix();
        }

        const currentMessages = memories[activeAgent.name];

        const latestUserMsg = [...currentMessages].reverse().find(m => m.role === 'user');
        let relevantMemories: any[] = [];

        if (latestUserMsg?.content) {
            relevantMemories = await globalMemoryStore.search(latestUserMsg.content, 5);
        }

        let systemMessage: Message = { role: 'system', content: systemContent };

        let callMessages = [systemMessage, ...currentMessages];

        // Inject task notifications if any (from completed workers)
        const pendingNotifications = globalTaskStore.list('completed')
            .filter(t => t.agentName !== activeAgent.name)
            .slice(-5);

        if (pendingNotifications.length > 0) {
            const notificationXml = pendingNotifications
                .map(t => {
                    const task = globalTaskStore.generateNotification(t.id);
                    if (task) {
                        return buildTaskNotificationXml(t.id, task.agentName, task.status, task.summary, task.result);
                    }
                    return '';
                })
                .filter(Boolean)
                .join('\n');

            if (notificationXml) {
                // Insert notification as a system message before the latest user message
                const userIndex = callMessages.findIndex(m => m.role === 'user');
                if (userIndex >= 0) {
                    callMessages.splice(userIndex, 0, {
                        role: 'system',
                        content: notificationXml,
                    });
                }
            }
        }

        callMessages = globalContextBuilder.buildContext(callMessages, relevantMemories);
        callMessages = globalContextBuilder.truncateToContextLimit(callMessages);

        const llmSpanId = globalTracer.startSpan('llm_generation', activeAgent.name);
        let responseMessage: Message;
        try {
            const chosenModel = (agentOverrides && agentOverrides[activeAgent.name]?.model)
                || activeAgent.model
                || selectedModel
                || "meta-llama/llama-3.3-70b-instruct:free";

            const isGroqModel = chosenModel.includes('groq') ||
                chosenModel.includes('llama-3') ||
                chosenModel.includes('mixtral') ||
                chosenModel.includes('gemma');

            // Use loaded tool schema for LLM call
            const toolSchema = buildLoadedToolSchema(currentTools);

            try {
                if (isGroqModel) {
                    responseMessage = await generateGroqChatCompletion(
                        callMessages,
                        chosenModel,
                        toolSchema,
                        apiKeys
                    );
                } else {
                    responseMessage = await generateChatCompletion(
                        callMessages,
                        chosenModel,
                        toolSchema,
                        apiKeys
                    );
                }
            } catch (primaryError: any) {
                const isRetryableError =
                    primaryError.message.includes('429') ||
                    primaryError.message.includes('Circuit breaker') ||
                    primaryError.message.includes('Rate limit');

                if (isRetryableError) {
                    console.warn(`Primary provider failed (${primaryError.message}), trying fallback...`);
                    try {
                        if (isGroqModel) {
                            responseMessage = await generateChatCompletion(
                                callMessages,
                                chosenModel,
                                toolSchema,
                                apiKeys
                            );
                        } else {
                            responseMessage = await generateGroqChatCompletion(
                                callMessages,
                                chosenModel,
                                toolSchema,
                                apiKeys
                            );
                        }
                    } catch (fallbackError: any) {
                        console.error(`Fallback provider also failed: ${fallbackError.message}`);
                        throw primaryError;
                    }
                } else {
                    throw primaryError;
                }
            }

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

            // Check all tools (loaded + deferred) for the called tool
            const toolFunc = allTools.find(t => t.function.name === toolName);

            let toolResultContent = "";

            if (!toolFunc) {
                toolResultContent = `Error: Tool '${toolName}' not found or is deferred. Use tool_search to find available tools.`;
                globalTracer.endSpan(toolSpanId, 'error');
            } else {
                // Permission check
                const permResult = globalPermissionEngine.checkPermission(toolName, permissionCtx, args);
                if (toolFunc.checkPermissions) {
                    const toolPerm = toolFunc.checkPermissions(args, { variables: contextVariables, agentMemories: memories });
                    if (toolPerm.behavior === 'deny') {
                        toolResultContent = `Permission denied: ${toolPerm.reason || 'Tool-specific permission check failed'}`;
                        globalTracer.endSpan(toolSpanId, 'error');
                        memories[originalAgentName].push({
                            role: 'tool',
                            tool_call_id: toolCall.id,
                            name: toolName,
                            content: toolResultContent
                        });
                        continue;
                    }
                }

                if (permResult.behavior === 'deny') {
                    toolResultContent = `Permission denied: ${permResult.reason || 'Access to this tool is not allowed'}`;
                    globalTracer.endSpan(toolSpanId, 'error');
                    memories[originalAgentName].push({
                        role: 'tool',
                        tool_call_id: toolCall.id,
                        name: toolName,
                        content: toolResultContent
                    });
                    continue;
                }

                // Plan mode tool restriction
                if (!globalPlanModeManager.isToolAllowed(toolName)) {
                    toolResultContent = `Permission denied: Plan mode is active. Only read-only and analysis tools are allowed in plan mode.`;
                    globalTracer.endSpan(toolSpanId, 'error');
                    memories[originalAgentName].push({
                        role: 'tool',
                        tool_call_id: toolCall.id,
                        name: toolName,
                        content: toolResultContent
                    });
                    continue;
                }

                // Input validation
                if (toolFunc.validateInput) {
                    const validation = toolFunc.validateInput(args, { variables: contextVariables, agentMemories: memories });
                    if (!validation.valid) {
                        toolResultContent = `Validation error: ${validation.error || 'Invalid input'}`;
                        globalTracer.endSpan(toolSpanId, 'error');
                        memories[originalAgentName].push({
                            role: 'tool',
                            tool_call_id: toolCall.id,
                            name: toolName,
                            content: toolResultContent
                        });
                        continue;
                    }
                }

                try {
                    const ctx: SwarmContext = {
                        variables: contextVariables,
                        agentMemories: memories,
                        permissionContext: permissionCtx,
                    };
                    const output = await toolFunc.execute(args, ctx);

                    // Check for agent handoff (existing pattern)
                    if (output && typeof output === 'object' && output.targetAgent) {
                        const target: Agent = { ...output.targetAgent };

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

                            // FULL CONTEXT TRANSFER: Instead of just a single handoff message,
                            // include the conversation history for better context
                            const transferContext = memories[originalAgentName]
                                .slice(-10) // Last 10 messages for context
                                .map(m => `${m.role}: ${m.content}`)
                                .join('\n');

                            memories[target.name].push({
                                role: 'user',
                                content: `[SYSTEM HANDOFF FROM ${activeAgent.name} WITH CONTEXT]:\n\n` +
                                    `Task: ${msgToTarget}\n\n` +
                                    `Recent conversation context:\n${transferContext}`
                            });

                            activeAgent = target;
                            agentSwitched = true;

                            // Update permission context for the new agent
                            const newPermCtx = globalPermissionEngine.buildContextForAgent(
                                target.permissionMode || 'default',
                                target.allowedTools,
                                target.workingDirectories
                            );
                            newPermCtx.shouldAvoidPermissionPrompts = target.avoidPermissionPrompts ?? false;
                            Object.assign(permissionCtx, newPermCtx);
                        }
                    } else {
                        // Check if it's an async agent launch (new: worker spawning)
                        if (toolName === 'agent' || toolName === 'spawn_worker') {
                            const workerAgent = (args as any).agent || activeAgent;
                            const workerMsg = (args as any).prompt || (args as any).message || '';
                            const runAsync = (args as any).run_in_background === true;

                            try {
                                const worker = await launchWorker(workerAgent, workerMsg, memories, contextVariables, {
                                    runInBackground: runAsync,
                                    maxTurns: Math.floor(maxTurns / 2),
                                    selectedModel,
                                    enabledAgents,
                                    agentOverrides,
                                    apiKeys,
                                });

                                if (runAsync) {
                                    toolResultContent = `Worker launched in background. Task ID: ${worker.taskId}. You will receive a <task-notification> when it completes.`;
                                } else {
                                    // Await sync worker
                                    const result = await worker.promise;
                                    const notification = buildWorkerNotification(worker, result);
                                    toolResultContent = buildTaskNotificationXml(
                                        notification.taskId,
                                        notification.agentName,
                                        notification.status,
                                        notification.summary,
                                        notification.result
                                    );
                                }
                            } catch (err: any) {
                                toolResultContent = `Worker failed: ${err.message}`;
                            }
                        } else {
                            toolResultContent = typeof output === 'string' ? output : JSON.stringify(output);

                            // Truncate large results
                            const maxSize = toolFunc.maxResultSizeChars || 10000;
                            if (typeof toolResultContent === 'string' && toolResultContent.length > maxSize) {
                                toolResultContent = toolResultContent.substring(0, maxSize) +
                                    `\n\n[Result truncated: ${toolResultContent.length} chars. Full result saved to memory.]`;
                            }
                        }
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

    // Collect task notifications from completed workers
    const completedTasks = globalTaskStore.list('completed');
    const taskNotifications = completedTasks
        .slice(-5)
        .map(t => globalTaskStore.generateNotification(t.id))
        .filter(Boolean);

    globalTracer.endSpan(runSpanId, 'success');
    globalMetrics.record('swarm_run_duration_ms', Date.now() - startTime);

    return {
        agentMemories: memories,
        targetAgent: activeAgent,
        variables: contextVariables,
        taskNotifications: taskNotifications as any[],
    };
}

// Export individual useful functions for the frontend/API
export { launchWorker, stopWorker, getActiveWorkers } from './worker-manager';
export { isCoordinatorMode, getCoordinatorSystemPrompt } from './coordinator-mode';
export { createSendMessageTool, createTaskStopTool, createTaskListTool, createTaskOutputTool } from './send-message';
