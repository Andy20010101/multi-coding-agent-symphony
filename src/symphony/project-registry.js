import { lstat, readFile } from 'node:fs/promises';
import { basename, dirname, join, resolve } from 'node:path';

import { readManagedActiveGoalPointer } from './goal-runbook-registry.js';
import { readLatestRun } from './state.js';

export const PROJECT_REGISTRY_CONTRACT_NAME = 'project-registry.v1';
export const CURRENT_PROJECT_RESOLVER_CONTRACT_NAME = 'current-project-resolver.v1';
export const RECENT_PROJECTS_CONTRACT_NAME = 'recent-projects.v1';
export const PROJECT_REGISTRY_CONTRACT_VERSION = 1;

const PROJECT_HEALTH_VALUES = Object.freeze(['ok', 'attention', 'blocked', 'unknown']);
const RECENT_PROJECT_STATES = Object.freeze(['available', 'empty', 'missing', 'stale', 'degraded', 'failed']);

export async function buildProjectRegistry({
  cwd = process.cwd(),
  repoPath,
  stateDir,
  generatedAt = new Date().toISOString()
} = {}) {
  const currentProject = await resolveCurrentProject({
    cwd,
    repoPath,
    stateDir,
    generatedAt
  });
  const projects = currentProject.currentProject === null ? [] : [currentProject.currentProject];

  return assertProjectRegistryContract({
    contractName: PROJECT_REGISTRY_CONTRACT_NAME,
    contractVersion: PROJECT_REGISTRY_CONTRACT_VERSION,
    generatedAt,
    readOnly: true,
    source: {
      kind: 'repo-local-metadata',
      scanScope: 'cwd-or-explicit-repo-path',
      stateDir: currentProject.resolution.stateDir,
      writes: false
    },
    projects,
    currentProjectId: currentProject.currentProject?.project_id ?? null,
    resolution: currentProject.resolution,
    boundaries: readOnlyProjectBoundaries()
  });
}

export async function buildRecentProjects({
  cwd = process.cwd(),
  repoPath,
  stateDir,
  generatedAt = new Date().toISOString(),
  registry
} = {}) {
  const sourceRegistry = registry ?? await buildProjectRegistry({
    cwd,
    repoPath,
    stateDir,
    generatedAt
  });

  return projectRecentProjectsFromRegistry({
    registry: sourceRegistry,
    generatedAt
  });
}

export function projectRecentProjectsFromRegistry({
  registry,
  generatedAt = new Date().toISOString()
} = {}) {
  if (!isPlainObject(registry)) {
    return assertRecentProjectsContract({
      contractName: RECENT_PROJECTS_CONTRACT_NAME,
      contractVersion: PROJECT_REGISTRY_CONTRACT_VERSION,
      generatedAt,
      state: 'failed',
      source: recentProjectsSource({
        kind: 'unavailable',
        sourceContract: null,
        degradedReason: 'project registry contract is unavailable'
      }),
      readOnly: true,
      items: [],
      boundaries: readOnlyRecentProjectBoundaries()
    });
  }

  const projects = Array.isArray(registry.projects) ? registry.projects : [];
  const items = projects.map(recentProjectItemFromRegistryProject);
  const degradedReason = firstDegradedReason(items);
  const state = recentProjectsStateFromRegistry({
    registry,
    itemCount: items.length,
    degradedReason
  });

  return assertRecentProjectsContract({
    contractName: RECENT_PROJECTS_CONTRACT_NAME,
    contractVersion: PROJECT_REGISTRY_CONTRACT_VERSION,
    generatedAt,
    state,
    source: recentProjectsSource({
      kind: 'registry',
      sourceContract: registry.contractName,
      generatedAt: registry.generatedAt,
      degradedReason
    }),
    readOnly: true,
    items,
    boundaries: readOnlyRecentProjectBoundaries()
  });
}

