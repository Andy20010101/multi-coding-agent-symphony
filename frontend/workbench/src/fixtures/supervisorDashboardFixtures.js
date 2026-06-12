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

const BASE_SESSION_SOURCE_INVENTORY = Object.freeze({
  contractName: 'sessionSourceInventory.v1',
  contractVersion: 1,
  generatedAt: '2026-06-10T10:24:00+08:00',
  readOnly: true,
  willMutate: false,
  state: 'degraded',
  scanScope: 'bounded-provider-session-roots',
  summary: {
    providerCount: 2,
    availableProviderCount: 1,
    missingProviderCount: 0,
    degradedProviderCount: 1,
    failedProviderCount: 0,
    state: 'degraded'
  },
  providers: [{
    provider: 'codex',
    state: 'available',
    availability: 'available',
    readState: 'readable',
    candidateFileCount: 5,
    scannedFileCount: 5,
    readableFileCount: 5,
    unreadableFileCount: 0,
    latestModifiedAt: '2026-06-10T10:22:00+08:00',
    stale: false,
    latestSessionRef: 'codex:2026-06-10-live',
    degradedReasons: []
  }, {
    provider: 'claude',
    state: 'degraded',
    availability: 'degraded',
    readState: 'readable',
    candidateFileCount: 3,
    scannedFileCount: 3,
    readableFileCount: 2,
    unreadableFileCount: 1,
    latestModifiedAt: '2026-06-10T10:18:00+08:00',
    stale: false,
    latestSessionRef: 'claude:project-live',
    degradedReasons: ['some-candidate-files-unreadable']
  }],
  degradedReasons: ['claude:some-candidate-files-unreadable']
});

const BASE_CONTEXT_ADVISORY = Object.freeze({
  contractName: 'contextAdvisory.v1',
  contractVersion: 1,
  generatedAt: '2026-06-10T10:24:00+08:00',
  readOnly: true,
  willMutate: false,
  state: 'degraded',
  sessionContextRef: 'sessionContext.v1 / v1',
  inventoryRef: 'sessionSourceInventory.v1 / v1',
  transcriptAvailability: 'readable',
  exchangeCount: 42,
  latestToolCall: 'missing',
  latestTurnState: 'status: completed, role: assistant',
  tokenUsage: 'status: available, inputTokens: 41000, outputTokens: 1200, totalTokens: 42200',
  contextUtilization: '42%',
  contextBand: 'low',
  resultBlockEvidence: 'present',
  staleTranscriptState: 'stale: false',
  missingTranscriptState: 'missing: false',
  degradedReasons: ['inventory:claude-degraded'],
  blockedFields: [],
  policyInputs: {
    threadId: '019ea62d-live-task-3',
    transcriptAvailability: 'readable',
    sessionSourceSummaries: ['codex: readable: 019ea62d-live-task-3'],
    inventorySourceSummaries: ['codex: available: readable', 'claude: degraded: readable']
  }
});

