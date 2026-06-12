import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  CODEX_PROVIDER_RUN_RECOVERY_BOUNDARIES,
  CODEX_PROVIDER_RUN_RECOVERY_CONTRACT_NAME,
  CodexProviderRunRecoveryContractError,
  REVIEWER_HANDOFF_PREVIEW_CONTRACT_NAME,
  assertCodexProviderRunRecoveryContract,
  assertReviewerHandoffPreviewContract,
  validateCodexProviderRunRecoveryContract,
  validateReviewerHandoffPreviewContract
} from '../src/symphony/codex-provider-run-recovery-contracts.js';
import {
  validateCodexProviderRunRecordContract
} from '../src/symphony/codex-provider-execution-contracts.js';

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

    recovery.sourceContracts[0].sourceRef.ref = '/Users/andy/Codex/sessions/session-123.txt';

    assertValidationIncludes(
      validateCodexProviderRunRecoveryContract(recovery),
      'sourceContracts[0].sourceRef.ref must not contain raw provider output, local session refs, or direct mutation routes'
    );
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

function assertNoMutationBoundaries(boundaries) {
  for (const [field, expected] of Object.entries(CODEX_PROVIDER_RUN_RECOVERY_BOUNDARIES)) {
    assert.equal(boundaries[field], expected, `boundaries.${field}`);
  }
}

function assertNoUnsafePayload(value) {
  const serialized = JSON.stringify(value);

  assert.doesNotMatch(serialized, /raw transcript|raw model output|provider session|\.jsonl/iu);
  assert.doesNotMatch(serialized, /Confirm Reviewer Verdict|Launch Claude Code|Run Shell|gh release|git push/iu);
}

function assertValidationIncludes(validation, expected) {
  assert.equal(validation.ok, false, expected);
  assert.ok(
    validation.errors.includes(expected),
    `expected ${expected}; got ${validation.errors.join('; ')}`
  );
}
