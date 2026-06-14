import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  WORKER_RUN_BOUNDARIES,
  WORKER_RUN_COMMAND_TEMPLATE_ID,
  WORKER_RUN_PREVIEW_CONTRACT_NAME,
  WORKER_RUN_PROVIDER_ID,
  WORKER_RUN_RESULT_CONTRACT_NAME,
  WorkerRunContractError,
  assertWorkerRunPreviewContract,
  buildWorkerRunPreview,
  buildWorkerRunResult,
  computeWorkerRunPlanHash,
  validateWorkerRunPreviewContract,
  validateWorkerRunResultContract
} from '../src/symphony/worker-run-contracts.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, '..');
const FIXTURE_DIR = join(REPO_ROOT, 'fixtures/contracts/worker-run');
const PROVIDER_READINESS_DIR = join(REPO_ROOT, 'fixtures/contracts/provider-readiness');
const GENERATED_AT = '2026-06-15T04:10:00.000Z';

const VALID_PREVIEW_FIXTURES = Object.freeze([
  'preview.ready.v1.json',
  'preview.missing-provider.v1.json',
  'preview.provider-blocked.v1.json'
]);
const VALID_RESULT_FIXTURES = Object.freeze([
  'result.sanitized-success.v1.json',
  'result.timeout.v1.json',
  'result.failed-verifier.v1.json'
]);
const INVALID_RESULT_FIXTURES = Object.freeze([
  [
    'result.stale-plan-hash.invalid.v1.json',
    'previewPlanHash must match worker run preview'
  ],
  [
    'result.unsafe-raw-output.invalid.v1.json',
    'sanitizedResult.rawModelOutput is not allowed'
  ],
  [
    'result.direct-main-write.invalid.v1.json',
    'sanitizedResult.changedFiles[0] must be a safe repository-relative path'
  ]
]);

