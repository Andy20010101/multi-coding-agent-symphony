import {
  buildAgentCliProviderProfileContract,
  V38_ACTIVE_AGENT_CLI_PROVIDER_IDS
} from './agent-cli-provider-profile.js';

export const AGENT_CLI_PROVIDER_HEALTH_CONTRACT_NAME = 'agent-cli-provider-health.v1';
export const AGENT_CLI_PROVIDER_HEALTH_CONTRACT_VERSION = 1;

const PROVIDER_ENV_VARS = Object.freeze({
  'claude-code-cli': Object.freeze(['ANTHROPIC_API_KEY']),
  'codex-cli': Object.freeze(['OPENAI_API_KEY'])
});
const HEALTH_STATES = Object.freeze(['configured', 'missing', 'unknown']);
const FORBIDDEN_PROVIDER_IDS = Object.freeze([
  'deepseek',
  'deepseek-cli',
  'gemini-cli',
  'kiro-cli'
]);
const SECRET_KEY_PATTERN = /(?:api[_-]?key|auth[_-]?token|oauth[_-]?token|access[_-]?token|refresh[_-]?token|bearer[_-]?token|password|passphrase|private[_-]?key|credential(?:s|[_-]?file|[_-]?contents)?|secret(?:value|[_-]?value)?|raw[_-]?provider[_-]?settings|raw[_-]?provider[_-]?config|raw[_-]?config|provider[_-]?settings)/iu;
const SECRET_VALUE_PATTERN = /(?:sk-[A-Za-z0-9_-]{8,}|gh[pousr]_[A-Za-z0-9_]{8,}|xox[baprs]-[A-Za-z0-9-]{8,}|-----BEGIN [A-Z ]*PRIVATE KEY-----)/u;

export function buildAgentCliProviderHealthContract({
  goalId = 'v38-provider-hub-capability-profiles',
  taskId = 'task-2',
  generatedAt = new Date().toISOString(),
  env = process.env
} = {}) {
  const profile = buildAgentCliProviderProfileContract({
    goalId,
    taskId: 'task-1',
    generatedAt
  });

  return assertAgentCliProviderHealthContract({
    contractName: AGENT_CLI_PROVIDER_HEALTH_CONTRACT_NAME,
    contractVersion: AGENT_CLI_PROVIDER_HEALTH_CONTRACT_VERSION,
    generatedAt,
    readOnly: true,
    context: {
      goalId,
      taskId,
      sourceContracts: [
        'agent-cli-provider.v1',
        'goal-runbook.v1',
        'goal-next-action.v1',
        'goal-progress-ledger.v1',
        'goal-event-log.v1'
      ],
      stateSource: 'explicit-backend-contracts',
      scope: 'v38-agent-cli-provider-hub-mvp'
    },
    providers: profile.activeProviders.map((provider) => buildProviderHealth(provider, env)),
    inactiveProviders: profile.inactiveProviders,
    summary: buildSummary(profile.activeProviders, env),
    boundaries: {
      readOnly: true,
      activeProviderIds: [...V38_ACTIVE_AGENT_CLI_PROVIDER_IDS],
      providerCliExecutionAvailable: false,
      providerCliExecutionAttempted: false,
      rendererProviderInvocationAvailable: false,
      promptDispatchAvailable: false,
      modelInvocationAvailable: false,
      genericShellRunnerAvailable: false,
      arbitraryCommandExecutionAvailable: false,
      commandProbeAvailable: false,
      filesystemCredentialReadAvailable: false,
      envValueExposureAvailable: false,
      credentialMaterialAvailable: false,
      rawProviderConfigAvailable: false,
      automaticInstallAvailable: false,
      automaticOauthAvailable: false,
      gitWriteAvailable: false,
      mergeAvailable: false,
      pushAvailable: false,
      tagAvailable: false,
      publishAvailable: false,
      selfApprovalAvailable: false
    }
  });
}

export function validateAgentCliProviderHealthContract(contract) {
  const errors = [];

  if (!isPlainObject(contract)) {
    return { ok: false, errors: ['agent CLI provider health contract must be a plain object'] };
  }

  requireExact(errors, contract.contractName, 'contractName', AGENT_CLI_PROVIDER_HEALTH_CONTRACT_NAME);
  requireExact(errors, contract.contractVersion, 'contractVersion', AGENT_CLI_PROVIDER_HEALTH_CONTRACT_VERSION);
  requireIsoTimestamp(errors, contract.generatedAt, 'generatedAt');
  requireExact(errors, contract.readOnly, 'readOnly', true);
  validateContext(errors, contract.context);
  validateProviders(errors, contract.providers);
  validateInactiveProviders(errors, contract.inactiveProviders);
  validateSummary(errors, contract.summary);
  validateBoundaries(errors, contract.boundaries);
  validateNoSecretBearingFields(errors, contract);

  return { ok: errors.length === 0, errors };
}

