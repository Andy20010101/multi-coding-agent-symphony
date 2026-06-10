import { buildGoalGatePlan } from '../goal-gate.js';
import { getManagedGoalEventJournalPath } from '../goal-event-journal.js';
import { buildGoalReviewPlan } from '../goal-review.js';
import { buildGoalUpdatePlan } from '../goal-update.js';
import {
  evaluateReleaseRegistrarCloseoutAuthorization,
  identifyReleaseGateForResult,
  isReleaseManagerGateEvent,
  normalizeReleaseGates
} from './release-policy.js';

export const GOAL_SUPERVISOR_EVENT_REGISTRAR_PREVIEW_CONTRACT_NAME = 'goal-supervisor-event-registrar-preview.v1';
export const GOAL_SUPERVISOR_EVENT_REGISTRAR_PREVIEW_CONTRACT_VERSION = 1;

const SUPERVISOR_ACTOR_IDS = Object.freeze({
  worker: 'local-goal-supervisor-worker',
  reviewer: 'local-goal-supervisor-reviewer',
  'main-verifier': 'local-goal-supervisor-main-verifier',
  'release-manager': 'local-goal-supervisor-release-manager'
});

export async function buildGoalSupervisorEventRegistrarPreview(options = {}) {
  const normalized = normalizeEventRegistrarInput(options);
  const unsafeReasons = unsafePreviewReasons(normalized);

  if (unsafeReasons.length > 0) {
    return refusedPreview({
      normalized,
      reason: unsafeReasons[0],
      refusalReasons: unsafeReasons
    });
  }

  const existingEvent = findMatchingGoalEvent({
    events: normalized.goalEvents,
    result: normalized.result,
    releaseGate: normalized.releaseGate
  });
  const registrationAudit = findMatchingRegistrationAudit({
    audits: normalized.registrationAudits,
    result: normalized.result,
    releaseGate: normalized.releaseGate
  });

  if (existingEvent !== null && registrationAudit === null) {
    return refusedPreview({
      normalized,
      reason: 'missing-registration-audit',
      targetEvent: eventTargetFromExisting({
        event: existingEvent,
        result: normalized.result,
        releaseGate: normalized.releaseGate
      }),
      refusalReasons: ['missing-registration-audit']
    });
  }

  if (existingEvent !== null && registrationAudit !== null) {
    return previewEnvelope({
      normalized,
      status: 'trusted-registration',
      reason: 'matching-goal-event-and-registration-audit',
      targetEvent: eventTargetFromExisting({
        event: existingEvent,
        result: normalized.result,
        releaseGate: normalized.releaseGate
      }),
      registrationAudit: {
        required: true,
        matched: true,
        source: 'goal-event-registered',
        audit: registrationAudit
      },
      eventPlan: null,
      refusalReasons: []
    });
  }

  try {
    const eventPlan = await buildDryRunEventPlan(normalized);

    return previewEnvelope({
      normalized,
      status: 'preview',
      reason: 'dry-run-event-plan-ready',
      targetEvent: eventTargetFromPlan({
        plan: eventPlan,
        result: normalized.result,
        releaseGate: normalized.releaseGate
      }),
      registrationAudit: {
        required: true,
        matched: false,
        source: 'planned-goal-event-registration-audit',
        audit: buildRegistrationAuditPreview({
          result: normalized.result,
          releaseGate: normalized.releaseGate
        })
      },
      eventPlan,
      refusalReasons: []
    });
  } catch (error) {
    return refusedPreview({
      normalized,
      reason: error?.code ?? 'event-plan-build-failed',
      refusalReasons: [error?.code ?? 'event-plan-build-failed'],
      error: {
        code: error?.code ?? 'event-plan-build-failed',
        message: error?.safeDetails?.reason ?? error?.message ?? 'event plan could not be built'
      }
    });
  }
}

