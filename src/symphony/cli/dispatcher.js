import { NodeProcessRunner } from '../../process-runner.js';
import { classifyPrompt } from '../prompt-router.js';
import { runArtifactsCommand } from './commands/artifacts.js';
import { runGoalCommand, runGoalStatusCommand } from './commands/goal.js';
import { runInstallCommand } from './commands/install.js';
import { runStatusCommand } from './commands/status.js';
import { runSupervisorCommand } from './commands/supervisor.js';
import { EXIT_CODES, UsageError, readRequiredValue } from './errors.js';
import { writeJson } from './output.js';

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
  'install',
  'artifacts',
  'continue',
  'console',
  'diagnose',
  'runtime',
  'inbox',
  'actions',
  'providers',
  'app-data',
  'handoff',
  'goal',
  'goal-status',
  'progress',
  'adopt',
  'new',
  'stage',
  'next',
  'evidence',
  'backup',
  'diagnostics',
  'restore',
  'supervisor'
]);

export async function runSymphonyCli({
  argv = process.argv.slice(2),
  stdout = process.stdout,
  stderr = process.stderr,
  runner,
  env = process.env,
  mcasRunner,
  legacyCommands = {}
} = {}) {
  try {
    if (!Array.isArray(argv)) {
      throw new UsageError('argv must be an array');
    }

    const promptInvocation = parsePromptInvocation(argv);

    if (promptInvocation !== null) {
      return await runPromptInvocation({
        invocation: promptInvocation,
        stdout,
        stderr,
        runner,
        env,
        mcasRunner,
        legacyCommands
      });
    }

    const [command, ...rest] = argv;

    if (command === 'doctor') {
      return await callMcasRunner({
        mcasRunner,
        argv: ['doctor', ...rest],
        stdout,
        stderr,
        runner,
        env
      });
    }

    if (command === 'harness') {
      return await callMcasRunner({
        mcasRunner,
        argv: ['harness', ...rest],
        stdout,
        stderr,
        runner,
        env
      });
    }

    if (command === 'replay') {
      return await callMcasRunner({
        mcasRunner,
        argv: ['eval', 'replay', ...rest],
        stdout,
        stderr,
        runner,
        env
      });
    }

    if (command === 'eval' && rest[0] === 'replay') {
      return await callMcasRunner({
        mcasRunner,
        argv: ['eval', 'replay', ...rest.slice(1)],
        stdout,
        stderr,
        runner,
        env
      });
    }

    if (command === 'work') {
      return await requireLegacyCommand(legacyCommands, 'runWork')({
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
      return await requireLegacyCommand(legacyCommands, 'runScanProduct')({
        args: rest,
        stdout,
        stderr,
        runner,
        env,
        mcasRunner
      });
    }

    if (command === 'do') {
      return await requireLegacyCommand(legacyCommands, 'runWorkProduct')({
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
      return await requireLegacyCommand(legacyCommands, 'runWorkProduct')({
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
      return await requireLegacyCommand(legacyCommands, 'runWorkProduct')({
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
      return await runStatusCommand({
        args: rest,
        stdout
      });
    }

    if (command === 'install') {
      return await runInstallCommand({
        args: rest,
        stdout,
        env
      });
    }

    if (command === 'artifacts') {
      return await runArtifactsCommand({
        args: rest,
        stdout
      });
    }

    if (command === 'continue') {
      return await requireLegacyCommand(legacyCommands, 'runContinue')({
        args: rest,
        stdout
      });
    }

    if (command === 'console') {
      return await requireLegacyCommand(legacyCommands, 'runConsole')({
        args: rest,
        stdout
      });
    }

    if (command === 'diagnose') {
      return await requireLegacyCommand(legacyCommands, 'runDiagnose')({
        args: rest,
        stdout,
        runner: runner ?? new NodeProcessRunner(),
        env
      });
    }

    if (command === 'runtime') {
      return await requireLegacyCommand(legacyCommands, 'runRuntime')({
        args: rest,
        stdout
      });
    }

    if (command === 'inbox') {
      return await requireLegacyCommand(legacyCommands, 'runInbox')({
        args: rest,
        stdout
      });
    }

    if (command === 'actions') {
      return await requireLegacyCommand(legacyCommands, 'runActions')({
        args: rest,
        stdout
      });
    }

    if (command === 'providers') {
      return await requireLegacyCommand(legacyCommands, 'runProviders')({
        args: rest,
        stdout,
        env
      });
    }

    if (command === 'app-data') {
      return await requireLegacyCommand(legacyCommands, 'runAppData')({
        args: rest,
        stdout
      });
    }

    if (command === 'handoff') {
      return await requireLegacyCommand(legacyCommands, 'runHandoff')({
        args: rest,
        stdout
      });
    }

    if (command === 'goal') {
      return await runGoalCommand({
        args: rest,
        stdout
      });
    }

    if (command === 'goal-status' || command === 'progress') {
      return await runGoalStatusCommand({
        args: rest,
        stdout
      });
    }

    if (command === 'stage') {
      return await requireLegacyCommand(legacyCommands, 'runStage')({
        args: rest,
        stdout
      });
    }

    if (command === 'next') {
      return await requireLegacyCommand(legacyCommands, 'runNext')({
        args: rest,
        stdout
      });
    }

    if (command === 'evidence') {
      return await requireLegacyCommand(legacyCommands, 'runEvidence')({
        args: rest,
        stdout
      });
    }

    if (command === 'backup') {
      return await requireLegacyCommand(legacyCommands, 'runBackup')({
        args: rest,
        stdout
      });
    }

    if (command === 'diagnostics') {
      return await requireLegacyCommand(legacyCommands, 'runDiagnosticsBundle')({
        args: rest,
        stdout
      });
    }

    if (command === 'restore') {
      return await requireLegacyCommand(legacyCommands, 'runRestoreValidation')({
        args: rest,
        stdout
      });
    }

    if (command === 'supervisor') {
      return await runSupervisorCommand({
        args: rest,
        stdout
      });
    }

    if (command === 'adopt') {
      return await requireLegacyCommand(legacyCommands, 'runAdopt')({
        args: rest,
        stdout,
        runner: runner ?? new NodeProcessRunner(),
        env
      });
    }

    if (command === 'new') {
      return await requireLegacyCommand(legacyCommands, 'runNew')({
        args: rest,
        stdout,
        stderr,
        runner: runner ?? new NodeProcessRunner(),
        env,
        mcasRunner
      });
    }

    if (command === 'intake') {
      return await requireLegacyCommand(legacyCommands, 'runIntake')({
        args: rest,
        stdout,
        stderr,
        runner,
        env,
        mcasRunner
      });
    }

    if (command === 'agent') {
      return await requireLegacyCommand(legacyCommands, 'runAgent')({
        args: rest,
        stdout,
        stderr,
        runner: runner ?? new NodeProcessRunner(),
        env
      });
    }

    throw new UsageError('unknown command');
  } catch (error) {
    const exitCode = isUsageError(error) ? EXIT_CODES.usage : EXIT_CODES.failure;

    writeJson(stderr, {
      version: '1',
      status: 'error',
      exitCode,
      message: error.message
    });

    return exitCode;
  }
}

async function runPromptInvocation({
  invocation,
  stdout,
  stderr,
  runner,
  env,
  mcasRunner,
  legacyCommands
}) {
  const routeDecision = classifyPrompt({
    prompt: invocation.prompt,
    args: invocation.args
  });

  if (routeDecision.requiresConfirmation) {
    throw new UsageError('destructive prompts require --confirm-destructive');
  }

  if (routeDecision.intent === 'scan-project') {
    return await requireLegacyCommand(legacyCommands, 'runScanProduct')({
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
    return await requireLegacyCommand(legacyCommands, 'runWorkProduct')({
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
    return await requireLegacyCommand(legacyCommands, 'runWorkProduct')({
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
    return await runStatusCommand({
      args: invocation.args,
      stdout,
      routeDecision
    });
  }

  if (routeDecision.intent === 'artifacts') {
    return await runArtifactsCommand({
      args: invocation.args,
      stdout,
      routeDecision
    });
  }

  if (routeDecision.intent === 'continue') {
    return await requireLegacyCommand(legacyCommands, 'runContinue')({
      args: invocation.args,
      stdout,
      routeDecision
    });
  }

  if (routeDecision.intent === 'console') {
    return await requireLegacyCommand(legacyCommands, 'runConsole')({
      args: invocation.args,
      stdout
    });
  }

  return await requireLegacyCommand(legacyCommands, 'runNew')({
    args: invocation.args,
    stdout,
    stderr,
    runner: runner ?? new NodeProcessRunner(),
    env,
    mcasRunner,
    prompt: invocation.prompt,
    promptTarget: requireLegacyCommand(legacyCommands, 'buildPromptNewTarget')({
      prompt: invocation.prompt,
      template: routeDecision.template
    }),
    promptTemplate: routeDecision.template,
    routeDecision
  });
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

async function callMcasRunner({
  mcasRunner,
  argv,
  stdout,
  stderr,
  runner,
  env
}) {
  if (typeof mcasRunner !== 'function') {
    throw new UsageError('mcas runner is not configured');
  }

  return await mcasRunner({
    argv,
    stdout,
    stderr,
    runner,
    env
  });
}

function requireLegacyCommand(legacyCommands, name) {
  if (typeof legacyCommands[name] !== 'function') {
    throw new UsageError(`legacy command is not configured: ${name}`);
  }

  return legacyCommands[name];
}

function isUsageError(error) {
  return error instanceof UsageError || error?.name === 'UsageError';
}
