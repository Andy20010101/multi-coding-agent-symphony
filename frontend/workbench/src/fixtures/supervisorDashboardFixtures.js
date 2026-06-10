const BASE_TIMELINE = Object.freeze([
  Object.freeze({
    eventId: 'evt-task-1-worker-evidence',
    taskId: 'task-1',
    role: 'worker',
    status: 'evidence-recorded',
    evidenceRef: 'artifact:v44-4:task-1-worker-evidence',
    timestamp: '2026-06-10T09:14:00+08:00',
    hashState: 'linked'
  }),
  Object.freeze({
    eventId: 'evt-task-1-reviewer-approved',
    taskId: 'task-1',
    role: 'reviewer',
    status: 'approved',
    evidenceRef: 'artifact:v44-4:task-1-review',
    timestamp: '2026-06-10T09:42:00+08:00',
    hashState: 'linked'
  }),
  Object.freeze({
    eventId: 'evt-task-2-active',
    taskId: 'task-2',
    role: 'worker',
    status: 'active',
    evidenceRef: 'artifact:v44-4:task-2-active',
    timestamp: '2026-06-10T10:02:00+08:00',
    hashState: 'pending'
  })
]);

const BASE_COMMAND_BOUNDARY = Object.freeze({
  state: 'disabled',
  executionAvailable: false,
  copyOnly: true,
  allowedFamilies: ['status guidance', 'handoff prompt preview'],
  blockedFamilies: ['event registration', 'child dispatch', 'daemon control', 'provider CLI', 'tag', 'publish', 'release closeout'],
  confirmationFields: ['none accepted in Workbench prototype'],
  safePreview: 'Copy preview: summarize the current fixture state for an operator handoff. No command is executed.'
});

function createBaseDashboard(overrides = {}) {
  return {
    id: 'release-ready',
    label: 'Release-ready',
    summary: 'Release readiness is explicit, but delivery actions stay blocked.',
    contractName: 'goal-supervisor-app-read-model.v1',
    contractVersion: '1',
    generatedAt: '2026-06-10T10:24:00+08:00',
    readOnly: true,
    willMutate: false,
    goalSnapshot: {
      goalId: 'v44-4-workbench-supervisor-dashboard-prototype',
      title: 'Workbench supervisor dashboard prototype',
      activeTask: 'task-1',
      activeRole: 'release-manager',
      completedTasks: 6,
      totalTasks: 6,
      blockerCount: 0,
      releaseReadiness: 'ready-declared',
      sourceContracts: ['goal-supervisor-app-read-model.v1', 'goal-progress-ledger.v1', 'goal-event-log.v1'],
      generatedAt: '2026-06-10T10:24:00+08:00'
    },
    recommendedNextAction: {
      actionId: 'copy-release-handoff',
      label: 'Prepare reviewer handoff',
      reason: 'Release readiness is present in the fixture model; Workbench still cannot tag, publish, or close out.',
      targetRole: 'release-manager',
      targetTask: 'release',
      state: 'checkpoint',
      checkpointRef: 'checkpoint:v44-4-release-ready',
      waitPolicy: 'none',
      staleThreshold: '15m',
      blockedFields: ['tag command', 'publish command'],
      safePreview: 'Copy preview: hand off release-ready status with evidence refs and blocked release families.'
    },
    activeLease: {
      leaseId: 'lease-release-ready-empty',
      threadId: 'none',
      taskId: 'release',
      role: 'release-manager',
      phase: 'review',
      status: 'idle',
      startedAt: '2026-06-10T10:12:00+08:00',
      updatedAt: '2026-06-10T10:24:00+08:00',
      age: '12m',
      duplicateDispatchGuard: 'no active child dispatch from Workbench'
    },
    contextStatus: {
      state: 'available',
      providers: ['codex: summary available', 'claude: not active'],
      transcriptAvailability: 'readable summary',
      exchangeCount: 42,
      latestTurn: 'release-manager evidence check',
      latestToolCall: 'none exposed',
      tokenUsage: '62k / 200k',
      utilization: '31%',
      transcriptState: 'fresh',
      resultBlockEvidence: 'artifact:v44-4:release-ready-context',
      driftMarkers: ['none']
    },
    pendingResult: {
      status: 'consumed',
      source: 'fixture result escrow',
      eventToRegister: 'none',
      evidenceRef: 'artifact:v44-4:release-ready',
      parserReason: 'already handled',
      staleMarker: 'fresh',
      missingMarker: 'none'
    },
    currentGate: {
      gateId: 'release.ready',
      status: 'authorized-by-fixture',
      requiredCommandFamily: 'release gate event',
      blockingReason: 'none',
      evidenceRequirement: 'release evidence refs already attached',
      closeoutAuthorization: 'not available from Workbench'
    },
    ownership: {
      orchestrationOwner: 'supervisor daemon',
      deliveryBoundary: 'PR review owns merge and rollback',
      activePr: 'fixture PR #44',
      branch: 'codex/v44-4-pr1-fixture-dashboard-prototype',
      rollbackBoundary: 'remove fixture route and components',
      daemonState: 'observed only',
      controllerInterventionReason: 'none'
    },
    commandBoundary: BASE_COMMAND_BOUNDARY,
    goalTimeline: BASE_TIMELINE,
    ...overrides
  };
}

