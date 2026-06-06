import { createHash, randomUUID } from 'node:crypto';
import { resolve, relative, isAbsolute } from 'node:path';

import { NodeProcessRunner } from '../process-runner.js';
import { redactSecrets } from '../redaction.js';
import { recordGoalOperationRun } from './goal-operation-run-registry.js';

export const CONTROLLED_PROVIDER_RUNNER_CONTRACT_NAME = 'controlled-provider-runner.v1';
export const CONTROLLED_PROVIDER_RUNNER_CONTRACT_VERSION = 1;
export const CONTROLLED_PROVIDER_RUNNER_PLAN_PREVIEW_CONTRACT_NAME = 'controlled-provider-runner-plan-preview.v1';
export const CONTROLLED_PROVIDER_RUNNER_PLAN_PREVIEW_CONTRACT_VERSION = 1;
export const CONTROLLED_PROVIDER_RUNNER_CONFIRMATION_CONTRACT_NAME = 'controlled-provider-runner-confirmation.v1';
export const CONTROLLED_PROVIDER_RUNNER_CONFIRMATION_CONTRACT_VERSION = 1;
export const CONTROLLED_PROVIDER_RUNNER_OPERATION_CONTRACT_NAME = 'controlled-provider-runner-operation.v1';
export const CONTROLLED_PROVIDER_RUNNER_OPERATION_CONTRACT_VERSION = 1;
export const V41_CONTROLLED_PROVIDER_RUNNER_GOAL_ID = 'v41-controlled-cli-provider-runner-backend-completion';
export const V41_ACTIVE_CONTROLLED_PROVIDER_IDS = Object.freeze([
  'claude-code-cli',
  'codex-cli'
]);

export const CONTROLLED_PROVIDER_RUNNER_FAILURE_LAYERS = Object.freeze([
  'schema',
  'provider-availability',
  'command-execution',
  'timeout',
  'redaction',
  'workspace',
  'expected-check'
]);

