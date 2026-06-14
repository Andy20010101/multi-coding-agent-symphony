import {
  validateCurrentProjectBindingContract,
  validateRecentProjectsContract
} from './project-registry.js';

export const PERSONAL_WORKBENCH_SETTINGS_CONTRACT_NAME = 'personalWorkbenchSettings.v1';
export const PERSONAL_WORKBENCH_SETTINGS_CONTRACT_VERSION = 1;

export const PERSONAL_WORKBENCH_SETTINGS_BOUNDARIES = Object.freeze({
  readOnly: true,
  willMutate: false,
  settingsWriteAvailable: false,
  secretStorageAvailable: false,
  rawProviderPathStorageAvailable: false,
  rawTranscriptStorageAvailable: false,
  frontendFilesystemScanAvailable: false,
  rendererArbitraryPathInputAvailable: false,
  rendererArbitraryPathReadAvailable: false,
  rendererCommandExecutionAvailable: false,
  providerLaunchAvailable: false,
  goalCreationAvailable: false,
  goalMutationAvailable: false,
  worktreeCreationAvailable: false,
  gitWriteAvailable: false,
  releaseWriteAvailable: false
});

const TOP_LEVEL_ALLOWED_FIELDS = new Set([
  'contractName',
  'contractVersion',
  'generatedAt',
  'state',
  'settingsSource',
  'preferences',
  'currentProjectBinding',
  'recentProjects',
  'recoveryActions',
  'safety',
  'blockedReasons',
  'boundaries',
  'readOnly',
  'willMutate'
]);
const SETTINGS_SOURCE_ALLOWED_FIELDS = new Set([
  'kind',
  'state',
  'ref',
  'sourceContract',
  'generatedAt',
  'readOnly',
  'writePolicy'
]);
const PREFERENCES_ALLOWED_FIELDS = new Set([
  'preferredProviders',
  'defaultPort',
  'runtimeDirRef',
  'uiLanguage',
  'displayDensity'
]);
const RECOVERY_ACTION_ALLOWED_FIELDS = new Set([
  'id',
  'label',
  'state',
  'mode',
  'endpointId',
  'copyOnly',
  'willMutate',
  'reason'
]);
const SAFETY_ALLOWED_FIELDS = new Set([
  'storesSecrets',
  'storesRawProviderPaths',
  'storesRawTranscripts',
  'storesRawModelOutput',
  'frontendReadsLocalJsonl',
  'frontendReadsProviderFolders',
  'rendererAcceptsArbitraryPath',
  'rendererReadsArbitraryPath',
  'rendererRunsCommands',
  'createsGoalsAutomatically',
  'createsWorktreesAutomatically',
  'mutatesGitOrReleases'
]);

const CONTRACT_STATE_SET = new Set(['ready', 'missing', 'stale', 'blocked']);
const SETTINGS_SOURCE_KIND_SET = new Set(['managed-local-settings', 'defaults', 'fixture', 'unavailable']);
const SETTINGS_SOURCE_STATE_SET = new Set(['ready', 'missing', 'stale', 'unavailable']);
const PROVIDER_SET = new Set(['codex-cli', 'claude-code-cli']);
const UI_LANGUAGE_SET = new Set(['zh-CN', 'en-US']);
const DISPLAY_DENSITY_SET = new Set(['compact', 'comfortable']);
const RECOVERY_STATE_SET = new Set(['available', 'disabled', 'manual-required']);
const RECOVERY_MODE_SET = new Set(['refresh', 'select-known-project', 'open-settings-doc', 'manual-controller']);
const SAFE_TOKEN_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]*$/u;
const SAFE_PROJECT_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._-]*$/u;
const UNSAFE_FIELD_NAME_PATTERN =
  /^(?:secret|token|apiKey|apikey|password|credential|rawTranscript|transcript|rawModelOutput|rawOutput|providerOutput|providerPayload|sessionPath|sessionLog|commandLine|shellCommand|pathInput|projectPathInput)$/iu;
