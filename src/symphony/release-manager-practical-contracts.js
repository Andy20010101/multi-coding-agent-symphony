export const RELEASE_MANAGER_READINESS_CONTRACT_NAME = 'releaseManagerReadiness.v1';
export const RELEASE_MANAGER_PRACTICAL_CONTRACT_VERSION = 1;

export const RELEASE_MANAGER_PRACTICAL_BOUNDARIES = Object.freeze({
  readOnly: true,
  willMutate: false,
  shellAvailable: false,
  arbitraryCommandExecutionAvailable: false,
  rendererLocalFileReadAvailable: false,
  providerSessionReadAvailable: false,
  rawTranscriptAvailable: false,
  releaseReadyInferenceFromTestsAvailable: false,
  gitMergeAvailable: false,
  gitTagAvailable: false,
  gitPushAvailable: false,
  githubReleaseCreateAvailable: false,
  githubReleaseEditAvailable: false,
  githubReleaseUploadAvailable: false,
  automaticSelfReviewAvailable: false,
  automaticWorktreeCreationAvailable: false,
  automaticNextVersionGoalAvailable: false
});

const READINESS_ALLOWED_FIELDS = new Set([
  'contractName',
  'contractVersion',
  'generatedAt',
  'state',
  'version',
  'targetTag',
  'releaseTitle',
  'targetCommit',
  'releaseBaseline',
  'requiredGates',
  'releaseEvidenceRefs',
  'releaseNotesDraft',
  'tagState',
  'githubReleaseState',
  'assetPolicy',
  'blockedReasons',
  'boundaries',
  'readOnly',
  'willMutate'
]);
const BASELINE_ALLOWED_FIELDS = new Set([
  'state',
  'currentBranch',
  'currentHead',
  'mainHead',
  'originMainHead',
  'clean',
  'openPrs',
  'sourceRef',
  'blockedReasons'
]);
const OPEN_PR_ALLOWED_FIELDS = new Set(['number', 'title', 'headRefName', 'baseRefName', 'url', 'isDraft']);
const GATE_ALLOWED_FIELDS = new Set(['gateName', 'state', 'required', 'evidenceRefs', 'blockedReasons']);
const EVIDENCE_REF_ALLOWED_FIELDS = new Set(['kind', 'ref', 'label', 'generatedAt']);
const NOTES_ALLOWED_FIELDS = new Set(['state', 'title', 'body', 'sourceRefs', 'blockedReasons']);
const TAG_STATE_ALLOWED_FIELDS = new Set([
  'state',
  'tagName',
  'exists',
  'tagObjectSha',
  'dereferencedCommit',
  'annotated',
  'matchesTarget',
  'sourceRefs',
  'blockedReasons'
]);
const GITHUB_RELEASE_STATE_ALLOWED_FIELDS = new Set([
  'state',
  'tagName',
  'exists',
  'name',
  'url',
  'isDraft',
  'isPrerelease',
  'publishedAt',
  'targetCommitish',
  'targetCommitMatches',
  'assets',
  'sourceRefs',
  'blockedReasons'
]);
const ASSET_POLICY_ALLOWED_FIELDS = new Set(['state', 'expected', 'actualAssets', 'blockedReasons']);
const RELEASE_ASSET_ALLOWED_FIELDS = new Set(['name', 'label', 'url', 'size']);

const STATE_SET = new Set(['ready', 'blocked']);
const SUBSTATE_SET = new Set(['ready', 'blocked', 'missing']);
const GATE_STATE_SET = new Set(['ready', 'blocked', 'missing']);
const SOURCE_REF_KIND_SET = new Set([
  'repo-doc',
  'artifact-ref',
  'command-evidence',
  'commit',
  'branch',
  'git-ref',
  'github-pr',
  'github-release',
  'release-url',
  'gate'
]);
const CONTRACT_NAME_PATTERN = /^[a-z][a-zA-Z0-9-]*(?:\.[a-zA-Z0-9-]+)*\.v[0-9]+$/u;
const COMMIT_PATTERN = /^[a-f0-9]{7,64}$/u;
const SAFE_TAG_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9._-]*$/u;
const SAFE_VERSION_PATTERN = /^v[0-9][a-zA-Z0-9._-]*$/u;
const RAW_FIELD_NAME_PATTERN =
  /^(?:rawTranscript|transcript|rawModelOutput|rawOutput|providerOutput|providerPayload|sessionLog|sessionPath|messages|conversation|goalLedgerInternals|executableCommand|shellCommand|commandLine)$/iu;
