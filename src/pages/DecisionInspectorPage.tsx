import React, { useState } from 'react';
import { useSimulation } from '../context/SimulationContext';
import {
  Search,
  CheckCircle2,
  XCircle,
  HelpCircle,
  TrendingDown,
  ShieldAlert,
  ArrowRight,
  Filter,
} from 'lucide-react';

export const DecisionInspectorPage: React.FC = () => {
  const { state, setSelectedTaskId } = useSimulation();
  const [selectedDecisionId, setSelectedDecisionId] = useState<string | null>(null);

  const decisions = state.recentDecisions;
  const activeDecision =
    decisions.find((d) => d.taskId === selectedDecisionId) || decisions[0];

  return (
    <div className="p-4 space-y-5 max-w-[1600px] mx-auto text-slate-100 select-none">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg">
        <div>
          <h2 className="text-sm font-bold font-mono text-cyan-400 uppercase tracking-wider flex items-center gap-2">
            <Search className="w-4 h-4" />
            Explainable Decision Inspector & Counterfactual Audit
          </h2>
          <p className="text-xs text-slate-400">
            Every task allocation is completely explainable, reproducible, and grounded in multi-factor trade-offs.
          </p>
        </div>

        <div className="text-xs font-mono text-slate-400">
          Audited Decisions: <span className="text-cyan-400 font-bold">{decisions.length} recorded</span>
        </div>
      </div>

      {decisions.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center text-slate-400 text-xs">
          No allocation decisions logged yet. Simulation will trigger auctions when buffers deplete below threshold.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Left List of Decisions (4 cols) */}
          <div className="lg:col-span-4 space-y-2">
            <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-400">
              Contract Decisions History
            </h3>

            <div className="space-y-2 max-h-[680px] overflow-y-auto pr-1">
              {decisions.map((dec) => {
                const isSelected = (activeDecision?.taskId === dec.taskId);
                return (
                  <div
                    key={dec.taskId}
                    onClick={() => setSelectedDecisionId(dec.taskId)}
                    className={`p-3 rounded-xl border text-xs font-mono cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-slate-900 border-cyan-500 shadow-md shadow-cyan-500/10'
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-white">{dec.taskId}</span>
                      <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold text-[10px]">
                        Awarded: {dec.selectedAmrId}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-400">
                      Destination: <span className="text-slate-200">{dec.stationName}</span>
                    </div>
                    <div className="text-[10px] text-slate-500 mt-1 truncate">
                      {dec.tradeOffSummary}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Decision Audit Panel (8 cols) */}
          {activeDecision && (
            <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-5">
              {/* Decision Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-black font-mono text-white">
                      CONTRACT AWARD: {activeDecision.taskId}
                    </h3>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-900/40 text-cyan-300 border border-cyan-700/50 font-mono">
                      {activeDecision.componentName}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Target Station: <span className="text-slate-200 font-semibold">{activeDecision.stationName}</span>
                  </p>
                </div>

                <div className="text-right">
                  <span className="text-xs font-mono text-slate-400 block">Selected AMR</span>
                  <span className="text-lg font-black font-mono text-emerald-400">
                    {activeDecision.selectedAmrId}
                  </span>
                </div>
              </div>

              {/* Rationale Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Why Selected AMR */}
                <div className="bg-emerald-950/20 border border-emerald-500/40 rounded-xl p-4 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 font-mono">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>WHY {activeDecision.selectedAmrId}?</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed font-sans">
                    {activeDecision.explanation}
                  </p>
                </div>

                {/* Why Not Runner-Up */}
                {activeDecision.runnerUpAmrId ? (
                  <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-2">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400 font-mono">
                      <TrendingDown className="w-4 h-4" />
                      <span>WHY NOT {activeDecision.runnerUpAmrId}?</span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed font-sans">
                      {activeDecision.counterfactual}
                    </p>
                  </div>
                ) : (
                  <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 flex items-center justify-center text-xs text-slate-500">
                    No runner-up passed all feasibility gates.
                  </div>
                )}
              </div>

              {/* Trade-off summary banner */}
              <div className="p-3 rounded-lg bg-blue-950/30 border border-blue-800/40 text-xs font-mono text-blue-200 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>
                  <strong>Global Trade-Off:</strong> {activeDecision.tradeOffSummary}
                </span>
              </div>

              {/* Complete Candidate Bids Table */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-400">
                  Full Auction Candidate Scorecard
                </h4>

                <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/60">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                      <tr>
                        <th className="py-2.5 px-3">Candidate</th>
                        <th className="py-2.5 px-3">Gate Status</th>
                        <th className="py-2.5 px-3">ETA</th>
                        <th className="py-2.5 px-3">Loss L(a,i)</th>
                        <th className="py-2.5 px-3">Energy</th>
                        <th className="py-2.5 px-3">Collateral Φ</th>
                        <th className="py-2.5 px-3">Total Bid Score</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {activeDecision.candidates.map((cand) => {
                        const isWinner = cand.amrId === activeDecision.selectedAmrId;
                        return (
                          <tr
                            key={cand.amrId}
                            className={isWinner ? 'bg-emerald-950/30 font-bold text-white' : 'hover:bg-slate-800/30'}
                          >
                            <td className="py-2 px-3 flex items-center gap-1">
                              {isWinner && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                              <span>{cand.amrId}</span>
                            </td>
                            <td className="py-2 px-3">
                              {cand.eligible ? (
                                <span className="text-emerald-400">PASSED</span>
                              ) : (
                                <span className="text-rose-400 text-[11px] truncate block max-w-xs" title={cand.ineligibleReason}>
                                  {cand.ineligibleReason}
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
          )}
        </div>
      )}
    </div>
  );
};
