import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';

import {
  CODEX_PROVIDER_RUN_RECOVERY_BOUNDARIES,
  CODEX_PROVIDER_RUN_RECOVERY_CONTRACT_NAME,
  CodexProviderRunRecoveryContractError,
  REVIEWER_HANDOFF_PREVIEW_CONTRACT_NAME,
  assertCodexProviderRunRecoveryContract,
  assertReviewerHandoffPreviewContract,
  buildCodexProviderRunRecovery,
  buildReviewerHandoffPreview,
  validateCodexProviderRunRecoveryContract,
  validateReviewerHandoffPreviewContract
} from '../src/symphony/codex-provider-run-recovery-contracts.js';
import {
  validateCodexProviderRunRecordContract
} from '../src/symphony/codex-provider-execution-contracts.js';
import {
  buildPendingResultFromEscrow,
  buildResultEvidenceEscrow,
  buildResultIntakePreview
} from '../src/symphony/result-intake-contracts.js';
import {
  getCodexProviderRunRecordPath,
  readCodexProviderRunRecord
} from '../src/symphony/codex-provider-run-recovery-state.js';
import {
  buildGoalSupervisorAppReadModel
} from '../src/symphony/goal-supervisor/index.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, '..');
const FIXTURE_DIR = join(REPO_ROOT, 'fixtures/contracts/codex-provider-run-recovery');
const V54_FIXTURE_DIR = join(REPO_ROOT, 'fixtures/contracts/codex-provider-execution');

const VALID_RECOVERY_FIXTURES = Object.freeze([
  'recovery.completed-accepted.v1.json',
  'recovery.blocked-pending-blocker.v1.json',
  'recovery.missing-result-intake.v1.json',
  'recovery.stale-preview-hash.v1.json'
]);

const VALID_HANDOFF_FIXTURES = Object.freeze([
  'reviewer-handoff.ready.v1.json',
  'reviewer-handoff.blocked-before-intake.v1.json'
]);

