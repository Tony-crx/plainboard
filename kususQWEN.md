# cortisolboard - Implementation Plan

## 🎯 Project Overview

A hand-rolled multi-agent swarm system inspired by OpenAI's Swarm pattern, built with Next.js, OpenRouter API, and custom orchestration logic.

**Current Stack:**

- Next.js (App Router)
- TypeScript
- OpenRouter API (free-tier models only)
- p-queue for rate limiting
- Framer Motion + lucide-react for UI
- UUID for ID generation

---

## 📋 Implementation Roadmap

### PHASE 1: Foundation (Priority: Critical)

#### 1.1 Memory & Context Management

**Goal:** Implement long-term memory, cross-agent shared memory, and session persistence.

**Files to create/modify:**

```
src/
  lib/
    memory/
      memory-store.ts          # In-memory + file-based persistence
      vector-memory.ts          # Semantic search with embeddings
      context-builder.ts        # Smart context window management
      types.ts                  # Memory-related types
```

**Implementation Details:**

`memory/types.ts`:

```typescript
export interface MemoryEntry {
  id: string;
  agentName: string;
  content: string;
  embedding?: number[];
  timestamp: number;
  priority: 'low' | 'medium' | 'high';
  tags: string[];
}

export interface SharedContext {
  conversationId: string;
  variables: Map<string, any>;
  summaries: Map<string, string>;
}

export interface MemoryStore {
  add(entry: MemoryEntry): Promise<void>;
  search(query: string, limit?: number): Promise<MemoryEntry[]>;
  getByAgent(agentName: string, limit?: number): Promise<MemoryEntry[]>;
  clear(): Promise<void>;
}
```

`memory/memory-store.ts`:

```typescript
import fs from 'fs/promises';
import path from 'path';
import { MemoryEntry, MemoryStore } from './types';

export class FileMemoryStore implements MemoryStore {
  private memories: MemoryEntry[] = [];
  private persistPath: string;

  constructor(persistPath: string = './data/memories.json') {
    this.persistPath = persistPath;
    this.load();
  }

  async add(entry: MemoryEntry): Promise<void> {
    this.memories.push(entry);
    await this.persist();
  }

  async search(query: string, limit: number = 5): Promise<MemoryEntry[]> {
    // Simple keyword matching (Phase 2: upgrade to embeddings)
    return this.memories
      .filter(m => m.content.toLowerCase().includes(query.toLowerCase()))
      .slice(-limit);
  }

  async getByAgent(agentName: string, limit: number = 10): Promise<MemoryEntry[]> {
    return this.memories
      .filter(m => m.agentName === agentName)
      .slice(-limit);
  }

  async clear(): Promise<void> {
    this.memories = [];
    await this.persist();
  }

  private async load(): Promise<void> {
    try {
      const data = await fs.readFile(this.persistPath, 'utf-8');
      this.memories = JSON.parse(data);
    } catch {
      this.memories = [];
    }
  }

  private async persist(): Promise<void> {
    await fs.mkdir(path.dirname(this.persistPath), { recursive: true });
    await fs.writeFile(this.persistPath, JSON.stringify(this.memories, null, 2));
  }
}
```

`memory/context-builder.ts`:

```typescript
import { Message } from '@/lib/swarm/types';
import { MemoryEntry } from './types';

export class ContextBuilder {
  private maxContextTokens: number = 4000;

  buildContext(
    currentMessages: Message[],
    relevantMemories: MemoryEntry[]
  ): Message[] {
    // Inject top relevant memories as system context
    const memoryContext: Message = {
      role: 'system',
      content: [
        '## Relevant Context from Previous Conversations:',
        ...relevantMemories.map(m => `- ${m.content}`)
      ].join('\n')
    };

    return [memoryContext, ...currentMessages];
  }

  truncateToContextLimit(messages: Message[]): Message[] {
    // Simple truncation - Phase 2: implement token counting
    while (messages.length > 20) {
      messages.shift();
    }
    return messages;
  }
}
```

**Tasks:**

