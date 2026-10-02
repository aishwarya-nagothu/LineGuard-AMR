import { AllocationPolicy, AblationVariantResult, PolicyBenchmarkResult, ScalabilityResult } from '../models/types';

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(`API ${url} failed (${res.status})`);
  }
  return (await res.json()) as T;
}

export async function fetchBaselineBenchmark(
  seed: number,
  durationSec = 240
): Promise<PolicyBenchmarkResult[]> {
  const data = await postJson<{ results: PolicyBenchmarkResult[] }>('/api/experiments/baseline', { seed, durationSec });
  return data.results;
}

export async function fetchAblationStudy(seed: number, durationSec = 240): Promise<AblationVariantResult[]> {
  const data = await postJson<{ results: AblationVariantResult[] }>('/api/experiments/ablation', { seed, durationSec });
  return data.results;
}

export async function fetchScalabilityBenchmark(seed: number): Promise<ScalabilityResult[]> {
  const data = await postJson<{ results: ScalabilityResult[] }>('/api/experiments/scalability', { seed });
  return data.results;
}

export async function checkEngineHealth(): Promise<boolean> {
  try {
    const res = await fetch('/api/health');
    return res.ok;
  } catch {
    return false;
  }
}
