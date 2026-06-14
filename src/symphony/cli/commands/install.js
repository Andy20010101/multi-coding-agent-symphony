import {
  buildInstallStatus,
  buildInstallUpgradePlan,
  renderInstallStatusText,
  renderInstallUpgradePlanText
} from '../../installer-upgrade-baseline.js';
import { UsageError, readRequiredValue } from '../errors.js';
import { writeJson } from '../output.js';

export async function runInstallCommand({ args, stdout, env = process.env } = {}) {
  const [subcommand, ...rest] = args;

  if (subcommand === 'status') {
    const options = parseInstallOptions(rest, { requireDryRun: false, requireTargetRef: false });
    const contract = buildInstallStatus({ ...options, env });

    if (options.json) {
      writeJson(stdout, contract);
    } else {
      stdout.write(`${renderInstallStatusText(contract)}\n`);
    }

    return 0;
  }

  if (subcommand === 'upgrade') {
    const options = parseInstallOptions(rest, { requireDryRun: true, requireTargetRef: true });
    const contract = buildInstallUpgradePlan({ ...options, env });

    if (options.json) {
      writeJson(stdout, contract);
    } else {
      stdout.write(`${renderInstallUpgradePlanText(contract)}\n`);
    }

    return 0;
  }

  throw new UsageError('install subcommand must be status or upgrade');
}

function parseInstallOptions(args, { requireDryRun, requireTargetRef }) {
  const options = {
    json: false,
    dryRun: false,
    installDir: undefined,
    binDir: undefined,
    repoSlug: undefined,
    repoUrl: undefined,
    targetRef: undefined,
    rollbackRef: undefined
  };

  for (let index = 0; index < args.length; index += 1) {
    const value = args[index];

    if (value === '--json') {
      options.json = true;
      continue;
    }

    if (value === '--dry-run') {
      options.dryRun = true;
      continue;
    }

    if (value === '--install-dir') {
      options.installDir = readRequiredValue(args, index, '--install-dir');
      index += 1;
      continue;
    }

    if (value === '--bin-dir') {
      options.binDir = readRequiredValue(args, index, '--bin-dir');
      index += 1;
      continue;
    }

    if (value === '--repo-slug') {
      options.repoSlug = readRequiredValue(args, index, '--repo-slug');
      index += 1;
      continue;
    }

    if (value === '--repo-url') {
      options.repoUrl = readRequiredValue(args, index, '--repo-url');
      index += 1;
      continue;
    }

    if (value === '--target-ref') {
      options.targetRef = readRequiredValue(args, index, '--target-ref');
      index += 1;
      continue;
    }

    if (value === '--rollback-ref') {
      options.rollbackRef = readRequiredValue(args, index, '--rollback-ref');
      index += 1;
      continue;
    }

    throw new UsageError(`unknown install option: ${value}`);
  }

  if (requireDryRun && !options.dryRun) {
    throw new UsageError('install upgrade is dry-run only; pass --dry-run');
  }

  if (requireTargetRef && options.targetRef === undefined) {
    throw new UsageError('install upgrade requires --target-ref');
  }

  return options;
}
