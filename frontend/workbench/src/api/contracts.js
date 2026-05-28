const MISSING_TEXT = '未暴露';
const UNAVAILABLE_TEXT = '不可用';
const NOT_APPLICABLE_TEXT = '不适用';
const HANDOFF_API_BASE = '/api/handoff';
const GUIDED_GOAL_HANDOFF_CONTRACT_NAME = 'guided-goal-handoff.v1';
const SAFE_ARTIFACT_PREVIEW_CONTRACT_NAME = 'safe-artifact-preview.v1';
const GOAL_PROGRESS_LEDGER_CONTRACT_NAME = 'goal-progress-ledger.v1';
const GOAL_EVENT_LOG_CONTRACT_NAME = 'goal-event-log.v1';
const CAPABILITIES_CONTRACT_NAME = 'capabilities.v1';
const DIAGNOSTICS_CONTRACT_NAME = 'diagnostics.v1';
const ERROR_ENVELOPE_CONTRACT_NAME = 'error-envelope.v1';
const MATRIX_MISSING_TEXT = 'missing';
const MATRIX_UNKNOWN_TEXT = 'unknown';

export const READONLY_API_ROUTES = Object.freeze([
  Object.freeze({
    id: 'summary',
    label: 'Summary',
    path: '/api/summary',
    method: 'GET',
    contractName: 'symphony.console-snapshot'
  }),
  Object.freeze({
    id: 'readiness',
    label: 'Readiness',
    path: '/api/readiness',
    method: 'GET',
    contractName: 'symphony.console-readiness'
  }),
  Object.freeze({
    id: 'handoffRefs',
    label: 'Handoff Refs',
    path: HANDOFF_API_BASE,
    method: 'GET',
    contractName: 'symphony.handoff-refs'
  }),
  Object.freeze({
    id: 'runs',
    label: 'Runs',
    path: '/api/runs',
    method: 'GET',
    contractName: 'symphony.console-runs'
  }),
  Object.freeze({
    id: 'latestRun',
    label: 'Latest Run',
    path: '/api/runs/latest',
    method: 'GET',
    contractName: 'symphony.console-run'
  }),
  Object.freeze({
    id: 'goals',
    label: 'Goals',
    path: '/api/goals',
    method: 'GET',
    contractName: 'symphony.goals-index'
  }),
  Object.freeze({
    id: 'goalProgress',
    label: 'Goal Progress',
    path: '/api/goals/latest/progress',
    method: 'GET',
    contractName: GOAL_PROGRESS_LEDGER_CONTRACT_NAME
  }),
  Object.freeze({
    id: 'goalEvents',
    label: 'Goal Events',
    path: '/api/goals/latest/events',
    method: 'GET',
    contractName: GOAL_EVENT_LOG_CONTRACT_NAME
  }),
  Object.freeze({
    id: 'capabilities',
    label: 'Capabilities',
    path: '/api/capabilities',
    method: 'GET',
    contractName: CAPABILITIES_CONTRACT_NAME
  }),
  Object.freeze({
    id: 'diagnostics',
    label: 'Diagnostics',
    path: '/api/diagnostics',
    method: 'GET',
    contractName: DIAGNOSTICS_CONTRACT_NAME
  })
]);

export const GUIDED_GOAL_HANDOFF_ROUTE_TEMPLATE = Object.freeze({
  id: 'guidedGoalHandoff',
  label: 'Guided Goal Handoff',
  path: '/api/handoff/<ref>',
  method: 'GET',
  contractName: GUIDED_GOAL_HANDOFF_CONTRACT_NAME
});

export const RUN_TIMELINE_ROUTE_TEMPLATE = Object.freeze({
  id: 'latestRunTimeline',
  label: 'Latest Run Timeline',
  path: '/api/runs/<run-id>/timeline',
  method: 'GET',
  contractName: 'symphony.console-run-timeline'
});

export const SAFE_ARTIFACT_PREVIEW_ROUTE_TEMPLATE = Object.freeze({
  id: 'safeArtifactPreview',
  label: 'Safe Artifact Preview',
  path: '/api/runs/<run-id>/artifacts/<artifact-kind>/preview',
  method: 'GET',
  contractName: SAFE_ARTIFACT_PREVIEW_CONTRACT_NAME,
  acceptErrorContract: true
});

export const GOAL_PROGRESS_ROUTE_TEMPLATE = Object.freeze({
  id: 'goalProgressById',
  label: 'Goal Progress By Id',
  path: '/api/goals/<goal-id>/progress',
  method: 'GET',
  contractName: GOAL_PROGRESS_LEDGER_CONTRACT_NAME,
  acceptErrorContract: true
});

export const GOAL_EVENTS_ROUTE_TEMPLATE = Object.freeze({
  id: 'goalEventsById',
  label: 'Goal Events By Id',
  path: '/api/goals/<goal-id>/events',
  method: 'GET',
  contractName: GOAL_EVENT_LOG_CONTRACT_NAME,
  acceptErrorContract: true
});

export const READONLY_API_ROUTE_ALLOWLIST = Object.freeze([
  ...READONLY_API_ROUTES,
  GOAL_EVENTS_ROUTE_TEMPLATE,
  GOAL_PROGRESS_ROUTE_TEMPLATE,
  GUIDED_GOAL_HANDOFF_ROUTE_TEMPLATE,
  RUN_TIMELINE_ROUTE_TEMPLATE,
  SAFE_ARTIFACT_PREVIEW_ROUTE_TEMPLATE
]);

export const READONLY_API_ROUTE_IDS = Object.freeze(
  READONLY_API_ROUTE_ALLOWLIST.map((route) => route.id)
);

const RUN_API_BASE = ['', 'api', 'runs'].join('/');
const TIMELINE_SEGMENT = 'timeline';

export const DEFERRED_CONTRACT_GAPS = Object.freeze([
  'dirty adoption 当前仍由 pending adoption 与 Git readiness 分别暴露'
]);

const ARTIFACT_PREVIEW_FIELD_GROUPS = Object.freeze([
  Object.freeze({
    label: 'uri/ref',
    fields: Object.freeze(['uri', 'ref'])
  }),
  Object.freeze({
    label: 'mime',
    fields: Object.freeze(['mime'])
  }),
  Object.freeze({
    label: 'title/displayTitle',
    fields: Object.freeze(['title', 'displayTitle'])
  }),
  Object.freeze({
    label: 'safeToRenderInline',
    fields: Object.freeze(['safeToRenderInline'])
  }),
  Object.freeze({
    label: 'sourceRunId',
    fields: Object.freeze(['sourceRunId'])
  }),
  Object.freeze({
    label: 'artifactKind',
    fields: Object.freeze(['artifactKind'])
  }),
  Object.freeze({
    label: 'previewAvailable',
    fields: Object.freeze(['previewAvailable'])
  }),
  Object.freeze({
    label: 'sizeBytes',
    fields: Object.freeze(['sizeBytes'])
  })
]);