export function assertAgentCliProviderHealthContract(contract) {
  const result = validateAgentCliProviderHealthContract(contract);

  if (!result.ok) {
    throw new Error(`Invalid agent CLI provider health contract: ${result.errors.join('; ')}`);
  }

  return contract;
}

function buildProviderHealth(provider, env) {
  const envPresence = PROVIDER_ENV_VARS[provider.providerId].map((name) => ({
    name,
    present: isPresentEnvValue(env?.[name]),
    valueAvailable: false
  }));
  const hasRequiredCredential = envPresence.every((entry) => entry.present);
  const state = hasRequiredCredential ? 'configured' : 'missing';

  return {
    providerId: provider.providerId,
    displayName: provider.displayName,
    providerKind: provider.providerKind,
    adapterId: provider.adapterId,
    health: {
      state,
      checkedAt: null,
      checkSource: 'sanitized-env-presence',
      commandProbeAttempted: false,
      commandProbeAvailable: false,
      modelInvocationAttempted: false,
      blocker: hasRequiredCredential ? null : 'required-env-not-detected'
    },
    localCommand: {
      command: provider.localCommand.command,
      commandExecutionAvailable: false,
      commandExecutionAttempted: false,
      shellExpansionAvailable: false
    },
    backendProfile: {
      profileRef: provider.backendProfile.profileRef,
      status: state,
      sanitized: true,
      requiredEnv: envPresence,
      secretMaterialAvailable: false,
      credentialFileContentsAvailable: false,
      rawProviderSettingsAvailable: false
    },
    lanes: provider.lanes.map((lane) => ({
      laneId: lane.laneId,
      assignableInV38: state === 'configured',
      unavailableReason: state === 'configured' ? null : 'provider-health-missing'
    }))
  };
}

function buildSummary(providers, env) {
  const providerStates = providers.map((provider) => {
    const envNames = PROVIDER_ENV_VARS[provider.providerId];
    return envNames.every((name) => isPresentEnvValue(env?.[name])) ? 'configured' : 'missing';
  });

  return {
    activeProviderCount: providers.length,
    configuredProviderCount: providerStates.filter((state) => state === 'configured').length,
    missingProviderCount: providerStates.filter((state) => state === 'missing').length,
    unknownProviderCount: providerStates.filter((state) => state === 'unknown').length,
    healthCheckApiAvailable: true,
    state: providerStates.every((state) => state === 'configured') ? 'configured' : 'missing'
  };
}

function validateContext(errors, context) {
  if (!isPlainObject(context)) {
    errors.push('context must be a plain object');
    return;
  }

  requireSafeRef(errors, context.goalId, 'context.goalId');
  requireExact(errors, context.taskId, 'context.taskId', 'task-2');
  requireExact(errors, context.stateSource, 'context.stateSource', 'explicit-backend-contracts');
  requireExact(errors, context.scope, 'context.scope', 'v38-agent-cli-provider-hub-mvp');

  if (!Array.isArray(context.sourceContracts) || !context.sourceContracts.includes('agent-cli-provider.v1')) {
    errors.push('context.sourceContracts must include agent-cli-provider.v1');
  }
}

function validateProviders(errors, providers) {
  if (!Array.isArray(providers)) {
    errors.push('providers must be an array');
    return;
  }

  const providerIds = providers.map((provider) => provider?.providerId);

  if (providerIds.length !== V38_ACTIVE_AGENT_CLI_PROVIDER_IDS.length || providerIds.filter(Boolean).sort().join(',') !== [...V38_ACTIVE_AGENT_CLI_PROVIDER_IDS].sort().join(',')) {
    errors.push('providers must match claude-code-cli,codex-cli');
  }

  if (providerIds.some((providerId) => FORBIDDEN_PROVIDER_IDS.includes(providerId))) {
    errors.push('providers must not include gemini-cli, kiro-cli, or deepseek');
  }

  providers.forEach((provider, index) => validateProvider(errors, provider, `providers[${index}]`));
}

