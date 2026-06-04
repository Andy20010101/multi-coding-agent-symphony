export const AGENT_CLI_PROVIDER_CONTRACT_NAME = 'agent-cli-provider.v1';
export const AGENT_CLI_PROVIDER_CONTRACT_VERSION = 1;

export const V38_ACTIVE_AGENT_CLI_PROVIDER_IDS = Object.freeze([
  'claude-code-cli',
  'codex-cli'
]);

const PROVIDER_KIND = 'agent-cli';
const BACKEND_PROFILE_STATUSES = Object.freeze(['configured', 'missing', 'unknown']);
const AVAILABILITY_STATES = Object.freeze(['configured', 'missing', 'unknown']);
const LANES = Object.freeze(['worker', 'reviewer']);
const GATE_IDS = Object.freeze([
  'provider-profile.present',
  'backend-profile.sanitized',
  'runner.disabled'
]);
const LOCAL_COMMANDS_BY_PROVIDER_ID = Object.freeze({
  'claude-code-cli': 'claude',
  'codex-cli': 'codex'
});
const ADAPTER_IDS_BY_PROVIDER_ID = Object.freeze({
  'claude-code-cli': 'claude-code',
  'codex-cli': 'codex'
});
const DISPLAY_NAMES_BY_PROVIDER_ID = Object.freeze({
  'claude-code-cli': 'Claude Code CLI',
  'codex-cli': 'Codex CLI'
});
const REQUIRED_SOURCE_CONTRACTS = Object.freeze([
  'goal-runbook.v1',
  'goal-next-action.v1',
  'goal-progress-ledger.v1',
  'goal-event-log.v1'
]);
const FORBIDDEN_PROVIDER_IDS = Object.freeze([
  'deepseek',
  'deepseek-cli',
  'gemini-cli',
  'kiro-cli'
]);
const LOCAL_COMMAND_ALLOWED_FIELDS = Object.freeze([
  'command',
  'shellExpansionAvailable',
  'commandExecutionAvailable',
  'automaticInstallAvailable',
  'automaticOauthAvailable'
]);
const LOCAL_COMMAND_RUNNER_FIELDS = Object.freeze([
  'args',
  'argv',
  'shell',
  'rawCommand',
  'commandLine',
  'commandPath',
  'executablePath',
  'binaryPath',
  'path',
  'cwd',
  'env'
]);
const BACKEND_PROFILE_ALLOWED_FIELDS = Object.freeze([
  'profileRef',
  'status',
  'sanitized',
  'secretMaterialAvailable',
  'credentialFileContentsAvailable',
  'rawProviderSettingsAvailable'
]);
const SECRET_KEY_PATTERN = /(?:api[_-]?key|auth[_-]?token|oauth[_-]?token|access[_-]?token|refresh[_-]?token|bearer[_-]?token|password|passphrase|private[_-]?key|credential(?:s|[_-]?file|[_-]?contents)?|secret(?:value|[_-]?value)?|raw[_-]?provider[_-]?settings|raw[_-]?provider[_-]?config|raw[_-]?config|provider[_-]?settings)/iu;
const SECRET_VALUE_PATTERN = /(?:sk-[A-Za-z0-9_-]{8,}|gh[pousr]_[A-Za-z0-9_]{8,}|xox[baprs]-[A-Za-z0-9-]{8,}|-----BEGIN [A-Z ]*PRIVATE KEY-----)/u;

export function buildAgentCliProviderProfileContract({
  goalId = 'v38-provider-hub-capability-profiles',
  taskId = 'task-1',
  generatedAt = new Date().toISOString()
} = {}) {
  return assertAgentCliProviderProfileContract({
    contractName: AGENT_CLI_PROVIDER_CONTRACT_NAME,
    contractVersion: AGENT_CLI_PROVIDER_CONTRACT_VERSION,
    generatedAt,
    readOnly: true,
    context: {
      goalId,
      taskId,
      sourceContracts: [
        'goal-runbook.v1',
        'goal-next-action.v1',
        'goal-progress-ledger.v1',
        'goal-event-log.v1',
        'goal-update-plan.v1'
      ],
      stateSource: 'explicit-backend-contracts',
      scope: 'v38-agent-cli-provider-hub-mvp'
    },
    activeProviders: V38_ACTIVE_AGENT_CLI_PROVIDER_IDS.map((providerId) => buildActiveProvider(providerId)),
    inactiveProviders: [
      {
        providerId: 'gemini-cli',
        reason: 'out-of-scope-for-v38'
      },
      {
        providerId: 'kiro-cli',
        reason: 'out-of-scope-for-v38'
      },
      {
        providerId: 'deepseek',
        reason: 'backend-profile-only-or-future-official-agent-cli-handoff'
      }
    ],
    boundaries: agentCliProviderBoundaries()
  });
}

