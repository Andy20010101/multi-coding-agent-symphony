#!/usr/bin/env node

import { createHash } from 'node:crypto';
import { lstat, mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join, relative, resolve, sep, posix } from 'node:path';
import { fileURLToPath } from 'node:url';

import { ArtifactStore } from '../src/artifact-store.js';
import { NodeProcessRunner } from '../src/process-runner.js';
import { redactSecrets } from '../src/redaction.js';
import { validateProjectContextArtifact } from '../src/intake/intake-contracts.js';
import {
  withProductJsonContract
} from '../src/symphony/contract.js';
import {
  buildConsoleDiagnosticsReport,
  buildConsoleSnapshot,
  renderDiagnosticsHtml,
  renderDiagnosticsText,
  startSymphonyConsoleServer
} from '../src/symphony/console.js';
import {
  buildAdoptionInspectionSummary
} from '../src/symphony/adoption-inspect.js';
import {
  DEFAULT_STAGE_DOCS_DIR,
  activateStage,
  buildStageAdoptionSummary,
  buildStageCommandSummary,
  createStageCharter,
  enforceStageConsistencyGate,
  renderStageCharterFile
} from '../src/symphony/stage.js';
import {
  ScaffoldError,
  buildScaffoldPlan,
  normalizeTemplate,
  scaffoldProject
} from '../src/symphony/new-project.js';
import { classifyPrompt } from '../src/symphony/prompt-router.js';
import {
  buildProjectFingerprint,
  readAdoptionPlan,
  readExecutionPlan,
  readLatestContext,
  readLatestRun,
  readRunState,
  symphonyStatePaths,
  writeAdoptionPlan,
  writeExecutionPlan,
  writeLatestContext,
  writeRunState
} from '../src/symphony/state.js';
import { runMcasCli } from './mcas.js';

const EXIT_CODES = {
  ok: 0,
  failure: 1,
  usage: 64
};

const WORK_MODES = new Set([
  'linear',
  'writer-reviewer',
  'parallel-lanes',
  'qa-swarm',
  'competitive-patch'
]);

const REAL_AGENT_GATES = {
  claude: 'MCAS_RUN_REAL_CLAUDE'
};
const REAL_WORK_GATES = {
  codex: 'MCAS_RUN_REAL_CODEX',
  claude: 'MCAS_RUN_REAL_CLAUDE',
  kiro: 'MCAS_RUN_REAL_KIRO'
};
const KNOWN_COMMANDS = new Set([
  'doctor',
  'harness',
  'replay',
  'eval',
  'work',
  'intake',
  'agent',
  'review',
  'qa',
  'scan',
  'do',
  'verify',
  'status',
  'artifacts',
  'continue',
  'console',
  'diagnose',
  'adopt',
  'new',
  'stage',
  'next'
]);
let productRunSequence = 0;

