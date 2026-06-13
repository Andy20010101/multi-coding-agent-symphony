import {
  CODEX_PROVIDER_RUN_RECOVERY_CONTRACT_NAME,
  REVIEWER_HANDOFF_PREVIEW_CONTRACT_NAME,
  validateCodexProviderRunRecoveryContract,
  validateReviewerHandoffPreviewContract
} from './codex-provider-run-recovery-contracts.js';
import {
  CONTEXT_ADVISORY_CONTRACT_NAME,
  CONTEXT_ADVISORY_CONTRACT_VERSION
} from './goal-supervisor/session-context.js';

export const THREAD_HANDOFF_PACK_CONTRACT_NAME = 'threadHandoffPack.v1';
export const PROVIDER_CONTINUATION_PROMPT_CONTRACT_NAME = 'providerContinuationPrompt.v1';
export const CHECKPOINT_SNAPSHOT_CONTRACT_NAME = 'checkpointSnapshot.v1';
export const CONTEXT_CARRYOVER_REFS_CONTRACT_NAME = 'contextCarryoverRefs.v1';
export const THREAD_BOUNDARY_NOTICE_CONTRACT_NAME = 'threadBoundaryNotice.v1';
export const THREAD_HANDOFF_PACK_CONTRACT_VERSION = 1;

export const THREAD_HANDOFF_PACK_BOUNDARIES = Object.freeze({
  automaticCompactAvailable: false,
  automaticNewThreadAvailable: false,
  providerLaunchAvailable: false,
  directGoalEventAppendAvailable: false,
  directTaskCompleteAvailable: false,
  reviewerMutationAvailable: false,
  mainVerificationMutationAvailable: false,
  releaseGateMutationAvailable: false,
  gitMutationAvailable: false,
  tagAutomationAvailable: false,
  publishAutomationAvailable: false
});

const PACK_ALLOWED_FIELDS = new Set([
  'contractName',
  'contractVersion',
  'generatedAt',
  'goal',
  'task',
  'decision',
  'sourceRecovery',
  'sourceReviewerHandoff',
  'summary',
  'knownFacts',
  'openRisks',
  'blockedReasons',
  'nextSafeAction',
  'requiredEvidenceRefs',
  'sourceContracts',
  'copyBlocks',
  'checkpointRef',
  'boundaries',
  'copyOnly',
  'willMutate'
]);
const PROMPT_ALLOWED_FIELDS = new Set([
  'contractName',
  'contractVersion',
  'generatedAt',
  'blockId',
  'blockType',
  'title',
  'body',
  'summary',
  'nextSafeAction',
  'requiredEvidenceRefs',
  'blockedReasons',
  'copyOnly',
  'willMutate',
  'contextCarryoverRefs',
  'threadBoundaryNotice',
  'sourceContracts'
]);
const CHECKPOINT_ALLOWED_FIELDS = new Set([
  'contractName',
  'contractVersion',
  'generatedAt',
  'snapshotId',
  'copyOnly',
  'willMutate',
  'summary',
  'knownFacts',
  'blockedReasons',
  'nextSafeAction',
  'requiredEvidenceRefs',
  'sourceContracts',
  'boundaries'
]);
const CARRYOVER_ALLOWED_FIELDS = new Set([
  'contractName',
  'contractVersion',
  'generatedAt',
  'copyOnly',
  'willMutate',
  'goalId',
  'taskId',
  'contextRefs',
  'evidenceRefs',
  'sourceContracts',
  'knownFacts',
  'blockedReasons'
]);
const BOUNDARY_NOTICE_ALLOWED_FIELDS = new Set([
  'contractName',
  'contractVersion',
  'generatedAt',
  'copyOnly',
  'willMutate',
  'disabledCapabilities',
  'boundaries'
]);
const GOAL_ALLOWED_FIELDS = new Set(['goalId', 'title', 'state', 'sourceContract', 'sourceRef']);
const TASK_ALLOWED_FIELDS = new Set(['taskId', 'title', 'state', 'sourceContract', 'sourceRef']);
const SOURCE_SUMMARY_ALLOWED_FIELDS = new Set([
  'contractName',
  'contractVersion',
  'state',
  'readiness',
  'runId',
  'previewHash',
  'pendingResultState',
  'blockedReasons',
  'sourceRef'
]);
const NEXT_SAFE_ACTION_ALLOWED_FIELDS = new Set(['actionId', 'label', 'copyOnly', 'willMutate']);
const SOURCE_CONTRACT_ALLOWED_FIELDS = new Set([
  'contractName',
  'contractVersion',
  'generatedAt',
  'readOnly',
  'requiredFor',
  'previewHash',
  'sourceRef'
]);
const SOURCE_REF_ALLOWED_FIELDS = new Set(['kind', 'ref', 'label', 'generatedAt']);
const EVIDENCE_REF_ALLOWED_FIELDS = new Set(['kind', 'ref', 'label']);

const GOAL_STATE_SET = new Set(['active', 'ready', 'blocked', 'pending', 'missing', 'accepted']);
const PACK_DECISION_SET = new Set(['continue', 'reviewer-handoff', 'blocked', 'recover-drift', 'checkpoint']);
const PROMPT_BLOCK_TYPE_SET = new Set([
  'continuation',
  'reviewer-handoff',
  'blocked-continuation',
  'recover-drift',
  'checkpoint'
]);
const SOURCE_REF_KIND_SET = new Set([
  'contract',
  'fixture',
  'docs',
  'route',
  'run-record',
  'checkpoint',
  'evidence',
  'goal',
  'task',
  'thread'
]);
const EVIDENCE_REF_KIND_SET = new Set([
  'repo-doc',
  'artifact-ref',
  'commit',
  'command-evidence',
  'external-note'
]);
const SOURCE_CONTRACT_NAME_PATTERN = /^[a-z][a-zA-Z0-9-]*(?:\.[a-zA-Z0-9-]+)*\.v[0-9]+$/u;
const HASH_PATTERN = /^sha256:[a-f0-9]{64}$/u;
const COMMIT_PATTERN = /^[a-f0-9]{7,64}$/u;
const SAFE_TOKEN_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9._:-]*$/u;
const RAW_FIELD_NAME_PATTERN =
  /^(?:rawTranscript|transcript|rawModelOutput|rawOutput|providerOutput|providerPayload|sessionLog|sessionPath|messages|conversation|goalLedgerInternals)$/iu;
const UNSAFE_TEXT_PATTERN =
  /\b(?:raw[\s_-]*(?:transcript|model[\s_-]*output)|provider[\s_-]*(?:output|session|payload)|session[\s_-]*(?:log|file|path)|local[\s_-]*(?:jsonl|session)|goal[\s_-]*ledger(?:[\s_-]*internals?)?)\b|(?:^|[/.])(?:\.codex|\.claude|\.git|\.symphony)(?:[/]|$)|\.jsonl(?:$|[/\s])|\/api\/(?:providers?|provider-parity|child(?:-dispatch)?|dispatch)(?:$|[/\s])|\/(?:event-append|append-event|event-plan-confirm|confirm-event-plan|confirm-goal-event-plan|goal-event-confirm|record-result|mark-complete|complete-task|git|tag|publish|release)(?:$|[/\s])|\b(?:append\s+event|mark\s+complete|confirm\s+reviewer\s+verdict|confirm\s+main\s+gate|confirm\s+release\s+gate|record\s+result|git\s+(?:push|tag|checkout|merge|commit)|gh\s+release|tag\s+creation|github\s+release|publish\s+release)\b/iu;

export class ThreadHandoffPackContractError extends Error {
  constructor(code, message, details = {}) {
    super(message);
    this.name = 'ThreadHandoffPackContractError';
    this.code = code;
    this.details = details;
  }
}