export function validateAgentCliProviderProfileContract(contract) {
  const errors = [];

  if (!isPlainObject(contract)) {
    return { ok: false, errors: ['agent CLI provider contract must be a plain object'] };
  }

  requireExact(errors, contract.contractName, 'contractName', AGENT_CLI_PROVIDER_CONTRACT_NAME);
  requireExact(errors, contract.contractVersion, 'contractVersion', AGENT_CLI_PROVIDER_CONTRACT_VERSION);
  requireIsoTimestamp(errors, contract.generatedAt, 'generatedAt');
  requireExact(errors, contract.readOnly, 'readOnly', true);
  validateContext(errors, contract.context);
  validateActiveProviders(errors, contract.activeProviders);
  validateInactiveProviders(errors, contract.inactiveProviders);
  validateBoundaries(errors, contract.boundaries);
  validateNoSecretBearingFields(errors, contract);

  return { ok: errors.length === 0, errors };
}

export function assertAgentCliProviderProfileContract(contract) {
  const result = validateAgentCliProviderProfileContract(contract);

  if (!result.ok) {
    throw new Error(`Invalid agent CLI provider contract: ${result.errors.join('; ')}`);
  }

  return contract;
}

function buildActiveProvider(providerId) {
  return {
    providerId,
    displayName: DISPLAY_NAMES_BY_PROVIDER_ID[providerId],
    providerKind: PROVIDER_KIND,
    adapterId: ADAPTER_IDS_BY_PROVIDER_ID[providerId],
    localCommand: {
      command: LOCAL_COMMANDS_BY_PROVIDER_ID[providerId],
      shellExpansionAvailable: false,
      commandExecutionAvailable: false,
      automaticInstallAvailable: false,
      automaticOauthAvailable: false
    },
    backendProfile: {
      profileRef: `${providerId}.backend-profile`,
      status: 'unknown',
      sanitized: true,
      secretMaterialAvailable: false,
      credentialFileContentsAvailable: false,
      rawProviderSettingsAvailable: false
    },
    availability: {
      state: 'unknown',
      healthContract: 'agent-cli-provider-health.v1',
      healthCheckImplementedInV38Task1: false,
      blocker: null
    },
    lanes: LANES.map((laneId) => ({
      laneId,
      assignableInV38: true,
      requiresIndependentReviewForApproval: laneId === 'reviewer'
    })),
    gates: GATE_IDS.map((gateId) => ({
      gateId,
      status: 'unknown',
      evidenceRequired: true
    })),
    workspaceBoundary: {
      workspaceSelectionAvailable: true,
      arbitraryPathReadAvailable: false,
      mainWorktreeWritesAvailable: false,
      workspaceWritesAvailable: false
    },
    promptBoundary: {
      promptDispatchAvailable: false,
      sendsPromptToProvider: false,
      promptTemplateRefOnly: true
    },
    outputBoundary: {
      outputCollectionAvailable: false,
      transcriptCaptureAvailable: false,
      rawProviderOutputAvailable: false,
      redactionRequiredBeforeEvidence: true
    },
    capabilityBoundary: {
      capabilityProfileFieldsAvailable: true,
      capabilityProbeAvailable: false,
      modelCapabilityDiscoveryAvailable: false,
      task3MappingImplemented: false
    },
    execution: {
      providerCliExecutionAvailable: false,
      rendererProviderInvocationAvailable: false,
      rawShellCommandAvailable: false,
      genericShellRunnerAvailable: false,
      modelInvocationAvailable: false
    }
  };
}

