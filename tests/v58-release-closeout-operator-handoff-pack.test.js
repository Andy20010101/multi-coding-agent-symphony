import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  RELEASE_CLOSEOUT_HANDOFF_BOUNDARIES,
  RELEASE_CLOSEOUT_HANDOFF_PACK_CONTRACT_NAME,
  RELEASE_EVIDENCE_CARRYOVER_REFS_CONTRACT_NAME,
  TAG_RELEASE_OPERATOR_CHECKLIST_CONTRACT_NAME,
  GITHUB_RELEASE_DRAFT_NOTICE_CONTRACT_NAME,
  NEXT_VERSION_START_CONTEXT_CONTRACT_NAME,
  ReleaseCloseoutHandoffPackContractError,
  assertReleaseCloseoutHandoffPackContract,
  buildReleaseCloseoutHandoffPack,
  validateGithubReleaseDraftNoticeContract,
  validateNextVersionStartContextContract,
  validateReleaseCloseoutHandoffPackContract,
  validateReleaseEvidenceCarryoverRefsContract,
  validateTagReleaseOperatorChecklistContract
} from '../src/symphony/release-closeout-handoff-pack-contracts.js';
import {
  buildReviewGateControlledConfirmationState,
  buildReviewGatePreview
} from '../src/symphony/review-gate-workbench-surface-contracts.js';
import {
  THREAD_HANDOFF_PACK_CONTRACT_NAME
} from '../src/symphony/thread-handoff-pack-contracts.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, '..');
const FIXTURE_DIR = join(REPO_ROOT, 'fixtures/contracts/release-closeout-handoff-pack');
const THREAD_FIXTURE_DIR = join(REPO_ROOT, 'fixtures/contracts/thread-handoff-pack');
const GENERATED_AT = '2026-06-14T03:00:00.000Z';
const GOAL_ID = 'v58-release-closeout-operator-handoff-pack';
const TASK_ID = 'pr-1-contracts-fixtures-tests';
const TARGET_COMMIT = '71745688de473013dd9a9878bfb609bc24e2a68f';
const STALE_COMMIT = '0fed2606977cc5a72619487f3732bb5a8da76f6e';

const VALID_FIXTURES = Object.freeze([
  'release-closeout-handoff-pack.ready.v1.json',
  'release-closeout-handoff-pack.blocked-missing-reviewer-verdict.v1.json',
  'release-closeout-handoff-pack.blocked-missing-main-gate-evidence.v1.json',
  'release-closeout-handoff-pack.blocked-missing-release-evidence.v1.json',
  'release-closeout-handoff-pack.blocked-dirty-release-baseline.v1.json',
  'release-closeout-handoff-pack.blocked-stale-target-commit.v1.json',
  'release-closeout-handoff-pack.blocked-missing-next-version-runbook.v1.json'
]);

