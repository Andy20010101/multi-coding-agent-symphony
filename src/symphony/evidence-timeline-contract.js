export const EVIDENCE_TIMELINE_CONTRACT_NAME = 'evidence-timeline.v1';
export const EVIDENCE_TIMELINE_CONTRACT_VERSION = 1;

export const RELEASE_BUNDLE_CONTRACT_NAME = 'release-bundle.v1';
export const RELEASE_BUNDLE_CONTRACT_VERSION = 1;

const EVIDENCE_KINDS = Object.freeze([
  'worker',
  'reviewer',
  'main-verifier',
  'release-manager'
]);

const ACTOR_ROLE_EVIDENCE_KIND = Object.freeze({
  worker: 'worker',
  reviewer: 'reviewer',
  'main-verifier': 'main-verifier',
  'release-verifier': 'release-manager',
  'release-manager': 'release-manager'
});

const REQUIRED_SOURCE_CONTRACTS = Object.freeze([
  'artifact-store.v1',
  'artifact-index.v1',
  'goal-event-log.v1',
  'goal-progress-ledger.v1',
  'goal-runbook.v1'
]);

const CANONICAL_SOURCE_LOCKED = 'ArtifactStore is canonical, timeline is derived view only';

export function buildEvidenceTimelineContract({
  goalId = 'latest',
  taskId = null,
  entries = [],
  goalEvents = [],
  generatedAt = new Date().toISOString()
} = {}) {
  const timeline = buildTimelineEntries(entries, goalEvents);

  return assertEvidenceTimelineContract({
    contractName: EVIDENCE_TIMELINE_CONTRACT_NAME,
    contractVersion: EVIDENCE_TIMELINE_CONTRACT_VERSION,
    generatedAt,
    readOnly: true,
    context: {
      goalId,
      taskId,
      sourceContracts: [
        'artifact-store.v1',
        'artifact-index.v1',
        'goal-event-log.v1',
        'goal-progress-ledger.v1',
        'goal-runbook.v1'
      ],
      stateSource: 'explicit-backend-contracts',
      canonicalSource: 'ArtifactStore',
      timelineRole: 'derived-view-only',
      entryCount: timeline.length
    },
    timeline,
    boundaries: evidenceTimelineBoundaries()
  });
}

export function buildReleaseBundleContract({
  goalId = 'latest',
  entries = [],
  goalEvents = [],
  goalProgress = null,
  generatedAt = new Date().toISOString()
} = {}) {
  const bundle = buildReleaseBundle(goalId, entries, goalEvents, goalProgress);

  return assertReleaseBundleContract({
    contractName: RELEASE_BUNDLE_CONTRACT_NAME,
    contractVersion: RELEASE_BUNDLE_CONTRACT_VERSION,
    generatedAt,
    readOnly: true,
    context: {
      goalId,
      sourceContracts: [
        'artifact-store.v1',
        'artifact-index.v1',
        'goal-event-log.v1',
        'goal-progress-ledger.v1',
        'goal-runbook.v1'
      ],
      stateSource: 'explicit-backend-contracts',
      canonicalSource: 'ArtifactStore',
      bundleRole: 'derived-view-only'
    },
    bundle,
    boundaries: releaseBundleBoundaries()
  });
}

function buildTimelineEntries(entries, goalEvents) {
  const timeline = [];

  for (const entry of entries) {
    if (!isPlainObject(entry)) continue;

    timeline.push({
      artifact_ref: entry.artifact_ref ?? null,
      goal_id: entry.goal_id ?? 'latest',
      task_id: entry.task_id ?? null,
      kind: entry.kind ?? 'evidence',
      evidence_kind: entry.evidence_kind ?? null,
      timestamp: entry.timestamps?.created_at ?? entry.timestamps?.indexed_at ?? null,
      content_hash: entry.content_hash ?? null,
      labels: Array.isArray(entry.labels) ? entry.labels : [],
      file_path: null
    });
  }

  for (const event of goalEvents) {
    if (!isPlainObject(event)) continue;

    const evidenceKind = ACTOR_ROLE_EVIDENCE_KIND[event.actor?.role] ?? null;

    const evidenceRefs = Array.isArray(event.evidenceRefs)
      ? event.evidenceRefs
      : [];

    for (const ref of evidenceRefs) {
      const refStr = isPlainObject(ref) && typeof ref.ref === 'string' ? ref.ref : null;
      if (refStr === null) continue;

      const alreadyInTimeline = timeline.some(
        (t) => t.artifact_ref === refStr
      );
      if (alreadyInTimeline) continue;

      timeline.push({
        artifact_ref: refStr,
        goal_id: event.goalId ?? 'latest',
        task_id: event.taskId ?? null,
        kind: 'evidence',
        evidence_kind: evidenceKind,
        timestamp: event.occurredAt ?? event.recordedAt ?? null,
        content_hash: null,
        labels: [],
        file_path: null
      });
    }
  }

  timeline.sort((a, b) => {
    if (a.timestamp === null || b.timestamp === null) return 0;
    return a.timestamp.localeCompare(b.timestamp);
  });

  return timeline;
}

