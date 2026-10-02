import { AblationVariantResult, ScalabilityResult } from '../models/types';
import { createInitialSimulationState, stepSimulation, injectDisruption } from '../simulation/engine';
import { ABLATION_PRESETS } from '../simulation/mechanisms';

export function runAblationStudy(seed: number = 82731, durationSec: number = 240): AblationVariantResult[] {
  const results: AblationVariantResult[] = [];

  for (const [variantId, preset] of Object.entries(ABLATION_PRESETS)) {
    let state = createInitialSimulationState(seed, 'LINEGUARD', 10, preset.mechanisms);

    for (let step = 0; step < durationSec; step++) {
      if (step === 30) state = injectDisruption(state, 'DEMAND_SURGE');
      if (step === 90) state = injectDisruption(state, 'AMR_FAILURE');
      if (step === 150) state = injectDisruption(state, 'COMM_DELAY');
      state = stepSimulation(state, 1.0);
    }

    results.push({
      variantId,
      name: preset.name,
      description: preset.description,
      starvationEvents: state.metrics.totalStarvationEvents,
      starvationDurationMin: Math.round((state.metrics.totalStarvationDurationSec / 60) * 10) / 10,
      productionLossMin: Math.round(state.metrics.productionLossMinutes * 10) / 10,
      onTimePct: state.metrics.onTimeDeliveryRatePct,
    });
  }

  return results;
}

export function runScalabilityBenchmark(seed: number = 82731): ScalabilityResult[] {
  const fleetSizes = [10, 25, 50, 100];
  const results: ScalabilityResult[] = [];

  for (const size of fleetSizes) {
    const startTime = performance.now();
    let state = createInitialSimulationState(seed, 'LINEGUARD', size);

    for (let i = 0; i < 40; i++) {
      if (i === 8) state = injectDisruption(state, 'DEMAND_SURGE');
      state = stepSimulation(state, 1.0);
    }
    const elapsedMs = performance.now() - startTime;
    const avgStepLatencyMs = Math.round((elapsedMs / 40) * 100) / 100;
    const completed = state.metrics.completedDeliveriesCount;
    const announced = state.tasks.length;
    const completionPct = announced > 0 ? Math.round((completed / announced) * 1000) / 10 : 100;

    results.push({
      fleetSize: size,
      decisionLatencyMs: avgStepLatencyMs,
      messagesPerMinute: Math.round(state.metrics.messagesExchangedCount * (60 / Math.max(1, state.simTimeSec))),
      taskCompletionRatePct: completionPct,
      starvationEventsCount: state.metrics.totalStarvationEvents,
    });
  }

  return results;
}
