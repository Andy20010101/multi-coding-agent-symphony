export const DOGFOOD_SESSION_CONTRACT_NAME = 'dogfoodSession.v1';
export const DOGFOOD_SESSION_SUMMARY_CONTRACT_NAME = 'dogfoodSessionSummary.v1';
export const DOGFOOD_SESSION_CONTRACT_VERSION = 1;

export const DOGFOOD_SESSION_BOUNDARIES = Object.freeze({
  readOnly: true,
  willMutate: false,
  genericShellAvailable: false,
  genericTerminalAvailable: false,
  rendererCommandExecutionAvailable: false,
  frontendLocalJsonlReadAvailable: false,
  frontendLocalSessionReadAvailable: false,
  frontendProviderFolderReadAvailable: false,
  rawTranscriptAvailable: false,
  rawModelOutputAvailable: false,
  rawProviderOutputAvailable: false,
  directGoalEventAppendAvailable: false,
  directTaskCompletionAvailable: false,
  automaticSelfReviewAvailable: false,
  automaticWorktreeCreationAvailable: false,
  automaticNextVersionGoalAvailable: false,
  productGitWriteAvailable: false,
  productGithubReleaseAutomationAvailable: false,
  publicDistributionClaimAvailable: false,
  notarizationClaimAvailable: false,
  autoUpdateClaimAvailable: false,
  dmgReleaseClaimAvailable: false,
  releaseAssetClaimAvailable: false,
  rolloutClaimAvailable: false
});

const ENTRY_PATH_SET = new Set([
  'packaged app',
  'browser fallback',
  'workbench route',
  'package build',
  'controller terminal',
  'unknown'
]);
const WORKER_PROVIDER_SET = new Set(['codex-cli', 'claude-code-cli', 'operator', 'not used', 'unknown']);
const REVIEWER_PROVIDER_SET = new Set(['claude-code-cli', 'operator', 'not used', 'unknown']);
const ADOPTION_STATUS_SET = new Set(['observed', 'not observed', 'not applicable', 'unknown']);
const VERIFICATION_STATUS_SET = new Set(['passed', 'failed', 'blocked', 'not run', 'unknown']);
const METRIC_STATE_SET = new Set(['observed', 'not observed', 'unknown']);
const NUMBER_OR_UNKNOWN_SET = new Set(['unknown', 'not observed']);
const EVIDENCE_REF_KIND_SET = new Set([
  'repo-doc',
  'command-evidence',
  'github-pr',
  'github-release',
  'commit',
  'git-ref',
  'release-url',
  'tag',
  'screenshot'
]);
const DATE_PATTERN = /^[0-9]{4}-[0-9]{2}-[0-9]{2}$/u;
const LOCAL_TIME_PATTERN = /^[0-9]{2}:[0-9]{2}(?::[0-9]{2})?$/u;
const SAFE_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]*$/u;
const UNSAFE_FIELD_NAME_PATTERN =
  /^(?:secret|token|apiKey|apikey|password|credential|rawTranscript|transcript|rawModelOutput|rawOutput|providerOutput|providerPayload|sessionPath|sessionFile|sessionLog|localPath|commandLine|shellCommand)$/iu;
const UNSAFE_TEXT_PATTERN =
  /(?:^|[/.])(?:\.codex|\.claude|\.git|\.symphony)(?:[/]|$)|\/Users\/|\.jsonl(?:$|[/\s])|\b(?:api[_-]?key|secret|credential|password|raw[\s_-]*(?:transcript|model[\s_-]*output)|provider[\s_-]*(?:payload|output|session)|session[\s_-]*(?:file|path)|generic\s+shell|arbitrary\s+command|renderer\s+command|git\s+(?:merge|push|tag)|gh\s+release\s+(?:create|edit|upload|delete)|public\s+distribution|notarization|auto-update|release\s+asset\s+upload)\b/iu;

export class DogfoodSessionContractError extends Error {
  constructor(code, message, details = {}) {
    super(message);
    this.name = 'DogfoodSessionContractError';
    this.code = code;
    this.details = details;
  }
}