const UNSAFE_TEXT_PATTERN =
  /\b(?:raw[\s_-]*(?:transcript|model[\s_-]*output)|provider[\s_-]*(?:output|session|payload)|session[\s_-]*(?:log|file|path)|local[\s_-]*(?:jsonl|session)|goal[\s_-]*ledger(?:[\s_-]*internals?)?)\b|(?:^|[/.])(?:\.codex|\.claude|\.git|\.symphony)(?:[/]|$)|\/Users\/|\.jsonl(?:$|[/\s])|\b(?:append\s+event\s+directly|mark\s+complete|declare\s+release\s+ready|release-ready\s+declaration|run\s+tag|push\s+tag|git\s+(?:merge|push|tag)|gh\s+release\s+(?:create|edit|upload|delete)|create\s+github\s+release|edit\s+github\s+release|publish\s+release|run\s+shell|terminal|launch\s+provider|create\s+next\s+goal)\b/iu;

export class ReleaseManagerPracticalContractError extends Error {
  constructor(code, message, details = {}) {
    super(message);
    this.name = 'ReleaseManagerPracticalContractError';
    this.code = code;
    this.details = details;
  }
}

export function buildReleaseManagerReadiness({
  generatedAt = new Date().toISOString(),
  version = 'v70',
  targetTag = version,
  releaseTitle = null,
  targetCommit = null,
  releaseBaseline = null,
  openPrs = [],
  requiredGates = [],
  releaseEvidenceRefs = [],
  releaseNotesDraft = null,
  tagEvidence = null,
  githubRelease = null,
  blockedReasons: inputBlockedReasons = []
} = {}) {
  const unsafeSourceField = findUnsafeFields({
    version,
    targetTag,
    releaseTitle,
    targetCommit,
    releaseBaseline,
    openPrs,
    requiredGates,
    releaseEvidenceRefs,
    releaseNotesDraft,
    tagEvidence,
    githubRelease,
    inputBlockedReasons
  }, 'source')[0];

  if (unsafeSourceField !== undefined) {
    throw new ReleaseManagerPracticalContractError(
      'unsafe-release-manager-readiness-source',
      'Release manager readiness source contains raw provider output, local session refs, shell commands, or mutation routes.',
      { reason: `${unsafeSourceField} must not contain raw provider output, local session refs, shell commands, or mutation routes` }
    );
  }

  const normalizedGeneratedAt = toIso(generatedAt);
  const normalizedBaseline = releaseBaselineFrom(releaseBaseline, openPrs);
  const normalizedTargetCommit = firstNonEmptyString(
    targetCommit,
    normalizedBaseline.currentHead,
    normalizedBaseline.mainHead,
    normalizedBaseline.originMainHead
  );
  const normalizedGates = gatesFrom(requiredGates);
  const normalizedEvidenceRefs = evidenceRefsFrom(releaseEvidenceRefs);
  const normalizedNotes = releaseNotesDraftFrom(releaseNotesDraft);
  const normalizedTagState = tagStateFrom({
    generatedAt: normalizedGeneratedAt,
    tagName: targetTag,
    tagEvidence,
    targetCommit: normalizedTargetCommit
  });
  const normalizedGithubReleaseState = githubReleaseStateFrom({
    tagName: targetTag,
    githubRelease,
    targetCommit: normalizedTargetCommit,
    mainHead: normalizedBaseline.mainHead,
    originMainHead: normalizedBaseline.originMainHead
  });
  const normalizedAssetPolicy = assetPolicyFrom(normalizedGithubReleaseState.assets);
  const gateBlockedReasons = normalizedGates.flatMap((gate) => gate.blockedReasons);
  const derivedBlockedReasons = uniqueStrings([
    ...safeStringArray(inputBlockedReasons),
    ...safeStringArray(normalizedBaseline.blockedReasons),
    ...gateBlockedReasons,
    ...(normalizedGates.length === 0 ? ['missing-required-gates'] : []),
    ...(normalizedEvidenceRefs.length === 0 ? ['missing-release-evidence-refs'] : []),
    ...safeStringArray(normalizedNotes.blockedReasons),
    ...(normalizedTargetCommit === null ? ['missing-target-commit'] : []),
    ...safeStringArray(normalizedTagState.blockedReasons),
    ...safeStringArray(normalizedGithubReleaseState.blockedReasons),
    ...safeStringArray(normalizedAssetPolicy.blockedReasons)
  ]);
  const state = derivedBlockedReasons.length === 0 ? 'ready' : 'blocked';

  return {
    contractName: RELEASE_MANAGER_READINESS_CONTRACT_NAME,
    contractVersion: RELEASE_MANAGER_PRACTICAL_CONTRACT_VERSION,
    generatedAt: normalizedGeneratedAt,
    state,
    version,
    targetTag,
    releaseTitle: firstNonEmptyString(releaseTitle, `${targetTag} release`),
    targetCommit: normalizedTargetCommit,
    releaseBaseline: normalizedBaseline,
    requiredGates: normalizedGates,
    releaseEvidenceRefs: normalizedEvidenceRefs,
    releaseNotesDraft: normalizedNotes,
    tagState: normalizedTagState,
    githubReleaseState: normalizedGithubReleaseState,
    assetPolicy: normalizedAssetPolicy,
    blockedReasons: derivedBlockedReasons,
    boundaries: RELEASE_MANAGER_PRACTICAL_BOUNDARIES,
    readOnly: true,
    willMutate: false
  };
}

