import { buildGoalSupervisorCoreProjection } from './core-projection.js';
import {
  APP_STATE_SNAPSHOT_CONTRACT_NAME,
  APP_STATE_SNAPSHOT_CONTRACT_VERSION
} from '../app-state-snapshot.js';
import {
  CURRENT_PROJECT_BINDING_CONTRACT_NAME,
  PROJECT_REGISTRY_CONTRACT_VERSION,
  RECENT_PROJECTS_CONTRACT_NAME
} from '../project-registry.js';
import {
  GOAL_CLOSEOUT_REPORT_CONTRACT_NAME,
  GOAL_CLOSEOUT_REPORT_CONTRACT_VERSION,
  GOAL_NEXT_ACTION_CONTRACT_NAME,
  GOAL_NEXT_ACTION_CONTRACT_VERSION
} from '../goal-runbook-contracts.js';
import {
  SYSTEM_GOLDEN_PATH_CONTRACT_NAME,
  SYSTEM_GOLDEN_PATH_CONTRACT_VERSION,
  buildSystemGoldenPathContract,
  buildSystemGoldenPathManualCliAction,
  buildSystemGoldenPathRefreshAction
} from '../system-golden-path-contracts.js';
import {
  RESULT_INTAKE_CONTRACT_VERSION,
  RESULT_INTAKE_REQUEST_CONTRACT_NAME
} from '../result-intake-contracts.js';
import {
  CHILD_DISPATCH_ALLOWED_PROVIDER_IDS,
  CHILD_DISPATCH_ALLOWED_ROLES,
  CHILD_DISPATCH_RETURN_PATH,
  buildChildDispatchPreviewContract,
  buildChildTaskPack,
  validateChildDispatchPreviewContract
} from '../child-dispatch-preview-contracts.js';
import {
  buildCodexProviderExecutionPreviewFromChildDispatch
} from '../codex-provider-execution-backend.js';
import {
  CODEX_PROVIDER_RUN_RECOVERY_CONTRACT_NAME,
  buildCodexProviderRunRecovery,
  validateCodexProviderRunRecoveryContract
} from '../codex-provider-run-recovery-contracts.js';
import {
  chooseGoalSupervisorPolicyDecision,
  projectGoalSupervisorCommandBoundary
} from './policy.js';
import {
  CONTEXT_ADVISORY_CONTRACT_NAME,
  CONTEXT_ADVISORY_CONTRACT_VERSION,
  SESSION_SOURCE_INVENTORY_CONTRACT_NAME,
  SESSION_SOURCE_INVENTORY_CONTRACT_VERSION,
  buildContextAdvisory
} from './session-context.js';
import {
  THREAD_CONTINUATION_DECISION_CONTRACT_NAME,
  THREAD_CONTINUATION_DECISION_CONTRACT_VERSION,
  buildThreadContinuationDecision
} from './thread-continuation-decision.js';
import {
  SUPERVISOR_EVENT_REGISTRATION_ELIGIBILITY_CONTRACT_NAME,
  SUPERVISOR_EVENT_REGISTRATION_ELIGIBILITY_CONTRACT_VERSION,
  buildSupervisorEventRegistrationEligibility
} from './event-registration-eligibility.js';

export const GOAL_SUPERVISOR_APP_READ_MODEL_CONTRACT_NAME = 'goal-supervisor-app-read-model.v1';
export const GOAL_SUPERVISOR_APP_READ_MODEL_CONTRACT_VERSION = 1;
export { GOAL_SUPERVISOR_APP_COMMAND_BOUNDARY_DEFAULT } from './policy.js';

const PENDING_RESULT_CONTRACT_NAME = 'pendingResult.v1';
const PENDING_RESULT_CONTRACT_VERSION = 1;
const RESULT_EVIDENCE_ESCROW_CONTRACT_NAME = 'resultEvidenceEscrow.v1';
const PENDING_RESULT_STATES = new Set(['available', 'blocked', 'consumed', 'superseded']);
const SOURCE_CONTRACT_NAME_PATTERN = /^[a-z][a-zA-Z0-9-]*(?:\.[a-zA-Z0-9-]+)*\.v[0-9]+$/u;
const UNSAFE_SOURCE_CONTRACT_TEXT_PATTERN = /\b(?:raw[\s_-]*transcript|raw[\s_-]*model[\s_-]*output|provider[\s_-]*session|session[\s_-]*log|session[\s_-]*file|model[\s_-]*output)\b/iu;
const PENDING_RESULT_UPDATE_EVENTS = new Set([
  'worker.evidence-recorded',
  'worker.self-check-passed',
  'worker.self-check-failed',
  'blocker.opened',
  'blocker.resolved'
]);

export function buildGoalSupervisorAppReadModel({
  goalId = null,
  title = null,
  tasks = [],
  sourceContracts = [],
  timelineEvents = [],
  state = {},
  goalNext = null,
  routeInput = null,
  active = null,
  threadRead = null,
  escrow = null,
  expected = null,
  releaseGates = [],
  allowCloseout = false,
  nowMs = Date.now(),
  progressGraceMs,
  coreProjection = null,
  sessionContext = null,
  ownership = {},
  currentGate = null,
  commandBoundary = null,
  recommendedNextAction = null,
  sessionSourceInventory = null,
  contextAdvisory = null,
  threadContinuationDecision = null,
  activePr = null,
  branch = null,
  pendingResultState = null,
  recentProjects = null,
  currentProjectBinding = null,
  appStateSnapshot = null,
  childDispatchProviderPolicy = null,
  codexProviderRunRecord = null,
  goalCloseout
} = {}) {
  const projection = coreProjection ?? buildGoalSupervisorCoreProjection({
    state,
    goalNext,
    routeInput,
    active,
    threadRead,
    escrow,
    expected,
    releaseGates,
    allowCloseout,
    nowMs,
    ...(progressGraceMs === undefined ? {} : { progressGraceMs })
  });
  const generatedAt = new Date(nowMs).toISOString();
  const normalizedGoalId = firstNonEmptyString(goalId, projection.goalId, goalNext?.goalId, state?.goalId);
  const normalizedCommandBoundary = projectGoalSupervisorCommandBoundary({ commandBoundary });
  const normalizedContext = normalizeContextStatus(sessionContext, projection);
  const normalizedPendingResult = normalizePendingResult({
    projection,
    routeInput: projection.routeInput,
    pendingResultState
  });
  const pendingResultRecord = pendingResultRecordFromProjection({
    projection,
    routeInput: projection.routeInput,
    pendingResultState
  });
  const normalizedActiveLease = normalizeActiveLease({
    active: state?.active ?? active ?? projection.routeInput?.activeLease,
    routeInput: projection.routeInput,
    nowMs
  });
  const normalizedGate = normalizeCurrentGate({
    currentGate,
    route: projection.route,
    goalNext
  });
  const normalizedNextAction = recommendedNextAction ?? chooseGoalSupervisorPolicyDecision({
    projection,
    pendingResult: normalizedPendingResult,
    activeLease: normalizedActiveLease,
    currentGate: normalizedGate,
    contextStatus: normalizedContext,
    commandBoundary: normalizedCommandBoundary
  });
  const normalizedSessionSourceInventory = normalizeSessionSourceInventory(
    sessionSourceInventory,
    generatedAt
  );
  const normalizedContextAdvisory = normalizeContextAdvisoryDisplay(
    contextAdvisory ?? buildContextAdvisory({
      sessionContext,
      sessionSourceInventory: normalizedSessionSourceInventory,
      generatedAt
    }),
    generatedAt
  );
  const normalizedThreadContinuationDecision = normalizeThreadContinuationDecisionDisplay(
    threadContinuationDecision ?? buildThreadContinuationDecision({
      contextAdvisory: normalizedContextAdvisory,
      activeLease: normalizedActiveLease,
      pendingResult: normalizedPendingResult,
      currentPhase: projection.current ?? projection.route?.current ?? null,
      taskState: projection.current ?? projection.route?.current ?? null,
      supervisorProjection: projection,
      supervisorPolicy: normalizedNextAction,
      currentGate: normalizedGate,
      commandBoundary: normalizedCommandBoundary,
      sourceContracts: [
        ...safeSourceContracts(sourceContracts),
        normalizedSessionSourceInventory,
        normalizedContextAdvisory
      ],
      generatedAt
    }),
    generatedAt
  );
  const normalizedEventRegistrationEligibility = buildSupervisorEventRegistrationEligibility({
    goalId: normalizedGoalId,
    pendingResult: normalizedPendingResult,
    pendingResultRecord,
    threadContinuationDecision: normalizedThreadContinuationDecision,
    taskState: projection.current ?? projection.route?.current ?? null,
    commandBoundary: normalizedCommandBoundary,
    sourceContracts: [
      ...safeSourceContracts(sourceContracts),
      normalizedContextAdvisory,
      normalizedThreadContinuationDecision,
      ...pendingResultSourceContracts(normalizedPendingResult)
    ],
    generatedAt
  });
  const systemGoldenPath = buildGoalSupervisorSystemGoldenPath({
    generatedAt,
    goalId: normalizedGoalId,
    title,
    tasks,
    sourceContracts,
    recentProjects,
    currentProjectBinding,
    appStateSnapshot,
    projection,
    contextAdvisory: normalizedContextAdvisory,
    pendingResult: normalizedPendingResult,
    eventRegistrationEligibility: normalizedEventRegistrationEligibility,
    currentGate: normalizedGate,
    goalCloseout
  });
  const childDispatchPreview = buildGoalSupervisorChildDispatchPreview({
    generatedAt,
    goalId: normalizedGoalId,
    title,
    tasks,
    sourceContracts,
    goalNext,
    projection,
    recommendedNextAction: normalizedNextAction,
    systemGoldenPath,
    providerPolicy: childDispatchProviderPolicy
  });
  const codexProviderExecutionPreview = buildCodexProviderExecutionPreviewFromChildDispatch({
    childDispatchPreview,
    generatedAt
  });
  const codexProviderRunRecovery = buildGoalSupervisorCodexProviderRunRecovery({
    generatedAt,
    goalId: normalizedGoalId,
    title,
    tasks,
    codexProviderRunRecord,
    pendingResultState,
    currentPreviewHash: codexProviderExecutionPreview.previewHash
  });

  return {
    contractName: GOAL_SUPERVISOR_APP_READ_MODEL_CONTRACT_NAME,
    contractVersion: GOAL_SUPERVISOR_APP_READ_MODEL_CONTRACT_VERSION,
    readOnly: true,
    willMutate: false,
    generatedAt,
    goalSnapshot: buildGoalSnapshot({
      goalId: normalizedGoalId,
      title,
      tasks,
      projection,
      sourceContracts,
      generatedAt,
      currentGate: normalizedGate
    }),
    goalTimeline: buildGoalTimeline({
      timelineEvents,
      state
    }),
    activeLease: normalizedActiveLease,
    pendingResult: normalizedPendingResult,
    currentGate: normalizedGate,
    recommendedNextAction: normalizedNextAction,
    ownership: normalizeOwnership({
      ownership,
      activePr,
      branch
    }),
    contextStatus: normalizedContext,
    commandBoundary: normalizedCommandBoundary,
    sessionSourceInventory: normalizedSessionSourceInventory,
    contextAdvisory: normalizedContextAdvisory,
    threadContinuationDecision: normalizedThreadContinuationDecision,
    supervisorEventRegistrationEligibility: normalizedEventRegistrationEligibility,
    systemGoldenPath,
    childDispatchPreview,
    codexProviderExecutionPreview,
    codexProviderRunRecovery
  };
}

function buildGoalSupervisorCodexProviderRunRecovery({
  generatedAt,
  goalId,
  title,
  tasks,
  codexProviderRunRecord,
  pendingResultState,
  currentPreviewHash
}) {
  if (!isPlainObject(codexProviderRunRecord)) {
    return null;
  }

  const taskId = codexProviderRunRecord.taskId;
  const task = Array.isArray(tasks)
    ? tasks.find((entry) => isPlainObject(entry) && entry.taskId === taskId)
    : null;
  const recovery = buildCodexProviderRunRecovery({
    generatedAt,
    runRecord: codexProviderRunRecord,
    pendingResult: pendingResultState,
    currentPreviewHash,
    goal: {
      goalId,
      title: title ?? goalId,
      state: 'active',
      sourceContract: GOAL_SUPERVISOR_APP_READ_MODEL_CONTRACT_NAME,
      sourceRef: supervisorRouteSourceRef()
    },
    task: {
      taskId,
      title: task?.title ?? taskId,
      state: task?.status === 'blocked' ? 'blocked' : 'active',
      sourceContract: CODEX_PROVIDER_RUN_RECOVERY_CONTRACT_NAME,
      sourceRef: {
        kind: 'run-record',
        ref: codexProviderRunRecord.runId
      }
    }
  });
  const validation = validateCodexProviderRunRecoveryContract(recovery);

  if (!validation.ok) {
    throw new Error(`Invalid Codex provider run recovery projection: ${validation.errors.join('; ')}`);
  }

  return recovery;
}

