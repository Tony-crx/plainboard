import { KeyManager } from './key-manager';
import { globalQueue } from '../queue/request-queue';
import { Message, Tool } from '../swarm/types';
import { retryWithBackoff } from '../errors/retry-handler';
import { CircuitBreaker } from '../errors/circuit-breaker';
import { globalDeadLetterQueue } from '../errors/dead-letter-queue';
import { globalCostTracker } from '../observability/cost-tracker';

let keyManagerInstance: KeyManager | null = null;
function getGroqKeyManager() {
  if (!keyManagerInstance) {
    keyManagerInstance = new KeyManager(process.env.GROQ_KEYS || "");
  }
  return keyManagerInstance;
}

const circuitBreaker = new CircuitBreaker();

// Streaming interface
export async function* generateGroqChatCompletionStream(
  messages: Message[],
  model: string = "llama-3.3-70b-versatile",
  tools?: Tool[],
  apiKeys?: string[],
  abortSignal?: AbortSignal
): AsyncGenerator<string, Message> {
  const keys = getGroqKeyManager();
  const apiKey = (apiKeys && apiKeys.length > 0) ? apiKeys[Math.floor(Math.random() * apiKeys.length)] : keys.getNextKey();

  const groqTools = tools && tools.length > 0 ? tools.map(t => ({
    type: t.type,
    function: t.function
  })) : undefined;

  const payload: any = {
    model,
    messages,
    temperature: 0.2,
    stream: true
  };

  if (groqTools) {
    payload.tools = groqTools;
    payload.tool_choice = "auto";
  }

  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload),
    signal: abortSignal
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Groq Error ${res.status}: ${errText}`);
  }

  const reader = res.body?.getReader();
  const decoder = new TextDecoder();
  let fullContent = '';
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
            return { role: 'assistant', content: fullContent } as Message;
          }

          try {
            const parsed = JSON.parse(data);
            const delta = parsed.choices?.[0]?.delta?.content;
            if (delta) {
              fullContent += delta;
              yield delta;
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

  return { role: 'assistant', content: fullContent } as Message;
}

export async function generateGroqChatCompletion(
  messages: Message[],
  model: string = "llama-3.3-70b-versatile",
  tools?: Tool[],
  apiKeys?: string[]
): Promise<Message> {

  const runCompletion = async (): Promise<Message> => {
    return circuitBreaker.execute(async () => {
      return retryWithBackoff(
        async () => {
          const keys = getGroqKeyManager();
          const apiKey = (apiKeys && apiKeys.length > 0) ? apiKeys[Math.floor(Math.random() * apiKeys.length)] : keys.getNextKey();

          const groqTools = tools && tools.length > 0 ? tools.map(t => ({
            type: t.type,
            function: t.function
          })) : undefined;

          const payload: any = {
            model,
            messages,
            temperature: 0.2
          };

          if (groqTools) {
            payload.tools = groqTools;
            payload.tool_choice = "auto";
          }

          const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${apiKey}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
          });

          if (res.status === 429) {
            keys.reportRateLimit(apiKey);
            throw new Error("Rate limit exceeded 429");
          }

          if (!res.ok) {
            const errText = await res.text();
            throw new Error(`Groq Error ${res.status}: ${errText}`);
          }

          const data = await res.json();
          if (data.usage) {
            globalCostTracker.recordUsage(model, data.usage.prompt_tokens || 0, data.usage.completion_tokens || 0, 'GROQ');
          }
          return data.choices[0].message as Message;
        },
        {
          maxRetries: 3,
          baseDelay: 1000,
          shouldRetry: (err) => {
            if (err.message.includes('429')) return true;
            if (err.message.includes('Circuit breaker is open')) return false;
            if (err.message.includes('No API keys')) return false;
            if (err.message.includes('401')) return false;
            return true;
          }
        }
      ).catch(err => {
        globalDeadLetterQueue.add({
          agentName: 'GROQ',
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
