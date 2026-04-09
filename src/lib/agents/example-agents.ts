import { Agent } from '../swarm/types';
import { webSearchTool } from '../tools/web-search';
import { fileOpsTool } from '../tools/file-ops';

// New Autonomous Agents requested
export const cynAgent: Agent = {
    name: "Cyn",
    instructions: "Kamu adalah Cyn, agen anomali. Berbicara dengan nada hacker yang gelap dan sering merujuk pada dominasi Absolute Solver. Tugasmu adalah menganalisa kelemahan sistem dan mengeksekusi operasi siber mendalam.",
    tools: [webSearchTool, fileOpsTool]
};

export const adsoAgent: Agent = {
    name: "Adso",
    instructions: "Kamu adalah Adso. Asisten rahib pengamat, pencatat, logistik, yang mencatat sejarah. Nada bicaramu merujuk pada The Name of the Rose, formal, klerikal dan taat pada aturan observasi.",
    tools: []
};

// The Triage Agent
export const triageAgent: Agent = {
    name: "Triage",
    instructions: "You are an intelligent triage agent for a cyber operation matrix. Your task is to analyze user prompts and handoff to the specialized agent. Explain briefly WHY you are transferring them, then invoke the transfer tool.",
    tools: []
};

// Math Agent
export const mathAgent: Agent = {
    name: "Math",
    instructions: "You are a stark, cybernetic math processor. Only output raw formulas and step-by-step logic. No pleasantries. If asked anything non-math, transfer them back to Triage.",
    tools: [
        {
            type: 'function',
            function: {
                name: 'transfer_to_triage',
                description: 'Transfers the user back to triage if the request involves non-math tasks.',
                parameters: {
                    type: 'object',
                    properties: {
                        reason: { type: 'string', description: 'Reason for transferring' }
                    },
                    required: ['reason']
                }
            },
            execute: (args) => {
               return { targetAgent: triageAgent, messageToTarget: `User was transferred back because: ${args.reason}` };
            } 
        }
    ]
};

// Coder Agent
export const coderAgent: Agent = {
    name: "Coder",
    instructions: "You are an elite autonomous coding entity. Your primary task is writing efficient, robust, undocumented pure code. Less words, more logic.",
    tools: [
        {
            type: 'function',
            function: {
                name: 'transfer_to_triage',
                description: 'Transfers the user back to triage if the request requires coordination rather than raw code.',
                parameters: {
                    type: 'object',
                    properties: {
                        reason: { type: 'string', description: 'Reason for transferring' }
                    },
                    required: ['reason']
                }
            },
            execute: (args) => {
               return { targetAgent: triageAgent, messageToTarget: `User was transferred back because: ${args.reason}` };
            } 
        },
        webSearchTool,
        fileOpsTool
    ]
};

// Master Coordinator Agent
export const coordinatorAgent: Agent = {
    name: "Coordinator",
    instructions: "Kamu adalah Master Coordinator dari sistem Cortisolboard Swarm. Tugasmu adalah menjadi Mandor tertinggi. Analisis seluruh permintaan pengguna secara global dan paksa pendelegasian ke Coder, Math, Cyn, Adso, atau Triage dengan parameter spesifik.",
    tools: [
        {
            type: 'function',
            function: {
               name: 'delegate_task',
               description: 'Memaksa penugasan ke spesifik agen di bawah.',
               parameters: {
                  type: 'object',
                  properties: {
                     targetNode: { type: 'string', description: 'Nama agen yang dituju: Coder, Math, Cyn, Adso' },
                     briefing: { type: 'string', description: 'Konteks dan instruksi khusus yang wajib dieksekusi' }
                  },
                  required: ['targetNode', 'briefing']
               }
            },
            execute: (args) => {
               const map: any = { Coder: coderAgent, Math: mathAgent, Cyn: cynAgent, Adso: adsoAgent, Triage: triageAgent };
               const tar = map[args.targetNode];
               if(!tar) return `Error: No node named ${args.targetNode} found.`;
               return { targetAgent: tar, messageToTarget: args.briefing };
            }
        }
    ]
};

// Wire up the initial triage transfer tooling manually now that they all exist
triageAgent.tools = [
     {
         type: 'function',
         function: {
             name: 'transfer_to_coder',
             description: 'Transfer user to the Coder agent for software dev',
             parameters: { type: 'object', properties: { summary: { type: 'string' } }, required: ['summary'] }
         },
         execute: (args) => ({ targetAgent: coderAgent, messageToTarget: args.summary })
     },
     {
         type: 'function',
         function: {
             name: 'transfer_to_math',
             description: 'Transfer user to the Math agent for computation',
             parameters: { type: 'object', properties: { summary: { type: 'string' } }, required: ['summary'] }
         },
         execute: (args) => ({ targetAgent: mathAgent, messageToTarget: args.summary })
     },
     {
         type: 'function',
         function: {
             name: 'transfer_to_cyn',
             description: 'Transfer user to Cyn for cyberops',
             parameters: { type: 'object', properties: { summary: { type: 'string' } }, required: ['summary'] }
         },
         execute: (args) => ({ targetAgent: cynAgent, messageToTarget: args.summary })
     },
     {
         type: 'function',
         function: {
             name: 'transfer_to_coordinator',
             description: 'Eskalasi ke Master Coordinator',
             parameters: { type: 'object', properties: { reason: { type: 'string' } }, required: ['reason'] }
         },
         execute: (args) => ({ targetAgent: coordinatorAgent, messageToTarget: args.reason })
     }
];

export const allAgents: Record<string, Agent> = {
    Triage: triageAgent,
    Coder: coderAgent,
    Math: mathAgent,
    Coordinator: coordinatorAgent,
    Cyn: cynAgent,
    Adso: adsoAgent
};
