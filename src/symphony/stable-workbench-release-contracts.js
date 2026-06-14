export const STABLE_WORKBENCH_RELEASE_CONTRACT_NAME = 'stableWorkbenchRelease.v1';
export const STABLE_WORKBENCH_RELEASE_CONTRACT_VERSION = 1;

export const STABLE_WORKBENCH_REQUIRED_SURFACE_IDS = Object.freeze([
  'project-entry',
  'goal-supervision',
  'context',
  'result-intake',
  'event-registration',
  'child-task-planning',
  'provider-execution',
  'review-and-gates',
  'thread-handoff',
  'release-closeout',
  'release-publication',
  'release-boundary'
]);

export const STABLE_WORKBENCH_RELEASE_BOUNDARIES = Object.freeze({
  readOnly: true,
  workbenchBaselineOnly: true,
  providerLaunchAvailable: false,
  unsupportedProviderClaimsAvailable: false,
  genericShellAvailable: false,
  genericTerminalAvailable: false,
  rendererCommandExecutionAvailable: false,
  frontendLocalJsonlReadAvailable: false,
  frontendLocalSessionReadAvailable: false,
  frontendProviderFolderReadAvailable: false,
  rawTranscriptExposureAvailable: false,
  rawModelOutputExposureAvailable: false,
  directGoalEventAppendAvailable: false,
  directTaskCompletionAvailable: false,
  gitWriteAvailable: false,
  gitMergeAvailable: false,
  gitTagAvailable: false,
  gitPushAvailable: false,
  githubReleaseCreateAvailable: false,
  githubReleaseEditAvailable: false,
  publicDistributionClaimAvailable: false,
  notarizationClaimAvailable: false,
  autoUpdateClaimAvailable: false,
  automaticWorktreeCreationAvailable: false,
  automaticNextVersionGoalAvailable: false
});

const TOP_LEVEL_ALLOWED_FIELDS = new Set([
  'contractName',
  'contractVersion',
  'generatedAt',
  'state',
  'goal',
  'release',
  'surfaces',
  'providerBoundary',
  'releaseBoundary',
  'safety',
  'evidenceRefs',
  'knownFacts',
  'blockedReasons',
  'boundaries',
  'readOnly',
  'willMutate'
]);
const GOAL_ALLOWED_FIELDS = new Set(['goalId', 'title', 'state', 'sourceRef']);
const RELEASE_ALLOWED_FIELDS = new Set([
  'currentTaggedRelease',
  'activeVersion',
  'currentTagCommit',
  'activeTagExists',
  'activeGithubReleaseExists',
  'sourceRefs'
]);
const SURFACE_ALLOWED_FIELDS = new Set([
  'id',
  'label',
  'state',
  'required',
  'sourceContract',
  'sourceRef',
  'evidenceRefs',
  'readOnly',
  'copyOnly',
  'willMutate',
  'blockedReasons'
]);
const PROVIDER_BOUNDARY_ALLOWED_FIELDS = new Set([
  'activeWorkbenchProviderClaims',
  'unsupportedProviderClaims',
  'rawProviderCliEvidenceAllowed',
  'notes'
]);
const PROVIDER_CLAIM_ALLOWED_FIELDS = new Set([
  'provider',
  'claim',
  'status',
  'sourceContract',
  'sourceRef',
  'blockedReasons'
]);
const RELEASE_BOUNDARY_ALLOWED_FIELDS = new Set([
  'tagOperation',
  'pushTagOperation',
  'githubReleaseOperation',
  'releaseReadyDeclaration',
  'manualControllerActionRequired',
  'automationObserved',
  'blockedReasons'
]);
const RELEASE_OPERATION_ALLOWED_FIELDS = new Set([
  'state',
  'commandResult',
  'copyOnly',
  'willMutate',
  'sourceRef'
]);
const SAFETY_ALLOWED_FIELDS = new Set([
  'rawTranscriptObserved',
  'rawModelOutputObserved',
  'frontendLocalJsonlReadObserved',
  'frontendLocalSessionReadObserved',
  'frontendProviderFolderReadObserved',
  'rendererCommandExecutionObserved',
  'genericShellObserved',
  'genericTerminalObserved',
  'directGoalEventAppendObserved',
  'directTaskCompletionObserved',
  'automaticWorktreeCreationObserved',
  'automaticNextVersionGoalObserved',
  'blockedReasons'
]);
const SOURCE_REF_ALLOWED_FIELDS = new Set(['kind', 'ref', 'label', 'generatedAt']);
const EVIDENCE_REF_ALLOWED_FIELDS = new Set(['kind', 'ref', 'label']);

