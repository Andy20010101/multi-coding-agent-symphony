#!/usr/bin/env node

import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { NodeProcessRunner } from '../src/process-runner.js';
import { fetchGitHubIssueTaskSpec } from '../src/trackers/github-intake.js';

const EXIT_CODES = {
  ok: 0,
  failure: 1,
  usage: 64
};

const COMMANDS = [
  'doctor',
  'github issue'
];

export async function runMcasCli({
  argv = process.argv.slice(2),
  stdout = process.stdout,
  stderr = process.stderr,
  runner
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

function toPositiveInteger(value, field) {
  const number = Number.parseInt(value, 10);

  if (!Number.isInteger(number) || number < 1 || String(number) !== value) {
    throw new UsageError(`${field} must be a positive integer`);
  }

  return number;
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
  const exitCode = await runMcasCli();
  process.exitCode = exitCode;
}
