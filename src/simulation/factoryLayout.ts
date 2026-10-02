import { Station, Warehouse, Charger, Aisle, Position } from '../models/types';

export const WAREHOUSE: Warehouse = {
  id: 'WH-MAIN',
  name: 'Automated Logistics Central Depot',
  position: { x: 100, y: 300 },
  baysCount: 4,
};

export const CHARGERS: Charger[] = [
  {
    id: 'CHG-01',
    name: 'Ultra-Fast Charging Bay Alpha',
    position: { x: 220, y: 110 },
    chargeRatePctPerSec: 0.8, // 0.8% per second
  },
  {
    id: 'CHG-02',
    name: 'Ultra-Fast Charging Bay Beta',
    position: { x: 220, y: 170 },
    chargeRatePctPerSec: 0.8,
  },
];

export const INITIAL_STATIONS: Station[] = [
  {
    id: 'ST-BAT',
    code: 'ST-01',
    name: 'Battery Pack Integration',
    criticality: 1.0, // HIGHEST CRITICALITY
    substitutability: 0.1,
    position: { x: 860, y: 110 },
    componentRequired: 'COMP-BATTERY',
    componentName: '800V Traction Battery Pack',
    payloadRequirement: 'HEAVY',
    currentInventory: 7,
    safetyStock: 3,
    maxBuffer: 12,
    consumptionRate: 0.12, // units / sec (~1 unit every 8.3s)
    nominalRate: 0.12,
    demandUncertainty: 0.04,
    stalenessAgeSec: 2,
    predictedStockoutSec: 58,
    starvationProbability: 0.15,
    slackSec: 25,
    isStarved: false,
    starvationDurationSec: 0,
    expectedProductionLossMin: 0,
  },
  {
    id: 'ST-MOT',
    code: 'ST-02',
    name: 'Dual Motor & Drive Assembly',
    criticality: 0.9, // HIGH CRITICALITY
    substitutability: 0.15,
    position: { x: 860, y: 250 },
    componentRequired: 'COMP-MOTOR',
    componentName: 'Dual Permanent-Magnet Drive Unit',
    payloadRequirement: 'HEAVY',
    currentInventory: 8,
    safetyStock: 3,
    maxBuffer: 14,
    consumptionRate: 0.11,
    nominalRate: 0.11,
    demandUncertainty: 0.035,
    stalenessAgeSec: 1,
    predictedStockoutSec: 72,
    starvationProbability: 0.08,
    slackSec: 35,
    isStarved: false,
    starvationDurationSec: 0,
    expectedProductionLossMin: 0,
  },
  {
    id: 'ST-WIR',
    code: 'ST-03',
    name: 'High-Voltage Wiring Loom',
    criticality: 0.7,
    substitutability: 0.35,
    position: { x: 860, y: 390 },
    componentRequired: 'COMP-WIRING',
    componentName: 'High-Voltage Wiring Loom',
    payloadRequirement: 'LIGHT',
    currentInventory: 14,
    safetyStock: 5,
    maxBuffer: 25,
    consumptionRate: 0.15,
    nominalRate: 0.15,
    demandUncertainty: 0.04,
    stalenessAgeSec: 3,
    predictedStockoutSec: 93,
    starvationProbability: 0.04,
    slackSec: 55,
    isStarved: false,
    starvationDurationSec: 0,
    expectedProductionLossMin: 0,
  },
  {
    id: 'ST-ELE',
    code: 'ST-04',
    name: 'Central Autonomous Electronics',
    criticality: 0.6,
    substitutability: 0.4,
    position: { x: 620, y: 520 },
    componentRequired: 'COMP-ELECTRONICS',
    componentName: 'Central Autonomous Compute Module',
    payloadRequirement: 'LIGHT',
    currentInventory: 16,
    safetyStock: 6,
    maxBuffer: 30,
    consumptionRate: 0.14,
    nominalRate: 0.14,
    demandUncertainty: 0.03,
    stalenessAgeSec: 2,
    predictedStockoutSec: 114,
    starvationProbability: 0.02,
    slackSec: 70,
    isStarved: false,
    starvationDurationSec: 0,
    expectedProductionLossMin: 0,
  },
  {
    id: 'ST-INT',
    code: 'ST-05',
    name: 'Interior & Ergonomic Cockpit',
    criticality: 0.4, // LOWEST CRITICALITY (Candidate for triage if starvation unavoidable)
    substitutability: 0.7,
    position: { x: 380, y: 520 },
    componentRequired: 'COMP-INTERIOR',
    componentName: 'Ergonomic Cockpit & Seating Array',
    payloadRequirement: 'LIGHT',
    currentInventory: 11,
    safetyStock: 4,
    maxBuffer: 20,
    consumptionRate: 0.10,
    nominalRate: 0.10,
    demandUncertainty: 0.025,
    stalenessAgeSec: 4,
    predictedStockoutSec: 110,
    starvationProbability: 0.03,
    slackSec: 65,
    isStarved: false,
    starvationDurationSec: 0,
    expectedProductionLossMin: 0,
  },
  {
    id: 'ST-WHL',
    code: 'ST-06',
    name: 'Wheels & Active Chassis',
    criticality: 0.5,
    substitutability: 0.55,
    position: { x: 180, y: 520 },
    componentRequired: 'COMP-WHEELS',
    componentName: 'Aero-Alloy Wheels & Active Suspension Set',
    payloadRequirement: 'LIGHT',
    currentInventory: 13,
    safetyStock: 4,
    maxBuffer: 24,
    consumptionRate: 0.12,
    nominalRate: 0.12,
    demandUncertainty: 0.03,
    stalenessAgeSec: 2,
    predictedStockoutSec: 108,
    starvationProbability: 0.02,
    slackSec: 60,
    isStarved: false,
    starvationDurationSec: 0,
    expectedProductionLossMin: 0,
  },
];