const CONTRACT_STATE_SET = new Set(['ready', 'blocked']);
const GOAL_STATE_SET = new Set(['active', 'ready', 'blocked', 'missing']);
const SURFACE_STATE_SET = new Set(['ready', 'missing', 'blocked', 'degraded', 'manual-required']);
const PROVIDER_STATUS_SET = new Set(['tested-preview', 'optional-smoke', 'historical', 'unsupported', 'blocked']);
const RELEASE_OPERATION_STATE_SET = new Set(['manual-controller-action', 'blocked', 'missing']);
const COMMAND_RESULT_STATUS_SET = new Set(['not-run-by-product-code', 'recorded-externally', 'missing']);
const SOURCE_REF_KIND_SET = new Set(['contract', 'route', 'fixture', 'repo-doc', 'qa-doc', 'commit', 'tag', 'github-release']);
const EVIDENCE_REF_KIND_SET = new Set(['repo-doc', 'qa-doc', 'fixture', 'contract', 'commit', 'tag', 'github-release', 'release-url']);
const REQUIRED_RELEASE_OPERATIONS = Object.freeze([
  'tagOperation',
  'pushTagOperation',
  'githubReleaseOperation',
  'releaseReadyDeclaration'
]);
const SAFETY_OBSERVED_FIELDS = Object.freeze([
  'rawTranscriptObserved',
  'rawModelOutputObserved',
  'frontendLocalJsonlReadObserved',
  'frontendLocalSessionReadObserved',
  'frontendProviderFolderReadObserved',
  'rendererCommandExecutionObserved',
  'genericShellObserved',
  'genericTerminalObserved',
  'directGoalEventAppendObserved',
  'directTaskCompletionObserved',
  'automaticWorktreeCreationObserved',
  'automaticNextVersionGoalObserved'
]);
const ALLOWED_ACTIVE_PROVIDER_CLAIM = Object.freeze({
  provider: 'codex-cli',
  claim: 'controlled-provider-execution-preview',
  status: 'tested-preview'
});
const SAFE_TOKEN_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9._:-]*$/u;
const CONTRACT_NAME_PATTERN = /^[a-z][a-zA-Z0-9-]*(?:\.[a-zA-Z0-9-]+)*\.v[0-9]+$/u;
const COMMIT_PATTERN = /^[a-f0-9]{7,64}$/u;
const UNSAFE_FIELD_NAME_PATTERN =
  /^(?:rawTranscript|transcript|rawModelOutput|rawOutput|providerOutput|providerPayload|sessionLog|sessionPath|messages|conversation|goalLedgerInternals|executableCommand|shellCommand|commandLine)$/iu;
const UNSAFE_REF_PATTERN =
  /(?:^|[/.])(?:\.codex|\.claude|\.git|\.symphony)(?:[/]|$)|\/Users\/|\.jsonl(?:$|[/\s])|\b(?:raw[\s_-]*(?:transcript|model[\s_-]*output)|provider[\s_-]*(?:payload|output)|session[\s_-]*(?:file|path|log))\b/iu;

export class StableWorkbenchReleaseContractError extends Error {
  constructor(code, message, details = {}) {
    super(message);
    this.name = 'StableWorkbenchReleaseContractError';
    this.code = code;
    this.details = details;
  }
}

export function buildStableWorkbenchRelease({
  generatedAt = new Date().toISOString(),
  goal = null,
  release = null,
  surfaces = null,
  providerBoundary = null,
  releaseBoundary = null,
  safety = null,
  evidenceRefs = [],
  knownFacts = [],
  blockedReasons: inputBlockedReasons = []
} = {}) {
  const unsafeSourceField = findUnsafeFields({
    goal,
    release,
    surfaces,
    providerBoundary,
    releaseBoundary,
    safety,
    evidenceRefs,
    knownFacts
  }, 'source')[0];

  if (unsafeSourceField !== undefined) {
    throw new StableWorkbenchReleaseContractError(
      'unsafe-stable-workbench-release-source',
      'Stable Workbench release source contains raw provider output, local session refs, or mutation routes.',
      { reason: `${unsafeSourceField} must not contain raw provider output, local session refs, or mutation routes` }
    );
  }

  const normalizedSurfaces = normalizeSurfaces(surfaces);
  const normalizedProviderBoundary = normalizeProviderBoundary(providerBoundary);
  const normalizedReleaseBoundary = normalizeReleaseBoundary(releaseBoundary);
  const normalizedSafety = normalizeSafety(safety);
  const derivedBlockedReasons = deriveStableWorkbenchReleaseBlockedReasons({
    surfaces: normalizedSurfaces,
    providerBoundary: normalizedProviderBoundary,
    releaseBoundary: normalizedReleaseBoundary,
    safety: normalizedSafety
  });
  const blockedReasons = uniqueStrings([
    ...safeStringArray(inputBlockedReasons),
    ...derivedBlockedReasons
  ]);

  return {
    contractName: STABLE_WORKBENCH_RELEASE_CONTRACT_NAME,
    contractVersion: STABLE_WORKBENCH_RELEASE_CONTRACT_VERSION,
    generatedAt: new Date(millisOrNow(generatedAt)).toISOString(),
    state: blockedReasons.length === 0 ? 'ready' : 'blocked',
    goal: normalizeGoal(goal),
    release: normalizeRelease(release),
    surfaces: normalizedSurfaces,
    providerBoundary: normalizedProviderBoundary,
    releaseBoundary: normalizedReleaseBoundary,
    safety: normalizedSafety,
    evidenceRefs: evidenceRefsFrom(evidenceRefs),
    knownFacts: safeStringArray(knownFacts),
    blockedReasons,
    boundaries: cloneObject(STABLE_WORKBENCH_RELEASE_BOUNDARIES),
    readOnly: true,
    willMutate: false
  };
}

