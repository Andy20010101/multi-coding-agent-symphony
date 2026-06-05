import { basename } from 'node:path';

import { redactSecrets } from '../redaction.js';
import { buildDiagnosticsContract } from './diagnostics.js';
import { buildGoalProgressLedger } from './goal-progress-ledger.js';
import { readGoalEventJournal } from './goal-event-journal.js';
import { resolveGoalRunbookGoalId } from './goal-runbook-context.js';
import { buildLocalRuntimeHealth } from './local-runtime-health.js';
import { listRunStates } from './state.js';

export const APP_CORE_DIAGNOSTICS_BUNDLE_CONTRACT_NAME = 'app-core-diagnostics-bundle.v1';
export const APP_CORE_DIAGNOSTICS_BUNDLE_CONTRACT_VERSION = 1;

const REQUIRED_SOURCE_CONTRACTS = Object.freeze([
  'local-runtime-health.v1',
  'diagnostics.v1',
  'goal-runbook.v1',
  'goal-progress-ledger.v1',
  'goal-event-log.v1',
  'symphony.console-runs',
  'job-timeline-log-stream.v1'
]);
const FAILURE_EVENT_TYPES = new Set([
  'worker.self-check-failed',
  'reviewer.needs-revision',
  'main.verification-failed',
  'release.gate-failed',
  'blocker.opened'
]);
const FALSE_BOUNDARY_FIELDS = Object.freeze([
  'includesSecretValues',
  'includesRawLogBodies',
  'includesRepoSourcePayloads',
  'localFileOpenAvailable',
  'shellExecutionAvailable',
  'modelInvocationAvailable',
  'arbitraryCommandExecutionAvailable',
  'arbitraryPathReadAvailable',
  'gitWriteAvailable',
  'mergeAvailable',
  'pushAvailable',
  'tagAvailable',
  'publishAvailable',
  'selfApprovalAvailable',
  'releaseDecisionAvailable'
]);

export async function buildAppCoreDiagnosticsBundle({
  cwd = process.cwd(),
  stateDir = '.symphony',
  goalId = 'latest',
  taskId = null,
  generatedAt = new Date().toISOString()
} = {}) {
  assertSafeContextRef(goalId, 'goalId');
  if (taskId !== null) {
    assertSafeContextRef(taskId, 'taskId');
  }

  const resolvedGoalId = await resolveDiagnosticsGoalId({ stateDir, goalId });
  const [runtimeHealth, diagnostics, ledger, eventLog, runStates] = await Promise.all([
    buildLocalRuntimeHealth({ cwd, generatedAt, startedAt: generatedAt }),
    buildDiagnosticsContract({ stateDir }),
    buildLedgerOrNull({ stateDir, goalId: resolvedGoalId, generatedAt }),
    readEventLogOrEmpty({ stateDir, goalId: resolvedGoalId }),
    listRunStates({ stateDir })
  ]);
  const recentFailures = collectRecentFailures({
    cwd,
    taskId,
    eventLog,
    runStates
  });
  const sanitizedLogs = collectSanitizedLogRefs({
    goalId: resolvedGoalId,
    taskId,
    runStates
  });

  return assertAppCoreDiagnosticsBundleContract({
    contractName: APP_CORE_DIAGNOSTICS_BUNDLE_CONTRACT_NAME,
    contractVersion: APP_CORE_DIAGNOSTICS_BUNDLE_CONTRACT_VERSION,
    generatedAt,
    readOnly: true,
    context: {
      goalId,
      resolvedGoalId,
      taskId,
      cwdRef: basename(cwd),
      sourceContracts: [...REQUIRED_SOURCE_CONTRACTS],
      stateSource: 'explicit-backend-contracts',
      diagnosticsRole: 'sanitized-health-and-refs-only'
    },
    health: {
      status: diagnosticHealthStatus({ runtimeHealth, diagnostics, recentFailures }),
      runtime: {
        status: runtimeHealth.status,
        runtimeVersion: runtimeHealth.runtime.version,
        kernelVersion: runtimeHealth.kernel.version,
        nodeVersion: process.version
      },
      checks: {
        status: diagnostics.status,
        total: diagnostics.checks.length,
        warnings: diagnostics.checks.filter((check) => check.status === 'warning').length,
        errors: diagnostics.checks.filter((check) => check.status === 'error').length
      },
      blockers: runtimeHealth.knownBlockers.map((blocker) => ({
        id: blocker.id,
        severity: blocker.severity,
        message: sanitizeDiagnosticText(blocker.message, cwd)
      }))
    },
    versions: {
      runtimeVersion: runtimeHealth.runtime.version,
      kernelVersion: runtimeHealth.kernel.version,
      nodeVersion: process.version,
      contracts: [
        { contractName: runtimeHealth.contractName, contractVersion: runtimeHealth.contractVersion },
        { contractName: diagnostics.contractName, contractVersion: diagnostics.contractVersion },
        ...(ledger === null ? [] : [{ contractName: ledger.contractName, contractVersion: ledger.contractVersion }])
      ]
    },
    gateStatus: projectGateStatus(ledger),
    recentFailures,
    sanitizedLogs,
    boundaries: {
      readOnly: true,
      includesSecretValues: false,
      includesRawLogBodies: false,
      includesRepoSourcePayloads: false,
      localFileOpenAvailable: false,
      shellExecutionAvailable: false,
      modelInvocationAvailable: false,
      arbitraryCommandExecutionAvailable: false,
      arbitraryPathReadAvailable: false,
      gitWriteAvailable: false,
      mergeAvailable: false,
      pushAvailable: false,
      tagAvailable: false,
      publishAvailable: false,
      selfApprovalAvailable: false,
      releaseDecisionAvailable: false,
      logPolicy: 'structured-refs-only',
      statusSource: 'explicit-events-and-backend-contracts'
    }
  });
}

