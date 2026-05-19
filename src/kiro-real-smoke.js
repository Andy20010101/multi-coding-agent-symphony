import { KiroCliAdapter } from './adapters/kiro-cli-adapter.js';
import {
  readRealCliReleaseConfig,
  resolveRealCliModelProfile,
  resolveRealCliProvider
} from './real-cli-config.js';
import { attachResourceProfile, buildResourceProfile } from './resource-profile.js';
import { verifyEvidence } from './verifier.js';

export const REAL_KIRO_SMOKE_FLAG = 'MCAS_RUN_REAL_KIRO';

export async function runKiroRealSmoke({
  adapter = new KiroCliAdapter(),
  env = process.env,
  workspace = process.cwd(),
  timeoutMs = parsePositiveInteger(env.MCAS_KIRO_TIMEOUT_MS, 180000),
  modelProfile,
  realCliConfig,
  realCliConfigFile
} = {}) {
  if (env[REAL_KIRO_SMOKE_FLAG] !== '1') {
    return {
      skipped: true,
      reason: `Set ${REAL_KIRO_SMOKE_FLAG}=1 to invoke the real Kiro CLI model.`
    };
  }

  const releaseConfig = realCliConfig ?? readRealCliReleaseConfig({
    configFile: realCliConfigFile,
    env
  }).config;
  const resolvedModelProfile = modelProfile ?? resolveRealCliModelProfile({
    adapterId: 'kiro-cli',
    env,
    config: releaseConfig
  }).profile;
  const provider = resolveRealCliProvider({
    adapterId: 'kiro-cli',
    env,
    config: releaseConfig
  });
  const taskId = `kiro-real-smoke-${Date.now()}`;
  const commandSpec = buildSmokeCommandSpec();
  const resourceProfile = buildResourceProfile({ env, timeoutMs, network: 'enabled' });
  const handle = await adapter.start({
    commandSpec,
    contextPack: buildSmokeContextPack(taskId),
    workspace,
    modelProfile: resolvedModelProfile,
    executionMode: 'real',
    timeoutMs
  });
  const events = [];

  for await (const event of adapter.streamEvents(handle)) {
    events.push(event);
  }

  const evidence = attachResourceProfile(await adapter.collectEvidence(handle), resourceProfile);
  const verification = verifyEvidence({ commandSpec, evidence });

  return {
    skipped: false,
    taskId,
    runId: handle.runId,
    workspace,
    modelProfile: resolvedModelProfile,
    provider,
    adapterId: handle.adapterId,
    handleStatus: handle.status,
    exitCode: handle.exitCode,
    resourceProfile,
    verification,
    evidence,
    eventTypes: events.map((event) => event.type)
  };
}

function buildSmokeCommandSpec() {
  return {
    name: 'qa',
    version: '1',
    allowedTools: ['read'],
    workspacePolicy: 'review-only',
    doneCriteria: ['real-model-called', 'structured-evidence-written'],
    evidenceSchema: 'kiro-smoke-evidence.v1'
  };
}

function buildSmokeContextPack(taskId) {
  return {
    version: '1',
    commandName: 'qa',
    task: {
      id: taskId,
      source: 'manual',
      repository: 'local',
      objective: [
        'Run a read-only smoke test for this harness through Kiro CLI.',
        'Inspect package.json and README.md only enough to confirm the repository is readable.',
        'Do not edit files.',
        'Return a structured EvidencePackage with one check named kiro-real-smoke.',
        'Set that check status to passed only if package.json and README.md were readable.'
      ].join(' '),
      acceptance: [
        'Kiro CLI real model was invoked',
        'stdout contained verifier-readable evidence',
        'verifier can pass the returned structured check'
      ],
      version: '1'
    },
    events: [],
    artifactRefs: []
  };
}

function parsePositiveInteger(value, fallback) {
  const parsed = Number(value);

  if (Number.isInteger(parsed) && parsed > 0) {
    return parsed;
  }

  return fallback;
}
