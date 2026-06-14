export const RELEASE_PUBLICATION_EVIDENCE_CONTRACT_NAME = 'releasePublicationEvidence.v1';
export const TAG_PUBLICATION_EVIDENCE_CONTRACT_NAME = 'tagPublicationEvidence.v1';
export const GITHUB_RELEASE_PUBLICATION_EVIDENCE_CONTRACT_NAME = 'githubReleasePublicationEvidence.v1';
export const NEXT_VERSION_START_AUDIT_CONTRACT_NAME = 'nextVersionStartAudit.v1';
export const PUBLICATION_EVIDENCE_BOUNDARY_NOTICE_CONTRACT_NAME = 'publicationEvidenceBoundaryNotice.v1';
export const RELEASE_PUBLICATION_EVIDENCE_CONTRACT_VERSION = 1;

export const RELEASE_PUBLICATION_EVIDENCE_BOUNDARIES = Object.freeze({
  readOnly: true,
  willMutate: false,
  gitTagAvailable: false,
  gitPushAvailable: false,
  githubReleaseCreateAvailable: false,
  githubReleaseEditAvailable: false,
  releaseReadyDeclarationAvailable: false,
  providerLaunchAvailable: false,
  shellAvailable: false,
  directGoalEventAppendAvailable: false,
  directTaskCompleteAvailable: false,
  automaticWorktreeCreationAvailable: false,
  automaticNextVersionGoalAvailable: false
});

const PUBLICATION_ALLOWED_FIELDS = new Set([
  'contractName',
  'contractVersion',
  'generatedAt',
  'state',
  'goal',
  'sourceCloseoutHandoff',
  'tagEvidence',
  'githubReleaseEvidence',
  'targetCommit',
  'knownFacts',
  'blockedReasons',
  'nextVersionStartAudit',
  'publicationEvidenceBoundaryNotice',
  'boundaries',
  'readOnly',
  'willMutate'
]);
const GOAL_ALLOWED_FIELDS = new Set(['goalId', 'title', 'state', 'sourceContract', 'sourceRef']);
const CLOSEOUT_ALLOWED_FIELDS = new Set([
  'contractName',
  'state',
  'goalId',
  'releaseTag',
  'targetCommit',
  'sourceRef',
  'evidenceRefs',
  'blockedReasons'
]);
const TAG_ALLOWED_FIELDS = new Set([
  'contractName',
  'contractVersion',
  'generatedAt',
  'state',
  'tagName',
  'tagObjectSha',
  'dereferencedCommit',
  'targetCommit',
  'annotated',
  'sourceRefs',
  'rollbackRefs',
  'blockedReasons',
  'readOnly',
  'willMutate'
]);
const GITHUB_RELEASE_ALLOWED_FIELDS = new Set([
  'contractName',
  'contractVersion',
  'generatedAt',
  'state',
  'tagName',
  'name',
  'url',
  'isDraft',
  'isPrerelease',
  'publishedAt',
  'assets',
  'targetCommitish',
  'targetCommitMatches',
  'sourceRefs',
  'blockedReasons',
  'readOnly',
  'willMutate'
]);
const RELEASE_ASSET_ALLOWED_FIELDS = new Set(['name', 'label', 'url', 'size']);
const TARGET_COMMIT_ALLOWED_FIELDS = new Set([
  'state',
  'expectedCommit',
  'tagDereferencedCommit',
  'releaseTargetCommitish',
  'matchesTag',
  'matchesReleaseTarget',
  'blockedReasons'
]);
const NEXT_VERSION_AUDIT_ALLOWED_FIELDS = new Set([
  'contractName',
  'contractVersion',
  'generatedAt',
  'state',
  'currentVersion',
  'nextVersion',
  'nextRunbookRef',
  'releaseEvidenceCommit',
  'mainHead',
  'originMainHead',
  'openPrCount',
  'nextVersionGoalCreated',
  'startAllowed',
  'sourceRefs',
  'blockedReasons',
  'readOnly',
  'willMutate'
]);
const BOUNDARY_NOTICE_ALLOWED_FIELDS = new Set([
  'contractName',
  'contractVersion',
  'generatedAt',
  'message',
  'boundaries',
  'readOnly',
  'willMutate'
]);
const SOURCE_REF_ALLOWED_FIELDS = new Set(['kind', 'ref', 'label', 'generatedAt']);
const EVIDENCE_REF_ALLOWED_FIELDS = new Set(['kind', 'ref', 'label']);

const PUBLICATION_STATE_SET = new Set(['ready', 'blocked']);
const EVIDENCE_STATE_SET = new Set(['ready', 'blocked', 'missing']);
const GOAL_STATE_SET = new Set(['active', 'ready', 'blocked', 'pending', 'accepted', 'missing']);
const SOURCE_REF_KIND_SET = new Set([
  'contract',
  'repo-doc',
  'artifact-ref',
  'git-tag',
  'github-release',
  'release-url',
  'commit',
  'branch',
  'pr-list',
  'goal'
]);
const EVIDENCE_REF_KIND_SET = new Set(['repo-doc', 'artifact-ref', 'commit', 'git-tag', 'github-release', 'release-url']);
const CONTRACT_NAME_PATTERN = /^[a-z][a-zA-Z0-9-]*(?:\.[a-zA-Z0-9-]+)*\.v[0-9]+$/u;
const COMMIT_PATTERN = /^[a-f0-9]{7,64}$/u;
const SAFE_TAG_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9._-]*$/u;
const RAW_FIELD_NAME_PATTERN =
  /^(?:rawTranscript|transcript|rawModelOutput|rawOutput|providerOutput|providerPayload|sessionLog|sessionPath|messages|conversation|goalLedgerInternals|executableCommand|shellCommand|commandLine)$/iu;
