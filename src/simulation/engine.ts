import {
  AMR,
  Station,
  Task,
  Aisle,
  Charger,
  BuildSequenceItem,
  SimEvent,
  FactoryMetrics,
  AllocationPolicy,
  Position,
  DecisionTrace,
  LineGuardMechanisms,
  MetricsSnapshot,
} from '../models/types';
import { SeededRNG } from './rng';
import {
  INITIAL_STATIONS,
  INITIAL_AISLES,
  CHARGERS,
  WAREHOUSE,
  estimateTravelTimeSec,
} from './factoryLayout';
import { COMPONENTS, VEHICLE_VARIANTS, generateInitialBuildSequence } from './vehicles';
import { calculateStockoutMetrics, calculateSlack, SAFETY_MARGIN_SEC, expectedProductionLossMinutes } from './prediction';
import { evaluateCandidateBids, productionWeight } from './biddingEngine';
import { FULL_LINEGUARD } from './mechanisms';

export interface SimulationState {
  runId: string;
  seed: number;
  simTimeSec: number;
  policy: AllocationPolicy;
  mechanisms: LineGuardMechanisms;
  amrs: AMR[];
  stations: Station[];
  aisles: Aisle[];
  chargers: Charger[];
  tasks: Task[];
  buildSequence: BuildSequenceItem[];
  events: SimEvent[];
  recentDecisions: DecisionTrace[];
  metrics: FactoryMetrics;
  globalStateVersion: number;
  commStatus: 'NORMAL' | 'DELAYED' | 'LOSS';
  nextTaskId: number;
  nextEventId: number;
  warehouseStock: Record<string, number>;
  recoveryDurations: number[];
  pendingFailures: { amrId: string; failedAt: number }[];
  metricsHistory: MetricsSnapshot[];
  disruptionsActive: {
    demandSurge: boolean;
    commDegraded: boolean;
    aisleBlockedId?: string;
    fleetLowBattery: boolean;
  };
}

function cloneState<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

function pushEvent(state: SimulationState, event: Omit<SimEvent, 'id'>): void {
  const full: SimEvent = { ...event, id: `EVT-${state.nextEventId++}` };
  state.events = [full, ...state.events].slice(0, 160);
}

export function createInitialFleet(seed: number = 82731, count: number = 10): AMR[] {
  const rng = new SeededRNG(seed);
  const amrs: AMR[] = [];
  const heavyIds = new Set(['AMR-03', 'AMR-07', 'AMR-09']);

  for (let i = 1; i <= count; i++) {
    const id = `AMR-${i.toString().padStart(2, '0')}`;
    const isHeavy = heavyIds.has(id) || (count > 10 && i % 3 === 0);
    const initialBattery = id === 'AMR-06' ? 39 : id === 'AMR-07' ? 91 : id === 'AMR-09' ? 84 : rng.nextInt(72, 95);
    const posX = 150 + ((i * 75) % 700);
    const posY = (i % 2 === 0 ? 180 : 320) + rng.nextInt(-20, 20);

    amrs.push({
      id,
      name: `Autonomous Transporter ${id}`,
      payloadCapability: isHeavy ? 'HEAVY' : 'LIGHT',
      maxPayloadKg: isHeavy ? 550 : 120,
      speedMps: isHeavy ? 2.1 : 2.6,
      position: { x: posX, y: posY },
      batteryPct: initialBattery,
      state: initialBattery < 40 ? 'CHARGING' : 'IDLE',
      health: 'HEALTHY',
      commStatus: 'NORMAL',
      stateVersion: 100,
      lastHeartbeatTime: 0,
      totalDistanceTraveled: 0,
      completedTasksCount: 0,
    });
  }

  return amrs;
}

export function createInitialSimulationState(
  seed: number = 82731,
  policy: AllocationPolicy = 'LINEGUARD',
  fleetCount: number = 10,
  mechanisms: LineGuardMechanisms = FULL_LINEGUARD
): SimulationState {
  const stations: Station[] = cloneState(INITIAL_STATIONS);
  const aisles: Aisle[] = cloneState(INITIAL_AISLES);
  const amrs = createInitialFleet(seed, fleetCount);
  const buildSequence = generateInitialBuildSequence(seed, 25);
  const warehouseStock: Record<string, number> = {};
  for (const [id, comp] of Object.entries(COMPONENTS)) {
    warehouseStock[id] = comp.warehouseStock;
  }

  const initialMetrics: FactoryMetrics = {
    simTimeSec: 0,
    activeAmrsCount: 0,
    idleAmrsCount: amrs.length,
    failedAmrsCount: 0,
    criticalDeliveriesCount: 0,
    stationsAtRiskCount: 0,
    totalStarvationEvents: 0,
    totalStarvationDurationSec: 0,
    completedDeliveriesCount: 0,
    onTimeDeliveryRatePct: 100,
    productionLossAvoidedMinutes: 0,
    averageRecoveryTimeSec: 0,
    fleetAverageBatteryPct: Math.round(amrs.reduce((sum, a) => sum + a.batteryPct, 0) / amrs.length),
    totalEnergyConsumedPct: 0,
    congestionDelaysSec: 0,
    messagesExchangedCount: 42,
    productionLossMinutes: 0,
    decisionLatencyMs: 0,
    averageDeliveryDelaySec: 0,
  };

  return {
    runId: `RUN-${seed.toString().slice(-4)}`,
    seed,
    simTimeSec: 0,
    policy,
    mechanisms: { ...mechanisms },
    amrs,
    stations,
    aisles,
    chargers: cloneState(CHARGERS),
    tasks: [],
    buildSequence,
    events: [
      {
        id: 'EVT-INIT',
        timestampSec: 0,
        type: 'RISK_CHANGED',
        severity: 'INFO',
        title: 'Simulation Initialized',
        description: `LineGuard engine initialized with ${fleetCount} AMRs, ${stations.length} stations, policy [${policy}].`,
      },
    ],
    recentDecisions: [],
    metrics: initialMetrics,
    globalStateVersion: 101,
    commStatus: 'NORMAL',
    nextTaskId: 1040,
    nextEventId: 1,
    warehouseStock,
    recoveryDurations: [],
    pendingFailures: [],
    metricsHistory: [{ t: 0, starvationEvents: 0, starvationDurationSec: 0, productionLossMinutes: 0, onTimePct: 100, energyConsumedPct: 0 }],
    disruptionsActive: {
      demandSurge: false,
      commDegraded: false,
      fleetLowBattery: false,
    },
  };
}

