import { NextResponse } from 'next/server';
import { generateChatCompletion } from '@/lib/llm/openrouter';
import { Message } from '@/lib/swarm/types';
import { allAgents } from '@/lib/agents/example-agents';

export const maxDuration = 30; // Max allowed Edge/Node duration in Vercel.

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { userPrompt, enabledAgents, selectedModel, apiKeys } = body;
        
        if (!userPrompt) {
            return NextResponse.json({ error: "No prompt provided" }, { status: 400 });
        }

        const activeAgentsNames = Object.keys(enabledAgents).filter(k => enabledAgents[k]);
        if (activeAgentsNames.length === 0) {
             return NextResponse.json({ activeAgentsNames: [] });
        }

        const availableAgentsDesc = activeAgentsNames.map(name => {
             const ag = allAgents[name];
             return `- ${name}: ${ag ? ag.instructions.toString().substring(0, 100) : "Unknown capability"}...`;
        }).join("\n");

        const systemInstructions = `You are the War Room Coordinator. Your ONLY job is to select the most appropriate AI agents from a given list to respond to a user's prompt.
        
Available Agents:
${availableAgentsDesc}

User Prompt: "${userPrompt.length > 500 ? userPrompt.substring(0, 500) + "..." : userPrompt}"

Decide which agents are competent to handle or converse about this. 
You must output a raw JSON array of strings containing ONLY the agent names, like: ["Coder", "Math"].
Output exactly the JSON array. Without markdown formatting, without backticks, without explanations.
Choose a MAXIMUM of 3 agents to prevent system rate limit overloads. But ideally just 1 or 2. If the user explicitly mentions an agent, include them.`;

        const messages: Message[] = [
           { role: 'system', content: systemInstructions }
        ];

        // Ensure we pass the fallback model correctly
        const chosenModel = selectedModel || "meta-llama/llama-3.3-70b-instruct:free";

        const responseMessage = await generateChatCompletion(messages, chosenModel, undefined, apiKeys);
        const contentStr = responseMessage.content?.trim() || "";

        let parsedAgents: string[] = [];
        try {
            // Strip any potential markdown json fences
            const cleaned = contentStr.replace(/```json/g, '').replace(/```/g, '').trim();
            parsedAgents = JSON.parse(cleaned);

            if (!Array.isArray(parsedAgents)) throw new Error("Not an array");
            
            // Only keep agents that are actually enabled and exist
            parsedAgents = parsedAgents.filter(n => activeAgentsNames.includes(n));
            
        } catch (e) {
            // Fallback: If it failed to parse, use simple substring checks
            console.error("Router parse failed, relying on fallback:", e);
            parsedAgents = [];
            for (const name of activeAgentsNames) {
                if (contentStr.includes(name)) parsedAgents.push(name);
            }
            if (parsedAgents.length === 0) {
               // Absolute fallback: Just default to the first two active
               parsedAgents = activeAgentsNames.slice(0, 2);
            }
        }

        // Limit forcefully to 3
        if (parsedAgents.length > 3) {
             parsedAgents = parsedAgents.slice(0, 3);
        }

        return NextResponse.json({ activeAgentsNames: parsedAgents });

    } catch (err: any) {
        console.error("War Room Routing Error:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
