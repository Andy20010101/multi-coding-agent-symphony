#!/usr/bin/env node

import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { ArtifactStore } from '../src/artifact-store.js';
import { ClaudeCodeAdapter } from '../src/adapters/claude-code-adapter.js';
import { CodexAdapter } from '../src/adapters/codex-adapter.js';
import { KiroCliAdapter } from '../src/adapters/kiro-cli-adapter.js';
import { NodeProcessRunner } from '../src/process-runner.js';
import { Orchestrator } from '../src/orchestrator.js';
import { PolicyEngine } from '../src/policy-engine.js';
import { RouterScheduler } from '../src/router-scheduler.js';
import { SessionEventLog } from '../src/session-event-log.js';
import { TaskQueue } from '../src/task-queue.js';
import { fetchGitHubIssueTaskSpec } from '../src/trackers/github-intake.js';
import { WorkspaceManager } from '../src/workspace-manager.js';
import {
  normalizeRealCliDoctorAdapter,
  runRealCliDoctor
} from '../src/real-cli-doctor.js';
import {
  readRealCliReleaseConfig,
  resolveRealCliModelProfile
} from '../src/real-cli-config.js';
import {
  TaskPacketValidationError,
  buildExpectedChecks,
  buildHarnessPolicy,
  readTaskPacketJsonFile,
  runHarnessTaskPacket
} from '../src/integrations/harness-bridge.js';
import { HarnessEvidenceSink } from '../src/integrations/harness-evidence-sink.js';

const EXIT_CODES = {
  ok: 0,
  failure: 1,
  usage: 64,
  verifierFailure: 70
};
const PACKAGE_ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)));

const COMMANDS = [
  'doctor',
  'github issue',
  'harness run-taskpacket',
  'queue manual',
  'run-next',
  'run-task',
  'smoke',
  'eval replay'
];

const REAL_CLI_GATES = {
  codex: 'MCAS_RUN_REAL_CODEX',
  'claude-code': 'MCAS_RUN_REAL_CLAUDE',
  'kiro-cli': 'MCAS_RUN_REAL_KIRO'
};