describe('v66 Controlled Codex Worker Execution contracts', () => {
  it('validates worker run preview fixtures with backend-owned confirmation boundaries', () => {
    for (const name of VALID_PREVIEW_FIXTURES) {
      const preview = fixture(name);
      const validation = validateWorkerRunPreviewContract(preview);

      assert.equal(validation.ok, true, `${name}: ${validation.errors.join('; ')}`);
      assert.equal(preview.contractName, WORKER_RUN_PREVIEW_CONTRACT_NAME);
      assert.equal(preview.provider.providerId, WORKER_RUN_PROVIDER_ID);
      assert.equal(preview.commandTemplate.templateId, WORKER_RUN_COMMAND_TEMPLATE_ID);
      assert.equal(preview.confirmation.requiresPlanHash, true);
      assert.equal(preview.confirmation.providerId, WORKER_RUN_PROVIDER_ID);
      assert.equal(preview.confirmation.commandTemplateId, WORKER_RUN_COMMAND_TEMPLATE_ID);
      assert.equal(preview.timeoutMs, 900000);
      assert.equal(preview.workspacePolicy.backendOwned, true);
      assert.equal(preview.workspacePolicy.mainWorktreeWrite, false);
      assert.deepEqual(preview.boundaries, WORKER_RUN_BOUNDARIES);
      assert.equal(preview.planHash, computeWorkerRunPlanHash(preview));
      assertNoUnsafeStrings(preview, name);
    }
  });

  it('derives missing and blocked provider state from explicit readiness inputs', () => {
    const readyReadiness = providerReadiness('provider-readiness.both-ready.v1.json');
    const ready = buildWorkerRunPreview({
      generatedAt: GENERATED_AT,
      goal: activeGoal(),
      task: activeTask(),
      providerReadiness: readyReadiness
    });
    const missing = buildWorkerRunPreview({
      generatedAt: GENERATED_AT,
      goal: activeGoal(),
      task: activeTask(),
      providerReadiness: {
        activeProviders: readyReadiness.activeProviders.filter((provider) => provider.providerId !== WORKER_RUN_PROVIDER_ID)
      }
    });
    const blockedReadiness = structuredClone(readyReadiness);

    blockedReadiness.activeProviders = blockedReadiness.activeProviders.map((provider) => provider.providerId === WORKER_RUN_PROVIDER_ID
      ? { ...provider, status: 'blocked', blockedReasons: ['codex-cli-help-smoke-failed'] }
      : provider);

    const blocked = buildWorkerRunPreview({
      generatedAt: GENERATED_AT,
      goal: activeGoal(),
      task: activeTask(),
      providerReadiness: blockedReadiness
    });

    assert.equal(ready.state, 'ready');
    assert.deepEqual(ready.blockedReasons, []);
    assert.equal(missing.state, 'blocked');
    assert.deepEqual(missing.blockedReasons, ['codex-cli-provider-missing']);
    assert.equal(blocked.state, 'blocked');
    assert.deepEqual(blocked.blockedReasons, ['codex-cli-provider-blocked']);
  });

  it('validates worker result fixtures and keeps successful worker output at needs-review', () => {
    const preview = fixture('preview.ready.v1.json');

    for (const name of VALID_RESULT_FIXTURES) {
      const result = fixture(name);
      const validation = validateWorkerRunResultContract(result, { preview });

      assert.equal(validation.ok, true, `${name}: ${validation.errors.join('; ')}`);
      assert.equal(result.contractName, WORKER_RUN_RESULT_CONTRACT_NAME);
      assert.equal(result.providerId, WORKER_RUN_PROVIDER_ID);
      assert.equal(result.commandTemplateId, WORKER_RUN_COMMAND_TEMPLATE_ID);
      assert.equal(result.previewPlanHash, preview.planHash);
      assert.equal(result.realCodexOptIn, false);
      assert.equal(result.boundaries.freeformProviderCommandAvailable, false);
      assert.equal(result.boundaries.directGoalEventAppendAvailable, false);
      assert.equal(result.boundaries.directTaskCompletionAvailable, false);
      assert.equal(result.boundaries.providerOutputApprovesReview, false);
      assert.equal(result.boundaries.writesMainWorktree, false);
      assertNoUnsafeStrings(result, name);
    }

    const success = fixture('result.sanitized-success.v1.json');

    assert.equal(success.status, 'needs-review');
    assert.deepEqual(success.nextState, {
      taskState: 'needs-review',
      reviewRequired: true,
      taskCompleted: false,
      reviewApproved: false,
      mainVerified: false,
      releaseReady: false
    });
    assert.equal(success.failureLayer.kind, 'none');
  });

  it('records timeout and failed verifier as bounded failure layers', () => {
    const preview = fixture('preview.ready.v1.json');
    const timeout = fixture('result.timeout.v1.json');
    const failedVerifier = fixture('result.failed-verifier.v1.json');

    assert.equal(validateWorkerRunResultContract(timeout, { preview }).ok, true);
    assert.equal(timeout.status, 'blocked');
    assert.equal(timeout.failureLayer.kind, 'provider-timeout');
    assert.equal(timeout.failureLayer.retryable, true);
    assert.equal(timeout.nextState.taskCompleted, false);

    assert.equal(validateWorkerRunResultContract(failedVerifier, { preview }).ok, true);
    assert.equal(failedVerifier.status, 'failed');
    assert.equal(failedVerifier.verifier.state, 'failed');
    assert.equal(failedVerifier.failureLayer.kind, 'verifier-failed');
    assert.equal(failedVerifier.nextState.reviewApproved, false);
  });

  it('rejects stale plan hashes, raw output projection, and direct main-write evidence', () => {
    const preview = fixture('preview.ready.v1.json');

    for (const [name, expectedError] of INVALID_RESULT_FIXTURES) {
      const validation = validateWorkerRunResultContract(fixture(name), { preview });

      assert.equal(validation.ok, false, name);
      assert.ok(
        validation.errors.some((error) => error.includes(expectedError)),
        `${name}: expected ${expectedError}; got ${validation.errors.join('; ')}`
      );
    }
  });

  it('sanitizes provider result material before exposing changed files and verifier commands', () => {
    const preview = fixture('preview.ready.v1.json');
    const result = buildWorkerRunResult({
      preview,
      runId: 'worker-run-v66-pr1-sanitized-build',
      startedAt: '2026-06-15T04:11:00.000Z',
      finishedAt: '2026-06-15T04:12:00.000Z',
      providerResult: {
        summary: 'Fake worker produced mixed material.',
        rawTranscript: 'raw transcript is ignored',
        rawModelOutput: 'raw model output is ignored',
        changedFiles: [
          'src/symphony/worker-run-contracts.js',
          '.codex/sessions/raw.jsonl',
          '../main-worktree/src/symphony/worker-run-contracts.js'
        ],
        validationCommands: [
          'node --test tests/v66-controlled-codex-worker-execution.test.js',
          'cat .codex/sessions/raw.jsonl'
        ],
        evidenceRefs: [{
          kind: 'repo-doc',
          ref: 'docs/qa/v66-controlled-codex-worker-execution-acceptance.md',
          label: 'v66 acceptance evidence'
        }]
      }
    });

    assert.equal(validateWorkerRunResultContract(result, { preview }).ok, true);
    assert.deepEqual(result.sanitizedResult.changedFiles, ['src/symphony/worker-run-contracts.js']);
    assert.deepEqual(result.sanitizedResult.validationCommands, [
      'node --test tests/v66-controlled-codex-worker-execution.test.js'
    ]);
    assert.doesNotMatch(JSON.stringify(result), /raw transcript|raw model output|\.jsonl/iu);
  });

  it('rejects freeform command and main worktree preview drift before confirmation', () => {
    const preview = fixture('preview.ready.v1.json');
    const freeformCommand = structuredClone(preview);
    const mainWorktreeWrite = structuredClone(preview);

    freeformCommand.commandTemplate.acceptsFreeformCommand = true;
    freeformCommand.planHash = computeWorkerRunPlanHash(freeformCommand);
    mainWorktreeWrite.workspacePolicy.mainWorktreeWrite = true;
    mainWorktreeWrite.planHash = computeWorkerRunPlanHash(mainWorktreeWrite);

    assertValidationIncludes(
      validateWorkerRunPreviewContract(freeformCommand),
      'commandTemplate.acceptsFreeformCommand must be false'
    );
    assertValidationIncludes(
      validateWorkerRunPreviewContract(mainWorktreeWrite),
      'workspacePolicy.mainWorktreeWrite must be false'
    );
    assert.throws(
      () => assertWorkerRunPreviewContract(freeformCommand),
      (error) => (
        error instanceof WorkerRunContractError &&
        error.code === 'invalid-worker-run-preview' &&
        error.details.reason === 'commandTemplate.acceptsFreeformCommand must be false'
      )
    );
  });
});

