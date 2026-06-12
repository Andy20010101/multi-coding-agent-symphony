import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  CODEX_PROVIDER_EXECUTION_BOUNDARIES,
  CODEX_PROVIDER_EXECUTION_CONFIRMATION_CONTRACT_NAME,
  CODEX_PROVIDER_EXECUTION_PREVIEW_CONTRACT_NAME,
  CODEX_PROVIDER_ID,
  CODEX_PROVIDER_RESULT_RETURN_PATH,
  CODEX_PROVIDER_ROLE,
  CODEX_PROVIDER_RUN_RECORD_CONTRACT_NAME,
  CodexProviderExecutionContractError,
  assertCodexProviderExecutionPreviewContract,
  buildCodexProviderExecutionConfirmation,
  buildCodexProviderExecutionPreview,
  buildCodexProviderRunRecord,
  codexProviderExecutionHash,
  computeCodexProviderExecutionPreviewHash,
  validateCodexProviderExecutionConfirmationContract,
  validateCodexProviderExecutionPreviewContract,
  validateCodexProviderRunRecordContract
} from '../src/symphony/codex-provider-execution-contracts.js';
import { validateChildTaskPackContract } from '../src/symphony/child-dispatch-preview-contracts.js';
import { validateResultIntakeRequestContract } from '../src/symphony/result-intake-contracts.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, '..');
const FIXTURE_DIR = join(REPO_ROOT, 'fixtures/contracts/codex-provider-execution');
const GENERATED_AT = '2026-06-12T14:00:00.000Z';

const VALID_PREVIEW_FIXTURES = Object.freeze([
  'preview.ready.v1.json',
  'preview.missing-task-pack.v1.json',
  'preview.unsupported-provider.v1.json'
]);
const VALID_RUN_RECORD_FIXTURES = Object.freeze([
  'run-record.completed.v1.json',
  'run-record.blocked.v1.json'
]);

