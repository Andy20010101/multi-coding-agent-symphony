import {
  buildGoalProgressLedger,
  renderGoalProgressMarkdown,
  renderGoalProgressText
} from '../../goal-progress-ledger.js';
import { buildGoalNextAction } from '../../goal-next-action-resolver.js';
import {
  GoalUpdateError,
  buildGoalUpdatePlan,
  confirmGoalUpdate
} from '../../goal-update.js';
import {
  GoalReviewError,
  buildGoalReviewPlan,
  confirmGoalReview
} from '../../goal-review.js';
import {
  GoalGateError,
  buildGoalGatePlan,
  confirmGoalGate
} from '../../goal-gate.js';
import {
  GoalRunbookRegistryError,
  buildGoalRunbookInitPlan,
  confirmGoalRunbookInit
} from '../../goal-runbook-registry.js';
import {
  GoalPromptPackError,
  buildGoalPromptPack,
  renderGoalPromptPackMarkdown,
  renderGoalPromptPackText
} from '../../goal-prompt-pack.js';
import {
  GoalCloseoutReportError,
  buildGoalCloseoutReport,
  renderGoalCloseoutReportMarkdown
} from '../../goal-closeout-report.js';
import { EXIT_CODES, UsageError, readRequiredValue } from '../errors.js';
import { writeJson } from '../output.js';

export async function runGoalCommand({ args, stdout }) {
  const [subcommand, ...rest] = args;

  if (subcommand === undefined || subcommand === '--help') {
    stdout.write(goalHelpText());
    return EXIT_CODES.ok;
  }

  if (subcommand !== 'init' && subcommand !== 'update' && subcommand !== 'review' && subcommand !== 'gate' && subcommand !== 'prompt' && subcommand !== 'next' && subcommand !== 'closeout') {
    throw new UsageError(`unknown goal subcommand: ${subcommand}`);
  }

  if (subcommand === 'next') {
    const options = parseGoalNextArgs(rest);

    if (options.help) {
      stdout.write(goalNextHelpText());
      return EXIT_CODES.ok;
    }

    const nextAction = await buildGoalNextAction(options);

    if (options.format === 'markdown') {
      stdout.write(renderGoalNextActionMarkdown(nextAction));
      return EXIT_CODES.ok;
    }

    if (options.format === 'human') {
      stdout.write(renderGoalNextActionText(nextAction));
      return EXIT_CODES.ok;
    }

    writeJson(stdout, nextAction);
    return EXIT_CODES.ok;
  }

  if (subcommand === 'closeout') {
    const options = parseGoalCloseoutArgs(rest);

    if (options.help) {
      stdout.write(goalCloseoutHelpText());
      return EXIT_CODES.ok;
    }

    try {
      const closeoutReport = await buildGoalCloseoutReport(options);

      if (options.format === 'markdown') {
        stdout.write(renderGoalCloseoutReportMarkdown(closeoutReport));
        return EXIT_CODES.ok;
      }

      if (options.format === 'human') {
        stdout.write(renderGoalCloseoutReportText(closeoutReport));
        return EXIT_CODES.ok;
      }

      writeJson(stdout, closeoutReport);
      return EXIT_CODES.ok;
    } catch (error) {
      if (error instanceof GoalCloseoutReportError) {
        throw new UsageError(error.message);
      }

      throw error;
    }
  }

  if (subcommand === 'prompt') {
    const options = parseGoalPromptArgs(rest);

    if (options.help) {
      stdout.write(goalPromptHelpText());
      return EXIT_CODES.ok;
    }

    try {
      const promptPack = await buildGoalPromptPack({
        ...options,
        promptFormat: options.format === 'text' ? 'text' : 'markdown'
      });

      if (options.format === 'markdown') {
        stdout.write(`${renderGoalPromptPackMarkdown(promptPack)}\n`);
        return EXIT_CODES.ok;
      }

      if (options.format === 'text') {
        stdout.write(`${renderGoalPromptPackText(promptPack)}\n`);
        return EXIT_CODES.ok;
      }

      writeJson(stdout, promptPack);
      return EXIT_CODES.ok;
    } catch (error) {
      if (error instanceof GoalPromptPackError) {
        throw new UsageError(error.message);
      }

      throw error;
    }
  }

  if (subcommand === 'init') {
    const options = parseGoalInitArgs(rest);

    if (options.help) {
      stdout.write(goalInitHelpText());
      return EXIT_CODES.ok;
    }

    try {
      if (options.confirm) {
        writeJson(stdout, await confirmGoalRunbookInit(options));
        return EXIT_CODES.ok;
      }

      writeJson(stdout, await buildGoalRunbookInitPlan(options));
      return EXIT_CODES.ok;
    } catch (error) {
      if (error instanceof GoalRunbookRegistryError) {
        throw new UsageError(error.message);
      }

      throw error;
    }
  }

  if (subcommand === 'gate') {
    const options = parseGoalGateArgs(rest);

    if (options.help) {
      stdout.write(goalGateHelpText());
      return EXIT_CODES.ok;
    }

    try {
      if (options.confirm) {
        writeJson(stdout, await confirmGoalGate(options));
        return EXIT_CODES.ok;
      }

      writeJson(stdout, buildGoalGatePlan(options));
      return EXIT_CODES.ok;
    } catch (error) {
      if (error instanceof GoalGateError) {
        throw new UsageError(error.message);
      }

      throw error;
    }
  }

  if (subcommand === 'review') {
    const options = parseGoalReviewArgs(rest);

    if (options.help) {
      stdout.write(goalReviewHelpText());
      return EXIT_CODES.ok;
    }

    try {
      if (options.confirm) {
        writeJson(stdout, await confirmGoalReview(options));
        return EXIT_CODES.ok;
      }

      writeJson(stdout, await buildGoalReviewPlan(options));
      return EXIT_CODES.ok;
    } catch (error) {
      if (error instanceof GoalReviewError) {
        throw new UsageError(error.message);
      }

      throw error;
    }
  }

  const options = parseGoalUpdateArgs(rest);

  if (options.help) {
    stdout.write(goalUpdateHelpText());
    return EXIT_CODES.ok;
  }

  try {
    if (options.confirm) {
      writeJson(stdout, await confirmGoalUpdate(options));
      return EXIT_CODES.ok;
    }

    writeJson(stdout, buildGoalUpdatePlan(options));
    return EXIT_CODES.ok;
  } catch (error) {
    if (error instanceof GoalUpdateError) {
      throw new UsageError(error.message);
    }

    throw error;
  }
}

