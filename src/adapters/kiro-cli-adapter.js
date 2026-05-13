import { BaseAdapter, buildRunPrompt, validatePrepareInput } from './base-adapter.js';
import { extractEvidencePackageFromSources } from '../evidence-parser.js';
import { NodeProcessRunner } from '../process-runner.js';

export class KiroCliAdapter extends BaseAdapter {
  constructor({
    cliVersion = 'unknown',
    executable = 'kiro-cli',
    processRunner = new NodeProcessRunner(),
    timeoutMs = 300000
  } = {}) {
    super({
      adapterId: 'kiro-cli',
      cliName: 'kiro-cli',
      cliVersion,
      executable,
      modelProfiles: ['claude-kiro-default'],
      workspaceIsolation: 'external-workspace',
      logStrategy: 'stdout'
    });
    this.processRunner = processRunner;
    this.timeoutMs = timeoutMs;
  }

  async prepare(input) {
    validatePrepareInput(input);

    const trustTools = trustToolsFor(input.commandSpec.allowedTools, input.policyDecisions ?? []);
    const args = [
      'chat',
      '--no-interactive',
      `--trust-tools=${trustTools.join(',')}`
    ];

    if (input.requireMcpStartup) {
      args.push('--require-mcp-startup');
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
      agentSummary: `Kiro CLI real execution completed with exit code ${stored.exitCode}.`,
      stdout: stored.stdout,
      stderr: stored.stderr,
      version: '1'
    };
  }
}

function trustToolsFor(allowedTools, policyDecisions = []) {
  const categories = new Set();

  for (const tool of allowedTools) {
    if (tool === 'read') {
      categories.add('read');
      categories.add('grep');
    }

    if (tool === 'write') {
      categories.add('write');
    }

    if (tool === 'shell' || tool === 'test') {
      categories.add('bash');
    }
  }

  const deniedCategories = deniedTrustCategoriesFor(policyDecisions);

  for (const deniedCategory of deniedCategories) {
    categories.delete(deniedCategory);
  }

  return Array.from(categories);
}

function deniedTrustCategoriesFor(policyDecisions) {
  const deniedCategories = new Set();

  for (const decision of policyDecisions) {
    if (decision?.decision !== 'deny') {
      continue;
    }

    if (deniesShell(decision) || deniesNetwork(decision)) {
      deniedCategories.add('bash');
    }
  }

  return deniedCategories;
}

function deniesShell(decision) {
  return decisionHasAnyValue(decision, ['shell', 'test']) ||
    decision.reason === 'command-not-allowed' ||
    decision.reason === 'invalid-command';
}

function deniesNetwork(decision) {
  return decisionHasAnyValue(decision, ['network']) ||
    decision.reason === 'network-denied';
}

function decisionHasAnyValue(decision, values) {
  const normalizedValues = new Set(values);
  const candidates = [
    decision.action,
    decision.tool,
    decision.toolName,
    decision.requestedTool,
    decision.matchedRule
  ];

  return candidates.some((candidate) => typeof candidate === 'string' && normalizedValues.has(candidate));
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