const UNSAFE_TEXT_PATTERN =
  /\b(?:raw[\s_-]*(?:transcript|model[\s_-]*output)|provider[\s_-]*(?:output|session|payload)|session[\s_-]*(?:log|file|path)|local[\s_-]*(?:jsonl|session)|goal[\s_-]*ledger(?:[\s_-]*internals?)?)\b|(?:^|[/.])(?:\.codex|\.claude|\.git|\.symphony)(?:[/]|$)|\/Users\/|\.jsonl(?:$|[/\s])|\/(?:event-append|append-event|record-result|mark-complete|complete-task|git\/tag|git\/push|tag\/create|release\/create|release\/edit|publish|shell|terminal|provider-launch|create-next-goal)(?:$|[/\s])|\b(?:append\s+event\s+directly|mark\s+complete|declare\s+release\s+ready|release-ready\s+declaration|run\s+tag|push\s+tag|git\s+(?:push|tag)|gh\s+release\s+(?:create|edit|upload|delete)|create\s+github\s+release|edit\s+github\s+release|publish\s+release|run\s+shell|terminal|launch\s+provider|create\s+next\s+goal)\b/iu;

export class ReleasePublicationEvidenceContractError extends Error {
  constructor(code, message, details = {}) {
    super(message);
    this.name = 'ReleasePublicationEvidenceContractError';
    this.code = code;
    this.details = details;
  }
}

export function buildReleasePublicationEvidence({
  generatedAt = new Date().toISOString(),
  goal = null,
  sourceCloseoutHandoff = null,
  tagEvidence = null,
  githubReleaseEvidence = null,
  expectedTargetCommit = null,
  targetCommit = null,
  currentVersion = null,
  nextVersion = null,
  nextRunbookRef = null,
  mainHead = null,
  originMainHead = null,
  openPrs = [],
  nextVersionGoalCreated = false,
  knownFacts = [],
  rollbackRefs = [],
  sourceRefs = [],
  blockedReasons: inputBlockedReasons = []
} = {}) {
  const unsafeSourceField = findUnsafeFields({
    goal,
    sourceCloseoutHandoff,
    tagEvidence,
    githubReleaseEvidence,
    expectedTargetCommit,
    targetCommit,
    currentVersion,
    nextVersion,
    nextRunbookRef,
    mainHead,
    originMainHead,
    openPrs,
    knownFacts,
    rollbackRefs,
    sourceRefs,
    inputBlockedReasons
  }, 'source')[0];

  if (unsafeSourceField !== undefined) {
    throw new ReleasePublicationEvidenceContractError(
      'unsafe-release-publication-evidence-source',
      'Release publication evidence source contains raw provider output, local session refs, shell commands, or mutation routes.',
      { reason: `${unsafeSourceField} must not contain raw provider output, local session refs, shell commands, or mutation routes` }
    );
  }

  const normalizedGeneratedAt = new Date(millisOrNow(generatedAt)).toISOString();
  const normalizedGoal = goalForPublication(goal, sourceCloseoutHandoff);
  const sourceCloseout = sourceCloseoutFrom(sourceCloseoutHandoff);
  const expectedCommit = firstNonEmptyString(
    expectedTargetCommit,
    targetCommit,
    sourceCloseout.targetCommit,
    valueAt(tagEvidence, 'targetCommit'),
    valueAt(tagEvidence, 'dereferencedCommit')
  );
  const normalizedCurrentVersion = firstNonEmptyString(currentVersion, sourceCloseout.releaseTag, valueAt(tagEvidence, 'tagName'));
  const normalizedSourceRefs = sourceRefsFrom(sourceRefs);
  const normalizedRollbackRefs = evidenceRefsFrom(rollbackRefs);
  const tag = buildTagPublicationEvidence({
    generatedAt: normalizedGeneratedAt,
    tagEvidence,
    expectedTargetCommit: expectedCommit,
    sourceRefs: normalizedSourceRefs,
    rollbackRefs: normalizedRollbackRefs
  });
  const githubRelease = buildGithubReleasePublicationEvidence({
    generatedAt: normalizedGeneratedAt,
    githubReleaseEvidence,
    expectedTargetCommit: expectedCommit,
    tagName: tag.tagName,
    mainHead,
    originMainHead,
    sourceRefs: normalizedSourceRefs
  });
  const target = targetCommitCheckFrom({
    expectedCommit,
    tagEvidence: tag,
    githubReleaseEvidence: githubRelease,
    mainHead,
    originMainHead
  });
  const nextAudit = buildNextVersionStartAudit({
    generatedAt: normalizedGeneratedAt,
    currentVersion: normalizedCurrentVersion,
    nextVersion,
    nextRunbookRef,
    releaseEvidenceCommit: expectedCommit,
    mainHead,
    originMainHead,
    openPrs,
    nextVersionGoalCreated,
    sourceRefs: normalizedSourceRefs
  });

  const derivedBlockedReasons = uniqueStrings([
    ...safeStringArray(inputBlockedReasons),
    ...(sourceCloseout.state === 'ready' ? [] : ['source-closeout-handoff-not-ready']),
    ...safeStringArray(sourceCloseout.blockedReasons),
    ...safeStringArray(tag.blockedReasons),
    ...safeStringArray(githubRelease.blockedReasons),
    ...safeStringArray(target.blockedReasons),
    ...safeStringArray(nextAudit.blockedReasons)
  ]);
  const state = derivedBlockedReasons.length === 0 ? 'ready' : 'blocked';

  return {
    contractName: RELEASE_PUBLICATION_EVIDENCE_CONTRACT_NAME,
    contractVersion: RELEASE_PUBLICATION_EVIDENCE_CONTRACT_VERSION,
    generatedAt: normalizedGeneratedAt,
    state,
    goal: normalizedGoal,
    sourceCloseoutHandoff: sourceCloseout,
    tagEvidence: tag,
    githubReleaseEvidence: githubRelease,
    targetCommit: target,
    knownFacts: normalizeTextItems(knownFacts),
    blockedReasons: derivedBlockedReasons,
    nextVersionStartAudit: nextAudit,
    publicationEvidenceBoundaryNotice: buildPublicationEvidenceBoundaryNotice({
      generatedAt: normalizedGeneratedAt
    }),
    boundaries: RELEASE_PUBLICATION_EVIDENCE_BOUNDARIES,
    readOnly: true,
    willMutate: false
  };
}