export async function resolveCurrentProject({
  cwd = process.cwd(),
  repoPath,
  stateDir,
  generatedAt = new Date().toISOString()
} = {}) {
  const explicitRepoPath = typeof repoPath === 'string' && repoPath.trim() !== '';
  const inputPath = resolve(explicitRepoPath ? repoPath : cwd);
  const repoResolution = await resolveRepoPath(inputPath);
  const blockers = [];
  let project = null;

  if (repoResolution.status !== 'resolved') {
    blockers.push({
      id: repoResolution.status === 'path-missing' ? 'project-path-missing' : 'project-repo-unresolved',
      severity: 'warning',
      message: repoResolution.status === 'path-missing'
        ? 'The requested project path does not exist or cannot be read.'
        : 'No .git directory or linked-worktree .git file was found at the requested path or its parents.'
    });
  } else {
    project = await buildRegisteredProject({
      repoPath: repoResolution.repoPath,
      stateDir: stateDir ?? join(repoResolution.repoPath, '.symphony')
    });
  }

  const resolution = {
    status: project === null ? 'unresolved' : 'resolved',
    strategy: explicitRepoPath ? 'explicit-repo-path' : 'cwd',
    inputPath,
    repoPath: repoResolution.repoPath,
    stateDir: stateDir ?? (repoResolution.repoPath === null ? join(inputPath, '.symphony') : join(repoResolution.repoPath, '.symphony')),
    readOnly: true,
    blockers
  };

  return assertCurrentProjectResolverContract({
    contractName: CURRENT_PROJECT_RESOLVER_CONTRACT_NAME,
    contractVersion: PROJECT_REGISTRY_CONTRACT_VERSION,
    generatedAt,
    readOnly: true,
    currentProject: project,
    resolution,
    boundaries: readOnlyProjectBoundaries()
  });
}

export function validateProjectRegistryContract(registry) {
  const errors = [];

  if (!isPlainObject(registry)) {
    return { ok: false, errors: ['registry must be a plain object'] };
  }

  requireExact(errors, registry.contractName, 'contractName', PROJECT_REGISTRY_CONTRACT_NAME);
  requireExact(errors, registry.contractVersion, 'contractVersion', PROJECT_REGISTRY_CONTRACT_VERSION);
  requireIsoTimestamp(errors, registry.generatedAt, 'generatedAt');
  requireExact(errors, registry.readOnly, 'readOnly', true);
  validateRegistrySource(errors, registry.source);

  if (!Array.isArray(registry.projects)) {
    errors.push('projects must be an array');
  } else {
    registry.projects.forEach((project, index) => validateProject(errors, project, `projects[${index}]`));
  }

  if (registry.currentProjectId !== null) {
    requireNonEmptyString(errors, registry.currentProjectId, 'currentProjectId');
  }

  validateResolution(errors, registry.resolution, 'resolution');
  validateBoundaries(errors, registry.boundaries);

  return { ok: errors.length === 0, errors };
}

export function validateCurrentProjectResolverContract(resolver) {
  const errors = [];

  if (!isPlainObject(resolver)) {
    return { ok: false, errors: ['resolver must be a plain object'] };
  }

  requireExact(errors, resolver.contractName, 'contractName', CURRENT_PROJECT_RESOLVER_CONTRACT_NAME);
  requireExact(errors, resolver.contractVersion, 'contractVersion', PROJECT_REGISTRY_CONTRACT_VERSION);
  requireIsoTimestamp(errors, resolver.generatedAt, 'generatedAt');
  requireExact(errors, resolver.readOnly, 'readOnly', true);

  if (resolver.currentProject !== null) {
    validateProject(errors, resolver.currentProject, 'currentProject');
  }

  validateResolution(errors, resolver.resolution, 'resolution');
  validateBoundaries(errors, resolver.boundaries);

  return { ok: errors.length === 0, errors };
}