function ensureTask(tasks, taskId) {
  if (!tasks[taskId]) {
    tasks[taskId] = {
      taskId,
      workerEvidence: [],
      reviewEvidence: [],
      mainVerification: [],
      releaseEvidence: []
    };
  }
  return tasks[taskId];
}

function collectEvidenceRefs(event) {
  const refs = Array.isArray(event.evidenceRefs) ? event.evidenceRefs : [];
  return refs
    .filter((r) => isPlainObject(r) && typeof r.ref === 'string')
    .map((r) => r.ref);
}

function buildReleaseBundle(goalId, entries, goalEvents, goalProgress) {
  const tasks = {};
  const releaseGates = [];
  let releaseReady = false;

  // Track evidence refs already added from goal events, per task×kind.
  // Key: `${taskId}::${kind}` → Set of ref strings.
  const seenRefs = new Map();

  function markSeen(taskId, kind, refs) {
    const key = `${taskId}::${kind}`;
    if (!seenRefs.has(key)) {
      seenRefs.set(key, new Set());
    }
    const set = seenRefs.get(key);
    for (const r of refs) {
      if (typeof r === 'string' && r.length > 0) {
        set.add(r);
      }
    }
  }

  function isSeen(taskId, kind, ref) {
    const set = seenRefs.get(`${taskId}::${kind}`);
    return set !== undefined && set.has(ref);
  }

  // Track release gate uniqueness: eventId → already added.
  const seenGateEventIds = new Set();
  // Also track release-ready declaration eventIds.
  const seenReleaseReadyEventIds = new Set();

  for (const event of goalEvents) {
    if (!isPlainObject(event)) continue;

    const taskId = event.taskId ?? 'unknown';
    const eventType = event.eventType ?? '';
    const refs = collectEvidenceRefs(event);

    // worker.evidence-recorded
    if (eventType === 'worker.evidence-recorded') {
      // Deduplicate: only keep refs not previously seen for this task×worker.
      const newRefs = refs.filter((r) => !isSeen(taskId, 'worker', r));
      markSeen(taskId, 'worker', newRefs);

      ensureTask(tasks, taskId).workerEvidence.push({
        eventId: event.eventId ?? null,
        evidenceRefs: newRefs,
        timestamp: event.occurredAt ?? event.recordedAt ?? null,
        actor: event.actor?.id ?? null
      });
      continue;
    }

    // reviewer.approved / reviewer.needs-revision
    if (eventType === 'reviewer.approved' || eventType === 'reviewer.needs-revision') {
      const newRefs = refs.filter((r) => !isSeen(taskId, 'reviewer', r));
      markSeen(taskId, 'reviewer', newRefs);

      ensureTask(tasks, taskId).reviewEvidence.push({
        eventId: event.eventId ?? null,
        evidenceRefs: newRefs,
        timestamp: event.occurredAt ?? event.recordedAt ?? null,
        verdict: event.review?.verdict ?? null,
        reviewer: event.actor?.id ?? null
      });
      continue;
    }

    // main.verification-passed / main.verification-failed
    if (eventType === 'main.verification-passed' || eventType === 'main.verification-failed') {
      const newRefs = refs.filter((r) => !isSeen(taskId, 'main-verifier', r));
      markSeen(taskId, 'main-verifier', newRefs);

      ensureTask(tasks, taskId).mainVerification.push({
        eventId: event.eventId ?? null,
        evidenceRefs: newRefs,
        timestamp: event.occurredAt ?? event.recordedAt ?? null,
        gate: event.gate?.name ?? 'main-verification',
        status: event.gate?.status ?? null,
        verifier: event.actor?.id ?? null
      });
      continue;
    }

    // release.gate-passed / release.gate-failed
    if (eventType === 'release.gate-passed' || eventType === 'release.gate-failed') {
      const eventId = event.eventId ?? null;

      // Deduplicate by eventId.
      if (eventId !== null && seenGateEventIds.has(eventId)) {
        continue;
      }
      if (eventId !== null) {
        seenGateEventIds.add(eventId);
      }

      releaseGates.push({
        gate: event.gate?.name ?? 'unknown',
        status: event.gate?.status ?? null,
        eventId,
        evidenceRefs: refs,
        timestamp: event.occurredAt ?? event.recordedAt ?? null,
        verifier: event.actor?.id ?? null
      });
      continue;
    }

    // release.ready-declared — the only event type that sets releaseReady
    if (eventType === 'release.ready-declared') {
      const eventId = event.eventId ?? null;

      // Deduplicate release-ready declarations.
      if (eventId !== null && seenReleaseReadyEventIds.has(eventId)) {
        releaseReady = true; // still mark releaseReady even if gate already recorded
        continue;
      }
      if (eventId !== null) {
        seenReleaseReadyEventIds.add(eventId);
      }

      releaseReady = true;
      releaseGates.push({
        gate: 'release.ready',
        status: event.gate?.status ?? 'declared',
        eventId,
        evidenceRefs: refs,
        timestamp: event.occurredAt ?? event.recordedAt ?? null,
        verifier: event.actor?.id ?? null
      });
      continue;
    }
  }

  // Append artifact index entries as supplementary data only.
  // Skip any entry whose artifact_ref was already covered by goal events.
  for (const entry of entries) {
    if (!isPlainObject(entry)) continue;
    if (entry.kind !== 'evidence') continue;
    if (entry.goal_id !== goalId && goalId !== 'latest') continue;

    const taskId = entry.task_id ?? 'unknown';
    const entryRef = entry.artifact_ref ?? null;
    const evidenceKind = entry.evidence_kind ?? null;

    const kindKey = evidenceKind === 'reviewer' ? 'reviewer'
      : evidenceKind === 'main-verifier' ? 'main-verifier'
      : evidenceKind === 'release-manager' ? 'release-manager'
      : 'worker';

    // Skip if this artifact_ref was already added from goal events.
    if (entryRef !== null && isSeen(taskId, kindKey, entryRef)) {
      continue;
    }

    // Mark as seen so subsequent duplicate index entries are also skipped.
    if (entryRef !== null) {
      markSeen(taskId, kindKey, [entryRef]);
    }

    const targetArray = kindKey === 'worker' ? ensureTask(tasks, taskId).workerEvidence
      : kindKey === 'reviewer' ? ensureTask(tasks, taskId).reviewEvidence
      : kindKey === 'main-verifier' ? ensureTask(tasks, taskId).mainVerification
      : kindKey === 'release-manager' ? ensureTask(tasks, taskId).releaseEvidence
      : null;

    if (targetArray) {
      targetArray.push({
        artifact_ref: entry.artifact_ref ?? null,
        content_hash: entry.content_hash ?? null,
        timestamp: entry.timestamps?.created_at ?? null,
        labels: Array.isArray(entry.labels) ? entry.labels : []
      });
    }
  }

  const taskList = Object.values(tasks);
  taskList.sort((a, b) => a.taskId.localeCompare(b.taskId));

  return {
    goalId,
    taskCount: taskList.length,
    tasks: taskList,
    releaseGates,
    releaseReady,
    note: 'Release bundle shows evidence per task grouped by worker/reviewer/main-verifier/release-manager evidence kinds. releaseReady is set only by release.ready-declared events, never by release.gate-passed. All data is derived from ArtifactStore and goal events. This is a read-only view, not a release authorization.'
  };
}