export function projectWorkbenchContracts(results) {
  const summaryData = dataFrom(results.summary);
  const readinessData = dataFrom(results.readiness);
  const handoffRefsData = dataFrom(results.handoffRefs);
  const guidedGoalHandoffData = dataFrom(results.guidedGoalHandoff);
  const runsData = dataFrom(results.runs);
  const latestRunData = dataFrom(results.latestRun);
  const goalsData = dataFrom(results.goals);
  const goalProgressData = dataFrom(results.goalProgress);
  const goalEventsData = dataFrom(results.goalEvents);
  const capabilitiesData = dataFrom(results.capabilities);
  const diagnosticsData = dataFrom(results.diagnostics);
  const latestRun = latestRunData?.run ?? null;
  const safeArtifactPreviewResults = Array.isArray(results.safeArtifactPreviews)
    ? results.safeArtifactPreviews
    : [];
  const routeStates = [
    ...READONLY_API_ROUTES.map((route) => projectRouteState(route, results[route.id])),
    projectRouteState(
      results.guidedGoalHandoff?.routeDescriptor ?? GUIDED_GOAL_HANDOFF_ROUTE_TEMPLATE,
      results.guidedGoalHandoff
    ),
    projectRouteState(
      results.latestRunTimeline?.routeDescriptor ?? RUN_TIMELINE_ROUTE_TEMPLATE,
      results.latestRunTimeline
    ),
    ...safeArtifactPreviewResults.map((result) => projectRouteState(
      result?.routeDescriptor ?? SAFE_ARTIFACT_PREVIEW_ROUTE_TEMPLATE,
      result
    ))
  ];
  const failedRequiredRoutes = routeStates.filter((route) => (
    route.state === 'failed' && route.id !== 'latestRun' && route.id !== 'latestRunTimeline'
  ));
  const hasNoRuns = summaryData?.latestRun === null || summaryData?.status === 'no-runs';
  const projectedLatestRun = projectLatestRun({
    result: results.latestRun,
    run: latestRun,
    hasNoRuns,
    safeArtifactPreviewResults
  });

  return {
    state: failedRequiredRoutes.length > 0 ? 'partial' : 'ready',
    routeStates,
    summary: projectSummary(summaryData),
    readiness: projectReadiness(readinessData, summaryData),
    runs: projectRuns(runsData, summaryData),
    latestRun: projectedLatestRun,
    latestRunTimeline: projectLatestRunTimeline({
      result: results.latestRunTimeline,
      latestRun: projectedLatestRun
    }),
    handoff: projectGuidedGoalHandoff({
      indexResult: results.handoffRefs,
      handoffResult: results.guidedGoalHandoff,
      handoffIndex: handoffRefsData,
      handoff: guidedGoalHandoffData
    }),
    adoption: projectAdoption({
      summary: summaryData,
      readiness: readinessData
    }),
    artifactRefs: projectArtifactRefs(latestRun?.artifactRefs, latestRun?.artifactStatus, safeArtifactPreviewResults),
    goals: projectGoals(goalsData),
    goalProgress: projectGoalProgress({
      result: results.goalProgress,
      ledger: goalProgressData
    }),
    goalEvents: projectGoalEvents({
      result: results.goalEvents,
      eventLog: goalEventsData,
      ledger: goalProgressData
    }),
    capabilities: projectCapabilities(capabilitiesData),
    diagnosticsV1: projectDiagnostics(diagnosticsData),
    deferredGaps: DEFERRED_CONTRACT_GAPS.map((gap) => ({
      label: gap,
      status: MISSING_TEXT
    }))
  };
}

export function createGuidedGoalHandoffRoute(handoffIndex) {
  const refs = Array.isArray(handoffIndex?.refs) ? handoffIndex.refs : [];
  const registeredRef = refs.find((candidate) => (
    candidate?.contractName === GUIDED_GOAL_HANDOFF_CONTRACT_NAME
  ));
  const ref = registeredRef?.ref;

  if (!isNonEmptyString(ref)) {
    return null;
  }

  return Object.freeze({
    ...GUIDED_GOAL_HANDOFF_ROUTE_TEMPLATE,
    path: `${HANDOFF_API_BASE}/${encodeURIComponent(ref)}`,
    ref,
    contractName: isNonEmptyString(registeredRef.contractName)
      ? registeredRef.contractName
      : GUIDED_GOAL_HANDOFF_CONTRACT_NAME
  });
}

export function createRunTimelineRoute(runId) {
  if (!isNonEmptyString(runId)) {
    return null;
  }

  return Object.freeze({
    ...RUN_TIMELINE_ROUTE_TEMPLATE,
    path: `${RUN_API_BASE}/${encodeURIComponent(runId)}/${TIMELINE_SEGMENT}`,
    runId
  });
}

export function createSafeArtifactPreviewRoutes(artifactRefs) {
  if (!Array.isArray(artifactRefs)) {
    return [];
  }

  return artifactRefs
    .map((artifact, index) => {
      if (!isSafeArtifactPreviewRoutePath(artifact?.uri)) {
        return null;
      }

      const kind = isNonEmptyString(artifact?.kind) ? artifact.kind : `artifact-${index + 1}`;

      return Object.freeze({
        ...SAFE_ARTIFACT_PREVIEW_ROUTE_TEMPLATE,
        id: `safeArtifactPreview:${index}`,
        label: `Safe Artifact Preview ${kind}`,
        path: artifact.uri,
        artifactRef: artifact?.ref ?? null,
        registeredKind: artifact?.kind ?? null
      });
    })
    .filter((route) => route !== null);
}

export function projectArtifactRefs(artifactRefs, artifactStatus, safeArtifactPreviewResults = []) {
  const status = projectArtifactStatus(artifactStatus);

  if (!Array.isArray(artifactRefs)) {
    return {
      state: 'missing',
      count: null,
      label: MISSING_TEXT,
      status,
      items: [],
      unregistered: textState('未读取 / 不适用'),
      previewRoutes: {
        state: 'missing',
        count: 0,
        label: MISSING_TEXT
      },
      missingPreviewFields: ARTIFACT_PREVIEW_FIELD_GROUPS.map((group) => group.label)
    };
  }

  const items = artifactRefs.map((artifact) => {
    const previewFields = ARTIFACT_PREVIEW_FIELD_GROUPS.map((group) => {
      const exposed = group.fields.some((field) => hasOwn(artifact, field));

      return {
        label: group.label,
        status: exposed ? 'exposed' : 'missing',
        text: exposed ? '已暴露' : MISSING_TEXT
      };
    });

    return {
      kind: valueState(artifact.kind),
      status: valueState(projectArtifactRefStatus({
        artifact,
        artifactStatus
      })),
      path: valueState(artifact.path),
      ref: valueState(artifact.ref),
      uri: valueState(artifact.uri),
      previewFields,
      preview: projectSafeArtifactPreview({
        artifact,
        result: findSafeArtifactPreviewResult({
          artifact,
          results: safeArtifactPreviewResults
        })
      })
    };
  });

  return {
    state: 'available',
    count: artifactRefs.length,
    label: `${artifactRefs.length}`,
    status,
    items,
    unregistered: textState('未读取 / 不适用'),
    previewRoutes: {
      state: safeArtifactPreviewResults.length === 0 ? 'empty' : 'available',
      count: safeArtifactPreviewResults.length,
      label: `${safeArtifactPreviewResults.length}`
    },
    missingPreviewFields: unique(
      items.flatMap((item) => item.previewFields
        .filter((field) => field.status === 'missing')
        .map((field) => field.label))
    )
  };
}