function buildGoalSupervisorChildDispatchPreview({
  generatedAt,
  goalId,
  title,
  tasks,
  sourceContracts,
  goalNext,
  projection,
  recommendedNextAction,
  systemGoldenPath,
  providerPolicy
}) {
  const role = childDispatchRoleFrom({
    providerPolicy,
    recommendedNextAction,
    goalNext,
    projection
  });
  const task = childDispatchTaskFrom({
    tasks,
    recommendedNextAction,
    goalNext,
    projection,
    systemGoldenPath
  });
  const goal = childDispatchGoalFrom({
    goalId,
    title,
    systemGoldenPath,
    projection
  });
  const provider = childDispatchProviderFor({
    role,
    providerPolicy
  });
  const previewSourceContracts = childDispatchSourceContracts({
    sourceContracts,
    goalNext,
    projection,
    systemGoldenPath
  });
  const previewSourceRefs = childDispatchSourceRefs({ sourceContracts: previewSourceContracts });
  const blockedReasons = childDispatchBlockedReasons({
    role,
    provider,
    systemGoldenPath
  });
  const taskPack = blockedReasons.length === 0
    ? buildChildDispatchTaskPack({
        goal,
        task,
        role,
        providerId: provider.preferredProvider,
        sourceContracts: previewSourceContracts,
        systemGoldenPath,
        recommendedNextAction
      })
    : null;
  const preview = buildChildDispatchPreviewContract({
    generatedAt,
    goal,
    task,
    requestedRole: role,
    preferredProvider: provider.preferredProvider,
    sourceContracts: previewSourceContracts,
    sourceRefs: previewSourceRefs,
    taskPack,
    blockedReasons
  });
  const validation = validateChildDispatchPreviewContract(preview);

  if (!validation.ok) {
    throw new Error(`Invalid child dispatch preview projection: ${validation.errors.join('; ')}`);
  }

  return preview;
}

function childDispatchGoalFrom({
  goalId,
  title,
  systemGoldenPath,
  projection
}) {
  const normalizedGoalId = firstNonEmptyString(
    goalId,
    systemGoldenPath?.goal?.goalId,
    projection?.goalId
  );
  const safeGoalId = safeChildDispatchToken(normalizedGoalId);

  return {
    goalId: safeGoalId,
    title: safeGoalId === null ? null : safeChildDispatchText(firstNonEmptyString(title, systemGoldenPath?.goal?.title)),
    state: safeGoalId === null ? 'missing' : childDispatchGoalStateFrom({ systemGoldenPath, projection }),
    sourceContract: GOAL_SUPERVISOR_APP_READ_MODEL_CONTRACT_NAME,
    sourceRef: supervisorRouteSourceRef()
  };
}

function childDispatchGoalStateFrom({
  systemGoldenPath,
  projection
}) {
  if (['blocked', 'missing'].includes(systemGoldenPath?.goal?.state)) {
    return systemGoldenPath.goal.state;
  }

  if (projection?.route?.state === 'complete') {
    return 'ready';
  }

  if (projection?.route?.state === 'blocked') {
    return 'blocked';
  }

  return 'active';
}

function childDispatchTaskFrom({
  tasks,
  recommendedNextAction,
  goalNext,
  projection,
  systemGoldenPath
}) {
  const normalizedTasks = Array.isArray(tasks) ? tasks.filter(isPlainObject) : [];
  const taskId = firstNonEmptyString(
    recommendedNextAction?.taskId,
    goalNext?.next?.taskId,
    projection?.current?.taskId,
    projection?.route?.current?.taskId,
    systemGoldenPath?.goal?.taskId
  );
  const safeTaskId = safeChildDispatchToken(taskId);
  const matchedTask = taskId === null
    ? null
    : normalizedTasks.find((task) => task.taskId === taskId);

  return {
    taskId: safeTaskId,
    title: safeTaskId === null
      ? null
      : safeChildDispatchText(firstNonEmptyString(
          matchedTask?.title,
          systemGoldenPath?.goal?.taskLabel,
          safeTaskId
        )),
    state: childDispatchTaskStateFrom({
      taskId: safeTaskId,
      matchedTask,
      systemGoldenPath,
      projection
    }),
    sourceContract: SYSTEM_GOLDEN_PATH_CONTRACT_NAME,
    sourceRef: sourceRefForContractName(SYSTEM_GOLDEN_PATH_CONTRACT_NAME)
  };
}

function childDispatchTaskStateFrom({
  taskId,
  matchedTask,
  systemGoldenPath,
  projection
}) {
  if (taskId === null) {
    return 'missing';
  }

  if (matchedTask?.status === 'blocked' || projection?.route?.state === 'blocked') {
    return 'blocked';
  }

  if (isCompletedTaskStatus(matchedTask ?? {})) {
    return 'ready';
  }

  if (systemGoldenPath?.goal?.state === 'pending') {
    return 'pending';
  }

  return 'active';
}

function childDispatchRoleFrom({
  providerPolicy,
  recommendedNextAction,
  goalNext,
  projection
}) {
  const requestedRole = firstNonEmptyString(
    providerPolicy?.requestedRole,
    providerPolicy?.role,
    recommendedNextAction?.targetRole,
    goalNext?.next?.role,
    projection?.current?.role,
    projection?.route?.current?.role
  );

  if (requestedRole === 'main-verifier') {
    return 'verifier';
  }

  return requestedRole ?? 'worker';
}

function childDispatchProviderFor({
  role,
  providerPolicy
}) {
  const providerByRole = isPlainObject(providerPolicy?.providerByRole)
    ? providerPolicy.providerByRole
    : {};
  const preferredProvider = firstNonEmptyString(
    providerPolicy?.preferredProvider,
    providerPolicy?.providerId,
    providerPolicy?.requestedProvider,
    providerByRole[role],
    role === 'reviewer' ? 'claude-code' : 'codex'
  );
  const allowedProviders = Array.isArray(providerPolicy?.allowedProviders)
    ? uniqueStrings(providerPolicy.allowedProviders)
    : [...CHILD_DISPATCH_ALLOWED_PROVIDER_IDS];

  return {
    preferredProvider,
    allowedProviders
  };
}

function childDispatchBlockedReasons({
  role,
  provider,
  systemGoldenPath
}) {
  return uniqueStrings([
    ...(!CHILD_DISPATCH_ALLOWED_ROLES.includes(role) ? ['unsupported-child-role'] : []),
    ...(!CHILD_DISPATCH_ALLOWED_PROVIDER_IDS.includes(provider.preferredProvider) ||
        !provider.allowedProviders.includes(provider.preferredProvider)
      ? ['unsupported-provider']
      : []),
    ...systemGoldenPathBlockedReasons(systemGoldenPath)
  ]);
}

function systemGoldenPathBlockedReasons(systemGoldenPath) {
  if (!isPlainObject(systemGoldenPath) ||
      systemGoldenPath.contractName !== SYSTEM_GOLDEN_PATH_CONTRACT_NAME) {
    return ['system-golden-path-missing'];
  }

  if (!['blocked', 'missing', 'stale', 'degraded'].includes(systemGoldenPath.overallState)) {
    return [];
  }

  return uniqueStrings([
    `system-golden-path-${systemGoldenPath.overallState}`,
    ...(Array.isArray(systemGoldenPath.blockedReasons) ? systemGoldenPath.blockedReasons : [])
  ]);
}

function buildChildDispatchTaskPack({
  goal,
  task,
  role,
  providerId,
  sourceContracts,
  systemGoldenPath,
  recommendedNextAction
}) {
  if (!nonEmptyString(goal.goalId) || !nonEmptyString(task.taskId)) {
    return null;
  }

  return buildChildTaskPack({
    goalId: goal.goalId,
    taskId: task.taskId,
    role,
    preferredProvider: providerId,
    sourceContracts,
    projectContextRefs: childDispatchProjectContextRefs({ systemGoldenPath }),
    taskPrompt: childDispatchTaskPrompt({
      goal,
      task,
      role,
      providerId,
      recommendedNextAction
    }),
    acceptanceCriteria: [
      'Return a sanitized result block through v51-result-intake.',
      'Include evidence refs for changed files and validation commands.',
      'Report blockers without updating goal state.'
    ],
    forbiddenActions: [
      'Provider execution stays unavailable.',
      'Actual child dispatch stays unavailable.',
      'Child result cannot update goal state directly.',
      'Reviewer, main, and release gates stay manual.'
    ]
  });
}

function childDispatchTaskPrompt({
  goal,
  task,
  role,
  providerId,
  recommendedNextAction
}) {
  return [
    `Goal ${goal.goalId}: ${goal.title ?? 'untitled'}.`,
    `Task ${task.taskId}: ${task.title ?? task.taskId}.`,
    `Role ${role}; preferred provider ${providerId}.`,
    `Supervisor next action ${recommendedNextAction?.actionId ?? 'unknown'}: ${safeChildDispatchText(recommendedNextAction?.reason) ?? 'no reason supplied'}.`,
    `Return only a sanitized ${RESULT_INTAKE_REQUEST_CONTRACT_NAME} block through ${CHILD_DISPATCH_RETURN_PATH}.`
  ].join(' ');
}

function childDispatchProjectContextRefs({ systemGoldenPath }) {
  return uniqueStrings([
    'docs/plans/v53-controlled-child-dispatch-preview-runbook-2026-06-12.md',
    GOAL_SUPERVISOR_APP_READ_MODEL_CONTRACT_NAME,
    GOAL_NEXT_ACTION_CONTRACT_NAME,
    SYSTEM_GOLDEN_PATH_CONTRACT_NAME,
    RESULT_INTAKE_REQUEST_CONTRACT_NAME,
    safeChildDispatchSourceRefValue(systemGoldenPath?.routeProvenance?.refreshRouteTemplate)
  ]);
}

function childDispatchSourceContracts({
  sourceContracts,
  goalNext,
  projection,
  systemGoldenPath
}) {
  const records = new Map();

  addChildDispatchSourceContract(records, {
    contractName: GOAL_SUPERVISOR_APP_READ_MODEL_CONTRACT_NAME,
    requiredFor: ['active-goal', 'active-task', 'preview-readiness'],
    sourceRef: supervisorRouteSourceRef()
  });
  addChildDispatchSourceContract(records, {
    contractName: GOAL_NEXT_ACTION_CONTRACT_NAME,
    contractVersion: GOAL_NEXT_ACTION_CONTRACT_VERSION,
    requiredFor: ['next-action'],
    sourceRef: sourceRefForContractName(GOAL_NEXT_ACTION_CONTRACT_NAME),
    contractObject: goalNext
  });
  addChildDispatchSourceContract(records, {
    contractName: projection?.contractName,
    contractVersion: projection?.contractVersion,
    requiredFor: ['supervisor-state'],
    sourceRef: sourceRefForContractName(projection?.contractName),
    contractObject: projection
  });
  addChildDispatchSourceContract(records, {
    contractName: SYSTEM_GOLDEN_PATH_CONTRACT_NAME,
    contractVersion: SYSTEM_GOLDEN_PATH_CONTRACT_VERSION,
    requiredFor: ['preview-readiness', 'task-pack'],
    sourceRef: sourceRefForContractName(SYSTEM_GOLDEN_PATH_CONTRACT_NAME),
    contractObject: systemGoldenPath
  });
  addChildDispatchSourceContract(records, {
    contractName: RESULT_INTAKE_REQUEST_CONTRACT_NAME,
    contractVersion: RESULT_INTAKE_CONTRACT_VERSION,
    requiredFor: ['result-expectation'],
    sourceRef: sourceRefForContractName(RESULT_INTAKE_REQUEST_CONTRACT_NAME)
  });

  for (const contract of normalizeContractRefs(sourceContracts)) {
    addChildDispatchSourceContract(records, {
      contractName: contract.contractName,
      contractVersion: contract.contractVersion,
      requiredFor: ['source-context'],
      sourceRef: sourceRefForContractName(contract.contractName),
      contractObject: contract
    });
  }

  return [...records.values()].map((record) => stripEmptyObject({
    contractName: record.contractName,
    contractVersion: record.contractVersion,
    readOnly: true,
    requiredFor: record.requiredFor,
    sourceRef: record.sourceRef
  }));
}

function addChildDispatchSourceContract(records, {
  contractName,
  contractVersion,
  requiredFor,
  sourceRef,
  contractObject
}) {
  const safeName = safeContractName(contractName);

  if (safeName === null) {
    return;
  }

  const existing = records.get(safeName) ?? {
    contractName: safeName,
    contractVersion: knownContractVersion(safeName),
    requiredFor: [],
    sourceRef: null
  };
  const version = Number.isInteger(contractVersion)
    ? contractVersion
    : Number.isInteger(contractObject?.contractVersion)
      ? contractObject.contractVersion
      : knownContractVersion(safeName);

  existing.contractVersion = Number.isInteger(existing.contractVersion)
    ? existing.contractVersion
    : version;
  existing.requiredFor = uniqueStrings([
    ...existing.requiredFor,
    ...(Array.isArray(requiredFor) ? requiredFor : [])
  ]);
  existing.sourceRef = preferredSourceRef(
    existing.sourceRef,
    safeChildDispatchSourceRef(sourceRef) ?? sourceRefForContractName(safeName)
  );

  records.set(safeName, existing);
}