export function assertReleaseManagerReadinessContract(readiness) {
  const validation = validateReleaseManagerReadinessContract(readiness);

  if (!validation.ok) {
    throw new ReleaseManagerPracticalContractError(
      'invalid-release-manager-readiness',
      'Release manager readiness contract is invalid.',
      { errors: validation.errors }
    );
  }

  return readiness;
}

export function validateReleaseManagerReadinessContract(readiness) {
  const errors = [];

  if (!isObject(readiness)) {
    return { ok: false, errors: ['readiness must be an object'] };
  }

  assertAllowedFields(errors, readiness, READINESS_ALLOWED_FIELDS, 'readiness');
  requireEqual(errors, readiness.contractName, RELEASE_MANAGER_READINESS_CONTRACT_NAME, 'contractName');
  requireEqual(errors, readiness.contractVersion, RELEASE_MANAGER_PRACTICAL_CONTRACT_VERSION, 'contractVersion');
  validateIsoDate(errors, readiness.generatedAt, 'generatedAt');
  requireSet(errors, readiness.state, STATE_SET, 'state');
  requirePattern(errors, readiness.version, SAFE_VERSION_PATTERN, 'version');
  requirePattern(errors, readiness.targetTag, SAFE_TAG_PATTERN, 'targetTag');
  requireNonEmptyString(errors, readiness.releaseTitle, 'releaseTitle');
  validateNullablePattern(errors, readiness.targetCommit, COMMIT_PATTERN, 'targetCommit');
  validateReleaseBaseline(errors, readiness.releaseBaseline, 'releaseBaseline');
  validateGates(errors, readiness.requiredGates, 'requiredGates');
  validateEvidenceRefs(errors, readiness.releaseEvidenceRefs, 'releaseEvidenceRefs');
  validateReleaseNotesDraft(errors, readiness.releaseNotesDraft, 'releaseNotesDraft');
  validateTagState(errors, readiness.tagState, 'tagState');
  validateGithubReleaseState(errors, readiness.githubReleaseState, 'githubReleaseState');
  validateAssetPolicy(errors, readiness.assetPolicy, 'assetPolicy');
  validateTextItems(errors, readiness.blockedReasons, 'blockedReasons');
  validateBoundaries(errors, readiness.boundaries, 'boundaries');
  requireEqual(errors, readiness.readOnly, true, 'readOnly');
  requireEqual(errors, readiness.willMutate, false, 'willMutate');

  for (const unsafeField of findUnsafeFields(readiness, 'readiness')) {
    errors.push(`${unsafeField} must not expose raw provider output, local session refs, shell commands, or mutation routes`);
  }

  if (readiness.state === 'ready' && Array.isArray(readiness.blockedReasons) && readiness.blockedReasons.length > 0) {
    errors.push('ready readiness must not include blockedReasons');
  }

  return { ok: errors.length === 0, errors };
}

