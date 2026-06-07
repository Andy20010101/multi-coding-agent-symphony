import { access } from 'node:fs/promises';
import { isAbsolute, join, relative, resolve, sep } from 'node:path';

export const WORKSPACE_EVIDENCE_SAFETY_CONTRACT_NAME = 'workspace-evidence-safety.v1';
export const WORKSPACE_EVIDENCE_SAFETY_CONTRACT_VERSION = 1;
export const DEFAULT_DEPENDENCY_SETUP_COMMAND = 'pnpm install --offline --frozen-lockfile';

export async function inspectDependencyReadiness({
  worktree,
  setupCommand = DEFAULT_DEPENDENCY_SETUP_COMMAND
}) {
  const resolvedWorktree = requireAbsolutePath(worktree, 'worktree');
  const packageJson = await pathExists(join(resolvedWorktree, 'package.json'));
  const nodeModules = await pathExists(join(resolvedWorktree, 'node_modules'));
  const pnpmVirtualStore = await pathExists(join(resolvedWorktree, 'node_modules/.pnpm'));

  const status = packageJson === false
    ? 'no-package-json'
    : nodeModules === true && pnpmVirtualStore === true
      ? 'ready'
      : 'missing-node-modules';

  return {
    contractName: WORKSPACE_EVIDENCE_SAFETY_CONTRACT_NAME,
    contractVersion: WORKSPACE_EVIDENCE_SAFETY_CONTRACT_VERSION,
    worktree: resolvedWorktree,
    packageJson,
    nodeModules,
    pnpmVirtualStore,
    status,
    dispatchAllowed: status === 'ready' || status === 'no-package-json',
    setup: status === 'missing-node-modules'
      ? {
        required: true,
        command: setupCommand,
        deterministic: true,
        offline: setupCommand.includes('--offline')
      }
      : {
        required: false,
        command: null,
        deterministic: true,
        offline: null
      }
  };
}

export async function prepareWorkspaceForDispatch({
  worktree,
  runSetup = null,
  setupCommand = DEFAULT_DEPENDENCY_SETUP_COMMAND
}) {
  const before = await inspectDependencyReadiness({
    worktree,
    setupCommand
  });

  if (before.dispatchAllowed === true) {
    return {
      status: 'ready',
      dispatchAllowed: true,
      before,
      setupAttempt: null,
      after: before,
      blocker: null
    };
  }

  if (typeof runSetup !== 'function') {
    return {
      status: 'blocked',
      dispatchAllowed: false,
      before,
      setupAttempt: null,
      after: before,
      blocker: workspaceDependencyBlocker({
        reason: 'workspace-dependency-setup-required',
        command: setupCommand,
        before
      })
    };
  }

  const setupAttempt = normalizeSetupAttempt(await runSetup({
    command: setupCommand,
    cwd: before.worktree
  }), setupCommand);

  const after = setupAttempt.ok === true
    ? await inspectDependencyReadiness({
      worktree,
      setupCommand
    })
    : before;

  if (setupAttempt.ok === true && after.dispatchAllowed === true) {
    return {
      status: 'ready',
      dispatchAllowed: true,
      before,
      setupAttempt,
      after,
      blocker: null
    };
  }

  return {
    status: 'blocked',
    dispatchAllowed: false,
    before,
    setupAttempt,
    after,
    blocker: workspaceDependencyBlocker({
      reason: 'workspace-dependency-setup-failed',
      command: setupCommand,
      before,
      after,
      setupAttempt
    })
  };
}

export function recordDirtyBaselineInheritance({
  sourceTaskId,
  sourceWorktree,
  targetWorktree,
  branch,
  baseCommit,
  copied = [],
  deleted = [],
  dependencySetup = null
}) {
  return {
    contractName: 'workspace-dirty-baseline-inheritance.v1',
    contractVersion: 1,
    verified: true,
    sourceTaskId: requireNonEmptyString(sourceTaskId, 'sourceTaskId'),
    sourceWorktree: requireAbsolutePath(sourceWorktree, 'sourceWorktree'),
    targetWorktree: requireAbsolutePath(targetWorktree, 'targetWorktree'),
    branch: requireNonEmptyString(branch, 'branch'),
    baseCommit: requireNonEmptyString(baseCommit, 'baseCommit'),
    copied: normalizePathList(copied, 'copied'),
    deleted: normalizePathList(deleted, 'deleted'),
    dependencySetup
  };
}