function childDispatchSourceRefs({ sourceContracts }) {
  const refs = [];

  for (const sourceContract of sourceContracts) {
    const sourceRef = safeChildDispatchSourceRef(sourceContract.sourceRef);

    if (sourceRef !== null) {
      refs.push({
        ...sourceRef,
        label: sourceContract.contractName
      });
    }
  }

  return uniqueSourceRefs(refs);
}

function safeChildDispatchSourceRef(sourceRef) {
  if (!isPlainObject(sourceRef) ||
      !['contract', 'route', 'fixture', 'docs'].includes(sourceRef.kind)) {
    return null;
  }

  const ref = safeChildDispatchSourceRefValue(sourceRef.ref);

  if (ref === null) {
    return null;
  }

  return {
    kind: sourceRef.kind,
    ref
  };
}

function safeChildDispatchSourceRefValue(value) {
  if (!nonEmptyString(value)) {
    return null;
  }

  const candidate = value.trim();
  const ref = candidate === '/api/goals/<goal-id>/supervisor'
    ? candidate
    : safeDisplayRef(candidate);

  if (ref === null ||
      /\/(?:event-plan-confirm|event-append|append-event|mark-complete|complete-task|git|tag|publish|release)(?:$|[/\s])/iu.test(ref) ||
      /\/api\/(?:providers?|child(?:-dispatch)?|dispatch)(?:$|[/\s])/iu.test(ref) ||
      /\b(?:git\s+(?:push|tag|checkout|merge|commit)|gh\s+release)\b/iu.test(ref)) {
    return null;
  }

  return ref;
}

function safeChildDispatchToken(value) {
  if (!nonEmptyString(value)) {
    return null;
  }

  const token = value.trim();

  if (!/^[a-zA-Z0-9][a-zA-Z0-9._:-]*$/u.test(token) ||
      childDispatchForbiddenText(token) ||
      safeChildDispatchSourceRefValue(token) === null) {
    return null;
  }

  return token;
}

function safeChildDispatchText(value) {
  if (!nonEmptyString(value)) {
    return null;
  }

  const text = value.trim();

  if (childDispatchForbiddenText(text) ||
      /\b(?:raw[\s_-]*transcript|raw[\s_-]*model[\s_-]*output|provider[\s_-]*session|session[\s_-]*log|session[\s_-]*file|model[\s_-]*output)\b|(?:^|[/.])(?:\.codex|\.claude|\.git|\.symphony)(?:[/]|$)|\.jsonl(?:$|[/\s])|\/api\/(?:providers?|child(?:-dispatch)?|dispatch)(?:$|[/\s])/iu.test(text)) {
    return null;
  }

  return text;
}

function childDispatchForbiddenText(value) {
  return [
    'dispatch child',
    'run child',
    'launch codex',
    'launch claude code',
    'execute',
    'run provider',
    'confirm child result',
    'append event',
    'mark complete',
    'push',
    'tag',
    'publish',
    'release'
  ].includes(value.trim().toLowerCase());
}

function uniqueSourceRefs(refs) {
  const seen = new Set();
  const result = [];

  for (const ref of refs) {
    const key = `${ref.kind}:${ref.ref}:${ref.label ?? ''}`;

    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    result.push(ref);
  }

  return result;
}

export function buildGoalSupervisorSystemGoldenPath({
  generatedAt = new Date().toISOString(),
  goalId = null,
  title = null,
  tasks = [],
  sourceContracts = [],
  recentProjects = null,
  currentProjectBinding = null,
  appStateSnapshot = null,
  projection = null,
  contextAdvisory = null,
  pendingResult = null,
  eventRegistrationEligibility = null,
  currentGate = null,
  goalCloseout
} = {}) {
  const currentTask = currentTaskFrom({
    tasks,
    projection,
    appStateSnapshot
  });
  const projectBinding = projectBindingFrom({
    recentProjects,
    currentProjectBinding,
    appStateSnapshot
  });
  const appHome = appHomeStateFrom({
    appStateSnapshot,
    previous: projectBinding
  });
  const supervisor = supervisorStateFrom({ projection, previous: appHome });
  const context = contextAdvisoryStateFrom({
    contextAdvisory,
    previous: supervisor
  });
  const resultIntake = resultIntakeStateFrom({
    pendingResult,
    previous: context
  });
  const eventPreview = eventPreviewStateFrom({
    eventRegistrationEligibility,
    previous: resultIntake
  });
  const eventConfirm = eventConfirmStateFrom({
    eventRegistrationEligibility,
    previous: eventPreview
  });
  const reviewGate = {
    id: 'review-gate',
    label: 'Review / Gate',
    state: 'manual-required',
    sourceContract: SUPERVISOR_EVENT_REGISTRATION_ELIGIBILITY_CONTRACT_NAME,
    sourceRef: {
      kind: 'manual-cli',
      ref: 'symphony goal review'
    },
    blockedReasons: [],
    nextSafeAction: buildSystemGoldenPathManualCliAction(),
    willMutate: false
  };
  const closeout = closeoutStateFrom({
    goalCloseout,
    currentGate,
    previous: eventConfirm
  });
  const steps = [
    projectBinding,
    appHome,
    supervisor,
    context,
    resultIntake,
    eventPreview,
    eventConfirm,
    reviewGate,
    closeout
  ].map(buildSystemGoldenPathStep);

  return buildSystemGoldenPathContract({
    generatedAt,
    project: {
      projectId: projectBinding.projectId,
      name: projectBinding.projectName,
      state: projectBinding.state,
      selected: projectBinding.selected,
      sourceContract: projectBinding.sourceContract,
      sourceRef: projectBinding.sourceRef
    },
    goal: {
      goalId: firstNonEmptyString(goalId, projection?.goalId),
      title: firstNonEmptyString(title, appStateSnapshot?.active_goal?.goal_title),
      taskId: currentTask.taskId,
      taskLabel: currentTask.taskLabel,
      state: stateForGoal(steps),
      sourceContract: sourceContractForGoal(steps),
      sourceRef: sourceRefForGoal(steps)
    },
    steps,
    sourceContracts: buildSystemGoldenPathSourceContracts({
      steps,
      sourceContracts,
      recentProjects,
      currentProjectBinding,
      appStateSnapshot,
      contextAdvisory,
      pendingResult,
      eventRegistrationEligibility,
      goalCloseout
    }),
    routeProvenance: {
      source: GOAL_SUPERVISOR_APP_READ_MODEL_CONTRACT_NAME,
      readModelOwner: 'backend',
      workbenchSurface: '/workbench/desktop/',
      refreshRouteTemplate: '/api/goals/<goal-id>/supervisor',
      refreshMethod: 'GET',
      frontendLocalFileReads: false,
      mutationRoutes: []
    }
  });
}

function buildSystemGoldenPathStep({
  id,
  label,
  state,
  sourceContract,
  sourceRef,
  blockedReasons = [],
  reason = null,
  nextSafeAction = null
}) {
  const reasons = uniqueStrings(blockedReasons);
  const action = nextSafeAction ?? (
    state === 'manual-required'
      ? buildSystemGoldenPathManualCliAction({
          reason: firstNonEmptyString(reason, `${id}-manual-required`)
        })
      : buildSystemGoldenPathRefreshAction({
          reason: firstNonEmptyString(reason, reasons[0], `${id}-${state}`)
        })
  );

  return {
    id,
    label,
    state,
    sourceContract: sourceContract ?? null,
    sourceRef: sourceRef ?? null,
    blockedReasons: reasons,
    nextSafeAction: action,
    willMutate: false
  };
}

function projectBindingFrom({
  recentProjects,
  currentProjectBinding,
  appStateSnapshot
}) {
  const binding = isPlainObject(currentProjectBinding) ? currentProjectBinding : null;
  const recent = isPlainObject(recentProjects) ? recentProjects : null;
  const snapshotProject = isPlainObject(appStateSnapshot?.current_project?.currentProject)
    ? appStateSnapshot.current_project.currentProject
    : null;
  const recentProject = Array.isArray(recent?.items) && recent.items.length > 0 && isPlainObject(recent.items[0])
    ? recent.items[0]
    : null;
  const projectId = firstNonEmptyString(
    binding?.selectedProjectId,
    snapshotProject?.project_id,
    recentProject?.projectId
  );
  const projectName = firstNonEmptyString(
    binding?.selectedProjectName,
    snapshotProject?.project_name,
    recentProject?.displayName
  );
  const sourceContract = firstNonEmptyString(
    binding?.contractName,
    snapshotProject === null ? recent?.contractName : APP_STATE_SNAPSHOT_CONTRACT_NAME,
    CURRENT_PROJECT_BINDING_CONTRACT_NAME
  );
  const sourceRef = sourceRefForContractObject(
    binding ?? (snapshotProject === null ? recent : appStateSnapshot),
    sourceContract
  );
  const mappedState = binding !== null
    ? mapCurrentProjectBindingState(binding)
    : snapshotProject !== null
      ? 'ready'
      : recent !== null
        ? mapRecentProjectsState(recent)
        : 'missing';
  const state = mappedState === 'ready' && projectId === null ? 'missing' : mappedState;
  const selected = state === 'ready' && projectId !== null;

  return {
    id: 'project-binding',
    label: 'Project Launcher',
    state,
    sourceContract,
    sourceRef,
    blockedReasons: reasonsForState({
      state,
      readyReason: 'project-binding-ready',
      defaultReason: reasonForProjectBindingState(state, binding, recent)
    }),
    reason: reasonForRefresh({
      state,
      readyReason: 'project-binding-ready',
      defaultReason: reasonForProjectBindingState(state, binding, recent)
    }),
    projectId: selected ? projectId : null,
    projectName: selected ? projectName : null,
    selected
  };
}

function appHomeStateFrom({
  appStateSnapshot,
  previous
}) {
  const waiting = waitingForPrevious(previous);

  if (waiting !== null) {
    return pendingStep({
      id: 'app-home',
      label: 'App Home',
      sourceContract: APP_STATE_SNAPSHOT_CONTRACT_NAME,
      sourceRef: sourceRefForContractName(APP_STATE_SNAPSHOT_CONTRACT_NAME),
      reason: waiting
    });
  }

  if (!isPlainObject(appStateSnapshot)) {
    return blockingStep({
      id: 'app-home',
      label: 'App Home',
      state: 'missing',
      sourceContract: APP_STATE_SNAPSHOT_CONTRACT_NAME,
      sourceRef: sourceRefForContractName(APP_STATE_SNAPSHOT_CONTRACT_NAME),
      reason: 'app-state-snapshot-missing'
    });
  }

  if (appStateSnapshot.freshness?.status === 'stale') {
    return blockingStep({
      id: 'app-home',
      label: 'App Home',
      state: 'stale',
      sourceContract: APP_STATE_SNAPSHOT_CONTRACT_NAME,
      sourceRef: sourceRefForContractObject(appStateSnapshot, APP_STATE_SNAPSHOT_CONTRACT_NAME),
      reason: 'app-state-snapshot-stale'
    });
  }

  if (appStateSnapshot.next_action?.status === 'blocked' || appStateSnapshot.current_task?.blocked === true) {
    return blockingStep({
      id: 'app-home',
      label: 'App Home',
      state: 'blocked',
      sourceContract: APP_STATE_SNAPSHOT_CONTRACT_NAME,
      sourceRef: sourceRefForContractObject(appStateSnapshot, APP_STATE_SNAPSHOT_CONTRACT_NAME),
      reason: firstNonEmptyString(
        appStateSnapshot.next_action?.reason,
        appStateSnapshot.current_task?.reason,
        'app-state-snapshot-blocked'
      )
    });
  }

  return readyStep({
    id: 'app-home',
    label: 'App Home',
    sourceContract: APP_STATE_SNAPSHOT_CONTRACT_NAME,
    sourceRef: sourceRefForContractObject(appStateSnapshot, APP_STATE_SNAPSHOT_CONTRACT_NAME),
    reason: 'app-home-ready'
  });
}

function supervisorStateFrom({
  projection,
  previous
}) {
  const waiting = waitingForPrevious(previous);

  if (waiting !== null) {
    return pendingStep({
      id: 'supervisor',
      label: 'Supervisor',
      sourceContract: GOAL_SUPERVISOR_APP_READ_MODEL_CONTRACT_NAME,
      sourceRef: supervisorRouteSourceRef(),
      reason: waiting
    });
  }

  if (!isPlainObject(projection)) {
    return blockingStep({
      id: 'supervisor',
      label: 'Supervisor',
      state: 'missing',
      sourceContract: GOAL_SUPERVISOR_APP_READ_MODEL_CONTRACT_NAME,
      sourceRef: supervisorRouteSourceRef(),
      reason: 'supervisor-read-model-missing'
    });
  }

  return readyStep({
    id: 'supervisor',
    label: 'Supervisor',
    sourceContract: GOAL_SUPERVISOR_APP_READ_MODEL_CONTRACT_NAME,
    sourceRef: supervisorRouteSourceRef(),
    reason: 'supervisor-ready'
  });
}

