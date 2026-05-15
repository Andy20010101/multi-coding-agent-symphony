import { mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { BaseAdapter, validatePrepareInput } from './base-adapter.js';
import { extractEvidencePackageFromSources } from '../evidence-parser.js';
import { classifyFailure } from '../failure-taxonomy.js';
import { NodeProcessRunner } from '../process-runner.js';
import {
  hasDeniedNetwork,
  hasDeniedShell,
  policyRestrictionLines
} from './policy-permissions.js';

const DEFAULT_EVIDENCE_SCHEMA_PATH = fileURLToPath(
  new URL('../../schemas/codex-evidence-package.schema.json', import.meta.url)
);
export const CODEX_CONFIG_DEFAULT_MODEL_PROFILE = 'codex-config-default';
export const DEFAULT_CODEX_MODEL_PROFILE_MAPPINGS = Object.freeze({
  'gpt-codex-default': CODEX_CONFIG_DEFAULT_MODEL_PROFILE,
  [CODEX_CONFIG_DEFAULT_MODEL_PROFILE]: CODEX_CONFIG_DEFAULT_MODEL_PROFILE
});

export class CodexAdapter extends BaseAdapter {
  constructor({
    cliVersion = 'unknown',
    executable = 'codex',
    processRunner = new NodeProcessRunner(),
    timeoutMs = 300000,
    evidenceSchemaPath = DEFAULT_EVIDENCE_SCHEMA_PATH,
    modelProfileMappings = {}
  } = {}) {
    const resolvedModelProfileMappings = normalizeModelProfileMappings(modelProfileMappings);

    super({
      adapterId: 'codex',
      cliName: 'codex',
      cliVersion,
      executable,
      modelProfiles: [...resolvedModelProfileMappings.keys()],
      workspaceIsolation: 'external-workspace',
      logStrategy: 'jsonl-stdout'
    });
    this.processRunner = processRunner;
    this.timeoutMs = timeoutMs;
    this.evidenceSchemaPath = evidenceSchemaPath;
    this.modelProfileMappings = resolvedModelProfileMappings;
  }

  async prepare(input) {
    validatePrepareInput(input);
    const outputSchemaPath = input.outputSchemaPath
      ?? (input.executionMode === 'real' ? this.evidenceSchemaPath : null);
    const resolvedModel = resolveModelProfile(input.modelProfile, this.modelProfileMappings);
    const policyDecisions = input.policyDecisions ?? [];
    const workspacePath = input.executionMode === 'real'
      ? resolve(input.workspace)
      : input.workspace;

    const args = [
      'exec',
      '--json',
      '--cd',
      workspacePath,
      '--sandbox',
      sandboxFor(input.commandSpec.workspacePolicy, policyDecisions)
    ];

    if (resolvedModel !== CODEX_CONFIG_DEFAULT_MODEL_PROFILE) {
      args.push('--model', resolvedModel);
    }

    if (outputSchemaPath) {
      args.push('--output-schema', outputSchemaPath);
    }

    if (input.outputLastMessagePath) {
      args.push('--output-last-message', input.outputLastMessagePath);
    }

    return {
      adapterId: this.adapterId,
      dryRun: true,
      executable: this.executable,
      args,
      cwd: workspacePath,
      prompt: buildCodexRunPrompt(input),
      environment: {},
      resolvedModelProfile: input.modelProfile,
      resolvedModel,
      outputSchemaPath,
      outputLastMessagePath: input.outputLastMessagePath
    };
  }

  async start(input) {
    if (input.executionMode !== 'real') {
      return super.start(input);
    }

    const runId = `${this.adapterId}-${input.contextPack.task.id}-${this.runs.size + 1}`;
    const outputLastMessagePath = input.outputLastMessagePath
      ?? join(tmpdir(), 'mcas-codex', `${safeForPath(runId)}-last-message.json`);

    await mkdir(dirname(outputLastMessagePath), { recursive: true });

    const preparedRun = await this.prepare({
      ...input,
      outputLastMessagePath
    });
    if (input.lifecycleMode === 'active') {
      if (typeof this.processRunner.start !== 'function') {
        throw new TypeError('processRunner must provide start for active lifecycle mode');
      }

      const processHandle = this.processRunner.start({
        executable: preparedRun.executable,
        args: preparedRun.args,
        cwd: preparedRun.cwd,
        stdin: preparedRun.prompt,
        env: preparedRun.environment,
        timeoutMs: input.timeoutMs ?? this.timeoutMs,
        stallTimeoutMs: input.stallTimeoutMs ?? 0,
        onActivity: input.onActivity,
        outputFiles: {
          lastMessage: outputLastMessagePath
        }
      });
      const handle = {
        runId,
        adapterId: this.adapterId,
        status: 'running',
        dryRun: false,
        preparedRun,
        command: input.commandSpec.name,
        taskId: input.contextPack.task.id,
        workspaceId: input.workspace,
        processHandle
      };

      this.runs.set(runId, handle);
      return publicHandle(handle);
    }

    const result = await this.processRunner.run({
      executable: preparedRun.executable,
      args: preparedRun.args,
      cwd: preparedRun.cwd,
      stdin: preparedRun.prompt,
      env: preparedRun.environment,
      timeoutMs: input.timeoutMs ?? this.timeoutMs,
      stallTimeoutMs: input.stallTimeoutMs ?? 0,
      onActivity: input.onActivity,
      outputFiles: {
        lastMessage: outputLastMessagePath
      }
    });
    const status = result.exitCode === 0 ? 'completed' : 'failed';
    const parsedEvents = parseJsonl(result.stdout);
    const handle = {
      runId,
      adapterId: this.adapterId,
      status,
      dryRun: false,
      preparedRun,
      command: input.commandSpec.name,
      taskId: input.contextPack.task.id,
      workspaceId: input.workspace,
      exitCode: result.exitCode,
      signal: result.signal,
      stdout: result.stdout,
      stderr: result.stderr,
      durationMs: result.durationMs,
      timedOut: result.timedOut,
      stalled: result.stalled,
      outputFiles: result.outputFiles ?? {},
      parsedEvents,
      failure: status === 'failed'
        ? this.normalizeFailure(buildCodexFailureInput({ result, parsedEvents }))
        : null
    };

    this.runs.set(runId, handle);
    return structuredClone(handle);
  }

  async cancel(handle) {
    const stored = this.runs.get(handle.runId);

    if (!stored) {
      throw new Error(`Unknown run id: ${handle.runId}`);
    }

    if (stored.dryRun) {
      return super.cancel(handle);
    }

    if (stored.status === 'cancelled') {
      return {
        runId: stored.runId,
        status: 'cancelled',
        signal: stored.signal
      };
    }

    const cancellation = stored.processHandle?.cancel();
    stored.status = 'cancelled';
    stored.signal = cancellation?.signal ?? stored.signal ?? 'SIGTERM';
    this.runs.set(stored.runId, stored);

    return {
      runId: stored.runId,
      status: 'cancelled',
      signal: stored.signal
    };
  }

  async resume({ runId }) {
    const stored = this.runs.get(runId);

    if (!stored) {
      throw new Error(`Unknown run id: ${runId}`);
    }

    if (stored.dryRun) {
      return super.resume({ runId });
    }

    return publicHandle(stored);
  }

  async *streamEvents(handle) {
    const stored = this.runs.get(handle.runId);

    if (!stored) {
      throw new Error(`Unknown run id: ${handle.runId}`);
    }

    if (stored.dryRun) {
      yield* super.streamEvents(handle);
      return;
    }

    yield {
      type: 'adapter.started',
      runId: stored.runId,
      adapterId: stored.adapterId,
      dryRun: false
    };

    for (const event of stored.parsedEvents) {
      yield {
        type: 'tool.observed',
        runId: stored.runId,
        adapterId: stored.adapterId,
        payload: event
      };
    }

    yield {
      type: 'command.finished',
      runId: stored.runId,
      adapterId: stored.adapterId,
      status: stored.status,
      exitCode: stored.exitCode
    };
  }

  async collectEvidence(handle) {
    const stored = this.runs.get(handle.runId);

    if (!stored) {
      throw new Error(`Unknown run id: ${handle.runId}`);
    }

    if (stored.dryRun) {
      return super.collectEvidence(handle);
    }

    await finalizeActiveRun(stored);

    if (stored.status === 'cancelled') {
      return {
        command: stored.command,
        taskId: stored.taskId,
        workspaceId: stored.workspaceId,
        changedFiles: [],
        checks: [],
        knownRisks: ['cancelled-run'],
        agentSummary: 'Codex real CLI was cancelled before completion.',
        stdout: stored.stdout,
        stderr: stored.stderr,
        version: '1'
      };
    }

    const structuredEvidence = extractStructuredEvidence(stored);

    if (structuredEvidence) {
      return structuredEvidence;
    }

    return {
      command: stored.command,
      taskId: stored.taskId,
      workspaceId: stored.workspaceId,
      changedFiles: [],
      checks: [],
      knownRisks: ['real-cli-output-unverified'],
      agentSummary: `Codex real CLI completed with exit code ${stored.exitCode}.`,
      stdout: stored.stdout,
      stderr: stored.stderr,
      version: '1'
    };
  }

  async collectArtifacts(handle) {
    const stored = this.runs.get(handle.runId);

    if (!stored) {
      throw new Error(`Unknown run id: ${handle.runId}`);
    }

    if (stored.dryRun) {
      return [];
    }

    await finalizeActiveRun(stored);

    return buildCodexArtifacts(stored);
  }

  normalizeFailure(error) {
    const category = mapCodexFailureCategory(error);

    if (category) {
      return classifyFailure(category);
    }

    return super.normalizeFailure(error);
  }
}

async function finalizeActiveRun(stored) {
  if (!stored.processHandle?.result || stored.processFinalized === true) {
    return;
  }

  const result = await stored.processHandle.result;
  stored.exitCode = result.exitCode;
  stored.signal = result.signal;
  stored.stdout = result.stdout;
  stored.stderr = result.stderr;
  stored.durationMs = result.durationMs;
  stored.timedOut = result.timedOut;
  stored.cancelled = result.cancelled;
  stored.stalled = result.stalled;
  stored.outputFiles = result.outputFiles ?? {};
  stored.parsedEvents = parseJsonl(result.stdout);
  if (stored.status !== 'cancelled') {
    stored.status = result.exitCode === 0 ? 'completed' : 'failed';
  }
  stored.processFinalized = true;
}

function publicHandle(handle) {
  const { processHandle, ...publicFields } = handle;
  return structuredClone(publicFields);
}

function sandboxFor(workspacePolicy, policyDecisions = []) {
  if (hasDeniedShell(policyDecisions) || hasDeniedNetwork(policyDecisions)) {
    return 'read-only';
  }

  if (workspacePolicy === 'review-only') {
    return 'read-only';
  }

  if (workspacePolicy === 'primary-writer' || workspacePolicy === 'isolated') {
    return 'workspace-write';
  }

  return 'read-only';
}

function buildCodexRunPrompt({ commandSpec, contextPack, policyDecisions = [] }) {
  const roleGuidance = CODEX_COMMAND_PROMPTS[commandSpec.name] ?? CODEX_COMMAND_PROMPTS.plan;
  const restrictionLines = policyRestrictionLines(policyDecisions);

  return [
    `Command: ${commandSpec.name}`,
    ...roleGuidance,
    `Task: ${contextPack.task.id}`,
    `Repository: ${contextPack.task.repository}`,
    `Objective: ${contextPack.task.objective}`,
    ...constraintLines(contextPack.task.constraints),
    `Acceptance: ${contextPack.task.acceptance.join('; ')}`,
    `Evidence schema: ${commandSpec.evidenceSchema}`,
    `Done criteria: ${commandSpec.doneCriteria.join('; ')}`,
    ...(restrictionLines.length > 0 ? ['Policy restrictions:', ...restrictionLines] : []),
    ...changedFileEvidenceLines(commandSpec),
    'Return an EvidencePackage JSON object with command, taskId, workspaceId, changedFiles, checks, knownRisks, agentSummary, and version.',
    'Set checks to passed only for commands you actually ran or evidence you actually inspected.'
  ].join('\n');
}

function changedFileEvidenceLines(commandSpec) {
  if (commandSpec.name === 'review') {
    return [
      'Evidence ownership: changedFiles must describe only files modified by the review command.',
      'Do not copy implementation changedFiles from prior evidence; report reviewed files in findings or agentSummary instead.',
      'Because review runs read-only, changedFiles must be [] unless the command unexpectedly modified files.'
    ];
  }

  if (commandSpec.name === 'qa') {
    return [
      'Evidence ownership: changedFiles must describe only files modified by the qa command.',
      'Do not copy implementation changedFiles from prior evidence; report tested files in checks or agentSummary instead.',
      'At least one QA checks[] entry must include a non-null artifactId such as qa-verification-log.'
    ];
  }

  return [
    `Evidence ownership: changedFiles must describe only files modified by the ${commandSpec.name} command.`
  ];
}

function constraintLines(constraints = []) {
  if (!Array.isArray(constraints) || constraints.length === 0) {
    return [];
  }

  const verificationCommands = constraints
    .filter((constraint) => typeof constraint === 'string' && constraint.startsWith('verification_command:'))
    .map((constraint) => constraint.slice('verification_command:'.length))
    .filter((command) => command.trim() !== '');
  const otherConstraints = constraints.filter((constraint) => (
    typeof constraint === 'string' && !constraint.startsWith('verification_command:')
  ));
  const lines = otherConstraints.length > 0
    ? [`Constraints: ${otherConstraints.join('; ')}`]
    : [];

  if (verificationCommands.length > 0) {
    lines.push('Required verification commands:');
    lines.push(...verificationCommands.map((command) => `- ${command}`));
    lines.push('For each required verification command, run it and include one checks[] entry whose checks[].command exactly equals that command.');
  }

  return lines;
}

const CODEX_COMMAND_PROMPTS = Object.freeze({
  plan: [
    'Role: planner',
    'Produce an implementation plan, risk list, and verification strategy without modifying files.'
  ],
  implement: [
    'Role: primary writer',
    'Modify only the assigned workspace files needed to satisfy acceptance.',
    'Run focused checks before returning evidence.'
  ],
  review: [
    'Role: reviewer',
    'Do not edit files.',
    'Inspect the implementation evidence and report findings or an explicit no-finding rationale.'
  ],
  'fix-ci': [
    'Role: CI fixer',
    'Make the smallest targeted change needed to address the failing check.',
    'Include the failing and passing check evidence.'
  ],
  qa: [
    'Role: QA verifier',
    'Verify behavior through tests, static checks, or artifact inspection.',
    'Do not mark completion passed without concrete check output.'
  ]
});

function extractStructuredEvidence(stored) {
  return extractEvidencePackageFromSources({
    sources: [
      stored.outputFiles?.lastMessage?.content,
      ...[...stored.parsedEvents].reverse(),
      stored.stdout
    ],
    command: stored.command,
    taskId: stored.taskId,
    workspaceId: stored.workspaceId
  });
}

function buildCodexArtifacts(stored) {
  const artifacts = [
    {
      id: 'codex-stdout-jsonl',
      version: '1',
      kind: 'codex-stdout-jsonl',
      content: stored.stdout ?? ''
    },
    {
      id: 'codex-stderr',
      version: '1',
      kind: 'codex-stderr',
      content: stored.stderr ?? ''
    },
    {
      id: 'codex-parsed-events',
      version: '1',
      kind: 'codex-parsed-events',
      content: stored.parsedEvents ?? []
    }
  ];
  const lastMessage = stored.outputFiles?.lastMessage;

  if (lastMessage) {
    artifacts.push({
      id: 'codex-final-message',
      version: '1',
      kind: 'codex-final-message',
      ...(lastMessage.path ? { path: lastMessage.path } : {}),
      ...(Object.hasOwn(lastMessage, 'content') ? { content: lastMessage.content } : {}),
      ...(lastMessage.error ? { error: lastMessage.error } : {})
    });
  }

  return artifacts;
}

function buildCodexFailureInput({ result, parsedEvents }) {
  if (result.stalled) {
    return {
      code: 'ESTALL',
      signal: result.signal,
      stalled: true
    };
  }

  if (result.timedOut) {
    return {
      code: 'ETIMEDOUT',
      signal: result.signal
    };
  }

  const structuredError = findStructuredErrorEvent(parsedEvents);

  if (structuredError) {
    return {
      code: structuredError.code,
      message: structuredError.message,
      event: structuredError
    };
  }

  return {
    code: 'EEXIT',
    exitCode: result.exitCode,
    signal: result.signal,
    message: result.stderr || result.stdout
  };
}

function findStructuredErrorEvent(parsedEvents) {
  for (const event of [...parsedEvents].reverse()) {
    if (!isPlainObject(event)) {
      continue;
    }

    const type = typeof event.type === 'string' ? event.type.toLowerCase() : '';

    if (type.includes('error') || type.includes('fatal') || typeof event.code === 'string') {
      return event;
    }
  }

  return null;
}

function mapCodexFailureCategory(error) {
  const normalized = [
    error?.category,
    error?.code,
    error?.message,
    error?.event?.type,
    error?.event?.code,
    error?.event?.message
  ]
    .filter((value) => typeof value === 'string')
    .join(' ')
    .toLowerCase()
    .replace(/[_\s]+/g, '-');

  if (normalized.includes('estall') || normalized.includes('stall-timeout')) {
    return 'stall-timeout';
  }

  if (
    normalized.includes('permission-denied')
    || normalized.includes('unauthorized')
    || normalized.includes('forbidden')
    || normalized.includes('eacces')
  ) {
    return 'permission-denied';
  }

  if (normalized.includes('model-off-task') || normalized.includes('off-task')) {
    return 'model-off-task';
  }

  if (isPlainObject(error?.event)) {
    return 'adapter-crashed';
  }

  return null;
}

function safeForPath(value) {
  return value.replace(/[^a-zA-Z0-9._-]+/g, '-');
}

function normalizeModelProfileMappings(modelProfileMappings) {
  if (
    modelProfileMappings === null
    || typeof modelProfileMappings !== 'object'
    || Array.isArray(modelProfileMappings)
  ) {
    throw new TypeError('modelProfileMappings must be an object');
  }

  const mappings = new Map(Object.entries(DEFAULT_CODEX_MODEL_PROFILE_MAPPINGS));

  for (const [profile, model] of Object.entries(modelProfileMappings)) {
    if (typeof profile !== 'string' || profile.trim() === '') {
      throw new TypeError('model profile id must be a non-empty string');
    }

    if (typeof model !== 'string' || model.trim() === '') {
      throw new TypeError(`model mapping for ${profile} must be a non-empty string`);
    }

    mappings.set(profile, model);
  }

  return mappings;
}

function resolveModelProfile(modelProfile, modelProfileMappings) {
  return modelProfileMappings.get(modelProfile) ?? modelProfile;
}

function parseJsonl(output) {
  return output
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      try {
        return JSON.parse(line);
      } catch (error) {
        return {
          type: 'unparsed-line',
          line,
          error: error.message
        };
      }
    });
}

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}
