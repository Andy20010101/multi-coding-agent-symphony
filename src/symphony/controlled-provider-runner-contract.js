export const CONTROLLED_PROVIDER_RUNNER_CONTRACT_NAME = 'controlled-provider-runner.v1';
export const CONTROLLED_PROVIDER_RUNNER_CONTRACT_VERSION = 1;

export const V41_ACTIVE_PROVIDER_RUNNER_IDS = Object.freeze([
  'claude-code-cli',
  'codex-cli'
]);

const PROVIDER_KIND = 'agent-cli';
const GOAL_ID = 'v41-controlled-cli-provider-runner-backend-completion';
const TASK_ID = 'task-1';
const RUNNER_SCOPE = 'v41-controlled-cli-provider-runner';
const COMMAND_TEMPLATE_OWNER = 'backend';
const RUNNER_ROLES = Object.freeze(['worker', 'reviewer']);
const CONTROLLED_MODES = Object.freeze(['preview', 'confirmed-run']);
const COMMAND_REFS_BY_PROVIDER_ID = Object.freeze({
  'claude-code-cli': 'claude',
  'codex-cli': 'codex'
});
const DISPLAY_NAMES_BY_PROVIDER_ID = Object.freeze({
  'claude-code-cli': 'Claude Code CLI',
  'codex-cli': 'Codex CLI'
});
const ADAPTER_IDS_BY_PROVIDER_ID = Object.freeze({
  'claude-code-cli': 'claude-code',
  'codex-cli': 'codex'
});
const FORBIDDEN_PROVIDER_IDS = Object.freeze([
  'deepseek',
  'deepseek-cli',
  'gemini-cli',
  'kiro-cli'
]);
const REQUIRED_SOURCE_CONTRACTS = Object.freeze([
  'agent-cli-provider.v1',
  'agent-cli-provider-health.v1',
  'agent-cli-capability-profile.v1',
  'goal-runbook.v1',
  'goal-operation-runs.v1',
  'goal-event-log.v1',
  'goal-update-plan.v1'
]);
const ALLOWED_INPUT_FIELDS = Object.freeze([
  'goalId',
  'taskId',
  'role',
  'providerId',
  'mode',
  'promptRef',
  'evidenceRef',
  'runId'
]);
const REJECTED_INPUT_FIELDS = Object.freeze([
  'command',
  'rawCommand',
  'commandLine',
  'shell',
  'args',
  'argv',
  'cwd',
  'path',
  'localPath',
  'absolutePath',
  'executablePath',
  'commandPath',
  'env',
  'apiKey',
  'authToken',
  'oauthToken',
  'secretValue',
  'credentialFile',
  'credentialFileContents',
  'rawProviderSettings',
  'rendererCommandTemplate'
]);
const RUNNER_INPUT_ALLOWED_FIELDS = Object.freeze([
  'acceptedFields',
  'rejectedFields',
  'requiredFields',
  'allowedRoles',
  'controlledModes',
  'commandTextInputAvailable',
  'arbitraryProviderInputAvailable',
  'arbitraryPathInputAvailable',
  'secretValueInputAvailable',
  'rendererCommandConstructionAvailable'
]);
const REQUIRED_INPUT_FIELDS = Object.freeze([
  'goalId',
  'taskId',
  'role',
  'providerId',
  'mode',
  'promptRef',
  'runId'
]);
const OUTPUT_FIELDS = Object.freeze([
  'providerId',
  'goalId',
  'taskId',
  'role',
  'runId',
  'commandTemplateId',
  'status',
  'exitCode',
  'startedAt',
  'finishedAt',
  'durationMs',
  'artifactRefs',
  'redactionStatus',
  'failureLayer',
  'sanitizedSummary'
]);
const RUNNER_OUTPUT_ALLOWED_FIELDS = Object.freeze([
  'fields',
  'statuses',
  'rawProviderOutputAvailable',
  'sanitizedSummaryRequired',
  'redactionStatusRequired',
  'artifactRefsOnly'
]);
const STATUSES = Object.freeze([
  'planned',
  'running',
  'succeeded',
  'failed',
  'blocked',
  'timed-out'
]);
const FAILURE_LAYERS = Object.freeze([
  'schema',
  'provider-availability',
  'command-execution',
  'timeout',
  'redaction',
  'workspace',
  'expected-check'
]);
const TEMPLATE_ALLOWED_FIELDS = Object.freeze([
  'templateId',
  'providerId',
  'owner',
  'commandRef',
  'supportedRoles',
  'controlledModes',
  'argvShape',
  'commandTextAvailable',
  'rendererConstructionAvailable',
  'shellExpansionAvailable',
  'arbitraryArgsAvailable',
  'arbitraryCwdAvailable'
]);
const TEMPLATE_FORBIDDEN_FIELDS = Object.freeze([
  'command',
  'rawCommand',
  'commandLine',
  'shell',
  'args',
  'argv',
  'cwd',
  'path',
  'localPath',
  'absolutePath',
  'executablePath',
  'commandPath',
  'env',
  'rendererCommandTemplate'
]);
const SECRET_KEY_PATTERN = /(?:api[_-]?key|auth[_-]?token|oauth[_-]?token|access[_-]?token|refresh[_-]?token|bearer[_-]?token|password|passphrase|private[_-]?key|credential(?:s|[_-]?file|[_-]?contents)?|secret(?:value|[_-]?value)?|env[_-]?value|raw[_-]?provider[_-]?settings|raw[_-]?provider[_-]?config|raw[_-]?config|provider[_-]?settings)/iu;
const SECRET_VALUE_PATTERN = /(?:sk-[A-Za-z0-9_-]{8,}|gh[pousr]_[A-Za-z0-9_]{8,}|xox[baprs]-[A-Za-z0-9-]{8,}|-----BEGIN [A-Z ]*PRIVATE KEY-----)/u;
const ALLOWED_FALSE_SECRET_BOUNDARY_FIELDS = Object.freeze([
  'secretMaterialAvailable',
  'credentialMaterialAvailable',
  'credentialFileContentsAvailable',
  'rawProviderSettingsAvailable',
  'envValueExposureAvailable',
  'secretValueInputAvailable'
]);