function awardTask(state: SimulationState, task: Task, selectedAmrId: string, decisionTrace?: DecisionTrace, isReauction = false): void {
  const currentSimTime = state.simTimeSec;
  task.status = 'ASSIGNED';
  task.assignedAmrId = selectedAmrId;
  task.decisionTrace = decisionTrace;
  if (decisionTrace) {
    decisionTrace.timestampSec = currentSimTime;
    decisionTrace.taskId = task.id;
    state.recentDecisions = [decisionTrace, ...state.recentDecisions.slice(0, 24)];
  }
  task.lease = {
    taskId: task.id,
    amrId: selectedAmrId,
    leaseDurationSec: 16,
    assignedSimTime: currentSimTime,
    expiresAtSimTime: currentSimTime + 16,
  };

  const station = state.stations.find((s) => s.id === task.stationId);
  if (station && station.criticality >= 0.8 && task.bids.length > 1 && state.mechanisms.useReauction) {
    const standbyCandidate = task.bids
      .filter((c) => c.eligible && c.amrId !== selectedAmrId)
      .sort((a, b) => a.totalScore - b.totalScore)[0];
    if (standbyCandidate) {
      task.standbyAmrId = standbyCandidate.amrId;
      const standbyAmr = state.amrs.find((a) => a.id === standbyCandidate.amrId);
      if (standbyAmr) standbyAmr.standbyForTaskId = task.id;
      pushEvent(state, {
        timestampSec: currentSimTime,
        type: 'STANDBY_ASSIGNED',
        taskId: task.id,
        amrId: standbyCandidate.amrId,
        severity: 'INFO',
        title: `Hot Standby Assigned: ${standbyCandidate.amrId}`,
        description: `Critical task ${task.id} protected by standby AMR ${standbyCandidate.amrId}.`,
      });
    }
  }

  const assignedAmr = state.amrs.find((a) => a.id === selectedAmrId);
  if (assignedAmr) {
    assignedAmr.state = 'MOVING_TO_PICKUP';
    assignedAmr.currentTaskId = task.id;
    assignedAmr.targetPosition = task.isRescue && task.rescuePayloadLocation ? task.rescuePayloadLocation : WAREHOUSE.position;
    assignedAmr.lastHeartbeatTime = currentSimTime;
  }

  pushEvent(state, {
    timestampSec: currentSimTime,
    type: isReauction ? 'RE_AUCTION' : 'AMR_SELECTED',
    taskId: task.id,
    amrId: selectedAmrId,
    severity: 'SUCCESS',
    title: isReauction ? `Re-Auction Successful: ${selectedAmrId}` : `Contract Awarded: ${selectedAmrId}`,
    description: `Assigned to ${selectedAmrId}. ${decisionTrace?.explanation || ''}`,
  });
  pushEvent(state, {
    timestampSec: currentSimTime,
    type: 'LEASE_CREATED',
    taskId: task.id,
    amrId: selectedAmrId,
    severity: 'INFO',
    title: `Lease created: ${task.id}`,
    description: `${selectedAmrId} holds a 16s heartbeat lease on ${task.id}. Missed heartbeats expire the contract.`,
  });
}

function runAuction(state: SimulationState, task: Task, isReauction = false, logBids = true): boolean {
  const station = state.stations.find((s) => s.id === task.stationId);
  if (!station) return false;

  const auctionResult = evaluateCandidateBids(
    task,
    station,
    state.stations,
    state.amrs,
    state.aisles,
    state.policy,
    state.mechanisms
  );

  task.bids = auctionResult.candidates;
  state.metrics.decisionLatencyMs = auctionResult.decisionLatencyMs;
  state.metrics.messagesExchangedCount += state.amrs.length * 2;

  if (logBids) {
    for (const bid of auctionResult.candidates.filter((c) => c.eligible).slice(0, 6)) {
      pushEvent(state, {
        timestampSec: state.simTimeSec,
        type: 'BID_SUBMITTED',
        taskId: task.id,
        amrId: bid.amrId,
        severity: 'INFO',
        title: `Bid submitted: ${bid.amrId}`,
        description: `${bid.amrId} bid score ${bid.totalScore} (ETA ${bid.etaSec}s, Φ ${bid.collateralRisk}).`,
      });
    }
  }

  if (auctionResult.selectedAmrId) {
    awardTask(state, task, auctionResult.selectedAmrId, auctionResult.decisionTrace, isReauction);
    return true;
  }

  task.status = 'PENDING_AUCTION';
  if (logBids) {
    pushEvent(state, {
      timestampSec: state.simTimeSec,
      type: 'TRIAGE_ENACTED',
      taskId: task.id,
      stationId: station.id,
      severity: 'CRITICAL',
      title: `TRIAGE: No Feasible AMR for ${station.name}`,
      description: auctionResult.decisionTrace?.triageMessage || `All AMRs failed payload or battery gates at ${station.name}.`,
    });
    if (auctionResult.decisionTrace) {
      auctionResult.decisionTrace.timestampSec = state.simTimeSec;
      state.recentDecisions = [auctionResult.decisionTrace, ...state.recentDecisions.slice(0, 24)];
    }
  }
  return false;
}

