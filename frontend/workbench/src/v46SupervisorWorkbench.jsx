import { useEffect, useState } from 'react';

import {
  confirmGoalEventPlan,
  confirmResultEscrow,
  fetchGoalEventPlanPreview,
  previewResultIntake
} from './api/client.js';

const CANONICAL_BLOCKED_MUTATION_FAMILIES = Object.freeze([
  'daemon-control',
  'provider-cli',
  'real-cli',
  'release-closeout',
  'git-tag'
]);

const DEFAULT_HEALTH = Object.freeze({
  state: 'healthy',
  observedOnly: true,
  daemonState: 'observed only',
  contextState: 'fresh',
  gateState: 'frontend baseline',
  duplicateDispatchAllowed: false,
  reason: 'local read-only sample'
});

const RESULT_INTAKE_SOURCE_KIND = 'manual-paste';
const RESULT_INTAKE_MAX_BLOCK_LENGTH = 12000;

const RESULT_INTAKE_BOUNDARY_NOTICES = Object.freeze([
  'This does not run a provider.',
  'This does not dispatch a child.',
  'This does not append a goal event.',
  'This only creates pending result escrow after confirm.'
]);

const RESULT_INTAKE_BOUNDARIES = Object.freeze({
  providerExecutionAvailable: false,
  childDispatchAvailable: false,
  directGoalEventAppendAvailable: false,
  untrustedTranscriptProjectionAvailable: false,
  frontendLocalFileReadAvailable: false,
  reviewerMutationAvailable: false,
  mainVerificationMutationAvailable: false,
  releaseGateMutationAvailable: false,
  gitMutationAvailable: false,
  githubReleaseAutomationAvailable: false
});

const RESULT_INTAKE_PREVIEW_IDLE_STATE = Object.freeze({
  identity: 'NULL',
  phase: 'idle',
  request: null,
  preview: null,
  result: null,
  message: null
});

const RESULT_ESCROW_CONFIRM_IDLE_STATE = Object.freeze({
  identity: 'NULL',
  phase: 'idle',
  result: null,
  message: null
});

export const SUPERVISOR_REFRESH_IDLE_STATE = Object.freeze({
  phase: 'idle',
  source: 'NULL',
  result: 'NULL',
  message: 'NULL'
});

export const SUPERVISOR_WORKBENCH_VIEW = Object.freeze({
  contractName: 'supervisor-dashboard-state.v46',
  contractVersion: 1,
  source: 'local-sample-fallback',
  routeSource: 'frontend/workbench/src/v46SupervisorWorkbench.jsx',
  goalId: 'v45-backend-entrypoint-decomposition',
  generatedAt: '2026-06-10T13:24:00+08:00',
  readOnly: true,
  willMutate: false,
  activeTask: 'v46 frontend baseline planning',
  activeRole: 'supervisor-monitor',
  health: DEFAULT_HEALTH,
  currentGate: Object.freeze({
    gate: 'frontend baseline',
    condition: 'OpenDesign focused-v2 handoff accepted as visual baseline',
    nextArtifact: 'v46 Workbench frontend runbook implementation slice'
  }),
  recommendedNextAction: Object.freeze({
    status: 'confirm-required',
    text: 'Draft v46 Workbench frontend runbook after OpenDesign exploration.'
  }),
  activeLease: Object.freeze({
    leaseId: 'lease-v46-ui-prototype-004',
    threadId: '019eb1-ui-prototype-claude-warm-v4',
    health: 'healthy'
  }),
  context: Object.freeze({
    utilizationPercent: 62,
    chips: Object.freeze([
      'focused-v2 handoff loaded',
      'static model',
      'no network reads',
      'copyOnly boundary'
    ])
  }),
  sessionSourceInventory: Object.freeze({
    state: 'missing',
    contract: 'sessionSourceInventory.v1',
    generatedAt: 'NULL',
    readOnly: true,
    summary: 'providers 0; available 0; missing 0; degraded 0; failed 0',
    providers: Object.freeze([
      Object.freeze('missing: backend inventory contract not available')
    ]),
    degradedReasons: Object.freeze(['missing'])
  }),
  contextAdvisory: Object.freeze({
    state: 'unknown',
    contract: 'contextAdvisory.v1',
    generatedAt: 'NULL',
    readOnly: true,
    transcriptAvailability: 'missing',
    exchangeCount: 'missing',
    latestToolCall: 'missing',
    latestTurnState: 'missing',
    tokenUsage: 'missing',
    contextUtilization: 'missing',
    contextBand: 'unknown',
    resultBlockEvidence: 'missing',
    staleTranscriptState: 'stale: false',
    missingTranscriptState: 'missing: true',
    blockedFields: Object.freeze(['contextAdvisory']),
    degradedReasons: Object.freeze(['missing']),
    policyInputs: Object.freeze([
      'transcript: missing'
    ])
  }),
  threadContinuationDecision: Object.freeze({
    state: 'unknown',
    contract: 'threadContinuationDecision.v1',
    generatedAt: 'NULL',
    readOnly: true,
    decision: 'unknown',
    reason: 'missing thread continuation decision',
    confidence: 'unknown',
    targetRole: 'NULL',
    taskId: 'NULL',
    threadId: 'NULL',
    checkpointRef: 'NULL',
    waitPolicy: 'NULL',
    blockedFields: Object.freeze(['threadContinuationDecision']),
    mismatchList: Object.freeze(['none']),
    requiredEvidence: Object.freeze(['missing']),
    sourceContracts: Object.freeze(['missing']),
    commandBoundary: Object.freeze({
      state: 'disabled',
      executionAvailable: false,
      copyOnly: true,
      blockedFamilies: Object.freeze([])
    })
  }),
  pendingResult: Object.freeze({
    label: 'none / NULL',
    output: null,
    contract: '[ EMPTY ]',
    reason: 'NULL',
    state: 'NULL',
    escrowRef: 'NULL',
    evidenceRefs: 'NULL',
    blockedReasons: Object.freeze(['none'])
  }),
  resultIntake: Object.freeze({
    state: 'disabled',
    sourceKind: RESULT_INTAKE_SOURCE_KIND,
    goalId: 'v45-backend-entrypoint-decomposition',
    taskId: 'NULL',
    workerRole: 'worker',
    previewRoute: 'NULL',
    confirmRoute: 'NULL',
    disabledReason: 'task id unavailable',
    boundaryNotices: RESULT_INTAKE_BOUNDARY_NOTICES
  }),
  eventPreview: Object.freeze({
    contract: 'supervisorEventRegistrationEligibility.v1',
    state: 'unknown',
    reason: 'eligibility contract not available',
    readOnly: true,
    willMutate: false,
    canPreview: false,
    requestMethod: 'NULL',
    route: 'NULL',
    previewPath: 'NULL',
    confirmMethod: 'NULL',
    confirmRoute: 'NULL',
    confirmContentType: 'NULL',
    canConfirmRoute: false,
    confirmBodyBase: null,
    queryRows: Object.freeze([]),
    missingInputs: Object.freeze(['supervisorEventRegistrationEligibility']),
    recommendedEvent: Object.freeze({
      eventType: 'NULL',
      taskId: 'NULL',
      actorRole: 'NULL',
      actorId: 'NULL',
      evidenceRefs: 'NULL',
      statement: 'NULL',
      blocker: 'NULL'
    }),
    previewResult: null
  }),
  commandBoundary: Object.freeze({
    state: 'disabled',
    executionAvailable: false,
    copyOnly: true,
    blockedCommandFamilies: Object.freeze([
      'provider-cli',
      'real-cli',
      'child-dispatch',
      'event-log-write',
      'tag',
      'release-closeout'
    ]),
    blockedMutationFamilies: Object.freeze([
      ...CANONICAL_BLOCKED_MUTATION_FAMILIES
    ])
  }),
  timeline: Object.freeze([
    Object.freeze({
      index: '01',
      title: 'OpenDesign artifact received',
      copy: 'Focused v2 package defines the static supervisor workbench baseline and read-only constraints.'
    }),
    Object.freeze({
      index: '02',
      title: 'Preflight completed',
      copy: 'Repository commands, Vite entry point, and existing workbench supervisor route were inspected before implementation.'
    }),
    Object.freeze({
      index: '03',
      title: 'Static model attached',
      copy: 'The supervisor path now renders from an immutable local view model before any live state connection.'
    }),
    Object.freeze({
      index: '04',
      title: 'Next integration remains separate',
      copy: 'Real supervisor state can replace the local model after route contracts define the same fields.'
    })
  ]),
  ownership: Object.freeze([
    Object.freeze({
      name: 'daemon',
      responsibility: 'Owns background observation and lease projection outside the browser.'
    }),
    Object.freeze({
      name: 'controller',
      responsibility: 'Owns implementation sequencing, verification, and recovery decisions.'
    }),
    Object.freeze({
      name: 'supervisor-monitor',
      responsibility: 'Owns this read-only view and does not write state.'
    })
  ])
});

export function projectSupervisorDashboardToWorkbenchView(dashboard, routeState = null) {
  if (dashboard === null || typeof dashboard !== 'object') {
    return SUPERVISOR_WORKBENCH_VIEW;
  }

  if (isLiveSupervisorDashboard(dashboard, routeState) && !hasReadOnlySafety(dashboard)) {
    return rejectedLiveSupervisorView(dashboard, routeState);
  }

  const goalSnapshot = objectValue(dashboard.goalSnapshot);
  const currentGate = objectValue(dashboard.currentGate);
  const nextAction = objectValue(dashboard.recommendedNextAction);
  const activeLease = objectValue(dashboard.activeLease);
  const contextStatus = objectValue(dashboard.contextStatus);
  const sessionSourceInventory = objectValue(dashboard.sessionSourceInventory);
  const contextAdvisory = objectValue(dashboard.contextAdvisory);
  const threadContinuationDecision = objectValue(dashboard.threadContinuationDecision);
  const pendingResult = objectValue(dashboard.pendingResult);
  const commandBoundary = objectValue(dashboard.commandBoundary);
  const eventRegistrationEligibility = objectValue(dashboard.supervisorEventRegistrationEligibility);
  const ownership = objectValue(dashboard.ownership);
  const timeline = Array.isArray(dashboard.goalTimeline) ? dashboard.goalTimeline : [];

  return Object.freeze({
    contractName: 'supervisor-dashboard-state.v46',
    contractVersion: 1,
    source: textValue(dashboard.contractName ?? dashboard.sourceMode ?? dashboard.source ?? 'goal-supervisor-app-read-model.v1'),
    routeSource: textValue(routeState?.source ?? dashboard.route?.path ?? dashboard.source ?? 'goal supervisor route'),
    goalId: textValue(goalSnapshot.goalId ?? dashboard.goalId ?? SUPERVISOR_WORKBENCH_VIEW.goalId),
    generatedAt: textValue(dashboard.generatedAt ?? goalSnapshot.generatedAt ?? SUPERVISOR_WORKBENCH_VIEW.generatedAt),
    readOnly: true,
    willMutate: false,
    activeTask: textValue(goalSnapshot.activeTask ?? 'NULL'),
    activeRole: textValue(goalSnapshot.activeRole ?? ownership.orchestrationOwner ?? 'supervisor-monitor'),
    health: supervisorHealth(dashboard, activeLease, contextStatus, currentGate, ownership),
    currentGate: Object.freeze({
      gate: textValue(currentGate.gateId ?? currentGate.status ?? 'unknown'),
      condition: textValue(currentGate.blockingReason ?? currentGate.evidenceRequirement ?? routeState?.state ?? 'observed from supervisor read model'),
      nextArtifact: textValue(nextAction.label ?? nextAction.actionId ?? 'pendingResult.output')
    }),
    recommendedNextAction: Object.freeze({
      status: textValue(nextAction.state ?? nextAction.actionId ?? 'confirm-required'),
      text: textValue(nextAction.reason ?? nextAction.label ?? SUPERVISOR_WORKBENCH_VIEW.recommendedNextAction.text)
    }),
    activeLease: Object.freeze({
      leaseId: textValue(activeLease.leaseId ?? 'NULL'),
      threadId: textValue(activeLease.threadId ?? 'NULL'),
      health: textValue(activeLease.status ?? activeLease.phase ?? 'observed-only')
    }),
    context: Object.freeze({
      utilizationPercent: utilizationPercent(contextStatus.utilization),
      chips: Object.freeze(contextChips(contextStatus))
    }),
    sessionSourceInventory: sessionSourceInventoryView(sessionSourceInventory),
    contextAdvisory: contextAdvisoryView(contextAdvisory),
    threadContinuationDecision: threadContinuationDecisionView(threadContinuationDecision, commandBoundary),
    pendingResult: Object.freeze({
      label: textValue(pendingResult.status ?? 'none / NULL'),
      output: null,
      contract: textValue(pendingResult.contractName ?? pendingResult.eventToRegister ?? pendingResult.evidenceRef ?? '[ EMPTY ]'),
      reason: textValue(pendingResult.parserReason ?? pendingResult.source ?? 'NULL'),
      state: textValue(pendingResult.state ?? 'NULL'),
      escrowRef: safeResultIntakeDisplayText(pendingResult.escrowRef) ?? 'NULL',
      evidenceRefs: evidenceRefsText(pendingResult.evidenceRefs),
      blockedReasons: Object.freeze(listResultIntakeDisplayValues(pendingResult.blockedReasons, ['none']))
    }),
    resultIntake: resultIntakeDescriptorFromDashboard({
      dashboard,
      goalSnapshot,
      pendingResult
    }),
    eventPreview: supervisorEventPreviewView(eventRegistrationEligibility),
    commandBoundary: commandBoundaryView(commandBoundary),
    timeline: Object.freeze(timeline.length > 0
      ? timeline.map((event, index) => Object.freeze({
        index: textValue(event.index ?? event.eventId ?? `T-${String(index + 1).padStart(2, '0')}`),
        title: textValue(event.status ?? event.title ?? 'observed event'),
        copy: textValue(event.evidenceRef ?? event.copy ?? event.timestamp ?? 'event projected from supervisor read model')
      }))
      : SUPERVISOR_WORKBENCH_VIEW.timeline),
    ownership: Object.freeze([
      Object.freeze({
        name: 'daemon',
        responsibility: textValue(ownership.daemonState ?? 'Owns background observation and lease projection outside the browser.')
      }),
      Object.freeze({
        name: 'controller',
        responsibility: textValue(ownership.deliveryBoundary ?? ownership.controllerInterventionReason ?? 'Owns implementation sequencing, verification, and recovery decisions.')
      }),
      Object.freeze({
        name: 'supervisor-monitor',
        responsibility: textValue(ownership.orchestrationOwner ?? 'Owns this read-only view and does not write state.')
      })
    ])
  });
}