describe('v54 Codex provider execution pilot contracts and fixtures', () => {
  it('validates ready and blocked preview fixtures without starting provider execution', () => {
    for (const name of VALID_PREVIEW_FIXTURES) {
      const preview = fixture(name);
      const validation = validateCodexProviderExecutionPreviewContract(preview);

      assert.equal(validation.ok, true, `${name}: ${validation.errors.join('; ')}`);
      assert.equal(preview.contractName, CODEX_PROVIDER_EXECUTION_PREVIEW_CONTRACT_NAME);
      assert.equal(preview.providerId, CODEX_PROVIDER_ID);
      assert.equal(preview.role, CODEX_PROVIDER_ROLE);
      assert.equal(preview.executionPolicy.startsOnPreview, false);
      assert.equal(preview.executionPolicy.requiresOperatorConfirmation, true);
      assert.equal(preview.executionPolicy.requiresPreviewHash, true);
      assert.equal(preview.resultReturn.returnPath, CODEX_PROVIDER_RESULT_RETURN_PATH);
      assert.equal(preview.resultReturn.directGoalEventAppendAvailable, false);
      assert.equal(preview.resultReturn.directTaskCompleteAvailable, false);
      assertNoMutationBoundaries(preview.boundaries);
    }
  });

  it('keeps the source child task pack copy-only while v54 execution stays Codex-only', () => {
    const taskPack = fixture('task-pack.codex-worker.v1.json');
    const preview = fixture('preview.ready.v1.json');

    assert.deepEqual(validateChildTaskPackContract(taskPack), { ok: true, errors: [] });
    assert.equal(taskPack.copyOnly, true);
    assert.equal(taskPack.willMutate, false);
    assert.equal(taskPack.returnPath, CODEX_PROVIDER_RESULT_RETURN_PATH);
    assert.deepEqual(taskPack.allowedProviders, ['codex', 'claude-code']);
    assert.deepEqual(preview.executionPolicy.allowedProviders, [CODEX_PROVIDER_ID]);
    assert.deepEqual(preview.executionPolicy.allowedRoles, [CODEX_PROVIDER_ROLE]);
    assert.equal(preview.taskPackHash, codexProviderExecutionHash(taskPack));
    assert.equal(preview.previewHash, computeCodexProviderExecutionPreviewHash(preview));
  });

  it('blocks preview when the child task pack is missing or targets an unsupported provider', () => {
    const missing = fixture('preview.missing-task-pack.v1.json');
    const unsupported = fixture('preview.unsupported-provider.v1.json');

    assert.deepEqual(missing.blockedReasons, ['task-pack-missing']);
    assert.equal(missing.taskPackRef, null);
    assert.equal(missing.taskPackHash, null);
    assert.equal(missing.inputSummary.taskPackAvailable, false);

    assert.deepEqual(unsupported.blockedReasons, ['unsupported-provider']);
    assert.equal(unsupported.taskPackRef, null);
    assert.equal(unsupported.taskPackHash, null);
    assert.equal(unsupported.inputSummary.taskPackAvailable, true);

    for (const preview of [missing, unsupported]) {
      assert.equal(validateCodexProviderExecutionPreviewContract(preview).ok, true);
      assert.equal(preview.executionPolicy.startsOnPreview, false);
      assert.equal(preview.boundaries.providerExecutionStartsOnPreview, false);
    }
  });

  it('binds confirmation to the current ready preview hash', () => {
    const preview = fixture('preview.ready.v1.json');
    const confirmation = fixture('confirmation.ready.v1.json');

    assert.equal(confirmation.contractName, CODEX_PROVIDER_EXECUTION_CONFIRMATION_CONTRACT_NAME);
    assert.deepEqual(
      validateCodexProviderExecutionConfirmationContract(confirmation, { preview }),
      { ok: true, errors: [] }
    );

    const mismatched = structuredClone(confirmation);
    mismatched.previewHash = 'sha256:0000000000000000000000000000000000000000000000000000000000000000';
    assertValidationIncludes(
      validateCodexProviderExecutionConfirmationContract(mismatched, { preview }),
      'previewHash must match codex provider execution preview'
    );

    const blockedPreview = fixture('preview.missing-task-pack.v1.json');
    assertValidationIncludes(
      validateCodexProviderExecutionConfirmationContract(confirmation, { preview: blockedPreview }),
      'preview must be ready before confirmation'
    );
  });

  it('validates completed and blocked run records with sanitized v51 result intake requests', () => {
    const preview = fixture('preview.ready.v1.json');
    const confirmation = fixture('confirmation.ready.v1.json');

    for (const name of VALID_RUN_RECORD_FIXTURES) {
      const runRecord = fixture(name);
      const validation = validateCodexProviderRunRecordContract(runRecord, {
        preview,
        confirmation
      });

      assert.equal(validation.ok, true, `${name}: ${validation.errors.join('; ')}`);
      assert.equal(runRecord.contractName, CODEX_PROVIDER_RUN_RECORD_CONTRACT_NAME);
      assert.equal(runRecord.providerId, CODEX_PROVIDER_ID);
      assert.equal(runRecord.role, CODEX_PROVIDER_ROLE);
      assert.equal(runRecord.resultIntakeRequest.contractName, 'resultIntakeRequest.v1');
      assert.equal(runRecord.resultIntakeRequest.workerRole, CODEX_PROVIDER_ROLE);
      assert.equal(runRecord.resultIntakeRequest.source, CODEX_PROVIDER_ID);
      assert.deepEqual(validateResultIntakeRequestContract(runRecord.resultIntakeRequest), {
        ok: true,
        errors: []
      });
      assertNoMutationBoundaries(runRecord.boundaries);
      assertResultIntakeBoundary(runRecord.resultIntakeRequest.boundaries);
      assert.doesNotMatch(JSON.stringify(runRecord.resultIntakeRequest.resultBlock), /rawTranscript|rawModelOutput|provider session|\.jsonl/iu);
    }
  });

  it('builds completed and blocked run records without raw provider output projection', () => {
    const taskPack = fixture('task-pack.codex-worker.v1.json');
    const preview = buildCodexProviderExecutionPreview({
      generatedAt: GENERATED_AT,
      taskPack
    });
    const confirmation = buildCodexProviderExecutionConfirmation(preview, {
      operatorId: 'operator-v54-pr1',
      confirmedAt: '2026-06-12T14:02:00.000Z'
    });
    const completed = buildCodexProviderRunRecord({
      preview,
      confirmation,
      runId: 'codex-v54-pr1-built-completed',
      startedAt: '2026-06-12T14:03:00.000Z',
      finishedAt: '2026-06-12T14:08:00.000Z',
      providerResult: {
        summary: 'Contract helpers and tests completed.',
        rawTranscript: 'raw transcript must not be projected',
        changedFiles: [
          'src/symphony/codex-provider-execution-contracts.js',
          '.codex/sessions/raw.jsonl'
        ],
        validationCommands: [
          'node --test tests/v54-codex-provider-execution-pilot.test.js',
          'cat .codex/sessions/raw.jsonl'
        ],
        evidenceRefs: [{
          kind: 'repo-doc',
          ref: 'docs/plans/v54-pr-1-codex-provider-execution-contracts-evidence-2026-06-12.md',
          label: 'v54 PR-1 contract evidence'
        }]
      }
    });
    const blocked = buildCodexProviderRunRecord({
      preview,
      confirmation,
      runId: 'codex-v54-pr1-built-blocked',
      startedAt: '2026-06-12T14:03:00.000Z',
      finishedAt: '2026-06-12T14:08:00.000Z',
      status: 'blocked',
      providerResult: {
        summary: 'Codex run blocked by missing dependency.',
        blockerReason: 'dependency install failed',
        evidenceRefs: [{
          kind: 'repo-doc',
          ref: 'docs/plans/v54-pr-1-codex-provider-execution-contracts-evidence-2026-06-12.md',
          label: 'v54 PR-1 contract evidence'
        }]
      }
    });

    assert.equal(completed.resultIntakeRequest.requestedEvent.eventType, 'worker.evidence-recorded');
    assert.deepEqual(completed.sanitizedResult.changedFiles, [
      'src/symphony/codex-provider-execution-contracts.js'
    ]);
    assert.deepEqual(completed.sanitizedResult.validationCommands, [
      'node --test tests/v54-codex-provider-execution-pilot.test.js'
    ]);
    assert.doesNotMatch(JSON.stringify(completed.resultIntakeRequest.resultBlock), /rawTranscript|raw transcript|\.jsonl/iu);
    assert.equal(validateCodexProviderRunRecordContract(completed, { preview, confirmation }).ok, true);

    assert.equal(blocked.status, 'blocked');
    assert.equal(blocked.resultIntakeRequest.requestedEvent.eventType, 'blocker.opened');
    assert.equal(blocked.resultIntakeRequest.resultBlock.blockerReason, 'dependency install failed');
    assert.equal(validateCodexProviderRunRecordContract(blocked, { preview, confirmation }).ok, true);
  });

  it('rejects raw transcript fields, local session refs, and direct event append drift', () => {
    assertValidationIncludes(
      validateCodexProviderExecutionPreviewContract(fixture('preview.local-session-ref.invalid.v1.json')),
      'preview.sourceContracts[0].sourceRef.ref must not contain raw provider output, local session refs, or direct mutation routes'
    );
    assertValidationIncludes(
      validateCodexProviderRunRecordContract(fixture('run-record.raw-transcript.invalid.v1.json')),
      'resultIntakeRequest.resultBlock.rawTranscript is not allowed'
    );
    assertValidationIncludes(
      validateCodexProviderRunRecordContract(fixture('run-record.direct-event-append.invalid.v1.json')),
      'resultIntakeRequest.boundaries.directGoalEventAppendAvailable must be false'
    );
  });

  it('rejects hidden provider parity, gate mutation, git, tag, publish, and release routes', () => {
    const preview = fixture('preview.ready.v1.json');
    const runRecord = fixture('run-record.completed.v1.json');
    const routeDrift = structuredClone(preview);
    const boundaryDrift = structuredClone(preview);
    const runDrift = structuredClone(runRecord);

    routeDrift.sourceContracts[0].sourceRef.ref = '/api/provider-parity/release';
    boundaryDrift.boundaries.releaseGateMutationAvailable = true;
    runDrift.resultIntakeRequest.resultBlock.validationCommands = ['git push origin main'];

    assertValidationIncludes(
      validateCodexProviderExecutionPreviewContract(routeDrift),
      'preview.sourceContracts[0].sourceRef.ref must not contain raw provider output, local session refs, or direct mutation routes'
    );
    assertValidationIncludes(
      validateCodexProviderExecutionPreviewContract(boundaryDrift),
      'boundaries.releaseGateMutationAvailable must be false'
    );
    assertValidationIncludes(
      validateCodexProviderRunRecordContract(runDrift),
      'runRecord.resultIntakeRequest.resultBlock.validationCommands[0] must not contain raw provider output, local session refs, or direct mutation routes'
    );
  });

  it('throws a typed error from the preview assert helper', () => {
    const invalid = fixture('preview.ready.v1.json');
    invalid.boundaries.providerExecutionStartsOnPreview = true;

    assert.throws(
      () => assertCodexProviderExecutionPreviewContract(invalid),
      (error) => (
        error instanceof CodexProviderExecutionContractError &&
        error.code === 'invalid-codex-provider-execution-preview' &&
        error.details.reason === 'boundaries.providerExecutionStartsOnPreview must be false'
      )
    );
  });
});

function fixture(name) {
  return JSON.parse(readFileSync(join(FIXTURE_DIR, name), 'utf8'));
}

function assertNoMutationBoundaries(boundaries) {
  for (const [field, expected] of Object.entries(CODEX_PROVIDER_EXECUTION_BOUNDARIES)) {
    assert.equal(boundaries[field], expected, `boundaries.${field}`);
  }
}

function assertResultIntakeBoundary(boundaries) {
  assert.equal(boundaries.providerExecutionAvailable, false);
  assert.equal(boundaries.childDispatchAvailable, false);
  assert.equal(boundaries.directGoalEventAppendAvailable, false);
  assert.equal(boundaries.reviewerMutationAvailable, false);
  assert.equal(boundaries.mainVerificationMutationAvailable, false);
  assert.equal(boundaries.releaseGateMutationAvailable, false);
  assert.equal(boundaries.gitMutationAvailable, false);
  assert.equal(boundaries.githubReleaseAutomationAvailable, false);
}

function assertValidationIncludes(validation, expected) {
  assert.equal(validation.ok, false, expected);
  assert.ok(
    validation.errors.includes(expected),
    `expected ${expected}; got ${validation.errors.join('; ')}`
  );
}