export function buildDogfoodSessionRecord({
  generatedAt = new Date().toISOString(),
  sessionId,
  date,
  localTime,
  timezone = 'Asia/Shanghai',
  project,
  goalOrTask,
  entryPath,
  providers,
  adoptionStatus,
  verificationStatus,
  blockerState = 'not observed',
  recoveryAction = 'not observed',
  frictionNotes,
  evidenceRefs,
  metrics
} = {}) {
  return assertDogfoodSessionContract({
    contractName: DOGFOOD_SESSION_CONTRACT_NAME,
    contractVersion: DOGFOOD_SESSION_CONTRACT_VERSION,
    generatedAt: isoOrNow(generatedAt),
    sessionId: stringValue(sessionId),
    date: stringValue(date),
    localTime: stringValue(localTime),
    timezone: stringValue(timezone),
    project: stringValue(project),
    goalOrTask: stringValue(goalOrTask),
    entryPath: stringValue(entryPath),
    providers: normalizeProviders(providers),
    adoptionStatus: stringValue(adoptionStatus),
    verificationStatus: stringValue(verificationStatus),
    blockerState: stringValue(blockerState),
    recoveryAction: stringValue(recoveryAction),
    frictionNotes: stringArray(frictionNotes),
    evidenceRefs: normalizeEvidenceRefs(evidenceRefs),
    metrics: normalizeMetrics(metrics),
    boundaries: DOGFOOD_SESSION_BOUNDARIES,
    readOnly: true,
    willMutate: false
  });
}

export function buildDogfoodSessionSummary({
  generatedAt = new Date().toISOString(),
  sessions = []
} = {}) {
  const normalizedSessions = sessions.map((session) => assertDogfoodSessionContract(session));
  const sessionDates = [...new Set(normalizedSessions.map((session) => session.date))].sort();
  const calendarDaySpan = calendarSpanDays(sessionDates);
  const countedSessionCount = normalizedSessions.length;
  const closeoutSessionGate = countedSessionCount >= 5 ? 'ready' : 'blocked';
  const oneWeekStabilityClaimAllowed = countedSessionCount >= 5 && calendarDaySpan >= 7;

  return {
    contractName: DOGFOOD_SESSION_SUMMARY_CONTRACT_NAME,
    contractVersion: DOGFOOD_SESSION_CONTRACT_VERSION,
    generatedAt: isoOrNow(generatedAt),
    countedSessionCount,
    countedSessionIds: normalizedSessions.map((session) => session.sessionId),
    sessionDates,
    calendarDaySpan,
    evidenceScope: evidenceScopeFrom({ sessionDates, oneWeekStabilityClaimAllowed }),
    closeoutSessionGate,
    oneWeekStabilityClaimAllowed,
    metrics: {
      successObservedCount: countMetricState(normalizedSessions, 'success', 'observed'),
      blockedObservedCount: countMetricState(normalizedSessions, 'blocked', 'observed'),
      recoveryCountObservedTotal: sumNumericMetric(normalizedSessions, 'recoveryCount'),
      manualTerminalEscapeObservedTotal: sumNumericMetric(normalizedSessions, 'manualTerminalEscapeCount'),
      unknownMetricSessionIds: normalizedSessions
        .filter((session) => hasUnknownMetric(session.metrics))
        .map((session) => session.sessionId)
    },
    blockedReasons: closeoutSessionGate === 'ready' ? [] : ['dogfood-session-count-below-five'],
    boundaries: DOGFOOD_SESSION_BOUNDARIES,
    readOnly: true,
    willMutate: false
  };
}

export function validateDogfoodSessionContract(contract) {
  try {
    assertDogfoodSessionContract(contract);
    return { ok: true, errors: [] };
  } catch (error) {
    return { ok: false, errors: [error.message] };
  }
}

export function assertDogfoodSessionContract(contract) {
  const errors = [];

  if (!contract || typeof contract !== 'object' || Array.isArray(contract)) {
    throw new DogfoodSessionContractError('invalid-dogfood-session-contract', 'dogfoodSession.v1 must be an object.');
  }

  const unsafeField = findUnsafeFields(contract)[0];
  if (unsafeField !== undefined) {
    throw new DogfoodSessionContractError(
      'unsafe-dogfood-session-contract',
      `dogfoodSession.v1 contains unsafe field or value at ${unsafeField}.`,
      { field: unsafeField }
    );
  }

  expectEqual(errors, contract.contractName, DOGFOOD_SESSION_CONTRACT_NAME, 'contractName');
  expectEqual(errors, contract.contractVersion, DOGFOOD_SESSION_CONTRACT_VERSION, 'contractVersion');
  expectSafeId(errors, contract.sessionId, 'sessionId');
  expectPattern(errors, contract.date, DATE_PATTERN, 'date');
  expectPattern(errors, contract.localTime, LOCAL_TIME_PATTERN, 'localTime');
  expectNonEmptyString(errors, contract.timezone, 'timezone');
  expectNonEmptyString(errors, contract.project, 'project');
  expectNonEmptyString(errors, contract.goalOrTask, 'goalOrTask');
  expectEnum(errors, contract.entryPath, ENTRY_PATH_SET, 'entryPath');
  expectProviders(errors, contract.providers);
  expectEnum(errors, contract.adoptionStatus, ADOPTION_STATUS_SET, 'adoptionStatus');
  expectEnum(errors, contract.verificationStatus, VERIFICATION_STATUS_SET, 'verificationStatus');
  expectNonEmptyString(errors, contract.blockerState, 'blockerState');
  expectNonEmptyString(errors, contract.recoveryAction, 'recoveryAction');
  expectNonEmptyStringArray(errors, contract.frictionNotes, 'frictionNotes');
  expectEvidenceRefs(errors, contract.evidenceRefs);
  expectMetrics(errors, contract.metrics);
  expectEqual(errors, contract.readOnly, true, 'readOnly');
  expectEqual(errors, contract.willMutate, false, 'willMutate');
  expectEqual(errors, JSON.stringify(contract.boundaries), JSON.stringify(DOGFOOD_SESSION_BOUNDARIES), 'boundaries');

  if (errors.length > 0) {
    throw new DogfoodSessionContractError('invalid-dogfood-session-contract', errors.join('; '), { errors });
  }
  return contract;
}