function isLiveSupervisorDashboard(dashboard, routeState) {
  const apiPrefix = `/${'api'}`;

  return dashboard.sourceMode === 'live' || textValue(routeState?.source ?? '').startsWith(apiPrefix);
}

function hasReadOnlySafety(dashboard) {
  return dashboard.readOnly === true && dashboard.willMutate === false;
}

function rejectedLiveSupervisorView(dashboard, routeState) {
  const goalSnapshot = objectValue(dashboard.goalSnapshot);
  const activeLease = objectValue(dashboard.activeLease);

  return Object.freeze({
    ...SUPERVISOR_WORKBENCH_VIEW,
    source: textValue(dashboard.contractName ?? dashboard.source ?? 'goal-supervisor-app-read-model.v1'),
    routeSource: textValue(routeState?.source ?? dashboard.route?.path ?? dashboard.source ?? 'goal supervisor route'),
    goalId: textValue(goalSnapshot.goalId ?? dashboard.goalId ?? SUPERVISOR_WORKBENCH_VIEW.goalId),
    generatedAt: textValue(dashboard.generatedAt ?? goalSnapshot.generatedAt ?? SUPERVISOR_WORKBENCH_VIEW.generatedAt),
    activeTask: textValue(goalSnapshot.activeTask ?? 'NULL'),
    activeRole: textValue(goalSnapshot.activeRole ?? 'supervisor-monitor'),
    health: Object.freeze({
      state: 'blocked',
      observedOnly: true,
      daemonState: 'not accepted by UI adapter',
      contextState: 'unknown',
      gateState: 'safety contract failed',
      duplicateDispatchAllowed: false,
      reason: 'invalid live safety contract; readOnly must be true and willMutate must be false'
    }),
    currentGate: Object.freeze({
      gate: 'safety contract failed',
      condition: 'Live supervisor state did not satisfy the v46 read-only acceptance gate',
      nextArtifact: 'quarantined supervisor state evidence'
    }),
    recommendedNextAction: Object.freeze({
      status: 'blocked',
      text: 'Keep the supervisor workbench in local read-only fallback until the live state satisfies readOnly=true and willMutate=false.'
    }),
    activeLease: Object.freeze({
      leaseId: textValue(activeLease.leaseId ?? 'NULL'),
      threadId: textValue(activeLease.threadId ?? 'NULL'),
      health: 'not accepted'
    }),
    pendingResult: Object.freeze({
      label: 'invalid live safety contract',
      output: null,
      contract: '[ EMPTY ]',
      reason: 'readOnly/willMutate rejected',
      state: 'blocked',
      escrowRef: 'NULL',
      evidenceRefs: 'NULL',
      blockedReasons: Object.freeze(['readOnly/willMutate rejected'])
    }),
    resultIntake: Object.freeze({
      ...SUPERVISOR_WORKBENCH_VIEW.resultIntake,
      state: 'disabled',
      disabledReason: 'live supervisor safety contract failed'
    }),
    commandBoundary: defaultCommandBoundary()
  });
}

function objectValue(value) {
  return value !== null && typeof value === 'object' ? value : {};
}

function textValue(value) {
  if (value === null || value === undefined || value === '') {
    return 'NULL';
  }

  if (Array.isArray(value)) {
    return value.length === 0 ? '[ EMPTY ]' : value.join(', ');
  }

  return String(value);
}

function resultIntakeDescriptorFromDashboard({
  dashboard,
  goalSnapshot,
  pendingResult
}) {
  const goalId = textValue(goalSnapshot.goalId ?? dashboard.goalId ?? SUPERVISOR_WORKBENCH_VIEW.goalId);
  const taskId = textValue(goalSnapshot.activeTask ?? pendingResult.taskId ?? 'NULL');
  const workerRole = supportedResultIntakeWorkerRole(goalSnapshot.activeRole ?? pendingResult.workerRole);
  const previewRoute = resultIntakeRoute(goalId, 'result-intake-preview');
  const confirmRoute = resultIntakeRoute(goalId, 'result-intake-confirm');
  const disabledReason = resultIntakeDisabledReason({
    goalId,
    taskId,
    previewRoute,
    confirmRoute
  });

  return Object.freeze({
    state: disabledReason === null ? 'available' : 'disabled',
    sourceKind: RESULT_INTAKE_SOURCE_KIND,
    goalId,
    taskId,
    workerRole,
    previewRoute: textValue(previewRoute),
    confirmRoute: textValue(confirmRoute),
    disabledReason: textValue(disabledReason),
    boundaryNotices: RESULT_INTAKE_BOUNDARY_NOTICES
  });
}

function resultIntakeDisabledReason({
  goalId,
  taskId,
  previewRoute,
  confirmRoute
}) {
  if (!isSafeResultIntakeRouteSegment(goalId)) {
    return 'goal id unavailable';
  }

  if (!isSafeResultIntakeRouteSegment(taskId)) {
    return 'task id unavailable';
  }

  if (previewRoute === null || confirmRoute === null) {
    return 'result intake route unavailable';
  }

  return null;
}

function supportedResultIntakeWorkerRole(value) {
  const role = String(value ?? '').trim();

  return ['worker', 'reviewer', 'main-verifier', 'release-manager'].includes(role) ? role : 'worker';
}

function resultIntakeRoute(goalId, suffix) {
  if (!isSafeResultIntakeRouteSegment(goalId)) {
    return null;
  }

  return `/api/goals/${encodeURIComponent(goalId)}/${suffix}`;
}

function isSafeResultIntakeRouteSegment(value) {
  return typeof value === 'string' &&
    /^[A-Za-z0-9][A-Za-z0-9._-]*$/u.test(value) &&
    !value.includes('..');
}

function supervisorHealth(dashboard, activeLease, contextStatus, currentGate, ownership) {
  const activeLeaseStatus = textValue(activeLease.status ?? activeLease.phase ?? 'observed-only');
  const contextState = contextStateValue(contextStatus);
  const gateState = textValue(currentGate.status ?? currentGate.gateId ?? 'unknown');
  const state = healthStateValue({
    dashboard,
    activeLease,
    activeLeaseStatus,
    contextStatus,
    contextState,
    currentGate
  });

  return Object.freeze({
    state,
    observedOnly: true,
    daemonState: textValue(ownership.daemonState ?? dashboard.daemonState ?? 'observed only'),
    contextState,
    gateState,
    duplicateDispatchAllowed: false,
    reason: healthReasonValue({
      state,
      activeLeaseStatus,
      contextStatus,
      currentGate
    })
  });
}

function healthStateValue({ dashboard, activeLease, activeLeaseStatus, contextStatus, contextState, currentGate }) {
  if (currentGate.status === 'blocked') {
    return 'blocked';
  }

  if (objectValue(contextStatus.staleTranscriptState).stale === true || contextState === 'stale') {
    return 'stale';
  }

  if (objectValue(contextStatus.missingTranscriptState).missing === true || contextState === 'missing') {
    return 'missing';
  }

  if (['healthy', 'active', 'available'].includes(activeLeaseStatus) || activeLease.status === 'healthy') {
    return 'healthy';
  }

  if (dashboard.readOnly === true && dashboard.willMutate === false) {
    return 'observed-only';
  }

  return 'unknown';
}

function contextStateValue(contextStatus) {
  if (typeof contextStatus.state === 'string') {
    if (contextStatus.state === 'available') {
      return 'fresh';
    }

    return contextStatus.state;
  }

  if (objectValue(contextStatus.staleTranscriptState).stale === true) {
    return 'stale';
  }

  if (objectValue(contextStatus.missingTranscriptState).missing === true) {
    return 'missing';
  }

  return 'unknown';
}

function healthReasonValue({ state, activeLeaseStatus, contextStatus, currentGate }) {
  if (currentGate.blockingReason) {
    return textValue(currentGate.blockingReason);
  }

  const staleReason = objectValue(contextStatus.staleTranscriptState).reason;
  if (staleReason) {
    return textValue(staleReason);
  }

  const missingReason = objectValue(contextStatus.missingTranscriptState).reason;
  if (missingReason) {
    return textValue(missingReason);
  }

  return `observed-only / ${state}; active lease ${activeLeaseStatus}`;
}

function healthLabel(health) {
  if (health === null || typeof health !== 'object') {
    return textValue(health);
  }

  return health.observedOnly === true ? `observed-only / ${textValue(health.state)}` : textValue(health.state);
}

function utilizationPercent(value) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return Math.max(0, Math.min(100, value));
  }

  const parsed = Number.parseInt(String(value ?? ''), 10);

  return Number.isFinite(parsed) ? Math.max(0, Math.min(100, parsed)) : 0;
}

function contextChips(contextStatus) {
  const chips = [
    contextStatus.state,
    contextStatus.transcriptAvailability,
    contextStatus.tokenUsage
  ].filter((value) => value !== null && value !== undefined && value !== '');

  return chips.length > 0 ? chips.map(textValue) : ['missing contract field: contextStatus.providerSummaries'];
}

function sessionSourceInventoryView(inventory) {
  const summary = objectValue(inventory.summary);
  const providers = Array.isArray(inventory.providers) ? inventory.providers : [];
  const providerRows = providers.map((provider) => {
    if (typeof provider === 'string') {
      return provider;
    }

    return [
      provider?.provider,
      provider?.state,
      provider?.readState ?? provider?.availability,
      provider?.readableFileCount === undefined ? null : `readable ${provider.readableFileCount}`,
      provider?.unreadableFileCount === undefined ? null : `unreadable ${provider.unreadableFileCount}`,
      provider?.latestSessionRef
    ].filter((value) => value !== null && value !== undefined && value !== '').map(textValue).join(' / ');
  }).filter((value) => value !== '');

  return Object.freeze({
    state: textValue(inventory.state ?? summary.state ?? (providers.length === 0 ? 'missing' : 'unknown')),
    contract: contractRefLabel(inventory, 'sessionSourceInventory.v1'),
    generatedAt: textValue(inventory.generatedAt ?? 'NULL'),
    readOnly: inventory.readOnly === true,
    summary: textValue([
      `providers ${summary.providerCount ?? providers.length ?? 'missing'}`,
      `available ${summary.availableProviderCount ?? 'missing'}`,
      `missing ${summary.missingProviderCount ?? 'missing'}`,
      `degraded ${summary.degradedProviderCount ?? 'missing'}`,
      `failed ${summary.failedProviderCount ?? 'missing'}`
    ].join('; ')),
    providers: Object.freeze(providerRows.length > 0 ? providerRows : ['missing: no provider inventory rows']),
    degradedReasons: Object.freeze(listTextValues(inventory.degradedReasons, ['none']))
  });
}

