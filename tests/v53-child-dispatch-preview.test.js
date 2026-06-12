import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  CHILD_DISPATCH_ALLOWED_PROVIDER_IDS,
  CHILD_DISPATCH_BOUNDARIES,
  CHILD_DISPATCH_PREVIEW_CONTRACT_NAME,
  CHILD_DISPATCH_RETURN_PATH,
  ChildDispatchPreviewContractError,
  assertChildDispatchPreviewContract,
  buildChildDispatchPreviewContract,
  validateChildDispatchPreviewContract,
  validateChildTaskPackContract
} from '../src/symphony/child-dispatch-preview-contracts.js';
import {
  buildGoalSupervisorAppReadModel
} from '../src/symphony/goal-supervisor/index.js';

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

  it('rejects main verifier and release manager result roles from child task packs', () => {
    for (const workerRole of ['main-verifier', 'release-manager']) {
      const preview = fixture('child-dispatch-preview.codex-worker.v1.json');
      preview.taskPack.expectedResultBlock.workerRole = workerRole;
      preview.resultExpectation.expectedResultBlock.workerRole = workerRole;

      const validation = validateChildDispatchPreviewContract(preview);

      assert.equal(validation.ok, false, workerRole);
      assert.ok(validation.errors.includes(
        'taskPack.expectedResultBlock.workerRole must be one of worker, reviewer'
      ));
      assert.ok(validation.errors.includes(
        'resultExpectation.expectedResultBlock.workerRole must be one of worker, reviewer'
      ));
    }
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

  it('projects a valid childDispatchPreview from the backend app read model', () => {
    const model = buildProjectionReadModel();
    const preview = model.childDispatchPreview;
    const validation = validateChildDispatchPreviewContract(preview);

    assert.equal(preview.contractName, CHILD_DISPATCH_PREVIEW_CONTRACT_NAME);
    assert.equal(validation.ok, true, validation.errors.join('; '));
    assert.equal(preview.goal.goalId, 'v53-controlled-child-dispatch-preview');
    assert.equal(preview.task.taskId, 'pr-2-backend-projection');
    assert.equal(preview.readiness.state, 'ready');
    assert.equal(preview.taskPack.goalId, preview.goal.goalId);
    assert.equal(preview.taskPack.taskId, preview.task.taskId);
  });

  it('projects the ready Codex worker task pack as copy-only with v51 result intake return', () => {
    const preview = buildProjectionReadModel().childDispatchPreview;

    assert.equal(preview.providerRecommendation.providerId, 'codex');
    assert.equal(preview.requestedRole, 'worker');
    assert.equal(preview.readiness.providerExecutionAvailable, false);
    assert.equal(preview.readiness.actualChildDispatchAvailable, false);
    assert.equal(preview.providerRecommendation.providerExecutionAvailable, false);
    assert.equal(preview.providerRecommendation.actualChildDispatchAvailable, false);
    assert.equal(preview.taskPack.copyOnly, true);
    assert.equal(preview.taskPack.willMutate, false);
    assert.equal(preview.taskPack.returnPath, CHILD_DISPATCH_RETURN_PATH);
    assert.equal(preview.resultExpectation.returnPath, CHILD_DISPATCH_RETURN_PATH);
    assert.equal(preview.resultExpectation.resultIntakeContract, 'resultIntakeRequest.v1');
    assert.equal(preview.resultExpectation.directGoalEventAppendAvailable, false);
    assert.equal(preview.resultExpectation.directTaskCompleteAvailable, false);
    assert.equal(preview.resultExpectation.reviewerMutationAvailable, false);
    assert.equal(preview.resultExpectation.mainVerificationMutationAvailable, false);
    assert.equal(preview.resultExpectation.releaseGateMutationAvailable, false);
    assert.equal(preview.taskPack.expectedResultBlock.boundaries.providerExecutionAvailable, false);
    assert.equal(preview.taskPack.expectedResultBlock.boundaries.childDispatchAvailable, false);
    assert.equal(preview.taskPack.expectedResultBlock.willAppendGoalEvent, false);
  });

  it('can recommend Claude Code for reviewer role while staying copy-only', () => {
    const preview = buildProjectionReadModel({ role: 'reviewer' }).childDispatchPreview;

    assert.equal(preview.readiness.state, 'ready');
    assert.equal(preview.requestedRole, 'reviewer');
    assert.equal(preview.providerRecommendation.providerId, 'claude-code');
    assert.equal(preview.taskPack.preferredProvider, 'claude-code');
    assert.equal(preview.taskPack.copyOnly, true);
    assert.equal(preview.taskPack.willMutate, false);
    assert.equal(preview.taskPack.expectedResultBlock.source, 'claude');
    assert.equal(preview.taskPack.expectedResultBlock.workerRole, 'reviewer');
    assert.equal(preview.resultExpectation.expectedResultBlock.requestedEvent.eventType, 'reviewer.needs-revision');
  });

  it('blocks backend preview when active goal and active task are missing', () => {
    const preview = buildGoalSupervisorAppReadModel({
      nowMs: Date.parse(GENERATED_AT)
    }).childDispatchPreview;

    assert.equal(preview.readiness.state, 'blocked');
    assert.equal(preview.readiness.canPreview, false);
    assert.equal(preview.readiness.copyAvailable, false);
    assert.ok(preview.blockedReasons.includes('active-goal-missing'));
    assert.ok(preview.blockedReasons.includes('active-task-missing'));
    assert.equal(preview.taskPack, null);
    assert.equal(preview.resultExpectation, null);
    assert.equal(validateChildDispatchPreviewContract(preview).ok, true);
  });

  it('blocks backend preview for unsupported provider policy', () => {
    const preview = buildProjectionReadModel({
      childDispatchProviderPolicy: {
        preferredProvider: 'gemini-cli'
      }
    }).childDispatchPreview;

    assert.equal(preview.readiness.state, 'blocked');
    assert.equal(preview.readiness.canPreview, false);
    assert.ok(preview.blockedReasons.includes('unsupported-provider'));
    assert.equal(preview.providerRecommendation.providerId, 'codex');
    assert.equal(preview.taskPack, null);
    assert.equal(preview.resultExpectation, null);
    assert.equal(validateChildDispatchPreviewContract(preview).ok, true);
  });

  it('preserves safe backend source contracts and refs in the projected preview', () => {
    const preview = buildProjectionReadModel().childDispatchPreview;
    const sourceNames = preview.sourceContracts.map((source) => source.contractName);
    const serialized = JSON.stringify(preview);

    for (const name of [
      'goal-supervisor-app-read-model.v1',
      'goal-next-action.v1',
      'goal-supervisor-core-projection.v1',
      'systemGoldenPath.v1',
      'resultIntakeRequest.v1'
    ]) {
      assert.ok(sourceNames.includes(name), name);
    }

    assert.ok(preview.sourceRefs.some((sourceRef) => (
      sourceRef.kind === 'route' &&
      sourceRef.ref === '/api/goals/<goal-id>/supervisor'
    )));
    assert.ok(preview.sourceRefs.some((sourceRef) => (
      sourceRef.kind === 'contract' &&
      sourceRef.ref === 'systemGoldenPath.v1'
    )));
    assert.doesNotMatch(serialized, /\.jsonl|\.symphony|\/api\/providers|\/api\/child-dispatch/iu);
    assert.doesNotMatch(serialized, /"rawTranscript"\s*:/u);
    assert.doesNotMatch(serialized, /"rawModelOutput"\s*:/u);
    assert.equal(validateChildDispatchPreviewContract(preview).ok, true);
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

function buildProjectionReadModel({
  role = 'worker',
  childDispatchProviderPolicy = null
} = {}) {
  const goalId = 'v53-controlled-child-dispatch-preview';
  const taskId = 'pr-2-backend-projection';

  return buildGoalSupervisorAppReadModel({
    goalId,
    title: 'v53 Controlled Child Dispatch Preview',
    tasks: [
      {
        taskId,
        title: 'Backend preview projection',
        status: 'active'
      }
    ],
    sourceContracts: [
      'goal-next-action.v1',
      'goal-supervisor-core-projection.v1'
    ],
    goalNext: goalNext({ goalId, taskId, role }),
    coreProjection: coreProjection({ goalId, taskId, role }),
    currentProjectBinding: currentProjectBinding(),
    appStateSnapshot: appStateSnapshot({ goalId, taskId }),
    contextAdvisory: contextAdvisory(),
    threadContinuationDecision: threadContinuationDecision({ taskId, role }),
    childDispatchProviderPolicy,
    nowMs: Date.parse(GENERATED_AT)
  });
}

function goalNext({ goalId, taskId, role }) {
  return {
    contractName: 'goal-next-action.v1',
    contractVersion: 1,
    goalId,
    status: 'action-required',
    next: {
      taskId,
      role,
      phase: role === 'reviewer' ? 'review' : 'implement'
    },
    reason: `${taskId} ${role} is next`
  };
}

function coreProjection({ goalId, taskId, role }) {
  const result = workerResult({ goalId, taskId, role });

  return {
    contractName: 'goal-supervisor-core-projection.v1',
    contractVersion: 1,
    goalId,
    current: {
      taskId,
      role,
      threadId: `thread-${taskId}-${role}`
    },
    route: {
      state: 'dispatchable',
      reason: 'next-action-ready',
      current: {
        taskId,
        role,
        threadId: `thread-${taskId}-${role}`
      },
      pendingResult: {
        source: 'recorded-result-state',
        result
      }
    },
    progress: {},
    routeInput: {
      resultIntake: {
        source: 'thread-result',
        status: 'pending',
        record: result,
        reason: 'valid-result-awaits-registration'
      }
    }
  };
}

function workerResult({ goalId, taskId, role }) {
  return {
    goalId,
    taskId,
    role,
    threadId: `thread-${taskId}-${role}`,
    eventToRegister: 'worker.evidence-recorded',
    evidenceRef: `docs/plans/v53-${taskId}-${role}-evidence-2026-06-12.md`,
    branch: 'codex/v53-child-dispatch-preview-backend-projection',
    headCommit: 'abcdef1234567890'
  };
}

function currentProjectBinding() {
  return {
    contractName: 'current-project-binding.v1',
    contractVersion: 1,
    generatedAt: GENERATED_AT,
    state: 'bound',
    selectedProjectId: 'multi-coding-agent-symphony',
    selectedProjectName: 'Multi Coding Agent Symphony',
    readOnly: true
  };
}

function appStateSnapshot({ goalId, taskId }) {
  return {
    contractName: 'app-state-snapshot.v1',
    contractVersion: 1,
    generatedAt: GENERATED_AT,
    readOnly: true,
    freshness: {
      status: 'current'
    },
    active_goal: {
      goal_id: goalId,
      goal_title: 'v53 Controlled Child Dispatch Preview'
    },
    current_task: {
      task_id: taskId,
      title: 'Backend preview projection',
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
  };
}

function contextAdvisory() {
  return {
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
      evidenceRef: 'docs/plans/v53-pr-2-backend-projection-worker-evidence-2026-06-12.md'
    },
    contextUtilization: {
      status: 'available',
      ratio: 0.2
    },
    degradedReasons: [],
    blockedFields: []
  };
}

function threadContinuationDecision({ taskId, role }) {
  return {
    contractName: 'threadContinuationDecision.v1',
    contractVersion: 1,
    generatedAt: GENERATED_AT,
    readOnly: true,
    willMutate: false,
    decision: 'checkpoint',
    reason: 'result-awaits-registration',
    taskId,
    threadId: `thread-${taskId}-${role}`,
    checkpointRef: `docs/plans/v53-${taskId}-${role}-evidence-2026-06-12.md`,
    blockedFields: [],
    requiredEvidence: ['pending-result-registration'],
    sourceContracts: [
      {
        contractName: 'contextAdvisory.v1',
        contractVersion: 1,
        generatedAt: GENERATED_AT,
        readOnly: true
      }
    ]
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