describe('v58 release closeout operator handoff pack contracts', () => {
  it('validates ready and blocked fixture contracts without exposing mutation surfaces', () => {
    for (const name of VALID_FIXTURES) {
      const pack = fixture(name);
      const validation = validateReleaseCloseoutHandoffPackContract(pack);

      assert.equal(validation.ok, true, `${name}: ${validation.errors.join('; ')}`);
      assert.equal(pack.contractName, RELEASE_CLOSEOUT_HANDOFF_PACK_CONTRACT_NAME);
      assert.equal(pack.readOnly, true);
      assert.equal(pack.willMutate, false);
      assert.deepEqual(pack.boundaries, RELEASE_CLOSEOUT_HANDOFF_BOUNDARIES, name);
      assert.equal(pack.boundaries.gitTagAvailable, false);
      assert.equal(pack.boundaries.githubReleaseCreateAvailable, false);
      assert.equal(pack.boundaries.shellAvailable, false);
      assert.equal(pack.boundaries.directGoalEventAppendAvailable, false);
      assert.equal(pack.boundaries.automaticNextVersionGoalAvailable, false);

      assert.equal(pack.operatorChecklist.contractName, TAG_RELEASE_OPERATOR_CHECKLIST_CONTRACT_NAME);
      assert.equal(pack.tagReleaseChecklist.contractName, TAG_RELEASE_OPERATOR_CHECKLIST_CONTRACT_NAME);
      assert.equal(pack.releaseEvidenceCarryoverRefs.contractName, RELEASE_EVIDENCE_CARRYOVER_REFS_CONTRACT_NAME);
      assert.equal(pack.githubReleaseDraftNotice.contractName, GITHUB_RELEASE_DRAFT_NOTICE_CONTRACT_NAME);
      assert.equal(pack.nextVersionContext.contractName, NEXT_VERSION_START_CONTEXT_CONTRACT_NAME);
      assert.equal(validateTagReleaseOperatorChecklistContract(pack.tagReleaseChecklist).ok, true);
      assert.equal(validateReleaseEvidenceCarryoverRefsContract(pack.releaseEvidenceCarryoverRefs).ok, true);
      assert.equal(validateGithubReleaseDraftNoticeContract(pack.githubReleaseDraftNotice).ok, true);
      assert.equal(validateNextVersionStartContextContract(pack.nextVersionContext).ok, true);

      for (const status of Object.values(pack.tagReleaseChecklist.commandResults)) {
        assert.equal(status, 'not-run-by-product-code', name);
      }

      assert.equal(Array.isArray(pack.tagReleaseChecklist.validationEvidenceRefs), true);
      assert.equal(Array.isArray(pack.tagReleaseChecklist.rollbackRefs), true);
    }

    const ready = fixture('release-closeout-handoff-pack.ready.v1.json');
    const missingReviewer = fixture('release-closeout-handoff-pack.blocked-missing-reviewer-verdict.v1.json');
    const missingMainGate = fixture('release-closeout-handoff-pack.blocked-missing-main-gate-evidence.v1.json');
    const missingRelease = fixture('release-closeout-handoff-pack.blocked-missing-release-evidence.v1.json');
    const dirtyBaseline = fixture('release-closeout-handoff-pack.blocked-dirty-release-baseline.v1.json');
    const staleTarget = fixture('release-closeout-handoff-pack.blocked-stale-target-commit.v1.json');
    const missingNextRunbook = fixture('release-closeout-handoff-pack.blocked-missing-next-version-runbook.v1.json');

    assert.equal(ready.state, 'ready');
    assert.deepEqual(ready.blockedReasons, []);
    assert.equal(ready.targetCommit.commit, TARGET_COMMIT);
    assert.equal(ready.nextVersionContext.createsGoal, false);
    assert.equal(ready.nextVersionContext.entersNextVersion, false);
    assert.equal(ready.githubReleaseDraftNotice.assetsExpected.length, 0);
    assert.ok(ready.tagReleaseChecklist.validationEvidenceRefs.some((ref) => ref.ref === 'docs/plans/v58-validation-evidence-2026-06-14.md'));
    assert.ok(ready.tagReleaseChecklist.rollbackRefs.some((ref) => ref.ref === 'docs/plans/v58-rollback-path-2026-06-14.md'));
    assert.equal(ready.tagReleaseChecklist.nextVersionRunbookRef.ref, 'docs/plans/v59-runbook-2026-06-14.md');

    assert.equal(missingReviewer.state, 'blocked');
    assert.ok(missingReviewer.blockedReasons.includes('missing-reviewer-verdict'));
    assert.equal(missingReviewer.reviewGateSource.reviewReadiness.state, 'blocked');

    assert.equal(missingMainGate.state, 'blocked');
    assert.ok(missingMainGate.blockedReasons.includes('missing-main-gate-evidence'));
    assert.equal(missingMainGate.reviewGateSource.mainGateReadiness.state, 'blocked');

    assert.equal(missingRelease.state, 'blocked');
    assert.ok(missingRelease.blockedReasons.includes('missing-release-evidence'));
    assert.equal(missingRelease.reviewGateSource.releaseGateReadiness.state, 'blocked');

    assert.equal(dirtyBaseline.state, 'blocked');
    assert.ok(dirtyBaseline.blockedReasons.includes('dirty-or-diverged-release-baseline'));
    assert.ok(dirtyBaseline.blockedReasons.includes('release-baseline-not-main'));
    assert.ok(dirtyBaseline.blockedReasons.includes('release-baseline-dirty'));

    assert.equal(staleTarget.state, 'blocked');
    assert.ok(staleTarget.blockedReasons.includes('stale-target-commit'));
    assert.equal(staleTarget.targetCommit.stale, true);
    assert.equal(staleTarget.targetCommit.expectedCommit, STALE_COMMIT);

    assert.equal(missingNextRunbook.state, 'blocked');
    assert.ok(missingNextRunbook.blockedReasons.includes('missing-next-version-runbook'));
    assert.equal(missingNextRunbook.nextVersionContext.runbookRef, null);
  });

  it('builds a ready handoff pack from v57 review gate and read-only closeout sources', () => {
    const input = readyInput();
    const pack = buildReleaseCloseoutHandoffPack(input);

    assertReleaseCloseoutHandoffPackContract(pack);
    assert.equal(pack.state, 'ready');
    assert.equal(pack.goal.goalId, GOAL_ID);
    assert.equal(pack.reviewGateSource.state, 'ready');
    assert.equal(pack.closeoutSource.state, 'ready');
    assert.equal(pack.releaseBaseline.state, 'ready');
    assert.equal(pack.targetCommit.commit, TARGET_COMMIT);
    assert.equal(pack.tagReleaseChecklist.targetTag, 'v58');
    assert.ok(pack.tagReleaseChecklist.validationEvidenceRefs.some((ref) => ref.ref === 'docs/plans/v58-validation-evidence-2026-06-14.md'));
    assert.ok(pack.tagReleaseChecklist.rollbackRefs.some((ref) => ref.ref === 'docs/plans/v58-rollback-path-2026-06-14.md'));
    assert.equal(pack.tagReleaseChecklist.nextVersionRunbookRef.ref, 'docs/plans/v59-runbook-2026-06-14.md');
    assert.equal(pack.githubReleaseDraftNotice.releaseUrlState, 'not-published-by-product-code');
    assert.equal(pack.nextVersionContext.nextVersion, 'v59');
    assert.equal(pack.nextVersionContext.createsGoal, false);
    assert.equal(pack.nextVersionContext.entersNextVersion, false);
    assert.deepEqual(pack.boundaries, RELEASE_CLOSEOUT_HANDOFF_BOUNDARIES);
    assert.deepEqual(
      pack.sourceContracts.map((source) => source.contractName),
      [
        'reviewGatePreview.v1',
        'reviewGateControlledConfirmationState.v1',
        'goal-closeout-report.v1',
        'release-baseline-resolver.v1'
      ]
    );
  });

  it('blocks missing gates, dirty baselines, stale targets, and missing next-version runbook refs', () => {
    assertBlocked(
      buildReleaseCloseoutHandoffPack({
        ...readyInput(),
        reviewGatePreview: withReadinessState(readyInput().reviewGatePreview, 'reviewReadiness', 'blocked')
      }),
      'missing-reviewer-verdict'
    );
    assertBlocked(
      buildReleaseCloseoutHandoffPack({
        ...readyInput(),
        reviewGatePreview: withReadinessState(readyInput().reviewGatePreview, 'mainGateReadiness', 'blocked')
      }),
      'missing-main-gate-evidence'
    );
    assertBlocked(
      buildReleaseCloseoutHandoffPack({
        ...readyInput(),
        reviewGatePreview: withReadinessState(readyInput().reviewGatePreview, 'releaseGateReadiness', 'blocked'),
        releaseGateEvidenceRefs: []
      }),
      'missing-release-evidence'
    );
    assertBlocked(
      buildReleaseCloseoutHandoffPack({
        ...readyInput(),
        releaseBaseline: dirtyReleaseBaseline()
      }),
      'dirty-or-diverged-release-baseline'
    );
    assertBlocked(
      buildReleaseCloseoutHandoffPack({
        ...readyInput(),
        expectedTargetCommit: STALE_COMMIT
      }),
      'stale-target-commit'
    );
    assertBlocked(
      buildReleaseCloseoutHandoffPack({
        ...readyInput(),
        nextVersionRunbookRef: null
      }),
      'missing-next-version-runbook'
    );
  });

  it('rejects raw transcript, local session, and mutation fixture drift', () => {
    const rawTranscript = validateReleaseCloseoutHandoffPackContract(fixture('release-closeout-handoff-pack.raw-transcript.invalid.v1.json'));
    const localSession = validateReleaseCloseoutHandoffPackContract(fixture('release-closeout-handoff-pack.local-session.invalid.v1.json'));
    const unsafeMutation = validateReleaseCloseoutHandoffPackContract(fixture('release-closeout-handoff-pack.unsafe-mutation.invalid.v1.json'));

    assert.equal(rawTranscript.ok, false);
    assert.ok(rawTranscript.errors.some((error) => error.includes('rawTranscript')), rawTranscript.errors.join('; '));
    assert.ok(rawTranscript.errors.some((error) => error.includes('raw provider output')), rawTranscript.errors.join('; '));

    assert.equal(localSession.ok, false);
    assert.ok(localSession.errors.some((error) => error.includes('local session refs')), localSession.errors.join('; '));
    assert.ok(localSession.errors.some((error) => error.includes('evidenceRefs')), localSession.errors.join('; '));

    assert.equal(unsafeMutation.ok, false);
    assert.ok(unsafeMutation.errors.includes('boundaries.gitTagAvailable must be false'));
    assert.ok(unsafeMutation.errors.some((error) => error.includes('shell commands')), unsafeMutation.errors.join('; '));
  });

  it('throws before building from unsafe source payload', () => {
    assert.throws(
      () => buildReleaseCloseoutHandoffPack({
        ...readyInput(),
        releaseNotesRefs: [repoDocEvidence('/Users/andy/.codex/sessions/v58.jsonl', 'local session file')]
      }),
      (error) => {
        assert.equal(error instanceof ReleaseCloseoutHandoffPackContractError, true);
        assert.equal(error.code, 'unsafe-release-closeout-handoff-source');
        assert.match(error.details.reason, /releaseNotesRefs/u);
        return true;
      }
    );
  });

  it('rejects boundary drift in asserted packs', () => {
    const pack = fixture('release-closeout-handoff-pack.ready.v1.json');

    pack.boundaries.githubReleaseCreateAvailable = true;

    assert.throws(
      () => assertReleaseCloseoutHandoffPackContract(pack),
      (error) => {
        assert.equal(error instanceof ReleaseCloseoutHandoffPackContractError, true);
        assert.equal(error.code, 'invalid-release-closeout-handoff-pack');
        assert.ok(error.details.errors.includes('boundaries.githubReleaseCreateAvailable must be false'));
        return true;
      }
    );
  });
});

