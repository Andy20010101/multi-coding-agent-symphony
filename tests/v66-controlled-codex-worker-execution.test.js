import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { createSymphonyConsoleServer } from '../src/symphony/console.js';
import { readGoalOperationRuns } from '../src/symphony/goal-operation-run-registry.js';
import {
  V66_WORKER_RUN_GOAL_ID,
  WORKER_RUN_CONFIRMATION_CONTRACT_NAME,
  WorkerRunBackendError,
  buildWorkerRunPreviewFromBackend,
  confirmWorkerRunPreview,
  validateWorkerRunConfirmInput
} from '../src/symphony/worker-run-backend.js';
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

  it('confirms a backend-owned worker run preview through the fake adapter', async () => {
    const preview = buildWorkerRunPreviewFromBackend({
      goalId: V66_WORKER_RUN_GOAL_ID,
      taskId: 'pr-2-backend-preview-confirm',
      generatedAt: GENERATED_AT,
      providerReadiness: providerReadiness('provider-readiness.both-ready.v1.json')
    });
    const input = workerRunConfirmInput(preview);
    let capturedRequest = null;
    const confirmation = await confirmWorkerRunPreview({
      preview,
      input,
      startedAt: '2026-06-15T04:20:00.000Z',
      finishedAt: '2026-06-15T04:21:00.000Z',
      executeWorker: async (request) => {
        capturedRequest = request;
        return fakeWorkerAdapterResult();
      }
    });

    assert.equal(validateWorkerRunConfirmInput({ preview, input }).ok, true);
    assert.equal(confirmation.contractName, WORKER_RUN_CONFIRMATION_CONTRACT_NAME);
    assert.equal(confirmation.status, 'needs-review');
    assert.equal(confirmation.providerId, WORKER_RUN_PROVIDER_ID);
    assert.equal(confirmation.commandTemplateId, WORKER_RUN_COMMAND_TEMPLATE_ID);
    assert.equal(confirmation.realCodexOptIn, false);
    assert.equal(confirmation.result.nextState.taskState, 'needs-review');
    assert.equal(confirmation.result.nextState.taskCompleted, false);
    assert.equal(confirmation.result.nextState.reviewApproved, false);
    assert.equal(confirmation.safety.directGoalEventAppendAvailable, false);
    assert.equal(confirmation.safety.mainWorktreeWriteAvailable, false);
    assert.equal(capturedRequest.contractName, 'workerRunAdapterRequest.v1');
    assert.equal(capturedRequest.providerId, WORKER_RUN_PROVIDER_ID);
    assert.equal(capturedRequest.commandTemplateId, WORKER_RUN_COMMAND_TEMPLATE_ID);
    assert.equal(capturedRequest.workspacePolicy.mainWorktreeWrite, false);
    assert.equal(Object.hasOwn(capturedRequest, 'command'), false);
    assert.equal(Object.hasOwn(capturedRequest, 'cwd'), false);
    assert.equal(Object.hasOwn(capturedRequest, 'env'), false);
    assertNoUnsafeStrings(confirmation, 'backend confirmation');
  });

  it('rejects stale plan hashes and command material before running the fake adapter', async () => {
    const preview = buildWorkerRunPreviewFromBackend({
      goalId: V66_WORKER_RUN_GOAL_ID,
      taskId: 'pr-2-backend-preview-confirm',
      generatedAt: GENERATED_AT,
      providerReadiness: providerReadiness('provider-readiness.both-ready.v1.json')
    });
    const stale = {
      ...workerRunConfirmInput(preview),
      planHash: 'sha256:2222222222222222222222222222222222222222222222222222222222222222'
    };
    const command = {
      ...workerRunConfirmInput(preview),
      command: 'codex exec --dangerous'
    };
    let calls = 0;
    const executeWorker = async () => {
      calls += 1;
      return fakeWorkerAdapterResult();
    };

    await assert.rejects(
      () => confirmWorkerRunPreview({ preview, input: stale, executeWorker }),
      (error) => (
        error instanceof WorkerRunBackendError &&
        error.safeDetails.errors.includes('planHash must match worker run preview')
      )
    );
    await assert.rejects(
      () => confirmWorkerRunPreview({ preview, input: command, executeWorker }),
      (error) => (
        error instanceof WorkerRunBackendError &&
        error.safeDetails.errors.includes('command is not an allowed worker run confirm field')
      )
    );
    assert.equal(calls, 0);
  });

  it('serves worker run preview and confirm through constrained backend routes', async () => {
    const root = await mkdtemp(join(tmpdir(), 'v66-worker-run-route-'));
    const stateDir = join(root, '.symphony');
    const invocations = [];
    const server = createSymphonyConsoleServer({
      cwd: root,
      stateDir,
      env: {},
      workerRunProviderReadiness: providerReadiness('provider-readiness.both-ready.v1.json'),
      workerRunExecutor: async (request) => {
        invocations.push(request);
        return fakeWorkerAdapterResult();
      }
    });
    const baseUrl = await listenOnRandomPort(server);

    try {
      const params = new URLSearchParams({
        task: 'pr-2-backend-preview-confirm'
      });
      const previewResponse = await fetch(`${baseUrl}/api/goals/${V66_WORKER_RUN_GOAL_ID}/worker-run-preview?${params}`);
      const preview = await previewResponse.json();

      assert.equal(previewResponse.status, 200);
      assert.equal(preview.contractName, WORKER_RUN_PREVIEW_CONTRACT_NAME);
      assert.equal(preview.state, 'ready');
      assert.equal(preview.provider.providerId, WORKER_RUN_PROVIDER_ID);
      assert.equal(preview.commandTemplate.templateId, WORKER_RUN_COMMAND_TEMPLATE_ID);

      const invalidPreviewResponse = await fetch(`${baseUrl}/api/goals/${V66_WORKER_RUN_GOAL_ID}/worker-run-preview?${new URLSearchParams({
        task: 'pr-2-backend-preview-confirm',
        command: 'codex exec --dangerous'
      })}`);
      const invalidPreview = await invalidPreviewResponse.json();

      assert.equal(invalidPreviewResponse.status, 400);
      assert.equal(invalidPreview.error.code, 'invalid-worker-run-preview-request');
      assert.equal(invocations.length, 0);

      const confirmResponse = await fetch(`${baseUrl}/api/goals/${V66_WORKER_RUN_GOAL_ID}/worker-run-confirm`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(workerRunConfirmInput(preview))
      });
      const confirmation = await confirmResponse.json();
      const registry = await readGoalOperationRuns({
        stateDir,
        goalId: V66_WORKER_RUN_GOAL_ID
      });

      assert.equal(confirmResponse.status, 200, JSON.stringify(confirmation));
      assert.equal(confirmation.contractName, WORKER_RUN_CONFIRMATION_CONTRACT_NAME);
      assert.equal(confirmation.result.status, 'needs-review');
      assert.equal(confirmation.operationRun.commandKind, 'provider-runner');
      assert.equal(confirmation.operationRun.commandName, 'worker run preview/confirm');
      assert.equal(confirmation.operationRun.verifierSummary.taskCompleted, false);
      assert.equal(confirmation.operationRun.verifierSummary.reviewerApproved, false);
      assert.equal(confirmation.refreshed.operations.operationCount, 1);
      assert.equal(registry.operationCount, 1);
      assert.equal(invocations.length, 1);
      assert.equal(Object.hasOwn(invocations[0], 'command'), false);
      assert.equal(Object.hasOwn(invocations[0], 'env'), false);

      const invalidConfirmResponse = await fetch(`${baseUrl}/api/goals/${V66_WORKER_RUN_GOAL_ID}/worker-run-confirm`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...workerRunConfirmInput(preview),
          command: 'codex exec --dangerous'
        })
      });
      const invalidConfirm = await invalidConfirmResponse.json();

      assert.equal(invalidConfirmResponse.status, 400);
      assert.equal(invalidConfirm.error.code, 'invalid-worker-run-confirm-request');
      assert.equal(invocations.length, 1);
    } finally {
      await closeServer(server);
      await rm(root, { recursive: true, force: true });
    }
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

