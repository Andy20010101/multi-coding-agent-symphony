import { buildGoalNextAction } from './goal-next-action-resolver.js';
import { buildGoalProgressLedger } from './goal-progress-ledger.js';
import { buildLocalRuntimeHealth } from './local-runtime-health.js';
import { resolveCurrentProject } from './project-registry.js';

export const APP_STATE_SNAPSHOT_CONTRACT_NAME = 'app-state-snapshot.v1';
export const APP_STATE_SNAPSHOT_CONTRACT_VERSION = 1;

export async function buildAppStateSnapshot({
  cwd = process.cwd(),
  repoPath,
  stateDir,
  goalId,
  startedAt = new Date().toISOString(),
  generatedAt = new Date().toISOString(),
  nowMs = Date.now(),
  staleAfterMs = 5 * 60 * 1000
} = {}) {
  const freshness = buildSnapshotFreshness({
    generatedAt,
    nowMs,
    staleAfterMs
  });
  const runtimeHealth = await buildLocalRuntimeHealth({
    cwd,
    startedAt,
    generatedAt
  });
  const currentProject = await resolveCurrentProject({
    cwd,
    repoPath,
    stateDir,
    generatedAt
  });
  const resolvedStateDir = stateDir ?? currentProject.resolution.stateDir;
  const resolvedGoalId = goalId ?? currentProject.currentProject?.last_goal_id ?? 'latest';
  const knownBlockers = [
    ...runtimeHealth.knownBlockers.map((blocker) => ({
      ...blocker,
      source: 'runtime_health'
    })),
    ...currentProject.resolution.blockers.map((blocker) => ({
      ...blocker,
      source: 'current_project'
    }))
  ];

  const ledger = await buildGoalProgressLedger({
    stateDir: resolvedStateDir,
    goalId: resolvedGoalId,
    generatedAt
  });
  const nextAction = await buildGoalNextAction({
    stateDir: resolvedStateDir,
    goalId: resolvedGoalId,
    generatedAt
  });

  if (ledger === null) {
    knownBlockers.push({
      id: 'active-goal-missing',
      severity: 'warning',
      source: 'goal-status',
      message: `No managed goal progress ledger was found for ${resolvedGoalId}.`
    });
  }

  if (nextAction.next?.blocked === true || nextAction.status === 'blocked') {
    knownBlockers.push({
      id: 'next-action-blocked',
      severity: 'warning',
      source: 'goal-next',
      message: nextAction.reason
    });
  }

  if (freshness.status === 'stale') {
    knownBlockers.push({
      id: 'runtime-snapshot-stale',
      severity: 'warning',
      source: 'app-state-snapshot',
      message: `Runtime snapshot is older than ${freshness.stale_after_ms}ms.`
    });
  }

  const currentTask = resolveCurrentTask({ ledger, nextAction });
  const releaseStatus = buildReleaseStatus(ledger);

  if (releaseStatus === null) {
    knownBlockers.push({
      id: 'release-status-missing',
      severity: 'warning',
      source: 'goal-status',
      message: 'Release status is unavailable because active goal state is missing.'
    });
  } else if (releaseStatus.release_ready_source === null) {
    knownBlockers.push({
      id: 'release-ready-not-declared',
      severity: 'info',
      source: 'goal-status',
      message: 'No explicit release.ready declaration is recorded.'
    });
  }

  for (const blocker of ledger?.blockers ?? []) {
    knownBlockers.push({
      id: `${blocker.taskId ?? 'goal'}-blocker`,
      severity: 'warning',
      source: 'goal-status',
      message: blocker.summary ?? blocker.reason ?? 'Goal blocker is recorded.',
      ref: blocker
    });
  }

  return assertAppStateSnapshotContract({
    contractName: APP_STATE_SNAPSHOT_CONTRACT_NAME,
    contractVersion: APP_STATE_SNAPSHOT_CONTRACT_VERSION,
    generatedAt,
    readOnly: true,
    freshness,
    current_project: currentProject,
    runtime_health: runtimeHealth,
    active_goal: ledger === null ? null : {
      goal_id: ledger.goalId,
      goal_title: ledger.goalTitle,
      baseline: ledger.baseline,
      summary: ledger.summary,
      status_source: ledger.contractName
    },
    current_task: currentTask,
    next_action: nextAction,
    review_status: buildReviewStatus(currentTask),
    main_verification_status: buildMainVerificationStatus(currentTask),
    release_status: releaseStatus,
    evidence_refs: buildEvidenceRefs({ ledger, nextAction, currentTask }),
    known_blockers: knownBlockers,
    source_data: {
      state_dir: resolvedStateDir,
      requested_goal_id: resolvedGoalId,
      current_project_goal_id: currentProject.currentProject?.last_goal_id ?? null,
      goal_status_source: ledger === null ? null : 'goal-progress-ledger.v1',
      next_action_source: nextAction.contractName,
      release_status_source: releaseStatus === null ? null : 'goal-progress-ledger.v1'
    },
    boundaries: {
      readOnly: true,
      writesInSnapshotPath: false,
      actionExecutionAvailable: false,
      jobQueueAvailable: false,
      modelInvocationAvailable: false,
      gitWriteAvailable: false,
      releaseWriteAvailable: false,
      arbitraryCommandExecutionAvailable: false,
      confirmCommandAvailable: false
    }
  });
}

