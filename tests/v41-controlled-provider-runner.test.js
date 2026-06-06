import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { createSymphonyConsoleServer } from '../src/symphony/console.js';
import {
  buildControlledProviderRunnerPreview,
  buildControlledProviderRunnerPlanPreview,
  buildControlledProviderRunnerOperationRecord,
  commandTemplateFor,
  confirmControlledProviderRunnerPlan,
  ControlledProviderRunnerError,
  CONTROLLED_PROVIDER_RUNNER_PLAN_PREVIEW_CONTRACT_NAME,
  CONTROLLED_PROVIDER_RUNNER_CONFIRMATION_CONTRACT_NAME,
  CONTROLLED_PROVIDER_RUNNER_OPERATION_CONTRACT_NAME,
  recordControlledProviderRunnerOperation,
  runControlledProvider,
  runControlledProviderWithOperationRegistry,
  validateControlledProviderRunnerOperationRecord,
  validateControlledProviderRunRequest,
  V41_ACTIVE_CONTROLLED_PROVIDER_IDS,
  V41_CONTROLLED_PROVIDER_RUNNER_GOAL_ID
} from '../src/symphony/controlled-provider-runner.js';
import { readGoalOperationRuns } from '../src/symphony/goal-operation-run-registry.js';

const BASE_REQUEST = Object.freeze({
  providerId: 'claude-code-cli',
  goalId: V41_CONTROLLED_PROVIDER_RUNNER_GOAL_ID,
  taskId: 'task-2',
  role: 'worker',
  mode: 'reviewed-prompt',
  promptRef: 'docs/plans/v41-task-2-worker-prompt.md',
  evidenceRef: 'docs/plans/v41-task-2-worker-evidence-2026-06-06.md'
});
const TASK3_REQUEST = Object.freeze({
  ...BASE_REQUEST,
  taskId: 'task-3',
  promptRef: 'docs/plans/v41-task-3-worker-prompt.md',
  evidenceRef: 'docs/plans/v41-task-3-worker-evidence-2026-06-06.md'
});