function projectSafeArtifactPreview({ artifact, result }) {
  if (!isSafeArtifactPreviewRoutePath(artifact?.uri)) {
    return {
      state: 'missing',
      route: valueState(artifact?.uri),
      httpStatus: valueState(undefined),
      contractName: valueState(undefined),
      contractVersion: valueState(undefined),
      status: valueState(undefined),
      mime: valueState(undefined),
      displayTitle: valueState(undefined),
      artifactKind: valueState(undefined),
      sourceRunId: valueState(undefined),
      sizeBytes: valueState(undefined),
      maxPreviewBytes: valueState(undefined),
      previewAvailable: valueState(undefined),
      safeToRenderInline: valueState(undefined),
      truncated: valueState(undefined),
      truncationReason: valueState(undefined),
      downloadAvailable: valueState(undefined),
      inline: {
        state: 'missing',
        text: '',
        reason: 'preview uri 未暴露或不在受控 safe preview route 内'
      }
    };
  }

  if (result?.ok !== true) {
    const envelope = projectErrorEnvelope(result?.errorEnvelope);

    return {
      state: 'unavailable',
      route: valueState(artifact.uri),
      httpStatus: valueState(result?.httpStatus),
      contractName: valueState(envelope.contractName.value ?? SAFE_ARTIFACT_PREVIEW_CONTRACT_NAME),
      contractVersion: valueState(envelope.contractVersion.value),
      status: valueState(envelope.code.value),
      mime: valueState(undefined),
      displayTitle: valueState(undefined),
      artifactKind: valueState(undefined),
      sourceRunId: valueState(undefined),
      sizeBytes: valueState(undefined),
      maxPreviewBytes: valueState(undefined),
      previewAvailable: valueState(undefined),
      safeToRenderInline: valueState(undefined),
      truncated: valueState(undefined),
      truncationReason: valueState(undefined),
      downloadAvailable: valueState(undefined),
      inline: {
        state: 'unavailable',
        text: '',
        reason: envelope.message.value ?? result?.message ?? UNAVAILABLE_TEXT
      },
      errorEnvelope: envelope
    };
  }

  const preview = result.data;
  const inlineText = preview?.safeToRenderInline === true && typeof preview?.contentText === 'string'
    ? preview.contentText
    : preview?.safeToRenderInline === true && typeof preview?.previewText === 'string'
      ? preview.previewText
      : null;

  return {
    state: 'available',
    route: valueState(result.route),
    httpStatus: valueState(result.httpStatus),
    contractName: valueState(preview?.contractName),
    contractVersion: valueState(preview?.contractVersion),
    status: valueState(preview?.status ?? (preview?.previewAvailable === true ? 'preview-available' : 'not-previewable')),
    mime: valueState(preview?.mime),
    displayTitle: valueState(preview?.displayTitle),
    artifactKind: valueState(preview?.artifactKind),
    sourceRunId: valueState(preview?.sourceRunId),
    sizeBytes: valueState(preview?.sizeBytes),
    maxPreviewBytes: valueState(preview?.maxPreviewBytes),
    previewAvailable: valueState(preview?.previewAvailable),
    safeToRenderInline: valueState(preview?.safeToRenderInline),
    truncated: valueState(preview?.truncated),
    truncationReason: valueState(preview?.truncationReason),
    downloadAvailable: valueState(preview?.downloadAvailable),
    inline: inlineText === null
      ? {
          state: 'hidden',
          text: '',
          reason: preview?.safeToRenderInline === true
            ? '后端未提供 safe inline text'
            : '后端标记为不可 inline'
        }
      : {
          state: 'available',
          text: inlineText,
          reason: preview?.truncated === true ? '后端已截断 safe inline text' : '后端提供 safe inline text'
        }
  };
}

function projectGoals(goals) {
  const items = Array.isArray(goals?.goals) ? goals.goals : null;

  return {
    state: items === null ? 'missing' : items.length === 0 ? 'empty' : 'available',
    contractName: valueState(goals?.contractName),
    contractVersion: valueState(goals?.contractVersion),
    readOnly: valueState(goals?.readOnly),
    count: valueState(items === null ? undefined : items.length),
    items: items === null ? [] : items.map((goal) => ({
      goalId: valueState(goal?.goalId),
      goalTitle: valueState(goal?.goalTitle),
      baselineTag: valueState(goal?.baseline?.tag),
      taskCount: valueState(goal?.taskCount),
      readOnly: valueState(goal?.readOnly)
    }))
  };
}

function projectGoalProgress({ result, ledger }) {
  if (result?.ok !== true) {
    return {
      state: 'unavailable',
      contractName: valueState(GOAL_PROGRESS_LEDGER_CONTRACT_NAME),
      contractVersion: valueState(undefined),
      goalId: valueState(undefined),
      goalTitle: valueState(undefined),
      baselineTag: valueState(undefined),
      releaseReady: valueState(undefined),
      summary: projectGoalProgressSummary(undefined),
      tasks: {
        state: 'missing',
        count: valueState(undefined),
        items: []
      },
      releaseGates: [],
      blockers: [],
      nextActions: [],
      safety: projectGoalProgressSafety(undefined),
      errorEnvelope: projectErrorEnvelope(result?.errorEnvelope),
      note: 'Goal Progress panel 只展示后端 goal-progress-ledger.v1 字段；不可用时只显示 error-envelope.v1 的安全摘要。'
    };
  }

  const tasks = Array.isArray(ledger?.tasks) ? ledger.tasks : null;

  return {
    state: ledger === null || ledger === undefined ? 'missing' : 'available',
    contractName: valueState(ledger?.contractName),
    contractVersion: valueState(ledger?.contractVersion),
    goalId: valueState(ledger?.goalId),
    goalTitle: valueState(ledger?.goalTitle),
    baselineTag: valueState(ledger?.baseline?.tag),
    baselineCommit: valueState(ledger?.baseline?.commit),
    baselineEvidenceRef: valueState(ledger?.baseline?.evidenceRef),
    releaseReady: valueState(ledger?.summary?.releaseReady),
    summary: projectGoalProgressSummary(ledger?.summary),
    tasks: {
      state: tasks === null ? 'missing' : tasks.length === 0 ? 'empty' : 'available',
      count: valueState(tasks === null ? undefined : tasks.length),
      items: tasks === null ? [] : tasks.map((task) => ({
        taskId: valueState(task?.taskId),
        title: valueState(task?.title),
        status: valueState(task?.status),
        statusSource: valueState(task?.statusSource),
        branch: valueState(task?.branch),
        commit: valueState(task?.commit),
        workerEvidenceRef: valueState(task?.workerEvidenceRef),
        reviewEvidenceRef: valueState(task?.reviewEvidenceRef),
        reviewVerdict: valueState(task?.reviewVerdict),
        mainVerificationRef: valueState(task?.mainVerificationRef),
        blockers: projectBlockers(task?.blockers),
        nextCopyOnlyCommand: valueState(task?.nextCopyOnlyCommand)
      }))
    },
    releaseGates: Object.entries(ledger?.releaseGates ?? {}).map(([gate, status]) => ({
      gate: valueState(gate),
      status: valueState(status)
    })),
    blockers: projectBlockers(ledger?.blockers),
    nextActions: projectNextActions(ledger?.nextActions),
    safety: projectGoalProgressSafety(ledger?.safety),
    errorEnvelope: projectErrorEnvelope(null),
    note: 'Goal Progress panel 不根据 task id、branch、command 或文件名判断完成度；只展示后端 ledger status/statusSource/evidence refs。'
  };
}

function projectGoalProgressSummary(summary) {
  return {
    totalTasks: valueState(summary?.totalTasks),
    completedTasks: valueState(summary?.completedTasks),
    blockedTasks: valueState(summary?.blockedTasks),
    needsReviewTasks: valueState(summary?.needsReviewTasks),
    needsRevisionTasks: valueState(summary?.needsRevisionTasks),
    releaseReady: valueState(summary?.releaseReady)
  };
}

function projectGoalProgressSafety(safety) {
  return {
    readOnly: valueState(safety?.readOnly),
    copyOnly: valueState(safety?.copyOnly),
    browserExecutionAvailable: valueState(safety?.browserExecutionAvailable),
    modelInvocationAvailable: valueState(safety?.modelInvocationAvailable)
  };
}