function contextAdvisoryView(advisory) {
  return Object.freeze({
    state: textValue(advisory.state ?? advisory.contextBand ?? 'unknown'),
    contract: contractRefLabel(advisory, 'contextAdvisory.v1'),
    generatedAt: textValue(advisory.generatedAt ?? 'NULL'),
    readOnly: advisory.readOnly === true,
    transcriptAvailability: textValue(advisory.transcriptAvailability ?? 'missing'),
    exchangeCount: textValue(advisory.exchangeCount ?? 'missing'),
    latestToolCall: textValue(summaryText(advisory.latestToolCall, 'missing')),
    latestTurnState: textValue(summaryText(advisory.latestTurnState, 'missing')),
    tokenUsage: textValue(summaryText(advisory.tokenUsage, 'missing')),
    contextUtilization: textValue(summaryText(advisory.contextUtilization, 'missing')),
    contextBand: textValue(advisory.contextBand ?? 'unknown'),
    resultBlockEvidence: textValue(summaryText(advisory.resultBlockEvidence, 'missing')),
    staleTranscriptState: transcriptStateText(advisory.staleTranscriptState, 'stale'),
    missingTranscriptState: transcriptStateText(advisory.missingTranscriptState, 'missing'),
    blockedFields: Object.freeze(listTextValues(advisory.blockedFields, ['none'])),
    degradedReasons: Object.freeze(listTextValues(advisory.degradedReasons, ['none'])),
    policyInputs: Object.freeze(policyInputRows(advisory.policyInputs))
  });
}

function threadContinuationDecisionView(decision, fallbackCommandBoundary) {
  const boundary = objectValue(decision.commandBoundary);
  const fallbackBoundary = objectValue(fallbackCommandBoundary);

  return Object.freeze({
    state: textValue(decision.state ?? decision.decision ?? 'unknown'),
    contract: contractRefLabel(decision, 'threadContinuationDecision.v1'),
    generatedAt: textValue(decision.generatedAt ?? 'NULL'),
    readOnly: decision.readOnly === true,
    decision: textValue(decision.decision ?? 'unknown'),
    reason: textValue(decision.reason ?? 'NULL'),
    confidence: textValue(decision.confidence ?? 'unknown'),
    targetRole: textValue(decision.targetRole ?? 'NULL'),
    taskId: textValue(decision.taskId ?? 'NULL'),
    threadId: textValue(decision.threadId ?? 'NULL'),
    checkpointRef: textValue(decision.checkpointRef ?? 'NULL'),
    waitPolicy: textValue(summaryText(decision.waitPolicy, 'NULL')),
    blockedFields: Object.freeze(listTextValues(decision.blockedFields, ['none'])),
    mismatchList: Object.freeze(listTextValues(decision.mismatchList, ['none'])),
    requiredEvidence: Object.freeze(listTextValues(decision.requiredEvidence, ['none'])),
    sourceContracts: Object.freeze(listTextValues(decision.sourceContracts, ['missing'])),
    commandBoundary: Object.freeze({
      state: textValue(boundary.state ?? fallbackBoundary.state ?? 'disabled'),
      executionAvailable: false,
      copyOnly: true,
      blockedFamilies: Object.freeze(listTextValues(
        boundary.blockedFamilies ?? boundary.blockedCommandFamilies ?? fallbackBoundary.blockedFamilies,
        []
      ))
    })
  });
}

function contractRefLabel(value, fallbackName) {
  const version = value.contractVersion === null || value.contractVersion === undefined
    ? 'unknown'
    : value.contractVersion;

  return version === 'unknown'
    ? textValue(value.contractName ?? fallbackName)
    : `${textValue(value.contractName ?? fallbackName)} / ${version}`;
}

function policyInputRows(policyInputs) {
  const inputs = objectValue(policyInputs);
  const rows = [
    inputs.threadId ? `thread ${inputs.threadId}` : null,
    inputs.transcriptAvailability ? `transcript ${inputs.transcriptAvailability}` : null,
    ...listTextValues(inputs.sessionSourceSummaries, []),
    ...listTextValues(inputs.inventorySourceSummaries, [])
  ].filter((value) => value !== null && value !== '');

  return rows.length > 0 ? rows : ['missing'];
}

function transcriptFlag(state, flag) {
  const value = objectValue(state);
  const active = flag === 'stale' ? value.stale === true : value.missing === true;

  return value.reason ? `${flag}: ${String(active)} / ${value.reason}` : `${flag}: ${String(active)}`;
}

function transcriptStateText(state, flag) {
  if (state === null || state === undefined) {
    return flag === 'stale' ? 'stale: false' : 'missing: false';
  }

  if (typeof state !== 'object' || Array.isArray(state)) {
    return textValue(state);
  }

  return transcriptFlag(state, flag);
}

function summaryText(value, fallbackValue) {
  if (value === null || value === undefined || value === '') {
    return fallbackValue;
  }

  if (typeof value === 'object' && !Array.isArray(value)) {
    return objectSummary(value) ?? fallbackValue;
  }

  return value;
}

function objectSummary(value) {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value !== 'object' || Array.isArray(value)) {
    return value;
  }

  const entries = Object.entries(value)
    .filter(([, entryValue]) => entryValue !== null && entryValue !== undefined && entryValue !== '')
    .map(([key, entryValue]) => `${key}: ${textValue(entryValue)}`);

  return entries.length > 0 ? entries.join(', ') : null;
}

function listTextValues(values, fallback) {
  if (!Array.isArray(values) || values.length === 0) {
    return fallback;
  }

  return values.map((value) => {
    if (typeof value === 'string') {
      return value;
    }

    return objectSummary(value);
  }).filter((value) => value !== null && value !== '').map(textValue);
}

function commandBoundaryView(commandBoundary) {
  const rawFamilies = rawBoundaryFamilies(commandBoundary);

  return Object.freeze({
    state: textValue(commandBoundary.state ?? 'disabled'),
    executionAvailable: false,
    copyOnly: true,
    blockedCommandFamilies: Object.freeze(rawFamilies),
    blockedMutationFamilies: Object.freeze(canonicalBoundaryFamilies(rawFamilies))
  });
}

function supervisorEventPreviewView(eligibility) {
  const previewRequest = objectValue(eligibility.previewRequest);
  const confirmRequestShape = objectValue(eligibility.confirmRequestShape);
  const query = objectValue(previewRequest.query);
  const isEligible = eligibility.state === 'eligible';
  const previewPath = isEligible ? previewPathFromRequest(previewRequest) : null;
  const confirmPath = isEligible ? supervisorConfirmPathFromRequestShape(confirmRequestShape) : null;
  const confirmBodyBase = isEligible ? supervisorConfirmBodyBaseFromPreviewQuery(query) : null;
  const previewResult = objectValue(eligibility.previewResult);

  return Object.freeze({
    contract: contractRefLabel(eligibility, 'supervisorEventRegistrationEligibility.v1'),
    state: textValue(eligibility.state ?? 'unknown'),
    reason: textValue(eligibility.reason ?? 'eligibility contract not available'),
    readOnly: eligibility.readOnly !== false,
    willMutate: false,
    canPreview: isEligible && previewRequest.method === 'GET' && previewPath !== null,
    requestMethod: textValue(previewRequest.method ?? 'NULL'),
    route: textValue(previewRequest.route ?? 'NULL'),
    previewPath: textValue(previewPath),
    confirmMethod: textValue(confirmRequestShape.method ?? 'NULL'),
    confirmRoute: textValue(confirmPath),
    confirmContentType: textValue(confirmRequestShape.contentType ?? 'NULL'),
    canConfirmRoute: isEligible && confirmPath !== null && supervisorConfirmShapeIsComplete(confirmRequestShape) && hasCompleteSupervisorConfirmBodyBase(confirmBodyBase),
    confirmBodyBase: confirmBodyBase === null ? null : Object.freeze(confirmBodyBase),
    queryRows: Object.freeze(queryRowsFromRequest(query)),
    missingInputs: Object.freeze(listTextValues(eligibility.missingInputs, ['none'])),
    recommendedEvent: recommendedEventView(objectValue(eligibility.recommendedEvent)),
    previewResult: previewResult.contractName === 'goal-update-plan.v1'
      ? goalEventPlanPreviewResultView(previewResult)
      : null
  });
}

function previewPathFromRequest(previewRequest) {
  const route = typeof previewRequest.route === 'string' ? previewRequest.route.trim() : '';
  const query = objectValue(previewRequest.query);

  if (previewRequest.method !== 'GET' || route === '' || !route.startsWith('/api/goals/') || !route.endsWith('/event-plan-preview')) {
    return null;
  }

  if (!hasCompletePreviewQuery(query)) {
    return null;
  }

  const search = new URLSearchParams();

  for (const [key, value] of Object.entries(query)) {
    if (Array.isArray(value)) {
      value.forEach((entry) => {
        if (entry !== null && entry !== undefined && String(entry) !== '') {
          search.append(key, String(entry));
        }
      });
      continue;
    }

    if (value !== null && value !== undefined && String(value) !== '') {
      search.append(key, String(value));
    }
  }

  const queryText = search.toString();

  return queryText === '' ? null : `${route}?${queryText}`;
}

function hasCompletePreviewQuery(query) {
  return ['command', 'task', 'event', 'actor'].every((key) => hasPreviewQueryValue(query[key]));
}

function hasPreviewQueryValue(value) {
  if (Array.isArray(value)) {
    return value.some((entry) => entry !== null && entry !== undefined && String(entry).trim() !== '');
  }

  return value !== null && value !== undefined && String(value).trim() !== '';
}