export function validateStableWorkbenchReleaseContract(contract) {
  const errors = [];

  if (!isPlainObject(contract)) {
    return { ok: false, errors: ['contract must be an object'] };
  }

  rejectExtraFields(errors, 'contract', contract, TOP_LEVEL_ALLOWED_FIELDS);
  expectEqual(errors, contract.contractName, STABLE_WORKBENCH_RELEASE_CONTRACT_NAME, 'contractName');
  expectEqual(errors, contract.contractVersion, STABLE_WORKBENCH_RELEASE_CONTRACT_VERSION, 'contractVersion');
  expectSet(errors, CONTRACT_STATE_SET, contract.state, 'state');
  expectBoolean(errors, contract.readOnly, true, 'readOnly');
  expectBoolean(errors, contract.willMutate, false, 'willMutate');
  validateGeneratedAt(errors, contract.generatedAt, 'generatedAt');
  validateBoundaries(errors, contract.boundaries);

  validateGoal(errors, contract.goal);
  validateRelease(errors, contract.release);
  validateSurfaces(errors, contract.surfaces);
  validateProviderBoundary(errors, contract.providerBoundary);
  validateReleaseBoundary(errors, contract.releaseBoundary);
  validateSafety(errors, contract.safety);
  validateEvidenceRefs(errors, contract.evidenceRefs, 'evidenceRefs');
  validateStringArray(errors, contract.knownFacts, 'knownFacts');
  validateReasonArray(errors, contract.blockedReasons, 'blockedReasons');
  validateNoUnsafeFields(errors, contract, 'contract');

  if (Array.isArray(contract.blockedReasons)) {
    const derived = deriveStableWorkbenchReleaseBlockedReasons(contract);
    const normalizedInput = [...new Set(contract.blockedReasons)];

    if (!sameStringArray(normalizedInput, derived)) {
      errors.push('blockedReasons must match derived stable Workbench release blockers');
    }

    const derivedState = derived.length === 0 ? 'ready' : 'blocked';
    if (contract.state !== derivedState) {
      errors.push(`state must match derived stable Workbench release state "${derivedState}"`);
    }
  }

  return { ok: errors.length === 0, errors };
}

export function assertStableWorkbenchReleaseContract(contract) {
  const validation = validateStableWorkbenchReleaseContract(contract);

  if (!validation.ok) {
    throw new StableWorkbenchReleaseContractError(
      'invalid-stable-workbench-release-contract',
      'Stable Workbench release contract is invalid.',
      { errors: validation.errors }
    );
  }

  return contract;
}

export function deriveStableWorkbenchReleaseBlockedReasons({
  surfaces,
  providerBoundary,
  releaseBoundary,
  safety
} = {}) {
  const reasons = [];
  const surfaceMap = new Map(Array.isArray(surfaces) ? surfaces.map((surface) => [surface?.id, surface]) : []);

  for (const id of STABLE_WORKBENCH_REQUIRED_SURFACE_IDS) {
    const surface = surfaceMap.get(id);

    if (!surface || surface.state === 'missing') {
      reasons.push('missing-stable-workbench-surface');
    } else if (surface.state === 'blocked') {
      reasons.push('blocked-stable-workbench-surface');
    }
  }

  if (releaseBoundaryDriftObserved(releaseBoundary)) {
    reasons.push('release-boundary-drift');
  }

  if (unsupportedProviderClaimObserved(providerBoundary)) {
    reasons.push('unsupported-provider-claim');
  }

  if (rawOrLocalExposureObserved(safety)) {
    reasons.push('local-session-or-transcript-exposure');
  }

  if (commandExecutionObserved(safety)) {
    reasons.push('command-execution-boundary-drift');
  }

  if (directMutationObserved(safety)) {
    reasons.push('direct-mutation-boundary-drift');
  }

  if (automaticWorkflowObserved(safety)) {
    reasons.push('automatic-worktree-or-next-goal');
  }

  return uniqueStrings(reasons);
}

function normalizeGoal(goal) {
  const source = isPlainObject(goal) ? goal : {};

  return {
    goalId: nonEmptyString(source.goalId, 'v60-stable-personal-workbench-release'),
    title: nonEmptyString(source.title, 'v60: Stable Personal Workbench Release'),
    state: GOAL_STATE_SET.has(source.state) ? source.state : 'active',
    sourceRef: sourceRefFrom(source.sourceRef, {
      kind: 'repo-doc',
      ref: 'docs/plans/v60-stable-personal-workbench-release-runbook-2026-06-14.md',
      label: 'v60 runbook'
    })
  };
}

function normalizeRelease(release) {
  const source = isPlainObject(release) ? release : {};

  return {
    currentTaggedRelease: nonEmptyString(source.currentTaggedRelease, 'v59'),
    activeVersion: nonEmptyString(source.activeVersion, 'v60'),
    currentTagCommit: nonEmptyString(source.currentTagCommit, null),
    activeTagExists: source.activeTagExists === true,
    activeGithubReleaseExists: source.activeGithubReleaseExists === true,
    sourceRefs: sourceRefsFrom(source.sourceRefs)
  };
}