function releaseBaselineFrom(releaseBaseline, openPrs) {
  const source = isObject(releaseBaseline) ? releaseBaseline : {};
  const currentBranch = firstNonEmptyString(source.currentBranch, source.branch, null);
  const currentHead = firstNonEmptyString(source.currentHead, source.currentHeadFull, null);
  const mainHead = firstNonEmptyString(source.mainHead, null);
  const originMainHead = firstNonEmptyString(source.originMainHead, null);
  const normalizedOpenPrs = openPrsFrom(firstNonEmptyArray(source.openPrs, openPrs));
  const clean = typeof source.clean === 'boolean' ? source.clean : source.worktreeClean;
  const blockedReasons = uniqueStrings([
    ...(currentBranch !== 'main' ? ['release-baseline-not-main'] : []),
    ...(clean !== true ? ['release-baseline-dirty'] : []),
    ...(mainHead !== null && originMainHead !== null && mainHead !== originMainHead ? ['main-origin-diverged'] : []),
    ...(currentHead !== null && originMainHead !== null && currentHead !== originMainHead ? ['current-head-not-origin-main'] : []),
    ...(normalizedOpenPrs.length > 0 ? ['open-prs-present'] : []),
    ...safeStringArray(source.blockedReasons)
  ]);

  return {
    state: blockedReasons.length === 0 ? 'ready' : 'blocked',
    currentBranch,
    currentHead,
    mainHead,
    originMainHead,
    clean: clean === true,
    openPrs: normalizedOpenPrs,
    sourceRef: sourceRefFrom(source.sourceRef),
    blockedReasons
  };
}

function gatesFrom(requiredGates) {
  if (!Array.isArray(requiredGates)) {
    return [];
  }

  return requiredGates.map((gate) => {
    const candidate = isObject(gate) ? gate : {};
    const evidenceRefs = evidenceRefsFrom(candidate.evidenceRefs);
    const gateName = firstNonEmptyString(candidate.gateName, candidate.name, null);
    const inputState = firstNonEmptyString(candidate.state, null);
    const blockedReasons = uniqueStrings([
      ...(gateName === null ? ['missing-gate-name'] : []),
      ...(candidate.required === false ? [] : evidenceRefs.length === 0 ? ['missing-gate-evidence'] : []),
      ...(inputState !== null && inputState !== 'ready' ? [`gate-${inputState}`] : []),
      ...safeStringArray(candidate.blockedReasons)
    ]);

    return {
      gateName,
      state: blockedReasons.length === 0 ? 'ready' : 'blocked',
      required: candidate.required !== false,
      evidenceRefs,
      blockedReasons
    };
  });
}

function releaseNotesDraftFrom(releaseNotesDraft) {
  const source = isObject(releaseNotesDraft) ? releaseNotesDraft : {};
  const title = firstNonEmptyString(source.title, null);
  const body = firstNonEmptyString(source.body, source.notes, null);
  const sourceRefs = evidenceRefsFrom(source.sourceRefs);
  const blockedReasons = uniqueStrings([
    ...(title === null ? ['missing-release-notes-title'] : []),
    ...(body === null ? ['missing-release-notes-body'] : []),
    ...(sourceRefs.length === 0 ? ['missing-release-notes-source-ref'] : []),
    ...safeStringArray(source.blockedReasons)
  ]);

  return {
    state: blockedReasons.length === 0 ? 'ready' : 'blocked',
    title,
    body,
    sourceRefs,
    blockedReasons
  };
}

function tagStateFrom({ tagName, tagEvidence, targetCommit }) {
  const source = isObject(tagEvidence) ? tagEvidence : {};
  const exists = Boolean(source.exists);
  const tagObjectSha = firstNonEmptyString(source.tagObjectSha, source.objectSha, source.tagSha, null);
  const dereferencedCommit = firstNonEmptyString(source.dereferencedCommit, source.targetCommit, source.commit, null);
  const annotated = exists ? Boolean(source.annotated) : false;
  const matchesTarget = exists && targetCommit !== null && dereferencedCommit !== null
    ? targetCommit === dereferencedCommit
    : exists === false;
  const blockedReasons = uniqueStrings([
    ...(exists && tagObjectSha === null ? ['missing-tag-object-sha'] : []),
    ...(exists && dereferencedCommit === null ? ['missing-tag-dereferenced-commit'] : []),
    ...(exists && annotated !== true ? ['tag-not-annotated'] : []),
    ...(exists && targetCommit !== null && dereferencedCommit !== null && targetCommit !== dereferencedCommit ? ['tag-target-mismatch'] : []),
    ...safeStringArray(source.blockedReasons)
  ]);

  return {
    state: blockedReasons.length === 0 ? 'ready' : 'blocked',
    tagName: firstNonEmptyString(source.tagName, tagName),
    exists,
    tagObjectSha,
    dereferencedCommit,
    annotated,
    matchesTarget,
    sourceRefs: evidenceRefsFrom(source.sourceRefs),
    blockedReasons
  };
}