const UNSAFE_TEXT_PATTERN =
  /(?:^|[/.])(?:\.codex|\.claude|\.git|\.symphony)(?:[/]|$)|\/Users\/|\.jsonl(?:$|[/\s])|\b(?:sk-[A-Za-z0-9_-]{8,}|api[_-]?key|secret|credential|password|raw[\s_-]*(?:transcript|model[\s_-]*output)|provider[\s_-]*(?:payload|output|session|path)|session[\s_-]*(?:file|path|log)|shell\s+command|terminal|full\s+disk\s+scan|arbitrary\s+path)\b/iu;

export class PersonalWorkbenchSettingsContractError extends Error {
  constructor(code, message, details = {}) {
    super(message);
    this.name = 'PersonalWorkbenchSettingsContractError';
    this.code = code;
    this.details = details;
  }
}

export function buildPersonalWorkbenchSettings({
  generatedAt = new Date().toISOString(),
  settingsSource = null,
  preferences = null,
  currentProjectBinding = null,
  recentProjects = null,
  recoveryActions = [],
  safety = null,
  blockedReasons: inputBlockedReasons = []
} = {}) {
  const unsafeSourceField = findUnsafeFields({
    settingsSource,
    preferences,
    currentProjectBinding,
    recentProjects,
    recoveryActions,
    safety,
    inputBlockedReasons
  }, 'source')[0];

  if (unsafeSourceField !== undefined) {
    throw new PersonalWorkbenchSettingsContractError(
      'unsafe-personal-workbench-settings-source',
      'Personal Workbench settings source contains secrets, raw provider/session refs, arbitrary paths, or command material.',
      { reason: `${unsafeSourceField} must not contain secrets, raw provider/session refs, arbitrary paths, or command material` }
    );
  }

  const normalizedSettingsSource = settingsSourceFrom(settingsSource, generatedAt);
  const normalizedPreferences = preferencesFrom(preferences);
  const normalizedRecoveryActions = recoveryActionsFrom(recoveryActions);
  const normalizedSafety = safetyFrom(safety);
  const blockedReasons = uniqueStrings([
    ...safeStringArray(inputBlockedReasons),
    ...derivePersonalWorkbenchSettingsBlockedReasons({
      settingsSource: normalizedSettingsSource,
      currentProjectBinding,
      recentProjects,
      safety: normalizedSafety
    })
  ]);

  return assertPersonalWorkbenchSettingsContract({
    contractName: PERSONAL_WORKBENCH_SETTINGS_CONTRACT_NAME,
    contractVersion: PERSONAL_WORKBENCH_SETTINGS_CONTRACT_VERSION,
    generatedAt: new Date(millisOrNow(generatedAt)).toISOString(),
    state: stateFromBlockedReasons(blockedReasons, normalizedSettingsSource, currentProjectBinding),
    settingsSource: normalizedSettingsSource,
    preferences: normalizedPreferences,
    currentProjectBinding: currentProjectBinding ?? unavailableCurrentProjectBinding(generatedAt),
    recentProjects: recentProjects ?? unavailableRecentProjects(generatedAt),
    recoveryActions: normalizedRecoveryActions,
    safety: normalizedSafety,
    blockedReasons,
    boundaries: cloneObject(PERSONAL_WORKBENCH_SETTINGS_BOUNDARIES),
    readOnly: true,
    willMutate: false
  });
}

export function derivePersonalWorkbenchSettingsBlockedReasons({
  settingsSource,
  currentProjectBinding,
  recentProjects,
  safety
} = {}) {
  const reasons = [];

  if (settingsSource?.state === 'missing' || settingsSource?.state === 'unavailable') {
    reasons.push('local-settings-unavailable');
  }

  if (settingsSource?.state === 'stale') {
    reasons.push('local-settings-stale');
  }

  if (currentProjectBinding?.state !== undefined && currentProjectBinding.state !== 'bound') {
    reasons.push(`current-project-binding-${currentProjectBinding.state}`);
  }

  if (recentProjects?.state !== undefined && ['missing', 'failed'].includes(recentProjects.state)) {
    reasons.push(`recent-projects-${recentProjects.state}`);
  }

  if (recentProjects?.state === 'stale') {
    reasons.push('recent-projects-stale');
  }

  for (const [field, value] of Object.entries(safety ?? {})) {
    if (value === true) {
      reasons.push(`safety-${kebabCase(field)}`);
    }
  }

  return uniqueStrings(reasons);
}

