#!/usr/bin/env node

import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { NodeProcessRunner } from '../src/process-runner.js';
import { redactSecrets } from '../src/redaction.js';
import { validateProjectContextArtifact } from '../src/intake/intake-contracts.js';
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

    if (command === 'review' || command === 'qa') {
      return await runSymphonyWork({
        args: ['--mode', 'qa-swarm', ...rest],
        summaryCommand: `symphony ${command}`,
        stdout,
        stderr,
        runner,
        env,
        mcasRunner
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
  stdout,
  stderr,
  runner,
  env,
  mcasRunner
}) {
  const options = parseWorkArgs(args);
  const runId = buildWorkRunId({
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
  const runId = buildIntakeRunId(options);
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
    if (kernelStderr.text() !== '') {
      stderr.write(kernelStderr.text());
    }

    return exitCode;
  }

  const kernelOutput = parseJsonOutput(kernelStdout.text(), 'mcas intake output');
  const summary = buildSymphonyIntakeSummary({
    kernelOutput,
    provider: options.provider,
    format: options.format
  });

  writeJson(stdout, summary);

  if (kernelStderr.text() !== '') {
    stderr.write(kernelStderr.text());
  }

  return exitCode;
}

function parseWorkArgs(args) {
  let mode;
  let workDir = 'tmp/symphony-work';
  let proofDir = 'tmp/real-cli-proofs';
  let realAdapter;
  let dryRun = false;
  let preflightIntake = false;
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
  const summary = {
    version: '1',
    command: summaryCommand,
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

function assertNonEmptyString(value, field) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new UsageError(`${field} must be a non-empty string`);
  }
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
