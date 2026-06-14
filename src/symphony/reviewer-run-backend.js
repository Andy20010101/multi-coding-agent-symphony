import {
  REVIEWER_RUN_BOUNDARIES,
  REVIEWER_RUN_COMMAND_TEMPLATE_ID,
  REVIEWER_RUN_PROVIDER_ID,
  REVIEWER_RUN_ROLE,
  buildReviewerRunHandoff,
  buildReviewerRunVerdict,
  validateReviewerRunHandoffContract
} from './reviewer-run-contracts.js';

export const REVIEWER_RUN_CONFIRMATION_CONTRACT_NAME = 'reviewerRunConfirmation.v1';
export const REVIEWER_RUN_BACKEND_CONTRACT_VERSION = 1;
export const V67_REVIEWER_RUN_GOAL_ID = 'v67-claude-code-reviewer-lane';

const REVIEWER_RUN_CONFIRM_ALLOWED_FIELDS = new Set([
  'planHash',
  'goalId',
  'taskId',
  'providerId',
  'role',
  'commandTemplateId',
  'handoffPackRef',
  'reviewerActorId'
]);
const SAFE_TOKEN_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9._:-]*$/u;
const HASH_PATTERN = /^sha256:[a-f0-9]{64}$/u;

export class ReviewerRunBackendError extends Error {
  constructor(code, message, safeDetails = {}) {
    super(message);
    this.name = 'ReviewerRunBackendError';
    this.code = code;
    this.safeDetails = safeDetails;
  }
}

export function buildReviewerRunPreviewFromBackend({
  goalId = V67_REVIEWER_RUN_GOAL_ID,
  taskId = 'missing-task',
  generatedAt = new Date().toISOString(),
  providerReadiness = null,
  workerEvidence = null,
  reviewerActorId = 'claude-reviewer-v67',
  handoffPackRef = null
} = {}) {
  return buildReviewerRunHandoff({
    generatedAt,
    goal: {
      goalId,
      title: goalId,
      state: goalId === 'missing-goal' ? 'missing' : 'active',
      sourceContract: 'goal-next-action.v1',
      sourceRef: `goal-next-action:${goalId}`
    },
    task: {
      taskId,
      title: taskId,
      state: taskId === 'missing-task' ? 'missing' : 'active',
      sourceContract: 'goal-next-action.v1',
      sourceRef: `goal-next-action:${goalId}:${taskId}`
    },
    providerReadiness,
    reviewerIdentity: {
      reviewerActorId,
      sourceContract: 'operator-reviewer-identity.v1',
      sourceRef: `operator-reviewer:${reviewerActorId}`
    },
    workerEvidence: workerEvidence ?? defaultSanitizedWorkerEvidence({ taskId }),
    handoffPackRef: handoffPackRef ?? `artifact-ref:v67:${taskId}:reviewer-handoff-pack`,
    sourceContracts: [{
      contractName: 'goal-next-action.v1',
      contractVersion: 1,
      readOnly: true,
      requiredFor: ['active-goal', 'active-task'],
      sourceRef: `goal-next-action:${goalId}`
    }, {
      contractName: 'providerReadiness.v1',
      contractVersion: 1,
      readOnly: true,
      requiredFor: ['claude-code-cli-readiness'],
      sourceRef: 'providerReadiness.v1'
    }, {
      contractName: 'workerRunResult.v1',
      contractVersion: 1,
      readOnly: true,
      requiredFor: ['sanitized-worker-evidence'],
      sourceRef: 'workerRunResult.v1'
    }]
  });
}

export function validateReviewerRunConfirmInput({
  preview,
  input
} = {}) {
  const errors = [];
  const previewValidation = validateReviewerRunHandoffContract(preview);

  if (!previewValidation.ok) {
    errors.push(...previewValidation.errors.map((error) => `preview.${error}`));
  } else if (preview.state !== 'ready') {
    errors.push('preview must be ready before reviewer run confirm');
  }

  if (!isPlainObject(input)) {
    errors.push('reviewer run confirm input must be a plain object');
    return { ok: false, errors };
  }

  for (const field of Object.keys(input)) {
    if (!REVIEWER_RUN_CONFIRM_ALLOWED_FIELDS.has(field)) {
      errors.push(`${field} is not an allowed reviewer run confirm field`);
    }
  }

  requireHash(errors, input.planHash, 'planHash');
  requireSafeToken(errors, input.goalId, 'goalId');
  requireSafeToken(errors, input.taskId, 'taskId');
  requireExact(errors, input.providerId, 'providerId', REVIEWER_RUN_PROVIDER_ID);
  requireExact(errors, input.role, 'role', REVIEWER_RUN_ROLE);
  requireExact(errors, input.commandTemplateId, 'commandTemplateId', REVIEWER_RUN_COMMAND_TEMPLATE_ID);
  requireSafeRef(errors, input.handoffPackRef, 'handoffPackRef');
  requireSafeToken(errors, input.reviewerActorId, 'reviewerActorId');

  if (previewValidation.ok) {
    if (input.planHash !== preview.planHash) {
      errors.push('planHash must match reviewer run preview');
    }

    if (input.goalId !== preview.goal.goalId) {
      errors.push('goalId must match reviewer run preview');
    }

    if (input.taskId !== preview.task.taskId) {
      errors.push('taskId must match reviewer run preview');
    }

    if (input.handoffPackRef !== preview.handoffPackRef) {
      errors.push('handoffPackRef must match reviewer run preview');
    }

    if (input.reviewerActorId !== preview.reviewerIdentity.reviewerActorId) {
      errors.push('reviewerActorId must match reviewer run preview');
    }
  }

  return {
    ok: errors.length === 0,
    errors
  };
}

