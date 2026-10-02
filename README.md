# LineGuard

### Decentralized Starvation-Risk-Aware Coordination of Autonomous Mobile Robots for Automotive Assembly Logistics

> **Optimize the factory, not the robot.**

LineGuard is a **simulation prototype** of decentralized AMR coordination for automotive / EV assembly logistics. It predicts station starvation and assigns robots from **expected factory-wide production impact**, not nearest-robot greed.

This is software simulation only. It is not a physical robot, factory controller, LLM fleet, or reinforcement-learning system.

## Run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Live factory simulation runs in the browser. The same TypeScript engine is also exposed as a REST API at `/api` (Vite middleware).

Production-style Node server (serves `dist` + API):

```bash
npm run build
npm start
```

## Architecture

```
React dashboard  →  TypeScript simulation engine  →  Decision / bidding layer
                         ↑
              Express REST API (`/api`)
```

- **Frontend:** React, TypeScript, Vite, Tailwind CSS, Recharts, Lucide
- **Engine:** deterministic Mulberry32 seed, inventory, demand, congestion-aware ETA, risk-aware bids, leases, re-auction, rescue
- **API:** sessions, step, disruptions, baseline / ablation / scalability experiments

## What the engine does

1. Vehicle build sequence drives component consumption  
2. Uncertainty-aware stockout: `TTS_δ = I / (μ + z_δ · σ_eff)` with `σ_eff² = σ² + (κ · age)²`  
3. Slack = TTS − ETA − safety margin  
4. Feasibility gates: payload, energy (pickup + delivery + return + reserve), health  
5. Bid `B(a,i) = L(a,i) + λE·Energy + λC·Congestion + Φ(a,i)`  
6. Collateral risk `Φ` = extra loss if this AMR is not available for the next critical station  
7. Lease + heartbeat; failure → hot standby or re-auction; in-transit payload → rescue task  

## Application sections

Overview · Factory Simulation · Live Tasks · AMR Fleet · Station Risk · Decision Inspector · Event Timeline · Replay / What-If · Baseline Comparison · Experiments

## Experiments

Baselines (same seed and disruption schedule):

- LineGuard  
- Nearest AMR  
- FIFO  
- Static priority  
- Distance auction  

Ablations: full system vs without production impact, collateral risk, uncertainty, energy gate, or re-auction.

Fleet sizes: 10 / 25 / 50 / 100 AMRs.

## API

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/api/health` | Engine heartbeat |
| POST | `/api/simulations` | Create session `{ seed, policy, fleetCount }` |
| GET | `/api/simulations/:id` | Snapshot |
| POST | `/api/simulations/:id/step` | `{ dt, steps }` |
| POST | `/api/simulations/:id/disruptions` | `{ type }` |
| POST | `/api/experiments/baseline` | Policy matrix |
| POST | `/api/experiments/ablation` | Mechanism ablations |
| POST | `/api/experiments/scalability` | Fleet scaling |

Disruption types: `DEMAND_SURGE`, `AMR_FAILURE`, `COMM_DELAY`, `COMM_LOSS`, `COMM_RESTORE`, `AISLE_BLOCK`, `LOW_BATTERY`, `HEAVY_UNAVAILABLE`.