function normalizeSurfaces(surfaces) {
  if (!Array.isArray(surfaces)) {
    return STABLE_WORKBENCH_REQUIRED_SURFACE_IDS.map((id) => defaultSurface(id));
  }

  return surfaces.map((surface) => {
    const source = isPlainObject(surface) ? surface : {};

    return {
      id: nonEmptyString(source.id, 'unknown-surface'),
      label: nonEmptyString(source.label, labelForSurface(source.id)),
      state: SURFACE_STATE_SET.has(source.state) ? source.state : 'missing',
      required: source.required !== false,
      sourceContract: nonEmptyString(source.sourceContract, null),
      sourceRef: source.sourceRef === null ? null : sourceRefFrom(source.sourceRef, null),
      evidenceRefs: evidenceRefsFrom(source.evidenceRefs),
      readOnly: source.readOnly !== false,
      copyOnly: source.copyOnly === true,
      willMutate: source.willMutate === true,
      blockedReasons: safeStringArray(source.blockedReasons)
    };
  });
}

function defaultSurface(id) {
  return {
    id,
    label: labelForSurface(id),
    state: 'ready',
    required: true,
    sourceContract: sourceContractForSurface(id),
    sourceRef: sourceRefFrom({
      kind: 'contract',
      ref: sourceContractForSurface(id),
      label: `${labelForSurface(id)} source contract`
    }),
    evidenceRefs: [],
    readOnly: true,
    copyOnly: copyOnlySurface(id),
    willMutate: false,
    blockedReasons: []
  };
}

function normalizeProviderBoundary(providerBoundary) {
  const source = isPlainObject(providerBoundary) ? providerBoundary : {};

  return {
    activeWorkbenchProviderClaims: providerClaimsFrom(source.activeWorkbenchProviderClaims ?? [{
      provider: 'codex-cli',
      claim: 'controlled-provider-execution-preview',
      status: 'tested-preview',
      sourceContract: 'codexProviderExecutionPilot.v1',
      sourceRef: {
        kind: 'contract',
        ref: 'codexProviderExecutionPilot.v1',
        label: 'v54 controlled provider execution preview'
      },
      blockedReasons: []
    }]),
    unsupportedProviderClaims: providerClaimsFrom(source.unsupportedProviderClaims),
    rawProviderCliEvidenceAllowed: source.rawProviderCliEvidenceAllowed === true,
    notes: safeStringArray(source.notes)
  };
}

function normalizeReleaseBoundary(releaseBoundary) {
  const source = isPlainObject(releaseBoundary) ? releaseBoundary : {};
  const automationObserved = source.automationObserved === true;

  return {
    tagOperation: releaseOperationFrom(source.tagOperation),
    pushTagOperation: releaseOperationFrom(source.pushTagOperation),
    githubReleaseOperation: releaseOperationFrom(source.githubReleaseOperation),
    releaseReadyDeclaration: releaseOperationFrom(source.releaseReadyDeclaration),
    manualControllerActionRequired: source.manualControllerActionRequired !== false,
    automationObserved,
    blockedReasons: safeStringArray(source.blockedReasons)
  };
}

function releaseOperationFrom(operation) {
  const source = isPlainObject(operation) ? operation : {};

  return {
    state: RELEASE_OPERATION_STATE_SET.has(source.state) ? source.state : 'manual-controller-action',
    commandResult: COMMAND_RESULT_STATUS_SET.has(source.commandResult) ? source.commandResult : 'not-run-by-product-code',
    copyOnly: source.copyOnly !== false,
    willMutate: source.willMutate === true,
    sourceRef: source.sourceRef === null ? null : sourceRefFrom(source.sourceRef, {
      kind: 'repo-doc',
      ref: 'docs/release-checklist.md',
      label: 'manual release checklist'
    })
  };
}

function normalizeSafety(safety) {
  const source = isPlainObject(safety) ? safety : {};

  return {
    rawTranscriptObserved: source.rawTranscriptObserved === true,
    rawModelOutputObserved: source.rawModelOutputObserved === true,
    frontendLocalJsonlReadObserved: source.frontendLocalJsonlReadObserved === true,
    frontendLocalSessionReadObserved: source.frontendLocalSessionReadObserved === true,
    frontendProviderFolderReadObserved: source.frontendProviderFolderReadObserved === true,
    rendererCommandExecutionObserved: source.rendererCommandExecutionObserved === true,
    genericShellObserved: source.genericShellObserved === true,
    genericTerminalObserved: source.genericTerminalObserved === true,
    directGoalEventAppendObserved: source.directGoalEventAppendObserved === true,
    directTaskCompletionObserved: source.directTaskCompletionObserved === true,
    automaticWorktreeCreationObserved: source.automaticWorktreeCreationObserved === true,
    automaticNextVersionGoalObserved: source.automaticNextVersionGoalObserved === true,
    blockedReasons: safeStringArray(source.blockedReasons)
  };
}

