import {
  buildAgentCliProviderHealthContract
} from './agent-cli-provider-health.js';

export const PROVIDER_READINESS_CONTRACT_NAME = 'providerReadiness.v1';
export const PROVIDER_READINESS_CONTRACT_VERSION = 1;

export const ACTIVE_PROVIDER_IDS = Object.freeze(['codex-cli', 'claude-code-cli']);

export const PROVIDER_READINESS_BOUNDARIES = Object.freeze({
  readOnly: true,
  willMutate: false,
  codexWorkerCandidateOnly: true,
  claudeCodeReviewerCandidateOnly: true,
  kiroActiveProviderAvailable: false,
  deepSeekIndependentProviderAvailable: false,
  genericProviderPickerAvailable: false,
  rawProviderCliLauncherAvailable: false,
  providerExecutionFromReadinessAvailable: false,
  genericShellAvailable: false,
  genericTerminalAvailable: false,
  rendererCommandExecutionAvailable: false,
  frontendLocalJsonlReadAvailable: false,
  frontendLocalSessionReadAvailable: false,
  frontendProviderFolderReadAvailable: false,
  rawTranscriptExposureAvailable: false,
  rawStdoutExposureAvailable: false,
  rawStderrExposureAvailable: false,
  rawModelOutputExposureAvailable: false,
  secretValueExposureAvailable: false,
  directGoalEventAppendAvailable: false,
  directTaskCompletionAvailable: false,
  automaticSelfReviewAvailable: false,
  automaticWorktreeCreationAvailable: false,
  automaticNextVersionGoalAvailable: false,
  gitMergeAvailable: false,
  gitPushAvailable: false,
  gitTagAvailable: false,
  githubReleaseAutomationAvailable: false,
  publicDistributionClaimAvailable: false,
  notarizationClaimAvailable: false,
  autoUpdateClaimAvailable: false
});

const TOP_LEVEL_ALLOWED_FIELDS = new Set([
  'contractName',
  'contractVersion',
  'generatedAt',
  'state',
  'currentProject',
  'activeProviders',
  'historicalProviders',
  'unsupportedProviders',
  'operatorRole',
  'evidencePolicy',
  'safety',
  'blockedReasons',
  'boundaries',
  'readOnly',
  'willMutate'
]);
const CURRENT_PROJECT_ALLOWED_FIELDS = new Set(['state', 'projectId', 'displayName', 'sourceContract', 'sourceRef']);
const ACTIVE_PROVIDER_ALLOWED_FIELDS = new Set([
  'providerId',
  'label',
  'role',
  'lane',
  'status',
  'binaryPresence',
  'modelProfile',
  'helpSmoke',
  'optionalRealSmoke',
  'configuration',
  'blockedReasons',
  'sourceRefs',
  'readOnly',
  'willMutate'
]);
const CHECK_ALLOWED_FIELDS = new Set(['state', 'checked', 'evidenceRef', 'reason']);
const CONFIGURATION_ALLOWED_FIELDS = new Set([
  'kind',
  'state',
  'deepSeekConfigStatus',
  'deepSeekAsIndependentProvider',
  'storesSecrets',
  'secretValuesExposed',
  'notes'
]);
const HISTORICAL_PROVIDER_ALLOWED_FIELDS = new Set([
  'providerId',
  'label',
  'status',
  'activeWorkbenchProvider',
  'reason',
  'sourceRef'
]);
const UNSUPPORTED_PROVIDER_ALLOWED_FIELDS = new Set([
  'providerId',
  'claim',
  'status',
  'activeWorkbenchProvider',
  'blockedReasons'
]);
const OPERATOR_ROLE_ALLOWED_FIELDS = new Set([
  'providerId',
  'role',
  'state',
  'responsibilities',
  'willMutateInProduct',
  'sourceRef'
]);
const EVIDENCE_POLICY_ALLOWED_FIELDS = new Set([
  'sanitizedReadinessOnly',
  'rawStdoutAllowed',
  'rawStderrAllowed',
  'rawProviderOutputAllowed',
  'rawTranscriptAllowed',
  'localSessionPathAllowed',
  'secretValueAllowed',
  'notes'
]);
const SAFETY_ALLOWED_FIELDS = new Set([
  'storesSecrets',
  'storesRawProviderPaths',
  'storesRawTranscripts',
  'storesRawStdout',
  'storesRawStderr',
  'storesRawModelOutput',
  'frontendReadsLocalJsonl',
  'frontendReadsProviderFolders',
  'rendererRunsCommands',
  'providerLaunchAvailable',
  'createsGoalsAutomatically',
  'createsWorktreesAutomatically',
  'mutatesGitOrReleases'
]);