export async function runSymphonyCli({
  argv = process.argv.slice(2),
  stdout = process.stdout,
  stderr = process.stderr,
  runner,
  env = process.env,
  mcasRunner = runMcasCli
} = {}) {
  try {
    if (!Array.isArray(argv)) {
      throw new UsageError('argv must be an array');
    }

    const promptInvocation = parsePromptInvocation(argv);

    if (promptInvocation !== null) {
      return await runSymphonyPrompt({
        invocation: promptInvocation,
        stdout,
        stderr,
        runner,
        env,
        mcasRunner
      });
    }

    const [command, ...rest] = argv;

    if (command === 'doctor') {
      return await mcasRunner({
        argv: ['doctor', ...rest],
        stdout,
        stderr,
        runner,
        env
      });
    }

    if (command === 'harness') {
      return await mcasRunner({
        argv: ['harness', ...rest],
        stdout,
        stderr,
        runner,
        env
      });
    }

    if (command === 'replay') {
      return await mcasRunner({
        argv: ['eval', 'replay', ...rest],
        stdout,
        stderr,
        runner,
        env
      });
    }

    if (command === 'eval' && rest[0] === 'replay') {
      return await mcasRunner({
        argv: ['eval', 'replay', ...rest.slice(1)],
        stdout,
        stderr,
        runner,
        env
      });
    }

    if (command === 'work') {
      return await runSymphonyWork({
        args: rest,
        summaryCommand: 'symphony work',
        stdout,
        stderr,
        runner,
        env,
        mcasRunner
      });
    }

    if (command === 'scan') {
      return await runSymphonyScanProduct({
        args: rest,
        stdout,
        stderr,
        runner,
        env,
        mcasRunner
      });
    }

    if (command === 'do') {
      return await runSymphonyWorkProduct({
        args: rest,
        semanticCommand: 'do',
        stdout,
        stderr,
        runner,
        env,
        mcasRunner
      });
    }

    if (command === 'verify') {
      return await runSymphonyWorkProduct({
        args: rest,
        semanticCommand: 'verify',
        stdout,
        stderr,
        runner,
        env,
        mcasRunner
      });
    }

    if (command === 'review' || command === 'qa') {
      return await runSymphonyWorkProduct({
        args: rest,
        semanticCommand: command === 'review' ? 'review' : 'verify',
        productCommand: command,
        stdout,
        stderr,
        runner,
        env,
        mcasRunner
      });
    }

    if (command === 'status') {
      return await runSymphonyStatus({
        args: rest,
        stdout
      });
    }

    if (command === 'artifacts') {
      return await runSymphonyArtifacts({
        args: rest,
        stdout
      });
    }

    if (command === 'continue') {
      return await runSymphonyContinue({
        args: rest,
        stdout
      });
    }

    if (command === 'console') {
      return await runSymphonyConsole({
        args: rest,
        stdout
      });
    }

    if (command === 'diagnose') {
      return await runSymphonyDiagnose({
        args: rest,
        stdout,
        runner: runner ?? new NodeProcessRunner(),
        env
      });
    }

    if (command === 'stage') {
      return await runSymphonyStage({
        args: rest,
        stdout
      });
    }

    if (command === 'next') {
      return await runSymphonyNext({
        args: rest,
        stdout
      });
    }

    if (command === 'adopt') {
      return await runSymphonyAdopt({
        args: rest,
        stdout,
        runner: runner ?? new NodeProcessRunner(),
        env
      });
    }

    if (command === 'new') {
      return await runSymphonyNew({
        args: rest,
        stdout,
        stderr,
        runner: runner ?? new NodeProcessRunner(),
        env,
        mcasRunner
      });
    }

    if (command === 'intake') {
      return await runSymphonyIntake({
        args: rest,
        stdout,
        stderr,
        runner,
        env,
        mcasRunner
      });
    }

    if (command === 'agent') {
      return await runSymphonyAgent({
        args: rest,
        stdout,
        stderr,
        runner: runner ?? new NodeProcessRunner(),
        env
      });
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

export function buildSymphonyWorkTaskPacket({
  prompt,
  mode = defaultWorkMode(prompt),
  runId = buildWorkRunId({ prompt, mode }),
  adapter = 'codex',
  constraints = []
}) {
  assertNonEmptyString(prompt, 'prompt');
  assertWorkMode(mode);
  assertSafePathSegment(runId, 'runId');

  const agentPrefix = agentIdPrefix(adapter);
  const writeSet = mode === 'parallel-lanes'
    ? ['symphony-work-output-a.txt', 'symphony-work-output-b.txt']
    : ['symphony-work-output.txt'];
  const taskPacket = {
    version: '1',
    id: `symphony.work.${runId}`,
    run_id: runId,
    repository: 'local-workspace',
    intent: prompt,
    acceptance: [
      'Task intent is addressed with verifier-readable evidence.',
      'Harness verification records are written.'
    ],
    write_set: writeSet,
    verification: {
      commands: ['symphony-work-dry-run']
    }
  };

  if (constraints.length > 0) {
    taskPacket.constraints = [...constraints];
  }

  if (mode !== 'linear') {
    taskPacket.workflow = buildWorkWorkflow({
      mode,
      runId,
      agentPrefix,
      writeSet
    });
  }

  return taskPacket;
}

async function runSymphonyWork({
  args,
  summaryCommand,
  forcedRunId,
  stdout,
  stderr,
  runner,
  env,
  mcasRunner
}) {
  const options = parseWorkArgs(args);
  const runId = forcedRunId ?? buildWorkRunId({
    prompt: options.prompt,
    mode: options.mode,
    adapter: options.adapter
  });
  const runRoot = join(options.workDir, runId);
  const runtimeDirectory = join(runRoot, 'runtime');
  const harnessDirectory = join(runRoot, 'harness');
  const taskPacketPath = join(runRoot, 'taskpacket.json');
  const intake = await prepareWorkIntake({
    options,
    runId,
    runRoot,
    stdout,
    stderr,
    runner,
    env,
    mcasRunner
  });

  if (intake.exitCode !== EXIT_CODES.ok) {
    return intake.exitCode;
  }

  const taskPacket = buildSymphonyWorkTaskPacket({
    prompt: options.prompt,
    mode: options.mode,
    runId,
    adapter: options.adapter,
    constraints: intake.constraints
  });

  await mkdir(runRoot, { recursive: true });
  await writeFile(taskPacketPath, `${JSON.stringify(taskPacket, null, 2)}\n`, 'utf8');

  const kernelStdout = createBufferedStream();
  const kernelStderr = createBufferedStream();
  const kernelArgv = [
    'harness',
    'run-taskpacket',
    '--run-id',
    runId,
    '--taskpacket',
    taskPacketPath,
    '--runtime-dir',
    runtimeDirectory,
    '--harness-dir',
    harnessDirectory,
    '--session-id',
    runId
  ];

  if (options.executionMode === 'real') {
    kernelArgv.push('--real', '--adapter', options.adapter);
  }

  if (options.materializeWorkspaces) {
    kernelArgv.push('--materialize-workspaces');
  }

  if (options.timeoutMs !== undefined) {
    kernelArgv.push('--timeout-ms', String(options.timeoutMs));
  }

  const exitCode = await mcasRunner({
    argv: kernelArgv,
    stdout: kernelStdout.stream,
    stderr: kernelStderr.stream,
    runner,
    env
  });

  if (kernelStdout.text().trim() === '') {
    if (kernelStderr.text() !== '') {
      stderr.write(kernelStderr.text());
    }

    return exitCode;
  }

  const kernelOutput = parseJsonOutput(kernelStdout.text(), 'mcas harness output');
  const summary = await buildWorkSummary({
    kernelOutput,
    runId,
    taskPacketPath,
    harnessDirectory,
    summaryCommand,
    executionMode: options.executionMode,
    adapter: options.adapter,
    proofDir: options.proofDir,
    intake
  });

  writeJson(stdout, summary);

  if (kernelStderr.text() !== '') {
    stderr.write(kernelStderr.text());
  }

  return exitCode;
}

async function runSymphonyIntake({
  args,
  stdout,
  stderr,
  runner,
  env,
  mcasRunner
}) {
  const options = parseSymphonyIntakeArgs(args);
  const intake = await executeSymphonyIntake({
    options,
    runner,
    env,
    mcasRunner
  });

  if (intake.summary === null) {
    if (intake.stderrText !== '') {
      stderr.write(intake.stderrText);
    }

    return intake.exitCode;
  }

  writeJson(stdout, intake.summary);

  if (intake.stderrText !== '') {
    stderr.write(intake.stderrText);
  }

  return intake.exitCode;
}

async function executeSymphonyIntake({
  options,
  runner,
  env,
  mcasRunner,
  runId = buildIntakeRunId(options)
}) {
  const runtimeDirectory = join(options.outputDir, runId, 'runtime');
  const kernelStdout = createBufferedStream();
  const kernelStderr = createBufferedStream();
  const kernelArgv = [
    'intake',
    '--project-dir',
    options.projectDir,
    '--runtime-dir',
    runtimeDirectory,
    '--session-id',
    runId,
    '--provider',
    options.provider,
    '--format',
    'json'
  ];

  if (options.providerCommand !== undefined) {
    kernelArgv.push('--provider-command', options.providerCommand);
  }

  if (options.requireProvider) {
    kernelArgv.push('--require-provider');
  }

  if (options.failOn !== undefined) {
    kernelArgv.push('--fail-on', options.failOn);
  }

  const exitCode = await mcasRunner({
    argv: kernelArgv,
    stdout: kernelStdout.stream,
    stderr: kernelStderr.stream,
    runner,
    env
  });

  if (kernelStdout.text().trim() === '') {
    return {
      exitCode,
      summary: null,
      kernelOutput: null,
      runId,
      stderrText: kernelStderr.text()
    };
  }

  const kernelOutput = parseJsonOutput(kernelStdout.text(), 'mcas intake output');
  const summary = buildSymphonyIntakeSummary({
    kernelOutput,
    provider: options.provider,
    format: options.format
  });

  return {
    exitCode,
    summary,
    kernelOutput,
    runId,
    stderrText: kernelStderr.text()
  };
}

async function runSymphonyScanProduct({
  args,
  stdout,
  stderr,
  runner,
  env,
  mcasRunner,
  routeDecision
}) {
  const options = parseScanProductArgs(args);
  const scan = await executeProductScan({
    options,
    runner,
    env,
    mcasRunner,
    routeDecision
  });

  if (scan.summary === null) {
    if (scan.stderrText !== '') {
      stderr.write(scan.stderrText);
    }

    return scan.exitCode;
  }

  writeProductOutput(stdout, scan.summary, options.json);

  if (scan.stderrText !== '') {
    stderr.write(scan.stderrText);
  }

  return scan.exitCode;
}

async function executeProductScan({
  options,
  runner,
  env,
  mcasRunner,
  routeDecision
}) {
  const runId = buildScanRunId(options);
  const providerAttempts = [];
  let providerFallback = null;
  const intakeOptions = {
    projectDir: options.projectDir,
    outputDir: options.outputDir,
    provider: initialProviderForScanMode(options.providerMode),
    providerCommand: options.providerCommand,
    requireProvider: options.requireProvider,
    failOn: options.failOn,
    format: 'json'
  };
  let intake = await executeSymphonyIntake({
    options: intakeOptions,
    runner,
    env,
    mcasRunner,
    runId
  });
  providerAttempts.push(buildProviderAttempt({
    provider: intakeOptions.provider,
    intake
  }));

  if (
    options.providerMode !== 'builtin'
    && !options.requireProvider
    && intake.kernelOutput?.providerStatus === 'unavailable'
    && intake.exitCode === EXIT_CODES.ok
  ) {
    providerFallback = {
      from: 'grill-me-docs',
      to: 'builtin',
      reason: 'unavailable'
    };
    intake = await executeSymphonyIntake({
      options: {
        ...intakeOptions,
        provider: 'builtin',
        requireProvider: false
      },
      runner,
      env,
      mcasRunner,
      runId: `${runId}-builtin`
    });
    providerAttempts.push(buildProviderAttempt({
      provider: 'builtin',
      intake
    }));
  }

  if (intake.summary === null) {
    return {
      exitCode: intake.exitCode,
      summary: null,
      stderrText: intake.stderrText
    };
  }

  const projectFingerprint = await buildProjectFingerprint({
    projectDir: intake.summary.projectDir,
    ignoredPaths: [options.stateDir]
  });
  const now = new Date().toISOString();
  const contextPointer = {
    version: '1',
    kind: 'symphony-latest-context',
    projectRoot: intake.summary.projectDir,
    projectFingerprint,
    runId: intake.runId,
    contextArtifactPath: intake.summary.contextArtifactPath,
    summaryArtifactPath: intake.summary.summaryArtifactPath,
    recommendedWorkflow: intake.summary.recommendedWorkflow,
    verificationCommands: intake.summary.verificationCommands,
    createdAt: now
  };

  await writeLatestContext({
    stateDir: options.stateDir,
    pointer: contextPointer
  });

  const summary = {
    version: '1',
    command: 'symphony scan',
    intent: 'scan-project',
    semanticCommand: 'scan',
    pipeline: ['scan'],
    safetyMode: 'read-only',
    projectWrites: false,
    runtimeWrites: true,
    externalCalls: false,
    destructiveWrites: false,
    status: intake.summary.status,
    exitCode: intake.summary.exitCode,
    verifierStatus: intake.summary.status,
    runId: intake.runId,
    projectRoot: intake.summary.projectDir,
    projectFingerprint,
    providerMode: options.providerMode,
    providerAttempts,
    providerFallback,
    provider: intake.summary.provider,
    providerStatus: intake.summary.providerStatus,
    modelInvocation: false,
    contextArtifactPath: intake.summary.contextArtifactPath,
    summaryArtifactPath: intake.summary.summaryArtifactPath,
    riskCounts: intake.summary.riskCounts,
    openQuestionCount: intake.summary.openQuestionCount,
    recommendedWorkflow: intake.summary.recommendedWorkflow,
    verificationCommands: intake.summary.verificationCommands,
    statePath: symphonyStatePaths({ stateDir: options.stateDir }).latestContextPath,
    ...(routeDecision ? { matchedSignals: routeDecision.matchedSignals, routeDecision } : {}),
    nextAction: 'symphony do --dry-run "inspect README"'
  };

  await writeProductRunState({
    stateDir: options.stateDir,
    summary,
    updatedAt: now
  });

  return {
    exitCode: intake.exitCode,
    summary,
    stderrText: intake.stderrText
  };
}

async function runSymphonyWorkProduct({
  args,
  semanticCommand,
  productCommand,
  stdout,
  stderr,
  runner,
  env,
  mcasRunner,
  prompt,
  routeDecision
}) {
  if (args.includes('--confirm-plan')) {
    if (semanticCommand !== 'do') {
      throw new UsageError('--confirm-plan is only supported for symphony do');
    }

    const options = parseConfirmPlanArgs(args);
    const confirmed = await executeConfirmedProductPlan({
      options,
      runner,
      env,
      mcasRunner
    });

    writeProductOutput(stdout, confirmed.summary, options.json);

    if (confirmed.stderrText !== '') {
      stderr.write(confirmed.stderrText);
    }

    return confirmed.exitCode;
  }

  const options = parseWorkProductArgs(args, {
    semanticCommand,
    prompt
  });

  if (routeDecision?.safetyMode === 'external' && !options.realRequested) {
    options.realRequested = true;
    options.adapter = routeDecision.adapter;
  }

  if (options.realRequested && !options.writeRequested) {
    options.safetyMode = 'external';
  }

  const work = await executeProductWork({
    options,
    semanticCommand,
    productCommand,
    runner,
    env,
    mcasRunner,
    routeDecision
  });

  if (work.summary === null) {
    if (work.stderrText !== '') {
      stderr.write(work.stderrText);
    }

    return work.exitCode;
  }

  writeProductOutput(stdout, work.summary, options.json);

  if (work.stderrText !== '') {
    stderr.write(work.stderrText);
  }

  return work.exitCode;
}

async function executeProductWork({
  options,
  semanticCommand,
  productCommand,
  runner,
  env,
  mcasRunner,
  routeDecision
}) {
  const highRisk = options.safetyMode === 'write' || options.safetyMode === 'external';
  const projectState = await buildStageGateProjectState({
    projectDir: options.projectDir,
    stateDir: options.stateDir,
    ignoredPaths: [options.stateDir, options.workDir, options.stageDocsDir],
    runner
  });
  const stageGate = await enforceStageConsistencyGate({
    stateDir: options.stateDir,
    docsDir: options.stageDocsDir,
    explicitStageId: options.stageId,
    noStage: options.noStage,
    action: buildProductStageGateAction({
      command: productCommand ?? semanticCommand,
      semanticCommand,
      options,
      highRisk
    }),
    attemptedCommand: `symphony ${productCommand ?? semanticCommand}`,
    projectState,
    highRisk
  });

  if (stageGate.blocked) {
    throwStageGateBlocked(stageGate, `symphony ${productCommand ?? semanticCommand}`);
  }

  if (options.safetyMode === 'write') {
    if (semanticCommand !== 'do') {
      throw new UsageError('write-mode execution plans are only supported for symphony do');
    }

    return await createProductExecutionPlan({
      options,
      semanticCommand,
      productCommand,
      runner,
      env,
      mcasRunner,
      routeDecision,
      stageBinding: stageGate.stageBinding ?? undefined,
      stageGate: stageGate.stageGate ?? undefined
    });
  }

  if (options.safetyMode === 'external') {
    assertProductRealGate(options.adapter, env);
  }

  const context = await ensureFreshContext({
    projectDir: options.projectDir,
    stateDir: options.stateDir,
    runner,
    env,
    mcasRunner
  });
  const productRunId = buildProductWorkRunId({
    prompt: options.prompt,
    mode: options.mode,
    adapter: options.adapter,
    semanticCommand
  });
  const legacyArgs = [
    '--intake-artifact',
    context.pointer.contextArtifactPath,
    '--work-dir',
    options.workDir
  ];

  if (options.mode !== undefined) {
    legacyArgs.push('--mode', options.mode);
  }

  if (options.safetyMode === 'external') {
    legacyArgs.push('--real', options.adapter);
  } else {
    legacyArgs.push('--dry-run');
  }

  if (options.timeoutMs !== undefined) {
    legacyArgs.push('--timeout-ms', String(options.timeoutMs));
  }

  if (options.proofDir !== undefined) {
    legacyArgs.push('--proof-dir', options.proofDir);
  }

  legacyArgs.push(options.prompt);

  const legacy = await executeLegacyWork({
    args: legacyArgs,
    summaryCommand: `symphony ${productCommand ?? semanticCommand}`,
    forcedRunId: productRunId,
    stdout: createBufferedStream(),
    stderr: createBufferedStream(),
    runner,
    env,
    mcasRunner
  });

  if (legacy.summary === null) {
    return legacy;
  }

  const now = new Date().toISOString();
  const intent = semanticCommand === 'do' ? 'work' : semanticCommand;
  const pipelineTail = semanticCommand;
  const pipeline = ['scan-if-needed', pipelineTail];
  const summary = {
    version: '1',
    command: `symphony ${productCommand ?? semanticCommand}`,
    intent,
    semanticCommand,
    pipeline,
    safetyMode: options.safetyMode,
    projectWrites: options.safetyMode === 'external' && semanticCommand === 'do',
    runtimeWrites: true,
    externalCalls: options.safetyMode === 'external',
    destructiveWrites: false,
    status: legacy.summary.status,
    exitCode: legacy.summary.exitCode,
    verifierStatus: legacy.summary.verifierStatus,
    runId: legacy.summary.runId,
    workflowMode: legacy.summary.workflowMode,
    adapter: legacy.summary.adapter,
    executionMode: legacy.summary.executionMode,
    projectRoot: context.pointer.projectRoot,
    projectFingerprint: context.pointer.projectFingerprint,
    contextReused: !context.scanned,
    contextArtifactPath: context.pointer.contextArtifactPath,
    summaryArtifactPath: context.pointer.summaryArtifactPath,
    evidenceArtifactPath: legacy.summary.evidenceArtifactPath,
    harnessOutputPath: legacy.summary.harnessOutputPath,
    taskPacketPath: legacy.summary.taskPacketPath,
    sourceWorkspacePath: legacy.summary.sourceWorkspacePath,
    sourceWorkspaceManifestPath: legacy.summary.sourceWorkspaceManifestPath,
    changedFiles: legacy.summary.changedFiles,
    stageBinding: stageGate.stageBinding ?? undefined,
    stageGate: stageGate.stageGate ?? undefined,
    ...(routeDecision ? { matchedSignals: routeDecision.matchedSignals, routeDecision } : {}),
    nextAction: 'symphony status'
  };

  if (legacy.summary.proofArtifactPath) {
    summary.proofArtifactPath = legacy.summary.proofArtifactPath;
  }

  await writeProductRunState({
    stateDir: options.stateDir,
    summary,
    updatedAt: now
  });

  return {
    exitCode: legacy.exitCode,
    summary,
    stderrText: legacy.stderrText
  };
}

async function createProductExecutionPlan({
  options,
  semanticCommand,
  productCommand,
  runner,
  env,
  mcasRunner,
  routeDecision,
  stageBinding,
  stageGate
}) {
  const context = await ensureFreshContext({
    projectDir: options.projectDir,
    stateDir: options.stateDir,
    runner,
    env,
    mcasRunner
  });
  const now = new Date().toISOString();
  const planId = buildExecutionPlanId({
    prompt: options.prompt,
    mode: options.mode,
    adapter: options.adapter
  });
  const command = `symphony ${productCommand ?? semanticCommand}`;
  const pipeline = ['scan-if-needed', semanticCommand];
  const executionMode = options.realRequested ? 'real' : 'dry-run';
  const requiresGate = options.realRequested ? REAL_WORK_GATES[options.adapter] : null;
  const confirmationCommand = buildConfirmationCommand({
    planId,
    stateDir: options.stateDir
  });
  const normalizedRouteDecision = buildExecutionPlanRouteDecision({
    routeDecision,
    adapter: options.adapter,
    pipeline,
    requiresGate
  });
  const plan = {
    version: '1',
    kind: 'symphony.execution-plan',
    contractVersion: '1',
    contractName: 'symphony.execution-plan',
    planId,
    command,
    intent: 'work',
    semanticCommand,
    prompt: options.prompt,
    pipeline,
    routeDecision: normalizedRouteDecision,
    matchedSignals: normalizedRouteDecision.matchedSignals,
    stageBinding: stageBinding ?? undefined,
    stageGate: stageGate ?? undefined,
    safetyMode: 'write',
    projectWrites: true,
    mainWorktreeWrites: false,
    workspaceWrites: true,
    runtimeWrites: true,
    externalCalls: options.realRequested,
    destructiveWrites: false,
    writeBoundary: 'isolated-workspace',
    projectRoot: context.pointer.projectRoot,
    projectFingerprint: context.pointer.projectFingerprint,
    contextReused: !context.scanned,
    contextArtifactPath: context.pointer.contextArtifactPath,
    summaryArtifactPath: context.pointer.summaryArtifactPath,
    workflowMode: options.mode,
    adapter: options.adapter,
    executionMode,
    workDir: options.workDir,
    ...(options.proofDir ? { proofDir: options.proofDir } : {}),
    ...(options.timeoutMs ? { timeoutMs: options.timeoutMs } : {}),
    requiresGate,
    confirmationCommand,
    createdAt: now
  };
  const executionPlanArtifactPath = await writeExecutionPlan({
    stateDir: options.stateDir,
    plan
  });
  const summary = {
    version: '1',
    command,
    intent: 'work',
    semanticCommand,
    pipeline,
    safetyMode: 'write',
    projectWrites: true,
    mainWorktreeWrites: false,
    workspaceWrites: true,
    runtimeWrites: true,
    externalCalls: options.realRequested,
    destructiveWrites: false,
    status: 'planned',
    exitCode: EXIT_CODES.ok,
    verifierStatus: 'not-run',
    runId: planId,
    executionPlanId: planId,
    executionPlanArtifactPath,
    writeBoundary: 'isolated-workspace',
    workflowMode: options.mode,
    adapter: options.adapter,
    executionMode,
    requiresGate,
    projectRoot: context.pointer.projectRoot,
    projectFingerprint: context.pointer.projectFingerprint,
    contextReused: !context.scanned,
    contextArtifactPath: context.pointer.contextArtifactPath,
    summaryArtifactPath: context.pointer.summaryArtifactPath,
    matchedSignals: normalizedRouteDecision.matchedSignals,
    routeDecision: normalizedRouteDecision,
    stageBinding: stageBinding ?? undefined,
    stageGate: stageGate ?? undefined,
    confirmationCommand,
    nextAction: confirmationCommand
  };

  await writeProductRunState({
    stateDir: options.stateDir,
    summary,
    updatedAt: now
  });

  return {
    exitCode: EXIT_CODES.ok,
    summary,
    stderrText: ''
  };
}

async function executeConfirmedProductPlan({
  options,
  runner,
  env,
  mcasRunner
}) {
  const preflightPlan = await readExecutionPlan({
    stateDir: options.stateDir,
    planId: options.planId
  });
  const projectState = preflightPlan === null
    ? null
    : await buildStageGateProjectState({
        projectDir: preflightPlan.projectRoot,
        stateDir: options.stateDir,
        ignoredPaths: [options.stateDir, preflightPlan.workDir, options.stageDocsDir],
        runner
      });
  const stageGate = await enforceStageConsistencyGate({
    stateDir: options.stateDir,
    docsDir: options.stageDocsDir,
    explicitStageId: options.stageId,
    noStage: options.noStage,
    action: buildConfirmPlanStageGateAction({
      options,
      plan: preflightPlan
    }),
    attemptedCommand: 'symphony do --confirm-plan',
    projectState,
    highRisk: true
  });

  if (stageGate.blocked) {
    throwStageGateBlocked(stageGate, 'symphony do --confirm-plan');
  }

  const plan = preflightPlan;

  if (plan === null) {
    throw new UsageError(`execution plan not found: ${options.planId}`);
  }

  assertExecutionPlan(plan, options.planId);

  const currentFingerprint = await buildProjectFingerprint({
    projectDir: plan.projectRoot,
    ignoredPaths: [options.stateDir, plan.workDir]
  });

  if (currentFingerprint !== plan.projectFingerprint) {
    throw new UsageError('execution plan is stale: project fingerprint changed');
  }

  if (plan.executionMode === 'real') {
    assertProductRealGate(plan.adapter, env);
  }

  const productRunId = buildConfirmedPlanRunId(plan);
  const legacyArgs = [
    '--intake-artifact',
    plan.contextArtifactPath,
    '--work-dir',
    plan.workDir,
    '--mode',
    plan.workflowMode,
    '--materialize-workspaces'
  ];

  if (plan.executionMode === 'real') {
    legacyArgs.push('--real', plan.adapter);
  } else {
    legacyArgs.push('--dry-run');
  }

  if (plan.timeoutMs !== undefined) {
    legacyArgs.push('--timeout-ms', String(plan.timeoutMs));
  }

  if (plan.proofDir !== undefined) {
    legacyArgs.push('--proof-dir', plan.proofDir);
  }

  legacyArgs.push(plan.prompt);

  const legacy = await executeLegacyWork({
    args: legacyArgs,
    summaryCommand: plan.command,
    forcedRunId: productRunId,
    runner,
    env,
    mcasRunner
  });

  if (legacy.summary === null) {
    return legacy;
  }

  const now = new Date().toISOString();
  const summary = {
    version: '1',
    command: plan.command,
    intent: plan.intent,
    semanticCommand: plan.semanticCommand,
    pipeline: plan.pipeline,
    safetyMode: 'write',
    projectWrites: true,
    mainWorktreeWrites: false,
    workspaceWrites: true,
    runtimeWrites: true,
    externalCalls: plan.externalCalls,
    destructiveWrites: false,
    status: legacy.summary.status,
    exitCode: legacy.summary.exitCode,
    verifierStatus: legacy.summary.verifierStatus,
    runId: legacy.summary.runId,
    plannedRunId: plan.planId,
    executionPlanId: plan.planId,
    executionPlanArtifactPath: symphonyStatePaths({
      stateDir: options.stateDir,
      planId: plan.planId
    }).executionPlanPath,
    writeBoundary: plan.writeBoundary,
    workflowMode: legacy.summary.workflowMode,
    adapter: legacy.summary.adapter,
    executionMode: legacy.summary.executionMode,
    requiresGate: plan.requiresGate,
    projectRoot: plan.projectRoot,
    projectFingerprint: plan.projectFingerprint,
    contextReused: true,
    contextArtifactPath: plan.contextArtifactPath,
    summaryArtifactPath: plan.summaryArtifactPath,
    evidenceArtifactPath: legacy.summary.evidenceArtifactPath,
    harnessOutputPath: legacy.summary.harnessOutputPath,
    taskPacketPath: legacy.summary.taskPacketPath,
    sourceWorkspacePath: legacy.summary.sourceWorkspacePath,
    sourceWorkspaceManifestPath: legacy.summary.sourceWorkspaceManifestPath,
    changedFiles: legacy.summary.changedFiles,
    matchedSignals: plan.matchedSignals,
    routeDecision: plan.routeDecision,
    stageBinding: options.noStage ? undefined : plan.stageBinding ?? stageGate.stageBinding ?? undefined,
    stageGate: stageGate.stageGate ?? undefined,
    confirmationCommand: plan.confirmationCommand,
    nextAction: 'symphony status'
  };

  if (legacy.summary.proofArtifactPath) {
    summary.proofArtifactPath = legacy.summary.proofArtifactPath;
  }

  await writeProductRunState({
    stateDir: options.stateDir,
    summary,
    updatedAt: now
  });

  return {
    exitCode: legacy.exitCode,
    summary,
    stderrText: legacy.stderrText
  };
}

async function executeLegacyWork({
  args,
  summaryCommand,
  forcedRunId,
  runner,
  env,
  mcasRunner
}) {
  const bufferedStdout = createBufferedStream();
  const bufferedStderr = createBufferedStream();
  const exitCode = await runSymphonyWork({
    args,
    summaryCommand,
    forcedRunId,
    stdout: bufferedStdout.stream,
    stderr: bufferedStderr.stream,
    runner,
    env,
    mcasRunner
  });

  if (bufferedStdout.text().trim() === '') {
    return {
      exitCode,
      summary: null,
      stderrText: bufferedStderr.text()
    };
  }

  return {
    exitCode,
    summary: parseJsonOutput(bufferedStdout.text(), `${summaryCommand} output`),
    stderrText: bufferedStderr.text()
  };
}

async function ensureFreshContext({
  projectDir,
  stateDir,
  runner,
  env,
  mcasRunner
}) {
  const projectFingerprint = await buildProjectFingerprint({
    projectDir,
    ignoredPaths: [stateDir]
  });
  const latest = await readLatestContext({ stateDir });

  if (
    latest?.contextArtifactPath
    && latest.projectFingerprint === projectFingerprint
    && resolve(latest.projectRoot) === resolve(projectDir)
  ) {
    return {
      scanned: false,
      pointer: latest
    };
  }

  const scan = await executeProductScan({
    options: {
      ...defaultScanProductOptions(),
      projectDir,
      stateDir
    },
    runner,
    env,
    mcasRunner
  });

  if (scan.summary === null || scan.exitCode !== EXIT_CODES.ok) {
    throw new UsageError('scan-if-needed failed before work could start');
  }

  return {
    scanned: true,
    pointer: await readLatestContext({ stateDir })
  };
}

async function runSymphonyPrompt({
  invocation,
  stdout,
  stderr,
  runner,
  env,
  mcasRunner
}) {
  const routeDecision = classifyPrompt({
    prompt: invocation.prompt,
    args: invocation.args
  });

  if (routeDecision.requiresConfirmation) {
    throw new UsageError('destructive prompts require --confirm-destructive');
  }

  if (routeDecision.intent === 'scan-project') {
    return await runSymphonyScanProduct({
      args: invocation.args,
      stdout,
      stderr,
      runner,
      env,
      mcasRunner,
      routeDecision
    });
  }

  if (routeDecision.intent === 'work') {
    return await runSymphonyWorkProduct({
      args: invocation.args,
      semanticCommand: 'do',
      stdout,
      stderr,
      runner,
      env,
      mcasRunner,
      prompt: invocation.prompt,
      routeDecision
    });
  }

  if (routeDecision.intent === 'review' || routeDecision.intent === 'verify') {
    return await runSymphonyWorkProduct({
      args: invocation.args,
      semanticCommand: routeDecision.intent,
      stdout,
      stderr,
      runner,
      env,
      mcasRunner,
      prompt: invocation.prompt,
      routeDecision
    });
  }

  if (routeDecision.intent === 'status') {
    return await runSymphonyStatus({
      args: invocation.args,
      stdout,
      routeDecision
    });
  }

  if (routeDecision.intent === 'artifacts') {
    return await runSymphonyArtifacts({
      args: invocation.args,
      stdout,
      routeDecision
    });
  }

  if (routeDecision.intent === 'continue') {
    return await runSymphonyContinue({
      args: invocation.args,
      stdout,
      routeDecision
    });
  }

  if (routeDecision.intent === 'console') {
    return await runSymphonyConsole({
      args: invocation.args,
      stdout
    });
  }

  return await runSymphonyNew({
    args: invocation.args,
    stdout,
    stderr,
    runner: runner ?? new NodeProcessRunner(),
    env,
    mcasRunner,
    prompt: invocation.prompt,
    promptTarget: buildPromptNewTarget({
      prompt: invocation.prompt,
      template: routeDecision.template
    }),
    promptTemplate: routeDecision.template,
    routeDecision
  });
}

async function runSymphonyStatus({ args, stdout, routeDecision }) {
  const options = parseStateReaderArgs(args);
  const latestRun = await readLatestRun({ stateDir: options.stateDir });
  const summary = latestRun === null
    ? {
        version: '1',
        command: 'symphony status',
        intent: 'status',
        semanticCommand: 'status',
        pipeline: ['status'],
        safetyMode: 'read-only',
        projectWrites: false,
        runtimeWrites: false,
        externalCalls: false,
        status: 'no-runs',
        nextAction: 'symphony scan',
        ...(routeDecision ? { matchedSignals: routeDecision.matchedSignals, routeDecision } : {})
      }
    : {
        version: '1',
        command: 'symphony status',
        intent: 'status',
        semanticCommand: 'status',
        pipeline: ['status'],
        safetyMode: 'read-only',
        projectWrites: false,
        runtimeWrites: false,
        externalCalls: false,
        status: latestRun.status,
        latestRunId: latestRun.runId,
        latestIntent: latestRun.intent,
        verifierStatus: latestRun.verifierStatus,
        contextArtifactPath: latestRun.contextArtifactPath,
        evidenceArtifactPath: latestRun.evidenceArtifactPath,
        executionPlanArtifactPath: latestRun.executionPlanArtifactPath,
        executionPlanId: latestRun.executionPlanId,
        adoptionPlanArtifactPath: latestRun.adoptionPlanArtifactPath,
        adoptionPlanId: latestRun.adoptionPlanId,
        sourceRunId: latestRun.sourceRunId,
        patchArtifactPath: latestRun.patchArtifactPath,
        patchHash: latestRun.patchHash,
        changedFiles: latestRun.changedFiles,
        confirmationCommand: latestRun.confirmationCommand,
        harnessOutputPath: latestRun.harnessOutputPath,
        taskPacketPath: latestRun.taskPacketPath,
        nextAction: latestRun.nextAction ?? 'symphony artifacts',
        ...(routeDecision ? { matchedSignals: routeDecision.matchedSignals, routeDecision } : {})
      };

  writeProductOutput(stdout, summary, options.json);
  return EXIT_CODES.ok;
}

async function runSymphonyArtifacts({ args, stdout, routeDecision }) {
  const options = parseArtifactsArgs(args);
  const runState = await readRunState({
    stateDir: options.stateDir,
    runId: options.runId
  });
  const summary = runState === null
    ? {
        version: '1',
        command: 'symphony artifacts',
        intent: 'artifacts',
        semanticCommand: 'artifacts',
        pipeline: ['artifacts'],
        safetyMode: 'read-only',
        projectWrites: false,
        runtimeWrites: false,
        externalCalls: false,
        status: 'missing',
        runId: options.runId ?? 'latest',
        nextAction: 'symphony status',
        ...(routeDecision ? { matchedSignals: routeDecision.matchedSignals, routeDecision } : {})
      }
    : {
        version: '1',
        command: 'symphony artifacts',
        intent: 'artifacts',
        semanticCommand: 'artifacts',
        pipeline: ['artifacts'],
        safetyMode: 'read-only',
        projectWrites: false,
        runtimeWrites: false,
        externalCalls: false,
        status: runState.status,
        runId: runState.runId,
        contextArtifactPath: runState.contextArtifactPath,
        summaryArtifactPath: runState.summaryArtifactPath,
        evidenceArtifactPath: runState.evidenceArtifactPath,
        harnessOutputPath: runState.harnessOutputPath,
        taskPacketPath: runState.taskPacketPath,
        proofArtifactPath: runState.proofArtifactPath,
        scaffoldPlanArtifactPath: runState.scaffoldPlanArtifactPath,
        scaffoldManifestArtifactPath: runState.scaffoldManifestArtifactPath,
        executionPlanArtifactPath: runState.executionPlanArtifactPath,
        executionPlanId: runState.executionPlanId,
        adoptionPlanArtifactPath: runState.adoptionPlanArtifactPath,
        adoptionPlanId: runState.adoptionPlanId,
        sourceRunId: runState.sourceRunId,
        patchArtifactPath: runState.patchArtifactPath,
        patchHash: runState.patchHash,
        changedFiles: runState.changedFiles,
        confirmationCommand: runState.confirmationCommand,
        nextAction: 'symphony status',
        ...(routeDecision ? { matchedSignals: routeDecision.matchedSignals, routeDecision } : {})
      };

  writeProductOutput(stdout, summary, options.json);
  return EXIT_CODES.ok;
}

async function runSymphonyContinue({ args, stdout, routeDecision }) {
  const options = parseStateReaderArgs(args);
  const latestRun = await readLatestRun({ stateDir: options.stateDir });
  const summary = latestRun === null
    ? {
        version: '1',
        command: 'symphony continue',
        intent: 'continue',
        semanticCommand: 'continue',
        pipeline: ['continue latest'],
        safetyMode: 'read-only',
        projectWrites: false,
        runtimeWrites: false,
        externalCalls: false,
        status: 'no-runs',
        continuationStatus: 'nothing-to-continue',
        nextAction: 'symphony scan',
        ...(routeDecision ? { matchedSignals: routeDecision.matchedSignals, routeDecision } : {})
      }
    : {
        version: '1',
        command: 'symphony continue',
        intent: 'continue',
        semanticCommand: 'continue',
        pipeline: ['continue latest'],
        safetyMode: 'read-only',
        projectWrites: false,
        runtimeWrites: false,
        externalCalls: false,
        status: latestRun.status,
        runId: latestRun.runId,
        continuationStatus: latestRun.status === 'passed' ? 'nothing-to-continue' : 'safe-action-needed',
        contextArtifactPath: latestRun.contextArtifactPath,
        evidenceArtifactPath: latestRun.evidenceArtifactPath,
        executionPlanArtifactPath: latestRun.executionPlanArtifactPath,
        executionPlanId: latestRun.executionPlanId,
        harnessOutputPath: latestRun.harnessOutputPath,
        taskPacketPath: latestRun.taskPacketPath,
        nextAction: latestRun.status === 'passed'
          ? 'symphony artifacts'
          : latestRun.nextAction ?? 'symphony do --dry-run "<task>"',
        ...(routeDecision ? { matchedSignals: routeDecision.matchedSignals, routeDecision } : {})
      };

  writeProductOutput(stdout, summary, options.json);
  return EXIT_CODES.ok;
}

async function runSymphonyConsole({ args, stdout }) {
  const options = parseConsoleArgs(args);

  if (options.snapshot) {
    const snapshot = await buildConsoleSnapshot({
      stateDir: options.stateDir
    });

    if (options.json) {
      writeJson(stdout, snapshot);
    } else {
      stdout.write(humanConsoleSnapshot(snapshot));
    }

    return EXIT_CODES.ok;
  }

  const server = await startSymphonyConsoleServer({
    stateDir: options.stateDir,
    host: options.host,
    port: options.port
  });
  const summary = {
    version: '1',
    command: 'symphony console',
    intent: 'console',
    semanticCommand: 'console',
    pipeline: ['console'],
    safetyMode: 'read-only',
    projectWrites: false,
    runtimeWrites: false,
    externalCalls: false,
    destructiveWrites: false,
    status: 'listening',
    url: server.url,
    host: server.host,
    port: server.port,
    stateDir: options.stateDir,
    nextAction: server.url
  };

  writeProductOutput(stdout, summary, options.json);
  return EXIT_CODES.ok;
}

async function runSymphonyDiagnose({ args, stdout, runner, env }) {
  const options = parseDiagnoseArgs(args);
  const report = await buildConsoleDiagnosticsReport({
    stateDir: options.stateDir,
    cwd: process.cwd(),
    env,
    runner
  });

  if (options.json) {
    writeJson(stdout, report);
    return EXIT_CODES.ok;
  }

  if (options.html) {
    stdout.write(renderDiagnosticsHtml(report));
    return EXIT_CODES.ok;
  }

  stdout.write(renderDiagnosticsText(report));
  return EXIT_CODES.ok;
}

async function runSymphonyStage({ args, stdout }) {
  const options = parseStageArgs(args);
  let summary;

  if (options.help) {
    stdout.write(stageHelpText(options.subcommand));
    return EXIT_CODES.ok;
  }

  if (options.subcommand === 'create') {
    const created = await createStageCharter({
      stageId: options.stageId,
      docsDir: options.stageDocsDir,
      overwrite: options.write
    });
    summary = {
      version: '1',
      command: 'symphony stage create',
      intent: 'stage',
      semanticCommand: 'stage',
      pipeline: ['stage', 'create'],
      safetyMode: 'write',
      projectWrites: true,
      runtimeWrites: false,
      externalCalls: false,
      destructiveWrites: false,
      status: created.status,
      stageId: created.stageId,
      stageCharterArtifactPath: created.paths.charterPath,
      stageCharterHtmlArtifactPath: created.paths.htmlPath,
      writtenFiles: created.writes,
      nextAction: `symphony stage activate ${created.stageId}`
    };
    writeProductOutput(stdout, summary, options.json);
    return EXIT_CODES.ok;
  }

  if (options.subcommand === 'activate') {
    const activated = await activateStage({
      stateDir: options.stateDir,
      docsDir: options.stageDocsDir,
      stageId: options.stageId
    });
    summary = {
      version: '1',
      command: 'symphony stage activate',
      intent: 'stage',
      semanticCommand: 'stage',
      pipeline: ['stage', 'activate'],
      safetyMode: 'write',
      projectWrites: false,
      runtimeWrites: true,
      externalCalls: false,
      destructiveWrites: false,
      status: activated.status,
      stageId: activated.stageId,
      active: true,
      consistency: activated.state.consistency,
      blocker: activated.state.blocker,
      stageCharterArtifactPath: activated.state.charterPath,
      stageCharterHtmlArtifactPath: activated.state.htmlPath,
      statePath: symphonyStatePaths({
        stateDir: options.stateDir,
        stageId: activated.stageId
      }).stagePath,
      latestStagePath: symphonyStatePaths({ stateDir: options.stateDir }).latestStagePath,
      nextAction: 'symphony stage summary'
    };
    writeProductOutput(stdout, summary, options.json);
    return EXIT_CODES.ok;
  }

  if (options.subcommand === 'render') {
    const rendered = await renderStageCharterFile({
      stageId: options.stageId,
      docsDir: options.stageDocsDir,
      write: options.write
    });
    summary = {
      version: '1',
      command: 'symphony stage render',
      intent: 'stage',
      semanticCommand: 'stage',
      pipeline: ['stage', 'render'],
      safetyMode: rendered.runtimeWrites ? 'write' : 'read-only',
      projectWrites: rendered.runtimeWrites,
      runtimeWrites: false,
      externalCalls: false,
      destructiveWrites: false,
      status: rendered.status,
      stageId: rendered.stageId,
      stageCharterArtifactPath: rendered.paths.charterPath,
      stageCharterHtmlArtifactPath: rendered.paths.htmlPath,
      html: options.json ? rendered.html : undefined,
      nextAction: `symphony stage activate ${rendered.stageId}`
    };

    if (!options.json && !options.write) {
      stdout.write(rendered.html);
      return EXIT_CODES.ok;
    }

    writeProductOutput(stdout, summary, options.json);
    return EXIT_CODES.ok;
  }

  summary = await buildStageCommandSummary({
    stateDir: options.stateDir,
    docsDir: options.stageDocsDir,
    stageId: options.stageId,
    command: options.subcommand === 'summary' ? 'symphony stage summary' : 'symphony stage'
  });
  writeStageStatusOutput(stdout, summary, options.json);
  return EXIT_CODES.ok;
}

async function runSymphonyNext({ args, stdout }) {
  const options = parseNextArgs(args);
  const stage = await buildStageCommandSummary({
    stateDir: options.stateDir,
    docsDir: options.stageDocsDir,
    command: 'symphony next'
  });
  const summary = {
    version: '1',
    command: 'symphony next',
    intent: 'next',
    semanticCommand: 'next',
    pipeline: ['next'],
    safetyMode: 'read-only',
    projectWrites: false,
    runtimeWrites: false,
    externalCalls: false,
    destructiveWrites: false,
    status: stage.status,
    stageId: stage.stageId,
    stage: stage.stage,
    goal: stage.goal,
    topRisks: stage.topRisks,
    blocker: stage.blocker,
    nextAction: stage.nextAction
  };

  writeProductOutput(stdout, summary, options.json);
  return EXIT_CODES.ok;
}

async function runSymphonyAdopt({ args, stdout, runner }) {
  const options = parseAdoptArgs(args);
  const result = options.mode === 'plan'
    ? await executeAdoptionPlanning({ options, runner })
    : options.mode === 'confirm'
      ? await executeAdoptionConfirmation({ options, runner })
      : await executeAdoptionInspection({ options });

  writeProductOutput(stdout, result.summary, options.json);

  return result.exitCode;
}

async function executeAdoptionPlanning({ options, runner }) {
  const stageGate = await enforceStageConsistencyGate({
    stateDir: options.stateDir,
    docsDir: options.stageDocsDir,
    action: {
      kind: 'adoption-plan',
      command: 'adopt',
      subcommand: 'run',
      sourceRunId: options.sourceRunId,
      targetId: options.sourceRunId,
      safetyMode: 'write',
      writeMode: 'write',
      riskMode: 'high',
      flags: {
        sourceRunId: options.sourceRunId,
        stateDir: options.stateDir
      }
    },
    attemptedCommand: 'symphony adopt --run',
    highRisk: true
  });

  if (stageGate.blocked) {
    throwStageGateBlocked(stageGate, 'symphony adopt --run');
  }

  const source = await loadAndValidateAdoptionSource({
    stateDir: options.stateDir,
    sourceRunId: options.sourceRunId
  });
  const adoptionStageBinding = stageGate.stageBinding ?? source.sourceRun.stageBinding;
  const stageAdoptionSummary = buildStageAdoptionSummary({
    stageBinding: adoptionStageBinding,
    sourceRun: source.sourceRun
  });
  const projectFingerprintIgnoredPaths = normalizeIgnoredPathList({
    projectRoot: source.projectRoot,
    paths: [options.stateDir, source.executionPlan.workDir]
  });
  const gitHead = await readGitHead({
    runner,
    cwd: source.projectRoot
  });
  const gitStatusIgnoredPaths = normalizeIgnoredPathList({
    projectRoot: source.projectRoot,
    paths: [
      options.stateDir,
      '.symphony',
      source.executionPlan.workDir,
      source.sourceRun.harnessOutputPath,
      source.sourceRun.taskPacketPath,
      source.sourceRun.evidenceArtifactPath,
      source.sourceWorkspacePath
    ]
  });
  const gitStatus = await buildGitStatusFingerprint({
    runner,
    cwd: source.projectRoot,
    ignoredPaths: gitStatusIgnoredPaths
  });

  if (gitStatus.entries.length > 0) {
    throw new UsageError('dirty worktree blocks adoption planning');
  }

  const currentProjectFingerprint = await buildProjectFingerprint({
    projectDir: source.projectRoot,
    ignoredPaths: projectFingerprintIgnoredPaths
  });

  if (currentProjectFingerprint !== source.sourceRun.projectFingerprint
    || currentProjectFingerprint !== source.executionPlan.projectFingerprint) {
    throw new UsageError('source metadata is stale: project fingerprint changed');
  }

  const adoptionId = buildAdoptionPlanId({
    sourceRunId: source.sourceRun.runId,
    executionPlanId: source.executionPlan.planId
  });
  const plannedRunId = buildAdoptionPlanningRunId(adoptionId);
  const confirmationCommand = buildAdoptionConfirmationCommand({
    adoptionId,
    stateDir: options.stateDir
  });
  const paths = symphonyStatePaths({
    stateDir: options.stateDir,
    adoptionId
  });
  const now = new Date().toISOString();
  let patchCandidate;

  try {
    patchCandidate = await buildAdoptionPatchCandidate({
      projectRoot: source.projectRoot,
      sourceRun: source.sourceRun,
      sourceWorkspacePath: source.sourceWorkspacePath,
      evidenceArtifactPath: source.sourceRun.evidenceArtifactPath,
      ignoredRoots: buildAdoptionCandidateIgnoredRoots({
        projectRoot: source.projectRoot,
        stateDir: options.stateDir,
        workDir: source.executionPlan.workDir
      })
    });
  } catch (error) {
    if (error instanceof AdoptionUnsupportedChangesError) {
      await writeFailedAdoptionPlanningRun({
        stateDir: options.stateDir,
        source,
        runId: plannedRunId,
        unsupportedChanges: error.unsupportedChanges,
        now,
        stageBinding: adoptionStageBinding,
        stageGate: stageGate.stageGate,
        stageAdoptionSummary
      });
      throw new UsageError(error.message);
    }

    throw error;
  }

  await mkdir(dirname(paths.adoptionPatchPath), { recursive: true });
  await writeFile(paths.adoptionPatchPath, patchCandidate.patch, 'utf8');

  const patchHash = sha256Text(patchCandidate.patch);
  const changedFiles = patchCandidate.operations.map((operation) => operation.path);
  const fileOperations = patchCandidate.operations.map(publicFileOperation);
  const plan = {
    version: '1',
    kind: 'symphony.adoption-plan',
    contractName: 'symphony.adoption-plan',
    contractVersion: '1',
    adoptionId,
    command: 'symphony adopt',
    intent: 'adopt',
    semanticCommand: 'adopt',
    pipeline: ['adopt-plan'],
    safetyMode: 'write',
    stateDir: options.stateDir,
    sourceRunId: source.sourceRun.runId,
    sourceRunArtifactPath: source.sourceRunArtifactPath,
    executionPlanId: source.executionPlan.planId,
    executionPlanArtifactPath: source.executionPlanArtifactPath,
    plannedRunId,
    projectRoot: source.projectRoot,
    projectFingerprint: currentProjectFingerprint,
    projectFingerprintIgnoredPaths,
    gitHead,
    gitStatusFingerprint: gitStatus.fingerprint,
    gitStatusIgnoredPaths,
    stageBinding: adoptionStageBinding,
    stageGate: stageGate.stageGate,
    stageAdoptionSummary,
    sourceWorkspacePath: source.sourceWorkspacePath,
    sourceWorkspaceManifestPath: source.sourceWorkspaceManifestPath,
    sourceWorkspaceFingerprint: patchCandidate.sourceWorkspaceFingerprint,
    sourceEvidenceArtifactPath: source.sourceRun.evidenceArtifactPath,
    sourceVerifierStatus: source.sourceRun.verifierStatus,
    sourceWriteBoundary: 'isolated-workspace',
    writeBoundary: 'main-worktree',
    projectWrites: true,
    mainWorktreeWrites: true,
    workspaceWrites: false,
    runtimeWrites: true,
    externalCalls: false,
    destructiveWrites: false,
    patchArtifactPath: paths.adoptionPatchPath,
    patchHash,
    changedFiles,
    fileOperations,
    unsupportedChanges: [],
    confirmationCommand,
    createdAt: now
  };
  const adoptionPlanArtifactPath = await writeAdoptionPlan({
    stateDir: options.stateDir,
    plan
  });
  const summary = {
    version: '1',
    command: 'symphony adopt',
    intent: 'adopt',
    semanticCommand: 'adopt',
    pipeline: ['adopt-plan'],
    safetyMode: 'write',
    projectWrites: true,
    mainWorktreeWrites: false,
    workspaceWrites: false,
    runtimeWrites: true,
    externalCalls: false,
    destructiveWrites: false,
    status: 'adoption-planned',
    exitCode: EXIT_CODES.ok,
    verifierStatus: 'not-run',
    runId: plannedRunId,
    adoptionPlanId: adoptionId,
    adoptionPlanArtifactPath,
    sourceRunId: source.sourceRun.runId,
    sourceRunArtifactPath: source.sourceRunArtifactPath,
    executionPlanId: source.executionPlan.planId,
    executionPlanArtifactPath: source.executionPlanArtifactPath,
    patchArtifactPath: paths.adoptionPatchPath,
    patchHash,
    changedFiles,
    fileOperations,
    sourceWorkspacePath: source.sourceWorkspacePath,
    sourceWorkspaceManifestPath: source.sourceWorkspaceManifestPath,
    sourceWorkspaceFingerprint: patchCandidate.sourceWorkspaceFingerprint,
    sourceEvidenceArtifactPath: source.sourceRun.evidenceArtifactPath,
    sourceVerifierStatus: source.sourceRun.verifierStatus,
    projectRoot: source.projectRoot,
    projectFingerprint: currentProjectFingerprint,
    gitHead,
    gitStatusFingerprint: gitStatus.fingerprint,
    stageBinding: adoptionStageBinding,
    stageGate: stageGate.stageGate,
    stageAdoptionSummary,
    writeBoundary: 'main-worktree',
    confirmationCommand,
    nextAction: confirmationCommand
  };

  await writeProductRunState({
    stateDir: options.stateDir,
    summary,
    updatedAt: now
  });

  return {
    exitCode: EXIT_CODES.ok,
    summary
  };
}

async function executeAdoptionConfirmation({ options, runner }) {
  const preflightPlan = await readAdoptionPlan({
    stateDir: options.stateDir,
    adoptionId: options.adoptionId
  });
  const projectState = preflightPlan === null
    ? null
    : await buildStageGateProjectState({
        projectDir: preflightPlan.projectRoot,
        stateDir: options.stateDir,
        ignoredPaths: [
          options.stateDir,
          options.stageDocsDir,
          ...(Array.isArray(preflightPlan.gitStatusIgnoredPaths) ? preflightPlan.gitStatusIgnoredPaths : [])
        ],
        runner
      });
  const stageGate = await enforceStageConsistencyGate({
    stateDir: options.stateDir,
    docsDir: options.stageDocsDir,
    action: {
      kind: 'adoption-confirm',
      command: 'adopt',
      subcommand: 'confirm',
      adoptionId: options.adoptionId,
      targetId: options.adoptionId,
      safetyMode: 'write',
      writeMode: 'write',
      riskMode: 'high',
      adoptionPatchHash: preflightPlan?.patchHash,
      flags: {
        adoptionId: options.adoptionId,
        stateDir: options.stateDir
      }
    },
    attemptedCommand: 'symphony adopt --confirm',
    projectState,
    highRisk: true
  });

  if (stageGate.blocked) {
    throwStageGateBlocked(stageGate, 'symphony adopt --confirm');
  }

  const plan = preflightPlan;

  if (plan === null) {
    throw new UsageError(`adoption plan not found: ${options.adoptionId}`);
  }

  assertAdoptionPlan(plan, options.adoptionId);

  const runId = buildAdoptionConfirmationRunId(plan);
  const now = new Date().toISOString();
  const confirmationStageBinding = plan.stageBinding ?? stageGate.stageBinding;
  const stageAdoptionSummary = buildStageAdoptionSummary({
    stageBinding: confirmationStageBinding,
    plan
  });
  let journalPath;
  let patchApplied = false;

  try {
    await revalidateAdoptionPlanBeforeWrite({
      plan,
      stateDir: options.stateDir,
      runner
    });

    const check = await runGitCommand({
      runner,
      cwd: plan.projectRoot,
      args: ['apply', '--check', plan.patchArtifactPath],
      failureMessage: 'git apply --check failed for frozen adoption patch'
    });

    if (check.exitCode !== 0) {
      throw new UsageError('git apply --check failed for frozen adoption patch');
    }

    const journal = await buildAdoptionJournal({
      plan,
      runId,
      createdAt: now
    });
    journalPath = symphonyStatePaths({
      stateDir: options.stateDir,
      adoptionId: plan.adoptionId
    }).adoptionJournalPath;

    await writeFile(journalPath, `${JSON.stringify(redactSecrets(journal), null, 2)}\n`, 'utf8');

    const applyingSummary = buildAdoptionConfirmationSummary({
      plan,
      runId,
      evidencePath: undefined,
      journalPath,
      status: 'applying',
      exitCode: null,
      verifierStatus: 'not-run',
      mainWorktreeWrites: false,
      failurePhase: undefined,
      stageBinding: confirmationStageBinding,
      stageGate: stageGate.stageGate,
      stageAdoptionSummary
    });

    await writeProductRunState({
      stateDir: options.stateDir,
      summary: applyingSummary,
      updatedAt: now
    });

    const apply = await runGitCommand({
      runner,
      cwd: plan.projectRoot,
      args: ['apply', plan.patchArtifactPath],
      failureMessage: 'git apply failed for frozen adoption patch'
    });

    if (apply.exitCode !== 0) {
      throw new UsageError('git apply failed for frozen adoption patch');
    }

    patchApplied = true;

    const evidence = await buildAdoptionConfirmationEvidence({
      plan,
      runner,
      generatedAt: now
    });
    const evidencePath = symphonyStatePaths({
      stateDir: options.stateDir,
      adoptionId: plan.adoptionId
    }).adoptionEvidencePath;

    await writeFile(evidencePath, `${JSON.stringify(redactSecrets(evidence), null, 2)}\n`, 'utf8');
    await writeAdoptionJournalStatus({
      journalPath,
      status: 'applied',
      updatedAt: new Date().toISOString()
    });

    const summary = buildAdoptionConfirmationSummary({
      plan,
      runId,
      evidencePath,
      journalPath,
      status: 'passed',
      exitCode: EXIT_CODES.ok,
      verifierStatus: 'passed',
      mainWorktreeWrites: true,
      failurePhase: undefined,
      stageBinding: confirmationStageBinding,
      stageGate: stageGate.stageGate,
      stageAdoptionSummary
    });

    await writeProductRunState({
      stateDir: options.stateDir,
      summary,
      updatedAt: now
    });

    return {
      exitCode: EXIT_CODES.ok,
      summary
    };
  } catch (error) {
    if (patchApplied) {
      await writeFailedAdoptionConfirmationRunBestEffort({
        stateDir: options.stateDir,
        plan,
        runId,
        now,
        mainWorktreeWrites: true,
        failurePhase: 'post-apply-evidence',
        message: error.message,
        journalPath,
        stageBinding: confirmationStageBinding,
        stageGate: stageGate.stageGate,
        stageAdoptionSummary
      });
    } else if (error instanceof UsageError) {
      await writeFailedAdoptionConfirmationRun({
        stateDir: options.stateDir,
        plan,
        runId,
        now,
        mainWorktreeWrites: false,
        failurePhase: 'adoption-confirmation-preflight',
        message: error.message,
        journalPath,
        stageBinding: confirmationStageBinding,
        stageGate: stageGate.stageGate,
        stageAdoptionSummary
      });
    }

    throw error;
  }
}

async function executeAdoptionInspection({ options }) {
  let summary;

  try {
    summary = await buildAdoptionInspectionSummary({
      stateDir: options.stateDir,
      adoptionId: options.adoptionId,
      exitCode: EXIT_CODES.ok
    });
  } catch (error) {
    throw new UsageError(error.message);
  }

  return {
    exitCode: EXIT_CODES.ok,
    summary
  };
}

async function runSymphonyNew({
  args,
  stdout,
  stderr,
  runner,
  env,
  mcasRunner,
  prompt,
  promptTarget,
  promptTemplate,
  routeDecision
}) {
  const options = parseNewProjectArgs(args, {
    promptTarget,
    promptTemplate
  });
  const runId = buildNewRunId(options);
  const artifactDirectory = join(options.runtimeDir, runId, 'runtime', 'artifacts');
  const scaffoldPlan = buildScaffoldPlan({
    prompt,
    targetDir: options.targetDir,
    template: options.template,
    templateOverride: options.templateOverride,
    write: options.write
  });
  let stageGate = {
    stageBinding: undefined,
    stageGate: undefined
  };
  let scaffold;

  if (options.write) {
    const projectState = await buildStageGateProjectState({
      projectDir: dirname(resolve(options.targetDir)),
      stateDir: options.stateDir,
      ignoredPaths: [options.stateDir, options.runtimeDir, options.targetDir, options.stageDocsDir],
      runner
    });

    stageGate = await enforceStageConsistencyGate({
      stateDir: options.stateDir,
      docsDir: options.stageDocsDir,
      explicitStageId: options.stageId,
      noStage: options.noStage,
      action: {
        kind: 'new-write',
        command: 'new',
        subcommand: 'write',
        targetId: options.targetDir,
        safetyMode: 'write',
        writeMode: 'write',
        riskMode: 'high',
        prompt: prompt ?? null,
        flags: {
          targetDir: options.targetDir,
          template: options.template,
          templateOverride: options.templateOverride,
          runtimeDir: options.runtimeDir,
          stateDir: options.stateDir,
          write: true
        }
      },
      attemptedCommand: 'symphony new --write',
      projectState,
      highRisk: true
    });

    if (stageGate.blocked) {
      throwStageGateBlocked(stageGate, 'symphony new --write');
    }
  }

  try {
    scaffold = await scaffoldProject({
      targetDir: options.targetDir,
      template: scaffoldPlan.template,
      scaffoldPlan,
      write: options.write,
      runner
    });
  } catch (error) {
    if (error instanceof ScaffoldError) {
      throw new UsageError(error.message);
    }

    throw error;
  }

  const store = new ArtifactStore(artifactDirectory);
  await store.writeArtifact('symphony-new', 'scaffold-plan', scaffoldPlan);
  await store.writeArtifact('symphony-new', 'scaffold-manifest', scaffold.manifest);

  const planArtifactPath = join(artifactDirectory, 'symphony-new', 'scaffold-plan.json');
  const manifestArtifactPath = join(artifactDirectory, 'symphony-new', 'scaffold-manifest.json');
  let scanSummary;

  if (options.write) {
    const scan = await executeProductScan({
      options: {
        ...defaultScanProductOptions(),
        projectDir: scaffold.manifest.resolvedTargetDir,
        outputDir: join(options.runtimeDir, runId, 'scan'),
        stateDir: options.stateDir
      },
      runner,
      env,
      mcasRunner
    });

    if (scan.summary === null) {
      if (scan.stderrText !== '') {
        stderr.write(scan.stderrText);
      }

      return scan.exitCode;
    }

    scanSummary = scan.summary;
  }

  const now = new Date().toISOString();
  const summary = {
    version: '1',
    command: 'symphony new',
    intent: 'new-project',
    semanticCommand: 'new',
    pipeline: ['new', 'scan'],
    safetyMode: options.write ? 'write' : 'dry-run',
    projectWrites: options.write,
    runtimeWrites: true,
    externalCalls: false,
    destructiveWrites: false,
    status: scaffold.status,
    exitCode: EXIT_CODES.ok,
    verifierStatus: options.write ? scanSummary?.verifierStatus ?? scanSummary?.status : 'not-run',
    runId,
    projectKind: scaffoldPlan.projectKind,
    detectedStack: scaffoldPlan.detectedStack,
    scaffoldPlan,
    networkInstall: scaffoldPlan.networkInstall,
    unsupportedRequests: scaffoldPlan.unsupportedRequests,
    template: scaffoldPlan.template,
    targetDir: options.targetDir,
    createdFiles: scaffold.manifest.createdFiles,
    scaffoldPlanArtifactPath: planArtifactPath,
    scaffoldManifestArtifactPath: manifestArtifactPath,
    contextArtifactPath: scanSummary?.contextArtifactPath,
    summaryArtifactPath: scanSummary?.summaryArtifactPath,
    stageBinding: stageGate.stageBinding ?? undefined,
    stageGate: stageGate.stageGate ?? undefined,
    ...(routeDecision ? { matchedSignals: routeDecision.matchedSignals, routeDecision } : {}),
    nextAction: options.write
      ? 'symphony status'
      : `symphony new ${options.targetDir} --template ${scaffoldPlan.template} --write`
  };

  await writeProductRunState({
    stateDir: options.stateDir,
    summary,
    updatedAt: now
  });

  writeProductOutput(stdout, summary, options.json);
  return EXIT_CODES.ok;
}

function parseWorkArgs(args) {
  let mode;
  let workDir = 'tmp/symphony-work';
  let proofDir = 'tmp/real-cli-proofs';
  let realAdapter;
  let dryRun = false;
  let preflightIntake = false;
  let materializeWorkspaces = false;
  let intakeArtifact;
  let timeoutMs;
  const promptParts = [];

  for (let index = 0; index < args.length; index += 1) {
    const value = args[index];

    if (value === '--dry-run') {
      dryRun = true;
      continue;
    }

    if (value === '--preflight-intake') {
      preflightIntake = true;
      continue;
    }

    if (value === '--materialize-workspaces') {
      materializeWorkspaces = true;
      continue;
    }

    if (value === '--intake-artifact') {
      intakeArtifact = readRequiredValue(args, index, '--intake-artifact');
      index += 1;
      continue;
    }

    if (value === '--mode') {
      mode = readRequiredValue(args, index, '--mode');
      index += 1;
      continue;
    }

    if (value === '--real') {
      realAdapter = normalizeWorkAdapter(readRequiredValue(args, index, '--real'));
      index += 1;
      continue;
    }

    if (value === '--adapter') {
      realAdapter = normalizeWorkAdapter(readRequiredValue(args, index, '--adapter'));
      index += 1;
      continue;
    }

    if (value === '--work-dir') {
      workDir = readRequiredValue(args, index, '--work-dir');
      index += 1;
      continue;
    }

    if (value === '--proof-dir') {
      proofDir = readRequiredValue(args, index, '--proof-dir');
      index += 1;
      continue;
    }

    if (value === '--timeout-ms') {
      timeoutMs = toPositiveInteger(readRequiredValue(args, index, '--timeout-ms'), '--timeout-ms');
      index += 1;
      continue;
    }

    if (value.startsWith('--')) {
      throw new UsageError(`unknown work option: ${value}`);
    }

    promptParts.push(value);
  }

  const prompt = promptParts.join(' ').trim();

  assertNonEmptyString(prompt, 'work prompt');
  mode = mode ?? defaultWorkMode(prompt);
  assertWorkMode(mode);

  if (preflightIntake && intakeArtifact !== undefined) {
    throw new UsageError('--preflight-intake and --intake-artifact cannot be combined');
  }

  return {
    prompt,
    mode,
    workDir,
    proofDir,
    adapter: realAdapter ?? 'codex',
    executionMode: dryRun || realAdapter === undefined ? 'dry-run' : 'real',
    preflightIntake,
    materializeWorkspaces,
    intakeArtifact,
    timeoutMs
  };
}

function parseSymphonyIntakeArgs(args) {
  const options = {
    projectDir: '.',
    outputDir: 'tmp/symphony-intake',
    provider: 'builtin',
    format: 'json',
    requireProvider: false
  };
  const valueOptions = new Set([
    '--project-dir',
    '--output-dir',
    '--format',
    '--provider',
    '--provider-command',
    '--fail-on'
  ]);
  const knownOptions = new Set([...valueOptions, '--require-provider']);

  for (let index = 0; index < args.length; index += 1) {
    const value = args[index];

    if (!value.startsWith('--')) {
      throw new UsageError(`unexpected intake argument: ${value}`);
    }

    if (!knownOptions.has(value)) {
      throw new UsageError(`unknown intake option: ${value}`);
    }

    if (value === '--require-provider') {
      options.requireProvider = true;
      continue;
    }

    const optionValue = readRequiredValue(args, index, value);

    if (value === '--project-dir') {
      options.projectDir = optionValue;
    } else if (value === '--output-dir') {
      options.outputDir = optionValue;
    } else if (value === '--format') {
      options.format = optionValue;
    } else if (value === '--provider') {
      options.provider = optionValue;
    } else if (value === '--provider-command') {
      options.providerCommand = optionValue;
    } else if (value === '--fail-on') {
      options.failOn = optionValue;
    }

    if (valueOptions.has(value)) {
      index += 1;
    }
  }

  if (!['builtin', 'grill-me-docs'].includes(options.provider)) {
    throw new UsageError('provider must be one of: builtin, grill-me-docs');
  }

  if (!['json', 'summary'].includes(options.format)) {
    throw new UsageError('format must be one of: json, summary');
  }

  if (options.failOn !== undefined && !['low', 'medium', 'high', 'critical'].includes(options.failOn)) {
    throw new UsageError('fail-on must be one of: low, medium, high, critical');
  }

  return options;
}

function defaultScanProductOptions() {
  return {
    projectDir: '.',
    outputDir: 'tmp/symphony-scan',
    stateDir: '.symphony',
    providerMode: 'auto',
    providerCommand: 'grill-me-docs',
    requireProvider: false,
    json: false
  };
}

function parseScanProductArgs(args) {
  const options = defaultScanProductOptions();

  for (let index = 0; index < args.length; index += 1) {
    const value = args[index];

    if (value === '--json') {
      options.json = true;
      continue;
    }

    if (value === '--builtin') {
      options.providerMode = 'builtin';
      continue;
    }

    if (value === '--grill') {
      options.providerMode = 'grill';
      continue;
    }

    if (value === '--require-grill') {
      options.providerMode = 'grill';
      options.requireProvider = true;
      continue;
    }

    if (value === '--project-dir') {
      options.projectDir = readRequiredValue(args, index, '--project-dir');
      index += 1;
      continue;
    }

    if (value === '--output-dir') {
      options.outputDir = readRequiredValue(args, index, '--output-dir');
      index += 1;
      continue;
    }

    if (value === '--state-dir') {
      options.stateDir = readRequiredValue(args, index, '--state-dir');
      index += 1;
      continue;
    }

    if (value === '--provider') {
      const provider = readRequiredValue(args, index, '--provider');
      options.providerMode = provider === 'grill-me-docs' ? 'grill' : provider;
      index += 1;
      continue;
    }

    if (value === '--provider-command') {
      options.providerCommand = readRequiredValue(args, index, '--provider-command');
      index += 1;
      continue;
    }

    if (value === '--fail-on') {
      options.failOn = readRequiredValue(args, index, '--fail-on');
      index += 1;
      continue;
    }

    if (value.startsWith('--')) {
      throw new UsageError(`unknown scan option: ${value}`);
    }

    throw new UsageError(`unexpected scan argument: ${value}`);
  }

  if (!['auto', 'builtin', 'grill'].includes(options.providerMode)) {
    throw new UsageError('scan provider must be one of: auto, builtin, grill-me-docs');
  }

  return options;
}

function parseWorkProductArgs(args, { semanticCommand, prompt }) {
  const options = {
    prompt,
    projectDir: '.',
    stateDir: '.symphony',
    stageDocsDir: DEFAULT_STAGE_DOCS_DIR,
    workDir: 'tmp/symphony-work',
    safetyMode: semanticCommand === 'review' ? 'read-only' : 'dry-run',
    adapter: 'codex',
    realRequested: false,
    writeRequested: false,
    mode: semanticCommand === 'do' ? 'writer-reviewer' : 'qa-swarm',
    json: false
  };
  const promptParts = [];

  for (let index = 0; index < args.length; index += 1) {
    const value = args[index];

    if (value === '--json') {
      options.json = true;
      continue;
    }

    if (value === '--dry-run') {
      options.safetyMode = 'dry-run';
      continue;
    }

    if (value === '--write') {
      options.writeRequested = true;
      options.safetyMode = 'write';
      continue;
    }

    if (value === '--real') {
      options.adapter = normalizeWorkAdapter(readRequiredValue(args, index, '--real'));
      options.realRequested = true;
      if (!options.writeRequested) {
        options.safetyMode = 'external';
      }
      index += 1;
      continue;
    }

    if (value === '--state-dir') {
      options.stateDir = readRequiredValue(args, index, '--state-dir');
      index += 1;
      continue;
    }

    if (value === '--stage-docs-dir') {
      options.stageDocsDir = readRequiredValue(args, index, '--stage-docs-dir');
      index += 1;
      continue;
    }

    if (value === '--stage') {
      options.stageId = readRequiredValue(args, index, '--stage');
      assertSafePathSegment(options.stageId, 'stage id');
      index += 1;
      continue;
    }

    if (value === '--no-stage') {
      options.noStage = true;
      continue;
    }

    if (value === '--project-dir') {
      options.projectDir = readRequiredValue(args, index, '--project-dir');
      index += 1;
      continue;
    }

    if (value === '--work-dir') {
      options.workDir = readRequiredValue(args, index, '--work-dir');
      index += 1;
      continue;
    }

    if (value === '--proof-dir') {
      options.proofDir = readRequiredValue(args, index, '--proof-dir');
      index += 1;
      continue;
    }

    if (value === '--mode') {
      options.mode = readRequiredValue(args, index, '--mode');
      assertWorkMode(options.mode);
      index += 1;
      continue;
    }

    if (value === '--timeout-ms') {
      options.timeoutMs = toPositiveInteger(readRequiredValue(args, index, '--timeout-ms'), '--timeout-ms');
      index += 1;
      continue;
    }

    if (value === '--confirm-destructive') {
      continue;
    }

    if (value.startsWith('--')) {
      throw new UsageError(`unknown ${semanticCommand} option: ${value}`);
    }

    promptParts.push(value);
  }

  options.prompt = options.prompt ?? promptParts.join(' ').trim();
  assertNonEmptyString(options.prompt, `${semanticCommand} prompt`);

  if (options.writeRequested) {
    options.safetyMode = 'write';
  }

  if (options.noStage && options.stageId !== undefined) {
    throw new UsageError('--stage and --no-stage cannot be combined');
  }

  return options;
}

function parseConfirmPlanArgs(args) {
  const options = {
    stateDir: '.symphony',
    stageDocsDir: DEFAULT_STAGE_DOCS_DIR,
    json: false
  };

  for (let index = 0; index < args.length; index += 1) {
    const value = args[index];

    if (value === '--json') {
      options.json = true;
      continue;
    }

    if (value === '--state-dir') {
      options.stateDir = readRequiredValue(args, index, '--state-dir');
      index += 1;
      continue;
    }

    if (value === '--stage-docs-dir') {
      options.stageDocsDir = readRequiredValue(args, index, '--stage-docs-dir');
      index += 1;
      continue;
    }

    if (value === '--stage') {
      options.stageId = readRequiredValue(args, index, '--stage');
      assertSafePathSegment(options.stageId, 'stage id');
      index += 1;
      continue;
    }

    if (value === '--no-stage') {
      options.noStage = true;
      continue;
    }

    if (value === '--confirm-plan') {
      if (options.planId !== undefined) {
        throw new UsageError('--confirm-plan accepts one plan id');
      }

      options.planId = readRequiredValue(args, index, '--confirm-plan');
      assertSafePathSegment(options.planId, 'plan id');
      index += 1;
      continue;
    }

    if (value.startsWith('--')) {
      throw new UsageError(`unknown confirm option: ${value}`);
    }

    throw new UsageError(`unexpected confirm argument: ${value}`);
  }

  if (options.planId === undefined) {
    throw new UsageError('--confirm-plan requires a plan id');
  }

  if (options.noStage && options.stageId !== undefined) {
    throw new UsageError('--stage and --no-stage cannot be combined');
  }

  return options;
}

function parseStateReaderArgs(args) {
  const options = {
    stateDir: '.symphony',
    json: false
  };

  for (let index = 0; index < args.length; index += 1) {
    const value = args[index];

    if (value === '--json') {
      options.json = true;
      continue;
    }

    if (value === '--state-dir') {
      options.stateDir = readRequiredValue(args, index, '--state-dir');
      index += 1;
      continue;
    }

    if (value.startsWith('--')) {
      throw new UsageError(`unknown state option: ${value}`);
    }

    throw new UsageError(`unexpected state argument: ${value}`);
  }

  return options;
}

function parseArtifactsArgs(args) {
  const options = {
    stateDir: '.symphony',
    json: false
  };
  const positional = [];

  for (let index = 0; index < args.length; index += 1) {
    const value = args[index];

    if (value === '--json') {
      options.json = true;
      continue;
    }

    if (value === '--state-dir') {
      options.stateDir = readRequiredValue(args, index, '--state-dir');
      index += 1;
      continue;
    }

    if (value.startsWith('--')) {
      throw new UsageError(`unknown artifacts option: ${value}`);
    }

    positional.push(value);
  }

  if (positional.length > 1) {
    throw new UsageError('artifacts accepts at most one run id');
  }

  return {
    ...options,
    runId: positional[0]
  };
}

function parseConsoleArgs(args) {
  const options = {
    stateDir: '.symphony',
    host: '127.0.0.1',
    port: 8765,
    snapshot: false,
    json: false
  };

  for (let index = 0; index < args.length; index += 1) {
    const value = args[index];

    if (value === '--json') {
      options.json = true;
      continue;
    }

    if (value === '--snapshot') {
      options.snapshot = true;
      continue;
    }

    if (value === '--state-dir') {
      options.stateDir = readRequiredValue(args, index, '--state-dir');
      index += 1;
      continue;
    }

    if (value === '--host') {
      options.host = readRequiredValue(args, index, '--host');
      index += 1;
      continue;
    }

    if (value === '--port') {
      options.port = toPortInteger(readRequiredValue(args, index, '--port'), '--port');
      index += 1;
      continue;
    }

    if (value.startsWith('--')) {
      throw new UsageError(`unknown console option: ${value}`);
    }

    throw new UsageError(`unexpected console argument: ${value}`);
  }

  return options;
}

function parseDiagnoseArgs(args) {
  const options = {
    stateDir: '.symphony',
    json: false,
    html: false
  };

  for (let index = 0; index < args.length; index += 1) {
    const value = args[index];

    if (value === '--json') {
      options.json = true;
      continue;
    }

    if (value === '--html') {
      options.html = true;
      continue;
    }

    if (value === '--state-dir') {
      options.stateDir = readRequiredValue(args, index, '--state-dir');
      index += 1;
      continue;
    }

    if (value.startsWith('--')) {
      throw new UsageError(`unknown diagnose option: ${value}`);
    }

    throw new UsageError(`unexpected diagnose argument: ${value}`);
  }

  if (options.json && options.html) {
    throw new UsageError('diagnose accepts only one output format: --json or --html');
  }

  return options;
}

function parseStageArgs(args) {
  const options = {
    stateDir: '.symphony',
    stageDocsDir: DEFAULT_STAGE_DOCS_DIR,
    subcommand: 'current',
    json: false,
    write: false,
    help: false
  };
  const positional = [];

  for (let index = 0; index < args.length; index += 1) {
    const value = args[index];

    if (value === '--help') {
      options.help = true;
      continue;
    }

    if (value === '--json') {
      options.json = true;
      continue;
    }

    if (value === '--write') {
      options.write = true;
      continue;
    }

    if (value === '--state-dir') {
      options.stateDir = readRequiredValue(args, index, '--state-dir');
      index += 1;
      continue;
    }

    if (value === '--stage-docs-dir') {
      options.stageDocsDir = readRequiredValue(args, index, '--stage-docs-dir');
      index += 1;
      continue;
    }

    if (value.startsWith('--')) {
      throw new UsageError(`unknown stage option: ${value}`);
    }

    positional.push(value);
  }

  if (positional.length > 0) {
    options.subcommand = positional[0];
  }

  if (!['current', 'create', 'activate', 'render', 'summary'].includes(options.subcommand)) {
    throw new UsageError('stage command must be one of: create, activate, render, summary');
  }

  if (options.help) {
    return options;
  }

  if (options.subcommand === 'activate' || options.subcommand === 'render') {
    if (positional.length !== 2) {
      throw new UsageError(`stage ${options.subcommand} requires one stage id`);
    }
    options.stageId = positional[1];
    assertSafePathSegment(options.stageId, 'stage id');
  } else if (options.subcommand === 'create') {
    if (positional.length > 2) {
      throw new UsageError('stage create accepts at most one stage id');
    }
    options.stageId = positional[1] ?? 'v14-stage-kernel-refactor';
    assertSafePathSegment(options.stageId, 'stage id');
  } else {
    if (positional.length > 2) {
      throw new UsageError(`stage ${options.subcommand} accepts at most one stage id`);
    }
    options.stageId = positional[1];
    if (options.stageId !== undefined) {
      assertSafePathSegment(options.stageId, 'stage id');
    }
  }

  if (options.write && !['create', 'render'].includes(options.subcommand)) {
    throw new UsageError('--write is only supported for stage create and stage render');
  }

  return options;
}

function parseNextArgs(args) {
  const options = {
    stateDir: '.symphony',
    stageDocsDir: DEFAULT_STAGE_DOCS_DIR,
    json: false
  };

  for (let index = 0; index < args.length; index += 1) {
    const value = args[index];

    if (value === '--json') {
      options.json = true;
      continue;
    }

    if (value === '--state-dir') {
      options.stateDir = readRequiredValue(args, index, '--state-dir');
      index += 1;
      continue;
    }

    if (value === '--stage-docs-dir') {
      options.stageDocsDir = readRequiredValue(args, index, '--stage-docs-dir');
      index += 1;
      continue;
    }

    if (value.startsWith('--')) {
      throw new UsageError(`unknown next option: ${value}`);
    }

    throw new UsageError(`unexpected next argument: ${value}`);
  }

  return options;
}

function parseAdoptArgs(args) {
  const options = {
    stateDir: '.symphony',
    stageDocsDir: DEFAULT_STAGE_DOCS_DIR,
    json: false
  };

  for (let index = 0; index < args.length; index += 1) {
    const value = args[index];

    if (value === '--json') {
      options.json = true;
      continue;
    }

    if (value === '--state-dir') {
      options.stateDir = readRequiredValue(args, index, '--state-dir');
      index += 1;
      continue;
    }

    if (value === '--stage-docs-dir') {
      options.stageDocsDir = readRequiredValue(args, index, '--stage-docs-dir');
      index += 1;
      continue;
    }

    if (value === '--run') {
      if (options.mode !== undefined) {
        throw new UsageError('symphony adopt accepts exactly one mode: --run, --confirm, or --inspect');
      }

      options.mode = 'plan';
      options.sourceRunId = readRequiredValue(args, index, '--run');
      assertSafePathSegment(options.sourceRunId, 'source run id');
      index += 1;
      continue;
    }

    if (value === '--confirm') {
      if (options.mode !== undefined) {
        throw new UsageError('symphony adopt accepts exactly one mode: --run, --confirm, or --inspect');
      }

      options.mode = 'confirm';
      options.adoptionId = readRequiredValue(args, index, '--confirm');
      assertSafePathSegment(options.adoptionId, 'adoption id');
      index += 1;
      continue;
    }

    if (value === '--inspect') {
      if (options.mode !== undefined) {
        throw new UsageError('symphony adopt accepts exactly one mode: --run, --confirm, or --inspect');
      }

      options.mode = 'inspect';
      options.adoptionId = readRequiredValue(args, index, '--inspect');
      assertSafePathSegment(options.adoptionId, 'adoption id');
      index += 1;
      continue;
    }

    if (value.startsWith('--')) {
      throw new UsageError(`unknown adopt option: ${value}`);
    }

    throw new UsageError(`unexpected adopt argument: ${value}`);
  }

  if (options.mode === undefined) {
    throw new UsageError('symphony adopt requires --run <run-id>, --confirm <adoption-id>, or --inspect <adoption-id>');
  }

  if (options.mode === 'inspect' && options.json !== true) {
    throw new UsageError('symphony adopt --inspect requires --json');
  }

  return options;
}

function parseNewProjectArgs(args, { promptTarget, promptTemplate } = {}) {
  const options = {
    targetDir: promptTarget,
    template: promptTemplate ?? 'empty',
    templateOverride: false,
    runtimeDir: 'tmp/symphony-new',
    stateDir: '.symphony',
    stageDocsDir: DEFAULT_STAGE_DOCS_DIR,
    write: false,
    json: false
  };
  const positional = [];

  for (let index = 0; index < args.length; index += 1) {
    const value = args[index];

    if (value === '--json') {
      options.json = true;
      continue;
    }

    if (value === '--dry-run') {
      options.write = false;
      continue;
    }

    if (value === '--write') {
      options.write = true;
      continue;
    }

    if (value === '--template') {
      options.template = normalizeTemplate(readRequiredValue(args, index, '--template'));
      options.templateOverride = true;
      index += 1;
      continue;
    }

    if (value === '--runtime-dir') {
      options.runtimeDir = readRequiredValue(args, index, '--runtime-dir');
      index += 1;
      continue;
    }

    if (value === '--target') {
      options.targetDir = readRequiredValue(args, index, '--target');
      index += 1;
      continue;
    }

    if (value === '--state-dir') {
      options.stateDir = readRequiredValue(args, index, '--state-dir');
      index += 1;
      continue;
    }

    if (value === '--stage-docs-dir') {
      options.stageDocsDir = readRequiredValue(args, index, '--stage-docs-dir');
      index += 1;
      continue;
    }

    if (value === '--stage') {
      options.stageId = readRequiredValue(args, index, '--stage');
      assertSafePathSegment(options.stageId, 'stage id');
      index += 1;
      continue;
    }

    if (value === '--no-stage') {
      options.noStage = true;
      continue;
    }

    if (value.startsWith('--')) {
      throw new UsageError(`unknown new option: ${value}`);
    }

    positional.push(value);
  }

  if (positional.length > 1) {
    throw new UsageError('new accepts one target directory');
  }

  options.targetDir = positional[0] ?? options.targetDir;
  options.template = normalizeTemplate(options.template);
  assertNonEmptyString(options.targetDir, 'new target');

  if (options.noStage && options.stageId !== undefined) {
    throw new UsageError('--stage and --no-stage cannot be combined');
  }

  return options;
}

function initialProviderForScanMode(providerMode) {
  return providerMode === 'builtin' ? 'builtin' : 'grill-me-docs';
}

function buildProviderAttempt({ provider, intake }) {
  return {
    provider,
    runId: intake.runId,
    status: intake.summary?.providerStatus ?? intake.kernelOutput?.providerStatus ?? 'failed',
    exitCode: intake.exitCode
  };
}

function parsePromptInvocation(argv) {
  if (argv.length === 0 || KNOWN_COMMANDS.has(argv[0])) {
    return null;
  }

  const args = [];
  const promptParts = [];
  const valueOptions = new Set([
    '--real',
    '--state-dir',
    '--stage',
    '--stage-docs-dir',
    '--template',
    '--runtime-dir',
    '--target',
    '--work-dir',
    '--project-dir',
    '--output-dir',
    '--provider',
    '--provider-command',
    '--fail-on',
    '--timeout-ms',
    '--confirm-plan',
    '--host',
    '--port'
  ]);
  const flagOptions = new Set(['--json', '--dry-run', '--write', '--confirm-destructive', '--snapshot', '--no-stage']);

  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];

    if (flagOptions.has(value)) {
      args.push(value);
      continue;
    }

    if (valueOptions.has(value)) {
      args.push(value, readRequiredValue(argv, index, value));
      index += 1;
      continue;
    }

    if (value.startsWith('--')) {
      args.push(value);
      continue;
    }

    promptParts.push(value);
  }

  const prompt = promptParts.join(' ').trim();

  if (prompt === '') {
    return null;
  }

  return {
    prompt,
    args
  };
}

async function writeProductRunState({ stateDir, summary, updatedAt }) {
  const createdAt = summary.createdAt ?? updatedAt;
  const runState = {
    version: '1',
    kind: 'symphony-run-state',
    runId: summary.runId,
    command: summary.command,
    intent: summary.intent,
    semanticCommand: summary.semanticCommand,
    pipeline: summary.pipeline,
    routeDecision: summary.routeDecision,
    matchedSignals: summary.matchedSignals,
    safetyMode: summary.safetyMode,
    projectWrites: summary.projectWrites,
    mainWorktreeWrites: summary.mainWorktreeWrites,
    workspaceWrites: summary.workspaceWrites,
    runtimeWrites: summary.runtimeWrites,
    externalCalls: summary.externalCalls,
    destructiveWrites: summary.destructiveWrites,
    writeBoundary: summary.writeBoundary,
    executionPlanId: summary.executionPlanId,
    executionPlanArtifactPath: summary.executionPlanArtifactPath,
    plannedRunId: summary.plannedRunId,
    plannedAdoptionRunId: summary.plannedAdoptionRunId,
    adoptionPlanId: summary.adoptionPlanId,
    adoptionPlanArtifactPath: summary.adoptionPlanArtifactPath,
    sourceRunId: summary.sourceRunId,
    sourceRunArtifactPath: summary.sourceRunArtifactPath,
    sourceWorkspacePath: summary.sourceWorkspacePath,
    sourceWorkspaceManifestPath: summary.sourceWorkspaceManifestPath,
    sourceWorkspaceFingerprint: summary.sourceWorkspaceFingerprint,
    sourceEvidenceArtifactPath: summary.sourceEvidenceArtifactPath,
    sourceVerifierStatus: summary.sourceVerifierStatus,
    patchArtifactPath: summary.patchArtifactPath,
    patchHash: summary.patchHash,
    adoptionJournalArtifactPath: summary.adoptionJournalArtifactPath,
    fileOperations: summary.fileOperations,
    unsupportedChanges: summary.unsupportedChanges,
    failurePhase: summary.failurePhase,
    failureMessage: summary.failureMessage,
    gitHead: summary.gitHead,
    gitStatusFingerprint: summary.gitStatusFingerprint,
    confirmationCommand: summary.confirmationCommand,
    requiresGate: summary.requiresGate,
    stageBinding: summary.stageBinding,
    stageSummary: summary.stageSummary,
    stageGate: summary.stageGate,
    stageAdoptionSummary: summary.stageAdoptionSummary,
    blocker: summary.blocker,
    stageCharterArtifactPath: summary.stageCharterArtifactPath,
    stageCharterHtmlArtifactPath: summary.stageCharterHtmlArtifactPath,
    stageGateEventArtifactPath: summary.stageGateEventArtifactPath,
    charterRepairPlanArtifactPath: summary.charterRepairPlanArtifactPath,
    blockedSnapshotArtifactPath: summary.blockedSnapshotArtifactPath,
    workflowMode: summary.workflowMode,
    adapter: summary.adapter,
    executionMode: summary.executionMode,
    projectRoot: summary.projectRoot,
    projectFingerprint: summary.projectFingerprint,
    contextReused: summary.contextReused,
    recommendedWorkflow: summary.recommendedWorkflow,
    verificationCommands: summary.verificationCommands,
    riskCounts: summary.riskCounts,
    openQuestionCount: summary.openQuestionCount,
    contextArtifactPath: summary.contextArtifactPath,
    summaryArtifactPath: summary.summaryArtifactPath,
    evidenceArtifactPath: summary.evidenceArtifactPath,
    harnessOutputPath: summary.harnessOutputPath,
    taskPacketPath: summary.taskPacketPath,
    proofArtifactPath: summary.proofArtifactPath,
    scaffoldPlanArtifactPath: summary.scaffoldPlanArtifactPath,
    scaffoldManifestArtifactPath: summary.scaffoldManifestArtifactPath,
    scaffoldPlan: summary.scaffoldPlan,
    projectKind: summary.projectKind,
    detectedStack: summary.detectedStack,
    networkInstall: summary.networkInstall,
    unsupportedRequests: summary.unsupportedRequests,
    template: summary.template,
    targetDir: summary.targetDir,
    changedFiles: summary.changedFiles,
    createdFiles: summary.createdFiles,
    providerMode: summary.providerMode,
    provider: summary.provider,
    providerStatus: summary.providerStatus,
    providerAttempts: summary.providerAttempts,
    providerFallback: summary.providerFallback,
    modelInvocation: summary.modelInvocation,
    verifierStatus: summary.verifierStatus,
    status: summary.status,
    createdAt,
    updatedAt,
    nextAction: summary.nextAction
  };

  const contractedRunState = withProductJsonContract(runState, {
    contractName: 'symphony.run-state',
    generatedAt: updatedAt
  });

  return await writeRunState({
    stateDir,
    runState: contractedRunState
  });
}

function writeProductOutput(stdout, summary, json) {
  if (json) {
    writeJson(stdout, withProductJsonContract(summary));
    return;
  }

  stdout.write(`${humanProductSummary(summary)}\n`);
}

function writeStageStatusOutput(stdout, summary, json) {
  if (json) {
    const contracted = withProductJsonContract(summary, {
      contractName: 'symphony.stage-status'
    });

    writeJson(stdout, {
      ...contracted,
      contractVersion: '1.0',
      activeStage: summary.activeStage ?? null
    });
    return;
  }

  stdout.write(`${humanStageStatus(summary)}\n`);
}

function humanStageStatus(summary) {
  const activeStage = summary.activeStage ?? summary.stage;
  const lines = [
    `Stage: ${activeStage?.stageId ?? summary.stageId ?? 'none'}`,
    `Title: ${activeStage?.title ?? 'none'}`,
    `Status: ${summary.status ?? 'unknown'}`,
    `Goal: ${summary.goal ?? activeStage?.goal ?? 'none'}`,
    `Blocker: ${summary.blocker?.reason ?? 'none'}`,
    `Next: ${summary.nextAction ?? 'symphony stage summary'}`
  ];

  return lines.join('\n');
}

async function buildStageGateProjectState({
  projectDir,
  stateDir,
  ignoredPaths = [],
  runner
}) {
  const resolvedProjectDir = resolve(projectDir ?? '.');
  const normalizedIgnoredPaths = normalizeIgnoredPathList({
    projectRoot: resolvedProjectDir,
    paths: ignoredPaths
  });
  let projectFingerprint = null;
  let gitHead = null;
  let dirtyWorktreeHash = null;

  try {
    projectFingerprint = await buildProjectFingerprint({
      projectDir: resolvedProjectDir,
      ignoredPaths
    });
  } catch {
    projectFingerprint = null;
  }

  try {
    gitHead = await readGitHead({
      runner: runner ?? new NodeProcessRunner(),
      cwd: resolvedProjectDir
    });
  } catch {
    gitHead = null;
  }

  try {
    dirtyWorktreeHash = (await buildGitStatusFingerprint({
      runner: runner ?? new NodeProcessRunner(),
      cwd: resolvedProjectDir,
      ignoredPaths: normalizedIgnoredPaths
    })).fingerprint;
  } catch {
    dirtyWorktreeHash = null;
  }

  return {
    gitHead,
    projectFingerprint,
    dirtyWorktreeHash
  };
}

function buildProductStageGateAction({
  command,
  semanticCommand,
  options,
  highRisk
}) {
  return {
    kind: 'product-work',
    command,
    subcommand: semanticCommand,
    semanticCommand,
    prompt: options.prompt,
    targetId: semanticCommand,
    safetyMode: options.safetyMode,
    writeMode: options.safetyMode,
    riskMode: highRisk ? 'high' : 'standard',
    flags: {
      adapter: options.adapter,
      mode: options.mode,
      projectDir: options.projectDir,
      proofDir: options.proofDir,
      realRequested: options.realRequested,
      stageId: options.stageId,
      timeoutMs: options.timeoutMs,
      workDir: options.workDir,
      writeRequested: options.writeRequested
    }
  };
}

function buildConfirmPlanStageGateAction({ options, plan }) {
  return {
    kind: 'confirm-plan',
    command: 'do',
    subcommand: 'confirm-plan',
    planId: options.planId,
    targetId: options.planId,
    prompt: plan?.prompt,
    safetyMode: 'write',
    writeMode: 'write',
    riskMode: 'high',
    flags: {
      adapter: plan?.adapter,
      executionMode: plan?.executionMode,
      mode: plan?.workflowMode,
      planId: options.planId,
      stateDir: options.stateDir,
      workDir: plan?.workDir
    }
  };
}

function stageHelpText(subcommand = 'current') {
  const header = subcommand === 'current'
    ? 'Usage: symphony stage [create|activate|render|summary] [stage-id] [options]'
    : `Usage: symphony stage ${subcommand} [stage-id] [options]`;

  return `${header}

Stage commands:
  symphony stage
  symphony stage --json
  symphony stage create [stage-id]
  symphony stage activate <stage-id>
  symphony stage render <stage-id> [--write]
  symphony stage summary [stage-id]

Options:
  --state-dir <dir>
  --stage-docs-dir <dir>
  --json
  --write
  --help
`;
}

function humanConsoleSnapshot(snapshot) {
  return [
    `Console snapshot: ${snapshot.status}`,
    `Runs: ${snapshot.runs.length}`,
    `Latest: ${snapshot.latestRun?.runId ?? 'none'}`,
    `Next: ${snapshot.action.next}`
  ].join('\n') + '\n';
}

function humanProductSummary(summary) {
  if (summary.command === 'symphony status' && summary.status === 'no-runs') {
    return [
      'Status: no runs yet',
      `Next: ${summary.nextAction}`
    ].join('\n');
  }

  const lines = [
    `Intent: ${summary.intent}`,
    `Pipeline: ${summary.pipeline.join(' -> ')}`,
    `Safety: ${summary.safetyMode}`,
    `Project writes: ${summary.projectWrites ? 'yes' : 'no'}`,
    `Runtime writes: ${summary.runtimeWrites ? 'yes' : 'no'}`,
    `External calls: ${summary.externalCalls ? 'yes' : 'no'}`,
    `Status: ${summary.status}`
  ];

  if (summary.verifierStatus !== undefined) {
    lines.push(`Verifier: ${summary.verifierStatus}`);
  }

  if (summary.runId !== undefined || summary.latestRunId !== undefined) {
    lines.push(`Run: ${summary.runId ?? summary.latestRunId}`);
  }

  for (const [label, field] of [
    ['Context', 'contextArtifactPath'],
    ['Summary', 'summaryArtifactPath'],
    ['Evidence', 'evidenceArtifactPath'],
    ['Harness', 'harnessOutputPath'],
    ['TaskPacket', 'taskPacketPath'],
    ['Execution plan', 'executionPlanArtifactPath'],
    ['Adoption plan', 'adoptionPlanArtifactPath'],
    ['Patch', 'patchArtifactPath'],
    ['Journal', 'adoptionJournalArtifactPath'],
    ['Plan', 'scaffoldPlanArtifactPath'],
    ['Manifest', 'scaffoldManifestArtifactPath'],
    ['Proof', 'proofArtifactPath']
  ]) {
    if (summary[field] !== undefined) {
      lines.push(`${label}: ${summary[field]}`);
    }
  }

  if (summary.nextAction !== undefined) {
    lines.push(`Next: ${summary.nextAction}`);
  }

  return lines.join('\n');
}

function buildScanRunId({ projectDir, providerMode }) {
  const resolvedProjectDir = resolve(projectDir);

  return `symphony-scan-${safeIdPart(basenameFromPath(resolvedProjectDir))}-${shortHash([resolvedProjectDir, providerMode].join('\0'))}-${uniqueProductRunSuffix()}`;
}

function buildNewRunId({ targetDir, template }) {
  return `symphony-new-${safeIdPart(template)}-${shortHash([resolve(targetDir), template].join('\0'))}-${uniqueProductRunSuffix()}`;
}

function buildPromptNewTarget({ prompt, template }) {
  return join('tmp', 'symphony-new', `${safeIdPart(template)}-${shortHash(prompt)}`);
}

function buildProductWorkRunId({ prompt, mode, adapter, semanticCommand }) {
  return `${buildWorkRunId({ prompt, mode, adapter })}-${safeIdPart(semanticCommand)}-${uniqueProductRunSuffix()}`;
}

function buildExecutionPlanId({ prompt, mode, adapter }) {
  return `symphony-plan-${safeIdPart(mode)}-${shortHash([adapter, mode, prompt].join('\0'))}-${uniqueProductRunSuffix()}`;
}

function buildAdoptionPlanId({ sourceRunId, executionPlanId }) {
  return `symphony-adoption-${safeIdPart(sourceRunId)}-${shortHash([sourceRunId, executionPlanId].join('\0'))}-${uniqueProductRunSuffix()}`;
}

function buildAdoptionPlanningRunId(adoptionId) {
  return `${adoptionId}-planned`;
}

function buildAdoptionConfirmationRunId(plan) {
  return `symphony-adopt-confirm-${safeIdPart(plan.adoptionId)}-${uniqueProductRunSuffix()}`;
}

function buildConfirmationCommand({ planId, stateDir }) {
  const args = ['symphony', 'do', '--confirm-plan', planId];

  if (stateDir !== '.symphony') {
    args.push('--state-dir', stateDir);
  }

  return args.map(shellQuoteArgument).join(' ');
}

function buildAdoptionConfirmationCommand({ adoptionId, stateDir }) {
  const args = ['symphony', 'adopt', '--confirm', adoptionId];

  if (stateDir !== '.symphony') {
    args.push('--state-dir', stateDir);
  }

  return args.map(shellQuoteArgument).join(' ');
}

function throwStageGateBlocked(stageGate, command) {
  throw new UsageError(
    `Stage Charter consistency gate blocked ${command}; repair artifact: ${stageGate.repairArtifactPath}`
  );
}

function shellQuoteArgument(value) {
  const text = String(value);

  if (/^[0-9A-Za-z_./:=@+-]+$/u.test(text)) {
    return text;
  }

  return `'${text.replaceAll("'", "'\\''")}'`;
}

function buildExecutionPlanRouteDecision({
  routeDecision,
  adapter,
  pipeline,
  requiresGate
}) {
  return {
    version: '1',
    intent: 'work',
    confidence: routeDecision?.confidence ?? 'explicit',
    matchedSignals: routeDecision?.matchedSignals ?? ['--write'],
    safetyMode: 'write',
    adapter,
    pipeline,
    requiresGate,
    requiresConfirmation: true,
    reason: 'Explicit --write requested; generated a controlled execution plan.'
  };
}

function buildConfirmedPlanRunId(plan) {
  return `${buildWorkRunId({
    prompt: plan.prompt,
    mode: plan.workflowMode,
    adapter: plan.adapter
  })}-confirmed-${shortHash(plan.planId)}-${uniqueProductRunSuffix()}`;
}

function uniqueProductRunSuffix() {
  productRunSequence += 1;
  return `${Date.now().toString(36)}-${process.pid.toString(36)}-${productRunSequence.toString(36)}`;
}

function assertProductRealGate(adapter, env) {
  const gate = REAL_WORK_GATES[adapter];

  if (gate === undefined) {
    throw new UsageError('adapter must be one of: codex, claude, claude-code, kiro, kiro-cli');
  }

  if (env?.[gate] !== '1') {
    throw new UsageError(`Set ${gate}=1 to invoke the real ${adapter} CLI lane.`);
  }
}

function assertExecutionPlan(plan, expectedPlanId) {
  if (plan === null || typeof plan !== 'object' || Array.isArray(plan)) {
    throw new UsageError('execution plan must be an object');
  }

  if (plan.kind !== 'symphony.execution-plan'
    || plan.contractName !== 'symphony.execution-plan'
    || plan.contractVersion !== '1') {
    throw new UsageError('execution plan has an unsupported contract');
  }

  if (plan.planId !== expectedPlanId) {
    throw new UsageError('execution plan id does not match requested plan');
  }

  for (const field of [
    'command',
    'prompt',
    'projectRoot',
    'projectFingerprint',
    'contextArtifactPath',
    'summaryArtifactPath',
    'workflowMode',
    'adapter',
    'executionMode',
    'workDir',
    'confirmationCommand',
    'createdAt'
  ]) {
    assertNonEmptyString(plan[field], `execution plan ${field}`);
  }

  if (plan.writeBoundary !== 'isolated-workspace' || plan.mainWorktreeWrites !== false) {
    throw new UsageError('execution plan write boundary is unsupported');
  }

  if (!['dry-run', 'real'].includes(plan.executionMode)) {
    throw new UsageError('execution plan executionMode must be dry-run or real');
  }

  const adapter = normalizeWorkAdapter(plan.adapter);
  assertWorkMode(plan.workflowMode);

  if (plan.command !== 'symphony do'
    || plan.intent !== 'work'
    || plan.semanticCommand !== 'do'
    || plan.safetyMode !== 'write') {
    throw new UsageError('execution plan command semantics are unsupported');
  }

  assertExactStringArray(plan.pipeline, ['scan-if-needed', 'do'], 'execution plan pipeline');

  if (plan.projectWrites !== true
    || plan.mainWorktreeWrites !== false
    || plan.workspaceWrites !== true
    || plan.runtimeWrites !== true
    || plan.destructiveWrites !== false) {
    throw new UsageError('execution plan write invariants are unsupported');
  }

  const expectedExternalCalls = plan.executionMode === 'real';
  const expectedRequiresGate = expectedExternalCalls ? REAL_WORK_GATES[adapter] : null;

  if (plan.externalCalls !== expectedExternalCalls || plan.requiresGate !== expectedRequiresGate) {
    throw new UsageError('execution plan real-agent gate invariants are unsupported');
  }

  assertExecutionPlanRouteDecision(plan.routeDecision, {
    adapter,
    expectedRequiresGate
  });
}

function assertExecutionPlanRouteDecision(routeDecision, { adapter, expectedRequiresGate }) {
  if (routeDecision === null || typeof routeDecision !== 'object' || Array.isArray(routeDecision)) {
    throw new UsageError('execution plan route decision must be an object');
  }

  if (routeDecision.intent !== 'work'
    || routeDecision.safetyMode !== 'write'
    || normalizeWorkAdapter(routeDecision.adapter) !== adapter
    || routeDecision.requiresGate !== expectedRequiresGate
    || routeDecision.requiresConfirmation !== true) {
    throw new UsageError('execution plan route decision invariants are unsupported');
  }

  assertExactStringArray(routeDecision.pipeline, ['scan-if-needed', 'do'], 'execution plan route pipeline');
}

class AdoptionUnsupportedChangesError extends Error {
  constructor(message, unsupportedChanges) {
    super(message);
    this.name = 'AdoptionUnsupportedChangesError';
    this.unsupportedChanges = unsupportedChanges;
  }
}

async function loadAndValidateAdoptionSource({ stateDir, sourceRunId }) {
  const sourceRun = await readRunState({
    stateDir,
    runId: sourceRunId
  });

  if (sourceRun === null) {
    throw new UsageError(`source run not found: ${sourceRunId}`);
  }

  if (sourceRun.status === 'planned' || sourceRun.verifierStatus === 'not-run') {
    throw new UsageError('source run is not a confirmed v11 run');
  }

  if (sourceRun.status !== 'passed' || sourceRun.verifierStatus !== 'passed') {
    throw new UsageError('source run must have status=passed and verifierStatus=passed');
  }

  if (sourceRun.command !== 'symphony do'
    || sourceRun.semanticCommand !== 'do'
    || sourceRun.safetyMode !== 'write'
    || !isNonEmptyString(sourceRun.plannedRunId)
    || !isNonEmptyString(sourceRun.executionPlanId)) {
    throw new UsageError('source run is not a confirmed v11 run');
  }

  if (sourceRun.writeBoundary !== 'isolated-workspace'
    || sourceRun.mainWorktreeWrites !== false
    || sourceRun.workspaceWrites !== true) {
    throw new UsageError('source run write boundary is unsupported for adoption');
  }

  if (!isNonEmptyString(sourceRun.evidenceArtifactPath)) {
    throw new UsageError('source run is missing verifier evidence');
  }

  const executionPlan = await readExecutionPlan({
    stateDir,
    planId: sourceRun.executionPlanId
  });

  if (executionPlan === null) {
    throw new UsageError('source run execution plan is missing');
  }

  assertExecutionPlan(executionPlan, sourceRun.executionPlanId);

  if (sourceRun.plannedRunId !== executionPlan.planId) {
    throw new UsageError('source run does not reference its frozen v11 execution plan');
  }

  const workspaceRefs = await resolveSourceWorkspaceRefs({
    sourceRun,
    projectRoot: executionPlan.projectRoot,
    workDir: executionPlan.workDir
  });

  return {
    sourceRun,
    sourceRunArtifactPath: symphonyStatePaths({ stateDir, runId: sourceRun.runId }).runPath,
    executionPlan,
    executionPlanArtifactPath: symphonyStatePaths({ stateDir, planId: executionPlan.planId }).executionPlanPath,
    projectRoot: executionPlan.projectRoot,
    ...workspaceRefs
  };
}

async function resolveSourceWorkspaceRefs({ sourceRun, projectRoot, workDir }) {
  let sourceWorkspacePath = sourceRun.sourceWorkspacePath;
  let sourceWorkspaceManifestPath = sourceRun.sourceWorkspaceManifestPath;

  if (!isNonEmptyString(sourceWorkspacePath) || !isNonEmptyString(sourceWorkspaceManifestPath)) {
    const workspaceManifestRef = Array.isArray(sourceRun.artifactRefs)
      ? sourceRun.artifactRefs.find((artifact) => artifact.kind === 'workspace-manifest' && isNonEmptyString(artifact.path))
      : undefined;

    if (workspaceManifestRef !== undefined) {
      sourceWorkspaceManifestPath = workspaceManifestRef.path;
      const manifest = await readJsonArtifact(sourceWorkspaceManifestPath, 'source workspace manifest');
      sourceWorkspacePath = manifest.path;
    }
  }

  if (!isNonEmptyString(sourceWorkspacePath) || !isNonEmptyString(sourceWorkspaceManifestPath)) {
    throw new UsageError('source-run-missing-workspace-ref');
  }

  const resolvedWorkspacePath = resolve(projectRoot, sourceWorkspacePath);
  const resolvedManifestPath = resolve(projectRoot, sourceWorkspaceManifestPath);
  const resolvedWorkDir = resolve(projectRoot, workDir);

  assertPathInside({
    root: resolvedWorkDir,
    target: resolvedWorkspacePath,
    message: 'source workspace is outside the managed v11 work directory'
  });
  assertPathInside({
    root: resolvedWorkspacePath,
    target: resolvedManifestPath,
    message: 'source workspace manifest is outside the source workspace'
  });

  const [workspaceStat, manifest] = await Promise.all([
    lstat(resolvedWorkspacePath),
    readJsonArtifact(resolvedManifestPath, 'source workspace manifest')
  ]);

  if (!workspaceStat.isDirectory()) {
    throw new UsageError('source workspace is not a directory');
  }

  if (manifest.path !== undefined && resolve(projectRoot, manifest.path) !== resolvedWorkspacePath) {
    throw new UsageError('source workspace manifest path does not match source run state');
  }

  return {
    sourceWorkspacePath: resolvedWorkspacePath,
    sourceWorkspaceManifestPath: resolvedManifestPath
  };
}

async function buildAdoptionPatchCandidate({
  projectRoot,
  sourceRun,
  sourceWorkspacePath,
  evidenceArtifactPath,
  ignoredRoots
}) {
  const evidence = await readJsonArtifact(evidenceArtifactPath, 'source evidence');
  const evidenceChangedFiles = normalizeChangedFiles(evidence.changedFiles, 'evidence changedFiles');
  const runChangedFiles = normalizeChangedFiles(sourceRun.changedFiles ?? [], 'source run changedFiles');

  assertSameStringSet({
    left: evidenceChangedFiles,
    right: runChangedFiles,
    message: 'source evidence changedFiles do not match source run changedFiles'
  });

  const workspaceDiff = await collectWorkspaceDiff({
    projectRoot,
    sourceWorkspacePath,
    ignoredRoots
  });

  if (workspaceDiff.unsupportedChanges.length > 0) {
    throw new AdoptionUnsupportedChangesError(
      'source workspace contains unsupported adoption changes',
      workspaceDiff.unsupportedChanges
    );
  }

  assertSameStringSet({
    left: evidenceChangedFiles,
    right: workspaceDiff.changedFiles,
    message: 'source evidence changedFiles do not match the actual source workspace diff'
  });

  if (workspaceDiff.operations.length === 0) {
    throw new AdoptionUnsupportedChangesError('source workspace contains no supported text changes', [{
      path: null,
      reason: 'empty-diff'
    }]);
  }

  const operations = workspaceDiff.operations.sort((left, right) => left.path.localeCompare(right.path));
  const sourceWorkspaceFingerprint = fingerprintFileOperations(operations.map(publicFileOperation));
  const patch = buildUnifiedPatch(operations);

  return {
    operations,
    patch,
    sourceWorkspaceFingerprint
  };
}

async function collectWorkspaceDiff({ projectRoot, sourceWorkspacePath, ignoredRoots }) {
  const sourceFiles = await listWorkspaceFiles(sourceWorkspacePath);
  const operations = [];
  const unsupportedChanges = [];

  for (const sourceFile of sourceFiles) {
    let relativePath;

    try {
      relativePath = normalizeAdoptionRelativePath(sourceFile);
      assertAdoptionPathAllowed(relativePath, ignoredRoots);
    } catch (error) {
      unsupportedChanges.push({
        path: sourceFile,
        reason: error.message
      });
      continue;
    }

    const sourcePath = resolve(sourceWorkspacePath, relativePath);
    const targetPath = resolve(projectRoot, relativePath);
    let sourceMetadata;

    try {
      sourceMetadata = await lstat(sourcePath);
    } catch (error) {
      unsupportedChanges.push({
        path: relativePath,
        reason: `source file is missing: ${error.message}`
      });
      continue;
    }

    if (sourceMetadata.isSymbolicLink()) {
      unsupportedChanges.push({
        path: relativePath,
        reason: 'symlink'
      });
      continue;
    }

    if (!sourceMetadata.isFile()) {
      unsupportedChanges.push({
        path: relativePath,
        reason: 'not-a-regular-file'
      });
      continue;
    }

    let targetMetadata;

    try {
      targetMetadata = await lstat(targetPath);
    } catch (error) {
      if (error.code !== 'ENOENT') {
        throw error;
      }
    }

    if (targetMetadata?.isSymbolicLink()) {
      unsupportedChanges.push({
        path: relativePath,
        reason: 'target-symlink'
      });
      continue;
    }

    if (targetMetadata !== undefined && !targetMetadata.isFile()) {
      unsupportedChanges.push({
        path: relativePath,
        reason: 'target-not-a-regular-file'
      });
      continue;
    }

    const [afterBuffer, beforeBuffer] = await Promise.all([
      readFile(sourcePath),
      targetMetadata === undefined ? null : readFile(targetPath)
    ]);

    let afterText;
    let beforeText;

    try {
      afterText = decodeUtf8Text(afterBuffer, relativePath);
      beforeText = beforeBuffer === null ? null : decodeUtf8Text(beforeBuffer, relativePath);
    } catch (error) {
      unsupportedChanges.push({
        path: relativePath,
        reason: error.message
      });
      continue;
    }

    const beforeHash = beforeBuffer === null ? null : sha256Buffer(beforeBuffer);
    const afterHash = sha256Buffer(afterBuffer);
    const operation = beforeBuffer === null ? 'add' : 'modify';

    if (operation === 'modify' && beforeHash === afterHash) {
      if ((targetMetadata.mode & 0o111) !== (sourceMetadata.mode & 0o111)) {
        unsupportedChanges.push({
          path: relativePath,
          reason: 'chmod-only'
        });
      }
      continue;
    }

    if (operation === 'modify' && (targetMetadata.mode & 0o111) !== (sourceMetadata.mode & 0o111)) {
      unsupportedChanges.push({
        path: relativePath,
        reason: 'chmod-change'
      });
      continue;
    }

    operations.push({
      path: relativePath,
      operation,
      beforeHash,
      afterHash,
      size: afterBuffer.length,
      textEncoding: 'utf8',
      beforeText,
      afterText
    });
  }

  return {
    operations,
    unsupportedChanges,
    changedFiles: operations.map((operation) => operation.path).sort()
  };
}

async function listWorkspaceFiles(root) {
  const files = [];

  async function visit(directory, relativeDirectory = '') {
    const entries = await readdir(directory, { withFileTypes: true });

    for (const entry of entries) {
      const relativePath = relativeDirectory === '' ? entry.name : `${relativeDirectory}/${entry.name}`;

      if (relativeDirectory === ''
        && ['workspace-manifest.json', 'workspace-lock.json', 'workspace-cleanup.json'].includes(entry.name)) {
        continue;
      }

      if (entry.isDirectory()) {
        await visit(join(directory, entry.name), relativePath);
        continue;
      }

      files.push(relativePath);
    }
  }

  await visit(root);
  return files.sort();
}

function buildUnifiedPatch(operations) {
  return operations.map((operation) => buildUnifiedPatchForOperation(operation)).join('');
}

function buildUnifiedPatchForOperation(operation) {
  const quotedA = quoteGitPatchPath(`a/${operation.path}`);
  const quotedB = quoteGitPatchPath(`b/${operation.path}`);
  const beforeLines = operation.beforeText === null ? [] : patchLineRecords(operation.beforeText);
  const afterLines = patchLineRecords(operation.afterText);
  const oldRange = patchRange({
    start: beforeLines.length === 0 ? 0 : 1,
    count: beforeLines.length
  });
  const newRange = patchRange({
    start: afterLines.length === 0 ? 0 : 1,
    count: afterLines.length
  });
  const lines = [
    `diff --git ${quotedA} ${quotedB}\n`
  ];

  if (operation.operation === 'add') {
    lines.push('new file mode 100644\n');
    lines.push('--- /dev/null\n');
  } else {
    lines.push(`--- ${quotedA}\n`);
  }

  lines.push(`+++ ${quotedB}\n`);
  lines.push(`@@ -${oldRange} +${newRange} @@\n`);

  for (const line of beforeLines) {
    lines.push(`-${line.text}\n`);
    if (!line.newline) {
      lines.push('\\ No newline at end of file\n');
    }
  }

  for (const line of afterLines) {
    lines.push(`+${line.text}\n`);
    if (!line.newline) {
      lines.push('\\ No newline at end of file\n');
    }
  }

  return lines.join('');
}

function patchRange({ start, count }) {
  return count === 1 ? String(start) : `${start},${count}`;
}

function patchLineRecords(text) {
  if (text === '') {
    return [];
  }

  const records = [];
  let offset = 0;

  while (offset < text.length) {
    const newlineIndex = text.indexOf('\n', offset);

    if (newlineIndex === -1) {
      records.push({
        text: text.slice(offset),
        newline: false
      });
      break;
    }

    records.push({
      text: text.slice(offset, newlineIndex),
      newline: true
    });
    offset = newlineIndex + 1;
  }

  return records;
}

function quoteGitPatchPath(path) {
  if (/^[A-Za-z0-9_./@:+-]+$/u.test(path)) {
    return path;
  }

  return `"${path
    .replaceAll('\\', '\\\\')
    .replaceAll('"', '\\"')
    .replaceAll('\n', '\\n')
    .replaceAll('\t', '\\t')}"`;
}

async function revalidateAdoptionPlanBeforeWrite({ plan, stateDir, runner }) {
  const currentProjectFingerprint = await buildProjectFingerprint({
    projectDir: plan.projectRoot,
    ignoredPaths: plan.projectFingerprintIgnoredPaths ?? [stateDir]
  });

  if (currentProjectFingerprint !== plan.projectFingerprint) {
    throw new UsageError('adoption plan is stale: project fingerprint changed');
  }

  const gitHead = await readGitHead({
    runner,
    cwd: plan.projectRoot
  });

  if (gitHead !== plan.gitHead) {
    throw new UsageError('adoption plan is stale: git HEAD changed');
  }

  const gitStatus = await buildGitStatusFingerprint({
    runner,
    cwd: plan.projectRoot,
    ignoredPaths: plan.gitStatusIgnoredPaths ?? [stateDir]
  });

  if (gitStatus.fingerprint !== plan.gitStatusFingerprint) {
    throw new UsageError('adoption plan is stale: dirty worktree fingerprint changed');
  }

  const source = await loadAndValidateAdoptionSource({
    stateDir,
    sourceRunId: plan.sourceRunId
  });

  if (source.executionPlan.planId !== plan.executionPlanId
    || source.sourceWorkspacePath !== plan.sourceWorkspacePath
    || source.sourceWorkspaceManifestPath !== plan.sourceWorkspaceManifestPath) {
    throw new UsageError('adoption plan source refs changed');
  }

  const patchCandidate = await buildAdoptionPatchCandidate({
    projectRoot: plan.projectRoot,
    sourceRun: source.sourceRun,
    sourceWorkspacePath: source.sourceWorkspacePath,
    evidenceArtifactPath: source.sourceRun.evidenceArtifactPath,
    ignoredRoots: buildAdoptionCandidateIgnoredRoots({
      projectRoot: plan.projectRoot,
      stateDir,
      workDir: source.executionPlan.workDir
    })
  });

  if (patchCandidate.sourceWorkspaceFingerprint !== plan.sourceWorkspaceFingerprint) {
    throw new UsageError('adoption plan is stale: source workspace fingerprint changed');
  }

  assertSameStringSet({
    left: patchCandidate.operations.map((operation) => operation.path),
    right: plan.changedFiles,
    message: 'adoption plan changedFiles no longer match source workspace'
  });

  const patch = await readFile(plan.patchArtifactPath);
  const patchHash = sha256Buffer(patch);

  if (patchHash !== plan.patchHash) {
    throw new UsageError('adoption patch artifact hash changed');
  }
}

async function buildAdoptionConfirmationEvidence({ plan, runner, generatedAt }) {
  const files = [];

  for (const operation of plan.fileOperations) {
    const path = normalizeAdoptionRelativePath(operation.path);
    const content = await readFile(resolve(plan.projectRoot, path));
    const hash = sha256Buffer(content);

    if (hash !== operation.afterHash) {
      throw new UsageError(`post-apply file hash mismatch: ${path}`);
    }

    files.push({
      path,
      operation: operation.operation,
      afterHash: hash,
      size: content.length,
      textEncoding: operation.textEncoding
    });
  }

  const gitStatus = await readGitStatusEntries({
    runner,
    cwd: plan.projectRoot,
    ignoredPaths: plan.gitStatusIgnoredPaths ?? []
  });
  const dirtyPaths = gitStatus.map((entry) => entry.path).sort();

  assertSameStringSet({
    left: dirtyPaths,
    right: plan.changedFiles,
    message: 'post-apply dirty worktree does not match planned changed files'
  });

  return {
    version: '1',
    kind: 'symphony.adoption-evidence',
    contractName: 'symphony.adoption-evidence',
    contractVersion: '1',
    adoptionPlanId: plan.adoptionId,
    sourceRunId: plan.sourceRunId,
    executionPlanId: plan.executionPlanId,
    patchArtifactPath: plan.patchArtifactPath,
    patchHash: plan.patchHash,
    changedFiles: [...plan.changedFiles],
    files,
    gitStatusFingerprintAfterApply: fingerprintGitStatusEntries(gitStatus),
    generatedAt
  };
}

async function buildAdoptionJournal({ plan, runId, createdAt }) {
  return {
    version: '1',
    kind: 'symphony.adoption-journal',
    contractName: 'symphony.adoption-journal',
    contractVersion: '1',
    adoptionPlanId: plan.adoptionId,
    confirmationRunId: runId,
    sourceRunId: plan.sourceRunId,
    executionPlanId: plan.executionPlanId,
    patchArtifactPath: plan.patchArtifactPath,
    patchHash: plan.patchHash,
    changedFiles: [...plan.changedFiles],
    fileOperations: structuredClone(plan.fileOperations),
    beforeFiles: await collectAdoptionBeforeFiles(plan),
    createdAt,
    status: 'applying'
  };
}

async function writeAdoptionJournalStatus({ journalPath, status, updatedAt }) {
  const journal = JSON.parse(await readFile(journalPath, 'utf8'));

  await writeFile(journalPath, `${JSON.stringify(redactSecrets({
    ...journal,
    status,
    updatedAt
  }), null, 2)}\n`, 'utf8');
}

async function collectAdoptionBeforeFiles(plan) {
  const beforeFiles = [];

  for (const operation of plan.fileOperations) {
    const path = normalizeAdoptionRelativePath(operation.path);
    const snapshot = await readWorktreeFileSnapshot({
      projectRoot: plan.projectRoot,
      path
    });

    if (operation.operation === 'modify' && snapshot.hash !== operation.beforeHash) {
      throw new UsageError(`pre-apply file hash mismatch: ${path}`);
    }

    if (operation.operation === 'add' && snapshot.exists) {
      throw new UsageError(`pre-apply add target already exists: ${path}`);
    }

    beforeFiles.push({
      path,
      exists: snapshot.exists,
      hash: snapshot.hash,
      size: snapshot.size,
      textEncoding: snapshot.textEncoding
    });
  }

  return beforeFiles;
}

async function readWorktreeFileSnapshot({ projectRoot, path }) {
  const filePath = resolve(projectRoot, path);
  assertPathInside({
    root: resolve(projectRoot),
    target: filePath,
    message: 'adoption path must stay inside the project'
  });

  let metadata;

  try {
    metadata = await lstat(filePath);
  } catch (error) {
    if (error.code === 'ENOENT') {
      return {
        path,
        exists: false,
        hash: null,
        size: 0,
        textEncoding: null
      };
    }

    throw error;
  }

  if (metadata.isSymbolicLink()) {
    throw new UsageError(`adoption file is a symlink: ${path}`);
  }

  if (!metadata.isFile()) {
    throw new UsageError(`adoption path is not a regular file: ${path}`);
  }

  const content = await readFile(filePath);

  decodeUtf8Text(content, path);

  return {
    path,
    exists: true,
    hash: sha256Buffer(content),
    size: content.length,
    textEncoding: 'utf8'
  };
}

async function writeFailedAdoptionPlanningRun({
  stateDir,
  source,
  runId,
  unsupportedChanges,
  now,
  stageBinding,
  stageGate,
  stageAdoptionSummary
}) {
  const summary = {
    version: '1',
    command: 'symphony adopt',
    intent: 'adopt',
    semanticCommand: 'adopt',
    pipeline: ['adopt-plan'],
    safetyMode: 'write',
    projectWrites: true,
    mainWorktreeWrites: false,
    workspaceWrites: false,
    runtimeWrites: true,
    externalCalls: false,
    destructiveWrites: false,
    status: 'failed',
    exitCode: EXIT_CODES.usage,
    verifierStatus: 'not-run',
    runId,
    sourceRunId: source.sourceRun.runId,
    executionPlanId: source.executionPlan.planId,
    adoptionPlanArtifactPath: null,
    unsupportedChanges,
    failurePhase: 'adoption-planning',
    stageBinding,
    stageGate,
    stageAdoptionSummary,
    writeBoundary: 'main-worktree',
    nextAction: 'symphony status'
  };

  await writeProductRunState({
    stateDir,
    summary,
    updatedAt: now
  });
}

async function writeFailedAdoptionConfirmationRun({
  stateDir,
  plan,
  runId,
  now,
  mainWorktreeWrites,
  failurePhase,
  message,
  journalPath,
  stageBinding,
  stageGate,
  stageAdoptionSummary
}) {
  const summary = buildAdoptionConfirmationSummary({
    plan,
    runId,
    evidencePath: undefined,
    journalPath,
    status: 'failed',
    exitCode: EXIT_CODES.usage,
    verifierStatus: 'failed',
    mainWorktreeWrites,
    failurePhase,
    message,
    stageBinding,
    stageGate,
    stageAdoptionSummary
  });

  await writeProductRunState({
    stateDir,
    summary,
    updatedAt: now
  });
}

async function writeFailedAdoptionConfirmationRunBestEffort(options) {
  try {
    await writeFailedAdoptionConfirmationRun(options);
  } catch {
    // The patch is already in the main worktree; preserving the original post-apply error matters most.
  }
}

function buildAdoptionConfirmationSummary({
  plan,
  runId,
  evidencePath,
  journalPath,
  status,
  exitCode,
  verifierStatus,
  mainWorktreeWrites,
  failurePhase,
  message,
  stageBinding,
  stageGate,
  stageAdoptionSummary
}) {
  return {
    version: '1',
    command: 'symphony adopt',
    intent: 'adopt',
    semanticCommand: 'adopt',
    pipeline: ['adopt-confirm'],
    safetyMode: 'write',
    projectWrites: true,
    mainWorktreeWrites,
    workspaceWrites: false,
    runtimeWrites: true,
    externalCalls: false,
    destructiveWrites: false,
    status,
    exitCode,
    verifierStatus,
    runId,
    adoptionPlanId: plan.adoptionId,
    adoptionPlanArtifactPath: symphonyStatePaths({
      stateDir: plan.stateDir,
      adoptionId: plan.adoptionId
    }).adoptionPlanPath,
    plannedAdoptionRunId: plan.plannedRunId,
    sourceRunId: plan.sourceRunId,
    sourceRunArtifactPath: plan.sourceRunArtifactPath,
    executionPlanId: plan.executionPlanId,
    executionPlanArtifactPath: plan.executionPlanArtifactPath,
    patchArtifactPath: plan.patchArtifactPath,
    patchHash: plan.patchHash,
    adoptionJournalArtifactPath: journalPath,
    changedFiles: [...plan.changedFiles],
    fileOperations: structuredClone(plan.fileOperations),
    evidenceArtifactPath: evidencePath,
    projectRoot: plan.projectRoot,
    projectFingerprint: plan.projectFingerprint,
    sourceWorkspacePath: plan.sourceWorkspacePath,
    sourceWorkspaceManifestPath: plan.sourceWorkspaceManifestPath,
    sourceWorkspaceFingerprint: plan.sourceWorkspaceFingerprint,
    sourceEvidenceArtifactPath: plan.sourceEvidenceArtifactPath,
    sourceVerifierStatus: plan.sourceVerifierStatus,
    gitHead: plan.gitHead,
    gitStatusFingerprint: plan.gitStatusFingerprint,
    stageBinding,
    stageGate,
    stageAdoptionSummary,
    writeBoundary: 'main-worktree',
    ...(failurePhase ? { failurePhase } : {}),
    ...(message ? { failureMessage: message } : {}),
    nextAction: 'symphony status'
  };
}

function assertAdoptionPlan(plan, expectedAdoptionId) {
  if (plan === null || typeof plan !== 'object' || Array.isArray(plan)) {
    throw new UsageError('adoption plan must be an object');
  }

  if (plan.kind !== 'symphony.adoption-plan'
    || plan.contractName !== 'symphony.adoption-plan'
    || plan.contractVersion !== '1') {
    throw new UsageError('adoption plan has an unsupported contract');
  }

  if (plan.adoptionId !== expectedAdoptionId) {
    throw new UsageError('adoption plan id does not match requested adoption');
  }

  for (const field of [
    'sourceRunId',
    'executionPlanId',
    'plannedRunId',
    'projectRoot',
    'projectFingerprint',
    'gitHead',
    'gitStatusFingerprint',
    'sourceWorkspacePath',
    'sourceWorkspaceManifestPath',
    'sourceWorkspaceFingerprint',
    'sourceEvidenceArtifactPath',
    'patchArtifactPath',
    'patchHash',
    'confirmationCommand',
    'createdAt'
  ]) {
    assertNonEmptyString(plan[field], `adoption plan ${field}`);
  }

  if (plan.command !== 'symphony adopt'
    || plan.intent !== 'adopt'
    || plan.semanticCommand !== 'adopt'
    || plan.safetyMode !== 'write') {
    throw new UsageError('adoption plan command semantics are unsupported');
  }

  assertExactStringArray(plan.pipeline, ['adopt-plan'], 'adoption plan pipeline');

  if (plan.writeBoundary !== 'main-worktree'
    || plan.sourceWriteBoundary !== 'isolated-workspace'
    || plan.projectWrites !== true
    || plan.mainWorktreeWrites !== true
    || plan.workspaceWrites !== false
    || plan.runtimeWrites !== true
    || plan.externalCalls !== false
    || plan.destructiveWrites !== false) {
    throw new UsageError('adoption plan write invariants are unsupported');
  }

  if (!Array.isArray(plan.changedFiles) || !Array.isArray(plan.fileOperations)) {
    throw new UsageError('adoption plan changedFiles and fileOperations must be arrays');
  }

  assertSameStringSet({
    left: plan.changedFiles,
    right: plan.fileOperations.map((operation) => operation.path),
    message: 'adoption plan changedFiles do not match fileOperations'
  });

  for (const operation of plan.fileOperations) {
    assertFileOperation(operation);
  }
}

function assertFileOperation(operation) {
  if (operation === null || typeof operation !== 'object' || Array.isArray(operation)) {
    throw new UsageError('adoption file operation must be an object');
  }

  const path = normalizeAdoptionRelativePath(operation.path);

  if (path !== operation.path) {
    throw new UsageError('adoption file operation path is not normalized');
  }

  if (!['add', 'modify'].includes(operation.operation)) {
    throw new UsageError('adoption file operation must be add or modify');
  }

  if (operation.operation === 'add' && operation.beforeHash !== null) {
    throw new UsageError('add operation beforeHash must be null');
  }

  if (operation.operation === 'modify') {
    assertNonEmptyString(operation.beforeHash, 'file operation beforeHash');
  }

  assertNonEmptyString(operation.afterHash, 'file operation afterHash');

  if (!Number.isInteger(operation.size) || operation.size < 0) {
    throw new UsageError('file operation size must be a non-negative integer');
  }

  if (operation.textEncoding !== 'utf8') {
    throw new UsageError('file operation textEncoding must be utf8');
  }
}

async function readGitHead({ runner, cwd }) {
  const result = await runGitCommand({
    runner,
    cwd,
    args: ['rev-parse', 'HEAD'],
    failureMessage: 'git HEAD could not be read'
  });

  if (result.exitCode !== 0) {
    throw new UsageError('git HEAD could not be read');
  }

  return result.stdout.trim();
}

async function buildGitStatusFingerprint({ runner, cwd, ignoredPaths }) {
  const entries = await readGitStatusEntries({
    runner,
    cwd,
    ignoredPaths
  });

  return {
    entries,
    fingerprint: fingerprintGitStatusEntries(entries)
  };
}

async function readGitStatusEntries({ runner, cwd, ignoredPaths }) {
  const result = await runGitCommand({
    runner,
    cwd,
    args: ['--no-optional-locks', 'status', '--porcelain=v1', '-z', '--untracked-files=all'],
    failureMessage: 'git status could not be read'
  });

  if (result.exitCode !== 0) {
    throw new UsageError('git status could not be read');
  }

  const ignored = [...ignoredPaths].sort();
  const entries = [];
  const parts = result.stdout.split('\0').filter((part) => part !== '');

  for (let index = 0; index < parts.length; index += 1) {
    const entry = parts[index];

    if (entry.length < 4) {
      continue;
    }

    const status = entry.slice(0, 2);
    const rawPath = entry.slice(3);
    const path = normalizeAdoptionRelativePath(rawPath);

    if (isPathIgnored(path, ignored)) {
      continue;
    }

    entries.push({
      status,
      path
    });

    if (status.includes('R') || status.includes('C')) {
      index += 1;
    }
  }

  return entries.sort((left, right) => `${left.path}\0${left.status}`.localeCompare(`${right.path}\0${right.status}`));
}

function fingerprintGitStatusEntries(entries) {
  const hash = createHash('sha256');

  for (const entry of entries) {
    hash.update(`${entry.status}\0${entry.path}\0`);
  }

  return `sha256:${hash.digest('hex')}`;
}

async function runGitCommand({ runner, cwd, args, failureMessage }) {
  try {
    return await runner.run({
      executable: 'git',
      args,
      cwd,
      timeoutMs: 30000
    });
  } catch (error) {
    throw new UsageError(`${failureMessage}: ${error.message}`);
  }
}

function normalizeChangedFiles(value, field) {
  if (!Array.isArray(value)) {
    throw new UsageError(`${field} must be an array`);
  }

  return [...new Set(value.map((entry) => normalizeAdoptionRelativePath(entry)))].sort();
}

function normalizeAdoptionRelativePath(value) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new UsageError('adoption path must be a non-empty string');
  }

  if (value.includes('\0') || value.includes('\\')) {
    throw new UsageError('adoption path must be a canonical POSIX relative path');
  }

  if (posix.isAbsolute(value) || /^[A-Za-z]:/u.test(value)) {
    throw new UsageError('adoption path must be relative');
  }

  const normalized = posix.normalize(value);

  if (normalized === '.' || normalized === '..' || normalized.startsWith('../')) {
    throw new UsageError('adoption path must not traverse outside the project');
  }

  return normalized;
}

