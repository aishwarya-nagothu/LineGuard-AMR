import React from 'react';
import { useSimulation } from '../context/SimulationContext';
import {
  Bot,
  Battery,
  Zap,
  Activity,
  AlertTriangle,
  RotateCcw,
  ShieldAlert,
  Radio,
  CheckCircle2,
} from 'lucide-react';

export const FleetPage: React.FC = () => {
  const { state, setSelectedAmrId, selectedAmrId, failSelectedAmr, recoverSelectedAmr } = useSimulation();

  return (
    <div className="p-4 space-y-5 max-w-[1600px] mx-auto text-slate-100 select-none">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg">
        <div>
          <h2 className="text-sm font-bold font-mono text-cyan-400 uppercase tracking-wider flex items-center gap-2">
            <Bot className="w-4 h-4" />
            Autonomous Mobile Robot (AMR) Fleet Status
          </h2>
          <p className="text-xs text-slate-400">
            Heterogeneous capabilities: Heavy-duty traction carriers (550kg payload) vs High-speed agile carriers (120kg payload).
          </p>
        </div>

        <div className="flex items-center space-x-3 text-xs font-mono">
          <span className="px-2.5 py-1 rounded bg-slate-800 text-slate-300 border border-slate-700">
            Total Fleet: {state.amrs.length} AMRs
          </span>
          <span className="px-2.5 py-1 rounded bg-indigo-950/60 text-indigo-300 border border-indigo-800/60">
            Heavy-Duty: {state.amrs.filter((a) => a.payloadCapability === 'HEAVY').length} Units
          </span>
          <span className="px-2.5 py-1 rounded bg-emerald-950/60 text-emerald-400 border border-emerald-800/60">
            Fleet Avg Battery: {state.metrics.fleetAverageBatteryPct}%
          </span>
        </div>
      </div>

      {/* AMR Fleet Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3.5">
        {state.amrs.map((amr) => {
          const isSelected = selectedAmrId === amr.id;
          const isHeavy = amr.payloadCapability === 'HEAVY';
          const isFailed = amr.health === 'FAILED';
          const isLowBattery = amr.batteryPct < 25;

          return (
            <div
              key={amr.id}
              onClick={() => setSelectedAmrId(amr.id)}
              className={`bg-slate-900 border rounded-xl p-3.5 shadow-lg space-y-3 cursor-pointer transition-all hover:border-slate-600 ${
                isSelected
                  ? 'border-cyan-400 ring-1 ring-cyan-400/50'
                  : isFailed
                  ? 'border-rose-500/60 bg-rose-950/20'
                  : 'border-slate-800'
              }`}
            >
              {/* Card Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-bold font-mono text-white">{amr.id}</span>
                  {isHeavy && (
                    <span className="text-[9px] px-1.5 py-0.2 rounded font-bold bg-indigo-500/30 text-indigo-300 border border-indigo-500/40">
                      HEAVY 550KG
                    </span>
                  )}
                </div>

                <span
                  className={`text-[9px] px-1.5 py-0.2 rounded font-mono font-bold ${
                    isFailed
                      ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                      : amr.state === 'DELIVERING'
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : amr.state === 'CHARGING'
                      ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {amr.state}
                </span>
              </div>

              {/* Battery Meter */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-400 flex items-center gap-1">
                    <Battery className="w-3.5 h-3.5 text-slate-400" /> Battery
                  </span>
                  <span
                    className={`font-bold ${
                      isLowBattery ? 'text-rose-400' : amr.batteryPct < 50 ? 'text-amber-400' : 'text-emerald-400'
                    }`}
                  >
                    {amr.batteryPct}%
                  </span>
                </div>
                <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      isLowBattery ? 'bg-rose-500' : amr.batteryPct < 50 ? 'bg-amber-500' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${amr.batteryPct}%` }}
                  />
                </div>
              </div>

              {/* State Details */}
              <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800/80 text-[11px] font-mono space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Comm Version:</span>
                  <span className="text-indigo-400">v{amr.stateVersion}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Coord:</span>
                  <span className="text-slate-300">({Math.round(amr.position.x)}, {Math.round(amr.position.y)})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Current Task:</span>
                  <span className="text-cyan-300 font-bold truncate">{amr.currentTaskId || 'Idle'}</span>
                </div>
              </div>

              {/* Fault Injection Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (amr.health === 'FAILED') recoverSelectedAmr(amr.id);
                  else failSelectedAmr(amr.id);
                }}
                className={`w-full py-1 rounded text-[10px] font-mono font-bold transition-colors ${
                  isFailed
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                    : 'bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/50'
                }`}
              >
                {isFailed ? 'Clear Fault / Reboot AMR' : 'Inject E-Stop Fault'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