function githubReleaseStateFrom({ tagName, githubRelease, targetCommit, mainHead, originMainHead }) {
  const source = isObject(githubRelease) ? githubRelease : {};
  const exists = Boolean(source.exists);
  const targetCommitish = firstNonEmptyString(source.targetCommitish, source.targetCommit, null);
  const assets = assetsFrom(source.assets);
  const isDraft = Boolean(source.isDraft);
  const isPrerelease = Boolean(source.isPrerelease);
  const targetCommitMatches = exists
    ? releaseTargetMatches({ targetCommitish, targetCommit, mainHead, originMainHead })
    : true;
  const blockedReasons = uniqueStrings([
    ...(exists && firstNonEmptyString(source.url, null) === null ? ['missing-github-release-url'] : []),
    ...(exists && isDraft ? ['github-release-is-draft'] : []),
    ...(exists && isPrerelease ? ['github-release-is-prerelease'] : []),
    ...(exists && assets.length > 0 ? ['unexpected-release-assets'] : []),
    ...(exists && targetCommitish !== null && !targetCommitMatches ? ['github-release-target-mismatch'] : []),
    ...safeStringArray(source.blockedReasons)
  ]);

  return {
    state: blockedReasons.length === 0 ? 'ready' : 'blocked',
    tagName: firstNonEmptyString(source.tagName, tagName),
    exists,
    name: firstNonEmptyString(source.name, null),
    url: firstNonEmptyString(source.url, null),
    isDraft,
    isPrerelease,
    publishedAt: firstNonEmptyString(source.publishedAt, null),
    targetCommitish,
    targetCommitMatches,
    assets,
    sourceRefs: evidenceRefsFrom(source.sourceRefs),
    blockedReasons
  };
}

function assetPolicyFrom(actualAssets) {
  const assets = assetsFrom(actualAssets);
  const blockedReasons = assets.length === 0 ? [] : ['unexpected-release-assets'];

  return {
    state: blockedReasons.length === 0 ? 'ready' : 'blocked',
    expected: 'none',
    actualAssets: assets,
    blockedReasons
  };
}

function releaseTargetMatches({ targetCommitish, targetCommit, mainHead, originMainHead }) {
  if (targetCommitish === null || targetCommitish === undefined) {
    return true;
  }

  if (targetCommitish === targetCommit || targetCommitish === mainHead || targetCommitish === originMainHead) {
    return true;
  }

  return targetCommitish === 'main' && targetCommit !== null && originMainHead !== null && targetCommit === originMainHead;
}

function openPrsFrom(openPrs) {
  if (!Array.isArray(openPrs)) {
    return [];
  }

  return openPrs
    .filter((pr) => isObject(pr))
    .map((pr) => ({
      number: Number.isInteger(pr.number) ? pr.number : null,
      title: firstNonEmptyString(pr.title, null),
      headRefName: firstNonEmptyString(pr.headRefName, null),
      baseRefName: firstNonEmptyString(pr.baseRefName, null),
      url: firstNonEmptyString(pr.url, null),
      isDraft: Boolean(pr.isDraft)
    }));
}

function evidenceRefsFrom(refs) {
  if (!Array.isArray(refs)) {
    return [];
  }

  return refs
    .map((ref) => evidenceRefFrom(ref))
    .filter((ref) => ref !== null);
}

function evidenceRefFrom(ref) {
  if (typeof ref === 'string') {
    return {
      kind: 'repo-doc',
      ref,
      label: ref
    };
  }

  if (!isObject(ref)) {
    return null;
  }

  const normalizedRef = firstNonEmptyString(ref.ref, null);
  const kind = firstNonEmptyString(ref.kind, 'repo-doc');

  if (normalizedRef === null) {
    return null;
  }

  return {
    kind,
    ref: normalizedRef,
    label: firstNonEmptyString(ref.label, normalizedRef),
    ...(ref.generatedAt === undefined ? {} : { generatedAt: firstNonEmptyString(ref.generatedAt, null) })
  };
}

function sourceRefFrom(ref) {
  return evidenceRefFrom(ref);
}