function normalizeEventRegistrarInput(options) {
  if (!isPlainObject(options)) {
    throw new TypeError('event registrar preview options must be a plain object');
  }

  const result = normalizeResult(options.result ?? options.pendingResult?.result ?? options.pendingResult?.record);
  const releaseGates = normalizeReleaseGates(options.releaseGates, {
    useDefault: true
  });
  const releaseGate = identifyReleaseGateForResult({
    result,
    releaseGates
  });
  const stateDir = isNonEmptyString(options.stateDir) ? options.stateDir : '.symphony';

  return {
    stateDir,
    requestedMode: isNonEmptyString(options.requestedMode) ? options.requestedMode : 'dry-run',
    allowCloseout: options.allowCloseout === true,
    result,
    releaseGates,
    releaseGate,
    goalEvents: normalizeGoalEvents(options.goalEvents ?? options.state?.goalEvents ?? options.state?.events),
    registrationAudits: normalizeRegistrationAudits(
      options.registrationAudits ?? options.state?.registrationAudits ?? options.state?.auditLog
    )
  };
}

function normalizeResult(result) {
  if (!isPlainObject(result)) {
    throw new TypeError('event registrar preview requires a validated result record');
  }

  const normalized = {
    goalId: requireString(result.goalId, 'result.goalId'),
    taskId: requireString(result.taskId, 'result.taskId'),
    role: requireString(result.role, 'result.role'),
    eventToRegister: requireString(result.eventToRegister, 'result.eventToRegister'),
    evidenceRef: requireString(result.evidenceRef, 'result.evidenceRef'),
    branch: nullIfMissing(result.branch),
    headCommit: nullIfMissing(result.headCommit),
    commandsRun: nullIfMissing(result.commandsRun),
    validation: nullIfMissing(result.validation)
  };

  if (!Object.hasOwn(SUPERVISOR_ACTOR_IDS, normalized.role)) {
    throw new TypeError(`unsupported result role: ${normalized.role}`);
  }

  return normalized;
}

function unsafePreviewReasons(normalized) {
  const reasons = [];

  if (!['dry-run', 'preview'].includes(normalized.requestedMode)) {
    reasons.push('unsafe-write-requested');
  }

  const closeoutDecision = evaluateReleaseRegistrarCloseoutAuthorization({
    result: normalized.result,
    allowCloseout: normalized.allowCloseout
  });

  if (closeoutDecision.denied) {
    reasons.push(...closeoutDecision.reasons);
  }

  if (
    normalized.result.role === 'release-manager' &&
    isReleaseManagerGateEvent(normalized.result.eventToRegister) &&
    normalized.releaseGate === null
  ) {
    reasons.push('release-gate-not-identified');
  }

  return reasons;
}

async function buildDryRunEventPlan(normalized) {
  const result = normalized.result;

  if (result.role === 'worker') {
    return buildGoalUpdatePlan({
      stateDir: normalized.stateDir,
      goalId: result.goalId,
      taskId: result.taskId,
      eventType: result.eventToRegister,
      actorId: SUPERVISOR_ACTOR_IDS.worker,
      evidenceRefs: [result.evidenceRef],
      branch: result.branch,
      commit: result.headCommit
    });
  }

  if (result.role === 'reviewer') {
    return buildGoalReviewPlan({
      stateDir: normalized.stateDir,
      goalId: result.goalId,
      taskId: result.taskId,
      reviewerId: SUPERVISOR_ACTOR_IDS.reviewer,
      verdict: result.eventToRegister === 'reviewer.approved' ? 'approved' : 'needs-revision',
      evidenceRefs: [result.evidenceRef],
      branch: result.branch,
      commit: result.headCommit
    });
  }

  if (result.role === 'main-verifier') {
    return buildGoalGatePlan({
      stateDir: normalized.stateDir,
      goalId: result.goalId,
      taskId: result.taskId,
      gateName: 'main-verification',
      status: result.eventToRegister === 'main.verification-passed' ? 'passed' : 'failed',
      verifierId: SUPERVISOR_ACTOR_IDS['main-verifier'],
      evidenceRefs: [result.evidenceRef],
      branch: result.branch,
      commit: result.headCommit
    });
  }

  if (result.role === 'release-manager' && isReleaseManagerGateEvent(result.eventToRegister)) {
    return buildGoalGatePlan({
      stateDir: normalized.stateDir,
      goalId: result.goalId,
      gateName: normalized.releaseGate,
      status: result.eventToRegister === 'release.gate-passed' ? 'passed' : 'failed',
      verifierId: SUPERVISOR_ACTOR_IDS['release-manager'],
      evidenceRefs: [result.evidenceRef],
      branch: result.branch,
      commit: result.headCommit
    });
  }

  if (result.role === 'release-manager' && result.eventToRegister === 'release.ready-declared') {
    return buildGoalGatePlan({
      stateDir: normalized.stateDir,
      goalId: result.goalId,
      gateName: 'release.ready',
      status: 'declared',
      verifierId: SUPERVISOR_ACTOR_IDS['release-manager'],
      evidenceRefs: [result.evidenceRef],
      branch: result.branch,
      commit: result.headCommit
    });
  }

  throw new Error(`unsupported event registration: ${result.role}/${result.eventToRegister}`);
}