function fixture(name) {
  return JSON.parse(readFileSync(join(FIXTURE_DIR, name), 'utf8'));
}

function threadFixture(name) {
  return JSON.parse(readFileSync(join(THREAD_FIXTURE_DIR, name), 'utf8'));
}

function readyInput() {
  const reviewGatePreview = buildReadyReviewGatePreview();
  const reviewGateConfirmationState = buildReviewGateControlledConfirmationState({
    generatedAt: GENERATED_AT,
    reviewGatePreview,
    eventFamily: 'release-gate',
    operatorId: 'operator-v58-controller'
  });

  return {
    generatedAt: GENERATED_AT,
    goal: goalInput(),
    reviewGatePreview,
    reviewGateConfirmationState,
    closeoutReport: closeoutReport(),
    releaseBaseline: readyReleaseBaseline(),
    targetCommit: { commit: TARGET_COMMIT, source: 'release-baseline-resolver.v1' },
    expectedTargetCommit: TARGET_COMMIT,
    releaseTag: 'v58',
    releaseTitle: 'v58 release',
    reviewerEvidenceRefs: [repoDocEvidence('docs/plans/v58-reviewer-evidence-2026-06-14.md', 'v58 reviewer evidence')],
    mainGateEvidenceRefs: [repoDocEvidence('docs/plans/v58-main-gate-evidence-2026-06-14.md', 'v58 main gate evidence')],
    releaseGateEvidenceRefs: [repoDocEvidence('docs/plans/v58-release-gate-evidence-2026-06-14.md', 'v58 release gate evidence')],
    validationEvidenceRefs: [repoDocEvidence('docs/plans/v58-validation-evidence-2026-06-14.md', 'v58 validation evidence')],
    tagEvidenceRefs: [repoDocEvidence('docs/plans/v58-tag-release-evidence-2026-06-14.md', 'v58 tag and release evidence')],
    releaseNotesRefs: [repoDocEvidence('docs/plans/v58-release-notes-2026-06-14.md', 'v58 release notes')],
    rollbackRefs: [repoDocEvidence('docs/plans/v58-rollback-path-2026-06-14.md', 'v58 rollback path')],
    nextVersion: 'v59',
    nextVersionRunbookRef: repoDocEvidence('docs/plans/v59-runbook-2026-06-14.md', 'v59 runbook'),
    knownFacts: [
      'main and origin/main match target commit 71745688de473013dd9a9878bfb609bc24e2a68f',
      'v58 tag and GitHub Release are not published by product code'
    ]
  };
}