function contextAdvisoryStateFrom({
  contextAdvisory,
  previous
}) {
  const waiting = waitingForPrevious(previous);

  if (waiting !== null) {
    return pendingStep({
      id: 'context-advisory',
      label: 'Context Advisory',
      sourceContract: CONTEXT_ADVISORY_CONTRACT_NAME,
      sourceRef: sourceRefForContractName(CONTEXT_ADVISORY_CONTRACT_NAME),
      reason: waiting
    });
  }

  if (!isPlainObject(contextAdvisory)) {
    return blockingStep({
      id: 'context-advisory',
      label: 'Context Advisory',
      state: 'missing',
      sourceContract: CONTEXT_ADVISORY_CONTRACT_NAME,
      sourceRef: sourceRefForContractName(CONTEXT_ADVISORY_CONTRACT_NAME),
      reason: 'context-advisory-missing'
    });
  }

  const transcriptAvailability = firstNonEmptyString(contextAdvisory.transcriptAvailability);

  if (contextAdvisory.missingTranscriptState?.missing === true ||
      ['missing', 'unavailable'].includes(transcriptAvailability)) {
    return blockingStep({
      id: 'context-advisory',
      label: 'Context Advisory',
      state: 'missing',
      sourceContract: CONTEXT_ADVISORY_CONTRACT_NAME,
      sourceRef: sourceRefForContractObject(contextAdvisory, CONTEXT_ADVISORY_CONTRACT_NAME),
      reason: firstNonEmptyString(
        contextAdvisory.missingTranscriptState?.reason,
        transcriptAvailability === null ? null : `context-advisory-${transcriptAvailability}`,
        'context-advisory-missing'
      )
    });
  }

  if (transcriptAvailability === 'unreadable') {
    return blockingStep({
      id: 'context-advisory',
      label: 'Context Advisory',
      state: 'blocked',
      sourceContract: CONTEXT_ADVISORY_CONTRACT_NAME,
      sourceRef: sourceRefForContractObject(contextAdvisory, CONTEXT_ADVISORY_CONTRACT_NAME),
      reason: 'context-advisory-unreadable'
    });
  }

  if (contextAdvisory.staleTranscriptState?.stale === true ||
      transcriptAvailability === 'stale') {
    return blockingStep({
      id: 'context-advisory',
      label: 'Context Advisory',
      state: 'stale',
      sourceContract: CONTEXT_ADVISORY_CONTRACT_NAME,
      sourceRef: sourceRefForContractObject(contextAdvisory, CONTEXT_ADVISORY_CONTRACT_NAME),
      reason: firstNonEmptyString(
        contextAdvisory.staleTranscriptState?.reason,
        transcriptAvailability === 'stale' ? 'context-advisory-stale' : null,
        'context-advisory-stale'
      )
    });
  }

  if (transcriptAvailability === 'degraded') {
    return blockingStep({
      id: 'context-advisory',
      label: 'Context Advisory',
      state: 'degraded',
      sourceContract: CONTEXT_ADVISORY_CONTRACT_NAME,
      sourceRef: sourceRefForContractObject(contextAdvisory, CONTEXT_ADVISORY_CONTRACT_NAME),
      reason: 'context-advisory-degraded'
    });
  }

  if (Array.isArray(contextAdvisory.blockedFields) && contextAdvisory.blockedFields.length > 0) {
    return blockingStep({
      id: 'context-advisory',
      label: 'Context Advisory',
      state: 'blocked',
      sourceContract: CONTEXT_ADVISORY_CONTRACT_NAME,
      sourceRef: sourceRefForContractObject(contextAdvisory, CONTEXT_ADVISORY_CONTRACT_NAME),
      reason: `context-advisory-blocked:${contextAdvisory.blockedFields[0]}`
    });
  }

  if (Array.isArray(contextAdvisory.degradedReasons) && contextAdvisory.degradedReasons.length > 0) {
    return blockingStep({
      id: 'context-advisory',
      label: 'Context Advisory',
      state: 'degraded',
      sourceContract: CONTEXT_ADVISORY_CONTRACT_NAME,
      sourceRef: sourceRefForContractObject(contextAdvisory, CONTEXT_ADVISORY_CONTRACT_NAME),
      reason: firstNonEmptyString(
        contextAdvisory.degradedReasons[0],
        'context-advisory-degraded'
      )
    });
  }

  return readyStep({
    id: 'context-advisory',
    label: 'Context Advisory',
    sourceContract: CONTEXT_ADVISORY_CONTRACT_NAME,
    sourceRef: sourceRefForContractObject(contextAdvisory, CONTEXT_ADVISORY_CONTRACT_NAME),
    reason: 'context-advisory-ready'
  });
}

function resultIntakeStateFrom({
  pendingResult,
  previous
}) {
  const waiting = waitingForPrevious(previous);

  if (waiting !== null) {
    return pendingStep({
      id: 'result-intake',
      label: 'Result Intake',
      sourceContract: PENDING_RESULT_CONTRACT_NAME,
      sourceRef: sourceRefForContractName(PENDING_RESULT_CONTRACT_NAME),
      reason: waiting
    });
  }

  if (!isPlainObject(pendingResult)) {
    return blockingStep({
      id: 'result-intake',
      label: 'Result Intake',
      state: 'missing',
      sourceContract: PENDING_RESULT_CONTRACT_NAME,
      sourceRef: sourceRefForContractName(PENDING_RESULT_CONTRACT_NAME),
      reason: 'pending-result-missing'
    });
  }

  if (pendingResult.stale === true) {
    return blockingStep({
      id: 'result-intake',
      label: 'Result Intake',
      state: 'stale',
      sourceContract: PENDING_RESULT_CONTRACT_NAME,
      sourceRef: sourceRefForContractObject(pendingResult, PENDING_RESULT_CONTRACT_NAME),
      reason: 'pending-result-stale'
    });
  }

  if (pendingResult.missing === true || ['missing', 'unavailable'].includes(pendingResult.status)) {
    return blockingStep({
      id: 'result-intake',
      label: 'Result Intake',
      state: 'missing',
      sourceContract: PENDING_RESULT_CONTRACT_NAME,
      sourceRef: sourceRefForContractObject(pendingResult, PENDING_RESULT_CONTRACT_NAME),
      reason: firstNonEmptyString(pendingResult.parserReason, 'pending-result-missing')
    });
  }

  if (pendingResult.status === 'blocked' ||
      pendingResult.status === 'invalid' ||
      pendingResult.state === 'blocked' ||
      (Array.isArray(pendingResult.blockedReasons) && pendingResult.blockedReasons.length > 0)) {
    return blockingStep({
      id: 'result-intake',
      label: 'Result Intake',
      state: 'blocked',
      sourceContract: PENDING_RESULT_CONTRACT_NAME,
      sourceRef: sourceRefForContractObject(pendingResult, PENDING_RESULT_CONTRACT_NAME),
      reason: firstNonEmptyString(
        pendingResult.blockedReasons?.[0],
        pendingResult.parserReason,
        'pending-result-blocked'
      )
    });
  }

  if (['consumed', 'superseded'].includes(pendingResult.status)) {
    return blockingStep({
      id: 'result-intake',
      label: 'Result Intake',
      state: 'degraded',
      sourceContract: PENDING_RESULT_CONTRACT_NAME,
      sourceRef: sourceRefForContractObject(pendingResult, PENDING_RESULT_CONTRACT_NAME),
      reason: `pending-result-${pendingResult.status}`
    });
  }

  if (['pending', 'available'].includes(pendingResult.status)) {
    return readyStep({
      id: 'result-intake',
      label: 'Result Intake',
      sourceContract: PENDING_RESULT_CONTRACT_NAME,
      sourceRef: sourceRefForContractObject(pendingResult, PENDING_RESULT_CONTRACT_NAME),
      reason: 'result-intake-ready'
    });
  }

  return blockingStep({
    id: 'result-intake',
    label: 'Result Intake',
    state: 'degraded',
    sourceContract: PENDING_RESULT_CONTRACT_NAME,
    sourceRef: sourceRefForContractObject(pendingResult, PENDING_RESULT_CONTRACT_NAME),
    reason: 'pending-result-status-unknown'
  });
}

function eventPreviewStateFrom({
  eventRegistrationEligibility,
  previous
}) {
  const eligibility = isPlainObject(eventRegistrationEligibility) ? eventRegistrationEligibility : null;
  const waiting = waitingForPrevious(previous);

  if (waiting !== null) {
    return pendingStep({
      id: 'event-preview',
      label: 'Event Preview',
      sourceContract: SUPERVISOR_EVENT_REGISTRATION_ELIGIBILITY_CONTRACT_NAME,
      sourceRef: eventPreviewRouteSourceRef(),
      reason: waiting
    });
  }

  if (eligibility === null) {
    return blockingStep({
      id: 'event-preview',
      label: 'Event Preview',
      state: 'missing',
      sourceContract: SUPERVISOR_EVENT_REGISTRATION_ELIGIBILITY_CONTRACT_NAME,
      sourceRef: eventPreviewRouteSourceRef(),
      reason: 'event-preview-eligibility-missing'
    });
  }

  if (eligibility.state === 'eligible') {
    return readyStep({
      id: 'event-preview',
      label: 'Event Preview',
      sourceContract: SUPERVISOR_EVENT_REGISTRATION_ELIGIBILITY_CONTRACT_NAME,
      sourceRef: eventPreviewRouteSourceRef(),
      reason: 'event-preview-ready'
    });
  }

  if (eligibility.state === 'blocked') {
    return blockingStep({
      id: 'event-preview',
      label: 'Event Preview',
      state: 'blocked',
      sourceContract: SUPERVISOR_EVENT_REGISTRATION_ELIGIBILITY_CONTRACT_NAME,
      sourceRef: eventPreviewRouteSourceRef(),
      reason: firstNonEmptyString(eligibility.reason, 'event-preview-not-eligible')
    });
  }

  if (eligibility.state === 'not-applicable') {
    return pendingStep({
      id: 'event-preview',
      label: 'Event Preview',
      sourceContract: SUPERVISOR_EVENT_REGISTRATION_ELIGIBILITY_CONTRACT_NAME,
      sourceRef: eventPreviewRouteSourceRef(),
      reason: firstNonEmptyString(waiting, 'awaiting-result-intake')
    });
  }

  return blockingStep({
    id: 'event-preview',
    label: 'Event Preview',
    state: 'degraded',
    sourceContract: SUPERVISOR_EVENT_REGISTRATION_ELIGIBILITY_CONTRACT_NAME,
    sourceRef: eventPreviewRouteSourceRef(),
    reason: 'event-preview-eligibility-degraded'
  });
}

function eventConfirmStateFrom({
  eventRegistrationEligibility,
  previous
}) {
  const eligibility = isPlainObject(eventRegistrationEligibility) ? eventRegistrationEligibility : null;

  if (previous.state !== 'ready') {
    return pendingStep({
      id: 'event-confirm',
      label: 'Event Confirm',
      sourceContract: SUPERVISOR_EVENT_REGISTRATION_ELIGIBILITY_CONTRACT_NAME,
      sourceRef: eventConfirmSourceRef(),
      reason: reasonForAwaitingStep(previous, 'event-preview')
    });
  }

  if (eligibility === null) {
    return blockingStep({
      id: 'event-confirm',
      label: 'Event Confirm',
      state: 'missing',
      sourceContract: SUPERVISOR_EVENT_REGISTRATION_ELIGIBILITY_CONTRACT_NAME,
      sourceRef: eventConfirmSourceRef(),
      reason: 'event-confirm-eligibility-missing'
    });
  }

  if (isPlainObject(eligibility.confirmRequestShape)) {
    return readyStep({
      id: 'event-confirm',
      label: 'Event Confirm',
      sourceContract: SUPERVISOR_EVENT_REGISTRATION_ELIGIBILITY_CONTRACT_NAME,
      sourceRef: eventConfirmSourceRef(),
      reason: 'event-confirm-shape-ready'
    });
  }

  if (eligibility.state === 'eligible') {
    return blockingStep({
      id: 'event-confirm',
      label: 'Event Confirm',
      state: 'degraded',
      sourceContract: SUPERVISOR_EVENT_REGISTRATION_ELIGIBILITY_CONTRACT_NAME,
      sourceRef: eventConfirmSourceRef(),
      reason: 'event-confirm-shape-missing'
    });
  }

  return pendingStep({
    id: 'event-confirm',
    label: 'Event Confirm',
    sourceContract: SUPERVISOR_EVENT_REGISTRATION_ELIGIBILITY_CONTRACT_NAME,
    sourceRef: eventConfirmSourceRef(),
    reason: 'awaiting-event-preview'
  });
}