function workerRunConfirmInput(preview) {
  return {
    planHash: preview.planHash,
    goalId: preview.goal.goalId,
    taskId: preview.task.taskId,
    providerId: WORKER_RUN_PROVIDER_ID,
    commandTemplateId: WORKER_RUN_COMMAND_TEMPLATE_ID,
    timeoutMs: preview.timeoutMs,
    workspacePolicyId: preview.workspacePolicy.policyId
  };
}

function fakeWorkerAdapterResult() {
  return {
    status: 'needs-review',
    summary: 'Fake Codex worker completed the backend route task.',
    changedFiles: [
      'src/symphony/worker-run-backend.js',
      'src/symphony/console.js'
    ],
    validationCommands: [
      'node --test tests/v66-controlled-codex-worker-execution.test.js'
    ],
    artifactRefs: ['artifact-ref:v66:backend-fake-worker-run'],
    verifierState: 'passed',
    verifierSummary: 'Backend fake worker route checks passed.',
    evidenceRefs: [{
      kind: 'repo-doc',
      ref: 'docs/qa/v66-controlled-codex-worker-execution-acceptance.md',
      label: 'v66 acceptance evidence'
    }],
    rawTranscript: 'raw transcript must not be projected',
    rawModelOutput: 'raw model output must not be projected'
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

async function listenOnRandomPort(server) {
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      server.off('error', reject);
      resolve();
    });
  });

  const address = server.address();

  return `http://127.0.0.1:${address.port}`;
}

async function closeServer(server) {
  await new Promise((resolve, reject) => {
    server.close((error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });
}