const BASE_THREAD_CONTINUATION_DECISION = Object.freeze({
  contractName: 'threadContinuationDecision.v1',
  contractVersion: 1,
  generatedAt: '2026-06-10T10:24:00+08:00',
  readOnly: true,
  willMutate: false,
  state: 'checkpoint',
  decision: 'checkpoint',
  reason: 'result-awaits-registration',
  confidence: 'partial',
  targetRole: 'release-manager',
  taskId: 'release',
  threadId: '019ea62d-live-task-3',
  checkpointRef: 'checkpoint:v44-4-release-ready',
  waitPolicy: 'NULL',
  blockedFields: ['event-log-write'],
  mismatchList: ['none'],
  requiredEvidence: ['pending-result-registration'],
  sourceContracts: ['contextAdvisory.v1', 'sessionSourceInventory.v1', 'goal-supervisor-app-read-model.v1'],
  commandBoundary: {
    state: 'disabled',
    executionAvailable: false,
    copyOnly: true,
    blockedFamilies: ['child-dispatch', 'event-log-write', 'provider-cli']
  }
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
      sourceContracts: ['goal-supervisor-app-read-model.v1', 'goal-progress-ledger.v1', 'goal-event-log.v1', 'sessionSourceInventory.v1', 'contextAdvisory.v1', 'threadContinuationDecision.v1'],
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
    sessionSourceInventory: BASE_SESSION_SOURCE_INVENTORY,
    contextAdvisory: BASE_CONTEXT_ADVISORY,
    threadContinuationDecision: BASE_THREAD_CONTINUATION_DECISION,
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
    },
    threadContinuationDecision: Object.freeze({
      ...BASE_THREAD_CONTINUATION_DECISION,
      state: 'wait',
      decision: 'wait',
      reason: 'active-tool-call-in-progress',
      confidence: 'known',
      targetRole: 'worker',
      taskId: 'task-2',
      waitPolicy: 'activeLeaseAgeMs: 40000, staleThresholdMs: 600000',
      blockedFields: ['none'],
      requiredEvidence: ['none']
    }),
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
    },
    threadContinuationDecision: Object.freeze({
      ...BASE_THREAD_CONTINUATION_DECISION,
      state: 'checkpoint',
      decision: 'checkpoint',
      reason: 'result-awaits-registration',
      targetRole: 'controller',
      taskId: 'task-3',
      checkpointRef: 'checkpoint:pending-result-task-3',
      requiredEvidence: ['pending-result-registration']
    }),
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
    },
    sessionSourceInventory: Object.freeze({
      ...BASE_SESSION_SOURCE_INVENTORY,
      state: 'stale',
      summary: {
        ...BASE_SESSION_SOURCE_INVENTORY.summary,
        state: 'stale',
        availableProviderCount: 0,
        degradedProviderCount: 2
      },
      providers: [{
        provider: 'codex',
        state: 'stale',
        availability: 'stale',
        readState: 'readable',
        candidateFileCount: 4,
        scannedFileCount: 4,
        readableFileCount: 4,
        unreadableFileCount: 0,
        latestModifiedAt: '2026-06-10T09:58:00+08:00',
        stale: true,
        latestSessionRef: 'codex:stale-task-4',
        degradedReasons: ['latest-session-file-exceeded-stale-threshold']
      }, {
        provider: 'claude',
        state: 'unreadable',
        availability: 'unreadable',
        readState: 'unreadable',
        candidateFileCount: 2,
        scannedFileCount: 2,
        readableFileCount: 0,
        unreadableFileCount: 2,
        latestModifiedAt: '2026-06-10T09:52:00+08:00',
        stale: true,
        latestSessionRef: 'claude:stale-task-4',
        degradedReasons: ['all-candidate-files-unreadable']
      }],
      degradedReasons: ['codex:latest-session-file-exceeded-stale-threshold', 'claude:all-candidate-files-unreadable']
    }),
    contextAdvisory: Object.freeze({
      ...BASE_CONTEXT_ADVISORY,
      state: 'stale',
      transcriptAvailability: 'stale',
      exchangeCount: 18,
      tokenUsage: 'status: available, totalTokens: 178000',
      contextUtilization: '89%',
      contextBand: 'high',
      staleTranscriptState: 'stale: true / lease-active-transcript-stale',
      degradedReasons: ['session:lease-active-transcript-stale'],
      blockedFields: ['staleTranscriptState']
    }),
    threadContinuationDecision: Object.freeze({
      ...BASE_THREAD_CONTINUATION_DECISION,
      state: 'new-thread',
      decision: 'new-thread',
      reason: 'lease-active-transcript-stale',
      confidence: 'partial',
      targetRole: 'worker',
      taskId: 'task-4',
      blockedFields: ['staleTranscriptState'],
      mismatchList: ['lease active but transcript stale'],
      requiredEvidence: ['durable-checkpoint']
    }),
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
    }),
    contextAdvisory: Object.freeze({
      ...BASE_CONTEXT_ADVISORY,
      state: 'blocked',
      blockedFields: ['mainVerificationEvidence', 'contextUtilization.ratio'],
      contextBand: 'unknown'
    }),
    threadContinuationDecision: Object.freeze({
      ...BASE_THREAD_CONTINUATION_DECISION,
      state: 'blocked',
      decision: 'blocked',
      reason: 'missing main verification evidence ref',
      confidence: 'partial',
      targetRole: 'main-verifier',
      taskId: 'task-5',
      blockedFields: ['mainVerificationEvidence', 'evidenceRef'],
      mismatchList: ['main-verification-evidence'],
      requiredEvidence: ['main-verification-evidence'],
      commandBoundary: {
        state: 'confirm-required',
        executionAvailable: false,
        copyOnly: true,
        blockedFamilies: ['child-dispatch', 'event-log-write', 'provider-cli', 'release-closeout']
      }
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
    sessionSourceInventory: Object.freeze({
      ...BASE_SESSION_SOURCE_INVENTORY,
      state: 'missing',
      summary: {
        providerCount: 2,
        availableProviderCount: 0,
        missingProviderCount: 2,
        degradedProviderCount: 0,
        failedProviderCount: 0,
        state: 'missing'
      },
      providers: [{
        provider: 'codex',
        state: 'missing',
        availability: 'missing',
        readState: 'missing',
        candidateFileCount: 0,
        scannedFileCount: 0,
        readableFileCount: 0,
        unreadableFileCount: 0,
        latestModifiedAt: null,
        stale: false,
        latestSessionRef: null,
        degradedReasons: ['source-root-missing']
      }, {
        provider: 'claude',
        state: 'missing',
        availability: 'missing',
        readState: 'missing',
        candidateFileCount: 0,
        scannedFileCount: 0,
        readableFileCount: 0,
        unreadableFileCount: 0,
        latestModifiedAt: null,
        stale: false,
        latestSessionRef: null,
        degradedReasons: ['source-root-missing']
      }],
      degradedReasons: ['codex:source-root-missing', 'claude:source-root-missing']
    }),
    contextAdvisory: Object.freeze({
      ...BASE_CONTEXT_ADVISORY,
      state: 'unknown',
      transcriptAvailability: 'missing',
      exchangeCount: 'missing',
      latestToolCall: 'missing',
      latestTurnState: 'missing',
      tokenUsage: 'missing',
      contextUtilization: 'missing',
      contextBand: 'unknown',
      resultBlockEvidence: 'missing',
      missingTranscriptState: 'missing: true / no-readable-session-transcript',
      degradedReasons: ['session:no-readable-session-transcript'],
      blockedFields: ['transcriptAvailability', 'tokenUsage', 'contextUtilization.ratio'],
      policyInputs: {
        transcriptAvailability: 'missing',
        sessionSourceSummaries: [],
        inventorySourceSummaries: ['codex: missing: missing', 'claude: missing: missing']
      }
    }),
    threadContinuationDecision: Object.freeze({
      ...BASE_THREAD_CONTINUATION_DECISION,
      state: 'blocked',
      decision: 'blocked',
      reason: 'no-readable-session-transcript',
      confidence: 'unknown',
      targetRole: 'controller',
      taskId: 'task-6',
      threadId: 'NULL',
      checkpointRef: 'NULL',
      blockedFields: ['transcriptAvailability', 'contextUtilization.ratio'],
      mismatchList: ['none'],
      requiredEvidence: ['readable-session-transcript']
    }),
    pendingResult: {
      status: 'missing',
      source: 'fixture result escrow',
      eventToRegister: 'missing',
      evidenceRef: 'missing',
      parserReason: 'pendingResult absent from fixture read model',
      staleMarker: 'unknown',
      missingMarker: 'pendingResult'
    },
    goalTimeline: []
  }))
});

export const SUPERVISOR_DASHBOARD_SCENARIOS = Object.freeze(Object.keys(SUPERVISOR_DASHBOARD_FIXTURES));
