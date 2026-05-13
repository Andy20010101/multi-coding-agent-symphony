import { execFile } from 'node:child_process';
import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { promisify } from 'node:util';

import { CODEX_CONFIG_DEFAULT_MODEL_PROFILE, CodexAdapter } from './adapters/codex-adapter.js';
import { attachResourceProfile, buildResourceProfile } from './resource-profile.js';
import { verifyEvidence } from './verifier.js';

const execFileAsync = promisify(execFile);

export const REAL_CODEX_SMOKE_FLAG = 'MCAS_RUN_REAL_CODEX';
export const REAL_CODEX_WRITER_SMOKE_FLAG = 'MCAS_RUN_REAL_CODEX_WRITER';

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
  const resourceProfile = buildResourceProfile({ env, timeoutMs, network: 'enabled' });
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

  const evidence = attachResourceProfile(await adapter.collectEvidence(handle), resourceProfile);
  const verification = verifyEvidence({ commandSpec, evidence });

  return {
    skipped: false,
    taskId,
    workspace,
    modelProfile,
    adapterId: handle.adapterId,
    handleStatus: handle.status,
    exitCode: handle.exitCode,
    resourceProfile,
    verification,
    evidence,
    eventTypes: events.map((event) => event.type)
  };
}

export async function runCodexWriterSmoke({
  adapter = new CodexAdapter(),
  env = process.env,
  workspace,
  timeoutMs = parsePositiveInteger(env.MCAS_CODEX_WRITER_TIMEOUT_MS, 180000),
  modelProfile = env.MCAS_CODEX_WRITER_MODEL || env.MCAS_CODEX_MODEL || CODEX_CONFIG_DEFAULT_MODEL_PROFILE
} = {}) {
  if (env[REAL_CODEX_WRITER_SMOKE_FLAG] !== '1') {
    return {
      skipped: true,
      reason: `Set ${REAL_CODEX_WRITER_SMOKE_FLAG}=1 to invoke the real Codex writer smoke.`
    };
  }

  const smokeWorkspace = workspace ?? await createWriterSmokeWorkspace();
  const taskId = `codex-writer-smoke-${Date.now()}`;
  const commandSpec = buildWriterSmokeCommandSpec();
  const resourceProfile = buildResourceProfile({ env, timeoutMs, network: 'enabled' });
  const handle = await adapter.start({
    commandSpec,
    contextPack: buildWriterSmokeContextPack(taskId),
    workspace: smokeWorkspace,
    modelProfile,
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
    workspace: smokeWorkspace,
    modelProfile,
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

function buildWriterSmokeCommandSpec() {
  return {
    name: 'implement',
    version: '1',
    allowedTools: ['read', 'write', 'shell', 'test'],
    workspacePolicy: 'primary-writer',
    doneCriteria: ['diff-created', 'tests-run', 'evidence-written'],
    evidenceSchema: 'writer-smoke-evidence.v1'
  };
}

function buildWriterSmokeContextPack(taskId) {
  return {
    version: '1',
    commandName: 'implement',
    task: {
      id: taskId,
      source: 'manual',
      repository: 'isolated-temp-workspace',
      objective: [
        'Run an isolated writer smoke test for this harness.',
        'Create or update codex-writer-smoke.txt with the exact text "codex writer smoke passed".',
        'Do not access paths outside the workspace.',
        'Return a structured EvidencePackage with changedFiles containing codex-writer-smoke.txt.',
        'Return one check named codex-writer-smoke with status passed only if the file exists and contains the exact text.'
      ].join(' '),
      acceptance: [
        'Codex real writer model was invoked',
        'codex-writer-smoke.txt was changed in the isolated workspace',
        'verifier can pass the returned structured check'
      ],
      version: '1'
    },
    events: [],
    artifactRefs: []
  };
}

async function createWriterSmokeWorkspace() {
  const workspace = await mkdtemp(join(tmpdir(), 'mcas-codex-writer-smoke-'));

  await writeFile(join(workspace, 'README.md'), '# Codex Writer Smoke\n', 'utf8');
  await writeFile(
    join(workspace, 'package.json'),
    `${JSON.stringify({
      name: 'codex-writer-smoke',
      version: '0.0.0',
      private: true,
      type: 'module'
    }, null, 2)}\n`,
    'utf8'
  );
  await execFileAsync('git', ['init'], { cwd: workspace });

  return workspace;
}

function parsePositiveInteger(value, fallback) {
  const parsed = Number(value);

  if (Number.isInteger(parsed) && parsed > 0) {
    return parsed;
  }

  return fallback;
}
