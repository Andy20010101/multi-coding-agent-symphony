import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { BaseAdapter, buildRunPrompt, validatePrepareInput } from './base-adapter.js';
import { extractEvidencePackageFromSources } from '../evidence-parser.js';
import { NodeProcessRunner } from '../process-runner.js';
import {
  deniedPathRules,
  hasDeniedNetwork,
  hasDeniedShell
} from './policy-permissions.js';

const EVIDENCE_SCHEMA_PATH = fileURLToPath(new URL('../../schemas/evidence-package.schema.json', import.meta.url));
const CLAUDE_EVIDENCE_OUTPUT_SCHEMA = JSON.parse(readFileSync(EVIDENCE_SCHEMA_PATH, 'utf8'));
const MODEL_PROFILE_MISMATCH_RISK = 'real-cli-model-profile-mismatch';
const STRUCTURED_EVIDENCE_PROMPT = [
  'Return only one JSON object matching the provided EvidencePackage JSON schema.',
  'Populate command, taskId, and workspaceId from the user prompt.',
  'Use empty arrays for diffSummary and changedFiles when no files changed.',
  'checks must include verifier-readable evidence with output or artifactId.',
  'For non-smoke checks, include command and exitCode or include artifactId.',
  'Do not write evidence files; the final JSON response is the evidence artifact.'
].join(' ');

export class ClaudeCodeAdapter extends BaseAdapter {
  constructor({
    cliVersion = 'unknown',
    executable = 'claude',
    processRunner = new NodeProcessRunner(),
    timeoutMs = 300000,
    modelProfiles = ['deepseek-claude-code']
  } = {}) {
    super({
      adapterId: 'claude-code',
      cliName: 'claude',
      cliVersion,
      executable,
      modelProfiles,
      workspaceIsolation: 'external-workspace',
      logStrategy: 'stream-json-stdout'
    });
    this.processRunner = processRunner;
    this.timeoutMs = timeoutMs;
  }

  async prepare(input) {
    validatePrepareInput(input);

    const args = [
      '-p',
      '--output-format',
      'stream-json',
      '--verbose',
      '--add-dir',
      input.workspace,
      '--model',
      input.modelProfile,
      '--permission-mode',
      permissionModeFor(input.commandSpec.workspacePolicy),
      '--append-system-prompt',
      STRUCTURED_EVIDENCE_PROMPT,
      '--json-schema',
      JSON.stringify(CLAUDE_EVIDENCE_OUTPUT_SCHEMA)
    ];
    const allowedTools = allowedToolsFrom(input.commandSpec.allowedTools);

    if (allowedTools.length > 0) {
      args.push('--tools', ...allowedTools);
    }

    const disallowedTools = disallowedToolsFrom(input.policyDecisions ?? []);

    if (disallowedTools.length > 0) {
      args.push('--disallowedTools', ...disallowedTools);
    }

    return {
      adapterId: this.adapterId,
      dryRun: true,
      executable: this.executable,
      args,
      cwd: input.workspace,
      prompt: buildRunPrompt(input),
      environment: {}
    };
  }

  async start(input) {
    if (input.executionMode !== 'real') {
      return super.start(input);
    }

    const preparedRun = await this.prepare(input);
    const result = await this.processRunner.run({
      executable: preparedRun.executable,
      args: preparedRun.args,
      cwd: preparedRun.cwd,
      stdin: preparedRun.prompt,
      env: preparedRun.environment,
      timeoutMs: input.timeoutMs ?? this.timeoutMs,
      stallTimeoutMs: input.stallTimeoutMs ?? 0,
      onActivity: input.onActivity
    });
    const status = result.exitCode === 0 ? 'completed' : 'failed';
    const runId = this.nextRunId(input.contextPack.task.id);
    const parsedEvents = parseJsonl(result.stdout);
    const modelProfileDiagnostics = buildModelProfileDiagnostics({
      requestedModelProfile: input.modelProfile,
      parsedEvents
    });
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
      parsedEvents,
      ...modelProfileDiagnostics,
      failure: status === 'failed'
        ? this.normalizeFailure(result.stalled ? { code: 'ESTALL' } : result.timedOut ? { code: 'ETIMEDOUT' } : { code: 'EEXIT' })
        : null
    };

    this.runs.set(runId, handle);
    return structuredClone(handle);
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

    const structuredEvidence = extractEvidencePackageFromSources({
      sources: [
        ...[...stored.parsedEvents].reverse(),
        stored.stdout
      ],
      command: stored.command,
      taskId: stored.taskId,
      workspaceId: stored.workspaceId
    });

