const TASK_SOURCES = new Set(['github', 'linear', 'manual']);
const COMMAND_NAMES = new Set(['plan', 'implement', 'review', 'fix-ci', 'qa']);
const TOOL_NAMES = new Set(['read', 'write', 'shell', 'test', 'browser', 'network']);
const WORKSPACE_POLICIES = new Set(['primary-writer', 'review-only', 'isolated', 'none']);

export class ValidationError extends Error {
  constructor(message, details = {}) {
    super(message);
    this.name = 'ValidationError';
    this.details = details;
  }
}

export function validateTaskSpec(spec) {
  assertPlainObject(spec, 'TaskSpec');
  assertNonEmptyString(spec.id, 'TaskSpec.id');
  assertOneOf(spec.source, TASK_SOURCES, 'TaskSpec.source');
  assertNonEmptyString(spec.repository, 'TaskSpec.repository');
  assertNonEmptyString(spec.objective, 'TaskSpec.objective');
  assertNonEmptyStringArray(spec.acceptance, 'TaskSpec.acceptance');
  assertNonEmptyString(spec.version, 'TaskSpec.version');

  return spec;
}

export function validateCommandSpec(spec) {
  assertPlainObject(spec, 'CommandSpec');
  assertOneOf(spec.name, COMMAND_NAMES, 'CommandSpec.name');
  assertNonEmptyString(spec.version, 'CommandSpec.version');
  assertSetSubset(spec.allowedTools, TOOL_NAMES, 'CommandSpec.allowedTools');
  assertOneOf(spec.workspacePolicy, WORKSPACE_POLICIES, 'CommandSpec.workspacePolicy');
  assertNonEmptyStringArray(spec.doneCriteria, 'CommandSpec.doneCriteria');
  assertNonEmptyString(spec.evidenceSchema, 'CommandSpec.evidenceSchema');

  return spec;
}

function assertPlainObject(value, field) {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    throw new ValidationError(`${field} must be an object`, { field });
  }
}

function assertNonEmptyString(value, field) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new ValidationError(`${field} must be a non-empty string`, { field });
  }
}

function assertNonEmptyStringArray(value, field) {
  if (!Array.isArray(value) || value.length === 0) {
    throw new ValidationError(`${field} must be a non-empty string array`, { field });
  }

  for (const [index, item] of value.entries()) {
    if (typeof item !== 'string' || item.trim() === '') {
      throw new ValidationError(`${field}[${index}] must be a non-empty string`, {
        field,
        index
      });
    }
  }
}

function assertOneOf(value, allowed, field) {
  if (!allowed.has(value)) {
    throw new ValidationError(`${field} must be one of: ${Array.from(allowed).join(', ')}`, {
      field,
      value
    });
  }
}

function assertSetSubset(value, allowed, field) {
  assertNonEmptyStringArray(value, field);

  for (const item of value) {
    if (!allowed.has(item)) {
      throw new ValidationError(`${field} contains unsupported value: ${item}`, {
        field,
        value: item
      });
    }
  }
}