function closeoutStateFrom({
  goalCloseout,
  currentGate,
  previous
}) {
  if (previous.state !== 'ready') {
    return pendingStep({
      id: 'closeout',
      label: 'Closeout',
      sourceContract: GOAL_CLOSEOUT_REPORT_CONTRACT_NAME,
      sourceRef: sourceRefForContractName(GOAL_CLOSEOUT_REPORT_CONTRACT_NAME),
      reason: reasonForAwaitingStep(previous, 'event-confirm')
    });
  }

  if (currentGate?.status === 'blocked') {
    return blockingStep({
      id: 'closeout',
      label: 'Closeout',
      state: 'blocked',
      sourceContract: GOAL_SUPERVISOR_APP_READ_MODEL_CONTRACT_NAME,
      sourceRef: supervisorRouteSourceRef(),
      reason: firstNonEmptyString(
        currentGate.blockingReason,
        currentGate.closeoutAuthorizationState,
        'current-gate-blocked'
      )
    });
  }

  if (goalCloseout === undefined) {
    return pendingStep({
      id: 'closeout',
      label: 'Closeout',
      sourceContract: GOAL_CLOSEOUT_REPORT_CONTRACT_NAME,
      sourceRef: sourceRefForContractName(GOAL_CLOSEOUT_REPORT_CONTRACT_NAME),
      reason: 'awaiting-manual-review-gate'
    });
  }

  if (!isPlainObject(goalCloseout)) {
    return blockingStep({
      id: 'closeout',
      label: 'Closeout',
      state: 'missing',
      sourceContract: GOAL_CLOSEOUT_REPORT_CONTRACT_NAME,
      sourceRef: sourceRefForContractName(GOAL_CLOSEOUT_REPORT_CONTRACT_NAME),
      reason: 'closeout-report-missing'
    });
  }

  if (Array.isArray(goalCloseout.missing) && goalCloseout.missing.length > 0) {
    return blockingStep({
      id: 'closeout',
      label: 'Closeout',
      state: 'blocked',
      sourceContract: GOAL_CLOSEOUT_REPORT_CONTRACT_NAME,
      sourceRef: sourceRefForContractObject(goalCloseout, GOAL_CLOSEOUT_REPORT_CONTRACT_NAME),
      reason: 'closeout-evidence-missing'
    });
  }

  if (Array.isArray(goalCloseout.missing)) {
    return readyStep({
      id: 'closeout',
      label: 'Closeout',
      sourceContract: GOAL_CLOSEOUT_REPORT_CONTRACT_NAME,
      sourceRef: sourceRefForContractObject(goalCloseout, GOAL_CLOSEOUT_REPORT_CONTRACT_NAME),
      reason: 'closeout-ready'
    });
  }

  return blockingStep({
    id: 'closeout',
    label: 'Closeout',
    state: 'degraded',
    sourceContract: GOAL_CLOSEOUT_REPORT_CONTRACT_NAME,
    sourceRef: sourceRefForContractObject(goalCloseout, GOAL_CLOSEOUT_REPORT_CONTRACT_NAME),
    reason: 'closeout-report-degraded'
  });
}

function readyStep({
  id,
  label,
  sourceContract,
  sourceRef,
  reason
}) {
  return {
    id,
    label,
    state: 'ready',
    sourceContract,
    sourceRef,
    blockedReasons: [],
    reason
  };
}

function pendingStep({
  id,
  label,
  sourceContract,
  sourceRef,
  reason
}) {
  return {
    id,
    label,
    state: 'pending',
    sourceContract,
    sourceRef,
    blockedReasons: [],
    reason
  };
}

function blockingStep({
  id,
  label,
  state,
  sourceContract,
  sourceRef,
  reason
}) {
  return {
    id,
    label,
    state,
    sourceContract,
    sourceRef,
    blockedReasons: [reason],
    reason
  };
}

function currentTaskFrom({
  tasks,
  projection,
  appStateSnapshot
}) {
  const normalizedTasks = Array.isArray(tasks) ? tasks.filter(isPlainObject) : [];
  const taskId = firstNonEmptyString(
    projection?.current?.taskId,
    projection?.route?.current?.taskId,
    appStateSnapshot?.current_task?.task_id,
    normalizedTasks[0]?.taskId
  );
  const matchedTask = taskId === null
    ? null
    : normalizedTasks.find((task) => task.taskId === taskId);

  return {
    taskId,
    taskLabel: firstNonEmptyString(
      appStateSnapshot?.current_task?.title,
      matchedTask?.title,
      normalizedTasks[0]?.title
    )
  };
}

function mapCurrentProjectBindingState(binding) {
  if (binding.state === 'bound') {
    return 'ready';
  }

  if (binding.state === 'stale') {
    return 'stale';
  }

  if (['missing', 'unbound'].includes(binding.state)) {
    return 'missing';
  }

  if (binding.state === 'failed') {
    return 'blocked';
  }

  return 'degraded';
}

function mapRecentProjectsState(recentProjects) {
  if (recentProjects.state === 'available') {
    return 'ready';
  }

  if (recentProjects.state === 'stale') {
    return 'stale';
  }

  if (recentProjects.state === 'degraded') {
    return 'degraded';
  }

  if (recentProjects.state === 'failed') {
    return 'blocked';
  }

  return 'missing';
}

function reasonForProjectBindingState(state, binding, recentProjects) {
  if (state === 'ready') {
    return 'project-binding-ready';
  }

  if (state === 'stale') {
    return 'project-binding-stale';
  }

  if (state === 'degraded') {
    return firstNonEmptyString(
      recentProjects?.items?.[0]?.degradedReason,
      binding?.fallbackReason,
      'project-binding-degraded'
    );
  }

  if (state === 'blocked') {
    return firstNonEmptyString(
      binding?.fallbackReason,
      recentProjects?.source?.degradedReason,
      'project-binding-blocked'
    );
  }

  return firstNonEmptyString(
    binding?.fallbackReason,
    recentProjects?.source?.degradedReason,
    'project-binding-missing'
  );
}

function reasonsForState({
  state,
  readyReason,
  defaultReason
}) {
  return ['blocked', 'missing', 'stale', 'degraded'].includes(state)
    ? [firstNonEmptyString(defaultReason, readyReason)]
    : [];
}

function reasonForRefresh({
  state,
  readyReason,
  defaultReason
}) {
  return firstNonEmptyString(defaultReason, readyReason, `${state}-state`);
}

function waitingForPrevious(previous) {
  if (!isPlainObject(previous) || previous.state === 'ready') {
    return null;
  }

  return reasonForAwaitingStep(previous, previous.id);
}

function reasonForAwaitingStep(previous, fallbackStepId) {
  if (previous.state === 'pending') {
    return firstNonEmptyString(previous.reason, `awaiting-${fallbackStepId}`);
  }

  return `awaiting-${fallbackStepId}`;
}

function stateForGoal(steps) {
  const states = steps.map((step) => step.state);

  for (const state of ['blocked', 'missing', 'stale', 'degraded']) {
    if (states.includes(state)) {
      return state;
    }
  }

  if (states.includes('pending') && states.includes('manual-required')) {
    return 'manual-required';
  }

  if (states.includes('pending')) {
    return 'pending';
  }

  return 'ready';
}

function sourceContractForGoal(steps) {
  return sourceStepForGoal(steps)?.sourceContract ?? GOAL_SUPERVISOR_APP_READ_MODEL_CONTRACT_NAME;
}

function sourceRefForGoal(steps) {
  return sourceStepForGoal(steps)?.sourceRef ?? supervisorRouteSourceRef();
}

function sourceStepForGoal(steps) {
  return steps.find((step) => ['blocked', 'missing', 'stale', 'degraded'].includes(step.state)) ??
    steps.find((step) => step.state === 'pending') ??
    steps.find((step) => step.id === 'supervisor') ??
    null;
}

function buildSystemGoldenPathSourceContracts({
  steps,
  sourceContracts,
  recentProjects,
  currentProjectBinding,
  appStateSnapshot,
  contextAdvisory,
  pendingResult,
  eventRegistrationEligibility,
  goalCloseout
}) {
  const records = new Map();
  const contractObjects = [
    recentProjects,
    currentProjectBinding,
    appStateSnapshot,
    contextAdvisory,
    pendingResult,
    eventRegistrationEligibility,
    goalCloseout
  ].filter(isPlainObject);

  for (const step of steps) {
    addSystemGoldenPathSourceContract(records, {
      contractName: step.sourceContract,
      requiredFor: [step.id],
      sourceRef: contractSourceRefForStep(step),
      contractObject: contractObjects.find((contract) => contract.contractName === step.sourceContract)
    });
  }

  for (const contract of normalizeContractRefs(sourceContracts)) {
    addSystemGoldenPathSourceContract(records, {
      contractName: contract.contractName,
      requiredFor: [],
      sourceRef: sourceRefForContractName(contract.contractName),
      contractObject: contract
    });
  }

  return [...records.values()].map((record) => stripEmptyObject({
    contractName: record.contractName,
    contractVersion: record.contractVersion,
    readOnly: true,
    generatedAt: record.generatedAt,
    requiredFor: record.requiredFor.length > 0 ? record.requiredFor : undefined,
    sourceRef: record.sourceRef
  }));
}

function addSystemGoldenPathSourceContract(records, {
  contractName,
  requiredFor,
  sourceRef,
  contractObject
}) {
  const safeName = safeContractName(contractName);

  if (safeName === null) {
    return;
  }

  const existing = records.get(safeName) ?? {
    contractName: safeName,
    contractVersion: knownContractVersion(safeName),
    generatedAt: null,
    requiredFor: [],
    sourceRef: null
  };
  const version = Number.isInteger(contractObject?.contractVersion)
    ? contractObject.contractVersion
    : knownContractVersion(safeName);
  const generatedAt = safeTimestamp(contractObject?.generatedAt);

  existing.contractVersion = Number.isInteger(existing.contractVersion)
    ? existing.contractVersion
    : version;
  existing.generatedAt = existing.generatedAt ?? generatedAt;
  existing.requiredFor = uniqueStrings([
    ...existing.requiredFor,
    ...(Array.isArray(requiredFor) ? requiredFor : [])
  ]);
  existing.sourceRef = preferredSourceRef(existing.sourceRef, sourceRef);

  records.set(safeName, existing);
}

function preferredSourceRef(existing, candidate) {
  if (!isPlainObject(existing)) {
    return candidate ?? null;
  }

  if (!isPlainObject(candidate)) {
    return existing;
  }

  if (existing.kind !== 'contract' && candidate.kind === 'contract') {
    return candidate;
  }

  return existing;
}

function contractSourceRefForStep(step) {
  if (step.sourceContract === SUPERVISOR_EVENT_REGISTRATION_ELIGIBILITY_CONTRACT_NAME) {
    return sourceRefForContractName(SUPERVISOR_EVENT_REGISTRATION_ELIGIBILITY_CONTRACT_NAME);
  }

  if (step.sourceContract === GOAL_SUPERVISOR_APP_READ_MODEL_CONTRACT_NAME) {
    return supervisorRouteSourceRef();
  }

  return step.sourceRef;
}

function knownContractVersion(contractName) {
  if (contractName === RECENT_PROJECTS_CONTRACT_NAME ||
      contractName === CURRENT_PROJECT_BINDING_CONTRACT_NAME) {
    return PROJECT_REGISTRY_CONTRACT_VERSION;
  }

  if (contractName === APP_STATE_SNAPSHOT_CONTRACT_NAME) {
    return APP_STATE_SNAPSHOT_CONTRACT_VERSION;
  }

  if (contractName === PENDING_RESULT_CONTRACT_NAME) {
    return PENDING_RESULT_CONTRACT_VERSION;
  }

  if (contractName === GOAL_SUPERVISOR_APP_READ_MODEL_CONTRACT_NAME) {
    return GOAL_SUPERVISOR_APP_READ_MODEL_CONTRACT_VERSION;
  }

  if (contractName === CONTEXT_ADVISORY_CONTRACT_NAME) {
    return CONTEXT_ADVISORY_CONTRACT_VERSION;
  }

  if (contractName === SUPERVISOR_EVENT_REGISTRATION_ELIGIBILITY_CONTRACT_NAME) {
    return SUPERVISOR_EVENT_REGISTRATION_ELIGIBILITY_CONTRACT_VERSION;
  }

  if (contractName === GOAL_CLOSEOUT_REPORT_CONTRACT_NAME) {
    return GOAL_CLOSEOUT_REPORT_CONTRACT_VERSION;
  }

  return undefined;
}

function sourceRefForContractObject(contractObject, fallbackContractName) {
  const contractName = firstNonEmptyString(contractObject?.contractName, fallbackContractName);
  const sourceRef = sourceRefForContractName(contractName);
  const generatedAt = safeTimestamp(contractObject?.generatedAt);

  return generatedAt === null
    ? sourceRef
    : {
        ...sourceRef,
        generatedAt
      };
}

function sourceRefForContractName(contractName) {
  if (contractName === GOAL_SUPERVISOR_APP_READ_MODEL_CONTRACT_NAME) {
    return supervisorRouteSourceRef();
  }

  return {
    kind: 'contract',
    ref: contractName
  };
}

function supervisorRouteSourceRef() {
  return {
    kind: 'route',
    ref: '/api/goals/<goal-id>/supervisor'
  };
}

function eventPreviewRouteSourceRef() {
  return {
    kind: 'route',
    ref: '/api/goals/<goal-id>/event-plan-preview'
  };
}

function eventConfirmSourceRef() {
  return {
    kind: 'contract',
    ref: 'supervisorEventRegistrationEligibility.v1:confirmRequestShape'
  };
}