export async function runGoalStatusCommand({ args, stdout }) {
  const options = parseGoalStatusArgs(args);

  if (options.help) {
    stdout.write(goalStatusHelpText());
    return EXIT_CODES.ok;
  }

  const ledger = await buildGoalProgressLedger({
    stateDir: options.stateDir,
    goalId: options.goalId
  });

  if (ledger === null) {
    throw new UsageError('goal not found');
  }

  if (options.format === 'json') {
    writeJson(stdout, ledger);
    return EXIT_CODES.ok;
  }

  if (options.format === 'markdown') {
    stdout.write(renderGoalProgressMarkdown(ledger));
    return EXIT_CODES.ok;
  }

  stdout.write(renderGoalProgressText(ledger));
  return EXIT_CODES.ok;
}

function parseGoalInitArgs(args) {
  const options = {
    stateDir: '.symphony',
    goalId: null,
    fromJson: null,
    confirm: false,
    dryRun: false,
    planHash: undefined,
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

    if (value === '--dry-run') {
      options.dryRun = true;
      continue;
    }

    if (value === '--confirm') {
      options.confirm = true;
      continue;
    }

    if (value === '--goal') {
      options.goalId = readRequiredValue(args, index, '--goal');
      index += 1;
      continue;
    }

    if (value === '--from-json') {
      options.fromJson = readRequiredValue(args, index, '--from-json');
      index += 1;
      continue;
    }

    if (value === '--plan-hash') {
      options.planHash = readRequiredValue(args, index, '--plan-hash');
      index += 1;
      continue;
    }

    if (value === '--state-dir') {
      options.stateDir = readRequiredValue(args, index, '--state-dir');
      index += 1;
      continue;
    }

    if (value === '--from') {
      throw new UsageError('goal init does not parse markdown paths; use --from-json with a controlled goal-runbook fixture');
    }

    if (value === '--plan-file') {
      throw new UsageError('goal init does not read plan files; repeat the dry-run flags with --confirm --plan-hash');
    }

    if (value === '--output' || value === '-o') {
      throw new UsageError('goal init writes only managed runbook state on confirm; redirect stdout if you need a file');
    }

    if (value.startsWith('--')) {
      throw new UsageError(`unknown goal init option: ${value}`);
    }

    throw new UsageError(`unexpected goal init argument: ${value}`);
  }

  if (options.help) {
    return options;
  }

  if (options.confirm && options.dryRun) {
    throw new UsageError('goal init accepts only one of --dry-run or --confirm');
  }

  if (!options.confirm && options.planHash !== undefined) {
    throw new UsageError('--plan-hash requires --confirm');
  }

  for (const [key, flag] of [
    ['goalId', '--goal'],
    ['fromJson', '--from-json']
  ]) {
    if (options[key] === null) {
      throw new UsageError(`goal init requires ${flag}`);
    }
  }

  return options;
}