function createDeliveryTask(state: SimulationState, station: Station): Task {
  const task: Task = {
    id: `TASK-${state.nextTaskId++}`,
    stationId: station.id,
    componentId: station.componentRequired,
    quantity: station.payloadRequirement === 'HEAVY' ? 4 : 8,
    payloadRequirement: station.payloadRequirement,
    isRescue: false,
    creationTimeSec: state.simTimeSec,
    urgencyLevel: station.criticality >= 0.9 ? 'CRITICAL' : station.criticality >= 0.7 ? 'HIGH' : 'MEDIUM',
    status: 'PENDING_AUCTION',
    bids: [],
    deadlineSimTime: state.simTimeSec + station.predictedStockoutSec,
  };
  pushEvent(state, {
    timestampSec: state.simTimeSec,
    type: 'TASK_ANNOUNCED',
    taskId: task.id,
    stationId: station.id,
    severity: station.criticality >= 0.9 ? 'WARNING' : 'INFO',
    title: `Task Announced: ${task.id}`,
    description: `Material call for ${station.name} (${station.componentName}). Predicted stockout: ${Math.round(station.predictedStockoutSec)}s.`,
  });
  state.tasks.push(task);
  return task;
}

export function failAmrById(state: SimulationState, amrId: string): SimulationState {
  const next = cloneState(state);
  const targetAmr = next.amrs.find((a) => a.id === amrId);
  if (!targetAmr || targetAmr.health === 'FAILED') return next;
  applyAmrFailure(next, targetAmr);
  return next;
}

export function recoverAmrById(state: SimulationState, amrId: string): SimulationState {
  const next = cloneState(state);
  const amr = next.amrs.find((a) => a.id === amrId);
  if (!amr) return next;
  amr.health = 'HEALTHY';
  amr.state = amr.batteryPct < 25 ? 'CHARGING' : 'IDLE';
  amr.currentTaskId = undefined;
  amr.standbyForTaskId = undefined;
  amr.carryingComponentId = undefined;
  amr.targetPosition = undefined;
  pushEvent(next, {
    timestampSec: next.simTimeSec,
    type: 'RISK_CHANGED',
    amrId,
    severity: 'SUCCESS',
    title: `AMR Recovered: ${amrId}`,
    description: `${amrId} cleared e-stop and returned to the eligible fleet.`,
  });
  return next;
}

function applyAmrFailure(state: SimulationState, targetAmr: AMR): void {
  const currentSimTime = state.simTimeSec;
  targetAmr.health = 'FAILED';
  targetAmr.state = 'FAILED';
  state.pendingFailures.push({ amrId: targetAmr.id, failedAt: currentSimTime });

  if (targetAmr.carryingComponentId) {
    const originalTask = state.tasks.find((t) => t.id === targetAmr.currentTaskId);
    const station = state.stations.find((s) => s.id === (originalTask?.stationId || 'ST-BAT')) || state.stations[0];
    const healthy = state.amrs.filter((a) => a.health === 'HEALTHY' && a.id !== targetAmr.id);
    const sample = healthy[0] || targetAmr;
    const rescueEta = estimateTravelTimeSec(sample.position, targetAmr.position, sample.speedMps, state.aisles).timeSec
      + estimateTravelTimeSec(targetAmr.position, station.position, sample.speedMps, state.aisles).timeSec;
    const warehouseEta = estimateTravelTimeSec(sample.position, WAREHOUSE.position, sample.speedMps, state.aisles).timeSec
      + estimateTravelTimeSec(WAREHOUSE.position, station.position, sample.speedMps, state.aisles).timeSec;
    const preferRescue = rescueEta <= warehouseEta + 8;

    if (originalTask && originalTask.status !== 'DELIVERED') {
      originalTask.status = 'CANCELLED';
      originalTask.assignedAmrId = undefined;
      originalTask.lease = undefined;
      if (originalTask.standbyAmrId) {
        const sb = state.amrs.find((a) => a.id === originalTask.standbyAmrId);
        if (sb) sb.standbyForTaskId = undefined;
      }
    }

    const rescueTask: Task = {
      id: preferRescue ? `TASK-RESCUE-${state.nextTaskId++}` : `TASK-${state.nextTaskId++}`,
      stationId: originalTask?.stationId || 'ST-BAT',
      componentId: targetAmr.carryingComponentId,
      quantity: originalTask?.quantity || 4,
      payloadRequirement: originalTask?.payloadRequirement || 'HEAVY',
      isRescue: preferRescue,
      rescuePayloadLocation: preferRescue ? { ...targetAmr.position } : undefined,
      originalFailedAmrId: targetAmr.id,
      creationTimeSec: currentSimTime,
      urgencyLevel: 'CRITICAL',
      status: 'PENDING_AUCTION',
      bids: [],
      deadlineSimTime: currentSimTime + 65,
    };
    state.tasks.push(rescueTask);
    pushEvent(state, {
      timestampSec: currentSimTime,
      type: 'RESCUE_TASK_CREATED',
      amrId: targetAmr.id,
      taskId: rescueTask.id,
      severity: 'CRITICAL',
      title: preferRescue ? `CARGO STRANDED: Rescue Task ${rescueTask.id}` : `Warehouse restock chosen over rescue`,
      description: preferRescue
        ? `${targetAmr.id} failed at (${Math.round(targetAmr.position.x)}, ${Math.round(targetAmr.position.y)}) while hauling ${COMPONENTS[targetAmr.carryingComponentId]?.name || 'cargo'}. Rescue ETA ${rescueEta.toFixed(0)}s beats warehouse ${warehouseEta.toFixed(0)}s.`
        : `${targetAmr.id} failed in transit. Warehouse restock (ETA ${warehouseEta.toFixed(0)}s) has lower expected production impact than corridor rescue (${rescueEta.toFixed(0)}s).`,
    });
    if (state.mechanisms.useReauction) {
      runAuction(state, rescueTask, true);
    }
  } else {
    const held = state.tasks.find((t) => t.id === targetAmr.currentTaskId && t.status !== 'DELIVERED');
    if (held) {
      held.status = 'PENDING_AUCTION';
      held.assignedAmrId = undefined;
      held.lease = undefined;
    }
    pushEvent(state, {
      timestampSec: currentSimTime,
      type: 'AMR_FAILED',
      amrId: targetAmr.id,
      severity: 'CRITICAL',
      title: `HARDWARE FAILURE: ${targetAmr.id}`,
      description: `${targetAmr.id} experienced emergency e-stop. Removed from active fleet.`,
    });
  }

  targetAmr.currentTaskId = undefined;
  targetAmr.standbyForTaskId = undefined;
  targetAmr.carryingComponentId = undefined;
  targetAmr.targetPosition = undefined;
}