export async function confirmReviewerRunPreview({
  preview,
  input,
  executeReviewer = fakeClaudeReviewerAdapter,
  verdictId = null,
  startedAt = new Date().toISOString(),
  finishedAt = null
} = {}) {
  const validation = validateReviewerRunConfirmInput({
    preview,
    input
  });

  if (!validation.ok) {
    throw new ReviewerRunBackendError(
      'invalid-reviewer-run-confirm-request',
      'Reviewer run confirm request is invalid.',
      { errors: validation.errors }
    );
  }

  if (typeof executeReviewer !== 'function') {
    throw new ReviewerRunBackendError(
      'missing-reviewer-run-adapter',
      'Reviewer run confirm requires an explicit backend adapter.',
      { adapter: 'missing' }
    );
  }

  const adapterRequest = buildReviewerRunAdapterRequest({ preview });
  const adapterResult = await executeReviewer(structuredClone(adapterRequest));
  const normalized = normalizeAdapterResult(adapterResult);
  const effectiveFinishedAt = new Date(millisOrNow(finishedAt ?? adapterResult?.finishedAt ?? startedAt)).toISOString();
  const effectiveVerdictId = safeToken(verdictId) ?? `reviewer-verdict-${shortHash({
    goalId: preview.goal.goalId,
    taskId: preview.task.taskId,
    planHash: preview.planHash,
    startedAt
  })}`;
  const verdict = buildReviewerRunVerdict({
    handoff: preview,
    verdictId: effectiveVerdictId,
    startedAt,
    finishedAt: effectiveFinishedAt,
    status: normalized.status,
    adapter: 'fake-claude-reviewer',
    realClaudeSmokeOptIn: false,
    reviewerOutput: normalized.reviewerOutput,
    evidenceRefs: normalized.evidenceRefs
  });

  return {
    contractName: REVIEWER_RUN_CONFIRMATION_CONTRACT_NAME,
    contractVersion: REVIEWER_RUN_BACKEND_CONTRACT_VERSION,
    goalId: preview.goal.goalId,
    taskId: preview.task.taskId,
    status: verdict.status,
    providerId: REVIEWER_RUN_PROVIDER_ID,
    role: REVIEWER_RUN_ROLE,
    commandTemplateId: REVIEWER_RUN_COMMAND_TEMPLATE_ID,
    planHash: preview.planHash,
    handoffPackRef: preview.handoffPackRef,
    verdictId: verdict.verdictId,
    adapter: 'fake-claude-reviewer',
    realClaudeSmokeOptIn: false,
    adapterRequest,
    verdict,
    confirmContext: {
      acceptedBodyFields: [...REVIEWER_RUN_CONFIRM_ALLOWED_FIELDS],
      samePreviewContextRequired: true,
      acceptedPlanHashFromPreview: true,
      acceptsProviderCommand: false,
      acceptsRendererCommand: false,
      acceptsWorkspacePath: false,
      acceptsRawWorkerTranscript: false
    },
    safety: {
      backendOwnedPreviewConfirm: true,
      fakeAdapterDefault: true,
      realClaudeRequiresOptIn: true,
      directGoalEventAppendAvailable: false,
      directTaskCompletionAvailable: false,
      reviewerOutputCompletesTask: false,
      reviewerOutputApprovesAdoption: false,
      reviewerVerdictPassesMainVerification: false,
      reviewerVerdictMarksReleaseReady: false,
      mainWorktreeWriteAvailable: false,
      gitMutationAvailable: false,
      githubReleaseAutomationAvailable: false,
      rawProviderOutputAvailable: false,
      rawWorkerTranscriptAvailable: false
    }
  };
}

