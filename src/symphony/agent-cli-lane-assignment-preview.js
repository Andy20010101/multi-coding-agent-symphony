import {
  buildAgentCliCapabilityProfileContract
} from './agent-cli-capability-profile.js';
import {
  buildAgentCliProviderHealthContract
} from './agent-cli-provider-health.js';
import {
  buildAgentCliProviderProfileContract,
  V38_ACTIVE_AGENT_CLI_PROVIDER_IDS
} from './agent-cli-provider-profile.js';

export const AGENT_CLI_LANE_ASSIGNMENT_PREVIEW_CONTRACT_NAME = 'agent-cli-lane-assignment-preview.v1';
export const AGENT_CLI_LANE_ASSIGNMENT_PREVIEW_CONTRACT_VERSION = 1;

const ROLE_IDS = Object.freeze(['worker', 'reviewer', 'main-verifier']);
const ASSIGNMENT_STATES = Object.freeze(['preview-only', 'blocked-by-provider-health']);
const FORBIDDEN_PROVIDER_IDS = Object.freeze([
  'deepseek',
  'deepseek-cli',
  'gemini-cli',
  'kiro-cli'
]);
const COPY_ONLY_VERIFICATION_COMMANDS = Object.freeze([
  'pnpm check',
  'pnpm test',
  'pnpm workbench:build',
  'git diff --check'
]);
const SECRET_KEY_PATTERN = /(?:api[_-]?key|auth[_-]?token|oauth[_-]?token|access[_-]?token|refresh[_-]?token|bearer[_-]?token|password|passphrase|private[_-]?key|credential(?:s|[_-]?file|[_-]?contents)?|secret(?:value|[_-]?value)?|raw[_-]?provider[_-]?settings|raw[_-]?provider[_-]?config|raw[_-]?config|provider[_-]?settings)/iu;
const SECRET_VALUE_PATTERN = /(?:sk-[A-Za-z0-9_-]{8,}|gh[pousr]_[A-Za-z0-9_]{8,}|xox[baprs]-[A-Za-z0-9-]{8,}|-----BEGIN [A-Z ]*PRIVATE KEY-----)/u;
const ALLOWED_FALSE_SECRET_BOUNDARY_FIELDS = Object.freeze([
  'secretMaterialAvailable',
  'credentialMaterialAvailable',
  'rawProviderConfigAvailable'
]);

