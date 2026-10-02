# 🚗 LineGuard

### Decentralized Starvation-Risk-Aware Coordination of Autonomous Mobile Robots for Automotive Assembly Logistics

> **"Optimize the factory, not the robot."**

LineGuard is a simulation-based decentralized coordination system for Autonomous Mobile Robots (AMRs) operating inside an automotive/EV assembly plant. Instead of greedily assigning the nearest robot to a delivery task, LineGuard continuously predicts station starvation, production impact, payload feasibility, battery reserves, aisle congestion, and collateral risk across the entire factory floor before awarding a delivery lease.

---

## 🎯 The Problem

Automotive and EV assembly plants operate under strict **Just-In-Time (JIT)** and **Just-In-Sequence (JIS)** material replenishment constraints. Line-side inventory buffers are kept minimal to reduce footprint. A delayed component delivery directly threatens assembly line uptime, incurring stoppage costs exceeding **$1,400 per halted line-minute**.

```
                           AUTOMOTIVE PLANT
                                  │
         ┌────────────────────────┼────────────────────────┐
         ↓                        ↓                        ↓
  Battery Assembly         Motor Assembly         Electronics Assembly
         ↑                        ↑                        ↑
         └────────────────────────┼────────────────────────┘
                                  ↑
                              AMR Fleet
                                  ↑
                           Central Warehouse
```

### The Nearest-Robot Trap

Suppose the **Battery Assembly Station** urgently requires a traction battery pack:
- **AMR-07** can deliver it in **41 seconds**.
- A conventional scheduler selects **AMR-07** because it is distance-optimal.
- However, **AMR-07** is the **only heavy-capable robot** near **Motor Assembly**, which is predicted to starve shortly.
- By assigning AMR-07 to Battery Assembly, Motor Assembly suffers a massive future production outage.

**LineGuard asks:**
> *"Which AMR assignment minimizes the expected production impact across the entire factory?"*

---

## 💡 Core Principles & Comparison

### Traditional Allocation vs. LineGuard

```
Traditional Approach:
  Task Announced → Find Nearest/Cheapest AMR → Assign Task (Local Greed)

LineGuard Approach:
  Task Announced
        ↓
  Predict Station Starvation Time (TTS)
        ↓
  Estimate Station Production Impact & Criticality
        ↓
  Check AMR Feasibility Gates (Payload, Energy Reserve, Health)
        ↓
  Calculate Route ETA + Congestion Delay + Energy Cost
        ↓
  Calculate Collateral Risk Φ (Downstream Opportunity Loss)
        ↓
  Compare Local AMR Bids (Lowest Factory-Wide Bid Wins)
        ↓
  Award Heartbeat Lease & Assign Backup Standby
```

| Feature | Traditional Approach | LineGuard System |
| :--- | :--- | :--- |
| **Allocation Objective** | Nearest robot / Lowest travel distance | Factory-wide production impact minimization |
| **Urgency Model** | Static deadlines or FIFO queues | Dynamic uncertainty-aware stockout prediction ($TTS_\delta$) |
| **Robot Capability** | Homogeneous assumption | Heterogeneous payload (HEAVY/LIGHT), battery, speed |
| **Cost Function** | Travel time / Distance cost | Lateness loss + Energy + Congestion + Collateral Risk ($\Phi$) |
| **Fault Tolerance** | Re-queue after timeout | Decentralized $16\text{s}$ heartbeat lease + Hot standby + Rescue pickup |
| **Corridor Dynamics** | Static speed assumption | Dynamic aisle congestion flow & corridor blocking |
| **Explainability** | Black-box / distance order | Auditable trace, counterfactuals ("Why AMR-09? Why not AMR-07?") |
| **Research Baseline** | N/A | Deterministic seed head-to-head vs 4 baselines & 5 ablations |

---

## 📐 Mathematical Models & Algorithmic Mechanics

### 1. Dynamic Material Consumption & Vehicle Build Sequence
Production demand is driven by the dynamic build sequence of vehicle variants (EV Sedan, EV SUV, Hybrid, EV Truck):
$$\mu(t) = \sum_{v \in \text{Sequence}} \text{DrawRate}(v, \text{Component})$$