export function buildControlledProviderRunnerContract({
  goalId = GOAL_ID,
  taskId = TASK_ID,
  generatedAt = new Date().toISOString()
} = {}) {
  return assertControlledProviderRunnerContract({
    contractName: CONTROLLED_PROVIDER_RUNNER_CONTRACT_NAME,
    contractVersion: CONTROLLED_PROVIDER_RUNNER_CONTRACT_VERSION,
    generatedAt,
    context: {
      goalId,
      taskId,
      sourceContracts: [...REQUIRED_SOURCE_CONTRACTS],
      stateSource: 'explicit-backend-contracts',
      scope: RUNNER_SCOPE,
      sourceContext: 'v38-provider-profile-health-capability-boundaries',
      activeGoalAnchored: true,
      activeTaskAnchored: true
    },
    activeProviders: V41_ACTIVE_PROVIDER_RUNNER_IDS.map((providerId) => buildActiveProvider(providerId)),
    inactiveProviders: [
      {
        providerId: 'gemini-cli',
        reason: 'not-active-in-v41'
      },
      {
        providerId: 'kiro-cli',
        reason: 'not-active-in-v41'
      },
      {
        providerId: 'deepseek',
        reason: 'future-sanitized-backend-profile-reference-only'
      }
    ],
    runnerInput: {
      acceptedFields: [...ALLOWED_INPUT_FIELDS],
      rejectedFields: [...REJECTED_INPUT_FIELDS],
      requiredFields: [...REQUIRED_INPUT_FIELDS],
      allowedRoles: [...RUNNER_ROLES],
      controlledModes: [...CONTROLLED_MODES],
      commandTextInputAvailable: false,
      arbitraryProviderInputAvailable: false,
      arbitraryPathInputAvailable: false,
      secretValueInputAvailable: false,
      rendererCommandConstructionAvailable: false
    },
    commandTemplates: V41_ACTIVE_PROVIDER_RUNNER_IDS.flatMap((providerId) => RUNNER_ROLES.map((role) => buildCommandTemplate({
      providerId,
      role
    }))),
    runnerOutput: {
      fields: [...OUTPUT_FIELDS],
      statuses: [...STATUSES],
      rawProviderOutputAvailable: false,
      sanitizedSummaryRequired: true,
      redactionStatusRequired: true,
      artifactRefsOnly: true
    },
    failureStates: FAILURE_LAYERS.map((failureLayer) => ({
      failureLayer,
      status: failureLayer === 'timeout' ? 'timed-out' : 'failed',
      evidenceRequired: true,
      recoveryNoteRequired: true
    })),
    boundaries: {
      activeProviderIds: [...V41_ACTIVE_PROVIDER_RUNNER_IDS],
      providerCliExecutionAvailableOnlyThroughBackendRunner: true,
      task2ExecutionAdapterImplemented: false,
      commandTemplateOwner: COMMAND_TEMPLATE_OWNER,
      rendererProviderInvocationAvailable: false,
      rendererCommandConstructionAvailable: false,
      rawShellCommandAvailable: false,
      genericShellRunnerAvailable: false,
      arbitraryCommandExecutionAvailable: false,
      arbitraryPathReadAvailable: false,
      arbitraryCwdAvailable: false,
      promptDispatchFromRendererAvailable: false,
      modelInvocationFromRendererAvailable: false,
      automaticInstallAvailable: false,
      automaticOauthAvailable: false,
      envValueExposureAvailable: false,
      secretMaterialAvailable: false,
      credentialMaterialAvailable: false,
      credentialFileContentsAvailable: false,
      rawProviderSettingsAvailable: false,
      rawProviderOutputAvailable: false,
      mergeAvailable: false,
      pushAvailable: false,
      tagAvailable: false,
      publishAvailable: false,
      selfApprovalAvailable: false
    }
  });
}