export function buildThreadHandoffPack({
  generatedAt = new Date().toISOString(),
  goal = null,
  task = null,
  recovery = null,
  reviewerHandoff = null,
  contextAdvisory = null,
  decision = null,
  summary = null,
  knownFacts = [],
  openRisks = [],
  blockedReasons: inputBlockedReasons = [],
  nextSafeAction = null,
  requiredEvidenceRefs = []
} = {}) {
  const unsafeSourceField = findUnsafeFields({ recovery, reviewerHandoff, contextAdvisory }, 'source')[0];

  if (unsafeSourceField !== undefined) {
    throw new ThreadHandoffPackContractError(
      'unsafe-thread-handoff-source',
      'Thread handoff pack source contains raw provider output, local session refs, or direct mutation routes.',
      { reason: `${unsafeSourceField} must not contain raw provider output, local session refs, or direct mutation routes` }
    );
  }

  const normalizedGeneratedAt = new Date(millisOrNow(generatedAt)).toISOString();
  const sourceRecovery = sourceRecoveryFrom(recovery);
  const sourceReviewerHandoff = sourceReviewerHandoffFrom(reviewerHandoff);
  const normalizedGoal = goalForPack({ goal, recovery, sourceRecovery });
  const normalizedTask = taskForPack({ task, recovery, reviewerHandoff });
  const sourceContracts = sourceContractsForPack({
    sourceRecovery,
    sourceReviewerHandoff,
    contextAdvisory
  });
  const derivedDecision = deriveDecision({
    decision,
    sourceRecovery,
    sourceReviewerHandoff
  });
  const blockedReasons = blockedReasonsForPack({
    decision: derivedDecision,
    sourceRecovery,
    sourceReviewerHandoff,
    inputBlockedReasons
  });
  const normalizedNextSafeAction = nextSafeActionForPack({
    decision: derivedDecision,
    nextSafeAction,
    blockedReasons
  });
  const evidenceRefs = controlledEvidenceRefs([
    ...safeArray(requiredEvidenceRefs),
    ...evidenceRefsFromReviewerHandoff(reviewerHandoff),
    evidenceRefFromContextAdvisory(contextAdvisory)
  ]);
  const normalizedSummary = safeDisplayText(summary) ??
    summaryForPack({ decision: derivedDecision, sourceRecovery, sourceReviewerHandoff, blockedReasons });
  const normalizedKnownFacts = uniqueStrings([
    ...safeStringArray(knownFacts),
    ...knownFactsFromSources({ sourceRecovery, sourceReviewerHandoff, contextAdvisory })
  ]);
  const normalizedOpenRisks = uniqueStrings([
    ...safeStringArray(openRisks),
    ...(derivedDecision === 'recover-drift' ? ['source contract drift needs operator review'] : [])
  ]);
  const checkpointRef = buildCheckpointSnapshot({
    generatedAt: normalizedGeneratedAt,
    goal: normalizedGoal,
    task: normalizedTask,
    decision: derivedDecision,
    summary: normalizedSummary,
    knownFacts: normalizedKnownFacts,
    blockedReasons,
    nextSafeAction: normalizedNextSafeAction,
    requiredEvidenceRefs: evidenceRefs,
    sourceContracts
  });
  const contextCarryoverRefs = buildContextCarryoverRefs({
    generatedAt: normalizedGeneratedAt,
    goal: normalizedGoal,
    task: normalizedTask,
    knownFacts: normalizedKnownFacts,
    blockedReasons,
    requiredEvidenceRefs: evidenceRefs,
    sourceContracts
  });
  const threadBoundaryNotice = buildThreadBoundaryNotice({
    generatedAt: normalizedGeneratedAt
  });
  const copyBlocks = [
    buildProviderContinuationPrompt({
      generatedAt: normalizedGeneratedAt,
      decision: derivedDecision,
      goal: normalizedGoal,
      task: normalizedTask,
      summary: normalizedSummary,
      nextSafeAction: normalizedNextSafeAction,
      requiredEvidenceRefs: evidenceRefs,
      blockedReasons,
      contextCarryoverRefs,
      threadBoundaryNotice,
      sourceContracts
    })
  ];
  const pack = {
    contractName: THREAD_HANDOFF_PACK_CONTRACT_NAME,
    contractVersion: THREAD_HANDOFF_PACK_CONTRACT_VERSION,
    generatedAt: normalizedGeneratedAt,
    goal: normalizedGoal,
    task: normalizedTask,
    decision: derivedDecision,
    sourceRecovery,
    sourceReviewerHandoff,
    summary: normalizedSummary,
    knownFacts: normalizedKnownFacts,
    openRisks: normalizedOpenRisks,
    blockedReasons,
    nextSafeAction: normalizedNextSafeAction,
    requiredEvidenceRefs: evidenceRefs,
    sourceContracts,
    copyBlocks,
    checkpointRef,
    boundaries: buildThreadHandoffPackBoundaries(),
    copyOnly: true,
    willMutate: false
  };

  assertThreadHandoffPackContract(pack);

  return pack;
}

export function buildProviderContinuationPrompt({
  generatedAt = new Date().toISOString(),
  decision,
  goal,
  task,
  summary,
  nextSafeAction,
  requiredEvidenceRefs = [],
  blockedReasons = [],
  contextCarryoverRefs,
  threadBoundaryNotice,
  sourceContracts = []
} = {}) {
  const blockType = blockTypeForDecision(decision);
  const title = blockType === 'reviewer-handoff' ? 'Copy Reviewer Handoff Pack' : 'Copy Continuation Pack';
  const prompt = {
    contractName: PROVIDER_CONTINUATION_PROMPT_CONTRACT_NAME,
    contractVersion: THREAD_HANDOFF_PACK_CONTRACT_VERSION,
    generatedAt: new Date(millisOrNow(generatedAt)).toISOString(),
    blockId: `${blockType}:${safeToken(goal?.goalId) ?? 'missing-goal'}:${safeToken(task?.taskId) ?? 'missing-task'}`,
    blockType,
    title,
    body: promptBodyFor({
      decision,
      goal,
      task,
      summary,
      nextSafeAction,
      blockedReasons
    }),
    summary: safeDisplayText(summary) ?? 'Thread handoff pack is ready for copy.',
    nextSafeAction: cloneObject(nextSafeAction),
    requiredEvidenceRefs: controlledEvidenceRefs(requiredEvidenceRefs),
    blockedReasons: safeStringArray(blockedReasons),
    copyOnly: true,
    willMutate: false,
    contextCarryoverRefs: cloneObject(contextCarryoverRefs),
    threadBoundaryNotice: cloneObject(threadBoundaryNotice),
    sourceContracts: cloneArray(sourceContracts)
  };
  const validation = validateProviderContinuationPromptContract(prompt);

  if (!validation.ok) {
    throw new ThreadHandoffPackContractError(
      'invalid-built-provider-continuation-prompt',
      'Built provider continuation prompt contract is invalid.',
      { reason: validation.errors[0] }
    );
  }

  return prompt;
}

