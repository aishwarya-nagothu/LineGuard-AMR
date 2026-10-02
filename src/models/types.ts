/**
 * LINEGUARD Core Data Models and Types
 * Decentralized Starvation-Risk-Aware AMR Coordination
 */

export type PayloadCapability = 'LIGHT' | 'HEAVY';

export type AMRState =
  | 'IDLE'
  | 'MOVING_TO_PICKUP'
  | 'LOADING'
  | 'DELIVERING'
  | 'UNLOADING'
  | 'CHARGING'
  | 'RETURNING_TO_BASE'
  | 'FAILED';

export type CommStatus = 'NORMAL' | 'DELAYED' | 'LOSS';

export interface Position {
  x: number;
  y: number;
}

export interface AMR {
  id: string; // e.g. "AMR-01"
  name: string;
  payloadCapability: PayloadCapability;
  maxPayloadKg: number;
  speedMps: number; // meters per second
  position: Position;
  targetPosition?: Position;
  currentStationId?: string;
  currentAisleId?: string;
  batteryPct: number; // 0 - 100
  state: AMRState;
  health: 'HEALTHY' | 'DEGRADED' | 'FAILED';
  commStatus: CommStatus;
  stateVersion: number;
  lastHeartbeatTime: number; // sim time in seconds
  currentTaskId?: string;
  standbyForTaskId?: string;
  carryingComponentId?: string;
  carryingTaskType?: 'DELIVERY' | 'RESCUE';
  carryingSourceLocation?: Position;
  totalDistanceTraveled: number;
  completedTasksCount: number;
  busyUntilSec?: number;
}

/** Feature flags used by ablation experiments. */
export interface LineGuardMechanisms {
  useProductionImpact: boolean;
  useCollateralRisk: boolean;
  useUncertainty: boolean;
  useEnergyGate: boolean;
  useReauction: boolean;
}

export interface Station {
  id: string;
  name: string;
  code: string;
  criticality: number; // 0.0 to 1.0 (Battery: 1.0, Motor: 0.9, Wiring: 0.7, etc.)
  substitutability: number; // 0 = cannot substitute, 1 = easily delayed
  position: Position;
  componentRequired: string; // Component ID
  componentName: string;
  payloadRequirement: PayloadCapability;
  currentInventory: number; // units
  safetyStock: number;
  maxBuffer: number;
  consumptionRate: number; // units per second (dynamic based on build sequence)
  nominalRate: number;
  demandUncertainty: number; // sigma
  stalenessAgeSec: number; // data age in seconds
  predictedStockoutSec: number; // TTS_delta
  starvationProbability: number; // 0 to 1
  slackSec: number; // TTS - ETA of assigned delivery
  isStarved: boolean;
  starvationDurationSec: number;
  expectedProductionLossMin: number;
  activeDeliveryTaskId?: string;
}

export interface Component {
  id: string;
  name: string;
  category: string;
  unitWeightKg: number;
  payloadRequirement: PayloadCapability;
  warehouseStock: number;
}

export interface VehicleVariant {
  id: string;
  name: string;
  type: 'EV_SEDAN' | 'EV_SUV' | 'HYBRID' | 'PERFORMANCE' | 'EV_TRUCK';
  multiplier: Record<string, number>; // component id -> consumption multiplier
}

export interface BuildSequenceItem {
  id: string;
  vehicleVariantId: string;
  vehicleName: string;
  chassisNumber: string;
  scheduledTimeSec: number;
  status: 'PENDING' | 'IN_PRODUCTION' | 'COMPLETED';
}

export interface CandidateBid {
  amrId: string;
  eligible: boolean;
  ineligibleReason?: string;
  etaSec: number;
  energyCost: number;
  congestionDelaySec: number;
  collateralRisk: number; // Phi(a,i)
  scarcityPenalty: number;
  lossIfDelayed: number; // L(a,i)
  totalScore: number; // lower is better
  breakdown: {
    travelDistMeters: number;
    requiredEnergyPct: number;
    pickupEnergyPct: number;
    deliveryEnergyPct: number;
    returnEnergyPct: number;
    reserveEnergyPct: number;
    availableBatteryPct: number;
    downstreamStationRiskName?: string;
    downstreamLossMin?: number;
  };
}

export interface TaskLease {
  taskId: string;
  amrId: string;
  leaseDurationSec: number;
  assignedSimTime: number;
  expiresAtSimTime: number;
}

