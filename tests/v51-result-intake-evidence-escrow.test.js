import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import {
  buildPendingResultFromEscrow,
  buildResultEvidenceEscrow,
  buildResultIntakePreview,
  toSerializableResultIntakeContract,
  validatePendingResultContract,
  validateResultEscrowConfirmInput,
  validateResultEvidenceEscrowContract,
  validateResultIntakePreviewContract,
  validateResultIntakeRequestContract
} from '../src/symphony/result-intake-contracts.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, '..');
const FIXTURE_DIR = join(REPO_ROOT, 'fixtures/contracts/result-intake');
const GENERATED_AT = '2026-06-12T09:30:00.000Z';
const EXPIRES_AT = '2026-06-12T09:45:00.000Z';

describe('v51 result intake evidence escrow contracts', () => {
  it('builds safe worker request, preview, escrow, and pending result contracts without appending events', () => {
    const request = fixture('safe-worker-result.v1.json');
    const requestValidation = validateResultIntakeRequestContract(request);
    const preview = buildResultIntakePreview(request, {
      generatedAt: GENERATED_AT,
      expiresAt: EXPIRES_AT
    });
    const previewValidation = validateResultIntakePreviewContract(preview);
    const confirmValidation = validateResultEscrowConfirmInput({
      preview,
      planHash: preview.planHash,
      now: '2026-06-12T09:40:00.000Z'
    });
    const escrow = buildResultEvidenceEscrow(preview, {
      createdAt: '2026-06-12T09:41:00.000Z',
      now: '2026-06-12T09:41:00.000Z'
    });
    const pending = buildPendingResultFromEscrow(escrow);

    assert.equal(requestValidation.ok, true);
    assert.equal(previewValidation.ok, true);
    assert.equal(confirmValidation.ok, true);
    assert.equal(validateResultEvidenceEscrowContract(escrow, { preview }).ok, true);
    assert.equal(validatePendingResultContract(pending).ok, true);
    assert.match(preview.planHash, /^sha256:[a-f0-9]{64}$/u);
    assert.equal(preview.readOnly, true);
    assert.equal(preview.willMutate, false);
    assert.equal(preview.previewWriteTarget.writesOnPreview, false);
    assert.equal(preview.previewWriteTarget.writesGoalEventLog, false);
    assert.equal(preview.eventCandidate.state, 'eligible');
    assert.equal(preview.eventCandidate.eventType, 'worker.evidence-recorded');
    assert.equal(escrow.writeStatus, 'confirmed');
    assert.equal(escrow.boundaries.directGoalEventAppendAvailable, false);
    assert.equal(pending.state, 'available');
    assertNoRawTranscriptPayload(preview);
    assertNoRawTranscriptPayload(escrow);
    assertNoRawTranscriptPayload(pending);
  });

  it('keeps blocker result escrow separate from goal event append and exposes pending blocked state', () => {
    const request = fixture('blocker-result.v1.json');
    const preview = buildResultIntakePreview(request, {
      generatedAt: GENERATED_AT,
      expiresAt: EXPIRES_AT
    });
    const escrow = buildResultEvidenceEscrow(preview, {
      createdAt: '2026-06-12T09:35:00.000Z',
      now: '2026-06-12T09:35:00.000Z'
    });
    const pending = buildPendingResultFromEscrow(escrow);

    assert.equal(validateResultIntakeRequestContract(request).ok, true);
    assert.equal(validateResultIntakePreviewContract(preview).ok, true);
    assert.equal(preview.eventCandidate.state, 'eligible');
    assert.equal(preview.eventCandidate.eventType, 'blocker.opened');
    assert.equal(preview.eventCandidate.commandName, 'symphony goal update');
    assert.equal(preview.eventCandidate.willAppendGoalEvent, false);
    assert.equal(pending.state, 'blocked');
    assert.deepEqual(pending.blockedReasons, [
      'eligible-result-event',
      'backend result-intake confirm route belongs to PR-2'
    ]);
    assert.equal(pending.boundaries.directGoalEventAppendAvailable, false);
  });

  it('rejects requests without controlled evidence refs', () => {
    const request = fixture('missing-evidence-refs.invalid.v1.json');
    const validation = validateResultIntakeRequestContract(request);

    assert.equal(validation.ok, false);
    assert.ok(validation.errors.includes('evidenceRefs must contain at least one controlled evidence ref'));
  });

  it('rejects raw transcript fields and removes unsafe content from serializable output', () => {
    const request = fixture('unsafe-transcript.invalid.v1.json');
    const validation = validateResultIntakeRequestContract(request);
    const serialized = toSerializableResultIntakeContract(request);

    assert.equal(validation.ok, false);
    assert.ok(validation.errors.includes('resultBlock.rawTranscript is not allowed'));
    assert.ok(validation.errors.includes('resultBlock.rawModelOutput is not allowed'));
    assertNoRawTranscriptPayload(serialized);
  });

  it('blocks unsupported event families before result escrow confirm', () => {
    const request = fixture('unsupported-event-family.v1.json');
    const preview = buildResultIntakePreview(request, {
      generatedAt: GENERATED_AT,
      expiresAt: EXPIRES_AT
    });
    const confirmValidation = validateResultEscrowConfirmInput({
      preview,
      planHash: preview.planHash,
      now: '2026-06-12T09:35:00.000Z'
    });

    assert.equal(validateResultIntakeRequestContract(request).ok, true);
    assert.equal(validateResultIntakePreviewContract(preview).ok, true);
    assert.equal(preview.eventCandidate.state, 'blocked');
    assert.equal(preview.eventCandidate.reason, 'event-routed-to-goal-review');
    assert.equal(preview.eventCandidate.commandName, 'symphony goal review');
    assert.equal(confirmValidation.ok, false);
    assert.ok(confirmValidation.errors.includes('preview event candidate is not eligible'));
    assertNoRawTranscriptPayload(preview);
  });

  it('rejects stale previews and mismatched plan hashes without writing escrow', () => {
    const stalePreview = fixture('stale-preview.invalid.v1.json');
    const mismatch = fixture('hash-mismatch.invalid.v1.json');
    const staleValidation = validateResultEscrowConfirmInput({
      preview: stalePreview,
      planHash: stalePreview.planHash,
      now: '2026-06-12T09:10:00.000Z'
    });
    const mismatchValidation = validateResultEscrowConfirmInput({
      preview: {
        ...stalePreview,
        expiresAt: '2026-06-12T09:30:00.000Z'
      },
      planHash: mismatch.submittedPlanHash,
      now: mismatch.now
    });

    assert.equal(validateResultIntakePreviewContract(stalePreview).ok, true);
    assert.equal(staleValidation.ok, false);
    assert.ok(staleValidation.errors.includes('preview expired'));
    assert.equal(mismatch.previewPlanHash, stalePreview.planHash);
    assert.equal(mismatchValidation.ok, false);
    assert.ok(mismatchValidation.errors.includes('planHash must match result intake preview'));
  });

  it('strips raw transcript fields from serializable preview-like objects', () => {
    const request = fixture('safe-worker-result.v1.json');
    const preview = buildResultIntakePreview(request, {
      generatedAt: GENERATED_AT,
      expiresAt: EXPIRES_AT
    });
    const serialized = toSerializableResultIntakeContract({
      ...preview,
      sanitizedSummary: {
        ...preview.sanitizedSummary,
        rawTranscript: 'provider session secret should never be projected',
        notes: 'raw model output should never be serialized'
      }
    });

    assertNoRawTranscriptPayload(serialized);
    assert.equal(Object.hasOwn(serialized.sanitizedSummary, 'rawTranscript'), false);
    assert.equal(Object.hasOwn(serialized.sanitizedSummary, 'notes'), false);
  });
});

function fixture(name) {
  return JSON.parse(readFileSync(join(FIXTURE_DIR, name), 'utf8'));
}

function assertNoRawTranscriptPayload(value) {
  const serialized = JSON.stringify(value);

  assert.doesNotMatch(serialized, /provider session secret/u);
  assert.doesNotMatch(serialized, /raw model output/u);
  assert.doesNotMatch(serialized, /rawTranscript/u);
  assert.doesNotMatch(serialized, /rawModelOutput/u);
}
