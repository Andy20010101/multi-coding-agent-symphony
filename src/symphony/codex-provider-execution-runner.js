import {
  CODEX_PROVIDER_ID,
  CODEX_PROVIDER_ROLE,
  buildCodexProviderRunRecord,
  validateCodexProviderExecutionConfirmationContract,
  validateCodexProviderExecutionPreviewContract,
  validateCodexProviderRunRecordContract
} from './codex-provider-execution-contracts.js';

export class CodexProviderExecutionRunnerError extends Error {
  constructor(code, message, details = {}) {
    super(message);
    this.name = 'CodexProviderExecutionRunnerError';
    this.code = code;
    this.details = details;
  }
}

export const CODEX_PROVIDER_EXECUTION_RUNNER_RESULT_CONTRACT_NAME = 'codexProviderExecutionRunnerResult.v1';
export const CODEX_PROVIDER_EXECUTION_RUNNER_CONTRACT_VERSION = 1;
export const DEFAULT_CODEX_PROVIDER_TIMEOUT_MS = 15 * 60 * 1000;
export const MAX_CODEX_PROVIDER_TIMEOUT_MS = 30 * 60 * 1000;

const SAFE_CWD_PATTERN = /^(?:\.|[a-zA-Z0-9][a-zA-Z0-9._/-]*)$/u;
const UNSAFE_CWD_PATTERN = /(?:^|\/)(?:\.codex|\.claude|\.git|\.symphony)(?:\/|$)|\.\.|\.jsonl(?:$|\/)/u;

export function buildCodexProviderExecutionRunnerRequest({
  preview,
  confirmation,
  runId,
  cwd = '.',
  timeoutMs = DEFAULT_CODEX_PROVIDER_TIMEOUT_MS
} = {}) {
  assertRunnablePreviewAndConfirmation({ preview, confirmation });
  assertSafeRunId(runId);
  assertSafeCwd(cwd);
  assertSafeTimeout(timeoutMs);

  return {
    contractName: 'codexProviderExecutionRunnerRequest.v1',
    contractVersion: CODEX_PROVIDER_EXECUTION_RUNNER_CONTRACT_VERSION,
    runId,
    providerId: CODEX_PROVIDER_ID,
    role: CODEX_PROVIDER_ROLE,
    goalId: preview.goal.goalId,
    taskId: preview.task.taskId,
    previewHash: preview.previewHash,
    taskPackHash: preview.taskPackHash,
    confirmedAt: confirmation.confirmedAt,
    cwd,
    timeoutMs,
    taskInput: {
      taskPackAvailable: preview.inputSummary.taskPackAvailable,
      taskPromptSummary: preview.inputSummary.taskPromptSummary,
      acceptanceCriteria: [...preview.inputSummary.acceptanceCriteria],
      evidenceRefs: structuredClone(preview.inputSummary.evidenceRefs),
      resultReturn: structuredClone(preview.resultReturn)
    },
    boundaries: {
      codexOnly: true,
      workerRoleOnly: true,
      genericShellAvailable: false,
      arbitraryCommandAvailable: false,
      rawTranscriptAvailable: false,
      rawModelOutputAvailable: false,
      directGoalEventAppendAvailable: false,
      directTaskCompleteAvailable: false,
      reviewerMutationAvailable: false,
      mainVerificationMutationAvailable: false,
      releaseGateMutationAvailable: false,
      gitMutationAvailable: false,
      tagAutomationAvailable: false,
      publishAutomationAvailable: false,
      githubReleaseAutomationAvailable: false
    }
  };
}

export async function runConfirmedCodexProviderExecution({
  preview,
  confirmation,
  runId,
  cwd = '.',
  timeoutMs = DEFAULT_CODEX_PROVIDER_TIMEOUT_MS,
  startedAt = new Date().toISOString(),
  finishedAt = null,
  executeCodex
} = {}) {
  if (typeof executeCodex !== 'function') {
    throw new CodexProviderExecutionRunnerError(
      'missing-codex-executor',
      'Codex provider execution requires an explicit executor function.'
    );
  }

  const request = buildCodexProviderExecutionRunnerRequest({
    preview,
    confirmation,
    runId,
    cwd,
    timeoutMs
  });
  const effectiveStartedAt = new Date(millisOrNow(startedAt)).toISOString();
  const executorResult = await executeCodex(structuredClone(request));
  const normalizedResult = normalizeExecutorResult(executorResult, {
    fallbackEvidenceRefs: preview.inputSummary.evidenceRefs
  });
  const effectiveFinishedAt = new Date(millisOrNow(finishedAt ?? executorResult?.finishedAt ?? effectiveStartedAt)).toISOString();
  const runRecord = buildCodexProviderRunRecord({
    preview,
    confirmation,
    runId,
    startedAt: effectiveStartedAt,
    finishedAt: effectiveFinishedAt,
    status: normalizedResult.status,
    providerResult: normalizedResult.providerResult
  });
  const runValidation = validateCodexProviderRunRecordContract(runRecord, {
    preview,
    confirmation
  });

  if (!runValidation.ok) {
    throw new CodexProviderExecutionRunnerError(
      'invalid-codex-provider-run-record',
      'Codex provider execution produced an invalid run record.',
      { reason: runValidation.errors[0] }
    );
  }

  return {
    contractName: CODEX_PROVIDER_EXECUTION_RUNNER_RESULT_CONTRACT_NAME,
    contractVersion: CODEX_PROVIDER_EXECUTION_RUNNER_CONTRACT_VERSION,
    runId,
    providerId: CODEX_PROVIDER_ID,
    role: CODEX_PROVIDER_ROLE,
    previewHash: preview.previewHash,
    taskPackHash: preview.taskPackHash,
    status: runRecord.status,
    runnerRequest: request,
    runRecord,
    resultIntakeRequest: structuredClone(runRecord.resultIntakeRequest),
    safety: {
      writesGoalEventLog: false,
      writesTaskState: false,
      writesReviewGate: false,
      writesMainGate: false,
      writesReleaseGate: false,
      exposesRawTranscript: false,
      exposesRawModelOutput: false,
      genericShellAvailable: false,
      gitMutationAvailable: false,
      releaseAutomationAvailable: false
    }
  };
}

