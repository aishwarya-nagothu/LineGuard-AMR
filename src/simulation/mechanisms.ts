import { LineGuardMechanisms } from '../models/types';

export const FULL_LINEGUARD: LineGuardMechanisms = {
  useProductionImpact: true,
  useCollateralRisk: true,
  useUncertainty: true,
  useEnergyGate: true,
  useReauction: true,
};

export const ABLATION_PRESETS: Record<string, { name: string; description: string; mechanisms: LineGuardMechanisms }> = {
  FULL_LINEGUARD: {
    name: 'Full LineGuard (All Mechanisms)',
    description: 'Production criticality + collateral risk + uncertainty + energy gates + dynamic re-auction',
    mechanisms: FULL_LINEGUARD,
  },
  NO_CRITICALITY: {
    name: 'LineGuard w/o Production Impact',
    description: 'Treats Battery (1.0) and Interior (0.4) with identical weight',
    mechanisms: { ...FULL_LINEGUARD, useProductionImpact: false },
  },
  NO_COLLATERAL: {
    name: 'LineGuard w/o Collateral Risk Φ(a,i)',
    description: 'Ignores downstream starvation risk when assigning scarce heavy robots',
    mechanisms: { ...FULL_LINEGUARD, useCollateralRisk: false },
  },
  NO_UNCERTAINTY: {
    name: 'LineGuard w/o Uncertainty Awareness',
    description: 'Uses mean consumption only; ignores σ_eff and information age',
    mechanisms: { ...FULL_LINEGUARD, useUncertainty: false },
  },
  NO_ENERGY_GATE: {
    name: 'LineGuard w/o Energy Feasibility Gate',
    description: 'Allows low-battery AMRs to accept contracts and strand mid-transit',
    mechanisms: { ...FULL_LINEGUARD, useEnergyGate: false },
  },
  NO_REAUCTION: {
    name: 'LineGuard w/o Dynamic Re-Auction / Standby',
    description: 'Failed robot contracts remain frozen until the original AMR recovers',
    mechanisms: { ...FULL_LINEGUARD, useReauction: false },
  },
};