export function validateEvidenceTimelineContract(contract) {
  const errors = [];

  if (!isPlainObject(contract)) {
    return { ok: false, errors: ['contract must be a plain object'] };
  }

  requireExact(errors, contract.contractName, 'contractName', EVIDENCE_TIMELINE_CONTRACT_NAME);
  requireExact(errors, contract.contractVersion, 'contractVersion', EVIDENCE_TIMELINE_CONTRACT_VERSION);
  requireIsoTimestamp(errors, contract.generatedAt, 'generatedAt');
  requireExact(errors, contract.readOnly, 'readOnly', true);

  validateTimelineContext(errors, contract.context);
  validateTimelineEntries(errors, contract.timeline);
  validateTimelineBoundaries(errors, contract.boundaries);

  return { ok: errors.length === 0, errors };
}

export function assertEvidenceTimelineContract(contract) {
  const result = validateEvidenceTimelineContract(contract);

  if (!result.ok) {
    throw new Error(`Invalid evidence timeline contract: ${result.errors.join('; ')}`);
  }

  return contract;
}

export function validateReleaseBundleContract(contract) {
  const errors = [];

  if (!isPlainObject(contract)) {
    return { ok: false, errors: ['contract must be a plain object'] };
  }

  requireExact(errors, contract.contractName, 'contractName', RELEASE_BUNDLE_CONTRACT_NAME);
  requireExact(errors, contract.contractVersion, 'contractVersion', RELEASE_BUNDLE_CONTRACT_VERSION);
  requireIsoTimestamp(errors, contract.generatedAt, 'generatedAt');
  requireExact(errors, contract.readOnly, 'readOnly', true);

  validateBundleContext(errors, contract.context);
  validateBundle(errors, contract.bundle);
  validateReleaseBundleBoundaries(errors, contract.boundaries);

  return { ok: errors.length === 0, errors };
}

