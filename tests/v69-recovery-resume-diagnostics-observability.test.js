import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  OPERATION_DIAGNOSTICS_SUMMARY_CONTRACT_NAME,
  OPERATION_FAILURE_CLASSIFICATION_CONTRACT_NAME,
  OPERATION_RECOVERY_CONFIRMATION_CONTRACT_NAME,
  OPERATION_RECOVERY_PREVIEW_CONTRACT_NAME,
  OPERATION_TIMELINE_CONTRACT_NAME,
  OPERATION_USAGE_TIME_OBSERVABILITY_CONTRACT_NAME,
  RUN_RECOVERY_BOUNDARIES,
  RunRecoveryContractError,
  buildOperationFailureClassification,
  buildOperationDiagnosticsSummary,
  buildOperationRecoveryPreview,
  buildOperationTimeline,
  buildUsageTimeObservability,
  computeOperationRecoveryPreviewPlanHash,
  confirmOperationRecoveryPreview,
  validateOperationFailureClassificationContract,
  validateOperationDiagnosticsSummaryContract,
  validateOperationRecoveryConfirmationContract,
  validateOperationRecoveryPreviewContract,
  validateOperationTimelineContract,
  validateUsageTimeObservabilityContract
} from '../src/symphony/run-recovery-contracts.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, '..');
const FIXTURE_DIR = join(REPO_ROOT, 'fixtures/contracts/run-recovery');
const GENERATED_AT = '2026-06-15T00:40:00.000Z';
const HASH_A = 'sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
const HASH_B = 'sha256:bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';

const CLASSIFICATION_FIXTURES = Object.freeze([
  ['failure-classification.worker-timeout.v1.json', 'provider', 'timeout', 'retry-same-provider', true],
  ['failure-classification.reviewer-blocked.v1.json', 'review', 'blocked', 'mark-blocked', false],
  ['failure-classification.missing-artifact.v1.json', 'artifact', 'blocked', 'inspect-adoption-journal', false],
  ['failure-classification.stale-plan-hash.v1.json', 'schema', 'blocked', 'refresh-plan-preview', false],
  ['failure-classification.dirty-worktree.v1.json', 'workspace', 'blocked', 'inspect-adoption-journal', false],
  ['failure-classification.verification-failure.v1.json', 'verifier', 'failed', 'rerun-verification', true],
  ['failure-classification.adoption-failure.v1.json', 'adoption', 'failed', 'inspect-adoption-journal', false],
  ['failure-classification.provider-unavailable.v1.json', 'provider', 'blocked', 'mark-blocked', false],
  ['failure-classification.unknown-failure.v1.json', 'unknown', 'failed', 'request-operator-decision', false]
]);

