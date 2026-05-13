import { CODEX_CONFIG_DEFAULT_MODEL_PROFILE, CodexAdapter } from './adapters/codex-adapter.js';
import { verifyEvidence } from './verifier.js';

export const REAL_CODEX_SMOKE_FLAG = 'MCAS_RUN_REAL_CODEX';

export async function runCodexRealSmoke({
  adapter = new CodexAdapter(),
  env = process.env,
  workspace = process.cwd(),
  timeoutMs = parsePositiveInteger(env.MCAS_CODEX_TIMEOUT_MS, 180000),
  modelProfile = env.MCAS_CODEX_MODEL || CODEX_CONFIG_DEFAULT_MODEL_PROFILE
} = {}) {
  if (env[REAL_CODEX_SMOKE_FLAG] !== '1') {
    return {
      skipped: true,
      reason: `Set ${REAL_CODEX_SMOKE_FLAG}=1 to invoke the real Codex model.`
    };
  }

  const taskId = `codex-real-smoke-${Date.now()}`;
  const commandSpec = buildSmokeCommandSpec();
  const handle = await adapter.start({
    commandSpec,
    contextPack: buildSmokeContextPack(taskId),
    workspace,
    modelProfile,
    executionMode: 'real',
    timeoutMs
  });
  const events = [];

  for await (const event of adapter.streamEvents(handle)) {
    events.push(event);
  }

  const evidence = await adapter.collectEvidence(handle);
  const verification = verifyEvidence({ commandSpec, evidence });

  return {
    skipped: false,
    taskId,
    workspace,
    modelProfile,
    adapterId: handle.adapterId,
    handleStatus: handle.status,
    exitCode: handle.exitCode,
    verification,
    evidence,
    eventTypes: events.map((event) => event.type)
  };
}

function buildSmokeCommandSpec() {
  return {
    name: 'qa',
    version: '1',
    allowedTools: ['read', 'shell'],
    workspacePolicy: 'review-only',
    doneCriteria: ['real-model-called', 'structured-evidence-written'],
    evidenceSchema: 'smoke-evidence.v1'
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
        'Run a read-only smoke test for this harness.',
        'Inspect package.json and README.md only enough to confirm the repository is readable.',
        'Do not edit files.',
        'Return a structured EvidencePackage with one check named codex-real-smoke.',
        'Set that check status to passed only if package.json and README.md were readable.'
      ].join(' '),
      acceptance: [
        'Codex real model was invoked',
        'final message matched the EvidencePackage schema',
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