export function buildTagPublicationEvidence({
  generatedAt = new Date().toISOString(),
  tagEvidence = null,
  expectedTargetCommit = null,
  sourceRefs = [],
  rollbackRefs = []
} = {}) {
  const normalizedGeneratedAt = new Date(millisOrNow(generatedAt)).toISOString();
  const tagName = firstNonEmptyString(valueAt(tagEvidence, 'tagName'), valueAt(tagEvidence, 'name'));
  const tagObjectSha = firstNonEmptyString(valueAt(tagEvidence, 'tagObjectSha'), valueAt(tagEvidence, 'objectSha'), valueAt(tagEvidence, 'tagSha'));
  const dereferencedCommit = firstNonEmptyString(valueAt(tagEvidence, 'dereferencedCommit'), valueAt(tagEvidence, 'targetCommit'), valueAt(tagEvidence, 'commit'));
  const target = firstNonEmptyString(expectedTargetCommit, valueAt(tagEvidence, 'targetCommit'), dereferencedCommit);
  const annotated = tagEvidence === null || tagEvidence === undefined
    ? false
    : Boolean(valueAt(tagEvidence, 'annotated', tagObjectSha !== null && tagObjectSha !== dereferencedCommit));
  const normalizedSourceRefs = sourceRefsFrom(firstNonEmptyArray(valueAt(tagEvidence, 'sourceRefs'), sourceRefs));
  const normalizedRollbackRefs = evidenceRefsFrom(firstNonEmptyArray(valueAt(tagEvidence, 'rollbackRefs'), rollbackRefs));
  const blockedReasons = uniqueStrings([
    ...safeStringArray(valueAt(tagEvidence, 'blockedReasons')),
    ...(tagName === null || tagObjectSha === null || dereferencedCommit === null ? ['missing-tag-evidence'] : []),
    ...(tagName !== null && !SAFE_TAG_PATTERN.test(tagName) ? ['invalid-tag-name'] : []),
    ...(tagObjectSha !== null && !COMMIT_PATTERN.test(tagObjectSha) ? ['invalid-tag-object-sha'] : []),
    ...(dereferencedCommit !== null && !COMMIT_PATTERN.test(dereferencedCommit) ? ['invalid-tag-dereferenced-commit'] : []),
    ...(target !== null && dereferencedCommit !== null && target !== dereferencedCommit ? ['tag-target-mismatch'] : []),
    ...(tagEvidence !== null && tagEvidence !== undefined && annotated !== true ? ['tag-not-annotated'] : [])
  ]);

  return {
    contractName: TAG_PUBLICATION_EVIDENCE_CONTRACT_NAME,
    contractVersion: RELEASE_PUBLICATION_EVIDENCE_CONTRACT_VERSION,
    generatedAt: normalizedGeneratedAt,
    state: blockedReasons.length === 0 ? 'ready' : 'blocked',
    tagName,
    tagObjectSha,
    dereferencedCommit,
    targetCommit: target,
    annotated,
    sourceRefs: normalizedSourceRefs,
    rollbackRefs: normalizedRollbackRefs,
    blockedReasons,
    readOnly: true,
    willMutate: false
  };
}

export function buildGithubReleasePublicationEvidence({
  generatedAt = new Date().toISOString(),
  githubReleaseEvidence = null,
  expectedTargetCommit = null,
  tagName = null,
  mainHead = null,
  originMainHead = null,
  sourceRefs = []
} = {}) {
  const normalizedGeneratedAt = new Date(millisOrNow(generatedAt)).toISOString();
  const releaseTagName = firstNonEmptyString(valueAt(githubReleaseEvidence, 'tagName'), tagName);
  const url = firstNonEmptyString(valueAt(githubReleaseEvidence, 'url'), valueAt(githubReleaseEvidence, 'releaseUrl'));
  const targetCommitish = firstNonEmptyString(valueAt(githubReleaseEvidence, 'targetCommitish'), valueAt(githubReleaseEvidence, 'targetCommit'));
  const isDraft = Boolean(valueAt(githubReleaseEvidence, 'isDraft', false));
  const isPrerelease = Boolean(valueAt(githubReleaseEvidence, 'isPrerelease', false));
  const assets = assetsFrom(valueAt(githubReleaseEvidence, 'assets'));
  const targetCommitMatches = releaseTargetMatches({
    targetCommitish,
    expectedTargetCommit,
    mainHead,
    originMainHead
  });
  const normalizedSourceRefs = sourceRefsFrom(firstNonEmptyArray(valueAt(githubReleaseEvidence, 'sourceRefs'), sourceRefs));
  const blockedReasons = uniqueStrings([
    ...safeStringArray(valueAt(githubReleaseEvidence, 'blockedReasons')),
    ...(releaseTagName === null || url === null || targetCommitish === null ? ['missing-github-release-evidence'] : []),
    ...(isDraft ? ['github-release-is-draft'] : []),
    ...(isPrerelease ? ['github-release-is-prerelease'] : []),
    ...(assets.length > 0 ? ['unexpected-release-assets'] : []),
    ...(targetCommitish !== null && !targetCommitMatches ? ['github-release-target-mismatch'] : [])
  ]);

  return {
    contractName: GITHUB_RELEASE_PUBLICATION_EVIDENCE_CONTRACT_NAME,
    contractVersion: RELEASE_PUBLICATION_EVIDENCE_CONTRACT_VERSION,
    generatedAt: normalizedGeneratedAt,
    state: blockedReasons.length === 0 ? 'ready' : 'blocked',
    tagName: releaseTagName,
    name: firstNonEmptyString(valueAt(githubReleaseEvidence, 'name'), releaseTagName),
    url,
    isDraft,
    isPrerelease,
    publishedAt: firstNonEmptyString(valueAt(githubReleaseEvidence, 'publishedAt')),
    assets,
    targetCommitish,
    targetCommitMatches,
    sourceRefs: normalizedSourceRefs,
    blockedReasons,
    readOnly: true,
    willMutate: false
  };
}

