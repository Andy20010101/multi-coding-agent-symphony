const MISSING_TEXT = '未暴露';
const UNAVAILABLE_TEXT = '不可用';
const NOT_APPLICABLE_TEXT = '不适用';
const HANDOFF_API_BASE = '/api/handoff';
const GUIDED_GOAL_HANDOFF_CONTRACT_NAME = 'guided-goal-handoff.v1';
const SAFE_ARTIFACT_PREVIEW_CONTRACT_NAME = 'safe-artifact-preview.v1';
const GOAL_PROGRESS_LEDGER_CONTRACT_NAME = 'goal-progress-ledger.v1';
const GOAL_EVENT_LOG_CONTRACT_NAME = 'goal-event-log.v1';
const GOAL_RUNBOOK_CONTRACT_NAME = 'goal-runbook.v1';
const GOAL_NEXT_ACTION_CONTRACT_NAME = 'goal-next-action.v1';
const GOAL_PROMPT_PACK_CONTRACT_NAME = 'goal-prompt-pack.v1';
const GOAL_CLOSEOUT_REPORT_CONTRACT_NAME = 'goal-closeout-report.v1';
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
    id: 'goalRunbook',
    label: 'Goal Runbook',
    path: '/api/goals/latest/runbook',
    method: 'GET',
    contractName: GOAL_RUNBOOK_CONTRACT_NAME,
    acceptErrorContract: true
  }),
  Object.freeze({
    id: 'goalNextAction',
    label: 'Goal Next Action',
    path: '/api/goals/latest/next',
    method: 'GET',
    contractName: GOAL_NEXT_ACTION_CONTRACT_NAME
  }),
  Object.freeze({
    id: 'goalPromptPack',
    label: 'Goal Prompt Pack',
    path: '/api/goals/latest/prompt',
    method: 'GET',
    contractName: GOAL_PROMPT_PACK_CONTRACT_NAME,
    acceptErrorContract: true
  }),
  Object.freeze({
    id: 'goalCloseout',
    label: 'Goal Closeout',
    path: '/api/goals/latest/closeout',
    method: 'GET',
    contractName: GOAL_CLOSEOUT_REPORT_CONTRACT_NAME,
    acceptErrorContract: true
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

export const GOAL_RUNBOOK_ROUTE_TEMPLATE = Object.freeze({
  id: 'goalRunbookById',
  label: 'Goal Runbook By Id',
  path: '/api/goals/<goal-id>/runbook',
  method: 'GET',
  contractName: GOAL_RUNBOOK_CONTRACT_NAME,
  acceptErrorContract: true
});

export const GOAL_NEXT_ACTION_ROUTE_TEMPLATE = Object.freeze({
  id: 'goalNextActionById',
  label: 'Goal Next Action By Id',
  path: '/api/goals/<goal-id>/next',
  method: 'GET',
  contractName: GOAL_NEXT_ACTION_CONTRACT_NAME,
  acceptErrorContract: true
});

export const GOAL_PROMPT_PACK_ROUTE_TEMPLATE = Object.freeze({
  id: 'goalPromptPackById',
  label: 'Goal Prompt Pack By Id',
  path: '/api/goals/<goal-id>/prompt',
  method: 'GET',
  contractName: GOAL_PROMPT_PACK_CONTRACT_NAME,
  acceptErrorContract: true
});

export const GOAL_CLOSEOUT_ROUTE_TEMPLATE = Object.freeze({
  id: 'goalCloseoutById',
  label: 'Goal Closeout By Id',
  path: '/api/goals/<goal-id>/closeout',
  method: 'GET',
  contractName: GOAL_CLOSEOUT_REPORT_CONTRACT_NAME,
  acceptErrorContract: true
});

export const READONLY_API_ROUTE_ALLOWLIST = Object.freeze([
  ...READONLY_API_ROUTES,
  GOAL_EVENTS_ROUTE_TEMPLATE,
  GOAL_PROGRESS_ROUTE_TEMPLATE,
  GOAL_RUNBOOK_ROUTE_TEMPLATE,
  GOAL_NEXT_ACTION_ROUTE_TEMPLATE,
  GOAL_PROMPT_PACK_ROUTE_TEMPLATE,
  GOAL_CLOSEOUT_ROUTE_TEMPLATE,
  GUIDED_GOAL_HANDOFF_ROUTE_TEMPLATE,
  RUN_TIMELINE_ROUTE_TEMPLATE,
  SAFE_ARTIFACT_PREVIEW_ROUTE_TEMPLATE
]);

export const READONLY_API_ROUTE_IDS = Object.freeze(
  READONLY_API_ROUTE_ALLOWLIST.map((route) => route.id)
);

const RUN_API_BASE = ['', 'api', 'runs'].join('/');
const TIMELINE_SEGMENT = 'timeline';
const OPTIONAL_ROUTE_IDS = new Set([
  'latestRun',
  'latestRunTimeline',
  'goalRunbook',
  'goalNextAction',
  'goalPromptPack',
  'goalCloseout',
  'activeGoalProgress',
  'activeGoalEvents'
]);

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
  const goalRunbookData = dataFrom(results.goalRunbook);
  const goalNextActionData = dataFrom(results.goalNextAction);
  const goalPromptPackData = dataFrom(results.goalPromptPack);
  const goalCloseoutData = dataFrom(results.goalCloseout);
  const activeGoalProgressData = dataFrom(results.activeGoalProgress);
  const activeGoalEventsData = dataFrom(results.activeGoalEvents);
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
    projectRouteState(
      results.activeGoalProgress?.routeDescriptor ?? GOAL_PROGRESS_ROUTE_TEMPLATE,
      results.activeGoalProgress
    ),
    projectRouteState(
      results.activeGoalEvents?.routeDescriptor ?? GOAL_EVENTS_ROUTE_TEMPLATE,
      results.activeGoalEvents
    ),
    ...safeArtifactPreviewResults.map((result) => projectRouteState(
      result?.routeDescriptor ?? SAFE_ARTIFACT_PREVIEW_ROUTE_TEMPLATE,
      result
    ))
  ];
  const failedRequiredRoutes = routeStates.filter((route) => (
    route.state === 'failed' && !OPTIONAL_ROUTE_IDS.has(route.id)
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
    activeGoal: projectActiveGoalControl({
      runbookResult: results.goalRunbook,
      runbook: goalRunbookData,
      nextActionResult: results.goalNextAction,
      nextAction: goalNextActionData,
      promptPackResult: results.goalPromptPack,
      promptPack: goalPromptPackData,
      closeoutResult: results.goalCloseout,
      closeout: goalCloseoutData,
      activeLedgerResult: results.activeGoalProgress,
      activeLedger: activeGoalProgressData,
      activeEventLogResult: results.activeGoalEvents,
      activeEventLog: activeGoalEventsData
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

export function createGoalProgressRoute(goalId) {
  return createGoalScopedRoute({
    template: GOAL_PROGRESS_ROUTE_TEMPLATE,
    goalId,
    suffix: 'progress',
    id: 'activeGoalProgress',
    label: 'Active Goal Progress'
  });
}

export function createGoalEventsRoute(goalId) {
  return createGoalScopedRoute({
    template: GOAL_EVENTS_ROUTE_TEMPLATE,
    goalId,
    suffix: 'events',
    id: 'activeGoalEvents',
    label: 'Active Goal Events'
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

function createGoalScopedRoute({ template, goalId, suffix, id, label }) {
  if (!isSafeGoalRouteSegment(goalId)) {
    return null;
  }

  return Object.freeze({
    ...template,
    id,
    label,
    path: ['', 'api', 'goals', encodeURIComponent(goalId), suffix].join('/'),
    goalId
  });
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

function projectActiveGoalControl({
  runbookResult,
  runbook,
  nextActionResult,
  nextAction,
  promptPackResult,
  promptPack,
  closeoutResult,
  closeout,
  activeLedgerResult,
  activeLedger,
  activeEventLogResult,
  activeEventLog
}) {
  const ledger = activeLedger?.goalId === runbook?.goalId ? activeLedger : null;
  const eventLog = activeEventLog?.goalId === runbook?.goalId ? activeEventLog : null;

  return {
    runbook: projectGoalRunbook({
      result: runbookResult,
      runbook,
      ledger,
      eventLog,
      ledgerResult: activeLedgerResult,
      eventLogResult: activeEventLogResult
    }),
    nextAction: projectGoalNextAction({
      result: nextActionResult,
      nextAction
    }),
    promptPreview: projectGoalPromptPreview({
      result: promptPackResult,
      promptPack,
      nextAction
    }),
    closeoutGaps: projectGoalCloseoutGaps({
      result: closeoutResult,
      closeout,
      ledger
    })
  };
}

function projectGoalRunbook({
  result,
  runbook,
  ledger,
  eventLog,
  ledgerResult,
  eventLogResult
}) {
  const tasks = Array.isArray(runbook?.tasks) ? runbook.tasks : null;
  const ledgerTasks = new Map(
    (Array.isArray(ledger?.tasks) ? ledger.tasks : [])
      .map((task) => [task.taskId, task])
  );
  const eventTaskIds = new Set(
    (Array.isArray(eventLog?.events) ? eventLog.events : [])
      .map((event) => event?.taskId)
      .filter((taskId) => isNonEmptyString(taskId))
  );

  if (result?.ok !== true) {
    return {
      state: 'unavailable',
      contractName: valueState(GOAL_RUNBOOK_CONTRACT_NAME),
      contractVersion: valueState(undefined),
      goalId: valueState(undefined),
      goalTitle: valueState(undefined),
      baselineTag: valueState(undefined),
      baselineCommit: valueState(undefined),
      baselineEvidenceRef: valueState(undefined),
      taskCount: valueState(undefined),
      releaseGateCount: valueState(undefined),
      ledgerRouteState: valueState(ledgerResult?.skipped === true ? 'skipped' : ledgerResult?.ok === true ? 'ready' : undefined),
      eventRouteState: valueState(eventLogResult?.skipped === true ? 'skipped' : eventLogResult?.ok === true ? 'ready' : undefined),
      tasks: {
        state: 'missing',
        count: valueState(undefined),
        items: []
      },
      releaseGates: [],
      rolePolicy: [],
      errorEnvelope: projectErrorEnvelope(result?.errorEnvelope),
      note: 'Active Goal Runbook panel 只展示 goal-runbook.v1 与 active goal ledger/events routes 已暴露字段；task status 缺失时保持未暴露。'
    };
  }

  return {
    state: runbook === null || runbook === undefined ? 'missing' : 'available',
    contractName: valueState(runbook?.contractName),
    contractVersion: valueState(runbook?.contractVersion),
    goalId: valueState(runbook?.goalId),
    goalTitle: valueState(runbook?.goalTitle),
    baselineTag: valueState(runbook?.baseline?.tag),
    baselineCommit: valueState(runbook?.baseline?.commit),
    baselineEvidenceRef: valueState(runbook?.baseline?.evidenceRef),
    taskCount: valueState(tasks === null ? undefined : tasks.length),
    releaseGateCount: valueState(Array.isArray(runbook?.releaseGates) ? runbook.releaseGates.length : undefined),
    ledgerRouteState: valueState(ledgerResult?.skipped === true ? 'skipped' : ledgerResult?.ok === true ? 'ready' : undefined),
    eventRouteState: valueState(eventLogResult?.skipped === true ? 'skipped' : eventLogResult?.ok === true ? 'ready' : undefined),
    tasks: {
      state: tasks === null ? 'missing' : tasks.length === 0 ? 'empty' : 'available',
      count: valueState(tasks === null ? undefined : tasks.length),
      items: tasks === null ? [] : tasks.map((task) => {
        const ledgerTask = ledgerTasks.get(task?.taskId) ?? null;

        return {
          taskId: valueState(task?.taskId),
          title: valueState(task?.title),
          branch: valueState(task?.branch),
          roleOrder: arrayTextState(task?.roleOrder),
          acceptance: arrayTextState(task?.acceptance),
          expectedWorker: expectedEvidenceState(task?.expectedEvidence?.worker),
          expectedReviewer: expectedEvidenceState(task?.expectedEvidence?.reviewer),
          expectedMainVerifier: expectedEvidenceState(task?.expectedEvidence?.mainVerifier),
          status: valueState(ledgerTask?.status),
          statusSource: valueState(ledgerTask?.statusSource),
          workerEvidenceRef: valueState(ledgerTask?.workerEvidenceRef),
          reviewEvidenceRef: valueState(ledgerTask?.reviewEvidenceRef),
          reviewVerdict: valueState(ledgerTask?.reviewVerdict),
          mainVerificationRef: valueState(ledgerTask?.mainVerificationRef),
          eventBacked: valueState(eventTaskIds.has(task?.taskId)),
          copyOnlyCommands: arrayTextState(task?.copyOnlyCommands),
          blockers: projectBlockers(ledgerTask?.blockers)
        };
      })
    },
    releaseGates: Array.isArray(runbook?.releaseGates)
      ? runbook.releaseGates.map((gate) => ({
          gate: valueState(gate),
          status: valueState('required')
        }))
      : [],
    rolePolicy: Object.entries(runbook?.rolePolicy ?? {}).map(([policy, enabled]) => ({
      policy: valueState(policy),
      enabled: valueState(enabled)
    })),
    errorEnvelope: projectErrorEnvelope(null),
    note: 'Task status、statusSource 和 evidence refs 来自 active goal progress/events routes；Workbench 不根据 prompt、branch、文件名或命令文本推断完成状态。'
  };
}

function projectGoalNextAction({ result, nextAction }) {
  if (result?.ok !== true) {
    return {
      state: 'unavailable',
      contractName: valueState(GOAL_NEXT_ACTION_CONTRACT_NAME),
      contractVersion: valueState(undefined),
      goalId: valueState(undefined),
      status: valueState(undefined),
      reason: valueState(undefined),
      next: projectGoalNextDetails(undefined),
      evidenceState: projectGoalNextEvidenceState(undefined),
      copyOnlyPrompt: projectGoalNextCopyOnlyPrompt(undefined),
      copyOnlyCommands: projectTextItems(undefined),
      afterCompletion: projectAfterCompletion(undefined),
      safety: projectGoalControlSafety(undefined),
      errorEnvelope: projectErrorEnvelope(result?.errorEnvelope),
      note: 'Next Action Card 只展示 goal-next-action.v1；route 不可用时不从其他文本推断下一步。'
    };
  }

  return {
    state: nextAction === null || nextAction === undefined ? 'missing' : 'available',
    contractName: valueState(nextAction?.contractName),
    contractVersion: valueState(nextAction?.contractVersion),
    goalId: valueState(nextAction?.goalId),
    status: valueState(nextAction?.status),
    reason: valueState(nextAction?.reason ?? nextAction?.next?.reason),
    next: projectGoalNextDetails(nextAction?.next),
    evidenceState: projectGoalNextEvidenceState(nextAction?.evidenceState),
    copyOnlyPrompt: projectGoalNextCopyOnlyPrompt(nextAction?.copyOnlyPrompt),
    copyOnlyCommands: projectTextItems(nextAction?.copyOnlyCommands),
    afterCompletion: projectAfterCompletion(nextAction?.afterCompletion),
    safety: projectGoalControlSafety(nextAction?.safety),
    errorEnvelope: projectErrorEnvelope(null),
    note: 'Next Action Card 使用 resolver 输出的 task、role、phase、reason 和 afterCompletion；浏览器端不运行命令、不登记事件。'
  };
}

function projectGoalPromptPreview({ result, promptPack, nextAction }) {
  const prompts = Array.isArray(promptPack?.prompts) ? promptPack.prompts : null;
  const copyOnlyPrompts = prompts === null
    ? []
    : prompts.filter((prompt) => prompt?.copyOnly === true && isNonEmptyString(prompt?.text));
  const fallbackPrompt = nextAction?.copyOnlyPrompt?.available === true && isNonEmptyString(nextAction?.copyOnlyPrompt?.text)
    ? [{
        taskId: nextAction?.next?.taskId,
        role: nextAction?.next?.role,
        title: 'Copy-only prompt from goal-next-action.v1',
        format: nextAction.copyOnlyPrompt.format,
        text: nextAction.copyOnlyPrompt.text,
        sourceContract: GOAL_NEXT_ACTION_CONTRACT_NAME
      }]
    : [];
  const visiblePrompts = copyOnlyPrompts.length > 0
    ? copyOnlyPrompts.map((prompt) => ({
        ...prompt,
        sourceContract: GOAL_PROMPT_PACK_CONTRACT_NAME
      }))
    : fallbackPrompt;

  if (result?.ok !== true && fallbackPrompt.length === 0) {
    return {
      state: 'unavailable',
      contractName: valueState(GOAL_PROMPT_PACK_CONTRACT_NAME),
      contractVersion: valueState(undefined),
      goalId: valueState(undefined),
      promptCount: valueState(undefined),
      visibleCount: valueState(0),
      hiddenCount: valueState(undefined),
      safety: projectGoalControlSafety(undefined),
      items: [],
      errorEnvelope: projectErrorEnvelope(result?.errorEnvelope),
      note: 'Prompt Preview 只展示 copyOnly=true 的 prompt text；prompt pack 不可用时不拼接、不生成、不执行 prompt。'
    };
  }

  return {
    state: visiblePrompts.length === 0 ? 'empty' : 'available',
    contractName: valueState(promptPack?.contractName ?? (fallbackPrompt.length > 0 ? GOAL_NEXT_ACTION_CONTRACT_NAME : undefined)),
    contractVersion: valueState(promptPack?.contractVersion ?? (fallbackPrompt.length > 0 ? 1 : undefined)),
    goalId: valueState(promptPack?.goalId ?? nextAction?.goalId),
    promptCount: valueState(prompts === null ? undefined : prompts.length),
    visibleCount: valueState(visiblePrompts.length),
    hiddenCount: valueState(prompts === null ? undefined : prompts.length - copyOnlyPrompts.length),
    safety: projectGoalControlSafety(promptPack?.safety ?? nextAction?.safety),
    items: visiblePrompts.map((prompt) => ({
      taskId: valueState(prompt?.taskId),
      role: valueState(prompt?.role),
      title: valueState(prompt?.title),
      format: valueState(prompt?.format),
      sourceContract: valueState(prompt?.sourceContract),
      text: valueState(prompt?.text)
    })),
    errorEnvelope: projectErrorEnvelope(null),
    note: 'Prompt Preview 只把 copy-only text 放进可选择文本块；没有执行、confirm、下载、打开文件或模型调用入口。'
  };
}

function projectGoalCloseoutGaps({ result, closeout, ledger }) {
  const missing = Array.isArray(closeout?.missing) ? closeout.missing : null;

  if (result?.ok !== true) {
    return {
      state: 'unavailable',
      contractName: valueState(GOAL_CLOSEOUT_REPORT_CONTRACT_NAME),
      contractVersion: valueState(undefined),
      goalId: valueState(undefined),
      generatedAt: valueState(undefined),
      summary: projectCloseoutSummary(undefined, ledger),
      missing: {
        state: 'missing',
        count: valueState(undefined),
        items: []
      },
      releaseGates: [],
      nextAction: valueState(undefined),
      safety: projectGoalCloseoutSafety(undefined),
      errorEnvelope: projectErrorEnvelope(result?.errorEnvelope),
      note: 'Closeout Gaps 只展示 goal-closeout-report.v1；route 不可用时不从 prompt 或路径推断 release 状态。'
    };
  }

  return {
    state: closeout === null || closeout === undefined ? 'missing' : 'available',
    contractName: valueState(closeout?.contractName),
    contractVersion: valueState(closeout?.contractVersion),
    goalId: valueState(closeout?.goalId),
    generatedAt: valueState(closeout?.generatedAt),
    summary: projectCloseoutSummary(closeout?.summary, ledger),
    missing: {
      state: missing === null ? 'missing' : missing.length === 0 ? 'empty' : 'available',
      count: valueState(missing === null ? undefined : missing.length),
      items: missing === null ? [] : missing.map((item) => ({
        kind: valueState(item?.kind),
        taskId: valueState(item?.taskId),
        expectedEvent: valueState(item?.expectedEvent),
        gateId: valueState(item?.gateId),
        status: valueState(item?.status)
      }))
    },
    releaseGates: Object.entries(closeout?.releaseGates ?? {}).map(([gate, status]) => ({
      gate: valueState(gate),
      status: valueState(status)
    })),
    nextAction: valueState(closeout?.nextAction),
    safety: projectGoalCloseoutSafety(closeout?.safety),
    errorEnvelope: projectErrorEnvelope(null),
    note: 'Closeout Gaps 使用 closeout report 的 missing items 和 releaseGates；releaseReadySource 只来自 active ledger summary 已暴露字段。'
  };
}

function projectGoalNextDetails(next) {
  return {
    taskId: valueState(next?.taskId),
    role: valueState(next?.role),
    phase: valueState(next?.phase),
    reason: valueState(next?.reason),
    blocked: valueState(next?.blocked)
  };
}

function projectGoalNextEvidenceState(evidenceState) {
  return {
    workerEvidenceRef: valueState(evidenceState?.workerEvidenceRef),
    reviewEvidenceRef: valueState(evidenceState?.reviewEvidenceRef),
    mainVerificationRef: valueState(evidenceState?.mainVerificationRef)
  };
}

function projectGoalNextCopyOnlyPrompt(copyOnlyPrompt) {
  return {
    available: valueState(copyOnlyPrompt?.available),
    format: valueState(copyOnlyPrompt?.format),
    textAvailable: valueState(isNonEmptyString(copyOnlyPrompt?.text))
  };
}

function projectAfterCompletion(afterCompletion) {
  return {
    registerWith: valueState(afterCompletion?.registerWith),
    allowedEvents: arrayTextState(afterCompletion?.allowedEvents)
  };
}

function projectCloseoutSummary(summary, ledger) {
  return {
    totalTasks: valueState(summary?.totalTasks),
    workerEvidenceComplete: valueState(summary?.workerEvidenceComplete),
    reviewEvidenceComplete: valueState(summary?.reviewEvidenceComplete),
    mainVerificationComplete: valueState(summary?.mainVerificationComplete),
    releaseReady: valueState(summary?.releaseReady),
    releaseReadySource: valueState(ledger?.summary?.releaseReadySource)
  };
}

function projectGoalControlSafety(safety) {
  return {
    readOnly: valueState(safety?.readOnly),
    copyOnly: valueState(safety?.copyOnly),
    workbenchWriteAvailable: valueState(safety?.workbenchWriteAvailable),
    browserExecutionAvailable: valueState(safety?.browserExecutionAvailable),
    modelInvocationAvailable: valueState(safety?.modelInvocationAvailable)
  };
}

function projectGoalCloseoutSafety(safety) {
  return {
    ...projectGoalControlSafety(safety),
    writesInDryRun: valueState(safety?.writesInDryRun),
    confirmRequiredForWrites: valueState(safety?.confirmRequiredForWrites),
    releaseReadyRequiresEvidence: valueState(safety?.releaseReadyRequiresEvidence)
  };
}

function projectTextItems(values) {
  if (!Array.isArray(values)) {
    return {
      state: 'missing',
      count: valueState(undefined),
      items: []
    };
  }

  return {
    state: values.length === 0 ? 'empty' : 'available',
    count: valueState(values.length),
    items: values.map((value) => valueState(value))
  };
}

function expectedEvidenceState(value) {
  return Array.isArray(value) ? arrayTextState(value) : valueState(value);
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
    releaseReady: valueState(summary?.releaseReady),
    releaseReadySource: valueState(summary?.releaseReadySource)
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

function isSafeGoalRouteSegment(value) {
  return isNonEmptyString(value) &&
    !value.includes('/') &&
    !value.includes('\\') &&
    !value.includes('..') &&
    !value.includes('?') &&
    !value.includes('#');
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