function validateProvider(errors, provider, path) {
  if (!isPlainObject(provider)) {
    errors.push(`${path} must be a plain object`);
    return;
  }

  requireEnum(errors, provider.providerId, `${path}.providerId`, V38_ACTIVE_AGENT_CLI_PROVIDER_IDS);
  requireNonEmptyString(errors, provider.displayName, `${path}.displayName`);
  requireExact(errors, provider.providerKind, `${path}.providerKind`, 'agent-cli');
  requireSafeRef(errors, provider.adapterId, `${path}.adapterId`);
  validateHealth(errors, provider.health, `${path}.health`);
  validateLocalCommand(errors, provider.localCommand, `${path}.localCommand`);
  validateBackendProfile(errors, provider.backendProfile, `${path}.backendProfile`);
  validateLanes(errors, provider.lanes, `${path}.lanes`);
}

function validateHealth(errors, health, path) {
  if (!isPlainObject(health)) {
    errors.push(`${path} must be a plain object`);
    return;
  }

  requireEnum(errors, health.state, `${path}.state`, HEALTH_STATES);
  requireExact(errors, health.checkSource, `${path}.checkSource`, 'sanitized-env-presence');
  requireExact(errors, health.commandProbeAttempted, `${path}.commandProbeAttempted`, false);
  requireExact(errors, health.commandProbeAvailable, `${path}.commandProbeAvailable`, false);
  requireExact(errors, health.modelInvocationAttempted, `${path}.modelInvocationAttempted`, false);

  if (health.checkedAt !== null) {
    requireIsoTimestamp(errors, health.checkedAt, `${path}.checkedAt`);
  }

  if (health.blocker !== null) {
    requireSafeReason(errors, health.blocker, `${path}.blocker`);
  }
}

function validateLocalCommand(errors, localCommand, path) {
  if (!isPlainObject(localCommand)) {
    errors.push(`${path} must be a plain object`);
    return;
  }

  requireNonEmptyString(errors, localCommand.command, `${path}.command`);
  requireExact(errors, localCommand.commandExecutionAvailable, `${path}.commandExecutionAvailable`, false);
  requireExact(errors, localCommand.commandExecutionAttempted, `${path}.commandExecutionAttempted`, false);
  requireExact(errors, localCommand.shellExpansionAvailable, `${path}.shellExpansionAvailable`, false);
}

function validateBackendProfile(errors, backendProfile, path) {
  if (!isPlainObject(backendProfile)) {
    errors.push(`${path} must be a plain object`);
    return;
  }

  requireSafeRef(errors, backendProfile.profileRef, `${path}.profileRef`);
  requireEnum(errors, backendProfile.status, `${path}.status`, HEALTH_STATES);
  requireExact(errors, backendProfile.sanitized, `${path}.sanitized`, true);
  requireExact(errors, backendProfile.secretMaterialAvailable, `${path}.secretMaterialAvailable`, false);
  requireExact(errors, backendProfile.credentialFileContentsAvailable, `${path}.credentialFileContentsAvailable`, false);
  requireExact(errors, backendProfile.rawProviderSettingsAvailable, `${path}.rawProviderSettingsAvailable`, false);

  if (!Array.isArray(backendProfile.requiredEnv) || backendProfile.requiredEnv.length === 0) {
    errors.push(`${path}.requiredEnv must be a non-empty array`);
  } else {
    backendProfile.requiredEnv.forEach((entry, index) => validateRequiredEnv(errors, entry, `${path}.requiredEnv[${index}]`));
  }
}

function validateRequiredEnv(errors, entry, path) {
  if (!isPlainObject(entry)) {
    errors.push(`${path} must be a plain object`);
    return;
  }

  requireEnum(errors, entry.name, `${path}.name`, ['ANTHROPIC_API_KEY', 'OPENAI_API_KEY']);

  if (typeof entry.present !== 'boolean') {
    errors.push(`${path}.present must be a boolean`);
  }

  requireExact(errors, entry.valueAvailable, `${path}.valueAvailable`, false);
}

function validateLanes(errors, lanes, path) {
  if (!Array.isArray(lanes) || lanes.length !== 2) {
    errors.push(`${path} must contain worker and reviewer lanes`);
    return;
  }

  lanes.forEach((lane, index) => {
    const lanePath = `${path}[${index}]`;

    if (!isPlainObject(lane)) {
      errors.push(`${lanePath} must be a plain object`);
      return;
    }

    requireEnum(errors, lane.laneId, `${lanePath}.laneId`, ['worker', 'reviewer']);

    if (typeof lane.assignableInV38 !== 'boolean') {
      errors.push(`${lanePath}.assignableInV38 must be a boolean`);
    }

    if (lane.unavailableReason !== null) {
      requireSafeReason(errors, lane.unavailableReason, `${lanePath}.unavailableReason`);
    }
  });
}