export function validateAppCoreDiagnosticsBundleContract(contract) {
  const errors = [];

  if (!isPlainObject(contract)) {
    return { ok: false, errors: ['contract must be a plain object'] };
  }

  if (contract.contractName !== APP_CORE_DIAGNOSTICS_BUNDLE_CONTRACT_NAME) {
    errors.push(`contractName must be ${APP_CORE_DIAGNOSTICS_BUNDLE_CONTRACT_NAME}`);
  }

  if (contract.contractVersion !== APP_CORE_DIAGNOSTICS_BUNDLE_CONTRACT_VERSION) {
    errors.push(`contractVersion must be ${APP_CORE_DIAGNOSTICS_BUNDLE_CONTRACT_VERSION}`);
  }

  if (typeof contract.generatedAt !== 'string' || Number.isNaN(Date.parse(contract.generatedAt))) {
    errors.push('generatedAt must be an ISO timestamp');
  }

  if (contract.readOnly !== true) {
    errors.push('readOnly must be true');
  }

  validateContext(errors, contract.context);
  validateHealth(errors, contract.health);
  validateVersions(errors, contract.versions);
  validateGateStatus(errors, contract.gateStatus);
  validateRecentFailures(errors, contract.recentFailures);
  validateSanitizedLogs(errors, contract.sanitizedLogs);
  validateBoundaries(errors, contract.boundaries);

  return { ok: errors.length === 0, errors };
}

export function assertAppCoreDiagnosticsBundleContract(contract) {
  const result = validateAppCoreDiagnosticsBundleContract(contract);

  if (!result.ok) {
    throw new Error(`Invalid app core diagnostics bundle contract: ${result.errors.join('; ')}`);
  }

  return contract;
}

export function renderAppCoreDiagnosticsBundleText(contract) {
  return [
    `App core diagnostics bundle: ${contract.context?.goalId ?? 'unknown'}`,
    `resolved goal: ${contract.context?.resolvedGoalId ?? 'unknown'}`,
    `health: ${contract.health?.status ?? 'unknown'}`,
    `recent failures: ${contract.recentFailures?.length ?? 0}`,
    `gate status: ${contract.gateStatus?.goalStatus ?? 'unknown'}`,
    `sanitized log refs: ${contract.sanitizedLogs?.refs?.length ?? 0}`,
    'payload policy: sanitized health, versions, gate status, failures, and log refs only'
  ].join('\n') + '\n';
}

async function resolveDiagnosticsGoalId({ stateDir, goalId }) {
  if (goalId !== 'latest') {
    return goalId;
  }

  try {
    return await resolveGoalRunbookGoalId({ stateDir, goalId }) ?? 'latest';
  } catch {
    return 'latest';
  }
}

async function buildLedgerOrNull({ stateDir, goalId, generatedAt }) {
  try {
    return await buildGoalProgressLedger({ stateDir, goalId, generatedAt });
  } catch {
    return null;
  }
}

async function readEventLogOrEmpty({ stateDir, goalId }) {
  try {
    return await readGoalEventJournal({
      stateDir,
      goalId,
      goalTitle: goalId,
      baseline: {
        tag: 'unknown',
        commit: null,
        evidenceRef: null
      }
    });
  } catch {
    return { events: [] };
  }
}