function projectGoalEvents({ result, eventLog, ledger }) {
  if (result?.ok !== true) {
    return {
      state: 'unavailable',
      contractName: valueState(GOAL_EVENT_LOG_CONTRACT_NAME),
      contractVersion: valueState(undefined),
      goalId: valueState(undefined),
      goalTitle: valueState(undefined),
      baselineTag: valueState(undefined),
      baselineCommit: valueState(undefined),
      baselineEvidenceRef: valueState(undefined),
      log: projectGoalEventLogSummary(undefined),
      timeline: projectGoalEventTimeline(undefined),
      evidenceMatrix: projectGoalEvidenceMatrix({
        events: [],
        ledger
      }),
      errorEnvelope: projectErrorEnvelope(result?.errorEnvelope),
      note: 'Goal Events panels 只展示后端 goal-event-log.v1 与 goal-progress-ledger.v1 字段；不可用时不从 ledger 推断 event-backed 状态。'
    };
  }

  const events = Array.isArray(eventLog?.events) ? eventLog.events : null;

  return {
    state: eventLog === null || eventLog === undefined ? 'missing' : 'available',
    contractName: valueState(eventLog?.contractName),
    contractVersion: valueState(eventLog?.contractVersion),
    goalId: valueState(eventLog?.goalId),
    goalTitle: valueState(eventLog?.goalTitle),
    baselineTag: valueState(eventLog?.baseline?.tag),
    baselineCommit: valueState(eventLog?.baseline?.commit),
    baselineEvidenceRef: valueState(eventLog?.baseline?.evidenceRef),
    log: projectGoalEventLogSummary(eventLog?.log),
    timeline: projectGoalEventTimeline(events),
    evidenceMatrix: projectGoalEvidenceMatrix({
      events: events ?? [],
      ledger
    }),
    errorEnvelope: projectErrorEnvelope(null),
    note: 'Goal Events Timeline 与 Evidence Matrix 只展示 events API 和 ledger API 已暴露字段；evidence refs 不会触发正文读取、下载或本地打开。'
  };
}

function projectGoalEventLogSummary(log) {
  return {
    appendOnly: valueState(log?.appendOnly),
    storage: valueState(log?.storage),
    eventCount: valueState(log?.eventCount),
    firstSequence: valueState(log?.firstSequence),
    lastSequence: valueState(log?.lastSequence),
    lastEventId: valueState(log?.lastEventId),
    lastEventHash: valueState(log?.lastEventHash)
  };
}

function projectGoalEventTimeline(events) {
  if (!Array.isArray(events)) {
    return {
      state: 'missing',
      count: valueState(undefined),
      items: []
    };
  }

  return {
    state: events.length === 0 ? 'empty' : 'available',
    count: valueState(events.length),
    items: events.map((event, index) => projectGoalEventTimelineItem({
      event,
      previousEvent: index > 0 ? events[index - 1] : null
    }))
  };
}

function projectGoalEventTimelineItem({ event, previousEvent }) {
  return {
    sequence: valueState(event?.sequence),
    eventId: valueState(event?.eventId),
    eventType: valueState(event?.eventType),
    phase: valueState(event?.phase),
    taskId: valueState(event?.taskId),
    actor: valueState(goalEventActorText(event?.actor)),
    actorRole: valueState(event?.actor?.role),
    actorId: valueState(event?.actor?.id),
    recordedAt: valueState(event?.recordedAt),
    reviewVerdict: explicitReviewVerdictState(event),
    gateStatus: explicitGateStatusState(event),
    evidenceRefs: projectGoalEvidenceRefs(event?.evidenceRefs),
    previousEventHash: valueState(event?.previousEventHash),
    eventHash: valueState(event?.eventHash),
    hashChainStatus: matrixValueState(goalEventHashChainStatus({ event, previousEvent }))
  };
}

function projectGoalEvidenceMatrix({ events, ledger }) {
  const taskIds = goalEventMatrixTaskIds({ events, ledger });
  const releaseGateItems = projectGoalReleaseGateMatrix(events);
  const releaseReady = projectReleaseReadyState(events);

  return {
    state: taskIds.length === 0 && releaseGateItems.length === 0 && releaseReady.status.value === MATRIX_UNKNOWN_TEXT
      ? 'empty'
      : 'available',
    tasks: {
      state: taskIds.length === 0 ? 'empty' : 'available',
      count: valueState(taskIds.length),
      items: taskIds.map((taskId) => projectGoalEvidenceMatrixTask({
        taskId,
        events,
        ledgerTask: findLedgerTask(ledger, taskId),
        releaseGateCount: releaseGateItems.length
      }))
    },
    releaseGates: {
      state: releaseGateItems.length === 0 ? 'empty' : 'available',
      count: valueState(releaseGateItems.length),
      items: releaseGateItems
    },
    releaseReady
  };
}

function goalEventMatrixTaskIds({ events, ledger }) {
  const ids = [];

  if (Array.isArray(ledger?.tasks)) {
    for (const task of ledger.tasks) {
      if (isMatrixTaskId(task?.taskId) && !ids.includes(task.taskId)) {
        ids.push(task.taskId);
      }
    }
  }

  for (const event of events) {
    if (isMatrixTaskId(event?.taskId) && !ids.includes(event.taskId)) {
      ids.push(event.taskId);
    }
  }

  return ids;
}

function projectGoalEvidenceMatrixTask({
  taskId,
  events,
  ledgerTask,
  releaseGateCount
}) {
  const taskEvents = events.filter((event) => event?.taskId === taskId);
  const workerEvent = latestEventOfTypes(taskEvents, [
    'worker.evidence-recorded',
    'worker.self-check-passed',
    'worker.self-check-failed'
  ]);
  const reviewEvent = latestEventOfTypes(taskEvents, [
    'reviewer.approved',
    'reviewer.needs-revision'
  ]);
  const mainVerificationEvent = latestEventOfTypes(taskEvents, [
    'main.verification-passed',
    'main.verification-failed'
  ]);
  const blocker = latestOpenBlocker(taskEvents);

  return {
    taskId: valueState(taskId),
    title: valueState(ledgerTask?.title ?? taskId),
    ledgerStatus: valueState(ledgerTask?.status),
    workerEvidence: firstEvidenceRefDisplayState(workerEvent),
    reviewVerdict: reviewEvent === null ? matrixUnknownState() : explicitReviewVerdictState(reviewEvent),
    reviewEvidence: firstEvidenceRefDisplayState(reviewEvent),
    mainVerification: mainVerificationEvent === null
      ? matrixUnknownState()
      : mainVerificationDisplayState(mainVerificationEvent),
    blocker: blocker === null ? matrixMissingState() : matrixValueState(blocker),
    releaseGateCoverage: releaseGateCount > 0
      ? matrixValueState(`${releaseGateCount} explicit gate event${releaseGateCount === 1 ? '' : 's'}`)
      : matrixUnknownState()
  };
}

function projectGoalReleaseGateMatrix(events) {
  return events
    .filter((event) => event?.eventType === 'release.gate-passed' || event?.eventType === 'release.gate-failed')
    .map((event) => ({
      gate: valueState(goalGateId(event)),
      status: explicitGateStatusState(event),
      eventType: valueState(event?.eventType),
      evidenceRefs: projectGoalEvidenceRefs(event?.evidenceRefs)
    }));
}

function projectReleaseReadyState(events) {
  const readyEvent = latestEventOfTypes(events, ['release.ready-declared']);

  if (readyEvent === null) {
    return {
      status: matrixUnknownState(),
      eventId: matrixMissingState(),
      evidenceRefs: projectGoalEvidenceRefs(undefined)
    };
  }

  return {
    status: explicitGateStatusState(readyEvent),
    eventId: valueState(readyEvent?.eventId),
    evidenceRefs: projectGoalEvidenceRefs(readyEvent?.evidenceRefs)
  };
}