export function collectFileInventoryFromGitStatus({
  worktree,
  porcelain
}) {
  const inventory = {
    contractName: 'workspace-file-inventory.v1',
    contractVersion: 1,
    worktree: requireAbsolutePath(worktree, 'worktree'),
    trackedModifications: [],
    stagedChanges: [],
    deletions: [],
    untrackedFiles: []
  };

  for (const entry of parseGitPorcelain(porcelain)) {
    if (entry.untracked === true) {
      inventory.untrackedFiles.push(entry.path);
      continue;
    }

    if (entry.indexStatus.trim() !== '') {
      inventory.stagedChanges.push({
        path: entry.path,
        status: entry.indexStatus
      });
    }

    if (entry.worktreeStatus.trim() !== '') {
      inventory.trackedModifications.push({
        path: entry.path,
        status: entry.worktreeStatus
      });
    }

    if (entry.indexStatus === 'D' || entry.worktreeStatus === 'D') {
      inventory.deletions.push({
        path: entry.path,
        staged: entry.indexStatus === 'D',
        unstaged: entry.worktreeStatus === 'D'
      });
    }
  }

  return inventory;
}

export function buildRootCheckoutMutationGuard({
  rootCheckout,
  beforeInventory,
  afterInventory
}) {
  const beforeFingerprint = stableFingerprint(beforeInventory);
  const afterFingerprint = stableFingerprint(afterInventory);
  const mutated = beforeFingerprint !== afterFingerprint;

  return {
    contractName: 'root-checkout-mutation-guard.v1',
    contractVersion: 1,
    rootCheckout: requireAbsolutePath(rootCheckout, 'rootCheckout'),
    beforeFingerprint,
    afterFingerprint,
    mutated,
    eventRegistrationAllowed: mutated !== true,
    blocker: mutated === true
      ? {
        id: 'root-checkout-mutated',
        reason: 'Root checkout changed during the child phase; inspect and recover before event registration.'
      }
      : null
  };
}

export async function validateEvidenceLocation({
  assignedWorktree,
  rootCheckout = null,
  evidenceRef,
  fileExists = pathExists
}) {
  const worktree = requireAbsolutePath(assignedWorktree, 'assignedWorktree');
  const ref = requireNonEmptyString(evidenceRef, 'evidenceRef');

  if (ref.includes('\0')) {
    return invalidEvidenceLocation('evidence-ref-invalid-path', worktree, rootCheckout, ref);
  }

  const evidencePath = isAbsolute(ref)
    ? resolve(ref)
    : resolve(worktree, ref);

  if (!pathInsideOrEqual(evidencePath, worktree)) {
    return invalidEvidenceLocation('evidence-outside-assigned-worktree', worktree, rootCheckout, ref, evidencePath);
  }

  const existsInAssignedWorktree = await fileExists(evidencePath);
  const rootEvidencePath = rootCheckout === null
    ? null
    : resolve(requireAbsolutePath(rootCheckout, 'rootCheckout'), ref);
  const existsInRootCheckout = rootEvidencePath === null
    ? false
    : await fileExists(rootEvidencePath);

  if (existsInAssignedWorktree !== true && existsInRootCheckout === true) {
    return invalidEvidenceLocation('evidence-only-in-root-checkout', worktree, rootCheckout, ref, evidencePath, {
      rootEvidencePath
    });
  }

  if (existsInAssignedWorktree !== true) {
    return invalidEvidenceLocation('evidence-missing-in-assigned-worktree', worktree, rootCheckout, ref, evidencePath, {
      rootEvidencePath
    });
  }

  return {
    contractName: 'workspace-evidence-location-validation.v1',
    contractVersion: 1,
    valid: true,
    eventRegistrationAllowed: true,
    assignedWorktree: worktree,
    rootCheckout,
    evidenceRef: ref,
    evidencePath,
    existsInAssignedWorktree,
    existsInRootCheckout,
    blocker: null
  };
}

export function classifyGateFailure({
  command,
  exitCode = null,
  stderr = '',
  setupFailure = false,
  optional = false
}) {
  requireNonEmptyString(command, 'command');

  if (setupFailure === true || /node_modules|Cannot find package|ERR_PNPM|missing-node-modules/u.test(stderr)) {
    return 'environment-setup-failure';
  }

  if (/command not found|not recognized|ENOENT|unknown option|requires a value/u.test(stderr)) {
    return 'shell-command-typo';
  }

  if (optional === true) {
    return 'optional-diagnostic-failure';
  }

  if (exitCode !== 0 && exitCode !== null) {
    return 'implementation-failure';
  }

  return 'unknown';
}

