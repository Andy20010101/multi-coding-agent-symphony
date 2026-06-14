import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  buildGoalSupervisorAppReadModel
} from '../src/symphony/goal-supervisor/index.js';
import {
  buildPendingResultFromEscrow,
  buildResultEvidenceEscrow,
  buildResultIntakePreview
} from '../src/symphony/result-intake-contracts.js';
import {
  RELEASE_CLOSEOUT_HANDOFF_BOUNDARIES,
  RELEASE_CLOSEOUT_HANDOFF_PACK_CONTRACT_NAME,
  validateReleaseCloseoutHandoffPackContract
} from '../src/symphony/release-closeout-handoff-pack-contracts.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, '..');
const V54_FIXTURE_DIR = join(REPO_ROOT, 'fixtures/contracts/codex-provider-execution');
const GENERATED_AT = '2026-06-14T04:00:00.000Z';
const GOAL_ID = 'v58-release-closeout-operator-handoff-pack';
const TASK_ID = 'pr-2-backend-projection';
const TARGET_COMMIT = '8384f51e1911f69857cb43316c966fd36a7da76f';
const STALE_COMMIT = '71745688de473013dd9a9878bfb609bc24e2a68f';

describe('v58 release closeout backend projection', () => {
  it('projects a ready release closeout handoff pack from backend read-model sources', () => {
    const model = readyReadModel();
    const pack = model.releaseCloseoutHandoffPack;
    const validation = validateReleaseCloseoutHandoffPackContract(pack);

    assert.equal(pack.contractName, RELEASE_CLOSEOUT_HANDOFF_PACK_CONTRACT_NAME);
    assert.equal(validation.ok, true, validation.errors.join('; '));
    assert.equal(pack.state, 'ready');
    assert.equal(pack.goal.goalId, GOAL_ID);
    assert.equal(pack.reviewGateSource.state, 'ready');
    assert.equal(pack.closeoutSource.state, 'ready');
    assert.equal(pack.releaseBaseline.state, 'ready');
    assert.equal(pack.targetCommit.commit, TARGET_COMMIT);
    assert.equal(pack.tagReleaseChecklist.targetTag, 'v58');
    assert.equal(pack.githubReleaseDraftNotice.releaseUrlState, 'not-published-by-product-code');
    assert.equal(pack.nextVersionContext.nextVersion, 'v59');
    assert.equal(pack.nextVersionContext.createsGoal, false);
    assert.equal(pack.nextVersionContext.entersNextVersion, false);
    assert.deepEqual(pack.boundaries, RELEASE_CLOSEOUT_HANDOFF_BOUNDARIES);
    assert.ok(pack.evidenceRefs.some((ref) => ref.ref === 'docs/plans/v58-main-gate-evidence-2026-06-14.md'));
    assert.ok(pack.evidenceRefs.some((ref) => ref.ref === 'docs/plans/v58-release-gate-evidence-2026-06-14.md'));
    assert.ok(pack.evidenceRefs.some((ref) => ref.ref === 'docs/plans/v58-validation-evidence-2026-06-14.md'));
    assertNoUnsafePayload(pack);
  });

  it('blocks missing release evidence without exposing release mutation routes', () => {
    const model = readyReadModel({
      timelineEvents: mainGateEvents()
    });
    const pack = model.releaseCloseoutHandoffPack;

    assert.equal(validateReleaseCloseoutHandoffPackContract(pack).ok, true);
    assert.equal(pack.state, 'blocked');
    assert.ok(pack.blockedReasons.includes('missing-release-evidence'));
    assert.equal(pack.reviewGateSource.releaseGateReadiness.state, 'blocked');
    assertNoUnsafePayload(pack);
  });

  it('blocks dirty baselines, stale target commits, and unsafe release note refs', () => {
    const dirty = readyReadModel({
      releaseCloseout: {
        ...readyReleaseCloseout(),
        releaseBaseline: dirtyReleaseBaseline()
      }
    }).releaseCloseoutHandoffPack;
    const stale = readyReadModel({
      releaseCloseout: {
        ...readyReleaseCloseout(),
        expectedTargetCommit: STALE_COMMIT
      }
    }).releaseCloseoutHandoffPack;
    const unsafe = readyReadModel({
      releaseCloseout: {
        ...readyReleaseCloseout(),
        releaseNotesRefs: [{
          kind: 'repo-doc',
          ref: '/Users/andy/.codex/sessions/v58.jsonl',
          label: 'local session file'
        }]
      }
    }).releaseCloseoutHandoffPack;

    assert.equal(validateReleaseCloseoutHandoffPackContract(dirty).ok, true);
    assert.equal(dirty.state, 'blocked');
    assert.ok(dirty.blockedReasons.includes('dirty-or-diverged-release-baseline'));
    assert.ok(dirty.blockedReasons.includes('release-baseline-not-main'));
    assert.ok(dirty.blockedReasons.includes('release-baseline-dirty'));

    assert.equal(validateReleaseCloseoutHandoffPackContract(stale).ok, true);
    assert.equal(stale.state, 'blocked');
    assert.ok(stale.blockedReasons.includes('stale-target-commit'));
    assert.equal(stale.targetCommit.stale, true);

    assert.equal(validateReleaseCloseoutHandoffPackContract(unsafe).ok, true);
    assert.equal(unsafe.state, 'blocked');
    assert.ok(unsafe.blockedReasons.includes('unsafe-release-notes-ref'));
    assertNoUnsafePayload(unsafe);
  });
});

