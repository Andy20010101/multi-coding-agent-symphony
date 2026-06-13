import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  CHECKPOINT_SNAPSHOT_CONTRACT_NAME,
  CONTEXT_CARRYOVER_REFS_CONTRACT_NAME,
  PROVIDER_CONTINUATION_PROMPT_CONTRACT_NAME,
  THREAD_BOUNDARY_NOTICE_CONTRACT_NAME,
  THREAD_HANDOFF_PACK_BOUNDARIES,
  THREAD_HANDOFF_PACK_CONTRACT_NAME,
  ThreadHandoffPackContractError,
  assertThreadHandoffPackContract,
  buildThreadHandoffPack,
  validateCheckpointSnapshotContract,
  validateContextCarryoverRefsContract,
  validateProviderContinuationPromptContract,
  validateThreadBoundaryNoticeContract,
  validateThreadHandoffPackContract
} from '../src/symphony/thread-handoff-pack-contracts.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, '..');
const FIXTURE_DIR = join(REPO_ROOT, 'fixtures/contracts/thread-handoff-pack');
const V55_FIXTURE_DIR = join(REPO_ROOT, 'fixtures/contracts/codex-provider-run-recovery');
const GENERATED_AT = '2026-06-13T02:00:00.000Z';
const GOAL_ID = 'v56-thread-continuation-reviewer-handoff-pack';
const TASK_ID = 'pr-1-contracts-fixtures-tests';

const VALID_FIXTURES = Object.freeze([
  'thread-handoff-pack.ready-continuation.v1.json',
  'thread-handoff-pack.ready-reviewer-handoff.v1.json',
  'thread-handoff-pack.blocked-missing-recovery.v1.json',
  'thread-handoff-pack.blocked-missing-accepted-reviewer-handoff.v1.json',
  'thread-handoff-pack.recover-drift.v1.json'
]);