function previewEnvelope({
  normalized,
  status,
  reason,
  targetEvent,
  registrationAudit,
  eventPlan,
  refusalReasons
}) {
  return {
    contractName: GOAL_SUPERVISOR_EVENT_REGISTRAR_PREVIEW_CONTRACT_NAME,
    contractVersion: GOAL_SUPERVISOR_EVENT_REGISTRAR_PREVIEW_CONTRACT_VERSION,
    readOnly: true,
    willMutate: false,
    status,
    reason,
    refusalReasons,
    resultSource: {
      goalId: normalized.result.goalId,
      taskId: normalized.result.taskId,
      role: normalized.result.role,
      eventToRegister: normalized.result.eventToRegister,
      evidenceRef: normalized.result.evidenceRef,
      branch: normalized.result.branch,
      headCommit: normalized.result.headCommit
    },
    target: {
      journalPath: getManagedGoalEventJournalPath({
        stateDir: normalized.stateDir,
        goalId: normalized.result.goalId
      }),
      storage: 'managed-goal-event-journal',
      stateDir: normalized.stateDir
    },
    targetEvent,
    registrationAudit,
    registrationDecision: buildRegistrationDecision({
      status,
      reason,
      targetEvent,
      registrationAudit,
      eventPlan,
      refusalReasons
    }),
    eventPlan: eventPlan === null ? null : summarizeEventPlan(eventPlan),
    boundaries: {
      dryRunOnly: true,
      writesInPreview: false,
      confirmExecutorAvailable: false,
      liveManagedGoalAppendIntroduced: false,
      appendMustUseExistingGoalContracts: true
    }
  };
}

function buildRegistrationDecision({
  status,
  reason,
  targetEvent,
  registrationAudit,
  eventPlan,
  refusalReasons
}) {
  return {
    action: registrationDecisionAction(status),
    status,
    reason,
    refused: status === 'refused',
    refusalReasons,
    targetEventReady: targetEvent !== null,
    planReady: eventPlan !== null,
    auditRequired: registrationAudit?.required === true,
    auditMatched: registrationAudit?.matched === true,
    appendExecutorAvailable: false
  };
}

function registrationDecisionAction(status) {
  if (status === 'preview') {
    return 'would-register-goal-event';
  }

  if (status === 'trusted-registration') {
    return 'trust-existing-goal-event-registration';
  }

  return 'refuse-goal-event-registration-preview';
}

function refusedPreview({
  normalized,
  reason,
  targetEvent = null,
  refusalReasons,
  error = null
}) {
  return {
    ...previewEnvelope({
      normalized,
      status: 'refused',
      reason,
      targetEvent,
      registrationAudit: {
        required: true,
        matched: false,
        source: 'goal-event-registered',
        audit: null
      },
      eventPlan: null,
      refusalReasons
    }),
    error
  };
}

function summarizeEventPlan(plan) {
  return {
    contractName: plan.contractName,
    contractVersion: plan.contractVersion,
    planId: plan.planId,
    planHash: plan.planHash,
    mode: plan.mode,
    command: plan.command,
    actor: plan.actor,
    proposedEvents: plan.proposedEvents,
    validation: plan.validation,
    wouldAppend: plan.wouldAppend,
    confirm: {
      requiredFlags: plan.confirm?.requiredFlags ?? [],
      copyOnlyCommand: plan.confirm?.copyOnlyCommand ?? null,
      executorAvailable: false
    },
    safety: {
      ...plan.safety,
      dryRunWrites: false
    }
  };
}

