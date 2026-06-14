import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  buildGoalSupervisorAppReadModel
} from '../src/symphony/goal-supervisor/index.js';
import {
  RELEASE_PUBLICATION_EVIDENCE_BOUNDARIES,
  RELEASE_PUBLICATION_EVIDENCE_CONTRACT_NAME,
  validateReleasePublicationEvidenceContract
} from '../src/symphony/release-publication-evidence-contracts.js';

const GENERATED_AT = '2026-06-14T04:45:00.000Z';
const GOAL_ID = 'v59-release-publication-evidence-and-next-start-audit';
const TASK_ID = 'pr-2-backend-projection';
const TARGET_COMMIT = '7cedfbd8457f78f3f73fc91201a932d780119052';
const STALE_COMMIT = '71745688de473013dd9a9878bfb609bc24e2a68f';
const TAG_OBJECT_SHA = 'd4046a05f8a5f44e998d2763ea3c11db4487401e';
const RELEASE_URL = 'https://github.com/Andy20010101/multi-coding-agent-symphony/releases/tag/v58';

describe('v59 release publication backend projection', () => {
  it('projects ready publication evidence from controller-supplied tag and GitHub Release refs', () => {
    const model = readyReadModel();
    const evidence = model.releasePublicationEvidence;
    const validation = validateReleasePublicationEvidenceContract(evidence);

    assert.equal(evidence.contractName, RELEASE_PUBLICATION_EVIDENCE_CONTRACT_NAME);
    assert.equal(validation.ok, true, validation.errors.join('; '));
    assert.equal(evidence.state, 'ready');
    assert.equal(evidence.goal.goalId, GOAL_ID);
    assert.equal(evidence.sourceCloseoutHandoff.contractName, 'releaseCloseoutHandoffPack.v1');
    assert.equal(evidence.sourceCloseoutHandoff.releaseTag, 'v58');
    assert.equal(evidence.sourceCloseoutHandoff.targetCommit, TARGET_COMMIT);
    assert.equal(evidence.tagEvidence.tagObjectSha, TAG_OBJECT_SHA);
    assert.equal(evidence.tagEvidence.dereferencedCommit, TARGET_COMMIT);
    assert.equal(evidence.githubReleaseEvidence.url, RELEASE_URL);
    assert.equal(evidence.githubReleaseEvidence.isDraft, false);
    assert.equal(evidence.githubReleaseEvidence.isPrerelease, false);
    assert.deepEqual(evidence.githubReleaseEvidence.assets, []);
    assert.equal(evidence.githubReleaseEvidence.targetCommitish, 'main');
    assert.equal(evidence.targetCommit.matchesTag, true);
    assert.equal(evidence.targetCommit.matchesReleaseTarget, true);
    assert.equal(evidence.nextVersionStartAudit.nextVersion, 'v59');
    assert.equal(evidence.nextVersionStartAudit.nextRunbookRef.ref, 'docs/plans/v59-runbook-2026-06-14.md');
    assert.equal(evidence.nextVersionStartAudit.openPrCount, 0);
    assert.equal(evidence.nextVersionStartAudit.startAllowed, true);
    assert.deepEqual(evidence.boundaries, RELEASE_PUBLICATION_EVIDENCE_BOUNDARIES);
    assertNoUnsafePayload(evidence);
  });

  it('blocks missing release evidence and target mismatches without exposing release automation routes', () => {
    const missingRelease = readyReadModel({
      releasePublication: {
        ...readyReleasePublication(),
        githubReleaseEvidence: null
      }
    }).releasePublicationEvidence;
    const staleTag = readyReadModel({
      releasePublication: {
        ...readyReleasePublication(),
        tagEvidence: {
          ...readyTagEvidence(),
          dereferencedCommit: STALE_COMMIT
        }
      }
    }).releasePublicationEvidence;
    const staleReleaseTarget = readyReadModel({
      releasePublication: {
        ...readyReleasePublication(),
        githubReleaseEvidence: {
          ...readyGithubReleaseEvidence(),
          targetCommitish: STALE_COMMIT
        }
      }
    }).releasePublicationEvidence;

    assertBlocked(missingRelease, 'missing-github-release-evidence');
    assertBlocked(staleTag, 'tag-target-mismatch');
    assertBlocked(staleReleaseTarget, 'github-release-target-mismatch');
  });

  it('sanitizes unsafe publication refs into blockers instead of projecting local files', () => {
    const unsafeSource = readyReadModel({
      releasePublication: {
        ...readyReleasePublication(),
        sourceRefs: [{
          kind: 'repo-doc',
          ref: '/Users/andy/.codex/sessions/v59.jsonl',
          label: 'local session file'
        }]
      }
    }).releasePublicationEvidence;
    const unsafeTagSource = readyReadModel({
      releasePublication: {
        ...readyReleasePublication(),
        tagEvidence: {
          ...readyTagEvidence(),
          sourceRefs: [{
            kind: 'repo-doc',
            ref: '/Users/andy/.codex/sessions/v59.jsonl',
            label: 'local session file'
          }]
        }
      }
    }).releasePublicationEvidence;

    assertBlocked(unsafeSource, 'unsafe-publication-source-ref');
    assertBlocked(unsafeTagSource, 'unsafe-tag-publication-source-ref');
    assertNoUnsafePayload(unsafeSource);
    assertNoUnsafePayload(unsafeTagSource);
  });
});

function readyReadModel({
  releasePublication = readyReleasePublication()
} = {}) {
  return buildGoalSupervisorAppReadModel({
    goalId: GOAL_ID,
    title: 'v59 Release Publication Evidence and Next Start Audit',
    tasks: [{
      taskId: TASK_ID,
      title: 'Backend projection',
      status: 'active'
    }],
    releasePublication,
    nowMs: Date.parse(GENERATED_AT)
  });
}

function readyReleasePublication() {
  return {
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
      'v58 annotated tag dereferences to 7cedfbd8457f78f3f73fc91201a932d780119052',
      'v58 GitHub Release is non-draft, non-prerelease, and asset-free'
    ],
    rollbackRefs: [repoDocEvidence('docs/plans/v58-rollback-path-2026-06-14.md', 'v58 rollback path')],
    sourceRefs: sourceRefs()
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
    sourceRefs: sourceRefs().filter((ref) => ref.kind === 'git-tag'),
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
    sourceRefs: sourceRefs().filter((ref) => ref.kind === 'github-release'),
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

  assert.doesNotMatch(serialized, /raw transcript|raw model output|provider output|provider session|session path|goal ledger|\.jsonl|\/Users\//iu);
  assert.doesNotMatch(serialized, /event-plan-confirm|append event directly|mark complete|Run Tag|Push Tag|Publish Release|Create GitHub Release|Edit GitHub Release|git push|gh release create|gh release edit|tag creation|release-ready declaration|shell command|terminal|provider launch|create next goal/iu);
}

function repoDocEvidence(ref, label) {
  return {
    kind: 'repo-doc',
    ref,
    label
  };
}