function projectGoalEvidenceRefs(evidenceRefs) {
  if (!Array.isArray(evidenceRefs)) {
    return {
      state: 'missing',
      count: valueState(undefined),
      items: []
    };
  }

  return {
    state: evidenceRefs.length === 0 ? 'empty' : 'available',
    count: valueState(evidenceRefs.length),
    items: evidenceRefs.map((ref) => ({
      kind: valueState(ref?.kind),
      ref: valueState(ref?.ref),
      label: valueState(ref?.label)
    }))
  };
}

function firstEvidenceRefDisplayState(event) {
  if (event === null || event === undefined) {
    return matrixMissingState();
  }

  const ref = firstGoalEvidenceRef(event);

  return ref === null ? matrixMissingState() : valueState(ref);
}

function mainVerificationDisplayState(event) {
  const ref = firstGoalEvidenceRef(event);

  if (ref !== null) {
    return valueState(ref);
  }

  if (event?.eventType === 'main.verification-passed') {
    return matrixValueState('passed');
  }

  if (event?.eventType === 'main.verification-failed') {
    return matrixValueState('failed');
  }

  return matrixUnknownState();
}

function explicitReviewVerdictState(event) {
  if (event?.review?.verdict === 'APPROVED' || event?.review?.verdict === 'NEEDS_REVISION') {
    return valueState(event.review.verdict);
  }

  if (event?.eventType === 'reviewer.approved') {
    return matrixValueState('APPROVED');
  }

  if (event?.eventType === 'reviewer.needs-revision') {
    return matrixValueState('NEEDS_REVISION');
  }

  return matrixUnknownState();
}

function explicitGateStatusState(event) {
  if (event?.gate?.status === 'passed' || event?.gate?.status === 'failed' || event?.gate?.status === 'declared') {
    return valueState(event.gate.status);
  }

  if (event?.eventType === 'release.gate-passed') {
    return matrixValueState('passed');
  }

  if (event?.eventType === 'release.gate-failed') {
    return matrixValueState('failed');
  }

  if (event?.eventType === 'release.ready-declared') {
    return matrixValueState('declared');
  }

  return matrixUnknownState();
}

function latestOpenBlocker(events) {
  const openBlockers = new Map();

  for (const event of events) {
    if (event?.eventType !== 'blocker.opened' && event?.eventType !== 'reviewer.blocked' && event?.eventType !== 'blocker.resolved') {
      continue;
    }

    const id = goalBlockerId(event);

    if (event.eventType === 'blocker.resolved') {
      openBlockers.delete(id);
      continue;
    }

    openBlockers.set(id, goalBlockerText(event));
  }

  return [...openBlockers.values()].at(-1) ?? null;
}

function goalBlockerId(event) {
  return isNonEmptyString(event?.blocker?.id) ? event.blocker.id : event?.eventId ?? 'unknown-blocker';
}

function goalBlockerText(event) {
  if (isNonEmptyString(event?.blocker?.reason)) {
    return event.blocker.reason;
  }

  if (isNonEmptyString(event?.statement)) {
    return event.statement;
  }

  return MATRIX_UNKNOWN_TEXT;
}

function latestEventOfTypes(events, eventTypes) {
  if (!Array.isArray(events)) {
    return null;
  }

  for (let index = events.length - 1; index >= 0; index -= 1) {
    if (eventTypes.includes(events[index]?.eventType)) {
      return events[index];
    }
  }

  return null;
}

function findLedgerTask(ledger, taskId) {
  if (!Array.isArray(ledger?.tasks)) {
    return null;
  }

  return ledger.tasks.find((task) => task?.taskId === taskId) ?? null;
}

function firstGoalEvidenceRef(event) {
  if (!Array.isArray(event?.evidenceRefs)) {
    return null;
  }

  const evidenceRef = event.evidenceRefs.find((entry) => isNonEmptyString(entry?.ref));

  return evidenceRef?.ref ?? null;
}

function goalEventActorText(actor) {
  if (!isNonEmptyString(actor?.role) && !isNonEmptyString(actor?.id)) {
    return null;
  }

  return `${actor?.role ?? MATRIX_UNKNOWN_TEXT}:${actor?.id ?? MATRIX_UNKNOWN_TEXT}`;
}

function goalGateId(event) {
  return event?.gate?.id ?? event?.gate?.name ?? MATRIX_UNKNOWN_TEXT;
}

function goalEventHashChainStatus({ event, previousEvent }) {
  if (!isNonEmptyString(event?.eventHash)) {
    return MATRIX_UNKNOWN_TEXT;
  }

  if (previousEvent === null) {
    return event?.previousEventHash === null ? 'genesis' : MATRIX_UNKNOWN_TEXT;
  }

  return event?.previousEventHash === previousEvent?.eventHash ? 'linked' : MATRIX_UNKNOWN_TEXT;
}

function isMatrixTaskId(value) {
  return isNonEmptyString(value) && value !== 'release';
}

function matrixMissingState() {
  return {
    state: 'missing',
    text: MATRIX_MISSING_TEXT,
    value: MATRIX_MISSING_TEXT
  };
}

function matrixUnknownState() {
  return {
    state: 'unknown',
    text: MATRIX_UNKNOWN_TEXT,
    value: MATRIX_UNKNOWN_TEXT
  };
}

function matrixValueState(value) {
  if (value === undefined || value === null || value === '') {
    return matrixMissingState();
  }

  return {
    state: 'available',
    text: String(value),
    value
  };
}

function projectCapabilities(capabilities) {
  return {
    state: capabilities === null || capabilities === undefined ? 'missing' : 'available',
    contractName: valueState(capabilities?.contractName),
    contractVersion: valueState(capabilities?.contractVersion),
    readOnly: valueState(capabilities?.readOnly),
    displayOnly: valueState(capabilities?.displayOnly),
    copyOnly: valueState(capabilities?.copyOnly),
    mutationAvailable: valueState(capabilities?.mutationAvailable),
    browserExecutionAvailable: valueState(capabilities?.browserExecutionAvailable),
    modelInvocationAvailable: valueState(capabilities?.modelInvocationAvailable),
    artifactDownloadAvailable: valueState(capabilities?.artifactDownloadAvailable),
    safePreview: {
      available: valueState(capabilities?.safePreview?.available),
      inlineModes: arrayTextState(capabilities?.safePreview?.inlineModes),
      rawHtmlInlineAvailable: valueState(capabilities?.safePreview?.rawHtmlInlineAvailable),
      svgInlineAvailable: valueState(capabilities?.safePreview?.svgInlineAvailable),
      javascriptInlineAvailable: valueState(capabilities?.safePreview?.javascriptInlineAvailable),
      binaryInlineAvailable: valueState(capabilities?.safePreview?.binaryInlineAvailable)
    },
    routes: Object.entries(capabilities?.routes ?? {}).map(([route, available]) => ({
      route: valueState(route),
      available: valueState(available)
    })),
    note: 'Capabilities panel 只展示后端 capabilities.v1，不把 capability 字段转换成写入、执行或下载入口。'
  };
}

function projectDiagnostics(diagnostics) {
  return {
    state: diagnostics === null || diagnostics === undefined ? 'missing' : 'available',
    contractName: valueState(diagnostics?.contractName),
    contractVersion: valueState(diagnostics?.contractVersion),
    status: valueState(diagnostics?.status),
    checks: projectDiagnosticChecks(diagnostics?.checks),
    boundaries: Object.entries(diagnostics?.boundaries ?? {}).map(([boundary, available]) => ({
      boundary: valueState(boundary),
      available: valueState(available)
    })),
    note: 'Diagnostics panel 只展示 diagnostics.v1 的安全健康字段；浏览器端不会运行 shell、测试、audit、mutation 或模型调用。'
  };
}

