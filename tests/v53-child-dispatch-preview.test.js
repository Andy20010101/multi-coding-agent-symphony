import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  CHILD_DISPATCH_ALLOWED_PROVIDER_IDS,
  CHILD_DISPATCH_BOUNDARIES,
  CHILD_DISPATCH_RETURN_PATH,
  ChildDispatchPreviewContractError,
  assertChildDispatchPreviewContract,
  buildChildDispatchPreviewContract,
  validateChildDispatchPreviewContract,
  validateChildTaskPackContract
} from '../src/symphony/child-dispatch-preview-contracts.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, '..');
const FIXTURE_DIR = join(REPO_ROOT, 'fixtures/contracts');
const GENERATED_AT = '2026-06-12T11:00:00.000Z';

const PREVIEW_FIXTURES = Object.freeze([
  'child-dispatch-preview.codex-worker.v1.json',
  'child-dispatch-preview.claude-reviewer.v1.json',
  'child-dispatch-preview.blocked-missing-goal.v1.json',
  'child-dispatch-preview.blocked-unsupported-provider.v1.json'
]);
const TASK_PACK_FIXTURES = Object.freeze([
  'child-task-pack.worker.v1.json',
  'child-task-pack.reviewer.v1.json'
]);

describe('v53 childDispatchPreview.v1 contracts and fixtures', () => {
  it('validates every child dispatch preview and task pack fixture', () => {
    for (const name of PREVIEW_FIXTURES) {
      const preview = fixture(name);
      const validation = validateChildDispatchPreviewContract(preview);

      assert.equal(validation.ok, true, `${name}: ${validation.errors.join('; ')}`);
      assertReadOnlyPreviewBoundaries(preview);
    }

    for (const name of TASK_PACK_FIXTURES) {
      const taskPack = fixture(name);
      const validation = validateChildTaskPackContract(taskPack);

      assert.equal(validation.ok, true, `${name}: ${validation.errors.join('; ')}`);
      assertCopyOnlyTaskPack(taskPack);
    }
  });

  it('keeps Codex worker and Claude reviewer happy paths on v51 Result Intake', () => {
    const codexWorker = fixture('child-dispatch-preview.codex-worker.v1.json');
    const claudeReviewer = fixture('child-dispatch-preview.claude-reviewer.v1.json');

    assertHappyPathResultExpectation(codexWorker, {
      role: 'worker',
      providerId: 'codex',
      resultSource: 'codex',
      resultRole: 'worker',
      eventType: 'worker.evidence-recorded'
    });
    assertHappyPathResultExpectation(claudeReviewer, {
      role: 'reviewer',
      providerId: 'claude-code',
      resultSource: 'claude',
      resultRole: 'reviewer',
      eventType: 'reviewer.needs-revision'
    });
  });

  it('blocks preview when the active goal is missing', () => {
    const preview = fixture('child-dispatch-preview.blocked-missing-goal.v1.json');

    assert.equal(preview.readiness.state, 'blocked');
    assert.equal(preview.readiness.canPreview, false);
    assert.equal(preview.readiness.copyAvailable, false);
    assert.ok(preview.blockedReasons.includes('active-goal-missing'));
    assert.equal(preview.taskPack, null);
    assert.equal(preview.resultExpectation, null);
    assert.equal(validateChildDispatchPreviewContract(preview).ok, true);
  });

  it('blocks preview for unsupported requested providers without retaining that provider id', () => {
    const built = buildChildDispatchPreviewContract({
      generatedAt: GENERATED_AT,
      goal: activeGoal(),
      task: activeTask(),
      requestedRole: 'worker',
      preferredProvider: 'gemini-cli'
    });
    const fixturePreview = fixture('child-dispatch-preview.blocked-unsupported-provider.v1.json');

    for (const preview of [built, fixturePreview]) {
      assert.equal(preview.readiness.state, 'blocked');
      assert.equal(preview.readiness.canPreview, false);
      assert.ok(preview.blockedReasons.includes('unsupported-provider'));
      assert.equal(preview.taskPack, null);
      assert.equal(preview.resultExpectation, null);
      assert.deepEqual(preview.providerRecommendation.allowedProviders, CHILD_DISPATCH_ALLOWED_PROVIDER_IDS);
      assert.ok(CHILD_DISPATCH_ALLOWED_PROVIDER_IDS.includes(preview.providerRecommendation.providerId));
      assert.equal(validateChildDispatchPreviewContract(preview).ok, true);
    }
  });

  it('keeps standalone task packs copy-only and non-mutating', () => {
    for (const name of TASK_PACK_FIXTURES) {
      assertCopyOnlyTaskPack(fixture(name));
    }

    for (const name of [
      'child-dispatch-preview.codex-worker.v1.json',
      'child-dispatch-preview.claude-reviewer.v1.json'
    ]) {
      assertCopyOnlyTaskPack(fixture(name).taskPack);
    }
  });

  it('rejects unsupported provider ids in provider recommendation and task packs', () => {
    const recommendationDrift = fixture('child-dispatch-preview.codex-worker.v1.json');
    recommendationDrift.providerRecommendation.providerId = 'gemini-cli';

    const taskPackDrift = fixture('child-dispatch-preview.codex-worker.v1.json');
    taskPackDrift.taskPack.preferredProvider = 'gemini-cli';

    const standaloneTaskPack = fixture('child-task-pack.worker.v1.json');
    standaloneTaskPack.allowedProviders = ['codex', 'gemini-cli'];

    const recommendationValidation = validateChildDispatchPreviewContract(recommendationDrift);
    const taskPackValidation = validateChildDispatchPreviewContract(taskPackDrift);
    const standaloneValidation = validateChildTaskPackContract(standaloneTaskPack);

    assert.equal(recommendationValidation.ok, false);
    assert.ok(recommendationValidation.errors.includes(
      'providerRecommendation.providerId must be one of codex, claude-code'
    ));
    assert.equal(taskPackValidation.ok, false);
    assert.ok(taskPackValidation.errors.includes('taskPack.preferredProvider must be one of codex, claude-code'));
    assert.equal(standaloneValidation.ok, false);
    assert.ok(standaloneValidation.errors.includes('taskPack.allowedProviders must be exactly codex, claude-code'));
  });

  it('rejects execution, dispatch, local state, raw output, event append, and release-route drift', () => {
    const cases = [
      {
        name: 'hidden execution route',
        mutate: (preview) => {
          preview.sourceRefs[0].ref = '/api/providers/run';
        },
        expected: 'contract.sourceRefs[0].ref must not contain execution, dispatch, local session, raw output, event append, git, tag, publish, or release routes'
      },
      {
        name: 'hidden child dispatch route',
        mutate: (preview) => {
          preview.sourceRefs[0].ref = '/api/child-dispatch/confirm';
        },
        expected: 'contract.sourceRefs[0].ref must not contain execution, dispatch, local session, raw output, event append, git, tag, publish, or release routes'
      },
      {
        name: 'local session jsonl ref',
        mutate: (preview) => {
          preview.sourceRefs[0].ref = '.codex/sessions/turn.jsonl';
        },
        expected: 'contract.sourceRefs[0].ref must not contain execution, dispatch, local session, raw output, event append, git, tag, publish, or release routes'
      },
      {
        name: 'symphony internals ref',
        mutate: (preview) => {
          preview.sourceRefs[0].ref = '.symphony/goals/local-state.json';
        },
        expected: 'contract.sourceRefs[0].ref must not contain execution, dispatch, local session, raw output, event append, git, tag, publish, or release routes'
      },
      {
        name: 'raw transcript field',
        mutate: (preview) => {
          preview.taskPack.expectedResultBlock.resultBlock.rawTranscript = 'provider session text';
        },
        expected: 'taskPack.expectedResultBlock.resultBlock.rawTranscript is not allowed'
      },
      {
        name: 'raw model output text',
        mutate: (preview) => {
          preview.taskPack.expectedResultBlock.resultBlock.summary = 'raw model output should not be copied';
        },
        expected: 'contract.taskPack.expectedResultBlock.resultBlock.summary must not contain execution, dispatch, local session, raw output, event append, git, tag, publish, or release routes'
      },
      {
        name: 'event append route',
        mutate: (preview) => {
          preview.taskPack.expectedResultBlock.requestedEvent.route = '/api/goals/<goal-id>/event-append';
        },
        expected: 'taskPack.expectedResultBlock.requestedEvent.route is not allowed'
      },
      {
        name: 'git command',
        mutate: (preview) => {
          preview.taskPack.expectedResultBlock.resultBlock.validationCommands = ['git push origin main'];
        },
        expected: 'contract.taskPack.expectedResultBlock.resultBlock.validationCommands[0] must not contain execution, dispatch, local session, raw output, event append, git, tag, publish, or release routes'
      },
      {
        name: 'tag route',
        mutate: (preview) => {
          preview.sourceRefs[0].ref = '/api/goals/<goal-id>/tag';
        },
        expected: 'contract.sourceRefs[0].ref must not contain execution, dispatch, local session, raw output, event append, git, tag, publish, or release routes'
      },
      {
        name: 'publish label',
        mutate: (preview) => {
          preview.sourceRefs[0].label = 'Publish';
        },
        expected: 'contract.sourceRefs[0].label must not contain execution, dispatch, local session, raw output, event append, git, tag, publish, or release routes'
      },
      {
        name: 'release label',
        mutate: (preview) => {
          preview.sourceRefs[0].label = 'Release';
        },
        expected: 'contract.sourceRefs[0].label must not contain execution, dispatch, local session, raw output, event append, git, tag, publish, or release routes'
      },
      {
        name: 'will mutate',
        mutate: (preview) => {
          preview.taskPack.willMutate = true;
        },
        expected: 'taskPack.willMutate must be false'
      }
    ];

    for (const testCase of cases) {
      const preview = fixture('child-dispatch-preview.codex-worker.v1.json');
      testCase.mutate(preview);

      const validation = validateChildDispatchPreviewContract(preview);

      assert.equal(validation.ok, false, testCase.name);
      assert.ok(validation.errors.includes(testCase.expected), `${testCase.name}: ${validation.errors.join('; ')}`);
    }
  });

  it('rejects extra fields that could hide mutation routes', () => {
    const drift = fixture('child-dispatch-preview.codex-worker.v1.json');

    drift.executeRoute = '/api/providers/run';
    drift.providerRecommendation.dispatchRoute = '/api/child-dispatch/confirm';
    drift.readiness.mutationRoute = '/api/goals/<goal-id>/event-plan-confirm';
    drift.sourceContracts[0].writeRoute = '/api/goals/<goal-id>/event-plan-confirm';
    drift.sourceRefs[0].writeRoute = '/api/goals/<goal-id>/event-plan-confirm';
    drift.taskPack.mutationRoute = '/api/goals/<goal-id>/event-plan-confirm';
    drift.taskPack.expectedResultBlock.confirmRoute = '/api/goals/<goal-id>/event-plan-confirm';
    drift.resultExpectation.confirmRoute = '/api/goals/<goal-id>/event-plan-confirm';
    drift.boundaries.providerExecutionRoute = '/api/providers/run';

    const validation = validateChildDispatchPreviewContract(drift);

    assert.equal(validation.ok, false);
    assert.ok(validation.errors.includes('contract.executeRoute is not allowed'));
    assert.ok(validation.errors.includes('providerRecommendation.dispatchRoute is not allowed'));
    assert.ok(validation.errors.includes('readiness.mutationRoute is not allowed'));
    assert.ok(validation.errors.includes('sourceContracts[0].writeRoute is not allowed'));
    assert.ok(validation.errors.includes('sourceRefs[0].writeRoute is not allowed'));
    assert.ok(validation.errors.includes('taskPack.mutationRoute is not allowed'));
    assert.ok(validation.errors.includes('taskPack.expectedResultBlock.confirmRoute is not allowed'));
    assert.ok(validation.errors.includes('resultExpectation.confirmRoute is not allowed'));
    assert.ok(validation.errors.includes('boundaries.providerExecutionRoute is not allowed'));
  });

  it('throws a typed error from the assert helper', () => {
    const invalid = fixture('child-dispatch-preview.codex-worker.v1.json');
    invalid.boundaries.actualChildDispatchAvailable = true;

    assert.throws(
      () => assertChildDispatchPreviewContract(invalid),
      (error) => (
        error instanceof ChildDispatchPreviewContractError &&
        error.code === 'invalid-child-dispatch-preview' &&
        error.details.reason === 'boundaries.actualChildDispatchAvailable must be false'
      )
    );
  });
});

