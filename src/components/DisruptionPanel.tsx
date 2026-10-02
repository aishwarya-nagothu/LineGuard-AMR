import React from 'react';
import { useSimulation } from '../context/SimulationContext';
import {
  Flame,
  AlertTriangle,
  WifiOff,
  Wifi,
  Clock,
  BatteryLow,
  ShieldX,
  Construction,
} from 'lucide-react';

export const DisruptionPanel: React.FC = () => {
  const { triggerDisruptionAction, state } = useSimulation();

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-slate-100 shadow-xl space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 font-mono flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-400" />
          WHAT-IF DISRUPTION INJECTOR (STRESS-TESTING)
        </h3>
        <span className="text-[11px] text-slate-400 font-mono">Dynamic Resiliency Engine</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {/* Demand Surge */}
        <button
          onClick={() => triggerDisruptionAction('DEMAND_SURGE')}
          className="p-2.5 rounded-lg bg-slate-950 hover:bg-amber-950/40 border border-slate-800 hover:border-amber-500/50 text-left transition-all group cursor-pointer"
        >
          <div className="flex items-center gap-2 text-amber-400 font-semibold text-xs mb-1">
            <Flame className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
            <span>Demand Surge</span>
          </div>
          <p className="text-[10px] text-slate-400 leading-tight">
            +80% EV SUV & Colossus Truck battery/motor draw.
          </p>
        </button>

        {/* AMR Failure */}
        <button
          onClick={() => triggerDisruptionAction('AMR_FAILURE')}
          className="p-2.5 rounded-lg bg-slate-950 hover:bg-rose-950/40 border border-slate-800 hover:border-rose-500/50 text-left transition-all group cursor-pointer"
        >
          <div className="flex items-center gap-2 text-rose-400 font-semibold text-xs mb-1">
            <AlertTriangle className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
            <span>AMR Hardware Fault</span>
          </div>
          <p className="text-[10px] text-slate-400 leading-tight">
            Triggers e-stop fault; generates stranded cargo rescue.
          </p>
        </button>

        {/* Communication Delay */}
        <button
          onClick={() => triggerDisruptionAction('COMM_DELAY')}
          className="p-2.5 rounded-lg bg-slate-950 hover:bg-cyan-950/40 border border-slate-800 hover:border-cyan-500/50 text-left transition-all group cursor-pointer"
        >
          <div className="flex items-center gap-2 text-cyan-400 font-semibold text-xs mb-1">
            <Clock className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
            <span>Network Latency</span>
          </div>
          <p className="text-[10px] text-slate-400 leading-tight">
            Induces 3.2s network lag & state version skew.
          </p>
        </button>

        {/* Communication Loss */}
        <button
          onClick={() => triggerDisruptionAction('COMM_LOSS')}
          className="p-2.5 rounded-lg bg-slate-950 hover:bg-purple-950/40 border border-slate-800 hover:border-purple-500/50 text-left transition-all group cursor-pointer"
        >
          <div className="flex items-center gap-2 text-purple-400 font-semibold text-xs mb-1">
            <WifiOff className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
            <span>Partial Comm Loss</span>
          </div>
          <p className="text-[10px] text-slate-400 leading-tight">
            Blackout AP; AMRs use stale cache & σ_eff margins.
          </p>
        </button>

        {/* Corridor Obstruction */}
        <button
          onClick={() => triggerDisruptionAction('AISLE_BLOCK')}
          className="p-2.5 rounded-lg bg-slate-950 hover:bg-amber-950/40 border border-slate-800 hover:border-amber-500/50 text-left transition-all group cursor-pointer"
        >
          <div className="flex items-center gap-2 text-amber-400 font-semibold text-xs mb-1">
            <Construction className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
            <span>Corridor Blocked</span>
          </div>
          <p className="text-[10px] text-slate-400 leading-tight">
            Blocks Aisle B; tests rerouting & congestion delays.
          </p>
        </button>

        {/* Fleet Low Battery */}
        <button
          onClick={() => triggerDisruptionAction('LOW_BATTERY')}
          className="p-2.5 rounded-lg bg-slate-950 hover:bg-orange-950/40 border border-slate-800 hover:border-orange-500/50 text-left transition-all group cursor-pointer"
        >
          <div className="flex items-center gap-2 text-orange-400 font-semibold text-xs mb-1">
            <BatteryLow className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
            <span>Low Battery Fleet</span>
          </div>
          <p className="text-[10px] text-slate-400 leading-tight">
            Drains fleet to ~20%; tests energy feasibility gates.
          </p>
        </button>

        {/* Heavy AMR Depletion */}
        <button
          onClick={() => triggerDisruptionAction('HEAVY_UNAVAILABLE')}
          className="p-2.5 rounded-lg bg-slate-950 hover:bg-rose-950/40 border border-slate-800 hover:border-rose-500/50 text-left transition-all group cursor-pointer"
        >
          <div className="flex items-center gap-2 text-rose-400 font-semibold text-xs mb-1">
            <ShieldX className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
            <span>Heavy AMR Scarcity</span>
          </div>
          <p className="text-[10px] text-slate-400 leading-tight">
            Forces extreme capability scarcity & explicit triage.
          </p>
        </button>

        {/* Restore Comm Nominal */}
        <button
          onClick={() => triggerDisruptionAction('COMM_RESTORE')}
          className="p-2.5 rounded-lg bg-slate-950 hover:bg-emerald-950/40 border border-slate-800 hover:border-emerald-500/50 text-left transition-all group cursor-pointer"
        >
          <div className="flex items-center gap-2 text-emerald-400 font-semibold text-xs mb-1">
            <Wifi className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
            <span>Restore Nominal</span>
          </div>
          <p className="text-[10px] text-slate-400 leading-tight">
            Re-establishes low-latency 5G mesh connectivity.
          </p>
        </button>
      </div>
    </div>
  );
};