- [ ] Create memory type definitions
- [ ] Implement file-based memory store
- [ ] Build context builder with smart injection
- [ ] Integrate memory store into `runSwarm()`
- [ ] Add memory persistence to API route
- [ ] Write unit tests for memory store

---

#### 1.2 Error Handling & Recovery

**Goal:** Implement circuit breaker, retry logic, and graceful degradation.

**Files to create/modify:**

```
src/
  lib/
    errors/
      circuit-breaker.ts       # Circuit breaker pattern
      retry-handler.ts          # Exponential backoff retry
      error-types.ts            # Custom error classes
      dead-letter-queue.ts      # Failed request queue
```

**Implementation Details:**

`errors/error-types.ts`:

```typescript
export class AgentError extends Error {
  constructor(
    message: string,
    public readonly agentName: string,
    public readonly code: string,
    public readonly recoverable: boolean = true
  ) {
    super(message);
    this.name = 'AgentError';
  }
}

export class RateLimitError extends AgentError {
  constructor(agentName: string, public readonly retryAfter: number) {
    super('Rate limit exceeded', agentName, 'RATE_LIMIT', true);
  }
}

export class ModelError extends AgentError {
  constructor(agentName: string, message: string) {
    super(message, agentName, 'MODEL_ERROR', false);
  }
}

export class TimeoutError extends AgentError {
  constructor(agentName: string) {
    super('Request timeout', agentName, 'TIMEOUT', true);
  }
}
```

`errors/circuit-breaker.ts`:

```typescript
type CircuitState = 'closed' | 'open' | 'half-open';

export class CircuitBreaker {
  private state: CircuitState = 'closed';
  private failureCount: number = 0;
  private lastFailureTime: number = 0;
  private readonly threshold: number = 3;
  private readonly resetTimeout: number = 30000; // 30s

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      if (Date.now() - this.lastFailureTime > this.resetTimeout) {
        this.state = 'half-open';
      } else {
        throw new Error('Circuit breaker is open');
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    this.failureCount = 0;
    this.state = 'closed';
  }

  private onFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.failureCount >= this.threshold) {
      this.state = 'open';
    }
  }

  getState(): CircuitState {
    return this.state;
  }
}
```

`errors/retry-handler.ts`:

```typescript
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries?: number;
    baseDelay?: number;
    maxDelay?: number;
    shouldRetry?: (error: Error) => boolean;
  } = {}
): Promise<T> {
  const {
    maxRetries = 3,
    baseDelay = 1000,
    maxDelay = 10000,
    shouldRetry = () => true
  } = options;

  let lastError: Error;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      if (attempt === maxRetries || !shouldRetry(error as Error)) {
        throw error;
      }

      const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError!;
}
```

`errors/dead-letter-queue.ts`:

```typescript
export interface DeadLetterEntry {
  id: string;
  agentName: string;
  payload: any;
  error: string;
  attempts: number;
  timestamp: number;
}

export class DeadLetterQueue {
  private queue: DeadLetterEntry[] = [];
  private maxSize: number = 1000;

  add(entry: Omit<DeadLetterEntry, 'id' | 'timestamp'>): void {
    const fullEntry: DeadLetterEntry = {
      ...entry,
      id: crypto.randomUUID(),
      timestamp: Date.now()
    };

    this.queue.push(fullEntry);

    if (this.queue.length > this.maxSize) {
      this.queue = this.queue.slice(-this.maxSize);
    }
  }

  getAll(): DeadLetterEntry[] {
    return [...this.queue];
  }

  clear(): void {
    this.queue = [];
  }
}
```

**Tasks:**

- [ ] Create custom error types
- [ ] Implement circuit breaker for LLM calls
- [ ] Add retry handler with exponential backoff
- [ ] Build dead letter queue for failed requests
- [ ] Integrate error handling into `runSwarm()`
- [ ] Add error boundaries to UI

---

#### 1.3 Enhanced Observability

**Goal:** Real-time monitoring, execution tracing, and cost tracking.

**Files to create/modify:**

