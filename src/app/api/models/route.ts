import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const provider = searchParams.get('provider') || 'openrouter';
        const tier = searchParams.get('tier') || 'all';

        if (provider === 'groq') {
            // Return known Groq models
            const groqModels = [
                { id: "llama-3.3-70b-versatile", name: "Llama 3.3 70B Versatile", pricing: { prompt: "0", completion: "0" } },
                { id: "llama-3.1-8b-instant", name: "Llama 3.1 8B Instant", pricing: { prompt: "0", completion: "0" } },
                { id: "llama-guard-3-8b", name: "Llama Guard 3 8B", pricing: { prompt: "0", completion: "0" } },
                { id: "mixtral-8x7b-32768", name: "Mixtral 8x7B 32768", pricing: { prompt: "0", completion: "0" } },
                { id: "gemma2-9b-it", name: "Gemma 2 9B IT", pricing: { prompt: "0", completion: "0" } },
                { id: "whisper-large-v3", name: "Whisper Large v3", pricing: { prompt: "0", completion: "0" } }
            ];
            return NextResponse.json({ models: groqModels });
        }

        // OpenRouter models
        const apiKey = process.env.OPENROUTER_KEYS ? process.env.OPENROUTER_KEYS.split(',')[0] : '';
        const res = await fetch("https://openrouter.ai/api/v1/models", {
            headers: {
                "Authorization": `Bearer ${apiKey}`,
            }
        });

        if (!res.ok) {
            return NextResponse.json({ error: "Failed to fetch models from OpenRouter" }, { status: 500 });
        }

        const data = await res.json();
        let models = data.data;

        // Filter based on tier
        if (tier === 'free') {
            models = models.filter((m: any) => m.pricing?.prompt === "0" || m.id.endsWith(':free'));
        } else if (tier === 'paid') {
            models = models.filter((m: any) => m.pricing?.prompt !== "0" && !m.id.endsWith(':free') && m.pricing?.prompt !== undefined);
        }
        // 'all' returns everything

        return NextResponse.json({ models });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