const CONTRACT_STATE_SET = new Set(['ready', 'missing', 'blocked', 'degraded']);
const PROJECT_STATE_SET = new Set(['bound', 'missing', 'stale', 'unknown']);
const PROVIDER_STATUS_SET = new Set(['ready', 'missing', 'blocked', 'degraded']);
const PROVIDER_ROLE_SET = new Set(['worker', 'reviewer']);
const PROVIDER_LANE_SET = new Set(['codex-worker-candidate', 'claude-code-reviewer-candidate']);
const CHECK_STATE_SET = new Set(['present', 'missing', 'unknown', 'passed', 'failed', 'not-run', 'configured', 'not-configured', 'mismatch']);
const CONFIGURATION_KIND_SET = new Set(['codex-cli', 'claude-code-provider-config']);
const CONFIGURATION_STATE_SET = new Set(['present', 'missing', 'mismatch', 'not-required']);
const DEEPSEEK_CONFIG_STATE_SET = new Set(['present', 'missing', 'mismatch', 'not-required']);
const HISTORICAL_PROVIDER_STATUS_SET = new Set(['historical']);
const UNSUPPORTED_PROVIDER_STATUS_SET = new Set(['blocked']);
const OPERATOR_STATE_SET = new Set(['manual-controller']);
const SAFE_REF_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:/#-]*$/u;
const UNSAFE_FIELD_NAME_PATTERN =
  /^(?:secret|token|apiKey|apikey|password|credential|rawTranscript|transcript|rawModelOutput|rawOutput|rawStdout|rawStderr|stdout|stderr|providerOutput|providerPayload|sessionPath|sessionLog|commandLine|shellCommand|localPath)$/iu;
const UNSAFE_TEXT_PATTERN =
  /(?:^|[/.])(?:\.codex|\.claude|\.git|\.symphony)(?:[/]|$)|\/Users\/|\.jsonl(?:$|[/\s])|\b(?:sk-[A-Za-z0-9_-]{8,}|api[_-]?key|secret|credential|password|raw[\s_-]*(?:transcript|stdout|stderr|model[\s_-]*output)|provider[\s_-]*(?:payload|output|session|path)|session[\s_-]*(?:file|path|log)|generic\s+(?:shell|terminal)|arbitrary\s+command|renderer\s+command|git\s+(?:merge|push|tag)|gh\s+release|github\s+release|public\s+distribution|notarization|auto-update)\b/iu;

export class ProviderReadinessContractError extends Error {
  constructor(code, message, details = {}) {
    super(message);
    this.name = 'ProviderReadinessContractError';
    this.code = code;
    this.details = details;
  }
}

export function buildProviderReadiness({
  generatedAt = new Date().toISOString(),
  currentProject = null,
  activeProviders = null,
  historicalProviders = null,
  unsupportedProviders = null,
  operatorRole = null,
  evidencePolicy = null,
  safety = null,
  blockedReasons: inputBlockedReasons = []
} = {}) {
  const unsafeSourceField = findUnsafeFields({
    currentProject,
    activeProviders,
    historicalProviders,
    unsupportedProviders,
    operatorRole,
    evidencePolicy,
    safety,
    blockedReasons: inputBlockedReasons
  }, 'source')[0];

  if (unsafeSourceField !== undefined) {
    throw new ProviderReadinessContractError(
      'unsafe-provider-readiness-source',
      'Provider readiness source contains secrets, raw provider output, local session refs, or command material.',
      { reason: `${unsafeSourceField} must not contain secrets, raw provider output, local session refs, or command material` }
    );
  }

  const normalizedActiveProviders = normalizeActiveProviders(activeProviders);
  const normalizedHistoricalProviders = normalizeHistoricalProviders(historicalProviders);
  const normalizedUnsupportedProviders = normalizeUnsupportedProviders(unsupportedProviders);
  const normalizedEvidencePolicy = normalizeEvidencePolicy(evidencePolicy);
  const normalizedSafety = normalizeSafety(safety);
  const blockedReasons = uniqueStrings([
    ...safeStringArray(inputBlockedReasons),
    ...deriveProviderReadinessBlockedReasons({
      activeProviders: normalizedActiveProviders,
      historicalProviders: normalizedHistoricalProviders,
      unsupportedProviders: normalizedUnsupportedProviders,
      evidencePolicy: normalizedEvidencePolicy,
      safety: normalizedSafety
    })
  ]);

  return assertProviderReadinessContract({
    contractName: PROVIDER_READINESS_CONTRACT_NAME,
    contractVersion: PROVIDER_READINESS_CONTRACT_VERSION,
    generatedAt: new Date(millisOrNow(generatedAt)).toISOString(),
    state: stateFromBlockedReasons(blockedReasons, normalizedActiveProviders),
    currentProject: normalizeCurrentProject(currentProject),
    activeProviders: normalizedActiveProviders,
    historicalProviders: normalizedHistoricalProviders,
    unsupportedProviders: normalizedUnsupportedProviders,
    operatorRole: normalizeOperatorRole(operatorRole),
    evidencePolicy: normalizedEvidencePolicy,
    safety: normalizedSafety,
    blockedReasons,
    boundaries: cloneObject(PROVIDER_READINESS_BOUNDARIES),
    readOnly: true,
    willMutate: false
  });
}