export function buildNextVersionStartAudit({
  generatedAt = new Date().toISOString(),
  currentVersion = null,
  nextVersion = null,
  nextRunbookRef = null,
  releaseEvidenceCommit = null,
  mainHead = null,
  originMainHead = null,
  openPrs = [],
  nextVersionGoalCreated = false,
  sourceRefs = []
} = {}) {
  const normalizedGeneratedAt = new Date(millisOrNow(generatedAt)).toISOString();
  const normalizedRunbookRef = evidenceRefFrom(nextRunbookRef);
  const normalizedOpenPrs = Array.isArray(openPrs) ? openPrs : [];
  const openPrCount = normalizedOpenPrs.length;
  const normalizedSourceRefs = sourceRefsFrom(sourceRefs);
  const blockedReasons = uniqueStrings([
    ...(currentVersion === null ? ['missing-current-version'] : []),
    ...(nextVersion === null ? ['missing-next-version'] : []),
    ...(normalizedRunbookRef === null ? ['missing-next-version-runbook'] : []),
    ...(releaseEvidenceCommit === null ? ['missing-release-evidence-commit'] : []),
    ...(mainHead !== null && releaseEvidenceCommit !== null && mainHead !== releaseEvidenceCommit ? ['main-head-not-release-commit'] : []),
    ...(originMainHead !== null && releaseEvidenceCommit !== null && originMainHead !== releaseEvidenceCommit ? ['origin-main-head-not-release-commit'] : []),
    ...(openPrCount > 0 ? ['open-prs-present'] : []),
    ...(nextVersionGoalCreated ? ['next-version-goal-already-created'] : [])
  ]);

  return {
    contractName: NEXT_VERSION_START_AUDIT_CONTRACT_NAME,
    contractVersion: RELEASE_PUBLICATION_EVIDENCE_CONTRACT_VERSION,
    generatedAt: normalizedGeneratedAt,
    state: blockedReasons.length === 0 ? 'ready' : 'blocked',
    currentVersion,
    nextVersion,
    nextRunbookRef: normalizedRunbookRef,
    releaseEvidenceCommit,
    mainHead,
    originMainHead,
    openPrCount,
    nextVersionGoalCreated,
    startAllowed: blockedReasons.length === 0,
    sourceRefs: normalizedSourceRefs,
    blockedReasons,
    readOnly: true,
    willMutate: false
  };
}

export function buildPublicationEvidenceBoundaryNotice({
  generatedAt = new Date().toISOString(),
  message = 'Publication evidence is read-only controller-supplied state; product code cannot expose tag, push, release publication, release edit, release readiness, goal event, task completion, provider, shell, worktree, or next-version goal controls.'
} = {}) {
  const normalizedGeneratedAt = new Date(millisOrNow(generatedAt)).toISOString();

  return {
    contractName: PUBLICATION_EVIDENCE_BOUNDARY_NOTICE_CONTRACT_NAME,
    contractVersion: RELEASE_PUBLICATION_EVIDENCE_CONTRACT_VERSION,
    generatedAt: normalizedGeneratedAt,
    message,
    boundaries: RELEASE_PUBLICATION_EVIDENCE_BOUNDARIES,
    readOnly: true,
    willMutate: false
  };
}

export function assertReleasePublicationEvidenceContract(evidence) {
  const validation = validateReleasePublicationEvidenceContract(evidence);

  if (!validation.ok) {
    throw new ReleasePublicationEvidenceContractError(
      'invalid-release-publication-evidence',
      'Release publication evidence contract is invalid.',
      { errors: validation.errors }
    );
  }

  return evidence;
}

export function validateReleasePublicationEvidenceContract(evidence) {
  const errors = [];

  if (!isObject(evidence)) {
    return { ok: false, errors: ['evidence must be an object'] };
  }

  assertAllowedFields(errors, evidence, PUBLICATION_ALLOWED_FIELDS, 'evidence');
  requireEqual(errors, evidence.contractName, RELEASE_PUBLICATION_EVIDENCE_CONTRACT_NAME, 'contractName');
  requireEqual(errors, evidence.contractVersion, RELEASE_PUBLICATION_EVIDENCE_CONTRACT_VERSION, 'contractVersion');
  validateIsoDate(errors, evidence.generatedAt, 'generatedAt');
  requireSet(errors, evidence.state, PUBLICATION_STATE_SET, 'state');
  requireEqual(errors, evidence.readOnly, true, 'readOnly');
  requireEqual(errors, evidence.willMutate, false, 'willMutate');
  validatePublicationBoundaries(errors, evidence.boundaries, 'boundaries');
  validateGoal(errors, evidence.goal, 'goal');
  validateSourceCloseoutHandoff(errors, evidence.sourceCloseoutHandoff, 'sourceCloseoutHandoff');
  validateTagPublicationEvidenceInto(errors, evidence.tagEvidence, 'tagEvidence');
  validateGithubReleasePublicationEvidenceInto(errors, evidence.githubReleaseEvidence, 'githubReleaseEvidence');
  validateTargetCommit(errors, evidence.targetCommit, 'targetCommit');
  validateTextItems(errors, evidence.knownFacts, 'knownFacts');
  validateTextItems(errors, evidence.blockedReasons, 'blockedReasons');
  validateNextVersionStartAuditInto(errors, evidence.nextVersionStartAudit, 'nextVersionStartAudit');
  validatePublicationEvidenceBoundaryNoticeInto(errors, evidence.publicationEvidenceBoundaryNotice, 'publicationEvidenceBoundaryNotice');

  for (const unsafeField of findUnsafeFields(evidence, 'evidence')) {
    errors.push(`${unsafeField} must not expose raw provider output, local session refs, shell commands, or mutation routes`);
  }

  if (evidence.state === 'ready' && Array.isArray(evidence.blockedReasons) && evidence.blockedReasons.length > 0) {
    errors.push('ready evidence must not include blockedReasons');
  }

  return { ok: errors.length === 0, errors };
}

