import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join, resolve } from 'node:path';

export const INSTALL_STATUS_CONTRACT_NAME = 'installStatus.v1';
export const INSTALL_UPGRADE_PLAN_CONTRACT_NAME = 'installUpgradePlan.v1';
export const INSTALLER_UPGRADE_CONTRACT_VERSION = 1;
export const DEFAULT_INSTALL_REF = 'v8';
export const DEFAULT_REPO_SLUG = 'Andy20010101/multi-coding-agent-symphony';

export const INSTALLER_BOUNDARIES = Object.freeze({
  readOnly: true,
  willMutate: false,
  networkFetchAvailable: false,
  checkoutAvailable: false,
  dependencyInstallAvailable: false,
  overwriteAvailable: false,
  rendererNetworkFetchAvailable: false,
  workbenchExecutionAvailable: false,
  gitReleaseAutomationAvailable: false
});

const SAFE_REF_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._/-]*$/u;

export function buildInstallStatus(options = {}) {
  const resolved = resolveInstallOptions(options);
  const repo = inspectInstallRepository(resolved.installDir, options.runCommand);
  const shims = inspectShims(resolved.binDir);
  const blockedReasons = [];

  if (!repo.exists) {
    blockedReasons.push('install-dir-missing');
  } else if (!repo.isGitCheckout) {
    blockedReasons.push('install-dir-not-git-checkout');
  }

  if (!isSafeRef(resolved.targetRef)) {
    blockedReasons.push('unsafe-target-ref');
  }

  return {
    contractName: INSTALL_STATUS_CONTRACT_NAME,
    contractVersion: INSTALLER_UPGRADE_CONTRACT_VERSION,
    generatedAt: normalizedDate(options.generatedAt),
    state: blockedReasons.length === 0 ? 'ready' : 'blocked',
    installDir: {
      path: resolved.installDir,
      exists: repo.exists,
      isGitCheckout: repo.isGitCheckout,
      dirty: repo.dirty,
      topLevel: repo.topLevel
    },
    repository: {
      slug: resolved.repoSlug,
      url: resolved.repoUrl,
      originUrl: repo.originUrl
    },
    current: {
      ref: repo.currentRef,
      commit: repo.currentCommit
    },
    target: {
      ref: resolved.targetRef,
      availableLocally: repo.isGitCheckout ? refAvailable(resolved.installDir, resolved.targetRef, options.runCommand) : false
    },
    binaryDir: {
      path: resolved.binDir
    },
    shims,
    doctor: {
      status: shims.symphony.exists ? 'available-not-run' : 'missing-shim',
      commandText: `${join(resolved.binDir, 'symphony')} doctor`,
      copyOnly: true,
      willRun: false
    },
    blockedReasons,
    boundaries: { ...INSTALLER_BOUNDARIES },
    readOnly: true,
    willMutate: false
  };
}

