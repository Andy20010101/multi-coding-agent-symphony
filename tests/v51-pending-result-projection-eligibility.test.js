import { readFileSync } from 'node:fs';
import { mkdir, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';

import {
  buildGoalSupervisorAppReadModel,
  buildGoalSupervisorAppReadModelFromContracts,
  buildSupervisorEventRegistrationEligibility
} from '../src/symphony/goal-supervisor/index.js';
import {
  buildPendingResultFromEscrow,
  buildResultEvidenceEscrow,
  buildResultIntakePreview,
  validatePendingResultContract
} from '../src/symphony/result-intake-contracts.js';
import {
  writeResultIntakeConfirmState
} from '../src/symphony/result-intake-state.js';
import {
  buildGoalRunbookInitPlan,
  confirmGoalRunbookInit
} from '../src/symphony/goal-runbook-registry.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, '..');
const FIXTURE_DIR = join(REPO_ROOT, 'fixtures/contracts/result-intake');
const RUNBOOK_FIXTURE = 'fixtures/contracts/goal-runbook.v23-goal-operation-run-console.v1.json';
const GENERATED_AT = '2026-06-12T10:00:00.000Z';
const GOAL_ID = 'v51-result-intake-evidence-escrow';
const TASK_ID = 'task-1';
const WORKER_EVIDENCE_REF = 'docs/plans/v51-task-1-worker-evidence-2026-06-12.md';
const BLOCKER_EVIDENCE_REF = 'docs/plans/v51-task-1-blocker-evidence-2026-06-12.md';

describe('v51 pending result projection and eligibility integration', () => {
  it('projects pendingResult.v1 into the supervisor read model without raw result text', () => {
    const pendingResult = pendingResultFromFixture('safe-worker-result.v1.json');
    const model = buildGoalSupervisorAppReadModel({
      goalId: GOAL_ID,
      coreProjection: coreProjection(),
      pendingResultState: withUnsafeProjectionProbe(pendingResult),
      threadContinuationDecision: checkpointDecision(),
      nowMs: Date.parse(GENERATED_AT)
    });

    assert.equal(model.pendingResult.contractName, 'pendingResult.v1');
    assert.equal(model.pendingResult.status, 'pending');
    assert.equal(model.pendingResult.state, 'available');
    assert.equal(model.pendingResult.escrowRef, pendingResult.escrowRef);
    assert.equal(model.pendingResult.eventCandidate.eventType, 'worker.evidence-recorded');
    assert.deepEqual(model.pendingResult.evidenceRefs, [{
      kind: 'repo-doc',
      ref: WORKER_EVIDENCE_REF,
      label: 'v51 task 1 worker evidence'
    }]);
    assert.deepEqual(model.pendingResult.sanitizedSummary.changedFiles, [
      'src/symphony/result-intake-contracts.js',
      'tests/v51-result-intake-evidence-escrow.test.js'
    ]);
    assert.equal(model.pendingResult.boundaries.directGoalEventAppendAvailable, false);
    assert.equal(model.pendingResult.boundaries.projectionAppendsGoalEvent, false);
    assert.ok(model.pendingResult.sourceContracts.some((contract) => (
      contract.contractName === 'resultEvidenceEscrow.v1' &&
      contract.escrowRef === pendingResult.escrowRef
    )));
    assertNoUnsafePayload(model.pendingResult);
  });

  it('makes safe worker pending results eligible only through the v50 event preview path', () => {
    const pendingResult = pendingResultFromFixture('safe-worker-result.v1.json');
    const model = buildGoalSupervisorAppReadModel({
      goalId: GOAL_ID,
      coreProjection: coreProjection(),
      pendingResultState: pendingResult,
      threadContinuationDecision: checkpointDecision(),
      nowMs: Date.parse(GENERATED_AT)
    });
    const eligibility = model.supervisorEventRegistrationEligibility;

    assert.equal(eligibility.state, 'eligible');
    assert.equal(eligibility.reason, 'eligible-goal-update-event');
    assert.equal(eligibility.recommendedEvent.eventType, 'worker.evidence-recorded');
    assert.equal(eligibility.recommendedEvent.commandName, 'symphony goal update');
    assert.deepEqual(eligibility.recommendedEvent.evidenceRefs, [WORKER_EVIDENCE_REF]);
    assert.deepEqual(eligibility.previewRequest, {
      method: 'GET',
      route: `/api/goals/${GOAL_ID}/event-plan-preview`,
      query: {
        command: 'update',
        task: TASK_ID,
        event: 'worker.evidence-recorded',
        actor: 'local-goal-supervisor-worker',
        evidenceRef: [WORKER_EVIDENCE_REF],
        statement: 'Added result intake contract helpers, fixtures, and focused tests.'
      }
    });
    assert.equal(eligibility.confirmRequestShape.route, `/api/goals/${GOAL_ID}/event-plan-confirm`);
    assert.equal(eligibility.confirmRequestShape.confirmUsesPlanHash, true);
    assert.equal(eligibility.boundaries.projectionAppendsEvent, false);
    assert.equal(eligibility.boundaries.eventLogWriteAvailable, false);
    assert.ok(eligibility.sourceContracts.some((contract) => contract.contractName === 'pendingResult.v1'));
    assertNoUnsafePayload(eligibility);
  });

  it('makes safe blocker pending results eligible without treating result intake as an append path', () => {
    const pendingResult = pendingResultFromFixture('blocker-result.v1.json');
    const eligibility = buildSupervisorEventRegistrationEligibility({
      goalId: GOAL_ID,
      pendingResult,
      threadContinuationDecision: checkpointDecision({
        checkpointRef: BLOCKER_EVIDENCE_REF
      }),
      generatedAt: GENERATED_AT
    });

    assert.equal(pendingResult.state, 'blocked');
    assert.equal(eligibility.state, 'eligible');
    assert.equal(eligibility.recommendedEvent.eventType, 'blocker.opened');
    assert.equal(eligibility.recommendedEvent.commandName, 'symphony goal update');
    assert.equal(eligibility.previewRequest.query.blockerId, 'v51-pr2-backend-confirm-route');
    assert.equal(eligibility.previewRequest.query.blockerReason, 'backend result-intake confirm route belongs to PR-2');
    assert.equal(eligibility.previewRequest.query.evidenceRef[0], BLOCKER_EVIDENCE_REF);
    assert.equal(eligibility.boundaries.projectionAppendsEvent, false);
    assertNoUnsafePayload(eligibility);
  });

  it('blocks missing evidence refs and non-update event families from pendingResult.v1', () => {
    const safePending = pendingResultFromFixture('safe-worker-result.v1.json');
    const missingEvidence = {
      ...safePending,
      evidenceRefs: [],
      eventCandidate: {
        ...safePending.eventCandidate,
        evidenceRefs: []
      }
    };
    const reviewerPending = {
      ...safePending,
      state: 'blocked',
      eventCandidate: {
        ...safePending.eventCandidate,
        eventType: 'reviewer.approved',
        command: 'review',
        commandName: 'symphony goal review',
        state: 'blocked',
        reason: 'event-routed-to-goal-review'
      },
      blockedReasons: ['event-routed-to-goal-review']
    };
    const gatePending = {
      ...safePending,
      state: 'blocked',
      eventCandidate: {
        ...safePending.eventCandidate,
        eventType: 'main.verification-passed',
        command: 'gate',
        commandName: 'symphony goal gate',
        state: 'blocked',
        reason: 'event-routed-to-goal-gate'
      },
      blockedReasons: ['event-routed-to-goal-gate']
    };

    assert.deepEqual(validatePendingResultContract(missingEvidence), {
      ok: true,
      errors: []
    });
    assert.equal(eligibilityFor(missingEvidence).state, 'blocked');
    assert.equal(eligibilityFor(missingEvidence).reason, 'required-inputs-missing');
    assert.ok(eligibilityFor(missingEvidence).missingInputs.includes('evidenceRef'));
    assert.equal(eligibilityFor(reviewerPending).state, 'blocked');
    assert.equal(eligibilityFor(reviewerPending).reason, 'event-routed-to-goal-review');
    assert.equal(eligibilityFor(reviewerPending).previewRequest, null);
    assert.equal(eligibilityFor(gatePending).state, 'blocked');
    assert.equal(eligibilityFor(gatePending).reason, 'event-routed-to-goal-gate');
    assert.equal(eligibilityFor(gatePending).previewRequest, null);
  });

  it('reads PR-2 pending result state into the supervisor contract pipeline', async () => {
    const root = await mkdtemp(join(tmpdir(), 'symphony-v51-pending-result-projection-'));
    const stateDir = join(root, '.symphony');

    try {
      await mkdir(stateDir, { recursive: true });

      const initPlan = await buildGoalRunbookInitPlan({
        stateDir,
        goalId: GOAL_ID,
        fromJson: RUNBOOK_FIXTURE
      });

      await confirmGoalRunbookInit({
        stateDir,
        goalId: GOAL_ID,
        fromJson: RUNBOOK_FIXTURE,
        planHash: initPlan.planHash
      });

      const pendingResult = pendingResultFromFixture('safe-worker-result.v1.json');
      await writeResultIntakeConfirmState({
        stateDir,
        escrow: pendingResult.__escrow,
        pendingResult: withoutTestEscrow(pendingResult)
      });

      const model = await buildGoalSupervisorAppReadModelFromContracts({
        stateDir,
        goalId: GOAL_ID,
        generatedAt: GENERATED_AT,
        sessionHookOptions: {
          codexRoot: join(root, '.codex', 'sessions'),
          claudeRoot: join(root, '.claude', 'projects')
        },
        sessionInventoryOptions: {
          codexRoot: join(root, '.codex', 'sessions'),
          claudeRoot: join(root, '.claude', 'projects')
        }
      });

      assert.equal(model.pendingResult.contractName, 'pendingResult.v1');
      assert.equal(model.pendingResult.status, 'pending');
      assert.equal(model.pendingResult.state, 'available');
      assert.equal(model.pendingResult.escrowRef, pendingResult.escrowRef);
      assert.equal(model.supervisorEventRegistrationEligibility.state, 'eligible');
      assert.equal(model.supervisorEventRegistrationEligibility.previewRequest.route, `/api/goals/${GOAL_ID}/event-plan-preview`);
      assert.ok(model.goalSnapshot.sourceContracts.includes('pendingResult.v1'));
      assertNoUnsafePayload(model.pendingResult);
      assertNoUnsafePayload(model.supervisorEventRegistrationEligibility);
    } finally {
      await rm(root, {
        recursive: true,
        force: true
      });
    }
  });
});

function pendingResultFromFixture(name) {
  const request = fixture(name);
  const preview = buildResultIntakePreview(request, {
    generatedAt: '2026-06-12T09:30:00.000Z',
    expiresAt: '2026-06-12T09:45:00.000Z'
  });
  const escrow = buildResultEvidenceEscrow(preview, {
    createdAt: '2026-06-12T09:35:00.000Z',
    now: '2026-06-12T09:35:00.000Z'
  });
  const pendingResult = buildPendingResultFromEscrow(escrow);

  return {
    ...pendingResult,
    __escrow: escrow
  };
}

function withoutTestEscrow(pendingResult) {
  const { __escrow, ...contract } = pendingResult;

  return contract;
}

function withUnsafeProjectionProbe(pendingResult) {
  return {
    ...pendingResult,
    sanitizedSummary: {
      ...pendingResult.sanitizedSummary,
      rawTranscript: 'provider session secret should not project',
      notes: 'raw model output should not project'
    },
    evidenceRefs: [
      ...pendingResult.evidenceRefs,
      {
        kind: 'repo-doc',
        ref: '.codex/sessions/raw-secret.jsonl',
        label: 'unsafe local session ref'
      }
    ]
  };
}

function coreProjection() {
  return {
    contractName: 'goal-supervisor-core-projection.v1',
    goalId: GOAL_ID,
    current: {
      taskId: TASK_ID,
      role: 'worker'
    },
    route: {
      state: 'pending-result',
      current: {
        taskId: TASK_ID,
        role: 'worker'
      }
    },
    progress: {},
    routeInput: {}
  };
}

function checkpointDecision(overrides = {}) {
  return {
    contractName: 'threadContinuationDecision.v1',
    contractVersion: 1,
    generatedAt: GENERATED_AT,
    readOnly: true,
    willMutate: false,
    decision: 'checkpoint',
    reason: 'result-awaits-registration',
    taskId: TASK_ID,
    checkpointRef: WORKER_EVIDENCE_REF,
    blockedFields: [],
    requiredEvidence: ['pending-result-registration'],
    sourceContracts: [],
    ...overrides
  };
}

function eligibilityFor(pendingResult) {
  return buildSupervisorEventRegistrationEligibility({
    goalId: GOAL_ID,
    pendingResult,
    threadContinuationDecision: checkpointDecision(),
    generatedAt: GENERATED_AT
  });
}

function fixture(name) {
  return JSON.parse(readFileSync(join(FIXTURE_DIR, name), 'utf8'));
}

function assertNoUnsafePayload(value) {
  const serialized = JSON.stringify(value).toLowerCase();

  assert.equal(serialized.includes('/users/andy'), false);
  assert.equal(serialized.includes('.codex'), false);
  assert.equal(serialized.includes('.claude'), false);
  assert.equal(serialized.includes('.symphony'), false);
  assert.equal(serialized.includes('.git/'), false);
  assert.equal(serialized.includes('sessions/'), false);
  assert.equal(serialized.includes('.jsonl'), false);
  assert.equal(/raw[\s_-]*transcript/u.test(serialized), false);
  assert.equal(serialized.includes('rawtranscript'), false);
  assert.equal(serialized.includes('rawmodeloutput'), false);
  assert.equal(serialized.includes('provider session secret'), false);
  assert.equal(serialized.includes('raw model output'), false);
}
