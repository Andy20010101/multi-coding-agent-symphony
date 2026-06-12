import {
  CODEX_PROVIDER_ID,
  CODEX_PROVIDER_ROLE,
  buildCodexProviderExecutionConfirmation,
  buildCodexProviderExecutionPreview,
  validateCodexProviderExecutionPreviewContract
} from './codex-provider-execution-contracts.js';

export class CodexProviderExecutionBackendError extends Error {
  constructor(code, message, details = {}) {
    super(message);
    this.name = 'CodexProviderExecutionBackendError';
    this.code = code;
    this.details = details;
  }
}

const CONFIRM_INPUT_ALLOWED_FIELDS = new Set([
  'previewHash',
  'providerId',
  'goalId',
  'taskId',
  'role',
  'operatorId',
  'confirmedAt'
]);
const SAFE_TOKEN_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9._:-]*$/u;
const HASH_PATTERN = /^sha256:[a-f0-9]{64}$/u;

export function buildCodexProviderExecutionPreviewFromChildDispatch({
  childDispatchPreview,
  generatedAt = new Date().toISOString()
} = {}) {
  const preview = isPlainObject(childDispatchPreview) ? childDispatchPreview : {};
  const taskPack = isPlainObject(preview.taskPack) ? preview.taskPack : null;
  const providerId = firstNonEmptyString(
    preview.providerRecommendation?.providerId,
    taskPack?.preferredProvider,
    CODEX_PROVIDER_ID
  );
  const role = firstNonEmptyString(preview.requestedRole, taskPack?.role, CODEX_PROVIDER_ROLE);
  const blockedReasons = uniqueStrings([
    ...stringArray(preview.blockedReasons),
    ...(preview.readiness?.state === 'blocked' ? ['child-dispatch-preview-blocked'] : [])
  ]);

  return buildCodexProviderExecutionPreview({
    generatedAt,
    goal: codexExecutionGoalFromChildPreview(preview),
    task: codexExecutionTaskFromChildPreview(preview),
    taskPack,
    taskPackRef: codexExecutionTaskPackRef(preview),
    providerId,
    role,
    sourceContracts: codexExecutionSourceContracts(preview),
    blockedReasons
  });
}

export function validateCodexProviderExecutionConfirmInput({
  preview,
  input
} = {}) {
  const errors = [];
  const previewValidation = validateCodexProviderExecutionPreviewContract(preview);

  if (!previewValidation.ok) {
    errors.push(...previewValidation.errors.map((error) => `preview.${error}`));
  } else if (preview.blockedReasons.length !== 0) {
    errors.push('preview must be ready before confirmation');
  }

  if (!isPlainObject(input)) {
    errors.push('confirmation input must be a plain object');
    return { ok: false, errors };
  }

  for (const field of Object.keys(input)) {
    if (!CONFIRM_INPUT_ALLOWED_FIELDS.has(field)) {
      errors.push(`${field} is not an allowed codex provider execution confirm field`);
    }
  }

  requireHash(errors, input.previewHash, 'previewHash');
  requireExact(errors, input.providerId, 'providerId', CODEX_PROVIDER_ID);
  requireSafeToken(errors, input.goalId, 'goalId');
  requireSafeToken(errors, input.taskId, 'taskId');
  requireExact(errors, input.role, 'role', CODEX_PROVIDER_ROLE);
  requireSafeToken(errors, input.operatorId, 'operatorId');

  if (input.confirmedAt !== undefined) {
    requireIsoTimestamp(errors, input.confirmedAt, 'confirmedAt');
  }

  if (previewValidation.ok) {
    if (input.previewHash !== preview.previewHash) {
      errors.push('previewHash must match current codex provider execution preview');
    }

    if (input.goalId !== preview.goal.goalId) {
      errors.push('goalId must match current codex provider execution preview');
    }

    if (input.taskId !== preview.task.taskId) {
      errors.push('taskId must match current codex provider execution preview');
    }
  }

  return {
    ok: errors.length === 0,
    errors
  };
}

export function confirmCodexProviderExecutionPreview({
  preview,
  input,
  confirmedAt = new Date().toISOString()
} = {}) {
  const validation = validateCodexProviderExecutionConfirmInput({ preview, input });

  if (!validation.ok) {
    throw new CodexProviderExecutionBackendError(
      'invalid-codex-provider-execution-confirm-input',
      'Codex provider execution confirmation input is invalid.',
      { reason: validation.errors[0] }
    );
  }

  return buildCodexProviderExecutionConfirmation(preview, {
    operatorId: input.operatorId,
    confirmedAt: input.confirmedAt ?? confirmedAt
  });
}

function codexExecutionGoalFromChildPreview(preview) {
  const goal = isPlainObject(preview.goal) ? preview.goal : {};
  const goalId = safeToken(goal.goalId) ?? 'missing-goal';

  return {
    goalId,
    title: firstNonEmptyString(goal.title, goalId === 'missing-goal' ? 'Missing active goal' : goalId),
    state: normalizeState(goal.state, goalId === 'missing-goal' ? 'missing' : 'active'),
    sourceContract: safeContractName(goal.sourceContract) ?? 'childDispatchPreview.v1',
    sourceRef: safeSourceRef(goal.sourceRef)
  };
}