export function validateTagPublicationEvidenceContract(tagEvidence) {
  const errors = [];
  validateTagPublicationEvidenceInto(errors, tagEvidence, 'tagEvidence');
  return { ok: errors.length === 0, errors };
}

export function validateGithubReleasePublicationEvidenceContract(githubReleaseEvidence) {
  const errors = [];
  validateGithubReleasePublicationEvidenceInto(errors, githubReleaseEvidence, 'githubReleaseEvidence');
  return { ok: errors.length === 0, errors };
}

export function validateNextVersionStartAuditContract(audit) {
  const errors = [];
  validateNextVersionStartAuditInto(errors, audit, 'audit');
  return { ok: errors.length === 0, errors };
}

export function validatePublicationEvidenceBoundaryNoticeContract(notice) {
  const errors = [];
  validatePublicationEvidenceBoundaryNoticeInto(errors, notice, 'notice');
  return { ok: errors.length === 0, errors };
}

function goalForPublication(goal, sourceCloseoutHandoff) {
  const sourceGoal = valueAt(sourceCloseoutHandoff, 'goal');
  const goalId = firstNonEmptyString(valueAt(goal, 'goalId'), valueAt(sourceGoal, 'goalId'), valueAt(sourceCloseoutHandoff, 'goalId'), 'release-publication-evidence');

  return {
    goalId,
    title: firstNonEmptyString(valueAt(goal, 'title'), valueAt(sourceGoal, 'title'), `${goalId} publication evidence`),
    state: firstNonEmptyString(valueAt(goal, 'state'), valueAt(sourceGoal, 'state'), 'active'),
    sourceContract: firstNonEmptyString(valueAt(goal, 'sourceContract'), valueAt(sourceGoal, 'sourceContract'), RELEASE_PUBLICATION_EVIDENCE_CONTRACT_NAME),
    sourceRef: sourceRefFrom(valueAt(goal, 'sourceRef')) ?? sourceRefFrom(valueAt(sourceGoal, 'sourceRef')) ?? {
      kind: 'contract',
      ref: RELEASE_PUBLICATION_EVIDENCE_CONTRACT_NAME,
      label: RELEASE_PUBLICATION_EVIDENCE_CONTRACT_NAME
    }
  };
}

function sourceCloseoutFrom(sourceCloseoutHandoff) {
  const sourceRef = sourceRefFrom(valueAt(sourceCloseoutHandoff, 'sourceRef')) ?? {
    kind: 'contract',
    ref: firstNonEmptyString(valueAt(sourceCloseoutHandoff, 'contractName'), 'releaseCloseoutHandoffPack.v1'),
    label: firstNonEmptyString(valueAt(sourceCloseoutHandoff, 'contractName'), 'releaseCloseoutHandoffPack.v1')
  };
  const targetCommit = firstNonEmptyString(
    valueAt(sourceCloseoutHandoff, 'targetCommit.commit'),
    valueAt(sourceCloseoutHandoff, 'targetCommit'),
    valueAt(sourceCloseoutHandoff, 'releaseBaseline.targetCommit')
  );

  return {
    contractName: firstNonEmptyString(valueAt(sourceCloseoutHandoff, 'contractName'), 'releaseCloseoutHandoffPack.v1'),
    state: firstNonEmptyString(valueAt(sourceCloseoutHandoff, 'state'), targetCommit === null ? 'missing' : 'ready'),
    goalId: firstNonEmptyString(valueAt(sourceCloseoutHandoff, 'goal.goalId'), valueAt(sourceCloseoutHandoff, 'goalId')),
    releaseTag: firstNonEmptyString(valueAt(sourceCloseoutHandoff, 'tagReleaseChecklist.targetTag'), valueAt(sourceCloseoutHandoff, 'releaseTag')),
    targetCommit,
    sourceRef,
    evidenceRefs: evidenceRefsFrom(valueAt(sourceCloseoutHandoff, 'evidenceRefs')),
    blockedReasons: safeStringArray(valueAt(sourceCloseoutHandoff, 'blockedReasons'))
  };
}

function targetCommitCheckFrom({
  expectedCommit,
  tagEvidence,
  githubReleaseEvidence,
  mainHead,
  originMainHead
}) {
  const tagCommit = tagEvidence.dereferencedCommit;
  const releaseTarget = githubReleaseEvidence.targetCommitish;
  const matchesTag = expectedCommit !== null && tagCommit !== null && expectedCommit === tagCommit;
  const matchesReleaseTarget = releaseTargetMatches({
    targetCommitish: releaseTarget,
    expectedTargetCommit: expectedCommit,
    mainHead,
    originMainHead
  });
  const blockedReasons = uniqueStrings([
    ...(expectedCommit === null ? ['missing-target-commit'] : []),
    ...(tagCommit === null ? ['missing-tag-dereferenced-commit'] : []),
    ...(expectedCommit !== null && tagCommit !== null && !matchesTag ? ['tag-target-mismatch'] : []),
    ...(releaseTarget !== null && !matchesReleaseTarget ? ['github-release-target-mismatch'] : [])
  ]);

  return {
    state: blockedReasons.length === 0 ? 'ready' : 'blocked',
    expectedCommit,
    tagDereferencedCommit: tagCommit,
    releaseTargetCommitish: releaseTarget,
    matchesTag,
    matchesReleaseTarget,
    blockedReasons
  };
}

function validateGoal(errors, goal, path) {
  if (!isObject(goal)) {
    errors.push(`${path} must be an object`);
    return;
  }

  assertAllowedFields(errors, goal, GOAL_ALLOWED_FIELDS, path);
  requireNonEmptyString(errors, goal.goalId, `${path}.goalId`);
  requireNonEmptyString(errors, goal.title, `${path}.title`);
  requireSet(errors, goal.state, GOAL_STATE_SET, `${path}.state`);
  requirePattern(errors, goal.sourceContract, CONTRACT_NAME_PATTERN, `${path}.sourceContract`);
  validateSourceRef(errors, goal.sourceRef, `${path}.sourceRef`);
}

