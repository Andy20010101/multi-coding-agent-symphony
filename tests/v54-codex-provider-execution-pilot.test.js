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
import {
  buildCodexProviderExecutionPreviewFromChildDispatch,
  confirmCodexProviderExecutionPreview,
  validateCodexProviderExecutionConfirmInput
} from '../src/symphony/codex-provider-execution-backend.js';
import {
  buildGoalSupervisorAppReadModel
} from '../src/symphony/goal-supervisor/index.js';
import {
  CodexProviderExecutionRunnerError,
  buildCodexProviderExecutionRunnerRequest,
  runConfirmedCodexProviderExecution
} from '../src/symphony/codex-provider-execution-runner.js';
import { validateResultIntakeRequestContract } from '../src/symphony/result-intake-contracts.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, '..');
const FIXTURE_DIR = join(REPO_ROOT, 'fixtures/contracts/codex-provider-execution');
const CONTRACT_FIXTURE_DIR = join(REPO_ROOT, 'fixtures/contracts');
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

  it('builds a backend Codex execution preview from the v53 child dispatch task pack', () => {
    const childDispatchPreview = contractFixture('child-dispatch-preview.codex-worker.v1.json');
    const preview = buildCodexProviderExecutionPreviewFromChildDispatch({
      childDispatchPreview,
      generatedAt: GENERATED_AT
    });
    const confirmation = confirmCodexProviderExecutionPreview({
      preview,
      input: confirmInputFor(preview),
      confirmedAt: '2026-06-12T14:02:00.000Z'
    });

    assert.equal(validateCodexProviderExecutionPreviewContract(preview).ok, true);
    assert.equal(preview.contractName, CODEX_PROVIDER_EXECUTION_PREVIEW_CONTRACT_NAME);
    assert.equal(preview.goal.goalId, childDispatchPreview.goal.goalId);
    assert.equal(preview.task.taskId, childDispatchPreview.task.taskId);
    assert.equal(preview.providerId, CODEX_PROVIDER_ID);
    assert.equal(preview.role, CODEX_PROVIDER_ROLE);
    assert.equal(preview.taskPackHash, codexProviderExecutionHash(childDispatchPreview.taskPack));
    assert.deepEqual(preview.blockedReasons, []);
    assert.equal(preview.executionPolicy.startsOnPreview, false);
    assert.equal(preview.boundaries.providerExecutionStartsOnPreview, false);
    assert.equal(confirmation.previewHash, preview.previewHash);
    assert.equal(confirmation.providerId, CODEX_PROVIDER_ID);
    assertNoMutationBoundaries(confirmation.boundaries);
  });

  it('blocks backend preview for non-Codex child packs and missing child state', () => {
    const reviewerPreview = buildCodexProviderExecutionPreviewFromChildDispatch({
      childDispatchPreview: contractFixture('child-dispatch-preview.claude-reviewer.v1.json'),
      generatedAt: GENERATED_AT
    });
    const missingGoalPreview = buildCodexProviderExecutionPreviewFromChildDispatch({
      childDispatchPreview: contractFixture('child-dispatch-preview.blocked-missing-goal.v1.json'),
      generatedAt: GENERATED_AT
    });

    assert.equal(validateCodexProviderExecutionPreviewContract(reviewerPreview).ok, true);
    assert.ok(reviewerPreview.blockedReasons.includes('unsupported-provider'));
    assert.ok(reviewerPreview.blockedReasons.includes('unsupported-role'));
    assert.equal(reviewerPreview.taskPackRef, null);
    assert.equal(reviewerPreview.executionPolicy.startsOnPreview, false);

    assert.equal(validateCodexProviderExecutionPreviewContract(missingGoalPreview).ok, true);
    assert.equal(missingGoalPreview.goal.goalId, 'missing-goal');
    assert.ok(missingGoalPreview.blockedReasons.includes('active-goal-missing'));
    assert.ok(missingGoalPreview.blockedReasons.includes('child-dispatch-preview-blocked'));
    assert.ok(missingGoalPreview.blockedReasons.includes('task-pack-missing'));
  });

  it('rejects backend confirmation without the current preview hash and safe fields', () => {
    const preview = buildCodexProviderExecutionPreviewFromChildDispatch({
      childDispatchPreview: contractFixture('child-dispatch-preview.codex-worker.v1.json'),
      generatedAt: GENERATED_AT
    });
    const blockedPreview = buildCodexProviderExecutionPreviewFromChildDispatch({
      childDispatchPreview: contractFixture('child-dispatch-preview.claude-reviewer.v1.json'),
      generatedAt: GENERATED_AT
    });
    const stale = confirmInputFor(preview);
    const extra = confirmInputFor(preview);

    stale.previewHash = 'sha256:1111111111111111111111111111111111111111111111111111111111111111';
    extra.command = 'codex run';

    assertValidationIncludes(
      validateCodexProviderExecutionConfirmInput({ preview, input: stale }),
      'previewHash must match current codex provider execution preview'
    );
    assertValidationIncludes(
      validateCodexProviderExecutionConfirmInput({ preview, input: extra }),
      'command is not an allowed codex provider execution confirm field'
    );
    assertValidationIncludes(
      validateCodexProviderExecutionConfirmInput({ preview: blockedPreview, input: confirmInputFor(blockedPreview) }),
      'preview must be ready before confirmation'
    );
  });

  it('projects codexProviderExecutionPreview.v1 from the supervisor app read model', () => {
    const model = buildProjectionReadModel();
    const preview = model.codexProviderExecutionPreview;

    assert.equal(preview.contractName, CODEX_PROVIDER_EXECUTION_PREVIEW_CONTRACT_NAME);
    assert.equal(validateCodexProviderExecutionPreviewContract(preview).ok, true);
    assert.equal(preview.goal.goalId, 'v54-codex-provider-execution-pilot');
    assert.equal(preview.task.taskId, 'pr-2-backend-preview-confirmation');
    assert.equal(preview.providerId, CODEX_PROVIDER_ID);
    assert.equal(preview.role, CODEX_PROVIDER_ROLE);
    assert.deepEqual(preview.blockedReasons, []);
    assert.equal(preview.executionPolicy.startsOnPreview, false);
    assert.equal(preview.boundaries.providerExecutionStartsOnPreview, false);
    assert.equal(preview.resultReturn.returnPath, CODEX_PROVIDER_RESULT_RETURN_PATH);
    assert.equal(preview.resultReturn.directGoalEventAppendAvailable, false);
  });

  it('runs a confirmed Codex executor through a bounded request and sanitized result intake return', async () => {
    const { preview, confirmation } = readyBackendPreviewAndConfirmation();
    let capturedRequest = null;
    const result = await runConfirmedCodexProviderExecution({
      preview,
      confirmation,
      runId: 'codex-v54-pr3-completed',
      cwd: '.',
      timeoutMs: 120000,
      startedAt: '2026-06-12T15:00:00.000Z',
      finishedAt: '2026-06-12T15:03:00.000Z',
      executeCodex: async (request) => {
        capturedRequest = request;
        return {
          status: 'completed',
          summary: 'Codex worker completed the bounded task.',
          rawTranscript: 'raw transcript should not be projected',
          rawModelOutput: 'raw model output should not be projected',
          changedFiles: [
            'src/symphony/codex-provider-execution-runner.js',
            '.codex/sessions/raw.jsonl'
          ],
          validationCommands: [
            'node --test tests/v54-codex-provider-execution-pilot.test.js',
            'cat .codex/sessions/raw.jsonl'
          ],
          risks: [],
          blockers: []
        };
      }
    });

    assert.equal(capturedRequest.contractName, 'codexProviderExecutionRunnerRequest.v1');
    assert.equal(capturedRequest.providerId, CODEX_PROVIDER_ID);
    assert.equal(capturedRequest.role, CODEX_PROVIDER_ROLE);
    assert.equal(capturedRequest.previewHash, preview.previewHash);
    assert.equal(capturedRequest.taskPackHash, preview.taskPackHash);
    assert.equal(capturedRequest.timeoutMs, 120000);
    assert.equal(capturedRequest.cwd, '.');
    assert.equal(capturedRequest.boundaries.genericShellAvailable, false);
    assert.equal(capturedRequest.boundaries.arbitraryCommandAvailable, false);
    assert.equal(Object.hasOwn(capturedRequest, 'command'), false);
    assert.equal(Object.hasOwn(capturedRequest, 'env'), false);
    assert.equal(Object.hasOwn(capturedRequest, 'apiKey'), false);

    assert.equal(result.contractName, 'codexProviderExecutionRunnerResult.v1');
    assert.equal(result.status, 'completed');
    assert.equal(result.runRecord.contractName, CODEX_PROVIDER_RUN_RECORD_CONTRACT_NAME);
    assert.equal(result.runRecord.resultIntakeRequest.requestedEvent.eventType, 'worker.evidence-recorded');
    assert.deepEqual(result.runRecord.sanitizedResult.changedFiles, [
      'src/symphony/codex-provider-execution-runner.js'
    ]);
    assert.deepEqual(result.runRecord.sanitizedResult.validationCommands, [
      'node --test tests/v54-codex-provider-execution-pilot.test.js'
    ]);
    assert.deepEqual(validateResultIntakeRequestContract(result.resultIntakeRequest), {
      ok: true,
      errors: []
    });
    assert.equal(result.safety.writesGoalEventLog, false);
    assert.equal(result.safety.exposesRawTranscript, false);
    assert.doesNotMatch(JSON.stringify(result.runRecord.sanitizedResult), /raw transcript|raw model output|\.jsonl/iu);
    assert.doesNotMatch(JSON.stringify(result.resultIntakeRequest.resultBlock), /raw transcript|raw model output|\.jsonl/iu);
  });

  it('records a blocked Codex executor result as a sanitized blocker intake request', async () => {
    const { preview, confirmation } = readyBackendPreviewAndConfirmation();
    const result = await runConfirmedCodexProviderExecution({
      preview,
      confirmation,
      runId: 'codex-v54-pr3-blocked',
      startedAt: '2026-06-12T15:00:00.000Z',
      finishedAt: '2026-06-12T15:02:00.000Z',
      executeCodex: async () => ({
        status: 'blocked',
        summary: 'Codex worker could not complete the bounded task.',
        blockerReason: 'dependency install failed',
        blockers: ['dependency install failed']
      })
    });

    assert.equal(result.status, 'blocked');
    assert.equal(result.runRecord.status, 'blocked');
    assert.equal(result.runRecord.resultIntakeRequest.requestedEvent.eventType, 'blocker.opened');
    assert.equal(result.runRecord.resultIntakeRequest.resultBlock.blockerReason, 'dependency install failed');
    assert.deepEqual(validateResultIntakeRequestContract(result.resultIntakeRequest), {
      ok: true,
      errors: []
    });
  });

  it('rejects runner execution before ready preview, matching confirmation, safe cwd, and explicit executor', async () => {
    const { preview, confirmation } = readyBackendPreviewAndConfirmation();
    const blockedPreview = buildCodexProviderExecutionPreviewFromChildDispatch({
      childDispatchPreview: contractFixture('child-dispatch-preview.claude-reviewer.v1.json'),
      generatedAt: GENERATED_AT
    });
    const mismatchedConfirmation = structuredClone(confirmation);

    mismatchedConfirmation.previewHash = 'sha256:2222222222222222222222222222222222222222222222222222222222222222';

    assert.throws(
      () => buildCodexProviderExecutionRunnerRequest({
        preview,
        confirmation,
        runId: 'codex-v54-pr3-unsafe-cwd',
        cwd: '.codex/sessions'
      }),
      (error) => error instanceof CodexProviderExecutionRunnerError && error.code === 'invalid-codex-provider-cwd'
    );
    await assert.rejects(
      () => runConfirmedCodexProviderExecution({
        preview,
        confirmation,
        runId: 'codex-v54-pr3-missing-executor'
      }),
      (error) => error instanceof CodexProviderExecutionRunnerError && error.code === 'missing-codex-executor'
    );
    await assert.rejects(
      () => runConfirmedCodexProviderExecution({
        preview: blockedPreview,
        confirmation: confirmInputFor(blockedPreview),
        runId: 'codex-v54-pr3-blocked-preview',
        executeCodex: async () => ({ status: 'completed' })
      }),
      (error) => error instanceof CodexProviderExecutionRunnerError && error.code === 'blocked-codex-provider-execution-preview'
    );
    await assert.rejects(
      () => runConfirmedCodexProviderExecution({
        preview,
        confirmation: mismatchedConfirmation,
        runId: 'codex-v54-pr3-mismatched-confirmation',
        executeCodex: async () => ({ status: 'completed' })
      }),
      (error) => error instanceof CodexProviderExecutionRunnerError &&
        error.code === 'invalid-codex-provider-execution-confirmation'
    );
  });
});