export function validateRecentProjectsContract(recentProjects) {
  const errors = [];

  if (!isPlainObject(recentProjects)) {
    return { ok: false, errors: ['recentProjects must be a plain object'] };
  }

  requireExact(errors, recentProjects.contractName, 'contractName', RECENT_PROJECTS_CONTRACT_NAME);
  requireExact(errors, recentProjects.contractVersion, 'contractVersion', PROJECT_REGISTRY_CONTRACT_VERSION);
  requireIsoTimestamp(errors, recentProjects.generatedAt, 'generatedAt');
  requireEnum(errors, recentProjects.state, 'state', RECENT_PROJECT_STATES);
  validateRecentProjectsSource(errors, recentProjects.source);
  requireExact(errors, recentProjects.readOnly, 'readOnly', true);

  if (!Array.isArray(recentProjects.items)) {
    errors.push('items must be an array');
  } else {
    recentProjects.items.forEach((item, index) => validateRecentProjectItem(errors, item, `items[${index}]`));
  }

  validateRecentProjectBoundaries(errors, recentProjects.boundaries);

  return { ok: errors.length === 0, errors };
}

export function assertProjectRegistryContract(registry) {
  const result = validateProjectRegistryContract(registry);

  if (!result.ok) {
    throw new Error(`Invalid project registry contract: ${result.errors.join('; ')}`);
  }

  return registry;
}

export function assertCurrentProjectResolverContract(resolver) {
  const result = validateCurrentProjectResolverContract(resolver);

  if (!result.ok) {
    throw new Error(`Invalid current project resolver contract: ${result.errors.join('; ')}`);
  }

  return resolver;
}

export function assertRecentProjectsContract(recentProjects) {
  const result = validateRecentProjectsContract(recentProjects);

  if (!result.ok) {
    throw new Error(`Invalid recent projects contract: ${result.errors.join('; ')}`);
  }

  return recentProjects;
}

async function buildRegisteredProject({ repoPath, stateDir }) {
  const [packageJson, gitConfig, gitHead, originHead, activeGoalPointer, latestRun] = await Promise.all([
    readJsonIfExists(join(repoPath, 'package.json')),
    readTextIfExists(join(repoPath, '.git', 'config')),
    readTextIfExists(join(repoPath, '.git', 'HEAD')),
    readTextIfExists(join(repoPath, '.git', 'refs', 'remotes', 'origin', 'HEAD')),
    readManagedActiveGoalPointer({ stateDir }),
    readLatestRun({ stateDir })
  ]);
  const projectName = nonEmptyString(packageJson?.name) ?? basename(repoPath);
  const defaultBranch = parseOriginDefaultBranch(originHead)
    ?? parseConfigDefaultBranch(gitConfig)
    ?? parseDefaultBranch(gitHead)
    ?? 'main';
  const lastOpenedAt = nonEmptyString(latestRun?.updatedAt)
    ?? nonEmptyString(latestRun?.createdAt)
    ?? null;

  return {
    project_id: stableProjectId(projectName, repoPath),
    project_name: projectName,
    repo_path: repoPath,
    default_branch: defaultBranch,
    remote_url: parseOriginRemoteUrl(gitConfig),
    last_goal_id: nonEmptyString(activeGoalPointer?.goalId) ?? null,
    last_run_id: nonEmptyString(latestRun?.runId) ?? null,
    health_status: 'ok',
    last_opened_at: lastOpenedAt,
    pinned: false
  };
}

async function resolveRepoPath(inputPath) {
  let current = inputPath;

  try {
    const metadata = await lstat(current);

    if (!metadata.isDirectory()) {
      current = dirname(current);
    }
  } catch {
    return {
      status: 'path-missing',
      repoPath: null
    };
  }

  while (true) {
    try {
      const gitEntry = await lstat(join(current, '.git'));

      if (gitEntry.isDirectory() || gitEntry.isFile()) {
        return {
          status: 'resolved',
          repoPath: current
        };
      }
    } catch {
      // Keep walking toward the filesystem root. Missing git metadata is reported after the walk is exhausted.
    }

    const parent = dirname(current);

    if (parent === current) {
      return {
        status: 'not-git-repo',
        repoPath: null
      };
    }

    current = parent;
  }
}

function readOnlyProjectBoundaries() {
  return {
    readOnly: true,
    diskScanScope: 'cwd-or-explicit-repo-path-only',
    registryDatabaseWritesAvailable: false,
    actionExecutionAvailable: false,
    jobQueueAvailable: false,
    modelInvocationAvailable: false,
    gitWriteAvailable: false,
    releaseWriteAvailable: false,
    arbitraryCommandExecutionAvailable: false
  };
}