function validateSourceCloseoutHandoff(errors, source, path) {
  if (!isObject(source)) {
    errors.push(`${path} must be an object`);
    return;
  }

  assertAllowedFields(errors, source, CLOSEOUT_ALLOWED_FIELDS, path);
  requirePattern(errors, source.contractName, CONTRACT_NAME_PATTERN, `${path}.contractName`);
  requireSet(errors, source.state, EVIDENCE_STATE_SET, `${path}.state`);
  if (source.goalId !== null) {
    requireNonEmptyString(errors, source.goalId, `${path}.goalId`);
  }
  if (source.releaseTag !== null) {
    requirePattern(errors, source.releaseTag, SAFE_TAG_PATTERN, `${path}.releaseTag`);
  }
  optionalCommit(errors, source.targetCommit, `${path}.targetCommit`);
  validateSourceRef(errors, source.sourceRef, `${path}.sourceRef`);
  validateEvidenceRefs(errors, source.evidenceRefs, `${path}.evidenceRefs`);
  validateTextItems(errors, source.blockedReasons, `${path}.blockedReasons`);
}

function validateTagPublicationEvidenceInto(errors, tagEvidence, path) {
  if (!isObject(tagEvidence)) {
    errors.push(`${path} must be an object`);
    return;
  }

  assertAllowedFields(errors, tagEvidence, TAG_ALLOWED_FIELDS, path);
  requireEqual(errors, tagEvidence.contractName, TAG_PUBLICATION_EVIDENCE_CONTRACT_NAME, `${path}.contractName`);
  requireEqual(errors, tagEvidence.contractVersion, RELEASE_PUBLICATION_EVIDENCE_CONTRACT_VERSION, `${path}.contractVersion`);
  validateIsoDate(errors, tagEvidence.generatedAt, `${path}.generatedAt`);
  requireSet(errors, tagEvidence.state, EVIDENCE_STATE_SET, `${path}.state`);
  requireEqual(errors, tagEvidence.readOnly, true, `${path}.readOnly`);
  requireEqual(errors, tagEvidence.willMutate, false, `${path}.willMutate`);
  if (tagEvidence.tagName !== null) {
    requirePattern(errors, tagEvidence.tagName, SAFE_TAG_PATTERN, `${path}.tagName`);
  }
  optionalCommit(errors, tagEvidence.tagObjectSha, `${path}.tagObjectSha`);
  optionalCommit(errors, tagEvidence.dereferencedCommit, `${path}.dereferencedCommit`);
  optionalCommit(errors, tagEvidence.targetCommit, `${path}.targetCommit`);
  if (typeof tagEvidence.annotated !== 'boolean') {
    errors.push(`${path}.annotated must be boolean`);
  }
  validateSourceRefs(errors, tagEvidence.sourceRefs, `${path}.sourceRefs`);
  validateEvidenceRefs(errors, tagEvidence.rollbackRefs, `${path}.rollbackRefs`);
  validateTextItems(errors, tagEvidence.blockedReasons, `${path}.blockedReasons`);
}

function validateGithubReleasePublicationEvidenceInto(errors, releaseEvidence, path) {
  if (!isObject(releaseEvidence)) {
    errors.push(`${path} must be an object`);
    return;
  }

  assertAllowedFields(errors, releaseEvidence, GITHUB_RELEASE_ALLOWED_FIELDS, path);
  requireEqual(errors, releaseEvidence.contractName, GITHUB_RELEASE_PUBLICATION_EVIDENCE_CONTRACT_NAME, `${path}.contractName`);
  requireEqual(errors, releaseEvidence.contractVersion, RELEASE_PUBLICATION_EVIDENCE_CONTRACT_VERSION, `${path}.contractVersion`);
  validateIsoDate(errors, releaseEvidence.generatedAt, `${path}.generatedAt`);
  requireSet(errors, releaseEvidence.state, EVIDENCE_STATE_SET, `${path}.state`);
  requireEqual(errors, releaseEvidence.readOnly, true, `${path}.readOnly`);
  requireEqual(errors, releaseEvidence.willMutate, false, `${path}.willMutate`);
  if (releaseEvidence.tagName !== null) {
    requirePattern(errors, releaseEvidence.tagName, SAFE_TAG_PATTERN, `${path}.tagName`);
  }
  if (releaseEvidence.name !== null) {
    requireNonEmptyString(errors, releaseEvidence.name, `${path}.name`);
  }
  if (releaseEvidence.url !== null) {
    requireNonEmptyString(errors, releaseEvidence.url, `${path}.url`);
  }
  if (releaseEvidence.publishedAt !== null) {
    validateIsoDate(errors, releaseEvidence.publishedAt, `${path}.publishedAt`);
  }
  if (releaseEvidence.targetCommitish !== null) {
    requireNonEmptyString(errors, releaseEvidence.targetCommitish, `${path}.targetCommitish`);
  }
  if (typeof releaseEvidence.isDraft !== 'boolean') {
    errors.push(`${path}.isDraft must be boolean`);
  }
  if (typeof releaseEvidence.isPrerelease !== 'boolean') {
    errors.push(`${path}.isPrerelease must be boolean`);
  }
  if (typeof releaseEvidence.targetCommitMatches !== 'boolean') {
    errors.push(`${path}.targetCommitMatches must be boolean`);
  }
  validateAssets(errors, releaseEvidence.assets, `${path}.assets`);
  validateSourceRefs(errors, releaseEvidence.sourceRefs, `${path}.sourceRefs`);
  validateTextItems(errors, releaseEvidence.blockedReasons, `${path}.blockedReasons`);
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
    requireNonEmptyString(errors, asset.name, `${itemPath}.name`);
    if (asset.label !== null) {
      requireNonEmptyString(errors, asset.label, `${itemPath}.label`);
    }
    if (asset.url !== null) {
      requireNonEmptyString(errors, asset.url, `${itemPath}.url`);
    }
    if (!Number.isInteger(asset.size) || asset.size < 0) {
      errors.push(`${itemPath}.size must be a non-negative integer`);
    }
  });
}

