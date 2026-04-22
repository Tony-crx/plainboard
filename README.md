# CLIMAX (CortisolBoard)

> **Tactical Command Center for Autonomous Financial Intelligence Swarms**

![Status](https://img.shields.io/badge/STATUS-OPERATIONAL-00e676?style=for-the-badge&logo=statuspage&logoColor=black)
![Agents](https://img.shields.io/badge/SWARM-6_NODES-ff3333?style=for-the-badge)
![Tech](https://img.shields.io/badge/STACK-NEXT_16_/_REACT_19-white?style=for-the-badge)

---

## 👋 What is This?

CLIMAX is a multi-agent AI platform I built for analyzing financial markets and handling complex tasks autonomously. Think of it as a command center where specialized AI agents work together like a team—each with their own role, passing tasks between them when needed.

The interface has this brutalist "tactical HUD" vibe because, well, I wanted it to feel like you're actually monitoring a swarm of intelligent agents doing real work. No fluff, just dense information laid out cleanly.

---

## 🎯 The Agent Swarm

At the heart of this thing is what I call the **Cortisol Swarm Engine**. Instead of relying on a single AI trying to do everything, I've got six specialized agents that hand off tasks to each other:

| Agent | What It Does | Special Powers |
|-------|--------------|----------------|
| **COORD** (Coordinator) | Team lead. Doesn't touch tools directly, just orchestrates everyone else | Delegates tasks, runs parallel operations |
| **TRIAGE** (Router) | First point of contact. Figures out who should handle what | Smart routing based on learned patterns |
| **CODER** (Engineer) | Builds stuff, writes code, handles file ops | 15-module toolkit for dev work |
| **MATH** (Quant) | Number cruncher for financial modeling | Statistical validation, backtesting |
| **CYN** (Cyberops) | Security and recon specialist | Network scanning, anomaly detection (runs in bypass mode) |
| **ADSO** (Archivist) | Keeps track of everything | Manages memory, audit logs, IndexedDB storage |

### How They Talk to Each Other

When you give the system a task, TRIAGE usually gets it first and routes it to the right specialist. If that agent needs help, it can hand off to another agent with full context—no starting from scratch. The last 10 messages always travel with the handoff so nothing gets lost.

---

## 📊 The Dashboard

The main view is what I call the "Market Matrix"—a 6-panel grid showing real-time financial data:

### Market Tracking
- **IHSG Panel**: Jakarta Composite Index telemetry (pulled through a local proxy)
- **World Markets**: S&P 500, NASDAQ, DAX, NIKKEI, HSI tracking
- **Movers Detection**: Spots unusual volume spikes automatically

### Analysis Tools
- **Sector Heatmap**: Shows capital rotation across all 11 IDX sectors
- **Risk Metrics**: VaR calculations (95/99%), Sharpe ratios, stress testing
- **Strategy Backtester**: Test RSI, MACD, Bollinger Band strategies on historical data
- **3D Network View**: Interactive Three.js visualization of the agent swarm in action

---

## 🛠️ Tech Stack

**Frontend:**
- Next.js 16 with React 19
- Tailwind CSS 4
- Framer Motion for animations
- Three.js + React Three Fiber for 3D viz
- Lucide icons

**Backend/Core:**
- TypeScript throughout
- Zod for validation
- jose for JWT sessions
- P-queue for request management
- Vitest for testing

**AI/LLM:**
- OpenRouter (primary) with automatic key rotation
- Groq as fallback
- Built-in rate limit handling and circuit breakers

---

## 🚀 Getting It Running

### Prerequisites

You'll need:
- Node.js 20+ (really, don't bother with anything older)
- An OpenRouter API key (get one at [openrouter.ai](https://openrouter.ai/))
- Optionally, a Groq key for backup

### Quick Setup

```bash
# Clone and install
git clone https://github.com/tony/climax.git
cd climax
npm install

# Set up environment
cp .env.example .env.local
```

Now edit `.env.local` and add your keys:

```env
SESSION_SECRET=generate-one-with-openssl-rand-base64-32
OPENROUTER_KEYS=sk-or-your-actual-key-here
GROQ_KEYS=gsk-your-backup-key-here
LOGIN_PASSWORD=pick-something-decent
```

Then fire it up:

```bash
npm run dev
```

Head to `http://localhost:3000`, log in with whatever password you set, and you're in.

### Main Routes

- `/` - Main dashboard
- `/board` - Full tactical board view
- `/swarm` - Agent swarm control panel

---

## 🧪 Testing

I've got tests set up with Vitest:

```bash
# Run once
npm run test:run

# Watch mode for development
npm run test

# With coverage report
npm run test:coverage
```

---

## 📁 Project Structure

```
climax/
├── src/
│   ├── app/              # Next.js pages and API routes
│   │   ├── api/         # All the endpoints
│   │   ├── board/       # Tactical board page
│   │   ├── login/       # Auth page
│   │   └── swarm/       # Swarm control
│   ├── components/       # React components
│   ├── lib/              # Core logic (the important stuff)
│   │   ├── agents/      # Agent definitions
│   │   ├── swarm/       # Swarm orchestration
│   │   ├── llm/         # LLM API handling
│   │   ├── memory/      # Context persistence
│   │   ├── tools/       # Executable capabilities
│   │   ├── security/    # Input validation, auditing
│   │   └── observability/ # Tracing and metrics
│   └── hooks/           # Custom React hooks
├── data/                # JSON storage (memories, audit logs)
├── public/              # Static assets
└── docs/                # Extended documentation
```

---

## 🔐 Security Notes

A few things I've built in:

- **Plan Mode**: Destructive tools are locked behind a confirmation step. You'll see a markdown plan before anything actually runs.
- **Input Validation**: Everything gets checked for sketchy patterns (XSS, injection attempts, etc.)
- **Audit Logging**: Every operation gets logged to `data/audit-log.json`
- **Session-based Auth**: JWT cookies, nothing fancy but it works

---

## 🔄 Multi-LLM Setup

The system automatically rotates between API keys when it hits rate limits. If OpenRouter starts returning 429s, it switches to the next key in your list. If all OpenRouter keys are exhausted, it fails over to Groq.

You can add multiple keys by comma-separating them:

```env
OPENROUTER_KEYS=key1,key2,key3
GROQ_KEYS=key1,key2
```

---

## 📈 Current Status & Roadmap

**Done:**
- ✅ Core swarm framework
- ✅ All 6 agents operational
- ✅ Smart router with learning
- ✅ Distributed tracing (waterfall views)
- ✅ 3D network topology visualization
- ✅ Memory browser with full-text search
- ✅ Real-time telemetry dashboard

**In Progress / Planned:**
- ⏳ Performance heatmaps per agent
- ⏳ More sophisticated delegation patterns
- ⏳ Enhanced backtesting UI

Check `docs/roadmap.md` for the full 50-phase plan if you're curious where this is going.

---

## 📚 Documentation

If you want to dig deeper:

- [`docs/architecture.md`](docs/architecture.md) - System architecture deep dive
- [`docs/setup.md`](docs/setup.md) - Detailed setup guide with troubleshooting
- [`docs/roadmap.md`](docs/roadmap.md) - Development roadmap
- [`docs/implementation-summary.md`](docs/implementation-summary.md) - Build notes

---

## 🤝 Contributing

Found something broken or have an idea? 

1. Create a feature branch
2. Write tests (please, I'm tired)
3. Make sure `npm run lint` and `npm run test:run` pass
4. Open a PR

---

## ⚖️ License

MIT License — Copyright (c) 2026 Tony

Do what you want with it, just don't blame me if the swarm becomes self-aware.

---

## 💭 A Note From the Dev

This project started as a way to experiment with multi-agent systems for financial analysis, but it's turned into something more general-purpose. The agent architecture is solid enough that you could probably adapt it for other domains pretty easily.

If you're running into issues, check the troubleshooting section in `docs/setup.md` first. Most problems are either missing API keys or session config issues.

Hit me up if you have questions or build something cool with this.
