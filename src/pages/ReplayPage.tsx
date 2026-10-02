import React, { useState } from 'react';
import { useSimulation } from '../context/SimulationContext';
import { DisruptionPanel } from '../components/DisruptionPanel';
import {
  Sliders,
  Play,
  Pause,
  FastForward,
  RotateCcw,
  Sparkles,
  CheckCircle2,
  RefreshCw,
  Cpu,
  Layers,
} from 'lucide-react';
import { AllocationPolicy } from '../models/types';

export const ReplayPage: React.FC = () => {
  const {
    state,
    isPlaying,
    simSpeed,
    togglePlay,
    setSimSpeed,
    stepOnce,
    resetSim,
    setPolicy,
  } = useSimulation();

  const [seedInput, setSeedInput] = useState<number>(state.seed);
  const [copied, setCopied] = useState<boolean>(false);

  const handleApplySeed = () => {
    resetSim(Number(seedInput), state.policy);
  };

  const handleRandomSeed = () => {
    const newSeed = Math.floor(Math.random() * 90000) + 10000;
    setSeedInput(newSeed);
    resetSim(newSeed, state.policy);
  };

  const formatSimTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="p-4 space-y-5 max-w-[1600px] mx-auto text-slate-100 select-none">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg">
        <div>
          <h2 className="text-sm font-bold font-mono text-cyan-400 uppercase tracking-wider flex items-center gap-2">
            <Sliders className="w-4 h-4" />
            Deterministic Replay & What-If Sandbox
          </h2>
          <p className="text-xs text-slate-400">
            Every simulation step is strictly deterministic using Mulberry32 PRNG. The same seed guarantees identical task arrivals and AMR state transitions.
          </p>
        </div>

        <div className="flex items-center space-x-2 text-xs font-mono">
          <span className="text-slate-400">Current Run:</span>
          <span className="text-cyan-400 font-bold">{state.runId}</span>
          <span className="text-slate-600">|</span>
          <span className="text-slate-400">Policy:</span>
          <span className="text-emerald-400 font-bold">{state.policy}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: Replay Engine & Seed Controller (6 cols) */}
        <div className="lg:col-span-6 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-cyan-400" />
              Deterministic Simulation Run Controller
            </h3>

            {/* Seed Configuration Form */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3 text-xs font-mono">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">RNG SEED CONFIGURATION:</span>
                <button
                  onClick={handleRandomSeed}
                  className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 text-[11px] cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Generate New Seed</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={seedInput}
                  onChange={(e) => setSeedInput(Number(e.target.value))}
                  className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono text-sm w-44 focus:outline-none focus:border-cyan-400"
                />
                <button
                  onClick={handleApplySeed}
                  className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs transition-colors cursor-pointer"
                >
                  Apply & Reset Run
                </button>
              </div>

              <p className="text-[10px] text-slate-500 font-sans">
                Running identical seed with different policies provides exact head-to-head empirical validation without variance noise.
              </p>
            </div>

            {/* Playback Controls Box */}
            <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-slate-500 block text-[10px] font-mono">SIMULATION CLOCK</span>
                <span className="text-2xl font-black font-mono text-emerald-400">
                  {formatSimTime(state.simTimeSec)}
                </span>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={togglePlay}
                  className={`px-3 py-2 rounded-lg font-mono text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                    isPlaying
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  }`}
                >
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-emerald-300" />}
                  <span>{isPlaying ? 'PAUSE' : 'PLAY'}</span>
                </button>

                <button
                  onClick={stepOnce}
                  disabled={isPlaying}
                  className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-40 border border-slate-700"
                  title="Step 1s"
                >
                  <FastForward className="w-4 h-4" />
                </button>

                <div className="flex bg-slate-800 rounded-lg border border-slate-700 overflow-hidden text-xs font-mono">
                  {[1, 2, 4].map((spd) => (
                    <button
                      key={spd}
                      onClick={() => setSimSpeed(spd)}
                      className={`px-2.5 py-1.5 ${
                        simSpeed === spd
                          ? 'bg-cyan-600 text-white font-bold'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {spd}x
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => resetSim(state.seed, state.policy)}
                  className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700"
                  title="Restart Run"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Policy Selector */}
            <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl space-y-1.5 text-xs font-mono">
              <span className="text-slate-400 block font-bold">ACTIVE ALLOCATION ALGORITHM:</span>
              <div className="grid grid-cols-2 gap-2 pt-1">
                {(['LINEGUARD', 'NEAREST_AMR', 'DISTANCE_AUCTION', 'FIFO', 'STATIC_PRIORITY'] as AllocationPolicy[]).map(
                  (pol) => (
                    <button
                      key={pol}
                      onClick={() => setPolicy(pol)}
                      className={`p-2 rounded text-left transition-all cursor-pointer ${
                        state.policy === pol
                          ? 'bg-cyan-950/60 border border-cyan-400 text-cyan-300 font-bold'
                          : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {pol}
                    </button>
                  )
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Full What-If Disruption Sandbox (6 cols) */}
        <div className="lg:col-span-6 space-y-4">
          <DisruptionPanel />

          {/* Active Disruption State Audit */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3 text-xs font-mono">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Live Stress-Test Environment Status
            </h4>

            <div className="grid grid-cols-2 gap-2">
              <div className="p-2.5 rounded bg-slate-950 border border-slate-800 flex justify-between items-center">
                <span className="text-slate-400">Demand Surge Active:</span>
                <span className={state.disruptionsActive.demandSurge ? 'text-amber-400 font-bold' : 'text-emerald-400'}>
                  {state.disruptionsActive.demandSurge ? 'YES (+80%)' : 'NOMINAL'}
                </span>
              </div>

              <div className="p-2.5 rounded bg-slate-950 border border-slate-800 flex justify-between items-center">
                <span className="text-slate-400">Network Latency:</span>
                <span className={state.commStatus !== 'NORMAL' ? 'text-rose-400 font-bold' : 'text-emerald-400'}>
                  {state.commStatus}
                </span>
              </div>

              <div className="p-2.5 rounded bg-slate-950 border border-slate-800 flex justify-between items-center">
                <span className="text-slate-400">Corridor Obstruction:</span>
                <span className={state.aisles.some((a) => a.isBlocked) ? 'text-rose-400 font-bold' : 'text-emerald-400'}>
                  {state.aisles.some((a) => a.isBlocked) ? '1 AISLE BLOCKED' : 'ALL CLEAR'}
                </span>
              </div>

              <div className="p-2.5 rounded bg-slate-950 border border-slate-800 flex justify-between items-center">
                <span className="text-slate-400">Hardware Faults:</span>
                <span className={state.amrs.some((a) => a.health === 'FAILED') ? 'text-rose-400 font-bold' : 'text-emerald-400'}>
                  {state.amrs.filter((a) => a.health === 'FAILED').length} OFFLINE
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
