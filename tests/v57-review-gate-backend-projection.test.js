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
  REVIEW_GATE_BOUNDARIES,
  REVIEW_GATE_PREVIEW_CONTRACT_NAME,
  validateReviewGatePreviewContract
} from '../src/symphony/review-gate-workbench-surface-contracts.js';
import {
  THREAD_HANDOFF_PACK_CONTRACT_NAME
} from '../src/symphony/thread-handoff-pack-contracts.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, '..');
const V54_FIXTURE_DIR = join(REPO_ROOT, 'fixtures/contracts/codex-provider-execution');
const GENERATED_AT = '2026-06-14T02:00:00.000Z';
const GOAL_ID = 'v57-review-gate-workbench-surface';
const TASK_ID = 'pr-2-backend-projection';

describe('v57 review gate backend projection', () => {
  it('projects a ready reviewer verdict preview from the backend thread handoff pack', () => {
    const model = readyReadModel();
    const preview = model.reviewGatePreview;

    assert.equal(preview.contractName, REVIEW_GATE_PREVIEW_CONTRACT_NAME);
    assert.equal(validateReviewGatePreviewContract(preview).ok, true);
    assert.equal(preview.sourceThreadHandoffPack.contractName, THREAD_HANDOFF_PACK_CONTRACT_NAME);
    assert.equal(preview.sourceThreadHandoffPack.state, 'ready');
    assert.equal(preview.reviewReadiness.state, 'ready');
    assert.equal(preview.mainGateReadiness.state, 'blocked');
    assert.equal(preview.releaseGateReadiness.state, 'not-requested');
    assert.deepEqual(preview.blockedReasons, []);
    assert.equal(preview.confirmationPreviews.length, 1);
    assert.equal(preview.confirmationPreviews[0].eventType, 'reviewer.approved');
    assert.equal(preview.confirmationPreviews[0].requiresOperatorConfirmation, true);
    assert.deepEqual(preview.boundaries, REVIEW_GATE_BOUNDARIES);
    assert.equal(preview.boundaries.controlledEventRegistrationAvailable, true);
    assert.equal(preview.boundaries.directGoalEventAppendAvailable, false);
    assert.ok(preview.requiredEvidenceRefs.length > 0);
    assertNoUnsafePayload(preview);
  });

  it('can project a controlled main gate preview when backend evidence is present', () => {
    const model = readyReadModel({
      reviewGateTarget: 'main-gate',
      timelineEvents: [{
        eventId: 'evt-v57-main-gate-evidence',
        taskId: TASK_ID,
        role: 'main-verifier',
        status: 'main.verification-passed',
        evidenceRef: 'docs/plans/v57-main-gate-evidence-2026-06-14.md',
        hashChainState: 'valid',
        occurredAt: GENERATED_AT
      }]
    });
    const preview = model.reviewGatePreview;

    assert.equal(validateReviewGatePreviewContract(preview).ok, true);
    assert.equal(preview.reviewReadiness.state, 'ready');
    assert.equal(preview.mainGateReadiness.state, 'ready');
    assert.equal(preview.confirmationPreviews.length, 1);
    assert.equal(preview.confirmationPreviews[0].eventType, 'main.verification-passed');
    assert.equal(preview.nextSafeAction.actionId, 'preview-main-gate-registration');
    assert.ok(
      preview.requiredEvidenceRefs.some((ref) => ref.ref === 'docs/plans/v57-main-gate-evidence-2026-06-14.md'),
      JSON.stringify(preview.requiredEvidenceRefs)
    );
    assertNoUnsafePayload(preview);
  });

  it('projects blocked review gate previews when backend source state is missing or stale', () => {
    const missingModel = buildGoalSupervisorAppReadModel({
      goalId: GOAL_ID,
      title: 'v57 Review Gate Workbench Surface',
      tasks: [{
        taskId: TASK_ID,
        title: 'Backend projection',
        status: 'active'
      }],
      contextAdvisory: contextAdvisory(),
      threadContinuationDecision: continuationDecision({
        decision: 'continue',
        targetRole: 'reviewer',
        taskId: TASK_ID
      }),
      nowMs: Date.parse(GENERATED_AT)
    });
    const completedRun = v54Fixture('run-record.completed.v1.json');
    const staleModel = buildGoalSupervisorAppReadModel(readModelInputForRun({
      runRecord: completedRun,
      pendingResult: pendingResultForRunRecord(completedRun),
      threadContinuationDecision: continuationDecision({
        decision: 'continue',
        targetRole: 'reviewer',
        taskId: completedRun.taskId
      }),
      nowMs: Date.parse(GENERATED_AT)
    }));

    assert.equal(validateReviewGatePreviewContract(missingModel.reviewGatePreview).ok, true);
    assert.equal(missingModel.reviewGatePreview.reviewReadiness.state, 'blocked');
    assert.ok(
      missingModel.reviewGatePreview.blockedReasons.includes('missing-codex-provider-run-recovery'),
      missingModel.reviewGatePreview.blockedReasons.join('; ')
    );
    assert.equal(missingModel.reviewGatePreview.confirmationPreviews.length, 0);

    assert.equal(validateReviewGatePreviewContract(staleModel.reviewGatePreview).ok, true);
    assert.equal(staleModel.reviewGatePreview.reviewReadiness.state, 'blocked');
    assert.ok(
      staleModel.reviewGatePreview.blockedReasons.includes('stale-preview-hash'),
      staleModel.reviewGatePreview.blockedReasons.join('; ')
    );
    assert.equal(staleModel.reviewGatePreview.confirmationPreviews.length, 0);
  });

  it('keeps unsafe context refs out of the review gate projection payload', () => {
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
    const unsafeContext = contextAdvisory();

    unsafeContext.resultBlockEvidence.evidenceRef = '/Users/andy/.codex/sessions/2026/06/14/session.jsonl';

    const model = buildGoalSupervisorAppReadModel(readModelInputForRun({
      runRecord: alignedRun,
      pendingResult,
      contextAdvisory: unsafeContext,
      nowMs: Date.parse(GENERATED_AT)
    }));
    const preview = model.reviewGatePreview;

    assert.equal(validateReviewGatePreviewContract(preview).ok, true);
    assert.equal(preview.reviewReadiness.state, 'blocked');
    assert.ok(
      preview.blockedReasons.some((reason) => reason.startsWith('unsafe-context-advisory-ref:')),
      preview.blockedReasons.join('; ')
    );
    assertNoUnsafePayload(preview);
  });
});