function buildReadyReviewGatePreview() {
  return buildReviewGatePreview({
    generatedAt: GENERATED_AT,
    goal: goalInput(),
    task: taskInput(),
    threadHandoffPack: threadFixture('thread-handoff-pack.ready-reviewer-handoff.v1.json'),
    target: 'release-gate',
    reviewerEvidenceRefs: [repoDocEvidence('docs/plans/v58-reviewer-evidence-2026-06-14.md', 'v58 reviewer evidence')],
    mainGateEvidenceRefs: [repoDocEvidence('docs/plans/v58-main-gate-evidence-2026-06-14.md', 'v58 main gate evidence')],
    releaseGateEvidenceRefs: [repoDocEvidence('docs/plans/v58-release-gate-evidence-2026-06-14.md', 'v58 release gate evidence')]
  });
}

function goalInput() {
  return {
    goalId: GOAL_ID,
    title: 'v58 Release Closeout Operator Handoff Pack',
    state: 'active',
    sourceContract: THREAD_HANDOFF_PACK_CONTRACT_NAME,
    sourceRef: {
      kind: 'contract',
      ref: THREAD_HANDOFF_PACK_CONTRACT_NAME,
      label: 'v58 goal source'
    }
  };
}

function taskInput() {
  return {
    taskId: TASK_ID,
    title: 'Contracts, fixtures, and tests',
    state: 'active',
    sourceContract: THREAD_HANDOFF_PACK_CONTRACT_NAME,
    sourceRef: {
      kind: 'contract',
      ref: THREAD_HANDOFF_PACK_CONTRACT_NAME,
      label: 'v58 task source'
    }
  };
}