export function validateControlledProviderRunnerContract(contract) {
  const errors = [];

  if (!isPlainObject(contract)) {
    return { ok: false, errors: ['controlled provider runner contract must be a plain object'] };
  }

  requireExact(errors, contract.contractName, 'contractName', CONTROLLED_PROVIDER_RUNNER_CONTRACT_NAME);
  requireExact(errors, contract.contractVersion, 'contractVersion', CONTROLLED_PROVIDER_RUNNER_CONTRACT_VERSION);
  requireIsoTimestamp(errors, contract.generatedAt, 'generatedAt');
  validateContext(errors, contract.context);
  validateActiveProviders(errors, contract.activeProviders);
  validateInactiveProviders(errors, contract.inactiveProviders);
  validateRunnerInput(errors, contract.runnerInput);
  validateCommandTemplates(errors, contract.commandTemplates);
  validateRunnerOutput(errors, contract.runnerOutput);
  validateFailureStates(errors, contract.failureStates);
  validateBoundaries(errors, contract.boundaries);
  validateNoSecretBearingFields(errors, contract);

  return { ok: errors.length === 0, errors };
}

export function assertControlledProviderRunnerContract(contract) {
  const result = validateControlledProviderRunnerContract(contract);

  if (!result.ok) {
    throw new Error(`Invalid controlled provider runner contract: ${result.errors.join('; ')}`);
  }

  return contract;
}

function buildActiveProvider(providerId) {
  return {
    providerId,
    displayName: DISPLAY_NAMES_BY_PROVIDER_ID[providerId],
    providerKind: PROVIDER_KIND,
    adapterId: ADAPTER_IDS_BY_PROVIDER_ID[providerId],
    sourceProfileRef: `${providerId}.backend-profile`,
    backendRunner: {
      available: true,
      executionAdapterImplemented: false,
      commandTemplateOwner: COMMAND_TEMPLATE_OWNER,
      commandTemplateIds: RUNNER_ROLES.map((role) => templateIdFor(providerId, role)),
      rendererProviderInvocationAvailable: false,
      rawShellCommandAvailable: false,
      genericShellRunnerAvailable: false,
      arbitraryCommandInputAvailable: false,
      arbitraryPathInputAvailable: false,
      secretMaterialAvailable: false
    }
  };
}

function buildCommandTemplate({ providerId, role }) {
  return {
    templateId: templateIdFor(providerId, role),
    providerId,
    owner: COMMAND_TEMPLATE_OWNER,
    commandRef: COMMAND_REFS_BY_PROVIDER_ID[providerId],
    supportedRoles: [role],
    controlledModes: [...CONTROLLED_MODES],
    argvShape: 'backend-owned-template',
    commandTextAvailable: false,
    rendererConstructionAvailable: false,
    shellExpansionAvailable: false,
    arbitraryArgsAvailable: false,
    arbitraryCwdAvailable: false
  };
}