function buildAdoptionCandidateIgnoredRoots({ projectRoot, stateDir, workDir }) {
  return normalizeIgnoredPathList({
    projectRoot,
    paths: ['.git', '.symphony', 'node_modules', stateDir, workDir]
  });
}

function assertAdoptionPathAllowed(path, ignoredRoots) {
  if (isPathIgnored(path, ignoredRoots)) {
    throw new UsageError('adoption path touches an ignored root');
  }
}

function normalizeIgnoredPathList({ projectRoot, paths }) {
  return [...new Set(paths
    .filter((path) => isNonEmptyString(path))
    .map((path) => relative(projectRoot, resolve(projectRoot, path)).split(sep).join('/'))
    .filter((path) => path !== '' && path !== '.' && path !== '..' && !path.startsWith('../'))
    .map((path) => normalizeAdoptionRelativePath(path)))]
    .sort();
}

function isPathIgnored(path, ignoredPaths) {
  return ignoredPaths.some((ignored) => path === ignored || path.startsWith(`${ignored}/`));
}

function decodeUtf8Text(buffer, path) {
  if (buffer.includes(0)) {
    throw new UsageError(`binary file is unsupported: ${path}`);
  }

  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(buffer);
  } catch {
    throw new UsageError(`non-utf8 text is unsupported: ${path}`);
  }
}

