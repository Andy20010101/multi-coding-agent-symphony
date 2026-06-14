import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  REVIEW_GATE_BOUNDARIES,
  REVIEW_GATE_BOUNDARY_NOTICE_CONTRACT_NAME,
  REVIEW_GATE_CONFIRMATION_PREVIEW_CONTRACT_NAME,
  REVIEW_GATE_CONTROLLED_CONFIRMATION_STATE_CONTRACT_NAME,
  REVIEW_GATE_PREVIEW_CONTRACT_NAME,
  REVIEW_GATE_SOURCE_EVIDENCE_CONTRACT_NAME,
  ReviewGatePreviewContractError,
  assertReviewGatePreviewContract,
  buildReviewGateControlledConfirmationState,
  buildReviewGatePreview,
  validateReviewGateControlledConfirmationStateContract,
  validateReviewGateBoundaryNoticeContract,
  validateReviewGateConfirmationPreviewContract,
  validateReviewGatePreviewContract,
  validateReviewGateSourceEvidenceContract
} from '../src/symphony/review-gate-workbench-surface-contracts.js';
import {
  THREAD_HANDOFF_PACK_CONTRACT_NAME
} from '../src/symphony/thread-handoff-pack-contracts.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, '..');
const FIXTURE_DIR = join(REPO_ROOT, 'fixtures/contracts/review-gate-workbench-surface');
const THREAD_FIXTURE_DIR = join(REPO_ROOT, 'fixtures/contracts/thread-handoff-pack');
const GENERATED_AT = '2026-06-14T02:00:00.000Z';
const GOAL_ID = 'v57-review-gate-workbench-surface';
const TASK_ID = 'pr-1-contracts-fixtures-tests';

const VALID_FIXTURES = Object.freeze([
  'review-gate-preview.ready-reviewer-verdict.v1.json',
  'review-gate-preview.ready-main-gate.v1.json',
  'review-gate-preview.blocked-missing-thread-handoff-pack.v1.json',
  'review-gate-preview.blocked-missing-reviewer-evidence.v1.json',
  'review-gate-preview.blocked-stale-plan-hash.v1.json'
]);

