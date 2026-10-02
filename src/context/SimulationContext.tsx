import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import {
  SimulationState,
  createInitialSimulationState,
  stepSimulation,
  injectDisruption,
  failAmrById,
  recoverAmrById,
} from '../simulation/engine';
import { AllocationPolicy } from '../models/types';

interface DemoPhaseInfo {
  phase: number;
  title: string;
  badge: string;
  narrative: string;
  actionRequired?: string;
}

export const DEMO_PHASES: DemoPhaseInfo[] = [
  {
    phase: 1,
    title: 'Phase 1: Nominal Factory Operation',
    badge: 'Baseline State',
    narrative: 'All stations operating at healthy buffer levels. Heterogeneous AMR fleet (3 Heavy-capable, 7 Light) servicing just-in-time material buffers with zero line downtime.',
  },
  {
    phase: 2,
    title: 'Phase 2: Vehicle Sequence Demand Surge',
    badge: 'Demand Shift',
    narrative: 'A cluster of TerraCross EV SUVs & Colossus Trucks enters the build sequence. Battery and Dual Motor consumption rates surge by +80%!',
  },
  {
    phase: 3,
    title: 'Phase 3: Battery Station Enters High Risk',
    badge: 'Starvation Alert',
    narrative: 'Battery Integration station inventory falls below safety threshold (TTS < 45s). Material delivery task TASK-1041 is broadcast to all eligible fleet AMRs.',
  },
  {
    phase: 4,
    title: 'Phase 4: Decentralized AMR Bidding & Feasibility Gates',
    badge: 'Fleet Auction',
    narrative: 'Each AMR independently calculates travel ETA, battery feasibility gate, corridor congestion, and downstream collateral impact.',
  },
  {
    phase: 5,
    title: 'Phase 5: LineGuard Selects AMR-09 (Global Factory Optimization)',
    badge: 'Strategic Allocation',
    narrative: 'AMR-07 is 7s faster, but AMR-07 is the only heavy safeguard for Motor Assembly. LineGuard chooses AMR-09 to prevent +2.4 min collateral downtime!',
  },
  {
    phase: 6,
    title: 'Phase 6: Catastrophic AMR Failure Injected',
    badge: 'Hardware Fault',
    narrative: 'An AMR experiences actuator fault while hauling heavy components. Cargo is stranded in the corridor.',
  },
  {
    phase: 7,
    title: 'Phase 7: Hot Standby & Dynamic Rescue Auction',
    badge: 'Zero-Downtime Failover',
    narrative: 'Heartbeat timeout triggers lease expiry. The designated Hot Standby AMR immediately assumes delivery without waiting for human intervention.',
  },
  {
    phase: 8,
    title: 'Phase 8: Shopfloor Communication Latency Degraded',
    badge: 'Network Stress',
    narrative: 'Shopfloor private 5G experiences network degradation. AMRs detect state version skew and transition to localized peer decision mode.',
  },
  {
    phase: 9,
    title: 'Phase 9: Uncertainty-Aware Stockout Adaptation',
    badge: 'Robust Control',
    narrative: 'Information staleness dynamically inflates effective uncertainty σ_eff. Safety margins automatically expand to guarantee buffer replenishment.',
  },
  {
    phase: 10,
    title: 'Phase 10: Performance Benchmark vs Greedy Baseline',
    badge: 'Results Verification',
    narrative: 'LineGuard eliminates 100% of starvation events compared to Nearest-AMR greedy baseline, saving over $14,000 in simulated line stoppage costs.',
  },
];

interface SimulationContextType {
  state: SimulationState;
  isPlaying: boolean;
  simSpeed: number;
  activeTab: string;
  selectedTaskId: string | null;
  selectedAmrId: string | null;
  selectedStationId: string | null;
  demoMode: {
    active: boolean;
    currentPhase: number;
    phaseInfo: DemoPhaseInfo;
  };
  togglePlay: () => void;
  setSimSpeed: (speed: number) => void;
  stepOnce: () => void;
  resetSim: (seed?: number, policy?: AllocationPolicy) => void;
  setPolicy: (policy: AllocationPolicy) => void;
  setActiveTab: (tab: string) => void;
  setSelectedTaskId: (id: string | null) => void;
  setSelectedAmrId: (id: string | null) => void;
  setSelectedStationId: (id: string | null) => void;
  triggerDisruptionAction: (
    type:
      | 'DEMAND_SURGE'
      | 'AMR_FAILURE'
      | 'COMM_DELAY'
      | 'COMM_LOSS'
      | 'COMM_RESTORE'
      | 'AISLE_BLOCK'
      | 'LOW_BATTERY'
      | 'HEAVY_UNAVAILABLE'
  ) => void;
  failSelectedAmr: (amrId: string) => void;
  recoverSelectedAmr: (amrId: string) => void;
  startDemo: () => void;
  exitDemo: () => void;
  nextDemoPhase: () => void;
  prevDemoPhase: () => void;
}

const SimulationContext = createContext<SimulationContextType | null>(null);

