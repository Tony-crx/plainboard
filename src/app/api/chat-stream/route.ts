import { NextRequest } from 'next/server';
import { generateChatCompletionStream } from '@/lib/llm/openrouter';
import { generateGroqChatCompletionStream } from '@/lib/llm/groq';
import { Message, Agent, SwarmContext, Tool } from '@/lib/swarm/types';
import { allAgents } from '@/lib/agents/example-agents';
import { globalMemoryStore } from '@/lib/memory/memory-store';
import { globalContextBuilder } from '@/lib/memory/context-builder';
import { globalTracer } from '@/lib/observability/tracer';
import { globalPermissionEngine } from '@/lib/permissions/engine';
import { partitionTools, buildLoadedToolSchema } from '@/lib/tools/tool-deferral';
import { sessionManager } from '@/lib/storage/session-manager';
import { globalTaskStore } from '@/lib/tasks/task-store';
import { launchWorker, getActiveWorkers, buildWorkerNotification } from '@/lib/swarm/worker-manager';
import {
  isCoordinatorMode,
  getCoordinatorSystemPrompt,
  getCoordinatorTools,
  buildTaskNotificationXml,
} from '@/lib/swarm/coordinator-mode';

export const maxDuration = 120;

const MAX_TURNS = 10;

/**
 * Full swarm streaming endpoint.
 * Unlike the simple streaming endpoint, this supports:
 * - Agent orchestration with tool calls and handoffs
 * - Real-time token streaming
 * - Worker launch and notification events
 * - Session persistence
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      agentMemories,
      activeAgentName,
      selectedModel,
      enabledAgents,
      agentOverrides,
      apiKeys,
      sessionId,
      contextVariables,
    } = body as {
      agentMemories: Record<string, Message[]>;
      activeAgentName: string;
      selectedModel: string;
      enabledAgents: Record<string, boolean>;
      agentOverrides: Record<string, { name?: string; instructions?: string; model?: string }>;
      apiKeys: string[];
      sessionId?: string;
      contextVariables?: Record<string, any>;
    };

    if (!agentMemories || typeof agentMemories !== 'object') {
      return new Response('Invalid agentMemories', { status: 400 });
    }

    const startingAgent = allAgents[activeAgentName || 'Triage'];
    if (!startingAgent) {
      return new Response(`Unknown agent: ${activeAgentName}`, { status: 400 });
    }

    let activeAgent: Agent = { ...startingAgent };

    // Apply overrides
    if (agentOverrides?.[activeAgent.name]) {
      const override = agentOverrides[activeAgent.name];
      if (override.name) activeAgent.name = override.name;
      if (override.instructions) activeAgent.instructions = override.instructions;
      if (override.model) activeAgent.model = override.model;
    }

    const model = selectedModel || activeAgent.model || 'meta-llama/llama-3.3-70b-instruct:free';
    const contextVars = contextVariables || {};
    const memories: Record<string, Message[]> = { ...agentMemories };

    if (!memories[activeAgent.name]) memories[activeAgent.name] = [];

    // Build permission context
    const permissionCtx = globalPermissionEngine.buildContextForAgent(
      activeAgent.permissionMode || 'default',
      activeAgent.allowedTools,
      activeAgent.workingDirectories
    );
    permissionCtx.shouldAvoidPermissionPrompts = activeAgent.avoidPermissionPrompts ?? false;

    // Partition tools
    const allTools = activeAgent.tools || [];
    const { loaded } = partitionTools(allTools);

    // Coordinator mode setup
    let systemOverride: string | null = null;
    let currentTools = loaded;
    if (isCoordinatorMode()) {
      systemOverride = getCoordinatorSystemPrompt(
        typeof activeAgent.instructions === 'string'
          ? activeAgent.instructions
          : activeAgent.instructions({})
      );
      currentTools = getCoordinatorTools(loaded);
    }

    const toolSchema = buildLoadedToolSchema(currentTools);

    const abortController = new AbortController();

    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();

        const sendEvent = (data: Record<string, any>) => {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        };

        try {
          let turnCount = 0;

          while (turnCount < MAX_TURNS) {
            turnCount++;

            // Send turn event
            sendEvent({
              type: 'turn',
              turn: turnCount,
              agent: activeAgent.name,
            });

            const systemContent = systemOverride ?? (
              typeof activeAgent.instructions === 'function'
                ? activeAgent.instructions(contextVars)
                : activeAgent.instructions
            );

            const currentMessages = memories[activeAgent.name];

            // Search relevant memories
            const latestUserMsg = [...currentMessages].reverse().find(m => m.role === 'user');
            let relevantMemories: any[] = [];
            if (latestUserMsg?.content) {
              relevantMemories = await globalMemoryStore.search(latestUserMsg.content, 5);
            }

            let callMessages: Message[] = [
              { role: 'system', content: systemContent },
              ...currentMessages,
            ];
            callMessages = globalContextBuilder.buildContext(callMessages, relevantMemories);
            callMessages = globalContextBuilder.truncateToContextLimit(callMessages);

            // Determine provider
            const chosenModel = agentOverrides?.[activeAgent.name]?.model || activeAgent.model || model;
            const isGroqModel = chosenModel.includes('groq') ||
              chosenModel.includes('llama-3') ||
              chosenModel.includes('mixtral') ||
              chosenModel.includes('gemma');

            const streamFn = isGroqModel ? generateGroqChatCompletionStream : generateChatCompletionStream;
            const stream = streamFn(callMessages, chosenModel, toolSchema, apiKeys, abortController.signal);

            let fullContent = '';
            let hasToolCalls = false;

            for await (const chunk of stream) {
              if (typeof chunk === 'string') {
                // Streaming token
                fullContent += chunk;
                sendEvent({
                  type: 'token',
                  token: chunk,
                  agent: activeAgent.name,
                });
              } else {
                // Final message object
                const responseMessage = chunk as Message;
                responseMessage.name = activeAgent.name;

                // Save to memory
                memories[activeAgent.name].push(responseMessage);

                // Check for tool calls
                if (responseMessage.tool_calls && responseMessage.tool_calls.length > 0) {
                  hasToolCalls = true;
                  sendEvent({
                    type: 'tool_calls',
                    toolCalls: responseMessage.tool_calls,
                    agent: activeAgent.name,
                  });

                  // Execute tools
                  for (const toolCall of responseMessage.tool_calls) {
                    const toolName = toolCall.function.name;
                    let toolArgs = {};
                    try { toolArgs = JSON.parse(toolCall.function.arguments); } catch { }

                    const toolFunc = allTools.find(t => t.function.name === toolName);

                    if (!toolFunc) {
                      sendEvent({
                        type: 'tool_result',
                        toolCallId: toolCall.id,
                        toolName,
                        content: `Error: Tool '${toolName}' not found.`,
                        agent: activeAgent.name,
                        error: true,
                      });
                      memories[activeAgent.name].push({
                        role: 'tool',
                        tool_call_id: toolCall.id,
                        name: toolName,
                        content: `Error: Tool '${toolName}' not found.`,
                      });
                      continue;
                    }

                    // Permission check
                    const permResult = globalPermissionEngine.checkPermission(toolName, permissionCtx, toolArgs);
                    if (permResult.behavior === 'deny') {
                      sendEvent({
                        type: 'tool_result',
                        toolCallId: toolCall.id,
                        toolName,
                        content: `Permission denied: ${permResult.reason}`,
                        agent: activeAgent.name,
                        error: true,
                      });
                      memories[activeAgent.name].push({
                        role: 'tool',
                        tool_call_id: toolCall.id,
                        name: toolName,
                        content: `Permission denied: ${permResult.reason}`,
                      });
                      continue;
                    }

                    sendEvent({
                      type: 'tool_start',
                      toolCallId: toolCall.id,
                      toolName,
                      args: toolArgs,
                      agent: activeAgent.name,
                    });

                    try {
                      const ctx: SwarmContext = {
                        variables: contextVars,
                        agentMemories: memories,
                        permissionContext: permissionCtx,
                      };
                      const output = await toolFunc.execute(toolArgs, ctx);

                      let toolResultContent = '';

                      // Check for agent handoff
                      if (output && typeof output === 'object' && output.targetAgent) {
                        const target: Agent = { ...output.targetAgent };
                        const targetName = output.targetAgent.name;

                        if (enabledAgents && enabledAgents[targetName] === false) {
                          toolResultContent = `Agent '${targetName}' is disabled.`;
                        } else {
                          const msgToTarget = output.messageToTarget || 'Task handoff.';

                          // Full context transfer
                          if (!memories[targetName]) memories[targetName] = [];
                          const transferContext = memories[activeAgent.name]
                            .slice(-10)
                            .map(m => `${m.role}: ${m.content}`)
                            .join('\n');

                          memories[targetName].push({
                            role: 'user',
                            content: `[SYSTEM HANDOFF FROM ${activeAgent.name} WITH CONTEXT]:\n\nTask: ${msgToTarget}\n\nRecent context:\n${transferContext}`,
                          });

                          // Switch active agent
                          activeAgent = target;
                          sendEvent({
                            type: 'handoff',
                            from: activeAgent.name,
                            to: target.name,
                            message: msgToTarget,
                          });

                          // Update permission context
                          const newPermCtx = globalPermissionEngine.buildContextForAgent(
                            target.permissionMode || 'default',
                            target.allowedTools,
                            target.workingDirectories
                          );
                          newPermCtx.shouldAvoidPermissionPrompts = target.avoidPermissionPrompts ?? false;
                          Object.assign(permissionCtx, newPermCtx);
                        }
                      } else if (toolName === 'agent' || toolName === 'spawn_worker') {
                        // Launch async worker
                        const workerAgent = (toolArgs as any).agent || activeAgent;
                        const workerMsg = (toolArgs as any).prompt || (toolArgs as any).message || '';
                        const runAsync = (toolArgs as any).run_in_background === true;

                        const worker = await launchWorker(workerAgent, workerMsg, memories, contextVars, {
                          runInBackground: runAsync,
                          maxTurns: Math.floor(MAX_TURNS / 2),
                          selectedModel: model,
                          enabledAgents,
                          agentOverrides,
                          apiKeys,
                        });

                        if (runAsync) {
                          toolResultContent = `Worker launched. Task ID: ${worker.taskId}`;
                          sendEvent({
                            type: 'worker_launched',
                            taskId: worker.taskId,
                            agentName: worker.agent.name,
                            runInBackground: true,
                          });
                        } else {
                          const result = await worker.promise;
                          const notification = buildWorkerNotification(worker, result);
                          toolResultContent = buildTaskNotificationXml(
                            notification.taskId,
                            notification.agentName,
                            notification.status,
                            notification.summary,
                            notification.result,
                          );
                          sendEvent({
                            type: 'worker_completed',
                            taskId: worker.taskId,
                            agentName: notification.agentName,
                            result: notification.result,
                          });
                        }
                      } else {
                        toolResultContent = typeof output === 'string' ? output : JSON.stringify(output);
                      }

                      sendEvent({
                        type: 'tool_result',
                        toolCallId: toolCall.id,
                        toolName,
                        content: toolResultContent,
                        agent: activeAgent.name,
                      });

                      memories[activeAgent.name].push({
                        role: 'tool',
                        tool_call_id: toolCall.id,
                        name: toolName,
                        content: toolResultContent,
                      });
                    } catch (err: any) {
                      sendEvent({
                        type: 'tool_result',
                        toolCallId: toolCall.id,
                        toolName,
                        content: `Error: ${err.message}`,
                        agent: activeAgent.name,
                        error: true,
                      });
                    }
                  }
                }
              }
            }

            // If no tool calls, break the loop
            if (!hasToolCalls) break;
          }

          // Get final agent name
          const newAgentName = activeAgent.name;

          // Save session if sessionId provided
          if (sessionId) {
            sessionManager.updateSession(sessionId, {
              agentMemories: memories,
              activeAgentName: newAgentName,
              updatedAt: Date.now(),
            });
          }

          // Final event with complete memories
          sendEvent({
            type: 'done',
            agentMemories: memories,
            newAgentName,
            variables: contextVars,
          });

          controller.close();
        } catch (error: any) {
          if (error.name !== 'AbortError') {
            sendEvent({ type: 'error', error: error.message });
          }
          controller.close();
        }
      },
      cancel() {
        abortController.abort();
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error: any) {
    return new Response(error.message, { status: 500 });
  }
}
