import express, { Router } from 'express';
import { AllocationPolicy } from '../src/models/types';
import {
  createInitialSimulationState,
  stepSimulation,
  injectDisruption,
  failAmrById,
  recoverAmrById,
  DisruptionType,
  SimulationState,
} from '../src/simulation/engine';
import { runBaselineBenchmark } from '../src/services/baselineRunner';
import { runAblationStudy, runScalabilityBenchmark } from '../src/services/ablationRunner';
import { FULL_LINEGUARD } from '../src/simulation/mechanisms';

const sessions = new Map<string, SimulationState>();

function sessionId(): string {
  return `SIM-${Date.now().toString(36)}-${Math.floor(Math.random() * 9999)}`;
}

export function createSimRouter(): Router {
  const router = Router();
  router.use(express.json({ limit: '2mb' }));

  router.get('/health', (_req, res) => {
    res.json({
      ok: true,
      service: 'lineguard-engine',
      sessions: sessions.size,
      timestamp: new Date().toISOString(),
    });
  });

  router.post('/simulations', (req, res) => {
    const seed = Number(req.body?.seed ?? 82731);
    const policy = (req.body?.policy as AllocationPolicy) || 'LINEGUARD';
    const fleetCount = Number(req.body?.fleetCount ?? 10);
    const state = createInitialSimulationState(seed, policy, fleetCount, FULL_LINEGUARD);
    const id = sessionId();
    sessions.set(id, state);
    res.json({ id, state });
  });

  router.get('/simulations/:id', (req, res) => {
    const state = sessions.get(req.params.id);
    if (!state) return res.status(404).json({ error: 'Simulation session not found' });
    res.json({ id: req.params.id, state });
  });

  router.post('/simulations/:id/step', (req, res) => {
    const current = sessions.get(req.params.id);
    if (!current) return res.status(404).json({ error: 'Simulation session not found' });
    const dt = Number(req.body?.dt ?? 1);
    const steps = Math.min(60, Math.max(1, Number(req.body?.steps ?? 1)));
    let state = current;
    for (let i = 0; i < steps; i++) state = stepSimulation(state, dt);
    sessions.set(req.params.id, state);
    res.json({ id: req.params.id, state });
  });

  router.post('/simulations/:id/reset', (req, res) => {
    const current = sessions.get(req.params.id);
    if (!current) return res.status(404).json({ error: 'Simulation session not found' });
    const seed = Number(req.body?.seed ?? current.seed);
    const policy = (req.body?.policy as AllocationPolicy) || current.policy;
    const state = createInitialSimulationState(seed, policy, current.amrs.length, current.mechanisms);
    sessions.set(req.params.id, state);
    res.json({ id: req.params.id, state });
  });

  router.post('/simulations/:id/disruptions', (req, res) => {
    const current = sessions.get(req.params.id);
    if (!current) return res.status(404).json({ error: 'Simulation session not found' });
    const type = req.body?.type as DisruptionType;
    const state = injectDisruption(current, type);
    sessions.set(req.params.id, state);
    res.json({ id: req.params.id, state });
  });

  router.post('/simulations/:id/amrs/:amrId/fail', (req, res) => {
    const current = sessions.get(req.params.id);
    if (!current) return res.status(404).json({ error: 'Simulation session not found' });
    const state = failAmrById(current, req.params.amrId);
    sessions.set(req.params.id, state);
    res.json({ id: req.params.id, state });
  });

  router.post('/simulations/:id/amrs/:amrId/recover', (req, res) => {
    const current = sessions.get(req.params.id);
    if (!current) return res.status(404).json({ error: 'Simulation session not found' });
    const state = recoverAmrById(current, req.params.amrId);
    sessions.set(req.params.id, state);
    res.json({ id: req.params.id, state });
  });

  router.post('/experiments/baseline', (req, res) => {
    const seed = Number(req.body?.seed ?? 82731);
    const durationSec = Number(req.body?.durationSec ?? 240);
    const started = Date.now();
    const results = runBaselineBenchmark(seed, durationSec);
    res.json({ seed, durationSec, elapsedMs: Date.now() - started, results });
  });

  router.post('/experiments/ablation', (req, res) => {
    const seed = Number(req.body?.seed ?? 82731);
    const durationSec = Number(req.body?.durationSec ?? 240);
    const started = Date.now();
    const results = runAblationStudy(seed, durationSec);
    res.json({ seed, durationSec, elapsedMs: Date.now() - started, results });
  });

  router.post('/experiments/scalability', (req, res) => {
    const seed = Number(req.body?.seed ?? 82731);
    const started = Date.now();
    const results = runScalabilityBenchmark(seed);
    res.json({ seed, elapsedMs: Date.now() - started, results });
  });

  return router;
}

export function createSimApi() {
  const app = express();
  app.use('/api', createSimRouter());
  return app;
}
