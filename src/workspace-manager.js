import { existsSync, readdirSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const WORKSPACE_MANIFEST_FILE = 'workspace-manifest.json';
const WORKSPACE_LOCK_FILE = 'workspace-lock.json';
const WORKSPACE_CLEANUP_FILE = 'workspace-cleanup.json';
const RETAINED_WORKSPACE_FILES = [WORKSPACE_MANIFEST_FILE, WORKSPACE_CLEANUP_FILE];

export class WorkspaceConflictError extends Error {
  constructor(message, details = {}) {
    super(message);
    this.name = 'WorkspaceConflictError';
    this.category = 'workspace-conflict';
    this.details = details;
  }
}

export class WorkspaceManager {
  constructor({ rootDirectory, materialize = false }) {
    if (typeof rootDirectory !== 'string' || rootDirectory.trim() === '') {
      throw new TypeError('rootDirectory must be a non-empty string');
    }

    if (typeof materialize !== 'boolean') {
      throw new TypeError('materialize must be a boolean');
    }

    this.rootDirectory = rootDirectory;
    this.materialize = materialize;
    this.allocations = [];
  }

  allocate({ taskId, role, adapterId }) {
    assertNonEmptyString(taskId, 'taskId');
    assertNonEmptyString(role, 'role');
    assertNonEmptyString(adapterId, 'adapterId');

    if (role === 'primary-writer' && this.#hasPrimaryWriter(taskId)) {
      throw new WorkspaceConflictError(`Task ${taskId} already has a primary writer`, {
        taskId,
        role,
        adapterId
      });
    }

    const sequence = this.allocations.filter((allocation) => allocation.taskId === taskId).length + 1;
    const workspaceId = `${taskId}-${role}-${sequence}`;
    const allocation = {
      workspaceId,
      taskId,
      role,
      adapterId,
      path: join(this.rootDirectory, taskId, workspaceId),
      manifestPath: join(this.rootDirectory, taskId, workspaceId, WORKSPACE_MANIFEST_FILE),
      lockPath: join(this.rootDirectory, taskId, workspaceId, WORKSPACE_LOCK_FILE),
      writable: role === 'primary-writer'
    };

    this.allocations.push(allocation);

    if (this.materialize) {
      materializeWorkspace(allocation);
    }

    return structuredClone(allocation);
  }

  listByTask(taskId) {
    assertNonEmptyString(taskId, 'taskId');
    return this.allocations
      .filter((allocation) => allocation.taskId === taskId)
      .map((allocation) => structuredClone(allocation));
  }

  cleanup({ workspaceId, cleanedAt = new Date().toISOString() } = {}) {
    assertNonEmptyString(workspaceId, 'workspaceId');
    assertNonEmptyString(cleanedAt, 'cleanedAt');

    const allocation = this.allocations.find((candidate) => candidate.workspaceId === workspaceId);
    if (!allocation) {
      throw new Error(`Workspace ${workspaceId} is not allocated`);
    }

    const cleanupRecordPath = join(allocation.path, WORKSPACE_CLEANUP_FILE);
    const cleanupRecord = {
      version: '1',
      workspaceId: allocation.workspaceId,
      taskId: allocation.taskId,
      path: allocation.path,
      cleanedAt,
      retainedFiles: [...RETAINED_WORKSPACE_FILES]
    };

    if (this.materialize) {
      mkdirSync(allocation.path, { recursive: true });
      materializeWorkspace(allocation);
      removeWorkspaceContentsExcept(allocation.path, new Set([WORKSPACE_MANIFEST_FILE]));
      writeFileSync(cleanupRecordPath, JSON.stringify(cleanupRecord, null, 2));
    }

    allocation.cleanedAt = cleanedAt;
    allocation.cleanupRecordPath = cleanupRecordPath;

    return {
      workspaceId: allocation.workspaceId,
      status: 'cleaned',
      path: allocation.path,
      manifestPath: allocation.manifestPath,
      cleanupRecordPath,
      retainedFiles: [...RETAINED_WORKSPACE_FILES],
      cleanedAt
    };
  }

  #hasPrimaryWriter(taskId) {
    return this.allocations.some((allocation) => (
      allocation.taskId === taskId && allocation.role === 'primary-writer'
    )) || this.#hasMaterializedPrimaryWriterLock(taskId);
  }

  #hasMaterializedPrimaryWriterLock(taskId) {
    if (!this.materialize) {
      return false;
    }

    const taskDirectory = join(this.rootDirectory, taskId);
    if (!existsSync(taskDirectory)) {
      return false;
    }

    for (const entry of readdirSync(taskDirectory, { withFileTypes: true })) {
      if (!entry.isDirectory()) {
        continue;
      }

      const lockPath = join(taskDirectory, entry.name, WORKSPACE_LOCK_FILE);
      if (!existsSync(lockPath)) {
        continue;
      }

      const lock = readWorkspaceLock(lockPath);
      if (lock.role === 'primary-writer') {
        return true;
      }
    }

    return false;
  }
}

function materializeWorkspace(allocation) {
  mkdirSync(allocation.path, { recursive: true });
  writeFileSync(allocation.manifestPath, JSON.stringify({
    version: '1',
    workspaceId: allocation.workspaceId,
    taskId: allocation.taskId,
    role: allocation.role,
    adapterId: allocation.adapterId,
    path: allocation.path,
    writable: allocation.writable
  }, null, 2));
  writeFileSync(allocation.lockPath, JSON.stringify({
    version: '1',
    workspaceId: allocation.workspaceId,
    taskId: allocation.taskId,
    role: allocation.role,
    adapterId: allocation.adapterId,
    path: allocation.path,
    writable: allocation.writable,
    accessMode: accessModeForRole(allocation.role)
  }, null, 2));
}

function removeWorkspaceContentsExcept(workspacePath, retainedFileNames) {
  for (const entry of readdirSync(workspacePath, { withFileTypes: true })) {
    if (retainedFileNames.has(entry.name)) {
      continue;
    }

    rmSync(join(workspacePath, entry.name), { recursive: true, force: true });
  }
}

function readWorkspaceLock(lockPath) {
  const lock = JSON.parse(readFileSync(lockPath, 'utf8'));

  if (lock === null || typeof lock !== 'object' || Array.isArray(lock)) {
    throw new TypeError(`Workspace lock must be an object: ${lockPath}`);
  }

  return lock;
}

function accessModeForRole(role) {
  if (role === 'primary-writer') {
    return 'read-write';
  }

  if (role === 'review') {
    return 'read-only';
  }

  return 'isolated';
}

function assertNonEmptyString(value, field) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new TypeError(`${field} must be a non-empty string`);
  }
}