```
src/
  lib/
    observability/
      tracer.ts                 # Execution tracing
      metrics.ts                # Performance metrics
      cost-tracker.ts           # Cost calculation
      logger.ts                 # Structured logging
```

**Implementation Details:**

`observability/tracer.ts`:

```typescript
export interface Span {
  id: string;
  name: string;
  agentName: string;
  startTime: number;
  endTime?: number;
  status: 'success' | 'error' | 'pending';
  metadata: Record<string, any>;
  children: string[];
}

export class Tracer {
  private spans: Map<string, Span> = new Map();
  private listeners: ((span: Span) => void)[] = [];

  startSpan(name: string, agentName: string, metadata?: Record<string, any>): string {
    const id = crypto.randomUUID();
    const span: Span = {
      id,
      name,
      agentName,
      startTime: Date.now(),
      status: 'pending',
      metadata: metadata || {},
      children: []
    };

    this.spans.set(id, span);
    this.notifyListeners(span);
    return id;
  }

  endSpan(spanId: string, status: 'success' | 'error'): void {
    const span = this.spans.get(spanId);
    if (span) {
      span.endTime = Date.now();
      span.status = status;
      this.notifyListeners(span);
    }
  }

  getTrace(spanId: string): Span | undefined {
    return this.spans.get(spanId);
  }

  getAllSpans(): Span[] {
    return Array.from(this.spans.values());
  }

  getSpansByAgent(agentName: string): Span[] {
    return this.getAllSpans().filter(s => s.agentName === agentName);
  }

  onSpanUpdate(listener: (span: Span) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notifyListeners(span: Span): void {
    this.listeners.forEach(listener => listener(span));
  }
}

export const globalTracer = new Tracer();
```

`observability/metrics.ts`:

```typescript
interface MetricData {
  count: number;
  sum: number;
  min: number;
  max: number;
}

export class MetricsCollector {
  private metrics: Map<string, MetricData> = new Map();

  record(metricName: string, value: number): void {
    const existing = this.metrics.get(metricName);

    if (existing) {
      existing.count++;
      existing.sum += value;
      existing.min = Math.min(existing.min, value);
      existing.max = Math.max(existing.max, value);
    } else {
      this.metrics.set(metricName, {
        count: 1,
        sum: value,
        min: value,
        max: value
      });
    }
  }

  getMetrics(metricName: string): MetricData | undefined {
    return this.metrics.get(metricName);
  }

  getAllMetrics(): Map<string, MetricData> {
    return new Map(this.metrics);
  }

  getAverage(metricName: string): number | undefined {
    const metric = this.metrics.get(metricName);
    return metric ? metric.sum / metric.count : undefined;
  }
}

export const globalMetrics = new MetricsCollector();
```

`observability/cost-tracker.ts`:

```typescript
// Approximate cost per 1K tokens (free tier models)
const MODEL_COSTS: Record<string, { input: number; output: number }> = {
  'llama-3.3-70b-instruct': { input: 0.0007, output: 0.0007 },
  'gemini-2.5-pro-exp': { input: 0, output: 0 }, // free
  'mistral-nemo': { input: 0.00035, output: 0.00035 }
};

export class CostTracker {
  private totalCost: number = 0;
  private costByAgent: Map<string, number> = new Map();
  private costByModel: Map<string, number> = new Map();

  recordUsage(
    model: string,
    inputTokens: number,
    outputTokens: number,
    agentName: string
  ): void {
    const costs = MODEL_COSTS[model] || { input: 0.001, output: 0.001 };
    const cost = (inputTokens * costs.input + outputTokens * costs.output) / 1000;

    this.totalCost += cost;

    const agentCost = this.costByAgent.get(agentName) || 0;
    this.costByAgent.set(agentName, agentCost + cost);

    const modelCost = this.costByModel.get(model) || 0;
    this.costByModel.set(model, modelCost + cost);
  }

  getTotalCost(): number {
    return this.totalCost;
  }

  getCostByAgent(agentName: string): number {
    return this.costByAgent.get(agentName) || 0;
  }

  getCostByModel(model: string): number {
    return this.costByModel.get(model) || 0;
  }

  getBreakdown(): {
    total: number;
    byAgent: Map<string, number>;
    byModel: Map<string, number>;
  } {
    return {
      total: this.totalCost,
      byAgent: this.costByAgent,
      byModel: this.costByModel
    };
  }
}

export const globalCostTracker = new CostTracker();
```