export const SUPERVISOR_DASHBOARD_FIXTURES = Object.freeze({
  'release-ready': Object.freeze(createBaseDashboard()),
  'healthy-active-lease': Object.freeze(createBaseDashboard({
    id: 'healthy-active-lease',
    label: 'Healthy active lease',
    summary: 'Active child lease is recent and duplicate dispatch is visibly unavailable.',
    generatedAt: '2026-06-10T10:31:00+08:00',
    goalSnapshot: {
      goalId: 'v44-4-workbench-supervisor-dashboard-prototype',
      title: 'Workbench supervisor dashboard prototype',
      activeTask: 'task-2',
      activeRole: 'worker',
      completedTasks: 2,
      totalTasks: 6,
      blockerCount: 0,
      releaseReadiness: 'not-ready',
      sourceContracts: ['goal-supervisor-app-read-model.v1', 'session-context-summary.v1'],
      generatedAt: '2026-06-10T10:31:00+08:00'
    },
    recommendedNextAction: {
      actionId: 'wait-active-lease',
      label: 'Wait for active lease',
      reason: 'Child thread is fresh and transcript summary is readable; duplicate dispatch remains blocked.',
      targetRole: 'worker',
      targetTask: 'task-2',
      state: 'wait',
      checkpointRef: 'none',
      waitPolicy: 'poll after 2m',
      staleThreshold: '10m',
      blockedFields: ['dispatch child'],
      safePreview: 'Copy preview: ask worker for checkpoint only if lease becomes stale.'
    },
    activeLease: {
      leaseId: 'lease-task-2-worker-001',
      threadId: '019ea62d-worker-task-2',
      taskId: 'task-2',
      role: 'worker',
      phase: 'implement',
      status: 'healthy',
      startedAt: '2026-06-10T10:20:00+08:00',
      updatedAt: '2026-06-10T10:30:20+08:00',
      age: '40s',
      duplicateDispatchGuard: 'blocked while lease is healthy'
    }
  })),
  'pending-result': Object.freeze(createBaseDashboard({
    id: 'pending-result',
    label: 'Pending result',
    summary: 'Pending result exposes event intent and evidence ref without a registration control.',
    recommendedNextAction: {
      actionId: 'checkpoint-pending-result',
      label: 'Checkpoint pending result',
      reason: 'A parsed result is waiting for operator review; Workbench does not append events.',
      targetRole: 'controller',
      targetTask: 'task-3',
      state: 'checkpoint',
      checkpointRef: 'checkpoint:pending-result-task-3',
      waitPolicy: 'none',
      staleThreshold: '20m',
      blockedFields: ['event append', 'confirmation hash'],
      safePreview: 'Copy preview: include event id, evidence ref, and parser status for manual review.'
    },
    pendingResult: {
      status: 'pending',
      source: 'fixture result escrow',
      eventToRegister: 'worker.evidence-recorded',
      evidenceRef: 'artifact:v44-4:pending-worker-evidence',
      parserReason: 'parser accepted event fields; registration remains unavailable',
      staleMarker: 'fresh',
      missingMarker: 'none'
    }
  })),
  'stale-transcript': Object.freeze(createBaseDashboard({
    id: 'stale-transcript',
    label: 'Stale transcript',
    summary: 'Transcript summary is stale while the lease still appears active.',
    recommendedNextAction: {
      actionId: 'recover-stale-context',
      label: 'Open handoff checkpoint',
      reason: 'Lease update is older than the stale threshold and transcript exchange count has not moved.',
      targetRole: 'worker',
      targetTask: 'task-4',
      state: 'recover-drift',
      checkpointRef: 'checkpoint:stale-transcript-task-4',
      waitPolicy: 'do not wait past stale threshold',
      staleThreshold: '10m',
      blockedFields: ['dispatch replacement child'],
      safePreview: 'Copy preview: request a checkpoint from the active worker thread.'
    },
    activeLease: {
      leaseId: 'lease-task-4-worker-019',
      threadId: '019ea62d-stale-task-4',
      taskId: 'task-4',
      role: 'worker',
      phase: 'implement',
      status: 'active',
      startedAt: '2026-06-10T09:44:00+08:00',
      updatedAt: '2026-06-10T10:01:00+08:00',
      age: '23m',
      duplicateDispatchGuard: 'blocked until supervisor resolves stale transcript'
    },
    contextStatus: {
      state: 'stale',
      providers: ['codex: summary stale', 'claude: not active'],
      transcriptAvailability: 'stale transcript summary',
      exchangeCount: 18,
      latestTurn: 'worker checkpoint requested',
      latestToolCall: 'none exposed',
      tokenUsage: '178k / 200k',
      utilization: '89%',
      transcriptState: 'stale',
      resultBlockEvidence: 'artifact:v44-4:stale-context',
      driftMarkers: ['lease active but transcript stale']
    }
  })),
  'blocked-gate': Object.freeze(createBaseDashboard({
    id: 'blocked-gate',
    label: 'Blocked gate',
    summary: 'Current gate names the blocking evidence requirement.',
    goalSnapshot: {
      goalId: 'v44-4-workbench-supervisor-dashboard-prototype',
      title: 'Workbench supervisor dashboard prototype',
      activeTask: 'task-5',
      activeRole: 'main-verifier',
      completedTasks: 4,
      totalTasks: 6,
      blockerCount: 1,
      releaseReadiness: 'blocked',
      sourceContracts: ['goal-supervisor-app-read-model.v1', 'goal-event-log.v1'],
      generatedAt: '2026-06-10T10:37:00+08:00'
    },
    recommendedNextAction: {
      actionId: 'block-main-gate',
      label: 'Resolve gate blocker',
      reason: 'Main verification evidence is missing, so closeout stays blocked.',
      targetRole: 'main-verifier',
      targetTask: 'task-5',
      state: 'block',
      checkpointRef: 'none',
      waitPolicy: 'blocked until evidence exists',
      staleThreshold: 'none',
      blockedFields: ['main verification evidence ref', 'closeout authorization'],
      safePreview: 'Copy preview: list missing evidence and gate requirement.'
    },
    currentGate: {
      gateId: 'main.verification',
      status: 'blocked',
      requiredCommandFamily: 'main verification gate event',
      blockingReason: 'missing main verification evidence ref',
      evidenceRequirement: 'artifact ref for verification command output',
      closeoutAuthorization: 'blocked'
    },
    commandBoundary: Object.freeze({
      ...BASE_COMMAND_BOUNDARY,
      state: 'confirm-required',
      confirmationFields: ['main verification evidence ref', 'verifier id', 'gate status']
    })
  })),
  'missing-empty-context': Object.freeze(createBaseDashboard({
    id: 'missing-empty-context',
    label: 'Missing context',
    summary: 'Missing context remains neutral and names the absent contract field.',
    recommendedNextAction: {
      actionId: 'wait-missing-context',
      label: 'Wait for context projection',
      reason: 'contextStatus.providerSummaries is empty; the fixture does not infer success or failure.',
      targetRole: 'controller',
      targetTask: 'task-6',
      state: 'wait',
      checkpointRef: 'none',
      waitPolicy: 'wait for next read model generation',
      staleThreshold: 'unknown',
      blockedFields: ['contextStatus.providerSummaries'],
      safePreview: 'Copy preview: report missing contextStatus.providerSummaries.'
    },
    contextStatus: {
      state: 'missing',
      providers: [],
      transcriptAvailability: 'missing transcript',
      exchangeCount: 0,
      latestTurn: 'missing',
      latestToolCall: 'missing',
      tokenUsage: 'missing',
      utilization: 'missing',
      transcriptState: 'missing',
      resultBlockEvidence: 'missing',
      driftMarkers: ['missing contract field: contextStatus.providerSummaries']
    },
    pendingResult: {
      status: 'missing',
      source: 'fixture result escrow',
      eventToRegister: 'missing',
      evidenceRef: 'missing',
      parserReason: 'pendingResult absent from fixture read model',
      staleMarker: 'unknown',
      missingMarker: 'pendingResult'
    }
  }))
});

export const SUPERVISOR_DASHBOARD_SCENARIOS = Object.freeze(Object.keys(SUPERVISOR_DASHBOARD_FIXTURES));