export async function runMcasCli({
  argv = process.argv.slice(2),
  stdout = process.stdout,
  stderr = process.stderr,
  runner,
  env = process.env,
  adapterFactory = createCliAdapter
} = {}) {
  try {
    if (!Array.isArray(argv)) {
      throw new UsageError('argv must be an array');
    }

    const [command, subcommand, ...rest] = argv;

    if (command === 'doctor') {
      const doctorArgs = [subcommand, ...rest].filter((value) => value !== undefined);

      if (doctorArgs.includes('--real-cli')) {
        const result = await runRealCliDoctorCommand({
          args: doctorArgs,
          runner: runner ?? new NodeProcessRunner(),
          env
        });

        writeJson(stdout, result.output);
        return result.exitCode;
      }

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

    if (command === 'harness' && subcommand === 'run-taskpacket') {
      const result = await runHarnessTaskPacketWorkflow({
        args: rest,
        adapterFactory
      });

      writeJson(stdout, result.output);
      return result.exitCode;
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

    if (command === 'run-task') {
      const result = await runTaskFileWorkflow({
        args: [subcommand, ...rest].filter((value) => value !== undefined),
        adapterFactory
      });

      writeJson(stdout, result.output);
      return result.exitCode;
    }

    if (command === 'smoke') {
      const result = await runSmokeCommand({
        adapter: subcommand,
        args: rest,
        runner: runner ?? new NodeProcessRunner()
      });

      writeJson(stdout, result.output);
      return result.exitCode;
    }

    if (command === 'eval' && subcommand === 'replay') {
      const result = await runEvalReplay({
        args: rest,
        runner: runner ?? new NodeProcessRunner()
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

async function runRealCliDoctorCommand({ args, runner, env }) {
  const adapterIds = normalizeRealCliDoctorAdapter(readOptionalOption(args, '--adapter'));
  const output = await runRealCliDoctor({
    runner,
    env,
    configFile: readOptionalOption(args, '--real-cli-config'),
    adapterIds,
    requireGates: args.includes('--require-gates'),
    proofDirectory: readOptionalOption(args, '--proof-dir'),
    timeoutMs: readOptionalPositiveInteger(args, '--timeout-ms') ?? 15000
  });
  const exitCode = output.status === 'ok' ? EXIT_CODES.ok : EXIT_CODES.failure;

  return {
    exitCode,
    output: {
      ...buildDoctorSummary(),
      ...output,
      exitCode
    }
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
  const paths = resolveRuntimePaths(args);
  const stateFile = paths.stateFile;
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
    ...(paths.configFile ? { configFile: paths.configFile } : {}),
    stateFile,
    taskId: record.task.id,
    queueStatus: record.status,
    sequence: record.sequence,
    createdEventId: record.createdEventId
  };
}

async function runNextWorkflow({ args, adapterFactory }) {
  const paths = resolveRuntimePaths(args);
  const workflowOptions = resolveWorkflowOptions(args);
  const taskQueue = new TaskQueue({ stateFile: paths.stateFile });
  const orchestrator = await buildWorkflowRuntime({
    paths,
    taskQueue,
    adapterFactory: () => adapterFactory(workflowOptions),
    materializeWorkspaces: workflowOptions.executionMode === 'real'
  });
  const result = await orchestrator.runNextTask({
    commandSequence: readOptionalOption(args, '--sequence') ?? 'standard',
    executionMode: workflowOptions.executionMode,
    timeoutMs: workflowOptions.timeoutMs,
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
        executionMode: workflowOptions.executionMode,
        adapterId: workflowOptions.adapterId,
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
      executionMode: workflowOptions.executionMode,
      adapterId: workflowOptions.adapterId,
      ...paths,
      ...summarizeWorkflowResult(result)
    }
  };
}

async function runTaskFileWorkflow({ args, adapterFactory }) {
  const taskFile = readOption(args, '--task-file');
  const taskSpec = parseJsonFile(taskFile, 'taskFile');
  const paths = resolveRuntimePaths(args);
  const workflowOptions = resolveWorkflowOptions(args);
  const orchestrator = await buildWorkflowRuntime({
    paths,
    adapterFactory: () => adapterFactory(workflowOptions),
    materializeWorkspaces: workflowOptions.executionMode === 'real'
  });
  const result = await orchestrator.runTaskWorkflow({
    taskSpec,
    commandSequence: readOptionalOption(args, '--sequence') ?? 'standard',
    executionMode: workflowOptions.executionMode,
    timeoutMs: workflowOptions.timeoutMs
  });
  const exitCode = result.status === 'passed' ? EXIT_CODES.ok : EXIT_CODES.verifierFailure;

  return {
    exitCode,
    output: {
      version: '1',
      command: 'run-task',
      status: result.status,
      exitCode,
      executionMode: workflowOptions.executionMode,
      adapterId: workflowOptions.adapterId,
      artifactDirectory: paths.artifactDirectory,
      eventDirectory: paths.eventDirectory,
      workspaceDirectory: paths.workspaceDirectory,
      sessionId: paths.sessionId,
      ...(paths.configFile ? { configFile: paths.configFile } : {}),
      taskFile,
      ...summarizeWorkflowResult(result)
    }
  };
}

async function runHarnessTaskPacketWorkflow({ args, adapterFactory }) {
  try {
    const runId = readOption(args, '--run-id');
    const taskPacketPath = readOption(args, '--taskpacket');
    const taskPacket = await readTaskPacketJsonFile(taskPacketPath);
    const paths = resolveRuntimePaths(args);
    const workflowOptions = resolveWorkflowOptions(args);
    const commandSequence = readOptionalOption(args, '--sequence') ?? 'standard';
    const harnessDirectory = readOptionalOption(args, '--harness-dir') ?? '.omx/harness';
    const expectedChecks = buildExpectedChecks(taskPacket);
    const harnessPolicy = buildHarnessPolicy(taskPacket);
    const orchestrator = await buildWorkflowRuntime({
      paths,
      policyEngine: new PolicyEngine(harnessPolicy.config),
      materializeWorkspaces: workflowOptions.executionMode === 'real',
      adapterFactory: () => adapterFactory({
        taskPacket,
        checkCommands: expectedChecks,
        ...workflowOptions
      })
    });
    const result = await runHarnessTaskPacket({
      taskPacket,
      runId,
      orchestrator,
      artifactStore: orchestrator.artifactStore,
      evidenceSink: new HarnessEvidenceSink({
        rootDirectory: harnessDirectory,
        runId
      }),
      runtime: paths,
      taskPacketPath,
      executionMode: workflowOptions.executionMode,
      commandSequence,
      timeoutMs: workflowOptions.timeoutMs
    });
    const status = result.harnessVerification.status;
    const exitCode = status === 'passed' ? EXIT_CODES.ok : EXIT_CODES.verifierFailure;

    return {
      exitCode,
      output: {
        version: '1',
        command: 'harness run-taskpacket',
        status,
        exitCode,
        runId,
        commandSequence,
        workflowMode: result.workflowResult.mode ?? 'linear',
        executionMode: workflowOptions.executionMode,
        adapterId: workflowOptions.adapterId,
        taskId: result.taskSpec.id,
        taskPacket: taskPacketPath,
        symphonyStatus: result.workflowResult.status,
        verifierStatus: result.harnessVerification.status,
        reason: result.harnessVerification.reason,
        ...(result.workflowResult.completionGate ? { completionGate: result.workflowResult.completionGate } : {}),
        ...(result.workflowResult.selectedCandidateId ? { selectedCandidateId: result.workflowResult.selectedCandidateId } : {}),
        ...(result.harnessVerification.diagnosticLayer
          ? { diagnosticLayer: result.harnessVerification.diagnosticLayer }
          : {}),
        artifactDirectory: paths.artifactDirectory,
        eventDirectory: paths.eventDirectory,
        workspaceDirectory: paths.workspaceDirectory,
        sessionId: paths.sessionId,
        commands: result.workflowResult.commands.map(summarizeCommandRun),
        verificationMap: result.workflowResult.commands.map(summarizeVerificationMap),
        diagnostics: result.harnessVerification.diagnostics,
        evidencePaths: result.evidencePaths,
        ...(result.harnessVerification.policyDenied
          ? { policyDenied: result.harnessVerification.policyDenied }
          : {})
      }
    };
  } catch (error) {
    if (error instanceof TaskPacketValidationError) {
      throw new UsageError(error.message);
    }

    throw error;
  }
}

async function runSmokeCommand({ adapter, args, runner }) {
  const script = smokeScriptFor({ adapter, args });
  const result = await runner.run({
    executable: 'pnpm',
    args: [script],
    cwd: PACKAGE_ROOT
  });
  const exitCode = result.exitCode;

  return {
    exitCode,
    output: {
      version: '1',
      command: 'smoke',
      adapter,
      smoke: smokeModeFor({ adapter, args }),
      script,
      status: exitCode === 0 ? 'passed' : 'failed',
      exitCode,
      stdout: result.stdout ?? '',
      stderr: result.stderr ?? ''
    }
  };
}

async function runEvalReplay({ args, runner }) {
  const passThroughArgs = args[0] === '--' ? args.slice(1) : args;
  const result = await runner.run({
    executable: 'pnpm',
    args: ['eval:replay', '--', ...passThroughArgs],
    cwd: PACKAGE_ROOT
  });
  const exitCode = result.exitCode;
  const replayOutput = parseOptionalJson(result.stdout);

  return {
    exitCode,
    output: {
      version: '1',
      command: 'eval replay',
      script: 'eval:replay',
      status: exitCode === 0 ? 'passed' : 'failed',
      exitCode,
      args: [...passThroughArgs],
      stdout: result.stdout ?? '',
      stderr: result.stderr ?? '',
      ...(replayOutput?.reportRef ? { reportRef: replayOutput.reportRef } : {}),
      ...(replayOutput?.reportArtifactPath ? { reportArtifactPath: replayOutput.reportArtifactPath } : {})
    }
  };
}

function smokeScriptFor({ adapter, args }) {
  if (!['codex', 'claude', 'kiro'].includes(adapter)) {
    throw new UsageError('smoke adapter must be one of: codex, claude, kiro');
  }

  const smokeMode = smokeModeFor({ adapter, args });

  return `smoke:${adapter}:${smokeMode}`;
}

function smokeModeFor({ adapter, args }) {
  if (args.includes('--writer')) {
    if (adapter !== 'codex') {
      throw new UsageError('--writer smoke is only available for codex');
    }

    return 'writer';
  }

  return args.includes('--real') ? 'real' : 'help';
}

function resolveWorkflowOptions(args) {
  const executionMode = args.includes('--real') ? 'real' : 'dry-run';
  const rawAdapter = readOptionalOption(args, '--adapter') ?? readOptionalOption(args, '--lane');
  const adapterId = normalizeCliAdapter(rawAdapter ?? 'codex');

  if (executionMode !== 'real' && rawAdapter !== undefined) {
    throw new UsageError('--adapter and --lane require --real');
  }

  return {
    executionMode,
    adapterId,
    timeoutMs: readOptionalPositiveInteger(args, '--timeout-ms')
  };
}

function createCliAdapter({ executionMode = 'dry-run', adapterId = 'codex', timeoutMs, checkCommands } = {}) {
  if (executionMode !== 'real') {
    return new CliDryRunCodexAdapter({ checkCommands });
  }

  assertRealCliGate(adapterId);
  const options = timeoutMs === undefined ? {} : { timeoutMs };

  if (adapterId === 'codex') {
    return new CodexAdapter(options);
  }

  if (adapterId === 'claude-code') {
    const releaseConfig = readRealCliReleaseConfig().config;
    const modelProfile = resolveRealCliModelProfile({
      adapterId: 'claude-code',
      config: releaseConfig
    }).profile;

    return new ClaudeCodeAdapter({
      ...options,
      modelProfiles: [modelProfile]
    });
  }

  if (adapterId === 'kiro-cli') {
    return new KiroCliAdapter(options);
  }

  throw new UsageError('adapter must be one of: codex, claude, claude-code, kiro, kiro-cli');
}

function normalizeCliAdapter(value) {
  if (value === 'codex') {
    return 'codex';
  }

  if (value === 'claude' || value === 'claude-code') {
    return 'claude-code';
  }

  if (value === 'kiro' || value === 'kiro-cli') {
    return 'kiro-cli';
  }

  throw new UsageError('adapter must be one of: codex, claude, claude-code, kiro, kiro-cli');
}

function assertRealCliGate(adapterId) {
  const envName = REAL_CLI_GATES[adapterId];

  if (!envName) {
    throw new UsageError('adapter must be one of: codex, claude, claude-code, kiro, kiro-cli');
  }

  if (process.env[envName] !== '1') {
    throw new UsageError(`Set ${envName}=1 to invoke the real ${adapterId} CLI lane.`);
  }
}

async function buildWorkflowRuntime({
  paths,
  adapterFactory,
  taskQueue,
  policyEngine,
  materializeWorkspaces = false
}) {
  const adapter = await adapterFactory();
  const capabilityReport = await adapter.probe();

  return new Orchestrator({
    artifactStore: new ArtifactStore(paths.artifactDirectory),
    eventLog: new SessionEventLog(paths.eventDirectory, paths.sessionId),
    workspaceManager: new WorkspaceManager({
      rootDirectory: paths.workspaceDirectory,
      materialize: materializeWorkspaces
    }),
    scheduler: new RouterScheduler({ capabilityReports: [capabilityReport] }),
    taskQueue,
    policyEngine,
    adapters: {
      [adapter.adapterId]: adapter
    }
  });
}

function summarizeWorkflowResult(result) {
  return {
    taskId: result.taskId,
    workflowStatus: result.status,
    commands: result.commands.map(summarizeCommandRun),
    artifactRefs: result.artifactRefs,
    ...(result.failedCommand ? { failedCommand: result.failedCommand } : {}),
    ...(result.failure ? { failure: result.failure } : {}),
    ...(result.retryPlan ? { retryPlan: result.retryPlan } : {})
  };
}

function resolveRuntimePaths(args) {
  const config = readCliConfig(args);
  const runtimeDirectory = readOptionalOption(args, '--runtime-dir')
    ?? configString(config.runtime, 'runtimeDirectory')
    ?? '.mcas';

  return {
    ...(config.configFile ? { configFile: config.configFile } : {}),
    stateFile: readOptionalOption(args, '--state-file')
      ?? configString(config.runtime, 'stateFile')
      ?? join(runtimeDirectory, 'queue.json'),
    artifactDirectory: readOptionalOption(args, '--artifact-dir')
      ?? configString(config.runtime, 'artifactDirectory')
      ?? join(runtimeDirectory, 'artifacts'),
    eventDirectory: readOptionalOption(args, '--event-dir')
      ?? configString(config.runtime, 'eventDirectory')
      ?? join(runtimeDirectory, 'events'),
    workspaceDirectory: readOptionalOption(args, '--workspace-dir')
      ?? configString(config.runtime, 'workspaceDirectory')
      ?? join(runtimeDirectory, 'workspaces'),
    sessionId: readOptionalOption(args, '--session-id')
      ?? configString(config.runtime, 'sessionId')
      ?? 'mcas-cli'
  };
}

function readCliConfig(args) {
  const configFile = readOptionalOption(args, '--config');

  if (configFile === undefined) {
    return {
      runtime: {}
    };
  }

  const config = parseJsonFile(configFile, 'configFile');

  if (config === null || typeof config !== 'object' || Array.isArray(config)) {
    throw new UsageError('configFile must contain a JSON object');
  }

  if (config.runtime === undefined) {
    return {
      configFile,
      runtime: {}
    };
  }

  if (config.runtime === null || typeof config.runtime !== 'object' || Array.isArray(config.runtime)) {
    throw new UsageError('configFile.runtime must be an object');
  }

  return {
    configFile,
    runtime: config.runtime
  };
}

function configString(config, field) {
  const value = config[field];

  if (value === undefined) {
    return undefined;
  }

  if (typeof value !== 'string' || value.trim() === '') {
    throw new UsageError(`configFile.runtime.${field} must be a non-empty string`);
  }

  return value;
}

function parseJsonFile(path, field) {
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch (error) {
    throw new UsageError(`${field} must be readable JSON: ${error.message}`);
  }
}

function parseOptionalJson(value) {
  if (typeof value !== 'string' || value.trim() === '') {
    return null;
  }

  const trimmed = value.trim();

  try {
    return JSON.parse(trimmed);
  } catch {
    const objectStart = trimmed.indexOf('{');

    if (objectStart === -1) {
      return null;
    }

    try {
      return JSON.parse(trimmed.slice(objectStart));
    } catch {
      return null;
    }
  }
}

function summarizeCommandRun(commandRun) {
  return {
    ...(commandRun.stage ? { stage: commandRun.stage } : {}),
    ...(commandRun.role ? { role: commandRun.role } : {}),
    ...(commandRun.laneId ? { laneId: commandRun.laneId } : {}),
    ...(commandRun.candidateId ? { candidateId: commandRun.candidateId } : {}),
    ...(commandRun.agentId ? { agentId: commandRun.agentId } : {}),
    command: commandRun.command,
    adapterId: commandRun.adapterId,
    ...(commandRun.writeSet ? { writeSet: commandRun.writeSet } : {}),
    workspaceId: commandRun.workspace.workspaceId,
    ...(commandRun.workspace.sourceWorkspaceId ? { sourceWorkspaceId: commandRun.workspace.sourceWorkspaceId } : {}),
    artifactId: commandRun.artifactId,
    ...(commandRun.patchArtifactId ? { patchArtifactId: commandRun.patchArtifactId } : {}),
    ...(commandRun.runArtifactId ? { commandArtifactId: commandRun.runArtifactId } : {}),
    runArtifactId: commandRun.runArtifactId,
    routeDecisionArtifactId: commandRun.routeDecisionArtifactId,
    ...(commandRun.selected !== undefined ? { selected: commandRun.selected } : {}),
    ...(commandRun.rejectedReason ? { rejectedReason: commandRun.rejectedReason } : {}),
    ...(commandRun.findings ? { findings: commandRun.findings } : {}),
    ...(commandRun.missingEvidence ? { missingEvidence: commandRun.missingEvidence } : {}),
    ...(commandRun.noFindingRationale ? { noFindingRationale: commandRun.noFindingRationale } : {}),
    ...(commandRun.findingsArtifactId ? { findingsArtifactId: commandRun.findingsArtifactId } : {}),
    ...(commandRun.missingEvidenceArtifactId ? { missingEvidenceArtifactId: commandRun.missingEvidenceArtifactId } : {}),
    ...(commandRun.adapterArtifactRefs ? { adapterArtifactRefs: commandRun.adapterArtifactRefs } : {}),
    verificationStatus: commandRun.verification.status,
    ...(commandRun.verification.reason ? { verificationReason: commandRun.verification.reason } : {})
  };
}

function summarizeVerificationMap(commandRun) {
  return {
    stage: commandRun.stage ?? commandRun.command,
    ...(commandRun.laneId ? { laneId: commandRun.laneId } : {}),
    ...(commandRun.candidateId ? { candidateId: commandRun.candidateId } : {}),
    ...(commandRun.agentId ? { agentId: commandRun.agentId } : {}),
    command: commandRun.command,
    ...(commandRun.adapterId ? { adapterId: commandRun.adapterId } : {}),
    ...(commandRun.writeSet ? { writeSet: commandRun.writeSet } : {}),
    ...(commandRun.patchArtifactId ? { patchArtifactId: commandRun.patchArtifactId } : {}),
    ...(commandRun.runArtifactId ? { commandArtifactId: commandRun.runArtifactId } : {}),
    ...(commandRun.findings ? { findings: commandRun.findings } : {}),
    ...(commandRun.missingEvidence ? { missingEvidence: commandRun.missingEvidence } : {}),
    ...(commandRun.noFindingRationale ? { noFindingRationale: commandRun.noFindingRationale } : {}),
    ...(commandRun.findingsArtifactId ? { findingsArtifactId: commandRun.findingsArtifactId } : {}),
    ...(commandRun.missingEvidenceArtifactId ? { missingEvidenceArtifactId: commandRun.missingEvidenceArtifactId } : {}),
    artifactId: commandRun.artifactId,
    ...(commandRun.runArtifactId ? { runArtifactId: commandRun.runArtifactId } : {}),
    ...(commandRun.routeDecisionArtifactId ? { routeDecisionArtifactId: commandRun.routeDecisionArtifactId } : {}),
    verificationStatus: commandRun.verification.status,
    ...(commandRun.verification.reason ? { verificationReason: commandRun.verification.reason } : {}),
    ...(commandRun.selected !== undefined ? { selected: commandRun.selected } : {}),
    ...(commandRun.rejectedReason ? { rejectedReason: commandRun.rejectedReason } : {})
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
  constructor({ checkCommands = ['mcas-cli-dry-run'] } = {}) {
    super({ cliVersion: 'synthetic-dry-run' });
    this.checkCommands = [...checkCommands];
  }

  async start(input) {
    const handle = await super.start(input);
    const stored = this.runs.get(handle.runId);

    stored.changedFiles = syntheticChangedFilesFor(input);
    this.runs.set(handle.runId, stored);

    return handle;
  }

  async collectEvidence(handle) {
    const stored = this.runs.get(handle.runId);
    const changedFiles = handle.command === 'implement'
      ? stored?.changedFiles ?? ['synthetic-dry-run.txt']
      : [];

    return {
      command: handle.command,
      taskId: handle.taskId,
      workspaceId: handle.workspaceId,
      diffSummary: changedFiles.length > 0 ? ['Synthetic CLI dry-run change summary.'] : [],
      changedFiles,
      checks: this.checkCommands.map((command) => ({
        name: command,
        status: 'passed',
        command,
        exitCode: 0,
        artifactId: `${handle.command}-${safeArtifactSuffix(command)}-check`,
        output: `Synthetic CLI dry-run check passed: ${command}`
      })),
      knownRisks: ['synthetic-dry-run-no-real-model'],
      agentSummary: 'MCAS CLI synthetic dry-run evidence.',
      ...(handle.command === 'review' || handle.command === 'qa'
        ? { noFindingRationale: `Synthetic dry-run ${handle.command} found no issues.` }
        : {}),
      version: '1'
    };
  }
}

function safeArtifactSuffix(value) {
  return value.replace(/[^a-zA-Z0-9._-]+/g, '-').replace(/^-+|-+$/g, '') || 'check';
}

function syntheticChangedFilesFor(input) {
  if (input.commandSpec.name !== 'implement') {
    return [];
  }

  const writeSet = Array.isArray(input.contextPack.task.constraints)
    ? input.contextPack.task.constraints
      .filter((constraint) => constraint.startsWith('write_set:'))
      .map((constraint) => constraint.slice('write_set:'.length))
    : [];
  const firstPattern = writeSet[0] ?? 'synthetic-dry-run.txt';

  return [
    firstPattern
      .replaceAll('**', 'synthetic-dry-run')
      .replaceAll('*', 'synthetic-dry-run')
  ];
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const exitCode = await runMcasCli();
  process.exitCode = exitCode;
}