function readyReadModel({
  timelineEvents = readyTimelineEvents(),
  releaseCloseout = readyReleaseCloseout()
} = {}) {
  const completedRun = v54Fixture('run-record.completed.v1.json');
  const previewOnlyModel = buildGoalSupervisorAppReadModel(readModelInputForRun({
    runRecord: completedRun,
    nowMs: Date.parse(GENERATED_AT)
  }));
  const alignedRun = alignRunRecordWithPreview(
    completedRun,
    previewOnlyModel.codexProviderExecutionPreview
  );
  const pendingResult = pendingResultForRunRecord(alignedRun);

  return buildGoalSupervisorAppReadModel(readModelInputForRun({
    runRecord: alignedRun,
    pendingResult,
    threadContinuationDecision: continuationDecision({
      decision: 'continue',
      targetRole: 'reviewer',
      taskId: alignedRun.taskId
    }),
    reviewGateTarget: 'release-gate',
    reviewGateOperatorId: 'operator-v58-controller',
    timelineEvents,
    goalCloseout: closeoutReport(),
    releaseCloseout,
    nowMs: Date.parse(GENERATED_AT)
  }));
}

function readModelInputForRun({
  runRecord,
  pendingResult = null,
  threadContinuationDecision = continuationDecision({
    decision: 'continue',
    targetRole: 'reviewer',
    taskId: runRecord.taskId
  }),
  reviewGateTarget = 'release-gate',
  reviewGateOperatorId = 'operator-v58-controller',
  timelineEvents = readyTimelineEvents(),
  goalCloseout,
  releaseCloseout,
  nowMs
}) {
  return {
    goalId: GOAL_ID,
    title: 'v58 Release Closeout Operator Handoff Pack',
    tasks: [{
      taskId: runRecord.taskId,
      title: 'Backend projection',
      status: 'active'
    }],
    timelineEvents,
    goalNext: {
      contractName: 'goal-next-action.v1',
      contractVersion: 1,
      goalId: runRecord.goalId,
      status: 'action-required',
      next: {
        taskId: runRecord.taskId,
        role: 'worker',
        phase: 'release-gate',
        gateName: 'release.validation'
      },
      reason: 'release closeout handoff projection is next'
    },
    contextAdvisory: contextAdvisory(),
    threadContinuationDecision,
    pendingResultState: pendingResult,
    codexProviderRunRecord: runRecord,
    reviewGateTarget,
    reviewGateOperatorId,
    goalCloseout,
    releaseCloseout,
    nowMs
  };
}

function v54Fixture(name) {
  return JSON.parse(readFileSync(join(V54_FIXTURE_DIR, name), 'utf8'));
}

function pendingResultForRunRecord(runRecord) {
  const preview = buildResultIntakePreview(runRecord.resultIntakeRequest, {
    generatedAt: '2026-06-14T03:10:00.000Z',
    expiresAt: '2026-06-14T03:25:00.000Z'
  });
  const escrow = buildResultEvidenceEscrow(preview, {
    createdAt: '2026-06-14T03:11:00.000Z',
    now: '2026-06-14T03:11:00.000Z'
  });

  return buildPendingResultFromEscrow(escrow);
}