const REQUEST_ALLOWED_FIELDS = Object.freeze([
  'providerId',
  'goalId',
  'taskId',
  'role',
  'mode',
  'promptRef',
  'evidenceRef',
  'handoffRef'
]);
const FORBIDDEN_REQUEST_FIELDS = Object.freeze([
  'args',
  'argv',
  'binary',
  'binaryPath',
  'command',
  'commandLine',
  'commandPath',
  'cwd',
  'env',
  'environment',
  'executable',
  'executablePath',
  'localPath',
  'model',
  'path',
  'prompt',
  'providerBinary',
  'rawCommand',
  'shell',
  'stdin',
  'timeoutMs',
  'workingDirectory',
  'workspace',
  'workspaceRoot'
]);
const ROLES = Object.freeze(['worker', 'reviewer']);
const MODES = Object.freeze(['reviewed-prompt', 'controlled-smoke']);
const OPERATION_STATUSES = Object.freeze(['running', 'completed', 'failed']);
const REDACTION_STATUSES = Object.freeze(['pending', 'applied', 'failed']);
const SAFE_REF_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._/-]*$/u;
const SAFE_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._-]*$/u;
const SHELL_META_PATTERN = /[;&|`$<>*?()[\]{}!\\\n\r]/u;
const SECRET_KEY_PATTERN = /(?:api[_-]?key|auth[_-]?token|oauth[_-]?token|access[_-]?token|refresh[_-]?token|bearer[_-]?token|password|passphrase|private[_-]?key|credential(?:s|[_-]?file|[_-]?contents)?|secret(?:value|[_-]?value)?|raw[_-]?provider[_-]?settings|raw[_-]?provider[_-]?config|raw[_-]?config|provider[_-]?settings)/iu;
const SECRET_VALUE_PATTERN = /(?:\bsk-[A-Za-z0-9_-]{8,}|\bgh[pousr]_[A-Za-z0-9_]{8,}|\bxox[baprs]-[A-Za-z0-9-]{8,}|-----BEGIN [A-Z ]*PRIVATE KEY-----|Bearer\s+[A-Za-z0-9._~+/=-]{8,})/iu;
const SECRET_VALUE_REDACTION_PATTERN = /(?:\bsk-[A-Za-z0-9_-]{8,}|\bgh[pousr]_[A-Za-z0-9_]{8,}|\bxox[baprs]-[A-Za-z0-9-]{8,}|-----BEGIN [A-Z ]*PRIVATE KEY-----|Bearer\s+[A-Za-z0-9._~+/=-]{8,})/giu;
const COMMAND_TEMPLATES = Object.freeze({
  'claude-code-cli': Object.freeze({
    providerId: 'claude-code-cli',
    adapterId: 'claude-code',
    commandTemplateId: 'v41.claude-code-cli.reviewed-prompt.v1',
    executable: 'claude',
    args: Object.freeze([
      '-p',
      '--output-format',
      'stream-json',
      '--verbose',
      '--permission-mode',
      'dontAsk'
    ]),
    logStrategy: 'stream-json-stdout'
  }),
  'codex-cli': Object.freeze({
    providerId: 'codex-cli',
    adapterId: 'codex',
    commandTemplateId: 'v41.codex-cli.reviewed-prompt.v1',
    executable: 'codex',
    args: Object.freeze([
      'exec',
      '--json',
      '--sandbox',
      'read-only'
    ]),
    logStrategy: 'jsonl-stdout'
  })
});

export class ControlledProviderRunnerError extends Error {
  constructor(message, { failureLayer = 'schema', errors = [] } = {}) {
    super(message);
    this.name = 'ControlledProviderRunnerError';
    this.failureLayer = failureLayer;
    this.errors = errors;
  }
}

export function buildControlledProviderRunnerPreview(request, options = {}) {
  const normalized = normalizeControlledProviderRunRequest(request);
  const workspace = resolveControlledWorkspace(options);
  const template = commandTemplateFor(normalized.providerId);

  return {
    contractName: CONTROLLED_PROVIDER_RUNNER_CONTRACT_NAME,
    contractVersion: CONTROLLED_PROVIDER_RUNNER_CONTRACT_VERSION,
    goalId: normalized.goalId,
    taskId: normalized.taskId,
    role: normalized.role,
    providerId: normalized.providerId,
    mode: normalized.mode,
    commandTemplateId: template.commandTemplateId,
    adapterId: template.adapterId,
    logStrategy: template.logStrategy,
    promptRef: normalized.promptRef ?? null,
    evidenceRef: normalized.evidenceRef ?? null,
    handoffRef: normalized.handoffRef ?? null,
    execution: {
      backendOwnedCommandTemplate: true,
      shellExpansionAvailable: false,
      genericShellRunnerAvailable: false,
      rendererProviderInvocationAvailable: false,
      arbitraryCommandInputAvailable: false,
      arbitraryCwdInputAvailable: false,
      envValueExposureAvailable: false,
      envPolicy: 'inherit-process-env-without-previewing-values',
      rawProviderSettingsAvailable: false,
      timeoutMs: workspace.timeoutMs,
      cwdPolicy: 'backend-controlled-workspace-root',
      cwdRef: workspace.workspaceRef
    },
    failureLayers: [...CONTROLLED_PROVIDER_RUNNER_FAILURE_LAYERS],
    redaction: {
      required: true,
      status: 'pending'
    }
  };
}

export function buildControlledProviderRunnerPlanPreview(request, options = {}) {
  const runnerPreview = buildControlledProviderRunnerPreview(request, options);
  const expectedArtifacts = buildSanitizedProviderArtifactRefs({
    runId: `preview-${shortHash({
      goalId: runnerPreview.goalId,
      taskId: runnerPreview.taskId,
      role: runnerPreview.role,
      providerId: runnerPreview.providerId,
      mode: runnerPreview.mode,
      promptRef: runnerPreview.promptRef,
      evidenceRef: runnerPreview.evidenceRef,
      handoffRef: runnerPreview.handoffRef
    })}`,
    status: 'pending'
  });
  const reviewedContext = {
    goalId: runnerPreview.goalId,
    taskId: runnerPreview.taskId,
    role: runnerPreview.role,
    providerId: runnerPreview.providerId,
    mode: runnerPreview.mode,
    promptRef: runnerPreview.promptRef,
    evidenceRef: runnerPreview.evidenceRef,
    handoffRef: runnerPreview.handoffRef,
    commandTemplateId: runnerPreview.commandTemplateId,
    adapterId: runnerPreview.adapterId,
    logStrategy: runnerPreview.logStrategy,
    execution: runnerPreview.execution,
    failureLayers: runnerPreview.failureLayers,
    expectedArtifacts
  };
  const planHash = buildControlledProviderRunnerPlanHash(reviewedContext);
  const planId = `controlled-provider-runner-plan-${shortHash(reviewedContext)}`;

  return {
    contractName: CONTROLLED_PROVIDER_RUNNER_PLAN_PREVIEW_CONTRACT_NAME,
    contractVersion: CONTROLLED_PROVIDER_RUNNER_PLAN_PREVIEW_CONTRACT_VERSION,
    goalId: runnerPreview.goalId,
    taskId: runnerPreview.taskId,
    role: runnerPreview.role,
    providerId: runnerPreview.providerId,
    mode: runnerPreview.mode,
    status: 'planned',
    planId,
    planHash,
    commandTemplateId: runnerPreview.commandTemplateId,
    adapterId: runnerPreview.adapterId,
    reviewedContext,
    expectedArtifacts,
    confirm: {
      available: true,
      endpoint: {
        route: `/api/goals/${runnerPreview.goalId}/provider-runner-confirm`,
        method: 'POST',
        allowedBodyFields: [
          'goalId',
          'taskId',
          'role',
          'providerId',
          'mode',
          'promptRef',
          'evidenceRef',
          'handoffRef',
          'planId',
          'planHash'
        ],
        requiresSamePreviewContext: true,
        confirmUsesPlanHash: true
      }
    },
    previewEndpoint: {
      route: `/api/goals/${runnerPreview.goalId}/provider-runner-preview`,
      method: 'GET',
      allowedQueryFields: ['task', 'role', 'provider', 'mode', 'promptRef', 'evidenceRef', 'handoffRef'],
      rejectsArbitraryCommand: true,
      rejectsProviderBinary: true,
      rejectsCwdPath: true,
      rejectsPromptText: true,
      rejectsSecrets: true,
      rejectsInactiveProviders: true,
      writesInPreview: false
    },
    safety: {
      backendOwnedCommandTemplate: true,
      planHashRequired: true,
      genericShellRunnerAvailable: false,
      rendererProviderInvocationAvailable: false,
      arbitraryCommandInputAvailable: false,
      providerBinaryInputAvailable: false,
      arbitraryCwdInputAvailable: false,
      arbitraryPathInputAvailable: false,
      promptTextInputAvailable: false,
      secretInputAvailable: false,
      envValueExposureAvailable: false,
      reviewerApprovalInferenceAvailable: false,
      mainVerificationInferenceAvailable: false,
      releaseReadinessInferenceAvailable: false
    }
  };
}

export async function confirmControlledProviderRunnerPlan(body, options = {}) {
  assertControlledProviderRunnerConfirmBody(body);

  const request = controlledProviderRunnerRequestFromConfirmBody(body);
  const preview = buildControlledProviderRunnerPlanPreview(request, options);

  if (preview.planId !== body.planId || preview.planHash !== body.planHash) {
    throw new ControlledProviderRunnerError('Controlled provider runner confirm requires the exact plan id and plan hash returned by preview.', {
      failureLayer: 'schema',
      errors: [
        `planIdMatches=${preview.planId === body.planId}`,
        `planHashMatches=${preview.planHash === body.planHash}`
      ]
    });
  }

  const result = await runControlledProviderWithOperationRegistry(request, options);

  return {
    contractName: CONTROLLED_PROVIDER_RUNNER_CONFIRMATION_CONTRACT_NAME,
    contractVersion: CONTROLLED_PROVIDER_RUNNER_CONFIRMATION_CONTRACT_VERSION,
    goalId: preview.goalId,
    taskId: preview.taskId,
    role: preview.role,
    providerId: preview.providerId,
    mode: preview.mode,
    status: result.status,
    planId: preview.planId,
    planHash: preview.planHash,
    commandTemplateId: preview.commandTemplateId,
    operation: result.operation,
    artifactRefs: Array.isArray(result.artifactRefs) ? result.artifactRefs : [],
    output: {
      stdoutPreview: result.output?.stdoutPreview ?? '',
      stderrPreview: result.output?.stderrPreview ?? '',
      rawProviderOutputAvailable: false
    },
    confirmContext: {
      acceptedBodyFields: [
        'goalId',
        'taskId',
        'role',
        'providerId',
        'mode',
        'promptRef',
        'evidenceRef',
        'handoffRef',
        'planId',
        'planHash'
      ],
      samePreviewContextRequired: true,
      acceptedPlanHashFromPreview: true
    },
    safety: {
      backendOwnedCommandTemplate: true,
      genericShellRunnerAvailable: false,
      rendererProviderInvocationAvailable: false,
      arbitraryCommandInputAvailable: false,
      arbitraryCwdInputAvailable: false,
      providerBinaryInputAvailable: false,
      promptTextInputAvailable: false,
      secretInputAvailable: false,
      reviewerApprovalInferenceAvailable: false,
      mainVerificationInferenceAvailable: false,
      releaseReadinessInferenceAvailable: false
    }
  };
}

export async function runControlledProvider(request, options = {}) {
  const preview = buildControlledProviderRunnerPreview(request, options);
  const normalized = normalizeControlledProviderRunRequest(request);
  const workspace = resolveControlledWorkspace(options);
  const template = commandTemplateFor(normalized.providerId);
  const processRunner = options.processRunner ?? new NodeProcessRunner();
  const invocation = buildBackendInvocation({ normalized, workspace, template });
  const runId = normalizeRunId(options.runId ?? createControlledProviderRunId(), 'runId');
  const startedAt = new Date().toISOString();

  try {
    const result = await processRunner.run(invocation);
    return buildControlledProviderRunResult({
      preview,
      result,
      startedAt,
      finishedAt: new Date().toISOString(),
      runId,
      expectedCheck: options.expectedCheck,
      redactor: options.redactor
    });
  } catch (error) {
    return attachControlledProviderOperation({
      ...preview,
      runId,
      status: 'failed',
      startedAt,
      finishedAt: new Date().toISOString(),
      exitCode: null,
      signal: null,
      durationMs: null,
      timedOut: false,
      stalled: false,
      redaction: {
        required: true,
        status: 'applied'
      },
      output: {
        stdoutPreview: '',
        stderrPreview: redactPreview(error?.message ?? String(error), options.redactor),
        rawProviderOutputAvailable: false
      },
      failure: {
        layer: providerAvailabilityLayer(error),
        message: redactPreview(error?.message ?? String(error), options.redactor)
      }
    });
  }
}

export async function runControlledProviderWithOperationRegistry(request, options = {}) {
  let result;

  try {
    result = await runControlledProvider(request, options);
  } catch (error) {
    result = buildRejectedControlledProviderRunResult(request, error, {
      runId: options.runId,
      redactor: options.redactor
    });
  }

  if (options.stateDir) {
    await recordControlledProviderRunnerOperation(result, {
      stateDir: options.stateDir
    });
  }

  return result;
}

export async function recordControlledProviderRunnerOperation(result, { stateDir = '.symphony' } = {}) {
  const operation = validateControlledProviderRunnerOperationRecord(
    result.operation ?? buildControlledProviderRunnerOperationRecord(result)
  );
  const status = operation.status === 'completed' ? 'completed' : 'failed';

  return await recordGoalOperationRun({
    stateDir,
    operationId: operation.operationId,
    goalId: operation.goalId,
    taskId: operation.taskId,
    role: operation.role,
    commandKind: 'provider-runner',
    commandName: 'controlled provider runner',
    status,
    planHash: buildControlledProviderOperationPlanHash(operation),
    source: 'controlled-provider-runner',
    output: {
      stdoutSummary: operation.outputSummary.stdoutPreview,
      stderrSummary: operation.outputSummary.stderrPreview,
      exitCode: operation.exitCode,
      rawProviderOutputAvailable: false
    },
    runResult: operation,
    artifactRefs: operation.artifactRefs,
    verifierSummary: {
      status: operation.status,
      providerId: operation.providerId,
      commandTemplateId: operation.commandTemplateId,
      redactionStatus: operation.redaction.status,
      failureLayer: operation.failureLayer,
      reviewerApproved: false,
      mainVerified: false,
      releaseReady: false
    },
    failureReason: operation.failureReason
  });
}

export function normalizeControlledProviderRunRequest(request) {
  const errors = validateControlledProviderRunRequest(request);

  if (errors.length > 0) {
    throw new ControlledProviderRunnerError(`Invalid controlled provider runner request: ${errors.join('; ')}`, {
      failureLayer: 'schema',
      errors
    });
  }

  return {
    providerId: request.providerId,
    goalId: request.goalId,
    taskId: request.taskId,
    role: request.role,
    mode: request.mode,
    promptRef: request.promptRef,
    evidenceRef: request.evidenceRef,
    handoffRef: request.handoffRef
  };
}

export function validateControlledProviderRunRequest(request) {
  const errors = [];

  if (!isPlainObject(request)) {
    return ['request must be a plain object'];
  }

  validateAllowedRequestFields(errors, request);
  requireEnum(errors, request.providerId, 'providerId', V41_ACTIVE_CONTROLLED_PROVIDER_IDS);
  requireExact(errors, request.goalId, 'goalId', V41_CONTROLLED_PROVIDER_RUNNER_GOAL_ID);
  requireSafeId(errors, request.taskId, 'taskId');
  requireEnum(errors, request.role, 'role', ROLES);
  requireEnum(errors, request.mode, 'mode', MODES);

  if (!request.promptRef && !request.evidenceRef && !request.handoffRef) {
    errors.push('at least one of promptRef, evidenceRef, or handoffRef must be present');
  }

  for (const field of ['promptRef', 'evidenceRef', 'handoffRef']) {
    if (request[field] !== undefined) {
      requireSafeRef(errors, request[field], field);
    }
  }

  validateNoSecretBearingFields(errors, request);

  return errors;
}

export function commandTemplateFor(providerId) {
  const template = COMMAND_TEMPLATES[providerId];

  if (!template) {
    throw new ControlledProviderRunnerError(`Unsupported provider id: ${providerId}`, {
      failureLayer: 'schema',
      errors: ['providerId must be one of claude-code-cli, codex-cli']
    });
  }

  return template;
}

function buildBackendInvocation({ normalized, workspace, template }) {
  const args = [...template.args];

  if (template.providerId === 'codex-cli') {
    args.push('--cd', workspace.workspaceRoot);
  }

  return {
    executable: template.executable,
    args,
    cwd: workspace.workspaceRoot,
    stdin: buildControlledProviderPrompt(normalized),
    env: {},
    timeoutMs: workspace.timeoutMs,
    stallTimeoutMs: workspace.stallTimeoutMs,
    outputFiles: {}
  };
}

function buildControlledProviderPrompt(request) {
  return [
    'Run only the reviewed backend-controlled provider runner task described by these refs.',
    `goalId: ${request.goalId}`,
    `taskId: ${request.taskId}`,
    `role: ${request.role}`,
    `mode: ${request.mode}`,
    `promptRef: ${request.promptRef ?? 'none'}`,
    `evidenceRef: ${request.evidenceRef ?? 'none'}`,
    `handoffRef: ${request.handoffRef ?? 'none'}`,
    'Do not read credential files, expose env values, run arbitrary shell commands, merge, push, tag, publish, or self-approve.'
  ].join('\n');
}

function buildControlledProviderRunResult({
  preview,
  result,
  startedAt,
  finishedAt,
  runId,
  expectedCheck,
  redactor
}) {
  let stdoutPreview = '';
  let stderrPreview = '';
  let redactionStatus = 'applied';
  let redactionFailureMessage = null;

  try {
    stdoutPreview = redactPreview(result.stdout ?? '', redactor);
    stderrPreview = redactPreview(result.stderr ?? '', redactor);
  } catch (error) {
    redactionStatus = 'failed';
    redactionFailureMessage = 'provider output redaction failed before evidence capture';
  }

  const expectedCheckResult = redactionStatus === 'applied'
    ? evaluateExpectedCheck(expectedCheck, { preview, result, stdoutPreview, stderrPreview })
    : { ok: true, message: null };
  const failureLayer = redactionStatus === 'failed'
    ? 'redaction'
    : resultFailureLayer(result) ?? (expectedCheckResult.ok ? null : 'expected-check');
  const status = failureLayer ? 'failed' : 'completed';

  const runResult = {
    ...preview,
    runId,
    status,
    startedAt,
    finishedAt,
    exitCode: result.exitCode ?? null,
    signal: result.signal ?? null,
    durationMs: Number.isFinite(result.durationMs) ? result.durationMs : null,
    timedOut: result.timedOut === true,
    stalled: result.stalled === true,
    redaction: {
      required: true,
      status: redactionStatus
    },
    output: {
      stdoutPreview,
      stderrPreview,
      rawProviderOutputAvailable: false
    },
    failure: failureLayer
      ? {
          layer: failureLayer,
          message: redactionFailureMessage ?? expectedCheckResult.message ?? failureMessageFor(result, failureLayer)
        }
      : null
  };

  return attachControlledProviderOperation(runResult);
}

function resultFailureLayer(result) {
  if (result?.timedOut === true || result?.stalled === true) {
    return 'timeout';
  }

  if (result?.exitCode !== 0) {
    return 'command-execution';
  }

  return null;
}

function providerAvailabilityLayer(error) {
  if (error?.code === 'ENOENT') {
    return 'provider-availability';
  }

  return 'command-execution';
}

function failureMessageFor(result, failureLayer) {
  if (failureLayer === 'expected-check') {
    return 'provider command output failed the expected check';
  }

  if (failureLayer === 'timeout') {
    return result.stalled === true
      ? 'provider command stalled before completion'
      : 'provider command timed out before completion';
  }

  return `provider command exited with code ${result.exitCode ?? 'unknown'}`;
}

function buildRejectedControlledProviderRunResult(request, error, { runId, redactor } = {}) {
  const safeRunId = normalizeRunId(runId ?? createControlledProviderRunId(), 'runId');
  const failureLayer = CONTROLLED_PROVIDER_RUNNER_FAILURE_LAYERS.includes(error?.failureLayer)
    ? error.failureLayer
    : 'schema';
  const now = new Date().toISOString();
  const providerId = typeof request?.providerId === 'string' && SAFE_ID_PATTERN.test(request.providerId)
    ? request.providerId
    : 'invalid-provider';
  const goalId = request?.goalId === V41_CONTROLLED_PROVIDER_RUNNER_GOAL_ID
    ? request.goalId
    : V41_CONTROLLED_PROVIDER_RUNNER_GOAL_ID;
  const taskId = typeof request?.taskId === 'string' && SAFE_ID_PATTERN.test(request.taskId)
    ? request.taskId
    : 'unknown-task';
  const role = ROLES.includes(request?.role) ? request.role : 'worker';
  const message = redactPreview(error?.message ?? String(error), redactor);
  const result = {
    contractName: CONTROLLED_PROVIDER_RUNNER_CONTRACT_NAME,
    contractVersion: CONTROLLED_PROVIDER_RUNNER_CONTRACT_VERSION,
    goalId,
    taskId,
    role,
    providerId,
    mode: MODES.includes(request?.mode) ? request.mode : 'reviewed-prompt',
    commandTemplateId: null,
    adapterId: null,
    logStrategy: null,
    promptRef: safeOptionalRef(request?.promptRef),
    evidenceRef: safeOptionalRef(request?.evidenceRef),
    handoffRef: safeOptionalRef(request?.handoffRef),
    runId: safeRunId,
    status: 'failed',
    startedAt: now,
    finishedAt: now,
    exitCode: null,
    signal: null,
    durationMs: null,
    timedOut: false,
    stalled: false,
    redaction: {
      required: true,
      status: 'applied'
    },
    output: {
      stdoutPreview: '',
      stderrPreview: message,
      rawProviderOutputAvailable: false
    },
    execution: {
      backendOwnedCommandTemplate: true,
      shellExpansionAvailable: false,
      genericShellRunnerAvailable: false,
      rendererProviderInvocationAvailable: false,
      arbitraryCommandInputAvailable: false,
      arbitraryCwdInputAvailable: false,
      envValueExposureAvailable: false,
      envPolicy: 'inherit-process-env-without-previewing-values',
      rawProviderSettingsAvailable: false,
      timeoutMs: null,
      cwdPolicy: 'backend-controlled-workspace-root',
      cwdRef: null
    },
    failureLayers: [...CONTROLLED_PROVIDER_RUNNER_FAILURE_LAYERS],
    failure: {
      layer: failureLayer,
      message
    },
    registryRecordable: true
  };

  return attachControlledProviderOperation(result);
}

function attachControlledProviderOperation(result) {
  const operation = buildControlledProviderRunnerOperationRecord(result);

  return {
    ...result,
    artifactRefs: operation.artifactRefs,
    operation
  };
}

export function buildControlledProviderRunnerOperationRecord(result) {
  const status = normalizeOperationStatus(result.status);
  const runId = normalizeRunId(result.runId ?? createControlledProviderRunId(), 'runId');
  const operationId = buildControlledProviderOperationId({
    goalId: result.goalId,
    taskId: result.taskId,
    runId,
    providerId: result.providerId,
    commandTemplateId: result.commandTemplateId
  });
  const artifactRefs = buildSanitizedProviderArtifactRefs({
    runId,
    status
  });
  const failureLayer = result.failure?.layer ?? null;
  const operation = {
    contractName: CONTROLLED_PROVIDER_RUNNER_OPERATION_CONTRACT_NAME,
    contractVersion: CONTROLLED_PROVIDER_RUNNER_OPERATION_CONTRACT_VERSION,
    operationId,
    runId,
    providerId: result.providerId,
    goalId: result.goalId,
    taskId: result.taskId,
    role: result.role,
    mode: result.mode,
    commandTemplateId: result.commandTemplateId,
    status,
    exitCode: result.exitCode ?? null,
    signal: result.signal ?? null,
    timing: {
      startedAt: normalizeTimestampForEvidence(result.startedAt),
      finishedAt: normalizeTimestampForEvidence(result.finishedAt),
      durationMs: Number.isFinite(result.durationMs) ? result.durationMs : null,
      timedOut: result.timedOut === true,
      stalled: result.stalled === true
    },
    artifactRefs,
    redaction: {
      required: true,
      status: normalizeRedactionStatus(result.redaction?.status),
      rawProviderOutputAvailable: false,
      rawProviderSettingsAvailable: false
    },
    failureLayer,
    failureReason: result.failure?.message ?? null,
    recoveryNotes: buildControlledProviderRecoveryNotes({
      providerId: result.providerId,
      status,
      failureLayer
    }),
    outputSummary: {
      stdoutPreview: redactPreview(result.output?.stdoutPreview ?? ''),
      stderrPreview: redactPreview(result.output?.stderrPreview ?? ''),
      rawProviderOutputAvailable: false
    },
    boundaries: {
      reviewerApproved: false,
      mainVerified: false,
      releaseReady: false,
      genericShellRunnerAvailable: false,
      rendererProviderInvocationAvailable: false,
      rawProviderOutputAvailable: false,
      rawProviderSettingsAvailable: false
    }
  };

  return validateControlledProviderRunnerOperationRecord(operation);
}

export function validateControlledProviderRunnerOperationRecord(operation) {
  const errors = [];

  if (!isPlainObject(operation)) {
    throw new ControlledProviderRunnerError('controlled provider runner operation must be a plain object', {
      failureLayer: 'schema',
      errors: ['operation must be a plain object']
    });
  }

  requireExact(errors, operation.contractName, 'contractName', CONTROLLED_PROVIDER_RUNNER_OPERATION_CONTRACT_NAME);
  requireExact(errors, operation.contractVersion, 'contractVersion', CONTROLLED_PROVIDER_RUNNER_OPERATION_CONTRACT_VERSION);
  requireSafeId(errors, operation.operationId, 'operationId');
  requireSafeId(errors, operation.runId, 'runId');
  requireSafeId(errors, operation.providerId, 'providerId');
  requireExact(errors, operation.goalId, 'goalId', V41_CONTROLLED_PROVIDER_RUNNER_GOAL_ID);
  requireSafeId(errors, operation.taskId, 'taskId');
  requireEnum(errors, operation.role, 'role', ROLES);
  if (operation.commandTemplateId !== null) {
    requireSafeRef(errors, operation.commandTemplateId, 'commandTemplateId');
  }
  requireEnum(errors, operation.status, 'status', OPERATION_STATUSES);
  if (operation.failureLayer !== null) {
    requireEnum(errors, operation.failureLayer, 'failureLayer', CONTROLLED_PROVIDER_RUNNER_FAILURE_LAYERS);
  }
  requireEnum(errors, operation.redaction?.status, 'redaction.status', REDACTION_STATUSES);

  if (!Array.isArray(operation.artifactRefs) || operation.artifactRefs.length === 0) {
    errors.push('artifactRefs must include sanitized evidence refs');
  }

  if (!Array.isArray(operation.recoveryNotes) || operation.recoveryNotes.some((note) => typeof note !== 'string' || note.trim() === '')) {
    errors.push('recoveryNotes must include non-empty recovery notes');
  }

  if (operation.redaction?.rawProviderOutputAvailable !== false ||
    operation.outputSummary?.rawProviderOutputAvailable !== false ||
    operation.boundaries?.rawProviderOutputAvailable !== false) {
    errors.push('raw provider output must not be available in operation evidence');
  }

  if (SECRET_VALUE_PATTERN.test(JSON.stringify(operation))) {
    errors.push('operation evidence must not contain secret-looking values');
  }

  if (errors.length > 0) {
    throw new ControlledProviderRunnerError(`Invalid controlled provider runner operation: ${errors.join('; ')}`, {
      failureLayer: 'schema',
      errors
    });
  }

  return operation;
}

function resolveControlledWorkspace({
  workspaceRoot = process.cwd(),
  allowedWorkspaceRoots = [process.cwd()],
  timeoutMs = 180000,
  stallTimeoutMs = 0
} = {}) {
  if (typeof workspaceRoot !== 'string' || workspaceRoot.trim() === '') {
    throw new ControlledProviderRunnerError('workspaceRoot must be a non-empty backend value', {
      failureLayer: 'workspace',
      errors: ['workspaceRoot must be a non-empty backend value']
    });
  }

  if (!Array.isArray(allowedWorkspaceRoots) || allowedWorkspaceRoots.length === 0) {
    throw new ControlledProviderRunnerError('allowedWorkspaceRoots must be a non-empty backend allowlist', {
      failureLayer: 'workspace',
      errors: ['allowedWorkspaceRoots must be a non-empty backend allowlist']
    });
  }

  const resolvedRoot = resolve(workspaceRoot);
  const allowed = allowedWorkspaceRoots.map((root) => resolve(root));

  if (!allowed.some((root) => pathInsideOrEqual(resolvedRoot, root))) {
    throw new ControlledProviderRunnerError('workspaceRoot must be inside an allowed backend workspace root', {
      failureLayer: 'workspace',
      errors: ['workspaceRoot must be inside an allowed backend workspace root']
    });
  }

  return {
    workspaceRoot: resolvedRoot,
    workspaceRef: `workspace:${allowed.findIndex((root) => pathInsideOrEqual(resolvedRoot, root))}`,
    timeoutMs: parseBoundedTimeout(timeoutMs, 180000),
    stallTimeoutMs: parseBoundedTimeout(stallTimeoutMs, 0)
  };
}

function parseBoundedTimeout(value, fallback) {
  if (value === undefined || value === null) {
    return fallback;
  }

  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed < 0 || parsed > 600000) {
    throw new ControlledProviderRunnerError('timeout values must be integers between 0 and 600000', {
      failureLayer: 'schema',
      errors: ['timeout values must be integers between 0 and 600000']
    });
  }

  return parsed;
}

function pathInsideOrEqual(candidate, root) {
  const pathToCandidate = relative(root, candidate);

  return pathToCandidate === '' || (!pathToCandidate.startsWith('..') && !isAbsolute(pathToCandidate));
}

function validateAllowedRequestFields(errors, request) {
  const allowed = new Set(REQUEST_ALLOWED_FIELDS);
  const forbidden = new Set(FORBIDDEN_REQUEST_FIELDS);

  for (const key of Object.keys(request)) {
    if (allowed.has(key)) {
      continue;
    }

    if (forbidden.has(key) || isSecretKey(key)) {
      errors.push(`${key} is not accepted by the controlled provider runner`);
    } else {
      errors.push(`${key} is not an allowed controlled provider runner field`);
    }
  }
}

function requireExact(errors, actual, field, expected) {
  if (actual !== expected) {
    errors.push(`${field} must be ${expected}`);
  }
}

function requireEnum(errors, actual, field, expectedValues) {
  if (!expectedValues.includes(actual)) {
    errors.push(`${field} must be one of ${expectedValues.join(', ')}`);
  }
}

function requireSafeId(errors, value, field) {
  if (typeof value !== 'string' || !SAFE_ID_PATTERN.test(value) || SHELL_META_PATTERN.test(value)) {
    errors.push(`${field} must be a safe id`);
  }
}

function requireSafeRef(errors, value, field) {
  if (
    typeof value !== 'string'
    || value.trim() === ''
    || isAbsolute(value)
    || value.includes('..')
    || !SAFE_REF_PATTERN.test(value)
    || SHELL_META_PATTERN.test(value)
  ) {
    errors.push(`${field} must be a safe reviewed ref`);
  }
}

function validateNoSecretBearingFields(errors, value, path = '') {
  if (Array.isArray(value)) {
    value.forEach((item, index) => validateNoSecretBearingFields(errors, item, `${path}[${index}]`));
    return;
  }

  if (!isPlainObject(value)) {
    if (typeof value === 'string' && SECRET_VALUE_PATTERN.test(value)) {
      errors.push(`${path || 'request'} must not contain secret-looking values`);
    }

    return;
  }

  for (const [key, item] of Object.entries(value)) {
    const childPath = path ? `${path}.${key}` : key;

    if (isSecretKey(key)) {
      errors.push(`${childPath} is not accepted by the controlled provider runner`);
      continue;
    }

    validateNoSecretBearingFields(errors, item, childPath);
  }
}

function createControlledProviderRunId() {
  return `provider-run-${randomUUID()}`;
}

function normalizeRunId(value, field) {
  if (typeof value !== 'string' || !SAFE_ID_PATTERN.test(value) || value.includes('..')) {
    throw new ControlledProviderRunnerError(`${field} must be a safe provider run id`, {
      failureLayer: 'schema',
      errors: [`${field} must be a safe provider run id`]
    });
  }

  return value;
}

function normalizeOperationStatus(value) {
  return value === 'completed' ? 'completed' : 'failed';
}

function normalizeRedactionStatus(value) {
  return REDACTION_STATUSES.includes(value) ? value : 'failed';
}

function normalizeTimestampForEvidence(value) {
  if (typeof value !== 'string' || Number.isNaN(Date.parse(value))) {
    return null;
  }

  return new Date(value).toISOString();
}

function safeOptionalRef(value) {
  if (typeof value !== 'string') {
    return null;
  }

  return SAFE_REF_PATTERN.test(value) && !value.includes('..') && !SHELL_META_PATTERN.test(value)
    ? value
    : null;
}

function evaluateExpectedCheck(expectedCheck, context) {
  if (expectedCheck === undefined || expectedCheck === null) {
    return { ok: true, message: null };
  }

  const result = expectedCheck(context);

  if (result === false) {
    return {
      ok: false,
      message: 'provider command output failed the expected check'
    };
  }

  if (isPlainObject(result) && result.ok === false) {
    return {
      ok: false,
      message: redactPreview(result.message ?? 'provider command output failed the expected check')
    };
  }

  return { ok: true, message: null };
}

function buildSanitizedProviderArtifactRefs({ runId, status }) {
  return [{
    kind: 'sanitized-provider-run-summary',
    ref: `controlled-provider-run:${runId}:summary`,
    title: 'Sanitized provider runner summary',
    status
  }];
}

function buildControlledProviderRecoveryNotes({ providerId, status, failureLayer }) {
  if (status === 'completed') {
    return [
      `${providerId} completed through the backend-controlled provider runner; no recovery action is needed for this operation.`
    ];
  }

  if (failureLayer === 'provider-availability') {
    return [
      `${providerId} was unavailable to the backend runner. Install or authenticate the provider CLI outside Workbench, then rerun the same controlled provider runner request.`
    ];
  }

  if (failureLayer === 'timeout') {
    return [
      `${providerId} timed out or stalled in the backend runner. Review the sanitized provider-run summary, then rerun the controlled request with the backend timeout policy adjusted if the runbook allows it.`
    ];
  }

  if (failureLayer === 'expected-check') {
    return [
      `${providerId} finished without satisfying the expected backend check. Review the sanitized summary and update the reviewed task context before rerunning through the controlled runner.`
    ];
  }

  if (failureLayer === 'workspace') {
    return [
      `${providerId} could not run because the backend workspace policy rejected the request. Use the assigned worktree inside the allowed workspace roots and rerun through the controlled runner.`
    ];
  }

  if (failureLayer === 'redaction') {
    return [
      `${providerId} output could not be safely redacted. Treat raw output as unavailable, inspect only sanitized artifacts, and fix redaction before rerunning.`
    ];
  }

  if (failureLayer === 'schema') {
    return [
      `${providerId} request failed schema validation. Rebuild the request from backend preview fields and resubmit with the matching plan hash.`
    ];
  }

  return [
    `${providerId} failed during backend command execution. Review sanitized stdout/stderr previews and rerun only through the controlled provider runner.`
  ];
}

function buildControlledProviderOperationId({
  goalId,
  taskId,
  runId,
  providerId,
  commandTemplateId
}) {
  return `op_provider_${shortHash({
    goalId,
    taskId,
    runId,
    providerId,
    commandTemplateId
  })}`;
}

function buildControlledProviderOperationPlanHash(operation) {
  return `sha256:${hashJson({
    contractName: operation.contractName,
    goalId: operation.goalId,
    taskId: operation.taskId,
    role: operation.role,
    runId: operation.runId,
    providerId: operation.providerId,
    commandTemplateId: operation.commandTemplateId,
    status: operation.status
  })}`;
}

function buildControlledProviderRunnerPlanHash(reviewedContext) {
  return `sha256:${hashJson(reviewedContext)}`;
}

function assertControlledProviderRunnerConfirmBody(body) {
  if (!isPlainObject(body)) {
    throw new ControlledProviderRunnerError('Controlled provider runner confirm body must be a plain object.', {
      failureLayer: 'schema',
      errors: ['body must be a plain object']
    });
  }

  const allowed = new Set([
    'goalId',
    'taskId',
    'role',
    'providerId',
    'mode',
    'promptRef',
    'evidenceRef',
    'handoffRef',
    'planId',
    'planHash'
  ]);
  const unsupported = Object.keys(body).filter((key) => !allowed.has(key));
  const errors = [];

  for (const key of unsupported) {
    if (FORBIDDEN_REQUEST_FIELDS.includes(key) || isSecretKey(key)) {
      errors.push(`${key} is not accepted by controlled provider runner confirm`);
    } else {
      errors.push(`${key} is not an allowed controlled provider runner confirm field`);
    }
  }

  for (const field of ['goalId', 'taskId', 'role', 'providerId', 'mode', 'planId', 'planHash']) {
    if (typeof body[field] !== 'string' || body[field].trim() === '') {
      errors.push(`${field} must be a non-empty string`);
    }
  }

  for (const field of ['promptRef', 'evidenceRef', 'handoffRef']) {
    if (body[field] !== undefined && body[field] !== null && typeof body[field] !== 'string') {
      errors.push(`${field} must be a string when present`);
    }
  }

  validateNoSecretBearingFields(errors, body);

  if (errors.length > 0) {
    throw new ControlledProviderRunnerError(`Invalid controlled provider runner confirm body: ${errors.join('; ')}`, {
      failureLayer: 'schema',
      errors
    });
  }
}

function controlledProviderRunnerRequestFromConfirmBody(body) {
  return stripUndefined({
    providerId: body.providerId.trim(),
    goalId: body.goalId.trim(),
    taskId: body.taskId.trim(),
    role: body.role.trim(),
    mode: body.mode.trim(),
    promptRef: optionalTrimmedString(body.promptRef),
    evidenceRef: optionalTrimmedString(body.evidenceRef),
    handoffRef: optionalTrimmedString(body.handoffRef)
  });
}

function optionalTrimmedString(value) {
  if (value === undefined || value === null) {
    return undefined;
  }

  const trimmed = value.trim();

  return trimmed === '' ? undefined : trimmed;
}

function shortHash(value) {
  return hashJson(value).slice(0, 16);
}

function hashJson(value) {
  return createHash('sha256').update(JSON.stringify(sortJson(value))).digest('hex');
}

function sortJson(value) {
  if (Array.isArray(value)) {
    return value.map((entry) => sortJson(entry));
  }

  if (isPlainObject(value)) {
    return Object.fromEntries(
      Object.keys(value).sort().map((key) => [key, sortJson(value[key])])
    );
  }

  return value;
}

function redactPreview(value, redactor = redactSecrets) {
  const redactedBySharedRules = redactor(String(value));
  const redacted = String(redactedBySharedRules).replace(SECRET_VALUE_REDACTION_PATTERN, (match) => (
    match.toLowerCase().startsWith('bearer ')
      ? 'Bearer [REDACTED_TOKEN]'
      : '[REDACTED_TOKEN]'
  ));

  if (redacted.length <= 2000) {
    return redacted;
  }

  return `${redacted.slice(0, 2000)}[TRUNCATED]`;
}

function isSecretKey(key) {
  return SECRET_KEY_PATTERN.test(key);
}

function isPlainObject(value) {
  if (value === null || typeof value !== 'object') {
    return false;
  }

  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function stripUndefined(value) {
  if (!isPlainObject(value)) {
    return value;
  }

  return Object.fromEntries(
    Object.entries(value).filter(([, entry]) => entry !== undefined)
  );
}