describe('v56 thread continuation and reviewer handoff pack contracts', () => {
  it('validates ready, blocked, and recover-drift fixture contracts', () => {
    for (const name of VALID_FIXTURES) {
      const pack = fixture(name);
      const validation = validateThreadHandoffPackContract(pack);

      assert.equal(validation.ok, true, `${name}: ${validation.errors.join('; ')}`);
      assert.equal(pack.contractName, THREAD_HANDOFF_PACK_CONTRACT_NAME);
      assert.equal(pack.copyOnly, true);
      assert.equal(pack.willMutate, false);
      assert.equal(pack.copyBlocks[0].contractName, PROVIDER_CONTINUATION_PROMPT_CONTRACT_NAME);
      assert.equal(pack.copyBlocks[0].contextCarryoverRefs.contractName, CONTEXT_CARRYOVER_REFS_CONTRACT_NAME);
      assert.equal(pack.copyBlocks[0].threadBoundaryNotice.contractName, THREAD_BOUNDARY_NOTICE_CONTRACT_NAME);
      assert.equal(pack.checkpointRef.contractName, CHECKPOINT_SNAPSHOT_CONTRACT_NAME);
      assert.equal(validateProviderContinuationPromptContract(pack.copyBlocks[0]).ok, true);
      assert.equal(validateContextCarryoverRefsContract(pack.copyBlocks[0].contextCarryoverRefs).ok, true);
      assert.equal(validateThreadBoundaryNoticeContract(pack.copyBlocks[0].threadBoundaryNotice).ok, true);
      assert.equal(validateCheckpointSnapshotContract(pack.checkpointRef).ok, true);
      assertNoMutationBoundary(pack);
      assertNoUnsafePayload(pack);
    }

    const continuation = fixture('thread-handoff-pack.ready-continuation.v1.json');
    const reviewer = fixture('thread-handoff-pack.ready-reviewer-handoff.v1.json');
    const missingRecovery = fixture('thread-handoff-pack.blocked-missing-recovery.v1.json');
    const missingAcceptedHandoff = fixture('thread-handoff-pack.blocked-missing-accepted-reviewer-handoff.v1.json');
    const recoverDrift = fixture('thread-handoff-pack.recover-drift.v1.json');

    assert.equal(continuation.decision, 'continue');
    assert.equal(continuation.copyBlocks[0].blockType, 'continuation');
    assert.deepEqual(continuation.blockedReasons, []);

    assert.equal(reviewer.decision, 'reviewer-handoff');
    assert.equal(reviewer.sourceReviewerHandoff.readiness, 'ready');
    assert.equal(reviewer.copyBlocks[0].blockType, 'reviewer-handoff');

    assert.equal(missingRecovery.decision, 'blocked');
    assert.equal(missingRecovery.sourceRecovery.state, 'missing');
    assert.deepEqual(missingRecovery.blockedReasons, ['missing-codex-provider-run-recovery']);

    assert.equal(missingAcceptedHandoff.decision, 'blocked');
    assert.equal(missingAcceptedHandoff.sourceReviewerHandoff.readiness, 'blocked');
    assert.deepEqual(missingAcceptedHandoff.blockedReasons, ['missing-accepted-reviewer-handoff']);

    assert.equal(recoverDrift.decision, 'recover-drift');
    assert.deepEqual(recoverDrift.openRisks, ['source contract drift needs operator review']);
    assert.equal(recoverDrift.copyBlocks[0].blockType, 'recover-drift');
  });

  it('keeps every copy block and checkpoint copy-only without automation flags', () => {
    for (const name of VALID_FIXTURES) {
      const pack = fixture(name);
      const block = pack.copyBlocks[0];
      const carryover = block.contextCarryoverRefs;
      const notice = block.threadBoundaryNotice;

      assert.equal(block.copyOnly, true, name);
      assert.equal(block.willMutate, false, name);
      assert.equal(pack.nextSafeAction.copyOnly, true, name);
      assert.equal(pack.nextSafeAction.willMutate, false, name);
      assert.equal(pack.checkpointRef.copyOnly, true, name);
      assert.equal(pack.checkpointRef.willMutate, false, name);
      assert.equal(carryover.copyOnly, true, name);
      assert.equal(carryover.willMutate, false, name);
      assert.equal(notice.copyOnly, true, name);
      assert.equal(notice.willMutate, false, name);
      assertNoMutationBoundary(pack);
      assertNoMutationBoundary(pack.checkpointRef);
      assert.deepEqual(notice.disabledCapabilities, Object.keys(THREAD_HANDOFF_PACK_BOUNDARIES), name);
    }
  });

  it('rejects raw transcript, local session, and mutation route fixture drift', () => {
    const rawTranscript = validateThreadHandoffPackContract(fixture('thread-handoff-pack.raw-transcript.invalid.v1.json'));
    const localSession = validateThreadHandoffPackContract(fixture('thread-handoff-pack.local-session.invalid.v1.json'));
    const mutationRoute = validateThreadHandoffPackContract(fixture('thread-handoff-pack.unsafe-mutation.invalid.v1.json'));

    assert.equal(rawTranscript.ok, false);
    assert.ok(rawTranscript.errors.some((error) => error.includes('rawTranscript')), rawTranscript.errors.join('; '));
    assert.ok(rawTranscript.errors.some((error) => error.includes('raw provider output')), rawTranscript.errors.join('; '));

    assert.equal(localSession.ok, false);
    assert.ok(localSession.errors.some((error) => error.includes('sourceContracts[0].sourceRef.ref')), localSession.errors.join('; '));
    assert.ok(localSession.errors.some((error) => error.includes('local session refs')), localSession.errors.join('; '));

    assert.equal(mutationRoute.ok, false);
    assert.ok(mutationRoute.errors.includes('boundaries.directGoalEventAppendAvailable must be false'));
    assert.ok(mutationRoute.errors.includes('copyBlocks[0].willMutate must be false'));
    assert.ok(mutationRoute.errors.some((error) => error.includes('direct mutation routes')), mutationRoute.errors.join('; '));
  });

  it('builds a v56 pack from v55 recovery and reviewer handoff sources', () => {
    const recovery = v55Fixture('recovery.completed-accepted.v1.json');
    const reviewerHandoff = v55Fixture('reviewer-handoff.ready.v1.json');
    const pack = buildThreadHandoffPack({
      generatedAt: GENERATED_AT,
      goal: {
        goalId: GOAL_ID,
        title: 'v56 Thread Continuation and Reviewer Handoff Pack',
        state: 'active',
        sourceContract: 'codexProviderRunRecovery.v1'
      },
      task: {
        taskId: TASK_ID,
        title: 'Contracts, fixtures, and tests',
        state: 'active',
        sourceContract: 'codexProviderRunRecovery.v1'
      },
      recovery,
      reviewerHandoff,
      contextAdvisory: contextAdvisory(),
      decision: 'reviewer-handoff'
    });

    assert.equal(validateThreadHandoffPackContract(pack).ok, true);
    assert.equal(pack.goal.goalId, GOAL_ID);
    assert.equal(pack.task.taskId, TASK_ID);
    assert.equal(pack.decision, 'reviewer-handoff');
    assert.deepEqual(pack.blockedReasons, []);
    assert.equal(pack.requiredEvidenceRefs.length >= 1, true);
    assert.deepEqual(
      pack.sourceContracts.map((contract) => contract.contractName),
      ['codexProviderRunRecovery.v1', 'reviewerHandoffPreview.v1', 'contextAdvisory.v1']
    );
    assertNoUnsafePayload(pack);
  });

  it('does not produce ready continuation from stale recovery and ready reviewer handoff', () => {
    const recovery = v55Fixture('recovery.stale-preview-hash.v1.json');
    const reviewerHandoff = v55Fixture('reviewer-handoff.ready.v1.json');
    const pack = buildThreadHandoffPack({
      generatedAt: GENERATED_AT,
      goal: goalInput(),
      task: taskInput(),
      recovery,
      reviewerHandoff,
      contextAdvisory: contextAdvisory()
    });

    assert.equal(pack.decision, 'blocked');
    assert.notEqual(pack.decision, 'continue');
    assert.equal(pack.sourceRecovery.state, 'stale-preview-hash');
    assert.equal(pack.sourceReviewerHandoff.readiness, 'ready');
    assert.equal(validateThreadHandoffPackContract(pack).ok, true);
  });

  it('rejects ready decision fixtures when recovery or reviewer source state drifts', () => {
    const sourceCases = [
      {
        label: 'missing reviewer handoff',
        mutate(pack) {
          pack.sourceReviewerHandoff.readiness = 'missing';
        },
        expected: 'sourceReviewerHandoff.readiness must be ready for continue decision'
      },
      {
        label: 'blocked reviewer handoff',
        mutate(pack) {
          pack.sourceReviewerHandoff.readiness = 'blocked';
        },
        expected: 'sourceReviewerHandoff.readiness must be ready for continue decision'
      },
      {
        label: 'invalid reviewer handoff',
        mutate(pack) {
          pack.sourceReviewerHandoff.readiness = 'invalid';
        },
        expected: 'sourceReviewerHandoff.readiness must be ready for continue decision'
      },
      {
        label: 'invalid recovery',
        mutate(pack) {
          pack.sourceRecovery.state = 'invalid';
        },
        expected: 'sourceRecovery.state must be ready-for-reviewer-handoff for continue decision'
      }
    ];

    for (const sourceCase of sourceCases) {
      const pack = fixture('thread-handoff-pack.ready-continuation.v1.json');

      sourceCase.mutate(pack);

      const validation = validateThreadHandoffPackContract(pack);

      assert.equal(validation.ok, false, sourceCase.label);
      assert.ok(validation.errors.includes(sourceCase.expected), validation.errors.join('; '));
    }

    const reviewerDecision = fixture('thread-handoff-pack.ready-reviewer-handoff.v1.json');

    reviewerDecision.sourceRecovery.state = 'invalid';

    const reviewerValidation = validateThreadHandoffPackContract(reviewerDecision);

    assert.equal(reviewerValidation.ok, false);
    assert.ok(
      reviewerValidation.errors.includes('sourceRecovery.state must be ready-for-reviewer-handoff for reviewer-handoff decision'),
      reviewerValidation.errors.join('; ')
    );
  });

  it('builds checkpoint decision copy block without automation flags', () => {
    const checkpoint = buildThreadHandoffPack({
      generatedAt: GENERATED_AT,
      goal: goalInput(),
      task: taskInput(),
      recovery: v55Fixture('recovery.completed-accepted.v1.json'),
      reviewerHandoff: v55Fixture('reviewer-handoff.ready.v1.json'),
      contextAdvisory: contextAdvisory(),
      decision: 'checkpoint'
    });

    assert.equal(validateThreadHandoffPackContract(checkpoint).ok, true);
    assert.equal(checkpoint.decision, 'checkpoint');
    assert.equal(checkpoint.copyBlocks[0].blockType, 'checkpoint');
    assert.equal(checkpoint.copyBlocks[0].copyOnly, true);
    assert.equal(checkpoint.copyBlocks[0].willMutate, false);
    assert.equal(checkpoint.checkpointRef.copyOnly, true);
    assert.equal(checkpoint.checkpointRef.willMutate, false);
    assertNoMutationBoundary(checkpoint);
    assertNoMutationBoundary(checkpoint.checkpointRef);
  });

  it('throws before building a pack from unsafe source payloads', () => {
    const recovery = v55Fixture('recovery.completed-accepted.v1.json');

    recovery.rawModelOutput = 'raw model output from provider session';

    assert.throws(
      () => buildThreadHandoffPack({
        generatedAt: GENERATED_AT,
        recovery,
        reviewerHandoff: v55Fixture('reviewer-handoff.ready.v1.json'),
        contextAdvisory: contextAdvisory(),
        decision: 'continue'
      }),
      (error) => (
        error instanceof ThreadHandoffPackContractError &&
        error.code === 'unsafe-thread-handoff-source' &&
        error.details.reason.includes('rawModelOutput')
      )
    );
  });

  it('throws a typed assertion error for boundary drift', () => {
    const pack = fixture('thread-handoff-pack.ready-continuation.v1.json');

    pack.boundaries.providerLaunchAvailable = true;

    assert.throws(
      () => assertThreadHandoffPackContract(pack),
      (error) => (
        error instanceof ThreadHandoffPackContractError &&
        error.code === 'invalid-thread-handoff-pack' &&
        error.details.reason === 'boundaries.providerLaunchAvailable must be false'
      )
    );
  });
});