function contextAdvisory() {
  return {
    contractName: 'contextAdvisory.v1',
    contractVersion: 1,
    generatedAt: GENERATED_AT,
    readOnly: true,
    willMutate: false,
    resultBlockEvidence: {
      status: 'present',
      present: true,
      evidenceRef: 'docs/plans/v58-release-closeout-operator-handoff-pack-runbook-2026-06-14.md'
    }
  };
}

function continuationDecision({
  decision,
  targetRole = 'worker',
  taskId = TASK_ID,
  reason = 'copy-only release closeout projection'
} = {}) {
  return {
    contractName: 'threadContinuationDecision.v1',
    contractVersion: 1,
    generatedAt: GENERATED_AT,
    readOnly: true,
    willMutate: false,
    decision,
    reason,
    confidence: 'known',
    targetRole,
    taskId,
    threadId: 'thread-v58-pr-2',
    checkpointRef: null,
    waitPolicy: null,
    blockedFields: [],
    mismatchList: [],
    requiredEvidence: [],
    sourceContracts: [{
      contractName: 'contextAdvisory.v1',
      contractVersion: 1,
      readOnly: true,
      sourceRef: {
        kind: 'contract',
        ref: 'contextAdvisory.v1'
      }
    }],
    commandBoundary: {
      executionAvailable: false,
      copyOnly: true
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

function readyReleaseCloseout() {
  return {
    releaseBaseline: readyReleaseBaseline(),
    targetCommit: {
      commit: TARGET_COMMIT,
      source: 'release-baseline-resolver.v1'
    },
    expectedTargetCommit: TARGET_COMMIT,
    releaseTag: 'v58',
    releaseTitle: 'v58 release',
    validationEvidenceRefs: [repoDocEvidence('docs/plans/v58-validation-evidence-2026-06-14.md', 'v58 validation evidence')],
    tagEvidenceRefs: [repoDocEvidence('docs/plans/v58-tag-release-evidence-2026-06-14.md', 'v58 tag and release evidence')],
    releaseNotesRefs: [repoDocEvidence('docs/plans/v58-release-notes-2026-06-14.md', 'v58 release notes')],
    nextVersion: 'v59',
    nextVersionRunbookRef: repoDocEvidence('docs/plans/v59-runbook-2026-06-14.md', 'v59 runbook'),
    knownFacts: [
      'main and origin/main match target commit 8384f51e1911f69857cb43316c966fd36a7da76f',
      'v58 tag and GitHub Release are not published by product code'
    ]
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
    currentBranch: 'codex/v58-release-closeout-backend-projection',
    clean: false,
    blockedReasons: ['worktree-not-on-main']
  };
}

function readyTimelineEvents() {
  return [
    ...mainGateEvents(),
    {
      eventId: 'evt-v58-release-gate-evidence',
      taskId: TASK_ID,
      role: 'release-verifier',
      status: 'release.gate-passed',
      evidenceRef: 'docs/plans/v58-release-gate-evidence-2026-06-14.md',
      hashChainState: 'valid',
      occurredAt: GENERATED_AT
    }
  ];
}

function mainGateEvents() {
  return [{
    eventId: 'evt-v58-main-gate-evidence',
    taskId: TASK_ID,
    role: 'main-verifier',
    status: 'main.verification-passed',
    evidenceRef: 'docs/plans/v58-main-gate-evidence-2026-06-14.md',
    hashChainState: 'valid',
    occurredAt: GENERATED_AT
  }];
}

function repoDocEvidence(ref, label) {
  return {
    kind: 'repo-doc',
    ref,
    label
  };
}

function alignRunRecordWithPreview(runRecord, preview) {
  const aligned = structuredClone(runRecord);

  aligned.previewHash = preview.previewHash;
  aligned.sourceContracts = aligned.sourceContracts.map((contract) => (
    contract.previewHash === undefined
      ? contract
      : {
          ...contract,
          previewHash: preview.previewHash
        }
  ));

  return aligned;
}

function assertNoUnsafePayload(value) {
  const serialized = JSON.stringify(value);

  assert.doesNotMatch(serialized, /raw transcript|raw model output|provider output|provider session|session path|goal ledger|\.jsonl/iu);
  assert.doesNotMatch(serialized, /event-plan-confirm|append event|mark complete|Run Tag|Push Tag|Publish Release|Create GitHub Release|git push|gh release|tag creation|publish release/iu);
}
