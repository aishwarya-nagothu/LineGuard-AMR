import React from 'react';
import { useSimulation } from '../context/SimulationContext';
import { Sparkles, ChevronLeft, ChevronRight, X, Info } from 'lucide-react';

export const DemoWalkthroughBar: React.FC = () => {
  const { demoMode, nextDemoPhase, prevDemoPhase, exitDemo } = useSimulation();

  if (!demoMode.active) return null;

  return (
    <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950 border-b border-amber-500/40 px-4 py-2.5 text-slate-100 flex flex-wrap items-center justify-between gap-3 shadow-lg select-none">
      {/* Phase indicator and title */}
      <div className="flex items-center space-x-3">
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold uppercase tracking-wider font-mono">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Demo Tour: Phase {demoMode.currentPhase} of 10</span>
        </div>

        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-sm font-bold text-white font-mono">{demoMode.phaseInfo.title}</h2>
            <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-900/40 text-cyan-300 border border-cyan-700/50">
              {demoMode.phaseInfo.badge}
            </span>
          </div>
          <p className="text-xs text-slate-300 max-w-3xl flex items-center gap-1.5 mt-0.5">
            <Info className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>{demoMode.phaseInfo.narrative}</span>
          </p>
        </div>
      </div>

      {/* Phase controls */}
      <div className="flex items-center space-x-2">
        {/* Phase dots */}
        <div className="hidden sm:flex items-center space-x-1 mr-2">
          {Array.from({ length: 10 }).map((_, i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full transition-all ${
                i + 1 === demoMode.currentPhase
                  ? 'bg-amber-400 w-4 shadow-sm shadow-amber-400'
                  : i + 1 < demoMode.currentPhase
                  ? 'bg-cyan-500'
                  : 'bg-slate-700'
              }`}
            />
          ))}
        </div>

        <button
          onClick={prevDemoPhase}
          disabled={demoMode.currentPhase === 1}
          className="px-2.5 py-1.5 rounded bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 disabled:opacity-30 disabled:hover:bg-slate-800 text-xs flex items-center gap-1 border border-slate-700"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Previous</span>
        </button>

        <button
          onClick={nextDemoPhase}
          disabled={demoMode.currentPhase === 10}
          className="px-3 py-1.5 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1 shadow-sm transition-all"
        >
          <span>Next Phase</span>
          <ChevronRight className="w-4 h-4" />
        </button>

        <button
          onClick={exitDemo}
          className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors ml-2"
          title="Exit Guided Demo"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