function assetsFrom(assets) {
  if (!Array.isArray(assets)) {
    return [];
  }

  return assets
    .filter((asset) => isObject(asset))
    .map((asset) => ({
      name: firstNonEmptyString(asset.name, null),
      label: firstNonEmptyString(asset.label, null),
      url: firstNonEmptyString(asset.url, null),
      size: Number.isFinite(asset.size) ? asset.size : null
    }));
}

function validateReleaseBaseline(errors, baseline, path) {
  if (!isObject(baseline)) {
    errors.push(`${path} must be an object`);
    return;
  }

  assertAllowedFields(errors, baseline, BASELINE_ALLOWED_FIELDS, path);
  requireSet(errors, baseline.state, SUBSTATE_SET, `${path}.state`);
  validateNullableString(errors, baseline.currentBranch, `${path}.currentBranch`);
  validateNullablePattern(errors, baseline.currentHead, COMMIT_PATTERN, `${path}.currentHead`);
  validateNullablePattern(errors, baseline.mainHead, COMMIT_PATTERN, `${path}.mainHead`);
  validateNullablePattern(errors, baseline.originMainHead, COMMIT_PATTERN, `${path}.originMainHead`);
  requireType(errors, baseline.clean, 'boolean', `${path}.clean`);
  validateOpenPrs(errors, baseline.openPrs, `${path}.openPrs`);
  validateOptionalEvidenceRef(errors, baseline.sourceRef, `${path}.sourceRef`);
  validateTextItems(errors, baseline.blockedReasons, `${path}.blockedReasons`);
}

function validateOpenPrs(errors, openPrs, path) {
  if (!Array.isArray(openPrs)) {
    errors.push(`${path} must be an array`);
    return;
  }

  openPrs.forEach((pr, index) => {
    const itemPath = `${path}[${index}]`;

    if (!isObject(pr)) {
      errors.push(`${itemPath} must be an object`);
      return;
    }

    assertAllowedFields(errors, pr, OPEN_PR_ALLOWED_FIELDS, itemPath);
    if (pr.number !== null) {
      requireType(errors, pr.number, 'number', `${itemPath}.number`);
    }
    validateNullableString(errors, pr.title, `${itemPath}.title`);
    validateNullableString(errors, pr.headRefName, `${itemPath}.headRefName`);
    validateNullableString(errors, pr.baseRefName, `${itemPath}.baseRefName`);
    validateNullableString(errors, pr.url, `${itemPath}.url`);
    requireType(errors, pr.isDraft, 'boolean', `${itemPath}.isDraft`);
  });
}

function validateGates(errors, gates, path) {
  if (!Array.isArray(gates)) {
    errors.push(`${path} must be an array`);
    return;
  }

  gates.forEach((gate, index) => {
    const itemPath = `${path}[${index}]`;

    if (!isObject(gate)) {
      errors.push(`${itemPath} must be an object`);
      return;
    }

    assertAllowedFields(errors, gate, GATE_ALLOWED_FIELDS, itemPath);
    validateNullableString(errors, gate.gateName, `${itemPath}.gateName`);
    requireSet(errors, gate.state, GATE_STATE_SET, `${itemPath}.state`);
    requireType(errors, gate.required, 'boolean', `${itemPath}.required`);
    validateEvidenceRefs(errors, gate.evidenceRefs, `${itemPath}.evidenceRefs`);
    validateTextItems(errors, gate.blockedReasons, `${itemPath}.blockedReasons`);
  });
}

function validateReleaseNotesDraft(errors, notes, path) {
  if (!isObject(notes)) {
    errors.push(`${path} must be an object`);
    return;
  }

  assertAllowedFields(errors, notes, NOTES_ALLOWED_FIELDS, path);
  requireSet(errors, notes.state, SUBSTATE_SET, `${path}.state`);
  validateNullableString(errors, notes.title, `${path}.title`);
  validateNullableString(errors, notes.body, `${path}.body`);
  validateEvidenceRefs(errors, notes.sourceRefs, `${path}.sourceRefs`);
  validateTextItems(errors, notes.blockedReasons, `${path}.blockedReasons`);
}

