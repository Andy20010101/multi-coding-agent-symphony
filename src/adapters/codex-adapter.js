import { mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { BaseAdapter, buildRunPrompt, validatePrepareInput } from './base-adapter.js';
import { extractEvidencePackageFromSources } from '../evidence-parser.js';
import { NodeProcessRunner } from '../process-runner.js';

const DEFAULT_EVIDENCE_SCHEMA_PATH = fileURLToPath(
  new URL('../../schemas/evidence-package.schema.json', import.meta.url)
);

export class CodexAdapter extends BaseAdapter {
  constructor({
    cliVersion = 'unknown',
    executable = 'codex',
    processRunner = new NodeProcessRunner(),
    timeoutMs = 300000,
    evidenceSchemaPath = DEFAULT_EVIDENCE_SCHEMA_PATH
  } = {}) {
    super({
      adapterId: 'codex',
      cliName: 'codex',
      cliVersion,
      executable,
      modelProfiles: ['gpt-codex-default'],
      workspaceIsolation: 'external-workspace',
      logStrategy: 'jsonl-stdout'
    });
    this.processRunner = processRunner;
    this.timeoutMs = timeoutMs;
    this.evidenceSchemaPath = evidenceSchemaPath;
  }

  async prepare(input) {
    validatePrepareInput(input);
    const outputSchemaPath = input.outputSchemaPath
      ?? (input.executionMode === 'real' ? this.evidenceSchemaPath : null);

    const args = [
      'exec',
      '--json',
      '--cd',
      input.workspace,
      '--sandbox',
      sandboxFor(input.commandSpec.workspacePolicy),
      '--model',
      input.modelProfile
    ];

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
      cwd: input.workspace,
      prompt: buildRunPrompt(input),
      environment: {},
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
    const result = await this.processRunner.run({
      executable: preparedRun.executable,
      args: preparedRun.args,
      cwd: preparedRun.cwd,
      stdin: preparedRun.prompt,
      env: preparedRun.environment,
      timeoutMs: input.timeoutMs ?? this.timeoutMs,
      outputFiles: {
        lastMessage: outputLastMessagePath
      }
    });
    const status = result.exitCode === 0 ? 'completed' : 'failed';
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
      outputFiles: result.outputFiles ?? {},
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
}

function sandboxFor(workspacePolicy) {
  if (workspacePolicy === 'review-only') {
    return 'read-only';
  }

  if (workspacePolicy === 'primary-writer' || workspacePolicy === 'isolated') {
    return 'workspace-write';
  }

  return 'read-only';
}

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

function safeForPath(value) {
  return value.replace(/[^a-zA-Z0-9._-]+/g, '-');
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