export function buildReviewerRunAdapterRequest({ preview }) {
  return {
    contractName: 'reviewerRunAdapterRequest.v1',
    contractVersion: REVIEWER_RUN_BACKEND_CONTRACT_VERSION,
    goalId: preview.goal.goalId,
    taskId: preview.task.taskId,
    providerId: REVIEWER_RUN_PROVIDER_ID,
    role: REVIEWER_RUN_ROLE,
    commandTemplateId: REVIEWER_RUN_COMMAND_TEMPLATE_ID,
    planHash: preview.planHash,
    handoffPackRef: preview.handoffPackRef,
    reviewerActorId: preview.reviewerIdentity.reviewerActorId,
    workerActorId: preview.workerEvidence.workerActorId,
    sanitizedInputPack: {
      sourceContract: preview.workerEvidence.sourceContract,
      sourceRef: preview.workerEvidence.sourceRef,
      workerRunId: preview.workerEvidence.workerRunId,
      taskState: preview.workerEvidence.taskState,
      summary: preview.workerEvidence.summary,
      changedFiles: preview.workerEvidence.changedFiles,
      validationCommands: preview.workerEvidence.validationCommands,
      artifactRefs: preview.workerEvidence.artifactRefs,
      evidenceRefs: preview.workerEvidence.evidenceRefs
    },
    resultPolicy: {
      allowedVerdicts: ['approved', 'needs-revision', 'blocked'],
      taskCompletionAvailable: false,
      adoptionAvailable: false,
      mainVerificationAvailable: false,
      releaseReadinessAvailable: false
    },
    boundaries: { ...REVIEWER_RUN_BOUNDARIES }
  };
}

async function fakeClaudeReviewerAdapter(request) {
  return {
    status: 'approved',
    summary: `Fake Claude reviewer approved ${request.taskId}.`,
    findings: [],
    validationCommands: [],
    evidenceRefs: [{
      kind: 'repo-doc',
      ref: 'docs/qa/v67-claude-code-reviewer-lane-acceptance.md',
      label: 'v67 fake reviewer evidence'
    }]
  };
}

function normalizeAdapterResult(result) {
  const source = isPlainObject(result) ? result : {};
  const status = source.status === 'needs-revision' || source.status === 'blocked' || source.status === 'approved'
    ? source.status
    : 'approved';
  const evidenceRefs = arrayValue(source.evidenceRefs);

  return {
    status,
    reviewerOutput: {
      summary: firstNonEmptyString(source.summary, status === 'approved' ? 'Reviewer approved the handoff.' : 'Reviewer did not approve the handoff.'),
      findings: arrayValue(source.findings),
      validationCommands: arrayValue(source.validationCommands),
      evidenceRefs,
      risks: arrayValue(source.risks),
      blockers: arrayValue(source.blockers),
      revisionSummary: firstNonEmptyString(source.revisionSummary),
      rawTranscript: source.rawTranscript,
      rawModelOutput: source.rawModelOutput,
      providerOutput: source.providerOutput
    },
    evidenceRefs
  };
}

function defaultSanitizedWorkerEvidence({ taskId }) {
  return {
    sourceContract: 'workerRunResult.v1',
    sourceRef: 'fixtures/contracts/worker-run/result.sanitized-success.v1.json',
    workerRunId: `worker-run-v66-${taskId}`,
    workerProviderId: 'codex-cli',
    workerRole: 'worker',
    workerActorId: 'codex-worker-v66',
    taskState: 'needs-review',
    reviewRequired: true,
    taskCompleted: false,
    reviewApproved: false,
    mainVerified: false,
    releaseReady: false,
    summary: 'Sanitized Codex worker evidence is ready for Claude Code review.',
    changedFiles: ['src/symphony/worker-run-contracts.js'],
    validationCommands: ['node --test tests/v66-controlled-codex-worker-execution.test.js'],
    artifactRefs: [`artifact-ref:v66:${taskId}:fake-worker-run`],
    evidenceRefs: [{
      kind: 'repo-doc',
      ref: 'docs/qa/v66-controlled-codex-worker-execution-acceptance.md',
      label: 'v66 worker evidence'
    }]
  };
}

function requireSafeToken(errors, value, field) {
  if (typeof value !== 'string' || !SAFE_TOKEN_PATTERN.test(value)) {
    errors.push(`${field} must be a safe token`);
  }
}

function requireSafeRef(errors, value, field) {
  if (typeof value !== 'string' || value.length === 0 || /(?:^|[/.])(?:\.codex|\.claude|\.git|\.symphony)(?:[/]|$)|\/Users\/|\.jsonl(?:$|[/\s])/iu.test(value)) {
    errors.push(`${field} must be a safe ref`);
  }
}

function requireHash(errors, value, field) {
  if (typeof value !== 'string' || !HASH_PATTERN.test(value)) {
    errors.push(`${field} must be a sha256 hash`);
  }
}

function requireExact(errors, value, field, expected) {
  if (value !== expected) {
    errors.push(`${field} must be ${String(expected)}`);
  }
}

function firstNonEmptyString(...values) {
  return values.find((value) => typeof value === 'string' && value.length > 0) ?? null;
}

function arrayValue(value) {
  return Array.isArray(value) ? value : [];
}

function safeToken(value) {
  return typeof value === 'string' && SAFE_TOKEN_PATTERN.test(value) ? value : null;
}

function shortHash(value) {
  return JSON.stringify(value)
    .split('')
    .reduce((hash, character) => ((hash * 33) + character.charCodeAt(0)) >>> 0, 5381)
    .toString(16)
    .padStart(8, '0');
}

function millisOrNow(value) {
  const ms = Date.parse(value);

  return Number.isFinite(ms) ? ms : Date.now();
}

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}