function validateTagState(errors, tagState, path) {
  if (!isObject(tagState)) {
    errors.push(`${path} must be an object`);
    return;
  }

  assertAllowedFields(errors, tagState, TAG_STATE_ALLOWED_FIELDS, path);
  requireSet(errors, tagState.state, SUBSTATE_SET, `${path}.state`);
  requirePattern(errors, tagState.tagName, SAFE_TAG_PATTERN, `${path}.tagName`);
  requireType(errors, tagState.exists, 'boolean', `${path}.exists`);
  validateNullablePattern(errors, tagState.tagObjectSha, COMMIT_PATTERN, `${path}.tagObjectSha`);
  validateNullablePattern(errors, tagState.dereferencedCommit, COMMIT_PATTERN, `${path}.dereferencedCommit`);
  requireType(errors, tagState.annotated, 'boolean', `${path}.annotated`);
  requireType(errors, tagState.matchesTarget, 'boolean', `${path}.matchesTarget`);
  validateEvidenceRefs(errors, tagState.sourceRefs, `${path}.sourceRefs`);
  validateTextItems(errors, tagState.blockedReasons, `${path}.blockedReasons`);
}

function validateGithubReleaseState(errors, release, path) {
  if (!isObject(release)) {
    errors.push(`${path} must be an object`);
    return;
  }

  assertAllowedFields(errors, release, GITHUB_RELEASE_STATE_ALLOWED_FIELDS, path);
  requireSet(errors, release.state, SUBSTATE_SET, `${path}.state`);
  requirePattern(errors, release.tagName, SAFE_TAG_PATTERN, `${path}.tagName`);
  requireType(errors, release.exists, 'boolean', `${path}.exists`);
  validateNullableString(errors, release.name, `${path}.name`);
  validateNullableString(errors, release.url, `${path}.url`);
  requireType(errors, release.isDraft, 'boolean', `${path}.isDraft`);
  requireType(errors, release.isPrerelease, 'boolean', `${path}.isPrerelease`);
  if (release.publishedAt !== null) {
    validateIsoDate(errors, release.publishedAt, `${path}.publishedAt`);
  }
  validateNullableString(errors, release.targetCommitish, `${path}.targetCommitish`);
  requireType(errors, release.targetCommitMatches, 'boolean', `${path}.targetCommitMatches`);
  validateAssets(errors, release.assets, `${path}.assets`);
  validateEvidenceRefs(errors, release.sourceRefs, `${path}.sourceRefs`);
  validateTextItems(errors, release.blockedReasons, `${path}.blockedReasons`);
}

function validateAssetPolicy(errors, policy, path) {
  if (!isObject(policy)) {
    errors.push(`${path} must be an object`);
    return;
  }

  assertAllowedFields(errors, policy, ASSET_POLICY_ALLOWED_FIELDS, path);
  requireSet(errors, policy.state, SUBSTATE_SET, `${path}.state`);
  requireEqual(errors, policy.expected, 'none', `${path}.expected`);
  validateAssets(errors, policy.actualAssets, `${path}.actualAssets`);
  validateTextItems(errors, policy.blockedReasons, `${path}.blockedReasons`);
}

function validateAssets(errors, assets, path) {
  if (!Array.isArray(assets)) {
    errors.push(`${path} must be an array`);
    return;
  }

  assets.forEach((asset, index) => {
    const itemPath = `${path}[${index}]`;

    if (!isObject(asset)) {
      errors.push(`${itemPath} must be an object`);
      return;
    }

    assertAllowedFields(errors, asset, RELEASE_ASSET_ALLOWED_FIELDS, itemPath);
    validateNullableString(errors, asset.name, `${itemPath}.name`);
    validateNullableString(errors, asset.label, `${itemPath}.label`);
    validateNullableString(errors, asset.url, `${itemPath}.url`);
    if (asset.size !== null) {
      requireType(errors, asset.size, 'number', `${itemPath}.size`);
    }
  });
}

function validateEvidenceRefs(errors, refs, path) {
  if (!Array.isArray(refs)) {
    errors.push(`${path} must be an array`);
    return;
  }

  refs.forEach((ref, index) => validateEvidenceRef(errors, ref, `${path}[${index}]`));
}

function validateOptionalEvidenceRef(errors, ref, path) {
  if (ref === null || ref === undefined) {
    return;
  }

  validateEvidenceRef(errors, ref, path);
}

function validateEvidenceRef(errors, ref, path) {
  if (!isObject(ref)) {
    errors.push(`${path} must be an object`);
    return;
  }

  assertAllowedFields(errors, ref, EVIDENCE_REF_ALLOWED_FIELDS, path);
  requireSet(errors, ref.kind, SOURCE_REF_KIND_SET, `${path}.kind`);
  requireNonEmptyString(errors, ref.ref, `${path}.ref`);
  requireNonEmptyString(errors, ref.label, `${path}.label`);
  if (ref.generatedAt !== undefined && ref.generatedAt !== null) {
    validateIsoDate(errors, ref.generatedAt, `${path}.generatedAt`);
  }
}

