import {
  WORKER_RUN_BOUNDARIES,
  WORKER_RUN_COMMAND_TEMPLATE_ID,
  WORKER_RUN_DEFAULT_TIMEOUT_MS,
  WORKER_RUN_PROVIDER_ID,
  buildWorkerRunPreview,
  buildWorkerRunResult,
  validateWorkerRunPreviewContract
} from './worker-run-contracts.js';

export const WORKER_RUN_CONFIRMATION_CONTRACT_NAME = 'workerRunConfirmation.v1';
export const WORKER_RUN_BACKEND_CONTRACT_VERSION = 1;
export const V66_WORKER_RUN_GOAL_ID = 'v66-controlled-codex-worker-execution';

const WORKER_RUN_CONFIRM_ALLOWED_FIELDS = new Set([
  'planHash',
  'goalId',
  'taskId',
  'providerId',
  'commandTemplateId',
  'timeoutMs',
  'workspacePolicyId'
]);
const SAFE_TOKEN_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9._:-]*$/u;
const HASH_PATTERN = /^sha256:[a-f0-9]{64}$/u;

export class WorkerRunBackendError extends Error {
  constructor(code, message, safeDetails = {}) {
    super(message);
    this.name = 'WorkerRunBackendError';
    this.code = code;
    this.safeDetails = safeDetails;
  }
}

export function buildWorkerRunPreviewFromBackend({
  goalId = V66_WORKER_RUN_GOAL_ID,
  taskId = 'missing-task',
  generatedAt = new Date().toISOString(),
  providerReadiness = null
} = {}) {
  return buildWorkerRunPreview({
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
      requiredFor: ['codex-cli-readiness'],
      sourceRef: 'providerReadiness.v1'
    }]
  });
}

export function validateWorkerRunConfirmInput({
  preview,
  input
} = {}) {
  const errors = [];
  const previewValidation = validateWorkerRunPreviewContract(preview);

  if (!previewValidation.ok) {
    errors.push(...previewValidation.errors.map((error) => `preview.${error}`));
  } else if (preview.state !== 'ready') {
    errors.push('preview must be ready before worker run confirm');
  }

  if (!isPlainObject(input)) {
    errors.push('worker run confirm input must be a plain object');
    return { ok: false, errors };
  }

  for (const field of Object.keys(input)) {
    if (!WORKER_RUN_CONFIRM_ALLOWED_FIELDS.has(field)) {
      errors.push(`${field} is not an allowed worker run confirm field`);
    }
  }

  requireHash(errors, input.planHash, 'planHash');
  requireSafeToken(errors, input.goalId, 'goalId');
  requireSafeToken(errors, input.taskId, 'taskId');
  requireExact(errors, input.providerId, 'providerId', WORKER_RUN_PROVIDER_ID);
  requireExact(errors, input.commandTemplateId, 'commandTemplateId', WORKER_RUN_COMMAND_TEMPLATE_ID);
  requireExact(errors, input.timeoutMs, 'timeoutMs', preview?.timeoutMs);
  requireExact(errors, input.workspacePolicyId, 'workspacePolicyId', preview?.workspacePolicy?.policyId);

  if (previewValidation.ok) {
    if (input.planHash !== preview.planHash) {
      errors.push('planHash must match worker run preview');
    }

    if (input.goalId !== preview.goal.goalId) {
      errors.push('goalId must match worker run preview');
    }

    if (input.taskId !== preview.task.taskId) {
      errors.push('taskId must match worker run preview');
    }
  }

  return {
    ok: errors.length === 0,
    errors
  };
}

export async function confirmWorkerRunPreview({
  preview,
  input,
  executeWorker = fakeCodexWorkerAdapter,
  runId = null,
  startedAt = new Date().toISOString(),
  finishedAt = null
} = {}) {
  const validation = validateWorkerRunConfirmInput({
    preview,
    input
  });

  if (!validation.ok) {
    throw new WorkerRunBackendError(
      'invalid-worker-run-confirm-request',
      'Worker run confirm request is invalid.',
      { errors: validation.errors }
    );
  }

  if (typeof executeWorker !== 'function') {
    throw new WorkerRunBackendError(
      'missing-worker-run-adapter',
      'Worker run confirm requires an explicit backend adapter.',
      { adapter: 'missing' }
    );
  }

  const adapterRequest = buildWorkerRunAdapterRequest({ preview });
  const adapterResult = await executeWorker(structuredClone(adapterRequest));
  const normalized = normalizeAdapterResult(adapterResult);
  const effectiveFinishedAt = new Date(millisOrNow(finishedAt ?? adapterResult?.finishedAt ?? startedAt)).toISOString();
  const effectiveRunId = safeToken(runId) ?? `worker-run-${shortHash({
    goalId: preview.goal.goalId,
    taskId: preview.task.taskId,
    planHash: preview.planHash,
    startedAt
  })}`;
  const result = buildWorkerRunResult({
    preview,
    runId: effectiveRunId,
    startedAt,
    finishedAt: effectiveFinishedAt,
    status: normalized.status,
    adapter: 'fake-codex-worker',
    realCodexOptIn: false,
    providerResult: normalized.providerResult,
    verifier: normalized.verifier,
    failureLayer: normalized.failureLayer
  });

  return {
    contractName: WORKER_RUN_CONFIRMATION_CONTRACT_NAME,
    contractVersion: WORKER_RUN_BACKEND_CONTRACT_VERSION,
    goalId: preview.goal.goalId,
    taskId: preview.task.taskId,
    status: result.status,
    providerId: WORKER_RUN_PROVIDER_ID,
    commandTemplateId: WORKER_RUN_COMMAND_TEMPLATE_ID,
    planHash: preview.planHash,
    timeoutMs: preview.timeoutMs,
    workspacePolicyId: preview.workspacePolicy.policyId,
    runId: result.runId,
    adapter: 'fake-codex-worker',
    realCodexOptIn: false,
    adapterRequest,
    result,
    confirmContext: {
      acceptedBodyFields: [...WORKER_RUN_CONFIRM_ALLOWED_FIELDS],
      samePreviewContextRequired: true,
      acceptedPlanHashFromPreview: true,
      acceptsProviderCommand: false,
      acceptsRendererCommand: false,
      acceptsWorkspacePath: false
    },
    safety: {
      backendOwnedPreviewConfirm: true,
      fakeAdapterDefault: true,
      realCodexRequiresOptIn: true,
      directGoalEventAppendAvailable: false,
      directTaskCompletionAvailable: false,
      providerSuccessCompletesTask: false,
      providerOutputApprovesReview: false,
      mainWorktreeWriteAvailable: false,
      gitMutationAvailable: false,
      githubReleaseAutomationAvailable: false,
      rawProviderOutputAvailable: false
    }
  };
}

