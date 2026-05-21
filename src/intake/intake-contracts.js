const RISK_SEVERITIES = new Set(['critical', 'high', 'medium', 'low']);
const PROVIDER_STATUSES = new Set(['completed', 'unavailable', 'failed', 'skipped']);
const WORKFLOW_MODES = new Set([
  'linear',
  'writer-reviewer',
  'parallel-lanes',
  'qa-swarm',
  'competitive-patch'
]);
const INTAKE_STATUSES = new Set(['passed', 'failed']);

export class IntakeValidationError extends Error {
  constructor(message, details = {}) {
    super(message);
    this.name = 'IntakeValidationError';
    this.details = details;
  }
}

export function validateProjectContextArtifact(context) {
  assertPlainObject(context, 'ProjectContextArtifact');
  assertEqual(context.version, '1', 'ProjectContextArtifact.version');
  assertEqual(context.kind, 'project-context', 'ProjectContextArtifact.kind');
  assertEqual(context.schema, 'project-context.v1', 'ProjectContextArtifact.schema');
  assertIsoTimestamp(context.generatedAt, 'ProjectContextArtifact.generatedAt');

  assertPlainObject(context.project, 'ProjectContextArtifact.project');
  assertNonEmptyString(context.project.root, 'ProjectContextArtifact.project.root');
  assertNonEmptyString(context.project.name, 'ProjectContextArtifact.project.name');
  assertPlainObject(context.project.git, 'ProjectContextArtifact.project.git');
  assertBoolean(context.project.git.isRepository, 'ProjectContextArtifact.project.git.isRepository');

  assertPlainObject(context.inventory, 'ProjectContextArtifact.inventory');
  for (const field of ['docs', 'configFiles', 'ciFiles', 'sourceRoots', 'ignoredRoots']) {
    assertStringArray(context.inventory[field], `ProjectContextArtifact.inventory.${field}`);
  }

  assertPlainObject(context.documentation, 'ProjectContextArtifact.documentation');
  assertPlainObject(context.runtime, 'ProjectContextArtifact.runtime');
  assertPlainObject(context.ci, 'ProjectContextArtifact.ci');
  assertStringArray(context.ci.providers, 'ProjectContextArtifact.ci.providers');

  assertArray(context.constraints, 'ProjectContextArtifact.constraints');
  context.constraints.forEach((constraint, index) => {
    assertPlainObject(constraint, `ProjectContextArtifact.constraints[${index}]`);
    assertNonEmptyString(constraint.id, `ProjectContextArtifact.constraints[${index}].id`);
    assertNonEmptyString(constraint.text, `ProjectContextArtifact.constraints[${index}].text`);
  });

  assertRisks(context.risks, 'ProjectContextArtifact.risks');
  assertOpenQuestions(context.openQuestions, 'ProjectContextArtifact.openQuestions');
  assertWorkflowHints(context.workflowHints, 'ProjectContextArtifact.workflowHints');

  assertPlainObject(context.provider, 'ProjectContextArtifact.provider');
  assertNonEmptyString(context.provider.name, 'ProjectContextArtifact.provider.name');
  assertOneOf(context.provider.status, PROVIDER_STATUSES, 'ProjectContextArtifact.provider.status');
  assertBoolean(context.provider.modelInvocation, 'ProjectContextArtifact.provider.modelInvocation');

  return context;
}

export function validateIntakeSummaryArtifact(summary) {
  assertPlainObject(summary, 'IntakeSummaryArtifact');
  assertEqual(summary.version, '1', 'IntakeSummaryArtifact.version');
  assertEqual(summary.kind, 'intake-summary', 'IntakeSummaryArtifact.kind');
  assertEqual(summary.schema, 'intake-summary.v1', 'IntakeSummaryArtifact.schema');
  assertOneOf(summary.status, INTAKE_STATUSES, 'IntakeSummaryArtifact.status');
  assertRiskCounts(summary.riskCounts, 'IntakeSummaryArtifact.riskCounts');
  assertNonNegativeInteger(summary.openQuestionCount, 'IntakeSummaryArtifact.openQuestionCount');
  assertOneOf(summary.recommendedWorkflow, WORKFLOW_MODES, 'IntakeSummaryArtifact.recommendedWorkflow');
  assertNonEmptyStringArray(summary.verificationCommands, 'IntakeSummaryArtifact.verificationCommands');
  assertBoolean(summary.modelInvocation, 'IntakeSummaryArtifact.modelInvocation');

  if (summary.providerStatus !== undefined) {
    assertNonEmptyString(summary.providerStatus, 'IntakeSummaryArtifact.providerStatus');
  }

  return summary;
}