function buildGoalSnapshot({
  goalId,
  title,
  tasks,
  projection,
  sourceContracts,
  generatedAt,
  currentGate
}) {
  const normalizedTasks = Array.isArray(tasks) ? tasks.filter(isPlainObject) : [];
  const completedCount = normalizedTasks.filter(isCompletedTaskStatus).length;
  const current = projection.current ?? projection.route?.current ?? {};
  const blockerCount = [
    projection.route?.state === 'blocked',
    currentGate?.status === 'blocked'
  ].filter(Boolean).length;

  return {
    goalId,
    title: nonEmptyString(title) ? title : null,
    totalTaskCount: normalizedTasks.length,
    completedCount,
    activeTask: nonEmptyString(current?.taskId) ? current.taskId : null,
    activeRole: nonEmptyString(current?.role) ? current.role : null,
    releaseReadiness: projection.route?.state === 'complete' ? 'ready' : 'not-ready',
    blockerCount,
    sourceContracts: safeSourceContractNames(sourceContracts),
    generatedAt
  };
}

function buildGoalTimeline({
  timelineEvents,
  state
}) {
  const explicitEvents = Array.isArray(timelineEvents) ? timelineEvents : [];
  const stateResults = Array.isArray(state?.results) ? state.results : [];
  const projectedResults = stateResults
    .filter(isPlainObject)
    .map((entry, index) => {
      const result = entry.result ?? entry.record ?? {};
      return {
        eventId: firstNonEmptyString(entry.eventId, result.recordId, `recorded-result-${index}`),
        taskId: result.taskId ?? null,
        role: result.role ?? null,
        status: entry.consumed === true ? 'consumed' : 'pending',
        evidenceRef: result.evidenceRef ?? null,
        hashChainState: entry.hashChainState ?? null,
        occurredAt: entry.recordedAt ?? result.generatedAt ?? null
      };
    });

  return [...explicitEvents, ...projectedResults]
    .filter(isPlainObject)
    .map((event, index) => ({
      eventId: firstNonEmptyString(event.eventId, `event-${index}`),
      taskId: event.taskId ?? null,
      role: event.role ?? null,
      status: event.status ?? null,
      evidenceRef: event.evidenceRef ?? null,
      hashChainState: event.hashChainState ?? null,
      occurredAt: event.occurredAt ?? null
    }));
}

function normalizeActiveLease({
  active,
  routeInput,
  nowMs
}) {
  const lease = isPlainObject(active) ? active : {};
  const routeLease = isPlainObject(routeInput?.activeLease) ? routeInput.activeLease : {};
  const startedAt = firstNonEmptyString(lease.startedAt, lease.createdAt, routeLease.startedAt, routeLease.createdAt);
  const updatedAt = firstNonEmptyString(lease.updatedAt, routeLease.updatedAt, startedAt);
  const ageMs = updatedAt === null ? null : Math.max(0, nowMs - Date.parse(updatedAt));

  return {
    leaseId: firstNonEmptyString(lease.leaseId, routeLease.leaseId),
    threadId: firstNonEmptyString(lease.threadId, routeLease.threadId),
    taskId: firstNonEmptyString(lease.taskId, routeLease.taskId),
    role: firstNonEmptyString(lease.role, routeLease.role),
    phase: firstNonEmptyString(lease.phase, routeLease.phase),
    status: firstNonEmptyString(lease.status, routeLease.status, routeLease.live === true ? 'thread-active' : 'none'),
    startedAt,
    updatedAt,
    ageMs: Number.isFinite(ageMs) ? ageMs : null,
    duplicateDispatchGuard: isPlainObject(routeInput?.dispatchGuard)
      ? {
          blocked: routeInput.dispatchGuard.blocked === true,
          reason: routeInput.dispatchGuard.reason ?? null
        }
      : {
          blocked: false,
          reason: 'not-evaluated'
        }
  };
}

function normalizePendingResult({
  projection,
  routeInput,
  pendingResultState = null
}) {
  const contracted = firstPendingResultContract(
    pendingResultState,
    routeInput?.pendingResult
  );

  if (contracted !== null) {
    return normalizeContractedPendingResult(contracted);
  }

  const intake = routeInput?.resultIntake ?? routeInput?.resultAvailability ?? null;
  const projected = projection.route?.pendingResult ?? projection.progress?.pendingResult ?? null;
  const record = intake?.record ?? projected?.result ?? null;

  if (isPlainObject(intake)) {
    return {
      source: intake.source ?? null,
      status: intake.status ?? 'unavailable',
      eventToRegister: record?.eventToRegister ?? null,
      evidenceRef: record?.evidenceRef ?? null,
      parserReason: intake.reason ?? null,
      stale: false,
      missing: intake.status === 'missing',
      resultId: record?.recordId ?? null
    };
  }

  if (isPlainObject(projected)) {
    return {
      source: projected.source ?? 'recorded-result-state',
      status: 'pending',
      eventToRegister: record?.eventToRegister ?? null,
      evidenceRef: record?.evidenceRef ?? null,
      parserReason: 'valid-result-awaits-registration',
      stale: false,
      missing: false,
      resultId: record?.recordId ?? null
    };
  }

  return {
    source: null,
    status: 'missing',
    eventToRegister: null,
    evidenceRef: null,
    parserReason: 'no-recorded-result-source',
    stale: false,
    missing: true,
    resultId: null
  };
}

function pendingResultRecordFromProjection({
  projection,
  routeInput,
  pendingResultState = null
}) {
  const contracted = firstPendingResultContract(
    pendingResultState,
    routeInput?.pendingResult
  );

  if (contracted !== null) {
    return pendingResultRecordFromContract(contracted);
  }

  const intake = routeInput?.resultIntake ?? routeInput?.resultAvailability ?? null;
  const projected = projection.route?.pendingResult ?? projection.progress?.pendingResult ?? null;
  const record = intake?.record ?? projected?.result ?? null;

  return isPlainObject(record) ? record : null;
}

function firstPendingResultContract(...values) {
  return values.find((value) => (
    isPlainObject(value) &&
    value.contractName === PENDING_RESULT_CONTRACT_NAME
  )) ?? null;
}

function normalizeContractedPendingResult(pendingResult) {
  const evidenceRefs = normalizeControlledEvidenceRefs(pendingResult.evidenceRefs);
  const eventCandidate = normalizePendingResultEventCandidate(
    pendingResult.eventCandidate,
    evidenceRefs
  );
  const state = PENDING_RESULT_STATES.has(pendingResult.state)
    ? pendingResult.state
    : 'blocked';
  const status = pendingResultRegistrationStatus({
    state,
    eventCandidate
  });
  const evidenceRef = evidenceRefs
    .map(stringifyControlledEvidenceRef)
    .find(nonEmptyString) ?? null;

  return {
    contractName: PENDING_RESULT_CONTRACT_NAME,
    contractVersion: Number.isInteger(pendingResult.contractVersion) ? pendingResult.contractVersion : null,
    goalId: firstNonEmptyString(pendingResult.goalId),
    taskId: firstNonEmptyString(pendingResult.taskId),
    workerRole: firstNonEmptyString(pendingResult.workerRole),
    source: firstNonEmptyString(pendingResult.source),
    status,
    state,
    escrowRef: safeDisplayRef(pendingResult.escrowRef),
    sanitizedSummary: normalizeSanitizedSummary(pendingResult.sanitizedSummary),
    evidenceRefs,
    eventCandidate,
    eventToRegister: eventCandidate.eventType,
    evidenceRef,
    parserReason: firstNonEmptyString(eventCandidate.reason, pendingResult.blockedReasons?.[0], 'pending-result-v1'),
    stale: false,
    missing: false,
    resultId: safeDisplayRef(pendingResult.escrowRef),
    blockedReasons: uniqueStrings(Array.isArray(pendingResult.blockedReasons) ? pendingResult.blockedReasons : []),
    sourceContracts: normalizePendingResultSourceContracts(pendingResult.sourceContracts),
    boundaries: normalizePendingResultBoundaries(pendingResult.boundaries)
  };
}

function pendingResultRecordFromContract(pendingResult) {
  const evidenceRefs = normalizeControlledEvidenceRefs(pendingResult.evidenceRefs);
  const eventCandidate = normalizePendingResultEventCandidate(
    pendingResult.eventCandidate,
    evidenceRefs
  );
  const evidenceRef = evidenceRefs
    .map(stringifyControlledEvidenceRef)
    .find(nonEmptyString) ?? null;
  const summary = normalizeSanitizedSummary(pendingResult.sanitizedSummary);

  return {
    contractName: PENDING_RESULT_CONTRACT_NAME,
    contractVersion: Number.isInteger(pendingResult.contractVersion) ? pendingResult.contractVersion : null,
    goalId: firstNonEmptyString(pendingResult.goalId),
    taskId: firstNonEmptyString(pendingResult.taskId),
    role: firstNonEmptyString(pendingResult.workerRole),
    eventToRegister: eventCandidate.eventType,
    evidenceRef,
    evidenceRefs,
    statement: firstNonEmptyString(summary.summary),
    blocker: eventCandidate.blocker,
    sourceContracts: normalizePendingResultSourceContracts(pendingResult.sourceContracts),
    escrowRef: safeDisplayRef(pendingResult.escrowRef)
  };
}

function pendingResultRegistrationStatus({
  state,
  eventCandidate
}) {
  if (state === 'consumed' || state === 'superseded') {
    return state;
  }

  if (!PENDING_RESULT_UPDATE_EVENTS.has(eventCandidate.eventType) &&
      eventCandidate.command !== 'review' &&
      eventCandidate.command !== 'gate') {
    return 'invalid';
  }

  return 'pending';
}

function normalizeSanitizedSummary(summary) {
  const source = isPlainObject(summary) ? summary : {};

  return stripEmptyObject({
    status: safeSummaryText(source.status) ?? 'unknown',
    summary: safeSummaryText(source.summary),
    changedFiles: safeSummaryStrings(source.changedFiles, safeDisplayRef),
    validationCommands: safeSummaryStrings(source.validationCommands, safeSummaryText),
    evidenceRefs: normalizeControlledEvidenceRefs(source.evidenceRefs),
    blockerReason: safeSummaryText(source.blockerReason),
    risks: safeSummaryStrings(source.risks, safeSummaryText),
    blockers: safeSummaryStrings(source.blockers, safeSummaryText)
  });
}

function normalizePendingResultEventCandidate(candidate, fallbackEvidenceRefs) {
  const event = isPlainObject(candidate) ? candidate : {};
  const evidenceRefs = normalizeControlledEvidenceRefs(event.evidenceRefs);
  const eventType = firstNonEmptyString(event.eventType);

  return stripEmptyObject({
    eventType,
    taskId: firstNonEmptyString(event.taskId),
    workerRole: firstNonEmptyString(event.workerRole),
    command: firstNonEmptyString(event.command),
    commandName: firstNonEmptyString(event.commandName),
    requiresEvidence: event.requiresEvidence === true,
    evidenceRefs: evidenceRefs.length > 0 ? evidenceRefs : fallbackEvidenceRefs,
    blocker: normalizePendingResultBlocker(event.blocker),
    willAppendGoalEvent: false,
    state: firstNonEmptyString(event.state, 'not-applicable'),
    reason: firstNonEmptyString(event.reason)
  });
}

function normalizePendingResultBlocker(blocker) {
  const source = isPlainObject(blocker) ? blocker : {};
  const normalized = stripEmptyObject({
    blockerId: firstNonEmptyString(source.blockerId),
    reason: safeSummaryText(source.reason),
    severity: safeSummaryText(source.severity)
  });

  return Object.keys(normalized).length === 0 ? null : normalized;
}

function normalizeControlledEvidenceRefs(evidenceRefs) {
  return (Array.isArray(evidenceRefs) ? evidenceRefs : [])
    .map(normalizeControlledEvidenceRef)
    .filter((evidenceRef) => evidenceRef !== null);
}

function normalizeControlledEvidenceRef(evidenceRef) {
  if (!isPlainObject(evidenceRef)) {
    return null;
  }

  const kind = firstNonEmptyString(evidenceRef.kind);
  const ref = safeDisplayRef(evidenceRef.ref);
  const label = safeSummaryText(evidenceRef.label);

  if (!['repo-doc', 'artifact-ref', 'commit', 'command-evidence', 'external-note'].includes(kind) ||
      ref === null ||
      label === null) {
    return null;
  }

  if (kind === 'repo-doc' && !ref.startsWith('docs/plans/')) {
    return null;
  }

  return { kind, ref, label };
}

function stringifyControlledEvidenceRef(evidenceRef) {
  if (!isPlainObject(evidenceRef)) {
    return null;
  }

  if (evidenceRef.kind === 'repo-doc') {
    return evidenceRef.ref;
  }

  if (evidenceRef.kind === 'artifact-ref') {
    return `artifact-ref:${evidenceRef.ref}`;
  }

  return null;
}

function normalizePendingResultSourceContracts(sourceContracts) {
  return (Array.isArray(sourceContracts) ? sourceContracts : [])
    .map((contract) => {
      if (!isPlainObject(contract)) {
        return null;
      }

      const contractName = safeContractName(contract.contractName);

      if (contractName === null) {
        return null;
      }

      return stripEmptyObject({
        contractName,
        contractVersion: Number.isInteger(contract.contractVersion) ? contract.contractVersion : null,
        escrowRef: safeDisplayRef(contract.escrowRef),
        previewPlanHash: safeHash(contract.previewPlanHash),
        generatedAt: safeTimestamp(contract.generatedAt),
        readOnly: true
      });
    })
    .filter((contract) => contract !== null);
}

