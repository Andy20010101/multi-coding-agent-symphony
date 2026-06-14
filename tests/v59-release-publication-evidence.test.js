import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  GITHUB_RELEASE_PUBLICATION_EVIDENCE_CONTRACT_NAME,
  NEXT_VERSION_START_AUDIT_CONTRACT_NAME,
  PUBLICATION_EVIDENCE_BOUNDARY_NOTICE_CONTRACT_NAME,
  RELEASE_PUBLICATION_EVIDENCE_BOUNDARIES,
  RELEASE_PUBLICATION_EVIDENCE_CONTRACT_NAME,
  ReleasePublicationEvidenceContractError,
  TAG_PUBLICATION_EVIDENCE_CONTRACT_NAME,
  assertReleasePublicationEvidenceContract,
  buildReleasePublicationEvidence,
  validateGithubReleasePublicationEvidenceContract,
  validateNextVersionStartAuditContract,
  validatePublicationEvidenceBoundaryNoticeContract,
  validateReleasePublicationEvidenceContract,
  validateTagPublicationEvidenceContract
} from '../src/symphony/release-publication-evidence-contracts.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, '..');
const FIXTURE_DIR = join(REPO_ROOT, 'fixtures/contracts/release-publication-evidence');
const GENERATED_AT = '2026-06-14T04:40:00.000Z';
const GOAL_ID = 'v59-release-publication-evidence-and-next-start-audit';
const TARGET_COMMIT = '7cedfbd8457f78f3f73fc91201a932d780119052';
const STALE_COMMIT = '71745688de473013dd9a9878bfb609bc24e2a68f';
const TAG_OBJECT_SHA = 'd4046a05f8a5f44e998d2763ea3c11db4487401e';
const RELEASE_URL = 'https://github.com/Andy20010101/multi-coding-agent-symphony/releases/tag/v58';

const VALID_FIXTURES = Object.freeze([
  'release-publication-evidence.ready.v1.json',
  'release-publication-evidence.empty-assets.v1.json',
  'release-publication-evidence.blocked-missing-tag.v1.json',
  'release-publication-evidence.blocked-tag-target-mismatch.v1.json',
  'release-publication-evidence.blocked-missing-github-release.v1.json',
  'release-publication-evidence.blocked-release-target-mismatch.v1.json',
  'release-publication-evidence.blocked-draft-release.v1.json',
  'release-publication-evidence.blocked-prerelease-release.v1.json',
  'release-publication-evidence.blocked-unexpected-assets.v1.json'
]);