function readOnlyRecentProjectBoundaries() {
  return {
    readOnly: true,
    diskScanAvailable: false,
    scanScope: 'known-projects-only',
    arbitraryPathReadAvailable: false,
    commandExecutionAvailable: false,
    modelInvocationAvailable: false,
    gitWriteAvailable: false,
    releaseWriteAvailable: false
  };
}

function recentProjectsSource({
  kind,
  sourceContract,
  generatedAt,
  degradedReason
}) {
  return {
    kind,
    scanScope: 'known-projects-only',
    sourceContract,
    generatedAt: generatedAt ?? null,
    degradedReason: degradedReason ?? null
  };
}

function recentProjectItemFromRegistryProject(project) {
  const healthStatus = nonEmptyString(project?.health_status) ?? 'unknown';
  const degradedReason = healthStatus === 'attention' || healthStatus === 'blocked'
    ? `project health is ${healthStatus}`
    : null;

  return {
    projectId: nonEmptyString(project?.project_id) ?? 'unknown-project',
    displayName: nonEmptyString(project?.project_name) ?? 'Unknown project',
    repoPath: {
      displayValue: nonEmptyString(project?.repo_path) ?? '未暴露'
    },
    defaultBranch: nonEmptyString(project?.default_branch) ?? null,
    remote: {
      displayValue: nonEmptyString(project?.remote_url) ?? null
    },
    pinned: project?.pinned === true,
    lastOpenedAt: nonEmptyString(project?.last_opened_at) ?? null,
    lastGoalId: nonEmptyString(project?.last_goal_id) ?? null,
    lastRunId: nonEmptyString(project?.last_run_id) ?? null,
    healthSummary: {
      state: healthStatus,
      text: healthStatus === 'ok' ? 'ok' : `health ${healthStatus}`
    },
    degradedReason
  };
}

function recentProjectsStateFromRegistry({
  registry,
  itemCount,
  degradedReason
}) {
  if (registry?.state === 'failed') {
    return 'failed';
  }

  if (registry?.freshness?.status === 'stale') {
    return 'stale';
  }

  if (itemCount === 0 && registry?.resolution?.status !== 'resolved') {
    return 'missing';
  }

  if (itemCount === 0) {
    return 'empty';
  }

  if (degradedReason !== null) {
    return 'degraded';
  }

  return 'available';
}

function firstDegradedReason(items) {
  return items.find((item) => item.degradedReason !== null)?.degradedReason ?? null;
}

function parseDefaultBranch(gitHead) {
  const match = /^ref: refs\/heads\/(.+)$/u.exec((gitHead ?? '').trim());
  return match?.[1] ?? null;
}

function parseOriginDefaultBranch(originHead) {
  const match = /^ref: refs\/remotes\/origin\/(.+)$/u.exec((originHead ?? '').trim());
  return match?.[1] ?? null;
}

function parseConfigDefaultBranch(gitConfig) {
  if (typeof gitConfig !== 'string') {
    return null;
  }

  const match = /^\s*defaultBranch\s*=\s*(.+?)\s*$/imu.exec(gitConfig);
  return match?.[1] ?? null;
}

function parseOriginRemoteUrl(gitConfig) {
  if (typeof gitConfig !== 'string') {
    return null;
  }

  const lines = gitConfig.split(/\r?\n/u);
  let inOrigin = false;

  for (const line of lines) {
    const section = /^\s*\[remote "([^"]+)"\]\s*$/u.exec(line);

    if (section !== null) {
      inOrigin = section[1] === 'origin';
      continue;
    }

    if (inOrigin) {
      const url = /^\s*url\s*=\s*(.+?)\s*$/u.exec(line);

      if (url !== null && url[1] !== '') {
        return url[1];
      }
    }
  }

  return null;
}