describe('v41 controlled provider runner backend adapter', () => {
  it('keeps the active provider allowlist to claude-code-cli and codex-cli only', () => {
    assert.deepEqual([...V41_ACTIVE_CONTROLLED_PROVIDER_IDS].sort(), [
      'claude-code-cli',
      'codex-cli'
    ]);
    assert.equal(commandTemplateFor('claude-code-cli').executable, 'claude');
    assert.equal(commandTemplateFor('codex-cli').executable, 'codex');

    assert.throws(
      () => commandTemplateFor('gemini-cli'),
      /Unsupported provider id/u
    );
  });

  it('builds a sanitized preview without exposing executable args, cwd, env values, or shell controls', async () => {
    const workspaceRoot = await mkdtemp(join(tmpdir(), 'v41-controlled-runner-preview-'));

    try {
      const preview = buildControlledProviderRunnerPreview(BASE_REQUEST, {
        workspaceRoot,
        allowedWorkspaceRoots: [workspaceRoot],
        timeoutMs: 1000
      });

      assert.equal(preview.contractName, 'controlled-provider-runner.v1');
      assert.equal(preview.providerId, 'claude-code-cli');
      assert.equal(preview.commandTemplateId, 'v41.claude-code-cli.reviewed-prompt.v1');
      assert.equal(preview.execution.backendOwnedCommandTemplate, true);
      assert.equal(preview.execution.shellExpansionAvailable, false);
      assert.equal(preview.execution.genericShellRunnerAvailable, false);
      assert.equal(preview.execution.rendererProviderInvocationAvailable, false);
      assert.equal(preview.execution.arbitraryCommandInputAvailable, false);
      assert.equal(preview.execution.arbitraryCwdInputAvailable, false);
      assert.equal(preview.execution.envValueExposureAvailable, false);
      assert.equal(preview.execution.envPolicy, 'inherit-process-env-without-previewing-values');
      assert.equal(JSON.stringify(preview).includes(workspaceRoot), false);
      assert.equal(JSON.stringify(preview).includes('"args"'), false);
      assert.equal(JSON.stringify(preview).includes('"env"'), false);
    } finally {
      await rm(workspaceRoot, { recursive: true, force: true });
    }
  });

  it('binds provider runner preview and confirm to reviewed context plus plan hash', async () => {
    const root = await mkdtemp(join(tmpdir(), 'v41-controlled-runner-plan-confirm-'));
    const workspaceRoot = join(root, 'workspace');
    const stateDir = join(root, '.symphony');
    const request = {
      ...TASK3_REQUEST,
      providerId: 'codex-cli',
      handoffRef: 'goal-prompt/v41-controlled-cli-provider-runner-backend-completion/task-3/worker'
    };
    const fakeRunner = createFakeRunner({
      exitCode: 0,
      stdout: 'provider completed with sk-test-secret-value',
      stderr: '',
      durationMs: 21
    });

    try {
      const preview = buildControlledProviderRunnerPlanPreview(request, {
        workspaceRoot,
        allowedWorkspaceRoots: [root],
        timeoutMs: 2000
      });

      assert.equal(preview.contractName, CONTROLLED_PROVIDER_RUNNER_PLAN_PREVIEW_CONTRACT_NAME);
      assert.match(preview.planHash, /^sha256:[a-f0-9]{64}$/u);
      assert.equal(preview.providerId, 'codex-cli');
      assert.equal(preview.commandTemplateId, 'v41.codex-cli.reviewed-prompt.v1');
      assert.equal(preview.expectedArtifacts[0].kind, 'sanitized-provider-run-summary');
      assert.equal(preview.confirm.endpoint.confirmUsesPlanHash, true);
      assert.deepEqual(preview.confirm.endpoint.allowedBodyFields, [
        'goalId',
        'taskId',
        'role',
        'providerId',
        'mode',
        'promptRef',
        'evidenceRef',
        'handoffRef',
        'planId',
        'planHash'
      ]);
      assert.equal(preview.previewEndpoint.rejectsArbitraryCommand, true);
      assert.equal(preview.previewEndpoint.rejectsProviderBinary, true);
      assert.equal(preview.previewEndpoint.rejectsCwdPath, true);
      assert.equal(preview.safety.reviewerApprovalInferenceAvailable, false);
      assert.equal(preview.safety.mainVerificationInferenceAvailable, false);
      assert.equal(preview.safety.releaseReadinessInferenceAvailable, false);

      const confirmation = await confirmControlledProviderRunnerPlan({
        goalId: preview.goalId,
        taskId: preview.taskId,
        role: preview.role,
        providerId: preview.providerId,
        mode: preview.mode,
        promptRef: request.promptRef,
        evidenceRef: request.evidenceRef,
        handoffRef: request.handoffRef,
        planId: preview.planId,
        planHash: preview.planHash
      }, {
        stateDir,
        workspaceRoot,
        allowedWorkspaceRoots: [root],
        processRunner: fakeRunner,
        timeoutMs: 2000
      });
      const registry = await readGoalOperationRuns({
        stateDir,
        goalId: V41_CONTROLLED_PROVIDER_RUNNER_GOAL_ID
      });

      assert.equal(confirmation.contractName, CONTROLLED_PROVIDER_RUNNER_CONFIRMATION_CONTRACT_NAME);
      assert.equal(confirmation.status, 'completed');
      assert.equal(confirmation.output.rawProviderOutputAvailable, false);
      assert.equal(confirmation.output.stdoutPreview.includes('sk-test-secret-value'), false);
      assert.equal(confirmation.operation.boundaries.reviewerApproved, false);
      assert.equal(confirmation.operation.boundaries.mainVerified, false);
      assert.equal(confirmation.operation.boundaries.releaseReady, false);
      assert.equal(registry.operationCount, 1);
      assert.equal(registry.runs[0].commandKind, 'provider-runner');
      assert.equal(registry.runs[0].verifierSummary.reviewerApproved, false);
      assert.equal(fakeRunner.invocations.length, 1);

      await assert.rejects(
        () => confirmControlledProviderRunnerPlan({
          goalId: preview.goalId,
          taskId: preview.taskId,
          role: preview.role,
          providerId: preview.providerId,
          mode: preview.mode,
          handoffRef: request.handoffRef,
          command: 'codex exec --dangerous',
          planId: preview.planId,
          planHash: preview.planHash
        }, {
          stateDir,
          workspaceRoot,
          allowedWorkspaceRoots: [root],
          processRunner: fakeRunner
        }),
        /command is not accepted by controlled provider runner confirm/u
      );
      assert.equal(fakeRunner.invocations.length, 1);

      await assert.rejects(
        () => confirmControlledProviderRunnerPlan({
          goalId: preview.goalId,
          taskId: preview.taskId,
          role: preview.role,
          providerId: preview.providerId,
          mode: preview.mode,
          handoffRef: request.handoffRef,
          planId: preview.planId,
          planHash: 'sha256:0000000000000000000000000000000000000000000000000000000000000000'
        }, {
          stateDir,
          workspaceRoot,
          allowedWorkspaceRoots: [root],
          processRunner: fakeRunner
        }),
        /exact plan id and plan hash/u
      );
      assert.equal(fakeRunner.invocations.length, 1);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it('serves Workbench provider runner preview and confirm through constrained backend routes', async () => {
    const root = await mkdtemp(join(tmpdir(), 'v41-controlled-runner-console-route-'));
    const stateDir = join(root, '.symphony');
    const fakeRunner = createFakeRunner({
      exitCode: 0,
      stdout: 'route ok Bearer route-provider-token',
      stderr: '',
      durationMs: 8
    });
    const server = createSymphonyConsoleServer({
      cwd: root,
      stateDir,
      runner: fakeRunner,
      env: {}
    });
    const baseUrl = await listenOnRandomPort(server);

    try {
      const params = new URLSearchParams({
        task: 'task-4',
        role: 'worker',
        provider: 'codex-cli',
        mode: 'reviewed-prompt',
        handoffRef: 'goal-prompt/v41-controlled-cli-provider-runner-backend-completion/task-4/worker'
      });
      const previewResponse = await fetch(`${baseUrl}/api/goals/${V41_CONTROLLED_PROVIDER_RUNNER_GOAL_ID}/provider-runner-preview?${params}`);
      const preview = await previewResponse.json();

      assert.equal(previewResponse.status, 200);
      assert.equal(preview.contractName, CONTROLLED_PROVIDER_RUNNER_PLAN_PREVIEW_CONTRACT_NAME);
      assert.equal(preview.goalId, V41_CONTROLLED_PROVIDER_RUNNER_GOAL_ID);
      assert.equal(preview.taskId, 'task-4');
      assert.equal(preview.providerId, 'codex-cli');
      assert.equal(preview.previewEndpoint.rejectsArbitraryCommand, true);

      const invalidPreviewResponse = await fetch(`${baseUrl}/api/goals/${V41_CONTROLLED_PROVIDER_RUNNER_GOAL_ID}/provider-runner-preview?${new URLSearchParams({
        task: 'task-4',
        role: 'worker',
        provider: 'codex-cli',
        command: 'codex exec --dangerous'
      })}`);
      const invalidPreview = await invalidPreviewResponse.json();

      assert.equal(invalidPreviewResponse.status, 400);
      assert.equal(invalidPreview.contractName, 'error-envelope.v1');
      assert.equal(fakeRunner.invocations.length, 0);

      const confirmResponse = await fetch(`${baseUrl}${preview.confirm.endpoint.route}`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          goalId: preview.goalId,
          taskId: preview.taskId,
          role: preview.role,
          providerId: preview.providerId,
          mode: preview.mode,
          handoffRef: preview.reviewedContext.handoffRef,
          planId: preview.planId,
          planHash: preview.planHash
        })
      });
      const confirmation = await confirmResponse.json();

      assert.equal(confirmResponse.status, 200);
      assert.equal(confirmation.contractName, CONTROLLED_PROVIDER_RUNNER_CONFIRMATION_CONTRACT_NAME);
      assert.equal(confirmation.operation.commandTemplateId, 'v41.codex-cli.reviewed-prompt.v1');
      assert.equal(confirmation.refreshed.operations.operationCount, 1);
      assert.equal(confirmation.refreshed.operations.runs[0].commandKind, 'provider-runner');
      assert.equal(fakeRunner.invocations.length, 1);

      const invalidConfirmResponse = await fetch(`${baseUrl}${preview.confirm.endpoint.route}`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          goalId: preview.goalId,
          taskId: preview.taskId,
          role: preview.role,
          providerId: preview.providerId,
          mode: preview.mode,
          handoffRef: preview.reviewedContext.handoffRef,
          command: 'codex exec --dangerous',
          planId: preview.planId,
          planHash: preview.planHash
        })
      });
      const invalidConfirm = await invalidConfirmResponse.json();

      assert.equal(invalidConfirmResponse.status, 400);
      assert.equal(invalidConfirm.error.code, 'invalid-controlled-provider-runner-confirm-request');
      assert.equal(fakeRunner.invocations.length, 1);
    } finally {
      await closeServer(server);
      await rm(root, { recursive: true, force: true });
    }
  });

  it('rejects arbitrary command text, cwd/path/env, shell metacharacters, inactive providers, and secret-bearing input', () => {
    const drift = {
      ...BASE_REQUEST,
      providerId: 'deepseek',
      command: 'codex exec --dangerous',
      args: ['exec'],
      cwd: '/tmp',
      env: { OPENAI_API_KEY: 'sk-test-secret-value' },
      prompt: 'run this',
      promptRef: 'docs/plans/v41-task-2.md;rm-rf',
      apiKey: 'sk-test-secret-value'
    };
    const errors = validateControlledProviderRunRequest(drift);

    assert.equal(errors.includes('providerId must be one of claude-code-cli, codex-cli'), true);
    assert.equal(errors.includes('command is not accepted by the controlled provider runner'), true);
    assert.equal(errors.includes('args is not accepted by the controlled provider runner'), true);
    assert.equal(errors.includes('cwd is not accepted by the controlled provider runner'), true);
    assert.equal(errors.includes('env is not accepted by the controlled provider runner'), true);
    assert.equal(errors.includes('prompt is not accepted by the controlled provider runner'), true);
    assert.equal(errors.includes('promptRef must be a safe reviewed ref'), true);
    assert.equal(errors.includes('apiKey is not accepted by the controlled provider runner'), true);
  });

  it('rejects unknown UI/API-controlled execution fields instead of ignoring them', () => {
    const errors = validateControlledProviderRunRequest({
      ...BASE_REQUEST,
      rendererCommand: 'claude -p reviewed prompt',
      browserQuery: 'providerId=codex-cli&command=codex exec',
      planHash: 'sha256:abc123'
    });

    assert.equal(errors.includes('rendererCommand is not an allowed controlled provider runner field'), true);
    assert.equal(errors.includes('browserQuery is not an allowed controlled provider runner field'), true);
    assert.equal(errors.includes('planHash is not an allowed controlled provider runner field'), true);
  });

  it('rejects requests that are not anchored to the active v41 goal, role, controlled mode, and reviewed refs', () => {
    const errors = validateControlledProviderRunRequest({
      providerId: 'codex-cli',
      goalId: 'v40-personal-workflow-router-app-core-release',
      taskId: 'task-2',
      role: 'main-verifier',
      mode: 'raw-shell'
    });

    assert.equal(errors.includes(`goalId must be ${V41_CONTROLLED_PROVIDER_RUNNER_GOAL_ID}`), true);
    assert.equal(errors.includes('role must be one of worker, reviewer'), true);
    assert.equal(errors.includes('mode must be one of reviewed-prompt, controlled-smoke'), true);
    assert.equal(errors.includes('at least one of promptRef, evidenceRef, or handoffRef must be present'), true);
  });

  it('runs claude-code-cli only through the backend-owned claude template', async () => {
    const workspaceRoot = await mkdtemp(join(tmpdir(), 'v41-controlled-runner-claude-'));
    const fakeRunner = createFakeRunner({
      exitCode: 0,
      stdout: 'ok ANTHROPIC_API_KEY=sk-test-secret-value',
      stderr: ''
    });

    try {
      const result = await runControlledProvider(BASE_REQUEST, {
        workspaceRoot,
        allowedWorkspaceRoots: [workspaceRoot],
        processRunner: fakeRunner,
        timeoutMs: 1234
      });

      assert.equal(result.status, 'completed');
      assert.equal(result.failure, null);
      assert.equal(result.output.rawProviderOutputAvailable, false);
      assert.equal(result.output.stdoutPreview.includes('sk-test-secret-value'), false);
      assert.equal(result.output.stdoutPreview.includes('[REDACTED_TOKEN]'), true);
      assert.equal(fakeRunner.invocations.length, 1);
      assert.deepEqual(fakeRunner.invocations[0], {
        executable: 'claude',
        args: [
          '-p',
          '--output-format',
          'stream-json',
          '--verbose',
          '--permission-mode',
          'dontAsk'
        ],
        cwd: workspaceRoot,
        stdinIncludes: [
          `goalId: ${V41_CONTROLLED_PROVIDER_RUNNER_GOAL_ID}`,
          'taskId: task-2',
          'promptRef: docs/plans/v41-task-2-worker-prompt.md'
        ],
        env: {},
        timeoutMs: 1234,
        stallTimeoutMs: 0,
        outputFiles: {}
      });
    } finally {
      await rm(workspaceRoot, { recursive: true, force: true });
    }
  });

  it('runs codex-cli only through the backend-owned codex template and backend workspace policy', async () => {
    const workspaceRoot = await mkdtemp(join(tmpdir(), 'v41-controlled-runner-codex-'));
    const fakeRunner = createFakeRunner({
      exitCode: 1,
      stdout: '',
      stderr: 'provider failed'
    });

    try {
      const result = await runControlledProvider({
        ...BASE_REQUEST,
        providerId: 'codex-cli',
        role: 'reviewer',
        handoffRef: 'docs/plans/v41-task-2-review-handoff.md'
      }, {
        workspaceRoot,
        allowedWorkspaceRoots: [workspaceRoot],
        processRunner: fakeRunner
      });

      assert.equal(result.status, 'failed');
      assert.equal(result.failure.layer, 'command-execution');
      assert.equal(fakeRunner.invocations[0].executable, 'codex');
      assert.deepEqual(fakeRunner.invocations[0].args, [
        'exec',
        '--json',
        '--sandbox',
        'read-only',
        '--cd',
        workspaceRoot
      ]);
      assert.equal(fakeRunner.invocations[0].cwd, workspaceRoot);
      assert.equal(fakeRunner.invocations[0].stdinIncludes.includes('role: reviewer'), true);
    } finally {
      await rm(workspaceRoot, { recursive: true, force: true });
    }
  });

  it('reports timeout and provider availability as explicit failure layers', async () => {
    const workspaceRoot = await mkdtemp(join(tmpdir(), 'v41-controlled-runner-failure-'));

    try {
      const timeoutResult = await runControlledProvider(BASE_REQUEST, {
        workspaceRoot,
        allowedWorkspaceRoots: [workspaceRoot],
        processRunner: createFakeRunner({
          exitCode: null,
          stdout: '',
          stderr: '',
          timedOut: true
        })
      });

      assert.equal(timeoutResult.status, 'failed');
      assert.equal(timeoutResult.failure.layer, 'timeout');

      const unavailableResult = await runControlledProvider(BASE_REQUEST, {
        workspaceRoot,
        allowedWorkspaceRoots: [workspaceRoot],
        processRunner: {
          async run() {
            const error = new Error('spawn claude ENOENT');
            error.code = 'ENOENT';
            throw error;
          }
        }
      });

      assert.equal(unavailableResult.status, 'failed');
      assert.equal(unavailableResult.failure.layer, 'provider-availability');
      assert.equal(unavailableResult.operation.recoveryNotes[0].includes('unavailable to the backend runner'), true);
    } finally {
      await rm(workspaceRoot, { recursive: true, force: true });
    }
  });

  it('records sanitized provider runner operation evidence without implying approval or release readiness', async () => {
    const root = await mkdtemp(join(tmpdir(), 'v41-controlled-runner-operation-registry-'));
    const workspaceRoot = join(root, 'workspace');
    const stateDir = join(root, '.symphony');
    const fakeRunner = createFakeRunner({
      exitCode: 0,
      stdout: 'completed with Bearer provider-token-value',
      stderr: 'wrote /tmp/.env.local and ghp_providersecret',
      durationMs: 34
    });

    try {
      const result = await runControlledProviderWithOperationRegistry(TASK3_REQUEST, {
        stateDir,
        workspaceRoot,
        allowedWorkspaceRoots: [root],
        processRunner: fakeRunner,
        runId: 'provider-run-task-3-success'
      });
      const registry = await readGoalOperationRuns({
        stateDir,
        goalId: V41_CONTROLLED_PROVIDER_RUNNER_GOAL_ID
      });

      assert.equal(result.status, 'completed');
      assert.equal(result.operation.contractName, CONTROLLED_PROVIDER_RUNNER_OPERATION_CONTRACT_NAME);
      assert.equal(result.operation.runId, 'provider-run-task-3-success');
      assert.equal(result.operation.providerId, 'claude-code-cli');
      assert.equal(result.operation.goalId, V41_CONTROLLED_PROVIDER_RUNNER_GOAL_ID);
      assert.equal(result.operation.taskId, 'task-3');
      assert.equal(result.operation.role, 'worker');
      assert.equal(result.operation.commandTemplateId, 'v41.claude-code-cli.reviewed-prompt.v1');
      assert.equal(result.operation.status, 'completed');
      assert.equal(result.operation.exitCode, 0);
      assert.equal(result.operation.timing.durationMs, 34);
      assert.equal(result.operation.redaction.status, 'applied');
      assert.equal(result.operation.failureLayer, null);
      assert.equal(result.operation.recoveryNotes[0].includes('no recovery action is needed'), true);
      assert.equal(result.operation.artifactRefs[0].kind, 'sanitized-provider-run-summary');
      assert.equal(result.operation.boundaries.reviewerApproved, false);
      assert.equal(result.operation.boundaries.mainVerified, false);
      assert.equal(result.operation.boundaries.releaseReady, false);
      assert.equal(JSON.stringify(result.operation).includes('provider-token-value'), false);
      assert.equal(JSON.stringify(result.operation).includes('ghp_providersecret'), false);
      assert.equal(JSON.stringify(result.operation).includes('.env.local'), false);
      assert.equal(registry.operationCount, 1);
      assert.equal(registry.runs[0].commandKind, 'provider-runner');
      assert.equal(registry.runs[0].status, 'completed');
      assert.equal(registry.runs[0].runResult.runId, 'provider-run-task-3-success');
      assert.equal(registry.runs[0].runResult.boundaries.reviewerApproved, false);
      assert.equal(registry.runs[0].artifactRefs[0].kind, 'sanitized-provider-run-summary');
      assert.equal(registry.runs[0].verifierSummary.releaseReady, false);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it('records inactive provider schema failures without invoking the process runner', async () => {
    const root = await mkdtemp(join(tmpdir(), 'v41-controlled-runner-inactive-provider-'));
    const stateDir = join(root, '.symphony');
    const processRunner = {
      async run() {
        throw new Error('process runner must not be called for inactive provider');
      }
    };

    try {
      const result = await runControlledProviderWithOperationRegistry({
        ...TASK3_REQUEST,
        providerId: 'gemini-cli'
      }, {
        stateDir,
        workspaceRoot: root,
        allowedWorkspaceRoots: [root],
        processRunner,
        runId: 'provider-run-task-3-inactive'
      });
      const registry = await readGoalOperationRuns({
        stateDir,
        goalId: V41_CONTROLLED_PROVIDER_RUNNER_GOAL_ID
      });

      assert.equal(result.status, 'failed');
      assert.equal(result.failure.layer, 'schema');
      assert.equal(result.operation.providerId, 'gemini-cli');
      assert.equal(result.operation.commandTemplateId, null);
      assert.equal(registry.operationCount, 1);
      assert.equal(registry.runs[0].status, 'failed');
      assert.equal(registry.runs[0].runResult.failureLayer, 'schema');
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it('records redaction and expected-check failures as distinct sanitized operation layers', async () => {
    const workspaceRoot = await mkdtemp(join(tmpdir(), 'v41-controlled-runner-layered-failures-'));

    try {
      const redactionResult = await runControlledProvider(TASK3_REQUEST, {
        workspaceRoot,
        allowedWorkspaceRoots: [workspaceRoot],
        processRunner: createFakeRunner({
          exitCode: 0,
          stdout: 'raw provider output',
          stderr: ''
        }),
        redactor() {
          throw new Error('redactor failure with sk-provider-secret');
        },
        runId: 'provider-run-task-3-redaction'
      });

      assert.equal(redactionResult.status, 'failed');
      assert.equal(redactionResult.failure.layer, 'redaction');
      assert.equal(redactionResult.redaction.status, 'failed');
      assert.equal(redactionResult.operation.redaction.status, 'failed');
      assert.equal(redactionResult.operation.outputSummary.stdoutPreview, '');
      assert.equal(JSON.stringify(redactionResult.operation).includes('sk-provider-secret'), false);

      const expectedCheckResult = await runControlledProvider(TASK3_REQUEST, {
        workspaceRoot,
        allowedWorkspaceRoots: [workspaceRoot],
        processRunner: createFakeRunner({
          exitCode: 0,
          stdout: 'completed but missing expected marker',
          stderr: ''
        }),
        expectedCheck() {
          return {
            ok: false,
            message: 'expected marker missing sk-provider-secret'
          };
        },
        runId: 'provider-run-task-3-expected-check'
      });

      assert.equal(expectedCheckResult.status, 'failed');
      assert.equal(expectedCheckResult.failure.layer, 'expected-check');
      assert.equal(expectedCheckResult.failure.message.includes('sk-provider-secret'), false);
      assert.equal(expectedCheckResult.operation.failureLayer, 'expected-check');
      assert.equal(expectedCheckResult.operation.redaction.status, 'applied');
    } finally {
      await rm(workspaceRoot, { recursive: true, force: true });
    }
  });

  it('validates the controlled provider runner operation fixture and generic shell disabled evidence', async () => {
    const fixture = JSON.parse(await readFile(
      'fixtures/contracts/controlled-provider-runner-operation.v1.json',
      'utf8'
    ));
    const operation = validateControlledProviderRunnerOperationRecord(fixture);

    assert.equal(operation.contractName, CONTROLLED_PROVIDER_RUNNER_OPERATION_CONTRACT_NAME);
    assert.equal(operation.boundaries.genericShellRunnerAvailable, false);
    assert.equal(operation.boundaries.rendererProviderInvocationAvailable, false);
      assert.equal(operation.redaction.rawProviderOutputAvailable, false);
      assert.equal(operation.outputSummary.rawProviderOutputAvailable, false);
      assert.equal(operation.artifactRefs[0].kind, 'sanitized-provider-run-summary');
      assert.equal(operation.recoveryNotes[0].includes('backend-controlled provider runner'), true);
  });

  it('rejects operation records that expose raw provider output or secret-looking evidence', async () => {
    const workspaceRoot = await mkdtemp(join(tmpdir(), 'v41-controlled-runner-unsafe-operation-'));

    try {
      const result = await runControlledProvider(TASK3_REQUEST, {
        workspaceRoot,
        allowedWorkspaceRoots: [workspaceRoot],
        processRunner: createFakeRunner({
          exitCode: 0,
          stdout: 'ok',
          stderr: ''
        }),
        runId: 'provider-run-task-3-unsafe'
      });
      const unsafe = buildControlledProviderRunnerOperationRecord(result);

      unsafe.outputSummary.stdoutPreview = 'leaked sk-provider-secret';
      unsafe.outputSummary.rawProviderOutputAvailable = true;

      assert.throws(
        () => validateControlledProviderRunnerOperationRecord(unsafe),
        /raw provider output must not be available|secret-looking values/u
      );
    } finally {
      await rm(workspaceRoot, { recursive: true, force: true });
    }
  });

  it('rejects backend workspace roots outside the allowed workspace policy', async () => {
    const allowedRoot = await mkdtemp(join(tmpdir(), 'v41-controlled-runner-allowed-'));
    const outsideRoot = await mkdtemp(join(tmpdir(), 'v41-controlled-runner-outside-'));

    try {
      assert.throws(
        () => buildControlledProviderRunnerPreview(BASE_REQUEST, {
          workspaceRoot: outsideRoot,
          allowedWorkspaceRoots: [allowedRoot]
        }),
        (error) => {
          assert.equal(error instanceof ControlledProviderRunnerError, true);
          assert.equal(error.failureLayer, 'workspace');
          assert.equal(error.errors.includes('workspaceRoot must be inside an allowed backend workspace root'), true);
          return true;
        }
      );
    } finally {
      await rm(allowedRoot, { recursive: true, force: true });
      await rm(outsideRoot, { recursive: true, force: true });
    }
  });
});

function createFakeRunner({ exitCode, stdout, stderr, timedOut = false, stalled = false, durationMs = 12 }) {
  const invocations = [];

  return {
    invocations,
    async run(invocation) {
      invocations.push({
        executable: invocation.executable,
        args: invocation.args,
        cwd: invocation.cwd,
        stdinIncludes: [
          `goalId: ${V41_CONTROLLED_PROVIDER_RUNNER_GOAL_ID}`,
          'taskId: task-2',
          'promptRef: docs/plans/v41-task-2-worker-prompt.md',
          'role: reviewer'
        ].filter((expected) => invocation.stdin.includes(expected)),
        env: invocation.env,
        timeoutMs: invocation.timeoutMs,
        stallTimeoutMs: invocation.stallTimeoutMs,
        outputFiles: invocation.outputFiles
      });

      return {
        exitCode,
        signal: null,
        stdout,
        stderr,
        durationMs,
        timedOut,
        stalled
      };
    }
  };
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