function projectDiagnosticChecks(checks) {
  if (!Array.isArray(checks)) {
    return {
      state: 'missing',
      count: valueState(undefined),
      items: []
    };
  }

  return {
    state: checks.length === 0 ? 'empty' : 'available',
    count: valueState(checks.length),
    items: checks.map((check) => ({
      id: valueState(check?.id),
      label: valueState(check?.label),
      status: valueState(check?.status),
      severity: valueState(check?.severity)
    }))
  };
}

function projectBlockers(blockers) {
  if (!Array.isArray(blockers)) {
    return [];
  }

  return blockers.map((blocker) => ({
    id: valueState(blocker?.id),
    taskId: valueState(blocker?.taskId),
    reason: valueState(blocker?.reason),
    severity: valueState(blocker?.severity)
  }));
}

function projectNextActions(nextActions) {
  if (!Array.isArray(nextActions)) {
    return [];
  }

  return nextActions.map((action) => ({
    kind: valueState(action?.kind),
    label: valueState(action?.label),
    command: valueState(action?.command)
  }));
}

function projectErrorEnvelope(envelope) {
  const error = envelope?.error;

  return {
    state: envelope?.contractName === ERROR_ENVELOPE_CONTRACT_NAME ? 'available' : 'missing',
    contractName: valueState(envelope?.contractName),
    contractVersion: valueState(envelope?.contractVersion),
    code: valueState(error?.code),
    message: valueState(error?.message),
    status: valueState(error?.status),
    route: valueState(error?.route),
    method: valueState(error?.method)
  };
}

function projectRouteState(route, result) {
  if (result?.skipped === true) {
    return {
      id: route.id,
      label: route.label,
      path: route.path,
      method: route.method,
      state: 'skipped',
      contractName: valueState(route.contractName),
      contractVersion: valueState(undefined),
      error: result.message ?? '暂无 timeline / 未暴露 / 不可用',
      httpStatus: null
    };
  }

  if (result?.ok === true) {
    return {
      id: route.id,
      label: route.label,
      path: route.path,
      method: route.method,
      state: 'ready',
      contractName: valueState(result.data?.contractName),
      contractVersion: valueState(result.data?.contractVersion)
    };
  }

  return {
    id: route.id,
    label: route.label,
    path: route.path,
    method: route.method,
    state: 'failed',
    contractName: valueState(route.contractName),
    contractVersion: valueState(undefined),
    error: result?.message ?? '读取失败 / contract 未暴露 / 不可用',
    httpStatus: result?.httpStatus ?? null
  };
}

function projectSummary(summary) {
  const latestRun = summary?.latestRun ?? summary?.overview?.latestRun ?? null;
  const adoptionSummary = summary?.adoptionSummary;

  return {
    contractName: valueState(summary?.contractName),
    contractVersion: valueState(summary?.contractVersion),
    status: valueState(summary?.status),
    generatedAt: valueState(summary?.generatedAt),
    readOnly: valueState(summary?.readOnly),
    modelInvocation: valueState(summary?.modelInvocation),
    overviewStatus: valueState(summary?.overview?.status),
    headline: valueState(summary?.overview?.headline),
    stageId: valueState(summary?.stageSummary?.stageId ?? summary?.overview?.stage?.stageId),
    stageStatus: valueState(summary?.stageSummary?.status ?? summary?.overview?.stage?.status),
    nextAction: valueState(summary?.overview?.nextAction ?? summary?.action?.next),
    runCount: valueState(summary?.runStats?.total),
    latestRunId: valueState(latestRun?.runId ?? summary?.overview?.latestRunId),
    latestRun: {
      runId: valueState(latestRun?.runId ?? summary?.overview?.latestRunId),
      status: valueState(latestRun?.status),
      verifierStatus: valueState(latestRun?.verifierStatus),
      updatedAt: valueState(latestRun?.updatedAt)
    },
    adoptionSummary: {
      status: valueState(adoptionSummary?.status),
      pendingCount: valueState(adoptionSummary?.pendingCount),
      dirtyBlocked: valueState(adoptionSummary?.dirtyBlocked)
    },
    capabilities: objectState(summary?.capabilities),
    riskSummary: projectRiskSummary(summary?.riskSummary),
    readonlyNote: 'Summary panel 只展示 /api/summary 已暴露字段；readOnly、modelInvocation 与 capabilities 缺失时不由 React 端补值。',
    raw: summary ?? null
  };
}

function projectReadiness(readiness, summary) {
  return {
    contractName: valueState(readiness?.contractName),
    contractVersion: valueState(readiness?.contractVersion),
    status: valueState(readiness?.status),
    attention: readiness?.status === undefined ? null : readiness.status !== 'ready',
    readOnly: valueState(readiness?.readOnly),
    modelInvocation: valueState(readiness?.modelInvocation),
    capabilities: objectState(readiness?.capabilities),
    gitDirty: valueState(readiness?.tools?.git?.dirty),
    dirtyFilesCount: valueState(readiness?.tools?.git?.dirtyFilesCount),
    dirtyPaths: Array.isArray(readiness?.tools?.git?.dirtyPaths)
      ? readiness.tools.git.dirtyPaths.map((path) => valueState(path))
      : [],
    packageManagerStatus: valueState(readiness?.tools?.packageManager?.status),
    checks: projectChecks(readiness?.checks),
    diagnostics: projectRiskSummary(readiness?.riskSummary),
    signals: projectReadonlySignals(summary),
    readonlyNote: 'Readiness panel 只展示 checks、riskSummary 与 Git readiness 字段；attention 不会转换成浏览器操作入口。',
    raw: readiness ?? null
  };
}

function projectRuns(runs, summary) {
  const routeRuns = Array.isArray(runs?.runs) ? runs.runs : null;
  const latestRunId = summary?.latestRun?.runId ?? summary?.overview?.latestRunId;

  return {
    state: routeRuns === null ? 'missing' : routeRuns.length === 0 ? 'empty' : 'available',
    contractName: valueState(runs?.contractName),
    contractVersion: valueState(runs?.contractVersion),
    count: valueState(routeRuns === null ? undefined : routeRuns.length),
    summaryCount: valueState(summary?.runStats?.total),
    filter: valueState(runs?.filter),
    availableFilters: Array.isArray(runs?.availableFilters) ? [...runs.availableFilters] : [],
    items: routeRuns === null ? [] : routeRuns.map((run) => projectRunListItem(run, latestRunId)),
    raw: runs ?? null
  };
}

