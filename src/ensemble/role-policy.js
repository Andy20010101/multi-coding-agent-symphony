export class RolePolicyViolationError extends Error {
  constructor(message, details = {}) {
    super(message);
    this.name = 'RolePolicyViolationError';
    this.category = 'role-policy-violation';
    this.details = details;
  }
}

export function assertWriterReviewerRoles({ writer, reviewers }) {
  assertPlainObject(writer, 'writer');
  assertNonEmptyArray(reviewers, 'reviewers');

  const writerAgentId = requireNonEmptyString(writer.agentId, 'writer.agentId');
  const reviewerAgentIds = new Set();

  for (const [index, reviewer] of reviewers.entries()) {
    assertPlainObject(reviewer, `reviewers[${index}]`);
    const reviewerAgentId = requireNonEmptyString(reviewer.agentId, `reviewers[${index}].agentId`);

    if (reviewerAgentId === writerAgentId) {
      throw new RolePolicyViolationError('writer cannot review its own implementation', {
        writerAgentId,
        reviewerAgentId
      });
    }

    if (reviewerAgentIds.has(reviewerAgentId)) {
      throw new RolePolicyViolationError('reviewer agent ids must be unique', {
        reviewerAgentId
      });
    }

    reviewerAgentIds.add(reviewerAgentId);
  }
}

export function safeRoleArtifactSegment(value, field) {
  const normalized = requireNonEmptyString(value, field)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '');

  if (normalized === '' || normalized.includes('..')) {
    throw new RolePolicyViolationError(`${field} must produce a safe artifact segment`, {
      field,
      value
    });
  }

  return normalized;
}

function assertPlainObject(value, field) {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    throw new TypeError(`${field} must be an object`);
  }
}

function assertNonEmptyArray(value, field) {
  if (!Array.isArray(value) || value.length === 0) {
    throw new TypeError(`${field} must be a non-empty array`);
  }
}

function requireNonEmptyString(value, field) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new TypeError(`${field} must be a non-empty string`);
  }

  return value;
}