function pendingResultSourceContracts(pendingResult) {
  if (!isPlainObject(pendingResult) || pendingResult.contractName !== PENDING_RESULT_CONTRACT_NAME) {
    return [];
  }

  return [
    {
      contractName: PENDING_RESULT_CONTRACT_NAME,
      contractVersion: pendingResult.contractVersion,
      readOnly: true
    },
    ...normalizePendingResultSourceContracts(pendingResult.sourceContracts).map((contract) => ({
      contractName: contract.contractName ?? RESULT_EVIDENCE_ESCROW_CONTRACT_NAME,
      contractVersion: contract.contractVersion ?? null,
      readOnly: true
    }))
  ];
}

function normalizePendingResultBoundaries(boundaries) {
  return {
    providerExecutionAvailable: false,
    childDispatchAvailable: false,
    directGoalEventAppendAvailable: false,
    untrustedTranscriptProjectionAvailable: false,
    frontendLocalFileReadAvailable: false,
    reviewerMutationAvailable: false,
    mainVerificationMutationAvailable: false,
    releaseGateMutationAvailable: false,
    gitMutationAvailable: false,
    githubReleaseAutomationAvailable: false,
    projectionAppendsGoalEvent: false
  };
}

function safeSummaryStrings(values, sanitizer) {
  return (Array.isArray(values) ? values : [])
    .map((value) => sanitizer(value))
    .filter(nonEmptyString);
}

function safeSummaryText(value) {
  const ref = safeDisplayRef(value);

  if (ref === null || /raw[\s_-]*transcript|raw[\s_-]*model[\s_-]*output|provider[\s_-]*session|session[\s_-]*log/iu.test(ref)) {
    return null;
  }

  return ref;
}

function safeHash(value) {
  if (!nonEmptyString(value)) {
    return null;
  }

  const trimmed = value.trim();

  return /^sha256:[a-f0-9]{64}$/u.test(trimmed) ? trimmed : null;
}

function normalizeCurrentGate({
  currentGate,
  route,
  goalNext
}) {
  if (isPlainObject(currentGate)) {
    return {
      gateId: currentGate.gateId ?? null,
      requiredCommandFamily: currentGate.requiredCommandFamily ?? null,
      status: currentGate.status ?? 'unknown',
      evidenceRequirement: currentGate.evidenceRequirement ?? null,
      blockingReason: currentGate.blockingReason ?? null,
      closeoutAuthorizationState: currentGate.closeoutAuthorizationState ?? 'not-requested'
    };
  }

  const role = route?.current?.role ?? goalNext?.next?.role ?? null;
  const phase = route?.current?.phase ?? goalNext?.next?.phase ?? null;
  const closeoutBlocked = route?.reason === 'release-closeout-requires-operator-authorization';

  return {
    gateId: role === 'release-manager' ? phase : null,
    requiredCommandFamily: role === 'release-manager' ? 'release-gate' : null,
    status: closeoutBlocked ? 'blocked' : 'not-active',
    evidenceRequirement: role === 'release-manager' ? 'release-manager-result-block' : null,
    blockingReason: closeoutBlocked ? route.reason : null,
    closeoutAuthorizationState: closeoutBlocked ? 'blocked-without-operator-authorization' : 'not-requested'
  };
}

function normalizeOwnership({
  ownership,
  activePr,
  branch
}) {
  return {
    orchestrationOwner: ownership.orchestrationOwner ?? 'local-goal-supervisor-daemon',
    deliveryBoundary: ownership.deliveryBoundary ?? 'pull-request',
    activePr: ownership.activePr ?? activePr ?? null,
    branch: ownership.branch ?? branch ?? null,
    rollbackBoundary: ownership.rollbackBoundary ?? 'pull-request',
    daemonState: ownership.daemonState ?? 'external-orchestration-owner',
    controllerInterventionReason: ownership.controllerInterventionReason ?? null
  };
}

function normalizeContextStatus(sessionContext, projection) {
  const context = isPlainObject(sessionContext) ? sessionContext : {};
  const routeThread = projection.routeInput?.thread ?? null;
  const transcriptAvailability = context.transcriptAvailability ?? routeThread?.status ?? 'missing';
  const latestToolCall = isPlainObject(context.latestToolCall)
    ? {
        name: context.latestToolCall.name ?? null,
        status: context.latestToolCall.status ?? null,
        updatedAt: context.latestToolCall.updatedAt ?? null
      }
    : null;

  return {
    sessionSourceSummaries: Array.isArray(context.sessionSourceSummaries)
      ? context.sessionSourceSummaries.map((source) => ({
          provider: source.provider ?? null,
          status: source.status ?? 'unknown',
          threadId: source.threadId ?? null,
          latestTurnAt: source.latestTurnAt ?? null
        }))
      : [],
    transcriptAvailability,
    exchangeCount: Number.isInteger(context.exchangeCount) ? context.exchangeCount : (routeThread?.turnCount ?? 0),
    latestToolCall,
    latestTurnState: isPlainObject(context.latestTurnState) ? { ...context.latestTurnState } : { status: 'missing' },
    tokenUsage: isPlainObject(context.tokenUsage) ? { ...context.tokenUsage } : null,
    contextUtilization: isPlainObject(context.contextUtilization) ? { ...context.contextUtilization } : null,
    staleTranscriptState: isPlainObject(context.staleTranscriptState)
      ? { ...context.staleTranscriptState }
      : { stale: projection.progress?.state === 'stalled', reason: projection.progress?.reason ?? null },
    missingTranscriptState: isPlainObject(context.missingTranscriptState)
      ? { ...context.missingTranscriptState }
      : { missing: transcriptAvailability === 'missing' || transcriptAvailability === 'unavailable', reason: null },
    checkpointRef: nonEmptyString(context.checkpointRef) ? context.checkpointRef : null,
    resultBlockEvidence: isPlainObject(context.resultBlockEvidence)
      ? {
          status: context.resultBlockEvidence.status ?? 'missing',
          present: context.resultBlockEvidence.present === true,
          evidenceRef: nonEmptyString(context.resultBlockEvidence.evidenceRef) ? context.resultBlockEvidence.evidenceRef : null,
          sourceRef: nonEmptyString(context.resultBlockEvidence.sourceRef) ? context.resultBlockEvidence.sourceRef : null
        }
      : { status: 'missing', present: false },
    driftMarkers: Array.isArray(context.driftMarkers) ? context.driftMarkers.filter(nonEmptyString) : []
  };
}

function normalizeSessionSourceInventory(inventory, generatedAt) {
  const sourceInventory = isPlainObject(inventory) ? inventory : {};
  const providers = Array.isArray(sourceInventory.providers)
    ? sourceInventory.providers.filter(isPlainObject).map(normalizeInventoryProvider)
    : [];
  const summary = isPlainObject(sourceInventory.summary) ? sourceInventory.summary : {};
  const failedCount = integerOrNull(summary.failedProviderCount);
  const degradedCount = integerOrNull(summary.degradedProviderCount);
  const availableCount = integerOrNull(summary.availableProviderCount);
  const missingCount = integerOrNull(summary.missingProviderCount);

  return {
    contractName: nonEmptyString(sourceInventory.contractName)
      ? sourceInventory.contractName
      : SESSION_SOURCE_INVENTORY_CONTRACT_NAME,
    contractVersion: Number.isInteger(sourceInventory.contractVersion)
      ? sourceInventory.contractVersion
      : SESSION_SOURCE_INVENTORY_CONTRACT_VERSION,
    generatedAt: firstNonEmptyString(sourceInventory.generatedAt, generatedAt),
    readOnly: sourceInventory.readOnly === true || sourceInventory.contractName === undefined,
    willMutate: false,
    state: firstNonEmptyString(
      summary.state,
      providers.length === 0 ? 'missing' : null
    ),
    scanScope: firstNonEmptyString(sourceInventory.scanScope, 'bounded-provider-session-roots'),
    maxFilesPerProvider: integerOrNull(sourceInventory.maxFilesPerProvider),
    summary: {
      providerCount: integerOrNull(summary.providerCount) ?? providers.length,
      availableProviderCount: availableCount ?? countProvidersByState(providers, ['available']),
      missingProviderCount: missingCount ?? countProvidersByState(providers, ['missing']),
      degradedProviderCount: degradedCount ?? countProvidersByState(providers, ['degraded', 'stale', 'unreadable']),
      failedProviderCount: failedCount ?? countProvidersByState(providers, ['failed']),
      state: firstNonEmptyString(summary.state, providers.length === 0 ? 'missing' : 'unknown')
    },
    providers,
    degradedReasons: uniqueStrings(providers.flatMap((provider) => provider.degradedReasons)),
    boundaries: normalizeReadOnlyBoundaries(sourceInventory.boundaries)
  };
}

function normalizeInventoryProvider(provider) {
  const sourceSummary = isPlainObject(provider.sourceSummary) ? provider.sourceSummary : {};

  return {
    provider: firstNonEmptyString(provider.provider, 'unknown'),
    state: firstNonEmptyString(provider.state, sourceSummary.availability, 'unknown'),
    readOnly: provider.readOnly === true,
    willMutate: false,
    readableFileCount: countOrMissing(provider.readableFileCount, sourceSummary.readableFileCount),
    candidateFileCount: countOrMissing(provider.candidateFileCount, sourceSummary.candidateFileCount),
    scannedFileCount: countOrMissing(sourceSummary.scannedFileCount, provider.candidateFileCount),
    unreadableFileCount: countOrMissing(sourceSummary.unreadableFileCount),
    latestModifiedAt: firstNonEmptyString(provider.latestModifiedAt, sourceSummary.latestModifiedAt),
    latestSessionRef: safeDisplayRef(firstNonEmptyString(provider.latestSessionRef, sourceSummary.latestSessionRef)),
    failureReason: firstNonEmptyString(provider.failureReason, sourceSummary.failureReason),
    degradedReasons: uniqueStrings(Array.isArray(provider.degradedReasons) ? provider.degradedReasons : []),
    sourceSummary: {
      availability: firstNonEmptyString(sourceSummary.availability, provider.state, 'unknown'),
      readState: firstNonEmptyString(sourceSummary.readState, 'unknown'),
      candidateFileCount: countOrMissing(sourceSummary.candidateFileCount, provider.candidateFileCount),
      scannedFileCount: countOrMissing(sourceSummary.scannedFileCount),
      readableFileCount: countOrMissing(sourceSummary.readableFileCount, provider.readableFileCount),
      unreadableFileCount: countOrMissing(sourceSummary.unreadableFileCount),
      latestModifiedAt: firstNonEmptyString(sourceSummary.latestModifiedAt, provider.latestModifiedAt),
      stale: sourceSummary.stale === true,
      latestSessionRef: safeDisplayRef(firstNonEmptyString(sourceSummary.latestSessionRef, provider.latestSessionRef)),
      failureReason: firstNonEmptyString(sourceSummary.failureReason, provider.failureReason)
    }
  };
}

function normalizeContextAdvisoryDisplay(contextAdvisory, generatedAt) {
  const advisory = isPlainObject(contextAdvisory) ? contextAdvisory : {};

  return {
    contractName: nonEmptyString(advisory.contractName)
      ? advisory.contractName
      : CONTEXT_ADVISORY_CONTRACT_NAME,
    contractVersion: Number.isInteger(advisory.contractVersion)
      ? advisory.contractVersion
      : CONTEXT_ADVISORY_CONTRACT_VERSION,
    generatedAt: firstNonEmptyString(advisory.generatedAt, generatedAt),
    readOnly: advisory.readOnly === true || advisory.contractName === undefined,
    willMutate: false,
    sessionContextRef: normalizeContractRef(advisory.sessionContextRef),
    inventoryRef: normalizeContractRef(advisory.inventoryRef),
    transcriptAvailability: firstNonEmptyString(advisory.transcriptAvailability, 'missing'),
    exchangeCount: Number.isInteger(advisory.exchangeCount) ? advisory.exchangeCount : 'missing',
    latestToolCall: normalizeLatestToolCall(advisory.latestToolCall),
    latestTurnState: normalizeLatestTurnState(advisory.latestTurnState),
    tokenUsage: normalizeTokenUsage(advisory.tokenUsage),
    contextUtilization: normalizeContextUtilization(advisory.contextUtilization),
    contextBand: firstNonEmptyString(advisory.contextBand, 'unknown'),
    resultBlockEvidence: normalizeResultBlockEvidence(advisory.resultBlockEvidence),
    staleTranscriptState: normalizeStaleTranscriptState(advisory.staleTranscriptState),
    missingTranscriptState: normalizeMissingTranscriptState(advisory.missingTranscriptState),
    degradedReasons: uniqueStrings(Array.isArray(advisory.degradedReasons) ? advisory.degradedReasons : []),
    blockedFields: uniqueStrings(Array.isArray(advisory.blockedFields) ? advisory.blockedFields : []),
    policyInputs: normalizePolicyInputs(advisory.policyInputs),
    boundaries: normalizeReadOnlyBoundaries(advisory.boundaries)
  };
}