function validateGoal(errors, goal) {
  if (!isPlainObject(goal)) {
    errors.push('goal must be an object');
    return;
  }

  rejectExtraFields(errors, 'goal', goal, GOAL_ALLOWED_FIELDS);
  validateSafeToken(errors, goal.goalId, 'goal.goalId');
  validateNonEmptyString(errors, goal.title, 'goal.title');
  expectSet(errors, GOAL_STATE_SET, goal.state, 'goal.state');
  validateSourceRef(errors, goal.sourceRef, 'goal.sourceRef');
}

function validateRelease(errors, release) {
  if (!isPlainObject(release)) {
    errors.push('release must be an object');
    return;
  }

  rejectExtraFields(errors, 'release', release, RELEASE_ALLOWED_FIELDS);
  validateSafeToken(errors, release.currentTaggedRelease, 'release.currentTaggedRelease');
  validateSafeToken(errors, release.activeVersion, 'release.activeVersion');
  if (release.currentTagCommit !== null) {
    validatePattern(errors, COMMIT_PATTERN, release.currentTagCommit, 'release.currentTagCommit');
  }
  expectBoolean(errors, release.activeTagExists, null, 'release.activeTagExists');
  expectBoolean(errors, release.activeGithubReleaseExists, null, 'release.activeGithubReleaseExists');
  validateSourceRefs(errors, release.sourceRefs, 'release.sourceRefs');
}

function validateSurfaces(errors, surfaces) {
  if (!Array.isArray(surfaces)) {
    errors.push('surfaces must be an array');
    return;
  }

  const seen = new Set();
  surfaces.forEach((surface, index) => {
    const path = `surfaces[${index}]`;
    if (!isPlainObject(surface)) {
      errors.push(`${path} must be an object`);
      return;
    }

    rejectExtraFields(errors, path, surface, SURFACE_ALLOWED_FIELDS);
    validateSafeToken(errors, surface.id, `${path}.id`);
    if (seen.has(surface.id)) {
      errors.push(`${path}.id must be unique`);
    }
    seen.add(surface.id);
    validateNonEmptyString(errors, surface.label, `${path}.label`);
    expectSet(errors, SURFACE_STATE_SET, surface.state, `${path}.state`);
    expectBoolean(errors, surface.required, null, `${path}.required`);
    if (surface.sourceContract !== null) {
      validatePattern(errors, CONTRACT_NAME_PATTERN, surface.sourceContract, `${path}.sourceContract`);
    }
    if (surface.sourceRef !== null) {
      validateSourceRef(errors, surface.sourceRef, `${path}.sourceRef`);
    }
    validateEvidenceRefs(errors, surface.evidenceRefs, `${path}.evidenceRefs`);
    expectBoolean(errors, surface.readOnly, true, `${path}.readOnly`);
    expectBoolean(errors, surface.copyOnly, null, `${path}.copyOnly`);
    expectBoolean(errors, surface.willMutate, false, `${path}.willMutate`);
    validateReasonArray(errors, surface.blockedReasons, `${path}.blockedReasons`);
  });

  for (const id of STABLE_WORKBENCH_REQUIRED_SURFACE_IDS) {
    if (!seen.has(id)) {
      errors.push(`surfaces must include required surface "${id}"`);
    }
  }
}

function validateProviderBoundary(errors, providerBoundary) {
  if (!isPlainObject(providerBoundary)) {
    errors.push('providerBoundary must be an object');
    return;
  }

  rejectExtraFields(errors, 'providerBoundary', providerBoundary, PROVIDER_BOUNDARY_ALLOWED_FIELDS);
  validateProviderClaims(errors, providerBoundary.activeWorkbenchProviderClaims, 'providerBoundary.activeWorkbenchProviderClaims');
  validateProviderClaims(errors, providerBoundary.unsupportedProviderClaims, 'providerBoundary.unsupportedProviderClaims');
  expectBoolean(errors, providerBoundary.rawProviderCliEvidenceAllowed, false, 'providerBoundary.rawProviderCliEvidenceAllowed');
  validateStringArray(errors, providerBoundary.notes, 'providerBoundary.notes');
}

function validateProviderClaims(errors, claims, path) {
  if (!Array.isArray(claims)) {
    errors.push(`${path} must be an array`);
    return;
  }

  claims.forEach((claim, index) => {
    const claimPath = `${path}[${index}]`;
    if (!isPlainObject(claim)) {
      errors.push(`${claimPath} must be an object`);
      return;
    }

    rejectExtraFields(errors, claimPath, claim, PROVIDER_CLAIM_ALLOWED_FIELDS);
    validateSafeToken(errors, claim.provider, `${claimPath}.provider`);
    validateSafeToken(errors, claim.claim, `${claimPath}.claim`);
    expectSet(errors, PROVIDER_STATUS_SET, claim.status, `${claimPath}.status`);
    if (claim.sourceContract !== null) {
      validatePattern(errors, CONTRACT_NAME_PATTERN, claim.sourceContract, `${claimPath}.sourceContract`);
    }
    if (claim.sourceRef !== null) {
      validateSourceRef(errors, claim.sourceRef, `${claimPath}.sourceRef`);
    }
    validateReasonArray(errors, claim.blockedReasons, `${claimPath}.blockedReasons`);
  });
}