describe('v59 release publication evidence contracts', () => {
  it('validates ready and blocked fixture contracts as read-only publication evidence', () => {
    for (const name of VALID_FIXTURES) {
      const evidence = fixture(name);
      const validation = validateReleasePublicationEvidenceContract(evidence);

      assert.equal(validation.ok, true, `${name}: ${validation.errors.join('; ')}`);
      assert.equal(evidence.contractName, RELEASE_PUBLICATION_EVIDENCE_CONTRACT_NAME);
      assert.equal(evidence.readOnly, true);
      assert.equal(evidence.willMutate, false);
      assert.deepEqual(evidence.boundaries, RELEASE_PUBLICATION_EVIDENCE_BOUNDARIES, name);
      assert.equal(evidence.boundaries.gitTagAvailable, false);
      assert.equal(evidence.boundaries.gitPushAvailable, false);
      assert.equal(evidence.boundaries.githubReleaseCreateAvailable, false);
      assert.equal(evidence.boundaries.githubReleaseEditAvailable, false);
      assert.equal(evidence.boundaries.releaseReadyDeclarationAvailable, false);
      assert.equal(evidence.boundaries.providerLaunchAvailable, false);
      assert.equal(evidence.boundaries.shellAvailable, false);
      assert.equal(evidence.boundaries.directGoalEventAppendAvailable, false);
      assert.equal(evidence.boundaries.directTaskCompleteAvailable, false);
      assert.equal(evidence.boundaries.automaticWorktreeCreationAvailable, false);
      assert.equal(evidence.boundaries.automaticNextVersionGoalAvailable, false);

      assert.equal(evidence.tagEvidence.contractName, TAG_PUBLICATION_EVIDENCE_CONTRACT_NAME);
      assert.equal(evidence.githubReleaseEvidence.contractName, GITHUB_RELEASE_PUBLICATION_EVIDENCE_CONTRACT_NAME);
      assert.equal(evidence.nextVersionStartAudit.contractName, NEXT_VERSION_START_AUDIT_CONTRACT_NAME);
      assert.equal(evidence.publicationEvidenceBoundaryNotice.contractName, PUBLICATION_EVIDENCE_BOUNDARY_NOTICE_CONTRACT_NAME);
      assert.equal(validateTagPublicationEvidenceContract(evidence.tagEvidence).ok, true);
      assert.equal(validateGithubReleasePublicationEvidenceContract(evidence.githubReleaseEvidence).ok, true);
      assert.equal(validateNextVersionStartAuditContract(evidence.nextVersionStartAudit).ok, true);
      assert.equal(validatePublicationEvidenceBoundaryNoticeContract(evidence.publicationEvidenceBoundaryNotice).ok, true);
      assertNoUnsafePayload(evidence);
    }

    const ready = fixture('release-publication-evidence.ready.v1.json');
    const emptyAssets = fixture('release-publication-evidence.empty-assets.v1.json');
    const missingTag = fixture('release-publication-evidence.blocked-missing-tag.v1.json');
    const tagMismatch = fixture('release-publication-evidence.blocked-tag-target-mismatch.v1.json');
    const missingRelease = fixture('release-publication-evidence.blocked-missing-github-release.v1.json');
    const releaseTargetMismatch = fixture('release-publication-evidence.blocked-release-target-mismatch.v1.json');
    const draft = fixture('release-publication-evidence.blocked-draft-release.v1.json');
    const prerelease = fixture('release-publication-evidence.blocked-prerelease-release.v1.json');
    const unexpectedAssets = fixture('release-publication-evidence.blocked-unexpected-assets.v1.json');

    assert.equal(ready.state, 'ready');
    assert.deepEqual(ready.blockedReasons, []);
    assert.equal(ready.tagEvidence.tagName, 'v58');
    assert.equal(ready.tagEvidence.tagObjectSha, TAG_OBJECT_SHA);
    assert.equal(ready.tagEvidence.dereferencedCommit, TARGET_COMMIT);
    assert.equal(ready.githubReleaseEvidence.url, RELEASE_URL);
    assert.equal(ready.githubReleaseEvidence.isDraft, false);
    assert.equal(ready.githubReleaseEvidence.isPrerelease, false);
    assert.equal(ready.githubReleaseEvidence.publishedAt, '2026-06-14T02:26:15Z');
    assert.deepEqual(ready.githubReleaseEvidence.assets, []);
    assert.equal(ready.githubReleaseEvidence.targetCommitish, 'main');
    assert.equal(ready.targetCommit.matchesTag, true);
    assert.equal(ready.targetCommit.matchesReleaseTarget, true);
    assert.equal(ready.nextVersionStartAudit.nextRunbookRef.ref, 'docs/plans/v59-runbook-2026-06-14.md');
    assert.equal(ready.nextVersionStartAudit.openPrCount, 0);
    assert.equal(ready.nextVersionStartAudit.nextVersionGoalCreated, false);
    assert.equal(ready.nextVersionStartAudit.startAllowed, true);

    assert.equal(emptyAssets.githubReleaseEvidence.assets.length, 0);
    assert.equal(missingTag.state, 'blocked');
    assert.ok(missingTag.blockedReasons.includes('missing-tag-evidence'));
    assert.equal(tagMismatch.state, 'blocked');
    assert.ok(tagMismatch.blockedReasons.includes('tag-target-mismatch'));
    assert.equal(missingRelease.state, 'blocked');
    assert.ok(missingRelease.blockedReasons.includes('missing-github-release-evidence'));
    assert.equal(releaseTargetMismatch.state, 'blocked');
    assert.ok(releaseTargetMismatch.blockedReasons.includes('github-release-target-mismatch'));
    assert.equal(draft.state, 'blocked');
    assert.ok(draft.blockedReasons.includes('github-release-is-draft'));
    assert.equal(prerelease.state, 'blocked');
    assert.ok(prerelease.blockedReasons.includes('github-release-is-prerelease'));
    assert.equal(unexpectedAssets.state, 'blocked');
    assert.ok(unexpectedAssets.blockedReasons.includes('unexpected-release-assets'));
  });

  it('builds ready publication evidence from controller-supplied v58 tag and GitHub Release facts', () => {
    const evidence = buildReleasePublicationEvidence(readyInput());

    assertReleasePublicationEvidenceContract(evidence);
    assert.equal(evidence.state, 'ready');
    assert.equal(evidence.goal.goalId, GOAL_ID);
    assert.equal(evidence.sourceCloseoutHandoff.contractName, 'releaseCloseoutHandoffPack.v1');
    assert.equal(evidence.sourceCloseoutHandoff.releaseTag, 'v58');
    assert.equal(evidence.sourceCloseoutHandoff.targetCommit, TARGET_COMMIT);
    assert.equal(evidence.tagEvidence.tagObjectSha, TAG_OBJECT_SHA);
    assert.equal(evidence.tagEvidence.dereferencedCommit, TARGET_COMMIT);
    assert.equal(evidence.githubReleaseEvidence.url, RELEASE_URL);
    assert.equal(evidence.githubReleaseEvidence.targetCommitMatches, true);
    assert.equal(evidence.nextVersionStartAudit.nextVersion, 'v59');
    assert.equal(evidence.nextVersionStartAudit.startAllowed, true);
    assert.deepEqual(evidence.boundaries, RELEASE_PUBLICATION_EVIDENCE_BOUNDARIES);
    assertNoUnsafePayload(evidence);
  });

  it('blocks missing evidence, mismatches, unsafe release states, and next-start drift', () => {
    assertBlocked(
      buildReleasePublicationEvidence({
        ...readyInput(),
        tagEvidence: null
      }),
      'missing-tag-evidence'
    );
    assertBlocked(
      buildReleasePublicationEvidence({
        ...readyInput(),
        tagEvidence: {
          ...readyTagEvidence(),
          dereferencedCommit: STALE_COMMIT
        }
      }),
      'tag-target-mismatch'
    );
    assertBlocked(
      buildReleasePublicationEvidence({
        ...readyInput(),
        githubReleaseEvidence: null
      }),
      'missing-github-release-evidence'
    );
    assertBlocked(
      buildReleasePublicationEvidence({
        ...readyInput(),
        githubReleaseEvidence: {
          ...readyGithubReleaseEvidence(),
          targetCommitish: STALE_COMMIT
        }
      }),
      'github-release-target-mismatch'
    );
    assertBlocked(
      buildReleasePublicationEvidence({
        ...readyInput(),
        githubReleaseEvidence: {
          ...readyGithubReleaseEvidence(),
          isDraft: true
        }
      }),
      'github-release-is-draft'
    );
    assertBlocked(
      buildReleasePublicationEvidence({
        ...readyInput(),
        githubReleaseEvidence: {
          ...readyGithubReleaseEvidence(),
          isPrerelease: true
        }
      }),
      'github-release-is-prerelease'
    );
    assertBlocked(
      buildReleasePublicationEvidence({
        ...readyInput(),
        githubReleaseEvidence: {
          ...readyGithubReleaseEvidence(),
          assets: [{ name: 'unexpected.zip', size: 10, url: RELEASE_URL }]
        }
      }),
      'unexpected-release-assets'
    );
    assertBlocked(
      buildReleasePublicationEvidence({
        ...readyInput(),
        openPrs: [{ number: 109, title: 'open follow-up' }]
      }),
      'open-prs-present'
    );
    assertBlocked(
      buildReleasePublicationEvidence({
        ...readyInput(),
        nextRunbookRef: null
      }),
      'missing-next-version-runbook'
    );
  });

  it('rejects raw transcript, local session, and mutation fixture drift', () => {
    const rawTranscript = validateReleasePublicationEvidenceContract(fixture('release-publication-evidence.raw-transcript.invalid.v1.json'));
    const localSession = validateReleasePublicationEvidenceContract(fixture('release-publication-evidence.local-session.invalid.v1.json'));
    const unsafeMutation = validateReleasePublicationEvidenceContract(fixture('release-publication-evidence.unsafe-mutation.invalid.v1.json'));

    assert.equal(rawTranscript.ok, false);
    assert.ok(rawTranscript.errors.some((error) => error.includes('rawTranscript')), rawTranscript.errors.join('; '));
    assert.ok(rawTranscript.errors.some((error) => error.includes('raw provider output')), rawTranscript.errors.join('; '));

    assert.equal(localSession.ok, false);
    assert.ok(localSession.errors.some((error) => error.includes('local session refs')), localSession.errors.join('; '));
    assert.ok(localSession.errors.some((error) => error.includes('sourceRefs')), localSession.errors.join('; '));

    assert.equal(unsafeMutation.ok, false);
    assert.ok(unsafeMutation.errors.includes('boundaries.gitTagAvailable must be false'));
    assert.ok(unsafeMutation.errors.some((error) => error.includes('mutation routes')), unsafeMutation.errors.join('; '));
  });

  it('throws before building from unsafe controller evidence refs', () => {
    assert.throws(
      () => buildReleasePublicationEvidence({
        ...readyInput(),
        sourceRefs: [{
          kind: 'repo-doc',
          ref: '/Users/andy/.codex/sessions/v59.jsonl',
          label: 'local session file'
        }]
      }),
      (error) => {
        assert.equal(error instanceof ReleasePublicationEvidenceContractError, true);
        assert.equal(error.code, 'unsafe-release-publication-evidence-source');
        assert.match(error.details.reason, /sourceRefs/u);
        return true;
      }
    );
  });

  it('rejects boundary drift in asserted evidence packs', () => {
    const evidence = fixture('release-publication-evidence.ready.v1.json');

    evidence.boundaries.githubReleaseEditAvailable = true;

    assert.throws(
      () => assertReleasePublicationEvidenceContract(evidence),
      (error) => {
        assert.equal(error instanceof ReleasePublicationEvidenceContractError, true);
        assert.equal(error.code, 'invalid-release-publication-evidence');
        assert.ok(error.details.errors.includes('boundaries.githubReleaseEditAvailable must be false'));
        return true;
      }
    );
  });
});