export function buildProviderReadinessProjection({
  generatedAt = new Date().toISOString(),
  env = process.env,
  providerHealth = null,
  currentProject = null
} = {}) {
  const health = providerHealth ?? buildAgentCliProviderHealthContract({
    goalId: 'v65-provider-readiness-codex-claude-only',
    taskId: 'task-2',
    generatedAt,
    env
  });
  const providersById = new Map(
    (Array.isArray(health.providers) ? health.providers : [])
      .map((provider) => [provider?.providerId, provider])
  );

  return buildProviderReadiness({
    generatedAt,
    currentProject,
    activeProviders: ACTIVE_PROVIDER_IDS.map((providerId) => providerReadinessFromHealth({
      providerId,
      provider: providersById.get(providerId),
      env
    })),
    historicalProviders: [{
      providerId: 'kiro-cli',
      label: 'Kiro CLI',
      status: 'historical',
      activeWorkbenchProvider: false,
      reason: 'Historical compatibility and smoke script path only.',
      sourceRef: 'docs/provider-boundary-guide.md'
    }],
    unsupportedProviders: [{
      providerId: 'deepseek-cli',
      claim: 'independent-workbench-provider',
      status: 'blocked',
      activeWorkbenchProvider: false,
      blockedReasons: ['deepseek-is-claude-code-provider-config-only']
    }, {
      providerId: 'gemini-cli',
      claim: 'active-workbench-provider',
      status: 'blocked',
      activeWorkbenchProvider: false,
      blockedReasons: ['unsupported-provider-active-claim-gemini-cli']
    }],
    operatorRole: {
      state: 'manual-controller',
      responsibilities: ['main-verification', 'release-controller'],
      willMutateInProduct: false,
      sourceRef: 'docs/plans/v65-provider-readiness-codex-claude-only-runbook-2026-06-14.md'
    },
    evidencePolicy: {
      sanitizedReadinessOnly: true,
      rawStdoutAllowed: false,
      rawStderrAllowed: false,
      rawProviderOutputAllowed: false,
      rawTranscriptAllowed: false,
      localSessionPathAllowed: false,
      secretValueAllowed: false,
      notes: ['Readiness projects sanitized status and evidence refs only.']
    }
  });
}

export function deriveProviderReadinessBlockedReasons({
  activeProviders,
  historicalProviders,
  unsupportedProviders,
  evidencePolicy,
  safety
} = {}) {
  const reasons = [];
  const providers = Array.isArray(activeProviders) ? activeProviders : [];
  const providerIds = new Set(providers.map((provider) => provider?.providerId));

  for (const requiredProviderId of ACTIVE_PROVIDER_IDS) {
    if (!providerIds.has(requiredProviderId)) {
      reasons.push(`active-provider-missing-${requiredProviderId}`);
    }
  }

  providers.forEach((provider) => {
    if (!ACTIVE_PROVIDER_IDS.includes(provider?.providerId)) {
      reasons.push(`unsupported-active-provider-${safeReasonToken(provider?.providerId)}`);
      return;
    }

    if (provider.providerId === 'codex-cli') {
      if (provider.role !== 'worker') {
        reasons.push('codex-cli-role-mismatch');
      }
      if (provider.lane !== 'codex-worker-candidate') {
        reasons.push('codex-cli-lane-mismatch');
      }
    }

    if (provider.providerId === 'claude-code-cli') {
      if (provider.role !== 'reviewer') {
        reasons.push('claude-code-cli-role-mismatch');
      }
      if (provider.lane !== 'claude-code-reviewer-candidate') {
        reasons.push('claude-code-cli-lane-mismatch');
      }
    }

    if (provider.status !== 'ready') {
      reasons.push(`${provider.providerId}-${safeReasonToken(provider.status)}`);
    }

    if (provider.binaryPresence?.state !== 'present') {
      reasons.push(`${provider.providerId}-binary-${safeReasonToken(provider.binaryPresence?.state)}`);
    }

    if (provider.modelProfile?.state !== 'present') {
      reasons.push(`${provider.providerId}-model-profile-${safeReasonToken(provider.modelProfile?.state)}`);
    }

    if (provider.helpSmoke?.state !== 'passed') {
      reasons.push(`${provider.providerId}-help-smoke-${safeReasonToken(provider.helpSmoke?.state)}`);
    }

    if (provider.configuration?.state !== 'present' && provider.configuration?.state !== 'not-required') {
      reasons.push(`${provider.providerId}-configuration-${safeReasonToken(provider.configuration?.state)}`);
    }

    if (provider.configuration?.deepSeekAsIndependentProvider === true) {
      reasons.push('deepseek-independent-provider-claim');
    }

    if (
      provider.providerId === 'claude-code-cli' &&
      provider.configuration?.deepSeekConfigStatus !== 'present'
    ) {
      reasons.push(`claude-code-cli-deepseek-config-${safeReasonToken(provider.configuration?.deepSeekConfigStatus)}`);
    }
  });

  for (const provider of Array.isArray(historicalProviders) ? historicalProviders : []) {
    if (provider?.providerId === 'kiro-cli' && provider.activeWorkbenchProvider === true) {
      reasons.push('kiro-cli-historical-active-claim');
    }
  }

  for (const provider of Array.isArray(unsupportedProviders) ? unsupportedProviders : []) {
    if (provider?.activeWorkbenchProvider === true) {
      reasons.push(`unsupported-provider-active-claim-${safeReasonToken(provider.providerId)}`);
    }
  }

  for (const [field, value] of Object.entries(evidencePolicy ?? {})) {
    if (field !== 'sanitizedReadinessOnly' && value === true) {
      reasons.push(`evidence-policy-${kebabCase(field)}`);
    }
  }

  if (evidencePolicy?.sanitizedReadinessOnly !== true) {
    reasons.push('evidence-policy-not-sanitized-readiness-only');
  }

  for (const [field, value] of Object.entries(safety ?? {})) {
    if (value === true) {
      reasons.push(`safety-${kebabCase(field)}`);
    }
  }

  return uniqueStrings(reasons);
}