function closeoutReport() {
  return {
    contractName: 'goal-closeout-report.v1',
    contractVersion: 1,
    goalId: GOAL_ID,
    title: 'v58 closeout report',
    summary: {
      workerEvidenceComplete: true,
      reviewEvidenceComplete: true,
      mainVerificationComplete: true,
      releaseReady: false,
      releaseReadySource: 'not-declared-by-product-code'
    },
    missing: [],
    blockedReasons: [],
    sourceRef: {
      kind: 'contract',
      ref: 'goal-closeout-report.v1',
      label: 'goal closeout report'
    }
  };
}

function readyReleaseBaseline() {
  return {
    contractName: 'release-baseline-resolver.v1',
    contractVersion: 1,
    status: 'ready',
    currentBranch: 'main',
    currentHeadFull: TARGET_COMMIT,
    mainHead: TARGET_COMMIT,
    originMainHead: TARGET_COMMIT,
    clean: true,
    blockedReasons: [],
    sourceRef: {
      kind: 'contract',
      ref: 'release-baseline-resolver.v1',
      label: 'release baseline'
    }
  };
}

function dirtyReleaseBaseline() {
  return {
    ...readyReleaseBaseline(),
    status: 'blocked',
    currentBranch: 'codex/v58-release-closeout-contracts-fixtures-tests',
    clean: false,
    blockedReasons: ['worktree-not-on-main']
  };
}

function withReadinessState(preview, readinessKey, state) {
  return {
    ...preview,
    [readinessKey]: {
      ...preview[readinessKey],
      state,
      blockedReasons: [`${readinessKey}-not-ready`]
    },
    blockedReasons: [`${readinessKey}-not-ready`]
  };
}

function assertBlocked(pack, reason) {
  assert.equal(validateReleaseCloseoutHandoffPackContract(pack).ok, true);
  assert.equal(pack.state, 'blocked');
  assert.ok(pack.blockedReasons.includes(reason), pack.blockedReasons.join('; '));
}

function repoDocEvidence(ref, label) {
  return {
    kind: 'repo-doc',
    ref,
    label
  };
}