describe('v69 Recovery, Resume, Diagnostics, and Observability contracts', () => {
  it('validates failure classification fixtures across the v69 taxonomy', () => {
    for (const [name, layer, status, nextAction, resumeEligible] of CLASSIFICATION_FIXTURES) {
      const classification = fixture(name);
      const validation = validateOperationFailureClassificationContract(classification);

      assert.equal(validation.ok, true, `${name}: ${validation.errors.join('; ')}`);
      assert.equal(classification.contractName, OPERATION_FAILURE_CLASSIFICATION_CONTRACT_NAME);
      assert.equal(classification.failureLayer, layer);
      assert.equal(classification.status, status);
      assert.equal(classification.nextSafeAction.actionId, nextAction);
      assert.equal(classification.resumeEligibility.eligible, resumeEligible);
      assert.deepEqual(classification.boundaries, RUN_RECOVERY_BOUNDARIES);
      assertNoUnsafePayload(classification);
    }
  });

  it('validates operation timeline fixtures with step-level failure summaries', () => {
    const timeline = fixture('operation-timeline.worker-timeout.v1.json');
    const validation = validateOperationTimelineContract(timeline);

    assert.equal(validation.ok, true, validation.errors.join('; '));
    assert.equal(timeline.contractName, OPERATION_TIMELINE_CONTRACT_NAME);
    assert.equal(timeline.status, 'timeout');
    assert.equal(timeline.failureClassification.failureLayer, 'provider');
    assert.equal(timeline.steps[0].failure.classificationId, timeline.failureClassification.classificationId);
    assert.equal(timeline.steps[0].providerId, 'codex-cli');
    assert.equal(timeline.steps[1].status, 'pending');
    assert.equal(timeline.nextSafeAction.actionId, 'retry-same-provider');
    assert.deepEqual(timeline.boundaries, RUN_RECOVERY_BOUNDARIES);
    assertNoUnsafePayload(timeline);
  });

  it('builds a retry-eligible provider timeout only when plan hash and source fingerprint still match', () => {
    const classification = buildOperationFailureClassification({
      generatedAt: GENERATED_AT,
      operationId: 'op-v69-timeout-builder',
      stepId: 'worker-run',
      phase: 'worker-run',
      status: 'timeout',
      providerId: 'codex-cli',
      role: 'worker',
      failureLayer: 'provider',
      failureCode: 'provider-timeout',
      retryable: true
    });

    assert.equal(classification.resumeEligibility.eligible, true);
    assert.equal(classification.planHash.matches, true);
    assert.equal(classification.sourceFingerprint.matches, true);
    assert.equal(classification.nextSafeAction.actionId, 'retry-same-provider');
    assert.equal(classification.nextSafeAction.backendOwned, true);
    assert.equal(classification.nextSafeAction.willMutate, false);
    assert.equal(classification.boundaries.hiddenRetryAvailable, false);
    assert.equal(validateOperationFailureClassificationContract(classification).ok, true);
  });

  it('blocks stale plan hashes before retry or resume can be confirmed', () => {
    const classification = buildOperationFailureClassification({
      generatedAt: GENERATED_AT,
      operationId: 'op-v69-stale-builder',
      stepId: 'recovery-confirm',
      phase: 'adoption-confirm',
      status: 'blocked',
      failureLayer: 'schema',
      failureCode: 'stale-plan-hash',
      planHash: {
        expected: HASH_A,
        current: HASH_B,
        matches: false
      }
    });

    assert.equal(classification.resumeEligibility.eligible, false);
    assert.ok(classification.resumeEligibility.blockedReasons.includes('plan-hash-mismatch'));
    assert.equal(classification.nextSafeAction.actionId, 'refresh-plan-preview');
    assert.equal(validateOperationFailureClassificationContract(classification).ok, true);

    classification.resumeEligibility.eligible = true;
    assertValidationIncludes(
      validateOperationFailureClassificationContract(classification),
      'resumeEligibility.eligible must be false for stale-plan-hash classifications'
    );
  });

  it('keeps provider unavailable and unknown failures outside hidden retry paths', () => {
    const providerUnavailable = fixture('failure-classification.provider-unavailable.v1.json');
    const unknownFailure = fixture('failure-classification.unknown-failure.v1.json');

    assert.equal(providerUnavailable.retryable, false);
    assert.equal(providerUnavailable.resumeEligibility.eligible, false);
    assert.ok(providerUnavailable.resumeEligibility.blockedReasons.includes('provider-unavailable'));
    assert.equal(providerUnavailable.nextSafeAction.actionId, 'mark-blocked');
    assert.equal(unknownFailure.retryable, false);
    assert.equal(unknownFailure.resumeEligibility.eligible, false);
    assert.equal(unknownFailure.nextSafeAction.actionId, 'request-operator-decision');
  });

  it('builds timelines from backend-owned failure classifications without raw execution payloads', () => {
    const classification = buildOperationFailureClassification({
      generatedAt: GENERATED_AT,
      operationId: 'op-v69-verifier-builder',
      stepId: 'main-verification',
      phase: 'main-verification',
      status: 'failed',
      role: 'verifier',
      failureLayer: 'verifier',
      failureCode: 'main-verification-failed',
      retryable: true,
      evidenceRefs: [{
        kind: 'command-evidence',
        ref: 'command-evidence:v69:main-verification',
        label: 'fixed main verification result'
      }]
    });
    const timeline = buildOperationTimeline({
      generatedAt: GENERATED_AT,
      operationId: 'op-v69-verifier-builder',
      status: 'failed',
      startedAt: '2026-06-15T00:39:00.000Z',
      finishedAt: GENERATED_AT,
      failureClassification: classification,
      steps: [{
        stepId: 'main-verification',
        label: 'Fixed main verification',
        phase: 'main-verification',
        status: 'failed',
        startedAt: '2026-06-15T00:39:00.000Z',
        finishedAt: GENERATED_AT,
        role: 'verifier',
        evidenceRefs: classification.evidenceRefs
      }]
    });

    assert.equal(timeline.failureClassification.classificationId, classification.classificationId);
    assert.equal(timeline.steps[0].failure.resumeEligible, true);
    assert.equal(timeline.nextSafeAction.actionId, 'rerun-verification');
    assert.equal(validateOperationTimelineContract(timeline).ok, true);
    assertNoUnsafePayload(timeline);
  });

  it('rejects unsafe diagnostics refs, hidden retry drift, and mutation actions', () => {
    const unsafe = structuredClone(fixture('failure-classification.worker-timeout.v1.json'));

    unsafe.evidenceRefs[0].ref = '/Users/andy/.codex/sessions/worker.jsonl';
    unsafe.recoveryActions[0].willMutate = true;
    unsafe.boundaries.hiddenRetryAvailable = true;

    const validation = validateOperationFailureClassificationContract(unsafe);

    assert.equal(validation.ok, false);
    assertValidationIncludes(validation, 'evidenceRefs[0].ref must be a safe bounded ref');
    assertValidationIncludes(validation, 'recoveryActions[0].willMutate must be false');
    assertValidationIncludes(validation, 'boundaries.hiddenRetryAvailable must be false');
  });

  it('rejects failed timelines without a matching failure classification', () => {
    const timeline = fixture('operation-timeline.worker-timeout.v1.json');

    timeline.failureClassification.stepId = 'missing-step';

    assertValidationIncludes(
      validateOperationTimelineContract(timeline),
      'failureClassification.stepId must match a timeline step'
    );

    timeline.failureClassification = null;
    assertValidationIncludes(
      validateOperationTimelineContract(timeline),
      'failureClassification is required for failed, blocked, timeout, or interrupted timelines'
    );
  });

  it('builds and confirms planHash-bound same-provider retry previews without invoking providers', () => {
    const classification = fixture('failure-classification.worker-timeout.v1.json');
    const preview = buildOperationRecoveryPreview({
      generatedAt: GENERATED_AT,
      classification,
      requestedActionId: 'retry-same-provider'
    });

    assert.equal(preview.contractName, OPERATION_RECOVERY_PREVIEW_CONTRACT_NAME);
    assert.equal(preview.state, 'ready');
    assert.equal(preview.requestedAction.actionId, 'retry-same-provider');
    assert.equal(preview.resumeBinding.requiresSameProvider, true);
    assert.equal(preview.resumeBinding.providerId, 'codex-cli');
    assert.equal(preview.resumeBinding.targetProviderId, 'codex-cli');
    assert.equal(preview.confirmation.providerInvokedOnConfirm, false);
    assert.equal(preview.confirmation.hiddenRetryAllowed, false);
    assert.equal(preview.planHash, computeOperationRecoveryPreviewPlanHash(preview));
    assert.equal(validateOperationRecoveryPreviewContract(preview).ok, true);

    const confirmation = confirmOperationRecoveryPreview({
      generatedAt: GENERATED_AT,
      preview,
      input: confirmInput(preview),
      evidenceRefs: [{
        kind: 'operation-record',
        ref: 'operation-record:v69:retry-confirmed',
        label: 'retry preview confirmation'
      }]
    });

    assert.equal(confirmation.contractName, OPERATION_RECOVERY_CONFIRMATION_CONTRACT_NAME);
    assert.equal(confirmation.status, 'confirmed');
    assert.equal(confirmation.recoveryState, 'retry-preview-confirmed');
    assert.equal(confirmation.providerInvoked, false);
    assert.equal(confirmation.gitMutationPerformed, false);
    assert.equal(confirmation.rawPayloadCaptured, false);
    assert.equal(confirmation.diagnosticsOnly, true);
    assert.equal(confirmation.stateTransition.providerToRun, 'codex-cli');
    assert.equal(validateOperationRecoveryConfirmationContract(confirmation).ok, true);
    assertNoUnsafePayload(confirmation);
  });

  it('rejects stale preview hashes and source fingerprint drift during recovery confirm', () => {
    const preview = buildOperationRecoveryPreview({
      generatedAt: GENERATED_AT,
      classification: fixture('failure-classification.worker-timeout.v1.json'),
      requestedActionId: 'retry-same-provider'
    });

    assert.throws(
      () => confirmOperationRecoveryPreview({
        generatedAt: GENERATED_AT,
        preview,
        input: {
          ...confirmInput(preview),
          planHash: HASH_B
        }
      }),
      (error) => error instanceof RunRecoveryContractError && error.code === 'stale-recovery-preview'
    );

    assert.throws(
      () => confirmOperationRecoveryPreview({
        generatedAt: GENERATED_AT,
        preview,
        input: confirmInput(preview),
        currentSourceFingerprint: HASH_B
      }),
      (error) => error instanceof RunRecoveryContractError && error.code === 'source-fingerprint-drift'
    );
  });

  it('blocks unavailable continuation actions while allowing explicit mark-blocked confirm', () => {
    const providerUnavailable = fixture('failure-classification.provider-unavailable.v1.json');
    const retryPreview = buildOperationRecoveryPreview({
      generatedAt: GENERATED_AT,
      classification: providerUnavailable,
      requestedActionId: 'retry-same-provider'
    });

    assert.equal(retryPreview.state, 'blocked');
    assert.ok(retryPreview.blockedReasons.includes('requested-action-not-available'));
    assert.ok(retryPreview.blockedReasons.includes('requested-action-blocked'));
    assertValidationIncludes(
      validateOperationRecoveryPreviewContract({
        ...retryPreview,
        blockedReasons: []
      }),
      'blockedReasons must not be empty when preview is blocked'
    );

    const blockedPreview = buildOperationRecoveryPreview({
      generatedAt: GENERATED_AT,
      classification: providerUnavailable,
      requestedActionId: 'mark-blocked'
    });

    assert.equal(blockedPreview.state, 'ready');
    assert.equal(blockedPreview.requestedAction.actionId, 'mark-blocked');

    const confirmation = confirmOperationRecoveryPreview({
      generatedAt: GENERATED_AT,
      preview: blockedPreview,
      input: confirmInput(blockedPreview)
    });

    assert.equal(confirmation.recoveryState, 'blocked-recorded');
    assert.equal(confirmation.stateTransition.markBlockedRecorded, true);
    assert.equal(confirmation.providerInvoked, false);
    assert.equal(validateOperationRecoveryConfirmationContract(confirmation).ok, true);
  });

  it('rejects recovery confirmations that drift into provider execution, git writes, or captured payloads', () => {
    const preview = buildOperationRecoveryPreview({
      generatedAt: GENERATED_AT,
      classification: fixture('failure-classification.worker-timeout.v1.json')
    });
    const confirmation = confirmOperationRecoveryPreview({
      generatedAt: GENERATED_AT,
      preview,
      input: confirmInput(preview)
    });

    confirmation.providerInvoked = true;
    confirmation.gitMutationPerformed = true;
    confirmation.rawPayloadCaptured = true;
    confirmation.evidenceRefs.push({
      kind: 'artifact-ref',
      ref: 'artifact-ref:v69:raw-provider-output',
      label: 'unsafe payload'
    });

    const validation = validateOperationRecoveryConfirmationContract(confirmation);

    assert.equal(validation.ok, false);
    assertValidationIncludes(validation, 'providerInvoked must be false');
    assertValidationIncludes(validation, 'gitMutationPerformed must be false');
    assertValidationIncludes(validation, 'rawPayloadCaptured must be false');
    assertValidationIncludes(
      validation,
      'confirmation.evidenceRefs[0].ref must not contain raw provider output'
    );
  });

  it('records usage and time only as observed, unavailable, or unknown values', () => {
    const observed = buildUsageTimeObservability({
      generatedAt: GENERATED_AT,
      elapsedMs: 1200,
      providerCallCount: 1,
      tokenInput: { status: 'observed', value: 321 },
      tokenOutput: { status: 'unavailable', value: null },
      cost: { status: 'observed', amount: 0.42, currency: 'USD' },
      source: 'operation-record:v69:usage-observed'
    });

    assert.equal(observed.contractName, OPERATION_USAGE_TIME_OBSERVABILITY_CONTRACT_NAME);
    assert.equal(observed.status, 'observed');
    assert.equal(observed.elapsedMs.value, 1200);
    assert.equal(observed.providerCallCount.value, 1);
    assert.equal(observed.tokenInput.value, 321);
    assert.equal(observed.tokenOutput.status, 'unavailable');
    assert.equal(observed.cost.amount, 0.42);
    assert.equal(validateUsageTimeObservabilityContract(observed).ok, true);

    const unknown = buildUsageTimeObservability({
      generatedAt: GENERATED_AT,
      elapsedMs: { status: 'unknown', value: null },
      providerCallCount: { status: 'unknown', value: null },
      tokenInput: { status: 'unknown', value: null },
      tokenOutput: { status: 'unknown', value: null },
      cost: { status: 'unknown', amount: null, currency: null }
    });

    assert.equal(unknown.status, 'unknown');
    assert.equal(unknown.cost.amount, null);

    observed.cost.status = 'unknown';
    assertValidationIncludes(
      validateUsageTimeObservabilityContract(observed),
      'cost.amount must be null unless status is observed'
    );
  });

  it('builds diagnostics summaries that redact unsafe text and keep only bounded refs', () => {
    const classification = fixture('failure-classification.worker-timeout.v1.json');
    const preview = buildOperationRecoveryPreview({ generatedAt: GENERATED_AT, classification });
    const confirmation = confirmOperationRecoveryPreview({
      generatedAt: GENERATED_AT,
      preview,
      input: confirmInput(preview)
    });
    const usage = buildUsageTimeObservability({
      generatedAt: GENERATED_AT,
      elapsedMs: 1200,
      providerCallCount: 1,
      tokenInput: { status: 'unknown', value: null },
      tokenOutput: { status: 'unknown', value: null },
      cost: { status: 'unknown', amount: null, currency: null }
    });
    const summary = buildOperationDiagnosticsSummary({
      generatedAt: GENERATED_AT,
      operationId: classification.operationId,
      status: 'warning',
      timeline: fixture('operation-timeline.worker-timeout.v1.json'),
      classifications: [classification],
      recoveryPreviews: [preview],
      recoveryConfirmations: [confirmation],
      usage,
      diagnostics: [{
        kind: 'summary',
        label: 'worker timeout',
        summary: 'Retry preview confirmed from bounded operation evidence.',
        ref: 'diagnostic-ref:v69:worker-timeout'
      }, {
        kind: 'summary',
        label: 'raw provider output from /Users/andy/.codex/session.jsonl',
        summary: 'sk-secret should be removed before projection',
        ref: '/Users/andy/.codex/session.jsonl'
      }],
      evidenceRefs: [{
        kind: 'operation-record',
        ref: 'operation-record:v69:diagnostics-summary',
        label: 'diagnostics summary evidence'
      }]
    });

    assert.equal(summary.contractName, OPERATION_DIAGNOSTICS_SUMMARY_CONTRACT_NAME);
    assert.deepEqual(summary.failureLayers, ['provider']);
    assert.deepEqual(summary.recoveryStates, ['retry-preview-confirmed']);
    assert.equal(summary.redaction.secretsRedacted, true);
    assert.equal(summary.redaction.redactedCount, 3);
    assert.equal(summary.diagnostics[1].label, '[redacted]');
    assert.equal(summary.diagnostics[1].summary, '[redacted]');
    assert.equal(summary.diagnostics[1].ref, 'diagnostic-ref:redacted');
    assert.equal(summary.redaction.rawProviderOutputIncluded, false);
    assert.equal(summary.redaction.localSessionPathsIncluded, false);
    assert.equal(validateOperationDiagnosticsSummaryContract(summary).ok, true);
    assertNoUnsafePayload(summary);
  });

  it('rejects diagnostics summaries that leak raw refs after construction', () => {
    const summary = buildOperationDiagnosticsSummary({
      generatedAt: GENERATED_AT,
      diagnostics: [{
        kind: 'summary',
        label: 'bounded diagnostic',
        summary: 'No unsafe payload included.',
        ref: 'diagnostic-ref:v69:safe'
      }]
    });

    summary.diagnostics[0].summary = 'raw transcript from provider session';
    summary.redaction.rawTranscriptIncluded = true;

    const validation = validateOperationDiagnosticsSummaryContract(summary);

    assert.equal(validation.ok, false);
    assertValidationIncludes(validation, 'redaction.rawTranscriptIncluded must be false');
    assertValidationIncludes(
      validation,
      'summary.diagnostics[0].summary must not contain raw provider output'
    );
  });
});

