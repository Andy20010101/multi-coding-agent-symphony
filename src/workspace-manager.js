import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const WORKSPACE_MANIFEST_FILE = 'workspace-manifest.json';

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

  #hasPrimaryWriter(taskId) {
    return this.allocations.some((allocation) => (
      allocation.taskId === taskId && allocation.role === 'primary-writer'
    ));
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
}

function assertNonEmptyString(value, field) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new TypeError(`${field} must be a non-empty string`);
  }
}