export const INITIAL_AISLES: Aisle[] = [
  {
    id: 'AISLE-A',
    name: 'Aisle A (North High-Speed Corridor)',
    start: { x: 100, y: 180 },
    end: { x: 860, y: 180 },
    capacity: 4,
    currentCount: 1,
    congestionLevel: 0.25,
    isBlocked: false,
  },
  {
    id: 'AISLE-B',
    name: 'Aisle B (Central Spine)',
    start: { x: 100, y: 320 },
    end: { x: 860, y: 320 },
    capacity: 5,
    currentCount: 2,
    congestionLevel: 0.40,
    isBlocked: false,
  },
  {
    id: 'AISLE-C',
    name: 'Aisle C (South Transit Lane)',
    start: { x: 100, y: 460 },
    end: { x: 860, y: 460 },
    capacity: 4,
    currentCount: 1,
    congestionLevel: 0.25,
    isBlocked: false,
  },
  {
    id: 'CROSS-1',
    name: 'West Cross-Aisle 1',
    start: { x: 280, y: 110 },
    end: { x: 280, y: 520 },
    capacity: 3,
    currentCount: 1,
    congestionLevel: 0.33,
    isBlocked: false,
  },
  {
    id: 'CROSS-2',
    name: 'Central Cross-Aisle 2',
    start: { x: 540, y: 110 },
    end: { x: 540, y: 520 },
    capacity: 4,
    currentCount: 0,
    congestionLevel: 0.0,
    isBlocked: false,
  },
  {
    id: 'CROSS-3',
    name: 'East Station Feed Corridor',
    start: { x: 760, y: 110 },
    end: { x: 760, y: 520 },
    capacity: 4,
    currentCount: 1,
    congestionLevel: 0.25,
    isBlocked: false,
  },
];

export function calculateManhattanDistance(p1: Position, p2: Position): number {
  return Math.abs(p1.x - p2.x) + Math.abs(p1.y - p2.y);
}

export function calculateEuclideanDistance(p1: Position, p2: Position): number {
  return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
}

function aisleIntersectsPath(from: Position, to: Position, aisle: Aisle): boolean {
  const minX = Math.min(from.x, to.x) - 30;
  const maxX = Math.max(from.x, to.x) + 30;
  const minY = Math.min(from.y, to.y) - 30;
  const maxY = Math.max(from.y, to.y) + 30;
  const ax1 = Math.min(aisle.start.x, aisle.end.x);
  const ax2 = Math.max(aisle.start.x, aisle.end.x);
  const ay1 = Math.min(aisle.start.y, aisle.end.y);
  const ay2 = Math.max(aisle.start.y, aisle.end.y);
  return ax1 <= maxX && ax2 >= minX && ay1 <= maxY && ay2 >= minY;
}

/**
 * Calculates travel time in seconds between two points, factoring in aisle congestion
 */
export function estimateTravelTimeSec(
  from: Position,
  to: Position,
  speedMps: number,
  aisles: Aisle[],
  isBlockedReroute: boolean = false
): { timeSec: number; distanceMeters: number; congestionDelaySec: number } {
  const mapDistance = calculateManhattanDistance(from, to);
  const distanceMeters = mapDistance * 0.25;

  const relevant = aisles.filter((aisle) => aisleIntersectsPath(from, to, aisle));
  const pathAisles = relevant.length > 0 ? relevant : aisles;

  let congestionFactor = 1.0;
  let blockedDetour = false;
  for (const aisle of pathAisles) {
    if (aisle.isBlocked) {
      congestionFactor += 0.85;
      blockedDetour = true;
    } else {
      congestionFactor += aisle.congestionLevel * 0.55;
    }
  }
  congestionFactor = congestionFactor / Math.max(1, pathAisles.length);

  const baseTimeSec = distanceMeters / Math.max(speedMps, 0.5);
  const congestionDelaySec =
    baseTimeSec * Math.max(0, congestionFactor - 0.35) * (isBlockedReroute || blockedDetour ? 1.6 : 1.0);
  const totalTimeSec = baseTimeSec + congestionDelaySec;

  return {
    timeSec: Math.round(totalTimeSec * 10) / 10,
    distanceMeters: Math.round(distanceMeters),
    congestionDelaySec: Math.round(congestionDelaySec * 10) / 10,
  };
}