function nearestCharger(amr: AMR, chargers: Charger[]): Charger {
  return [...chargers].sort((a, b) => {
    const da = Math.abs(a.position.x - amr.position.x) + Math.abs(a.position.y - amr.position.y);
    const db = Math.abs(b.position.x - amr.position.x) + Math.abs(b.position.y - amr.position.y);
    return da - db;
  })[0];
}

export function stepSimulation(state: SimulationState, dt: number = 1.0): SimulationState {
  const next = cloneState(state);
  next.simTimeSec = Math.round((next.simTimeSec + dt) * 10) / 10;
  next.globalStateVersion += 1;
  const currentSimTime = next.simTimeSec;

  const currentVehicleIndex = Math.min(
    next.buildSequence.length - 1,
    Math.floor(currentSimTime / 45)
  );
  next.buildSequence = next.buildSequence.map((item, idx) => ({
    ...item,
    status: idx < currentVehicleIndex ? 'COMPLETED' : idx === currentVehicleIndex ? 'IN_PRODUCTION' : 'PENDING',
  }));
  const activeVehicle = next.buildSequence[currentVehicleIndex];
  const variant = VEHICLE_VARIANTS.find((v) => v.id === activeVehicle.vehicleVariantId) || VEHICLE_VARIANTS[0];

  let stationsAtRisk = 0;
  next.stations = next.stations.map((st) => {
    const station = { ...st };
    const mult = (variant.multiplier[station.componentRequired] || 1.0) * (next.disruptionsActive.demandSurge ? 1.8 : 1.0);
    station.consumptionRate = Math.round(station.nominalRate * mult * 1000) / 1000;
    station.currentInventory = Math.max(0, station.currentInventory - station.consumptionRate * dt);

    if (next.commStatus === 'DELAYED') {
      station.stalenessAgeSec = Math.min(25, station.stalenessAgeSec + dt);
    } else if (next.commStatus === 'LOSS') {
      station.stalenessAgeSec = Math.min(60, station.stalenessAgeSec + dt * 1.5);
    } else {
      station.stalenessAgeSec = Math.max(0.5, station.stalenessAgeSec * 0.85);
    }

    const { predictedStockoutSec, starvationProb } = calculateStockoutMetrics(station, next.mechanisms);
    const prevRisk = station.starvationProbability;
    station.predictedStockoutSec = predictedStockoutSec;
    station.starvationProbability = starvationProb;
    station.expectedProductionLossMin = expectedProductionLossMinutes(station, next.mechanisms);

    if (starvationProb >= 0.5 && prevRisk < 0.5) {
      pushEvent(next, {
        timestampSec: currentSimTime,
        type: 'RISK_CHANGED',
        stationId: station.id,
        severity: 'WARNING',
        title: `${station.name} risk increased to HIGH`,
        description: `Predicted stockout ${Math.round(predictedStockoutSec)}s · starvation probability ${Math.round(starvationProb * 100)}% · expected loss ${station.expectedProductionLossMin} min.`,
      });
    }

    if (station.currentInventory <= 0.01) {
      if (!station.isStarved) {
        station.isStarved = true;
        next.metrics.totalStarvationEvents += 1;
        pushEvent(next, {
          timestampSec: currentSimTime,
          type: 'RISK_CHANGED',
          stationId: station.id,
          severity: 'CRITICAL',
          title: `STARVATION EVENT: ${station.name}`,
          description: `Line starved! Zero stock of ${station.componentName}. Production halted.`,
        });
      }
      station.starvationDurationSec += dt;
      next.metrics.totalStarvationDurationSec += dt;
      next.metrics.productionLossMinutes =
        Math.round((next.metrics.productionLossMinutes + (station.criticality * dt) / 60) * 100) / 100;
    } else {
      station.isStarved = false;
    }

    if (station.predictedStockoutSec < 60) stationsAtRisk++;
    return station;
  });
  next.metrics.stationsAtRiskCount = stationsAtRisk;

  const needyStations = [...next.stations].sort((a, b) => {
    if (next.policy === 'FIFO') {
      return a.currentInventory / Math.max(0.01, a.maxBuffer) - b.currentInventory / Math.max(0.01, b.maxBuffer);
    }
    if (next.policy === 'STATIC_PRIORITY') {
      return b.criticality - a.criticality;
    }
    const lossA = productionWeight(a, next.mechanisms) * a.starvationProbability;
    const lossB = productionWeight(b, next.mechanisms) * b.starvationProbability;
    return lossB - lossA;
  });

  const idleAvailable = next.amrs.filter(
    (a) => a.health === 'HEALTHY' && (a.state === 'IDLE' || a.state === 'RETURNING_TO_BASE') && !a.standbyForTaskId
  ).length;
  const uncoveredCritical = next.stations.filter((s) => {
    const hasTask = next.tasks.some(
      (t) => t.stationId === s.id && (t.status === 'ASSIGNED' || t.status === 'IN_TRANSIT' || t.status === 'PENDING_AUCTION') && !t.isRescue
    );
    return s.criticality >= 0.8 && s.predictedStockoutSec < 70 && !hasTask;
  });

  for (const station of needyStations) {
    const hasActiveTask = next.tasks.some(
      (t) =>
        t.stationId === station.id &&
        (t.status === 'ASSIGNED' || t.status === 'IN_TRANSIT' || t.status === 'PENDING_AUCTION') &&
        !t.isRescue
    );
    if (hasActiveTask || !(station.predictedStockoutSec < 50 || station.currentInventory <= station.safetyStock)) {
      continue;
    }

    if (
      next.policy === 'LINEGUARD' &&
      station.criticality < 0.6 &&
      uncoveredCritical.some((s) => s.id !== station.id) &&
      idleAvailable <= uncoveredCritical.length
    ) {
      pushEvent(next, {
        timestampSec: currentSimTime,
        type: 'TRIAGE_ENACTED',
        stationId: station.id,
        severity: 'WARNING',
        title: `Triage: ${station.name} delayed`,
        description: `${uncoveredCritical[0]?.name || 'Critical station'} protected. ${station.name} delivery delayed because this produced lower expected factory-wide loss.`,
      });
      continue;
    }

    const task = createDeliveryTask(next, station);
    runAuction(next, task, false);
  }

  for (const pending of next.tasks.filter((t) => t.status === 'PENDING_AUCTION' && !t.assignedAmrId)) {
    if (currentSimTime - pending.creationTimeSec < 2) continue;
    if (Math.round(currentSimTime) % 4 !== 0) continue;
    runAuction(next, pending, true, false);
  }

  next.chargers = next.chargers.map((c) => ({ ...c, occupiedByAmrId: undefined }));

  next.amrs = next.amrs.map((a) => {
    const amr = { ...a };

    amr.commStatus = next.commStatus;
    if (next.commStatus === 'NORMAL') {
      amr.stateVersion = next.globalStateVersion;
    } else if (next.commStatus === 'DELAYED') {
      amr.stateVersion = Math.max(100, next.globalStateVersion - 6);
    } else {
      amr.stateVersion = Math.max(100, next.globalStateVersion - 18);
    }

    if (amr.health === 'FAILED') {
      amr.state = 'FAILED';
      return amr;
    }

    if (next.commStatus === 'NORMAL') {
      amr.lastHeartbeatTime = currentSimTime;
    } else if (next.commStatus === 'DELAYED') {
      if (Math.round(currentSimTime) % 5 === 0) amr.lastHeartbeatTime = currentSimTime;
    }
    // COMM LOSS: heartbeat not refreshed — leases expire and re-auction using last-known state.

    const moveTowards = (target: Position, speed: number) => {
      const blockedAisle = next.aisles.find((aisle) => aisle.isBlocked && Math.abs(aisle.start.y - aisle.end.y) < 12);
      let goal = target;
      if (blockedAisle && Math.abs(amr.position.y - blockedAisle.start.y) < 36) {
        const detourY = blockedAisle.start.y < 280 ? blockedAisle.start.y + 140 : blockedAisle.start.y - 140;
        goal = { x: amr.position.x, y: detourY };
      } else if (Math.abs(amr.position.x - target.x) > 8) {
        goal = { x: target.x, y: amr.position.y };
      }

      const dx = goal.x - amr.position.x;
      const dy = goal.y - amr.position.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 4 && goal === target) {
        amr.position = { ...target };
        return true;
      }
      if (dist < 4) {
        amr.position = { ...goal };
        return false;
      }
      const blockedPenalty = next.aisles.some((aisle) => aisle.isBlocked) ? 0.78 : 1;
      const moveDist = Math.min(dist, speed * 12 * dt * blockedPenalty);
      amr.position = {
        x: Math.round((amr.position.x + (dx / dist) * moveDist) * 10) / 10,
        y: Math.round((amr.position.y + (dy / dist) * moveDist) * 10) / 10,
      };
      amr.totalDistanceTraveled += moveDist * 0.25;
      const drainFactor = amr.payloadCapability === 'HEAVY' ? 0.08 : 0.05;
      amr.batteryPct = Math.max(0, Math.round((amr.batteryPct - drainFactor * dt) * 10) / 10);
      next.metrics.totalEnergyConsumedPct += drainFactor * dt;
      return false;
    };

    if (amr.state === 'CHARGING') {
      const charger = nearestCharger(amr, next.chargers);
      charger.occupiedByAmrId = amr.id;
      moveTowards(charger.position, amr.speedMps);
      amr.batteryPct = Math.min(100, Math.round((amr.batteryPct + charger.chargeRatePctPerSec * dt) * 10) / 10);
      if (amr.batteryPct >= 95) {
        amr.state = 'IDLE';
        amr.targetPosition = undefined;
        charger.occupiedByAmrId = undefined;
      }
    } else if (amr.state === 'IDLE' || amr.state === 'RETURNING_TO_BASE') {
      if (amr.state === 'RETURNING_TO_BASE' && amr.targetPosition) {
        if (moveTowards(amr.targetPosition, amr.speedMps)) {
          amr.state = 'IDLE';
          amr.targetPosition = undefined;
        }
      }
      if (amr.batteryPct < 25) {
        amr.state = 'CHARGING';
        amr.targetPosition = nearestCharger(amr, next.chargers).position;
      }
    } else if (amr.state === 'MOVING_TO_PICKUP') {
      const activeTask = next.tasks.find((t) => t.id === amr.currentTaskId);
      const targetPos =
        activeTask?.isRescue && activeTask.rescuePayloadLocation ? activeTask.rescuePayloadLocation : WAREHOUSE.position;
      amr.targetPosition = targetPos;
      if (moveTowards(targetPos, amr.speedMps)) {
        amr.state = 'LOADING';
        amr.busyUntilSec = currentSimTime + (activeTask?.isRescue ? 2 : 3);
      }
    } else if (amr.state === 'LOADING') {
      if ((amr.busyUntilSec || 0) > currentSimTime) {
        return amr;
      }
      const activeTask = next.tasks.find((t) => t.id === amr.currentTaskId);
      if (activeTask) {
        activeTask.status = 'IN_TRANSIT';
        amr.carryingComponentId = activeTask.componentId;
        if (!activeTask.isRescue) {
          next.warehouseStock[activeTask.componentId] = Math.max(
            0,
            (next.warehouseStock[activeTask.componentId] || 0) - activeTask.quantity
          );
        }
        const station = next.stations.find((s) => s.id === activeTask.stationId);
        if (station) amr.targetPosition = station.position;
      }
      amr.state = 'DELIVERING';
    } else if (amr.state === 'DELIVERING') {
      const activeTask = next.tasks.find((t) => t.id === amr.currentTaskId);
      const station = next.stations.find((s) => s.id === activeTask?.stationId);
      const targetPos = station ? station.position : WAREHOUSE.position;
      amr.targetPosition = targetPos;
      if (moveTowards(targetPos, amr.speedMps) && activeTask && station) {
        amr.state = 'UNLOADING';
        amr.busyUntilSec = currentSimTime + 2;
      }
    } else if (amr.state === 'UNLOADING') {
      if ((amr.busyUntilSec || 0) > currentSimTime) {
        return amr;
      }
      const activeTask = next.tasks.find((t) => t.id === amr.currentTaskId);
      const station = next.stations.find((s) => s.id === activeTask?.stationId);
      if (activeTask && station) {
        activeTask.status = 'DELIVERED';
        activeTask.completionSimTime = currentSimTime;
        station.currentInventory = Math.min(station.maxBuffer, station.currentInventory + activeTask.quantity);
        station.isStarved = false;
        const onTime = currentSimTime <= activeTask.deadlineSimTime;
        next.metrics.completedDeliveriesCount += 1;
        if (onTime) {
          next.metrics.productionLossAvoidedMinutes += Math.round(station.criticality * 2.8 * 10) / 10;
        }
        pushEvent(next, {
          timestampSec: currentSimTime,
          type: 'DELIVERY_COMPLETED',
          taskId: activeTask.id,
          stationId: station.id,
          amrId: amr.id,
          severity: 'SUCCESS',
          title: `Delivery Completed: ${activeTask.id}`,
          description: `AMR ${amr.id} delivered ${activeTask.quantity} units to ${station.name}. Buffer restored to ${station.currentInventory.toFixed(1)} units.`,
        });
        if (activeTask.standbyAmrId) {
          const sb = next.amrs.find((x) => x.id === activeTask.standbyAmrId);
          if (sb) sb.standbyForTaskId = undefined;
        }
      }
      amr.state = amr.batteryPct < 30 ? 'CHARGING' : 'RETURNING_TO_BASE';
      amr.currentTaskId = undefined;
      amr.standbyForTaskId = undefined;
      amr.carryingComponentId = undefined;
      amr.targetPosition = amr.state === 'CHARGING' ? nearestCharger(amr, next.chargers).position : WAREHOUSE.position;
      amr.completedTasksCount += 1;
    }

    return amr;
  });

  for (const amr of next.amrs) {
    if (amr.health === 'HEALTHY' && amr.batteryPct <= 0) {
      applyAmrFailure(next, amr);
    }
  }

  for (const task of next.tasks) {
    if (task.status !== 'ASSIGNED' && task.status !== 'IN_TRANSIT') continue;
    const assignedAmr = next.amrs.find((a) => a.id === task.assignedAmrId);
    const amrFailed = !assignedAmr || assignedAmr.health === 'FAILED';
    const heartbeatAge = assignedAmr ? currentSimTime - assignedAmr.lastHeartbeatTime : 99;
    const heartbeatLost = heartbeatAge > 8;

    if (heartbeatLost && assignedAmr && assignedAmr.health !== 'FAILED') {
      pushEvent(next, {
        timestampSec: currentSimTime,
        type: 'HEARTBEAT_MISSED',
        taskId: task.id,
        amrId: task.assignedAmrId,
        severity: 'WARNING',
        title: `Heartbeat Lost: ${task.assignedAmrId}`,
        description: `${task.assignedAmrId} missed heartbeat (age ${heartbeatAge.toFixed(0)}s). Lease under review.`,
      });
    }

    if (!amrFailed && !heartbeatLost && task.lease) {
      task.lease.expiresAtSimTime = currentSimTime + 16;
      continue;
    }

    const leaseExpired = task.lease ? currentSimTime > task.lease.expiresAtSimTime : heartbeatLost;
    if (!amrFailed && !leaseExpired && !heartbeatLost) continue;

    if (!next.mechanisms.useReauction) {
      continue;
    }

    pushEvent(next, {
      timestampSec: currentSimTime,
      type: amrFailed ? 'AMR_FAILED' : 'LEASE_EXPIRED',
      taskId: task.id,
      amrId: task.assignedAmrId,
      severity: 'WARNING',
      title: amrFailed ? `AMR Failure: ${task.assignedAmrId}` : `Lease Expired: ${task.id}`,
      description: `Contract with ${task.assignedAmrId} cancelled. Activating decentralized recovery.`,
    });

    const failRecord = next.pendingFailures.find((f) => f.amrId === task.assignedAmrId);

    if (task.standbyAmrId) {
      const standbyAmr = next.amrs.find((a) => a.id === task.standbyAmrId);
      if (standbyAmr && standbyAmr.health === 'HEALTHY' && (standbyAmr.state === 'IDLE' || standbyAmr.state === 'RETURNING_TO_BASE')) {
        const previous = task.assignedAmrId;
        task.assignedAmrId = standbyAmr.id;
        task.standbyAmrId = undefined;
        task.lease = {
          taskId: task.id,
          amrId: standbyAmr.id,
          leaseDurationSec: 16,
          assignedSimTime: currentSimTime,
          expiresAtSimTime: currentSimTime + 16,
        };
        standbyAmr.state = 'MOVING_TO_PICKUP';
        standbyAmr.currentTaskId = task.id;
        standbyAmr.standbyForTaskId = undefined;
        standbyAmr.targetPosition = task.isRescue && task.rescuePayloadLocation ? task.rescuePayloadLocation : WAREHOUSE.position;
        if (failRecord) {
          next.recoveryDurations.push(currentSimTime - failRecord.failedAt);
        }
        pushEvent(next, {
          timestampSec: currentSimTime,
          type: 'AMR_SELECTED',
          taskId: task.id,
          amrId: standbyAmr.id,
          severity: 'SUCCESS',
          title: `Hot Standby Engaged: ${standbyAmr.id}`,
          description: `Zero-delay failover from ${previous} to ${standbyAmr.id} on ${task.id}.`,
        });
        continue;
      }
    }

    task.status = 'PENDING_AUCTION';
    task.assignedAmrId = undefined;
    task.lease = undefined;
    const won = runAuction(next, task, true);
    if (won && failRecord) {
      next.recoveryDurations.push(currentSimTime - failRecord.failedAt);
    }
  }

  next.aisles = next.aisles.map((aisle) => {
    let countInAisle = 0;
    const minY = Math.min(aisle.start.y, aisle.end.y) - 40;
    const maxY = Math.max(aisle.start.y, aisle.end.y) + 40;
    const minX = Math.min(aisle.start.x, aisle.end.x) - 40;
    const maxX = Math.max(aisle.start.x, aisle.end.x) + 40;
    for (const amr of next.amrs) {
      if (
        amr.position.x >= minX &&
        amr.position.x <= maxX &&
        amr.position.y >= minY &&
        amr.position.y <= maxY &&
        amr.health === 'HEALTHY'
      ) {
        countInAisle++;
      }
    }
    const congestionLevel = Math.min(1.0, countInAisle / Math.max(1, aisle.capacity));
    if (congestionLevel > 0.5) {
      next.metrics.congestionDelaysSec += congestionLevel * dt;
    }
    return {
      ...aisle,
      currentCount: countInAisle,
      congestionLevel: Math.round(congestionLevel * 100) / 100,
    };
  });

  for (const station of next.stations) {
    const activeTask = next.tasks.find(
      (t) => t.stationId === station.id && (t.status === 'ASSIGNED' || t.status === 'IN_TRANSIT')
    );
    const assignedBid = activeTask?.bids.find((b) => b.amrId === activeTask.assignedAmrId);
    station.slackSec = assignedBid
      ? calculateSlack(station.predictedStockoutSec, assignedBid.etaSec, SAFETY_MARGIN_SEC)
      : Math.round(station.predictedStockoutSec - SAFETY_MARGIN_SEC);
  }

  const activeCount = next.amrs.filter((a) => a.state !== 'IDLE' && a.state !== 'FAILED').length;
  const idleCount = next.amrs.filter((a) => a.state === 'IDLE').length;
  const failedCount = next.amrs.filter((a) => a.health === 'FAILED').length;
  const avgBattery = Math.round(next.amrs.reduce((sum, a) => sum + a.batteryPct, 0) / next.amrs.length);
  const avgRecovery =
    next.recoveryDurations.length > 0
      ? Math.round((next.recoveryDurations.reduce((s, v) => s + v, 0) / next.recoveryDurations.length) * 10) / 10
      : 0;

  const delivered = next.tasks.filter((t) => t.status === 'DELIVERED' && t.completionSimTime != null);
  const avgDelay =
    delivered.length > 0
      ? Math.round(
          (delivered.reduce((acc, t) => acc + Math.max(0, (t.completionSimTime || 0) - t.deadlineSimTime), 0) / delivered.length) * 10
        ) / 10
      : 0;

  next.metrics = {
    ...next.metrics,
    simTimeSec: next.simTimeSec,
    activeAmrsCount: activeCount,
    idleAmrsCount: idleCount,
    failedAmrsCount: failedCount,
    fleetAverageBatteryPct: avgBattery,
    averageRecoveryTimeSec: avgRecovery,
    averageDeliveryDelaySec: avgDelay,
    criticalDeliveriesCount: next.tasks.filter((t) => t.urgencyLevel === 'CRITICAL' && t.status !== 'DELIVERED' && t.status !== 'CANCELLED')
      .length,
    onTimeDeliveryRatePct:
      next.metrics.completedDeliveriesCount > 0
        ? Math.round(
            (next.tasks.filter((t) => t.status === 'DELIVERED' && (t.completionSimTime || 0) <= t.deadlineSimTime).length /
              next.metrics.completedDeliveriesCount) *
              100
          )
        : 100,
  };

  if (Math.round(currentSimTime) % 5 === 0) {
    next.metricsHistory = [
      ...next.metricsHistory.slice(-80),
      {
        t: currentSimTime,
        starvationEvents: next.metrics.totalStarvationEvents,
        starvationDurationSec: next.metrics.totalStarvationDurationSec,
        productionLossMinutes: next.metrics.productionLossMinutes,
        onTimePct: next.metrics.onTimeDeliveryRatePct,
        energyConsumedPct: Math.round(next.metrics.totalEnergyConsumedPct * 10) / 10,
      },
    ];
  }

  return next;
}