**Tasks:**

- [ ] Implement execution tracer
- [ ] Build metrics collector
- [ ] Add cost tracking
- [ ] Create observability API endpoint
- [ ] Update UI to show real-time metrics
- [ ] Add tracing to swarm runner loop

---

### PHASE 2: Capabilities (Priority: High)

#### 2.1 Tool Ecosystem

**Goal:** Expand available tools for agents to use.

**Files to create/modify:**

```
src/
  lib/
    tools/
      web-search.ts             # Web search via API
      file-ops.ts               # File read/write/delete
      code-executor.ts          # Code execution sandbox
      api-client.ts             # Generic REST API caller
      db-query.ts               # Database query tool
      git-ops.ts                # Git operations
      registry.ts               # Tool registry
```

**Implementation Details:**

`tools/registry.ts`:

```typescript
import { Tool } from '@/lib/swarm/types';

export class ToolRegistry {
  private tools: Map<string, Tool> = new Map();

  register(tool: Tool): void {
    this.tools.set(tool.name, tool);
  }

  get(name: string): Tool | undefined {
    return this.tools.get(name);
  }

  getAll(): Tool[] {
    return Array.from(this.tools.values());
  }

  getToolSchema(agentName: string): any[] {
    return this.getAll().map(tool => ({
      type: 'function',
      function: {
        name: tool.name,
        description: tool.description,
        parameters: tool.parameters
      }
    }));
  }

  async executeTool(name: string, args: any): Promise<any> {
    const tool = this.tools.get(name);
    if (!tool) {
      throw new Error(`Tool not found: ${name}`);
    }
    return tool.execute(args);
  }
}

export const globalToolRegistry = new ToolRegistry();
```

`tools/web-search.ts`:

```typescript
export const webSearchTool = {
  name: 'web_search',
  description: 'Search the web for current information',
  parameters: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: 'Search query'
      },
      maxResults: {
        type: 'number',
        description: 'Maximum number of results to return'
      }
    },
    required: ['query']
  },
  execute: async ({ query, maxResults = 5 }: { query: string; maxResults?: number }) => {
    // Use free search API or web scraping
    const response = await fetch(`https://api.example.com/search?q=${encodeURIComponent(query)}`);
    const data = await response.json();
    return data.results.slice(0, maxResults);
  }
};
```

`tools/file-ops.ts`:

```typescript
import fs from 'fs/promises';
import path from 'path';

const SAFE_DIR = process.env.SAFE_DIR || '/tmp/swarm-files';

export const fileOpsTool = {
  name: 'file_operations',
  description: 'Read, write, or delete files safely',
  parameters: {
    type: 'object',
    properties: {
      operation: {
        type: 'string',
        enum: ['read', 'write', 'delete', 'list'],
        description: 'File operation to perform'
      },
      filePath: {
        type: 'string',
        description: 'Path to the file'
      },
      content: {
        type: 'string',
        description: 'Content to write (for write operation)'
      }
    },
    required: ['operation', 'filePath']
  },
  execute: async ({ operation, filePath, content }: {
    operation: string;
    filePath: string;
    content?: string;
  }) => {
    // Security: restrict to safe directory
    const resolvedPath = path.resolve(SAFE_DIR, path.relative(SAFE_DIR, filePath));

    switch (operation) {
      case 'read':
        return await fs.readFile(resolvedPath, 'utf-8');
      case 'write':
        await fs.mkdir(path.dirname(resolvedPath), { recursive: true });
        await fs.writeFile(resolvedPath, content || '', 'utf-8');
        return `File written: ${resolvedPath}`;
      case 'delete':
        await fs.unlink(resolvedPath);
        return `File deleted: ${resolvedPath}`;
      case 'list':
        return await fs.readdir(resolvedPath);
      default:
        throw new Error(`Unknown operation: ${operation}`);
    }
  }
};
```

**Tasks:**

- [ ] Create tool registry system
- [ ] Implement web search tool
- [ ] Build file operations tool
- [ ] Add code execution sandbox
- [ ] Create generic API client tool
- [ ] Write tool execution tests
- [ ] Add tool permissions system

---

#### 2.2 Communication Protocol

**Goal:** Inter-agent messaging and handoff audit trail.

**Files to create/modify:**

```
src/
  lib/
    communication/
      message-bus.ts            # Inter-agent messaging
      handoff-manager.ts        # Agent handoff coordination
      broadcast.ts              # Broadcast/multicast support
