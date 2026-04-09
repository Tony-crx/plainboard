import { NextResponse } from 'next/server';

export async function GET() {
    try {
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
        // Return mostly free models for safety plus maybe some generic top tiers if user wants them
        const safeModels = data.data.filter((m: any) => m.pricing?.prompt === "0" || m.id.endsWith(':free'));
        
        return NextResponse.json({ models: safeModels });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