function parseGoalPromptArgs(args) {
  const options = {
    stateDir: '.symphony',
    goalId: null,
    taskId: null,
    role: null,
    next: false,
    format: 'json',
    formatExplicit: false,
    help: false
  };

  for (let index = 0; index < args.length; index += 1) {
    const value = args[index];

    if (value === '--help') {
      options.help = true;
      continue;
    }

    if (value === '--json') {
      setGoalPromptFormat(options, 'json');
      continue;
    }

    if (value === '--markdown') {
      setGoalPromptFormat(options, 'markdown');
      continue;
    }

    if (value === '--text') {
      setGoalPromptFormat(options, 'text');
      continue;
    }

    if (value === '--format') {
      setGoalPromptFormat(options, readRequiredValue(args, index, '--format'));
      index += 1;
      continue;
    }

    if (value === '--goal') {
      options.goalId = readRequiredValue(args, index, '--goal');
      index += 1;
      continue;
    }

    if (value === '--task') {
      options.taskId = readRequiredValue(args, index, '--task');
      index += 1;
      continue;
    }

    if (value === '--role') {
      options.role = readRequiredValue(args, index, '--role');
      index += 1;
      continue;
    }

    if (value === '--next') {
      options.next = true;
      continue;
    }

    if (value === '--state-dir') {
      options.stateDir = readRequiredValue(args, index, '--state-dir');
      index += 1;
      continue;
    }

    if (value === '--confirm' || value === '--dry-run' || value === '--plan-hash') {
      throw new UsageError('goal prompt is read-only and does not accept write-flow flags');
    }

    if (value === '--output' || value === '-o') {
      throw new UsageError('goal prompt does not write files; redirect stdout if you need a file');
    }

    if (value.startsWith('--')) {
      throw new UsageError(`unknown goal prompt option: ${value}`);
    }

    throw new UsageError(`unexpected goal prompt argument: ${value}`);
  }

  if (options.help) {
    return options;
  }

  if (options.goalId === null) {
    throw new UsageError('goal prompt requires --goal');
  }

  if (options.next) {
    if (options.taskId !== null || options.role !== null) {
      throw new UsageError('goal prompt --next selects task and role from the resolver; omit --task and --role');
    }

    return options;
  }

  for (const [key, flag] of [
    ['taskId', '--task'],
    ['role', '--role']
  ]) {
    if (options[key] === null) {
      throw new UsageError(`goal prompt requires ${flag} unless --next is used`);
    }
  }

  return options;
}

function setGoalPromptFormat(options, format) {
  if (!['json', 'markdown', 'text'].includes(format)) {
    throw new UsageError('goal prompt format must be json, markdown, or text');
  }

  if (options.formatExplicit && options.format !== format) {
    throw new UsageError('goal prompt accepts only one output format');
  }

  options.format = format;
  options.formatExplicit = true;
}

