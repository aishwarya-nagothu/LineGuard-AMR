import { AMR, Station, Task, CandidateBid, DecisionTrace, AllocationPolicy, LineGuardMechanisms, Aisle } from '../models/types';
import { CHARGERS, estimateTravelTimeSec, WAREHOUSE, calculateManhattanDistance } from './factoryLayout';
import { calculateStockoutMetrics, SAFETY_MARGIN_SEC } from './prediction';
import { FULL_LINEGUARD } from './mechanisms';

const LAMBDA_ENERGY = 0.05;
const LAMBDA_CONGESTION = 0.08;

export { calculateStockoutMetrics };

export function productionWeight(station: Station, mechanisms: LineGuardMechanisms): number {
  if (!mechanisms.useProductionImpact) return 1.0;
  return station.criticality * (1 - (station.substitutability ?? 0.3));
}

export function evaluateFeasibilityGate(
  amr: AMR,
  task: Task,
  station: Station,
  mechanisms: LineGuardMechanisms = FULL_LINEGUARD
): {
  eligible: boolean;
  reason?: string;
  requiredEnergyPct: number;
  totalTravelDistMeters: number;
  pickupEnergyPct: number;
  deliveryEnergyPct: number;
  returnEnergyPct: number;
  reserveEnergyPct: number;
} {
  const emptyEnergy = {
    requiredEnergyPct: 0,
    totalTravelDistMeters: 0,
    pickupEnergyPct: 0,
    deliveryEnergyPct: 0,
    returnEnergyPct: 0,
    reserveEnergyPct: 10,
  };

  if (amr.health === 'FAILED' || amr.state === 'FAILED') {
    return { eligible: false, reason: 'AMR hardware failure / offline', ...emptyEnergy };
  }

  if (amr.standbyForTaskId && amr.standbyForTaskId !== task.id) {
    return { eligible: false, reason: `Reserved hot standby for ${amr.standbyForTaskId}`, ...emptyEnergy };
  }

  if (amr.state === 'DELIVERING' || amr.state === 'LOADING' || amr.state === 'UNLOADING' || amr.state === 'CHARGING') {
    return { eligible: false, reason: `AMR busy (${amr.state})`, ...emptyEnergy };
  }

  if (amr.currentTaskId && amr.currentTaskId !== task.id) {
    return { eligible: false, reason: `AMR already contracted (${amr.currentTaskId})`, ...emptyEnergy };
  }

  if (task.payloadRequirement === 'HEAVY' && amr.payloadCapability !== 'HEAVY') {
    return {
      eligible: false,
      reason: 'Incompatible payload: Task requires HEAVY carrier, AMR is LIGHT',
      ...emptyEnergy,
    };
  }

  const pickupPos = task.isRescue && task.rescuePayloadLocation ? task.rescuePayloadLocation : WAREHOUSE.position;
  const distToPickup = calculateManhattanDistance(amr.position, pickupPos) * 0.25;
  const distPickupToStation = calculateManhattanDistance(pickupPos, station.position) * 0.25;

  let distToNearestCharger = 9999;
  for (const chg of CHARGERS) {
    const d = calculateManhattanDistance(station.position, chg.position) * 0.25;
    if (d < distToNearestCharger) distToNearestCharger = d;
  }

  const payloadFactor = task.payloadRequirement === 'HEAVY' ? 1.4 : 1.0;
  const pickupEnergyPct = Math.round((distToPickup / 10) * 0.075 * payloadFactor * 10) / 10;
  const deliveryEnergyPct = Math.round((distPickupToStation / 10) * 0.075 * payloadFactor * 10) / 10;
  const returnEnergyPct = Math.round((distToNearestCharger / 10) * 0.075 * 10) / 10;
  const reserveEnergyPct = 10.0;
  const requiredEnergyPct = Math.round((pickupEnergyPct + deliveryEnergyPct + returnEnergyPct + reserveEnergyPct) * 10) / 10;
  const totalDistMeters = distToPickup + distPickupToStation + distToNearestCharger;

  if (mechanisms.useEnergyGate && amr.batteryPct < requiredEnergyPct) {
    return {
      eligible: false,
      reason: `Insufficient battery (${amr.batteryPct}%): Requires ${requiredEnergyPct}% (pickup ${pickupEnergyPct}% + delivery ${deliveryEnergyPct}% + return ${returnEnergyPct}% + ${reserveEnergyPct}% reserve)`,
      requiredEnergyPct,
      totalTravelDistMeters: Math.round(totalDistMeters),
      pickupEnergyPct,
      deliveryEnergyPct,
      returnEnergyPct,
      reserveEnergyPct,
    };
  }

  return {
    eligible: true,
    requiredEnergyPct,
    totalTravelDistMeters: Math.round(totalDistMeters),
    pickupEnergyPct,
    deliveryEnergyPct,
    returnEnergyPct,
    reserveEnergyPct,
  };
}