### 2. Uncertainty-Aware Stockout Prediction ($TTS_\delta$)
LineGuard estimates how long a station can continue operating with its current inventory buffer $I$:
$$TTS_\delta = \frac{I}{\mu + z_\delta \cdot \sigma_{\text{eff}}}$$

To account for delayed sensor updates or wireless communication degradation, information age increases demand variance:
$$\sigma_{\text{eff}}^2 = \sigma^2 + (\kappa \cdot \text{InformationAge})^2$$

### 3. Starvation Slack ($\text{Slack}$)
For every delivery task, LineGuard compares predicted stockout time against AMR arrival:
$$\text{Slack} = TTS_\delta - \text{ETA} - \text{SafetyMargin} \quad (\text{SafetyMargin} = 10\text{s})$$
- **Positive Slack ($\text{Slack} \ge 0$)**: AMR arrives before stockout.
- **Negative Slack ($\text{Slack} < 0$)**: Station will starve prior to arrival.

### 4. Feasibility Gates
Before an AMR can enter a bid, it must pass 4 non-negotiable gates:
1. **Payload Capability**: Heavy components (Traction Battery / Motor) require `HEAVY` payload capacity (550kg).
2. **Energy Gate**: $\text{Battery\%} \ge \text{Pickup\%} + \text{Delivery\%} + \text{ReturnToCharger\%} + 10\%\text{ Reserve}$.
3. **Hardware Health**: AMR health state must be `HEALTHY` (not `FAILED`).
4. **Availability**: AMR must be `IDLE` or `RETURNING_TO_BASE` (not committed to an active contract).

### 5. Risk-Aware Bidding Formula
For candidate AMR $a$ and task $i$:
$$B(a,i) = L(a,i) + \lambda_E \cdot \text{EnergyCost} + \lambda_C \cdot \text{CongestionDelay} + \Phi(a,i)$$

Where:
- **Lateness Loss $L(a,i)$**: $w_{\text{station}} \cdot \max(0, -\text{Slack})$
- **Energy Cost**: Required battery expenditure $\times \lambda_E$ ($\lambda_E = 0.05$)
- **Congestion Delay**: Total route corridor slowdown $\times \lambda_C$ ($\lambda_C = 0.08$)
- **Collateral Risk $\Phi(a,i)$**: Downstream opportunity cost:
$$\Phi(a,i) = \sum_{j \neq i} \max\left( L(\text{next\_best\_AMR}, j) - L(a, j), 0 \right)$$

---

## 🛡️ Dynamic Resiliency & Recovery

```
                             AMR DISPATCHED
                                   │
                                   ↓
                         16s Heartbeat Lease
                                   │
                    ┌──────────────┴──────────────┐
                    ↓                             ↓
          Heartbeat Received               Heartbeat Missed
                    │                             │
                    ↓                             ↓
            Delivery Complete               Lease Expired
                    │                             │
                    ↓                             ↓
             Station Restocked            Task Re-auctioned
                                                  │
                                   ┌──────────────┴──────────────┐
                                   ↓                             ↓
                             Rescue Pickup               Hot Standby Activated
                        (Payload left in aisle)        (Backup AMR takes over)
```

1. **Heartbeat Leases**: Assignments issue a temporary $16\text{s}$ lease. AMRs transmit periodic heartbeats. Missing a heartbeat expires the lease.
2. **Hot Standby**: Critical tasks (Battery / Motor) automatically reserve the second-best candidate AMR as an active backup.
3. **Rescue Pickups**: If an AMR suffers a hardware failure while transporting cargo, the component remains in the aisle and a high-priority `RESCUE` task is broadcast.

---

## 🖥️ Application Sections (10 Dashboard Views)

LineGuard features a 10-tab industrial cockpit:

1. **Overview Dashboard**: Real-time KPI grid, 2D interactive digital twin canvas, live build sequence feed, and metrics charts.
2. **Factory Simulation**: Dedicated high-resolution 2D factory floor map with aisle flow vectors, corridor congestion indicators, and AMR telemetry overlays.
3. **Live Tasks**: Active delivery queue, auction status, assigned leases, and task lifecycle tracking.
4. **AMR Fleet**: Comprehensive fleet manager displaying telemetry, payload capability, battery percentage, state history, and manual fault triggers.
5. **Station Risk Matrix**: Real-time stockout forecast ($TTS$), starvation probability, criticality rating, and line stoppage impact.
6. **Decision Inspector**: Explainable decision modal displaying complete bid matrices, counterfactual analysis ("Why AMR-09 over AMR-07?"), and trade-off summaries.
7. **Event Timeline**: Chronological auditable log of all factory events, auction announcements, bids, leases, and disruption triggers.
8. **Replay & What-If Mode**: Deterministic simulation replay controls (Play, Pause, 2x, 4x, Restart) and disruption injection buttons (*Demand Surge*, *AMR Failure*, *Comm Delay*, *Aisle Blocked*, *Low Battery*).
9. **Baseline Comparison**: Head-to-head empirical evaluation against 4 industrial baselines under identical seeds.
10. **Experiments & Ablations**: Component ablation study and high-density fleet scalability benchmarks ($10 \rightarrow 100$ AMRs).

---

## 🧪 Research Experiments & Benchmarks

### 1. Baseline Comparison (Identical Seed & Schedule)
Runs the simulation engine under 5 allocation policies:
- **LineGuard** (Production-aware, Collateral-risk auction)
- **Nearest AMR** (Greedy distance heuristic)
- **FIFO** (First-in, first-out task queue)
- **Static Priority** (Fixed station criticality without stockout forecasting)
- **Distance Auction** (Auction based purely on travel ETA)

### 2. Component Ablation Study
Deconstructs LineGuard to isolate the impact of individual mechanisms:
- Full LineGuard
- Without Production Impact ($w_{\text{station}} = 1.0$)
- Without Collateral Risk ($\Phi = 0$)
- Without Uncertainty Model ($z_\delta = 0$)
- Without Energy Gate (Bypasses battery reserve check)
- Without Dynamic Re-auction (No heartbeat lease recovery)

### 3. Fleet Scalability
Evaluates decision latency and throughput across fleet densities of **10, 25, 50, and 100 AMRs**, confirming real-time edge performance ($< 2.5\text{ms}$ step latency at 100 AMRs).

---

## 📡 REST API Reference (`server/`)

LineGuard includes a full Express REST API for headless simulation execution, session management, and server-side research benchmarking:

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Service health status and active session count |
| `POST` | `/api/simulations` | Create a new simulation session `{ seed, policy, fleetCount }` |
| `GET` | `/api/simulations/:id` | Fetch complete state snapshot for session `:id` |
| `POST` | `/api/simulations/:id/step` | Step simulation forward by `dt` seconds (`{ dt, steps }`) |
| `POST` | `/api/simulations/:id/reset` | Reset simulation state to time $T=0$ |
| `POST` | `/api/simulations/:id/disruptions` | Inject disruption (`DEMAND_SURGE`, `COMM_LOSS`, `AISLE_BLOCK`, etc.) |
| `POST` | `/api/simulations/:id/amrs/:amrId/fail` | Trigger hardware failure for specified AMR |
| `POST` | `/api/simulations/:id/amrs/:amrId/recover` | Recover failed AMR to nominal operation |
| `POST` | `/api/experiments/baseline` | Run head-to-head baseline benchmark |
| `POST` | `/api/experiments/ablation` | Run component ablation study |
| `POST` | `/api/experiments/scalability` | Run fleet scaling benchmark |

---

## 🛠️ Technology Stack

- **Frontend**: React 19, TypeScript 5.7+, Vite 8, Tailwind CSS v4, Motion, Recharts, Lucide Icons
- **Backend**: Node.js, Express 4, tsx
- **Simulation Engine**: Custom deterministic TypeScript engine with Mulberry32 PRNG seed control

---

## ⚙️ Installation & Usage

### Prerequisites
- Node.js (v18+ recommended)
- npm

### 1. Installation
```bash
# Clone repository
git clone https://github.com/user/lineguard-amr.git
cd lineguard-amr/lineguard-amr-main

# Install dependencies
npm install --legacy-peer-deps
```

### 2. Run Development Server (Vite Frontend + REST API Middleware)
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 3. Run Production Node/Express Server
```bash
# Build production bundle
npm run build

# Start Express server on port 4000
npm run start
```
Access the application at [http://localhost:4000](http://localhost:4000).

---

## 📜 License

This project is open-source and licensed under the [Apache-2.0 License](LICENSE).