async function readJsonIfExists(path) {
  try {
    return JSON.parse(await readFile(path, 'utf8'));
  } catch (error) {
    if (error.code === 'ENOENT' || error.code === 'ENOTDIR') {
      return null;
    }

    throw error;
  }
}

async function readTextIfExists(path) {
  try {
    return await readFile(path, 'utf8');
  } catch (error) {
    if (error.code === 'ENOENT' || error.code === 'ENOTDIR') {
      return null;
    }

    throw error;
  }
}

function stableProjectId(projectName, repoPath) {
  const slug = `${projectName}-${basename(repoPath)}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/gu, '-')
    .replace(/^-+|-+$/gu, '');

  return slug === '' ? 'project' : slug;
}

function validateRegistrySource(errors, source) {
  if (!isPlainObject(source)) {
    errors.push('source must be a plain object');
    return;
  }

  requireExact(errors, source.kind, 'source.kind', 'repo-local-metadata');
  requireExact(errors, source.scanScope, 'source.scanScope', 'cwd-or-explicit-repo-path');
  requireNonEmptyString(errors, source.stateDir, 'source.stateDir');
  requireExact(errors, source.writes, 'source.writes', false);
}

function validateProject(errors, project, path) {
  if (!isPlainObject(project)) {
    errors.push(`${path} must be a plain object`);
    return;
  }

  for (const field of [
    'project_id',
    'project_name',
    'repo_path',
    'default_branch',
    'health_status'
  ]) {
    requireNonEmptyString(errors, project[field], `${path}.${field}`);
  }

  for (const field of ['remote_url', 'last_goal_id', 'last_run_id', 'last_opened_at']) {
    if (project[field] !== null) {
      requireNonEmptyString(errors, project[field], `${path}.${field}`);
    }
  }

  requireEnum(errors, project.health_status, `${path}.health_status`, PROJECT_HEALTH_VALUES);
  requireExact(errors, project.pinned, `${path}.pinned`, false);
}

function validateResolution(errors, resolution, path) {
  if (!isPlainObject(resolution)) {
    errors.push(`${path} must be a plain object`);
    return;
  }

  requireEnum(errors, resolution.status, `${path}.status`, ['resolved', 'unresolved']);
  requireEnum(errors, resolution.strategy, `${path}.strategy`, ['cwd', 'explicit-repo-path']);
  requireNonEmptyString(errors, resolution.inputPath, `${path}.inputPath`);
  requireNonEmptyString(errors, resolution.stateDir, `${path}.stateDir`);
  requireExact(errors, resolution.readOnly, `${path}.readOnly`, true);

  if (resolution.repoPath !== null) {
    requireNonEmptyString(errors, resolution.repoPath, `${path}.repoPath`);
  }

  if (!Array.isArray(resolution.blockers)) {
    errors.push(`${path}.blockers must be an array`);
    return;
  }

  resolution.blockers.forEach((blocker, index) => {
    const blockerPath = `${path}.blockers[${index}]`;

    if (!isPlainObject(blocker)) {
      errors.push(`${blockerPath} must be a plain object`);
      return;
    }

    requireNonEmptyString(errors, blocker.id, `${blockerPath}.id`);
    requireEnum(errors, blocker.severity, `${blockerPath}.severity`, ['info', 'warning', 'error']);
    requireNonEmptyString(errors, blocker.message, `${blockerPath}.message`);
  });
}

function validateBoundaries(errors, boundaries) {
  if (!isPlainObject(boundaries)) {
    errors.push('boundaries must be a plain object');
    return;
  }

  requireExact(errors, boundaries.readOnly, 'boundaries.readOnly', true);
  requireExact(errors, boundaries.diskScanScope, 'boundaries.diskScanScope', 'cwd-or-explicit-repo-path-only');

  for (const field of [
    'registryDatabaseWritesAvailable',
    'actionExecutionAvailable',
    'jobQueueAvailable',
    'modelInvocationAvailable',
    'gitWriteAvailable',
    'releaseWriteAvailable',
    'arbitraryCommandExecutionAvailable'
  ]) {
    requireExact(errors, boundaries[field], `boundaries.${field}`, false);
  }
}

function validateRecentProjectsSource(errors, source) {
  if (!isPlainObject(source)) {
    errors.push('source must be a plain object');
    return;
  }

  requireEnum(errors, source.kind, 'source.kind', ['registry', 'explicit cwd', 'managed recent list', 'fixture', 'unavailable']);
  requireExact(errors, source.scanScope, 'source.scanScope', 'known-projects-only');

  if (source.sourceContract !== null) {
    requireNonEmptyString(errors, source.sourceContract, 'source.sourceContract');
  }

  if (source.generatedAt !== null) {
    requireIsoTimestamp(errors, source.generatedAt, 'source.generatedAt');
  }

  if (source.degradedReason !== null) {
    requireNonEmptyString(errors, source.degradedReason, 'source.degradedReason');
  }
}

function validateRecentProjectItem(errors, item, path) {
  if (!isPlainObject(item)) {
    errors.push(`${path} must be a plain object`);
    return;
  }

  for (const field of ['projectId', 'displayName']) {
    requireNonEmptyString(errors, item[field], `${path}.${field}`);
  }

  if (!isPlainObject(item.repoPath)) {
    errors.push(`${path}.repoPath must be a plain object`);
  } else {
    requireNonEmptyString(errors, item.repoPath.displayValue, `${path}.repoPath.displayValue`);
  }

  if (item.defaultBranch !== null) {
    requireNonEmptyString(errors, item.defaultBranch, `${path}.defaultBranch`);
  }

  if (!isPlainObject(item.remote)) {
    errors.push(`${path}.remote must be a plain object`);
  } else if (item.remote.displayValue !== null) {
    requireNonEmptyString(errors, item.remote.displayValue, `${path}.remote.displayValue`);
  }

  requireExact(errors, typeof item.pinned, `${path}.pinned type`, 'boolean');

  for (const field of ['lastOpenedAt', 'lastGoalId', 'lastRunId', 'degradedReason']) {
    if (item[field] !== null) {
      requireNonEmptyString(errors, item[field], `${path}.${field}`);
    }
  }

  if (!isPlainObject(item.healthSummary)) {
    errors.push(`${path}.healthSummary must be a plain object`);
  } else {
    requireEnum(errors, item.healthSummary.state, `${path}.healthSummary.state`, PROJECT_HEALTH_VALUES);
    requireNonEmptyString(errors, item.healthSummary.text, `${path}.healthSummary.text`);
  }
}

function validateRecentProjectBoundaries(errors, boundaries) {
  if (!isPlainObject(boundaries)) {
    errors.push('boundaries must be a plain object');
    return;
  }

  requireExact(errors, boundaries.readOnly, 'boundaries.readOnly', true);
  requireExact(errors, boundaries.diskScanAvailable, 'boundaries.diskScanAvailable', false);
  requireExact(errors, boundaries.scanScope, 'boundaries.scanScope', 'known-projects-only');

  for (const field of [
    'arbitraryPathReadAvailable',
    'commandExecutionAvailable',
    'modelInvocationAvailable',
    'gitWriteAvailable',
    'releaseWriteAvailable'
  ]) {
    requireExact(errors, boundaries[field], `boundaries.${field}`, false);
  }
}

function requireExact(errors, value, path, expected) {
  if (value !== expected) {
    errors.push(`${path} must be ${String(expected)}`);
  }
}

function requireEnum(errors, value, path, values) {
  if (!values.includes(value)) {
    errors.push(`${path} must be one of ${values.join(', ')}`);
  }
}

function requireNonEmptyString(errors, value, path) {
  if (typeof value !== 'string' || value.trim() === '') {
    errors.push(`${path} must be a non-empty string`);
  }
}

function requireIsoTimestamp(errors, value, path) {
  requireNonEmptyString(errors, value, path);

  if (typeof value === 'string' && Number.isNaN(Date.parse(value))) {
    errors.push(`${path} must be an ISO timestamp`);
  }
}

function nonEmptyString(value) {
  return typeof value === 'string' && value.trim() !== '' ? value : null;
}

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}
