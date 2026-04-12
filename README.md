# ⚡ CLIMAX (CORTISOLBOARD)

> **Tactical Command Center for Autonomous Financial Intelligence Swarms**

![Status](https://img.shields.io/badge/STATUS-OPERATIONAL-00e676?style=for-the-badge&logo=statuspage&logoColor=black)
![Agents](https://img.shields.io/badge/SWARM-6_NODES-ff3333?style=for-the-badge)
![Tech](https://img.shields.io/badge/STACK-NEXT_16_/_REACT_19-white?style=for-the-badge)

Climax is a professional-grade multi-agent orchestration platform designed for high-density financial data analysis, market reconnaissance, and autonomous task execution. Built with a brutalist "Tactical HUD" aesthetic, it transforms raw market telemetry into actionable intelligence through a coordinated swarm of specialized AI agents.

---

## 🕹️ The Swarm: Distributed Cognitive Architecture

The core of Climax is a sophisticated multi-agent system built on the **Cortisol Swarm Engine**. It leverages full-context transfer for handoffs and supports both synchronous and asynchronous worker execution.

### Specialized Agent Nodes

- **COORD (Coordinator)**: The Master Orchestrator. Disallows direct tool execution, forcing delegation to specialized workers. Manages parallel execution via `run_in_background`.
- **TRIAGE (Router)**: High-speed classification engine. Uses a `SmartRouter` to learn optimal routing patterns based on keyword success rates.
- **CODER (Engineer)**: Equipped with a 15-module toolset for software dev, file system operations, and automated CI/CD pipeline building.
- **MATH (Quant)**: The computational core. Performs high-fidelity financial modeling, backtesting, and statistical validation.
- **CYN (Cyberops)**: Operates in `bypass` permission mode. Focuses on siber-reconnaissance, network scanning, and anomaly detection.
- **ADSO (Archivist)**: Observer node. Manages `IndexedDB` persistence, semantic memory vectorization, and operational auditing.

---

## 📊 Intelligence HUD: Bloom Matrix

The dashboard is a high-density "Market Matrix" (6-panel grid) providing real-time visibility into global and local liquidity.

### 1. Market Matrix

- **IHSG Hero Panel**: specialized telemetry for the Jakarta Composite Index via local API proxy.
- **World Markets Grid**: Real-time tracking of S&P 500, NASDAQ, DAX, NIKKEI, and HSI.
- **Movers & Shakers**: Algorithmic detection of market outliers with unusual volume ratios.

### 2. Advanced Analysis Suite

- **Sector Heatmap & Rotation**: Real-time capital flow analysis across all 11 IDX sectors.
- **Risk Management**: VaR (Value at Risk 95/99), Sharpe Ratio calculation, and historical stress test scenarios (e.g., 2008 Crisis, pandemic crash).
- **Backtesting Engine**: Simulate RSI, MACD, and Bollinger strategies on historical IDX data.
- **3D Neural Topology**: Interactive `Three.js` visualization of the active agent network and data-packet flow.

---

## 🛠️ Infrastructure & Security

### Swarm Management

- **Plan Mode**: A dedicated "Safe Mode" that restricts all destructive tools. Requires user approval of a markdown-formatted plan before execution.
- **Context Bridging**: Automatic preservation of the last 10 messages during agent handoffs to prevent context loss.
- **Distributed Tracing**: Full `Tracer` integration providing waterfall views of tool calls and agent turns.

### Multi-LLM Resilience

- **Smart Rotation**: Automatic failover between OpenRouter (primary) and Groq (secondary).
- **Circuit Breaking**: Built-in 429 error handling and rate-limit optimization.

---

## 🗺️ Operational Roadmap

Current Status: **Core Framework Complete • Intelligence Modules Live**

- [x] **Phase 7: War Room Visualization** -- Multi-agent parallel coordination live.
- [x] **Phase 11: Telemetry Dashboard** -- Real-time charting for Swarm metrics.
- [x] **Phase 26: Memory Browser** -- Full-text search across agent memories.
- [x] **Phase 31: Advanced Delegation** -- Keyword-based `SmartRouter` learning.
- [x] **Phase 39: Distributed Tracing** -- Waterfall view for swarm operations.
- [x] **Phase 51: 3D Neural Topology** -- Interactive Three.js network view is operational.
- [ ] **Phase 55: Performance Heatmaps** -- Per-agent latency maps (Planned).

---

## 🚀 Deployment

```bash
git clone https://github.com/tony/climax.git
npm install
cp .env.example .env.local  # Inject OpenRouter & Fred API Keys
npm run dev
```

Dashboard available at `/board`, Swarm Command at `/swarm`.

---

## ⚖️ License

Private -- All rights reserved. Intellectual Property of the Swarm.