export function validatePersonalWorkbenchSettingsContract(contract) {
  const errors = [];

  if (!isPlainObject(contract)) {
    return { ok: false, errors: ['contract must be a plain object'] };
  }

  rejectExtraFields(errors, 'contract', contract, TOP_LEVEL_ALLOWED_FIELDS);
  requireExact(errors, contract.contractName, 'contractName', PERSONAL_WORKBENCH_SETTINGS_CONTRACT_NAME);
  requireExact(errors, contract.contractVersion, 'contractVersion', PERSONAL_WORKBENCH_SETTINGS_CONTRACT_VERSION);
  requireIsoTimestamp(errors, contract.generatedAt, 'generatedAt');
  requireEnum(errors, contract.state, 'state', CONTRACT_STATE_SET);
  validateSettingsSource(errors, contract.settingsSource);
  validatePreferences(errors, contract.preferences);
  validateNestedCurrentProjectBinding(errors, contract.currentProjectBinding);
  validateNestedRecentProjects(errors, contract.recentProjects);
  validateRecoveryActions(errors, contract.recoveryActions);
  validateSafety(errors, contract.safety);
  validateBlockedReasons(errors, contract.blockedReasons);
  validateBoundaries(errors, contract.boundaries);
  requireExact(errors, contract.readOnly, 'readOnly', true);
  requireExact(errors, contract.willMutate, 'willMutate', false);

  for (const unsafeField of findUnsafeFields(contract, 'contract')) {
    errors.push(`${unsafeField} must not contain secrets, raw provider/session refs, arbitrary paths, or command material`);
  }

  return { ok: errors.length === 0, errors };
}

export function assertPersonalWorkbenchSettingsContract(contract) {
  const result = validatePersonalWorkbenchSettingsContract(contract);

  if (!result.ok) {
    throw new PersonalWorkbenchSettingsContractError(
      'invalid-personal-workbench-settings-contract',
      `Invalid Personal Workbench settings contract: ${result.errors.join('; ')}`,
      { errors: result.errors }
    );
  }

  return contract;
}

function settingsSourceFrom(source, generatedAt) {
  if (!isPlainObject(source)) {
    return {
      kind: 'defaults',
      state: 'ready',
      ref: 'built-in:first-run-defaults',
      sourceContract: null,
      generatedAt: new Date(millisOrNow(generatedAt)).toISOString(),
      readOnly: true,
      writePolicy: 'manual-controller-or-preview-confirm-only'
    };
  }

  return {
    kind: nonEmptyString(source.kind) ?? 'managed-local-settings',
    state: nonEmptyString(source.state) ?? 'ready',
    ref: nonEmptyString(source.ref),
    sourceContract: nonEmptyString(source.sourceContract),
    generatedAt: source.generatedAt ?? generatedAt,
    readOnly: source.readOnly !== false,
    writePolicy: nonEmptyString(source.writePolicy) ?? 'manual-controller-or-preview-confirm-only'
  };
}

function preferencesFrom(preferences) {
  const source = isPlainObject(preferences) ? preferences : {};

  return {
    preferredProviders: normalizeProviders(source.preferredProviders),
    defaultPort: Number.isInteger(source.defaultPort) ? source.defaultPort : 1420,
    runtimeDirRef: nonEmptyString(source.runtimeDirRef) ?? 'managed-state-dir',
    uiLanguage: nonEmptyString(source.uiLanguage) ?? 'zh-CN',
    displayDensity: nonEmptyString(source.displayDensity) ?? 'compact'
  };
}

function recoveryActionsFrom(actions) {
  if (!Array.isArray(actions)) {
    return [];
  }

  return actions.map((action) => ({
    id: nonEmptyString(action?.id) ?? 'manual-recover',
    label: nonEmptyString(action?.label) ?? 'Recover manually',
    state: nonEmptyString(action?.state) ?? 'manual-required',
    mode: nonEmptyString(action?.mode) ?? 'manual-controller',
    endpointId: nonEmptyString(action?.endpointId),
    copyOnly: action?.copyOnly !== false,
    willMutate: action?.willMutate === true,
    reason: nonEmptyString(action?.reason)
  }));
}

