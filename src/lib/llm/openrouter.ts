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
    return retryWithBackoff(
      async () => {
        return circuitBreaker.execute(async () => {
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
        });
      },
      { 
          maxRetries: 3, 
          baseDelay: 1000,
          shouldRetry: (err) => {
              if (err.message.includes('429')) return true;
              if (err.message.includes('Circuit breaker is open')) return false;
              if (err.message.includes('STRICT MODE VETO')) return false;
              return true; // network errors
          }
      }
    ).catch(err => {
        // If all retries fail, add to Dead Letter Queue
        globalDeadLetterQueue.add({
            agentName: 'LLM_ENGINE',
            payload: { model, messages },
            error: err.message,
            attempts: 4, // 1 base + 3 retries
        });
        throw err;
    });
  };

  return globalQueue.add(runCompletion) as Promise<Message>;
}