function fixture(name) {
  return JSON.parse(readFileSync(join(FIXTURE_DIR, name), 'utf8'));
}

function assertValidationIncludes(validation, expected) {
  assert.equal(validation.ok, false);
  assert.ok(
    validation.errors.some((error) => error.includes(expected)),
    `Expected validation error containing ${expected}; got ${validation.errors.join('; ')}`
  );
}

function assertNoUnsafePayload(value) {
  const unsafe = findUnsafeStrings(value);

  assert.deepEqual(unsafe, []);
}

function confirmInput(preview) {
  return {
    planHash: preview.planHash,
    actionId: preview.requestedAction.actionId,
    classificationId: preview.classificationId,
    operationId: preview.operationId,
    stepId: preview.stepId,
    sourceFingerprint: preview.resumeBinding.sourceFingerprint.current
  };
}

function findUnsafeStrings(value, path = 'value') {
  const unsafe = [];
  const pattern =
    /(?:^|[/.])(?:\.codex|\.claude|\.git|\.symphony)(?:[/]|$)|\/Users\/|\.jsonl(?:$|[/\s])|raw transcript|raw provider output|raw model output|hidden retry|github release/iu;

  if (typeof value === 'string') {
    if (pattern.test(value)) {
      unsafe.push(`${path}: ${value}`);
    }
    return unsafe;
  }

  if (Array.isArray(value)) {
    value.forEach((entry, index) => {
      unsafe.push(...findUnsafeStrings(entry, `${path}[${index}]`));
    });
    return unsafe;
  }

  if (value !== null && typeof value === 'object') {
    for (const [key, entry] of Object.entries(value)) {
      unsafe.push(...findUnsafeStrings(entry, `${path}.${key}`));
    }
  }

  return unsafe;
}
