import { join } from 'node:path';

export class WorkspaceConflictError extends Error {
  constructor(message, details = {}) {
    super(message);
    this.name = 'WorkspaceConflictError';
    this.category = 'workspace-conflict';
    this.details = details;
  }
}

export class WorkspaceManager {
  constructor({ rootDirectory }) {
    if (typeof rootDirectory !== 'string' || rootDirectory.trim() === '') {
      throw new TypeError('rootDirectory must be a non-empty string');
    }

    this.rootDirectory = rootDirectory;
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
      writable: role === 'primary-writer'
    };

    this.allocations.push(allocation);
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

function assertNonEmptyString(value, field) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new TypeError(`${field} must be a non-empty string`);
  }
}