function workspaceDependencyBlocker({
  reason,
  command,
  before,
  after = before,
  setupAttempt = null
}) {
  return {
    id: reason,
    reason,
    command,
    before: summarizeDependencyReadiness(before),
    after: summarizeDependencyReadiness(after),
    setupAttempt
  };
}

function summarizeDependencyReadiness(readiness) {
  return {
    worktree: readiness.worktree,
    packageJson: readiness.packageJson,
    nodeModules: readiness.nodeModules,
    pnpmVirtualStore: readiness.pnpmVirtualStore,
    status: readiness.status
  };
}

function normalizeSetupAttempt(attempt, command) {
  if (attempt === undefined || attempt === null) {
    return {
      ok: false,
      command,
      exitCode: null,
      reason: 'setup-attempt-missing-result'
    };
  }

  if (typeof attempt === 'boolean') {
    return {
      ok: attempt,
      command,
      exitCode: attempt === true ? 0 : 1,
      reason: attempt === true ? 'setup-command-passed' : 'setup-command-failed'
    };
  }

  return {
    ok: attempt.ok === true || attempt.status === 'passed' || attempt.exitCode === 0,
    command: attempt.command ?? command,
    exitCode: Number.isInteger(attempt.exitCode) ? attempt.exitCode : null,
    stdout: typeof attempt.stdout === 'string' ? attempt.stdout : '',
    stderr: typeof attempt.stderr === 'string' ? attempt.stderr : '',
    reason: typeof attempt.reason === 'string' && attempt.reason.trim() !== ''
      ? attempt.reason
      : attempt.exitCode === 0 || attempt.ok === true
        ? 'setup-command-passed'
        : 'setup-command-failed'
  };
}

function parseGitPorcelain(porcelain) {
  if (typeof porcelain !== 'string') {
    throw new TypeError('porcelain must be a string');
  }

  return porcelain.split(/\r?\n/u)
    .filter((line) => line.trim() !== '')
    .map((line) => {
      if (line.startsWith('?? ')) {
        return {
          untracked: true,
          path: line.slice(3)
        };
      }

      if (line.length < 4) {
        throw new TypeError(`invalid git status porcelain line: ${line}`);
      }

      return {
        untracked: false,
        indexStatus: line[0],
        worktreeStatus: line[1],
        path: normalizePorcelainPath(line.slice(3))
      };
    });
}

function normalizePorcelainPath(path) {
  const renameSeparator = ' -> ';
  const renameIndex = path.indexOf(renameSeparator);
  return renameIndex === -1 ? path : path.slice(renameIndex + renameSeparator.length);
}

function invalidEvidenceLocation(reason, assignedWorktree, rootCheckout, evidenceRef, evidencePath = null, extra = {}) {
  return {
    contractName: 'workspace-evidence-location-validation.v1',
    contractVersion: 1,
    valid: false,
    eventRegistrationAllowed: false,
    assignedWorktree,
    rootCheckout,
    evidenceRef,
    evidencePath,
    ...extra,
    blocker: {
      id: reason,
      reason
    }
  };
}

async function pathExists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

function requireAbsolutePath(value, field) {
  const normalized = requireNonEmptyString(value, field);
  const resolved = resolve(normalized);

  if (!isAbsolute(resolved)) {
    throw new TypeError(`${field} must resolve to an absolute path`);
  }

  return resolved;
}

function requireNonEmptyString(value, field) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new TypeError(`${field} must be a non-empty string`);
  }

  return value.trim();
}

function normalizePathList(values, field) {
  if (!Array.isArray(values)) {
    throw new TypeError(`${field} must be an array`);
  }

  return values.map((value, index) => requireNonEmptyString(value, `${field}[${index}]`));
}

function stableFingerprint(value) {
  return JSON.stringify(sortForFingerprint(value));
}

function sortForFingerprint(value) {
  if (Array.isArray(value)) {
    return value.map(sortForFingerprint);
  }

  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, nested]) => [key, sortForFingerprint(nested)])
    );
  }

  return value;
}

function pathInsideOrEqual(candidate, root) {
  const relativePath = relative(root, candidate);
  return relativePath === '' || (!relativePath.startsWith('..') && !relativePath.startsWith(`..${sep}`) && !isAbsolute(relativePath));
}