export function buildCheckpointSnapshot({
  generatedAt = new Date().toISOString(),
  goal,
  task,
  decision,
  summary,
  knownFacts = [],
  blockedReasons = [],
  nextSafeAction,
  requiredEvidenceRefs = [],
  sourceContracts = []
} = {}) {
  const snapshot = {
    contractName: CHECKPOINT_SNAPSHOT_CONTRACT_NAME,
    contractVersion: THREAD_HANDOFF_PACK_CONTRACT_VERSION,
    generatedAt: new Date(millisOrNow(generatedAt)).toISOString(),
    snapshotId: `checkpoint:${safeToken(goal?.goalId) ?? 'missing-goal'}:${safeToken(task?.taskId) ?? 'missing-task'}:${safeToken(decision) ?? 'blocked'}`,
    copyOnly: true,
    willMutate: false,
    summary: safeDisplayText(summary) ?? 'Bounded checkpoint snapshot for thread handoff.',
    knownFacts: safeStringArray(knownFacts),
    blockedReasons: safeStringArray(blockedReasons),
    nextSafeAction: cloneObject(nextSafeAction),
    requiredEvidenceRefs: controlledEvidenceRefs(requiredEvidenceRefs),
    sourceContracts: cloneArray(sourceContracts),
    boundaries: buildThreadHandoffPackBoundaries()
  };
  const validation = validateCheckpointSnapshotContract(snapshot);

  if (!validation.ok) {
    throw new ThreadHandoffPackContractError(
      'invalid-built-checkpoint-snapshot',
      'Built checkpoint snapshot contract is invalid.',
      { reason: validation.errors[0] }
    );
  }

  return snapshot;
}

export function buildContextCarryoverRefs({
  generatedAt = new Date().toISOString(),
  goal,
  task,
  knownFacts = [],
  blockedReasons = [],
  requiredEvidenceRefs = [],
  sourceContracts = []
} = {}) {
  const contextRefs = sourceContracts
    .map((sourceContract) => sourceContract?.sourceRef)
    .filter((sourceRef) => isPlainObject(sourceRef));
  const carryover = {
    contractName: CONTEXT_CARRYOVER_REFS_CONTRACT_NAME,
    contractVersion: THREAD_HANDOFF_PACK_CONTRACT_VERSION,
    generatedAt: new Date(millisOrNow(generatedAt)).toISOString(),
    copyOnly: true,
    willMutate: false,
    goalId: safeToken(goal?.goalId) ?? 'missing-goal',
    taskId: safeToken(task?.taskId) ?? 'missing-task',
    contextRefs: cloneArray(contextRefs),
    evidenceRefs: controlledEvidenceRefs(requiredEvidenceRefs),
    sourceContracts: cloneArray(sourceContracts),
    knownFacts: safeStringArray(knownFacts),
    blockedReasons: safeStringArray(blockedReasons)
  };
  const validation = validateContextCarryoverRefsContract(carryover);

  if (!validation.ok) {
    throw new ThreadHandoffPackContractError(
      'invalid-built-context-carryover-refs',
      'Built context carryover refs contract is invalid.',
      { reason: validation.errors[0] }
    );
  }

  return carryover;
}

export function buildThreadBoundaryNotice({
  generatedAt = new Date().toISOString()
} = {}) {
  const notice = {
    contractName: THREAD_BOUNDARY_NOTICE_CONTRACT_NAME,
    contractVersion: THREAD_HANDOFF_PACK_CONTRACT_VERSION,
    generatedAt: new Date(millisOrNow(generatedAt)).toISOString(),
    copyOnly: true,
    willMutate: false,
    disabledCapabilities: Object.keys(THREAD_HANDOFF_PACK_BOUNDARIES),
    boundaries: buildThreadHandoffPackBoundaries()
  };
  const validation = validateThreadBoundaryNoticeContract(notice);

  if (!validation.ok) {
    throw new ThreadHandoffPackContractError(
      'invalid-built-thread-boundary-notice',
      'Built thread boundary notice contract is invalid.',
      { reason: validation.errors[0] }
    );
  }

  return notice;
}

export function validateThreadHandoffPackContract(pack) {
  const errors = [];

  if (!isPlainObject(pack)) {
    return invalidResult('pack must be a plain object');
  }

  for (const field of [
    'contractName',
    'contractVersion',
    'generatedAt',
    'goal',
    'task',
    'decision',
    'sourceRecovery',
    'sourceReviewerHandoff',
    'summary',
    'knownFacts',
    'openRisks',
    'blockedReasons',
    'nextSafeAction',
    'requiredEvidenceRefs',
    'sourceContracts',
    'copyBlocks',
    'checkpointRef',
    'boundaries',
    'copyOnly',
    'willMutate'
  ]) {
    if (!Object.hasOwn(pack, field)) {
      errors.push(`${field} is required`);
    }
  }

  validateAllowedFields(errors, pack, 'pack', PACK_ALLOWED_FIELDS);
  requireExact(errors, pack.contractName, 'contractName', THREAD_HANDOFF_PACK_CONTRACT_NAME);
  requireExact(errors, pack.contractVersion, 'contractVersion', THREAD_HANDOFF_PACK_CONTRACT_VERSION);
  requireIsoTimestamp(errors, pack.generatedAt, 'generatedAt');
  validateGoal(errors, pack.goal, 'goal');
  validateTask(errors, pack.task, 'task');
  requireEnum(errors, pack.decision, 'decision', PACK_DECISION_SET);
  validateSourceSummary(errors, pack.sourceRecovery, 'sourceRecovery');
  validateSourceSummary(errors, pack.sourceReviewerHandoff, 'sourceReviewerHandoff');
  requireNonEmptyString(errors, pack.summary, 'summary');
  validateStringArray(errors, pack.knownFacts, 'knownFacts');
  validateStringArray(errors, pack.openRisks, 'openRisks');
  validateStringArray(errors, pack.blockedReasons, 'blockedReasons');
  validateNextSafeAction(errors, pack.nextSafeAction, 'nextSafeAction');
  validateEvidenceRefs(errors, pack.requiredEvidenceRefs, 'requiredEvidenceRefs');
  validateSourceContracts(errors, pack.sourceContracts, 'sourceContracts');
  validateCopyBlocks(errors, pack.copyBlocks, 'copyBlocks');
  appendPrefixedErrors(errors, validateCheckpointSnapshotContract(pack.checkpointRef), 'checkpointRef');
  validateBoundaries(errors, pack.boundaries, 'boundaries');
  requireExact(errors, pack.copyOnly, 'copyOnly', true);
  requireExact(errors, pack.willMutate, 'willMutate', false);
  validatePackBinding(errors, pack);

  for (const field of findUnsafeFields(pack, 'pack')) {
    errors.push(`${field} must not contain raw provider output, local session refs, or direct mutation routes`);
  }

  return {
    ok: errors.length === 0,
    errors
  };
}

export function assertThreadHandoffPackContract(pack) {
  const result = validateThreadHandoffPackContract(pack);

  if (!result.ok) {
    throw new ThreadHandoffPackContractError(
      'invalid-thread-handoff-pack',
      'Thread handoff pack contract is invalid.',
      { reason: result.errors[0] }
    );
  }

  return pack;
}

export function validateProviderContinuationPromptContract(prompt) {
  const errors = [];

  if (!isPlainObject(prompt)) {
    return invalidResult('prompt must be a plain object');
  }

  validateAllowedFields(errors, prompt, 'prompt', PROMPT_ALLOWED_FIELDS);
  requireExact(errors, prompt.contractName, 'contractName', PROVIDER_CONTINUATION_PROMPT_CONTRACT_NAME);
  requireExact(errors, prompt.contractVersion, 'contractVersion', THREAD_HANDOFF_PACK_CONTRACT_VERSION);
  requireIsoTimestamp(errors, prompt.generatedAt, 'generatedAt');
  requireSafeToken(errors, prompt.blockId, 'blockId');
  requireEnum(errors, prompt.blockType, 'blockType', PROMPT_BLOCK_TYPE_SET);
  requireNonEmptyString(errors, prompt.title, 'title');
  requireNonEmptyString(errors, prompt.body, 'body');
  requireNonEmptyString(errors, prompt.summary, 'summary');
  validateNextSafeAction(errors, prompt.nextSafeAction, 'nextSafeAction');
  validateEvidenceRefs(errors, prompt.requiredEvidenceRefs, 'requiredEvidenceRefs');
  validateStringArray(errors, prompt.blockedReasons, 'blockedReasons');
  requireExact(errors, prompt.copyOnly, 'copyOnly', true);
  requireExact(errors, prompt.willMutate, 'willMutate', false);
  appendPrefixedErrors(errors, validateContextCarryoverRefsContract(prompt.contextCarryoverRefs), 'contextCarryoverRefs');
  appendPrefixedErrors(errors, validateThreadBoundaryNoticeContract(prompt.threadBoundaryNotice), 'threadBoundaryNotice');
  validateSourceContracts(errors, prompt.sourceContracts, 'sourceContracts');

  for (const field of findUnsafeFields(prompt, 'prompt')) {
    errors.push(`${field} must not contain raw provider output, local session refs, or direct mutation routes`);
  }

  return {
    ok: errors.length === 0,
    errors
  };
}