export const SimulationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<SimulationState>(() => createInitialSimulationState(82731, 'LINEGUARD', 10));
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [simSpeed, setSimSpeed] = useState<number>(1);
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [selectedAmrId, setSelectedAmrId] = useState<string | null>(null);
  const [selectedStationId, setSelectedStationId] = useState<string | null>(null);

  // Demo walkthrough state
  const [demoActive, setDemoActive] = useState<boolean>(false);
  const [demoPhase, setDemoPhase] = useState<number>(1);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const stepOnce = useCallback(() => {
    setState((prev) => stepSimulation(prev, 1.0));
  }, []);

  const togglePlay = useCallback(() => {
    setIsPlaying((prev) => !prev);
  }, []);

  const resetSim = useCallback((seed: number = 82731, policy: AllocationPolicy = 'LINEGUARD') => {
    setState(createInitialSimulationState(seed, policy, 10));
  }, []);

  const setPolicy = useCallback((policy: AllocationPolicy) => {
    setState((prev) => ({
      ...prev,
      policy,
    }));
  }, []);

  const failSelectedAmr = useCallback((amrId: string) => {
    setState((prev) => failAmrById(prev, amrId));
  }, []);

  const recoverSelectedAmr = useCallback((amrId: string) => {
    setState((prev) => recoverAmrById(prev, amrId));
  }, []);

  const triggerDisruptionAction = useCallback(
    (
      type:
        | 'DEMAND_SURGE'
        | 'AMR_FAILURE'
        | 'COMM_DELAY'
        | 'COMM_LOSS'
        | 'COMM_RESTORE'
        | 'AISLE_BLOCK'
        | 'LOW_BATTERY'
        | 'HEAVY_UNAVAILABLE'
    ) => {
      setState((prev) => injectDisruption(prev, type));
    },
    []
  );

  // Loop timer
  useEffect(() => {
    if (!isPlaying) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    const intervalMs = Math.max(120, 800 / simSpeed);
    timerRef.current = setInterval(() => {
      setState((prev) => stepSimulation(prev, 1.0));
    }, intervalMs);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, simSpeed]);

  // Demo Mode Controller
  const startDemo = useCallback(() => {
    setDemoActive(true);
    setDemoPhase(1);
    resetSim(82731, 'LINEGUARD');
    setIsPlaying(true);
    setSimSpeed(1);
    setActiveTab('overview');
  }, [resetSim]);

  const exitDemo = useCallback(() => {
    setDemoActive(false);
  }, []);

  const applyDemoPhaseActions = useCallback((phase: number) => {
    if (phase === 1) {
      setActiveTab('overview');
    } else if (phase === 2) {
      triggerDisruptionAction('DEMAND_SURGE');
      setActiveTab('stationRisk');
    } else if (phase === 3) {
      setActiveTab('factory');
    } else if (phase === 4) {
      setActiveTab('tasks');
    } else if (phase === 5) {
      setActiveTab('inspector');
    } else if (phase === 6) {
      triggerDisruptionAction('AMR_FAILURE');
      setActiveTab('factory');
    } else if (phase === 7) {
      setActiveTab('tasks');
    } else if (phase === 8) {
      triggerDisruptionAction('COMM_DELAY');
      setActiveTab('fleet');
    } else if (phase === 9) {
      setActiveTab('stationRisk');
    } else if (phase === 10) {
      setActiveTab('comparison');
    }
  }, [triggerDisruptionAction]);

  const nextDemoPhase = useCallback(() => {
    if (demoPhase < 10) {
      const nextP = demoPhase + 1;
      setDemoPhase(nextP);
      applyDemoPhaseActions(nextP);
    }
  }, [demoPhase, applyDemoPhaseActions]);

  const prevDemoPhase = useCallback(() => {
    if (demoPhase > 1) {
      const prevP = demoPhase - 1;
      setDemoPhase(prevP);
      applyDemoPhaseActions(prevP);
    }
  }, [demoPhase, applyDemoPhaseActions]);

  const currentPhaseInfo = DEMO_PHASES[demoPhase - 1] || DEMO_PHASES[0];

  return (
    <SimulationContext.Provider
      value={{
        state,
        isPlaying,
        simSpeed,
        activeTab,
        selectedTaskId,
        selectedAmrId,
        selectedStationId,
        demoMode: {
          active: demoActive,
          currentPhase: demoPhase,
          phaseInfo: currentPhaseInfo,
        },
        togglePlay,
        setSimSpeed,
        stepOnce,
        resetSim,
        setPolicy,
        setActiveTab,
        setSelectedTaskId,
        setSelectedAmrId,
        setSelectedStationId,
        triggerDisruptionAction,
        failSelectedAmr,
        recoverSelectedAmr,
        startDemo,
        exitDemo,
        nextDemoPhase,
        prevDemoPhase,
      }}
    >
      {children}
    </SimulationContext.Provider>
  );
};

export const useSimulation = () => {
  const context = useContext(SimulationContext);
  if (!context) {
    throw new Error('useSimulation must be used within a SimulationProvider');
  }
  return context;
};