function fixture(name) {
  return JSON.parse(readFileSync(join(FIXTURE_DIR, name), 'utf8'));
}

function readyInput() {
  return {
    generatedAt: GENERATED_AT,
    goal: goalInput(),
    sourceCloseoutHandoff: sourceCloseoutHandoff(),
    tagEvidence: readyTagEvidence(),
    githubReleaseEvidence: readyGithubReleaseEvidence(),
    expectedTargetCommit: TARGET_COMMIT,
    targetCommit: TARGET_COMMIT,
    currentVersion: 'v58',
    nextVersion: 'v59',
    nextRunbookRef: repoDocEvidence('docs/plans/v59-runbook-2026-06-14.md', 'v59 runbook'),
    mainHead: TARGET_COMMIT,
    originMainHead: TARGET_COMMIT,
    openPrs: [],
    nextVersionGoalCreated: false,
    knownFacts: [
      'main and origin/main are 7cedfbd8457f78f3f73fc91201a932d780119052',
      'v58 annotated tag dereferences to 7cedfbd8457f78f3f73fc91201a932d780119052',
      'v58 GitHub Release is non-draft, non-prerelease, and asset-free'
    ],
    rollbackRefs: [repoDocEvidence('docs/plans/v58-rollback-path-2026-06-14.md', 'v58 rollback path')],
    sourceRefs: sourceRefs()
  };
}