export function validateCheckpointSnapshotContract(snapshot) {
  const errors = [];

  if (!isPlainObject(snapshot)) {
    return invalidResult('snapshot must be a plain object');
  }

  validateAllowedFields(errors, snapshot, 'snapshot', CHECKPOINT_ALLOWED_FIELDS);
  requireExact(errors, snapshot.contractName, 'contractName', CHECKPOINT_SNAPSHOT_CONTRACT_NAME);
  requireExact(errors, snapshot.contractVersion, 'contractVersion', THREAD_HANDOFF_PACK_CONTRACT_VERSION);
  requireIsoTimestamp(errors, snapshot.generatedAt, 'generatedAt');
  requireSafeToken(errors, snapshot.snapshotId, 'snapshotId');
  requireExact(errors, snapshot.copyOnly, 'copyOnly', true);
  requireExact(errors, snapshot.willMutate, 'willMutate', false);
  requireNonEmptyString(errors, snapshot.summary, 'summary');
  validateStringArray(errors, snapshot.knownFacts, 'knownFacts');
  validateStringArray(errors, snapshot.blockedReasons, 'blockedReasons');
  validateNextSafeAction(errors, snapshot.nextSafeAction, 'nextSafeAction');
  validateEvidenceRefs(errors, snapshot.requiredEvidenceRefs, 'requiredEvidenceRefs');
  validateSourceContracts(errors, snapshot.sourceContracts, 'sourceContracts');
  validateBoundaries(errors, snapshot.boundaries, 'boundaries');

  for (const field of findUnsafeFields(snapshot, 'snapshot')) {
    errors.push(`${field} must not contain raw provider output, local session refs, or direct mutation routes`);
  }

  return {
    ok: errors.length === 0,
    errors
  };
}

export function validateContextCarryoverRefsContract(carryover) {
  const errors = [];

  if (!isPlainObject(carryover)) {
    return invalidResult('carryover must be a plain object');
  }

  validateAllowedFields(errors, carryover, 'carryover', CARRYOVER_ALLOWED_FIELDS);
  requireExact(errors, carryover.contractName, 'contractName', CONTEXT_CARRYOVER_REFS_CONTRACT_NAME);
  requireExact(errors, carryover.contractVersion, 'contractVersion', THREAD_HANDOFF_PACK_CONTRACT_VERSION);
  requireIsoTimestamp(errors, carryover.generatedAt, 'generatedAt');
  requireExact(errors, carryover.copyOnly, 'copyOnly', true);
  requireExact(errors, carryover.willMutate, 'willMutate', false);
  requireSafeToken(errors, carryover.goalId, 'goalId');
  requireSafeToken(errors, carryover.taskId, 'taskId');
  validateCarryoverRefs(errors, carryover.contextRefs, 'contextRefs');
  validateEvidenceRefs(errors, carryover.evidenceRefs, 'evidenceRefs');
  validateSourceContracts(errors, carryover.sourceContracts, 'sourceContracts');
  validateStringArray(errors, carryover.knownFacts, 'knownFacts');
  validateStringArray(errors, carryover.blockedReasons, 'blockedReasons');

  for (const field of findUnsafeFields(carryover, 'carryover')) {
    errors.push(`${field} must not contain raw provider output, local session refs, or direct mutation routes`);
  }

  return {
    ok: errors.length === 0,
    errors
  };
}

export function validateThreadBoundaryNoticeContract(notice) {
  const errors = [];

  if (!isPlainObject(notice)) {
    return invalidResult('notice must be a plain object');
  }

  validateAllowedFields(errors, notice, 'notice', BOUNDARY_NOTICE_ALLOWED_FIELDS);
  requireExact(errors, notice.contractName, 'contractName', THREAD_BOUNDARY_NOTICE_CONTRACT_NAME);
  requireExact(errors, notice.contractVersion, 'contractVersion', THREAD_HANDOFF_PACK_CONTRACT_VERSION);
  requireIsoTimestamp(errors, notice.generatedAt, 'generatedAt');
  requireExact(errors, notice.copyOnly, 'copyOnly', true);
  requireExact(errors, notice.willMutate, 'willMutate', false);
  validateDisabledCapabilities(errors, notice.disabledCapabilities, 'disabledCapabilities');
  validateBoundaries(errors, notice.boundaries, 'boundaries');

  for (const field of findUnsafeFields(notice, 'notice')) {
    errors.push(`${field} must not contain raw provider output, local session refs, or direct mutation routes`);
  }

  return {
    ok: errors.length === 0,
    errors
  };
}

function sourceRecoveryFrom(recovery) {
  if (!isPlainObject(recovery)) {
    return {
      contractName: CODEX_PROVIDER_RUN_RECOVERY_CONTRACT_NAME,
      contractVersion: THREAD_HANDOFF_PACK_CONTRACT_VERSION,
      state: 'missing',
      blockedReasons: ['missing-codex-provider-run-recovery'],
      sourceRef: {
        kind: 'contract',
        ref: CODEX_PROVIDER_RUN_RECOVERY_CONTRACT_NAME
      }
    };
  }

  const validation = validateCodexProviderRunRecoveryContract(recovery);
  const valid = validation.ok === true;

  return {
    contractName: CODEX_PROVIDER_RUN_RECOVERY_CONTRACT_NAME,
    contractVersion: THREAD_HANDOFF_PACK_CONTRACT_VERSION,
    state: valid ? recovery.recoveryState : 'invalid',
    runId: safeToken(recovery.runId) ?? 'missing-run',
    previewHash: safeHash(recovery.previewHash) ?? undefined,
    blockedReasons: valid ? safeStringArray(recovery.blockedReasons) : ['invalid-codex-provider-run-recovery'],
    sourceRef: {
      kind: 'contract',
      ref: CODEX_PROVIDER_RUN_RECOVERY_CONTRACT_NAME
    }
  };
}

function sourceReviewerHandoffFrom(preview) {
  if (!isPlainObject(preview)) {
    return {
      contractName: REVIEWER_HANDOFF_PREVIEW_CONTRACT_NAME,
      contractVersion: THREAD_HANDOFF_PACK_CONTRACT_VERSION,
      readiness: 'missing',
      blockedReasons: ['missing-reviewer-handoff-preview'],
      sourceRef: {
        kind: 'contract',
        ref: REVIEWER_HANDOFF_PREVIEW_CONTRACT_NAME
      }
    };
  }

  const validation = validateReviewerHandoffPreviewContract(preview);
  const valid = validation.ok === true;
  const blockedReasons = valid ? safeStringArray(preview.blockedReasons) : ['invalid-reviewer-handoff-preview'];

  return {
    contractName: REVIEWER_HANDOFF_PREVIEW_CONTRACT_NAME,
    contractVersion: THREAD_HANDOFF_PACK_CONTRACT_VERSION,
    readiness: valid && blockedReasons.length === 0 ? 'ready' : (valid ? 'blocked' : 'invalid'),
    pendingResultState: safeDisplayText(preview.pendingResultRef?.state) ?? null,
    blockedReasons,
    sourceRef: {
      kind: 'contract',
      ref: REVIEWER_HANDOFF_PREVIEW_CONTRACT_NAME
    }
  };
}