function projectLatestRun({ result, run, hasNoRuns, safeArtifactPreviewResults = [] }) {
  if (hasNoRuns || result?.httpStatus === 404) {
    return {
      state: 'empty',
      runId: valueState(undefined),
      status: valueState('无运行记录'),
      verifierStatus: valueState(undefined),
      modelInvocation: valueState(undefined),
      executionPlanId: valueState(undefined),
      adoptionPlanId: valueState(undefined),
      createdAt: valueState(undefined),
      updatedAt: valueState(undefined),
      timeline: {
        state: 'empty',
        text: NOT_APPLICABLE_TEXT,
        count: 0
      },
      artifactRefsCount: valueState(0),
      artifactStatus: projectArtifactStatus(undefined),
      artifactRefs: projectArtifactRefs([], undefined),
      raw: null
    };
  }

  if (result?.ok !== true) {
    return {
      state: 'unavailable',
      runId: valueState(undefined),
      status: valueState(undefined),
      verifierStatus: valueState(undefined),
      modelInvocation: valueState(undefined),
      executionPlanId: valueState(undefined),
      adoptionPlanId: valueState(undefined),
      createdAt: valueState(undefined),
      updatedAt: valueState(undefined),
      timeline: projectTimelineAvailability(undefined),
      artifactRefsCount: valueState(undefined),
      artifactStatus: projectArtifactStatus(undefined),
      artifactRefs: projectArtifactRefs(undefined, undefined),
      error: result?.message ?? UNAVAILABLE_TEXT,
      raw: null
    };
  }

  return {
    state: run === null || run === undefined ? 'missing' : 'available',
    runId: valueState(run?.runId),
    status: valueState(run?.status),
    verifierStatus: valueState(run?.verifierStatus),
    modelInvocation: valueState(run?.modelInvocation),
    executionPlanId: valueState(run?.executionPlanId),
    adoptionPlanId: valueState(run?.adoptionPlanId),
    createdAt: valueState(run?.createdAt),
    updatedAt: valueState(run?.updatedAt),
    timeline: projectTimelineAvailability(run?.timeline),
    artifactRefsCount: valueState(Array.isArray(run?.artifactRefs) ? run.artifactRefs.length : undefined),
    artifactStatus: projectArtifactStatus(run?.artifactStatus),
    artifactRefs: projectArtifactRefs(run?.artifactRefs, run?.artifactStatus, safeArtifactPreviewResults),
    raw: run ?? null
  };
}

function projectLatestRunTimeline({ result, latestRun }) {
  if (latestRun.state === 'empty') {
    return {
      state: 'empty',
      contractName: valueState(undefined),
      contractVersion: valueState(undefined),
      runId: valueState(undefined),
      count: valueState(0),
      items: [],
      note: '暂无 timeline；当前没有 latest run。'
    };
  }

  if (result?.skipped === true) {
    return {
      state: 'empty',
      contractName: valueState(RUN_TIMELINE_ROUTE_TEMPLATE.contractName),
      contractVersion: valueState(undefined),
      runId: latestRun.runId,
      count: valueState(0),
      items: [],
      note: '暂无 timeline / 未暴露 / 不可用。'
    };
  }

  if (result?.ok !== true) {
    return {
      state: 'unavailable',
      contractName: valueState(RUN_TIMELINE_ROUTE_TEMPLATE.contractName),
      contractVersion: valueState(undefined),
      runId: latestRun.runId,
      count: valueState(undefined),
      items: [],
      error: result?.message ?? UNAVAILABLE_TEXT,
      note: 'timeline route 未暴露或不可用；前端不从其他字段伪造 timeline。'
    };
  }

  const timeline = Array.isArray(result.data?.timeline) ? result.data.timeline : null;

  if (timeline === null) {
    return {
      state: 'missing',
      contractName: valueState(result.data?.contractName),
      contractVersion: valueState(result.data?.contractVersion),
      runId: valueState(result.data?.runId),
      count: valueState(undefined),
      items: [],
      note: 'timeline 字段未暴露。'
    };
  }

  return {
    state: timeline.length === 0 ? 'empty' : 'available',
    contractName: valueState(result.data?.contractName),
    contractVersion: valueState(result.data?.contractVersion),
    runId: valueState(result.data?.runId),
    count: valueState(timeline.length),
    items: timeline.map((event) => ({
      id: valueState(event?.id),
      label: valueState(event?.label),
      status: valueState(event?.status),
      detail: valueState(event?.detail),
      at: valueState(event?.at)
    })),
    note: 'Timeline panel 只展示 /api/runs/<run-id>/timeline 已暴露的只读事件字段。'
  };
}

function projectAdoption({ summary, readiness }) {
  const adoptionSummary = summary?.adoptionSummary;

  return {
    status: valueState(adoptionSummary?.status),
    pendingCount: valueState(adoptionSummary?.pendingCount),
    dirtyBlocked: valueState(adoptionSummary?.dirtyBlocked),
    gitDirtyReadiness: valueState(readiness?.tools?.git?.dirty),
    note: 'dirty adoption 不由 React 端合成，只展示 API 已暴露的 adoption summary 与 Git readiness 字段。'
  };
}

function projectGuidedGoalHandoff({ indexResult, handoffResult, handoffIndex, handoff }) {
  const roles = Array.isArray(handoff?.roles) ? handoff.roles : null;
  const tasks = Array.isArray(handoff?.tasks) ? handoff.tasks : null;
  const commandBlocks = projectHandoffCommandBlocks(handoff?.commands);

  return {
    state: projectHandoffState({ indexResult, handoffResult, handoff }),
    refs: projectHandoffRefs(handoffIndex),
    contractName: valueState(handoff?.contractName),
    contractVersion: valueState(handoff?.contractVersion),
    goalId: valueState(handoff?.goalId),
    title: valueState(handoff?.title),
    titleZh: valueState(handoff?.titleZh),
    baselineReleaseTag: valueState(handoff?.baseline?.releaseTag),
    baselineApprovalCommit: valueState(handoff?.baseline?.approvalCommit),
    taskCount: valueState(tasks === null ? undefined : tasks.length),
    roleCount: valueState(roles === null ? undefined : roles.length),
    commandBlockCount: valueState(commandBlocks.count),
    reviewContextIsolation: valueState(handoff?.reviewModel?.contextIsolation),
    workerSelfCheckIsFinal: valueState(handoff?.reviewModel?.workerSelfCheckIsFinal),
    roles: roles === null ? {
      state: 'missing',
      items: []
    } : {
      state: roles.length === 0 ? 'empty' : 'available',
      items: roles.map((role) => ({
        id: valueState(role?.id),
        description: valueState(role?.description),
        inputs: arrayTextState(role?.inputs),
        outputs: arrayTextState(role?.outputs),
        prohibited: arrayTextState(role?.prohibited)
      }))
    },
    tasks: tasks === null ? {
      state: 'missing',
      items: []
    } : {
      state: tasks.length === 0 ? 'empty' : 'available',
      items: tasks.map((task) => ({
        id: valueState(task?.id),
        name: valueState(task?.name),
        titleZh: valueState(task?.titleZh),
        phase: valueState(task?.phase),
        status: valueState(task?.status),
        role: valueState(task?.role),
        dependsOn: arrayTextState(task?.dependsOn),
        evidencePath: valueState(task?.evidencePath),
        reviewGate: valueState(task?.reviewGate)
      }))
    },
    commandBlocks,
    note: 'Handoff panel 只展示 /api/handoff 注册 ref 与 guided-goal-handoff.v1 contract 字段；task phase/status 缺失时保持未暴露，不由浏览器端推断。',
    error: handoffResult?.ok === true ? null : handoffResult?.message ?? null
  };
}

function projectHandoffState({ indexResult, handoffResult, handoff }) {
  if (indexResult?.ok !== true) {
    return 'unavailable';
  }

  if (handoffResult?.skipped === true) {
    return 'missing';
  }

  if (handoffResult?.ok !== true) {
    return 'unavailable';
  }

  if (handoff === null || handoff === undefined) {
    return 'missing';
  }

  return 'available';
}

function projectHandoffRefs(handoffIndex) {
  const refs = Array.isArray(handoffIndex?.refs) ? handoffIndex.refs : null;

  return {
    state: refs === null ? 'missing' : refs.length === 0 ? 'empty' : 'available',
    contractName: valueState(handoffIndex?.contractName),
    contractVersion: valueState(handoffIndex?.contractVersion),
    readOnly: valueState(handoffIndex?.readOnly),
    arbitraryPathReads: valueState(handoffIndex?.arbitraryPathReads),
    count: valueState(refs === null ? undefined : refs.length),
    items: refs === null ? [] : refs.map((ref) => ({
      ref: valueState(ref?.ref),
      contractName: valueState(ref?.contractName),
      contractVersion: valueState(ref?.contractVersion),
      href: valueState(ref?.href)
    }))
  };
}