function publicFileOperation(operation) {
  return {
    path: operation.path,
    operation: operation.operation,
    beforeHash: operation.beforeHash,
    afterHash: operation.afterHash,
    size: operation.size,
    textEncoding: operation.textEncoding
  };
}

function fingerprintFileOperations(operations) {
  const hash = createHash('sha256');

  for (const operation of operations) {
    hash.update(`${operation.path}\0${operation.operation}\0${operation.beforeHash ?? ''}\0${operation.afterHash}\0${operation.size}\0${operation.textEncoding}\0`);
  }

  return `sha256:${hash.digest('hex')}`;
}

function sha256Buffer(buffer) {
  return `sha256:${createHash('sha256').update(buffer).digest('hex')}`;
}

function sha256Text(text) {
  return sha256Buffer(Buffer.from(text, 'utf8'));
}

async function readJsonArtifact(path, label) {
  try {
    return JSON.parse(await readFile(path, 'utf8'));
  } catch (error) {
    throw new UsageError(`${label} is missing or unreadable: ${error.message}`);
  }
}

function assertPathInside({ root, target, message }) {
  const relativePath = relative(root, target);

  if (relativePath === '' || (!relativePath.startsWith('..') && !relativePath.includes(`..${sep}`) && !posix.isAbsolute(relativePath.split(sep).join('/')))) {
    return;
  }

  throw new UsageError(message);
}

