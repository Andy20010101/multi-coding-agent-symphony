import {
  SupervisorRunnerUsageError,
  runSupervisorCli
} from '../../supervisor-runner.js';
import {
  buildGoalSupervisorAppReadModelFromContracts
} from '../../goal-supervisor/index.js';
import { EXIT_CODES, UsageError, readRequiredValue } from '../errors.js';
import { writeJson } from '../output.js';

export async function runSupervisorCommand({ args, stdout }) {
  if (args[0] === 'status') {
    const options = parseGoalSupervisorStatusArgs(args.slice(1));

    if (options.help) {
      stdout.write(goalSupervisorStatusHelpText());
      return EXIT_CODES.ok;
    }

    writeJson(stdout, await buildGoalSupervisorAppReadModelFromContracts(options));
    return EXIT_CODES.ok;
  }

  try {
    return await runSupervisorCli({
      args,
      stdout
    });
  } catch (error) {
    if (error instanceof SupervisorRunnerUsageError) {
      throw new UsageError(error.message);
    }

    throw error;
  }
}

function parseGoalSupervisorStatusArgs(args) {
  const options = {
    stateDir: '.symphony',
    goalId: 'latest',
    help: false
  };

  for (let index = 0; index < args.length; index += 1) {
    const value = args[index];

    if (value === '--help') {
      options.help = true;
      continue;
    }

    if (value === '--json') {
      continue;
    }

    if (value === '--format') {
      const format = readRequiredValue(args, index, '--format');

      if (format !== 'json') {
        throw new UsageError('supervisor status prints JSON only');
      }

      index += 1;
      continue;
    }

    if (value === '--goal') {
      options.goalId = readRequiredValue(args, index, '--goal');
      index += 1;
      continue;
    }

    if (value === '--state-dir') {
      options.stateDir = readRequiredValue(args, index, '--state-dir');
      index += 1;
      continue;
    }

    if (value === '--confirm' || value === '--dry-run' || value === '--plan-hash' || value === '--allow-closeout') {
      throw new UsageError('supervisor status is read-only and does not accept write-flow or release flags');
    }

    if (value === '--output' || value === '-o') {
      throw new UsageError('supervisor status does not write files; redirect stdout if you need a file');
    }

    if (value === '--markdown' || value === '--human') {
      throw new UsageError('supervisor status prints JSON only');
    }

    if (value.startsWith('--')) {
      throw new UsageError(`unknown supervisor status option: ${value}`);
    }

    throw new UsageError(`unexpected supervisor status argument: ${value}`);
  }

  return options;
}

function goalSupervisorStatusHelpText() {
  return [
    'Usage: symphony supervisor status --goal <goal-id|latest> --json',
    '',
    'Prints read-only goal-supervisor-app-read-model.v1 from backend goal contracts and supervisor observability.',
    'The command does not dispatch children, register events, run gates, call providers, or execute release closeout.',
    ''
  ].join('\n');
}