function templateIdFor(providerId, role) {
  return `v41.provider-runner.${providerId}.${role}`;
}

function validateContext(errors, context) {
  if (!isPlainObject(context)) {
    errors.push('context must be a plain object');
    return;
  }

  requireExact(errors, context.goalId, 'context.goalId', GOAL_ID);
  requireExact(errors, context.taskId, 'context.taskId', TASK_ID);
  requireExact(errors, context.stateSource, 'context.stateSource', 'explicit-backend-contracts');
  requireExact(errors, context.scope, 'context.scope', RUNNER_SCOPE);
  requireExact(errors, context.sourceContext, 'context.sourceContext', 'v38-provider-profile-health-capability-boundaries');
  requireExact(errors, context.activeGoalAnchored, 'context.activeGoalAnchored', true);
  requireExact(errors, context.activeTaskAnchored, 'context.activeTaskAnchored', true);

  if (!Array.isArray(context.sourceContracts)) {
    errors.push('context.sourceContracts must be an array');
    return;
  }

  for (const required of REQUIRED_SOURCE_CONTRACTS) {
    if (!context.sourceContracts.includes(required)) {
      errors.push(`context.sourceContracts must include ${required}`);
    }
  }
}

function validateActiveProviders(errors, activeProviders) {
  if (!Array.isArray(activeProviders)) {
    errors.push('activeProviders must be an array');
    return;
  }

  const providerIds = activeProviders.map((provider) => provider?.providerId);

  if (providerIds.length !== V41_ACTIVE_PROVIDER_RUNNER_IDS.length || providerIds.filter(Boolean).sort().join(',') !== [...V41_ACTIVE_PROVIDER_RUNNER_IDS].sort().join(',')) {
    errors.push('activeProviders must contain exactly claude-code-cli and codex-cli');
  }

  if (providerIds.some((providerId) => FORBIDDEN_PROVIDER_IDS.includes(providerId))) {
    errors.push('activeProviders must not include gemini-cli, kiro-cli, or deepseek');
  }

  activeProviders.forEach((provider, index) => validateActiveProvider(errors, provider, `activeProviders[${index}]`));
}

function validateActiveProvider(errors, provider, path) {
  if (!isPlainObject(provider)) {
    errors.push(`${path} must be a plain object`);
    return;
  }

  requireEnum(errors, provider.providerId, `${path}.providerId`, V41_ACTIVE_PROVIDER_RUNNER_IDS);
  requireNonEmptyString(errors, provider.displayName, `${path}.displayName`);
  requireExact(errors, provider.providerKind, `${path}.providerKind`, PROVIDER_KIND);
  requireSafeRef(errors, provider.adapterId, `${path}.adapterId`);
  requireExact(errors, provider.sourceProfileRef, `${path}.sourceProfileRef`, `${provider.providerId}.backend-profile`);
  validateBackendRunner(errors, provider.backendRunner, `${path}.backendRunner`, provider.providerId);
}