function codexExecutionTaskFromChildPreview(preview) {
  const task = isPlainObject(preview.task) ? preview.task : {};
  const taskId = safeToken(task.taskId) ?? 'missing-task';

  return {
    taskId,
    title: firstNonEmptyString(task.title, taskId === 'missing-task' ? 'Missing active task' : taskId),
    state: normalizeState(task.state, taskId === 'missing-task' ? 'missing' : 'active'),
    sourceContract: safeContractName(task.sourceContract) ?? 'childTaskPack.v1',
    sourceRef: safeSourceRef(task.sourceRef)
  };
}

function codexExecutionTaskPackRef(preview) {
  if (!isPlainObject(preview.taskPack)) {
    return {
      kind: 'contract',
      ref: 'childTaskPack.v1',
      label: 'missing child task pack'
    };
  }

  return {
    kind: 'contract',
    ref: 'childTaskPack.v1',
    label: 'child dispatch task pack'
  };
}

function codexExecutionSourceContracts(preview) {
  return [
    {
      contractName: 'childDispatchPreview.v1',
      contractVersion: 1,
      readOnly: true,
      requiredFor: ['preview-readiness', 'task-pack-ref'],
      sourceRef: {
        kind: 'contract',
        ref: 'childDispatchPreview.v1'
      }
    },
    {
      contractName: 'childTaskPack.v1',
      contractVersion: 1,
      readOnly: true,
      requiredFor: ['task-pack-hash'],
      sourceRef: {
        kind: 'contract',
        ref: 'childTaskPack.v1'
      }
    },
    {
      contractName: 'resultIntakeRequest.v1',
      contractVersion: 1,
      readOnly: true,
      requiredFor: ['result-return'],
      sourceRef: {
        kind: 'contract',
        ref: 'resultIntakeRequest.v1'
      }
    },
    ...safeChildSourceContracts(preview.sourceContracts)
  ];
}

function safeChildSourceContracts(sourceContracts) {
  if (!Array.isArray(sourceContracts)) {
    return [];
  }

  return sourceContracts
    .filter(isPlainObject)
    .map((contract) => ({
      contractName: safeContractName(contract.contractName),
      contractVersion: Number.isInteger(contract.contractVersion) ? contract.contractVersion : undefined,
      readOnly: true,
      requiredFor: stringArray(contract.requiredFor),
      sourceRef: safeSourceRef(contract.sourceRef)
    }))
    .filter((contract) => contract.contractName !== null);
}

function safeSourceRef(sourceRef) {
  if (!isPlainObject(sourceRef)) {
    return {
      kind: 'contract',
      ref: 'childDispatchPreview.v1'
    };
  }

  const kind = ['contract', 'fixture', 'docs', 'route', 'run-record'].includes(sourceRef.kind)
    ? sourceRef.kind
    : 'contract';
  const ref = firstNonEmptyString(sourceRef.ref, 'childDispatchPreview.v1');

  return {
    kind,
    ref,
    ...(firstNonEmptyString(sourceRef.label) === null ? {} : { label: firstNonEmptyString(sourceRef.label) }),
    ...(firstNonEmptyString(sourceRef.generatedAt) === null ? {} : { generatedAt: firstNonEmptyString(sourceRef.generatedAt) })
  };
}

function normalizeState(value, fallback) {
  return ['active', 'ready', 'blocked', 'pending', 'missing'].includes(value) ? value : fallback;
}

function safeContractName(value) {
  return typeof value === 'string' && /^[a-z][a-zA-Z0-9-]*(?:\.[a-zA-Z0-9-]+)*\.v[0-9]+$/u.test(value)
    ? value
    : null;
}

function safeToken(value) {
  return typeof value === 'string' && SAFE_TOKEN_PATTERN.test(value.trim()) ? value.trim() : null;
}

function firstNonEmptyString(...values) {
  return values.find((value) => typeof value === 'string' && value.trim() !== '') ?? null;
}

function stringArray(value) {
  return Array.isArray(value)
    ? value.filter((entry) => typeof entry === 'string' && entry.trim() !== '')
    : [];
}

function uniqueStrings(values) {
  return [...new Set(values.filter((entry) => typeof entry === 'string' && entry.trim() !== ''))];
}

function requireExact(errors, value, path, expected) {
  if (!Object.is(value, expected)) {
    errors.push(`${path} must be ${JSON.stringify(expected)}`);
  }
}

function requireHash(errors, value, path) {
  if (typeof value !== 'string' || !HASH_PATTERN.test(value)) {
    errors.push(`${path} must be a sha256 hash`);
  }
}

function requireSafeToken(errors, value, path) {
  if (typeof value !== 'string' || value.trim() === '') {
    errors.push(`${path} must be a non-empty string`);
    return;
  }

  if (!SAFE_TOKEN_PATTERN.test(value.trim())) {
    errors.push(`${path} must be a safe token`);
  }
}

function requireIsoTimestamp(errors, value, path) {
  if (typeof value !== 'string' || value.trim() === '' || Number.isNaN(Date.parse(value))) {
    errors.push(`${path} must be an ISO timestamp`);
  }
}

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}
