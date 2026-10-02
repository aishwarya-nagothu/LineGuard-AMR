import React from 'react';
import { useSimulation } from '../context/SimulationContext';
import {
  CheckSquare,
  Clock,
  ShieldCheck,
  AlertTriangle,
  HelpCircle,
  ShieldAlert,
  ArrowRight,
  Package,
} from 'lucide-react';

export const TasksPage: React.FC = () => {
  const { state, setSelectedTaskId } = useSimulation();

  const activeTasks = state.tasks.filter(
    (t) => t.status === 'ASSIGNED' || t.status === 'IN_TRANSIT' || t.status === 'PENDING_AUCTION'
  );
  const completedTasks = state.tasks.filter((t) => t.status === 'DELIVERED');

  return (
    <div className="p-4 space-y-5 max-w-[1600px] mx-auto text-slate-100 select-none">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg">
        <div>
          <h2 className="text-sm font-bold font-mono text-cyan-400 uppercase tracking-wider flex items-center gap-2">
            <CheckSquare className="w-4 h-4" />
            Live Delivery Contracts & Leases
          </h2>
          <p className="text-xs text-slate-400">
            Decentralized task auctions, dynamic 16s contract leases, hot standby protection, and stranded cargo rescue operations.
          </p>
        </div>

        <div className="flex items-center space-x-3 text-xs font-mono">
          <span className="px-2.5 py-1 rounded bg-cyan-950/60 text-cyan-400 border border-cyan-800/60">
            Active Contracts: {activeTasks.length}
          </span>
          <span className="px-2.5 py-1 rounded bg-emerald-950/60 text-emerald-400 border border-emerald-800/60">
            Completed Deliveries: {completedTasks.length}
          </span>
        </div>
      </div>

      {/* Active Tasks Grid */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-300">
          In-Flight Tasks ({activeTasks.length})
        </h3>

        {activeTasks.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center text-slate-400 text-xs">
            All station buffers are currently satisfied. Monitoring dynamic stockout consumption.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeTasks.map((task) => {
              const station = state.stations.find((s) => s.id === task.stationId);
              const assignedAmr = state.amrs.find((a) => a.id === task.assignedAmrId);
              const leaseRemaining = task.lease
                ? Math.max(0, Math.round(task.lease.expiresAtSimTime - state.simTimeSec))
                : 0;

              return (
                <div
                  key={task.id}
                  className={`bg-slate-900 border rounded-xl p-4 shadow-xl space-y-3 transition-all ${
                    task.isRescue
                      ? 'border-rose-500/60 bg-gradient-to-br from-rose-950/30 to-slate-900'
                      : task.urgencyLevel === 'CRITICAL'
                      ? 'border-amber-500/50'
                      : 'border-slate-800'
                  }`}
                >
                  {/* Task Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold font-mono text-white">{task.id}</span>
                      {task.isRescue && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded font-bold bg-rose-500 text-white font-mono animate-pulse">
                          RESCUE TASK
                        </span>
                      )}
                    </div>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold ${
                        task.urgencyLevel === 'CRITICAL'
                          ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      }`}
                    >
                      {task.urgencyLevel}
                    </span>
                  </div>

                  {/* Destination & Component */}
                  <div className="bg-slate-950/70 p-2.5 rounded-lg border border-slate-800 text-xs font-mono space-y-1">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Destination:</span>
                      <span className="text-cyan-300 font-bold">{station?.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Component:</span>
                      <span className="text-slate-300">{station?.componentName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Payload Class:</span>
                      <span className={task.payloadRequirement === 'HEAVY' ? 'text-indigo-400 font-bold' : 'text-slate-400'}>
                        {task.payloadRequirement} (Qty: {task.quantity})
                      </span>
                    </div>
                  </div>

                  {/* Contractor & Hot Standby */}
                  <div className="space-y-1.5 text-xs font-mono">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Assigned AMR:</span>
                      <span className="text-emerald-400 font-bold font-mono">
                        {task.assignedAmrId || 'PENDING AUCTION'}
                      </span>
                    </div>

                    {task.standbyAmrId && (
                      <div className="flex items-center justify-between text-indigo-300 bg-indigo-950/30 px-2 py-1 rounded border border-indigo-800/40">
                        <span className="text-[10px] flex items-center gap-1 font-bold">
                          <ShieldCheck className="w-3.5 h-3.5" /> Hot Standby:
                        </span>
                        <span className="font-bold">{task.standbyAmrId}</span>
                      </div>
                    )}

                    {task.lease && (
                      <div className="flex items-center justify-between text-slate-400 text-[11px]">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-amber-400" /> Lease Timeout:
                        </span>
                        <span className="font-bold text-amber-400">{leaseRemaining}s remaining</span>
                      </div>
                    )}
                  </div>

                  {/* Action: Open Inspector */}
                  <button
                    onClick={() => setSelectedTaskId(task.id)}
                    className="w-full mt-2 py-1.5 rounded-lg bg-cyan-600/20 hover:bg-cyan-600/30 border border-cyan-500/40 text-cyan-300 font-mono text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                    <span>Why was this AMR selected?</span>
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Completed Tasks History Table */}
      <div className="space-y-3 pt-3">
        <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-300">
          Recent Completed Deliveries ({completedTasks.length})
        </h3>

        <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-900/60 shadow-xl">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-3">Task ID</th>
                <th className="py-2.5 px-3">Destination Station</th>
                <th className="py-2.5 px-3">Component Delivered</th>
                <th className="py-2.5 px-3">Assigned Contractor</th>
                <th className="py-2.5 px-3">Completion Time</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 text-right">Rationale</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {completedTasks.slice(0, 10).map((task) => {
                const station = state.stations.find((s) => s.id === task.stationId);
                const onTime = (task.completionSimTime || 0) <= task.deadlineSimTime;

                return (
                  <tr key={task.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-2 px-3 font-bold text-white">{task.id}</td>
                    <td className="py-2 px-3 text-slate-300">{station?.name}</td>
                    <td className="py-2 px-3 text-slate-400">{station?.componentName}</td>
                    <td className="py-2 px-3 text-cyan-300 font-bold">{task.assignedAmrId}</td>
                    <td className="py-2 px-3 text-slate-400">T+{Math.round(task.completionSimTime || 0)}s</td>
                    <td className="py-2 px-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          onTime
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        }`}
                      >
                        {onTime ? 'ON TIME' : 'SLIGHT DELAY'}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-right">
                      <button
                        onClick={() => setSelectedTaskId(task.id)}
                        className="text-cyan-400 hover:text-cyan-300 text-xs font-bold underline cursor-pointer"
                      >
                        Audit Why
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