function normalizeThreadContinuationDecisionDisplay(decision, generatedAt) {
  const continuation = isPlainObject(decision) ? decision : {};

  return {
    contractName: nonEmptyString(continuation.contractName)
      ? continuation.contractName
      : THREAD_CONTINUATION_DECISION_CONTRACT_NAME,
    contractVersion: Number.isInteger(continuation.contractVersion)
      ? continuation.contractVersion
      : THREAD_CONTINUATION_DECISION_CONTRACT_VERSION,
    generatedAt: firstNonEmptyString(continuation.generatedAt, generatedAt),
    readOnly: continuation.readOnly === true || continuation.contractName === undefined,
    willMutate: false,
    decision: firstNonEmptyString(continuation.decision, 'unknown'),
    reason: firstNonEmptyString(continuation.reason),
    confidence: firstNonEmptyString(continuation.confidence, 'unknown'),
    targetRole: firstNonEmptyString(continuation.targetRole),
    taskId: firstNonEmptyString(continuation.taskId),
    threadId: firstNonEmptyString(continuation.threadId),
    checkpointRef: safeDisplayRef(continuation.checkpointRef),
    waitPolicy: isPlainObject(continuation.waitPolicy) ? { ...continuation.waitPolicy } : null,
    blockedFields: uniqueStrings(Array.isArray(continuation.blockedFields) ? continuation.blockedFields : []),
    mismatchList: uniqueStrings(Array.isArray(continuation.mismatchList) ? continuation.mismatchList : []),
    requiredEvidence: uniqueStrings(Array.isArray(continuation.requiredEvidence) ? continuation.requiredEvidence : []),
    sourceContracts: normalizeContractRefs(continuation.sourceContracts),
    commandBoundary: normalizeDecisionCommandBoundary(continuation.commandBoundary)
  };
}

function normalizePolicyInputs(policyInputs) {
  const inputs = isPlainObject(policyInputs) ? policyInputs : {};

  return {
    threadId: firstNonEmptyString(inputs.threadId),
    sessionSourceSummaries: Array.isArray(inputs.sessionSourceSummaries)
      ? inputs.sessionSourceSummaries.filter(isPlainObject).map((source) => ({
          provider: firstNonEmptyString(source.provider),
          status: firstNonEmptyString(source.status, 'unknown'),
          threadId: firstNonEmptyString(source.threadId),
          latestTurnAt: firstNonEmptyString(source.latestTurnAt)
        }))
      : [],
    inventorySourceSummaries: Array.isArray(inputs.inventorySourceSummaries)
      ? inputs.inventorySourceSummaries.filter(isPlainObject).map((source) => ({
          provider: firstNonEmptyString(source.provider),
          state: firstNonEmptyString(source.state, 'unknown'),
          sourceSummary: isPlainObject(source.sourceSummary)
            ? {
                availability: firstNonEmptyString(source.sourceSummary.availability, 'unknown'),
                readState: firstNonEmptyString(source.sourceSummary.readState, 'unknown'),
                candidateFileCount: countOrMissing(source.sourceSummary.candidateFileCount),
                scannedFileCount: countOrMissing(source.sourceSummary.scannedFileCount),
                readableFileCount: countOrMissing(source.sourceSummary.readableFileCount),
                unreadableFileCount: countOrMissing(source.sourceSummary.unreadableFileCount),
                latestModifiedAt: firstNonEmptyString(source.sourceSummary.latestModifiedAt),
                stale: source.sourceSummary.stale === true,
                latestSessionRef: safeDisplayRef(source.sourceSummary.latestSessionRef),
                failureReason: firstNonEmptyString(source.sourceSummary.failureReason)
              }
            : null
        }))
      : [],
    transcriptAvailability: firstNonEmptyString(inputs.transcriptAvailability, 'missing'),
    latestToolCall: normalizeLatestToolCall(inputs.latestToolCall),
    latestTurnState: normalizeLatestTurnState(inputs.latestTurnState),
    tokenUsage: normalizeTokenUsage(inputs.tokenUsage),
    contextUtilization: normalizeContextUtilization(inputs.contextUtilization),
    resultBlockEvidence: normalizeResultBlockEvidence(inputs.resultBlockEvidence),
    staleTranscriptState: normalizeStaleTranscriptState(inputs.staleTranscriptState),
    missingTranscriptState: normalizeMissingTranscriptState(inputs.missingTranscriptState)
  };
}

function normalizeDecisionCommandBoundary(commandBoundary) {
  const boundary = isPlainObject(commandBoundary) ? commandBoundary : {};

  return {
    state: firstNonEmptyString(boundary.state, 'disabled'),
    executionAvailable: false,
    copyOnly: true,
    readOnly: true,
    allowedCommandFamilies: uniqueStrings(Array.isArray(boundary.allowedCommandFamilies) ? boundary.allowedCommandFamilies : []),
    blockedCommandFamilies: uniqueStrings(Array.isArray(boundary.blockedCommandFamilies) ? boundary.blockedCommandFamilies : []),
    confirmationFields: uniqueStrings(Array.isArray(boundary.confirmationFields) ? boundary.confirmationFields : []),
    confirmationReady: boundary.confirmationReady === true
  };
}

function normalizeReadOnlyBoundaries(boundaries) {
  const source = isPlainObject(boundaries) ? boundaries : {};

  return {
    readOnly: source.readOnly === true || boundaries === undefined,
    willMutate: false,
    frontendMayScanFolders: false,
    exposesRawTranscript: false,
    exposesRawJsonl: false,
    launchesProvider: false,
    dispatchesChildren: false,
    compactsTranscripts: false
  };
}

function normalizeContractRefs(sourceContracts) {
  return (Array.isArray(sourceContracts) ? sourceContracts : [])
    .map(normalizeContractRef)
    .filter((contract) => contract !== null);
}

function normalizeContractRef(contract) {
  if (typeof contract === 'string') {
    const contractName = safeContractName(contract);

    if (contractName === null) {
      return null;
    }

    return {
      contractName,
      contractVersion: null,
      generatedAt: null,
      readOnly: null,
      threadId: null
    };
  }

  if (!isPlainObject(contract) || !nonEmptyString(contract.contractName)) {
    return null;
  }

  const contractName = safeContractName(contract.contractName);

  if (contractName === null) {
    return null;
  }

  return {
    contractName,
    contractVersion: Number.isInteger(contract.contractVersion) ? contract.contractVersion : null,
    generatedAt: safeTimestamp(contract.generatedAt),
    readOnly: contract.readOnly === true,
    threadId: safeDisplayRef(contract.threadId)
  };
}

function normalizeLatestToolCall(toolCall) {
  if (!isPlainObject(toolCall)) {
    return { name: null, status: 'missing', updatedAt: null };
  }

  return {
    name: firstNonEmptyString(toolCall.name),
    status: firstNonEmptyString(toolCall.status, 'missing'),
    updatedAt: firstNonEmptyString(toolCall.updatedAt)
  };
}

function normalizeLatestTurnState(turnState) {
  if (!isPlainObject(turnState)) {
    return { status: 'missing', role: null, updatedAt: null };
  }

  return {
    status: firstNonEmptyString(turnState.status, 'missing'),
    role: firstNonEmptyString(turnState.role),
    updatedAt: firstNonEmptyString(turnState.updatedAt)
  };
}

function normalizeTokenUsage(tokenUsage) {
  const usage = isPlainObject(tokenUsage) ? tokenUsage : {};

  return {
    status: firstNonEmptyString(usage.status, 'missing'),
    inputTokens: numberOrMissing(usage.inputTokens),
    outputTokens: numberOrMissing(usage.outputTokens),
    totalTokens: numberOrMissing(usage.totalTokens)
  };
}

function normalizeContextUtilization(contextUtilization) {
  const utilization = isPlainObject(contextUtilization) ? contextUtilization : {};

  return {
    status: firstNonEmptyString(utilization.status, 'missing'),
    usedTokens: numberOrMissing(utilization.usedTokens),
    maxTokens: numberOrMissing(utilization.maxTokens),
    ratio: Number.isFinite(utilization.ratio) ? utilization.ratio : 'missing'
  };
}

function normalizeResultBlockEvidence(resultBlockEvidence) {
  const evidence = isPlainObject(resultBlockEvidence) ? resultBlockEvidence : {};

  return {
    status: firstNonEmptyString(evidence.status, 'missing'),
    present: evidence.present === true,
    evidenceRef: safeDisplayRef(evidence.evidenceRef),
    checkpointRef: safeDisplayRef(evidence.checkpointRef)
  };
}

function normalizeStaleTranscriptState(staleTranscriptState) {
  const state = isPlainObject(staleTranscriptState) ? staleTranscriptState : {};

  return {
    stale: state.stale === true,
    reason: firstNonEmptyString(state.reason),
    thresholdMs: Number.isFinite(state.thresholdMs) ? state.thresholdMs : null,
    ageMs: Number.isFinite(state.ageMs) ? state.ageMs : null
  };
}

function normalizeMissingTranscriptState(missingTranscriptState) {
  const state = isPlainObject(missingTranscriptState) ? missingTranscriptState : {};

  return {
    missing: state.missing === true,
    reason: firstNonEmptyString(state.reason)
  };
}

function safeSourceContracts(sourceContracts) {
  return normalizeContractRefs(sourceContracts);
}

function safeSourceContractNames(sourceContracts) {
  return safeSourceContracts(sourceContracts)
    .map((contract) => contract.contractName)
    .filter(nonEmptyString);
}

function safeContractName(value) {
  if (!nonEmptyString(value)) {
    return null;
  }

  const trimmed = value.trim();

  return SOURCE_CONTRACT_NAME_PATTERN.test(trimmed) && !hasUnsafeSourceContractText(trimmed)
    ? trimmed
    : null;
}

function safeTimestamp(value) {
  if (!nonEmptyString(value) || hasUnsafeSourceContractText(value)) {
    return null;
  }

  const parsed = Date.parse(value);

  return Number.isFinite(parsed) ? new Date(parsed).toISOString() : null;
}

function hasUnsafeSourceContractText(value) {
  if (!nonEmptyString(value)) {
    return false;
  }

  const ref = value.trim();
  const lower = ref.toLowerCase();
  const compact = lower.replace(/[^a-z0-9]/gu, '');
  const normalized = lower.replaceAll('\\', '/');
  const segments = normalized.split('/').filter((segment) => segment !== '');

  return UNSAFE_SOURCE_CONTRACT_TEXT_PATTERN.test(ref) ||
    /[\x00-\x1F\x7F]/u.test(ref) ||
    ref.startsWith('/') ||
    ref.startsWith('~') ||
    /^[a-z]:[\\/]/iu.test(ref) ||
    ref.includes('\\') ||
    ref === '..' ||
    ref.startsWith('../') ||
    ref.includes('/../') ||
    lower.startsWith('file:') ||
    lower.includes('stdout') ||
    lower.includes('prompt') ||
    lower.includes('secret') ||
    lower.endsWith('.jsonl') ||
    lower.includes('.jsonl/') ||
    compact.includes('rawtranscript') ||
    compact.includes('rawmodeloutput') ||
    compact.includes('providersession') ||
    compact.includes('sessionlog') ||
    compact.includes('sessionfile') ||
    compact.includes('modeloutput') ||
    segments.some((segment) => ['.codex', '.claude', '.git', '.symphony'].includes(segment));
}

function countProvidersByState(providers, states) {
  return providers.filter((provider) => states.includes(provider.state)).length;
}

function countOrMissing(...values) {
  const value = values.find(Number.isInteger);

  return Number.isInteger(value) ? value : 'missing';
}

function integerOrNull(value) {
  return Number.isInteger(value) ? value : null;
}

function numberOrMissing(value) {
  return Number.isFinite(value) ? value : 'missing';
}

function safeDisplayRef(value) {
  if (!nonEmptyString(value)) {
    return null;
  }

  const ref = value.trim();
  const lower = ref.toLowerCase();
  const segments = lower.replaceAll('\\', '/').split('/').filter((segment) => segment !== '');

  if (/[\x00-\x1F\x7F]/u.test(ref) ||
      ref.startsWith('/') ||
      ref.startsWith('~') ||
      /^[a-z]:[\\/]/iu.test(ref) ||
      ref.includes('\\') ||
      ref === '..' ||
      ref.startsWith('../') ||
      ref.includes('/../') ||
      lower.startsWith('file:') ||
      lower.startsWith('stdout:') ||
      lower.includes('prompt') ||
      lower.includes('secret') ||
      lower.endsWith('.jsonl') ||
      lower.includes('.jsonl/') ||
      segments.some((segment) => ['.codex', '.claude', '.git', '.symphony'].includes(segment))) {
    return null;
  }

  return ref;
}

function stripEmptyObject(value) {
  return Object.fromEntries(
    Object.entries(value).filter(([, entry]) => entry !== null && entry !== undefined)
  );
}

function uniqueStrings(values) {
  return [...new Set((Array.isArray(values) ? values : []).filter(nonEmptyString))];
}

function firstNonEmptyString(...values) {
  for (const value of values) {
    if (nonEmptyString(value)) {
      return value;
    }
  }

  return null;
}

function nonEmptyString(value) {
  return typeof value === 'string' && value.trim() !== '';
}

function isPlainObject(value) {
  return value !== null &&
    typeof value === 'object' &&
    !Array.isArray(value);
}

function isCompletedTaskStatus(task) {
  return [
    'completed',
    'main-verified',
    'release-ready',
    'merged-to-main'
  ].includes(task.status);
}