function assertRunnablePreviewAndConfirmation({
  preview,
  confirmation
}) {
  const previewValidation = validateCodexProviderExecutionPreviewContract(preview);

  if (!previewValidation.ok) {
    throw new CodexProviderExecutionRunnerError(
      'invalid-codex-provider-execution-preview',
      'Codex provider execution preview is invalid.',
      { reason: previewValidation.errors[0] }
    );
  }

  if (preview.blockedReasons.length !== 0) {
    throw new CodexProviderExecutionRunnerError(
      'blocked-codex-provider-execution-preview',
      'Codex provider execution preview must be ready before runner execution.',
      { reason: preview.blockedReasons[0] }
    );
  }

  const confirmationValidation = validateCodexProviderExecutionConfirmationContract(confirmation, {
    preview
  });

  if (!confirmationValidation.ok) {
    throw new CodexProviderExecutionRunnerError(
      'invalid-codex-provider-execution-confirmation',
      'Codex provider execution confirmation is invalid.',
      { reason: confirmationValidation.errors[0] }
    );
  }
}

function normalizeExecutorResult(result, {
  fallbackEvidenceRefs
}) {
  const source = isPlainObject(result) ? result : {};
  const status = source.status === 'blocked' ? 'blocked' : 'completed';
  const evidenceRefs = Array.isArray(source.evidenceRefs) && source.evidenceRefs.length > 0
    ? source.evidenceRefs
    : fallbackEvidenceRefs;

  return {
    status,
    providerResult: {
      summary: firstNonEmptyString(source.summary, source.resultSummary),
      changedFiles: arrayValue(source.changedFiles),
      validationCommands: arrayValue(source.validationCommands),
      risks: arrayValue(source.risks),
      blockers: arrayValue(source.blockers),
      blockerReason: firstNonEmptyString(source.blockerReason, source.blocker?.reason),
      evidenceRefs,
      rawTranscript: source.rawTranscript,
      rawModelOutput: source.rawModelOutput,
      providerOutput: source.providerOutput
    }
  };
}

function assertSafeRunId(runId) {
  if (typeof runId !== 'string' || !/^[a-zA-Z0-9][a-zA-Z0-9._:-]*$/u.test(runId.trim())) {
    throw new CodexProviderExecutionRunnerError(
      'invalid-codex-provider-run-id',
      'Codex provider execution runId must be a safe token.'
    );
  }
}

function assertSafeCwd(cwd) {
  if (typeof cwd !== 'string' || cwd.trim() === '' || !SAFE_CWD_PATTERN.test(cwd) || UNSAFE_CWD_PATTERN.test(cwd)) {
    throw new CodexProviderExecutionRunnerError(
      'invalid-codex-provider-cwd',
      'Codex provider execution cwd must be an explicit safe workspace path.'
    );
  }
}

function assertSafeTimeout(timeoutMs) {
  if (!Number.isInteger(timeoutMs) || timeoutMs <= 0 || timeoutMs > MAX_CODEX_PROVIDER_TIMEOUT_MS) {
    throw new CodexProviderExecutionRunnerError(
      'invalid-codex-provider-timeout',
      'Codex provider execution timeout must be a positive bounded integer.'
    );
  }
}

function firstNonEmptyString(...values) {
  return values.find((value) => typeof value === 'string' && value.trim() !== '') ?? null;
}

function arrayValue(value) {
  return Array.isArray(value) ? value : [];
}

function millisOrNow(value) {
  const ms = Date.parse(value);

  return Number.isNaN(ms) ? Date.now() : ms;
}

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}