export function assertReleaseBundleContract(contract) {
  const result = validateReleaseBundleContract(contract);

  if (!result.ok) {
    throw new Error(`Invalid release bundle contract: ${result.errors.join('; ')}`);
  }

  return contract;
}

function validateTimelineContext(errors, context) {
  if (!isPlainObject(context)) {
    errors.push('context must be a plain object');
    return;
  }

  requireSafeRef(errors, context.goalId, 'context.goalId');

  if (context.taskId !== null) {
    requireSafeRef(errors, context.taskId, 'context.taskId');
  }

  if (!Array.isArray(context.sourceContracts) || context.sourceContracts.length === 0) {
    errors.push('context.sourceContracts must be a non-empty array');
  } else {
    for (const required of REQUIRED_SOURCE_CONTRACTS) {
      if (!context.sourceContracts.includes(required)) {
        errors.push(`context.sourceContracts must include ${required}`);
      }
    }
  }

  requireExact(errors, context.stateSource, 'context.stateSource', 'explicit-backend-contracts');
  requireExact(errors, context.canonicalSource, 'context.canonicalSource', 'ArtifactStore');
  requireExact(errors, context.timelineRole, 'context.timelineRole', 'derived-view-only');

  if (typeof context.entryCount !== 'number' || context.entryCount < 0) {
    errors.push('context.entryCount must be a non-negative number');
  }
}

function validateBundleContext(errors, context) {
  if (!isPlainObject(context)) {
    errors.push('context must be a plain object');
    return;
  }

  requireSafeRef(errors, context.goalId, 'context.goalId');

  if (!Array.isArray(context.sourceContracts) || context.sourceContracts.length === 0) {
    errors.push('context.sourceContracts must be a non-empty array');
  } else {
    for (const required of REQUIRED_SOURCE_CONTRACTS) {
      if (!context.sourceContracts.includes(required)) {
        errors.push(`context.sourceContracts must include ${required}`);
      }
    }
  }

  requireExact(errors, context.stateSource, 'context.stateSource', 'explicit-backend-contracts');
  requireExact(errors, context.canonicalSource, 'context.canonicalSource', 'ArtifactStore');
  requireExact(errors, context.bundleRole, 'context.bundleRole', 'derived-view-only');
}

function validateTimelineEntries(errors, timeline) {
  if (!Array.isArray(timeline)) {
    errors.push('timeline must be an array');
    return;
  }

  for (let i = 0; i < timeline.length; i++) {
    const entry = timeline[i];
    if (!isPlainObject(entry)) {
      errors.push(`timeline[${i}] must be a plain object`);
      continue;
    }

    if (entry.artifact_ref !== null && typeof entry.artifact_ref !== 'string') {
      errors.push(`timeline[${i}].artifact_ref must be null or a string`);
    }

    if (typeof entry.goal_id === 'string') {
      requireSafeRef(errors, entry.goal_id, `timeline[${i}].goal_id`);
    } else {
      errors.push(`timeline[${i}].goal_id must be a safe ref`);
    }

    if (entry.task_id !== null) {
      requireSafeRef(errors, entry.task_id, `timeline[${i}].task_id`);
    }

    if (entry.evidence_kind !== null && !EVIDENCE_KINDS.includes(entry.evidence_kind)) {
      errors.push(`timeline[${i}].evidence_kind must be one of ${EVIDENCE_KINDS.join(', ')}`);
    }

    if (entry.timestamp !== null && typeof entry.timestamp !== 'string') {
      errors.push(`timeline[${i}].timestamp must be null or a string`);
    }

    if (typeof entry.kind !== 'string') {
      errors.push(`timeline[${i}].kind must be a string`);
    }
  }
}