export function validateProviderReadinessContract(contract) {
  const errors = [];

  if (!isPlainObject(contract)) {
    return { ok: false, errors: ['contract must be a plain object'] };
  }

  rejectExtraFields(errors, 'contract', contract, TOP_LEVEL_ALLOWED_FIELDS);
  requireExact(errors, contract.contractName, 'contractName', PROVIDER_READINESS_CONTRACT_NAME);
  requireExact(errors, contract.contractVersion, 'contractVersion', PROVIDER_READINESS_CONTRACT_VERSION);
  requireIsoTimestamp(errors, contract.generatedAt, 'generatedAt');
  requireEnum(errors, contract.state, 'state', CONTRACT_STATE_SET);
  validateCurrentProject(errors, contract.currentProject);
  validateActiveProviders(errors, contract.activeProviders);
  validateHistoricalProviders(errors, contract.historicalProviders);
  validateUnsupportedProviders(errors, contract.unsupportedProviders);
  validateOperatorRole(errors, contract.operatorRole);
  validateEvidencePolicy(errors, contract.evidencePolicy);
  validateSafety(errors, contract.safety);
  validateBlockedReasons(errors, contract.blockedReasons);
  validateBoundaries(errors, contract.boundaries);
  requireExact(errors, contract.readOnly, 'readOnly', true);
  requireExact(errors, contract.willMutate, 'willMutate', false);

  for (const unsafeField of findUnsafeFields(contract, 'contract')) {
    errors.push(`${unsafeField} must not contain secrets, raw provider output, local session refs, or command material`);
  }

  const derivedReasons = deriveProviderReadinessBlockedReasons(contract);

  for (const reason of derivedReasons) {
    if (!Array.isArray(contract.blockedReasons) || !contract.blockedReasons.includes(reason)) {
      errors.push(`blockedReasons must include "${reason}"`);
    }
  }

  if (derivedReasons.length === 0 && Array.isArray(contract.blockedReasons) && contract.blockedReasons.length === 0 && contract.state !== 'ready') {
    errors.push('state must be ready when provider readiness has no blockers');
  }

  if ((derivedReasons.length > 0 || contract.blockedReasons?.length > 0) && contract.state === 'ready') {
    errors.push('state must not be ready when provider readiness has blockers');
  }

  return { ok: errors.length === 0, errors };
}

export function assertProviderReadinessContract(contract) {
  const result = validateProviderReadinessContract(contract);

  if (!result.ok) {
    throw new ProviderReadinessContractError(
      'invalid-provider-readiness-contract',
      `Invalid Provider Readiness contract: ${result.errors.join('; ')}`,
      { errors: result.errors }
    );
  }

  return contract;
}

function normalizeCurrentProject(project) {
  const source = isPlainObject(project) ? project : {};

  return {
    state: nonEmptyString(source.state) ?? 'unknown',
    projectId: nonEmptyString(source.projectId) ?? null,
    displayName: nonEmptyString(source.displayName) ?? null,
    sourceContract: nonEmptyString(source.sourceContract) ?? null,
    sourceRef: nonEmptyString(source.sourceRef) ?? null
  };
}

function providerReadinessFromHealth({
  providerId,
  provider,
  env
}) {
  const configured = provider?.health?.state === 'configured';
  const providerPresent = provider !== null && provider !== undefined;
  const status = !providerPresent || provider?.health?.state === 'missing'
    ? 'missing'
    : 'degraded';
  const missingReason = provider?.health?.blocker ?? 'provider-health-missing';
  const deepSeekConfigStatus = providerId === 'claude-code-cli'
    ? deepSeekConfigStatusFromEnv(env)
    : 'not-required';

  return {
    providerId,
    label: provider?.displayName ?? (providerId === 'codex-cli' ? 'Codex CLI' : 'Claude Code CLI'),
    role: providerId === 'codex-cli' ? 'worker' : 'reviewer',
    lane: providerId === 'codex-cli' ? 'codex-worker-candidate' : 'claude-code-reviewer-candidate',
    status: configured && (providerId !== 'claude-code-cli' || deepSeekConfigStatus === 'present')
      ? 'degraded'
      : status,
    binaryPresence: {
      state: providerPresent ? 'unknown' : 'missing',
      checked: false,
      evidenceRef: providerPresent ? `agent-cli-provider-health.v1:${providerId}` : null,
      reason: providerPresent
        ? 'provider binary was not executed by readiness projection'
        : missingReason
    },
    modelProfile: {
      state: configured ? 'present' : 'missing',
      checked: true,
      evidenceRef: providerPresent ? `agent-cli-provider-health.v1:${providerId}` : null,
      reason: configured ? null : missingReason
    },
    helpSmoke: {
      state: 'not-run',
      checked: false,
      evidenceRef: null,
      reason: 'help smoke is recorded only when operator provides sanitized evidence'
    },
    optionalRealSmoke: {
      state: 'not-run',
      checked: false,
      evidenceRef: null,
      reason: 'real provider smoke is opt-in'
    },
    configuration: providerId === 'claude-code-cli'
      ? {
          kind: 'claude-code-provider-config',
          state: deepSeekConfigStatus === 'present' ? 'present' : deepSeekConfigStatus,
          deepSeekConfigStatus,
          deepSeekAsIndependentProvider: false,
          storesSecrets: false,
          secretValuesExposed: false,
          notes: ['DeepSeek is a Claude Code provider configuration detail only.']
        }
      : {
          kind: 'codex-cli',
          state: configured ? 'present' : 'missing',
          deepSeekConfigStatus: 'not-required',
          deepSeekAsIndependentProvider: false,
          storesSecrets: false,
          secretValuesExposed: false,
          notes: []
        },
    blockedReasons: [],
    sourceRefs: providerPresent ? ['agent-cli-provider-health.v1'] : [],
    readOnly: true,
    willMutate: false
  };
}