describe('v55 Codex provider run recovery and reviewer handoff contracts', () => {
  it('validates run recovery fixtures for accepted, blocked, missing-intake, and stale states', () => {
    for (const name of VALID_RECOVERY_FIXTURES) {
      const recovery = fixture(name);
      const validation = validateCodexProviderRunRecoveryContract(recovery);

      assert.equal(validation.ok, true, `${name}: ${validation.errors.join('; ')}`);
      assert.equal(recovery.contractName, CODEX_PROVIDER_RUN_RECOVERY_CONTRACT_NAME);
      assert.equal(recovery.providerId, 'codex');
      assert.equal(recovery.role, 'worker');
      assert.equal(recovery.resultIntake.contractName, 'resultIntakeRequest.v1');
      assert.equal(recovery.nextSafeAction.willMutate, false);
      assertNoMutationBoundaries(recovery.boundaries);
      assertNoUnsafePayload(recovery);
    }

    assert.equal(fixture('recovery.completed-accepted.v1.json').recoveryState, 'ready-for-reviewer-handoff');
    assert.equal(fixture('recovery.completed-accepted.v1.json').resultIntake.pendingResult.contractName, 'pendingResult.v1');
    assert.equal(fixture('recovery.completed-accepted.v1.json').resultIntake.pendingResult.state, 'available');
    assert.deepEqual(fixture('recovery.blocked-pending-blocker.v1.json').blockedReasons, [
      'provider-run-blocked',
      'pending-result-blocked'
    ]);
    assert.deepEqual(fixture('recovery.missing-result-intake.v1.json').blockedReasons, [
      'missing-result-intake-request'
    ]);
    assert.deepEqual(fixture('recovery.stale-preview-hash.v1.json').blockedReasons, [
      'stale-preview-hash'
    ]);
  });

  it('keeps v55 recovery bound to sanitized v54 run records', () => {
    const completedRun = v54Fixture('run-record.completed.v1.json');
    const blockedRun = v54Fixture('run-record.blocked.v1.json');
    const completedRecovery = fixture('recovery.completed-accepted.v1.json');
    const blockedRecovery = fixture('recovery.blocked-pending-blocker.v1.json');

    assert.equal(validateCodexProviderRunRecordContract(completedRun).ok, true);
    assert.equal(validateCodexProviderRunRecordContract(blockedRun).ok, true);
    assert.equal(completedRecovery.runId, completedRun.runId);
    assert.equal(completedRecovery.previewHash, completedRun.previewHash);
    assert.equal(completedRecovery.taskPackHash, completedRun.taskPackHash);
    assert.equal(blockedRecovery.runId, blockedRun.runId);
    assert.equal(blockedRecovery.runStatus, blockedRun.status);
    assert.equal(blockedRecovery.resultIntake.pendingResult.state, 'blocked');
  });

  it('validates reviewer handoff preview as copy-only and blocks before pending result acceptance', () => {
    for (const name of VALID_HANDOFF_FIXTURES) {
      const preview = fixture(name);
      const validation = validateReviewerHandoffPreviewContract(preview);

      assert.equal(validation.ok, true, `${name}: ${validation.errors.join('; ')}`);
      assert.equal(preview.contractName, REVIEWER_HANDOFF_PREVIEW_CONTRACT_NAME);
      assert.equal(preview.copyOnly, true);
      assert.equal(preview.willMutate, false);
      assertNoMutationBoundaries(preview.boundaries);
      assertNoUnsafePayload(preview);
    }

    const ready = fixture('reviewer-handoff.ready.v1.json');
    const blocked = fixture('reviewer-handoff.blocked-before-intake.v1.json');

    assert.equal(ready.pendingResultRef.contractName, 'pendingResult.v1');
    assert.equal(ready.pendingResultRef.state, 'available');
    assert.equal(ready.handoffPack.workerEvidenceRefs.length, 1);
    assert.deepEqual(blocked.blockedReasons, ['pending-result-not-accepted']);
    assert.equal(blocked.pendingResultRef, null);
    assert.equal(blocked.handoffPack, null);
  });

  it('rejects raw transcript leakage and reviewer mutation drift', () => {
    const unsafeRecovery = validateCodexProviderRunRecoveryContract(fixture('recovery.raw-transcript.invalid.v1.json'));
    const unsafeHandoff = validateReviewerHandoffPreviewContract(fixture('reviewer-handoff.unsafe-mutation.invalid.v1.json'));

    assert.equal(unsafeRecovery.ok, false);
    assert.ok(
      unsafeRecovery.errors.some((error) => error.includes('raw provider output')),
      unsafeRecovery.errors.join('; ')
    );
    assertValidationIncludes(unsafeHandoff, 'willMutate must be false');
    assertValidationIncludes(unsafeHandoff, 'boundaries.reviewerMutationAvailable must be false');
    assert.ok(
      unsafeHandoff.errors.some((error) => error.includes('direct mutation routes')),
      unsafeHandoff.errors.join('; ')
    );
  });

  it('rejects contradictory recovery state classifications', () => {
    const blocked = fixture('recovery.blocked-pending-blocker.v1.json');
    const stale = fixture('recovery.stale-preview-hash.v1.json');

    blocked.runStatus = 'completed';
    blocked.resultIntake.pendingResult.state = 'available';
    blocked.blockedReasons = ['provider-run-blocked'];
    stale.resultIntake.previewHash = stale.previewHash;

    const blockedValidation = validateCodexProviderRunRecoveryContract(blocked);
    const staleValidation = validateCodexProviderRunRecoveryContract(stale);

    assertValidationIncludes(blockedValidation, 'blockedReasons must include "pending-result-blocked"');
    assertValidationIncludes(blockedValidation, 'runStatus must be "blocked"');
    assertValidationIncludes(blockedValidation, 'resultIntake.pendingResult.state must be "blocked"');
    assertValidationIncludes(
      staleValidation,
      'resultIntake.previewHash must differ from previewHash for stale-preview-hash recovery'
    );
  });

  it('rejects blocked reviewer handoff previews that still carry accepted handoff content', () => {
    const blocked = fixture('reviewer-handoff.blocked-before-intake.v1.json');
    const ready = fixture('reviewer-handoff.ready.v1.json');

    blocked.pendingResultRef = structuredClone(ready.pendingResultRef);
    blocked.acceptedResultSummary = structuredClone(ready.acceptedResultSummary);
    blocked.handoffPack = structuredClone(ready.handoffPack);

    const validation = validateReviewerHandoffPreviewContract(blocked);

    assertValidationIncludes(validation, 'acceptedResultSummary must be null when handoff is blocked');
    assertValidationIncludes(validation, 'handoffPack must be null when handoff is blocked');
    assertValidationIncludes(validation, 'pendingResultRef.state must not be available before intake acceptance');
  });

  it('rejects local source refs before they can expose provider sessions', () => {
    const recovery = fixture('recovery.completed-accepted.v1.json');
    const handoff = fixture('reviewer-handoff.ready.v1.json');

    recovery.sourceContracts[0].sourceRef.ref = '/Users/andy/Codex/sessions/session-123.txt';
    handoff.acceptedResultSummary.changedFiles[0] = '/Users/andy/project/src/foo.js';
    handoff.handoffPack.changedFiles[0] = '../src/foo.js';
    handoff.handoffPack.body = 'POST /api/goals/g1/event-plan-confirm';

    assertValidationIncludes(
      validateCodexProviderRunRecoveryContract(recovery),
      'sourceContracts[0].sourceRef.ref must not contain raw provider output, local session refs, or direct mutation routes'
    );
    const handoffValidation = validateReviewerHandoffPreviewContract(handoff);

    assertValidationIncludes(
      handoffValidation,
      'acceptedResultSummary.changedFiles[0] must be a safe repo-relative path'
    );
    assertValidationIncludes(
      handoffValidation,
      'handoffPack.changedFiles[0] must be a safe repo-relative path'
    );
    assert.ok(
      handoffValidation.errors.includes(
        'preview.handoffPack.body must not contain raw provider output, local session refs, or direct mutation routes'
      ),
      handoffValidation.errors.join('; ')
    );
  });

  it('projects recovery from backend-owned run records and v51 pending result state', () => {
    const completedRun = v54Fixture('run-record.completed.v1.json');
    const blockedRun = v54Fixture('run-record.blocked.v1.json');
    const completedPending = pendingResultForRunRecord(completedRun);
    const blockedPending = pendingResultForRunRecord(blockedRun);
    const completedRecovery = buildCodexProviderRunRecovery({
      runRecord: completedRun,
      pendingResult: completedPending,
      generatedAt: '2026-06-13T01:20:00.000Z'
    });
    const blockedRecovery = buildCodexProviderRunRecovery({
      runRecord: blockedRun,
      pendingResult: blockedPending,
      generatedAt: '2026-06-13T01:21:00.000Z'
    });
    const missingIntakeRun = structuredClone(completedRun);
    const unsafeRun = v54Fixture('run-record.raw-transcript.invalid.v1.json');
    const staleRecovery = buildCodexProviderRunRecovery({
      runRecord: completedRun,
      pendingResult: completedPending,
      currentPreviewHash: 'sha256:2222222222222222222222222222222222222222222222222222222222222222',
      generatedAt: '2026-06-13T01:22:00.000Z'
    });

    delete missingIntakeRun.resultIntakeRequest;

    const missingRecovery = buildCodexProviderRunRecovery({
      runRecord: missingIntakeRun,
      generatedAt: '2026-06-13T01:23:00.000Z'
    });
    const unsafeRecovery = buildCodexProviderRunRecovery({
      runRecord: unsafeRun,
      generatedAt: '2026-06-13T01:24:00.000Z'
    });

    assert.equal(validateCodexProviderRunRecoveryContract(completedRecovery).ok, true);
    assert.equal(completedRecovery.recoveryState, 'ready-for-reviewer-handoff');
    assert.equal(completedRecovery.resultIntake.pendingResult.contractName, 'pendingResult.v1');
    assert.equal(completedRecovery.resultIntake.pendingResult.state, 'available');

    assert.equal(validateCodexProviderRunRecoveryContract(blockedRecovery).ok, true);
    assert.equal(blockedRecovery.recoveryState, 'blocked-provider-result');
    assert.deepEqual(blockedRecovery.blockedReasons, ['provider-run-blocked', 'pending-result-blocked']);

    assert.equal(validateCodexProviderRunRecoveryContract(staleRecovery).ok, true);
    assert.equal(staleRecovery.recoveryState, 'stale-preview-hash');
    assert.notEqual(staleRecovery.resultIntake.previewHash, staleRecovery.previewHash);

    assert.equal(validateCodexProviderRunRecoveryContract(missingRecovery).ok, true);
    assert.equal(missingRecovery.recoveryState, 'missing-result-intake');
    assert.equal(missingRecovery.resultIntake.pendingResult, null);

    assert.equal(validateCodexProviderRunRecoveryContract(unsafeRecovery).ok, true);
    assert.equal(unsafeRecovery.recoveryState, 'unsafe-provider-output');
    assertNoUnsafePayload(unsafeRecovery);
  });

  it('builds reviewer handoff preview only after accepted pending result linkage', () => {
    const completedRun = v54Fixture('run-record.completed.v1.json');
    const pendingResult = pendingResultForRunRecord(completedRun);
    const recovery = buildCodexProviderRunRecovery({
      runRecord: completedRun,
      pendingResult,
      generatedAt: '2026-06-13T01:27:00.000Z'
    });
    const preview = buildReviewerHandoffPreview({
      recovery,
      pendingResult,
      reviewerTask: {
        taskId: 'pr-2-readonly-review',
        title: 'Read-only backend recovery review'
      },
      generatedAt: '2026-06-13T01:28:00.000Z'
    });

    assert.equal(validateReviewerHandoffPreviewContract(preview).ok, true);
    assert.equal(preview.contractName, REVIEWER_HANDOFF_PREVIEW_CONTRACT_NAME);
    assert.equal(preview.copyOnly, true);
    assert.equal(preview.willMutate, false);
    assert.deepEqual(preview.blockedReasons, []);
    assert.equal(preview.pendingResultRef.state, 'available');
    assert.equal(preview.workerTask.state, 'accepted');
    assert.equal(preview.reviewerTask.taskId, 'pr-2-readonly-review');
    assert.deepEqual(preview.acceptedResultSummary.changedFiles, pendingResult.sanitizedSummary.changedFiles);
    assert.deepEqual(preview.handoffPack.validationCommands, pendingResult.sanitizedSummary.validationCommands);
    assert.deepEqual(preview.handoffPack.workerEvidenceRefs, pendingResult.evidenceRefs);
    assertNoUnsafePayload(preview);
  });

  it('blocks reviewer handoff preview when pending result is missing or recovery is stale', () => {
    const completedRun = v54Fixture('run-record.completed.v1.json');
    const pendingResult = pendingResultForRunRecord(completedRun);
    const readyRecovery = buildCodexProviderRunRecovery({
      runRecord: completedRun,
      pendingResult,
      generatedAt: '2026-06-13T01:29:00.000Z'
    });
    const missingPendingPreview = buildReviewerHandoffPreview({
      recovery: readyRecovery,
      generatedAt: '2026-06-13T01:30:00.000Z'
    });
    const staleRecovery = buildCodexProviderRunRecovery({
      runRecord: completedRun,
      pendingResult,
      currentPreviewHash: 'sha256:3333333333333333333333333333333333333333333333333333333333333333',
      generatedAt: '2026-06-13T01:31:00.000Z'
    });
    const stalePreview = buildReviewerHandoffPreview({
      recovery: staleRecovery,
      pendingResult,
      generatedAt: '2026-06-13T01:32:00.000Z'
    });

    assert.equal(validateReviewerHandoffPreviewContract(missingPendingPreview).ok, true);
    assert.deepEqual(missingPendingPreview.blockedReasons, ['pending-result-not-accepted']);
    assert.equal(missingPendingPreview.pendingResultRef, null);
    assert.equal(missingPendingPreview.acceptedResultSummary, null);
    assert.equal(missingPendingPreview.handoffPack, null);

    assert.equal(validateReviewerHandoffPreviewContract(stalePreview).ok, true);
    assert.deepEqual(stalePreview.blockedReasons, ['stale-preview-hash']);
    assert.equal(stalePreview.pendingResultRef.state, 'available');
    assert.equal(stalePreview.acceptedResultSummary, null);
    assert.equal(stalePreview.handoffPack, null);
    assertNoUnsafePayload(stalePreview);
  });

  it('blocks reviewer handoff preview when available pending result does not match accepted recovery', () => {
    const completedRun = v54Fixture('run-record.completed.v1.json');
    const pendingResult = pendingResultForRunRecord(completedRun);
    const recovery = buildCodexProviderRunRecovery({
      runRecord: completedRun,
      pendingResult,
      generatedAt: '2026-06-13T01:33:00.000Z'
    });
    const mismatchedPendingResult = structuredClone(pendingResult);

    mismatchedPendingResult.escrowRef = `${pendingResult.escrowRef}:other`;
    mismatchedPendingResult.sanitizedSummary.summary = 'Different accepted result should not be handed off.';
    mismatchedPendingResult.sanitizedSummary.changedFiles = ['src/other.js'];

    const preview = buildReviewerHandoffPreview({
      recovery,
      pendingResult: mismatchedPendingResult,
      generatedAt: '2026-06-13T01:34:00.000Z'
    });

    assert.equal(validateReviewerHandoffPreviewContract(preview).ok, true);
    assert.deepEqual(preview.blockedReasons, ['pending-result-mismatch']);
    assert.equal(preview.pendingResultRef.state, 'available');
    assert.equal(preview.acceptedResultSummary, null);
    assert.equal(preview.handoffPack, null);
  });

  it('adds Codex run recovery to the supervisor read model without a write path', () => {
    const completedRun = v54Fixture('run-record.completed.v1.json');
    const previewOnlyModel = buildGoalSupervisorAppReadModel(readModelInputForRun({
      runRecord: completedRun,
      nowMs: Date.parse('2026-06-13T01:25:00.000Z')
    }));
    const alignedRun = alignRunRecordWithPreview(completedRun, previewOnlyModel.codexProviderExecutionPreview);
    const pendingResult = pendingResultForRunRecord(alignedRun);
    const model = buildGoalSupervisorAppReadModel(readModelInputForRun({
      runRecord: alignedRun,
      pendingResult,
      nowMs: Date.parse('2026-06-13T01:25:00.000Z')
    }));

    assert.equal(model.codexProviderRunRecovery.contractName, CODEX_PROVIDER_RUN_RECOVERY_CONTRACT_NAME);
    assert.equal(validateCodexProviderRunRecoveryContract(model.codexProviderRunRecovery).ok, true);
    assert.equal(model.codexProviderRunRecovery.recoveryState, 'ready-for-reviewer-handoff');
    assert.equal(model.codexProviderRunRecovery.boundaries.providerExecutionAvailable, false);
    assert.equal(model.codexProviderRunRecovery.boundaries.directGoalEventAppendAvailable, false);
    assert.equal(model.codexProviderRunRecovery.boundaries.githubReleaseAutomationAvailable, false);
    assert.equal(model.reviewerHandoffPreview.contractName, REVIEWER_HANDOFF_PREVIEW_CONTRACT_NAME);
    assert.equal(validateReviewerHandoffPreviewContract(model.reviewerHandoffPreview).ok, true);
    assert.deepEqual(model.reviewerHandoffPreview.blockedReasons, []);
    assert.equal(model.reviewerHandoffPreview.copyOnly, true);
    assert.equal(model.reviewerHandoffPreview.willMutate, false);
  });

  it('classifies stale preview hash through the supervisor read model path', () => {
    const completedRun = v54Fixture('run-record.completed.v1.json');
    const pendingResult = pendingResultForRunRecord(completedRun);
    const model = buildGoalSupervisorAppReadModel(readModelInputForRun({
      runRecord: completedRun,
      pendingResult,
      nowMs: Date.parse('2026-06-13T01:26:00.000Z')
    }));

    assert.equal(model.codexProviderRunRecovery.contractName, CODEX_PROVIDER_RUN_RECOVERY_CONTRACT_NAME);
    assert.equal(validateCodexProviderRunRecoveryContract(model.codexProviderRunRecovery).ok, true);
    assert.equal(model.codexProviderRunRecovery.recoveryState, 'stale-preview-hash');
    assert.notEqual(
      model.codexProviderRunRecovery.resultIntake.previewHash,
      model.codexProviderRunRecovery.previewHash
    );
    assert.deepEqual(model.codexProviderRunRecovery.blockedReasons, ['stale-preview-hash']);
    assert.equal(model.reviewerHandoffPreview.contractName, REVIEWER_HANDOFF_PREVIEW_CONTRACT_NAME);
    assert.equal(validateReviewerHandoffPreviewContract(model.reviewerHandoffPreview).ok, true);
    assert.deepEqual(model.reviewerHandoffPreview.blockedReasons, ['stale-preview-hash']);
    assert.equal(model.reviewerHandoffPreview.acceptedResultSummary, null);
    assert.equal(model.reviewerHandoffPreview.handoffPack, null);
  });

  it('reads backend-owned Codex run records from managed state only', async () => {
    const root = await mkdtemp(join(tmpdir(), 'symphony-v55-run-recovery-'));
    const stateDir = join(root, '.symphony');
    const runRecord = v54Fixture('run-record.completed.v1.json');
    const runRecordPath = getCodexProviderRunRecordPath({
      stateDir,
      goalId: runRecord.goalId,
      taskId: runRecord.taskId
    });

    try {
      await mkdir(dirname(runRecordPath), { recursive: true });
      await writeFile(runRecordPath, `${JSON.stringify(runRecord, null, 2)}\n`, 'utf8');

      const read = await readCodexProviderRunRecord({
        stateDir,
        goalId: runRecord.goalId,
        taskId: runRecord.taskId
      });

      assert.equal(read.contractName, 'codexProviderRunRecord.v1');
      assert.equal(read.runId, runRecord.runId);
      assert.equal(validateCodexProviderRunRecordContract(read).ok, true);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it('throws typed assertion errors for recovery and handoff contract violations', () => {
    const recovery = fixture('recovery.completed-accepted.v1.json');
    const handoff = fixture('reviewer-handoff.ready.v1.json');

    recovery.boundaries.directGoalEventAppendAvailable = true;
    handoff.copyOnly = false;

    assert.throws(
      () => assertCodexProviderRunRecoveryContract(recovery),
      (error) => (
        error instanceof CodexProviderRunRecoveryContractError &&
        error.code === 'invalid-codex-provider-run-recovery' &&
        error.details.reason === 'boundaries.directGoalEventAppendAvailable must be false'
      )
    );
    assert.throws(
      () => assertReviewerHandoffPreviewContract(handoff),
      (error) => (
        error instanceof CodexProviderRunRecoveryContractError &&
        error.code === 'invalid-reviewer-handoff-preview' &&
        error.details.reason === 'copyOnly must be true'
      )
    );
  });
});

function fixture(name) {
  return JSON.parse(readFileSync(join(FIXTURE_DIR, name), 'utf8'));
}

function v54Fixture(name) {
  return JSON.parse(readFileSync(join(V54_FIXTURE_DIR, name), 'utf8'));
}

function pendingResultForRunRecord(runRecord) {
  const preview = buildResultIntakePreview(runRecord.resultIntakeRequest, {
    generatedAt: '2026-06-13T01:10:00.000Z',
    expiresAt: '2026-06-13T01:25:00.000Z'
  });
  const escrow = buildResultEvidenceEscrow(preview, {
    createdAt: '2026-06-13T01:11:00.000Z',
    now: '2026-06-13T01:11:00.000Z'
  });

  return buildPendingResultFromEscrow(escrow);
}

function readModelInputForRun({
  runRecord,
  pendingResult = null,
  nowMs
}) {
  return {
    goalId: runRecord.goalId,
    title: 'v55 Codex Provider Run Recovery and Reviewer Handoff',
    tasks: [{
      taskId: runRecord.taskId,
      title: 'Backend recovery projection',
      status: 'active'
    }],
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
      reason: 'backend recovery projection is next'
    },
    pendingResultState: pendingResult,
    codexProviderRunRecord: runRecord,
    nowMs
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

function assertNoMutationBoundaries(boundaries) {
  for (const [field, expected] of Object.entries(CODEX_PROVIDER_RUN_RECOVERY_BOUNDARIES)) {
    assert.equal(boundaries[field], expected, `boundaries.${field}`);
  }
}

function assertNoUnsafePayload(value) {
  const serialized = JSON.stringify(value);

  assert.doesNotMatch(serialized, /raw transcript|raw model output|provider session|\.jsonl/iu);
  assert.doesNotMatch(serialized, /Confirm Reviewer Verdict|Launch Claude Code|Run Shell|event-plan-confirm|gh release|git push/iu);
}

function assertValidationIncludes(validation, expected) {
  assert.equal(validation.ok, false, expected);
  assert.ok(
    validation.errors.includes(expected),
    `expected ${expected}; got ${validation.errors.join('; ')}`
  );
}
