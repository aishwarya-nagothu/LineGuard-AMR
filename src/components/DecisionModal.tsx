import React from 'react';
import { useSimulation } from '../context/SimulationContext';
import {
  X,
  CheckCircle2,
  XCircle,
  HelpCircle,
  TrendingDown,
  ShieldAlert,
  ArrowRight,
  Battery,
  Clock,
  Zap,
} from 'lucide-react';

export const DecisionModal: React.FC = () => {
  const { selectedTaskId, setSelectedTaskId, state } = useSimulation();

  if (!selectedTaskId) return null;

  const task = state.tasks.find((t) => t.id === selectedTaskId);
  const decision = task?.decisionTrace || state.recentDecisions.find((d) => d.taskId === selectedTaskId);
  const station = state.stations.find((s) => s.id === task?.stationId);

  if (!task && !decision) {
    return (
      <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-md w-full text-slate-100">
          <p className="text-sm text-slate-400">Task details not found.</p>
          <button
            onClick={() => setSelectedTaskId(null)}
            className="mt-4 px-4 py-2 bg-slate-800 rounded text-xs"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  const selectedAmr = state.amrs.find((a) => a.id === decision?.selectedAmrId);
  const runnerUp = decision?.runnerUpBid;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto select-none">
      <div className="bg-slate-900 border border-cyan-500/40 rounded-2xl max-w-4xl w-full text-slate-100 shadow-2xl overflow-hidden flex flex-col my-8">
        {/* Header */}
        <div className="bg-slate-950 px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 flex items-center justify-center">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-bold font-mono text-white">
                  DECISION INSPECTOR: {decision?.taskId || task?.id}
                </h2>
                <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-900/40 text-cyan-300 border border-cyan-700/50 font-mono">
                  {decision?.componentName || station?.componentName}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Destination: <span className="text-slate-200 font-semibold">{decision?.stationName || station?.name}</span> (Criticality c = {station?.criticality})
              </p>
            </div>
          </div>

          <button
            onClick={() => setSelectedTaskId(null)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 overflow-y-auto max-h-[75vh]">
          {/* Winner Showcase Banner */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Selected AMR Card */}
            <div className="bg-gradient-to-br from-emerald-950/40 to-slate-900 border border-emerald-500/40 rounded-xl p-4 shadow-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5 font-mono">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  SELECTED CONTRACTOR
                </span>
                <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono font-bold">
                  Score: {decision?.selectedBid?.totalScore ?? 'N/A'} (Lowest)
                </span>
              </div>
              <div className="text-2xl font-black font-mono text-white mb-1">
                {decision?.selectedAmrId || 'NONE'}
              </div>
              <div className="text-xs text-slate-300 space-y-1 mt-2">
                <div className="flex justify-between">
                  <span className="text-slate-400">ETA to Station:</span>
                  <span className="font-mono font-bold text-emerald-300">{decision?.selectedBid?.etaSec}s</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Collateral Downstream Risk:</span>
                  <span className="font-mono font-bold text-emerald-400">
                    {decision?.selectedBid?.collateralRisk} (Low)
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Battery Level:</span>
                  <span className="font-mono text-slate-200">
                    {selectedAmr?.batteryPct}% (Required: {decision?.selectedBid?.breakdown?.requiredEnergyPct}%)
                  </span>
                </div>
              </div>
            </div>

            {/* Runner-Up / Counterfactual Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 font-mono">
                  <TrendingDown className="w-4 h-4 text-slate-500" />
                  RUNNER-UP CANDIDATE
                </span>
                <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                  Score: {runnerUp?.totalScore ?? 'N/A'}
                </span>
              </div>
              <div className="text-xl font-bold font-mono text-slate-300 mb-1">
                {decision?.runnerUpAmrId || 'None'}
              </div>
              {runnerUp ? (
                <div className="text-xs text-slate-300 space-y-1 mt-2">
                  <div className="flex justify-between">
                    <span className="text-slate-400">ETA to Station:</span>
                    <span className="font-mono text-cyan-300">{runnerUp.etaSec}s</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Collateral Downstream Risk:</span>
                    <span className="font-mono text-rose-400 font-bold">
                      {runnerUp.collateralRisk} (High Penalty)
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Exposed Station:</span>
                    <span className="text-amber-400 font-semibold">
                      {runnerUp.breakdown?.downstreamStationRiskName || 'Motor Assembly'}
                    </span>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-500 mt-2">No other candidate passed feasibility gates.</p>
              )}
            </div>
          </div>

          {/* Explainable Counterfactual Reasoning Section */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-5 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-400 font-mono flex items-center gap-2">
              <ShieldAlert className="w-4 h-4" />
              Counterfactual Rationale (Global Factory Optimization)
            </h3>

            <div className="space-y-3 text-xs leading-relaxed">
              <div className="bg-slate-900/90 p-3 rounded-lg border border-slate-800">
                <span className="font-bold text-white block mb-1">
                  Why {decision?.selectedAmrId}?
                </span>
                <p className="text-slate-300">{decision?.explanation}</p>
              </div>

              {decision?.runnerUpAmrId && (
                <div className="bg-slate-900/90 p-3 rounded-lg border border-slate-800">
                  <span className="font-bold text-amber-300 block mb-1">
                    Why NOT {decision.runnerUpAmrId}?
                  </span>
                  <p className="text-slate-300">{decision.counterfactual}</p>
                </div>
              )}

              <div className="bg-blue-950/20 p-3 rounded-lg border border-blue-800/40 text-blue-200">
                <span className="font-bold text-blue-400 block mb-1">Trade-off Summary:</span>
                <p>{decision?.tradeOffSummary}</p>
              </div>
            </div>
          </div>

          {/* Full Candidate Scorecard Table */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
              Decentralized Bids & Feasibility Gate Audit
            </h3>

            <div className="border border-slate-800 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="py-2.5 px-3">AMR</th>
                    <th className="py-2.5 px-3">Feasibility Gate</th>
                    <th className="py-2.5 px-3">ETA</th>
                    <th className="py-2.5 px-3">Loss L(a,i)</th>
                    <th className="py-2.5 px-3">Energy Cost</th>
                    <th className="py-2.5 px-3">Congestion</th>
                    <th className="py-2.5 px-3">Collateral Φ</th>
                    <th className="py-2.5 px-3">Total Bid B(a,i)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 bg-slate-900/60">
                  {decision?.candidates.map((cand) => {
                    const isWinner = cand.amrId === decision.selectedAmrId;
                    return (
                      <tr
                        key={cand.amrId}
                        className={`transition-colors ${
                          isWinner ? 'bg-emerald-950/30 text-white font-bold' : 'hover:bg-slate-800/30'
                        }`}
                      >
                        <td className="py-2 px-3 flex items-center gap-1.5">
                          {isWinner && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                          <span>{cand.amrId}</span>
                        </td>
                        <td className="py-2 px-3">
                          {cand.eligible ? (
                            <span className="text-emerald-400">PASSED</span>
                          ) : (
                            <span className="text-rose-400 text-[11px]" title={cand.ineligibleReason}>
                              {cand.ineligibleReason?.slice(0, 32)}...
                            </span>
                          )}
                        </td>
                        <td className="py-2 px-3 text-slate-300">
                          {cand.eligible ? `${cand.etaSec}s` : '—'}
                        </td>
                        <td className="py-2 px-3 text-slate-300">
                          {cand.eligible ? cand.lossIfDelayed : '—'}
                        </td>
                        <td className="py-2 px-3 text-slate-300">
                          {cand.eligible ? cand.energyCost : '—'}
                        </td>
                        <td className="py-2 px-3 text-slate-300">
                          {cand.eligible ? `${cand.congestionDelaySec}s` : '—'}
                        </td>
                        <td
                          className={`py-2 px-3 ${
                            cand.collateralRisk > 1.5 ? 'text-rose-400 font-bold' : 'text-slate-300'
                          }`}
                        >
                          {cand.eligible ? cand.collateralRisk : '—'}
                        </td>
                        <td className="py-2 px-3">
                          {cand.eligible ? (
                            <span
                              className={`px-1.5 py-0.5 rounded ${
                                isWinner
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                  : 'text-slate-400'
                              }`}
                            >
                              {cand.totalScore}
                            </span>
                          ) : (
                            <span className="text-slate-600">INELIGIBLE</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-950 px-6 py-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 font-mono">
          <span>Objective Formula: B(a,i) = L(a,i) + λE·Energy + λC·Congestion + Φ(a,i) + Ω_scarcity</span>
          <button
            onClick={() => setSelectedTaskId(null)}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-sans transition-colors cursor-pointer"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
};