export function validateAppStateSnapshotContract(snapshot) {
  const errors = [];

  if (!isPlainObject(snapshot)) {
    return { ok: false, errors: ['snapshot must be a plain object'] };
  }

  requireExact(errors, snapshot.contractName, 'contractName', APP_STATE_SNAPSHOT_CONTRACT_NAME);
  requireExact(errors, snapshot.contractVersion, 'contractVersion', APP_STATE_SNAPSHOT_CONTRACT_VERSION);
  requireIsoTimestamp(errors, snapshot.generatedAt, 'generatedAt');
  requireExact(errors, snapshot.readOnly, 'readOnly', true);

  for (const field of [
    'freshness',
    'current_project',
    'runtime_health',
    'next_action',
    'evidence_refs',
    'known_blockers',
    'source_data',
    'boundaries'
  ]) {
    if (!Object.hasOwn(snapshot, field)) {
      errors.push(`${field} is required`);
    }
  }

  if (snapshot.active_goal !== null) {
    validateActiveGoal(errors, snapshot.active_goal);
  }

  if (snapshot.current_task !== null) {
    validateCurrentTask(errors, snapshot.current_task);
  }

  if (snapshot.review_status !== null) {
    validateReviewStatus(errors, snapshot.review_status);
  }

  if (snapshot.main_verification_status !== null) {
    validateMainVerificationStatus(errors, snapshot.main_verification_status);
  }

  if (snapshot.release_status !== null) {
    validateReleaseStatus(errors, snapshot.release_status);
  }

  validateFreshness(errors, snapshot.freshness);
  validateEvidenceRefs(errors, snapshot.evidence_refs);
  validateKnownBlockers(errors, snapshot.known_blockers);
  validateSourceData(errors, snapshot.source_data);
  validateBoundaries(errors, snapshot.boundaries);

  return { ok: errors.length === 0, errors };
}

export function assertAppStateSnapshotContract(snapshot) {
  const result = validateAppStateSnapshotContract(snapshot);

  if (!result.ok) {
    throw new Error(`Invalid app state snapshot contract: ${result.errors.join('; ')}`);
  }

  return snapshot;
}

function buildSnapshotFreshness({ generatedAt, nowMs, staleAfterMs }) {
  const generatedAtMs = Date.parse(generatedAt);
  const ageMs = Number.isFinite(generatedAtMs)
    ? Math.max(0, nowMs - generatedAtMs)
    : 0;
  const normalizedStaleAfterMs = Number.isInteger(staleAfterMs) && staleAfterMs > 0
    ? staleAfterMs
    : 5 * 60 * 1000;

  return {
    status: ageMs > normalizedStaleAfterMs ? 'stale' : 'current',
    generated_at: generatedAt,
    age_ms: ageMs,
    stale_after_ms: normalizedStaleAfterMs
  };
}

function resolveCurrentTask({ ledger, nextAction }) {
  const taskId = nextAction.next?.taskId ?? null;

  if (taskId === null) {
    return null;
  }

  const ledgerTask = ledger?.tasks?.find((task) => task.taskId === taskId) ?? null;

  return {
    task_id: taskId,
    title: ledgerTask?.title ?? null,
    status: ledgerTask?.status ?? null,
    status_source: ledgerTask?.statusSource ?? null,
    branch: ledgerTask?.branch ?? null,
    role: nextAction.next?.role ?? null,
    phase: nextAction.next?.phase ?? null,
    reason: nextAction.next?.reason ?? nextAction.reason ?? null,
    blocked: nextAction.next?.blocked ?? nextAction.status === 'blocked',
    ledger_task: ledgerTask
  };
}

