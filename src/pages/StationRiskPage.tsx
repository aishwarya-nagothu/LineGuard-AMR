import React from 'react';
import { useSimulation } from '../context/SimulationContext';
import {
  AlertOctagon,
  TrendingDown,
  Clock,
  ShieldAlert,
  Info,
  Layers,
  ArrowRight,
} from 'lucide-react';

export const StationRiskPage: React.FC = () => {
  const { state, setSelectedStationId, setSelectedTaskId } = useSimulation();

  return (
    <div className="p-4 space-y-5 max-w-[1600px] mx-auto text-slate-100 select-none">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg">
        <div>
          <h2 className="text-sm font-bold font-mono text-cyan-400 uppercase tracking-wider flex items-center gap-2">
            <AlertOctagon className="w-4 h-4" />
            Uncertainty-Aware Starvation Risk Analytics
          </h2>
          <p className="text-xs text-slate-400">
            Formulation: TTS_δ = I / (μ + z_δ · σ_eff) where σ_eff² = σ² + (κ · age)². Incorporates information staleness and downstream production criticality.
          </p>
        </div>

        <div className="flex items-center space-x-3 text-xs font-mono">
          <span className="px-2.5 py-1 rounded bg-rose-950/60 text-rose-400 border border-rose-800/60">
            Stations Starved: {state.stations.filter((s) => s.isStarved).length}
          </span>
          <span className="px-2.5 py-1 rounded bg-amber-950/60 text-amber-400 border border-amber-800/60">
            At-Risk (&lt;50s): {state.stations.filter((s) => s.predictedStockoutSec < 50).length}
          </span>
        </div>
      </div>

      {/* Mathematical Principle Formulation Card */}
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 border border-cyan-500/30 rounded-xl p-4 shadow-xl space-y-2 text-xs font-mono">
        <div className="flex items-center gap-2 text-cyan-300 font-bold uppercase tracking-wider">
          <Info className="w-4 h-4 text-cyan-400" />
          <span>Core Mathematical Model & Starvation Prediction</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1 text-slate-300">
          <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
            <span className="text-cyan-400 font-bold block mb-1">1. Effective Uncertainty:</span>
            <code>σ_eff = √(σ² + (κ · staleness_age)²)</code>
            <p className="text-[10px] text-slate-400 mt-1 font-sans">
              As shopfloor communication degrades or packets delay, information age inflates buffer safety margins.
            </p>
          </div>
          <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
            <span className="text-emerald-400 font-bold block mb-1">2. Predicted Stockout (TTS_δ):</span>
            <code>TTS_δ = I / (μ + z_δ · σ_eff)</code>
            <p className="text-[10px] text-slate-400 mt-1 font-sans">
              Calculates 90% confidence conservative lower-bound time until zero inventory buffer is reached.
            </p>
          </div>
          <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
            <span className="text-amber-400 font-bold block mb-1">3. Slack Margin & Criticality:</span>
            <code>Slack = TTS_δ - ETA(a, i)</code>
            <p className="text-[10px] text-slate-400 mt-1 font-sans">
              Positive slack = AMR arrives safely before starvation. Negative slack = expected production loss L(a,i) = c_i · |Slack|.
            </p>
          </div>
        </div>
      </div>

      {/* Station Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {state.stations.map((st) => {
          const isCritical = st.criticality >= 0.9;
          const isAtRisk = st.predictedStockoutSec < 50;
          const isStarved = st.isStarved;

          // Find active delivery AMR if any
          const activeTask = state.tasks.find(
            (t) => t.stationId === st.id && (t.status === 'ASSIGNED' || t.status === 'IN_TRANSIT')
          );

          // Slack calculation
          const slack = activeTask ? Math.round(st.slackSec) : null;

          return (
            <div
              key={st.id}
              className={`bg-slate-900 border rounded-xl p-4 shadow-xl space-y-3.5 transition-all ${
                isStarved
                  ? 'border-rose-500/80 bg-gradient-to-br from-rose-950/40 to-slate-900'
                  : isAtRisk
                  ? 'border-amber-500/60 bg-gradient-to-br from-amber-950/30 to-slate-900'
                  : 'border-slate-800'
              }`}
            >
              {/* Station Card Header */}
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs px-2 py-0.5 rounded font-mono font-bold bg-slate-800 text-slate-300">
                      {st.code}
                    </span>
                    <h3 className="text-sm font-bold font-mono text-white">{st.name}</h3>
                  </div>
                  <span className="text-[11px] text-slate-400 mt-0.5 block">{st.componentName}</span>
                </div>

                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block font-mono">Criticality</span>
                  <span
                    className={`text-xs font-bold font-mono px-2 py-0.5 rounded ${
                      isCritical ? 'bg-pink-500/20 text-pink-300 border border-pink-500/40' : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    c = {st.criticality}
                  </span>
                </div>
              </div>

              {/* Buffer Stock Bar */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-400">Inventory Buffer</span>
                  <span className="text-white font-bold">
                    {st.currentInventory.toFixed(1)} / {st.maxBuffer} units
                  </span>
                </div>
                <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      isStarved
                        ? 'bg-rose-500'
                        : isAtRisk
                        ? 'bg-amber-500'
                        : 'bg-cyan-500'
                    }`}
                    style={{ width: `${Math.min(100, (st.currentInventory / st.maxBuffer) * 100)}%` }}
                  />
                </div>
              </div>

              {/* Key Metrics Breakdown */}
              <div className="grid grid-cols-2 gap-2 text-xs font-mono bg-slate-950/70 p-3 rounded-lg border border-slate-800/80">
                <div>
                  <span className="text-slate-500 block text-[10px]">PREDICTED STOCKOUT (TTS)</span>
                  <span
                    className={`font-bold text-sm ${
                      isStarved ? 'text-rose-400' : isAtRisk ? 'text-amber-400' : 'text-emerald-400'
                    }`}
                  >
                    {Math.round(st.predictedStockoutSec)} sec
                  </span>
                </div>

                <div>
                  <span className="text-slate-500 block text-[10px]">STARVATION PROBABILITY</span>
                  <span
                    className={`font-bold text-sm ${
                      st.starvationProbability > 0.4 ? 'text-rose-400' : 'text-slate-300'
                    }`}
                  >
                    {Math.round(st.starvationProbability * 100)}%
                  </span>
                </div>

                <div>
                  <span className="text-slate-500 block text-[10px]">CONSUMPTION RATE μ</span>
                  <span className="text-cyan-300 font-semibold">{st.consumptionRate.toFixed(3)} units/s</span>
                </div>

                <div>
                  <span className="text-slate-500 block text-[10px]">INFO AGE / STALENESS</span>
                  <span className={st.stalenessAgeSec > 5 ? 'text-amber-400 font-bold' : 'text-slate-400'}>
                    {st.stalenessAgeSec.toFixed(1)}s age
                  </span>
                </div>
              </div>

              {/* Slack & In-Transit Delivery Info */}
              {activeTask ? (
                <div className="p-2.5 rounded-lg bg-emerald-950/20 border border-emerald-500/40 text-xs font-mono flex items-center justify-between">
                  <div>
                    <span className="text-emerald-300 font-bold block">Assigned: {activeTask.assignedAmrId}</span>
                    <span className="text-[10px] text-slate-400">{activeTask.id} In Transit</span>
                  </div>

                  {slack !== null && (
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block">Slack Margin</span>
                      <span className={`font-bold ${slack >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {slack >= 0 ? `+${slack}s (Safe)` : `${slack}s (Risk)`}
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-2 rounded bg-slate-950/40 border border-slate-800 text-[11px] font-mono text-slate-500 text-center">
                  No delivery active · Inventory replenished
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
