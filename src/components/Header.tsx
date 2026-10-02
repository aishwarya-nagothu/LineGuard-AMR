import React from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  FastForward,
  Activity,
  AlertTriangle,
  Zap,
  Radio,
  Sparkles,
  Layers,
} from 'lucide-react';
import { useSimulation } from '../context/SimulationContext';
import { AllocationPolicy } from '../models/types';

export const Header: React.FC = () => {
  const {
    state,
    isPlaying,
    simSpeed,
    togglePlay,
    setSimSpeed,
    stepOnce,
    resetSim,
    setPolicy,
    startDemo,
    triggerDisruptionAction,
  } = useSimulation();

  const formatSimTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-slate-100 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 select-none">
      {/* Brand & Product identity */}
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 border border-cyan-400/30">
          <Activity className="w-6 h-6 text-white" />
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-black tracking-wider text-white font-mono flex items-center gap-1.5">
              LINEGUARD
              <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 font-sans font-medium tracking-normal">
                v2.4 Core
              </span>
            </h1>
          </div>
          <p className="text-xs text-slate-400 font-medium tracking-tight">
            Decentralized Production-Aware AMR Coordination
          </p>
        </div>

        {/* Core Product Principle Banner */}
        <div className="hidden lg:flex items-center space-x-1.5 ml-4 px-3 py-1 rounded bg-slate-800/80 border border-slate-700/60 text-xs">
          <span className="text-cyan-400 font-semibold">Principle:</span>
          <span className="text-slate-300 font-mono">"Optimize the factory, not the robot."</span>
        </div>
      </div>

      {/* Real-time Status Badges */}
      <div className="flex items-center space-x-3 text-xs font-mono">
        <div className="bg-slate-800/90 px-3 py-1.5 rounded border border-slate-700/70 flex items-center gap-2">
          <span className="text-slate-400">RUN:</span>
          <span className="text-cyan-400 font-bold">{state.runId}</span>
          <span className="text-slate-600">|</span>
          <span className="text-slate-400">SEED:</span>
          <span className="text-slate-300">{state.seed}</span>
        </div>

        <div className="bg-slate-800/90 px-3 py-1.5 rounded border border-slate-700/70 flex items-center gap-2">
          <span className="text-slate-400">SIM TIME:</span>
          <span className="text-emerald-400 font-bold text-sm tracking-wider">
            {formatSimTime(state.simTimeSec)}
          </span>
          <span className="text-slate-600">|</span>
          <span className="text-slate-400">VER:</span>
          <span className="text-indigo-400">v{state.globalStateVersion}</span>
        </div>

        {/* Network & Comm Status */}
        <div
          className={`px-2.5 py-1.5 rounded flex items-center gap-1.5 border font-semibold ${
            state.commStatus === 'NORMAL'
              ? 'bg-emerald-950/40 text-emerald-400 border-emerald-700/40'
              : state.commStatus === 'DELAYED'
              ? 'bg-amber-950/40 text-amber-400 border-amber-700/40 animate-pulse'
              : 'bg-rose-950/40 text-rose-400 border-rose-700/40 animate-pulse'
          }`}
        >
          <Radio className="w-3.5 h-3.5" />
          <span>COMM: {state.commStatus}</span>
        </div>
      </div>

      {/* Controls & Demo Action */}
      <div className="flex items-center space-x-2">
        {/* Policy Selector */}
        <div className="flex items-center space-x-1.5 bg-slate-800/90 px-2 py-1 rounded border border-slate-700">
          <Layers className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={state.policy}
            onChange={(e) => setPolicy(e.target.value as AllocationPolicy)}
            className="bg-transparent text-xs text-cyan-300 font-medium focus:outline-none cursor-pointer"
          >
            <option value="LINEGUARD" className="bg-slate-900 text-white">LineGuard (Starvation-Aware)</option>
            <option value="NEAREST_AMR" className="bg-slate-900 text-white">Nearest Available AMR</option>
            <option value="DISTANCE_AUCTION" className="bg-slate-900 text-white">Distance Auction</option>
            <option value="STATIC_PRIORITY" className="bg-slate-900 text-white">Static Priority</option>
            <option value="FIFO" className="bg-slate-900 text-white">FIFO Allocation</option>
          </select>
        </div>

        {/* Play/Pause Button */}
        <button
          onClick={togglePlay}
          className={`p-2 rounded flex items-center justify-center transition-colors ${
            isPlaying
              ? 'bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-500/40'
              : 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border border-emerald-500/40'
          }`}
          title={isPlaying ? 'Pause Simulation' : 'Resume Simulation'}
        >
          {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-emerald-300" />}
        </button>

        {/* Step Once */}
        <button
          onClick={stepOnce}
          disabled={isPlaying}
          className="p-2 rounded bg-slate-800 text-slate-300 hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-slate-800 border border-slate-700"
          title="Step 1 Second"
        >
          <FastForward className="w-4 h-4" />
        </button>

        {/* Speed multiplier */}
        <div className="flex bg-slate-800 rounded border border-slate-700 overflow-hidden text-xs">
          {[1, 2, 4].map((spd) => (
            <button
              key={spd}
              onClick={() => setSimSpeed(spd)}
              className={`px-2 py-1 font-mono transition-colors ${
                simSpeed === spd
                  ? 'bg-cyan-600 text-white font-bold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700'
              }`}
            >
              {spd}x
            </button>
          ))}
        </div>

        {/* Reset */}
        <button
          onClick={() => resetSim(state.seed, state.policy)}
          className="p-2 rounded bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 border border-slate-700 transition-colors"
          title="Restart Simulation Run"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        {/* Guided Demo Button */}
        <button
          onClick={startDemo}
          className="ml-2 px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/20 transition-all cursor-pointer"
        >
          <Sparkles className="w-4 h-4" />
          <span>Demo Scenario</span>
        </button>
      </div>
    </header>
  );
};
