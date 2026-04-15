import { KeyManager } from './key-manager';
import { globalQueue } from '../queue/request-queue';
import { Message, Tool } from '../swarm/types';
import { retryWithBackoff } from '../errors/retry-handler';
import { CircuitBreaker } from '../errors/circuit-breaker';
import { globalDeadLetterQueue } from '../errors/dead-letter-queue';
import { globalCostTracker } from '../observability/cost-tracker';

let keyManagerInstance: KeyManager | null = null;
function getKeyManager() {
  if (!keyManagerInstance) {
    keyManagerInstance = new KeyManager(process.env.OPENROUTER_KEYS || "");
  }
  return keyManagerInstance;
}

const circuitBreaker = new CircuitBreaker();

// Streaming interface
export async function* generateChatCompletionStream(
  messages: Message[],
  model: string = "meta-llama/llama-3.3-70b-instruct:free",
  tools?: Tool[],
  apiKeys?: string[],
  abortSignal?: AbortSignal
): AsyncGenerator<string | Message, void, unknown> {
  const keys = getKeyManager();
  const apiKey = (apiKeys && apiKeys.length > 0) ? apiKeys[Math.floor(Math.random() * apiKeys.length)] : keys.getNextKey();

  const payload: any = {
    model,
    messages,
    temperature: 0.2,
    stream: true
  };

  if (tools && tools.length > 0) {
    payload.tools = tools.map(t => ({
      type: t.type,
      function: t.function
    }));
    payload.tool_choice = "auto";
  }

  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
      "X-Title": "FreeSwarmWebApp"
    },
    body: JSON.stringify(payload),
    signal: abortSignal
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`OpenRouter Error ${res.status}: ${errText}`);
  }

  const reader = res.body?.getReader();
  const decoder = new TextDecoder();
  let fullContent = '';
  let toolCalls: any[] = [];
  let buffer = '';

  try {
    while (reader) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') {
            const finalMessage: Message = { role: 'assistant', content: fullContent };
            if (toolCalls.length > 0) finalMessage.tool_calls = toolCalls;
            yield finalMessage;
            return;
          }

          try {
            const parsed = JSON.parse(data);
            const delta = parsed.choices?.[0]?.delta;
            if (!delta) continue;

            if (delta.content) {
              fullContent += delta.content;
              yield delta.content;
            }

            if (delta.tool_calls) {
              for (const tcCmd of delta.tool_calls) {
                const idx = tcCmd.index;
                if (!toolCalls[idx]) {
                  toolCalls[idx] = { id: tcCmd.id, type: 'function', function: { name: tcCmd.function?.name || '', arguments: '' } };
                }
                if (tcCmd.function?.name) toolCalls[idx].function.name += tcCmd.function.name;
                if (tcCmd.function?.arguments) toolCalls[idx].function.arguments += tcCmd.function.arguments;
              }
            }
          } catch (e) {
            // Skip invalid JSON
          }
        }
      }
    }
  } catch (error: any) {
    if (error.name === 'AbortError') {
      console.log('Stream aborted by user');
    }
    throw error;
  }

  const finalMessage: Message = { role: 'assistant', content: fullContent };
  if (toolCalls.length > 0) finalMessage.tool_calls = toolCalls;
  yield finalMessage;
}

export async function generateChatCompletion(
  messages: Message[],
  model: string = "meta-llama/llama-3.3-70b-instruct:free",
  tools?: Tool[],
  apiKeys?: string[]
): Promise<Message> {

  if (!model.endsWith(":free") && (!apiKeys || apiKeys.length === 0)) {
    throw new Error(`[STRICT MODE VETO] Attempted to use non-free model: ${model}. Only models ending with ':free' are allowed to avoid debt when using system keys.`);
  }

  const runCompletion = async (): Promise<Message> => {
    return circuitBreaker.execute(async () => {
      return retryWithBackoff(
        async () => {
          const keys = getKeyManager();
          const apiKey = (apiKeys && apiKeys.length > 0) ? apiKeys[Math.floor(Math.random() * apiKeys.length)] : keys.getNextKey();

          const payload: any = {
            model,
            messages,
            temperature: 0.2
          };

          if (tools && tools.length > 0) {
            payload.tools = tools.map(t => ({
              type: t.type,
              function: t.function
            }));
            payload.tool_choice = "auto";
          }

          const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${apiKey}`,
              "Content-Type": "application/json",
              "HTTP-Referer": process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
              "X-Title": "FreeSwarmWebApp"
            },
            body: JSON.stringify(payload)
          });

          if (res.status === 429) {
            keys.reportRateLimit(apiKey);
            throw new Error("Rate limit exceeded 429"); // Trigger retry mechanism
          }

          if (!res.ok) {
            const errText = await res.text();
            throw new Error(`OpenRouter Error ${res.status}: ${errText}`);
          }

          const data = await res.json();
          if (data.usage) {
            globalCostTracker.recordUsage(model, data.usage.prompt_tokens || 0, data.usage.completion_tokens || 0, 'LLM_ENGINE');
          }
          return data.choices[0].message as Message;
        },
        {
          maxRetries: 3,
          baseDelay: 1000,
          shouldRetry: (err) => {
            if (err.message.includes('429')) return true;
            if (err.message.includes('Circuit breaker is open')) return false;
            if (err.message.includes('STRICT MODE VETO')) return false;
            if (err.message.includes('No API keys')) return false;
            if (err.message.includes('401')) return false; // Unauthorized implies invalid key, don't bang OpenRouter.
            return true; // network errors
          }
        }
      ).catch(err => {
        // If all retries fail inside the circuit, bubble it up. The circuit breaker will catch this and increment its failure counter.
        // It's crucial because Dead letter queues should only trigger if the final outer scope fails.
        globalDeadLetterQueue.add({
          agentName: 'LLM_ENGINE',
          payload: { model, messages },
          error: err.message,
          attempts: 4,
        });
        throw err;
      });
    });
  };

  return globalQueue.add(runCompletion) as Promise<Message>;
}
