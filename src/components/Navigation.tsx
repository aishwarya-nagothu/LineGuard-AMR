import React from 'react';
import {
  LayoutDashboard,
  Factory,
  CheckSquare,
  Bot,
  AlertOctagon,
  Search,
  ListOrdered,
  Sliders,
  BarChart3,
  FlaskConical,
} from 'lucide-react';
import { useSimulation } from '../context/SimulationContext';

interface TabItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number | string;
  badgeColor?: string;
}

export const Navigation: React.FC = () => {
  const { activeTab, setActiveTab, state } = useSimulation();

  const atRiskCount = state.stations.filter((s) => s.predictedStockoutSec < 55).length;
  const activeTasksCount = state.tasks.filter(
    (t) => t.status === 'ASSIGNED' || t.status === 'IN_TRANSIT' || t.status === 'PENDING_AUCTION'
  ).length;
  const criticalEventsCount = state.events.filter((e) => e.severity === 'CRITICAL').length;
  const failedAmrsCount = state.amrs.filter((a) => a.health === 'FAILED').length;

  const tabs: TabItem[] = [
    { id: 'overview', label: '1. Overview', icon: LayoutDashboard },
    { id: 'factory', label: '2. Factory Simulation', icon: Factory },
    {
      id: 'tasks',
      label: '3. Live Tasks',
      icon: CheckSquare,
      badge: activeTasksCount > 0 ? activeTasksCount : undefined,
      badgeColor: 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30',
    },
    {
      id: 'fleet',
      label: '4. AMR Fleet',
      icon: Bot,
      badge: failedAmrsCount > 0 ? `${failedAmrsCount} FAULT` : undefined,
      badgeColor: 'bg-rose-500/20 text-rose-400 border border-rose-500/30',
    },
    {
      id: 'stationRisk',
      label: '5. Station Risk',
      icon: AlertOctagon,
      badge: atRiskCount > 0 ? `${atRiskCount} RISK` : undefined,
      badgeColor: 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
    },
    { id: 'inspector', label: '6. Decision Inspector', icon: Search },
    {
      id: 'events',
      label: '7. Event Timeline',
      icon: ListOrdered,
      badge: criticalEventsCount > 0 ? criticalEventsCount : undefined,
      badgeColor: 'bg-rose-500/20 text-rose-400 border border-rose-500/30',
    },
    { id: 'replay', label: '8. Replay / What-If', icon: Sliders },
    { id: 'comparison', label: '9. Baseline Comparison', icon: BarChart3 },
    { id: 'experiments', label: '10. Experiments', icon: FlaskConical },
  ];

  return (
    <nav className="bg-slate-950 border-b border-slate-800 px-4 py-1 flex items-center space-x-1 overflow-x-auto no-scrollbar select-none">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;

        return (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center space-x-2 px-3 py-2 rounded-t-md text-xs font-medium whitespace-nowrap transition-all border-b-2 cursor-pointer ${
              isActive
                ? 'bg-slate-900 text-cyan-400 border-cyan-400 font-semibold shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50 border-transparent'
            }`}
          >
            <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-cyan-400' : 'text-slate-500'}`} />
            <span>{tab.label}</span>
            {tab.badge && (
              <span
                className={`ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
                  tab.badgeColor || 'bg-slate-800 text-slate-300'
                }`}
              >
                {tab.badge}
              </span>
            )}
          </button>
        );
      })}
    </nav>
  );
};