function normalizeProviders(providers) {
  return {
    worker: stringValue(providers?.worker, 'unknown'),
    reviewer: stringValue(providers?.reviewer, 'unknown')
  };
}

function normalizeMetrics(metrics = {}) {
  return {
    success: stringValue(metrics.success, 'unknown'),
    blocked: stringValue(metrics.blocked, 'unknown'),
    reviewLoopCount: metricNumberOrUnknown(metrics.reviewLoopCount),
    recoveryCount: metricNumberOrUnknown(metrics.recoveryCount),
    manualTerminalEscapeCount: metricNumberOrUnknown(metrics.manualTerminalEscapeCount),
    elapsedTimeMinutes: metricNumberOrUnknown(metrics.elapsedTimeMinutes),
    cost: normalizeCostMetric(metrics.cost)
  };
}

function normalizeCostMetric(cost = {}) {
  if (typeof cost === 'string') {
    return { state: cost, value: null, source: null };
  }
  return {
    state: stringValue(cost.state, 'unknown'),
    value: cost.value === undefined ? null : cost.value,
    source: cost.source === undefined ? null : cost.source
  };
}

function normalizeEvidenceRefs(evidenceRefs) {
  if (!Array.isArray(evidenceRefs)) {
    return [];
  }
  return evidenceRefs.map((ref) => ({
    kind: stringValue(ref?.kind),
    ref: stringValue(ref?.ref),
    label: stringValue(ref?.label)
  }));
}

function expectProviders(errors, providers) {
  if (!providers || typeof providers !== 'object' || Array.isArray(providers)) {
    errors.push('providers must be an object');
    return;
  }
  expectEnum(errors, providers.worker, WORKER_PROVIDER_SET, 'providers.worker');
  expectEnum(errors, providers.reviewer, REVIEWER_PROVIDER_SET, 'providers.reviewer');
}

function expectEvidenceRefs(errors, evidenceRefs) {
  if (!Array.isArray(evidenceRefs) || evidenceRefs.length === 0) {
    errors.push('evidenceRefs must be a non-empty array');
    return;
  }
  for (const [index, ref] of evidenceRefs.entries()) {
    if (!ref || typeof ref !== 'object' || Array.isArray(ref)) {
      errors.push(`evidenceRefs[${index}] must be an object`);
      continue;
    }
    expectEnum(errors, ref.kind, EVIDENCE_REF_KIND_SET, `evidenceRefs[${index}].kind`);
    expectNonEmptyString(errors, ref.ref, `evidenceRefs[${index}].ref`);
    expectNonEmptyString(errors, ref.label, `evidenceRefs[${index}].label`);
  }
}

function expectMetrics(errors, metrics) {
  if (!metrics || typeof metrics !== 'object' || Array.isArray(metrics)) {
    errors.push('metrics must be an object');
    return;
  }
  expectEnum(errors, metrics.success, METRIC_STATE_SET, 'metrics.success');
  expectEnum(errors, metrics.blocked, METRIC_STATE_SET, 'metrics.blocked');
  expectNumberOrUnknown(errors, metrics.reviewLoopCount, 'metrics.reviewLoopCount');
  expectNumberOrUnknown(errors, metrics.recoveryCount, 'metrics.recoveryCount');
  expectNumberOrUnknown(errors, metrics.manualTerminalEscapeCount, 'metrics.manualTerminalEscapeCount');
  expectNumberOrUnknown(errors, metrics.elapsedTimeMinutes, 'metrics.elapsedTimeMinutes');
  if (!metrics.cost || typeof metrics.cost !== 'object' || Array.isArray(metrics.cost)) {
    errors.push('metrics.cost must be an object');
    return;
  }
  expectEnum(errors, metrics.cost.state, METRIC_STATE_SET, 'metrics.cost.state');
  if (metrics.cost.state === 'observed' && (metrics.cost.value === null || metrics.cost.value === undefined)) {
    errors.push('metrics.cost.value is required when cost is observed');
  }
}