function deriveDecision({
  decision,
  sourceRecovery,
  sourceReviewerHandoff
}) {
  if (decision === 'recover-drift' || decision === 'blocked' || decision === 'checkpoint') {
    return decision;
  }

  if (isReadyHandoffSource({ sourceRecovery, sourceReviewerHandoff })) {
    return PACK_DECISION_SET.has(decision) ? decision : 'continue';
  }

  if (decision === 'continue' || decision === 'reviewer-handoff') {
    return 'blocked';
  }

  return 'blocked';
}

function blockedReasonsForPack({
  decision,
  sourceRecovery,
  sourceReviewerHandoff,
  inputBlockedReasons
}) {
  if (decision === 'blocked') {
    return uniqueStrings([
      ...safeStringArray(inputBlockedReasons),
      ...safeStringArray(sourceRecovery.blockedReasons),
      ...(sourceRecovery.state === 'missing' ? ['missing-codex-provider-run-recovery'] : []),
      ...(sourceRecovery.state === 'invalid' ? ['invalid-codex-provider-run-recovery'] : []),
      ...(sourceReviewerHandoff.readiness === 'missing' ? ['missing-accepted-reviewer-handoff'] : []),
      ...(sourceReviewerHandoff.readiness === 'blocked' ? ['missing-accepted-reviewer-handoff'] : []),
      ...(sourceReviewerHandoff.readiness === 'invalid' ? ['invalid-reviewer-handoff-preview'] : [])
    ]);
  }

  if (decision === 'reviewer-handoff' && sourceReviewerHandoff.readiness !== 'ready') {
    return uniqueStrings([
      ...safeStringArray(inputBlockedReasons),
      'missing-accepted-reviewer-handoff'
    ]);
  }

  return uniqueStrings(safeStringArray(inputBlockedReasons));
}

function nextSafeActionForPack({
  decision,
  nextSafeAction,
  blockedReasons
}) {
  if (isPlainObject(nextSafeAction)) {
    return {
      actionId: safeToken(nextSafeAction.actionId) ?? actionIdForDecision(decision, blockedReasons),
      label: safeDisplayText(nextSafeAction.label) ?? labelForDecision(decision, blockedReasons),
      copyOnly: true,
      willMutate: false
    };
  }

  return {
    actionId: actionIdForDecision(decision, blockedReasons),
    label: labelForDecision(decision, blockedReasons),
    copyOnly: true,
    willMutate: false
  };
}

function actionIdForDecision(decision, blockedReasons) {
  if (decision === 'reviewer-handoff') {
    return 'copy-reviewer-handoff-pack';
  }

  if (decision === 'recover-drift') {
    return 'copy-recover-drift-pack';
  }

  if (decision === 'checkpoint') {
    return 'copy-checkpoint-pack';
  }

  if (decision === 'blocked' || blockedReasons.length > 0) {
    return 'copy-blocked-continuation-pack';
  }

  return 'copy-continuation-pack';
}

function labelForDecision(decision, blockedReasons) {
  if (decision === 'reviewer-handoff') {
    return 'Copy reviewer handoff pack';
  }

  if (decision === 'recover-drift') {
    return 'Copy recover-drift pack';
  }

  if (decision === 'checkpoint') {
    return 'Copy checkpoint pack';
  }

  if (decision === 'blocked' || blockedReasons.length > 0) {
    return 'Copy blocked continuation pack';
  }

  return 'Copy continuation pack';
}

function sourceContractsForPack({
  sourceRecovery,
  sourceReviewerHandoff,
  contextAdvisory
}) {
  return [
    {
      contractName: CODEX_PROVIDER_RUN_RECOVERY_CONTRACT_NAME,
      contractVersion: THREAD_HANDOFF_PACK_CONTRACT_VERSION,
      readOnly: true,
      requiredFor: ['source-recovery-state'],
      previewHash: safeHash(sourceRecovery.previewHash) ?? undefined,
      sourceRef: {
        kind: 'contract',
        ref: CODEX_PROVIDER_RUN_RECOVERY_CONTRACT_NAME
      }
    },
    {
      contractName: REVIEWER_HANDOFF_PREVIEW_CONTRACT_NAME,
      contractVersion: THREAD_HANDOFF_PACK_CONTRACT_VERSION,
      readOnly: true,
      requiredFor: ['reviewer-handoff-readiness'],
      sourceRef: {
        kind: 'contract',
        ref: REVIEWER_HANDOFF_PREVIEW_CONTRACT_NAME
      }
    },
    {
      contractName: CONTEXT_ADVISORY_CONTRACT_NAME,
      contractVersion: CONTEXT_ADVISORY_CONTRACT_VERSION,
      generatedAt: isPlainObject(contextAdvisory) ? safeIsoTimestamp(contextAdvisory.generatedAt) ?? undefined : undefined,
      readOnly: true,
      requiredFor: ['context-carryover-refs'],
      sourceRef: {
        kind: 'contract',
        ref: CONTEXT_ADVISORY_CONTRACT_NAME
      }
    }
  ];
}

function evidenceRefsFromReviewerHandoff(preview) {
  if (!isPlainObject(preview)) {
    return [];
  }

  return [
    ...safeArray(preview.acceptedResultSummary?.evidenceRefs),
    ...safeArray(preview.handoffPack?.workerEvidenceRefs)
  ];
}

function evidenceRefFromContextAdvisory(contextAdvisory) {
  const ref = firstNonEmptyString(
    contextAdvisory?.resultBlockEvidence?.evidenceRef,
    contextAdvisory?.resultBlockEvidence?.checkpointRef
  );

  if (ref === null) {
    return null;
  }

  return {
    kind: 'repo-doc',
    ref,
    label: 'Context advisory evidence'
  };
}

function knownFactsFromSources({
  sourceRecovery,
  sourceReviewerHandoff,
  contextAdvisory
}) {
  return uniqueStrings([
    `recovery state: ${sourceRecovery.state}`,
    `reviewer handoff readiness: ${sourceReviewerHandoff.readiness}`,
    isPlainObject(contextAdvisory) && contextAdvisory.contractName === CONTEXT_ADVISORY_CONTRACT_NAME
      ? 'context advisory contract is present'
      : 'context advisory contract is missing'
  ]);
}

function summaryForPack({
  decision,
  sourceRecovery,
  sourceReviewerHandoff,
  blockedReasons
}) {
  if (decision === 'reviewer-handoff') {
    return 'Accepted reviewer handoff preview is ready for copy-only review handoff.';
  }

  if (decision === 'recover-drift') {
    return 'Source contract drift requires a copy-only recovery prompt before continuation.';
  }

  if (decision === 'blocked') {
    return `Thread handoff pack is blocked: ${blockedReasons.join(', ') || 'missing source state'}.`;
  }

  if (sourceRecovery.state === 'ready-for-reviewer-handoff' && sourceReviewerHandoff.readiness === 'ready') {
    return 'Continuation pack is ready from accepted recovery and reviewer handoff state.';
  }

  return 'Continuation pack is ready from bounded recovery, reviewer handoff, and context advisory refs.';
}

