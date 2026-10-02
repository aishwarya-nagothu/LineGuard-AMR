import { LineGuardMechanisms, Station } from '../models/types';

const Z_CONFIDENCE = 1.28;
const KAPPA_STALENESS = 0.02;
export const SAFETY_MARGIN_SEC = 10;

export function calculateStockoutMetrics(
  station: Station,
  mechanisms?: Pick<LineGuardMechanisms, 'useUncertainty'>
): {
  predictedStockoutSec: number;
  sigmaEff: number;
  starvationProb: number;
} {
  const useUncertainty = mechanisms?.useUncertainty !== false;
  const age = useUncertainty ? Math.max(0, station.stalenessAgeSec) : 0;
  const sigma = useUncertainty ? station.demandUncertainty : 0;
  const sigmaEff = Math.sqrt(Math.pow(sigma, 2) + Math.pow(KAPPA_STALENESS * age, 2));
  const z = useUncertainty ? Z_CONFIDENCE : 0;

  const effectiveConsumptionRate = Math.max(0.01, station.consumptionRate + z * sigmaEff);
  const ttsSec = station.currentInventory / effectiveConsumptionRate;

  let starvationProb = 0.05;
  if (ttsSec < 30) {
    starvationProb = Math.min(0.99, 0.9 + (30 - ttsSec) * 0.003);
  } else if (ttsSec < 60) {
    starvationProb = Math.min(0.85, 0.5 + (60 - ttsSec) * 0.012);
  } else if (ttsSec < 120) {
    starvationProb = Math.min(0.45, 0.1 + (120 - ttsSec) * 0.005);
  } else {
    starvationProb = Math.max(0.01, 0.05 - (ttsSec - 120) * 0.0002);
  }

  return {
    predictedStockoutSec: Math.max(0.1, Math.round(ttsSec * 10) / 10),
    sigmaEff: Math.round(sigmaEff * 1000) / 1000,
    starvationProb: Math.round(starvationProb * 100) / 100,
  };
}

export function calculateSlack(ttsSec: number, etaSec: number, safetyMarginSec: number = SAFETY_MARGIN_SEC): number {
  return Math.round((ttsSec - etaSec - safetyMarginSec) * 10) / 10;
}

/** Expected production loss minutes if the station starves now. */
export function expectedProductionLossMinutes(station: Station, mechanisms?: Pick<LineGuardMechanisms, 'useProductionImpact'>): number {
  const subst = station.substitutability ?? 0.3;
  const crit = mechanisms?.useProductionImpact === false ? 1.0 : station.criticality;
  const impactWeight = crit * (1 - subst);
  const risk = Math.max(station.starvationProbability, station.isStarved ? 1 : 0);
  return Math.round(impactWeight * risk * 8.5 * 10) / 10;
}