function eventTargetFromPlan({ plan, result, releaseGate }) {
  const proposedEvent = plan.proposedEvents[0] ?? {};

  return {
    goalId: result.goalId,
    taskId: proposedEvent.taskId ?? null,
    eventType: proposedEvent.eventType,
    phase: proposedEvent.phase,
    actor: plan.actor,
    evidenceRefs: proposedEvent.evidenceRefs ?? [],
    branch: proposedEvent.branch ?? result.branch,
    commit: proposedEvent.commit ?? result.headCommit,
    statement: proposedEvent.statement ?? null,
    gate: proposedEvent.gate ?? (releaseGate === null ? undefined : {
      name: releaseGate,
      status: result.eventToRegister.endsWith('-passed') ? 'passed' : 'failed'
    })
  };
}

function eventTargetFromExisting({ event, result, releaseGate }) {
  return {
    eventId: event.eventId ?? null,
    sequence: event.sequence ?? null,
    goalId: event.goalId ?? result.goalId,
    taskId: event.taskId ?? null,
    eventType: event.eventType ?? result.eventToRegister,
    phase: event.phase ?? null,
    actor: event.actor ?? {
      role: result.role,
      id: SUPERVISOR_ACTOR_IDS[result.role]
    },
    evidenceRefs: Array.isArray(event.evidenceRefs) ? event.evidenceRefs : evidenceRefsFor(result.evidenceRef),
    branch: event.branch ?? result.branch,
    commit: event.commit ?? result.headCommit,
    statement: event.statement ?? null,
    gate: event.gate ?? (releaseGate === null ? undefined : { name: releaseGate })
  };
}

function buildRegistrationAuditPreview({ result, releaseGate }) {
  return {
    type: 'goal-event-registered',
    registration: {
      eventId: null,
      goalId: result.goalId,
      taskId: result.taskId,
      ledgerTaskId: result.role === 'release-manager' ? null : result.taskId,
      role: result.role,
      eventToRegister: result.eventToRegister,
      evidenceRef: result.evidenceRef,
      releaseGate: result.role === 'release-manager' ? releaseGate : null
    }
  };
}

function findMatchingGoalEvent({ events, result, releaseGate }) {
  const ledgerTaskId = result.role === 'release-manager' ? null : result.taskId;

  return events.find((event) => {
    const evidenceRefs = Array.isArray(event.evidenceRefs) ? event.evidenceRefs : [];
    const hasEvidenceRef = evidenceRefs.some((entry) => entry?.ref === result.evidenceRef || entry === result.evidenceRef);
    const eventReleaseGate = event.gate?.name ?? null;
    const releaseGateMatches = releaseGate === null || eventReleaseGate === releaseGate;

    return event.goalId === result.goalId &&
      (event.taskId ?? null) === ledgerTaskId &&
      event.eventType === result.eventToRegister &&
      hasEvidenceRef &&
      releaseGateMatches;
  }) ?? null;
}

function findMatchingRegistrationAudit({ audits, result, releaseGate }) {
  const expectedLedgerTaskId = result.role === 'release-manager' ? null : result.taskId;

  return audits.find((entry) => {
    const registration = entry?.registration ?? entry;
    if (!isPlainObject(registration)) {
      return false;
    }

    const releaseGateMatches = releaseGate === null || registration.releaseGate === releaseGate;

    return registration.goalId === result.goalId &&
      registration.role === result.role &&
      registration.eventToRegister === result.eventToRegister &&
      registration.evidenceRef === result.evidenceRef &&
      registration.ledgerTaskId === expectedLedgerTaskId &&
      releaseGateMatches;
  }) ?? null;
}

function normalizeGoalEvents(value) {
  if (Array.isArray(value)) {
    return value.filter(isPlainObject);
  }

  return [];
}

function normalizeRegistrationAudits(value) {
  if (Array.isArray(value)) {
    return value.filter(isPlainObject);
  }

  return [];
}

function evidenceRefsFor(ref) {
  return [{
    kind: 'repo-doc',
    ref,
    label: `Evidence for ${ref}`
  }];
}

function nullIfMissing(value) {
  return isNonEmptyString(value) ? value : null;
}

function requireString(value, field) {
  if (!isNonEmptyString(value)) {
    throw new TypeError(`${field} must be a non-empty string`);
  }

  return value;
}

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim() !== '';
}