function blockTypeForDecision(decision) {
  if (decision === 'reviewer-handoff') {
    return 'reviewer-handoff';
  }

  if (decision === 'recover-drift') {
    return 'recover-drift';
  }

  if (decision === 'checkpoint') {
    return 'checkpoint';
  }

  if (decision === 'blocked') {
    return 'blocked-continuation';
  }

  return 'continuation';
}

function promptBodyFor({
  decision,
  goal,
  task,
  summary,
  nextSafeAction,
  blockedReasons
}) {
  const goalId = safeToken(goal?.goalId) ?? 'missing-goal';
  const taskId = safeToken(task?.taskId) ?? 'missing-task';
  const reason = blockedReasons.length > 0 ? ` Blocked reasons: ${blockedReasons.join(', ')}.` : '';
  const action = safeDisplayText(nextSafeAction?.label) ?? labelForDecision(decision, blockedReasons);

  return `Goal ${goalId}; task ${taskId}; decision ${decision}. ${safeDisplayText(summary) ?? 'Copy the bounded handoff pack.'}${reason} Next safe action: ${action}. This text is copy-only and does not mutate goal state.`;
}

function goalForPack({
  goal,
  recovery,
  sourceRecovery
}) {
  const source = isPlainObject(goal) ? goal : {};
  const recoveryGoal = isPlainObject(recovery?.goal) ? recovery.goal : {};
  const goalId = safeToken(source.goalId) ?? safeToken(recoveryGoal.goalId) ?? 'missing-goal';

  return {
    goalId,
    title: safeDisplayText(source.title) ?? safeDisplayText(recoveryGoal.title) ?? goalId,
    state: GOAL_STATE_SET.has(source.state) ? source.state : (GOAL_STATE_SET.has(recoveryGoal.state) ? recoveryGoal.state : 'active'),
    sourceContract: safeContractName(source.sourceContract) ?? sourceRecovery.contractName,
    sourceRef: safeSourceRef(source.sourceRef) ?? {
      kind: 'contract',
      ref: sourceRecovery.contractName
    }
  };
}

function taskForPack({
  task,
  recovery,
  reviewerHandoff
}) {
  const source = isPlainObject(task) ? task : {};
  const recoveryTask = isPlainObject(recovery?.task) ? recovery.task : {};
  const reviewerTask = isPlainObject(reviewerHandoff?.reviewerTask) ? reviewerHandoff.reviewerTask : {};
  const taskId = safeToken(source.taskId) ?? safeToken(recoveryTask.taskId) ?? safeToken(reviewerTask.taskId) ?? 'missing-task';

  return {
    taskId,
    title: safeDisplayText(source.title) ?? safeDisplayText(recoveryTask.title) ?? safeDisplayText(reviewerTask.title) ?? taskId,
    state: GOAL_STATE_SET.has(source.state) ? source.state : (GOAL_STATE_SET.has(recoveryTask.state) ? recoveryTask.state : 'active'),
    sourceContract: safeContractName(source.sourceContract) ?? CODEX_PROVIDER_RUN_RECOVERY_CONTRACT_NAME,
    sourceRef: safeSourceRef(source.sourceRef) ?? {
      kind: 'contract',
      ref: CODEX_PROVIDER_RUN_RECOVERY_CONTRACT_NAME
    }
  };
}

function validatePackBinding(errors, pack) {
  if (!Array.isArray(pack.blockedReasons)) {
    return;
  }

  if (pack.decision === 'blocked' && pack.blockedReasons.length === 0) {
    errors.push('blockedReasons must contain at least one reason when decision is blocked');
  }

  if ((pack.decision === 'continue' || pack.decision === 'reviewer-handoff') && pack.blockedReasons.length > 0) {
    errors.push('blockedReasons must be empty when decision is ready');
  }

  if (pack.decision === 'continue' && pack.sourceRecovery?.state !== 'ready-for-reviewer-handoff') {
    errors.push('sourceRecovery.state must be ready-for-reviewer-handoff for continue decision');
  }

  if (pack.decision === 'continue' && pack.sourceReviewerHandoff?.readiness !== 'ready') {
    errors.push('sourceReviewerHandoff.readiness must be ready for continue decision');
  }

  if (pack.decision === 'reviewer-handoff' && pack.sourceRecovery?.state !== 'ready-for-reviewer-handoff') {
    errors.push('sourceRecovery.state must be ready-for-reviewer-handoff for reviewer-handoff decision');
  }

  if (pack.decision === 'reviewer-handoff' && pack.sourceReviewerHandoff?.readiness !== 'ready') {
    errors.push('sourceReviewerHandoff.readiness must be ready for reviewer-handoff decision');
  }

  if (pack.sourceRecovery?.state === 'missing') {
    requireStringArrayIncludes(errors, pack.blockedReasons, 'blockedReasons', 'missing-codex-provider-run-recovery');
  }

  if (pack.sourceReviewerHandoff?.readiness === 'blocked' && pack.decision === 'reviewer-handoff') {
    requireStringArrayIncludes(errors, pack.blockedReasons, 'blockedReasons', 'missing-accepted-reviewer-handoff');
  }
}

function isReadyHandoffSource({
  sourceRecovery,
  sourceReviewerHandoff
}) {
  return sourceRecovery.state === 'ready-for-reviewer-handoff' &&
    sourceReviewerHandoff.readiness === 'ready';
}

function validateCopyBlocks(errors, copyBlocks, path) {
  if (!Array.isArray(copyBlocks) || copyBlocks.length === 0) {
    errors.push(`${path} must be a non-empty array`);
    return;
  }

  copyBlocks.forEach((copyBlock, index) => {
    appendPrefixedErrors(errors, validateProviderContinuationPromptContract(copyBlock), `${path}[${index}]`);
  });
}

function validateGoal(errors, goal, path) {
  if (!isPlainObject(goal)) {
    errors.push(`${path} must be a plain object`);
    return;
  }

  validateAllowedFields(errors, goal, path, GOAL_ALLOWED_FIELDS);
  requireSafeToken(errors, goal.goalId, `${path}.goalId`);
  requireNonEmptyString(errors, goal.title, `${path}.title`);
  requireEnum(errors, goal.state, `${path}.state`, GOAL_STATE_SET);
  validateNullableSourceContractName(errors, goal.sourceContract, `${path}.sourceContract`);

  if (goal.sourceRef !== undefined) {
    validateSourceRef(errors, goal.sourceRef, `${path}.sourceRef`);
  }
}

function validateTask(errors, task, path) {
  if (!isPlainObject(task)) {
    errors.push(`${path} must be a plain object`);
    return;
  }

  validateAllowedFields(errors, task, path, TASK_ALLOWED_FIELDS);
  requireSafeToken(errors, task.taskId, `${path}.taskId`);
  requireNonEmptyString(errors, task.title, `${path}.title`);
  requireEnum(errors, task.state, `${path}.state`, GOAL_STATE_SET);
  validateNullableSourceContractName(errors, task.sourceContract, `${path}.sourceContract`);

  if (task.sourceRef !== undefined) {
    validateSourceRef(errors, task.sourceRef, `${path}.sourceRef`);
  }
}