function diagnosticHealthStatus({ runtimeHealth, diagnostics, recentFailures }) {
  if (runtimeHealth.status === 'blocked' || diagnostics.status === 'error') {
    return 'error';
  }

  if (diagnostics.status === 'warning' || recentFailures.length > 0) {
    return 'warning';
  }

  return 'ok';
}

function projectGateStatus(ledger) {
  if (ledger === null) {
    return {
      state: 'missing',
      goalStatus: 'unknown',
      releaseReady: false,
      taskCount: 0,
      mainVerifiedCount: 0,
      blockedCount: 0,
      gates: []
    };
  }

  const tasks = Array.isArray(ledger.tasks) ? ledger.tasks : [];

  return {
    state: 'available',
    goalStatus: ledger.summary?.releaseReady === true ? 'release-ready' : 'in-progress',
    releaseReady: ledger.summary?.releaseReady === true,
    taskCount: tasks.length,
    mainVerifiedCount: tasks.filter((task) => task.status === 'main-verified' || task.status === 'release-ready').length,
    blockedCount: tasks.filter((task) => task.status === 'blocked').length,
    gates: Object.entries(ledger.releaseGates ?? {}).map(([gateId, status]) => ({
      gateId,
      status,
      source: 'goal-progress-ledger.v1'
    }))
  };
}

function collectRecentFailures({ cwd, taskId, eventLog, runStates }) {
  const eventFailures = (eventLog.events ?? [])
    .filter((event) => FAILURE_EVENT_TYPES.has(event.eventType))
    .filter((event) => taskId === null || event.taskId === taskId)
    .map((event) => ({
      id: event.eventId,
      source: 'goal-event-log.v1',
      goal_id: event.goalId,
      task_id: event.taskId ?? null,
      run_id: null,
      status: event.eventType,
      failurePhase: event.phase ?? null,
      message: sanitizeDiagnosticText(event.statement ?? event.eventType, cwd),
      occurredAt: event.occurredAt ?? event.recordedAt ?? null
    }));
  const runFailures = runStates
    .filter((run) => ['failed', 'cancelled', 'blocked'].includes(run.status))
    .filter((run) => taskId === null || run.taskId === taskId || run.commandSpec?.taskId === taskId)
    .map((run) => ({
      id: run.runId,
      source: 'symphony.console-runs',
      goal_id: run.goalId ?? run.commandSpec?.goalId ?? null,
      task_id: run.taskId ?? run.commandSpec?.taskId ?? null,
      run_id: run.runId,
      status: run.status,
      failurePhase: run.failurePhase ?? run.failure?.phase ?? null,
      message: sanitizeDiagnosticText(run.failure?.message ?? run.error ?? run.failureReason ?? run.status, cwd),
      occurredAt: run.updatedAt ?? run.completedAt ?? run.createdAt ?? null
    }));

  return [...eventFailures, ...runFailures]
    .sort((left, right) => timestampValue(right.occurredAt) - timestampValue(left.occurredAt))
    .slice(0, 8);
}

function collectSanitizedLogRefs({ goalId, taskId, runStates }) {
  const refs = [
    {
      ref_id: `goal-event-log-${safeRefId(goalId)}`,
      kind: 'event-log',
      label: 'Goal event journal',
      uri: `managed-state://goals/events/${safeRefId(goalId)}.ndjson`,
      available: true,
      size_bytes: null,
      note: 'Structured event ref only; event bodies are not copied into the diagnostics bundle.'
    }
  ];

  for (const run of runStates.slice(0, 8)) {
    if (taskId !== null && run.taskId !== taskId && run.commandSpec?.taskId !== taskId) {
      continue;
    }

    refs.push({
      ref_id: `run-${safeRefId(run.runId)}`,
      kind: 'structured',
      label: `Run state ${run.runId}`,
      uri: `managed-state://runs/${safeRefId(run.runId)}.json`,
      available: true,
      size_bytes: null,
      note: 'Run state ref only; stdout and stderr bodies are excluded.'
    });
  }

  return {
    policy: 'structured-refs-only-no-log-bodies',
    refs
  };
}

function sanitizeDiagnosticText(value, cwd) {
  const redacted = redactSecrets(String(value ?? 'unknown'));
  return redacted
    .replaceAll(cwd, '[REDACTED_CWD]')
    .replace(/\/Users\/[^/\s]+/gu, '/Users/[REDACTED_USER]')
    .slice(0, 240);
}

function safeRefId(value) {
  return String(value ?? 'unknown').replace(/[^A-Za-z0-9._-]/gu, '-');
}

function timestampValue(value) {
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? 0 : parsed;
}