function buildReviewStatus(currentTask) {
  if (currentTask === null) {
    return null;
  }

  return {
    task_id: currentTask.task_id,
    verdict: currentTask.ledger_task?.reviewVerdict ?? null,
    evidence_ref: currentTask.ledger_task?.reviewEvidenceRef ?? null,
    status_source: currentTask.ledger_task?.reviewEvidenceRef === null ? null : currentTask.status_source
  };
}

function buildMainVerificationStatus(currentTask) {
  if (currentTask === null) {
    return null;
  }

  return {
    task_id: currentTask.task_id,
    status: currentTask.ledger_task?.mainVerificationRef === null ? null : currentTask.ledger_task?.status ?? null,
    evidence_ref: currentTask.ledger_task?.mainVerificationRef ?? null,
    status_source: currentTask.ledger_task?.mainVerificationRef === null ? null : currentTask.status_source
  };
}

function buildReleaseStatus(ledger) {
  if (ledger === null) {
    return null;
  }

  return {
    release_ready: ledger.summary.releaseReady,
    release_ready_source: ledger.summary.releaseReadySource,
    release_gates: ledger.releaseGates,
    missing_or_unknown_gates: Object.entries(ledger.releaseGates)
      .filter(([, status]) => status !== 'passed')
      .map(([gate_id, status]) => ({ gate_id, status })),
    status_source: 'goal-progress-ledger.v1'
  };
}

function buildEvidenceRefs({ ledger, nextAction, currentTask }) {
  const refs = [];

  for (const task of ledger?.tasks ?? []) {
    pushEvidenceRef(refs, {
      kind: 'worker',
      task_id: task.taskId,
      ref: task.workerEvidenceRef,
      source: task.statusSource
    });
    pushEvidenceRef(refs, {
      kind: 'review',
      task_id: task.taskId,
      ref: task.reviewEvidenceRef,
      source: task.statusSource
    });
    pushEvidenceRef(refs, {
      kind: 'main-verification',
      task_id: task.taskId,
      ref: task.mainVerificationRef,
      source: task.statusSource
    });
  }

  for (const [kind, ref] of Object.entries(nextAction.evidenceState ?? {})) {
    pushEvidenceRef(refs, {
      kind,
      task_id: currentTask?.task_id ?? null,
      ref,
      source: nextAction.contractName
    });
  }

  return refs;
}

function pushEvidenceRef(refs, { kind, task_id, ref, source }) {
  if (typeof ref !== 'string' || ref.trim() === '') {
    return;
  }

  if (refs.some((existing) => existing.kind === kind && existing.task_id === task_id && existing.ref === ref)) {
    return;
  }

  refs.push({
    kind,
    task_id,
    ref,
    source: source ?? null
  });
}

function validateFreshness(errors, freshness) {
  if (!isPlainObject(freshness)) {
    errors.push('freshness must be a plain object');
    return;
  }

  if (!['current', 'stale'].includes(freshness.status)) {
    errors.push('freshness.status must be current or stale');
  }

  requireIsoTimestamp(errors, freshness.generated_at, 'freshness.generated_at');

  if (!Number.isInteger(freshness.age_ms) || freshness.age_ms < 0) {
    errors.push('freshness.age_ms must be a non-negative integer');
  }

  if (!Number.isInteger(freshness.stale_after_ms) || freshness.stale_after_ms < 1) {
    errors.push('freshness.stale_after_ms must be a positive integer');
  }
}

function validateActiveGoal(errors, activeGoal) {
  if (!isPlainObject(activeGoal)) {
    errors.push('active_goal must be null or a plain object');
    return;
  }

  requireNonEmptyString(errors, activeGoal.goal_id, 'active_goal.goal_id');
  requireNonEmptyString(errors, activeGoal.goal_title, 'active_goal.goal_title');
  requireNonEmptyString(errors, activeGoal.status_source, 'active_goal.status_source');
}

function validateCurrentTask(errors, task) {
  if (!isPlainObject(task)) {
    errors.push('current_task must be null or a plain object');
    return;
  }

  requireNonEmptyString(errors, task.task_id, 'current_task.task_id');

  if (task.title !== null) {
    requireNonEmptyString(errors, task.title, 'current_task.title');
  }

  if (task.blocked !== true && task.blocked !== false) {
    errors.push('current_task.blocked must be boolean');
  }
}