export function isRiskSeverity(value) {
  return RISK_SEVERITIES.has(value);
}

export function isWorkflowMode(value) {
  return WORKFLOW_MODES.has(value);
}

export function riskSeverityRank(severity) {
  const ranks = {
    low: 1,
    medium: 2,
    high: 3,
    critical: 4
  };

  return ranks[severity] ?? 0;
}

export function summarizeRiskCounts(risks) {
  const counts = {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0
  };

  for (const risk of risks) {
    if (RISK_SEVERITIES.has(risk?.severity)) {
      counts[risk.severity] += 1;
    }
  }

  return counts;
}

function assertWorkflowHints(value, field) {
  assertPlainObject(value, field);
  assertOneOf(value.recommendedMode, WORKFLOW_MODES, `${field}.recommendedMode`);
  assertNonEmptyString(value.recommendedAdapter, `${field}.recommendedAdapter`);
  assertNonEmptyStringArray(value.verificationCommands, `${field}.verificationCommands`);
  assertStringArray(value.writeSetHints, `${field}.writeSetHints`);
  assertNonEmptyString(value.preflightSummary, `${field}.preflightSummary`);
}

function assertRisks(value, field) {
  assertArray(value, field);
  value.forEach((risk, index) => {
    assertPlainObject(risk, `${field}[${index}]`);
    assertNonEmptyString(risk.id, `${field}[${index}].id`);
    assertOneOf(risk.severity, RISK_SEVERITIES, `${field}[${index}].severity`);
    assertNonEmptyString(risk.category, `${field}[${index}].category`);
    assertNonEmptyString(risk.title, `${field}[${index}].title`);
    assertStringArray(risk.evidence, `${field}[${index}].evidence`);
    assertNonEmptyString(risk.mitigation, `${field}[${index}].mitigation`);
  });
}

function assertOpenQuestions(value, field) {
  assertArray(value, field);
  value.forEach((question, index) => {
    assertPlainObject(question, `${field}[${index}]`);
    assertNonEmptyString(question.id, `${field}[${index}].id`);
    assertOneOf(question.severity, RISK_SEVERITIES, `${field}[${index}].severity`);
    assertNonEmptyString(question.question, `${field}[${index}].question`);
    assertNonEmptyString(question.source, `${field}[${index}].source`);
  });
}

function assertRiskCounts(value, field) {
  assertPlainObject(value, field);

  for (const severity of RISK_SEVERITIES) {
    assertNonNegativeInteger(value[severity], `${field}.${severity}`);
  }
}

function assertPlainObject(value, field) {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    throw new IntakeValidationError(`${field} must be an object`, { field });
  }
}

function assertArray(value, field) {
  if (!Array.isArray(value)) {
    throw new IntakeValidationError(`${field} must be an array`, { field });
  }
}

function assertStringArray(value, field) {
  assertArray(value, field);

  value.forEach((item, index) => {
    if (typeof item !== 'string') {
      throw new IntakeValidationError(`${field}[${index}] must be a string`, { field, index });
    }
  });
}

function assertNonEmptyStringArray(value, field) {
  assertStringArray(value, field);

  if (value.length === 0) {
    throw new IntakeValidationError(`${field} must not be empty`, { field });
  }

  value.forEach((item, index) => {
    if (item.trim() === '') {
      throw new IntakeValidationError(`${field}[${index}] must be a non-empty string`, {
        field,
        index
      });
    }
  });
}

function assertNonEmptyString(value, field) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new IntakeValidationError(`${field} must be a non-empty string`, { field });
  }
}

function assertEqual(value, expected, field) {
  if (value !== expected) {
    throw new IntakeValidationError(`${field} must be ${expected}`, { field, value });
  }
}

function assertOneOf(value, allowed, field) {
  if (!allowed.has(value)) {
    throw new IntakeValidationError(`${field} must be one of: ${Array.from(allowed).join(', ')}`, {
      field,
      value
    });
  }
}

function assertBoolean(value, field) {
  if (typeof value !== 'boolean') {
    throw new IntakeValidationError(`${field} must be a boolean`, { field });
  }
}

function assertIsoTimestamp(value, field) {
  assertNonEmptyString(value, field);

  if (Number.isNaN(Date.parse(value))) {
    throw new IntakeValidationError(`${field} must be a valid timestamp`, { field });
  }
}

function assertNonNegativeInteger(value, field) {
  if (!Number.isInteger(value) || value < 0) {
    throw new IntakeValidationError(`${field} must be a non-negative integer`, { field });
  }
}
