/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { SimulationProvider, useSimulation } from './context/SimulationContext';
import { Header } from './components/Header';
import { Navigation } from './components/Navigation';
import { DemoWalkthroughBar } from './components/DemoWalkthroughBar';
import { DecisionModal } from './components/DecisionModal';

import { OverviewPage } from './pages/OverviewPage';
import { FactoryPage } from './pages/FactoryPage';
import { TasksPage } from './pages/TasksPage';
import { FleetPage } from './pages/FleetPage';
import { StationRiskPage } from './pages/StationRiskPage';
import { DecisionInspectorPage } from './pages/DecisionInspectorPage';
import { EventTimelinePage } from './pages/EventTimelinePage';
import { ReplayPage } from './pages/ReplayPage';
import { BaselineComparisonPage } from './pages/BaselineComparisonPage';
import { ExperimentsPage } from './pages/ExperimentsPage';

const AppContent: React.FC = () => {
  const { activeTab } = useSimulation();

  const renderActivePage = () => {
    switch (activeTab) {
      case 'overview':
        return <OverviewPage />;
      case 'factory':
        return <FactoryPage />;
      case 'tasks':
        return <TasksPage />;
      case 'fleet':
        return <FleetPage />;
      case 'stationRisk':
        return <StationRiskPage />;
      case 'inspector':
        return <DecisionInspectorPage />;
      case 'events':
        return <EventTimelinePage />;
      case 'replay':
        return <ReplayPage />;
      case 'comparison':
        return <BaselineComparisonPage />;
      case 'experiments':
        return <ExperimentsPage />;
      default:
        return <OverviewPage />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-black">
      {/* Top Header */}
      <Header />

      {/* Guided 10-Phase Demo Banner (when active) */}
      <DemoWalkthroughBar />

      {/* 10-Tab Navigation Bar */}
      <Navigation />

      {/* Main Content Viewport */}
      <main className="flex-1 overflow-x-hidden">
        {renderActivePage()}
      </main>

      {/* Explainable Decision Modal */}
      <DecisionModal />

      {/* Global Status Footer */}
      <footer className="bg-slate-950 border-t border-slate-900 px-4 py-2 text-[11px] text-slate-500 font-mono flex flex-wrap items-center justify-between gap-2 select-none">
        <div className="flex items-center space-x-3">
          <span className="text-slate-400 font-bold">LINEGUARD PROTOTYPE</span>
          <span>·</span>
          <span>Automotive Assembly Logistics Starvation Prevention</span>
          <span>·</span>
          <span className="text-cyan-400">Deterministic Mathematical Modeling</span>
        </div>
        <div>
          <span>"Optimize the factory, not the robot."</span>
        </div>
      </footer>
    </div>
  );
};

export default function App() {
  return (
    <SimulationProvider>
      <AppContent />
    </SimulationProvider>
  );
}