export function buildAgentCliLaneAssignmentPreviewContract({
  goalId = 'v38-provider-hub-capability-profiles',
  taskId = 'task-4',
  generatedAt = new Date().toISOString(),
  env = process.env
} = {}) {
  const providerProfile = buildAgentCliProviderProfileContract({
    goalId,
    taskId: 'task-1',
    generatedAt
  });
  const providerHealth = buildAgentCliProviderHealthContract({
    goalId,
    taskId: 'task-2',
    generatedAt,
    env
  });
  const capabilityProfile = buildAgentCliCapabilityProfileContract({
    goalId,
    taskId: 'task-3',
    generatedAt,
    env
  });
  const activeProviders = providerProfile.activeProviders;
  const healthByProviderId = new Map(providerHealth.providers.map((provider) => [
    provider.providerId,
    provider
  ]));

  return assertAgentCliLaneAssignmentPreviewContract({
    contractName: AGENT_CLI_LANE_ASSIGNMENT_PREVIEW_CONTRACT_NAME,
    contractVersion: AGENT_CLI_LANE_ASSIGNMENT_PREVIEW_CONTRACT_VERSION,
    generatedAt,
    readOnly: true,
    context: {
      goalId,
      taskId,
      sourceContracts: [
        'agent-cli-provider.v1',
        'agent-cli-provider-health.v1',
        'agent-cli-capability-profile.v1',
        'goal-runbook.v1',
        'goal-next-action.v1',
        'goal-progress-ledger.v1',
        'goal-event-log.v1',
        'goal-update-plan.v1'
      ],
      stateSource: 'explicit-backend-contracts',
      scope: 'v38-agent-cli-provider-hub-mvp',
      activeGoalAnchored: true,
      activeTaskAnchored: true,
      assignmentSource: 'goal-runbook.v1:roleOrder + provider-health + capability-profile'
    },
    activeProviderIds: [...V38_ACTIVE_AGENT_CLI_PROVIDER_IDS],
    lanePreviews: [
      buildProviderBackedLane({
        role: 'worker',
        laneId: 'implementation',
        phase: 'implement',
        activeProviders,
        healthByProviderId,
        eventTypes: ['worker.evidence-recorded', 'worker.self-check-passed', 'worker.self-check-failed'],
        requiresDistinctActorFrom: [],
        approvalEventAvailable: false
      }),
      buildProviderBackedLane({
        role: 'reviewer',
        laneId: 'independent-review',
        phase: 'review',
        activeProviders,
        healthByProviderId,
        eventTypes: ['reviewer.approved', 'reviewer.needs-revision'],
        requiresDistinctActorFrom: ['worker'],
        approvalEventAvailable: true
      }),
      buildMainVerifierLane({ goalId, taskId })
    ],
    assignmentMatrix: buildAssignmentMatrix({ activeProviders, healthByProviderId }),
    independenceRules: [
      {
        ruleId: 'worker-cannot-approve-own-task',
        enforcedBy: 'goal-event-form-policy',
        sourceContract: 'goal-runbook.v1',
        enabled: true
      },
      {
        ruleId: 'reviewer-approval-required-before-main-verification',
        enforcedBy: 'goal-next-action.v1',
        sourceContract: 'goal-runbook.v1',
        enabled: true
      },
      {
        ruleId: 'main-verification-required-before-release-ready',
        enforcedBy: 'goal-closeout-report.v1',
        sourceContract: 'goal-runbook.v1',
        enabled: true
      }
    ],
    inactiveProviders: providerProfile.inactiveProviders,
    summary: {
      lanePreviewAvailable: true,
      activeProviderCount: V38_ACTIVE_AGENT_CLI_PROVIDER_IDS.length,
      laneCount: ROLE_IDS.length,
      independentReviewRequired: true,
      mainVerifierLaneOperatorControlled: true,
      autoAssignmentAvailable: false,
      autoApprovalAvailable: false,
      providerCliExecutionAvailable: false,
      modelInvocationAvailable: false,
      capabilityProfileMappingAvailable: capabilityProfile.summary.capabilityProfileMappingAvailable
    },
    boundaries: buildBoundaries()
  });
}

export function validateAgentCliLaneAssignmentPreviewContract(contract) {
  const errors = [];

  if (!isPlainObject(contract)) {
    return { ok: false, errors: ['agent CLI lane assignment preview contract must be a plain object'] };
  }

  requireExact(errors, contract.contractName, 'contractName', AGENT_CLI_LANE_ASSIGNMENT_PREVIEW_CONTRACT_NAME);
  requireExact(errors, contract.contractVersion, 'contractVersion', AGENT_CLI_LANE_ASSIGNMENT_PREVIEW_CONTRACT_VERSION);
  requireIsoTimestamp(errors, contract.generatedAt, 'generatedAt');
  requireExact(errors, contract.readOnly, 'readOnly', true);
  validateContext(errors, contract.context);
  validateActiveProviderIds(errors, contract.activeProviderIds);
  validateLanePreviews(errors, contract.lanePreviews);
  validateAssignmentMatrix(errors, contract.assignmentMatrix);
  validateIndependenceRules(errors, contract.independenceRules);
  validateInactiveProviders(errors, contract.inactiveProviders);
  validateSummary(errors, contract.summary);
  validateBoundaries(errors, contract.boundaries);
  validateNoSecretBearingFields(errors, contract);

  return { ok: errors.length === 0, errors };
}

export function assertAgentCliLaneAssignmentPreviewContract(contract) {
  const result = validateAgentCliLaneAssignmentPreviewContract(contract);

  if (!result.ok) {
    throw new Error(`Invalid agent CLI lane assignment preview contract: ${result.errors.join('; ')}`);
  }

  return contract;
}

