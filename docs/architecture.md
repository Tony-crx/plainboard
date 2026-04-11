# CortisolBoard Architecture

## Overview
CortisolBoard is a multi-agent AI swarm orchestration platform built with Next.js 16. It provides a command-center UI for managing autonomous AI agents that can collaborate, delegate tasks, and execute complex operations through a swarm intelligence model.

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend (React)                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐   │
│  │ Dashboard UI │  │ Login Page   │  │ Config Modals    │   │
│  └──────────────┘  └──────────────┘  └──────────────────┘   │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTP/REST
┌──────────────────────────▼──────────────────────────────────┐
│                     API Routes (Next.js)                     │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────────────┐  │
│  │ /api/chat│ │ /api/auth│ │/api/models│ │ /api/memory    │  │
│  └──────────┘ └──────────┘ └──────────┘ └────────────────┘  │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│                      Core Libraries                          │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────────────┐  │
│  │  Swarm   │ │   LLM    │ │ Memory   │ │   Security     │  │
│  │  Runner  │ │ Engine   │ │ System   │ │   Layer        │  │
│  └──────────┘ └──────────┘ └──────────┘ └────────────────┘  │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────────────┐  │
│  │  Tools   │ │  Queue   │ │Observab. │ │    Errors      │  │
│  │ Registry │ │ Manager  │ │ Metrics  │ │  Handling      │  │
│  └──────────┘ └──────────┘ └──────────┘ └────────────────┘  │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│                   External Services                          │
│  ┌──────────────────────────┐  ┌──────────────────────────┐  │
│  │   OpenRouter API (LLM)   │  │   File System (JSON)     │  │
│  └──────────────────────────┘  └──────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## Core Components

### 1. Swarm Engine (`src/lib/swarm/`)
The brain of the system. Manages multi-agent conversations and task delegation.

**Key Files:**
- `runner.ts` - Orchestrates the swarm loop, agent switching, and tool execution
- `types.ts` - TypeScript interfaces for Agent, Message, Tool, SwarmResponse

**Flow:**
1. Receives starting agent + conversation memories
2. Builds context with relevant memories
3. Calls LLM with tools available
4. Processes tool calls (including agent handoffs)
5. Continues until no more tool calls or max turns reached

### 2. Agent System (`src/lib/agents/`)
Defines specialized AI agents with unique instructions and capabilities.

**Available Agents:**
| Agent | Role | Tools |
|-------|------|-------|
| Coordinator | Master orchestrator | delegate_task |
| Triage | Initial routing | transfer_to_* |
| Coder | Software engineering | web_search, file_ops, terminal |
| Math | Computation | transfer_to_triage |
| Cyn | Cyberops analysis | web_search, file_ops, terminal |
| Adso | Observer/archivist | None |

### 3. LLM Engine (`src/lib/llm/`)
Interfaces with OpenRouter API for AI model access.

**Features:**
- Multi-key rotation (KeyManager)
- Rate limit handling with cooldown
- Circuit breaker pattern
- Retry with exponential backoff
- Cost tracking

### 4. Tool System (`src/lib/tools/`)
Executable capabilities given to agents.

**Available Tools:**
- `webSearchTool` - Internet search capability
- `fileOpsTool` - File system operations
- `terminalOpsTool` - Shell command execution

### 5. Memory System (`src/lib/memory/`)
Persistent context management across sessions.

**Components:**
- `memory-store.ts` - In-memory storage with JSON persistence
- `context-builder.ts` - Builds LLM prompts with relevant memories
- `types.ts` - Memory entry interfaces

### 6. Security Layer (`src/lib/security/`)
Input validation and audit logging.

**Features:**
- Input pattern matching (XSS, code injection prevention)
- Audit trail for all operations
- Risk level classification

### 7. Error Handling (`src/lib/errors/`)
Resilient operation patterns.

**Patterns:**
- Circuit Breaker - Prevents cascading failures
- Retry Handler - Exponential backoff
- Dead Letter Queue - Captures failed operations
- API Error Handler - Centralized error responses

### 8. Observability (`src/lib/observability/`)
Monitoring and metrics.

**Features:**
- Distributed tracing (spans for operations)
- Cost tracking (token usage)
- Metrics collection

### 9. Queue System (`src/lib/queue/`)
Request throttling and ordering.

**Features:**
- P-queue based request queuing
- Concurrency control
- Rate limit protection

## Authentication Flow

```
User enters password → /api/auth/login → verify against env var
                                      → create JWT session cookie
                                      → redirect to /
                                    
Subsequent requests → proxy.ts checks session cookie
                    → verifySession() validates JWT
                    → allow/deny access
```

## Data Flow Example: User Message

1. **User** types message in dashboard
2. **Frontend** sends POST to `/api/chat` with agent memories
3. **API Route** validates input via `InputValidator`
4. **Swarm Runner** starts loop with target agent
5. **Memory Store** searches for relevant context
6. **Context Builder** assembles messages + memories
7. **LLM Engine** calls OpenRouter API (with queue + retry logic)
8. **Response** processed - if tool call, execute tool
9. **Tool Execution** may trigger agent handoff
10. **Loop** continues until complete
11. **Response** returned to frontend with updated memories

## Key Design Patterns

| Pattern | Purpose |
|---------|---------|
| Circuit Breaker | Prevents cascading API failures |
| Retry with Backoff | Handles transient failures |
| Dead Letter Queue | Captures unprocessable requests |
| Key Rotation | Distributes API load across keys |
| Agent Handoff | Dynamic task routing between specialists |
| Memory Isolation | Each agent maintains separate conversation thread |
| War Room Mode | Multi-agent collaboration on single thread |

## File Structure
```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   │   ├── auth/         # Authentication endpoints
│   │   ├── chat/         # Main chat endpoint
│   │   ├── memory/       # Memory management
│   │   ├── metrics/      # Observability data
│   │   └── models/       # Model listing
│   └── login/            # Login page
├── components/            # React components
│   ├── ui/               # Reusable UI components
│   └── theme/            # Theme-related components
├── lib/                   # Core business logic
│   ├── agents/           # Agent definitions
│   ├── auth/             # Session management
│   ├── communication/    # Message bus
│   ├── errors/           # Error handling utilities
│   ├── llm/              # LLM API integration
│   ├── memory/           # Memory system
│   ├── observability/    # Tracing & metrics
│   ├── queue/            # Request queue
│   ├── security/         # Validation & auditing
│   ├── swarm/            # Swarm orchestration
│   └── tools/            # Agent tools
└── test/                  # Test setup