function fixture(name) {
  return JSON.parse(readFileSync(join(FIXTURE_DIR, name), 'utf8'));
}

function v55Fixture(name) {
  return JSON.parse(readFileSync(join(V55_FIXTURE_DIR, name), 'utf8'));
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
      evidenceRef: 'docs/plans/v56-thread-continuation-reviewer-handoff-pack-runbook-2026-06-13.md'
    }
  };
}

function goalInput() {
  return {
    goalId: GOAL_ID,
    title: 'v56 Thread Continuation and Reviewer Handoff Pack',
    state: 'active',
    sourceContract: 'codexProviderRunRecovery.v1'
  };
}

function taskInput() {
  return {
    taskId: TASK_ID,
    title: 'Contracts, fixtures, and tests',
    state: 'active',
    sourceContract: 'codexProviderRunRecovery.v1'
  };
}

function assertNoMutationBoundary(contract) {
  for (const [field, expected] of Object.entries(THREAD_HANDOFF_PACK_BOUNDARIES)) {
    assert.equal(contract.boundaries[field], expected, `boundaries.${field}`);
  }
}

function assertNoUnsafePayload(value) {
  const serialized = JSON.stringify(value);

  assert.doesNotMatch(serialized, /raw transcript|raw model output|provider output|provider session|session path|goal ledger|\.jsonl/iu);
  assert.doesNotMatch(serialized, /event-plan-confirm|append event|mark complete|Confirm Reviewer Verdict|git push|gh release|tag creation|publish release/iu);
}