function buildProviderBackedLane({
  role,
  laneId,
  phase,
  activeProviders,
  healthByProviderId,
  eventTypes,
  requiresDistinctActorFrom,
  approvalEventAvailable
}) {
  const candidateProviders = activeProviders.map((provider) => {
    const health = healthByProviderId.get(provider.providerId);
    const providerLane = health?.lanes?.find((lane) => lane.laneId === (role === 'reviewer' ? 'reviewer' : 'worker'));
    const healthState = health?.health?.state ?? 'unknown';
    const assignableInV38 = providerLane?.assignableInV38 === true;

    return {
      providerId: provider.providerId,
      displayName: provider.displayName,
      providerKind: provider.providerKind,
      adapterId: provider.adapterId,
      healthState,
      assignableInV38,
      unavailableReason: assignableInV38 ? null : providerLane?.unavailableReason ?? health?.health?.blocker ?? 'provider-health-missing',
      selectionSource: 'agent-cli-provider-health.v1'
    };
  });

  return {
    role,
    laneId,
    phase,
    laneKind: 'provider-backed-preview',
    assignmentState: candidateProviders.some((provider) => provider.assignableInV38)
      ? 'preview-only'
      : 'blocked-by-provider-health',
    candidateProviders,
    recommendedProviderIds: candidateProviders.map((provider) => provider.providerId),
    requiresDistinctActorFrom,
    eventTypes,
    confirmationContract: role === 'worker' ? 'goal-update-plan.v1' : 'goal-update-plan.v1',
    approvalEventAvailable,
    previewOnly: true,
    executionEnabled: false,
    autoAssignAvailable: false,
    autoApprovalAvailable: false,
    stateSource: 'agent-cli-provider-health.v1 + goal-runbook.v1'
  };
}

function buildMainVerifierLane({ goalId, taskId }) {
  return {
    role: 'main-verifier',
    laneId: 'main-verification',
    phase: 'main-verification',
    laneKind: 'operator-controlled-preview',
    assignmentState: 'preview-only',
    candidateProviders: [],
    recommendedProviderIds: [],
    operatorLane: {
      operatorId: 'main-verifier',
      goalId,
      taskId,
      requiresApprovedReviewer: true,
      requiresCleanMainVerificationWorktree: true
    },
    requiresDistinctActorFrom: ['worker', 'reviewer'],
    eventTypes: ['main.verification-passed', 'main.verification-failed'],
    confirmationContract: 'goal-update-plan.v1',
    approvalEventAvailable: false,
    copyOnlyVerificationCommands: [...COPY_ONLY_VERIFICATION_COMMANDS],
    previewOnly: true,
    executionEnabled: false,
    autoAssignAvailable: false,
    autoApprovalAvailable: false,
    stateSource: 'goal-next-action.v1 + goal-gate'
  };
}

function buildAssignmentMatrix({ activeProviders, healthByProviderId }) {
  return activeProviders.map((workerProvider, index) => {
    const reviewerProvider = activeProviders[(index + 1) % activeProviders.length];
    const workerHealth = healthByProviderId.get(workerProvider.providerId);
    const reviewerHealth = healthByProviderId.get(reviewerProvider.providerId);
    const workerAssignable = laneAssignable(workerHealth, 'worker');
    const reviewerAssignable = laneAssignable(reviewerHealth, 'reviewer');
    const blockers = [
      workerAssignable ? null : `worker:${workerProvider.providerId}:provider-health-missing`,
      reviewerAssignable ? null : `reviewer:${reviewerProvider.providerId}:provider-health-missing`
    ].filter((blocker) => blocker !== null);

    return {
      matrixId: `worker-${workerProvider.providerId}__reviewer-${reviewerProvider.providerId}`,
      worker: {
        role: 'worker',
        laneId: 'implementation',
        providerId: workerProvider.providerId
      },
      reviewer: {
        role: 'reviewer',
        laneId: 'independent-review',
        providerId: reviewerProvider.providerId,
        mustBeDifferentActorFrom: 'worker'
      },
      mainVerifier: {
        role: 'main-verifier',
        laneId: 'main-verification',
        providerId: null,
        operatorControlled: true
      },
      state: blockers.length === 0 ? 'preview-only' : 'blocked-by-provider-health',
      blockers,
      previewOnly: true,
      autoApprovalAvailable: false
    };
  });
}

function laneAssignable(health, laneId) {
  return health?.lanes?.find((lane) => lane.laneId === laneId)?.assignableInV38 === true;
}