function safetyFrom(safety) {
  const source = isPlainObject(safety) ? safety : {};

  return {
    storesSecrets: source.storesSecrets === true,
    storesRawProviderPaths: source.storesRawProviderPaths === true,
    storesRawTranscripts: source.storesRawTranscripts === true,
    storesRawModelOutput: source.storesRawModelOutput === true,
    frontendReadsLocalJsonl: source.frontendReadsLocalJsonl === true,
    frontendReadsProviderFolders: source.frontendReadsProviderFolders === true,
    rendererAcceptsArbitraryPath: source.rendererAcceptsArbitraryPath === true,
    rendererReadsArbitraryPath: source.rendererReadsArbitraryPath === true,
    rendererRunsCommands: source.rendererRunsCommands === true,
    createsGoalsAutomatically: source.createsGoalsAutomatically === true,
    createsWorktreesAutomatically: source.createsWorktreesAutomatically === true,
    mutatesGitOrReleases: source.mutatesGitOrReleases === true
  };
}

function unavailableCurrentProjectBinding(generatedAt) {
  return {
    contractName: 'current-project-binding.v1',
    contractVersion: 1,
    generatedAt: new Date(millisOrNow(generatedAt)).toISOString(),
    state: 'missing',
    selectedProjectId: null,
    selectedProjectName: null,
    repoPath: null,
    defaultBranch: null,
    lastGoalId: null,
    lastRunId: null,
    healthStatus: null,
    bindingSource: 'backend default',
    persisted: false,
    selectionUpdatedAt: null,
    fallbackReason: 'project registry unavailable',
    routeState: 'missing',
    readOnly: true,
    selectionControl: {
      state: 'disabled',
      endpointId: '/api/projects/current-binding/select',
      disabledReason: 'project registry unavailable'
    },
    sourcePolicy: 'backend-known project id only; no frontend path input',
    boundaries: {
      selectionOnly: true,
      acceptsProjectIdOnly: true,
      arbitraryPathSubmissionAvailable: false,
      frontendFilesystemScanAvailable: false,
      frontendArbitraryPathReadAvailable: false,
      commandExecutionAvailable: false,
      providerLaunchAvailable: false,
      goalMutationAvailable: false,
      childDispatchAvailable: false,
      jobExecutionAvailable: false,
      gitWriteAvailable: false,
      releaseWriteAvailable: false,
      rawTranscriptReadAvailable: false
    }
  };
}

function unavailableRecentProjects(generatedAt) {
  return {
    contractName: 'recent-projects.v1',
    contractVersion: 1,
    generatedAt: new Date(millisOrNow(generatedAt)).toISOString(),
    state: 'missing',
    source: {
      kind: 'unavailable',
      scanScope: 'known-projects-only',
      sourceContract: null,
      generatedAt: null,
      degradedReason: 'project registry unavailable'
    },
    readOnly: true,
    items: [],
    boundaries: {
      readOnly: true,
      diskScanAvailable: false,
      scanScope: 'known-projects-only',
      arbitraryPathReadAvailable: false,
      commandExecutionAvailable: false,
      modelInvocationAvailable: false,
      gitWriteAvailable: false,
      releaseWriteAvailable: false
    }
  };
}

function stateFromBlockedReasons(blockedReasons, settingsSource, currentProjectBinding) {
  if (blockedReasons.length === 0) {
    return 'ready';
  }

  if (settingsSource.state === 'missing' || settingsSource.state === 'unavailable' || currentProjectBinding?.state === 'missing') {
    return 'missing';
  }

  if (settingsSource.state === 'stale' || currentProjectBinding?.state === 'stale') {
    return 'stale';
  }

  return 'blocked';
}

function validateSettingsSource(errors, source) {
  if (!isPlainObject(source)) {
    errors.push('settingsSource must be a plain object');
    return;
  }

  rejectExtraFields(errors, 'settingsSource', source, SETTINGS_SOURCE_ALLOWED_FIELDS);
  requireEnum(errors, source.kind, 'settingsSource.kind', SETTINGS_SOURCE_KIND_SET);
  requireEnum(errors, source.state, 'settingsSource.state', SETTINGS_SOURCE_STATE_SET);

  if (source.ref !== null) {
    requireSafeRef(errors, source.ref, 'settingsSource.ref');
  }

  if (source.sourceContract !== null) {
    requireSafeRef(errors, source.sourceContract, 'settingsSource.sourceContract');
  }

  if (source.generatedAt !== null) {
    requireIsoTimestamp(errors, source.generatedAt, 'settingsSource.generatedAt');
  }

  requireExact(errors, source.readOnly, 'settingsSource.readOnly', true);
  requireExact(errors, source.writePolicy, 'settingsSource.writePolicy', 'manual-controller-or-preview-confirm-only');
}