function deepSeekConfigStatusFromEnv(env) {
  return isPresentEnvValue(env?.DEEPSEEK_API_KEY) || isPresentEnvValue(env?.ANTHROPIC_API_KEY)
    ? 'present'
    : 'missing';
}

function isPresentEnvValue(value) {
  return typeof value === 'string' && value.trim() !== '';
}

function normalizeActiveProviders(providers) {
  const source = Array.isArray(providers) && providers.length > 0
    ? providers
    : [defaultCodexProvider(), defaultClaudeCodeProvider()];

  return source.map((provider) => normalizeActiveProvider(provider));
}

function normalizeActiveProvider(provider) {
  const providerId = nonEmptyString(provider?.providerId) ?? 'codex-cli';
  const defaultProvider = providerId === 'claude-code-cli'
    ? defaultClaudeCodeProvider()
    : defaultCodexProvider();
  const source = { ...defaultProvider, ...(isPlainObject(provider) ? provider : {}) };

  return {
    providerId,
    label: nonEmptyString(source.label) ?? defaultProvider.label,
    role: nonEmptyString(source.role) ?? defaultProvider.role,
    lane: nonEmptyString(source.lane) ?? defaultProvider.lane,
    status: nonEmptyString(source.status) ?? 'ready',
    binaryPresence: normalizeCheck(source.binaryPresence, 'present'),
    modelProfile: normalizeCheck(source.modelProfile, 'present'),
    helpSmoke: normalizeCheck(source.helpSmoke, 'passed'),
    optionalRealSmoke: normalizeCheck(source.optionalRealSmoke, 'not-run'),
    configuration: normalizeConfiguration(source.configuration, providerId),
    blockedReasons: safeStringArray(source.blockedReasons),
    sourceRefs: safeStringArray(source.sourceRefs),
    readOnly: source.readOnly !== false,
    willMutate: source.willMutate === true
  };
}

function normalizeCheck(check, defaultState) {
  const source = isPlainObject(check) ? check : {};

  return {
    state: nonEmptyString(source.state) ?? defaultState,
    checked: source.checked === true,
    evidenceRef: nonEmptyString(source.evidenceRef) ?? null,
    reason: nonEmptyString(source.reason) ?? null
  };
}

function normalizeConfiguration(configuration, providerId) {
  const defaultConfig = providerId === 'claude-code-cli'
    ? {
        kind: 'claude-code-provider-config',
        state: 'present',
        deepSeekConfigStatus: 'present',
        deepSeekAsIndependentProvider: false,
        storesSecrets: false,
        secretValuesExposed: false,
        notes: ['DeepSeek is a Claude Code provider configuration detail only.']
      }
    : {
        kind: 'codex-cli',
        state: 'present',
        deepSeekConfigStatus: 'not-required',
        deepSeekAsIndependentProvider: false,
        storesSecrets: false,
        secretValuesExposed: false,
        notes: []
      };
  const source = { ...defaultConfig, ...(isPlainObject(configuration) ? configuration : {}) };

  return {
    kind: nonEmptyString(source.kind) ?? defaultConfig.kind,
    state: nonEmptyString(source.state) ?? defaultConfig.state,
    deepSeekConfigStatus: nonEmptyString(source.deepSeekConfigStatus) ?? defaultConfig.deepSeekConfigStatus,
    deepSeekAsIndependentProvider: source.deepSeekAsIndependentProvider === true,
    storesSecrets: source.storesSecrets === true,
    secretValuesExposed: source.secretValuesExposed === true,
    notes: safeStringArray(source.notes)
  };
}