function buildBoundaries() {
  return {
    readOnly: true,
    activeProviderIds: [...V38_ACTIVE_AGENT_CLI_PROVIDER_IDS],
    lanePreviewAvailable: true,
    providerCliExecutionAvailable: false,
    providerCliExecutionAttempted: false,
    rendererProviderInvocationAvailable: false,
    promptDispatchAvailable: false,
    modelInvocationAvailable: false,
    capabilityProbeAvailable: false,
    genericShellRunnerAvailable: false,
    arbitraryCommandExecutionAvailable: false,
    arbitraryPathReadAvailable: false,
    envValueExposureAvailable: false,
    secretMaterialAvailable: false,
    credentialMaterialAvailable: false,
    rawProviderConfigAvailable: false,
    automaticInstallAvailable: false,
    automaticOauthAvailable: false,
    repoWriteAvailable: false,
    gitWriteAvailable: false,
    mergeAvailable: false,
    pushAvailable: false,
    tagAvailable: false,
    publishAvailable: false,
    selfApprovalAvailable: false,
    reviewerApprovalInferenceAvailable: false,
    mainVerificationInferenceAvailable: false,
    releaseReadyInferenceAvailable: false
  };
}

function validateContext(errors, context) {
  if (!isPlainObject(context)) {
    errors.push('context must be a plain object');
    return;
  }

  requireSafeRef(errors, context.goalId, 'context.goalId');
  requireExact(errors, context.taskId, 'context.taskId', 'task-4');
  requireExact(errors, context.stateSource, 'context.stateSource', 'explicit-backend-contracts');
  requireExact(errors, context.scope, 'context.scope', 'v38-agent-cli-provider-hub-mvp');
  requireExact(errors, context.activeGoalAnchored, 'context.activeGoalAnchored', true);
  requireExact(errors, context.activeTaskAnchored, 'context.activeTaskAnchored', true);
  requireNonEmptyString(errors, context.assignmentSource, 'context.assignmentSource');

  for (const required of [
    'agent-cli-provider.v1',
    'agent-cli-provider-health.v1',
    'agent-cli-capability-profile.v1',
    'goal-runbook.v1',
    'goal-next-action.v1',
    'goal-progress-ledger.v1',
    'goal-event-log.v1',
    'goal-update-plan.v1'
  ]) {
    if (!Array.isArray(context.sourceContracts) || !context.sourceContracts.includes(required)) {
      errors.push(`context.sourceContracts must include ${required}`);
    }
  }
}

function validateActiveProviderIds(errors, activeProviderIds) {
  if (!Array.isArray(activeProviderIds)) {
    errors.push('activeProviderIds must be an array');
    return;
  }

  if (activeProviderIds.slice().sort().join(',') !== [...V38_ACTIVE_AGENT_CLI_PROVIDER_IDS].sort().join(',')) {
    errors.push('activeProviderIds must match claude-code-cli,codex-cli');
  }

  if (activeProviderIds.some((providerId) => FORBIDDEN_PROVIDER_IDS.includes(providerId))) {
    errors.push('activeProviderIds must not include gemini-cli, kiro-cli, or deepseek');
  }
}

function validateLanePreviews(errors, lanePreviews) {
  if (!Array.isArray(lanePreviews)) {
    errors.push('lanePreviews must be an array');
    return;
  }

  const roles = lanePreviews.map((lane) => lane?.role);

  for (const role of ROLE_IDS) {
    if (!roles.includes(role)) {
      errors.push(`lanePreviews must include ${role}`);
    }
  }

  lanePreviews.forEach((lane, index) => validateLanePreview(errors, lane, `lanePreviews[${index}]`));
}