export function injectDisruption(
  state: SimulationState,
  type:
    | 'DEMAND_SURGE'
    | 'AMR_FAILURE'
    | 'COMM_DELAY'
    | 'COMM_LOSS'
    | 'COMM_RESTORE'
    | 'AISLE_BLOCK'
    | 'LOW_BATTERY'
    | 'HEAVY_UNAVAILABLE'
): SimulationState {
  const next = cloneState(state);
  const currentSimTime = next.simTimeSec;

  switch (type) {
    case 'DEMAND_SURGE': {
      next.disruptionsActive.demandSurge = true;
      pushEvent(next, {
        timestampSec: currentSimTime,
        type: 'DISRUPTION_INJECTED',
        severity: 'WARNING',
        title: 'DISRUPTION: EV SUV Production Surge',
        description: 'Traction battery and dual motor consumption increased by +80% across the assembly line.',
      });
      break;
    }
    case 'AMR_FAILURE': {
      const targetAmr =
        next.amrs.find((a) => a.state === 'DELIVERING' && a.health === 'HEALTHY') ||
        next.amrs.find((a) => a.health === 'HEALTHY' && a.id === 'AMR-07') ||
        next.amrs.find((a) => a.health === 'HEALTHY');
      if (targetAmr) applyAmrFailure(next, targetAmr);
      break;
    }
    case 'COMM_DELAY': {
      next.commStatus = 'DELAYED';
      next.disruptionsActive.commDegraded = true;
      pushEvent(next, {
        timestampSec: currentSimTime,
        type: 'COMMUNICATION_DEGRADED',
        severity: 'WARNING',
        title: 'NETWORK DISRUPTION: High Latency Delay',
        description: 'Shopfloor mesh latency increased to 3,200ms. AMRs operating with stale state versions.',
      });
      break;
    }
    case 'COMM_LOSS': {
      next.commStatus = 'LOSS';
      next.disruptionsActive.commDegraded = true;
      pushEvent(next, {
        timestampSec: currentSimTime,
        type: 'COMMUNICATION_DEGRADED',
        severity: 'CRITICAL',
        title: 'NETWORK DISRUPTION: Partial Communication Loss',
        description: 'AP outage. AMRs rely on last-known state; uncertainty σ_eff inflates stockout margins.',
      });
      break;
    }
    case 'COMM_RESTORE': {
      next.commStatus = 'NORMAL';
      next.disruptionsActive.commDegraded = false;
      pushEvent(next, {
        timestampSec: currentSimTime,
        type: 'COMMUNICATION_DEGRADED',
        severity: 'SUCCESS',
        title: 'NETWORK RESTORED: Nominal Connectivity',
        description: 'Full low-latency mesh communications re-established across all fleet nodes.',
      });
      break;
    }
    case 'AISLE_BLOCK': {
      const aisle = next.aisles.find((a) => a.id === 'AISLE-B') || next.aisles.find((a) => !a.isBlocked) || next.aisles[1];
      aisle.isBlocked = !aisle.isBlocked;
      next.disruptionsActive.aisleBlockedId = aisle.isBlocked ? aisle.id : undefined;
      pushEvent(next, {
        timestampSec: currentSimTime,
        type: 'DISRUPTION_INJECTED',
        severity: aisle.isBlocked ? 'WARNING' : 'INFO',
        title: aisle.isBlocked ? `AISLE OBSTRUCTION: ${aisle.name}` : `Aisle Cleared: ${aisle.name}`,
        description: aisle.isBlocked
          ? `Spill / maintenance barrier in ${aisle.name}. AMRs rerouting; congestion-aware ETAs increase.`
          : `${aisle.name} reopened for nominal traffic.`,
      });
      break;
    }
    case 'LOW_BATTERY': {
      next.disruptionsActive.fleetLowBattery = true;
      for (const amr of next.amrs) {
        if (amr.health === 'HEALTHY') {
          amr.batteryPct = Math.max(12, Math.round(amr.batteryPct * 0.35));
        }
      }
      pushEvent(next, {
        timestampSec: currentSimTime,
        type: 'DISRUPTION_INJECTED',
        severity: 'WARNING',
        title: 'FLEET DISRUPTION: Low Battery Stress Test',
        description: 'Shift-change depletion simulated. Energy feasibility gates will reject unsafe bids.',
      });
      break;
    }
    case 'HEAVY_UNAVAILABLE': {
      for (const amr of next.amrs) {
        if (amr.payloadCapability === 'HEAVY') {
          amr.batteryPct = 14;
        }
      }
      pushEvent(next, {
        timestampSec: currentSimTime,
        type: 'DISRUPTION_INJECTED',
        severity: 'CRITICAL',
        title: 'SCARCITY EVENT: Heavy AMR Depletion',
        description: 'All heavy-capable AMRs pushed to low-battery states. Scarcity penalty and explicit triage activated.',
      });
      break;
    }
  }

  return next;
}

export type DisruptionType =
  | 'DEMAND_SURGE'
  | 'AMR_FAILURE'
  | 'COMM_DELAY'
  | 'COMM_LOSS'
  | 'COMM_RESTORE'
  | 'AISLE_BLOCK'
  | 'LOW_BATTERY'
  | 'HEAVY_UNAVAILABLE';