function expectSafeId(errors, value, fieldName) {
  expectNonEmptyString(errors, value, fieldName);
  if (typeof value === 'string' && !SAFE_ID_PATTERN.test(value)) {
    errors.push(`${fieldName} must be a safe id`);
  }
}

function expectPattern(errors, value, pattern, fieldName) {
  expectNonEmptyString(errors, value, fieldName);
  if (typeof value === 'string' && !pattern.test(value)) {
    errors.push(`${fieldName} has invalid format`);
  }
}

function expectEnum(errors, value, set, fieldName) {
  if (!set.has(value)) {
    errors.push(`${fieldName} must be one of ${[...set].join(', ')}`);
  }
}

function expectNumberOrUnknown(errors, value, fieldName) {
  if (typeof value === 'number' && Number.isFinite(value) && value >= 0) {
    return;
  }
  if (NUMBER_OR_UNKNOWN_SET.has(value)) {
    return;
  }
  errors.push(`${fieldName} must be a non-negative number, unknown, or not observed`);
}

function expectEqual(errors, actual, expected, fieldName) {
  if (actual !== expected) {
    errors.push(`${fieldName} must be ${expected}`);
  }
}

function expectNonEmptyString(errors, value, fieldName) {
  if (typeof value !== 'string' || value.trim() === '') {
    errors.push(`${fieldName} must be a non-empty string`);
  }
}

function expectNonEmptyStringArray(errors, value, fieldName) {
  if (!Array.isArray(value) || value.length === 0) {
    errors.push(`${fieldName} must be a non-empty array`);
    return;
  }
  for (const [index, item] of value.entries()) {
    if (typeof item !== 'string' || item.trim() === '') {
      errors.push(`${fieldName}[${index}] must be a non-empty string`);
    }
  }
}

function stringValue(value, fallback = '') {
  if (value === undefined || value === null) {
    return fallback;
  }
  return String(value);
}

function stringArray(value) {
  return Array.isArray(value) ? value.map((item) => stringValue(item)).filter((item) => item.trim() !== '') : [];
}

function metricNumberOrUnknown(value) {
  if (typeof value === 'number' && Number.isFinite(value) && value >= 0) {
    return value;
  }
  if (NUMBER_OR_UNKNOWN_SET.has(value)) {
    return value;
  }
  return 'unknown';
}

function isoOrNow(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
}

function calendarSpanDays(dates) {
  if (dates.length === 0) {
    return 0;
  }
  const first = new Date(`${dates[0]}T00:00:00.000Z`);
  const last = new Date(`${dates[dates.length - 1]}T00:00:00.000Z`);
  return Math.floor((last.getTime() - first.getTime()) / 86400000) + 1;
}

function evidenceScopeFrom({ sessionDates, oneWeekStabilityClaimAllowed }) {
  if (oneWeekStabilityClaimAllowed) {
    return 'one-week-dogfood';
  }
  if (sessionDates.length <= 1) {
    return 'same-day-dogfood';
  }
  return 'multi-day-dogfood';
}

function countMetricState(sessions, metricName, state) {
  return sessions.filter((session) => session.metrics[metricName] === state).length;
}

function sumNumericMetric(sessions, metricName) {
  return sessions.reduce((total, session) => {
    const value = session.metrics[metricName];
    return typeof value === 'number' ? total + value : total;
  }, 0);
}

function hasUnknownMetric(metrics) {
  return metrics.success === 'unknown'
    || metrics.blocked === 'unknown'
    || metrics.reviewLoopCount === 'unknown'
    || metrics.recoveryCount === 'unknown'
    || metrics.manualTerminalEscapeCount === 'unknown'
    || metrics.elapsedTimeMinutes === 'unknown'
    || metrics.cost.state === 'unknown';
}

function findUnsafeFields(value, path = '') {
  const findings = [];
  if (value === null || value === undefined) {
    return findings;
  }
  if (typeof value === 'string') {
    if (UNSAFE_TEXT_PATTERN.test(value)) {
      findings.push(path || '<root>');
    }
    return findings;
  }
  if (typeof value !== 'object') {
    return findings;
  }
  for (const [key, child] of Object.entries(value)) {
    const childPath = path ? `${path}.${key}` : key;
    if (UNSAFE_FIELD_NAME_PATTERN.test(key)) {
      findings.push(childPath);
      continue;
    }
    findings.push(...findUnsafeFields(child, childPath));
  }
  return findings;
}