function projectHandoffCommandBlocks(commands) {
  const blocks = Array.isArray(commands?.blocks) ? commands.blocks : null;

  return {
    state: blocks === null ? 'missing' : blocks.length === 0 ? 'empty' : 'available',
    copyOnly: valueState(commands?.copyOnly),
    count: blocks === null ? null : blocks.length,
    items: blocks === null ? [] : blocks.map((block) => ({
      id: valueState(block?.id),
      title: valueState(block?.title),
      copyOnly: valueState(block?.copyOnly),
      commands: Array.isArray(block?.commands)
        ? block.commands.map((command) => valueState(command))
        : []
    }))
  };
}

function projectRunListItem(run, latestRunId) {
  return {
    runId: valueState(run?.runId),
    status: valueState(run?.status),
    verifierStatus: valueState(run?.verifierStatus),
    intent: valueState(run?.intent),
    command: valueState(run?.command),
    semanticCommand: valueState(run?.semanticCommand),
    routeKey: valueState(run?.routeDecision?.routeKey),
    routeDecisionIntent: valueState(run?.routeDecision?.intent),
    routeDecisionReason: valueState(run?.routeDecision?.reason),
    createdAt: valueState(run?.createdAt),
    updatedAt: valueState(run?.updatedAt),
    artifactRefs: projectArtifactRefs(run?.artifactRefs, run?.artifactStatus),
    isLatest: valueState(Boolean(latestRunId && run?.runId === latestRunId))
  };
}

function projectArtifactStatus(artifactStatus) {
  if (artifactStatus === undefined || artifactStatus === null || typeof artifactStatus !== 'object') {
    return {
      state: 'missing',
      status: valueState(undefined),
      total: valueState(undefined),
      available: valueState(undefined),
      missing: valueState(undefined),
      unknown: valueState(undefined),
      missingKinds: textState(MISSING_TEXT)
    };
  }

  return {
    state: 'available',
    status: valueState(artifactStatus.status),
    total: valueState(artifactStatus.total),
    available: valueState(artifactStatus.available),
    missing: valueState(artifactStatus.missing),
    unknown: valueState(artifactStatus.unknown),
    missingKinds: textState(Array.isArray(artifactStatus.missingKinds) && artifactStatus.missingKinds.length > 0
      ? artifactStatus.missingKinds.join('、')
      : '无')
  };
}

function projectArtifactRefStatus({ artifact, artifactStatus }) {
  if (hasOwn(artifact, 'status')) {
    return artifact.status;
  }

  const missingRefs = Array.isArray(artifactStatus?.missingRefs) ? artifactStatus.missingRefs : [];
  const isMissing = missingRefs.some((missingRef) => (
    missingRef?.kind === artifact?.kind && missingRef?.path === artifact?.path
  ));

  if (isMissing) {
    return 'missing';
  }

  if (artifactStatus?.status === 'ok') {
    return 'available';
  }

  if (artifactStatus?.status === 'missing' && missingRefs.length > 0 && Number(artifactStatus?.unknown ?? 0) === 0) {
    return 'available';
  }

  if (artifactStatus?.status === 'unknown') {
    return UNAVAILABLE_TEXT;
  }

  return MISSING_TEXT;
}

function projectChecks(checks) {
  if (!Array.isArray(checks)) {
    return {
      state: 'missing',
      count: null,
      items: []
    };
  }

  return {
    state: checks.length === 0 ? 'empty' : 'available',
    count: checks.length,
    items: checks.map((check) => ({
      id: valueState(check?.id),
      label: valueState(check?.label),
      status: valueState(check?.status),
      detail: valueState(check?.detail)
    }))
  };
}

function projectRiskSummary(riskSummary) {
  if (riskSummary === undefined || riskSummary === null) {
    return {
      state: 'missing',
      status: valueState(undefined),
      total: valueState(undefined),
      items: []
    };
  }

  const items = Array.isArray(riskSummary.items) ? riskSummary.items : [];

  return {
    state: items.length === 0 ? 'empty' : 'available',
    status: valueState(riskSummary.status),
    total: valueState(riskSummary.total),
    items: items.map((item) => ({
      id: valueState(item?.id),
      category: valueState(item?.category),
      severity: valueState(item?.severity),
      title: valueState(item?.title),
      detail: valueState(item?.detail),
      runId: valueState(item?.runId)
    }))
  };
}

function projectReadonlySignals(summary) {
  const stageSummary = summary?.stageSummary;
  const artifactStats = summary?.runStats?.artifacts;

  return {
    stageStatus: valueState(stageSummary?.status),
    stageBlockerStatus: valueState(stageSummary?.blocker?.status ?? stageSummary?.blocker?.kind),
    stageBlockerTitle: valueState(stageSummary?.blocker?.title ?? stageSummary?.blocker?.message),
    charterConsistencyStatus: valueState(stageSummary?.consistency?.status),
    artifactStatus: valueState(artifactStats?.status),
    missingArtifactCount: valueState(artifactStats?.missing),
    note: 'Missing artifact、blocked Stage 与 Charter mismatch 只按 summary contract 已暴露字段呈现；React 端不推断原因或修复动作。'
  };
}

function projectTimelineAvailability(timeline) {
  if (!Array.isArray(timeline)) {
    return {
      state: 'missing',
      text: MISSING_TEXT,
      count: null
    };
  }

  return {
    state: timeline.length === 0 ? 'empty' : 'available',
    text: timeline.length === 0 ? '空 timeline' : `${timeline.length} 个事件`,
    count: timeline.length
  };
}

function dataFrom(result) {
  return result?.ok === true ? result.data : null;
}

function findSafeArtifactPreviewResult({ artifact, results }) {
  const uri = artifact?.uri;

  if (!isNonEmptyString(uri)) {
    return null;
  }

  return results.find((result) => result?.route === uri || result?.routeDescriptor?.path === uri) ?? null;
}

function isSafeArtifactPreviewRoutePath(value) {
  return isNonEmptyString(value) &&
    value.startsWith(`${RUN_API_BASE}/`) &&
    value.includes('/artifacts/') &&
    value.endsWith('/preview') &&
    !value.includes('?') &&
    !value.includes('#') &&
    !value.includes('\\') &&
    !value.includes('..');
}

function objectState(value) {
  if (value === undefined || value === null || typeof value !== 'object' || Array.isArray(value)) {
    return {
      state: 'missing',
      text: MISSING_TEXT,
      value: null
    };
  }

  return {
    state: 'available',
    text: '已暴露',
    value
  };
}

function valueState(value) {
  if (value === undefined || value === null || value === '') {
    return {
      state: 'missing',
      text: MISSING_TEXT,
      value: null
    };
  }

  return {
    state: 'available',
    text: String(value),
    value
  };
}

function textState(text) {
  return {
    state: text === MISSING_TEXT ? 'missing' : 'available',
    text,
    value: text
  };
}

function arrayTextState(values, emptyText = '无') {
  if (!Array.isArray(values)) {
    return textState(MISSING_TEXT);
  }

  return textState(values.length > 0 ? values.join('、') : emptyText);
}

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function hasOwn(value, key) {
  return value !== null && typeof value === 'object' && Object.hasOwn(value, key);
}

function unique(values) {
  return [...new Set(values)];
}

export const CONTRACT_TEXT = Object.freeze({
  missing: MISSING_TEXT,
  unavailable: UNAVAILABLE_TEXT,
  notApplicable: NOT_APPLICABLE_TEXT
});