function normalizeHistoricalProviders(providers) {
  const source = Array.isArray(providers) && providers.length > 0
    ? providers
    : [defaultKiroHistoricalProvider()];

  return source.map((provider) => ({
    providerId: nonEmptyString(provider?.providerId) ?? 'kiro-cli',
    label: nonEmptyString(provider?.label) ?? 'Kiro CLI',
    status: nonEmptyString(provider?.status) ?? 'historical',
    activeWorkbenchProvider: provider?.activeWorkbenchProvider === true,
    reason: nonEmptyString(provider?.reason) ?? 'Historical compatibility and smoke script path only.',
    sourceRef: nonEmptyString(provider?.sourceRef) ?? 'docs/provider-boundary-guide.md'
  }));
}

function normalizeUnsupportedProviders(providers) {
  if (!Array.isArray(providers)) {
    return [];
  }

  return providers.map((provider) => ({
    providerId: nonEmptyString(provider?.providerId) ?? 'unknown-provider',
    claim: nonEmptyString(provider?.claim) ?? 'active-workbench-provider',
    status: nonEmptyString(provider?.status) ?? 'blocked',
    activeWorkbenchProvider: provider?.activeWorkbenchProvider === true,
    blockedReasons: safeStringArray(provider?.blockedReasons)
  }));
}

function normalizeOperatorRole(operatorRole) {
  const source = isPlainObject(operatorRole) ? operatorRole : {};

  return {
    providerId: 'operator',
    role: 'main-verifier',
    state: nonEmptyString(source.state) ?? 'manual-controller',
    responsibilities: safeStringArray(source.responsibilities).length > 0
      ? safeStringArray(source.responsibilities)
      : ['main-verification', 'release-controller'],
    willMutateInProduct: source.willMutateInProduct === true,
    sourceRef: nonEmptyString(source.sourceRef) ?? 'docs/plans/v65-provider-readiness-codex-claude-only-runbook-2026-06-14.md'
  };
}

function normalizeEvidencePolicy(policy) {
  const source = isPlainObject(policy) ? policy : {};

  return {
    sanitizedReadinessOnly: source.sanitizedReadinessOnly !== false,
    rawStdoutAllowed: source.rawStdoutAllowed === true,
    rawStderrAllowed: source.rawStderrAllowed === true,
    rawProviderOutputAllowed: source.rawProviderOutputAllowed === true,
    rawTranscriptAllowed: source.rawTranscriptAllowed === true,
    localSessionPathAllowed: source.localSessionPathAllowed === true,
    secretValueAllowed: source.secretValueAllowed === true,
    notes: safeStringArray(source.notes)
  };
}

function normalizeSafety(safety) {
  const source = isPlainObject(safety) ? safety : {};

  return {
    storesSecrets: source.storesSecrets === true,
    storesRawProviderPaths: source.storesRawProviderPaths === true,
    storesRawTranscripts: source.storesRawTranscripts === true,
    storesRawStdout: source.storesRawStdout === true,
    storesRawStderr: source.storesRawStderr === true,
    storesRawModelOutput: source.storesRawModelOutput === true,
    frontendReadsLocalJsonl: source.frontendReadsLocalJsonl === true,
    frontendReadsProviderFolders: source.frontendReadsProviderFolders === true,
    rendererRunsCommands: source.rendererRunsCommands === true,
    providerLaunchAvailable: source.providerLaunchAvailable === true,
    createsGoalsAutomatically: source.createsGoalsAutomatically === true,
    createsWorktreesAutomatically: source.createsWorktreesAutomatically === true,
    mutatesGitOrReleases: source.mutatesGitOrReleases === true
  };
}

function defaultCodexProvider() {
  return {
    providerId: 'codex-cli',
    label: 'Codex CLI',
    role: 'worker',
    lane: 'codex-worker-candidate',
    status: 'ready',
    binaryPresence: {
      state: 'present',
      checked: true,
      evidenceRef: 'help-smoke:codex-cli',
      reason: null
    },
    modelProfile: {
      state: 'present',
      checked: true,
      evidenceRef: 'profile:codex-cli-managed',
      reason: null
    },
    helpSmoke: {
      state: 'passed',
      checked: true,
      evidenceRef: 'help-smoke:codex-cli',
      reason: null
    },
    optionalRealSmoke: {
      state: 'not-run',
      checked: false,
      evidenceRef: null,
      reason: 'real provider smoke is opt-in'
    }
  };
}

function defaultClaudeCodeProvider() {
  return {
    providerId: 'claude-code-cli',
    label: 'Claude Code CLI',
    role: 'reviewer',
    lane: 'claude-code-reviewer-candidate',
    status: 'ready',
    binaryPresence: {
      state: 'present',
      checked: true,
      evidenceRef: 'help-smoke:claude-code-cli',
      reason: null
    },
    modelProfile: {
      state: 'present',
      checked: true,
      evidenceRef: 'profile:claude-code-cli-managed',
      reason: null
    },
    helpSmoke: {
      state: 'passed',
      checked: true,
      evidenceRef: 'help-smoke:claude-code-cli',
      reason: null
    },
    optionalRealSmoke: {
      state: 'not-run',
      checked: false,
      evidenceRef: null,
      reason: 'real provider smoke is opt-in'
    }
  };
}

function defaultKiroHistoricalProvider() {
  return {
    providerId: 'kiro-cli',
    label: 'Kiro CLI',
    status: 'historical',
    activeWorkbenchProvider: false,
    reason: 'Historical compatibility and smoke script path only.',
    sourceRef: 'docs/provider-boundary-guide.md'
  };
}