function readyReadModel({
  reviewGateTarget = null,
  timelineEvents = []
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
    reviewGateTarget,
    timelineEvents,
    nowMs: Date.parse(GENERATED_AT)
  }));
}

function v54Fixture(name) {
  return JSON.parse(readFileSync(join(V54_FIXTURE_DIR, name), 'utf8'));
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
      evidenceRef: 'docs/plans/v57-review-gate-workbench-surface-runbook-2026-06-14.md'
    }
  };
}

function pendingResultForRunRecord(runRecord) {
  const preview = buildResultIntakePreview(runRecord.resultIntakeRequest, {
    generatedAt: '2026-06-14T01:10:00.000Z',
    expiresAt: '2026-06-14T01:25:00.000Z'
  });
  const escrow = buildResultEvidenceEscrow(preview, {
    createdAt: '2026-06-14T01:11:00.000Z',
    now: '2026-06-14T01:11:00.000Z'
  });

  return buildPendingResultFromEscrow(escrow);
}

function readModelInputForRun({
  runRecord,
  pendingResult = null,
  contextAdvisory: contextAdvisoryInput = contextAdvisory(),
  threadContinuationDecision = continuationDecision({
    decision: 'continue',
    targetRole: 'reviewer',
    taskId: runRecord.taskId
  }),
  reviewGateTarget = null,
  timelineEvents = [],
  nowMs
}) {
  return {
    goalId: runRecord.goalId,
    title: 'v57 Review Gate Workbench Surface',
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
        phase: 'implement'
      },
      reason: 'backend review gate projection is next'
    },
    contextAdvisory: contextAdvisoryInput,
    threadContinuationDecision,
    pendingResultState: pendingResult,
    codexProviderRunRecord: runRecord,
    reviewGateTarget,
    nowMs
  };
}

function continuationDecision({
  decision,
  targetRole = 'worker',
  taskId = TASK_ID,
  reason = 'copy-only review gate projection'
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
    threadId: 'thread-v57-pr-2',
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
  assert.doesNotMatch(serialized, /event-plan-confirm|append event|mark complete|Confirm Reviewer Verdict|git push|gh release|tag creation|publish release/iu);
}
