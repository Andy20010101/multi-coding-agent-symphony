#!/usr/bin/env node

import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { ArtifactStore } from '../src/artifact-store.js';
import { CodexAdapter } from '../src/adapters/codex-adapter.js';
import { NodeProcessRunner } from '../src/process-runner.js';
import { Orchestrator } from '../src/orchestrator.js';
import { RouterScheduler } from '../src/router-scheduler.js';
import { SessionEventLog } from '../src/session-event-log.js';
import { TaskQueue } from '../src/task-queue.js';
import { fetchGitHubIssueTaskSpec } from '../src/trackers/github-intake.js';
import { WorkspaceManager } from '../src/workspace-manager.js';

const EXIT_CODES = {
  ok: 0,
  failure: 1,
  usage: 64,
  verifierFailure: 70
};

const COMMANDS = [
  'doctor',
  'github issue',
  'queue manual',
  'run-next'
];

export async function runMcasCli({
  argv = process.argv.slice(2),
  stdout = process.stdout,
  stderr = process.stderr,
  runner,
  adapterFactory = () => new CliDryRunCodexAdapter()
} = {}) {
  try {
    if (!Array.isArray(argv)) {
      throw new UsageError('argv must be an array');
    }

    const [command, subcommand, ...rest] = argv;

    if (command === 'doctor') {
      writeJson(stdout, buildDoctorSummary());
      return EXIT_CODES.ok;
    }

    if (command === 'github' && subcommand === 'issue') {
      const result = await runGitHubIssueIntake({
        args: rest,
        runner: runner ?? new NodeProcessRunner()
      });

      writeJson(stdout, result);
      return EXIT_CODES.ok;
    }

    if (command === 'queue' && subcommand === 'manual') {
      const result = runManualTaskQueue({
        args: rest
      });

      writeJson(stdout, result);
      return EXIT_CODES.ok;
    }

    if (command === 'run-next') {
      const result = await runNextWorkflow({
        args: [subcommand, ...rest].filter((value) => value !== undefined),
        adapterFactory
      });

      writeJson(stdout, result.output);
      return result.exitCode;
    }

    throw new UsageError('unknown command');
  } catch (error) {
    const exitCode = error instanceof UsageError ? EXIT_CODES.usage : EXIT_CODES.failure;

    writeJson(stderr, {
      version: '1',
      status: 'error',
      exitCode,
      message: error.message
    });

    return exitCode;
  }
}

function buildDoctorSummary() {
  return {
    version: '1',
    status: 'ok',
    nodeVersion: process.versions.node,
    packageManager: 'pnpm',
    commands: COMMANDS
  };
}

async function runGitHubIssueIntake({ args, runner }) {
  const repository = readOption(args, '--repo');
  const issueNumber = toPositiveInteger(readOption(args, '--number'), '--number');
  const taskSpec = await fetchGitHubIssueTaskSpec({
    repository,
    issueNumber,
    runner
  });

  return {
    version: '1',
    command: 'github issue',
    mode: 'read-only-intake',
    modelInvocation: false,
    taskSpec
  };
}

function runManualTaskQueue({ args }) {
  const stateFile = readOption(args, '--state-file');
  const task = {
    id: readOption(args, '--id'),
    source: 'manual',
    repository: readOption(args, '--repo'),
    objective: readOption(args, '--objective'),
    acceptance: readOptions(args, '--acceptance'),
    priority: readOptionalOption(args, '--priority') ?? 'normal',
    version: '1'
  };
  const queue = new TaskQueue({ stateFile });
  const record = queue.enqueue(task);

  return {
    version: '1',
    command: 'queue manual',
    status: 'queued',
    modelInvocation: false,
    stateFile,
    taskId: record.task.id,
    queueStatus: record.status,
    sequence: record.sequence,
    createdEventId: record.createdEventId
  };
}

async function runNextWorkflow({ args, adapterFactory }) {
  const paths = resolveRuntimePaths(args);
  const adapter = await adapterFactory();
  const capabilityReport = await adapter.probe();
  const taskQueue = new TaskQueue({ stateFile: paths.stateFile });
  const orchestrator = new Orchestrator({
    artifactStore: new ArtifactStore(paths.artifactDirectory),
    eventLog: new SessionEventLog(paths.eventDirectory, paths.sessionId),
    workspaceManager: new WorkspaceManager({ rootDirectory: paths.workspaceDirectory }),
    scheduler: new RouterScheduler({ capabilityReports: [capabilityReport] }),
    taskQueue,
    adapters: {
      [adapter.adapterId]: adapter
    }
  });
  const result = await orchestrator.runNextTask({
    commandSequence: readOptionalOption(args, '--sequence') ?? 'standard',
    leaseTimeoutMs: readOptionalPositiveInteger(args, '--lease-timeout-ms'),
    now: readOptionalOption(args, '--now')
  });

  if (result === null) {
    return {
      exitCode: EXIT_CODES.ok,
      output: {
        version: '1',
        command: 'run-next',
        status: 'idle',
        exitCode: EXIT_CODES.ok,
        ...paths
      }
    };
  }

  const exitCode = result.status === 'passed' ? EXIT_CODES.ok : EXIT_CODES.verifierFailure;

  return {
    exitCode,
    output: {
      version: '1',
      command: 'run-next',
      status: result.status,
      exitCode,
      ...paths,
      taskId: result.taskId,
      workflowStatus: result.status,
      commands: result.commands.map(summarizeCommandRun),
      artifactRefs: result.artifactRefs,
      ...(result.failedCommand ? { failedCommand: result.failedCommand } : {}),
      ...(result.failure ? { failure: result.failure } : {}),
      ...(result.retryPlan ? { retryPlan: result.retryPlan } : {})
    }
  };
}