export interface Task {
  id: string; // e.g. "TASK-1042"
  stationId: string;
  componentId: string;
  quantity: number;
  payloadRequirement: PayloadCapability;
  isRescue: boolean;
  rescuePayloadLocation?: Position;
  originalFailedAmrId?: string;
  creationTimeSec: number;
  urgencyLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'PENDING_AUCTION' | 'ASSIGNED' | 'IN_TRANSIT' | 'DELIVERED' | 'EXPIRED' | 'CANCELLED';
  assignedAmrId?: string;
  standbyAmrId?: string; // Hot standby AMR for high criticality
  lease?: TaskLease;
  bids: CandidateBid[];
  decisionTrace?: DecisionTrace;
  deadlineSimTime: number;
  completionSimTime?: number;
}

export interface DecisionTrace {
  taskId: string;
  stationId: string;
  stationName: string;
  componentName: string;
  timestampSec: number;
  selectedAmrId: string;
  selectedBid: CandidateBid;
  runnerUpAmrId?: string;
  runnerUpBid?: CandidateBid;
  explanation: string;
  counterfactual: string;
  tradeOffSummary: string;
  whySelected: { ok: boolean; text: string }[];
  whyNotRunnerUp: { ok: boolean; text: string }[];
  candidates: CandidateBid[];
  triageApplied: boolean;
  triageMessage?: string;
}

export interface Aisle {
  id: string;
  name: string;
  start: Position;
  end: Position;
  capacity: number; // max AMRs before heavy congestion
  currentCount: number;
  congestionLevel: number; // 0.0 to 1.0
  isBlocked: boolean;
}

export interface Charger {
  id: string;
  name: string;
  position: Position;
  occupiedByAmrId?: string;
  chargeRatePctPerSec: number;
}

export interface Warehouse {
  id: string;
  name: string;
  position: Position;
  baysCount: number;
}

export type EventType =
  | 'RISK_CHANGED'
  | 'TASK_ANNOUNCED'
  | 'BID_SUBMITTED'
  | 'AMR_SELECTED'
  | 'STANDBY_ASSIGNED'
  | 'LEASE_CREATED'
  | 'HEARTBEAT_MISSED'
  | 'LEASE_EXPIRED'
  | 'RE_AUCTION'
  | 'AMR_FAILED'
  | 'RESCUE_TASK_CREATED'
  | 'DELIVERY_COMPLETED'
  | 'TRIAGE_ENACTED'
  | 'COMMUNICATION_DEGRADED'
  | 'DISRUPTION_INJECTED';

export interface SimEvent {
  id: string;
  timestampSec: number;
  type: EventType;
  stationId?: string;
  amrId?: string;
  taskId?: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL' | 'SUCCESS';
  title: string;
  description: string;
  details?: Record<string, any>;
}

export type AllocationPolicy =
  | 'LINEGUARD' // Starvation-risk, collateral-risk, energy-aware decentralized
  | 'NEAREST_AMR' // Greedy Euclidean distance
  | 'FIFO' // First-in first-out station queue, first idle robot
  | 'STATIC_PRIORITY' // Strict station priority order
  | 'DISTANCE_AUCTION'; // Bid purely based on travel time/distance

export interface FactoryMetrics {
  simTimeSec: number;
  activeAmrsCount: number;
  idleAmrsCount: number;
  failedAmrsCount: number;
  criticalDeliveriesCount: number;
  stationsAtRiskCount: number;
  totalStarvationEvents: number;
  totalStarvationDurationSec: number;
  completedDeliveriesCount: number;
  onTimeDeliveryRatePct: number;
  productionLossAvoidedMinutes: number;
  averageRecoveryTimeSec: number;
  fleetAverageBatteryPct: number;
  totalEnergyConsumedPct: number;
  congestionDelaysSec: number;
  messagesExchangedCount: number;
  productionLossMinutes: number;
  decisionLatencyMs: number;
  averageDeliveryDelaySec: number;
}

export interface MetricsSnapshot {
  t: number;
  starvationEvents: number;
  starvationDurationSec: number;
  productionLossMinutes: number;
  onTimePct: number;
  energyConsumedPct: number;
}

export interface PolicyBenchmarkResult {
  policy: AllocationPolicy;
  policyName: string;
  starvationEvents: number;
  totalStarvationDurationMin: number;
  onTimeDeliveryPct: number;
  productionLossCostUSD: number; // e.g. $1,200 per starved minute in automotive assembly
  averageDeliveryDelaySec: number;
  recoveryTimeSec: number;
  energyConsumedPct: number;
  congestionDelaySec: number;
}

export interface AblationVariantResult {
  variantId: string;
  name: string;
  description: string;
  starvationEvents: number;
  starvationDurationMin: number;
  productionLossMin: number;
  onTimePct: number;
}

export interface ScalabilityResult {
  fleetSize: number;
  decisionLatencyMs: number;
  messagesPerMinute: number;
  taskCompletionRatePct: number;
  starvationEventsCount: number;
}