function validateLanePreview(errors, lane, path) {
  if (!isPlainObject(lane)) {
    errors.push(`${path} must be a plain object`);
    return;
  }

  requireEnum(errors, lane.role, `${path}.role`, ROLE_IDS);
  requireSafeRef(errors, lane.laneId, `${path}.laneId`);
  requireNonEmptyString(errors, lane.phase, `${path}.phase`);
  requireEnum(errors, lane.assignmentState, `${path}.assignmentState`, ASSIGNMENT_STATES);
  validateCandidateProviders(errors, lane.candidateProviders, `${path}.candidateProviders`, lane.role);
  validateStringArray(errors, lane.recommendedProviderIds, `${path}.recommendedProviderIds`);
  validateStringArray(errors, lane.requiresDistinctActorFrom, `${path}.requiresDistinctActorFrom`);
  validateStringArray(errors, lane.eventTypes, `${path}.eventTypes`);
  requireContractName(errors, lane.confirmationContract, `${path}.confirmationContract`);
  requireExact(errors, lane.previewOnly, `${path}.previewOnly`, true);
  requireExact(errors, lane.executionEnabled, `${path}.executionEnabled`, false);
  requireExact(errors, lane.autoAssignAvailable, `${path}.autoAssignAvailable`, false);
  requireExact(errors, lane.autoApprovalAvailable, `${path}.autoApprovalAvailable`, false);
  requireNonEmptyString(errors, lane.stateSource, `${path}.stateSource`);

  if (lane.role === 'reviewer' && !lane.requiresDistinctActorFrom.includes('worker')) {
    errors.push(`${path}.requiresDistinctActorFrom must include worker`);
  }

  if (lane.role === 'main-verifier') {
    if (lane.candidateProviders.length !== 0 || lane.recommendedProviderIds.length !== 0) {
      errors.push(`${path} main-verifier must not be provider-backed`);
    }

    validateMainVerifierOperatorLane(errors, lane.operatorLane, `${path}.operatorLane`);
    validateStringArray(errors, lane.copyOnlyVerificationCommands, `${path}.copyOnlyVerificationCommands`);

    for (const command of COPY_ONLY_VERIFICATION_COMMANDS) {
      if (!lane.copyOnlyVerificationCommands.includes(command)) {
        errors.push(`${path}.copyOnlyVerificationCommands must include ${command}`);
      }
    }
  } else if (lane.candidateProviders.map((provider) => provider?.providerId).sort().join(',') !== [...V38_ACTIVE_AGENT_CLI_PROVIDER_IDS].sort().join(',')) {
    errors.push(`${path}.candidateProviders must match claude-code-cli,codex-cli`);
  }
}

function validateCandidateProviders(errors, candidateProviders, path, role) {
  if (!Array.isArray(candidateProviders)) {
    errors.push(`${path} must be an array`);
    return;
  }

  candidateProviders.forEach((provider, index) => {
    const providerPath = `${path}[${index}]`;

    if (!isPlainObject(provider)) {
      errors.push(`${providerPath} must be a plain object`);
      return;
    }

    requireEnum(errors, provider.providerId, `${providerPath}.providerId`, V38_ACTIVE_AGENT_CLI_PROVIDER_IDS);
    requireNonEmptyString(errors, provider.displayName, `${providerPath}.displayName`);
    requireExact(errors, provider.providerKind, `${providerPath}.providerKind`, 'agent-cli');
    requireSafeRef(errors, provider.adapterId, `${providerPath}.adapterId`);
    requireEnum(errors, provider.healthState, `${providerPath}.healthState`, ['configured', 'missing', 'unknown']);
    requireBoolean(errors, provider.assignableInV38, `${providerPath}.assignableInV38`);
    requireExact(errors, provider.selectionSource, `${providerPath}.selectionSource`, 'agent-cli-provider-health.v1');

    if (provider.assignableInV38 === false && provider.unavailableReason !== null) {
      requireSafeReason(errors, provider.unavailableReason, `${providerPath}.unavailableReason`);
    }

    if (FORBIDDEN_PROVIDER_IDS.includes(provider.providerId)) {
      errors.push(`${providerPath}.providerId must not include gemini-cli, kiro-cli, or deepseek`);
    }
  });

  if (role === 'main-verifier' && candidateProviders.length > 0) {
    errors.push(`${path} must be empty for main-verifier`);
  }
}

function validateMainVerifierOperatorLane(errors, operatorLane, path) {
  if (!isPlainObject(operatorLane)) {
    errors.push(`${path} must be a plain object`);
    return;
  }

  requireExact(errors, operatorLane.operatorId, `${path}.operatorId`, 'main-verifier');
  requireSafeRef(errors, operatorLane.goalId, `${path}.goalId`);
  requireExact(errors, operatorLane.taskId, `${path}.taskId`, 'task-4');
  requireExact(errors, operatorLane.requiresApprovedReviewer, `${path}.requiresApprovedReviewer`, true);
  requireExact(errors, operatorLane.requiresCleanMainVerificationWorktree, `${path}.requiresCleanMainVerificationWorktree`, true);
}