export function buildWorkerRunAdapterRequest({ preview }) {
  return {
    contractName: 'workerRunAdapterRequest.v1',
    contractVersion: WORKER_RUN_BACKEND_CONTRACT_VERSION,
    goalId: preview.goal.goalId,
    taskId: preview.task.taskId,
    providerId: WORKER_RUN_PROVIDER_ID,
    commandTemplateId: WORKER_RUN_COMMAND_TEMPLATE_ID,
    planHash: preview.planHash,
    timeoutMs: preview.timeoutMs,
    workspacePolicy: {
      policyId: preview.workspacePolicy.policyId,
      workspaceKind: preview.workspacePolicy.workspaceKind,
      backendOwned: true,
      mainWorktreeWrite: false,
      allowedWriteScope: preview.workspacePolicy.allowedWriteScope
    },
    resultPolicy: {
      successState: 'needs-review',
      reviewRequired: true,
      taskCompletionAvailable: false,
      reviewApprovalAvailable: false
    },
    boundaries: { ...WORKER_RUN_BOUNDARIES }
  };
}

async function fakeCodexWorkerAdapter(request) {
  return {
    status: 'needs-review',
    summary: `Fake Codex worker completed ${request.taskId}.`,
    changedFiles: [],
    validationCommands: [],
    artifactRefs: [`artifact-ref:v66:${request.taskId}:fake-worker-run`],
    verifierState: 'passed',
    verifierSummary: 'Fake worker adapter completed without running real Codex.',
    evidenceRefs: [{
      kind: 'repo-doc',
      ref: 'docs/qa/v66-controlled-codex-worker-execution-acceptance.md',
      label: 'v66 fake worker run evidence'
    }]
  };
}

function normalizeAdapterResult(result) {
  const source = isPlainObject(result) ? result : {};
  const timedOut = source.timedOut === true || source.status === 'timeout';
  const verifierFailed = source.verifierState === 'failed';
  const status = timedOut
    ? 'blocked'
    : verifierFailed
      ? 'failed'
      : source.status === 'blocked' || source.status === 'failed'
        ? source.status
        : 'needs-review';

  return {
    status,
    providerResult: {
      summary: firstNonEmptyString(source.summary, source.resultSummary, status === 'needs-review' ? 'Worker run completed.' : 'Worker run did not complete.'),
      changedFiles: arrayValue(source.changedFiles),
      validationCommands: arrayValue(source.validationCommands),
      artifactRefs: arrayValue(source.artifactRefs),
      verifierSummary: firstNonEmptyString(source.verifierSummary),
      risks: arrayValue(source.risks),
      blockers: arrayValue(source.blockers),
      evidenceRefs: arrayValue(source.evidenceRefs),
      rawTranscript: source.rawTranscript,
      rawModelOutput: source.rawModelOutput,
      providerOutput: source.providerOutput
    },
    verifier: {
      state: timedOut ? 'not-run' : verifierFailed ? 'failed' : 'passed',
      summary: firstNonEmptyString(source.verifierSummary, timedOut ? 'Worker run timed out before verifier execution.' : verifierFailed ? 'Focused verifier failed.' : 'Focused verifier passed.'),
      commands: arrayValue(source.validationCommands),
      evidenceRefs: arrayValue(source.evidenceRefs)
    },
    failureLayer: {
      kind: timedOut ? 'provider-timeout' : verifierFailed ? 'verifier-failed' : status === 'blocked' ? 'contract-blocked' : status === 'failed' ? 'adapter-error' : 'none',
      reason: status === 'needs-review'
        ? null
        : firstNonEmptyString(source.failureReason, source.blockerReason, source.verifierSummary, source.summary, status),
      retryable: source.retryable === true || timedOut || verifierFailed
    }
  };
}

function requireSafeToken(errors, value, field) {
  if (typeof value !== 'string' || !SAFE_TOKEN_PATTERN.test(value)) {
    errors.push(`${field} must be a safe token`);
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
