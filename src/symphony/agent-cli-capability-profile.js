import { buildActionManifestContract } from './action-manifest.js';
import {
  buildAgentCliProviderHealthContract
} from './agent-cli-provider-health.js';
import {
  buildAgentCliProviderProfileContract,
  V38_ACTIVE_AGENT_CLI_PROVIDER_IDS
} from './agent-cli-provider-profile.js';

export const AGENT_CLI_CAPABILITY_PROFILE_CONTRACT_NAME = 'agent-cli-capability-profile.v1';
export const AGENT_CLI_CAPABILITY_PROFILE_CONTRACT_VERSION = 1;

const REQUIRED_REQUIREMENT_IDS = Object.freeze([
  'repo.write',
  'model.invoke',
  'test.run',
  'git.change'
]);
const REQUIREMENT_IDS = Object.freeze([
  ...REQUIRED_REQUIREMENT_IDS,
  'goal.event.append',
  'evidence.ref',
  'provider.health.read'
]);
const REQUIREMENT_STATES = Object.freeze([
  'read-only',
  'copy-only',
  'controlled-confirm',
  'unavailable'
]);
const GATE_STATES = Object.freeze([
  'available',
  'copy-only',
  'controlled',
  'disabled',
  'missing',
  'unknown'
]);
const FORBIDDEN_PROVIDER_IDS = Object.freeze([
  'deepseek',
  'deepseek-cli',
  'gemini-cli',
  'kiro-cli'
]);
const SECRET_KEY_PATTERN = /(?:api[_-]?key|auth[_-]?token|oauth[_-]?token|access[_-]?token|refresh[_-]?token|bearer[_-]?token|password|passphrase|private[_-]?key|credential(?:s|[_-]?file|[_-]?contents)?|secret(?:value|[_-]?value)?|raw[_-]?provider[_-]?settings|raw[_-]?provider[_-]?config|raw[_-]?config|provider[_-]?settings)/iu;
const SECRET_VALUE_PATTERN = /(?:sk-[A-Za-z0-9_-]{8,}|gh[pousr]_[A-Za-z0-9_]{8,}|xox[baprs]-[A-Za-z0-9-]{8,}|-----BEGIN [A-Z ]*PRIVATE KEY-----)/u;
const ALLOWED_FALSE_SECRET_BOUNDARY_FIELDS = Object.freeze([
  'secretMaterialAvailable',
  'credentialMaterialAvailable',
  'rawProviderConfigAvailable'
]);

const REQUIREMENT_GATE_MAP = Object.freeze({
  'repo.write': Object.freeze({
    state: 'unavailable',
    providerGateIds: Object.freeze(['provider.workspace.write.disabled']),
    toolGateIds: Object.freeze(['repo.write.disabled']),
    reason: 'v38 provider capability mapping does not grant repository writes.'
  }),
  'model.invoke': Object.freeze({
    state: 'unavailable',
    providerGateIds: Object.freeze([
      'provider.cli.execution.disabled',
      'provider.model.invoke.disabled'
    ]),
    toolGateIds: Object.freeze(['prompt.dispatch.disabled']),
    reason: 'v38 does not invoke provider CLIs or models.'
  }),
  'test.run': Object.freeze({
    state: 'copy-only',
    providerGateIds: Object.freeze([]),
    toolGateIds: Object.freeze(['validation.copy-only']),
    reason: 'Validation commands are exposed as operator-run copy-only commands.'
  }),
  'git.change': Object.freeze({
    state: 'unavailable',
    providerGateIds: Object.freeze(['provider.git.write.disabled']),
    toolGateIds: Object.freeze(['git.change.disabled']),
    reason: 'v38 Provider Hub does not merge, push, tag, or publish.'
  }),
  'goal.event.append': Object.freeze({
    state: 'controlled-confirm',
    providerGateIds: Object.freeze([]),
    toolGateIds: Object.freeze(['goal.event.append.controlled']),
    reason: 'Goal events require dry-run plus plan-hash confirmation.'
  }),
  'evidence.ref': Object.freeze({
    state: 'read-only',
    providerGateIds: Object.freeze([]),
    toolGateIds: Object.freeze(['evidence.ref.only']),
    reason: 'Contracts carry evidence refs without reading evidence bodies.'
  }),
  'provider.health.read': Object.freeze({
    state: 'read-only',
    providerGateIds: Object.freeze(['provider.health.contract.read']),
    toolGateIds: Object.freeze([]),
    reason: 'Provider health is read from agent-cli-provider-health.v1.'
  })
});