function validateBundle(errors, bundle) {
  if (!isPlainObject(bundle)) {
    errors.push('bundle must be a plain object');
    return;
  }

  requireSafeRef(errors, bundle.goalId, 'bundle.goalId');

  if (typeof bundle.taskCount !== 'number' || bundle.taskCount < 0) {
    errors.push('bundle.taskCount must be a non-negative number');
  }

  if (!Array.isArray(bundle.tasks)) {
    errors.push('bundle.tasks must be an array');
  }

  if (!Array.isArray(bundle.releaseGates)) {
    errors.push('bundle.releaseGates must be an array');
  }

  if (typeof bundle.releaseReady !== 'boolean') {
    errors.push('bundle.releaseReady must be a boolean');
  }

  if (typeof bundle.note !== 'string' || bundle.note.trim().length === 0) {
    errors.push('bundle.note must be a non-empty string');
  }
}

function evidenceTimelineBoundaries() {
  return {
    readOnly: true,
    dataSource: 'derived-from-artifact-index-and-goal-events',
    canonicalSource: CANONICAL_SOURCE_LOCKED,
    shellExecutionAvailable: false,
    modelInvocationAvailable: false,
    arbitraryPathReadAvailable: false,
    arbitraryCommandExecutionAvailable: false,
    gitWriteAvailable: false,
    mergeAvailable: false,
    pushAvailable: false,
    tagAvailable: false,
    publishAvailable: false,
    artifactDownloadAvailable: false,
    localFileOpenAvailable: false,
    selfApprovalAvailable: false,
    secondArtifactStoreAvailable: false
  };
}

function releaseBundleBoundaries() {
  return {
    readOnly: true,
    dataSource: 'derived-from-artifact-index-and-goal-events',
    canonicalSource: CANONICAL_SOURCE_LOCKED,
    shellExecutionAvailable: false,
    modelInvocationAvailable: false,
    arbitraryPathReadAvailable: false,
    arbitraryCommandExecutionAvailable: false,
    gitWriteAvailable: false,
    mergeAvailable: false,
    pushAvailable: false,
    tagAvailable: false,
    publishAvailable: false,
    artifactDownloadAvailable: false,
    localFileOpenAvailable: false,
    selfApprovalAvailable: false,
    secondArtifactStoreAvailable: false,
    releaseDecisionAvailable: false
  };
}

function validateTimelineBoundaries(errors, boundaries) {
  if (!isPlainObject(boundaries)) {
    errors.push('boundaries must be a plain object');
    return;
  }

  requireExact(errors, boundaries.readOnly, 'boundaries.readOnly', true);
  requireExact(errors, boundaries.canonicalSource, 'boundaries.canonicalSource', CANONICAL_SOURCE_LOCKED);

  for (const field of [
    'shellExecutionAvailable',
    'modelInvocationAvailable',
    'arbitraryPathReadAvailable',
    'arbitraryCommandExecutionAvailable',
    'gitWriteAvailable',
    'mergeAvailable',
    'pushAvailable',
    'tagAvailable',
    'publishAvailable',
    'artifactDownloadAvailable',
    'localFileOpenAvailable',
    'selfApprovalAvailable',
    'secondArtifactStoreAvailable'
  ]) {
    requireExact(errors, boundaries[field], `boundaries.${field}`, false);
  }
}

function validateReleaseBundleBoundaries(errors, boundaries) {
  if (!isPlainObject(boundaries)) {
    errors.push('boundaries must be a plain object');
    return;
  }
  validateTimelineBoundaries(errors, boundaries);
  requireExact(errors, boundaries.releaseDecisionAvailable, 'boundaries.releaseDecisionAvailable', false);
}

function requireExact(errors, value, path, expected) {
  if (value !== expected) {
    errors.push(`${path} must be ${String(expected)}`);
  }
}

function requireIsoTimestamp(errors, value, path) {
  if (typeof value !== 'string' || Number.isNaN(Date.parse(value))) {
    errors.push(`${path} must be an ISO timestamp`);
  }
}

function requireSafeRef(errors, value, path) {
  if (typeof value !== 'string' || !/^[A-Za-z0-9][A-Za-z0-9._-]*$/u.test(value)) {
    errors.push(`${path} must be a safe ref`);
  }
}

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}