function validatePreferences(errors, preferences) {
  if (!isPlainObject(preferences)) {
    errors.push('preferences must be a plain object');
    return;
  }

  rejectExtraFields(errors, 'preferences', preferences, PREFERENCES_ALLOWED_FIELDS);

  if (!Array.isArray(preferences.preferredProviders) || preferences.preferredProviders.length === 0) {
    errors.push('preferences.preferredProviders must be a non-empty array');
  } else {
    preferences.preferredProviders.forEach((provider, index) => {
      requireEnum(errors, provider, `preferences.preferredProviders[${index}]`, PROVIDER_SET);
    });
  }

  if (!Number.isInteger(preferences.defaultPort) || preferences.defaultPort < 1024 || preferences.defaultPort > 65535) {
    errors.push('preferences.defaultPort must be an integer between 1024 and 65535');
  }

  requireSafeRef(errors, preferences.runtimeDirRef, 'preferences.runtimeDirRef');
  requireEnum(errors, preferences.uiLanguage, 'preferences.uiLanguage', UI_LANGUAGE_SET);
  requireEnum(errors, preferences.displayDensity, 'preferences.displayDensity', DISPLAY_DENSITY_SET);
}

function validateNestedCurrentProjectBinding(errors, binding) {
  const result = validateCurrentProjectBindingContract(binding);

  errors.push(...result.errors.map((error) => `currentProjectBinding.${error}`));

  if (binding?.selectedProjectId !== null && binding?.selectedProjectId !== undefined) {
    requireSafeProjectId(errors, binding.selectedProjectId, 'currentProjectBinding.selectedProjectId');
  }
}

function validateNestedRecentProjects(errors, recentProjects) {
  const result = validateRecentProjectsContract(recentProjects);

  errors.push(...result.errors.map((error) => `recentProjects.${error}`));

  if (Array.isArray(recentProjects?.items)) {
    recentProjects.items.forEach((item, index) => {
      requireSafeProjectId(errors, item?.projectId, `recentProjects.items[${index}].projectId`);
    });
  }
}

function validateRecoveryActions(errors, actions) {
  if (!Array.isArray(actions)) {
    errors.push('recoveryActions must be an array');
    return;
  }

  actions.forEach((action, index) => {
    const path = `recoveryActions[${index}]`;

    if (!isPlainObject(action)) {
      errors.push(`${path} must be a plain object`);
      return;
    }

    rejectExtraFields(errors, path, action, RECOVERY_ACTION_ALLOWED_FIELDS);
    requireSafeRef(errors, action.id, `${path}.id`);
    requireNonEmptyString(errors, action.label, `${path}.label`);
    requireEnum(errors, action.state, `${path}.state`, RECOVERY_STATE_SET);
    requireEnum(errors, action.mode, `${path}.mode`, RECOVERY_MODE_SET);

    if (action.endpointId !== null) {
      requireSafeEndpointId(errors, action.endpointId, `${path}.endpointId`);
    }

    requireExact(errors, action.copyOnly, `${path}.copyOnly`, true);
    requireExact(errors, action.willMutate, `${path}.willMutate`, false);

    if (action.reason !== null) {
      requireNonEmptyString(errors, action.reason, `${path}.reason`);
    }
  });
}

function validateSafety(errors, safety) {
  if (!isPlainObject(safety)) {
    errors.push('safety must be a plain object');
    return;
  }

  rejectExtraFields(errors, 'safety', safety, SAFETY_ALLOWED_FIELDS);

  for (const field of SAFETY_ALLOWED_FIELDS) {
    requireExact(errors, safety[field], `safety.${field}`, false);
  }
}

