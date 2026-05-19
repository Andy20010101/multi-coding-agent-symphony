import { ClaudeCodeAdapter } from './adapters/claude-code-adapter.js';
import {
  readRealCliReleaseConfig,
  resolveRealCliModelProfile,
  resolveRealCliProvider
} from './real-cli-config.js';
import { attachResourceProfile, buildResourceProfile } from './resource-profile.js';
import { verifyEvidence } from './verifier.js';

export const REAL_CLAUDE_SMOKE_FLAG = 'MCAS_RUN_REAL_CLAUDE';

export async function runClaudeRealSmoke({
  adapter = new ClaudeCodeAdapter(),
  env = process.env,
  workspace = process.cwd(),
  timeoutMs = parsePositiveInteger(env.MCAS_CLAUDE_TIMEOUT_MS, 180000),
  modelProfile,
  realCliConfig,
  realCliConfigFile
} = {}) {
  if (env[REAL_CLAUDE_SMOKE_FLAG] !== '1') {
    return {
      skipped: true,
      reason: `Set ${REAL_CLAUDE_SMOKE_FLAG}=1 to invoke the real Claude Code model.`
    };
  }

  const releaseConfig = realCliConfig ?? readRealCliReleaseConfig({
    configFile: realCliConfigFile,
    env
  }).config;
  const resolvedModelProfile = modelProfile ?? resolveRealCliModelProfile({
    adapterId: 'claude-code',
    env,
    config: releaseConfig
  }).profile;
  const provider = resolveRealCliProvider({
    adapterId: 'claude-code',
    env,
    config: releaseConfig
  });
  const taskId = `claude-real-smoke-${Date.now()}`;
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
    requestedModelProfile: handle.requestedModelProfile ?? resolvedModelProfile,
    observedModelProfile: handle.observedModelProfile ?? null,
    modelProfileStatus: handle.modelProfileStatus ?? 'unknown',
    modelProfileMismatch: handle.modelProfileMismatch ?? null,
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
    evidenceSchema: 'claude-smoke-evidence.v1'
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
        'Run a read-only smoke test for this harness through Claude Code.',
        'Inspect package.json and README.md only enough to confirm the repository is readable.',
        'Do not edit files.',
        'Return a structured EvidencePackage with one check named claude-real-smoke.',
        'Set that check status to passed only if package.json and README.md were readable.'
      ].join(' '),
      acceptance: [
        'Claude Code real model was invoked',
        'stream-json output contained verifier-readable evidence',
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