function assertSameStringSet({ left, right, message }) {
  const leftSet = [...new Set(left)].sort();
  const rightSet = [...new Set(right)].sort();

  if (leftSet.length !== rightSet.length || leftSet.some((value, index) => value !== rightSet[index])) {
    throw new UsageError(message);
  }
}

function assertExactStringArray(value, expected, field) {
  if (!Array.isArray(value)
    || value.length !== expected.length
    || value.some((entry, index) => entry !== expected[index])) {
    throw new UsageError(`${field} must be ${expected.join(', ')}`);
  }
}

async function prepareWorkIntake({
  options,
  runId,
  runRoot,
  stdout,
  stderr,
  runner,
  env,
  mcasRunner
}) {
  if (options.preflightIntake) {
    return await runWorkPreflightIntake({
      runId,
      runRoot,
      stdout,
      stderr,
      runner,
      env,
      mcasRunner
    });
  }

  if (options.intakeArtifact !== undefined) {
    return await loadWorkIntakeArtifact(options.intakeArtifact);
  }

  return {
    exitCode: EXIT_CODES.ok,
    constraints: []
  };
}

async function runWorkPreflightIntake({
  runId,
  runRoot,
  stdout,
  stderr,
  runner,
  env,
  mcasRunner
}) {
  const kernelStdout = createBufferedStream();
  const kernelStderr = createBufferedStream();
  const exitCode = await mcasRunner({
    argv: [
      'intake',
      '--project-dir',
      '.',
      '--runtime-dir',
      join(runRoot, 'intake-runtime'),
      '--session-id',
      `${runId}-intake`
    ],
    stdout: kernelStdout.stream,
    stderr: kernelStderr.stream,
    runner,
    env
  });

  if (exitCode !== EXIT_CODES.ok) {
    if (kernelStdout.text() !== '') {
      stdout.write(kernelStdout.text());
    }

    if (kernelStderr.text() !== '') {
      stderr.write(kernelStderr.text());
    }

    return {
      exitCode,
      constraints: []
    };
  }

  const output = parseJsonOutput(kernelStdout.text(), 'mcas intake output');

  if (kernelStderr.text() !== '') {
    stderr.write(kernelStderr.text());
  }

  return {
    exitCode,
    intakeContextArtifactPath: output.contextArtifactPath,
    intakeSummaryArtifactPath: output.summaryArtifactPath,
    recommendedWorkflow: output.recommendedWorkflow,
    verificationCommands: output.verificationCommands,
    constraints: buildIntakeConstraints({
      contextArtifactPath: output.contextArtifactPath,
      recommendedWorkflow: output.recommendedWorkflow,
      verificationCommands: output.verificationCommands
    })
  };
}