function validateTargetCommit(errors, target, path) {
  if (!isObject(target)) {
    errors.push(`${path} must be an object`);
    return;
  }

  assertAllowedFields(errors, target, TARGET_COMMIT_ALLOWED_FIELDS, path);
  requireSet(errors, target.state, PUBLICATION_STATE_SET, `${path}.state`);
  optionalCommit(errors, target.expectedCommit, `${path}.expectedCommit`);
  optionalCommit(errors, target.tagDereferencedCommit, `${path}.tagDereferencedCommit`);
  if (target.releaseTargetCommitish !== null) {
    requireNonEmptyString(errors, target.releaseTargetCommitish, `${path}.releaseTargetCommitish`);
  }
  if (typeof target.matchesTag !== 'boolean') {
    errors.push(`${path}.matchesTag must be boolean`);
  }
  if (typeof target.matchesReleaseTarget !== 'boolean') {
    errors.push(`${path}.matchesReleaseTarget must be boolean`);
  }
  validateTextItems(errors, target.blockedReasons, `${path}.blockedReasons`);
}

function validateNextVersionStartAuditInto(errors, audit, path) {
  if (!isObject(audit)) {
    errors.push(`${path} must be an object`);
    return;
  }

  assertAllowedFields(errors, audit, NEXT_VERSION_AUDIT_ALLOWED_FIELDS, path);
  requireEqual(errors, audit.contractName, NEXT_VERSION_START_AUDIT_CONTRACT_NAME, `${path}.contractName`);
  requireEqual(errors, audit.contractVersion, RELEASE_PUBLICATION_EVIDENCE_CONTRACT_VERSION, `${path}.contractVersion`);
  validateIsoDate(errors, audit.generatedAt, `${path}.generatedAt`);
  requireSet(errors, audit.state, PUBLICATION_STATE_SET, `${path}.state`);
  if (audit.currentVersion !== null) {
    requirePattern(errors, audit.currentVersion, SAFE_TAG_PATTERN, `${path}.currentVersion`);
  }
  if (audit.nextVersion !== null) {
    requirePattern(errors, audit.nextVersion, SAFE_TAG_PATTERN, `${path}.nextVersion`);
  }
  if (audit.nextRunbookRef !== null) {
    validateEvidenceRef(errors, audit.nextRunbookRef, `${path}.nextRunbookRef`);
  }
  optionalCommit(errors, audit.releaseEvidenceCommit, `${path}.releaseEvidenceCommit`);
  optionalCommit(errors, audit.mainHead, `${path}.mainHead`);
  optionalCommit(errors, audit.originMainHead, `${path}.originMainHead`);
  if (!Number.isInteger(audit.openPrCount) || audit.openPrCount < 0) {
    errors.push(`${path}.openPrCount must be a non-negative integer`);
  }
  if (typeof audit.nextVersionGoalCreated !== 'boolean') {
    errors.push(`${path}.nextVersionGoalCreated must be boolean`);
  }
  if (typeof audit.startAllowed !== 'boolean') {
    errors.push(`${path}.startAllowed must be boolean`);
  }
  validateSourceRefs(errors, audit.sourceRefs, `${path}.sourceRefs`);
  validateTextItems(errors, audit.blockedReasons, `${path}.blockedReasons`);
  requireEqual(errors, audit.readOnly, true, `${path}.readOnly`);
  requireEqual(errors, audit.willMutate, false, `${path}.willMutate`);
}

function validatePublicationEvidenceBoundaryNoticeInto(errors, notice, path) {
  if (!isObject(notice)) {
    errors.push(`${path} must be an object`);
    return;
  }

  assertAllowedFields(errors, notice, BOUNDARY_NOTICE_ALLOWED_FIELDS, path);
  requireEqual(errors, notice.contractName, PUBLICATION_EVIDENCE_BOUNDARY_NOTICE_CONTRACT_NAME, `${path}.contractName`);
  requireEqual(errors, notice.contractVersion, RELEASE_PUBLICATION_EVIDENCE_CONTRACT_VERSION, `${path}.contractVersion`);
  validateIsoDate(errors, notice.generatedAt, `${path}.generatedAt`);
  requireNonEmptyString(errors, notice.message, `${path}.message`);
  validatePublicationBoundaries(errors, notice.boundaries, `${path}.boundaries`);
  requireEqual(errors, notice.readOnly, true, `${path}.readOnly`);
  requireEqual(errors, notice.willMutate, false, `${path}.willMutate`);
}