function parseGoalNextArgs(args) {
  const options = {
    stateDir: '.symphony',
    goalId: null,
    format: 'human',
    formatExplicit: false,
    help: false
  };

  for (let index = 0; index < args.length; index += 1) {
    const value = args[index];

    if (value === '--help') {
      options.help = true;
      continue;
    }

    if (value === '--json') {
      setGoalReadOnlyFormat(options, 'json', 'goal next');
      continue;
    }

    if (value === '--markdown') {
      setGoalReadOnlyFormat(options, 'markdown', 'goal next');
      continue;
    }

    if (value === '--format') {
      setGoalReadOnlyFormat(options, readRequiredValue(args, index, '--format'), 'goal next');
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

    if (value === '--confirm' || value === '--dry-run' || value === '--plan-hash') {
      throw new UsageError('goal next is read-only and does not accept write-flow flags');
    }

    if (value === '--output' || value === '-o') {
      throw new UsageError('goal next does not write files; redirect stdout if you need a file');
    }

    if (value.startsWith('--')) {
      throw new UsageError(`unknown goal next option: ${value}`);
    }

    throw new UsageError(`unexpected goal next argument: ${value}`);
  }

  if (options.help) {
    return options;
  }

  if (options.goalId === null) {
    throw new UsageError('goal next requires --goal');
  }

  return options;
}

function parseGoalCloseoutArgs(args) {
  const options = {
    stateDir: '.symphony',
    goalId: null,
    format: 'human',
    formatExplicit: false,
    help: false
  };

  for (let index = 0; index < args.length; index += 1) {
    const value = args[index];

    if (value === '--help') {
      options.help = true;
      continue;
    }

    if (value === '--json') {
      setGoalReadOnlyFormat(options, 'json', 'goal closeout');
      continue;
    }

    if (value === '--markdown') {
      setGoalReadOnlyFormat(options, 'markdown', 'goal closeout');
      continue;
    }

    if (value === '--format') {
      setGoalReadOnlyFormat(options, readRequiredValue(args, index, '--format'), 'goal closeout');
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

    if (value === '--confirm' || value === '--dry-run' || value === '--plan-hash') {
      throw new UsageError('goal closeout is read-only and does not accept write-flow flags');
    }

    if (value === '--output' || value === '-o') {
      throw new UsageError('goal closeout does not write files; redirect stdout if you need a file');
    }

    if (value.startsWith('--')) {
      throw new UsageError(`unknown goal closeout option: ${value}`);
    }

    throw new UsageError(`unexpected goal closeout argument: ${value}`);
  }

  if (options.help) {
    return options;
  }

  if (options.goalId === null) {
    throw new UsageError('goal closeout requires --goal');
  }

  return options;
}

function setGoalReadOnlyFormat(options, format, commandName) {
  if (!['human', 'json', 'markdown'].includes(format)) {
    throw new UsageError(`${commandName} format must be human, json, or markdown`);
  }

  if (options.formatExplicit && options.format !== format) {
    throw new UsageError(`${commandName} accepts only one output format`);
  }

  options.format = format;
  options.formatExplicit = true;
}

function parseGoalUpdateArgs(args) {
  const options = {
    stateDir: '.symphony',
    goalId: null,
    taskId: null,
    eventType: null,
    actorId: null,
    evidenceRefs: [],
    statement: undefined,
    branch: undefined,
    commit: undefined,
    confirm: false,
    dryRun: false,
    planHash: undefined,
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

    if (value === '--dry-run') {
      options.dryRun = true;
      continue;
    }

    if (value === '--confirm') {
      options.confirm = true;
      continue;
    }

    if (value === '--goal') {
      options.goalId = readRequiredValue(args, index, '--goal');
      index += 1;
      continue;
    }

    if (value === '--task') {
      options.taskId = readRequiredValue(args, index, '--task');
      index += 1;
      continue;
    }

    if (value === '--event') {
      options.eventType = readRequiredValue(args, index, '--event');
      index += 1;
      continue;
    }

    if (value === '--actor') {
      options.actorId = readRequiredValue(args, index, '--actor');
      index += 1;
      continue;
    }

    if (value === '--evidence-ref') {
      options.evidenceRefs.push(readRequiredValue(args, index, '--evidence-ref'));
      index += 1;
      continue;
    }

    if (value === '--statement') {
      options.statement = readRequiredValue(args, index, '--statement');
      index += 1;
      continue;
    }

    if (value === '--branch') {
      options.branch = readRequiredValue(args, index, '--branch');
      index += 1;
      continue;
    }

    if (value === '--commit') {
      options.commit = readRequiredValue(args, index, '--commit');
      index += 1;
      continue;
    }

    if (value === '--plan-hash') {
      options.planHash = readRequiredValue(args, index, '--plan-hash');
      index += 1;
      continue;
    }

    if (value === '--state-dir') {
      options.stateDir = readRequiredValue(args, index, '--state-dir');
      index += 1;
      continue;
    }

    if (value === '--plan-file') {
      throw new UsageError('goal update does not read plan files; repeat the dry-run flags with --confirm --plan-hash');
    }

    if (value === '--output' || value === '-o') {
      throw new UsageError('goal update writes only through confirm append; redirect stdout if you need a file');
    }

    if (value.startsWith('--')) {
      throw new UsageError(`unknown goal update option: ${value}`);
    }

    throw new UsageError(`unexpected goal update argument: ${value}`);
  }

  if (options.help) {
    return options;
  }

  if (options.confirm && options.dryRun) {
    throw new UsageError('goal update accepts only one of --dry-run or --confirm');
  }

  if (!options.confirm && options.planHash !== undefined) {
    throw new UsageError('--plan-hash requires --confirm');
  }

  for (const [key, flag] of [
    ['goalId', '--goal'],
    ['taskId', '--task'],
    ['eventType', '--event'],
    ['actorId', '--actor']
  ]) {
    if (options[key] === null) {
      throw new UsageError(`goal update requires ${flag}`);
    }
  }

  return options;
}

function parseGoalReviewArgs(args) {
  const options = {
    stateDir: '.symphony',
    goalId: null,
    taskId: null,
    reviewerId: null,
    verdict: null,
    evidenceRefs: [],
    failedCommands: [],
    statement: undefined,
    branch: undefined,
    commit: undefined,
    confirm: false,
    dryRun: false,
    planHash: undefined,
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

    if (value === '--dry-run') {
      options.dryRun = true;
      continue;
    }

    if (value === '--confirm') {
      options.confirm = true;
      continue;
    }

    if (value === '--goal') {
      options.goalId = readRequiredValue(args, index, '--goal');
      index += 1;
      continue;
    }

    if (value === '--task') {
      options.taskId = readRequiredValue(args, index, '--task');
      index += 1;
      continue;
    }

    if (value === '--reviewer') {
      options.reviewerId = readRequiredValue(args, index, '--reviewer');
      index += 1;
      continue;
    }

    if (value === '--verdict') {
      options.verdict = readRequiredValue(args, index, '--verdict');
      index += 1;
      continue;
    }

    if (value === '--evidence-ref') {
      options.evidenceRefs.push(readRequiredValue(args, index, '--evidence-ref'));
      index += 1;
      continue;
    }

    if (value === '--failed-command') {
      options.failedCommands.push(readRequiredValue(args, index, '--failed-command'));
      index += 1;
      continue;
    }

    if (value === '--statement') {
      options.statement = readRequiredValue(args, index, '--statement');
      index += 1;
      continue;
    }

    if (value === '--branch') {
      options.branch = readRequiredValue(args, index, '--branch');
      index += 1;
      continue;
    }

    if (value === '--commit') {
      options.commit = readRequiredValue(args, index, '--commit');
      index += 1;
      continue;
    }

    if (value === '--plan-hash') {
      options.planHash = readRequiredValue(args, index, '--plan-hash');
      index += 1;
      continue;
    }

    if (value === '--state-dir') {
      options.stateDir = readRequiredValue(args, index, '--state-dir');
      index += 1;
      continue;
    }

    if (value === '--plan-file') {
      throw new UsageError('goal review does not read plan files; repeat the dry-run flags with --confirm --plan-hash');
    }

    if (value === '--output' || value === '-o') {
      throw new UsageError('goal review writes only through confirm append; redirect stdout if you need a file');
    }

    if (value.startsWith('--')) {
      throw new UsageError(`unknown goal review option: ${value}`);
    }

    throw new UsageError(`unexpected goal review argument: ${value}`);
  }

  if (options.help) {
    return options;
  }

  if (options.confirm && options.dryRun) {
    throw new UsageError('goal review accepts only one of --dry-run or --confirm');
  }

  if (!options.confirm && options.planHash !== undefined) {
    throw new UsageError('--plan-hash requires --confirm');
  }

  for (const [key, flag] of [
    ['goalId', '--goal'],
    ['taskId', '--task'],
    ['reviewerId', '--reviewer'],
    ['verdict', '--verdict']
  ]) {
    if (options[key] === null) {
      throw new UsageError(`goal review requires ${flag}`);
    }
  }

  return options;
}

function parseGoalGateArgs(args) {
  const options = {
    stateDir: '.symphony',
    goalId: null,
    gateName: null,
    taskId: null,
    status: null,
    verifierId: null,
    evidenceRefs: [],
    failedCommands: [],
    statement: undefined,
    branch: undefined,
    commit: undefined,
    confirm: false,
    dryRun: false,
    planHash: undefined,
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

    if (value === '--dry-run') {
      options.dryRun = true;
      continue;
    }

    if (value === '--confirm') {
      options.confirm = true;
      continue;
    }

    if (value === '--goal') {
      options.goalId = readRequiredValue(args, index, '--goal');
      index += 1;
      continue;
    }

    if (value === '--gate') {
      options.gateName = readRequiredValue(args, index, '--gate');
      index += 1;
      continue;
    }

    if (value === '--task') {
      options.taskId = readRequiredValue(args, index, '--task');
      index += 1;
      continue;
    }

    if (value === '--status') {
      options.status = readRequiredValue(args, index, '--status');
      index += 1;
      continue;
    }

    if (value === '--verifier') {
      options.verifierId = readRequiredValue(args, index, '--verifier');
      index += 1;
      continue;
    }

    if (value === '--evidence-ref') {
      options.evidenceRefs.push(readRequiredValue(args, index, '--evidence-ref'));
      index += 1;
      continue;
    }

    if (value === '--failed-command') {
      options.failedCommands.push(readRequiredValue(args, index, '--failed-command'));
      index += 1;
      continue;
    }

    if (value === '--statement') {
      options.statement = readRequiredValue(args, index, '--statement');
      index += 1;
      continue;
    }

    if (value === '--branch') {
      options.branch = readRequiredValue(args, index, '--branch');
      index += 1;
      continue;
    }

    if (value === '--commit') {
      options.commit = readRequiredValue(args, index, '--commit');
      index += 1;
      continue;
    }

    if (value === '--plan-hash') {
      options.planHash = readRequiredValue(args, index, '--plan-hash');
      index += 1;
      continue;
    }

    if (value === '--state-dir') {
      options.stateDir = readRequiredValue(args, index, '--state-dir');
      index += 1;
      continue;
    }

    if (value === '--plan-file') {
      throw new UsageError('goal gate does not read plan files; repeat the dry-run flags with --confirm --plan-hash');
    }

    if (value === '--output' || value === '-o') {
      throw new UsageError('goal gate writes only through confirm append; redirect stdout if you need a file');
    }

    if (value.startsWith('--')) {
      throw new UsageError(`unknown goal gate option: ${value}`);
    }

    throw new UsageError(`unexpected goal gate argument: ${value}`);
  }

  if (options.help) {
    return options;
  }

  if (options.confirm && options.dryRun) {
    throw new UsageError('goal gate accepts only one of --dry-run or --confirm');
  }

  if (!options.confirm && options.planHash !== undefined) {
    throw new UsageError('--plan-hash requires --confirm');
  }

  for (const [key, flag] of [
    ['goalId', '--goal'],
    ['gateName', '--gate'],
    ['status', '--status'],
    ['verifierId', '--verifier']
  ]) {
    if (options[key] === null) {
      throw new UsageError(`goal gate requires ${flag}`);
    }
  }

  return options;
}

function parseGoalStatusArgs(args) {
  const options = {
    stateDir: '.symphony',
    goalId: 'latest',
    format: 'human',
    formatExplicit: false,
    help: false
  };

  for (let index = 0; index < args.length; index += 1) {
    const value = args[index];

    if (value === '--help') {
      options.help = true;
      continue;
    }

    if (value === '--json') {
      setGoalStatusFormat(options, 'json');
      continue;
    }

    if (value === '--markdown') {
      setGoalStatusFormat(options, 'markdown');
      continue;
    }

    if (value === '--format') {
      setGoalStatusFormat(options, readRequiredValue(args, index, '--format'));
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

    if (value === '--output' || value === '-o') {
      throw new UsageError('goal-status does not write files; redirect stdout if you need a file');
    }

    if (value.startsWith('--')) {
      throw new UsageError(`unknown goal-status option: ${value}`);
    }

    throw new UsageError(`unexpected goal-status argument: ${value}`);
  }

  return options;
}

function setGoalStatusFormat(options, format) {
  if (!['human', 'json', 'markdown'].includes(format)) {
    throw new UsageError('goal-status format must be human, json, or markdown');
  }

  if (options.formatExplicit && options.format !== format) {
    throw new UsageError('goal-status accepts only one output format');
  }

  options.format = format;
  options.formatExplicit = true;
}

function goalHelpText() {
  return [
    'Usage: symphony goal <init|update|review|gate|prompt|next|closeout> [options]',
    '',
    'Manages goal runbooks and records goal events through dry-run / confirm flows.',
    'Currently implemented: symphony goal init, symphony goal update, symphony goal review, symphony goal gate, symphony goal prompt, symphony goal next, and symphony goal closeout.',
    ''
  ].join('\n');
}

function goalInitHelpText() {
  return [
    'Usage: symphony goal init --goal <goal-id> --from-json fixtures/contracts/goal-runbook.valid.v1.json [--dry-run]',
    '       symphony goal init --goal <goal-id> --from-json fixtures/contracts/goal-runbook.valid.v1.json --confirm --plan-hash <hash>',
    '',
    'Dry-run is the default and prints goal-runbook-init-plan.v1 without writing.',
    'Confirm writes only managed runbook registry state after the current input matches --plan-hash.',
    ''
  ].join('\n');
}

function goalPromptHelpText() {
  return [
    'Usage: symphony goal prompt --goal <goal-id> --task <task-id> --role <worker|reviewer|main-verifier|release-manager> [--json|--markdown|--text|--format json|markdown|text]',
    '       symphony goal prompt --goal latest --next [--json|--markdown|--text|--format json|markdown|text]',
    '',
    'JSON is the default and prints goal-prompt-pack.v1.',
    'Markdown and text print only the copy-only /goal prompt text; neither mode writes files, registers events, runs commands, or calls models.',
    ''
  ].join('\n');
}

function goalNextHelpText() {
  return [
    'Usage: symphony goal next --goal <goal-id|latest> [--json|--markdown|--format human|json|markdown]',
    '',
    'Prints read-only goal-next-action.v1 from the managed runbook, event log, and ledger.',
    'The command does not execute prompts, run release gates, write evidence docs, register events, or call models.',
    ''
  ].join('\n');
}

function goalCloseoutHelpText() {
  return [
    'Usage: symphony goal closeout --goal <goal-id|latest> [--json|--markdown|--format human|json|markdown]',
    '',
    'Prints read-only goal-closeout-report.v1 with missing evidence and release gate gaps.',
    'The command does not run release gates, write release evidence docs, register events, or infer release readiness from passed tests.',
    ''
  ].join('\n');
}

function goalUpdateHelpText() {
  return [
    'Usage: symphony goal update --goal <goal-id> --task <task-id> --event <event-type> --actor <actor-id> [--evidence-ref <ref>] [--dry-run]',
    '       symphony goal update --goal <goal-id> --task <task-id> --event <event-type> --actor <actor-id> [--evidence-ref <ref>] --confirm --plan-hash <hash>',
    '',
    'Dry-run is the default and prints goal-update-plan.v1 without writing.',
    'Confirm appends one worker/task-level event only after the current input matches --plan-hash.',
    ''
  ].join('\n');
}

function goalReviewHelpText() {
  return [
    'Usage: symphony goal review --goal <goal-id> --task <task-id> --reviewer <reviewer-id> --verdict <approved|needs-revision> --evidence-ref <ref> [--failed-command <cmd>] [--dry-run]',
    '       symphony goal review --goal <goal-id> --task <task-id> --reviewer <reviewer-id> --verdict <approved|needs-revision> --evidence-ref <ref> [--failed-command <cmd>] --confirm --plan-hash <hash>',
    '',
    'Dry-run is the default and prints goal-update-plan.v1 without writing.',
    'Confirm appends one reviewer verdict event only after the current input matches --plan-hash.',
    ''
  ].join('\n');
}

function goalGateHelpText() {
  return [
    'Usage: symphony goal gate --goal <goal-id> --gate <main-verification|release.gate|release.ready> --status <passed|failed|declared> --verifier <verifier-id> --evidence-ref <ref> [--failed-command <cmd>] [--task <task-id>] [--dry-run]',
    '       symphony goal gate --goal <goal-id> --gate <main-verification|release.gate|release.ready> --status <passed|failed|declared> --verifier <verifier-id> --evidence-ref <ref> [--failed-command <cmd>] [--task <task-id>] --confirm --plan-hash <hash>',
    '',
    'Dry-run is the default and prints goal-update-plan.v1 without writing.',
    'Confirm appends one main verification, release gate, or release readiness event only after the current input matches --plan-hash.',
    ''
  ].join('\n');
}

function goalStatusHelpText() {
  return [
    'Usage: symphony goal-status [--json|--markdown|--format human|json|markdown] [--goal <goal-id>]',
    '',
    'Prints the read-only v17 goal-progress-ledger.v1 contract.',
    'The command reads registered goal state only; it does not write files, run checks, call models, or execute goal tasks.',
    ''
  ].join('\n');
}

function renderGoalNextActionText(nextAction) {
  const lines = [
    `Goal: ${nextAction.goalId}`,
    `Status: ${nextAction.status}`
  ];

  if (nextAction.next === null) {
    lines.push(`Reason: ${nextAction.reason ?? 'none'}`);
  } else {
    lines.push(
      `Next: ${nextAction.next.taskId} ${nextAction.next.role} (${nextAction.next.phase})`,
      `Reason: ${nextAction.next.reason}`,
      `Prompt: ${commandForGoalNextAction(nextAction)}`,
      `After: ${nextAction.afterCompletion.registerWith} [${nextAction.afterCompletion.allowedEvents.join('|')}]`
    );
  }

  if (nextAction.copyOnlyCommands.length > 0) {
    lines.push('Commands:');
    lines.push(...nextAction.copyOnlyCommands.map((command) => `- ${command}`));
  }

  return `${lines.join('\n')}\n`;
}

function renderGoalNextActionMarkdown(nextAction) {
  const lines = [
    '# Goal Next Action',
    '',
    `- Goal: \`${nextAction.goalId}\``,
    `- Status: \`${nextAction.status}\``
  ];

  if (nextAction.next === null) {
    lines.push(`- Reason: ${nextAction.reason ?? 'none'}`);
  } else {
    lines.push(
      `- Task: \`${nextAction.next.taskId}\``,
      `- Role: \`${nextAction.next.role}\``,
      `- Phase: \`${nextAction.next.phase}\``,
      `- Reason: ${nextAction.next.reason}`,
      `- Prompt: \`${commandForGoalNextAction(nextAction)}\``,
      `- After: \`${nextAction.afterCompletion.registerWith}\``
    );
  }

  lines.push('', '## Copy-only Commands');

  if (nextAction.copyOnlyCommands.length === 0) {
    lines.push('- none');
  } else {
    lines.push(...nextAction.copyOnlyCommands.map((command) => `- \`${command}\``));
  }

  lines.push('', '## Allowed Events');

  if (nextAction.afterCompletion.allowedEvents.length === 0) {
    lines.push('- none');
  } else {
    lines.push(...nextAction.afterCompletion.allowedEvents.map((event) => `- \`${event}\``));
  }

  return `${lines.join('\n')}\n`;
}

function renderGoalCloseoutReportText(report) {
  const lines = [
    `Goal: ${report.goalId}`,
    `Tasks: ${report.summary.totalTasks}`,
    `Worker evidence complete: ${report.summary.workerEvidenceComplete ? 'yes' : 'no'}`,
    `Review evidence complete: ${report.summary.reviewEvidenceComplete ? 'yes' : 'no'}`,
    `Main verification complete: ${report.summary.mainVerificationComplete ? 'yes' : 'no'}`,
    `Release ready: ${report.summary.releaseReady ? 'yes' : 'no'}`,
    'Missing:'
  ];

  if (report.missing.length === 0) {
    lines.push('- none');
  } else {
    lines.push(...report.missing.map((item) => {
      const target = item.gateId ?? item.taskId ?? 'release';
      const status = item.status === undefined ? '' : ` (${item.status})`;

      return `- ${item.kind}: ${target} expects ${item.expectedEvent}${status}`;
    }));
  }

  lines.push(`Next: ${report.nextAction}`);

  return `${lines.join('\n')}\n`;
}

function commandForGoalNextAction(goalNextAction) {
  if (goalNextAction.next !== null) {
    return `symphony goal prompt --goal ${goalNextAction.goalId} --next --markdown`;
  }

  return goalNextAction.copyOnlyCommands[0] ?? `symphony goal next --goal ${goalNextAction.goalId}`;
}