function validateCurrentProject(errors, project) {
  if (!isPlainObject(project)) {
    errors.push('currentProject must be a plain object');
    return;
  }

  rejectExtraFields(errors, 'currentProject', project, CURRENT_PROJECT_ALLOWED_FIELDS);
  requireEnum(errors, project.state, 'currentProject.state', PROJECT_STATE_SET);

  for (const field of ['projectId', 'displayName', 'sourceContract', 'sourceRef']) {
    if (project[field] !== null) {
      requireSafeRef(errors, project[field], `currentProject.${field}`);
    }
  }
}

function validateActiveProviders(errors, providers) {
  if (!Array.isArray(providers)) {
    errors.push('activeProviders must be an array');
    return;
  }

  providers.forEach((provider, index) => {
    const path = `activeProviders[${index}]`;

    if (!isPlainObject(provider)) {
      errors.push(`${path} must be a plain object`);
      return;
    }

    rejectExtraFields(errors, path, provider, ACTIVE_PROVIDER_ALLOWED_FIELDS);
    requireEnum(errors, provider.providerId, `${path}.providerId`, new Set(ACTIVE_PROVIDER_IDS));
    requireNonEmptyString(errors, provider.label, `${path}.label`);
    requireEnum(errors, provider.role, `${path}.role`, PROVIDER_ROLE_SET);
    requireEnum(errors, provider.lane, `${path}.lane`, PROVIDER_LANE_SET);
    requireEnum(errors, provider.status, `${path}.status`, PROVIDER_STATUS_SET);
    validateCheck(errors, provider.binaryPresence, `${path}.binaryPresence`);
    validateCheck(errors, provider.modelProfile, `${path}.modelProfile`);
    validateCheck(errors, provider.helpSmoke, `${path}.helpSmoke`);
    validateCheck(errors, provider.optionalRealSmoke, `${path}.optionalRealSmoke`);
    validateConfiguration(errors, provider.configuration, `${path}.configuration`);
    validateBlockedReasons(errors, provider.blockedReasons, `${path}.blockedReasons`);
    validateSafeRefArray(errors, provider.sourceRefs, `${path}.sourceRefs`);
    requireExact(errors, provider.readOnly, `${path}.readOnly`, true);
    requireExact(errors, provider.willMutate, `${path}.willMutate`, false);
  });
}

function validateCheck(errors, check, path) {
  if (!isPlainObject(check)) {
    errors.push(`${path} must be a plain object`);
    return;
  }

  rejectExtraFields(errors, path, check, CHECK_ALLOWED_FIELDS);
  requireEnum(errors, check.state, `${path}.state`, CHECK_STATE_SET);
  if (typeof check.checked !== 'boolean') {
    errors.push(`${path}.checked must be boolean`);
  }
  if (check.evidenceRef !== null) {
    requireSafeRef(errors, check.evidenceRef, `${path}.evidenceRef`);
  }
  if (check.reason !== null) {
    requireNonEmptyString(errors, check.reason, `${path}.reason`);
  }
}

function validateConfiguration(errors, configuration, path) {
  if (!isPlainObject(configuration)) {
    errors.push(`${path} must be a plain object`);
    return;
  }

  rejectExtraFields(errors, path, configuration, CONFIGURATION_ALLOWED_FIELDS);
  requireEnum(errors, configuration.kind, `${path}.kind`, CONFIGURATION_KIND_SET);
  requireEnum(errors, configuration.state, `${path}.state`, CONFIGURATION_STATE_SET);
  requireEnum(errors, configuration.deepSeekConfigStatus, `${path}.deepSeekConfigStatus`, DEEPSEEK_CONFIG_STATE_SET);
  requireExact(errors, configuration.deepSeekAsIndependentProvider, `${path}.deepSeekAsIndependentProvider`, false);
  requireExact(errors, configuration.storesSecrets, `${path}.storesSecrets`, false);
  requireExact(errors, configuration.secretValuesExposed, `${path}.secretValuesExposed`, false);
  validateTextArray(errors, configuration.notes, `${path}.notes`);
}

function validateHistoricalProviders(errors, providers) {
  if (!Array.isArray(providers)) {
    errors.push('historicalProviders must be an array');
    return;
  }

  providers.forEach((provider, index) => {
    const path = `historicalProviders[${index}]`;

    if (!isPlainObject(provider)) {
      errors.push(`${path} must be a plain object`);
      return;
    }

    rejectExtraFields(errors, path, provider, HISTORICAL_PROVIDER_ALLOWED_FIELDS);
    requireSafeRef(errors, provider.providerId, `${path}.providerId`);
    requireNonEmptyString(errors, provider.label, `${path}.label`);
    requireEnum(errors, provider.status, `${path}.status`, HISTORICAL_PROVIDER_STATUS_SET);
    requireExact(errors, provider.activeWorkbenchProvider, `${path}.activeWorkbenchProvider`, false);
    requireNonEmptyString(errors, provider.reason, `${path}.reason`);
    requireSafeRef(errors, provider.sourceRef, `${path}.sourceRef`);
  });
}

