import { Component, VehicleVariant, BuildSequenceItem } from '../models/types';
import { SeededRNG } from './rng';

export const COMPONENTS: Record<string, Component> = {
  'COMP-BATTERY': {
    id: 'COMP-BATTERY',
    name: '800V Traction Battery Pack',
    category: 'Powertrain',
    unitWeightKg: 480, // Heavy
    payloadRequirement: 'HEAVY',
    warehouseStock: 45,
  },
  'COMP-MOTOR': {
    id: 'COMP-MOTOR',
    name: 'Dual Permanent-Magnet Drive Unit',
    category: 'Powertrain',
    unitWeightKg: 210, // Heavy
    payloadRequirement: 'HEAVY',
    warehouseStock: 50,
  },
  'COMP-WIRING': {
    id: 'COMP-WIRING',
    name: 'High-Voltage Wiring Loom',
    category: 'Electrical',
    unitWeightKg: 35, // Light
    payloadRequirement: 'LIGHT',
    warehouseStock: 120,
  },
  'COMP-ELECTRONICS': {
    id: 'COMP-ELECTRONICS',
    name: 'Central Autonomous Compute Module',
    category: 'Electronics',
    unitWeightKg: 18, // Light
    payloadRequirement: 'LIGHT',
    warehouseStock: 160,
  },
  'COMP-INTERIOR': {
    id: 'COMP-INTERIOR',
    name: 'Ergonomic Cockpit & Seating Array',
    category: 'Interior',
    unitWeightKg: 85, // Light
    payloadRequirement: 'LIGHT',
    warehouseStock: 75,
  },
  'COMP-WHEELS': {
    id: 'COMP-WHEELS',
    name: 'Aero-Alloy Wheels & Active Suspension Set',
    category: 'Chassis',
    unitWeightKg: 95, // Light
    payloadRequirement: 'LIGHT',
    warehouseStock: 90,
  },
};

export const VEHICLE_VARIANTS: VehicleVariant[] = [
  {
    id: 'VEH-EV-SEDAN',
    name: 'AeroSport EV Sedan',
    type: 'EV_SEDAN',
    multiplier: {
      'COMP-BATTERY': 1.0,
      'COMP-MOTOR': 1.0,
      'COMP-WIRING': 1.0,
      'COMP-ELECTRONICS': 1.0,
      'COMP-INTERIOR': 1.0,
      'COMP-WHEELS': 1.0,
    },
  },
  {
    id: 'VEH-EV-SUV',
    name: 'TerraCross EV SUV',
    type: 'EV_SUV',
    multiplier: {
      'COMP-BATTERY': 1.8, // Heavy dual battery pack demand!
      'COMP-MOTOR': 1.6,   // Dual motor setup
      'COMP-WIRING': 1.3,
      'COMP-ELECTRONICS': 1.2,
      'COMP-INTERIOR': 1.5,
      'COMP-WHEELS': 1.4,
    },
  },
  {
    id: 'VEH-HYBRID',
    name: 'Vanguard Hybrid E-Tourer',
    type: 'HYBRID',
    multiplier: {
      'COMP-BATTERY': 0.6,
      'COMP-MOTOR': 0.8,
      'COMP-WIRING': 1.4,
      'COMP-ELECTRONICS': 1.1,
      'COMP-INTERIOR': 1.0,
      'COMP-WHEELS': 1.0,
    },
  },
  {
    id: 'VEH-PERFORMANCE',
    name: 'Pulsar GT Performance EV',
    type: 'PERFORMANCE',
    multiplier: {
      'COMP-BATTERY': 1.5,
      'COMP-MOTOR': 2.0,   // Tri-motor drive units
      'COMP-WIRING': 1.2,
      'COMP-ELECTRONICS': 1.8,
      'COMP-INTERIOR': 1.2,
      'COMP-WHEELS': 1.6,
    },
  },
  {
    id: 'VEH-EV-TRUCK',
    name: 'Colossus EV Heavy Hauler',
    type: 'EV_TRUCK',
    multiplier: {
      'COMP-BATTERY': 2.2, // Huge battery consumption
      'COMP-MOTOR': 2.2,   // Quad heavy motors
      'COMP-WIRING': 1.6,
      'COMP-ELECTRONICS': 1.3,
      'COMP-INTERIOR': 1.4,
      'COMP-WHEELS': 2.0,
    },
  },
];

export function generateInitialBuildSequence(seed: number = 82731, count: number = 20): BuildSequenceItem[] {
  const rng = new SeededRNG(seed);
  const sequence: BuildSequenceItem[] = [];
  
  for (let i = 0; i < count; i++) {
    const variant = rng.choice(VEHICLE_VARIANTS);
    sequence.push({
      id: `SEQ-${101 + i}`,
      vehicleVariantId: variant.id,
      vehicleName: variant.name,
      chassisNumber: `VIN-LG${8400 + i}`,
      scheduledTimeSec: i * 45, // every 45 simulated seconds next chassis enters
      status: i === 0 ? 'IN_PRODUCTION' : 'PENDING',
    });
  }
  return sequence;
}