function validateReleaseBoundary(errors, releaseBoundary) {
  if (!isPlainObject(releaseBoundary)) {
    errors.push('releaseBoundary must be an object');
    return;
  }

  rejectExtraFields(errors, 'releaseBoundary', releaseBoundary, RELEASE_BOUNDARY_ALLOWED_FIELDS);
  for (const operationName of REQUIRED_RELEASE_OPERATIONS) {
    validateReleaseOperation(errors, releaseBoundary[operationName], `releaseBoundary.${operationName}`);
  }
  expectBoolean(errors, releaseBoundary.manualControllerActionRequired, true, 'releaseBoundary.manualControllerActionRequired');
  expectBoolean(errors, releaseBoundary.automationObserved, null, 'releaseBoundary.automationObserved');
  validateReasonArray(errors, releaseBoundary.blockedReasons, 'releaseBoundary.blockedReasons');
}

function validateReleaseOperation(errors, operation, path) {
  if (!isPlainObject(operation)) {
    errors.push(`${path} must be an object`);
    return;
  }

  rejectExtraFields(errors, path, operation, RELEASE_OPERATION_ALLOWED_FIELDS);
  expectSet(errors, RELEASE_OPERATION_STATE_SET, operation.state, `${path}.state`);
  expectSet(errors, COMMAND_RESULT_STATUS_SET, operation.commandResult, `${path}.commandResult`);
  expectBoolean(errors, operation.copyOnly, true, `${path}.copyOnly`);
  expectBoolean(errors, operation.willMutate, false, `${path}.willMutate`);
  if (operation.sourceRef !== null) {
    validateSourceRef(errors, operation.sourceRef, `${path}.sourceRef`);
  }
}

function validateSafety(errors, safety) {
  if (!isPlainObject(safety)) {
    errors.push('safety must be an object');
    return;
  }

  rejectExtraFields(errors, 'safety', safety, SAFETY_ALLOWED_FIELDS);
  for (const key of SAFETY_OBSERVED_FIELDS) {
    expectBoolean(errors, safety[key], null, `safety.${key}`);
  }
  validateReasonArray(errors, safety.blockedReasons, 'safety.blockedReasons');
}

function validateBoundaries(errors, boundaries) {
  if (!isPlainObject(boundaries)) {
    errors.push('boundaries must be an object');
    return;
  }

  rejectExtraFields(errors, 'boundaries', boundaries, new Set(Object.keys(STABLE_WORKBENCH_RELEASE_BOUNDARIES)));

  for (const [key, expected] of Object.entries(STABLE_WORKBENCH_RELEASE_BOUNDARIES)) {
    expectBoolean(errors, boundaries[key], expected, `boundaries.${key}`);
  }
}

function validateSourceRefs(errors, refs, path) {
  if (!Array.isArray(refs)) {
    errors.push(`${path} must be an array`);
    return;
  }

  refs.forEach((ref, index) => validateSourceRef(errors, ref, `${path}[${index}]`));
}

function validateSourceRef(errors, ref, path) {
  if (!isPlainObject(ref)) {
    errors.push(`${path} must be an object`);
    return;
  }

  rejectExtraFields(errors, path, ref, SOURCE_REF_ALLOWED_FIELDS);
  expectSet(errors, SOURCE_REF_KIND_SET, ref.kind, `${path}.kind`);
  validateNonEmptyString(errors, ref.ref, `${path}.ref`);
  validateNonEmptyString(errors, ref.label, `${path}.label`);
  if (ref.generatedAt !== undefined) {
    validateGeneratedAt(errors, ref.generatedAt, `${path}.generatedAt`);
  }
}

function validateEvidenceRefs(errors, refs, path) {
  if (!Array.isArray(refs)) {
    errors.push(`${path} must be an array`);
    return;
  }

  refs.forEach((ref, index) => {
    const refPath = `${path}[${index}]`;
    if (!isPlainObject(ref)) {
      errors.push(`${refPath} must be an object`);
      return;
    }

    rejectExtraFields(errors, refPath, ref, EVIDENCE_REF_ALLOWED_FIELDS);
    expectSet(errors, EVIDENCE_REF_KIND_SET, ref.kind, `${refPath}.kind`);
    validateNonEmptyString(errors, ref.ref, `${refPath}.ref`);
    validateNonEmptyString(errors, ref.label, `${refPath}.label`);
  });
}

function releaseBoundaryDriftObserved(releaseBoundary) {
  if (!isPlainObject(releaseBoundary)) {
    return true;
  }

  if (releaseBoundary.manualControllerActionRequired === false || releaseBoundary.automationObserved === true) {
    return true;
  }

  return REQUIRED_RELEASE_OPERATIONS.some((operationName) => {
    const operation = releaseBoundary[operationName];
    return !isPlainObject(operation) ||
      operation.state !== 'manual-controller-action' ||
      operation.commandResult !== 'not-run-by-product-code' ||
      operation.copyOnly !== true ||
      operation.willMutate !== false;
  });
}