function fixture(name) {
  return JSON.parse(readFileSync(join(FIXTURE_DIR, name), 'utf8'));
}

function contractFixture(name) {
  return JSON.parse(readFileSync(join(CONTRACT_FIXTURE_DIR, name), 'utf8'));
}

function confirmInputFor(preview) {
  return {
    previewHash: preview.previewHash,
    providerId: CODEX_PROVIDER_ID,
    goalId: preview.goal.goalId,
    taskId: preview.task.taskId,
    role: CODEX_PROVIDER_ROLE,
    operatorId: 'operator-v54-pr2'
  };
}

function readyBackendPreviewAndConfirmation() {
  const preview = buildCodexProviderExecutionPreviewFromChildDispatch({
    childDispatchPreview: contractFixture('child-dispatch-preview.codex-worker.v1.json'),
    generatedAt: GENERATED_AT
  });
  const confirmation = confirmCodexProviderExecutionPreview({
    preview,
    input: confirmInputFor(preview),
    confirmedAt: '2026-06-12T14:02:00.000Z'
  });

  return { preview, confirmation };
}

function buildProjectionReadModel() {
  const goalId = 'v54-codex-provider-execution-pilot';
  const taskId = 'pr-2-backend-preview-confirmation';

  return buildGoalSupervisorAppReadModel({
    goalId,
    title: 'v54 Codex Provider Execution Pilot',
    tasks: [
      {
        taskId,
        title: 'Backend preview and confirmation',
        status: 'active'
      }
    ],
    sourceContracts: [
      'goal-next-action.v1',
      'goal-supervisor-core-projection.v1'
    ],
    goalNext: {
      contractName: 'goal-next-action.v1',
      contractVersion: 1,
      goalId,
      status: 'action-required',
      next: {
        taskId,
        role: 'worker',
        phase: 'implement'
      },
      reason: `${taskId} worker is next`
    },
    coreProjection: {
      contractName: 'goal-supervisor-core-projection.v1',
      contractVersion: 1,
      goalId,
      current: {
        taskId,
        role: 'worker',
        threadId: 'thread-v54-pr2-worker'
      },
      route: {
        state: 'dispatchable',
        reason: 'next-action-ready',
        current: {
          taskId,
          role: 'worker',
          threadId: 'thread-v54-pr2-worker'
        },
        pendingResult: {
          source: 'recorded-result-state',
          result: workerResult({ goalId, taskId })
        }
      },
      progress: {},
      routeInput: {
        resultIntake: {
          source: 'thread-result',
          status: 'pending',
          record: workerResult({ goalId, taskId }),
          reason: 'valid-result-awaits-registration'
        }
      }
    },
    currentProjectBinding: {
      contractName: 'current-project-binding.v1',
      contractVersion: 1,
      generatedAt: GENERATED_AT,
      state: 'bound',
      selectedProjectId: 'multi-coding-agent-symphony',
      selectedProjectName: 'Multi Coding Agent Symphony',
      readOnly: true
    },
    appStateSnapshot: {
      contractName: 'app-state-snapshot.v1',
      contractVersion: 1,
      generatedAt: GENERATED_AT,
      readOnly: true,
      freshness: {
        status: 'current'
      },
      active_goal: {
        goal_id: goalId,
        goal_title: 'v54 Codex Provider Execution Pilot'
      },
      current_task: {
        task_id: taskId,
        title: 'Backend preview and confirmation',
        blocked: false
      },
      next_action: {
        status: 'action-required',
        next: {
          taskId,
          blocked: false
        }
      },
      known_blockers: []
    },
    contextAdvisory: {
      contractName: 'contextAdvisory.v1',
      contractVersion: 1,
      generatedAt: GENERATED_AT,
      readOnly: true,
      willMutate: false,
      transcriptAvailability: 'readable',
      staleTranscriptState: {
        stale: false,
        reason: null
      },
      missingTranscriptState: {
        missing: false,
        reason: null
      },
      resultBlockEvidence: {
        status: 'present',
        present: true,
        evidenceRef: 'docs/plans/v54-pr-2-backend-preview-confirmation-evidence-2026-06-12.md'
      },
      contextUtilization: {
        status: 'available',
        ratio: 0.2
      },
      degradedReasons: [],
      blockedFields: []
    },
    threadContinuationDecision: {
      contractName: 'threadContinuationDecision.v1',
      contractVersion: 1,
      generatedAt: GENERATED_AT,
      readOnly: true,
      willMutate: false,
      decision: 'checkpoint',
      reason: 'backend-preview-ready',
      taskId,
      threadId: 'thread-v54-pr2-worker',
      checkpointRef: 'docs/plans/v54-pr-2-backend-preview-confirmation-evidence-2026-06-12.md',
      blockedFields: [],
      requiredEvidence: ['codex-provider-execution-preview'],
      sourceContracts: [
        {
          contractName: 'contextAdvisory.v1',
          contractVersion: 1,
          generatedAt: GENERATED_AT,
          readOnly: true
        }
      ]
    },
    nowMs: Date.parse(GENERATED_AT)
  });
}

function workerResult({ goalId, taskId }) {
  return {
    goalId,
    taskId,
    role: 'worker',
    threadId: 'thread-v54-pr2-worker',
    eventToRegister: 'worker.evidence-recorded',
    evidenceRef: 'docs/plans/v54-pr-2-backend-preview-confirmation-evidence-2026-06-12.md',
    branch: 'codex/v54-codex-provider-execution-backend-preview',
    headCommit: 'abcdef1234567890'
  };
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