function fixture(name) {
  return JSON.parse(readFileSync(join(FIXTURE_DIR, name), 'utf8'));
}

function providerReadiness(name) {
  return JSON.parse(readFileSync(join(PROVIDER_READINESS_DIR, name), 'utf8'));
}

function activeGoal() {
  return {
    goalId: 'v66-controlled-codex-worker-execution',
    title: 'v66 Controlled Codex Worker Execution',
    state: 'active',
    sourceContract: 'goal-next-action.v1',
    sourceRef: 'goal-next-action:v66'
  };
}

function activeTask() {
  return {
    taskId: 'pr-1-worker-run-contracts',
    title: 'Worker run preview and result contracts',
    state: 'active',
    sourceContract: 'goal-next-action.v1',
    sourceRef: 'goal-next-action:v66:pr-1'
  };
}

function assertValidationIncludes(validation, expectedError) {
  assert.equal(validation.ok, false);
  assert.ok(
    validation.errors.some((error) => error.includes(expectedError)),
    `expected ${expectedError}; got ${validation.errors.join('; ')}`
  );
}

function assertNoUnsafeStrings(value, label) {
  assert.doesNotMatch(
    JSON.stringify(value),
    /\/Users\/|\.jsonl|raw transcript|raw model output|provider session|freeform command|generic terminal|arbitrary command|task complete|review approval|github release/iu,
    label
  );
}