const ACTION_REQUIREMENTS = Object.freeze({
  'goal.worker-evidence.record': Object.freeze(['goal.event.append', 'evidence.ref']),
  'goal.review-verdict.record': Object.freeze(['goal.event.append', 'evidence.ref']),
  'goal.main-verification-gate.record': Object.freeze(['test.run', 'git.change', 'goal.event.append', 'evidence.ref']),
  'goal.release-gate.record': Object.freeze(['test.run', 'git.change', 'goal.event.append', 'evidence.ref']),
  'goal.implementation.preview': Object.freeze(['repo.write', 'model.invoke', 'test.run', 'git.change'])
});

export function buildAgentCliCapabilityProfileContract({
  goalId = 'v38-provider-hub-capability-profiles',
  taskId = 'task-3',
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
  const actionManifest = buildActionManifestContract({
    goalId,
    taskId,
    generatedAt
  });
  const requirements = REQUIREMENT_IDS.map((requirementId) => buildRequirement(requirementId));
  const requirementById = new Map(requirements.map((requirement) => [requirement.requirementId, requirement]));

  return assertAgentCliCapabilityProfileContract({
    contractName: AGENT_CLI_CAPABILITY_PROFILE_CONTRACT_NAME,
    contractVersion: AGENT_CLI_CAPABILITY_PROFILE_CONTRACT_VERSION,
    generatedAt,
    readOnly: true,
    context: {
      goalId,
      taskId,
      sourceContracts: [
        'agent-cli-provider.v1',
        'agent-cli-provider-health.v1',
        'action-manifest.v1',
        'action-availability.v1',
        'action-preview.v1',
        'goal-runbook.v1',
        'goal-next-action.v1',
        'goal-progress-ledger.v1',
        'goal-event-log.v1',
        'goal-operation-runs.v1',
        'controlled-implementation-plan-preview.v1',
        'controlled-verification-run-confirmation.v1'
      ],
      stateSource: 'explicit-backend-contracts',
      scope: 'v38-agent-cli-provider-hub-mvp',
      activeGoalAnchored: true,
      activeTaskAnchored: true,
      runContextSource: 'goal-operation-runs.v1',
      evidenceContextSource: 'goal-event-log.v1:evidenceRefs'
    },
    requirements,
    providerGates: providerProfile.activeProviders.map((provider) => buildProviderGateProfile({
      provider,
      health: providerHealth.providers.find((entry) => entry.providerId === provider.providerId)
    })),
    toolGates: buildToolGates(),
    actionMappings: actionManifest.actions.map((action) => buildActionMapping({
      action,
      requirementById
    })),
    inactiveProviders: providerProfile.inactiveProviders,
    summary: buildSummary({ requirements, actions: actionManifest.actions }),
    boundaries: buildBoundaries()
  });
}

export function validateAgentCliCapabilityProfileContract(contract) {
  const errors = [];

  if (!isPlainObject(contract)) {
    return { ok: false, errors: ['agent CLI capability profile contract must be a plain object'] };
  }

  requireExact(errors, contract.contractName, 'contractName', AGENT_CLI_CAPABILITY_PROFILE_CONTRACT_NAME);
  requireExact(errors, contract.contractVersion, 'contractVersion', AGENT_CLI_CAPABILITY_PROFILE_CONTRACT_VERSION);
  requireIsoTimestamp(errors, contract.generatedAt, 'generatedAt');
  requireExact(errors, contract.readOnly, 'readOnly', true);
  validateContext(errors, contract.context);
  validateRequirements(errors, contract.requirements);
  validateProviderGates(errors, contract.providerGates);
  validateToolGates(errors, contract.toolGates);
  validateActionMappings(errors, contract.actionMappings, contract.requirements);
  validateInactiveProviders(errors, contract.inactiveProviders);
  validateSummary(errors, contract.summary);
  validateBoundaries(errors, contract.boundaries);
  validateNoSecretBearingFields(errors, contract);

  return { ok: errors.length === 0, errors };
}

export function assertAgentCliCapabilityProfileContract(contract) {
  const result = validateAgentCliCapabilityProfileContract(contract);

  if (!result.ok) {
    throw new Error(`Invalid agent CLI capability profile contract: ${result.errors.join('; ')}`);
  }

  return contract;
}

function buildRequirement(requirementId) {
  const gateMap = REQUIREMENT_GATE_MAP[requirementId];

  return {
    requirementId,
    state: gateMap.state,
    providerGateIds: [...gateMap.providerGateIds],
    toolGateIds: [...gateMap.toolGateIds],
    reason: gateMap.reason,
    source: 'action-requirement'
  };
}

function buildProviderGateProfile({ provider, health }) {
  return {
    providerId: provider.providerId,
    displayName: provider.displayName,
    providerKind: provider.providerKind,
    adapterId: provider.adapterId,
    healthState: health?.health?.state ?? 'unknown',
    gates: [
      {
        gateId: 'provider.profile.present',
        state: 'available',
        requirementIds: ['provider.health.read'],
        sourceContract: 'agent-cli-provider.v1'
      },
      {
        gateId: 'provider.health.contract.read',
        state: health?.health?.state === 'configured' ? 'available' : 'missing',
        requirementIds: ['provider.health.read'],
        sourceContract: 'agent-cli-provider-health.v1'
      },
      {
        gateId: 'provider.workspace.write.disabled',
        state: 'disabled',
        requirementIds: ['repo.write'],
        sourceContract: 'agent-cli-provider.v1'
      },
      {
        gateId: 'provider.cli.execution.disabled',
        state: 'disabled',
        requirementIds: ['model.invoke'],
        sourceContract: 'agent-cli-provider.v1'
      },
      {
        gateId: 'provider.model.invoke.disabled',
        state: 'disabled',
        requirementIds: ['model.invoke'],
        sourceContract: 'agent-cli-provider.v1'
      },
      {
        gateId: 'provider.git.write.disabled',
        state: 'disabled',
        requirementIds: ['git.change'],
        sourceContract: 'agent-cli-provider.v1'
      }
    ],
    boundaries: {
      providerCliExecutionAvailable: false,
      modelInvocationAvailable: false,
      capabilityProbeAvailable: false,
      workspaceWritesAvailable: false,
      gitWriteAvailable: false,
      secretMaterialAvailable: false
    }
  };
}

function buildToolGates() {
  return [
    {
      gateId: 'repo.write.disabled',
      state: 'disabled',
      requirementIds: ['repo.write'],
      sourceContract: 'controlled-implementation-plan-preview.v1',
      confirmationContract: null,
      copyOnlyCommands: []
    },
    {
      gateId: 'prompt.dispatch.disabled',
      state: 'disabled',
      requirementIds: ['model.invoke'],
      sourceContract: 'action-preview.v1',
      confirmationContract: null,
      copyOnlyCommands: []
    },
    {
      gateId: 'validation.copy-only',
      state: 'copy-only',
      requirementIds: ['test.run'],
      sourceContract: 'goal-runbook.v1',
      confirmationContract: null,
      copyOnlyCommands: [
        'pnpm check',
        'pnpm test',
        'pnpm workbench:build',
        'git diff --check'
      ]
    },
    {
      gateId: 'git.change.disabled',
      state: 'disabled',
      requirementIds: ['git.change'],
      sourceContract: 'goal-next-action.v1',
      confirmationContract: null,
      copyOnlyCommands: []
    },
    {
      gateId: 'goal.event.append.controlled',
      state: 'controlled',
      requirementIds: ['goal.event.append'],
      sourceContract: 'goal-update-plan.v1',
      confirmationContract: 'goal-update-plan.v1',
      copyOnlyCommands: []
    },
    {
      gateId: 'evidence.ref.only',
      state: 'available',
      requirementIds: ['evidence.ref'],
      sourceContract: 'goal-event-log.v1',
      confirmationContract: null,
      copyOnlyCommands: []
    }
  ];
}

function buildActionMapping({ action, requirementById }) {
  const requirementIds = ACTION_REQUIREMENTS[action.action_id] ?? [];
  const requirements = requirementIds.map((requirementId) => requirementById.get(requirementId));

  return {
    action_id: action.action_id,
    label: action.label,
    role: action.role,
    requiredContext: action.availability.requiredContext,
    requirementIds,
    providerGateIds: unique(requirements.flatMap((requirement) => requirement?.providerGateIds ?? [])),
    toolGateIds: unique(requirements.flatMap((requirement) => requirement?.toolGateIds ?? [])),
    confirmationContract: action.eventMapping.confirmationContract,
    eventTypes: [
      action.eventMapping.primaryEventType,
      ...action.eventMapping.alternateEventTypes
    ].filter((eventType) => eventType !== null),
    previewOnly: true,
    executionEnabled: false,
    stateSource: 'action-manifest.v1'
  };
}

function buildSummary({ requirements, actions }) {
  return {
    activeProviderCount: V38_ACTIVE_AGENT_CLI_PROVIDER_IDS.length,
    mappedRequirementCount: requirements.length,
    mappedActionCount: actions.length,
    requiredRequirementIds: [...REQUIRED_REQUIREMENT_IDS],
    capabilityProfileMappingAvailable: true,
    providerCliExecutionAvailable: false,
    modelInvocationAvailable: false,
    repoWriteAvailable: false,
    gitChangeAvailable: false,
    testRunMode: 'copy-only'
  };
}

function buildBoundaries() {
  return {
    readOnly: true,
    activeProviderIds: [...V38_ACTIVE_AGENT_CLI_PROVIDER_IDS],
    actionRequirementMappingAvailable: true,
    providerCliExecutionAvailable: false,
    providerCliExecutionAttempted: false,
    rendererProviderInvocationAvailable: false,
    promptDispatchAvailable: false,
    modelInvocationAvailable: false,
    capabilityProbeAvailable: false,
    modelCapabilityDiscoveryAvailable: false,
    genericShellRunnerAvailable: false,
    arbitraryCommandExecutionAvailable: false,
    arbitraryPathReadAvailable: false,
    envValueExposureAvailable: false,
    credentialMaterialAvailable: false,
    rawProviderConfigAvailable: false,
    actionExecutionAvailable: false,
    jobQueueAvailable: false,
    automaticInstallAvailable: false,
    automaticOauthAvailable: false,
    repoWriteAvailable: false,
    gitWriteAvailable: false,
    mergeAvailable: false,
    pushAvailable: false,
    tagAvailable: false,
    publishAvailable: false,
    selfApprovalAvailable: false
  };
}

function validateContext(errors, context) {
  if (!isPlainObject(context)) {
    errors.push('context must be a plain object');
    return;
  }

  requireSafeRef(errors, context.goalId, 'context.goalId');
  requireExact(errors, context.taskId, 'context.taskId', 'task-3');
  requireExact(errors, context.stateSource, 'context.stateSource', 'explicit-backend-contracts');
  requireExact(errors, context.scope, 'context.scope', 'v38-agent-cli-provider-hub-mvp');
  requireExact(errors, context.activeGoalAnchored, 'context.activeGoalAnchored', true);
  requireExact(errors, context.activeTaskAnchored, 'context.activeTaskAnchored', true);
  requireExact(errors, context.runContextSource, 'context.runContextSource', 'goal-operation-runs.v1');
  requireExact(errors, context.evidenceContextSource, 'context.evidenceContextSource', 'goal-event-log.v1:evidenceRefs');

  for (const required of [
    'agent-cli-provider.v1',
    'agent-cli-provider-health.v1',
    'action-manifest.v1',
    'action-availability.v1',
    'action-preview.v1',
    'goal-runbook.v1',
    'goal-next-action.v1',
    'goal-progress-ledger.v1',
    'goal-event-log.v1'
  ]) {
    if (!Array.isArray(context.sourceContracts) || !context.sourceContracts.includes(required)) {
      errors.push(`context.sourceContracts must include ${required}`);
    }
  }
}

function validateRequirements(errors, requirements) {
  if (!Array.isArray(requirements)) {
    errors.push('requirements must be an array');
    return;
  }

  const ids = requirements.map((requirement) => requirement?.requirementId);

  for (const required of REQUIRED_REQUIREMENT_IDS) {
    if (!ids.includes(required)) {
      errors.push(`requirements must include ${required}`);
    }
  }

  requirements.forEach((requirement, index) => {
    const path = `requirements[${index}]`;

    if (!isPlainObject(requirement)) {
      errors.push(`${path} must be a plain object`);
      return;
    }

    requireEnum(errors, requirement.requirementId, `${path}.requirementId`, REQUIREMENT_IDS);
    requireEnum(errors, requirement.state, `${path}.state`, REQUIREMENT_STATES);
    validateStringArray(errors, requirement.providerGateIds, `${path}.providerGateIds`);
    validateStringArray(errors, requirement.toolGateIds, `${path}.toolGateIds`);
    requireNonEmptyString(errors, requirement.reason, `${path}.reason`);
    requireExact(errors, requirement.source, `${path}.source`, 'action-requirement');
  });
}

function validateProviderGates(errors, providerGates) {
  if (!Array.isArray(providerGates)) {
    errors.push('providerGates must be an array');
    return;
  }

  const providerIds = providerGates.map((provider) => provider?.providerId);

  if (providerIds.filter(Boolean).sort().join(',') !== [...V38_ACTIVE_AGENT_CLI_PROVIDER_IDS].sort().join(',')) {
    errors.push('providerGates must match claude-code-cli,codex-cli');
  }

  if (providerIds.some((providerId) => FORBIDDEN_PROVIDER_IDS.includes(providerId))) {
    errors.push('providerGates must not include gemini-cli, kiro-cli, or deepseek');
  }

  providerGates.forEach((provider, index) => {
    const path = `providerGates[${index}]`;

    if (!isPlainObject(provider)) {
      errors.push(`${path} must be a plain object`);
      return;
    }

    requireEnum(errors, provider.providerId, `${path}.providerId`, V38_ACTIVE_AGENT_CLI_PROVIDER_IDS);
    requireNonEmptyString(errors, provider.displayName, `${path}.displayName`);
    requireExact(errors, provider.providerKind, `${path}.providerKind`, 'agent-cli');
    requireSafeRef(errors, provider.adapterId, `${path}.adapterId`);
    requireEnum(errors, provider.healthState, `${path}.healthState`, ['configured', 'missing', 'unknown']);
    validateGateList(errors, provider.gates, `${path}.gates`);
    validateProviderBoundaries(errors, provider.boundaries, `${path}.boundaries`);
  });
}

function validateProviderBoundaries(errors, boundaries, path) {
  if (!isPlainObject(boundaries)) {
    errors.push(`${path} must be a plain object`);
    return;
  }

  for (const field of [
    'providerCliExecutionAvailable',
    'modelInvocationAvailable',
    'capabilityProbeAvailable',
    'workspaceWritesAvailable',
    'gitWriteAvailable',
    'secretMaterialAvailable'
  ]) {
    requireExact(errors, boundaries[field], `${path}.${field}`, false);
  }
}

function validateToolGates(errors, toolGates) {
  if (!Array.isArray(toolGates)) {
    errors.push('toolGates must be an array');
    return;
  }

  toolGates.forEach((gate, index) => validateGate(errors, gate, `toolGates[${index}]`));
}

function validateGateList(errors, gates, path) {
  if (!Array.isArray(gates) || gates.length === 0) {
    errors.push(`${path} must be a non-empty array`);
    return;
  }

  gates.forEach((gate, index) => validateGate(errors, gate, `${path}[${index}]`));
}

function validateGate(errors, gate, path) {
  if (!isPlainObject(gate)) {
    errors.push(`${path} must be a plain object`);
    return;
  }

  requireSafeRef(errors, gate.gateId, `${path}.gateId`);
  requireEnum(errors, gate.state, `${path}.state`, GATE_STATES);
  validateStringArray(errors, gate.requirementIds, `${path}.requirementIds`);
  requireContractName(errors, gate.sourceContract, `${path}.sourceContract`);

  if (Object.hasOwn(gate, 'confirmationContract') && gate.confirmationContract !== null) {
    requireContractName(errors, gate.confirmationContract, `${path}.confirmationContract`);
  }

  if (Object.hasOwn(gate, 'copyOnlyCommands')) {
    validateStringArray(errors, gate.copyOnlyCommands, `${path}.copyOnlyCommands`);
  }
}

function validateActionMappings(errors, actionMappings, requirements) {
  if (!Array.isArray(actionMappings)) {
    errors.push('actionMappings must be an array');
    return;
  }

  const requirementIds = new Set((Array.isArray(requirements) ? requirements : []).map((requirement) => requirement?.requirementId));

  actionMappings.forEach((mapping, index) => {
    const path = `actionMappings[${index}]`;

    if (!isPlainObject(mapping)) {
      errors.push(`${path} must be a plain object`);
      return;
    }

    requireSafeActionId(errors, mapping.action_id, `${path}.action_id`);
    requireNonEmptyString(errors, mapping.label, `${path}.label`);
    requireNonEmptyString(errors, mapping.role, `${path}.role`);
    validateStringArray(errors, mapping.requiredContext, `${path}.requiredContext`);
    validateStringArray(errors, mapping.requirementIds, `${path}.requirementIds`);
    validateStringArray(errors, mapping.providerGateIds, `${path}.providerGateIds`);
    validateStringArray(errors, mapping.toolGateIds, `${path}.toolGateIds`);
    requireContractName(errors, mapping.confirmationContract, `${path}.confirmationContract`);
    validateStringArray(errors, mapping.eventTypes, `${path}.eventTypes`);
    requireExact(errors, mapping.previewOnly, `${path}.previewOnly`, true);
    requireExact(errors, mapping.executionEnabled, `${path}.executionEnabled`, false);
    requireExact(errors, mapping.stateSource, `${path}.stateSource`, 'action-manifest.v1');

    for (const requirementId of mapping.requirementIds ?? []) {
      if (!requirementIds.has(requirementId)) {
        errors.push(`${path}.requirementIds contains unknown requirement ${requirementId}`);
      }
    }
  });
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

  requireExact(errors, summary.activeProviderCount, 'summary.activeProviderCount', V38_ACTIVE_AGENT_CLI_PROVIDER_IDS.length);
  requireExact(errors, summary.capabilityProfileMappingAvailable, 'summary.capabilityProfileMappingAvailable', true);
  requireExact(errors, summary.providerCliExecutionAvailable, 'summary.providerCliExecutionAvailable', false);
  requireExact(errors, summary.modelInvocationAvailable, 'summary.modelInvocationAvailable', false);
  requireExact(errors, summary.repoWriteAvailable, 'summary.repoWriteAvailable', false);
  requireExact(errors, summary.gitChangeAvailable, 'summary.gitChangeAvailable', false);
  requireExact(errors, summary.testRunMode, 'summary.testRunMode', 'copy-only');

  if (!Number.isInteger(summary.mappedRequirementCount) || summary.mappedRequirementCount < REQUIRED_REQUIREMENT_IDS.length) {
    errors.push('summary.mappedRequirementCount must cover required requirements');
  }

  if (!Number.isInteger(summary.mappedActionCount) || summary.mappedActionCount <= 0) {
    errors.push('summary.mappedActionCount must be a positive integer');
  }

  for (const requirementId of REQUIRED_REQUIREMENT_IDS) {
    if (!Array.isArray(summary.requiredRequirementIds) || !summary.requiredRequirementIds.includes(requirementId)) {
      errors.push(`summary.requiredRequirementIds must include ${requirementId}`);
    }
  }
}

function validateBoundaries(errors, boundaries) {
  if (!isPlainObject(boundaries)) {
    errors.push('boundaries must be a plain object');
    return;
  }

  requireExact(errors, boundaries.readOnly, 'boundaries.readOnly', true);
  requireExact(errors, boundaries.actionRequirementMappingAvailable, 'boundaries.actionRequirementMappingAvailable', true);

  if (!Array.isArray(boundaries.activeProviderIds) || boundaries.activeProviderIds.sort().join(',') !== [...V38_ACTIVE_AGENT_CLI_PROVIDER_IDS].sort().join(',')) {
    errors.push('boundaries.activeProviderIds must match claude-code-cli,codex-cli');
  }

  for (const field of [
    'providerCliExecutionAvailable',
    'providerCliExecutionAttempted',
    'rendererProviderInvocationAvailable',
    'promptDispatchAvailable',
    'modelInvocationAvailable',
    'capabilityProbeAvailable',
    'modelCapabilityDiscoveryAvailable',
    'genericShellRunnerAvailable',
    'arbitraryCommandExecutionAvailable',
    'arbitraryPathReadAvailable',
    'envValueExposureAvailable',
    'credentialMaterialAvailable',
    'rawProviderConfigAvailable',
    'actionExecutionAvailable',
    'jobQueueAvailable',
    'automaticInstallAvailable',
    'automaticOauthAvailable',
    'repoWriteAvailable',
    'gitWriteAvailable',
    'mergeAvailable',
    'pushAvailable',
    'tagAvailable',
    'publishAvailable',
    'selfApprovalAvailable'
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
      errors.push(`${path || 'value'} must not expose secret-looking values`);
    }

    return;
  }

  for (const [key, entry] of Object.entries(value)) {
    const childPath = path ? `${path}.${key}` : key;

    if (ALLOWED_FALSE_SECRET_BOUNDARY_FIELDS.includes(key) && entry === false) {
      continue;
    }

    if (SECRET_KEY_PATTERN.test(key)) {
      errors.push(`${childPath} is not allowed because capability profiles must be sanitized`);
    }

    validateNoSecretBearingFields(errors, entry, childPath);
  }
}

function isPlainObject(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function requireExact(errors, actual, path, expected) {
  if (actual !== expected) {
    errors.push(`${path} must be ${String(expected)}`);
  }
}

function requireEnum(errors, actual, path, allowed) {
  if (!allowed.includes(actual)) {
    errors.push(`${path} must be one of ${allowed.join(',')}`);
  }
}

function requireNonEmptyString(errors, value, path) {
  if (!isNonEmptyString(value)) {
    errors.push(`${path} must be a non-empty string`);
  }
}

function requireSafeRef(errors, value, path) {
  if (!isNonEmptyString(value) || !/^[A-Za-z0-9._:/@-]+$/u.test(value) || value.includes('..') || value.includes('//')) {
    errors.push(`${path} must be a safe ref`);
  }
}

function requireSafeActionId(errors, value, path) {
  if (!isNonEmptyString(value) || !/^[a-z0-9][a-z0-9.-]*$/u.test(value) || value.includes('..')) {
    errors.push(`${path} must be a safe action id`);
  }
}

function requireContractName(errors, value, path) {
  if (!isNonEmptyString(value) || !/^[a-z0-9][a-z0-9.-]*\.v[0-9]+$/u.test(value)) {
    errors.push(`${path} must be a contract name`);
  }
}

function validateStringArray(errors, value, path) {
  if (!Array.isArray(value)) {
    errors.push(`${path} must be an array`);
    return;
  }

  value.forEach((entry, index) => requireNonEmptyString(errors, entry, `${path}[${index}]`));
}

function requireIsoTimestamp(errors, value, path) {
  if (!isNonEmptyString(value) || Number.isNaN(Date.parse(value))) {
    errors.push(`${path} must be an ISO timestamp`);
  }
}

function unique(values) {
  return [...new Set(values)];
}