export function supervisorConfirmPathFromRequestShape(confirmRequestShape) {
  const shape = objectValue(confirmRequestShape);
  const route = typeof shape.route === 'string' ? shape.route.trim() : '';

  if (shape.method !== 'POST' || route.includes('?') || route.includes('#')) {
    return null;
  }

  const match = route.match(/^\/api\/goals\/([^/?#]+)\/event-plan-confirm$/u);

  if (match === null || match[1] === 'latest') {
    return null;
  }

  return route;
}

function supervisorConfirmShapeIsComplete(confirmRequestShape) {
  const shape = objectValue(confirmRequestShape);
  const required = Array.isArray(shape.requiredBodyFields) ? shape.requiredBodyFields : [];

  return supervisorConfirmPathFromRequestShape(shape) !== null &&
    shape.contentType === 'application/json' &&
    shape.confirmUsesPlanHash === true &&
    ['command', 'planHash', 'task', 'event', 'actor'].every((field) => required.includes(field));
}

function supervisorConfirmBodyBaseFromPreviewQuery(query) {
  const body = {};

  assignSupervisorConfirmField(body, 'command', query.command);
  assignSupervisorConfirmField(body, 'task', query.task);
  assignSupervisorConfirmField(body, 'event', query.event);
  assignSupervisorConfirmField(body, 'actor', query.actor);
  assignSupervisorConfirmEvidenceRef(body, query.evidenceRef);
  assignSupervisorConfirmField(body, 'statement', query.statement);
  assignSupervisorConfirmField(body, 'blockerId', query.blockerId);
  assignSupervisorConfirmField(body, 'blockerReason', query.blockerReason);
  assignSupervisorConfirmField(body, 'blockerSeverity', query.blockerSeverity);

  return body;
}

function assignSupervisorConfirmField(body, key, value) {
  if (value === null || value === undefined || Array.isArray(value)) {
    return;
  }

  const text = String(value).trim();

  if (text !== '' && text !== 'NULL') {
    body[key] = text;
  }
}

function assignSupervisorConfirmEvidenceRef(body, value) {
  const refs = Array.isArray(value)
    ? value.map((entry) => String(entry ?? '').trim()).filter((entry) => entry !== '' && entry !== 'NULL')
    : String(value ?? '').trim() === '' || String(value ?? '').trim() === 'NULL' ? [] : [String(value).trim()];

  if (refs.length > 0) {
    body.evidenceRef = refs;
  }
}

function hasCompleteSupervisorConfirmBodyBase(body) {
  if (body === null || typeof body !== 'object') {
    return false;
  }

  return body.command === 'update' &&
    ['task', 'event', 'actor'].every((field) => typeof body[field] === 'string' && body[field].trim() !== '');
}

export function buildSupervisorEventConfirmBody({
  eventPreview,
  previewResult
}) {
  const bodyBase = objectValue(eventPreview?.confirmBodyBase);
  const planHash = usableSupervisorPlanHash(previewResult?.planHash);

  if (!supervisorCanConfirmEventAppend({ eventPreview, previewResult }) || planHash === null) {
    return null;
  }

  const constrainedBody = {};

  assignSupervisorConfirmField(constrainedBody, 'command', bodyBase.command);
  assignSupervisorConfirmField(constrainedBody, 'task', bodyBase.task);
  assignSupervisorConfirmField(constrainedBody, 'event', bodyBase.event);
  assignSupervisorConfirmField(constrainedBody, 'actor', bodyBase.actor);
  assignSupervisorConfirmField(constrainedBody, 'planHash', planHash);
  assignSupervisorConfirmEvidenceRef(constrainedBody, bodyBase.evidenceRef);
  assignSupervisorConfirmField(constrainedBody, 'statement', bodyBase.statement ?? previewResult?.statement);
  assignSupervisorConfirmField(constrainedBody, 'blockerId', bodyBase.blockerId ?? previewResult?.blockerId);
  assignSupervisorConfirmField(constrainedBody, 'blockerReason', bodyBase.blockerReason ?? previewResult?.blockerReason);
  assignSupervisorConfirmField(constrainedBody, 'blockerSeverity', bodyBase.blockerSeverity ?? previewResult?.blockerSeverity);

  return constrainedBody;
}

export function supervisorCanConfirmEventAppend({
  eventPreview,
  previewResult
}) {
  const bodyBase = objectValue(eventPreview?.confirmBodyBase);
  const planHash = usableSupervisorPlanHash(previewResult?.planHash);

  if (
    eventPreview?.state !== 'eligible' ||
    eventPreview?.canPreview !== true ||
    eventPreview?.canConfirmRoute !== true ||
    planHash === null ||
    !hasCompleteSupervisorConfirmBodyBase(bodyBase)
  ) {
    return false;
  }

  return bodyBase.task === previewResult?.taskId &&
    bodyBase.event === previewResult?.eventType &&
    bodyBase.actor === previewResult?.actorId;
}

function usableSupervisorPlanHash(value) {
  const text = typeof value === 'string' ? value.trim() : '';

  return text === '' || text === 'NULL' ? null : text;
}

function queryRowsFromRequest(query) {
  return Object.entries(query)
    .filter(([, value]) => hasPreviewQueryValue(value))
    .map(([key, value]) => [key, textValue(value)]);
}

function recommendedEventView(event) {
  return Object.freeze({
    eventType: textValue(event.eventType ?? 'NULL'),
    taskId: textValue(event.taskId ?? 'NULL'),
    actorRole: textValue(event.actorRole ?? 'NULL'),
    actorId: textValue(event.actorId ?? 'NULL'),
    evidenceRefs: textValue(event.evidenceRefs ?? 'NULL'),
    statement: textValue(event.statement ?? 'NULL'),
    blocker: textValue(objectSummary(event.blocker) ?? 'NULL')
  });
}

function goalEventPlanPreviewResultView(plan) {
  const event = objectValue(Array.isArray(plan.proposedEvents) ? plan.proposedEvents[0] : null);
  const eventSummary = objectValue(plan.eventSummary);
  const actor = objectValue(plan.actor);
  const wouldAppend = objectValue(plan.wouldAppend);
  const validation = objectValue(plan.validation);
  const confirm = objectValue(plan.confirm);
  const blocker = objectValue(event.blocker);
  const operationRun = objectValue(plan.operationRun);

  return Object.freeze({
    contract: contractRefLabel(plan, 'goal-update-plan.v1'),
    eventType: textValue(event.eventType ?? 'NULL'),
    taskId: textValue(event.taskId ?? 'NULL'),
    actorRole: textValue(actor.role ?? 'NULL'),
    actorId: textValue(actor.id ?? 'NULL'),
    evidenceRefs: evidenceRefsText(eventSummary.evidenceRefs ?? event.evidenceRefs),
    statement: textValue(event.statement ?? 'NULL'),
    blockerId: textValue(blocker.blockerId ?? 'NULL'),
    blockerReason: textValue(blocker.reason ?? 'NULL'),
    blockerSeverity: textValue(blocker.severity ?? 'NULL'),
    writesInDryRun: textValue(wouldAppend.writesInDryRun ?? plan.writesInDryRun ?? 'NULL'),
    appendTarget: textValue(wouldAppend.target ?? 'NULL'),
    operationId: textValue(operationRun.operationId ?? plan.operationId ?? plan.planId ?? 'NULL'),
    operationStatus: textValue(operationRun.status ?? plan.operationStatus ?? validation.status ?? 'NULL'),
    planHash: textValue(plan.planHash ?? 'NULL'),
    copyOnlyConfirmCommand: textValue(confirm.copyOnlyCommand ?? 'NULL')
  });
}

function goalEventConfirmationResultView(result) {
  const eventSummary = objectValue(result.eventSummary);
  const operationRun = objectValue(result.operationRun);
  const refreshed = objectValue(result.refreshed);

  return Object.freeze({
    contract: contractRefLabel(result, 'goal-event-confirmation.v1'),
    status: textValue(result.status ?? 'NULL'),
    written: textValue(result.written ?? 'NULL'),
    appendOnly: textValue(result.appendOnly ?? 'NULL'),
    eventType: textValue(eventSummary.eventType ?? 'NULL'),
    eventId: textValue(eventSummary.eventId ?? 'NULL'),
    sequence: textValue(eventSummary.sequence ?? 'NULL'),
    eventHash: textValue(eventSummary.eventHash ?? 'NULL'),
    operationId: textValue(operationRun.operationId ?? 'NULL'),
    operationStatus: textValue(operationRun.status ?? 'NULL'),
    planHash: textValue(result.planHash ?? 'NULL'),
    confirmEndpoint: textValue(objectSummary(result.confirmEndpoint) ?? 'NULL'),
    refreshedProgress: textValue(objectValue(refreshed.progress).contractName ?? 'NULL'),
    refreshedEvents: textValue(objectValue(refreshed.events).contractName ?? 'NULL'),
    refreshedNextAction: textValue(objectValue(refreshed.nextAction).contractName ?? 'NULL'),
    refreshedCloseout: textValue(objectValue(refreshed.closeout).contractName ?? 'NULL')
  });
}

export function buildResultIntakeRequestBody({
  resultIntake,
  resultBlockText,
  submittedAt = new Date().toISOString()
}) {
  const descriptor = objectValue(resultIntake);
  const goalId = descriptor.goalId;
  const taskId = descriptor.taskId;

  if (!isSafeResultIntakeRouteSegment(goalId) || !isSafeResultIntakeRouteSegment(taskId)) {
    return {
      ok: false,
      message: 'goal or task unavailable'
    };
  }

  const trimmed = String(resultBlockText ?? '').trim();

  if (trimmed === '') {
    return {
      ok: false,
      message: 'result block unavailable'
    };
  }

  let parsed;

  try {
    parsed = JSON.parse(trimmed);
  } catch {
    return {
      ok: false,
      message: 'result block must be a JSON object'
    };
  }

  if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return {
      ok: false,
      message: 'result block must be a JSON object'
    };
  }

  const hasEnvelopeShape = parsed.resultBlock !== null &&
    typeof parsed.resultBlock === 'object' &&
    !Array.isArray(parsed.resultBlock);
  const resultBlock = hasEnvelopeShape
    ? parsed.resultBlock
    : resultBlockFromParsedPaste(parsed);
  const requestedEvent = requestedResultIntakeEvent({
    parsed,
    resultBlock,
    taskId
  });
  const evidenceRefs = normalizedResultIntakeEvidenceRefs(
    hasEnvelopeShape ? parsed.evidenceRefs : parsed.evidenceRefs ?? resultBlock.evidenceRefs
  );

  return {
    ok: true,
    requestBody: {
      contractName: 'resultIntakeRequest.v1',
      contractVersion: 1,
      goalId,
      taskId,
      workerRole: supportedResultIntakeWorkerRole(parsed.workerRole ?? descriptor.workerRole),
      source: supportedResultIntakeSource(parsed.source ?? descriptor.sourceKind),
      submittedAt,
      resultBlock,
      evidenceRefs,
      requestedEvent,
      boundaries: { ...RESULT_INTAKE_BOUNDARIES }
    }
  };
}

function resultBlockFromParsedPaste(parsed) {
  const {
    contractName,
    contractVersion,
    goalId,
    taskId,
    workerRole,
    source,
    submittedAt,
    requestedEvent,
    boundaries,
    ...resultBlock
  } = parsed;

  return resultBlock;
}

function requestedResultIntakeEvent({
  parsed,
  resultBlock,
  taskId
}) {
  const source = objectValue(parsed.requestedEvent ?? resultBlock.requestedEvent);
  const eventType = safeResultIntakeEventType(source.eventType)
    ?? inferredResultIntakeEventType(resultBlock);
  const blocker = objectValue(source.blocker ?? resultBlock.blocker);
  const blockerReason = safeResultIntakeDisplayText(blocker.reason ?? resultBlock.blockerReason);
  const requestedEvent = {
    eventType,
    taskId: safeResultIntakeToken(source.taskId) ?? taskId
  };

  if (eventType === 'blocker.opened' || blockerReason !== null) {
    requestedEvent.blocker = {
      blockerId: safeResultIntakeToken(blocker.blockerId) ?? `blocker-${taskId}`,
      reason: blockerReason ?? 'worker reported a blocker',
      severity: safeResultIntakeDisplayText(blocker.severity) ?? 'medium'
    };
  }

  return requestedEvent;
}

function inferredResultIntakeEventType(resultBlock) {
  const status = String(resultBlock.status ?? '').trim().toLowerCase();

  if (status === 'blocked' || safeResultIntakeDisplayText(resultBlock.blockerReason) !== null) {
    return 'blocker.opened';
  }

  if (status === 'failed') {
    return 'worker.self-check-failed';
  }

  if (status === 'passed') {
    return 'worker.self-check-passed';
  }

  return 'worker.evidence-recorded';
}

function normalizedResultIntakeEvidenceRefs(value) {
  return (Array.isArray(value) ? value : [])
    .map(normalizedResultIntakeEvidenceRef)
    .filter((evidenceRef) => evidenceRef !== null);
}

function normalizedResultIntakeEvidenceRef(value) {
  if (typeof value === 'string') {
    const ref = safeResultIntakeDisplayText(value);

    if (ref === null) {
      return null;
    }

    if (ref.startsWith('docs/plans/')) {
      return {
        kind: 'repo-doc',
        ref,
        label: ref
      };
    }

    if (ref.startsWith('artifact-ref:')) {
      const artifactRef = ref.slice('artifact-ref:'.length);

      return {
        kind: 'artifact-ref',
        ref: artifactRef,
        label: artifactRef
      };
    }

    if (ref.startsWith('artifact:')) {
      return {
        kind: 'artifact-ref',
        ref,
        label: ref
      };
    }

    if (/^[a-f0-9]{7,64}$/u.test(ref)) {
      return {
        kind: 'commit',
        ref,
        label: ref
      };
    }

    return {
      kind: 'external-note',
      ref,
      label: ref
    };
  }

  const evidenceRef = objectValue(value);
  const kind = safeResultIntakeToken(evidenceRef.kind);
  const ref = safeResultIntakeDisplayText(evidenceRef.ref);
  const label = safeResultIntakeDisplayText(evidenceRef.label ?? evidenceRef.ref);

  if (kind === null || ref === null || label === null) {
    return null;
  }

  return {
    kind,
    ref,
    label
  };
}

function supportedResultIntakeSource(value) {
  const source = String(value ?? '').trim();

  return ['manual-paste', 'external-worker', 'codex', 'claude', 'kiro'].includes(source)
    ? source
    : RESULT_INTAKE_SOURCE_KIND;
}

function safeResultIntakeEventType(value) {
  const eventType = safeResultIntakeDisplayText(value);

  return [
    'worker.evidence-recorded',
    'worker.self-check-passed',
    'worker.self-check-failed',
    'blocker.opened',
    'blocker.resolved',
    'reviewer.approved',
    'reviewer.needs-revision',
    'reviewer.blocked',
    'main.verification-passed',
    'main.verification-failed',
    'release.gate-passed',
    'release.gate-failed',
    'release.evidence-recorded',
    'release.ready-declared'
  ].includes(eventType) ? eventType : null;
}

export function resultIntakePreviewResultView(preview) {
  const summary = objectValue(preview.sanitizedSummary);
  const eventCandidate = objectValue(preview.eventCandidate);
  const previewWriteTarget = objectValue(preview.previewWriteTarget);
  const confirmShape = objectValue(preview.confirmRequestShape);

  return Object.freeze({
    contract: contractRefLabel(preview, 'resultIntakePreview.v1'),
    goalId: safeResultIntakeDisplayText(preview.goalId) ?? 'NULL',
    taskId: safeResultIntakeDisplayText(preview.taskId) ?? 'NULL',
    workerRole: safeResultIntakeDisplayText(preview.workerRole) ?? 'NULL',
    source: safeResultIntakeDisplayText(preview.source) ?? 'NULL',
    summaryStatus: safeResultIntakeDisplayText(summary.status) ?? 'NULL',
    summary: safeResultIntakeDisplayText(summary.summary) ?? 'NULL',
    changedFiles: textValue(listResultIntakeDisplayValues(summary.changedFiles, ['none'])),
    validationCommands: textValue(listResultIntakeDisplayValues(summary.validationCommands, ['none'])),
    risks: textValue(listResultIntakeDisplayValues(summary.risks, ['none'])),
    blockers: textValue(listResultIntakeDisplayValues(summary.blockers, ['none'])),
    blockerReason: safeResultIntakeDisplayText(summary.blockerReason) ?? 'NULL',
    evidenceRefs: evidenceRefsText(preview.evidenceRefs),
    blockedFields: Object.freeze(listResultIntakeDisplayValues(preview.blockedFields, ['none'])),
    blockedReasons: Object.freeze(resultIntakeBlockedReasons(preview)),
    eventState: safeResultIntakeDisplayText(eventCandidate.state) ?? 'NULL',
    eventReason: safeResultIntakeDisplayText(eventCandidate.reason) ?? 'NULL',
    eventType: safeResultIntakeDisplayText(eventCandidate.eventType) ?? 'NULL',
    commandName: safeResultIntakeDisplayText(eventCandidate.commandName) ?? 'NULL',
    willAppendGoalEvent: textValue(eventCandidate.willAppendGoalEvent === true),
    writesOnPreview: textValue(previewWriteTarget.writesOnPreview === true),
    writesOnConfirm: textValue(previewWriteTarget.writesOnConfirm === true),
    writesGoalEventLog: textValue(previewWriteTarget.writesGoalEventLog === true),
    planHash: safeResultIntakeDisplayText(preview.planHash) ?? 'NULL',
    expiresAt: safeResultIntakeDisplayText(preview.expiresAt) ?? 'NULL',
    confirmRoute: safeResultIntakeDisplayText(confirmShape.route) ?? 'NULL',
    confirmUsesPlanHash: textValue(confirmShape.confirmUsesPlanHash === true)
  });
}

function resultIntakeBlockedReasons(preview) {
  const eventCandidate = objectValue(preview.eventCandidate);
  const reasons = [
    eventCandidate.state === 'blocked' ? eventCandidate.reason : null,
    ...listResultIntakeDisplayValues(preview.blockedFields, [])
  ].map(safeResultIntakeDisplayText).filter((value) => value !== null);

  return reasons.length > 0 ? reasons : ['none'];
}

function resultEscrowConfirmationResultView(result) {
  const refs = objectValue(result.refs);
  const refreshed = objectValue(result.refreshed);
  const supervisor = objectValue(refreshed.supervisor);

  return Object.freeze({
    contract: contractRefLabel(result, 'result-intake-confirmation.v1'),
    status: safeResultIntakeDisplayText(result.status) ?? 'NULL',
    written: textValue(result.written === true),
    planHash: safeResultIntakeDisplayText(result.planHash) ?? 'NULL',
    escrowRef: safeResultIntakeDisplayText(refs.escrowRef) ?? 'NULL',
    pendingResultRef: safeResultIntakeDisplayText(refs.pendingResultRef) ?? 'NULL',
    refreshRoute: safeResultIntakeDisplayText(supervisor.route) ?? 'NULL',
    pendingResultProjectionAvailable: textValue(supervisor.pendingResultProjectionAvailable === true)
  });
}

function listResultIntakeDisplayValues(values, fallback) {
  if (!Array.isArray(values) || values.length === 0) {
    return fallback;
  }

  const safeValues = values
    .map((value) => safeResultIntakeDisplayText(value))
    .filter((value) => value !== null);

  return safeValues.length > 0 ? safeValues : fallback;
}

function safeResultIntakeToken(value) {
  const text = safeResultIntakeDisplayText(value);

  return text !== null && /^[A-Za-z0-9][A-Za-z0-9._:-]*$/u.test(text) ? text : null;
}

function safeResultIntakeDisplayText(value) {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  const text = String(value).trim();
  const lower = text.toLowerCase();
  const safeApiRoute = text.startsWith('/api/goals/') &&
    !text.includes('\\') &&
    !text.includes('..') &&
    !text.includes('?') &&
    !text.includes('#');

  if (
    text === '' ||
    (text.startsWith('/') && !safeApiRoute) ||
    text.startsWith('~/') ||
    text.startsWith('file://') ||
    text.includes('\\') ||
    text.includes('../') ||
    text.includes('..\\') ||
    /(?:^|\/)\.(?:codex|claude|git|symphony)(?:\/|$)/iu.test(text) ||
    /raw[\s_-]*transcript|raw[\s_-]*model[\s_-]*output|provider[\s_-]*session|session[\s_-]*log|model[\s_-]*output/iu.test(text) ||
    lower.includes('%2e') ||
    lower.includes('%2f') ||
    lower.includes('%5c')
  ) {
    return null;
  }

  return text;
}

function evidenceRefsText(evidenceRefs) {
  if (!Array.isArray(evidenceRefs) || evidenceRefs.length === 0) {
    return 'NULL';
  }

  return evidenceRefs.map(evidenceRefText).filter((value) => value !== '').join(', ') || 'NULL';
}

function evidenceRefText(evidenceRef) {
  if (evidenceRef === null || evidenceRef === undefined || evidenceRef === '') {
    return '';
  }

  if (typeof evidenceRef !== 'object' || Array.isArray(evidenceRef)) {
    return textValue(evidenceRef);
  }

  const ref = textValue(evidenceRef.ref ?? evidenceRef.evidenceRef ?? evidenceRef.uri ?? 'NULL');
  const kind = textValue(evidenceRef.kind ?? 'NULL');
  const label = textValue(evidenceRef.label ?? 'NULL');
  const details = [kind, label].filter((value) => value !== 'NULL' && value !== ref);

  return details.length > 0 ? `${ref} (${details.join(' / ')})` : ref;
}

function defaultCommandBoundary() {
  return Object.freeze({
    state: 'disabled',
    executionAvailable: false,
    copyOnly: true,
    blockedCommandFamilies: Object.freeze([]),
    blockedMutationFamilies: Object.freeze([...CANONICAL_BLOCKED_MUTATION_FAMILIES])
  });
}

function rawBoundaryFamilies(commandBoundary) {
  const blockedFamilies = Array.isArray(commandBoundary.blockedMutationFamilies)
    ? commandBoundary.blockedMutationFamilies
    : Array.isArray(commandBoundary.blockedCommandFamilies)
      ? commandBoundary.blockedCommandFamilies
      : Array.isArray(commandBoundary.blockedFamilies)
        ? commandBoundary.blockedFamilies
        : [];

  return uniqueTextValues(blockedFamilies);
}

function canonicalBoundaryFamilies(rawFamilies) {
  const mapped = rawFamilies
    .map(canonicalBoundaryFamily)
    .filter((family) => family !== null);
  const canonical = uniqueTextValues([
    ...mapped,
    ...CANONICAL_BLOCKED_MUTATION_FAMILIES
  ]);

  return CANONICAL_BLOCKED_MUTATION_FAMILIES.filter((family) => canonical.includes(family));
}

function canonicalBoundaryFamily(family) {
  const text = textValue(family).toLowerCase().replace(/_/gu, '-');
  const compact = text.replace(/\s+/gu, '-').replace(/^blocked-/u, '');

  if ([
    'daemon-control',
    'daemon-launch',
    'child-dispatch',
    'goal-ledger-write',
    'event-log-write',
    'event-registration',
    'mutation-gate',
    'audit'
  ].includes(compact)) {
    return 'daemon-control';
  }

  if (['provider-cli', 'provider-cli-control'].includes(compact)) {
    return 'provider-cli';
  }

  if (['real-cli', 'generic-shell', 'shell'].includes(compact)) {
    return 'real-cli';
  }

  if ([
    'release-closeout',
    'release-closeout-blocked',
    'push-release',
    'publish-release',
    'github-release',
    'publish',
    'closeout'
  ].includes(compact)) {
    return 'release-closeout';
  }

  if (['tag', 'git-tag'].includes(compact)) {
    return 'git-tag';
  }

  return null;
}

function uniqueTextValues(values) {
  return [...new Set(values.map(textValue).filter((value) => value !== 'NULL' && value !== '[ EMPTY ]'))];
}

function contractLabel(view) {
  const version = view.contractVersion === null || view.contractVersion === undefined
    ? 'unknown'
    : view.contractVersion;

  return version === 'unknown' ? view.contractName : `${view.contractName} / ${version}`;
}

function routeSourceLabel(view) {
  const routeSource = textValue(view.routeSource);
  const apiPrefix = `/${'api'}`;

  return routeSource.startsWith(apiPrefix) ? `source: ${routeSource}` : routeSource;
}

function sourceSummary(view) {
  return view.source;
}

function commandBoundarySummary(boundary) {
  if (boundary.executionAvailable === false && boundary.copyOnly === true) {
    return 'execution unavailable; copyOnly true';
  }

  return 'copyOnly true';
}

const SIDEBAR_ITEMS = Object.freeze([
  Object.freeze({ label: 'Overview', tone: 'selected' }),
  Object.freeze({ label: 'Active Lease', tone: 'observed' }),
  Object.freeze({ label: 'Source Inventory', tone: 'neutral' }),
  Object.freeze({ label: 'Current Gate', tone: 'neutral' }),
  Object.freeze({ label: 'Context Advisory', tone: 'neutral' }),
  Object.freeze({ label: 'Continuation', tone: 'warn' }),
  Object.freeze({ label: 'Command Boundary', tone: 'warn' }),
  Object.freeze({ label: 'Result Intake', tone: 'observed' }),
  Object.freeze({ label: 'Context Status', tone: 'neutral' }),
  Object.freeze({ label: 'Timeline', tone: 'neutral' }),
  Object.freeze({ label: 'Ownership', tone: 'neutral' })
]);

export function SupervisorShell({
  view = SUPERVISOR_WORKBENCH_VIEW,
  onSupervisorEventConfirmed,
  onRefreshSupervisorState
}) {
  const eventPreview = view.eventPreview ?? SUPERVISOR_WORKBENCH_VIEW.eventPreview;
  const resultIntake = view.resultIntake ?? SUPERVISOR_WORKBENCH_VIEW.resultIntake;
  const previewIdentity = supervisorEventPreviewIdentity(eventPreview);
  const intakeIdentity = resultIntakeIdentity(resultIntake);
  const [previewState, setPreviewState] = useState(() => supervisorPreviewStateFromEventPreview(eventPreview));
  const [confirmState, setConfirmState] = useState(() => supervisorConfirmStateFromEventPreview(eventPreview, previewState.result));
  const [resultBlockText, setResultBlockText] = useState('');
  const [resultIntakePreviewState, setResultIntakePreviewState] = useState(() => resultIntakePreviewStateFromDescriptor(resultIntake));
  const [resultEscrowConfirmState, setResultEscrowConfirmState] = useState(() => resultEscrowConfirmStateFromPreview(resultIntake, resultIntakePreviewState));
  const [refreshState, setRefreshState] = useState(SUPERVISOR_REFRESH_IDLE_STATE);
  const visiblePreviewState = visibleSupervisorPreviewState({
    eventPreview,
    previewState
  });
  const visibleConfirmState = visibleSupervisorConfirmState({
    eventPreview,
    previewState: visiblePreviewState,
    confirmState
  });
  const visibleIntakePreviewState = visibleResultIntakePreviewState({
    resultIntake,
    previewState: resultIntakePreviewState
  });
  const visibleEscrowConfirmState = visibleResultEscrowConfirmState({
    resultIntake,
    previewState: visibleIntakePreviewState,
    confirmState: resultEscrowConfirmState
  });
  const previewLoading = visiblePreviewState.phase === 'loading';
  const confirmLoading = visibleConfirmState.phase === 'loading';
  const intakePreviewLoading = visibleIntakePreviewState.phase === 'loading';
  const escrowConfirmLoading = visibleEscrowConfirmState.phase === 'loading';
  const refreshLoading = refreshState.phase === 'loading';

  useEffect(() => {
    setPreviewState(supervisorPreviewStateFromEventPreview(eventPreview));
    setConfirmState(supervisorConfirmStateFromEventPreview(eventPreview, eventPreview.previewResult));
  }, [previewIdentity]);

  useEffect(() => {
    setResultIntakePreviewState(resultIntakePreviewStateFromDescriptor(resultIntake));
    setResultEscrowConfirmState(resultEscrowConfirmStateFromPreview(resultIntake, null));
  }, [intakeIdentity]);

  function handleResultBlockInput(event) {
    const nextValue = String(event.target.value ?? '').slice(0, RESULT_INTAKE_MAX_BLOCK_LENGTH);

    setResultBlockText(nextValue);
    setResultIntakePreviewState(resultIntakePreviewStateFromDescriptor(resultIntake));
    setResultEscrowConfirmState(resultEscrowConfirmStateFromPreview(resultIntake, null));
  }

  async function handlePreviewEventPlan() {
    if (!eventPreview.canPreview || previewLoading) {
      return;
    }

    setPreviewState({
      identity: previewIdentity,
      phase: 'loading',
      result: null,
      message: null
    });
    setConfirmState(supervisorConfirmStateFromEventPreview(eventPreview, null));

    const result = await fetchGoalEventPlanPreview(eventPreview.previewPath);

    if (result.ok) {
      const resultView = goalEventPlanPreviewResultView(result.data);

      setPreviewState({
        identity: previewIdentity,
        phase: 'ready',
        result: resultView,
        message: null
      });
      setConfirmState(supervisorConfirmStateFromEventPreview(eventPreview, resultView));
      return;
    }

    setPreviewState({
      identity: previewIdentity,
      phase: 'failed',
      result: null,
      message: textValue(result.message ?? 'preview failed')
    });
    setConfirmState(supervisorConfirmStateFromEventPreview(eventPreview, null));
  }

  async function handleConfirmEventAppend() {
    if (confirmLoading) {
      return;
    }

    const confirmIdentity = supervisorEventConfirmIdentity({
      eventPreview,
      previewResult: visiblePreviewState.result
    });

    setConfirmState({
      identity: confirmIdentity,
      phase: 'loading',
      result: null,
      message: null
    });

    const nextConfirmState = await confirmSupervisorEventAppend({
      eventPreview,
      previewState: visiblePreviewState,
      onEventConfirmed: onSupervisorEventConfirmed
    });

    setConfirmState(nextConfirmState);
  }

  async function handleRefreshSupervisorState() {
    if (refreshLoading) {
      return;
    }

    setRefreshState({
      phase: 'loading',
      source: 'fetchWorkbenchContracts',
      result: 'pending',
      message: 'contract refresh pending'
    });

    setRefreshState(await refreshSupervisorState({
      onRefreshSupervisorState
    }));
  }

  async function handlePreviewResultIntake() {
    if (resultIntake.state !== 'available' || intakePreviewLoading) {
      return;
    }

    const request = buildResultIntakeRequestBody({
      resultIntake,
      resultBlockText
    });

    if (!request.ok) {
      setResultIntakePreviewState({
        identity: resultIntakeIdentity(resultIntake),
        phase: 'failed',
        request: null,
        preview: null,
        result: null,
        message: request.message
      });
      setResultEscrowConfirmState(resultEscrowConfirmStateFromPreview(resultIntake, null));
      return;
    }

    setResultIntakePreviewState({
      identity: resultIntakeIdentity(resultIntake),
      phase: 'loading',
      request: request.requestBody,
      preview: null,
      result: null,
      message: null
    });
    setResultEscrowConfirmState(resultEscrowConfirmStateFromPreview(resultIntake, null));

    const result = await previewResultIntake(resultIntake.previewRoute, request.requestBody);

    if (result.ok) {
      const resultView = resultIntakePreviewResultView(result.data);
      const nextPreviewState = {
        identity: resultIntakeIdentity(resultIntake),
        phase: 'ready',
        request: request.requestBody,
        preview: result.data,
        result: resultView,
        message: null
      };

      setResultIntakePreviewState(nextPreviewState);
      setResultEscrowConfirmState(resultEscrowConfirmStateFromPreview(resultIntake, nextPreviewState));
      return;
    }

    setResultIntakePreviewState({
      identity: resultIntakeIdentity(resultIntake),
      phase: 'failed',
      request: null,
      preview: null,
      result: null,
      message: textValue(result.message ?? 'result intake preview failed')
    });
    setResultEscrowConfirmState(resultEscrowConfirmStateFromPreview(resultIntake, null));
  }

  async function handleConfirmResultEscrow() {
    if (escrowConfirmLoading) {
      return;
    }

    setResultEscrowConfirmState({
      identity: resultEscrowConfirmIdentity({
        resultIntake,
        previewState: visibleIntakePreviewState
      }),
      phase: 'loading',
      result: null,
      message: null
    });

    const nextConfirmState = await confirmResultEscrowFromPreview({
      resultIntake,
      previewState: visibleIntakePreviewState
    });

    setResultEscrowConfirmState(nextConfirmState);

    if (nextConfirmState.phase === 'ready') {
      await handleRefreshSupervisorState();
    }
  }

  return (
    <main className="v46-supervisor-shell" aria-labelledby="v46-supervisor-title">
      <SupervisorSidebar items={SIDEBAR_ITEMS} />
      <section className="v46-supervisor-workspace" aria-label="Workbench Supervisor Dashboard">
        <StatusHeader view={view} />
        <div className="v46-dashboard-grid">
          <GoalSnapshotPanel view={view} />
          <ActiveLeasePanel lease={view.activeLease} />
          <SessionSourceInventoryPanel inventory={view.sessionSourceInventory} />
          <ContextStatusPanel context={view.context} />
          <CurrentGatePanel gate={view.currentGate} />
          <ContextAdvisoryPanel advisory={view.contextAdvisory} />
          <RecommendedNextActionBand action={view.recommendedNextAction} />
          <ThreadContinuationDecisionPanel decision={view.threadContinuationDecision} />
          <CommandBoundaryPanel boundary={view.commandBoundary} />
          <PendingResultPanel pendingResult={view.pendingResult} />
          <ResultIntakeLane
            resultIntake={resultIntake}
            resultBlockText={resultBlockText}
            previewState={visibleIntakePreviewState}
            previewLoading={intakePreviewLoading}
            confirmState={visibleEscrowConfirmState}
            confirmLoading={escrowConfirmLoading}
            refreshState={refreshState}
            refreshLoading={refreshLoading}
            onResultBlockInput={handleResultBlockInput}
            onPreviewResultIntake={handlePreviewResultIntake}
            onConfirmResultEscrow={handleConfirmResultEscrow}
            onRefreshSupervisorState={handleRefreshSupervisorState}
          />
          <SupervisorEventPreviewLane
            eventPreview={eventPreview}
            previewState={visiblePreviewState}
            previewLoading={previewLoading}
            confirmState={visibleConfirmState}
            confirmLoading={confirmLoading}
            refreshState={refreshState}
            refreshLoading={refreshLoading}
            onPreviewEventPlan={handlePreviewEventPlan}
            onConfirmEventAppend={handleConfirmEventAppend}
            onRefreshSupervisorState={handleRefreshSupervisorState}
          />
          <GoalTimelinePanel timeline={view.timeline} />
          <OwnershipPanel ownership={view.ownership} />
        </div>
      </section>
    </main>
  );
}

export function supervisorPreviewStateFromEventPreview(eventPreview) {
  return Object.freeze({
    identity: supervisorEventPreviewIdentity(eventPreview),
    phase: eventPreview.previewResult === null ? 'idle' : 'ready',
    result: eventPreview.previewResult,
    message: null
  });
}

export function resultIntakePreviewStateFromDescriptor(resultIntake) {
  return Object.freeze({
    ...RESULT_INTAKE_PREVIEW_IDLE_STATE,
    identity: resultIntakeIdentity(resultIntake)
  });
}

export function resultEscrowConfirmStateFromPreview(resultIntake, previewState) {
  return Object.freeze({
    ...RESULT_ESCROW_CONFIRM_IDLE_STATE,
    identity: resultEscrowConfirmIdentity({
      resultIntake,
      previewState
    })
  });
}

export async function refreshSupervisorState({
  onRefreshSupervisorState
}) {
  if (typeof onRefreshSupervisorState !== 'function') {
    return Object.freeze({
      phase: 'failed',
      source: 'fetchWorkbenchContracts',
      result: 'NULL',
      message: 'refresh callback unavailable'
    });
  }

  try {
    const result = await onRefreshSupervisorState();

    return supervisorRefreshStateFromContractResult(result);
  } catch (error) {
    return Object.freeze({
      phase: 'failed',
      source: 'fetchWorkbenchContracts',
      result: 'NULL',
      message: textValue(error?.message ?? 'contract refresh failed')
    });
  }
}

function supervisorRefreshStateFromContractResult(result) {
  const source = textValue(result?.source ?? 'fetchWorkbenchContracts');
  const summary = supervisorRefreshResultSummary(result);

  if (result?.ok === false || result?.phase === 'failed') {
    return Object.freeze({
      phase: 'failed',
      source,
      result: summary,
      message: textValue(result?.message ?? 'contract refresh failed')
    });
  }

  return Object.freeze({
    phase: 'succeeded',
    source,
    result: summary,
    message: 'contract refresh completed'
  });
}

function supervisorRefreshResultSummary(result) {
  if (result === null || result === undefined || result === '') {
    return 'NULL';
  }

  if (typeof result !== 'object' || Array.isArray(result)) {
    return textValue(result);
  }

  const dashboardState = result.supervisorDashboardState ?? result.supervisorDashboard?.state ?? null;
  const routeState = result.supervisorRouteState ?? result.routeState ?? result.supervisorDashboard?.route?.state ?? null;
  const contractName = result.contractName ?? result.supervisorDashboard?.contractName ?? null;
  const parts = [
    dashboardState === null ? null : `supervisorDashboard ${textValue(dashboardState)}`,
    routeState === null ? null : `route ${textValue(routeState)}`,
    contractName === null ? null : `contract ${textValue(contractName)}`
  ].filter((part) => part !== null);

  return parts.length > 0 ? parts.join('; ') : 'NULL';
}

export function visibleSupervisorPreviewState({
  eventPreview,
  previewState
}) {
  const identity = supervisorEventPreviewIdentity(eventPreview);

  return previewState?.identity === identity
    ? previewState
    : supervisorPreviewStateFromEventPreview(eventPreview);
}

export function supervisorConfirmStateFromEventPreview(eventPreview, previewResult) {
  return Object.freeze({
    identity: supervisorEventConfirmIdentity({ eventPreview, previewResult }),
    phase: 'idle',
    result: null,
    message: null
  });
}

export function visibleSupervisorConfirmState({
  eventPreview,
  previewState,
  confirmState
}) {
  const identity = supervisorEventConfirmIdentity({
    eventPreview,
    previewResult: previewState?.phase === 'ready' ? previewState.result : null
  });

  return confirmState?.identity === identity
    ? confirmState
    : supervisorConfirmStateFromEventPreview(eventPreview, previewState?.result ?? null);
}

export function visibleResultIntakePreviewState({
  resultIntake,
  previewState
}) {
  const identity = resultIntakeIdentity(resultIntake);

  return previewState?.identity === identity
    ? previewState
    : resultIntakePreviewStateFromDescriptor(resultIntake);
}

export function visibleResultEscrowConfirmState({
  resultIntake,
  previewState,
  confirmState
}) {
  const identity = resultEscrowConfirmIdentity({
    resultIntake,
    previewState: previewState?.phase === 'ready' ? previewState : null
  });

  return confirmState?.identity === identity
    ? confirmState
    : resultEscrowConfirmStateFromPreview(resultIntake, previewState);
}

function resultIntakeIdentity(resultIntake) {
  return [
    resultIntake?.state,
    resultIntake?.goalId,
    resultIntake?.taskId,
    resultIntake?.workerRole,
    resultIntake?.sourceKind,
    resultIntake?.previewRoute,
    resultIntake?.confirmRoute
  ].map(textValue).join('\u001c');
}

function resultEscrowConfirmIdentity({
  resultIntake,
  previewState
}) {
  return [
    resultIntakeIdentity(resultIntake),
    previewState?.preview?.planHash,
    previewState?.result?.eventState,
    previewState?.result?.eventType
  ].map(textValue).join('\u001b');
}

export function canConfirmResultEscrow({
  resultIntake,
  previewState
}) {
  const confirmRoute = resultIntake?.confirmRoute === 'NULL' ? null : resultIntake?.confirmRoute;
  const preview = objectValue(previewState?.preview);
  const planHash = usableSupervisorPlanHash(preview.planHash);

  return resultIntake?.state === 'available' &&
    confirmRoute !== null &&
    previewState?.phase === 'ready' &&
    preview.contractName === 'resultIntakePreview.v1' &&
    objectValue(preview.confirmRequestShape).route === confirmRoute &&
    preview.eventCandidate?.state === 'eligible' &&
    planHash !== null;
}

export async function confirmResultEscrowFromPreview({
  resultIntake,
  previewState,
  confirmResultEscrowImpl = confirmResultEscrow
}) {
  const visiblePreviewState = visibleResultIntakePreviewState({
    resultIntake,
    previewState
  });
  const confirmIdentity = resultEscrowConfirmIdentity({
    resultIntake,
    previewState: visiblePreviewState
  });
  const confirmRoute = resultIntake?.confirmRoute === 'NULL' ? null : resultIntake?.confirmRoute;
  const preview = objectValue(visiblePreviewState.preview);
  const request = objectValue(visiblePreviewState.request);
  const planHash = usableSupervisorPlanHash(preview.planHash);

  if (
    typeof confirmResultEscrowImpl !== 'function' ||
    confirmRoute === null ||
    visiblePreviewState.phase !== 'ready' ||
    planHash === null ||
    !canConfirmResultEscrow({ resultIntake, previewState: visiblePreviewState })
  ) {
    return {
      identity: confirmIdentity,
      phase: 'failed',
      result: null,
      message: 'result escrow confirm unavailable'
    };
  }

  const result = await confirmResultEscrowImpl(confirmRoute, {
    resultIntakeRequest: request,
    resultIntakePreview: preview,
    planHash
  });

  if (result.ok) {
    return {
      identity: confirmIdentity,
      phase: 'ready',
      result: resultEscrowConfirmationResultView(result.data),
      message: null
    };
  }

  return {
    identity: confirmIdentity,
    phase: 'failed',
    result: null,
    message: textValue(result.message ?? 'result escrow confirm failed')
  };
}

function supervisorEventConfirmIdentity({
  eventPreview,
  previewResult
}) {
  return [
    supervisorEventPreviewIdentity(eventPreview),
    eventPreview.confirmMethod,
    eventPreview.confirmRoute,
    eventPreview.confirmContentType,
    previewResult?.eventType,
    previewResult?.taskId,
    previewResult?.actorId,
    previewResult?.planHash
  ].map(textValue).join('\u001d');
}

function supervisorEventPreviewIdentity(eventPreview) {
  return [
    eventPreview.state,
    eventPreview.requestMethod,
    String(eventPreview.canPreview),
    eventPreview.previewPath,
    eventPreview.confirmMethod,
    eventPreview.confirmRoute,
    String(eventPreview.canConfirmRoute),
    supervisorConfirmBodyBaseIdentity(eventPreview.confirmBodyBase),
    supervisorPreviewResultIdentity(eventPreview.previewResult)
  ].map(textValue).join('\u001f');
}

function supervisorConfirmBodyBaseIdentity(bodyBase) {
  const body = objectValue(bodyBase);

  return [
    body.command,
    body.task,
    body.event,
    body.actor,
    textValue(body.evidenceRef),
    body.statement,
    body.blockerId,
    body.blockerReason,
    body.blockerSeverity
  ].map(textValue).join('\u001e');
}

function supervisorPreviewResultIdentity(previewResult) {
  if (previewResult === null || previewResult === undefined) {
    return 'no-preview-result';
  }

  return [
    previewResult.contract,
    previewResult.eventType,
    previewResult.taskId,
    previewResult.actorId,
    previewResult.planHash,
    previewResult.copyOnlyConfirmCommand,
    previewResult.operationId,
    previewResult.operationStatus
  ].map(textValue).join('\u001e');
}

export function SupervisorSidebar({ items }) {
  return (
    <aside className="v46-sidebar" data-od-id="sidebar" aria-label="Supervisor sections">
      <div className="v46-sidebar-head">
        <strong>Workbench</strong>
        <span>supervisor monitor</span>
      </div>
      <div className="v46-sidebar-list">
        {items.map((item) => (
          <div key={item.label} className={`v46-sidebar-item ${item.tone}`}>
            <span className="v46-sidebar-icon" aria-hidden="true">
              <SidebarIcon label={item.label} />
            </span>
            <span className="v46-sidebar-label">{item.label}</span>
          </div>
        ))}
      </div>
    </aside>
  );
}

function SidebarIcon({ label }) {
  if (label === 'Overview') {
    return (
      <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3.5" y="3.5" width="7" height="7" />
        <rect x="13.5" y="3.5" width="7" height="7" />
        <rect x="3.5" y="13.5" width="7" height="7" />
        <rect x="13.5" y="13.5" width="7" height="7" />
      </svg>
    );
  }

  if (label === 'Active Lease') {
    return (
      <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 3.2 19 6v5.5c0 4.4-2.8 7.5-7 9.3-4.2-1.8-7-4.9-7-9.3V6l7-2.8Z" />
        <path d="m8.8 12.1 2.1 2.1 4.4-5" />
      </svg>
    );
  }

  if (label === 'Current Gate') {
    return (
      <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 21V4" />
        <path d="M5 5h12l-2 4 2 4H5" />
      </svg>
    );
  }

  if (label === 'Command Boundary') {
    return (
      <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M7 7H5v10h2" />
        <path d="M17 7h2v10h-2" />
        <path d="M10 12h4" />
        <path d="M12 9v6" />
      </svg>
    );
  }

  if (label === 'Context Status') {
    return (
      <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4.5 18a7.5 7.5 0 1 1 15 0" />
        <path d="m12 14 4-4" />
        <path d="M8 18h8" />
      </svg>
    );
  }

  if (label === 'Timeline') {
    return (
      <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="8.5" />
        <path d="M12 7.5V12l3 2" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="8" cy="8" r="3" />
      <circle cx="16" cy="8" r="3" />
      <path d="M3.8 19c.7-3 2.3-4.5 4.2-4.5s3.5 1.5 4.2 4.5" />
      <path d="M11.8 19c.7-3 2.3-4.5 4.2-4.5s3.5 1.5 4.2 4.5" />
    </svg>
  );
}

export function StatusHeader({ view }) {
  return (
    <header className="v46-status-header" data-od-id="status-header">
      <div className="v46-goal-line">
        <span>Goal ID:</span>
        <h1 id="v46-supervisor-title">{view.goalId}</h1>
      </div>
      <dl className="v46-status-chips">
        <StatusChip label="generated" value={view.generatedAt} />
        <StatusChip label="readOnly" value={String(view.readOnly)} />
        <StatusChip label="willMutate" value={String(view.willMutate)} />
        <StatusChip label="role" value={view.activeRole} />
        <StatusChip label="contract" value={contractLabel(view)} />
        <StatusChip label="health" value={healthLabel(view.health)} />
      </dl>
    </header>
  );
}

function StatusChip({ label, value }) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

export function GoalSnapshotPanel({ view }) {
  return (
    <Panel className="v46-goal-panel" odId="goal-snapshot" title="Goal Snapshot" meta={sourceSummary(view)}>
      <KeyValues rows={[
        ['active task', view.activeTask],
        ['goal id', view.goalId],
        ['mutation', view.willMutate === false ? 'disabled by supervisor boundary' : 'unknown']
      ]} />
    </Panel>
  );
}

export function ActiveLeasePanel({ lease }) {
  return (
    <Panel className="v46-lease-panel" odId="active-lease" title="Active Lease" meta={lease.health}>
      <div className="v46-lease-id">{lease.leaseId}</div>
      <KeyValues rows={[
        ['thread id', lease.threadId],
        ['lease health', lease.health],
        ['telemetry', 'strong active lease observed']
      ]} />
    </Panel>
  );
}

export function CurrentGatePanel({ gate }) {
  return (
    <Panel className="v46-gate-panel" odId="current-gate" title="Current Gate" meta={gate.gate}>
      <KeyValues rows={[
        ['gate', gate.gate],
        ['condition', gate.condition],
        ['next artifact', gate.nextArtifact]
      ]} />
    </Panel>
  );
}

export function RecommendedNextActionBand({ action }) {
  return (
    <section className="v46-recommended-band" data-od-id="recommended-next-action" aria-label="Recommended Next Action">
      <div>
        <span>{action.status}</span>
        <h2>Recommended Next Action</h2>
      </div>
      <p>{action.text}</p>
    </section>
  );
}

export function ContextStatusPanel({ context }) {
  return (
    <Panel className="v46-context-panel" odId="context-status" title="Context Status" meta={`${context.utilizationPercent}%`}>
      <div className="v46-meter" aria-label={`Context utilization ${context.utilizationPercent}%`}>
        <span style={{ width: `${context.utilizationPercent}%` }} />
      </div>
      <ul className="v46-chip-list">
        {context.chips.map((chip) => (
          <li key={chip}>{chip}</li>
        ))}
      </ul>
    </Panel>
  );
}

export function SessionSourceInventoryPanel({ inventory }) {
  return (
    <Panel className="v46-inventory-panel" odId="session-source-inventory" title="Session Source Inventory" meta={inventory.state}>
      <KeyValues rows={[
        ['contract', inventory.contract],
        ['generated', inventory.generatedAt],
        ['readOnly', String(inventory.readOnly)],
        ['summary', inventory.summary]
      ]} />
      <TextList className="v46-chip-list" items={inventory.providers} />
      <TextList className="v46-family-list" items={inventory.degradedReasons} />
    </Panel>
  );
}

export function ContextAdvisoryPanel({ advisory }) {
  return (
    <Panel className="v46-advisory-panel" odId="context-advisory" title="Context Advisory" meta={advisory.state}>
      <KeyValues rows={[
        ['contract', advisory.contract],
        ['generated', advisory.generatedAt],
        ['transcript', advisory.transcriptAvailability],
        ['exchange count', advisory.exchangeCount],
        ['latest tool call', advisory.latestToolCall],
        ['latest turn', advisory.latestTurnState],
        ['token usage', advisory.tokenUsage],
        ['context utilization', advisory.contextUtilization],
        ['context band', advisory.contextBand],
        ['result-block evidence', advisory.resultBlockEvidence],
        ['stale state', advisory.staleTranscriptState],
        ['missing state', advisory.missingTranscriptState]
      ]} />
      <TextList className="v46-family-list" items={advisory.blockedFields} />
      <TextList className="v46-chip-list" items={advisory.degradedReasons} />
      <TextList className="v46-chip-list" items={advisory.policyInputs} />
    </Panel>
  );
}

export function ThreadContinuationDecisionPanel({ decision }) {
  return (
    <Panel className="v46-continuation-panel" odId="thread-continuation-decision" title="Thread Continuation Decision" meta={decision.decision}>
      <KeyValues rows={[
        ['contract', decision.contract],
        ['generated', decision.generatedAt],
        ['decision', decision.decision],
        ['reason', decision.reason],
        ['confidence', decision.confidence],
        ['target role', decision.targetRole],
        ['task id', decision.taskId],
        ['thread id', decision.threadId],
        ['checkpoint ref', decision.checkpointRef],
        ['wait policy', decision.waitPolicy],
        ['boundary state', decision.commandBoundary.state],
        ['executionAvailable', String(decision.commandBoundary.executionAvailable)],
        ['copyOnly', String(decision.commandBoundary.copyOnly)]
      ]} />
      <TextList className="v46-family-list" items={decision.blockedFields} />
      <TextList className="v46-chip-list" items={decision.mismatchList} />
      <TextList className="v46-chip-list" items={decision.requiredEvidence} />
      <TextList className="v46-chip-list" items={decision.sourceContracts} />
    </Panel>
  );
}

export function PendingResultPanel({ pendingResult }) {
  return (
    <Panel className="v46-pending-panel" odId="pending-result" title="Pending Result" meta={pendingResult.label}>
      <KeyValues rows={[
        ['label', pendingResult.label],
        ['pendingResult.output', pendingResult.output === null ? 'NULL' : pendingResult.output],
        ['contract', pendingResult.contract],
        ['state', pendingResult.state],
        ['escrowRef', pendingResult.escrowRef],
        ['evidence refs', pendingResult.evidenceRefs],
        ['reason', pendingResult.reason]
      ]} />
      <TextList className="v46-family-list" items={pendingResult.blockedReasons} />
    </Panel>
  );
}

export function ResultIntakeLane({
  resultIntake,
  resultBlockText,
  previewState,
  previewLoading,
  confirmState,
  confirmLoading,
  refreshState = SUPERVISOR_REFRESH_IDLE_STATE,
  refreshLoading = false,
  onResultBlockInput,
  onPreviewResultIntake,
  onConfirmResultEscrow,
  onRefreshSupervisorState = () => undefined
}) {
  const canPreview = resultIntake.state === 'available' &&
    resultBlockText.trim() !== '' &&
    !previewLoading;

  return (
    <Panel className="v51-result-intake-panel" odId="result-intake" title="Result Intake" meta={resultIntake.state}>
      <KeyValues rows={[
        ['goal id', resultIntake.goalId],
        ['task id', resultIntake.taskId],
        ['worker role', resultIntake.workerRole],
        ['source kind', resultIntake.sourceKind],
        ['preview route', resultIntake.previewRoute],
        ['confirm route', resultIntake.confirmRoute],
        ['disabled reason', resultIntake.disabledReason]
      ]} />
      <TextList className="v51-boundary-list" items={resultIntake.boundaryNotices} />
      <label className="v51-result-input-label" htmlFor="v51-result-intake-block">
        Paste worker result block
      </label>
      <textarea
        id="v51-result-intake-block"
        className="v51-result-input"
        value={resultBlockText}
        maxLength={RESULT_INTAKE_MAX_BLOCK_LENGTH}
        spellCheck="false"
        onChange={onResultBlockInput}
      />
      <div className="v51-result-controls">
        <button
          type="button"
          className="v51-preview-button"
          disabled={!canPreview}
          onClick={onPreviewResultIntake}
        >
          Preview Result Intake
        </button>
        <SupervisorRefreshStateControl
          refreshState={refreshState}
          refreshLoading={refreshLoading}
          onRefreshSupervisorState={onRefreshSupervisorState}
        />
      </div>
      <ResultIntakePreviewResult previewState={previewState} />
      <ResultEscrowConfirmAction
        resultIntake={resultIntake}
        previewState={previewState}
        confirmState={confirmState}
        confirmLoading={confirmLoading}
        onConfirmResultEscrow={onConfirmResultEscrow}
      />
    </Panel>
  );
}

function ResultIntakePreviewResult({ previewState }) {
  if (previewState.phase === 'loading') {
    return <p className="v50-preview-status">result intake preview pending</p>;
  }

  if (previewState.phase === 'failed') {
    return <p className="v50-preview-status">{previewState.message}</p>;
  }

  if (previewState.result === null) {
    return <p className="v50-preview-status">result intake preview not loaded</p>;
  }

  const result = previewState.result;

  return (
    <div className="v51-preview-result">
      <KeyValues rows={[
        ['preview contract', result.contract],
        ['goal id', result.goalId],
        ['task id', result.taskId],
        ['worker role', result.workerRole],
        ['source', result.source],
        ['summary status', result.summaryStatus],
        ['summary', result.summary],
        ['changed files', result.changedFiles],
        ['validation commands', result.validationCommands],
        ['risks', result.risks],
        ['blockers', result.blockers],
        ['blocker reason', result.blockerReason],
        ['evidence refs', result.evidenceRefs],
        ['event state', result.eventState],
        ['event reason', result.eventReason],
        ['event type', result.eventType],
        ['command name', result.commandName],
        ['willAppendGoalEvent', result.willAppendGoalEvent],
        ['writesOnPreview', result.writesOnPreview],
        ['writesOnConfirm', result.writesOnConfirm],
        ['writesGoalEventLog', result.writesGoalEventLog],
        ['planHash', result.planHash],
        ['expiresAt', result.expiresAt],
        ['confirm route', result.confirmRoute],
        ['confirmUsesPlanHash', result.confirmUsesPlanHash]
      ]} />
      <TextList className="v46-family-list" items={result.blockedFields} />
      <TextList className="v46-chip-list" items={result.blockedReasons} />
    </div>
  );
}

function ResultEscrowConfirmAction({
  resultIntake,
  previewState,
  confirmState,
  confirmLoading,
  onConfirmResultEscrow
}) {
  const canConfirm = canConfirmResultEscrow({
    resultIntake,
    previewState
  });

  if (previewState.phase !== 'ready' || previewState.result === null) {
    return null;
  }

  return (
    <div className="v51-confirm-lane">
      {canConfirm ? (
        <button
          type="button"
          className="v51-confirm-button"
          disabled={confirmLoading}
          onClick={onConfirmResultEscrow}
        >
          Confirm Result Escrow
        </button>
      ) : (
        <p className="v50-preview-status">result escrow confirm unavailable</p>
      )}
      <ResultEscrowConfirmResult confirmState={confirmState} />
    </div>
  );
}

function ResultEscrowConfirmResult({ confirmState }) {
  if (confirmState.phase === 'idle') {
    return null;
  }

  if (confirmState.phase === 'loading') {
    return <p className="v50-preview-status">result escrow confirm pending</p>;
  }

  if (confirmState.phase === 'failed') {
    return <p className="v50-preview-status">{confirmState.message}</p>;
  }

  if (confirmState.result === null) {
    return <p className="v50-preview-status">result escrow confirmation not loaded</p>;
  }

  const result = confirmState.result;

  return (
    <div className="v51-confirm-result">
      <KeyValues rows={[
        ['confirmation contract', result.contract],
        ['status', result.status],
        ['written', result.written],
        ['planHash', result.planHash],
        ['escrowRef', result.escrowRef],
        ['pendingResultRef', result.pendingResultRef],
        ['refresh route', result.refreshRoute],
        ['pending result projection', result.pendingResultProjectionAvailable]
      ]} />
    </div>
  );
}

export function SupervisorEventPreviewLane({
  eventPreview,
  previewState,
  previewLoading,
  confirmState,
  confirmLoading,
  refreshState = SUPERVISOR_REFRESH_IDLE_STATE,
  refreshLoading = false,
  onPreviewEventPlan,
  onConfirmEventAppend,
  onRefreshSupervisorState = () => undefined
}) {
  return (
    <Panel className="v50-event-preview-panel" odId="supervisor-event-preview" title="Event Plan Preview" meta={eventPreview.state}>
      <KeyValues rows={[
        ['contract', eventPreview.contract],
        ['state', eventPreview.state],
        ['reason', eventPreview.reason],
        ['method', eventPreview.requestMethod],
        ['route', eventPreview.route],
        ['preview path', eventPreview.previewPath],
        ['confirm method', eventPreview.confirmMethod],
        ['confirm route', eventPreview.confirmRoute],
        ['confirm content type', eventPreview.confirmContentType],
        ['readOnly', String(eventPreview.readOnly)],
        ['willMutate', String(eventPreview.willMutate)]
      ]} />
      <SupervisorEventEligibilityNotice eventPreview={eventPreview} />
      {eventPreview.queryRows.length > 0 ? <KeyValues rows={eventPreview.queryRows} /> : null}
      <KeyValues rows={[
        ['event type', eventPreview.recommendedEvent.eventType],
        ['task id', eventPreview.recommendedEvent.taskId],
        ['actor role', eventPreview.recommendedEvent.actorRole],
        ['actor id', eventPreview.recommendedEvent.actorId],
        ['evidence refs', eventPreview.recommendedEvent.evidenceRefs],
        ['statement', eventPreview.recommendedEvent.statement],
        ['blocker', eventPreview.recommendedEvent.blocker]
      ]} />
      <TextList className="v46-family-list" items={eventPreview.missingInputs} />
      <div className="v50-event-controls">
        <button
          type="button"
          className="v50-preview-button"
          disabled={!eventPreview.canPreview || previewLoading}
          onClick={onPreviewEventPlan}
        >
          Preview Event Plan
        </button>
        <SupervisorRefreshStateControl
          refreshState={refreshState}
          refreshLoading={refreshLoading}
          onRefreshSupervisorState={onRefreshSupervisorState}
        />
      </div>
      <SupervisorEventPreviewResult previewState={previewState} />
      <SupervisorEventConfirmAction
        eventPreview={eventPreview}
        previewState={previewState}
        confirmState={confirmState}
        confirmLoading={confirmLoading}
        onConfirmEventAppend={onConfirmEventAppend}
      />
    </Panel>
  );
}

function SupervisorEventEligibilityNotice({ eventPreview }) {
  if (!['blocked', 'not-applicable', 'unknown'].includes(eventPreview.state)) {
    return null;
  }

  return (
    <section className="v50-eligibility-notice" aria-label="Event registration eligibility">
      <KeyValues rows={[
        ['eligibility', eventPreview.state],
        ['blocked / missing reason', eventPreview.reason],
        ['missing inputs', eventPreview.missingInputs.join(', ') || 'NULL']
      ]} />
    </section>
  );
}

export function SupervisorRefreshStateControl({
  refreshState = SUPERVISOR_REFRESH_IDLE_STATE,
  refreshLoading = false,
  onRefreshSupervisorState = () => undefined
}) {
  return (
    <div className="v50-refresh-control">
      <button
        type="button"
        className="v50-refresh-button"
        disabled={refreshLoading}
        onClick={onRefreshSupervisorState}
      >
        Refresh Supervisor State
      </button>
      <KeyValues rows={[
        ['refresh phase', refreshState.phase],
        ['refresh source', refreshState.source],
        ['refresh result', refreshState.result],
        ['refresh message', refreshState.message]
      ]} />
    </div>
  );
}

function SupervisorEventPreviewResult({ previewState }) {
  if (previewState.phase === 'loading') {
    return <p className="v50-preview-status">preview request pending</p>;
  }

  if (previewState.phase === 'failed') {
    return <p className="v50-preview-status">{previewState.message}</p>;
  }

  if (previewState.result === null) {
    return <p className="v50-preview-status">preview result not loaded</p>;
  }

  const result = previewState.result;

  return (
    <div className="v50-preview-result">
      <KeyValues rows={[
        ['result contract', result.contract],
        ['event type', result.eventType],
        ['task id', result.taskId],
        ['actor role', result.actorRole],
        ['actor id', result.actorId],
        ['evidence refs', result.evidenceRefs],
        ['statement', result.statement],
        ['blocker id', result.blockerId],
        ['blocker reason', result.blockerReason],
        ['blocker severity', result.blockerSeverity],
        ['writesInDryRun', result.writesInDryRun],
        ['append target', result.appendTarget],
        ['operation id', result.operationId],
        ['operation status', result.operationStatus],
        ['planHash', result.planHash],
        ['copy-only confirm command', result.copyOnlyConfirmCommand]
      ]} />
    </div>
  );
}

function SupervisorEventConfirmAction({
  eventPreview,
  previewState,
  confirmState,
  confirmLoading,
  onConfirmEventAppend
}) {
  const previewResult = previewState.phase === 'ready' ? previewState.result : null;
  const canConfirm = supervisorCanConfirmEventAppend({
    eventPreview,
    previewResult
  });

  if (previewState.phase !== 'ready' || previewResult === null) {
    return null;
  }

  return (
    <div className="v50-confirm-lane">
      {canConfirm ? (
        <button
          type="button"
          className="v50-confirm-button"
          disabled={confirmLoading}
          onClick={onConfirmEventAppend}
        >
          Confirm Event Append
        </button>
      ) : (
        <p className="v50-preview-status">confirm route or planHash unavailable</p>
      )}
      <SupervisorEventConfirmResult confirmState={confirmState} />
    </div>
  );
}

function SupervisorEventConfirmResult({ confirmState }) {
  if (confirmState.phase === 'idle') {
    return null;
  }

  if (confirmState.phase === 'loading') {
    return <p className="v50-preview-status">confirm request pending</p>;
  }

  if (confirmState.phase === 'failed') {
    return <p className="v50-preview-status">{confirmState.message}</p>;
  }

  if (confirmState.result === null) {
    return <p className="v50-preview-status">confirmation result not loaded</p>;
  }

  const result = confirmState.result;

  return (
    <div className="v50-confirm-result">
      <KeyValues rows={[
        ['confirmation contract', result.contract],
        ['status', result.status],
        ['written', result.written],
        ['appendOnly', result.appendOnly],
        ['event type', result.eventType],
        ['event id', result.eventId],
        ['sequence', result.sequence],
        ['event hash', result.eventHash],
        ['operation id', result.operationId],
        ['operation status', result.operationStatus],
        ['planHash', result.planHash],
        ['confirm endpoint', result.confirmEndpoint],
        ['refreshed.progress', result.refreshedProgress],
        ['refreshed.events', result.refreshedEvents],
        ['refreshed.nextAction', result.refreshedNextAction],
        ['refreshed.closeout', result.refreshedCloseout]
      ]} />
    </div>
  );
}

export async function confirmSupervisorEventAppend({
  eventPreview,
  previewState,
  confirmGoalEventPlanImpl = confirmGoalEventPlan,
  onEventConfirmed
}) {
  const visiblePreviewState = visibleSupervisorPreviewState({
    eventPreview,
    previewState
  });
  const previewResult = visiblePreviewState.phase === 'ready' ? visiblePreviewState.result : null;
  const confirmIdentity = supervisorEventConfirmIdentity({
    eventPreview,
    previewResult
  });
  const confirmPath = eventPreview?.confirmRoute === 'NULL' ? null : eventPreview?.confirmRoute;
  const constrainedBody = buildSupervisorEventConfirmBody({
    eventPreview,
    previewResult
  });

  if (typeof confirmGoalEventPlanImpl !== 'function' || confirmPath === null || constrainedBody === null) {
    return {
      identity: confirmIdentity,
      phase: 'failed',
      result: null,
      message: 'confirm route unavailable'
    };
  }

  const result = await confirmGoalEventPlanImpl(confirmPath, constrainedBody);

  if (result.ok) {
    if (typeof onEventConfirmed === 'function') {
      await onEventConfirmed(result.data);
    }

    return {
      identity: confirmIdentity,
      phase: 'ready',
      result: goalEventConfirmationResultView(result.data),
      message: null
    };
  }

  return {
    identity: confirmIdentity,
    phase: 'failed',
    result: null,
    message: textValue(result.message ?? 'confirm failed')
  };
}

export function CommandBoundaryPanel({ boundary }) {
  return (
    <Panel className="v46-command-panel" odId="command-boundary" title="Command Boundary" meta="copyOnly">
      <div className="v46-boundary-line" aria-hidden="true" />
      <KeyValues rows={[
        ['boundary state', commandBoundarySummary(boundary)],
        ['executionAvailable', String(boundary.executionAvailable)],
        ['copyOnly', String(boundary.copyOnly)]
      ]} />
      <ul className="v46-family-list">
        {boundary.blockedMutationFamilies.map((family) => (
          <li key={family}>{family}</li>
        ))}
      </ul>
    </Panel>
  );
}

export function GoalTimelinePanel({ timeline }) {
  return (
    <Panel className="v46-timeline-panel" odId="goal-timeline" title="Goal Timeline" meta="expanded">
      <ol className="v46-timeline">
        {timeline.map((event) => (
          <li key={event.index}>
            <span>{event.index}</span>
            <div>
              <h3>{event.title}</h3>
              <p>{event.copy}</p>
            </div>
          </li>
        ))}
      </ol>
    </Panel>
  );
}

export function OwnershipPanel({ ownership }) {
  return (
    <Panel className="v46-ownership-panel" odId="ownership" title="Ownership" meta="responsibility split">
      <div className="v46-owner-grid">
        {ownership.map((owner) => (
          <article key={owner.name}>
            <h3>{owner.name}</h3>
            <p>{owner.responsibility}</p>
          </article>
        ))}
      </div>
    </Panel>
  );
}

function Panel({ className, odId, title, meta, children }) {
  return (
    <section className={`v46-panel ${className}`} data-od-id={odId} aria-label={title}>
      <header>
        <h2>{title}</h2>
        <span>{meta}</span>
      </header>
      {children}
    </section>
  );
}

function KeyValues({ rows }) {
  return (
    <dl className="v46-key-values">
      {rows.map(([key, value]) => (
        <div key={key}>
          <dt>{key}</dt>
          <dd>{value}</dd>
        </div>
      ))}
    </dl>
  );
}

function TextList({ className, items }) {
  return (
    <ul className={className}>
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}
