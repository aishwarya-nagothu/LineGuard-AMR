import React from 'react';
import { useSimulation } from '../context/SimulationContext';
import { FactoryCanvas } from '../components/FactoryCanvas';
import { DisruptionPanel } from '../components/DisruptionPanel';
import { MetricsCharts } from '../components/Charts/MetricsCharts';
import {
  Activity,
  Bot,
  AlertOctagon,
  Clock,
  TrendingUp,
  BatteryCharging,
  ShieldCheck,
  CheckCircle,
  Truck,
  Car,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';

export const OverviewPage: React.FC = () => {
  const { state, setSelectedTaskId, setSelectedStationId, setActiveTab } = useSimulation();

  const kpis = [
    {
      label: 'ACTIVE AMRs',
      value: `${state.metrics.activeAmrsCount} / ${state.amrs.length}`,
      sub: `${state.metrics.idleAmrsCount} Idle · ${state.metrics.failedAmrsCount} Fault`,
      icon: Bot,
      color: 'text-cyan-400',
      border: 'border-cyan-500/30',
      bg: 'bg-cyan-950/20',
    },
    {
      label: 'CRITICAL DELIVERIES',
      value: state.metrics.criticalDeliveriesCount,
      sub: 'Traction Battery / Dual Motor',
      icon: Activity,
      color: state.metrics.criticalDeliveriesCount > 0 ? 'text-amber-400' : 'text-slate-300',
      border: state.metrics.criticalDeliveriesCount > 0 ? 'border-amber-500/40' : 'border-slate-800',
      bg: 'bg-slate-900',
    },
    {
      label: 'STATIONS AT RISK',
      value: state.metrics.stationsAtRiskCount,
      sub: state.metrics.stationsAtRiskCount > 0 ? 'Buffer < 50s TTS' : 'Nominal buffer levels',
      icon: AlertOctagon,
      color: state.metrics.stationsAtRiskCount > 0 ? 'text-rose-400' : 'text-emerald-400',
      border: state.metrics.stationsAtRiskCount > 0 ? 'border-rose-500/40' : 'border-slate-800',
      bg: state.metrics.stationsAtRiskCount > 0 ? 'bg-rose-950/20' : 'bg-slate-900',
    },
    {
      label: 'STARVATION EVENTS',
      value: state.metrics.totalStarvationEvents,
      sub: `${state.metrics.totalStarvationDurationSec.toFixed(1)}s cumulative downtime`,
      icon: ShieldCheck,
      color: state.metrics.totalStarvationEvents > 0 ? 'text-rose-400' : 'text-emerald-400',
      border: state.metrics.totalStarvationEvents > 0 ? 'border-rose-500/40' : 'border-slate-800',
      bg: 'bg-slate-900',
    },
    {
      label: 'ON-TIME DELIVERY',
      value: `${state.metrics.onTimeDeliveryRatePct}%`,
      sub: `${state.metrics.completedDeliveriesCount} completed tasks`,
      icon: CheckCircle,
      color: 'text-emerald-400',
      border: 'border-emerald-500/30',
      bg: 'bg-emerald-950/20',
    },
    {
      label: 'LOSS AVOIDED',
      value: `${state.metrics.productionLossAvoidedMinutes.toFixed(1)} min`,
      sub: `Loss ${state.metrics.productionLossMinutes.toFixed(1)} min · delay ${state.metrics.averageDeliveryDelaySec}s`,
      icon: TrendingUp,
      color: 'text-indigo-400',
      border: 'border-indigo-500/30',
      bg: 'bg-indigo-950/20',
    },
    {
      label: 'AVG RECOVERY TIME',
      value: `${state.metrics.averageRecoveryTimeSec.toFixed(1)}s`,
      sub: 'Decentralized failover lease',
      icon: Clock,
      color: 'text-amber-400',
      border: 'border-amber-500/30',
      bg: 'bg-slate-900',
    },
    {
      label: 'FLEET ENERGY',
      value: `${state.metrics.fleetAverageBatteryPct}%`,
      sub: `${state.chargers.filter((c) => c.occupiedByAmrId).length} AMRs in fast-charge`,
      icon: BatteryCharging,
      color: state.metrics.fleetAverageBatteryPct < 30 ? 'text-rose-400' : 'text-cyan-400',
      border: 'border-slate-800',
      bg: 'bg-slate-900',
    },
  ];

  return (
    <div className="p-4 space-y-5 max-w-[1600px] mx-auto text-slate-100 select-none">
      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div
              key={idx}
              className={`p-3 rounded-xl border ${kpi.border} ${kpi.bg} shadow-lg transition-all hover:border-slate-600 flex flex-col justify-between`}
            >
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-[10px] font-mono font-bold tracking-wider">{kpi.label}</span>
                <Icon className={`w-3.5 h-3.5 ${kpi.color}`} />
              </div>
              <div className={`text-xl font-black font-mono tracking-tight ${kpi.color}`}>
                {kpi.value}
              </div>
              <div className="text-[10px] text-slate-400 mt-1 truncate">{kpi.sub}</div>
            </div>
          );
        })}
      </div>

      {/* Main Interactive Twin & Sequence Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Factory 2D Map (7 Cols) */}
        <div className="lg:col-span-8 flex flex-col space-y-3">
          <FactoryCanvas compact={false} />
          <MetricsCharts history={state.metricsHistory} />
          <DisruptionPanel />
        </div>

        {/* Right Sidebar: Build Sequence + Station Risk Status (4 Cols) */}
        <div className="lg:col-span-4 flex flex-col space-y-4">
          {/* Dynamic Vehicle Build Sequence Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Car className="w-4 h-4 text-cyan-400" />
                <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-white">
                  Vehicle Build Sequence (Live Demand Driver)
                </h3>
              </div>
              <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/50">
                JIT Scheduling
              </span>
            </div>

            <p className="text-[11px] text-slate-400 leading-tight">
              Upcoming variants entering assembly dynamically dictate material draw rates μ(t) and stockout prediction.
            </p>

            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {state.buildSequence.slice(0, 8).map((item) => {
                const isCurrent = item.status === 'IN_PRODUCTION';

                return (
                  <div
                    key={item.id}
                    className={`p-2.5 rounded-lg border text-xs font-mono flex items-center justify-between transition-all ${
                      isCurrent
                        ? 'bg-cyan-950/40 border-cyan-500/60 shadow-md shadow-cyan-500/10'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`font-bold ${isCurrent ? 'text-cyan-300' : 'text-slate-300'}`}>
                          {item.vehicleName}
                        </span>
                        {isCurrent && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                            ON LINE
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5">
                        {item.chassisNumber} · T+{item.scheduledTimeSec}s
                      </div>
                    </div>

                    <div className="text-right text-[10px]">
                      <span className="text-slate-300 block">Heavy Draw:</span>
                      <span className={item.vehicleName.includes('SUV') || item.vehicleName.includes('Truck') ? 'text-amber-400 font-bold' : 'text-slate-400'}>
                        {item.vehicleName.includes('SUV') ? '1.8x Battery' : item.vehicleName.includes('Truck') ? '2.2x High' : '1.0x Std'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Station Risk & Buffer Summary */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-xl space-y-3 flex-1 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <AlertOctagon className="w-4 h-4 text-amber-400" />
                  <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-white">
                    Station Risk & Buffer Matrix
                  </h3>
                </div>
                <button
                  onClick={() => setActiveTab('stationRisk')}
                  className="text-[11px] text-cyan-400 hover:text-cyan-300 flex items-center gap-0.5 cursor-pointer"
                >
                  Deep Dive <ChevronRight className="w-3 h-3" />
                </button>
              </div>

              <div className="space-y-2">
                {state.stations.map((station) => {
                  const isCritical = station.criticality >= 0.9;
                  const isAtRisk = station.predictedStockoutSec < 50;

                  return (
                    <div
                      key={station.id}
                      onClick={() => setSelectedStationId(station.id)}
                      className={`p-2 rounded-lg border text-xs font-mono cursor-pointer transition-all ${
                        station.isStarved
                          ? 'bg-rose-950/40 border-rose-500/60'
                          : isAtRisk
                          ? 'bg-amber-950/30 border-amber-500/50'
                          : 'bg-slate-950/50 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-200">
                          {station.name.slice(0, 18)}
                        </span>
                        <span
                          className={`font-bold ${
                            station.isStarved
                              ? 'text-rose-400'
                              : isAtRisk
                              ? 'text-amber-400'
                              : 'text-emerald-400'
                          }`}
                        >
                          TTS: {Math.round(station.predictedStockoutSec)}s
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1">
                        <span>Inv: {station.currentInventory.toFixed(1)} / {station.maxBuffer}</span>
                        <span>Loss {station.expectedProductionLossMin}m · subst {station.substitutability}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Quick Link to Inspector */}
            {state.recentDecisions.length > 0 && (
              <div className="mt-3 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-400">Latest Contract:</span>
                <button
                  onClick={() => setSelectedTaskId(state.recentDecisions[0].taskId)}
                  className="text-cyan-400 hover:text-cyan-300 font-mono font-bold flex items-center gap-1 cursor-pointer"
                >
                  <span>{state.recentDecisions[0].taskId} Why?</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