function validateReviewStatus(errors, status) {
  if (!isPlainObject(status)) {
    errors.push('review_status must be null or a plain object');
    return;
  }

  requireNonEmptyString(errors, status.task_id, 'review_status.task_id');

  if (status.verdict !== null) {
    requireNonEmptyString(errors, status.verdict, 'review_status.verdict');
  }
}

function validateMainVerificationStatus(errors, status) {
  if (!isPlainObject(status)) {
    errors.push('main_verification_status must be null or a plain object');
    return;
  }

  requireNonEmptyString(errors, status.task_id, 'main_verification_status.task_id');

  if (status.status !== null) {
    requireNonEmptyString(errors, status.status, 'main_verification_status.status');
  }
}

function validateReleaseStatus(errors, status) {
  if (!isPlainObject(status)) {
    errors.push('release_status must be null or a plain object');
    return;
  }

  if (status.release_ready !== true && status.release_ready !== false) {
    errors.push('release_status.release_ready must be boolean');
  }

  if (status.release_ready_source !== null) {
    requireNonEmptyString(errors, status.release_ready_source, 'release_status.release_ready_source');
  }

  if (!isPlainObject(status.release_gates)) {
    errors.push('release_status.release_gates must be a plain object');
  }

  if (!Array.isArray(status.missing_or_unknown_gates)) {
    errors.push('release_status.missing_or_unknown_gates must be an array');
  }
}

function validateEvidenceRefs(errors, refs) {
  if (!Array.isArray(refs)) {
    errors.push('evidence_refs must be an array');
    return;
  }

  refs.forEach((ref, index) => {
    if (!isPlainObject(ref)) {
      errors.push(`evidence_refs[${index}] must be a plain object`);
      return;
    }

    requireNonEmptyString(errors, ref.kind, `evidence_refs[${index}].kind`);
    requireNonEmptyString(errors, ref.ref, `evidence_refs[${index}].ref`);
  });
}

function validateKnownBlockers(errors, blockers) {
  if (!Array.isArray(blockers)) {
    errors.push('known_blockers must be an array');
    return;
  }

  blockers.forEach((blocker, index) => {
    if (!isPlainObject(blocker)) {
      errors.push(`known_blockers[${index}] must be a plain object`);
      return;
    }

    requireNonEmptyString(errors, blocker.id, `known_blockers[${index}].id`);
    requireNonEmptyString(errors, blocker.severity, `known_blockers[${index}].severity`);
    requireNonEmptyString(errors, blocker.source, `known_blockers[${index}].source`);
    requireNonEmptyString(errors, blocker.message, `known_blockers[${index}].message`);
  });
}

function validateSourceData(errors, sourceData) {
  if (!isPlainObject(sourceData)) {
    errors.push('source_data must be a plain object');
    return;
  }

  requireNonEmptyString(errors, sourceData.state_dir, 'source_data.state_dir');
  requireNonEmptyString(errors, sourceData.requested_goal_id, 'source_data.requested_goal_id');
}

function validateBoundaries(errors, boundaries) {
  if (!isPlainObject(boundaries)) {
    errors.push('boundaries must be a plain object');
    return;
  }

  for (const [field, expected] of Object.entries({
    readOnly: true,
    writesInSnapshotPath: false,
    actionExecutionAvailable: false,
    jobQueueAvailable: false,
    modelInvocationAvailable: false,
    gitWriteAvailable: false,
    releaseWriteAvailable: false,
    arbitraryCommandExecutionAvailable: false,
    confirmCommandAvailable: false
  })) {
    requireExact(errors, boundaries[field], `boundaries.${field}`, expected);
  }
}

function requireExact(errors, actual, field, expected) {
  if (actual !== expected) {
    errors.push(`${field} must be ${String(expected)}`);
  }
}

function requireNonEmptyString(errors, value, field) {
  if (typeof value !== 'string' || value.trim() === '') {
    errors.push(`${field} must be a non-empty string`);
  }
}

function requireIsoTimestamp(errors, value, field) {
  if (typeof value !== 'string' || Number.isNaN(Date.parse(value))) {
    errors.push(`${field} must be an ISO timestamp`);
  }
}

function isPlainObject(value) {
  return Object.prototype.toString.call(value) === '[object Object]';
}