function validateBoundaries(errors, boundaries, path) {
  if (!isObject(boundaries)) {
    errors.push(`${path} must be an object`);
    return;
  }

  assertAllowedFields(errors, boundaries, new Set(Object.keys(RELEASE_MANAGER_PRACTICAL_BOUNDARIES)), path);
  for (const [key, expected] of Object.entries(RELEASE_MANAGER_PRACTICAL_BOUNDARIES)) {
    requireEqual(errors, boundaries[key], expected, `${path}.${key}`);
  }
}

function validateTextItems(errors, items, path) {
  if (!Array.isArray(items)) {
    errors.push(`${path} must be an array`);
    return;
  }

  items.forEach((item, index) => {
    if (!isNonEmptyString(item)) {
      errors.push(`${path}[${index}] must be a non-empty string`);
    }
  });
}

function assertAllowedFields(errors, value, allowedFields, path) {
  for (const key of Object.keys(value ?? {})) {
    if (!allowedFields.has(key)) {
      errors.push(`${path}.${key} is not allowed`);
    }
  }
}

function requireEqual(errors, actual, expected, path) {
  if (actual !== expected) {
    errors.push(`${path} must be ${JSON.stringify(expected)}`);
  }
}

function requireSet(errors, value, allowed, path) {
  if (!allowed.has(value)) {
    errors.push(`${path} must be one of ${Array.from(allowed).join(', ')}`);
  }
}

function requireType(errors, value, type, path) {
  if (typeof value !== type) {
    errors.push(`${path} must be a ${type}`);
  }
}

function requireNonEmptyString(errors, value, path) {
  if (!isNonEmptyString(value)) {
    errors.push(`${path} must be a non-empty string`);
  }
}

function requirePattern(errors, value, pattern, path) {
  if (!isNonEmptyString(value) || !pattern.test(value)) {
    errors.push(`${path} is invalid`);
  }
}

function validateNullablePattern(errors, value, pattern, path) {
  if (value === null || value === undefined) {
    return;
  }

  if (!isNonEmptyString(value) || !pattern.test(value)) {
    errors.push(`${path} is invalid`);
  }
}

function validateNullableString(errors, value, path) {
  if (value === null || value === undefined) {
    return;
  }

  if (typeof value !== 'string') {
    errors.push(`${path} must be a string or null`);
  }
}

function validateIsoDate(errors, value, path) {
  if (!isNonEmptyString(value) || Number.isNaN(Date.parse(value))) {
    errors.push(`${path} must be an ISO date string`);
  }
}

function findUnsafeFields(value, path, seen = new Set()) {
  const unsafe = [];

  if (value === null || value === undefined) {
    return unsafe;
  }

  if (typeof value === 'string') {
    if (UNSAFE_TEXT_PATTERN.test(value)) {
      unsafe.push(path);
    }
    return unsafe;
  }

  if (typeof value !== 'object') {
    return unsafe;
  }

  if (seen.has(value)) {
    return unsafe;
  }
  seen.add(value);

  if (Array.isArray(value)) {
    value.forEach((item, index) => {
      unsafe.push(...findUnsafeFields(item, `${path}[${index}]`, seen));
    });
    return unsafe;
  }

  for (const [key, child] of Object.entries(value)) {
    const childPath = `${path}.${key}`;

    if (RAW_FIELD_NAME_PATTERN.test(key)) {
      unsafe.push(childPath);
      continue;
    }

    unsafe.push(...findUnsafeFields(child, childPath, seen));
  }

  return unsafe;
}

function safeStringArray(value) {
  return Array.isArray(value)
    ? value.filter((item) => isNonEmptyString(item))
    : [];
}

function firstNonEmptyString(...values) {
  for (const value of values) {
    if (isNonEmptyString(value)) {
      return value;
    }
  }
  return null;
}

function firstNonEmptyArray(...values) {
  for (const value of values) {
    if (Array.isArray(value) && value.length > 0) {
      return value;
    }
  }
  return [];
}

function uniqueStrings(values) {
  return Array.from(new Set(values.filter((value) => isNonEmptyString(value))));
}

function toIso(value) {
  const time = Date.parse(value);
  return new Date(Number.isNaN(time) ? Date.now() : time).toISOString();
}

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}