function latenessLoss(etaSec: number, station: Station, weight: number): number {
  const slack = station.predictedStockoutSec - etaSec - SAFETY_MARGIN_SEC;
  return weight * (Math.max(0, -slack) / 10);
}

export function evaluateCandidateBids(
  task: Task,
  station: Station,
  allStations: Station[],
  allAmrs: AMR[],
  aisles: Aisle[],
  policy: AllocationPolicy = 'LINEGUARD',
  mechanisms: LineGuardMechanisms = FULL_LINEGUARD
): { candidates: CandidateBid[]; selectedAmrId?: string; decisionTrace?: DecisionTrace; decisionLatencyMs: number } {
  const started = typeof performance !== 'undefined' ? performance.now() : Date.now();
  const availableHeavyCount = allAmrs.filter(
    (a) => a.payloadCapability === 'HEAVY' && a.health === 'HEALTHY' && (a.state === 'IDLE' || a.state === 'RETURNING_TO_BASE') && !a.standbyForTaskId
  ).length;

  const weight = productionWeight(station, mechanisms);
  const candidates: CandidateBid[] = [];

  for (const amr of allAmrs) {
    const gate = evaluateFeasibilityGate(amr, task, station, mechanisms);

    if (!gate.eligible) {
      candidates.push({
        amrId: amr.id,
        eligible: false,
        ineligibleReason: gate.reason,
        etaSec: 999,
        energyCost: 999,
        congestionDelaySec: 0,
        collateralRisk: 0,
        scarcityPenalty: 0,
        lossIfDelayed: 999,
        totalScore: 9999,
        breakdown: {
          travelDistMeters: gate.totalTravelDistMeters,
          requiredEnergyPct: gate.requiredEnergyPct,
          pickupEnergyPct: gate.pickupEnergyPct,
          deliveryEnergyPct: gate.deliveryEnergyPct,
          returnEnergyPct: gate.returnEnergyPct,
          reserveEnergyPct: gate.reserveEnergyPct,
          availableBatteryPct: amr.batteryPct,
        },
      });
      continue;
    }

    const pickupPos = task.isRescue && task.rescuePayloadLocation ? task.rescuePayloadLocation : WAREHOUSE.position;
    const blocked = aisles.some((a) => a.isBlocked);
    const leg1 = estimateTravelTimeSec(amr.position, pickupPos, amr.speedMps, aisles, blocked);
    const loadingTimeSec = task.isRescue ? 6 : 10;
    const leg2 = estimateTravelTimeSec(pickupPos, station.position, amr.speedMps, aisles, blocked);
    const totalEtaSec = leg1.timeSec + loadingTimeSec + leg2.timeSec;
    const totalCongestionDelay = leg1.congestionDelaySec + leg2.congestionDelaySec;

    const lossIfDelayed = latenessLoss(totalEtaSec, station, weight);
    const energyCost = gate.requiredEnergyPct * LAMBDA_ENERGY;
    const congestionCost = totalCongestionDelay * LAMBDA_CONGESTION;

    let collateralRisk = 0;
    let downstreamStationRiskName: string | undefined;
    let downstreamLossMin: number | undefined;

    if (mechanisms.useCollateralRisk) {
      for (const otherStation of allStations) {
        if (otherStation.id === station.id) continue;
        if (otherStation.predictedStockoutSec >= 140) continue;

        const otherWeight = productionWeight(otherStation, mechanisms);
        const thisEtaOther =
          estimateTravelTimeSec(amr.position, otherStation.position, amr.speedMps, aisles, blocked).timeSec;
        const thisLossOther = latenessLoss(thisEtaOther, otherStation, otherWeight);

        const alternates = allAmrs.filter(
          (o) =>
            o.id !== amr.id &&
            o.health === 'HEALTHY' &&
            (o.state === 'IDLE' || o.state === 'RETURNING_TO_BASE') &&
            !o.standbyForTaskId &&
            !(otherStation.payloadRequirement === 'HEAVY' && o.payloadCapability !== 'HEAVY')
        );

        if (otherStation.payloadRequirement === 'HEAVY' && amr.payloadCapability === 'HEAVY' && alternates.length === 0) {
          const extra = otherWeight * 6.5;
          collateralRisk += extra;
          downstreamStationRiskName = otherStation.name;
          downstreamLossMin = Math.round(otherWeight * 3.8 * 10) / 10;
          continue;
        }

        if (alternates.length === 0) continue;

        let nextBestLoss = Infinity;
        for (const alt of alternates) {
          const altEta = estimateTravelTimeSec(alt.position, otherStation.position, alt.speedMps, aisles, blocked).timeSec;
          nextBestLoss = Math.min(nextBestLoss, latenessLoss(altEta, otherStation, otherWeight));
        }
        const phi = Math.max(0, nextBestLoss - thisLossOther);
        collateralRisk += phi;
        if (phi > 0.8) {
          downstreamStationRiskName = otherStation.name;
          downstreamLossMin = Math.round(phi * 10) / 10;
        }
      }
    }

    let scarcityPenalty = 0;
    if (mechanisms.useCollateralRisk && task.payloadRequirement === 'LIGHT' && amr.payloadCapability === 'HEAVY') {
      if (availableHeavyCount <= 2) {
        scarcityPenalty = (3 - availableHeavyCount) * 4.0;
      }
    }

    const stalenessFactor = amr.commStatus === 'DELAYED' ? 1.3 : amr.commStatus === 'LOSS' ? 1.8 : 1.0;
    const amrOrdinal = parseInt(amr.id.replace(/\D/g, ''), 10) || 0;

    let totalScore = 0;
    switch (policy) {
      case 'LINEGUARD':
        totalScore =
          (lossIfDelayed * 3.0 + energyCost + congestionCost + collateralRisk + scarcityPenalty + totalEtaSec * 0.05) *
          stalenessFactor;
        break;
      case 'NEAREST_AMR':
        totalScore = calculateManhattanDistance(amr.position, pickupPos);
        break;
      case 'DISTANCE_AUCTION':
        totalScore = totalEtaSec;
        break;
      case 'FIFO':
        totalScore = amrOrdinal + (amr.state === 'IDLE' ? 0 : 100);
        break;
      case 'STATIC_PRIORITY':
        totalScore = (1 - weight) * 100 + totalEtaSec * 0.2;
        break;
    }

    candidates.push({
      amrId: amr.id,
      eligible: true,
      etaSec: Math.round(totalEtaSec * 10) / 10,
      energyCost: Math.round(energyCost * 100) / 100,
      congestionDelaySec: Math.round(totalCongestionDelay * 10) / 10,
      collateralRisk: Math.round(collateralRisk * 100) / 100,
      scarcityPenalty: Math.round(scarcityPenalty * 100) / 100,
      lossIfDelayed: Math.round(lossIfDelayed * 100) / 100,
      totalScore: Math.round(totalScore * 100) / 100,
      breakdown: {
        travelDistMeters: gate.totalTravelDistMeters,
        requiredEnergyPct: gate.requiredEnergyPct,
        pickupEnergyPct: gate.pickupEnergyPct,
        deliveryEnergyPct: gate.deliveryEnergyPct,
        returnEnergyPct: gate.returnEnergyPct,
        reserveEnergyPct: gate.reserveEnergyPct,
        availableBatteryPct: amr.batteryPct,
        downstreamStationRiskName,
        downstreamLossMin,
      },
    });
  }

  const eligibleCandidates = candidates.filter((c) => c.eligible).sort((a, b) => a.totalScore - b.totalScore);
  const latencyMs =
    Math.round(((typeof performance !== 'undefined' ? performance.now() : Date.now()) - started) * 100) / 100;

  if (eligibleCandidates.length === 0) {
    return {
      candidates,
      selectedAmrId: undefined,
      decisionLatencyMs: latencyMs,
      decisionTrace: {
        taskId: task.id,
        stationId: station.id,
        stationName: station.name,
        componentName: station.componentName,
        timestampSec: 0,
        selectedAmrId: 'NONE',
        selectedBid: {} as CandidateBid,
        explanation: 'CRITICAL TRIAGE: No eligible AMR can complete this delivery under current feasibility gates.',
        counterfactual: 'All candidate AMRs failed energy reserves, payload capability, or availability gates.',
        tradeOffSummary: `Station ${station.name} is unprotected. Fleet capacity exhausted for this payload class.`,
        whySelected: [{ ok: false, text: 'No feasible AMR passed payload, energy, and availability gates' }],
        whyNotRunnerUp: [],
        candidates,
        triageApplied: true,
        triageMessage: `No feasible AMR found for ${station.name}. Higher-criticality stations remain prioritized.`,
      },
    };
  }

  const winner = eligibleCandidates[0];
  const runnerUp = eligibleCandidates.length > 1 ? eligibleCandidates[1] : undefined;
  const selectedAmr = allAmrs.find((a) => a.id === winner.amrId)!;
  const arrivesBeforeStockout = winner.etaSec + SAFETY_MARGIN_SEC <= station.predictedStockoutSec;

  const whySelected: { ok: boolean; text: string }[] = [
    { ok: arrivesBeforeStockout, text: arrivesBeforeStockout ? 'Arrives before predicted stockout' : 'ETA is after predicted stockout — still lowest factory-wide loss' },
    { ok: true, text: `Sufficient battery (${selectedAmr.batteryPct}% ≥ ${winner.breakdown.requiredEnergyPct}% required)` },
    { ok: true, text: `Required payload capability (${task.payloadRequirement})` },
    { ok: winner.congestionDelaySec < 8, text: winner.congestionDelaySec < 8 ? 'Low congestion on assigned route' : `Congestion delay ${winner.congestionDelaySec}s priced into bid` },
    { ok: winner.collateralRisk < 2, text: winner.collateralRisk < 2 ? 'Low collateral risk' : `Collateral Φ=${winner.collateralRisk} still better than alternatives` },
  ];

  const whyNotRunnerUp: { ok: boolean; text: string }[] = [];
  if (runnerUp) {
    if (runnerUp.etaSec < winner.etaSec) {
      whyNotRunnerUp.push({ ok: true, text: `Faster ETA (${runnerUp.etaSec}s vs ${winner.etaSec}s)` });
    }
    if (runnerUp.collateralRisk > winner.collateralRisk) {
      whyNotRunnerUp.push({
        ok: false,
        text: `${runnerUp.breakdown.downstreamStationRiskName || 'A downstream station'} needs this capability — higher collateral production risk (Φ=${runnerUp.collateralRisk})`,
      });
    }
    if (runnerUp.scarcityPenalty > winner.scarcityPenalty) {
      whyNotRunnerUp.push({ ok: false, text: 'Heavy-capable AMR needed elsewhere (scarcity penalty)' });
    }
    if (runnerUp.energyCost > winner.energyCost) {
      whyNotRunnerUp.push({ ok: false, text: 'Higher energy routing cost' });
    }
  }

  let explanation = '';
  let counterfactual = '';
  let tradeOffSummary = '';

  if (policy === 'LINEGUARD') {
    if (runnerUp && runnerUp.etaSec < winner.etaSec) {
      explanation = `${winner.amrId} was selected over ${runnerUp.amrId}. Although ${runnerUp.amrId} has a faster ETA (${runnerUp.etaSec}s vs ${winner.etaSec}s), assigning ${runnerUp.amrId} would create collateral risk of ${runnerUp.collateralRisk.toFixed(1)} at ${runnerUp.breakdown.downstreamStationRiskName || 'a downstream station'}.`;
      counterfactual = `${runnerUp.amrId} would become preferred if ${runnerUp.breakdown.downstreamStationRiskName || 'Motor Assembly'} risk decreased below 42%, or if another heavy-capable AMR was idle nearby.`;
      tradeOffSummary = `Sacrificed ${(winner.etaSec - runnerUp.etaSec).toFixed(1)}s travel time to prevent +${runnerUp.breakdown.downstreamLossMin || 2.4} min downstream production loss.`;
    } else {
      explanation = `${winner.amrId} provides the lowest factory-wide bid: arrives ${Math.max(0, Math.round(station.predictedStockoutSec - winner.etaSec))}s before predicted stockout, collateral Φ=${winner.collateralRisk.toFixed(1)}, battery ${selectedAmr.batteryPct}%.`;
      counterfactual = runnerUp
        ? `${runnerUp.amrId} scored ${runnerUp.totalScore} due to ${runnerUp.congestionDelaySec > 2 ? 'corridor congestion' : runnerUp.energyCost > winner.energyCost ? 'higher energy routing' : 'higher collateral / lateness penalty'}.`
        : 'Sole feasible candidate satisfying energy and payload gates.';
      tradeOffSummary = `Direct assignment with ${winner.breakdown.availableBatteryPct}% battery and Φ=${winner.collateralRisk}.`;
    }
  } else {
    explanation = `Selected ${winner.amrId} based on ${policy} (score ${winner.totalScore}). Collateral factory impact (${winner.collateralRisk}) was not used by this baseline.`;
    counterfactual = 'LineGuard would have evaluated factory-wide stockout trade-offs, energy gates, and collateral risk.';
    tradeOffSummary = `Pure local optimization (${policy}).`;
  }

  const decisionTrace: DecisionTrace = {
    taskId: task.id,
    stationId: station.id,
    stationName: station.name,
    componentName: station.componentName,
    timestampSec: 0,
    selectedAmrId: winner.amrId,
    selectedBid: winner,
    runnerUpAmrId: runnerUp?.amrId,
    runnerUpBid: runnerUp,
    explanation,
    counterfactual,
    tradeOffSummary,
    whySelected,
    whyNotRunnerUp,
    candidates,
    triageApplied: false,
  };

  return {
    candidates,
    selectedAmrId: winner.amrId,
    decisionTrace,
    decisionLatencyMs: latencyMs,
  };
}