async function loadWorkIntakeArtifact(path) {
  let context;

  try {
    context = JSON.parse(await readFile(path, 'utf8'));
    validateProjectContextArtifact(context);
  } catch (error) {
    throw new UsageError(`--intake-artifact must be readable project-context JSON: ${error.message}`);
  }

  return {
    exitCode: EXIT_CODES.ok,
    intakeContextArtifactPath: path,
    recommendedWorkflow: context.workflowHints.recommendedMode,
    verificationCommands: context.workflowHints.verificationCommands,
    constraints: buildIntakeConstraints({
      contextArtifactPath: path,
      recommendedWorkflow: context.workflowHints.recommendedMode,
      verificationCommands: context.workflowHints.verificationCommands
    })
  };
}

function buildIntakeConstraints({
  contextArtifactPath,
  recommendedWorkflow,
  verificationCommands = []
}) {
  const constraints = [
    `project_context_artifact:${contextArtifactPath}`,
    `recommended_workflow:${recommendedWorkflow}`
  ];

  for (const command of verificationCommands) {
    constraints.push(`verification_command:${command}`);
  }

  return constraints;
}

async function buildWorkSummary({
  kernelOutput,
  runId,
  taskPacketPath,
  harnessDirectory,
  summaryCommand = 'symphony work',
  executionMode,
  adapter,
  proofDir,
  intake = {}
}) {
  const evidence = await collectEvidence({
    artifactDirectory: kernelOutput.artifactDirectory,
    taskId: kernelOutput.taskId,
    commands: kernelOutput.commands
  });
  const workspaceRefs = extractSourceWorkspaceRefs(kernelOutput);
  const summary = {
    version: '1',
    command: summaryCommand,
    ...productMetadataForSummaryCommand(summaryCommand),
    status: kernelOutput.status,
    exitCode: kernelOutput.exitCode,
    runId,
    workflowMode: kernelOutput.workflowMode,
    adapter,
    executionMode,
    verifierStatus: kernelOutput.verifierStatus,
    changedFiles: evidence.changedFiles,
    evidenceArtifactPath: evidence.firstArtifactPath,
    harnessOutputPath: harnessDirectory,
    taskPacketPath,
    ...workspaceRefs,
    ...(intake.intakeContextArtifactPath
      ? { intakeContextArtifactPath: intake.intakeContextArtifactPath }
      : {}),
    ...(intake.intakeSummaryArtifactPath
      ? { intakeSummaryArtifactPath: intake.intakeSummaryArtifactPath }
      : {}),
    nextAction: executionMode === 'real'
      ? 'Inspect proofArtifactPath, evidenceArtifactPath, and harnessOutputPath.'
      : 'Inspect evidenceArtifactPath and harnessOutputPath; use --real <adapter> only with the matching MCAS_RUN_REAL_* gate.'
  };

  if (executionMode === 'real') {
    summary.proofArtifactPath = await writeWorkProof({
      proofDir,
      runId,
      summary,
      kernelOutput
    });
  }

  return summary;
}

