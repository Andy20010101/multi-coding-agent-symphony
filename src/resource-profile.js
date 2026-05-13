import { availableParallelism, totalmem } from 'node:os';

export function buildResourceProfile({
  env = process.env,
  timeoutMs,
  concurrency = 1,
  network = 'enabled'
} = {}) {
  return {
    cpu: env.MCAS_RESOURCE_CPU || String(availableParallelism()),
    memoryMb: parsePositiveInteger(env.MCAS_RESOURCE_MEMORY_MB, Math.round(totalmem() / 1024 / 1024)),
    timeoutSeconds: Math.ceil(parsePositiveInteger(timeoutMs, 1) / 1000),
    concurrency: parsePositiveInteger(env.MCAS_RESOURCE_CONCURRENCY, concurrency),
    network: env.MCAS_RESOURCE_NETWORK || network,
    version: '1'
  };
}

export function attachResourceProfile(evidence, resourceProfile) {
  if (evidence === null || typeof evidence !== 'object' || Array.isArray(evidence)) {
    return evidence;
  }

  return {
    ...evidence,
    resourceProfile: structuredClone(resourceProfile)
  };
}

function parsePositiveInteger(value, fallback) {
  const parsed = Number(value);

  if (Number.isInteger(parsed) && parsed > 0) {
    return parsed;
  }

  return fallback;
}