function validateBackendRunner(errors, backendRunner, path, providerId) {
  if (!isPlainObject(backendRunner)) {
    errors.push(`${path} must be a plain object`);
    return;
  }

  requireExact(errors, backendRunner.available, `${path}.available`, true);
  requireExact(errors, backendRunner.executionAdapterImplemented, `${path}.executionAdapterImplemented`, false);
  requireExact(errors, backendRunner.commandTemplateOwner, `${path}.commandTemplateOwner`, COMMAND_TEMPLATE_OWNER);
  validateExactStringArray(errors, backendRunner.commandTemplateIds, `${path}.commandTemplateIds`, RUNNER_ROLES.map((role) => templateIdFor(providerId, role)));
  requireExact(errors, backendRunner.rendererProviderInvocationAvailable, `${path}.rendererProviderInvocationAvailable`, false);
  requireExact(errors, backendRunner.rawShellCommandAvailable, `${path}.rawShellCommandAvailable`, false);
  requireExact(errors, backendRunner.genericShellRunnerAvailable, `${path}.genericShellRunnerAvailable`, false);
  requireExact(errors, backendRunner.arbitraryCommandInputAvailable, `${path}.arbitraryCommandInputAvailable`, false);
  requireExact(errors, backendRunner.arbitraryPathInputAvailable, `${path}.arbitraryPathInputAvailable`, false);
  requireExact(errors, backendRunner.secretMaterialAvailable, `${path}.secretMaterialAvailable`, false);
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

function validateRunnerInput(errors, runnerInput) {
  if (!isPlainObject(runnerInput)) {
    errors.push('runnerInput must be a plain object');
    return;
  }

  for (const key of Object.keys(runnerInput)) {
    if (!RUNNER_INPUT_ALLOWED_FIELDS.includes(key)) {
      errors.push(`runnerInput.${key} is not an allowed field`);
    }

    if (REJECTED_INPUT_FIELDS.includes(key)) {
      errors.push(`runnerInput.${key} is not allowed because controlled runner inputs are backend-scoped`);
    }
  }

  validateExactStringArray(errors, runnerInput.acceptedFields, 'runnerInput.acceptedFields', ALLOWED_INPUT_FIELDS);
  validateExactStringArray(errors, runnerInput.rejectedFields, 'runnerInput.rejectedFields', REJECTED_INPUT_FIELDS);
  validateExactStringArray(errors, runnerInput.requiredFields, 'runnerInput.requiredFields', REQUIRED_INPUT_FIELDS);
  validateExactStringArray(errors, runnerInput.allowedRoles, 'runnerInput.allowedRoles', RUNNER_ROLES);
  validateExactStringArray(errors, runnerInput.controlledModes, 'runnerInput.controlledModes', CONTROLLED_MODES);
  requireExact(errors, runnerInput.commandTextInputAvailable, 'runnerInput.commandTextInputAvailable', false);
  requireExact(errors, runnerInput.arbitraryProviderInputAvailable, 'runnerInput.arbitraryProviderInputAvailable', false);
  requireExact(errors, runnerInput.arbitraryPathInputAvailable, 'runnerInput.arbitraryPathInputAvailable', false);
  requireExact(errors, runnerInput.secretValueInputAvailable, 'runnerInput.secretValueInputAvailable', false);
  requireExact(errors, runnerInput.rendererCommandConstructionAvailable, 'runnerInput.rendererCommandConstructionAvailable', false);

  for (const field of runnerInput.acceptedFields ?? []) {
    if (REJECTED_INPUT_FIELDS.includes(field)) {
      errors.push(`runnerInput.acceptedFields must not include forbidden field ${field}`);
    }
  }
}

function validateCommandTemplates(errors, commandTemplates) {
  if (!Array.isArray(commandTemplates)) {
    errors.push('commandTemplates must be an array');
    return;
  }

  const expectedTemplateIds = V41_ACTIVE_PROVIDER_RUNNER_IDS.flatMap((providerId) => RUNNER_ROLES.map((role) => templateIdFor(providerId, role)));
  const templateIds = commandTemplates.map((template) => template?.templateId);

  validateExactStringArray(errors, templateIds, 'commandTemplates.templateIds', expectedTemplateIds);
  commandTemplates.forEach((template, index) => validateCommandTemplate(errors, template, `commandTemplates[${index}]`));
}

function validateCommandTemplate(errors, template, path) {
  if (!isPlainObject(template)) {
    errors.push(`${path} must be a plain object`);
    return;
  }

  for (const key of Object.keys(template)) {
    if (!TEMPLATE_ALLOWED_FIELDS.includes(key)) {
      errors.push(`${path}.${key} is not an allowed field`);
    }

    if (TEMPLATE_FORBIDDEN_FIELDS.includes(key)) {
      errors.push(`${path}.${key} is not allowed because runner templates are backend-owned`);
    }
  }

  requireSafeRef(errors, template.templateId, `${path}.templateId`);
  requireEnum(errors, template.providerId, `${path}.providerId`, V41_ACTIVE_PROVIDER_RUNNER_IDS);
  const expectedTemplate = expectedTemplateFor(template.templateId);

  if (!expectedTemplate) {
    errors.push(`${path}.templateId must be one of ${V41_ACTIVE_PROVIDER_RUNNER_IDS.flatMap((providerId) => RUNNER_ROLES.map((role) => templateIdFor(providerId, role))).join(',')}`);
  } else {
    requireExact(errors, template.providerId, `${path}.providerId`, expectedTemplate.providerId);
    validateExactStringArray(errors, template.supportedRoles, `${path}.supportedRoles`, [expectedTemplate.role]);
  }

  requireExact(errors, template.owner, `${path}.owner`, COMMAND_TEMPLATE_OWNER);
  requireExact(errors, template.commandRef, `${path}.commandRef`, COMMAND_REFS_BY_PROVIDER_ID[template.providerId]);
  if (!expectedTemplate) {
    validateRequiredFields(errors, template.supportedRoles, `${path}.supportedRoles`, RUNNER_ROLES);
  }
  validateExactStringArray(errors, template.controlledModes, `${path}.controlledModes`, CONTROLLED_MODES);
  requireExact(errors, template.argvShape, `${path}.argvShape`, 'backend-owned-template');
  requireExact(errors, template.commandTextAvailable, `${path}.commandTextAvailable`, false);
  requireExact(errors, template.rendererConstructionAvailable, `${path}.rendererConstructionAvailable`, false);
  requireExact(errors, template.shellExpansionAvailable, `${path}.shellExpansionAvailable`, false);
  requireExact(errors, template.arbitraryArgsAvailable, `${path}.arbitraryArgsAvailable`, false);
  requireExact(errors, template.arbitraryCwdAvailable, `${path}.arbitraryCwdAvailable`, false);
}

function validateRunnerOutput(errors, runnerOutput) {
  if (!isPlainObject(runnerOutput)) {
    errors.push('runnerOutput must be a plain object');
    return;
  }

  for (const key of Object.keys(runnerOutput)) {
    if (!RUNNER_OUTPUT_ALLOWED_FIELDS.includes(key)) {
      errors.push(`runnerOutput.${key} is not an allowed field because runner output must be sanitized`);
    }
  }

  validateExactStringArray(errors, runnerOutput.fields, 'runnerOutput.fields', OUTPUT_FIELDS);
  validateExactStringArray(errors, runnerOutput.statuses, 'runnerOutput.statuses', STATUSES);
  requireExact(errors, runnerOutput.rawProviderOutputAvailable, 'runnerOutput.rawProviderOutputAvailable', false);
  requireExact(errors, runnerOutput.sanitizedSummaryRequired, 'runnerOutput.sanitizedSummaryRequired', true);
  requireExact(errors, runnerOutput.redactionStatusRequired, 'runnerOutput.redactionStatusRequired', true);
  requireExact(errors, runnerOutput.artifactRefsOnly, 'runnerOutput.artifactRefsOnly', true);
}

function expectedTemplateFor(templateId) {
  for (const providerId of V41_ACTIVE_PROVIDER_RUNNER_IDS) {
    for (const role of RUNNER_ROLES) {
      if (templateId === templateIdFor(providerId, role)) {
        return { providerId, role };
      }
    }
  }

  return null;
}

function validateFailureStates(errors, failureStates) {
  if (!Array.isArray(failureStates)) {
    errors.push('failureStates must be an array');
    return;
  }

  const failureLayers = failureStates.map((state) => state?.failureLayer);
  validateExactStringArray(errors, failureLayers, 'failureStates.failureLayer', FAILURE_LAYERS);

  failureStates.forEach((state, index) => {
    const path = `failureStates[${index}]`;

    if (!isPlainObject(state)) {
      errors.push(`${path} must be a plain object`);
      return;
    }

    requireEnum(errors, state.failureLayer, `${path}.failureLayer`, FAILURE_LAYERS);
    requireEnum(errors, state.status, `${path}.status`, STATUSES);
    requireExact(errors, state.evidenceRequired, `${path}.evidenceRequired`, true);
    requireExact(errors, state.recoveryNoteRequired, `${path}.recoveryNoteRequired`, true);
  });
}

function validateBoundaries(errors, boundaries) {
  if (!isPlainObject(boundaries)) {
    errors.push('boundaries must be a plain object');
    return;
  }

  validateExactStringArray(errors, boundaries.activeProviderIds, 'boundaries.activeProviderIds', V41_ACTIVE_PROVIDER_RUNNER_IDS);
  requireExact(errors, boundaries.providerCliExecutionAvailableOnlyThroughBackendRunner, 'boundaries.providerCliExecutionAvailableOnlyThroughBackendRunner', true);
  requireExact(errors, boundaries.task2ExecutionAdapterImplemented, 'boundaries.task2ExecutionAdapterImplemented', false);
  requireExact(errors, boundaries.commandTemplateOwner, 'boundaries.commandTemplateOwner', COMMAND_TEMPLATE_OWNER);

  for (const field of [
    'rendererProviderInvocationAvailable',
    'rendererCommandConstructionAvailable',
    'rawShellCommandAvailable',
    'genericShellRunnerAvailable',
    'arbitraryCommandExecutionAvailable',
    'arbitraryPathReadAvailable',
    'arbitraryCwdAvailable',
    'promptDispatchFromRendererAvailable',
    'modelInvocationFromRendererAvailable',
    'automaticInstallAvailable',
    'automaticOauthAvailable',
    'envValueExposureAvailable',
    'secretMaterialAvailable',
    'credentialMaterialAvailable',
    'credentialFileContentsAvailable',
    'rawProviderSettingsAvailable',
    'rawProviderOutputAvailable',
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
    value.forEach((item, index) => validateNoSecretBearingFields(errors, item, `${path}[${index}]`));
    return;
  }

  if (!isPlainObject(value)) {
    if (typeof value === 'string' && SECRET_VALUE_PATTERN.test(value)) {
      errors.push(`${path || 'value'} must not contain secret-looking values`);
    }

    return;
  }

  for (const [key, entry] of Object.entries(value)) {
    const childPath = path ? `${path}.${key}` : key;

    if (SECRET_KEY_PATTERN.test(key) && !(ALLOWED_FALSE_SECRET_BOUNDARY_FIELDS.includes(key) && entry === false)) {
      errors.push(`${childPath} is not allowed because controlled runner contracts must be sanitized`);
      continue;
    }

    validateNoSecretBearingFields(errors, entry, childPath);
  }
}

function validateExactStringArray(errors, value, path, expected) {
  if (!Array.isArray(value)) {
    errors.push(`${path} must be an array`);
    return;
  }

  const actualSorted = [...value].sort();
  const expectedSorted = [...expected].sort();

  if (actualSorted.length !== expectedSorted.length || actualSorted.join(',') !== expectedSorted.join(',')) {
    errors.push(`${path} must match ${expectedSorted.join(',')}`);
  }

  for (const [index, entry] of value.entries()) {
    requireSafeRef(errors, entry, `${path}[${index}]`);
  }
}

function validateRequiredFields(errors, value, path, allowed) {
  if (!Array.isArray(value)) {
    errors.push(`${path} must be an array`);
    return;
  }

  if (value.length === 0) {
    errors.push(`${path} must not be empty`);
  }

  for (const [index, entry] of value.entries()) {
    requireSafeRef(errors, entry, `${path}[${index}]`);

    if (!allowed?.includes(entry)) {
      errors.push(`${path}[${index}] must be one of ${allowed.join(',')}`);
    }
  }
}

function requireEnum(errors, value, path, allowed) {
  if (!allowed.includes(value)) {
    errors.push(`${path} must be one of ${allowed.join(',')}`);
  }
}

function requireExact(errors, value, path, expected) {
  if (value !== expected) {
    errors.push(`${path} must be ${JSON.stringify(expected)}`);
  }
}

function requireNonEmptyString(errors, value, path) {
  if (typeof value !== 'string' || value.trim() === '') {
    errors.push(`${path} must be a non-empty string`);
  }
}

function requireSafeRef(errors, value, path) {
  if (typeof value !== 'string' || value.trim() === '') {
    errors.push(`${path} must be a non-empty string`);
    return;
  }

  if (!/^[A-Za-z0-9._:/-]+$/u.test(value)) {
    errors.push(`${path} must be a safe ref`);
  }
}

function requireIsoTimestamp(errors, value, path) {
  if (typeof value !== 'string' || Number.isNaN(Date.parse(value))) {
    errors.push(`${path} must be an ISO timestamp`);
  }
}

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}