function resolveRuntimePaths(args) {
  const runtimeDirectory = readOptionalOption(args, '--runtime-dir') ?? '.mcas';

  return {
    stateFile: readOptionalOption(args, '--state-file') ?? join(runtimeDirectory, 'queue.json'),
    artifactDirectory: readOptionalOption(args, '--artifact-dir') ?? join(runtimeDirectory, 'artifacts'),
    eventDirectory: readOptionalOption(args, '--event-dir') ?? join(runtimeDirectory, 'events'),
    workspaceDirectory: readOptionalOption(args, '--workspace-dir') ?? join(runtimeDirectory, 'workspaces'),
    sessionId: readOptionalOption(args, '--session-id') ?? 'mcas-cli'
  };
}

function summarizeCommandRun(commandRun) {
  return {
    command: commandRun.command,
    adapterId: commandRun.adapterId,
    workspaceId: commandRun.workspace.workspaceId,
    artifactId: commandRun.artifactId,
    runArtifactId: commandRun.runArtifactId,
    routeDecisionArtifactId: commandRun.routeDecisionArtifactId,
    verificationStatus: commandRun.verification.status
  };
}

function readOption(args, optionName) {
  const optionIndex = args.indexOf(optionName);

  if (optionIndex === -1) {
    throw new UsageError(`${optionName} is required`);
  }

  const value = args[optionIndex + 1];

  if (typeof value !== 'string' || value.trim() === '' || value.startsWith('--')) {
    throw new UsageError(`${optionName} requires a value`);
  }

  return value;
}

function readOptionalOption(args, optionName) {
  const optionIndex = args.indexOf(optionName);

  if (optionIndex === -1) {
    return undefined;
  }

  const value = args[optionIndex + 1];

  if (typeof value !== 'string' || value.trim() === '' || value.startsWith('--')) {
    throw new UsageError(`${optionName} requires a value`);
  }

  return value;
}

function readOptions(args, optionName) {
  const values = [];

  for (let index = 0; index < args.length; index += 1) {
    if (args[index] !== optionName) {
      continue;
    }

    const value = args[index + 1];

    if (typeof value !== 'string' || value.trim() === '' || value.startsWith('--')) {
      throw new UsageError(`${optionName} requires a value`);
    }

    values.push(value);
  }

  if (values.length === 0) {
    throw new UsageError(`${optionName} is required`);
  }

  return values;
}

function toPositiveInteger(value, field) {
  const number = Number.parseInt(value, 10);

  if (!Number.isInteger(number) || number < 1 || String(number) !== value) {
    throw new UsageError(`${field} must be a positive integer`);
  }

  return number;
}

function readOptionalPositiveInteger(args, optionName) {
  const value = readOptionalOption(args, optionName);

  if (value === undefined) {
    return undefined;
  }

  return toPositiveInteger(value, optionName);
}

function writeJson(stream, value) {
  stream.write(`${JSON.stringify(value, null, 2)}\n`);
}

class UsageError extends Error {
  constructor(message) {
    super(message);
    this.name = 'UsageError';
  }
}

class CliDryRunCodexAdapter extends CodexAdapter {
  constructor() {
    super({ cliVersion: 'synthetic-dry-run' });
  }

  async collectEvidence(handle) {
    const changedFiles = handle.command === 'implement' ? ['synthetic-dry-run.txt'] : [];

    return {
      command: handle.command,
      taskId: handle.taskId,
      workspaceId: handle.workspaceId,
      diffSummary: changedFiles.length > 0 ? ['Synthetic CLI dry-run change summary.'] : [],
      changedFiles,
      checks: [{
        name: 'mcas-cli-dry-run',
        status: 'passed',
        command: 'mcas-cli-dry-run',
        exitCode: 0,
        artifactId: `${handle.command}-dry-run-check`,
        output: 'Synthetic CLI dry-run check passed.'
      }],
      knownRisks: ['synthetic-dry-run-no-real-model'],
      agentSummary: 'MCAS CLI synthetic dry-run evidence.',
      ...(handle.command === 'review' ? { noFindingRationale: 'Synthetic dry-run review found no issues.' } : {}),
      version: '1'
    };
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const exitCode = await runMcasCli();
  process.exitCode = exitCode;
}