function agentCliProviderBoundaries() {
  return {
    readOnly: true,
    activeProviderIds: [...V38_ACTIVE_AGENT_CLI_PROVIDER_IDS],
    providerCliExecutionAvailable: false,
    rendererProviderInvocationAvailable: false,
    promptDispatchAvailable: false,
    modelInvocationAvailable: false,
    healthCheckApiAvailable: false,
    task3CapabilityMappingAvailable: false,
    providerHubPanelAvailable: false,
    genericShellRunnerAvailable: false,
    arbitraryCommandExecutionAvailable: false,
    arbitraryPathReadAvailable: false,
    automaticInstallAvailable: false,
    automaticOauthAvailable: false,
    credentialMaterialAvailable: false,
    rawProviderConfigAvailable: false,
    backendProfileSanitizedOnly: true,
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
  requireSafeRef(errors, context.taskId, 'context.taskId');

  if (!Array.isArray(context.sourceContracts) || context.sourceContracts.length === 0) {
    errors.push('context.sourceContracts must be a non-empty array');
  } else {
    for (const required of REQUIRED_SOURCE_CONTRACTS) {
      if (!context.sourceContracts.includes(required)) {
        errors.push(`context.sourceContracts must include ${required}`);
      }
    }

    context.sourceContracts.forEach((contractName, index) => {
      requireContractName(errors, contractName, `context.sourceContracts[${index}]`);
    });
  }

  requireExact(errors, context.stateSource, 'context.stateSource', 'explicit-backend-contracts');
  requireExact(errors, context.scope, 'context.scope', 'v38-agent-cli-provider-hub-mvp');
}

function validateActiveProviders(errors, activeProviders) {
  if (!Array.isArray(activeProviders)) {
    errors.push('activeProviders must be an array');
    return;
  }

  const actualProviderIds = activeProviders.map((provider) => provider?.providerId);
  const expectedProviderIds = [...V38_ACTIVE_AGENT_CLI_PROVIDER_IDS].sort();

  if (actualProviderIds.length !== V38_ACTIVE_AGENT_CLI_PROVIDER_IDS.length) {
    errors.push('activeProviders must contain exactly claude-code-cli and codex-cli');
  }

  if (actualProviderIds.some((providerId) => FORBIDDEN_PROVIDER_IDS.includes(providerId))) {
    errors.push('activeProviders must not include gemini-cli, kiro-cli, or deepseek');
  }

  if (actualProviderIds.filter(Boolean).sort().join(',') !== expectedProviderIds.join(',')) {
    errors.push('activeProviders must match claude-code-cli,codex-cli');
  }

  const seen = new Set();

  activeProviders.forEach((provider, index) => {
    const path = `activeProviders[${index}]`;

    if (!isPlainObject(provider)) {
      errors.push(`${path} must be a plain object`);
      return;
    }

    validateActiveProvider(errors, provider, path);

    if (isNonEmptyString(provider.providerId)) {
      if (seen.has(provider.providerId)) {
        errors.push(`${path}.providerId must be unique`);
      }

      seen.add(provider.providerId);
    }
  });
}

function validateActiveProvider(errors, provider, path) {
  requireEnum(errors, provider.providerId, `${path}.providerId`, V38_ACTIVE_AGENT_CLI_PROVIDER_IDS);
  requireExact(errors, provider.displayName, `${path}.displayName`, DISPLAY_NAMES_BY_PROVIDER_ID[provider.providerId]);
  requireExact(errors, provider.providerKind, `${path}.providerKind`, PROVIDER_KIND);
  requireExact(errors, provider.adapterId, `${path}.adapterId`, ADAPTER_IDS_BY_PROVIDER_ID[provider.providerId]);
  validateLocalCommand(errors, provider.localCommand, `${path}.localCommand`, LOCAL_COMMANDS_BY_PROVIDER_ID[provider.providerId]);
  validateBackendProfile(errors, provider.backendProfile, `${path}.backendProfile`);
  validateAvailability(errors, provider.availability, `${path}.availability`);
  validateLanes(errors, provider.lanes, `${path}.lanes`);
  validateGates(errors, provider.gates, `${path}.gates`);
  validateWorkspaceBoundary(errors, provider.workspaceBoundary, `${path}.workspaceBoundary`);
  validatePromptBoundary(errors, provider.promptBoundary, `${path}.promptBoundary`);
  validateOutputBoundary(errors, provider.outputBoundary, `${path}.outputBoundary`);
  validateCapabilityBoundary(errors, provider.capabilityBoundary, `${path}.capabilityBoundary`);
  validateExecution(errors, provider.execution, `${path}.execution`);
}

function validateLocalCommand(errors, localCommand, path, expectedCommand) {
  if (!isPlainObject(localCommand)) {
    errors.push(`${path} must be a plain object`);
    return;
  }

  validateAllowedFields(errors, localCommand, path, LOCAL_COMMAND_ALLOWED_FIELDS, {
    forbiddenFields: LOCAL_COMMAND_RUNNER_FIELDS,
    forbiddenMessage: 'is not allowed in v38 task-1'
  });

  requireExact(errors, localCommand.command, `${path}.command`, expectedCommand);

  for (const field of [
    'shellExpansionAvailable',
    'commandExecutionAvailable',
    'automaticInstallAvailable',
    'automaticOauthAvailable'
  ]) {
    requireExact(errors, localCommand[field], `${path}.${field}`, false);
  }

}

function validateBackendProfile(errors, backendProfile, path) {
  if (!isPlainObject(backendProfile)) {
    errors.push(`${path} must be a plain object`);
    return;
  }

  validateAllowedFields(errors, backendProfile, path, BACKEND_PROFILE_ALLOWED_FIELDS, {
    secretMessage: 'is not allowed because backend profiles must be sanitized'
  });

  requireSafeRef(errors, backendProfile.profileRef, `${path}.profileRef`);
  requireEnum(errors, backendProfile.status, `${path}.status`, BACKEND_PROFILE_STATUSES);
  requireExact(errors, backendProfile.sanitized, `${path}.sanitized`, true);

  for (const field of [
    'secretMaterialAvailable',
    'credentialFileContentsAvailable',
    'rawProviderSettingsAvailable'
  ]) {
    requireExact(errors, backendProfile[field], `${path}.${field}`, false);
  }
}

function validateAllowedFields(errors, object, path, allowedFields, {
  forbiddenFields = [],
  forbiddenMessage = 'is not allowed',
  secretMessage = 'is not allowed because it is secret-bearing'
} = {}) {
  const allowed = new Set(allowedFields);
  const forbidden = new Set(forbiddenFields);

  for (const key of Object.keys(object)) {
    if (allowed.has(key)) {
      continue;
    }

    if (forbidden.has(key)) {
      errors.push(`${path}.${key} ${forbiddenMessage}`);
    } else if (isForbiddenSecretKey(key)) {
      errors.push(`${path}.${key} ${secretMessage}`);
    } else {
      errors.push(`${path}.${key} is not an allowed field`);
    }
  }
}

function validateAvailability(errors, availability, path) {
  if (!isPlainObject(availability)) {
    errors.push(`${path} must be a plain object`);
    return;
  }

  requireEnum(errors, availability.state, `${path}.state`, AVAILABILITY_STATES);
  requireContractName(errors, availability.healthContract, `${path}.healthContract`);
  requireExact(errors, availability.healthCheckImplementedInV38Task1, `${path}.healthCheckImplementedInV38Task1`, false);

  if (availability.blocker !== null && typeof availability.blocker !== 'string') {
    errors.push(`${path}.blocker must be null or a string`);
  }
}

function validateLanes(errors, lanes, path) {
  if (!Array.isArray(lanes) || lanes.length !== LANES.length) {
    errors.push(`${path} must contain worker and reviewer lanes`);
    return;
  }

  const laneIds = lanes.map((lane) => lane?.laneId).sort();

  if (laneIds.join(',') !== [...LANES].sort().join(',')) {
    errors.push(`${path} must contain worker and reviewer lanes`);
  }

  lanes.forEach((lane, index) => {
    const lanePath = `${path}[${index}]`;

    if (!isPlainObject(lane)) {
      errors.push(`${lanePath} must be a plain object`);
      return;
    }

    requireEnum(errors, lane.laneId, `${lanePath}.laneId`, LANES);
    requireExact(errors, lane.assignableInV38, `${lanePath}.assignableInV38`, true);

    if (lane.laneId === 'reviewer') {
      requireExact(errors, lane.requiresIndependentReviewForApproval, `${lanePath}.requiresIndependentReviewForApproval`, true);
    } else {
      requireExact(errors, lane.requiresIndependentReviewForApproval, `${lanePath}.requiresIndependentReviewForApproval`, false);
    }
  });
}

function validateGates(errors, gates, path) {
  if (!Array.isArray(gates) || gates.length !== GATE_IDS.length) {
    errors.push(`${path} must contain the v38 task-1 provider gates`);
    return;
  }

  const gateIds = gates.map((gate) => gate?.gateId).sort();

  if (gateIds.join(',') !== [...GATE_IDS].sort().join(',')) {
    errors.push(`${path} must contain the v38 task-1 provider gates`);
  }

  gates.forEach((gate, index) => {
    const gatePath = `${path}[${index}]`;

    if (!isPlainObject(gate)) {
      errors.push(`${gatePath} must be a plain object`);
      return;
    }

    requireEnum(errors, gate.gateId, `${gatePath}.gateId`, GATE_IDS);
    requireEnum(errors, gate.status, `${gatePath}.status`, BACKEND_PROFILE_STATUSES);
    requireExact(errors, gate.evidenceRequired, `${gatePath}.evidenceRequired`, true);
  });
}

function validateWorkspaceBoundary(errors, boundary, path) {
  if (!isPlainObject(boundary)) {
    errors.push(`${path} must be a plain object`);
    return;
  }

  requireExact(errors, boundary.workspaceSelectionAvailable, `${path}.workspaceSelectionAvailable`, true);

  for (const field of [
    'arbitraryPathReadAvailable',
    'mainWorktreeWritesAvailable',
    'workspaceWritesAvailable'
  ]) {
    requireExact(errors, boundary[field], `${path}.${field}`, false);
  }
}

function validatePromptBoundary(errors, boundary, path) {
  if (!isPlainObject(boundary)) {
    errors.push(`${path} must be a plain object`);
    return;
  }

  requireExact(errors, boundary.promptDispatchAvailable, `${path}.promptDispatchAvailable`, false);
  requireExact(errors, boundary.sendsPromptToProvider, `${path}.sendsPromptToProvider`, false);
  requireExact(errors, boundary.promptTemplateRefOnly, `${path}.promptTemplateRefOnly`, true);
}

function validateOutputBoundary(errors, boundary, path) {
  if (!isPlainObject(boundary)) {
    errors.push(`${path} must be a plain object`);
    return;
  }

  for (const field of [
    'outputCollectionAvailable',
    'transcriptCaptureAvailable',
    'rawProviderOutputAvailable'
  ]) {
    requireExact(errors, boundary[field], `${path}.${field}`, false);
  }

  requireExact(errors, boundary.redactionRequiredBeforeEvidence, `${path}.redactionRequiredBeforeEvidence`, true);
}

function validateCapabilityBoundary(errors, boundary, path) {
  if (!isPlainObject(boundary)) {
    errors.push(`${path} must be a plain object`);
    return;
  }

  requireExact(errors, boundary.capabilityProfileFieldsAvailable, `${path}.capabilityProfileFieldsAvailable`, true);

  for (const field of [
    'capabilityProbeAvailable',
    'modelCapabilityDiscoveryAvailable',
    'task3MappingImplemented'
  ]) {
    requireExact(errors, boundary[field], `${path}.${field}`, false);
  }
}

function validateExecution(errors, execution, path) {
  if (!isPlainObject(execution)) {
    errors.push(`${path} must be a plain object`);
    return;
  }

  for (const field of [
    'providerCliExecutionAvailable',
    'rendererProviderInvocationAvailable',
    'rawShellCommandAvailable',
    'genericShellRunnerAvailable',
    'modelInvocationAvailable'
  ]) {
    requireExact(errors, execution[field], `${path}.${field}`, false);
  }
}

function validateInactiveProviders(errors, inactiveProviders) {
  if (!Array.isArray(inactiveProviders)) {
    errors.push('inactiveProviders must be an array');
    return;
  }

  inactiveProviders.forEach((provider, index) => {
    const path = `inactiveProviders[${index}]`;

    if (!isPlainObject(provider)) {
      errors.push(`${path} must be a plain object`);
      return;
    }

    requireEnum(errors, provider.providerId, `${path}.providerId`, FORBIDDEN_PROVIDER_IDS);
    requireSafeReason(errors, provider.reason, `${path}.reason`);
  });
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
    'rendererProviderInvocationAvailable',
    'promptDispatchAvailable',
    'modelInvocationAvailable',
    'healthCheckApiAvailable',
    'task3CapabilityMappingAvailable',
    'providerHubPanelAvailable',
    'genericShellRunnerAvailable',
    'arbitraryCommandExecutionAvailable',
    'arbitraryPathReadAvailable',
    'automaticInstallAvailable',
    'automaticOauthAvailable',
    'credentialMaterialAvailable',
    'rawProviderConfigAvailable',
    'gitWriteAvailable',
    'mergeAvailable',
    'pushAvailable',
    'tagAvailable',
    'publishAvailable',
    'selfApprovalAvailable'
  ]) {
    requireExact(errors, boundaries[field], `boundaries.${field}`, false);
  }

  requireExact(errors, boundaries.backendProfileSanitizedOnly, 'boundaries.backendProfileSanitizedOnly', true);
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
      errors.push(`${entryPath} is not allowed because backend profiles must be sanitized`);
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
    'backendProfileSanitizedOnly',
    'redactionRequiredBeforeEvidence'
  ].includes(key)) {
    return false;
  }

  return SECRET_KEY_PATTERN.test(key);
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

function requireContractName(errors, value, path) {
  if (typeof value !== 'string' || !/^[a-z][a-z0-9-]*(?:\.[a-z][a-z0-9-]*)*(?:\.v[0-9]+)$/u.test(value)) {
    errors.push(`${path} must be a contract name ending in .v<number>`);
  }
}

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim() !== '';
}