export function buildInstallUpgradePlan(options = {}) {
  const resolved = resolveInstallOptions(options);
  const repo = inspectInstallRepository(resolved.installDir, options.runCommand);
  const nodeCheck = checkNodeVersion(options.nodeVersion ?? process.versions.node);
  const pnpmCheck = checkCommandAvailable('pnpm', options.runCommand);
  const targetRefSafe = isSafeRef(resolved.targetRef);
  const rollbackRef = firstNonEmptyString(
    resolved.rollbackRef,
    repo.currentRef,
    repo.currentCommit,
    DEFAULT_INSTALL_REF
  );
  const rollbackRefSafe = isSafeRef(rollbackRef);
  const targetAvailable = repo.isGitCheckout && targetRefSafe
    ? refAvailable(resolved.installDir, resolved.targetRef, options.runCommand)
    : false;
  const rollbackAvailable = repo.isGitCheckout && rollbackRefSafe
    ? refAvailable(resolved.installDir, rollbackRef, options.runCommand)
    : false;
  const blockedReasons = [];

  if (!repo.exists) {
    blockedReasons.push('install-dir-missing');
  } else if (!repo.isGitCheckout) {
    blockedReasons.push('install-dir-not-git-checkout');
  }

  if (repo.dirty) {
    blockedReasons.push('dirty-install-dir');
  }

  if (!nodeCheck.ok) {
    blockedReasons.push('node-version-too-old');
  }

  if (!pnpmCheck.available) {
    blockedReasons.push('pnpm-missing');
  }

  if (!targetRefSafe) {
    blockedReasons.push('unsafe-target-ref');
  } else if (!targetAvailable) {
    blockedReasons.push('target-ref-not-available-locally');
  }

  if (!rollbackRefSafe) {
    blockedReasons.push('unsafe-rollback-ref');
  } else if (!rollbackAvailable) {
    blockedReasons.push('rollback-ref-not-available-locally');
  }

  return {
    contractName: INSTALL_UPGRADE_PLAN_CONTRACT_NAME,
    contractVersion: INSTALLER_UPGRADE_CONTRACT_VERSION,
    generatedAt: normalizedDate(options.generatedAt),
    state: blockedReasons.length === 0 ? 'ready' : 'blocked',
    dryRun: true,
    installDir: {
      path: resolved.installDir,
      exists: repo.exists,
      isGitCheckout: repo.isGitCheckout,
      dirty: repo.dirty,
      topLevel: repo.topLevel
    },
    repository: {
      slug: resolved.repoSlug,
      url: resolved.repoUrl,
      originUrl: repo.originUrl
    },
    current: {
      ref: repo.currentRef,
      commit: repo.currentCommit
    },
    target: {
      ref: resolved.targetRef,
      availableLocally: targetAvailable
    },
    rollback: {
      ref: rollbackRef,
      availableLocally: rollbackAvailable
    },
    checks: {
      dirtyInstallDir: {
        ok: !repo.dirty,
        dirty: repo.dirty
      },
      nodeVersion: nodeCheck,
      pnpm: pnpmCheck,
      targetRef: {
        ok: targetRefSafe && targetAvailable,
        ref: resolved.targetRef,
        safe: targetRefSafe,
        availableLocally: targetAvailable
      },
      rollbackRef: {
        ok: rollbackRefSafe && rollbackAvailable,
        ref: rollbackRef,
        safe: rollbackRefSafe,
        availableLocally: rollbackAvailable
      }
    },
    doctor: {
      commandText: `${join(resolved.binDir, 'symphony')} doctor`,
      copyOnly: true,
      willRun: false
    },
    plannedMutations: [],
    manualActionRequired: true,
    blockedReasons,
    boundaries: { ...INSTALLER_BOUNDARIES },
    readOnly: true,
    willMutate: false
  };
}

export function renderInstallStatusText(status) {
  return [
    `Install status: ${status.state}`,
    `Install dir: ${status.installDir.path}`,
    `Current ref: ${status.current.ref ?? 'unknown'}`,
    `Current commit: ${status.current.commit ?? 'unknown'}`,
    `Target ref: ${status.target.ref}`,
    `Target available locally: ${status.target.availableLocally ? 'yes' : 'no'}`,
    `Binary dir: ${status.binaryDir.path}`,
    `Doctor: ${status.doctor.status}`,
    `Doctor command: ${status.doctor.commandText}`,
    `Blocked: ${status.blockedReasons.length === 0 ? 'none' : status.blockedReasons.join(', ')}`
  ].join('\n');
}

export function renderInstallUpgradePlanText(plan) {
  return [
    `Upgrade dry-run: ${plan.state}`,
    `Install dir: ${plan.installDir.path}`,
    `Current ref: ${plan.current.ref ?? 'unknown'}`,
    `Current commit: ${plan.current.commit ?? 'unknown'}`,
    `Target ref: ${plan.target.ref}`,
    `Rollback ref: ${plan.rollback.ref}`,
    `Node: ${plan.checks.nodeVersion.ok ? 'ok' : 'blocked'} (${plan.checks.nodeVersion.version})`,
    `pnpm: ${plan.checks.pnpm.available ? 'available' : 'missing'}`,
    `Dirty install dir: ${plan.checks.dirtyInstallDir.dirty ? 'yes' : 'no'}`,
    `Doctor command: ${plan.doctor.commandText}`,
    `Planned mutations: ${plan.plannedMutations.length}`,
    `Blocked: ${plan.blockedReasons.length === 0 ? 'none' : plan.blockedReasons.join(', ')}`
  ].join('\n');
}