function validateInactiveProviders(errors, inactiveProviders) {
  if (!Array.isArray(inactiveProviders)) {
    errors.push('inactiveProviders must be an array');
    return;
  }

  inactiveProviders.forEach((provider, index) => {
    if (!isPlainObject(provider)) {
      errors.push(`inactiveProviders[${index}] must be a plain object`);
      return;
    }

    requireEnum(errors, provider.providerId, `inactiveProviders[${index}].providerId`, FORBIDDEN_PROVIDER_IDS);
    requireSafeReason(errors, provider.reason, `inactiveProviders[${index}].reason`);
  });
}

function validateSummary(errors, summary) {
  if (!isPlainObject(summary)) {
    errors.push('summary must be a plain object');
    return;
  }

  for (const field of [
    'activeProviderCount',
    'configuredProviderCount',
    'missingProviderCount',
    'unknownProviderCount'
  ]) {
    if (!Number.isInteger(summary[field]) || summary[field] < 0) {
      errors.push(`summary.${field} must be a non-negative integer`);
    }
  }

  requireExact(errors, summary.healthCheckApiAvailable, 'summary.healthCheckApiAvailable', true);
  requireEnum(errors, summary.state, 'summary.state', HEALTH_STATES);
}

function validateBoundaries(errors, boundaries) {
  if (!isPlainObject(boundaries)) {
    errors.push('boundaries must be a plain object');
    return;
  }

  requireExact(errors, boundaries.readOnly, 'boundaries.readOnly', true);

  if (!Array.isArray(boundaries.activeProviderIds) || boundaries.activeProviderIds.sort().join(',') !== [...V38_ACTIVE_AGENT_CLI_PROVIDER_IDS].sort().join(',')) {
    errors.push('boundaries.activeProviderIds must match claude-code-cli,codex-cli');
  }

  for (const field of [
    'providerCliExecutionAvailable',
    'providerCliExecutionAttempted',
    'rendererProviderInvocationAvailable',
    'promptDispatchAvailable',
    'modelInvocationAvailable',
    'genericShellRunnerAvailable',
    'arbitraryCommandExecutionAvailable',
    'commandProbeAvailable',
    'filesystemCredentialReadAvailable',
    'envValueExposureAvailable',
    'credentialMaterialAvailable',
    'rawProviderConfigAvailable',
    'automaticInstallAvailable',
    'automaticOauthAvailable',
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
      errors.push(`${path || 'contract'} must not contain secret-looking values`);
    }

    return;
  }

  for (const [key, entry] of Object.entries(value)) {
    const entryPath = path ? `${path}.${key}` : key;

    if (isForbiddenSecretKey(key)) {
      errors.push(`${entryPath} is not allowed because provider health must be sanitized`);
      continue;
    }

    validateNoSecretBearingFields(errors, entry, entryPath);
  }
}

function isForbiddenSecretKey(key) {
  if ([
    'secretMaterialAvailable',
    'credentialFileContentsAvailable',
    'rawProviderSettingsAvailable',
    'credentialMaterialAvailable',
    'rawProviderConfigAvailable',
    'filesystemCredentialReadAvailable'
  ].includes(key)) {
    return false;
  }

  return SECRET_KEY_PATTERN.test(key);
}

function isPresentEnvValue(value) {
  return typeof value === 'string' && value.trim() !== '';
}

function requireExact(errors, value, path, expected) {
  if (value !== expected) {
    errors.push(`${path} must be ${String(expected)}`);
  }
}

function requireEnum(errors, value, path, allowed) {
  if (!allowed.includes(value)) {
    errors.push(`${path} must be one of ${allowed.join(', ')}`);
  }
}

function requireIsoTimestamp(errors, value, path) {
  if (typeof value !== 'string' || Number.isNaN(Date.parse(value))) {
    errors.push(`${path} must be an ISO timestamp`);
  }
}

function requireNonEmptyString(errors, value, path) {
  if (typeof value !== 'string' || value.trim() === '') {
    errors.push(`${path} must be a non-empty string`);
  }
}

function requireSafeRef(errors, value, path) {
  if (typeof value !== 'string' || !/^[A-Za-z0-9][A-Za-z0-9._-]*$/u.test(value)) {
    errors.push(`${path} must be a safe ref`);
  }
}

function requireSafeReason(errors, value, path) {
  if (typeof value !== 'string' || !/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/u.test(value)) {
    errors.push(`${path} must be a safe reason`);
  }
}

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}
