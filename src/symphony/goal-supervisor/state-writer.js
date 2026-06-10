import { buildGoalSupervisorEventRegistrarPreview } from './event-registrar.js';

export const GOAL_SUPERVISOR_STATE_WRITER_PREVIEW_CONTRACT_NAME = 'goal-supervisor-state-writer-preview.v1';
export const GOAL_SUPERVISOR_STATE_WRITER_PREVIEW_CONTRACT_VERSION = 1;

const REGISTRATION_PREVIEW_OPERATION_ID = 'managed-goal-event-registration-preview';

export async function buildGoalSupervisorStateWriterPreview(options = {}) {
  if (!isPlainObject(options)) {
    throw new TypeError('state writer preview options must be a plain object');
  }

  const requestedMode = typeof options.requestedMode === 'string'
    ? options.requestedMode
    : (typeof options.writeMode === 'string' ? options.writeMode : 'dry-run');
  const eventRegistrar = await buildGoalSupervisorEventRegistrarPreview({
    ...options,
    requestedMode
  });
  const registrationOperation = buildRegistrationPreviewOperation({
    eventRegistrar,
    requestedMode
  });

  return {
    contractName: GOAL_SUPERVISOR_STATE_WRITER_PREVIEW_CONTRACT_NAME,
    contractVersion: GOAL_SUPERVISOR_STATE_WRITER_PREVIEW_CONTRACT_VERSION,
    readOnly: true,
    willMutate: false,
    writer: {
      id: 'goal-supervisor-state-writer',
      singleWriter: true,
      owns: [
        'managed-goal-event-registration-preview',
        'registration-audit-preview'
      ],
      operationVocabulary: [
        REGISTRATION_PREVIEW_OPERATION_ID
      ],
      statuses: [
        'preview',
        'trusted-registration',
        'refused'
      ],
      refusalReasons: [
        'unsafe-write-requested',
        'missing-registration-audit',
        'release-closeout-not-authorized',
        'release-gate-not-identified',
        'event-plan-build-failed'
      ]
    },
    requestedMode,
    status: eventRegistrar.status,
    reason: eventRegistrar.reason,
    refusalReasons: eventRegistrar.refusalReasons,
    resultSource: eventRegistrar.resultSource,
    target: eventRegistrar.target,
    targetEvent: eventRegistrar.targetEvent,
    registration: registrationOperation.registration,
    auditRequirement: registrationOperation.auditRequirement,
    refusal: registrationOperation.refusal,
    eventPlan: eventRegistrar.eventPlan,
    operations: [registrationOperation],
    eventRegistrar,
    boundaries: buildWriterBoundaries(eventRegistrar)
  };
}

function buildRegistrationPreviewOperation({
  eventRegistrar,
  requestedMode
}) {
  const refused = eventRegistrar.status === 'refused';
  const trusted = eventRegistrar.status === 'trusted-registration';
  const registrationAction = actionForStatus(eventRegistrar.status);

  return {
    id: REGISTRATION_PREVIEW_OPERATION_ID,
    kind: 'managed-goal-event-registration-preview',
    requestedMode,
    mode: 'dry-run',
    status: eventRegistrar.status,
    reason: eventRegistrar.reason,
    readOnly: true,
    willMutate: false,
    resultSource: eventRegistrar.resultSource,
    target: eventRegistrar.target,
    registration: {
      action: registrationAction,
      targetEvent: eventRegistrar.targetEvent,
      eventPlan: eventRegistrar.eventPlan,
      wouldAppend: refused || trusted ? null : buildWouldAppendPreview(eventRegistrar),
      alreadyRecorded: trusted
    },
    auditRequirement: buildAuditRequirementPreview(eventRegistrar),
    refusal: {
      refused,
      reason: refused ? eventRegistrar.reason : null,
      reasons: refused ? eventRegistrar.refusalReasons : [],
      error: refused ? eventRegistrar.error : null
    },
    boundaries: {
      dryRunOnly: true,
      writesInPreview: false,
      liveManagedGoalAppendIntroduced: false,
      confirmExecutorAvailable: false,
      nonGoalStateWriteAvailable: false,
      appendMustUseExistingGoalContracts: true
    }
  };
}

function actionForStatus(status) {
  if (status === 'preview') {
    return 'would-register-goal-event';
  }

  if (status === 'trusted-registration') {
    return 'already-registered-with-audit';
  }

  return 'refused';
}

function buildWouldAppendPreview(eventRegistrar) {
  const eventPlan = eventRegistrar.eventPlan;
  const wouldAppend = eventPlan?.wouldAppend ?? {};

  return {
    appendOnly: wouldAppend.appendOnly === true,
    eventCount: typeof wouldAppend.eventCount === 'number' ? wouldAppend.eventCount : 0,
    target: wouldAppend.target ?? eventRegistrar.target?.storage ?? null,
    writesInDryRun: false,
    executorAvailable: false
  };
}

function buildAuditRequirementPreview(eventRegistrar) {
  const registrationAudit = eventRegistrar.registrationAudit ?? {};

  return {
    required: registrationAudit.required === true,
    matched: registrationAudit.matched === true,
    source: registrationAudit.source ?? null,
    audit: registrationAudit.audit ?? null,
    missing: eventRegistrar.refusalReasons.includes('missing-registration-audit'),
    requiredBecause: 'single-writer registration preview requires a goal-event-registered audit for already recorded or planned events'
  };
}

function buildWriterBoundaries(eventRegistrar) {
  return {
    dryRunOnly: true,
    writesInPreview: false,
    liveManagedGoalAppendIntroduced: false,
    confirmExecutorAvailable: false,
    nonGoalStateWriteAvailable: false,
    appendMustUseExistingGoalContracts: eventRegistrar.boundaries?.appendMustUseExistingGoalContracts === true
  };
}

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}