export function resolveInstallOptions({
  env = process.env,
  installDir,
  binDir,
  repoSlug,
  repoUrl,
  targetRef,
  rollbackRef
} = {}) {
  const resolvedRepoSlug = firstNonEmptyString(repoSlug, env.MCAS_REPO_SLUG, DEFAULT_REPO_SLUG);

  return {
    repoSlug: resolvedRepoSlug,
    repoUrl: firstNonEmptyString(repoUrl, env.MCAS_REPO_URL, `https://github.com/${resolvedRepoSlug}.git`),
    targetRef: firstNonEmptyString(targetRef, env.MCAS_INSTALL_REF, DEFAULT_INSTALL_REF),
    rollbackRef: firstNonEmptyString(rollbackRef, env.MCAS_ROLLBACK_REF, null),
    installDir: resolve(firstNonEmptyString(installDir, env.MCAS_INSTALL_DIR, join(homeDir(env), '.local/share/mcas'))),
    binDir: resolve(firstNonEmptyString(binDir, env.MCAS_BIN_DIR, join(homeDir(env), '.local/bin')))
  };
}

export function isSafeRef(ref) {
  return typeof ref === 'string'
    && SAFE_REF_PATTERN.test(ref)
    && !ref.startsWith('-')
    && !ref.includes('..')
    && !ref.includes('//')
    && !ref.includes('@{');
}

function inspectInstallRepository(installDir, runCommand = defaultRunCommand) {
  const exists = existsSync(installDir);

  if (!exists) {
    return {
      exists: false,
      isGitCheckout: false,
      dirty: false,
      topLevel: null,
      currentRef: null,
      currentCommit: null,
      originUrl: null
    };
  }

  const topLevel = runGit(installDir, ['rev-parse', '--show-toplevel'], runCommand);
  const isGitCheckout = topLevel.ok;

  if (!isGitCheckout) {
    return {
      exists: true,
      isGitCheckout: false,
      dirty: false,
      topLevel: null,
      currentRef: null,
      currentCommit: null,
      originUrl: null
    };
  }

  const currentRef = firstNonEmptyString(
    runGit(installDir, ['symbolic-ref', '--quiet', '--short', 'HEAD'], runCommand).stdout,
    runGit(installDir, ['describe', '--tags', '--exact-match'], runCommand).stdout,
    null
  );
  const currentCommit = firstNonEmptyString(
    runGit(installDir, ['rev-parse', 'HEAD'], runCommand).stdout,
    null
  );
  const status = runGit(installDir, ['status', '--porcelain'], runCommand);
  const originUrl = firstNonEmptyString(
    runGit(installDir, ['config', '--get', 'remote.origin.url'], runCommand).stdout,
    null
  );

  return {
    exists: true,
    isGitCheckout: true,
    dirty: status.ok && status.stdout.trim() !== '',
    topLevel: firstNonEmptyString(topLevel.stdout, null),
    currentRef,
    currentCommit,
    originUrl
  };
}

function inspectShims(binDir) {
  const symphony = join(binDir, 'symphony');
  const mcas = join(binDir, 'mcas');

  return {
    symphony: {
      path: symphony,
      exists: existsSync(symphony)
    },
    mcas: {
      path: mcas,
      exists: existsSync(mcas)
    }
  };
}

function refAvailable(installDir, ref, runCommand = defaultRunCommand) {
  if (!isSafeRef(ref)) {
    return false;
  }

  return runGit(installDir, ['rev-parse', '--verify', '--quiet', `${ref}^{commit}`], runCommand).ok;
}

function checkNodeVersion(version) {
  const major = Number.parseInt(String(version).split('.')[0] ?? '', 10);

  return {
    ok: Number.isInteger(major) && major >= 20,
    version: String(version)
  };
}

function checkCommandAvailable(command, runCommand = defaultRunCommand) {
  const result = runCommand(command, ['--version'], {});

  return {
    available: result.status === 0,
    command,
    version: result.status === 0 ? result.stdout.trim().split(/\s+/u)[0] ?? null : null
  };
}

function runGit(installDir, args, runCommand = defaultRunCommand) {
  const result = runCommand('git', ['-C', installDir, ...args], {});

  return {
    ...result,
    ok: result.status === 0,
    stdout: result.stdout ?? '',
    stderr: result.stderr ?? ''
  };
}

function defaultRunCommand(command, args, options) {
  const result = spawnSync(command, args, {
    ...options,
    encoding: 'utf8'
  });

  return {
    ok: (result.status ?? 1) === 0,
    status: result.status ?? 1,
    stdout: result.stdout ?? '',
    stderr: result.stderr ?? ''
  };
}

function firstNonEmptyString(...values) {
  for (const value of values) {
    if (typeof value === 'string' && value.trim() !== '') {
      return value.trim();
    }
  }

  return null;
}

function normalizedDate(value) {
  return new Date(value ?? Date.now()).toISOString();
}

function homeDir(env) {
  return firstNonEmptyString(env.HOME, process.cwd());
}