function validateContext(errors, context) {
  if (!isPlainObject(context)) {
    errors.push('context must be a plain object');
    return;
  }

  requireSafeRef(errors, context.goalId, 'context.goalId');
  requireSafeRef(errors, context.resolvedGoalId, 'context.resolvedGoalId');

  if (context.taskId !== null) {
    requireSafeRef(errors, context.taskId, 'context.taskId');
  }

  requireNonEmptyString(errors, context.cwdRef, 'context.cwdRef');
  requireExact(errors, context.stateSource, 'context.stateSource', 'explicit-backend-contracts');
  requireExact(errors, context.diagnosticsRole, 'context.diagnosticsRole', 'sanitized-health-and-refs-only');

  if (!Array.isArray(context.sourceContracts) || context.sourceContracts.length === 0) {
    errors.push('context.sourceContracts must be a non-empty array');
  }
}

function validateHealth(errors, health) {
  if (!isPlainObject(health)) {
    errors.push('health must be a plain object');
    return;
  }

  requireEnum(errors, health.status, 'health.status', ['ok', 'warning', 'error']);
  validatePlainObject(errors, health.runtime, 'health.runtime');
  validatePlainObject(errors, health.checks, 'health.checks');

  if (!Array.isArray(health.blockers)) {
    errors.push('health.blockers must be an array');
  }
}

function validateVersions(errors, versions) {
  if (!isPlainObject(versions)) {
    errors.push('versions must be a plain object');
    return;
  }

  requireNonEmptyString(errors, versions.runtimeVersion, 'versions.runtimeVersion');
  requireNonEmptyString(errors, versions.kernelVersion, 'versions.kernelVersion');
  requireNonEmptyString(errors, versions.nodeVersion, 'versions.nodeVersion');

  if (!Array.isArray(versions.contracts) || versions.contracts.length === 0) {
    errors.push('versions.contracts must be a non-empty array');
  }
}

function validateGateStatus(errors, gateStatus) {
  if (!isPlainObject(gateStatus)) {
    errors.push('gateStatus must be a plain object');
    return;
  }

  requireEnum(errors, gateStatus.state, 'gateStatus.state', ['available', 'missing']);

  if (!Array.isArray(gateStatus.gates)) {
    errors.push('gateStatus.gates must be an array');
  }
}

function validateRecentFailures(errors, failures) {
  if (!Array.isArray(failures)) {
    errors.push('recentFailures must be an array');
    return;
  }

  failures.forEach((failure, index) => {
    const path = `recentFailures[${index}]`;
    if (!isPlainObject(failure)) {
      errors.push(`${path} must be a plain object`);
      return;
    }

    requireNonEmptyString(errors, failure.id, `${path}.id`);
    requireNonEmptyString(errors, failure.source, `${path}.source`);
    requireNonEmptyString(errors, failure.status, `${path}.status`);
    requireNonEmptyString(errors, failure.message, `${path}.message`);
  });
}

function validateSanitizedLogs(errors, sanitizedLogs) {
  if (!isPlainObject(sanitizedLogs)) {
    errors.push('sanitizedLogs must be a plain object');
    return;
  }

  requireExact(errors, sanitizedLogs.policy, 'sanitizedLogs.policy', 'structured-refs-only-no-log-bodies');

  if (!Array.isArray(sanitizedLogs.refs) || sanitizedLogs.refs.length === 0) {
    errors.push('sanitizedLogs.refs must be a non-empty array');
  }
}

function validateBoundaries(errors, boundaries) {
  if (!isPlainObject(boundaries)) {
    errors.push('boundaries must be a plain object');
    return;
  }

  requireExact(errors, boundaries.readOnly, 'boundaries.readOnly', true);
  for (const field of FALSE_BOUNDARY_FIELDS) {
    requireExact(errors, boundaries[field], `boundaries.${field}`, false);
  }
  requireExact(errors, boundaries.logPolicy, 'boundaries.logPolicy', 'structured-refs-only');
  requireExact(errors, boundaries.statusSource, 'boundaries.statusSource', 'explicit-events-and-backend-contracts');
}

function validatePlainObject(errors, value, path) {
  if (!isPlainObject(value)) {
    errors.push(`${path} must be a plain object`);
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

function requireSafeRef(errors, value, path) {
  if (typeof value !== 'string' || value.trim() === '') {
    errors.push(`${path} must be a non-empty string`);
    return;
  }

  if (value.includes('..') || value.includes('/') || value.includes('\\') || value.length > 160) {
    errors.push(`${path} must be a safe ref`);
  }
}

function assertSafeContextRef(value, field) {
  const errors = [];
  requireSafeRef(errors, value, field);

  if (errors.length > 0) {
    throw new Error(errors.join('; '));
  }
}

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}
