import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  OPERATION_FAILURE_CLASSIFICATION_CONTRACT_NAME,
  OPERATION_TIMELINE_CONTRACT_NAME,
  RUN_RECOVERY_BOUNDARIES,
  buildOperationFailureClassification,
  buildOperationTimeline,
  validateOperationFailureClassificationContract,
  validateOperationTimelineContract
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