function productMetadataForSummaryCommand(summaryCommand) {
  if (summaryCommand === 'symphony review') {
    return {
      intent: 'review',
      semanticCommand: 'review',
      pipeline: ['scan-if-needed', 'review'],
      safetyMode: 'read-only',
      projectWrites: false,
      runtimeWrites: true,
      externalCalls: false
    };
  }

  if (summaryCommand === 'symphony qa') {
    return {
      intent: 'verify',
      semanticCommand: 'verify',
      pipeline: ['scan-if-needed', 'verify'],
      safetyMode: 'dry-run',
      projectWrites: false,
      runtimeWrites: true,
      externalCalls: false
    };
  }

  return {};
}

async function collectEvidence({ artifactDirectory, taskId, commands }) {
  const changedFiles = new Set();
  let firstArtifactPath;

  if (!Array.isArray(commands)) {
    return {
      changedFiles: [],
      firstArtifactPath
    };
  }

  for (const command of commands) {
    if (typeof command?.artifactId !== 'string') {
      continue;
    }

    const artifactPath = join(artifactDirectory, taskId, `${command.artifactId}.json`);

    firstArtifactPath = firstArtifactPath ?? artifactPath;

    try {
      const artifact = JSON.parse(await readFile(artifactPath, 'utf8'));

      for (const changedFile of artifact.changedFiles ?? []) {
        changedFiles.add(changedFile);
      }
    } catch {
      continue;
    }
  }

  return {
    changedFiles: [...changedFiles],
    firstArtifactPath
  };
}

