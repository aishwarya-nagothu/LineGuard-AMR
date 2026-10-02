import React from 'react';
import { useSimulation } from '../context/SimulationContext';
import { FactoryCanvas } from '../components/FactoryCanvas';
import { DisruptionPanel } from '../components/DisruptionPanel';
import {
  Compass,
  AlertTriangle,
  Bot,
  Activity,
  Battery,
  ShieldAlert,
  ArrowRight,
  Zap,
} from 'lucide-react';

export const FactoryPage: React.FC = () => {
  const {
    state,
    selectedAmrId,
    setSelectedAmrId,
    selectedStationId,
    setSelectedStationId,
    setSelectedTaskId,
    triggerDisruptionAction,
  } = useSimulation();

  const selectedAmr = state.amrs.find((a) => a.id === selectedAmrId);
  const selectedStation = state.stations.find((s) => s.id === selectedStationId);

  return (
    <div className="p-4 space-y-4 max-w-[1600px] mx-auto text-slate-100 select-none">
      {/* Page Title & Summary */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900 border border-slate-800 rounded-xl p-3.5 shadow-lg">
        <div>
          <h2 className="text-sm font-bold font-mono text-cyan-400 uppercase tracking-wider flex items-center gap-2">
            <Compass className="w-4 h-4" />
            Full-Scale 2D Shopfloor Simulation
          </h2>
          <p className="text-xs text-slate-400">
            Real-time automated logistics orchestration across 6 assembly cells, 3 arterial aisles, and automated charging bays.
          </p>
        </div>

        <div className="flex items-center space-x-2 text-xs font-mono">
          <span className="text-slate-400">Aisle Congestion Delay:</span>
          <span className="text-amber-400 font-bold">{state.metrics.congestionDelaysSec.toFixed(1)}s</span>
          <span className="text-slate-600">|</span>
          <span className="text-slate-400">Network Latency:</span>
          <span className="text-emerald-400 font-bold">{state.commStatus === 'NORMAL' ? '12ms' : state.commStatus === 'DELAYED' ? '3,200ms' : 'DOWN'}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Expanded 2D Canvas (8 Cols) */}
        <div className="lg:col-span-8 flex flex-col space-y-3">
          <FactoryCanvas compact={false} />
          <DisruptionPanel />
        </div>

        {/* Sidebar: Aisle Flows & Selected Element Inspector (4 Cols) */}
        <div className="lg:col-span-4 flex flex-col space-y-4">
          {/* Aisle Flow & Congestion Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-xl space-y-3">
            <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <Activity className="w-3.5 h-3.5 text-cyan-400" />
              Corridor Flow & Congestion Heatmap
            </h3>

            <div className="divide-y divide-slate-800/80 border border-slate-800 rounded-lg overflow-hidden text-xs font-mono">
              {state.aisles.map((aisle) => (
                <div key={aisle.id} className="p-2.5 bg-slate-950/60 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-200 block">{aisle.name}</span>
                    <span className="text-[10px] text-slate-500">
                      Capacity: {aisle.capacity} AMRs max
                    </span>
                  </div>

                  <div className="text-right">
                    <span
                      className={`font-bold ${
                        aisle.isBlocked
                          ? 'text-rose-400'
                          : aisle.congestionLevel > 0.5
                          ? 'text-amber-400'
                          : 'text-emerald-400'
                      }`}
                    >
                      {aisle.isBlocked ? 'BLOCKED' : `${Math.round(aisle.congestionLevel * 100)}%`}
                    </span>
                    <span className="text-[10px] text-slate-400 block">
                      Flow: {aisle.currentCount}/{aisle.capacity}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Selected AMR Inspector Card */}
          {selectedAmr && (
            <div className="bg-slate-900 border border-cyan-500/40 rounded-xl p-4 shadow-xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold font-mono text-cyan-400 flex items-center gap-1.5">
                  <Bot className="w-4 h-4" />
                  AMR INSPECTOR: {selectedAmr.id}
                </span>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold ${
                    selectedAmr.health === 'FAILED'
                      ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                      : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                  }`}
                >
                  {selectedAmr.health}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs font-mono bg-slate-950/70 p-3 rounded-lg border border-slate-800">
                <div>
                  <span className="text-slate-500 block text-[10px]">PAYLOAD CLASS</span>
                  <span className="text-white font-bold">{selectedAmr.payloadCapability} ({selectedAmr.maxPayloadKg}kg)</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">BATTERY</span>
                  <span className={selectedAmr.batteryPct < 30 ? 'text-amber-400 font-bold' : 'text-emerald-400 font-bold'}>
                    {selectedAmr.batteryPct}%
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">STATE</span>
                  <span className="text-cyan-300 font-bold">{selectedAmr.state}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">PEER VERSION</span>
                  <span className="text-indigo-400 font-bold">v{selectedAmr.stateVersion}</span>
                </div>
              </div>

              {selectedAmr.currentTaskId && (
                <div className="p-2.5 rounded bg-blue-950/30 border border-blue-800/40 text-xs font-mono flex items-center justify-between">
                  <span className="text-blue-300">Task: {selectedAmr.currentTaskId}</span>
                  <button
                    onClick={() => setSelectedTaskId(selectedAmr.currentTaskId!)}
                    className="text-cyan-400 hover:underline font-bold"
                  >
                    View Rationale →
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Selected Station Inspector Card */}
          {selectedStation && (
            <div className="bg-slate-900 border border-amber-500/40 rounded-xl p-4 shadow-xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold font-mono text-amber-400 flex items-center gap-1.5">
                  <Activity className="w-4 h-4" />
                  STATION INSPECTOR: {selectedStation.name}
                </span>
                <span className="text-xs font-mono text-slate-300 font-bold">
                  c = {selectedStation.criticality}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs font-mono bg-slate-950/70 p-3 rounded-lg border border-slate-800">
                <div>
                  <span className="text-slate-500 block text-[10px]">BUFFER INVENTORY</span>
                  <span className="text-white font-bold">{selectedStation.currentInventory.toFixed(1)} units</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">STOCKOUT COUNTDOWN</span>
                  <span className="text-amber-400 font-bold">{Math.round(selectedStation.predictedStockoutSec)}s</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">DRAW RATE μ</span>
                  <span className="text-cyan-300">{selectedStation.consumptionRate.toFixed(3)}/s</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">STARVATION PROB</span>
                  <span className="text-rose-400 font-bold">{Math.round(selectedStation.starvationProbability * 100)}%</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
