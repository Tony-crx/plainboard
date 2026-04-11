import { NextRequest } from 'next/server';
import { generateChatCompletionStream } from '@/lib/llm/openrouter';
import { generateGroqChatCompletionStream } from '@/lib/llm/groq';
import { Message } from '@/lib/swarm/types';

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { messages, model, apiKeys } = body as {
      messages: Message[];
      model: string;
      apiKeys: string[];
    };

    if (!messages || !Array.isArray(messages)) {
      return new Response('Invalid messages format', { status: 400 });
    }

    if (!model) {
      return new Response('Missing model', { status: 400 });
    }

    // Determine provider
    const isGroqModel = model.includes('groq') ||
      model.includes('llama-3') ||
      model.includes('mixtral') ||
      model.includes('gemma');

    // Create stream with abort controller
    const abortController = new AbortController();

    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        try {

          // Select provider based on model
          const streamFn = isGroqModel ? generateGroqChatCompletionStream : generateChatCompletionStream;
          const stream = streamFn(messages, model, undefined, apiKeys, abortController.signal);

          let fullContent = '';

          for await (const chunk of stream) {
            if (typeof chunk === 'string') {
              // Stream token
              fullContent += chunk;
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ token: chunk })}\n\n`));
            }
          }

          // Send completion
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true, content: fullContent })}\n\n`));
          controller.close();
        } catch (error: any) {
          if (error.name !== 'AbortError') {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: error.message })}\n\n`));
          }
          controller.close();
        }
      },
      cancel() {
        abortController.abort();
      }
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