function validateBlockedReasons(errors, blockedReasons) {
  if (!Array.isArray(blockedReasons)) {
    errors.push('blockedReasons must be an array');
    return;
  }

  blockedReasons.forEach((reason, index) => {
    requireSafeRef(errors, reason, `blockedReasons[${index}]`);
  });
}

function validateBoundaries(errors, boundaries) {
  if (!isPlainObject(boundaries)) {
    errors.push('boundaries must be a plain object');
    return;
  }

  for (const [field, expected] of Object.entries(PERSONAL_WORKBENCH_SETTINGS_BOUNDARIES)) {
    requireExact(errors, boundaries[field], `boundaries.${field}`, expected);
  }
}

function rejectExtraFields(errors, path, object, allowedFields) {
  for (const field of Object.keys(object)) {
    if (!allowedFields.has(field)) {
      errors.push(`${path}.${field} is not allowed`);
    }
  }
}

function findUnsafeFields(value, path) {
  const results = [];

  visitUnsafeFields(value, path, results);

  return results;
}

function visitUnsafeFields(value, path, results) {
  if (Array.isArray(value)) {
    value.forEach((item, index) => visitUnsafeFields(item, `${path}[${index}]`, results));
    return;
  }

  if (isPlainObject(value)) {
    for (const [field, nested] of Object.entries(value)) {
      const nestedPath = `${path}.${field}`;

      if (UNSAFE_FIELD_NAME_PATTERN.test(field)) {
        results.push(nestedPath);
      }

      visitUnsafeFields(nested, nestedPath, results);
    }
    return;
  }

  if (typeof value === 'string' && UNSAFE_TEXT_PATTERN.test(value)) {
    results.push(path);
  }
}

function normalizeProviders(providers) {
  if (!Array.isArray(providers) || providers.length === 0) {
    return ['codex-cli', 'claude-code-cli'];
  }

  return uniqueStrings(providers.filter((provider) => typeof provider === 'string'));
}

function requireExact(errors, value, path, expected) {
  if (value !== expected) {
    errors.push(`${path} must be ${String(expected)}`);
  }
}

function requireEnum(errors, value, path, values) {
  if (!values.has(value)) {
    errors.push(`${path} must be one of ${[...values].join(', ')}`);
  }
}

function requireNonEmptyString(errors, value, path) {
  if (typeof value !== 'string' || value.trim() === '') {
    errors.push(`${path} must be a non-empty string`);
  }
}

function requireIsoTimestamp(errors, value, path) {
  requireNonEmptyString(errors, value, path);

  if (typeof value === 'string' && Number.isNaN(Date.parse(value))) {
    errors.push(`${path} must be an ISO timestamp`);
  }
}

function requireSafeRef(errors, value, path) {
  requireNonEmptyString(errors, value, path);

  if (typeof value === 'string' && !SAFE_TOKEN_PATTERN.test(value)) {
    errors.push(`${path} must be a safe settings ref token`);
  }
}

function requireSafeProjectId(errors, value, path) {
  requireNonEmptyString(errors, value, path);

  if (typeof value === 'string' && !SAFE_PROJECT_ID_PATTERN.test(value)) {
    errors.push(`${path} must be a backend-known project id token`);
  }
}

function requireSafeEndpointId(errors, value, path) {
  requireNonEmptyString(errors, value, path);

  if (typeof value === 'string' && (!value.startsWith('/api/') || value.includes('?') || value.includes('..'))) {
    errors.push(`${path} must be a fixed backend endpoint id without query parameters`);
  }
}

function safeStringArray(values) {
  if (!Array.isArray(values)) {
    return [];
  }

  return values.filter((value) => typeof value === 'string' && value.trim() !== '');
}

function uniqueStrings(values) {
  return [...new Set(safeStringArray(values))];
}

function nonEmptyString(value) {
  return typeof value === 'string' && value.trim() !== '' ? value : null;
}

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function cloneObject(value) {
  return JSON.parse(JSON.stringify(value));
}

function millisOrNow(value) {
  const millis = Date.parse(value);

  return Number.isNaN(millis) ? Date.now() : millis;
}

function kebabCase(value) {
  return value.replace(/[A-Z]/gu, (letter) => `-${letter.toLowerCase()}`);
}
