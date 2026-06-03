import { readGoalEventJournal } from './goal-event-journal.js';

export const EVIDENCE_BUNDLE_CONTRACT_NAME = 'evidence-bundle.v1';
export const EVIDENCE_BUNDLE_CONTRACT_VERSION = 1;

export function summarizeEvent(event) {
  if (!isPlainObject(event)) {
    return null;
  }

  const gate = isPlainObject(event.gate) ? event.gate : null;
  const gateName = gate?.name ?? gate?.gate ?? null;
  const gateStatus = gate?.status ?? null;
  const review = isPlainObject(event.review) ? event.review : null;

  return {
    eventId: event.eventId ?? null,
    eventType: event.eventType ?? null,
    phase: event.phase ?? null,
    taskId: event.taskId ?? null,
    gate_name: gateName,
    status: gateStatus,
    review_verdict: review?.verdict ?? null,
    evidenceCount: Array.isArray(event.evidenceRefs) ? event.evidenceRefs.length : 0,
    statement: event.statement ?? null,
    occurredAt: event.occurredAt ?? null
  };
}

export async function buildEvidenceBundle({
  stateDir = '.symphony',
  goalId,
  taskId = null,
  generatedAt = new Date().toISOString()
} = {}) {
  if (typeof goalId !== 'string' || goalId.trim() === '') {
    throw new Error('goalId is required');
  }

  const eventLog = await readGoalEventJournal({ stateDir, goalId });
  const events = Array.isArray(eventLog?.events) ? eventLog.events : [];

  const summaries = events.map((event) => summarizeEvent(event)).filter(Boolean);
  const filteredSummaries = taskId !== null
    ? summaries.filter((s) => s.taskId === taskId)
    : summaries;

  const gateEvents = filteredSummaries.filter((s) => s.gate_name !== null || s.review_verdict !== null);

  return {
    contractName: EVIDENCE_BUNDLE_CONTRACT_NAME,
    contractVersion: EVIDENCE_BUNDLE_CONTRACT_VERSION,
    generatedAt,
    readOnly: true,
    context: {
      goalId,
      taskId,
      totalEvents: events.length,
      summarizedEvents: summaries.length,
      matchedEvents: filteredSummaries.length,
      gateEvents: gateEvents.length,
      dataSource: 'goal-event-log.v1'
    },
    events: filteredSummaries,
    gateEvents,
    boundaries: {
      readOnly: true,
      shellExecutionAvailable: false,
      modelInvocationAvailable: false,
      arbitraryPathReadAvailable: false,
      arbitraryCommandExecutionAvailable: false,
      gitWriteAvailable: false,
      mergeAvailable: false,
      pushAvailable: false,
      tagAvailable: false,
      publishAvailable: false
    }
  };
}

export function validateEvidenceBundleContract(bundle) {
  const errors = [];

  if (!isPlainObject(bundle)) {
    return { ok: false, errors: ['bundle must be a plain object'] };
  }

  if (bundle.contractName !== EVIDENCE_BUNDLE_CONTRACT_NAME) {
    errors.push(`contractName must be ${EVIDENCE_BUNDLE_CONTRACT_NAME}`);
  }

  if (bundle.contractVersion !== EVIDENCE_BUNDLE_CONTRACT_VERSION) {
    errors.push(`contractVersion must be ${EVIDENCE_BUNDLE_CONTRACT_VERSION}`);
  }

  if (typeof bundle.generatedAt !== 'string' || Number.isNaN(Date.parse(bundle.generatedAt))) {
    errors.push('generatedAt must be an ISO timestamp');
  }

  if (bundle.readOnly !== true) {
    errors.push('readOnly must be true');
  }

  if (!isPlainObject(bundle.context)) {
    errors.push('context must be a plain object');
  } else {
    if (typeof bundle.context.goalId !== 'string' || bundle.context.goalId.trim() === '') {
      errors.push('context.goalId must be a non-empty string');
    }

    if (!['goal-event-log.v1'].includes(bundle.context.dataSource)) {
      errors.push('context.dataSource must be goal-event-log.v1');
    }
  }

  if (!Array.isArray(bundle.events)) {
    errors.push('events must be an array');
  }

  if (!Array.isArray(bundle.gateEvents)) {
    errors.push('gateEvents must be an array');
  }

  if (!isPlainObject(bundle.boundaries)) {
    errors.push('boundaries must be a plain object');
  }

  return { ok: errors.length === 0, errors };
}

export function assertEvidenceBundleContract(bundle) {
  const result = validateEvidenceBundleContract(bundle);

  if (!result.ok) {
    throw new Error(`Invalid evidence bundle contract: ${result.errors.join('; ')}`);
  }

  return bundle;
}

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}