    if (structuredEvidence) {
      return withModelProfileKnownRisks(structuredEvidence, stored);
    }

    return {
      command: stored.command,
      taskId: stored.taskId,
      workspaceId: stored.workspaceId,
      changedFiles: [],
      checks: [],
      knownRisks: withUniqueRisks(['real-cli-output-unverified'], modelProfileKnownRisks(stored)),
      agentSummary: `Claude Code real CLI completed with exit code ${stored.exitCode}.`,
      stdout: stored.stdout,
      stderr: stored.stderr,
      version: '1'
    };
  }
}

function permissionModeFor(workspacePolicy) {
  if (workspacePolicy === 'review-only') {
    return 'dontAsk';
  }

  return 'default';
}

function allowedToolsFrom(tools) {
  const allowedTools = new Set();

  for (const tool of tools) {
    if (tool === 'read') {
      allowedTools.add('Read');
    }

    if (tool === 'write') {
      allowedTools.add('Edit');
      allowedTools.add('Write');
    }

    if (tool === 'shell' || tool === 'test') {
      allowedTools.add('Bash');
    }

    if (tool === 'network') {
      allowedTools.add('WebFetch');
      allowedTools.add('WebSearch');
    }
  }

  return Array.from(allowedTools);
}

function disallowedToolsFrom(policyDecisions) {
  const disallowedTools = new Set();

  for (const pathRule of deniedPathRules(policyDecisions)) {
    disallowedTools.add(`Read(${pathRule})`);
  }

  if (hasDeniedShell(policyDecisions)) {
    disallowedTools.add('Bash');
  }

  if (hasDeniedNetwork(policyDecisions)) {
    disallowedTools.add('WebFetch');
    disallowedTools.add('WebSearch');
  }

  return Array.from(disallowedTools);
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

function buildModelProfileDiagnostics({ requestedModelProfile, parsedEvents }) {
  const observedModelProfile = observedModelProfileFromEvents(parsedEvents);
  const normalizedRequested = nonEmptyStringOrNull(requestedModelProfile);

  if (!normalizedRequested || !observedModelProfile) {
    return {
      requestedModelProfile: normalizedRequested,
      observedModelProfile,
      modelProfileStatus: 'unknown',
      modelProfileMismatch: null
    };
  }

  if (normalizedRequested === observedModelProfile) {
    return {
      requestedModelProfile: normalizedRequested,
      observedModelProfile,
      modelProfileStatus: 'matched',
      modelProfileMismatch: null
    };
  }

  return {
    requestedModelProfile: normalizedRequested,
    observedModelProfile,
    modelProfileStatus: 'mismatched',
    modelProfileMismatch: {
      requestedModelProfile: normalizedRequested,
      observedModelProfile
    }
  };
}

function observedModelProfileFromEvents(events) {
  if (!Array.isArray(events)) {
    return null;
  }

  const initEvent = events.find((event) => {
    return isPlainObject(event) &&
      event.type === 'system' &&
      event.subtype === 'init' &&
      nonEmptyStringOrNull(event.model);
  });

  if (initEvent) {
    return nonEmptyStringOrNull(initEvent.model);
  }

  const directModelEvent = events.find((event) => {
    return isPlainObject(event) && nonEmptyStringOrNull(event.model);
  });

  return directModelEvent ? nonEmptyStringOrNull(directModelEvent.model) : null;
}

function withModelProfileKnownRisks(evidence, stored) {
  const modelRisks = modelProfileKnownRisks(stored);

  if (modelRisks.length === 0) {
    return evidence;
  }

  return {
    ...evidence,
    knownRisks: withUniqueRisks(evidence.knownRisks, modelRisks)
  };
}

function modelProfileKnownRisks(stored) {
  return stored.modelProfileStatus === 'mismatched' ? [MODEL_PROFILE_MISMATCH_RISK] : [];
}

function withUniqueRisks(existingRisks, additionalRisks) {
  const seen = new Set();
  const risks = [];

  for (const risk of [
    ...(Array.isArray(existingRisks) ? existingRisks : []),
    ...(Array.isArray(additionalRisks) ? additionalRisks : [])
  ]) {
    const normalized = nonEmptyStringOrNull(risk);

    if (!normalized || seen.has(normalized)) {
      continue;
    }

    seen.add(normalized);
    risks.push(normalized);
  }

  return risks;
}

function nonEmptyStringOrNull(value) {
  return typeof value === 'string' && value.trim() !== '' ? value.trim() : null;
}

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}