function goalInput() {
  return {
    goalId: GOAL_ID,
    title: 'v59 Release Publication Evidence and Next Start Audit',
    state: 'active',
    sourceContract: 'releaseCloseoutHandoffPack.v1',
    sourceRef: {
      kind: 'contract',
      ref: 'releaseCloseoutHandoffPack.v1',
      label: 'v58 closeout handoff source'
    }
  };
}

function sourceCloseoutHandoff() {
  return {
    contractName: 'releaseCloseoutHandoffPack.v1',
    state: 'ready',
    goal: {
      goalId: 'v58-release-closeout-operator-handoff-pack',
      title: 'v58 Release Closeout Operator Handoff Pack',
      state: 'ready',
      sourceContract: 'threadHandoffPack.v1',
      sourceRef: {
        kind: 'contract',
        ref: 'threadHandoffPack.v1',
        label: 'v58 goal source'
      }
    },
    tagReleaseChecklist: {
      targetTag: 'v58'
    },
    targetCommit: {
      commit: TARGET_COMMIT
    },
    evidenceRefs: [
      repoDocEvidence('docs/plans/v58-release-closeout-operator-handoff-pack-closeout-snapshot-2026-06-14.md', 'v58 closeout snapshot'),
      repoDocEvidence('docs/plans/v59-runbook-2026-06-14.md', 'v59 runbook')
    ],
    sourceRef: {
      kind: 'contract',
      ref: 'releaseCloseoutHandoffPack.v1',
      label: 'release closeout handoff pack'
    },
    blockedReasons: []
  };
}