function validateUnsupportedProviders(errors, providers) {
  if (!Array.isArray(providers)) {
    errors.push('unsupportedProviders must be an array');
    return;
  }

  providers.forEach((provider, index) => {
    const path = `unsupportedProviders[${index}]`;

    if (!isPlainObject(provider)) {
      errors.push(`${path} must be a plain object`);
      return;
    }

    rejectExtraFields(errors, path, provider, UNSUPPORTED_PROVIDER_ALLOWED_FIELDS);
    requireSafeRef(errors, provider.providerId, `${path}.providerId`);
    requireSafeRef(errors, provider.claim, `${path}.claim`);
    requireEnum(errors, provider.status, `${path}.status`, UNSUPPORTED_PROVIDER_STATUS_SET);
    requireExact(errors, provider.activeWorkbenchProvider, `${path}.activeWorkbenchProvider`, false);
    validateBlockedReasons(errors, provider.blockedReasons, `${path}.blockedReasons`);
  });
}

function validateOperatorRole(errors, operatorRole) {
  if (!isPlainObject(operatorRole)) {
    errors.push('operatorRole must be a plain object');
    return;
  }

  rejectExtraFields(errors, 'operatorRole', operatorRole, OPERATOR_ROLE_ALLOWED_FIELDS);
  requireExact(errors, operatorRole.providerId, 'operatorRole.providerId', 'operator');
  requireExact(errors, operatorRole.role, 'operatorRole.role', 'main-verifier');
  requireEnum(errors, operatorRole.state, 'operatorRole.state', OPERATOR_STATE_SET);
  validateSafeRefArray(errors, operatorRole.responsibilities, 'operatorRole.responsibilities');
  requireExact(errors, operatorRole.willMutateInProduct, 'operatorRole.willMutateInProduct', false);
  requireSafeRef(errors, operatorRole.sourceRef, 'operatorRole.sourceRef');
}

function validateEvidencePolicy(errors, policy) {
  if (!isPlainObject(policy)) {
    errors.push('evidencePolicy must be a plain object');
    return;
  }

  rejectExtraFields(errors, 'evidencePolicy', policy, EVIDENCE_POLICY_ALLOWED_FIELDS);
  requireExact(errors, policy.sanitizedReadinessOnly, 'evidencePolicy.sanitizedReadinessOnly', true);

  for (const field of EVIDENCE_POLICY_ALLOWED_FIELDS) {
    if (field === 'sanitizedReadinessOnly' || field === 'notes') {
      continue;
    }
    requireExact(errors, policy[field], `evidencePolicy.${field}`, false);
  }

  validateTextArray(errors, policy.notes, 'evidencePolicy.notes');
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

function validateBlockedReasons(errors, blockedReasons, path = 'blockedReasons') {
  if (!Array.isArray(blockedReasons)) {
    errors.push(`${path} must be an array`);
    return;
  }

  blockedReasons.forEach((reason, index) => {
    requireSafeRef(errors, reason, `${path}[${index}]`);
  });
}

function validateSafeRefArray(errors, values, path) {
  if (!Array.isArray(values)) {
    errors.push(`${path} must be an array`);
    return;
  }

  values.forEach((value, index) => {
    requireSafeRef(errors, value, `${path}[${index}]`);
  });
}

function validateTextArray(errors, values, path) {
  if (!Array.isArray(values)) {
    errors.push(`${path} must be an array`);
    return;
  }

  values.forEach((value, index) => {
    requireNonEmptyString(errors, value, `${path}[${index}]`);
  });
}

function validateBoundaries(errors, boundaries) {
  if (!isPlainObject(boundaries)) {
    errors.push('boundaries must be a plain object');
    return;
  }

  for (const [field, expected] of Object.entries(PROVIDER_READINESS_BOUNDARIES)) {
    requireExact(errors, boundaries[field], `boundaries.${field}`, expected);
  }
}

function stateFromBlockedReasons(blockedReasons, activeProviders) {
  if (blockedReasons.length === 0) {
    return 'ready';
  }

  if (activeProviders.some((provider) => provider.status === 'missing')) {
    return 'missing';
  }

  if (activeProviders.some((provider) => provider.status === 'degraded')) {
    return 'degraded';
  }

  return 'blocked';
}

function rejectExtraFields(errors, path, object, allowedFields) {
  for (const field of Object.keys(object)) {
    if (!allowedFields.has(field)) {
      errors.push(`${path}.${field} is not allowed`);
    }
  }
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

  if (typeof value === 'string' && (!SAFE_REF_PATTERN.test(value) || value.includes('..'))) {
    errors.push(`${path} must be a safe provider readiness ref token`);
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

function safeStringArray(values) {
  if (!Array.isArray(values)) {
    return [];
  }

  return values.filter((value) => typeof value === 'string' && value.trim() !== '');
}

function uniqueStrings(values) {
  return [...new Set(values.filter((value) => typeof value === 'string' && value.trim() !== ''))];
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

function safeReasonToken(value) {
  return typeof value === 'string' && value.trim() !== '' ? kebabCase(value) : 'unknown';
}

function kebabCase(value) {
  return String(value)
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/[^A-Za-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
}