```

**Implementation Details:**

`communication/message-bus.ts`:

```typescript
export interface AgentMessage {
  id: string;
  from: string;
  to: string;
  type: 'handoff' | 'query' | 'response' | 'broadcast';
  content: any;
  timestamp: number;
  priority: 'low' | 'normal' | 'high';
}

export class MessageBus {
  private messages: AgentMessage[] = [];
  private listeners: Map<string, ((message: AgentMessage) => void)[]> = new Map();

  async send(message: Omit<AgentMessage, 'id' | 'timestamp'>): Promise<void> {
    const fullMessage: AgentMessage = {
      ...message,
      id: crypto.randomUUID(),
      timestamp: Date.now()
    };

    this.messages.push(fullMessage);

    // Notify listeners
    const toListeners = this.listeners.get(message.to) || [];
    toListeners.forEach(listener => listener(fullMessage));

    // Handle broadcasts
    if (message.type === 'broadcast') {
      this.listeners.forEach((listeners, agentName) => {
        listeners.forEach(listener => listener(fullMessage));
      });
    }
  }

  on(agentName: string, handler: (message: AgentMessage) => void): () => void {
    if (!this.listeners.has(agentName)) {
      this.listeners.set(agentName, []);
    }
    this.listeners.get(agentName)!.push(handler);

    return () => {
      const agentListeners = this.listeners.get(agentName) || [];
      this.listeners.set(
        agentName,
        agentListeners.filter(l => l !== handler)
      );
    };
  }

  getMessagesForAgent(agentName: string): AgentMessage[] {
    return this.messages.filter(m => m.to === agentName || m.type === 'broadcast');
  }
}

export const globalMessageBus = new MessageBus();
```

**Tasks:**

- [ ] Implement message bus
- [ ] Build handoff manager
- [ ] Add broadcast support
- [ ] Create handoff audit trail
- [ ] Add message prioritization
- [ ] Integrate with swarm runner

---

#### 2.3 Security Layer (Basic)

**Goal:** Input validation, output filtering, and audit logging.

**Files to create/modify:**

```
src/
  lib/
    security/
      input-validator.ts        # Input sanitization
      output-filter.ts          # Output content filtering
      audit-logger.ts           # Security audit log
      rate-limiter.ts           # Per-user rate limiting