function unsupportedProviderClaimObserved(providerBoundary) {
  if (!isPlainObject(providerBoundary)) {
    return true;
  }

  if (providerBoundary.rawProviderCliEvidenceAllowed === true) {
    return true;
  }

  const activeClaims = Array.isArray(providerBoundary.activeWorkbenchProviderClaims)
    ? providerBoundary.activeWorkbenchProviderClaims
    : [];
  const unsupportedClaims = Array.isArray(providerBoundary.unsupportedProviderClaims)
    ? providerBoundary.unsupportedProviderClaims
    : [];

  return activeClaims.some((claim) => {
    if (!isPlainObject(claim)) {
      return true;
    }

    const provider = String(claim.provider ?? '').toLowerCase();
    const claimName = String(claim.claim ?? '').toLowerCase();
    const status = String(claim.status ?? '').toLowerCase();
    return provider !== ALLOWED_ACTIVE_PROVIDER_CLAIM.provider ||
      claimName !== ALLOWED_ACTIVE_PROVIDER_CLAIM.claim ||
      status !== ALLOWED_ACTIVE_PROVIDER_CLAIM.status;
  }) || unsupportedClaims.some((claim) => {
    if (!isPlainObject(claim)) {
      return true;
    }

    const status = String(claim.status ?? '').toLowerCase();
    return status === 'tested-preview' || status === 'optional-smoke';
  });
}

function rawOrLocalExposureObserved(safety) {
  if (!isPlainObject(safety)) {
    return true;
  }

  return [
    'rawTranscriptObserved',
    'rawModelOutputObserved',
    'frontendLocalJsonlReadObserved',
    'frontendLocalSessionReadObserved',
    'frontendProviderFolderReadObserved'
  ].some((key) => safety[key] === true);
}

function commandExecutionObserved(safety) {
  if (!isPlainObject(safety)) {
    return true;
  }

  return [
    'rendererCommandExecutionObserved',
    'genericShellObserved',
    'genericTerminalObserved'
  ].some((key) => safety[key] === true);
}

function directMutationObserved(safety) {
  if (!isPlainObject(safety)) {
    return true;
  }

  return [
    'directGoalEventAppendObserved',
    'directTaskCompletionObserved'
  ].some((key) => safety[key] === true);
}

function automaticWorkflowObserved(safety) {
  if (!isPlainObject(safety)) {
    return true;
  }

  return [
    'automaticWorktreeCreationObserved',
    'automaticNextVersionGoalObserved'
  ].some((key) => safety[key] === true);
}

function providerClaimsFrom(claims) {
  if (!Array.isArray(claims)) {
    return [];
  }

  return claims.map((claim) => {
    const source = isPlainObject(claim) ? claim : {};
    return {
      provider: nonEmptyString(source.provider, 'unsupported-provider'),
      claim: nonEmptyString(source.claim, 'unsupported-provider-claim'),
      status: PROVIDER_STATUS_SET.has(source.status) ? source.status : 'blocked',
      sourceContract: nonEmptyString(source.sourceContract, null),
      sourceRef: source.sourceRef === null ? null : sourceRefFrom(source.sourceRef, null),
      blockedReasons: safeStringArray(source.blockedReasons)
    };
  });
}

function sourceRefsFrom(refs) {
  if (!Array.isArray(refs)) {
    return [];
  }

  return refs.map((ref) => sourceRefFrom(ref)).filter(Boolean);
}

function sourceRefFrom(ref, fallback = null) {
  const source = isPlainObject(ref) ? ref : fallback;

  if (!isPlainObject(source)) {
    return null;
  }

  const out = {
    kind: SOURCE_REF_KIND_SET.has(source.kind) ? source.kind : 'repo-doc',
    ref: nonEmptyString(source.ref, 'unknown-ref'),
    label: nonEmptyString(source.label, 'source ref')
  };

  if (source.generatedAt !== undefined) {
    out.generatedAt = new Date(millisOrNow(source.generatedAt)).toISOString();
  }

  return out;
}

function evidenceRefsFrom(refs) {
  if (!Array.isArray(refs)) {
    return [];
  }

  return refs.map((ref) => {
    const source = isPlainObject(ref) ? ref : {};
    return {
      kind: EVIDENCE_REF_KIND_SET.has(source.kind) ? source.kind : 'repo-doc',
      ref: nonEmptyString(source.ref, 'unknown-ref'),
      label: nonEmptyString(source.label, 'evidence ref')
    };
  });
}

function labelForSurface(id) {
  const labels = {
    'project-entry': 'Project Entry',
    'goal-supervision': 'Goal Supervision',
    context: 'Context',
    'result-intake': 'Result Intake',
    'event-registration': 'Event Registration',
    'child-task-planning': 'Child Task Planning',
    'provider-execution': 'Provider Execution',
    'review-and-gates': 'Review and Gates',
    'thread-handoff': 'Thread Handoff',
    'release-closeout': 'Release Closeout',
    'release-publication': 'Release Publication Evidence',
    'release-boundary': 'Release Boundary'
  };

  return labels[id] ?? 'Stable Workbench Surface';
}