function validatePublicationBoundaries(errors, boundaries, path) {
  if (!isObject(boundaries)) {
    errors.push(`${path} must be an object`);
    return;
  }

  for (const [key, expected] of Object.entries(RELEASE_PUBLICATION_EVIDENCE_BOUNDARIES)) {
    requireEqual(errors, boundaries[key], expected, `${path}.${key}`);
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
  if (!isObject(ref)) {
    errors.push(`${path} must be an object`);
    return;
  }

  assertAllowedFields(errors, ref, SOURCE_REF_ALLOWED_FIELDS, path);
  requireSet(errors, ref.kind, SOURCE_REF_KIND_SET, `${path}.kind`);
  requireNonEmptyString(errors, ref.ref, `${path}.ref`);
  requireNonEmptyString(errors, ref.label, `${path}.label`);

  if (ref.generatedAt !== undefined) {
    validateIsoDate(errors, ref.generatedAt, `${path}.generatedAt`);
  }
}

function validateEvidenceRefs(errors, refs, path) {
  if (!Array.isArray(refs)) {
    errors.push(`${path} must be an array`);
    return;
  }

  refs.forEach((ref, index) => validateEvidenceRef(errors, ref, `${path}[${index}]`));
}

function validateEvidenceRef(errors, ref, path) {
  if (!isObject(ref)) {
    errors.push(`${path} must be an object`);
    return;
  }

  assertAllowedFields(errors, ref, EVIDENCE_REF_ALLOWED_FIELDS, path);
  requireSet(errors, ref.kind, EVIDENCE_REF_KIND_SET, `${path}.kind`);
  requireNonEmptyString(errors, ref.ref, `${path}.ref`);
  requireNonEmptyString(errors, ref.label, `${path}.label`);
}

function sourceRefsFrom(refs) {
  return (Array.isArray(refs) ? refs : [])
    .map(sourceRefFrom)
    .filter((ref) => ref !== null);
}

function sourceRefFrom(ref) {
  if (typeof ref === 'string') {
    return { kind: 'contract', ref, label: ref };
  }

  if (!isObject(ref)) {
    return null;
  }

  const normalizedRef = firstNonEmptyString(ref.ref, ref.path, ref.uri, null);

  if (normalizedRef === null) {
    return null;
  }

  return {
    kind: firstNonEmptyString(ref.kind, 'contract'),
    ref: normalizedRef,
    label: firstNonEmptyString(ref.label, ref.title, normalizedRef),
    ...(ref.generatedAt === undefined ? {} : { generatedAt: ref.generatedAt })
  };
}

function evidenceRefsFrom(refs) {
  return (Array.isArray(refs) ? refs : [])
    .map(evidenceRefFrom)
    .filter((ref) => ref !== null);
}

function evidenceRefFrom(ref) {
  if (typeof ref === 'string') {
    return { kind: 'repo-doc', ref, label: ref };
  }

  if (!isObject(ref)) {
    return null;
  }

  const normalizedRef = firstNonEmptyString(ref.ref, ref.path, ref.uri, null);

  if (normalizedRef === null) {
    return null;
  }

  return {
    kind: firstNonEmptyString(ref.kind, 'repo-doc'),
    ref: normalizedRef,
    label: firstNonEmptyString(ref.label, ref.title, normalizedRef)
  };
}

function assetsFrom(assets) {
  return (Array.isArray(assets) ? assets : [])
    .map((asset) => {
      if (typeof asset === 'string') {
        return { name: asset, label: null, url: null, size: 0 };
      }

      if (!isObject(asset)) {
        return null;
      }

      const name = firstNonEmptyString(asset.name, asset.label, asset.url);

      if (name === null) {
        return null;
      }

      return {
        name,
        label: firstNonEmptyString(asset.label, null),
        url: firstNonEmptyString(asset.url, asset.browserDownloadUrl, null),
        size: Number.isInteger(asset.size) && asset.size >= 0 ? asset.size : 0
      };
    })
    .filter((asset) => asset !== null);
}

function releaseTargetMatches({
  targetCommitish,
  expectedTargetCommit,
  mainHead,
  originMainHead
}) {
  if (targetCommitish === null || expectedTargetCommit === null) {
    return false;
  }

  if (targetCommitish === expectedTargetCommit) {
    return true;
  }

  if (targetCommitish === 'main' && mainHead === expectedTargetCommit) {
    return true;
  }

  if (targetCommitish === 'origin/main' && originMainHead === expectedTargetCommit) {
    return true;
  }

  return false;
}

function findUnsafeFields(value, path, visited = new Set()) {
  const findings = [];

  if (value === null || value === undefined) {
    return findings;
  }

  if (typeof value === 'string') {
    if (UNSAFE_TEXT_PATTERN.test(value)) {
      findings.push(path);
    }

    return findings;
  }

  if (typeof value !== 'object') {
    return findings;
  }

  if (visited.has(value)) {
    return findings;
  }

  visited.add(value);

  if (Array.isArray(value)) {
    value.forEach((item, index) => {
      findings.push(...findUnsafeFields(item, `${path}[${index}]`, visited));
    });
    return findings;
  }

  for (const [key, nested] of Object.entries(value)) {
    const fieldPath = `${path}.${key}`;

    if (RAW_FIELD_NAME_PATTERN.test(key)) {
      findings.push(fieldPath);
      continue;
    }

    findings.push(...findUnsafeFields(nested, fieldPath, visited));
  }

  return findings;
}

function assertAllowedFields(errors, value, allowed, path) {
  for (const key of Object.keys(value)) {
    if (!allowed.has(key)) {
      errors.push(`${path}.${key} is not allowed`);
    }
  }
}

function requireEqual(errors, actual, expected, path) {
  if (actual !== expected) {
    errors.push(`${path} must be ${String(expected)}`);
  }
}

function requireSet(errors, value, allowed, path) {
  if (!allowed.has(value)) {
    errors.push(`${path} must be one of ${Array.from(allowed).join(', ')}`);
  }
}

function requireNonEmptyString(errors, value, path) {
  if (!isNonEmptyString(value)) {
    errors.push(`${path} must be a non-empty string`);
  }
}

function requirePattern(errors, value, pattern, path) {
  if (!isNonEmptyString(value) || !pattern.test(value)) {
    errors.push(`${path} must match ${pattern}`);
  }
}

function optionalCommit(errors, value, path) {
  if (value === null || value === undefined) {
    return;
  }

  requirePattern(errors, value, COMMIT_PATTERN, path);
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

function validateIsoDate(errors, value, path) {
  if (!isNonEmptyString(value) || Number.isNaN(Date.parse(value))) {
    errors.push(`${path} must be an ISO date string`);
  }
}

function millisOrNow(value) {
  const millis = Date.parse(value);
  return Number.isFinite(millis) ? millis : Date.now();
}

function normalizeTextItems(items) {
  return safeStringArray(items);
}

function safeStringArray(value) {
  return (Array.isArray(value) ? value : [])
    .filter(isNonEmptyString);
}

function uniqueStrings(items) {
  return Array.from(new Set(items.filter(isNonEmptyString)));
}

function firstNonEmptyArray(...values) {
  for (const value of values) {
    if (Array.isArray(value) && value.length > 0) {
      return value;
    }
  }

  return [];
}

function firstNonEmptyString(...values) {
  for (const value of values) {
    if (isNonEmptyString(value)) {
      return value;
    }
  }

  return null;
}

function valueAt(value, path, fallback = null) {
  if (!isNonEmptyString(path)) {
    return fallback;
  }

  let current = value;

  for (const part of path.split('.')) {
    if (!isObject(current) || !(part in current)) {
      return fallback;
    }

    current = current[part];
  }

  return current ?? fallback;
}

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function isObject(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