```

**Implementation Details:**

`security/input-validator.ts`:

```typescript
export class InputValidator {
  private static MAX_INPUT_LENGTH = 10000;
  private static DANGEROUS_PATTERNS = [
    /eval\s*\(/i,
    /exec\s*\(/i,
    /require\s*\(/i,
    /import\s+/i,
    /<script/i,
    /javascript:/i
  ];

  static validate(input: string): { valid: boolean; error?: string } {
    if (input.length > this.MAX_INPUT_LENGTH) {
      return { valid: false, error: `Input exceeds maximum length of ${this.MAX_INPUT_LENGTH}` };
    }

    for (const pattern of this.DANGEROUS_PATTERNS) {
      if (pattern.test(input)) {
        return { valid: false, error: 'Input contains potentially dangerous content' };
      }
    }

    return { valid: true };
  }

  static sanitize(input: string): string {
    return input
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;');
  }
}
```

`security/audit-logger.ts`:

```typescript
export interface AuditEntry {
  id: string;
  timestamp: number;
  userId?: string;
  agentName: string;
  action: string;
  details: Record<string, any>;
  riskLevel: 'low' | 'medium' | 'high';
}

export class AuditLogger {
  private logs: AuditEntry[] = [];
  private persistPath: string;

  constructor(persistPath: string = './data/audit-log.json') {
    this.persistPath = persistPath;
  }

  async log(entry: Omit<AuditEntry, 'id' | 'timestamp'>): Promise<void> {
    const fullEntry: AuditEntry = {
      ...entry,
      id: crypto.randomUUID(),
      timestamp: Date.now()
    };

    this.logs.push(fullEntry);

    // Keep last 10000 entries
    if (this.logs.length > 10000) {
      this.logs = this.logs.slice(-10000);
    }

    await this.persist();
  }

  async getLogs(options?: {
    agentName?: string;
    riskLevel?: string;
    limit?: number;
  }): Promise<AuditEntry[]> {
    let filtered = this.logs;

    if (options?.agentName) {
      filtered = filtered.filter(log => log.agentName === options.agentName);
    }

    if (options?.riskLevel) {
      filtered = filtered.filter(log => log.riskLevel === options.riskLevel);
    }

    if (options?.limit) {
      filtered = filtered.slice(-options.limit);
    }

    return filtered;
  }

  private async persist(): Promise<void> {
    const fs = await import('fs/promises');
    const path = await import('path');
    await fs.mkdir(path.dirname(this.persistPath), { recursive: true });
    await fs.writeFile(this.persistPath, JSON.stringify(this.logs, null, 2));
  }
}

export const globalAuditLogger = new AuditLogger();
```

**Tasks:**

- [ ] Implement input validator
- [ ] Build output filter
- [ ] Create audit logger
- [ ] Add per-user rate limiter
- [ ] Integrate validation into API route
- [ ] Add security middleware

---

### PHASE 3: UX Polish (Priority: High)

#### 3.1 Advanced UI Features

**Goal:** Enhanced user experience with real-time indicators and better UX.

**Files to create/modify:**

```
src/
  app/
    page.tsx                    # Update existing dashboard
  components/
    ui/
      typing-indicator.tsx      # Real-time typing animation
      agent-status.tsx          # Agent status badges
      trace-viewer.tsx          # Execution trace visualization
      cost-display.tsx          # Cost breakdown
      export-button.tsx         # Conversation export
    theme/
      theme-toggle.tsx          # Dark/light mode switch
```

**Implementation Details:**

`components/ui/typing-indicator.tsx`:

```typescript
'use client';

import { motion } from 'framer-motion';

export function TypingIndicator({ agentName }: { agentName: string }) {
  return (
    <div className="flex items-center gap-2 p-3 bg-gray-800 rounded-lg">
      <div className="flex gap-1">
        {[0, 1, 2].map(i => (
          <motion.div
            key={i}
            className="w-2 h-2 bg-cyan-400 rounded-full"
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.2 }}
          />
        ))}
      </div>
      <span className="text-sm text-gray-300">{agentName} is thinking...</span>
    </div>
  );
}
```

`components/ui/agent-status.tsx`:

```typescript
'use client';

import { Badge } from '@/components/ui/badge';

type AgentStatus = 'idle' | 'thinking' | 'executing' | 'handoff' | 'error';

const STATUS_CONFIG = {
  idle: { color: 'gray', label: 'Idle' },
  thinking: { color: 'blue', label: 'Thinking...' },
  executing: { color: 'yellow', label: 'Executing Tool' },
  handoff: { color: 'purple', label: 'Handing Off' },
  error: { color: 'red', label: 'Error' }
};

export function AgentStatusBadge({ status }: { status: AgentStatus }) {
  const config = STATUS_CONFIG[status];

  return (
    <Badge variant="outline" className={`border-${config.color}-500 text-${config.color}-400`}>
      {config.label}
    </Badge>
  );
}
```

**Tasks:**

- [ ] Add typing indicators per agent
- [ ] Implement agent status badges
- [ ] Build trace viewer component
- [ ] Add cost display breakdown
- [ ] Create conversation export (PDF/Markdown)
- [ ] Add theme toggle
- [ ] Implement keyboard shortcuts
- [ ] Make UI mobile responsive

---

#### 3.2 User Management

**Goal:** User authentication and session management.

**Files to create/modify:**

```
src/
  app/
    api/auth/[...nextauth]/route.ts  # Auth API
    login/page.tsx                   # Login page
  lib/
    auth/
      session-manager.ts             # Session handling
      user-store.ts                  # User preferences
  middleware.ts                      # Route protection
```

**Tasks:**

- [ ] Set up NextAuth.js or custom auth
- [ ] Create login/register pages
- [ ] Implement session management
- [ ] Add user preferences storage
- [ ] Build conversation history per user
- [ ] Add route protection middleware
- [ ] Create workspace/project organization

---

### PHASE 4: Scale (Priority: Medium)

#### 4.1 Performance Optimization

**Goal:** Response caching, streaming, and horizontal scaling.

**Files to create/modify:**

```
src/
  lib/
    cache/
      response-cache.ts          # LLM response caching
      cache-strategies.ts        # Cache invalidation
    stream/
      stream-handler.ts          # Streaming responses
    scaling/
      load-balancer.ts           # Load balancing logic
```

**Tasks:**

- [ ] Implement response caching (Redis or in-memory)
- [ ] Add LLM response streaming
- [ ] Build batch processing support
- [ ] Add horizontal scaling support
- [ ] Optimize database queries
- [ ] Add CDN for static assets

---

#### 4.2 Integration Points

**Goal:** External access via webhooks, APIs, and third-party services.

**Files to create/modify:**

```
src/
  app/
    api/webhook/route.ts         # Webhook endpoint
    api/agents/route.ts          # REST API for agents
  lib/
    integrations/
      webhook-handler.ts         # Webhook processing
      plugin-system.ts           # Plugin architecture
      slack-connector.ts         # Slack integration
      discord-connector.ts       # Discord integration
```

**Tasks:**

- [ ] Create webhook support
- [ ] Build REST API for external access
- [ ] Add WebSocket for real-time updates
- [ ] Implement plugin/extension system
- [ ] Create Slack connector
- [ ] Create Discord connector
- [ ] Add email integration

---

### PHASE 5: Intelligence (Future)

#### 5.1 AI Enhancements

**Files to create/modify:**

```
src/
  lib/
    ai/
      self-reflection.ts          # Agent self-evaluation
      prompt-optimizer.ts         # Dynamic prompt improvement
      consensus-voting.ts         # Multi-model consensus
      feedback-learner.ts         # Learn from user feedback
      agent-creator.ts            # Auto agent creation wizard
```

**Tasks:**

- [ ] Implement agent self-reflection
- [ ] Add dynamic prompt optimization
- [ ] Build multi-model consensus voting
- [ ] Create feedback learning system
- [ ] Build automated agent creation wizard

---

#### 5.2 Analytics & Insights

**Files to create/modify:**

```
src/
  app/
    analytics/page.tsx            # Analytics dashboard
  lib/
    analytics/
      usage-tracker.ts            # Usage statistics
      performance-analyzer.ts     # Performance insights
      trend-analyzer.ts           # Trend detection
```

**Tasks:**

- [ ] Build usage analytics dashboard
- [ ] Add agent performance comparison
- [ ] Create cost optimization suggestions
- [ ] Implement trend analysis
- [ ] Add report export (CSV, PDF)

---

## 🚀 Quick Start Implementation

### Step 1: Start with Phase 1.1 (Memory Management)

```bash
# Create directory structure
mkdir -p src/lib/memory src/lib/errors src/lib/observability

# Start with memory types
touch src/lib/memory/types.ts
touch src/lib/memory/memory-store.ts
touch src/lib/memory/context-builder.ts
```

### Step 2: Update swarm runner to use memory

```typescript
// In src/lib/swarm/runner.ts
import { FileMemoryStore } from '@/lib/memory/memory-store';
import { ContextBuilder } from '@/lib/memory/context-builder';

export async function runSwarm({
  startingAgent,
  agentMemories,
  contextVariables,
  memoryStore = new FileMemoryStore(),
  contextBuilder = new ContextBuilder()
}: SwarmConfig): Promise<SwarmResponse> {
  // Load relevant memories
  const relevantMemories = await memoryStore.search(userMessage, 5);

  // Build enhanced context
  const enhancedMessages = contextBuilder.buildContext(
    agentMemories[startingAgent.name] || [],
    relevantMemories
  );

  // Continue with existing swarm logic...
}
```

### Step 3: Add error handling

```typescript
// In src/lib/llm/openrouter.ts
import { retryWithBackoff } from '@/lib/errors/retry-handler';
import { CircuitBreaker } from '@/lib/errors/circuit-breaker';

const circuitBreaker = new CircuitBreaker();

export async function generateChatCompletion(messages: any[], options: any) {
  return retryWithBackoff(
    async () => {
      return circuitBreaker.execute(async () => {
        // Existing API call logic...
      });
    },
    { maxRetries: 3, baseDelay: 1000 }
  );
}
```

---

## 📊 Priority Matrix

```
Critical (Do First):
├── Memory & Context Management
├── Error Handling & Recovery
└── Basic Observability

High Priority:
├── Tool Ecosystem
├── Communication Protocol
├── Security Layer (Basic)
└── Advanced UI Features

Medium Priority:
├── Performance Optimization
├── Integration Points
└── User Management

Low Priority:
├── AI Enhancements
└── Advanced Analytics
```

---

## 🧪 Testing Strategy

### Unit Tests

```bash
# Test files to create
src/lib/memory/__tests__/memory-store.test.ts
src/lib/errors/__tests__/circuit-breaker.test.ts
src/lib/errors/__tests__/retry-handler.test.ts
src/lib/observability/__tests__/tracer.test.ts
src/lib/tools/__tests__/file-ops.test.ts
```

### Integration Tests

```bash
src/__tests__/swarm-runner.test.ts
src/__tests__/api-chat.test.ts
src/__tests__/memory-integration.test.ts
```

### E2E Tests

```bash
src/__tests__/e2e/multi-agent-flow.test.ts
src/__tests__/e2e/error-recovery.test.ts
src/__tests__/e2e/handoff.test.ts
```

---

## 📝 Development Guidelines

### Code Style

- Use TypeScript strict mode
- Follow existing project conventions
- Add JSDoc comments for public APIs
- Keep functions pure when possible
- Use dependency injection for testability

### Git Workflow

- Feature branches: `feature/description`
- Bug fixes: `fix/description`
- Commit messages: conventional commits format
- PR required for all changes
- Run tests before committing

### Performance Budget

- API response time: < 30s
- UI render time: < 100ms
- Memory usage: < 500MB
- Concurrent requests: 5 max

---

## 🔧 Configuration

### Environment Variables

```env
# OpenRouter API
OPENROUTER_API_KEY=your_key_here
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1

# Security
SAFE_DIR=/tmp/swarm-files
MAX_INPUT_LENGTH=10000
RATE_LIMIT_PER_MINUTE=60

# Memory
MEMORY_PERSIST_PATH=./data/memories.json
MAX_MEMORY_ENTRIES=10000

# Observability
ENABLE_TRACING=true
ENABLE_COST_TRACKING=true
METRICS_RETENTION_DAYS=30
```

---

## 📚 Resources

- OpenAI Swarm Pattern: <https://github.com/openai/swarm>
- OpenRouter API Docs: <https://openrouter.ai/docs>
- Next.js App Router: <https://nextjs.org/docs/app>
- p-queue Documentation: <https://github.com/sindresorhus/p-queue>

---

**Last Updated:** April 8, 2026
**Version:** 1.0.0
**Status:** Planning Phase