function readyTagEvidence() {
  return {
    tagName: 'v58',
    tagObjectSha: TAG_OBJECT_SHA,
    dereferencedCommit: TARGET_COMMIT,
    targetCommit: TARGET_COMMIT,
    annotated: true,
    sourceRefs: sourceRefs(),
    rollbackRefs: [repoDocEvidence('docs/plans/v58-rollback-path-2026-06-14.md', 'v58 rollback path')],
    blockedReasons: []
  };
}

function readyGithubReleaseEvidence() {
  return {
    tagName: 'v58',
    name: 'v58',
    url: RELEASE_URL,
    isDraft: false,
    isPrerelease: false,
    publishedAt: '2026-06-14T02:26:15Z',
    assets: [],
    targetCommitish: 'main',
    sourceRefs: sourceRefs(),
    blockedReasons: []
  };
}

function sourceRefs() {
  return [
    {
      kind: 'git-tag',
      ref: 'refs/tags/v58',
      label: 'v58 annotated tag'
    },
    {
      kind: 'git-tag',
      ref: 'refs/tags/v58^{}',
      label: 'v58 dereferenced tag commit'
    },
    {
      kind: 'github-release',
      ref: RELEASE_URL,
      label: 'v58 GitHub Release'
    },
    {
      kind: 'branch',
      ref: 'origin/main',
      label: 'origin/main'
    },
    {
      kind: 'pr-list',
      ref: 'open-prs-empty',
      label: 'open PR list'
    }
  ];
}

function assertBlocked(evidence, reason) {
  const validation = validateReleasePublicationEvidenceContract(evidence);

  assert.equal(validation.ok, true, validation.errors.join('; '));
  assert.equal(evidence.state, 'blocked');
  assert.ok(evidence.blockedReasons.includes(reason), evidence.blockedReasons.join('; '));
  assertNoUnsafePayload(evidence);
}

function assertNoUnsafePayload(value) {
  const serialized = JSON.stringify(value);

  assert.doesNotMatch(serialized, /raw transcript|raw model output|provider output|provider session|session path|goal ledger|\.jsonl/iu);
  assert.doesNotMatch(serialized, /event-plan-confirm|append event directly|mark complete|Run Tag|Push Tag|Publish Release|Create GitHub Release|Edit GitHub Release|git push|gh release create|gh release edit|tag creation|release-ready declaration|shell command|terminal|provider launch|create next goal/iu);
}

function repoDocEvidence(ref, label) {
  return {
    kind: 'repo-doc',
    ref,
    label
  };
}