function sourceContractForSurface(id) {
  const contracts = {
    'project-entry': 'current-project-binding.v1',
    'goal-supervision': 'goal-supervisor-app-read-model.v1',
    context: 'contextAdvisory.v1',
    'result-intake': 'pendingResult.v1',
    'event-registration': 'supervisorEventRegistrationEligibility.v1',
    'child-task-planning': 'childDispatchPreview.v1',
    'provider-execution': 'codexProviderExecutionPilot.v1',
    'review-and-gates': 'reviewGateWorkbenchSurface.v1',
    'thread-handoff': 'threadContinuationReviewerHandoffPack.v1',
    'release-closeout': 'releaseCloseoutHandoffPack.v1',
    'release-publication': 'releasePublicationEvidence.v1',
    'release-boundary': 'tagReleaseOperatorChecklist.v1'
  };

  return contracts[id] ?? null;
}

function copyOnlySurface(id) {
  return new Set([
    'context',
    'child-task-planning',
    'thread-handoff',
    'release-closeout',
    'release-publication',
    'release-boundary'
  ]).has(id);
}

function validateNoUnsafeFields(errors, value, path) {
  for (const unsafeField of findUnsafeFields(value, path)) {
    errors.push(`${unsafeField} must not contain raw provider output, local session refs, or mutation routes`);
  }
}

function findUnsafeFields(value, path = 'value', results = []) {
  if (Array.isArray(value)) {
    value.forEach((entry, index) => findUnsafeFields(entry, `${path}[${index}]`, results));
    return results;
  }

  if (typeof value === 'string') {
    if (path.includes('.blockedReasons[') && SAFE_TOKEN_PATTERN.test(value)) {
      return results;
    }

    if (UNSAFE_REF_PATTERN.test(value)) {
      results.push(path);
    }
    return results;
  }

  if (!isPlainObject(value)) {
    return results;
  }

  for (const [key, entry] of Object.entries(value)) {
    const nextPath = `${path}.${key}`;

    if (UNSAFE_FIELD_NAME_PATTERN.test(key)) {
      results.push(nextPath);
      continue;
    }

    if (typeof entry === 'string' || isPlainObject(entry) || Array.isArray(entry)) {
      findUnsafeFields(entry, nextPath, results);
    }
  }

  return results;
}

function rejectExtraFields(errors, path, object, allowedFields) {
  for (const key of Object.keys(object)) {
    if (!allowedFields.has(key)) {
      errors.push(`${path}.${key} is not allowed`);
    }
  }
}

function expectEqual(errors, actual, expected, path) {
  if (actual !== expected) {
    errors.push(`${path} must be ${JSON.stringify(expected)}`);
  }
}

function expectSet(errors, set, actual, path) {
  if (!set.has(actual)) {
    errors.push(`${path} must be one of ${JSON.stringify([...set])}`);
  }
}

function expectBoolean(errors, actual, expected, path) {
  if (typeof actual !== 'boolean') {
    errors.push(`${path} must be boolean`);
    return;
  }

  if (expected !== null && actual !== expected) {
    errors.push(`${path} must be ${expected}`);
  }
}

function validateGeneratedAt(errors, value, path) {
  if (typeof value !== 'string' || Number.isNaN(Date.parse(value))) {
    errors.push(`${path} must be an ISO date string`);
  }
}

function validateNonEmptyString(errors, value, path) {
  if (typeof value !== 'string' || value.trim() === '') {
    errors.push(`${path} must be a non-empty string`);
  }
}

function validateSafeToken(errors, value, path) {
  validateNonEmptyString(errors, value, path);
  validatePattern(errors, SAFE_TOKEN_PATTERN, value, path);
}

function validatePattern(errors, pattern, value, path) {
  if (typeof value !== 'string' || !pattern.test(value)) {
    errors.push(`${path} must match ${String(pattern)}`);
  }
}

function validateStringArray(errors, value, path) {
  if (!Array.isArray(value)) {
    errors.push(`${path} must be an array`);
    return;
  }

  value.forEach((entry, index) => validateNonEmptyString(errors, entry, `${path}[${index}]`));
}

function validateReasonArray(errors, value, path) {
  if (!Array.isArray(value)) {
    errors.push(`${path} must be an array`);
    return;
  }

  value.forEach((entry, index) => validateSafeToken(errors, entry, `${path}[${index}]`));
}

function safeStringArray(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((entry) => typeof entry === 'string' && entry.trim() !== '');
}

function uniqueStrings(values) {
  return [...new Set(values.filter((value) => typeof value === 'string' && value.trim() !== ''))];
}

function sameStringArray(left, right) {
  if (!Array.isArray(left) || !Array.isArray(right) || left.length !== right.length) {
    return false;
  }

  return left.every((value, index) => value === right[index]);
}

function nonEmptyString(value, fallback) {
  return typeof value === 'string' && value.trim() !== '' ? value : fallback;
}

function millisOrNow(value) {
  const time = Date.parse(value);
  return Number.isNaN(time) ? Date.now() : time;
}

function cloneObject(value) {
  return JSON.parse(JSON.stringify(value));
}

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}