function validateSourceSummary(errors, summary, path) {
  if (!isPlainObject(summary)) {
    errors.push(`${path} must be a plain object`);
    return;
  }

  validateAllowedFields(errors, summary, path, SOURCE_SUMMARY_ALLOWED_FIELDS);
  validateNullableSourceContractName(errors, summary.contractName, `${path}.contractName`);

  if (summary.contractVersion !== undefined && !Number.isInteger(summary.contractVersion)) {
    errors.push(`${path}.contractVersion must be an integer`);
  }

  if (summary.state !== undefined) {
    requireNonEmptyString(errors, summary.state, `${path}.state`);
  }

  if (summary.readiness !== undefined) {
    requireNonEmptyString(errors, summary.readiness, `${path}.readiness`);
  }

  if (summary.runId !== undefined) {
    requireSafeToken(errors, summary.runId, `${path}.runId`);
  }

  if (summary.previewHash !== undefined) {
    requireHash(errors, summary.previewHash, `${path}.previewHash`);
  }

  if (summary.pendingResultState !== undefined && summary.pendingResultState !== null) {
    requireNonEmptyString(errors, summary.pendingResultState, `${path}.pendingResultState`);
  }

  if (summary.blockedReasons !== undefined) {
    validateStringArray(errors, summary.blockedReasons, `${path}.blockedReasons`);
  }

  if (summary.sourceRef !== undefined) {
    validateSourceRef(errors, summary.sourceRef, `${path}.sourceRef`);
  }
}

function validateNextSafeAction(errors, nextSafeAction, path) {
  if (!isPlainObject(nextSafeAction)) {
    errors.push(`${path} must be a plain object`);
    return;
  }

  validateAllowedFields(errors, nextSafeAction, path, NEXT_SAFE_ACTION_ALLOWED_FIELDS);
  requireSafeToken(errors, nextSafeAction.actionId, `${path}.actionId`);
  requireNonEmptyString(errors, nextSafeAction.label, `${path}.label`);
  requireExact(errors, nextSafeAction.copyOnly, `${path}.copyOnly`, true);
  requireExact(errors, nextSafeAction.willMutate, `${path}.willMutate`, false);
}

function validateSourceContracts(errors, sourceContracts, path) {
  if (!Array.isArray(sourceContracts) || sourceContracts.length === 0) {
    errors.push(`${path} must be a non-empty array`);
    return;
  }

  sourceContracts.forEach((sourceContract, index) => {
    const sourcePath = `${path}[${index}]`;

    if (!isPlainObject(sourceContract)) {
      errors.push(`${sourcePath} must be a plain object`);
      return;
    }

    validateAllowedFields(errors, sourceContract, sourcePath, SOURCE_CONTRACT_ALLOWED_FIELDS);
    requireSafeSourceContractName(errors, sourceContract.contractName, `${sourcePath}.contractName`);

    if (sourceContract.contractVersion !== undefined && !Number.isInteger(sourceContract.contractVersion)) {
      errors.push(`${sourcePath}.contractVersion must be an integer`);
    }

    if (sourceContract.generatedAt !== undefined) {
      requireIsoTimestamp(errors, sourceContract.generatedAt, `${sourcePath}.generatedAt`);
    }

    if (sourceContract.readOnly !== undefined) {
      requireExact(errors, sourceContract.readOnly, `${sourcePath}.readOnly`, true);
    }

    if (sourceContract.requiredFor !== undefined) {
      validateStringArray(errors, sourceContract.requiredFor, `${sourcePath}.requiredFor`);
    }

    if (sourceContract.previewHash !== undefined) {
      requireHash(errors, sourceContract.previewHash, `${sourcePath}.previewHash`);
    }

    if (sourceContract.sourceRef !== undefined) {
      validateSourceRef(errors, sourceContract.sourceRef, `${sourcePath}.sourceRef`);
    }
  });
}

function validateCarryoverRefs(errors, refs, path) {
  if (!Array.isArray(refs)) {
    errors.push(`${path} must be an array`);
    return;
  }

  refs.forEach((ref, index) => validateSourceRef(errors, ref, `${path}[${index}]`));
}

function validateSourceRef(errors, sourceRef, path) {
  if (!isPlainObject(sourceRef)) {
    errors.push(`${path} must be a plain object`);
    return;
  }

  validateAllowedFields(errors, sourceRef, path, SOURCE_REF_ALLOWED_FIELDS);
  requireEnum(errors, sourceRef.kind, `${path}.kind`, SOURCE_REF_KIND_SET);
  requireNonEmptyString(errors, sourceRef.ref, `${path}.ref`);
  validateSourceRefRef(errors, sourceRef, path);

  if (sourceRef.label !== undefined) {
    requireNonEmptyString(errors, sourceRef.label, `${path}.label`);
  }

  if (sourceRef.generatedAt !== undefined) {
    requireIsoTimestamp(errors, sourceRef.generatedAt, `${path}.generatedAt`);
  }
}

function validateSourceRefRef(errors, sourceRef, path) {
  if (typeof sourceRef.ref !== 'string') {
    return;
  }

  const ref = sourceRef.ref.trim();

  if (isUnsafeText(ref)) {
    errors.push(`${path}.ref must not contain raw provider output, local session refs, or direct mutation routes`);
    return;
  }

  if (sourceRef.kind !== 'route' && (ref.startsWith('/') || ref.startsWith('~') || /^[a-z]:[\\/]/iu.test(ref))) {
    errors.push(`${path}.ref must not contain raw provider output, local session refs, or direct mutation routes`);
    return;
  }

  if (sourceRef.kind === 'contract' && !SOURCE_CONTRACT_NAME_PATTERN.test(ref)) {
    errors.push(`${path}.ref must be a safe contract ref`);
    return;
  }

  if (sourceRef.kind === 'fixture' && (!isSafeRepoRelativePath(ref) || !ref.startsWith('fixtures/'))) {
    errors.push(`${path}.ref must be a repo-relative fixture ref`);
    return;
  }

  if (sourceRef.kind === 'docs' && (!isSafeRepoRelativePath(ref) || !ref.startsWith('docs/'))) {
    errors.push(`${path}.ref must be a repo-relative docs ref`);
  }
}

function validateEvidenceRefs(errors, refs, path) {
  if (!Array.isArray(refs)) {
    errors.push(`${path} must be an array`);
    return;
  }

  refs.forEach((ref, index) => validateEvidenceRef(errors, ref, `${path}[${index}]`));
}

function validateEvidenceRef(errors, ref, path) {
  if (!isPlainObject(ref)) {
    errors.push(`${path} must be a plain object`);
    return;
  }

  validateAllowedFields(errors, ref, path, EVIDENCE_REF_ALLOWED_FIELDS);
  requireEnum(errors, ref.kind, `${path}.kind`, EVIDENCE_REF_KIND_SET);
  requireNonEmptyString(errors, ref.ref, `${path}.ref`);
  requireNonEmptyString(errors, ref.label, `${path}.label`);

  if (!isControlledEvidenceRef(ref)) {
    errors.push(`${path}.ref must be a controlled evidence reference`);
  }
}

function validateBoundaries(errors, boundaries, path) {
  if (!isPlainObject(boundaries)) {
    errors.push(`${path} must be a plain object`);
    return;
  }

  validateAllowedFields(errors, boundaries, path, new Set(Object.keys(THREAD_HANDOFF_PACK_BOUNDARIES)));

  for (const [field, expected] of Object.entries(THREAD_HANDOFF_PACK_BOUNDARIES)) {
    requireExact(errors, boundaries[field], `${path}.${field}`, expected);
  }
}

function validateDisabledCapabilities(errors, disabledCapabilities, path) {
  if (!Array.isArray(disabledCapabilities)) {
    errors.push(`${path} must be an array`);
    return;
  }

  const expected = Object.keys(THREAD_HANDOFF_PACK_BOUNDARIES);

  if (disabledCapabilities.length !== expected.length) {
    errors.push(`${path} must include every disabled thread handoff capability`);
  }

  for (const field of expected) {
    if (!disabledCapabilities.includes(field)) {
      errors.push(`${path} must include ${field}`);
    }
  }

  validateStringArray(errors, disabledCapabilities, path);
}

function validateNullableSourceContractName(errors, value, path) {
  if (value === undefined || value === null) {
    return;
  }

  requireSafeSourceContractName(errors, value, path);
}

