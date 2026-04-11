# CortisolBoard

> Multi-agent AI swarm orchestration platform -- Command-center UI for autonomous agent teams

Built with Next.js 16, React 19, TypeScript, Three.js, and Framer Motion.

## Quick Start

```bash
npm install
cp .env.example .env.local   # Configure your API keys
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Documentation

| Document | Description |
|----------|-------------|
| [Setup Guide](./docs/setup.md) | Installation, configuration, deployment |
| [Architecture](./docs/architecture.md) | System design, components, data flow |
| [Roadmap](./docs/roadmap.md) | 50-phase development plan |
| [Implementation History](./docs/implementation-summary.md) | What's been built and when |

## Core Features

- **Swarm Intelligence** -- 6 specialized AI agents (Coordinator, Triage, Coder, Math, Cyn, Adso)
- **Multi-LLM Support** -- OpenRouter + Groq with automatic key rotation & failover
- **3D Neural Topology** -- Interactive Three.js agent network visualization
- **War Room Mode** -- Real-time multi-agent collaboration visualization
- **Activity Feed** -- Live operation logging with filtering & export
- **Memory Browser** -- Full-text search across agent memories
- **Cost Tracking** -- Per-model token cost estimation
- **Input Validation** -- XSS, SQL injection, command injection prevention
- **Distributed Tracing** -- Visual span timeline for debugging

## Tech Stack

- **Frontend:** Next.js 16 App Router, React 19, TypeScript
- **Styling:** Tailwind CSS 4, Framer Motion
- **3D:** Three.js, React Three Fiber, Drei
- **LLM:** OpenRouter API, Groq API
- **Auth:** JWT session management
- **Testing:** Vitest, Testing Library

## Project Structure

```
climax/
├── src/
│   ├── app/              # Next.js pages & API routes
│   ├── components/       # React UI components (30+)
│   ├── lib/              # Core business logic
│   │   ├── agents/       # Agent definitions
│   │   ├── swarm/        # Swarm orchestration
│   │   ├── llm/          # LLM API integration
│   │   ├── memory/       # Memory system
│   │   ├── tools/        # Agent tools (14+ modules)
│   │   ├── permissions/  # Permission system
│   │   ├── tasks/        # Task lifecycle management
│   │   ├── security/     # Validation & auditing
│   │   └── observability/# Tracing, metrics, cost tracking
│   └── test/             # Test configuration
├── docs/                 # Documentation
├── data/                 # Persistent data (JSON)
└── public/               # Static assets
```

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run test` | Run tests (watch mode) |
| `npm run test:run` | Run tests once |

## License

Private -- All rights reserved