function extractSourceWorkspaceRefs(kernelOutput) {
  const commands = Array.isArray(kernelOutput.commands) ? kernelOutput.commands : [];
  const sourceCommand = commands.find((command) => (
    isNonEmptyString(command.workspacePath)
    || (isNonEmptyString(kernelOutput.workspaceDirectory)
      && isNonEmptyString(kernelOutput.taskId)
      && isNonEmptyString(command.workspaceId))
  ));

  if (sourceCommand === undefined) {
    return {};
  }

  const sourceWorkspacePath = isNonEmptyString(sourceCommand.workspacePath)
    ? sourceCommand.workspacePath
    : join(kernelOutput.workspaceDirectory, kernelOutput.taskId, sourceCommand.workspaceId);
  const sourceWorkspaceManifestPath = isNonEmptyString(sourceCommand.workspaceManifestPath)
    ? sourceCommand.workspaceManifestPath
    : join(sourceWorkspacePath, 'workspace-manifest.json');

  return {
    sourceWorkspacePath,
    sourceWorkspaceManifestPath
  };
}

async function writeWorkProof({ proofDir, runId, summary, kernelOutput }) {
  await mkdir(proofDir, { recursive: true });

  const proofArtifactPath = join(proofDir, `${runId}-work-proof.json`);
  const proof = {
    version: '1',
    kind: 'symphony-work-proof',
    runId,
    adapter: summary.adapter,
    executionMode: summary.executionMode,
    verifierStatus: summary.verifierStatus,
    summary,
    kernelOutput
  };

  await writeFile(proofArtifactPath, `${JSON.stringify(redactSecrets(proof), null, 2)}\n`, 'utf8');

  return proofArtifactPath;
}

async function runSymphonyAgent({ args, stdout, stderr, runner, env }) {
  const options = parseAgentArgs(args);
  const runId = buildAgentRunId(options);
  const proofDirectory = options.proofDir ?? join('tmp/symphony-agent', runId, 'proof');
  const native = buildNativeAgentCommand(options);

  if (options.executionMode === 'real') {
    assertAgentRealGate(options.adapter, env);
  }

  const result = options.executionMode === 'real'
    ? await runner.run({
        executable: native.executable,
        args: native.args,
        ...(options.timeoutMs !== undefined ? { timeoutMs: options.timeoutMs } : {})
      })
    : {
        exitCode: 0,
        stdout: '',
        stderr: '',
        durationMs: 0
      };
  const status = result.exitCode === 0 ? 'passed' : 'failed';
  const proof = await writeNativeAgentProof({
    proofDirectory,
    runId,
    adapter: options.adapter,
    native,
    executionMode: options.executionMode,
    status,
    result
  });
  const summary = {
    version: '1',
    command: 'symphony agent',
    status,
    exitCode: result.exitCode ?? EXIT_CODES.failure,
    runId,
    adapter: options.adapter,
    nativeCommand: options.nativeCommand,
    executionMode: options.executionMode,
    verifierStatus: 'unverified',
    proofArtifactPath: proof.proofArtifactPath,
    ...(proof.stdoutArtifactPath ? { stdoutArtifactPath: proof.stdoutArtifactPath } : {}),
    ...(proof.stderrArtifactPath ? { stderrArtifactPath: proof.stderrArtifactPath } : {}),
    nextAction: 'Inspect proofArtifactPath; passthrough proof is captured but unverified.'
  };

  writeJson(stdout, summary);

  return result.exitCode ?? EXIT_CODES.failure;
}

function buildNativeAgentCommand(options) {
  const prompt = options.promptArgs.join(' ');
  const nativePrompt = [options.nativeCommand, prompt].filter(Boolean).join(' ');

  return {
    executable: 'claude',
    args: ['-p', nativePrompt],
    command: options.nativeCommand,
    prompt
  };
}

function parseAgentArgs(args) {
  const [adapter, nativeCommand, ...rest] = args;

  if (adapter !== 'claude' || nativeCommand !== '/review') {
    throw new UsageError('initial agent support is limited to: symphony agent claude /review');
  }

  let executionMode = 'dry-run';
  let proofDir;
  let timeoutMs;
  const promptArgs = [];

  for (let index = 0; index < rest.length; index += 1) {
    const value = rest[index];

    if (value === '--dry-run') {
      executionMode = 'dry-run';
      continue;
    }

    if (value === '--real') {
      executionMode = 'real';
      continue;
    }

    if (value === '--proof-dir') {
      proofDir = readRequiredValue(rest, index, '--proof-dir');
      index += 1;
      continue;
    }

    if (value === '--timeout-ms') {
      timeoutMs = toPositiveInteger(readRequiredValue(rest, index, '--timeout-ms'), '--timeout-ms');
      index += 1;
      continue;
    }

    if (value.startsWith('--')) {
      throw new UsageError(`unknown agent option: ${value}`);
    }

    promptArgs.push(value);
  }

  return {
    adapter,
    nativeCommand,
    promptArgs,
    executionMode,
    proofDir,
    timeoutMs
  };
}

async function writeNativeAgentProof({
  proofDirectory,
  runId,
  adapter,
  native,
  executionMode,
  status,
  result
}) {
  await mkdir(proofDirectory, { recursive: true });

  const proofArtifactPath = join(proofDirectory, 'native-agent-proof.json');
  const stdoutArtifactPath = executionMode === 'real' ? join(proofDirectory, 'stdout.txt') : undefined;
  const stderrArtifactPath = executionMode === 'real' ? join(proofDirectory, 'stderr.txt') : undefined;

  if (stdoutArtifactPath) {
    await writeFile(stdoutArtifactPath, redactSecrets(result.stdout ?? ''), 'utf8');
  }

  if (stderrArtifactPath) {
    await writeFile(stderrArtifactPath, redactSecrets(result.stderr ?? ''), 'utf8');
  }

  const proof = {
    version: '1',
    kind: 'native-agent-proof',
    command: 'symphony agent',
    runId,
    status,
    adapterId: adapter,
    nativeCommand: native,
    executionMode,
    modelInvocation: executionMode === 'real',
    exitCode: result.exitCode ?? EXIT_CODES.failure,
    durationMs: result.durationMs ?? null,
    verifierStatus: 'unverified',
    ...(stdoutArtifactPath ? { stdoutArtifactPath } : {}),
    ...(stderrArtifactPath ? { stderrArtifactPath } : {}),
    resourceProfile: {
      status: 'unknown',
      unknownResourceProfileReason: 'native passthrough does not expose a resource profile yet'
    }
  };

  await writeFile(proofArtifactPath, `${JSON.stringify(redactSecrets(proof), null, 2)}\n`, 'utf8');

  return {
    proofArtifactPath,
    stdoutArtifactPath,
    stderrArtifactPath
  };
}

function buildWorkWorkflow({ mode, runId, agentPrefix, writeSet }) {
  if (mode === 'writer-reviewer') {
    return {
      mode,
      ensemble_id: `${runId}-writer-reviewer`,
      writer: {
        agent_id: `${agentPrefix}-writer`,
        model_profile: defaultModelProfile(agentPrefix)
      },
      reviewers: [{
        agent_id: `${agentPrefix}-reviewer`,
        model_profile: defaultModelProfile(agentPrefix)
      }]
    };
  }

  if (mode === 'qa-swarm') {
    return {
      mode,
      ensemble_id: `${runId}-qa-swarm`,
      qa_lanes: [
        {
          lane_id: 'acceptance-audit',
          agent_id: `${agentPrefix}-qa-a`,
          model_profile: defaultModelProfile(agentPrefix)
        },
        {
          lane_id: 'regression-audit',
          agent_id: `${agentPrefix}-qa-b`,
          model_profile: defaultModelProfile(agentPrefix)
        }
      ]
    };
  }

  if (mode === 'parallel-lanes') {
    return {
      mode,
      ensemble_id: `${runId}-parallel-lanes`,
      lanes: [
        {
          lane_id: 'lane-a',
          agent_id: `${agentPrefix}-lane-a`,
          write_set: [writeSet[0]],
          model_profile: defaultModelProfile(agentPrefix)
        },
        {
          lane_id: 'lane-b',
          agent_id: `${agentPrefix}-lane-b`,
          write_set: [writeSet[1]],
          model_profile: defaultModelProfile(agentPrefix)
        }
      ]
    };
  }

  if (mode === 'competitive-patch') {
    return {
      mode,
      ensemble_id: `${runId}-competitive-patch`,
      candidates: [
        {
          candidate_id: 'candidate-a',
          agent_id: `${agentPrefix}-candidate-a`,
          model_profile: defaultModelProfile(agentPrefix)
        },
        {
          candidate_id: 'candidate-b',
          agent_id: `${agentPrefix}-candidate-b`,
          model_profile: defaultModelProfile(agentPrefix)
        }
      ]
    };
  }

  throw new UsageError(`unsupported work mode: ${mode}`);
}

function defaultWorkMode(prompt) {
  return /\b(review|qa|audit|inspect|verify|check)\b/iu.test(prompt ?? '')
    ? 'qa-swarm'
    : 'writer-reviewer';
}

function buildWorkRunId({ prompt, mode, adapter = 'codex' }) {
  return `symphony-work-${safeIdPart(mode)}-${shortHash([adapter, mode, prompt].join('\0'))}`;
}

function buildIntakeRunId({ projectDir, provider }) {
  const resolvedProjectDir = resolve(projectDir);

  return `symphony-intake-${safeIdPart(basenameFromPath(resolvedProjectDir))}-${shortHash([resolvedProjectDir, provider].join('\0'))}`;
}

function buildAgentRunId({ adapter, nativeCommand, promptArgs }) {
  return `symphony-agent-${safeIdPart(adapter)}-${safeIdPart(nativeCommand)}-${shortHash(promptArgs.join('\0'))}`;
}

function buildSymphonyIntakeSummary({ kernelOutput, provider, format }) {
  const summary = {
    version: '1',
    command: 'symphony intake',
    status: kernelOutput.status,
    exitCode: kernelOutput.exitCode,
    projectDir: kernelOutput.projectDir,
    provider,
    modelInvocation: false,
    contextArtifactPath: kernelOutput.contextArtifactPath,
    summaryArtifactPath: kernelOutput.summaryArtifactPath,
    riskCounts: kernelOutput.riskCounts,
    openQuestionCount: kernelOutput.openQuestionCount,
    recommendedWorkflow: kernelOutput.recommendedWorkflow,
    verificationCommands: kernelOutput.verificationCommands,
    nextAction: 'Review contextArtifactPath before running symphony work --intake-artifact <path>.'
  };

  if (format === 'json') {
    summary.artifactDirectory = kernelOutput.artifactDirectory;
    summary.eventDirectory = kernelOutput.eventDirectory;
    summary.sessionId = kernelOutput.sessionId;
    summary.taskId = kernelOutput.taskId;
    summary.providerStatus = kernelOutput.providerStatus;
  }

  return summary;
}

function shortHash(value) {
  return createHash('sha256').update(value).digest('hex').slice(0, 12);
}

function basenameFromPath(path) {
  const parts = path.split(/[\\/]+/u).filter(Boolean);

  return parts.at(-1) ?? 'project';
}

function safeIdPart(value) {
  return String(value ?? 'value')
    .replace(/[^0-9A-Za-z._-]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'value';
}

function normalizeWorkAdapter(value) {
  if (value === 'codex' || value === 'claude' || value === 'kiro') {
    return value;
  }

  if (value === 'claude-code') {
    return 'claude';
  }

  if (value === 'kiro-cli') {
    return 'kiro';
  }

  throw new UsageError('adapter must be one of: codex, claude, claude-code, kiro, kiro-cli');
}

function agentIdPrefix(adapter) {
  return normalizeWorkAdapter(adapter);
}

function defaultModelProfile(agentPrefix) {
  if (agentPrefix === 'claude') {
    return 'deepseek-claude-code';
  }

  if (agentPrefix === 'kiro') {
    return 'claude-kiro-default';
  }

  return 'gpt-codex-default';
}

function assertAgentRealGate(adapter, env) {
  const gate = REAL_AGENT_GATES[adapter];

  if (env?.[gate] !== '1') {
    throw new UsageError(`Set ${gate}=1 to invoke the real ${adapter} native CLI.`);
  }
}

function assertWorkMode(mode) {
  if (!WORK_MODES.has(mode)) {
    throw new UsageError('work mode must be one of: linear, writer-reviewer, parallel-lanes, qa-swarm, competitive-patch');
  }
}

function readRequiredValue(args, index, optionName) {
  const value = args[index + 1];

  if (typeof value !== 'string' || value.trim() === '' || value.startsWith('--')) {
    throw new UsageError(`${optionName} requires a value`);
  }

  return value;
}

function toPositiveInteger(value, field) {
  const number = Number.parseInt(value, 10);

  if (!Number.isInteger(number) || number < 1 || String(number) !== value) {
    throw new UsageError(`${field} must be a positive integer`);
  }

  return number;
}

function toPortInteger(value, field) {
  const number = Number.parseInt(value, 10);

  if (!Number.isInteger(number) || number < 0 || number > 65535 || String(number) !== value) {
    throw new UsageError(`${field} must be an integer from 0 to 65535`);
  }

  return number;
}

function assertNonEmptyString(value, field) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new UsageError(`${field} must be a non-empty string`);
  }
}

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim() !== '';
}

function assertSafePathSegment(value, field) {
  if (typeof value !== 'string' || value.trim() === '' || value.includes('/') || value.includes('..')) {
    throw new UsageError(`${field} must be a safe path segment`);
  }
}

function createBufferedStream() {
  const chunks = [];

  return {
    stream: {
      write(chunk) {
        chunks.push(String(chunk));
      }
    },
    text() {
      return chunks.join('');
    }
  };
}

function parseJsonOutput(content, field) {
  try {
    return JSON.parse(content);
  } catch (error) {
    throw new UsageError(`${field} must be JSON: ${error.message}`);
  }
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

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const exitCode = await runSymphonyCli();
  process.exitCode = exitCode;
}