function appendPrefixedErrors(errors, validation, path) {
  if (validation.ok) {
    return;
  }

  for (const error of validation.errors) {
    errors.push(`${path}.${error}`);
  }
}

function buildThreadHandoffPackBoundaries() {
  return { ...THREAD_HANDOFF_PACK_BOUNDARIES };
}

function controlledEvidenceRefs(refs) {
  const byKey = new Map();

  for (const ref of safeArray(refs)) {
    const controlled = controlledEvidenceRef(ref);

    if (controlled !== null) {
      byKey.set(`${controlled.kind}:${controlled.ref}`, controlled);
    }
  }

  return [...byKey.values()];
}

function controlledEvidenceRef(ref) {
  if (!isPlainObject(ref)) {
    return null;
  }

  const controlled = {
    kind: ref.kind,
    ref: safeDisplayText(ref.ref),
    label: safeDisplayText(ref.label)
  };

  return isControlledEvidenceRef(controlled) ? controlled : null;
}

function isControlledEvidenceRef(ref) {
  if (!isPlainObject(ref) || !EVIDENCE_REF_KIND_SET.has(ref.kind) || typeof ref.ref !== 'string') {
    return false;
  }

  if (isUnsafeText(ref.ref)) {
    return false;
  }

  if (ref.kind === 'repo-doc') {
    return isSafeRepoRelativePath(ref.ref) && ref.ref.startsWith('docs/');
  }

  if (ref.kind === 'commit') {
    return COMMIT_PATTERN.test(ref.ref);
  }

  return ref.ref.trim() !== '';
}

function safeSourceRef(sourceRef) {
  if (!isPlainObject(sourceRef)) {
    return null;
  }

  const ref = {
    kind: sourceRef.kind,
    ref: safeDisplayText(sourceRef.ref),
    label: safeDisplayText(sourceRef.label),
    generatedAt: safeIsoTimestamp(sourceRef.generatedAt)
  };
  const errors = [];

  validateSourceRef(errors, withoutUndefined(ref), 'sourceRef');

  return errors.length === 0 ? withoutUndefined(ref) : null;
}

function requireSafeSourceContractName(errors, value, path) {
  if (!safeContractName(value)) {
    errors.push(`${path} must be a safe contract name`);
  }
}

function safeContractName(value) {
  return typeof value === 'string' && SOURCE_CONTRACT_NAME_PATTERN.test(value) && !isUnsafeText(value)
    ? value
    : null;
}

function safeHash(value) {
  return typeof value === 'string' && HASH_PATTERN.test(value) ? value : null;
}

function requireHash(errors, value, path) {
  if (!safeHash(value)) {
    errors.push(`${path} must be a sha256 hash`);
  }
}

function safeToken(value) {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();

  return SAFE_TOKEN_PATTERN.test(trimmed) && !isUnsafeText(trimmed) ? trimmed : null;
}

function requireSafeToken(errors, value, path) {
  if (!safeToken(value)) {
    errors.push(`${path} must be a safe token`);
  }
}

function safeDisplayText(value) {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();

  return trimmed !== '' && !isUnsafeText(trimmed) ? trimmed : null;
}

function requireNonEmptyString(errors, value, path) {
  if (typeof value !== 'string' || value.trim() === '') {
    errors.push(`${path} must be a non-empty string`);
    return;
  }

  if (isUnsafeText(value)) {
    errors.push(`${path} must not contain raw provider output, local session refs, or direct mutation routes`);
  }
}

function validateStringArray(errors, value, path) {
  if (!Array.isArray(value)) {
    errors.push(`${path} must be an array`);
    return;
  }

  value.forEach((entry, index) => {
    const fieldPath = `${path}[${index}]`;

    if (typeof entry !== 'string' || entry.trim() === '') {
      errors.push(`${fieldPath} must be a non-empty string`);
      return;
    }

    if (isUnsafeText(entry)) {
      errors.push(`${fieldPath} must not contain raw provider output, local session refs, or direct mutation routes`);
    }
  });
}

function requireEnum(errors, value, path, values) {
  if (!values.has(value)) {
    errors.push(`${path} must be one of ${[...values].join(', ')}`);
  }
}

function requireExact(errors, value, path, expected) {
  if (!Object.is(value, expected)) {
    errors.push(`${path} must be ${JSON.stringify(expected)}`);
  }
}

function requireStringArrayIncludes(errors, value, path, expected) {
  if (!Array.isArray(value) || !value.includes(expected)) {
    errors.push(`${path} must include ${JSON.stringify(expected)}`);
  }
}

function validateAllowedFields(errors, value, path, allowedFields) {
  if (!isPlainObject(value)) {
    return;
  }

  for (const field of Object.keys(value)) {
    if (!allowedFields.has(field)) {
      errors.push(`${path}.${field} is not allowed`);
    }
  }
}

function requireIsoTimestamp(errors, value, path) {
  if (!safeIsoTimestamp(value)) {
    errors.push(`${path} must be an ISO timestamp`);
  }
}

function safeIsoTimestamp(value) {
  if (typeof value !== 'string') {
    return null;
  }

  const millis = Date.parse(value);

  if (!Number.isFinite(millis)) {
    return null;
  }

  return new Date(millis).toISOString() === value ? value : null;
}

function millisOrNow(value) {
  const millis = Date.parse(value);

  return Number.isFinite(millis) ? millis : Date.now();
}

function safeStringArray(value) {
  return uniqueStrings(safeArray(value)
    .map((entry) => safeDisplayText(entry))
    .filter((entry) => entry !== null));
}

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function uniqueStrings(values) {
  const seen = new Set();
  const result = [];

  for (const value of values) {
    if (typeof value !== 'string' || value.trim() === '') {
      continue;
    }

    const normalized = value.trim();

    if (!seen.has(normalized)) {
      seen.add(normalized);
      result.push(normalized);
    }
  }

  return result;
}

function firstNonEmptyString(...values) {
  for (const value of values) {
    const safe = safeDisplayText(value);

    if (safe !== null) {
      return safe;
    }
  }

  return null;
}

function cloneObject(value) {
  return isPlainObject(value) ? structuredClone(value) : {};
}

function cloneArray(value) {
  return Array.isArray(value) ? structuredClone(value) : [];
}

function withoutUndefined(value) {
  return Object.fromEntries(Object.entries(value).filter(([, entry]) => entry !== undefined && entry !== null));
}

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function invalidResult(error) {
  return {
    ok: false,
    errors: [error]
  };
}

function isSafeRepoRelativePath(value) {
  return typeof value === 'string' &&
    value.trim() !== '' &&
    !value.startsWith('/') &&
    !value.startsWith('~') &&
    !value.includes('\\') &&
    !value.split('/').includes('..') &&
    !isUnsafeText(value);
}

function isUnsafeText(value) {
  return typeof value === 'string' && UNSAFE_TEXT_PATTERN.test(value);
}

function findUnsafeFields(value, path, seen = new Set()) {
  if (value === null || value === undefined) {
    return [];
  }

  if (typeof value === 'string') {
    return isUnsafeText(value) ? [path] : [];
  }

  if (typeof value !== 'object') {
    return [];
  }

  if (seen.has(value)) {
    return [];
  }

  seen.add(value);

  if (Array.isArray(value)) {
    return value.flatMap((entry, index) => findUnsafeFields(entry, `${path}[${index}]`, seen));
  }

  const unsafe = [];

  for (const [field, entry] of Object.entries(value)) {
    const fieldPath = `${path}.${field}`;

    if (RAW_FIELD_NAME_PATTERN.test(field)) {
      unsafe.push(fieldPath);
      continue;
    }

    unsafe.push(...findUnsafeFields(entry, fieldPath, seen));
  }

  return unsafe;
}
