import React, { useState } from 'react';
import { useSimulation } from '../context/SimulationContext';
import { runBaselineBenchmark } from '../services/baselineRunner';
import { fetchBaselineBenchmark } from '../services/api';
import { PolicyBenchmarkResult } from '../models/types';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import {
  BarChart3,
  Play,
  RotateCcw,
  CheckCircle2,
  TrendingDown,
  DollarSign,
  Clock,
  Sparkles,
  Zap,
} from 'lucide-react';

export const BaselineComparisonPage: React.FC = () => {
  const { state } = useSimulation();
  const [benchmarkResults, setBenchmarkResults] = useState<PolicyBenchmarkResult[]>([]);
  const [isRunning, setIsRunning] = useState<boolean>(false);

  const handleRunBenchmark = () => {
    setIsRunning(true);
    setTimeout(async () => {
      try {
        const results = await fetchBaselineBenchmark(state.seed, 240);
        setBenchmarkResults(results);
      } catch {
        setBenchmarkResults(runBaselineBenchmark(state.seed, 240));
      } finally {
        setIsRunning(false);
      }
    }, 50);
  };

  const lineguard = benchmarkResults.find((r) => r.policy === 'LINEGUARD');
  const nearest = benchmarkResults.find((r) => r.policy === 'NEAREST_AMR');

  const savingsUSD = (nearest?.productionLossCostUSD || 0) - (lineguard?.productionLossCostUSD || 0);

  // Chart data formatting
  const starvationChartData = benchmarkResults.map((r) => ({
    name: r.policy === 'LINEGUARD' ? '★ LineGuard' : r.policy.replace('_', ' '),
    starvationMin: r.totalStarvationDurationMin,
    costUSD: r.productionLossCostUSD,
  }));

  const onTimeChartData = benchmarkResults.map((r) => ({
    name: r.policy === 'LINEGUARD' ? '★ LineGuard' : r.policy.replace('_', ' '),
    onTimePct: r.onTimeDeliveryPct,
    avgDelay: r.averageDeliveryDelaySec,
  }));

  return (
    <div className="p-4 space-y-5 max-w-[1600px] mx-auto text-slate-100 select-none">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg">
        <div>
          <h2 className="text-sm font-bold font-mono text-cyan-400 uppercase tracking-wider flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Head-to-Head Baseline Comparison (Same Seed: {state.seed})
          </h2>
          <p className="text-xs text-slate-400">
            Empirical benchmark comparing LineGuard against standard industrial allocation baselines under identical disruption sequences.
          </p>
        </div>

        <button
          onClick={handleRunBenchmark}
          disabled={isRunning}
          className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-mono font-bold text-xs flex items-center gap-2 shadow-lg shadow-cyan-600/20 transition-all cursor-pointer"
        >
          {isRunning ? <RotateCcw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-white" />}
          <span>{isRunning ? 'Simulating 240s Matrix...' : 'Run Seed Benchmark'}</span>
        </button>
      </div>

      {benchmarkResults.length > 0 && (
      <>
      {/* Hero Impact Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-emerald-950/40 to-slate-900 border border-emerald-500/40 rounded-xl p-4 shadow-xl">
          <div className="flex items-center justify-between text-xs text-emerald-400 font-mono font-bold mb-1">
            <span>DOWNTIME ELIMINATION</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-black font-mono text-white">
            {nearest && lineguard
              ? `${lineguard.starvationEvents === 0 && nearest.starvationEvents > 0 ? '-100%' : `${lineguard.starvationEvents - nearest.starvationEvents} events`} Starvation`
              : '—'}
          </div>
          <p className="text-xs text-slate-300 mt-1">
            LineGuard recorded {lineguard?.starvationEvents ?? '—'} starvation events vs {nearest?.starvationEvents ?? '—'} for Nearest-AMR on the same seed.
          </p>
        </div>

        <div className="bg-gradient-to-br from-cyan-950/40 to-slate-900 border border-cyan-500/40 rounded-xl p-4 shadow-xl">
          <div className="flex items-center justify-between text-xs text-cyan-400 font-mono font-bold mb-1">
            <span>FINANCIAL SAVINGS</span>
            <DollarSign className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-3xl font-black font-mono text-white">
            +${savingsUSD.toLocaleString()} USD
          </div>
          <p className="text-xs text-slate-300 mt-1">
            Calculated at standard automotive assembly stoppage rate of $1,400 per halted line-minute.
          </p>
        </div>

        <div className="bg-gradient-to-br from-indigo-950/40 to-slate-900 border border-indigo-500/40 rounded-xl p-4 shadow-xl">
          <div className="flex items-center justify-between text-xs text-indigo-400 font-mono font-bold mb-1">
            <span>FAILOVER RESILIENCY</span>
            <Clock className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-3xl font-black font-mono text-white">
            {lineguard && nearest
              ? `${lineguard.recoveryTimeSec.toFixed(1)}s vs ${nearest.recoveryTimeSec.toFixed(1)}s`
              : '—'}
          </div>
          <p className="text-xs text-slate-300 mt-1">
            Mean time from AMR failure to re-assignment via hot-standby or decentralized re-auction.
          </p>
        </div>
      </div>

      {/* Comparative Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Chart 1: Starvation Duration (Min) */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-xl space-y-3">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="font-bold text-white uppercase tracking-wider">
              Total Production Starvation Duration (Minutes)
            </span>
            <span className="text-emerald-400 font-bold">Lower is Better</span>
          </div>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={starvationChartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#090d16', borderColor: '#334155', borderRadius: '8px', fontSize: '11px', color: '#fff' }}
                />
                <Bar dataKey="starvationMin" fill="#06b6d4" name="Starvation Time (min)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: On-Time Delivery Rate (%) */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-xl space-y-3">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="font-bold text-white uppercase tracking-wider">
              On-Time Delivery Performance (%)
            </span>
            <span className="text-cyan-400 font-bold">Higher is Better</span>
          </div>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={onTimeChartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={10} domain={[50, 100]} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#090d16', borderColor: '#334155', borderRadius: '8px', fontSize: '11px', color: '#fff' }}
                />
                <Bar dataKey="onTimePct" fill="#10b981" name="On-Time Delivery %" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Comprehensive Empirical Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
        <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-300">
          Complete Multi-Metric Audit Matrix
        </h3>

        <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/60">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-3">Policy Name</th>
                <th className="py-2.5 px-3">Starvation Events</th>
                <th className="py-2.5 px-3">Starvation Min</th>
                <th className="py-2.5 px-3">On-Time %</th>
                <th className="py-2.5 px-3">Production Loss</th>
                <th className="py-2.5 px-3">Avg Delay</th>
                <th className="py-2.5 px-3">Recovery Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {benchmarkResults.map((r) => {
                const isLineGuard = r.policy === 'LINEGUARD';
                return (
                  <tr
                    key={r.policy}
                    className={`transition-colors ${
                      isLineGuard ? 'bg-cyan-950/30 text-white font-bold' : 'hover:bg-slate-800/30 text-slate-300'
                    }`}
                  >
                    <td className="py-2.5 px-3 flex items-center gap-1.5">
                      {isLineGuard && <Sparkles className="w-3.5 h-3.5 text-cyan-400" />}
                      <span>{r.policyName}</span>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className={r.starvationEvents === 0 ? 'text-emerald-400 font-bold' : 'text-rose-400'}>
                        {r.starvationEvents} events
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className={r.totalStarvationDurationMin === 0 ? 'text-emerald-400 font-bold' : 'text-rose-400'}>
                        {r.totalStarvationDurationMin} min
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-emerald-400 font-bold">{r.onTimeDeliveryPct}%</td>
                    <td className="py-2.5 px-3 font-bold">
                      <span className={r.productionLossCostUSD === 0 ? 'text-emerald-400' : 'text-amber-400'}>
                        ${r.productionLossCostUSD.toLocaleString()}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-400">{r.averageDeliveryDelaySec}s</td>
                    <td className="py-2.5 px-3 text-slate-400">{r.recoveryTimeSec}s</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      </>
      )}
    </div>
  );
};