describe('v57 review gate Workbench surface contracts', () => {
  it('validates ready, blocked, and stale fixture contracts', () => {
    for (const name of VALID_FIXTURES) {
      const preview = fixture(name);
      const validation = validateReviewGatePreviewContract(preview);

      assert.equal(validation.ok, true, `${name}: ${validation.errors.join('; ')}`);
      assert.equal(preview.contractName, REVIEW_GATE_PREVIEW_CONTRACT_NAME);
      assert.equal(preview.readOnly, true);
      assert.equal(preview.willMutate, false);
      assert.deepEqual(preview.boundaries, REVIEW_GATE_BOUNDARIES, name);
      assert.equal(preview.boundaries.controlledEventRegistrationAvailable, true);
      assert.equal(validateReviewGateSourceEvidenceContract(preview.sourceEvidence).ok, true);
      assert.equal(validateReviewGateBoundaryNoticeContract(preview.boundaryNotice).ok, true);

      for (const confirmationPreview of preview.confirmationPreviews) {
        assert.equal(confirmationPreview.contractName, REVIEW_GATE_CONFIRMATION_PREVIEW_CONTRACT_NAME);
        assert.equal(validateReviewGateConfirmationPreviewContract(confirmationPreview).ok, true);
        assert.equal(confirmationPreview.requiresOperatorConfirmation, true);
        assert.equal(confirmationPreview.providerSelfApprovalAvailable, false);
        assert.equal(confirmationPreview.automaticMutationAvailable, false);
        assert.equal(confirmationPreview.directGoalEventAppendAvailable, false);
        assert.equal(confirmationPreview.controlledEventRegistrationAvailable, true);
        assert.equal(confirmationPreview.readOnly, true);
        assert.equal(confirmationPreview.willMutate, false);
      }
    }

    const reviewerVerdict = fixture('review-gate-preview.ready-reviewer-verdict.v1.json');
    const mainGate = fixture('review-gate-preview.ready-main-gate.v1.json');
    const missingPack = fixture('review-gate-preview.blocked-missing-thread-handoff-pack.v1.json');
    const missingReviewer = fixture('review-gate-preview.blocked-missing-reviewer-evidence.v1.json');
    const stale = fixture('review-gate-preview.blocked-stale-plan-hash.v1.json');

    assert.equal(reviewerVerdict.reviewReadiness.state, 'ready');
    assert.equal(reviewerVerdict.confirmationPreviews[0].eventType, 'reviewer.approved');
    assert.equal(reviewerVerdict.nextSafeAction.actionId, 'preview-reviewer-verdict-registration');

    assert.equal(mainGate.mainGateReadiness.state, 'ready');
    assert.equal(mainGate.confirmationPreviews[0].eventType, 'main.verification-passed');
    assert.equal(mainGate.nextSafeAction.actionId, 'preview-main-gate-registration');

    assert.equal(missingPack.sourceThreadHandoffPack.state, 'missing');
    assert.ok(missingPack.blockedReasons.includes('missing-thread-handoff-pack'));
    assert.equal(missingPack.confirmationPreviews.length, 0);

    assert.equal(missingReviewer.reviewReadiness.state, 'blocked');
    assert.ok(missingReviewer.blockedReasons.includes('missing-reviewer-evidence'));
    assert.equal(missingReviewer.confirmationPreviews.length, 0);

    assert.equal(stale.reviewReadiness.state, 'blocked');
    assert.ok(stale.blockedReasons.includes('stale-plan-hash'));
    assert.equal(stale.confirmationPreviews[0].state, 'blocked');
    assert.equal(stale.confirmationPreviews[0].planHashState, 'stale');
  });

  it('rejects raw transcript, local session, and mutation fixture drift', () => {
    const rawTranscript = validateReviewGatePreviewContract(fixture('review-gate-preview.raw-transcript.invalid.v1.json'));
    const localSession = validateReviewGatePreviewContract(fixture('review-gate-preview.local-session.invalid.v1.json'));
    const unsafeMutation = validateReviewGatePreviewContract(fixture('review-gate-preview.unsafe-mutation.invalid.v1.json'));

    assert.equal(rawTranscript.ok, false);
    assert.ok(rawTranscript.errors.some((error) => error.includes('rawTranscript')), rawTranscript.errors.join('; '));
    assert.ok(rawTranscript.errors.some((error) => error.includes('raw provider output')), rawTranscript.errors.join('; '));

    assert.equal(localSession.ok, false);
    assert.ok(localSession.errors.some((error) => error.includes('local session refs')), localSession.errors.join('; '));
    assert.ok(localSession.errors.some((error) => error.includes('sourceEvidence')), localSession.errors.join('; '));

    assert.equal(unsafeMutation.ok, false);
    assert.ok(unsafeMutation.errors.includes('boundaries.directGoalEventAppendAvailable must be false'));
    assert.ok(
      unsafeMutation.errors.includes('confirmationPreviews[0].directGoalEventAppendAvailable must be false'),
      unsafeMutation.errors.join('; ')
    );
  });

  it('builds a reviewer verdict and main gate preview from a v56 thread handoff pack', () => {
    const threadHandoffPack = threadFixture('thread-handoff-pack.ready-reviewer-handoff.v1.json');
    const reviewerEvidenceRefs = [repoDocEvidence('docs/plans/v57-reviewer-evidence-2026-06-14.md', 'v57 reviewer evidence')];
    const mainGateEvidenceRefs = [repoDocEvidence('docs/plans/v57-main-gate-evidence-2026-06-14.md', 'v57 main gate evidence')];
    const reviewerPreview = buildReviewGatePreview({
      generatedAt: GENERATED_AT,
      goal: goalInput(),
      task: taskInput(),
      threadHandoffPack,
      target: 'reviewer-verdict',
      reviewerEvidenceRefs
    });
    const mainGatePreview = buildReviewGatePreview({
      generatedAt: GENERATED_AT,
      goal: goalInput(),
      task: taskInput(),
      threadHandoffPack,
      target: 'main-gate',
      reviewerEvidenceRefs,
      mainGateEvidenceRefs
    });

    assert.equal(validateReviewGatePreviewContract(reviewerPreview).ok, true);
    assert.equal(reviewerPreview.sourceThreadHandoffPack.contractName, THREAD_HANDOFF_PACK_CONTRACT_NAME);
    assert.equal(reviewerPreview.sourceThreadHandoffPack.state, 'ready');
    assert.equal(reviewerPreview.reviewReadiness.state, 'ready');
    assert.equal(reviewerPreview.mainGateReadiness.state, 'blocked');
    assert.equal(reviewerPreview.releaseGateReadiness.state, 'not-requested');
    assert.equal(reviewerPreview.confirmationPreviews[0].eventType, 'reviewer.approved');
    assert.match(reviewerPreview.confirmationPreviews[0].planHash, /^sha256:[a-f0-9]{64}$/u);
    assert.deepEqual(reviewerPreview.boundaries, REVIEW_GATE_BOUNDARIES);

    assert.equal(validateReviewGatePreviewContract(mainGatePreview).ok, true);
    assert.equal(mainGatePreview.reviewReadiness.state, 'ready');
    assert.equal(mainGatePreview.mainGateReadiness.state, 'ready');
    assert.equal(mainGatePreview.confirmationPreviews[0].eventType, 'main.verification-passed');
    assert.deepEqual(
      mainGatePreview.requiredEvidenceRefs.map((evidenceRef) => evidenceRef.ref),
      [
        'docs/plans/v57-reviewer-evidence-2026-06-14.md',
        'docs/plans/v57-main-gate-evidence-2026-06-14.md'
      ]
    );
  });

  it('builds controlled confirmation state only with an explicit operator and current plan hash', () => {
    const preview = fixture('review-gate-preview.ready-reviewer-verdict.v1.json');
    const confirmationState = buildReviewGateControlledConfirmationState({
      generatedAt: GENERATED_AT,
      reviewGatePreview: preview,
      operatorId: 'operator-v57-controller'
    });

    assert.equal(confirmationState.contractName, REVIEW_GATE_CONTROLLED_CONFIRMATION_STATE_CONTRACT_NAME);
    assert.equal(validateReviewGateControlledConfirmationStateContract(confirmationState).ok, true);
    assert.equal(confirmationState.state, 'ready');
    assert.equal(confirmationState.eventFamily, 'reviewer-verdict');
    assert.equal(confirmationState.eventType, 'reviewer.approved');
    assert.equal(confirmationState.planHash, preview.confirmationPreviews[0].planHash);
    assert.equal(confirmationState.previewHash, preview.confirmationPreviews[0].previewHash);
    assert.equal(confirmationState.operator.operatorId, 'operator-v57-controller');
    assert.equal(confirmationState.operator.providerOriginated, false);
    assert.equal(confirmationState.previewRequest.method, 'GET');
    assert.equal(confirmationState.previewRequest.query.command, 'review');
    assert.equal(confirmationState.previewRequest.query.reviewer, 'operator-v57-controller');
    assert.equal(confirmationState.confirmRequestShape.method, 'POST');
    assert.equal(confirmationState.confirmRequestShape.confirmUsesPlanHash, true);
    assert.ok(confirmationState.confirmRequestShape.requiredBodyFields.includes('planHash'));
    assert.equal(confirmationState.readOnly, true);
    assert.equal(confirmationState.willMutate, false);
    assert.deepEqual(confirmationState.boundaries, REVIEW_GATE_BOUNDARIES);
  });

  it('blocks controlled confirmation state for missing operator, provider operator, stale plan, and mismatch', () => {
    const readyPreview = fixture('review-gate-preview.ready-reviewer-verdict.v1.json');
    const stalePreview = fixture('review-gate-preview.blocked-stale-plan-hash.v1.json');
    const missingOperator = buildReviewGateControlledConfirmationState({
      generatedAt: GENERATED_AT,
      reviewGatePreview: readyPreview
    });
    const providerOperator = buildReviewGateControlledConfirmationState({
      generatedAt: GENERATED_AT,
      reviewGatePreview: readyPreview,
      operatorId: 'codex-v57-reviewer'
    });
    const mismatchedPlanHash = buildReviewGateControlledConfirmationState({
      generatedAt: GENERATED_AT,
      reviewGatePreview: readyPreview,
      operatorId: 'operator-v57-controller',
      planHash: 'sha256:0000000000000000000000000000000000000000000000000000000000000000'
    });
    const stalePlan = buildReviewGateControlledConfirmationState({
      generatedAt: GENERATED_AT,
      reviewGatePreview: stalePreview,
      eventFamily: 'reviewer-verdict',
      operatorId: 'operator-v57-controller'
    });

    for (const state of [missingOperator, providerOperator, mismatchedPlanHash, stalePlan]) {
      assert.equal(validateReviewGateControlledConfirmationStateContract(state).ok, true);
      assert.equal(state.state, 'blocked');
      assert.equal(state.previewRequest, null);
      assert.equal(state.confirmRequestShape, null);
      assert.equal(state.readOnly, true);
      assert.equal(state.willMutate, false);
    }

    assert.ok(missingOperator.blockedReasons.includes('missing-explicit-operator-id'));
    assert.ok(providerOperator.blockedReasons.includes('provider-originated-approval'));
    assert.ok(mismatchedPlanHash.blockedReasons.includes('plan-hash-mismatch'));
    assert.ok(stalePlan.blockedReasons.includes('stale-plan-hash'));
  });

  it('blocks missing source or missing evidence without creating confirmation previews', () => {
    const missingPack = buildReviewGatePreview({
      generatedAt: GENERATED_AT,
      goal: goalInput(),
      task: taskInput(),
      target: 'reviewer-verdict',
      reviewerEvidenceRefs: [repoDocEvidence('docs/plans/v57-reviewer-evidence-2026-06-14.md', 'v57 reviewer evidence')]
    });
    const missingEvidence = buildReviewGatePreview({
      generatedAt: GENERATED_AT,
      goal: goalInput(),
      task: taskInput(),
      threadHandoffPack: threadFixture('thread-handoff-pack.ready-reviewer-handoff.v1.json'),
      target: 'reviewer-verdict'
    });

    assert.equal(missingPack.sourceThreadHandoffPack.state, 'missing');
    assert.ok(missingPack.blockedReasons.includes('missing-thread-handoff-pack'));
    assert.equal(missingPack.confirmationPreviews.length, 0);

    assert.equal(missingEvidence.reviewReadiness.state, 'blocked');
    assert.ok(missingEvidence.blockedReasons.includes('missing-reviewer-evidence'));
    assert.equal(missingEvidence.confirmationPreviews.length, 0);
  });

  it('throws before building from unsafe source payload', () => {
    const threadHandoffPack = threadFixture('thread-handoff-pack.ready-reviewer-handoff.v1.json');

    threadHandoffPack.rawModelOutput = 'raw model output from provider session';

    assert.throws(
      () => buildReviewGatePreview({
        generatedAt: GENERATED_AT,
        goal: goalInput(),
        task: taskInput(),
        threadHandoffPack,
        target: 'reviewer-verdict',
        reviewerEvidenceRefs: [repoDocEvidence('docs/plans/v57-reviewer-evidence-2026-06-14.md', 'v57 reviewer evidence')]
      }),
      (error) => {
        assert.equal(error instanceof ReviewGatePreviewContractError, true);
        assert.equal(error.code, 'unsafe-review-gate-source');
        assert.match(error.details.reason, /rawModelOutput/u);
        return true;
      }
    );
  });

  it('rejects boundary drift in asserted previews', () => {
    const preview = fixture('review-gate-preview.ready-reviewer-verdict.v1.json');

    preview.boundaries.providerLaunchAvailable = true;

    assert.throws(
      () => assertReviewGatePreviewContract(preview),
      (error) => {
        assert.equal(error instanceof ReviewGatePreviewContractError, true);
        assert.equal(error.code, 'invalid-review-gate-preview');
        assert.match(error.details.reason, /providerLaunchAvailable/u);
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

function goalInput() {
  return {
    goalId: GOAL_ID,
    title: 'v57 Review Gate Workbench Surface',
    state: 'active',
    sourceContract: THREAD_HANDOFF_PACK_CONTRACT_NAME,
    sourceRef: {
      kind: 'contract',
      ref: THREAD_HANDOFF_PACK_CONTRACT_NAME
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
      ref: THREAD_HANDOFF_PACK_CONTRACT_NAME
    }
  };
}

function repoDocEvidence(ref, label) {
  return {
    kind: 'repo-doc',
    ref,
    label
  };
}
