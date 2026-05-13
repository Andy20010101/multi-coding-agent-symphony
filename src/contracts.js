const TASK_SOURCES = new Set(['github', 'linear', 'manual']);
const COMMAND_NAMES = new Set(['plan', 'implement', 'review', 'fix-ci', 'qa']);
const TOOL_NAMES = new Set(['read', 'write', 'shell', 'test', 'browser', 'network']);
const WORKSPACE_POLICIES = new Set(['primary-writer', 'review-only', 'isolated', 'none']);
const ADAPTER_NAMES = new Set(['codex', 'claude-code', 'kiro-cli']);
const PROVIDER_NAMES = new Set(['openai', 'deepseek', 'anthropic']);
const COST_CLASSES = new Set(['low', 'medium', 'high']);
const TASK_PRIORITIES = new Set(['low', 'normal', 'high']);
const CHECK_STATUSES = new Set(['passed', 'failed']);

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
  assertOptionalStringArray(spec.constraints, 'TaskSpec.constraints');
  assertNonEmptyStringArray(spec.acceptance, 'TaskSpec.acceptance');
  assertOptionalOneOf(spec.priority, TASK_PRIORITIES, 'TaskSpec.priority');
  assertOptionalIsoTimestamp(spec.createdAt, 'TaskSpec.createdAt');
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

export function validateAdapterMapping(mapping) {
  assertPlainObject(mapping, 'AdapterMapping');
  assertOneOf(mapping.adapter, ADAPTER_NAMES, 'AdapterMapping.adapter');
  assertOneOf(mapping.command, COMMAND_NAMES, 'AdapterMapping.command');
  assertNonEmptyString(mapping.commandVersion, 'AdapterMapping.commandVersion');
  assertNonEmptyString(mapping.modelProfile, 'AdapterMapping.modelProfile');
  assertNonEmptyString(mapping.configTemplate, 'AdapterMapping.configTemplate');
  assertNonEmptyString(mapping.promptTemplate, 'AdapterMapping.promptTemplate');
  assertNonEmptyString(mapping.outputParser, 'AdapterMapping.outputParser');
  assertNonEmptyString(mapping.failureMapper, 'AdapterMapping.failureMapper');

  return mapping;
}

export function validateModelProfile(profile) {
  assertPlainObject(profile, 'ModelProfile');
  assertNonEmptyString(profile.id, 'ModelProfile.id');
  assertOneOf(profile.provider, PROVIDER_NAMES, 'ModelProfile.provider');
  assertNonEmptyString(profile.model, 'ModelProfile.model');
  assertPositiveInteger(profile.contextTokens, 'ModelProfile.contextTokens');
  assertPositiveInteger(profile.maxOutputTokens, 'ModelProfile.maxOutputTokens');
  assertBoolean(profile.supportsStructuredOutput, 'ModelProfile.supportsStructuredOutput');
  assertBoolean(profile.supportsVisionInput, 'ModelProfile.supportsVisionInput');
  assertNonEmptyStringArray(profile.reasoningControls, 'ModelProfile.reasoningControls');
  assertOneOf(profile.costClass, COST_CLASSES, 'ModelProfile.costClass');
  assertNonEmptyString(profile.retryPolicy, 'ModelProfile.retryPolicy');
  assertNonEmptyString(profile.version, 'ModelProfile.version');

  return profile;
}

export function validateEvidencePackage(evidence) {
  assertPlainObject(evidence, 'EvidencePackage');
  assertOneOf(evidence.command, COMMAND_NAMES, 'EvidencePackage.command');
  assertNonEmptyString(evidence.taskId, 'EvidencePackage.taskId');
  assertNonEmptyString(evidence.workspaceId, 'EvidencePackage.workspaceId');
  assertStringArray(evidence.diffSummary, 'EvidencePackage.diffSummary');
  assertStringArray(evidence.changedFiles, 'EvidencePackage.changedFiles');
  assertNonEmptyArray(evidence.checks, 'EvidencePackage.checks');
  assertChecks(evidence.checks, 'EvidencePackage.checks');
  assertStringArray(evidence.knownRisks, 'EvidencePackage.knownRisks');
  assertNonEmptyString(evidence.agentSummary, 'EvidencePackage.agentSummary');
  assertOptionalNonEmptyString(evidence.noOpRationale, 'EvidencePackage.noOpRationale');
  assertOptionalStringArray(evidence.findings, 'EvidencePackage.findings');
  assertOptionalNonEmptyString(evidence.noFindingRationale, 'EvidencePackage.noFindingRationale');
  assertNonEmptyString(evidence.version, 'EvidencePackage.version');

  return evidence;
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

function assertOptionalOneOf(value, allowed, field) {
  if (value === undefined) {
    return;
  }

  assertOneOf(value, allowed, field);
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

function assertOptionalStringArray(value, field) {
  if (value === undefined) {
    return;
  }

  assertStringArray(value, field);

  for (const [index, item] of value.entries()) {
    if (item.trim() === '') {
      throw new ValidationError(`${field}[${index}] must be a non-empty string`, {
        field,
        index
      });
    }
  }
}

function assertOptionalIsoTimestamp(value, field) {
  if (value === undefined) {
    return;
  }

  assertNonEmptyString(value, field);

  if (Number.isNaN(Date.parse(value))) {
    throw new ValidationError(`${field} must be a valid timestamp`, { field });
  }
}

function assertPositiveInteger(value, field) {
  if (!Number.isInteger(value) || value < 1) {
    throw new ValidationError(`${field} must be a positive integer`, { field });
  }
}

function assertBoolean(value, field) {
  if (typeof value !== 'boolean') {
    throw new ValidationError(`${field} must be a boolean`, { field });
  }
}

function assertStringArray(value, field) {
  if (!Array.isArray(value)) {
    throw new ValidationError(`${field} must be a string array`, { field });
  }

  for (const [index, item] of value.entries()) {
    if (typeof item !== 'string') {
      throw new ValidationError(`${field}[${index}] must be a string`, {
        field,
        index
      });
    }
  }
}

function assertNonEmptyArray(value, field) {
  if (!Array.isArray(value) || value.length === 0) {
    throw new ValidationError(`${field} must be a non-empty array`, { field });
  }
}

function assertChecks(checks, field) {
  for (const [index, check] of checks.entries()) {
    assertPlainObject(check, `${field}[${index}]`);
    assertNonEmptyString(check.name, `${field}[${index}].name`);
    assertOneOf(check.status, CHECK_STATUSES, `${field}[${index}].status`);
    assertOptionalNonEmptyString(check.command, `${field}[${index}].command`);
    assertOptionalInteger(check.exitCode, `${field}[${index}].exitCode`);
    assertOptionalNonEmptyString(check.output, `${field}[${index}].output`);
    assertOptionalNonEmptyString(check.artifactId, `${field}[${index}].artifactId`);
    assertOptionalIsoTimestamp(check.startedAt, `${field}[${index}].startedAt`);
    assertOptionalIsoTimestamp(check.finishedAt, `${field}[${index}].finishedAt`);

    if (check.output === undefined && check.artifactId === undefined) {
      throw new ValidationError(`${field}[${index}] must include output or artifactId`, {
        field,
        index
      });
    }
  }
}

function assertOptionalNonEmptyString(value, field) {
  if (value === undefined) {
    return;
  }

  assertNonEmptyString(value, field);
}

function assertOptionalInteger(value, field) {
  if (value === undefined) {
    return;
  }

  if (!Number.isInteger(value)) {
    throw new ValidationError(`${field} must be an integer`, { field });
  }
}
