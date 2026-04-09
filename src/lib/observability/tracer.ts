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