function fixture(name) {
  return JSON.parse(readFileSync(join(FIXTURE_DIR, name), 'utf8'));
}

function activeGoal() {
  return {
    goalId: 'v53-controlled-child-dispatch-preview',
    title: 'v53 Controlled Child Dispatch Preview',
    state: 'active',
    sourceContract: 'goal-supervisor-app-read-model.v1',
    sourceRef: {
      kind: 'route',
      ref: '/api/goals/<goal-id>/supervisor'
    }
  };
}

function activeTask() {
  return {
    taskId: 'pr-1-contracts-fixtures-tests',
    title: 'Contracts, fixtures, and tests',
    state: 'active',
    sourceContract: 'systemGoldenPath.v1',
    sourceRef: {
      kind: 'fixture',
      ref: 'fixtures/contracts/system-golden-path.ready.v1.json'
    }
  };
}

function assertHappyPathResultExpectation(preview, {
  role,
  providerId,
  resultSource,
  resultRole,
  eventType
}) {
  assert.equal(preview.readiness.state, 'ready');
  assert.equal(preview.requestedRole, role);
  assert.equal(preview.providerRecommendation.providerId, providerId);
  assert.equal(preview.providerRecommendation.providerExecutionAvailable, false);
  assert.equal(preview.providerRecommendation.actualChildDispatchAvailable, false);
  assertCopyOnlyTaskPack(preview.taskPack);

  const expectedResultBlock = preview.taskPack.expectedResultBlock;

  assert.equal(preview.resultExpectation.returnPath, CHILD_DISPATCH_RETURN_PATH);
  assert.equal(preview.resultExpectation.resultIntakeContract, 'resultIntakeRequest.v1');
  assert.deepEqual(preview.resultExpectation.expectedResultBlock, expectedResultBlock);
  assert.equal(expectedResultBlock.returnPath, CHILD_DISPATCH_RETURN_PATH);
  assert.equal(expectedResultBlock.contractName, 'resultIntakeRequest.v1');
  assert.equal(expectedResultBlock.workerRole, resultRole);
  assert.equal(expectedResultBlock.source, resultSource);
  assert.equal(expectedResultBlock.requestedEvent.eventType, eventType);
  assert.equal(expectedResultBlock.willAppendGoalEvent, false);
  assert.equal(expectedResultBlock.boundaries.directGoalEventAppendAvailable, false);
  assert.equal(expectedResultBlock.boundaries.reviewerMutationAvailable, false);
  assert.equal(expectedResultBlock.boundaries.mainVerificationMutationAvailable, false);
  assert.equal(expectedResultBlock.boundaries.releaseGateMutationAvailable, false);
}

function assertCopyOnlyTaskPack(taskPack) {
  assert.equal(taskPack.returnPath, CHILD_DISPATCH_RETURN_PATH);
  assert.equal(taskPack.copyOnly, true);
  assert.equal(taskPack.willMutate, false);
  assert.deepEqual(taskPack.allowedProviders, CHILD_DISPATCH_ALLOWED_PROVIDER_IDS);
  assert.equal(taskPack.expectedResultBlock.returnPath, CHILD_DISPATCH_RETURN_PATH);
  assert.equal(taskPack.expectedResultBlock.willAppendGoalEvent, false);
}

function assertReadOnlyPreviewBoundaries(preview) {
  for (const [field, expected] of Object.entries(CHILD_DISPATCH_BOUNDARIES)) {
    assert.equal(preview.boundaries[field], expected, `boundaries.${field}`);
  }

  assert.equal(preview.readiness.providerExecutionAvailable, false);
  assert.equal(preview.readiness.actualChildDispatchAvailable, false);
  assert.equal(preview.providerRecommendation.providerExecutionAvailable, false);
  assert.equal(preview.providerRecommendation.actualChildDispatchAvailable, false);

  if (preview.taskPack !== null) {
    assertCopyOnlyTaskPack(preview.taskPack);
  }
}