function validateAssignmentMatrix(errors, assignmentMatrix) {
  if (!Array.isArray(assignmentMatrix)) {
    errors.push('assignmentMatrix must be an array');
    return;
  }

  if (assignmentMatrix.length !== V38_ACTIVE_AGENT_CLI_PROVIDER_IDS.length) {
    errors.push('assignmentMatrix must include one independent-review preview per active provider');
  }

  assignmentMatrix.forEach((row, index) => {
    const path = `assignmentMatrix[${index}]`;

    if (!isPlainObject(row)) {
      errors.push(`${path} must be a plain object`);
      return;
    }

    requireSafeRef(errors, row.matrixId, `${path}.matrixId`);
    requireEnum(errors, row.state, `${path}.state`, ASSIGNMENT_STATES);
    validateMatrixRole(errors, row.worker, `${path}.worker`, 'worker');
    validateMatrixRole(errors, row.reviewer, `${path}.reviewer`, 'reviewer');
    validateMatrixRole(errors, row.mainVerifier, `${path}.mainVerifier`, 'main-verifier');
    validateStringArray(errors, row.blockers, `${path}.blockers`);
    requireExact(errors, row.previewOnly, `${path}.previewOnly`, true);
    requireExact(errors, row.autoApprovalAvailable, `${path}.autoApprovalAvailable`, false);

    if (row.worker?.providerId === row.reviewer?.providerId) {
      errors.push(`${path} must recommend a reviewer provider different from the worker provider`);
    }
  });
}

function validateMatrixRole(errors, role, path, expectedRole) {
  if (!isPlainObject(role)) {
    errors.push(`${path} must be a plain object`);
    return;
  }

  requireExact(errors, role.role, `${path}.role`, expectedRole);
  requireSafeRef(errors, role.laneId, `${path}.laneId`);

  if (expectedRole === 'main-verifier') {
    requireExact(errors, role.providerId, `${path}.providerId`, null);
    requireExact(errors, role.operatorControlled, `${path}.operatorControlled`, true);
    return;
  }

  requireEnum(errors, role.providerId, `${path}.providerId`, V38_ACTIVE_AGENT_CLI_PROVIDER_IDS);
}

function validateIndependenceRules(errors, rules) {
  if (!Array.isArray(rules)) {
    errors.push('independenceRules must be an array');
    return;
  }

  for (const required of [
    'worker-cannot-approve-own-task',
    'reviewer-approval-required-before-main-verification',
    'main-verification-required-before-release-ready'
  ]) {
    if (!rules.some((rule) => rule?.ruleId === required && rule?.enabled === true)) {
      errors.push(`independenceRules must include enabled ${required}`);
    }
  }
}

function validateInactiveProviders(errors, inactiveProviders) {
  if (!Array.isArray(inactiveProviders)) {
    errors.push('inactiveProviders must be an array');
    return;
  }

  for (const providerId of ['gemini-cli', 'kiro-cli', 'deepseek']) {
    if (!inactiveProviders.some((provider) => provider?.providerId === providerId)) {
      errors.push(`inactiveProviders must include ${providerId}`);
    }
  }
}

function validateSummary(errors, summary) {
  if (!isPlainObject(summary)) {
    errors.push('summary must be a plain object');
    return;
  }

  requireExact(errors, summary.lanePreviewAvailable, 'summary.lanePreviewAvailable', true);
  requireExact(errors, summary.activeProviderCount, 'summary.activeProviderCount', V38_ACTIVE_AGENT_CLI_PROVIDER_IDS.length);
  requireExact(errors, summary.laneCount, 'summary.laneCount', ROLE_IDS.length);
  requireExact(errors, summary.independentReviewRequired, 'summary.independentReviewRequired', true);
  requireExact(errors, summary.mainVerifierLaneOperatorControlled, 'summary.mainVerifierLaneOperatorControlled', true);
  requireExact(errors, summary.autoAssignmentAvailable, 'summary.autoAssignmentAvailable', false);
  requireExact(errors, summary.autoApprovalAvailable, 'summary.autoApprovalAvailable', false);
  requireExact(errors, summary.providerCliExecutionAvailable, 'summary.providerCliExecutionAvailable', false);
  requireExact(errors, summary.modelInvocationAvailable, 'summary.modelInvocationAvailable', false);
  requireExact(errors, summary.capabilityProfileMappingAvailable, 'summary.capabilityProfileMappingAvailable', true);
}

