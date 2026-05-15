import { BaseAdapter, buildRunPrompt, validatePrepareInput } from './base-adapter.js';
import { extractEvidencePackageFromSources } from '../evidence-parser.js';
import { NodeProcessRunner } from '../process-runner.js';
import {
  deniedPathRules,
  hasDeniedNetwork,
  hasDeniedShell
} from './policy-permissions.js';

export class ClaudeCodeAdapter extends BaseAdapter {
  constructor({
    cliVersion = 'unknown',
    executable = 'claude',
    processRunner = new NodeProcessRunner(),
    timeoutMs = 300000
  } = {}) {
    super({
      adapterId: 'claude-code',
      cliName: 'claude',
      cliVersion,
      executable,
      modelProfiles: ['deepseek-claude-code'],
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
      permissionModeFor(input.commandSpec.workspacePolicy)
    ];

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
      timeoutMs: input.timeoutMs ?? this.timeoutMs
    });
    const status = result.exitCode === 0 ? 'completed' : 'failed';
    const runId = `${this.adapterId}-${input.contextPack.task.id}-${this.runs.size + 1}`;
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
      parsedEvents: parseJsonl(result.stdout),
      failure: status === 'failed'
        ? this.normalizeFailure(result.timedOut ? { code: 'ETIMEDOUT' } : { code: 'EEXIT' })
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
      return structuredEvidence;
    }

    return {
      command: stored.command,
      taskId: stored.taskId,
      workspaceId: stored.workspaceId,
      changedFiles: [],
      checks: [],
      knownRisks: ['real-cli-output-unverified'],
      agentSummary: `Claude Code real CLI completed with exit code ${stored.exitCode}.`,
      stdout: stored.stdout,
      stderr: stored.stderr,
      version: '1'
    };
  }
}

function permissionModeFor(workspacePolicy) {
  if (workspacePolicy === 'review-only') {
    return 'plan';
  }

  return 'default';
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
