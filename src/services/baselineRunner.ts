import { AllocationPolicy, PolicyBenchmarkResult } from '../models/types';
import { createInitialSimulationState, stepSimulation, injectDisruption } from '../simulation/engine';

function averageDelay(state: ReturnType<typeof createInitialSimulationState>): number {
  const delivered = state.tasks.filter((t) => t.status === 'DELIVERED' && t.completionSimTime != null);
  if (delivered.length === 0) return 0;
  const sum = delivered.reduce((acc, t) => acc + Math.max(0, (t.completionSimTime || 0) - t.deadlineSimTime), 0);
  return Math.round((sum / delivered.length) * 10) / 10;
}

export function runBaselineBenchmark(seed: number = 82731, durationSec: number = 240): PolicyBenchmarkResult[] {
  const policies: { policy: AllocationPolicy; name: string }[] = [
    { policy: 'LINEGUARD', name: 'LineGuard (Starvation & Collateral-Aware)' },
    { policy: 'NEAREST_AMR', name: 'Nearest Available AMR (Greedy)' },
    { policy: 'DISTANCE_AUCTION', name: 'Distance-Based Auction' },
    { policy: 'STATIC_PRIORITY', name: 'Static Priority Dispatch' },
    { policy: 'FIFO', name: 'First-In First-Out (FIFO)' },
  ];

  const results: PolicyBenchmarkResult[] = [];

  for (const item of policies) {
    let state = createInitialSimulationState(seed, item.policy, 10);
    const totalSteps = Math.floor(durationSec);

    for (let step = 0; step < totalSteps; step++) {
      if (step === 30) state = injectDisruption(state, 'DEMAND_SURGE');
      if (step === 90) state = injectDisruption(state, 'AMR_FAILURE');
      if (step === 150) state = injectDisruption(state, 'COMM_DELAY');
      state = stepSimulation(state, 1.0);
    }

    const starvationMin = Math.round((state.metrics.totalStarvationDurationSec / 60) * 10) / 10;
    const costUSD = Math.round(starvationMin * 1400 + state.metrics.productionLossMinutes * 1400);

    results.push({
      policy: item.policy,
      policyName: item.name,
      starvationEvents: state.metrics.totalStarvationEvents,
      totalStarvationDurationMin: starvationMin,
      onTimeDeliveryPct: state.metrics.onTimeDeliveryRatePct,
      productionLossCostUSD: costUSD,
      averageDeliveryDelaySec: averageDelay(state),
      recoveryTimeSec: state.metrics.averageRecoveryTimeSec,
      energyConsumedPct: Math.round(state.metrics.totalEnergyConsumedPct * 10) / 10,
      congestionDelaySec: Math.round(state.metrics.congestionDelaysSec * 10) / 10,
    });
  }

  return results;
}