function validateBoundaries(errors, boundaries) {
  if (!isPlainObject(boundaries)) {
    errors.push('boundaries must be a plain object');
    return;
  }

  requireExact(errors, boundaries.readOnly, 'boundaries.readOnly', true);
  requireExact(errors, boundaries.lanePreviewAvailable, 'boundaries.lanePreviewAvailable', true);
  validateActiveProviderIds(errors, boundaries.activeProviderIds);

  for (const field of [
    'providerCliExecutionAvailable',
    'providerCliExecutionAttempted',
    'rendererProviderInvocationAvailable',
    'promptDispatchAvailable',
    'modelInvocationAvailable',
    'capabilityProbeAvailable',
    'genericShellRunnerAvailable',
    'arbitraryCommandExecutionAvailable',
    'arbitraryPathReadAvailable',
    'envValueExposureAvailable',
    'secretMaterialAvailable',
    'credentialMaterialAvailable',
    'rawProviderConfigAvailable',
    'automaticInstallAvailable',
    'automaticOauthAvailable',
    'repoWriteAvailable',
    'gitWriteAvailable',
    'mergeAvailable',
    'pushAvailable',
    'tagAvailable',
    'publishAvailable',
    'selfApprovalAvailable',
    'reviewerApprovalInferenceAvailable',
    'mainVerificationInferenceAvailable',
    'releaseReadyInferenceAvailable'
  ]) {
    requireExact(errors, boundaries[field], `boundaries.${field}`, false);
  }
}

function validateNoSecretBearingFields(errors, value, path = '') {
  if (Array.isArray(value)) {
    value.forEach((entry, index) => validateNoSecretBearingFields(errors, entry, `${path}[${index}]`));
    return;
  }

  if (!isPlainObject(value)) {
    if (typeof value === 'string' && SECRET_VALUE_PATTERN.test(value)) {
      errors.push(`${path || 'value'} contains secret-looking material`);
    }
    return;
  }

  for (const [key, child] of Object.entries(value)) {
    const childPath = path === '' ? key : `${path}.${key}`;

    if (SECRET_KEY_PATTERN.test(key) && !(ALLOWED_FALSE_SECRET_BOUNDARY_FIELDS.includes(key) && child === false)) {
      errors.push(`${childPath} is not allowed because lane assignment previews must be sanitized`);
      continue;
    }

    validateNoSecretBearingFields(errors, child, childPath);
  }
}

function requireExact(errors, value, path, expected) {
  if (value !== expected) {
    errors.push(`${path} must be ${String(expected)}`);
  }
}

function requireEnum(errors, value, path, allowed) {
  if (!allowed.includes(value)) {
    errors.push(`${path} must be one of ${allowed.join(',')}`);
  }
}

function requireBoolean(errors, value, path) {
  if (typeof value !== 'boolean') {
    errors.push(`${path} must be a boolean`);
  }
}

function requireNonEmptyString(errors, value, path) {
  if (typeof value !== 'string' || value.length === 0) {
    errors.push(`${path} must be a non-empty string`);
  }
}

function requireIsoTimestamp(errors, value, path) {
  requireNonEmptyString(errors, value, path);

  if (Number.isNaN(Date.parse(value))) {
    errors.push(`${path} must be an ISO timestamp`);
  }
}

function requireContractName(errors, value, path) {
  if (typeof value !== 'string' || !/^[a-z0-9][a-z0-9.-]*\.v[0-9]+$/u.test(value)) {
    errors.push(`${path} must be a contract name`);
  }
}

function requireSafeRef(errors, value, path) {
  if (typeof value !== 'string' || value.length === 0 || value.includes('/') || value.includes('\\') || value.includes('..') || value.includes('?') || value.includes('#')) {
    errors.push(`${path} must be a safe ref`);
  }
}

function requireSafeReason(errors, value, path) {
  if (typeof value !== 'string' || value.length === 0 || SECRET_VALUE_PATTERN.test(value) || value.includes('\n')) {
    errors.push(`${path} must be a safe reason`);
  }
}

function validateStringArray(errors, values, path) {
  if (!Array.isArray(values)) {
    errors.push(`${path} must be an array`);
    return;
  }

  values.forEach((value, index) => {
    if (typeof value !== 'string') {
      errors.push(`${path}[${index}] must be a string`);
    }
  });
}

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}
