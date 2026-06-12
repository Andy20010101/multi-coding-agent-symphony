import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  SUPERVISOR_EVENT_REGISTRATION_ELIGIBILITY_CONTRACT_NAME,
  buildGoalSupervisorAppReadModel,
  buildSupervisorEventRegistrationEligibility
} from '../src/symphony/goal-supervisor/index.js';

const GENERATED_AT = '2026-06-12T08:00:00.000Z';
const GOAL_ID = 'v50-supervisor-controlled-event-registration';
const TASK_ID = 'task-1';
const THREAD_ID = 'thread-v50-worker';
const EVIDENCE_REF = 'docs/plans/v50-task-1-worker-evidence-2026-06-12.md';

describe('v50 supervisor event registration eligibility projection', () => {
  it('marks worker evidence registration eligible for the controlled goal update route', () => {
    const eligibility = buildSupervisorEventRegistrationEligibility({
      goalId: GOAL_ID,
      pendingResult: pendingResult(workerResult({
        eventToRegister: 'worker.evidence-recorded'
      })),
      threadContinuationDecision: checkpointDecision(),
      generatedAt: GENERATED_AT
    });

    assert.equal(eligibility.contractName, SUPERVISOR_EVENT_REGISTRATION_ELIGIBILITY_CONTRACT_NAME);
    assert.equal(eligibility.readOnly, true);
    assert.equal(eligibility.willMutate, false);
    assert.equal(eligibility.state, 'eligible');
    assert.equal(eligibility.reason, 'eligible-goal-update-event');
    assert.equal(eligibility.recommendedEvent.command, 'update');
    assert.equal(eligibility.recommendedEvent.commandName, 'symphony goal update');
    assert.equal(eligibility.recommendedEvent.eventType, 'worker.evidence-recorded');
    assert.deepEqual(eligibility.recommendedEvent.evidenceRefs, [EVIDENCE_REF]);
    assert.equal(eligibility.previewRequest.method, 'GET');
    assert.equal(eligibility.previewRequest.route, `/api/goals/${GOAL_ID}/event-plan-preview`);
    assert.deepEqual(eligibility.previewRequest.query, {
      command: 'update',
      task: TASK_ID,
      event: 'worker.evidence-recorded',
      actor: 'local-goal-supervisor-worker',
      evidenceRef: [EVIDENCE_REF],
      branch: 'codex/v50-supervisor-event-eligibility-projection',
      commit: 'abcdef1234567890'
    });
    assert.equal(eligibility.confirmRequestShape.method, 'POST');
    assert.equal(eligibility.confirmRequestShape.confirmUsesPlanHash, true);
    assert.equal(eligibility.boundaries.dryRunWrites, false);
    assert.equal(eligibility.boundaries.projectionAppendsEvent, false);
    assert.equal(eligibility.boundaries.genericShellRunner, false);
    assert.equal(eligibility.boundaries.providerLaunchAvailable, false);
    assert.equal(eligibility.boundaries.childDispatchAvailable, false);
    assert.equal(eligibility.boundaries.transcriptCompactAvailable, false);
    assert.equal(eligibility.boundaries.newThreadAvailable, false);
    assert.equal(eligibility.boundaries.frontendFileReadAvailable, false);
    assert.equal(eligibility.boundaries.githubReleaseAutomationAvailable, false);
    assert.deepEqual(eligibility.sourceContracts.map((contract) => contract.contractName).slice(0, 5), [
      'goal-supervisor-app-read-model.v1',
      'threadContinuationDecision.v1',
      'contextAdvisory.v1',
      'goal-event-log.v1',
      'goal-update-plan.v1'
    ]);
    assertNoUnsafePayload(eligibility);
  });

  it('marks blocker.opened eligible only with blocker reason context', () => {
    const eligibility = buildSupervisorEventRegistrationEligibility({
      goalId: GOAL_ID,
      pendingResult: pendingResult(workerResult({
        eventToRegister: 'blocker.opened',
        blocker: {
          blockerId: 'blocker-1',
          reason: 'api-contract-mismatch',
          severity: 'high'
        }
      })),
      threadContinuationDecision: checkpointDecision(),
      generatedAt: GENERATED_AT
    });

    assert.equal(eligibility.state, 'eligible');
    assert.equal(eligibility.recommendedEvent.eventType, 'blocker.opened');
    assert.equal(eligibility.recommendedEvent.commandName, 'symphony goal update');
    assert.equal(eligibility.previewRequest.query.blockerId, 'blocker-1');
    assert.equal(eligibility.previewRequest.query.blockerReason, 'api-contract-mismatch');
    assert.equal(eligibility.previewRequest.query.blockerSeverity, 'high');
    assert.ok(eligibility.requiredInputs.includes('blockerReason'));
  });

  it('blocks update eligibility when required evidence ref is missing or unsafe', () => {
    const eligibility = buildSupervisorEventRegistrationEligibility({
      goalId: GOAL_ID,
      pendingResult: pendingResult(workerResult({
        eventToRegister: 'worker.evidence-recorded',
        evidenceRef: '/Users/andy/.codex/sessions/2026/06/12/raw-secret-prompt.jsonl',
        branch: 'prompt-secret-branch',
        parserReason: 'stdout: secret prompt leaked'
      })),
      threadContinuationDecision: checkpointDecision(),
      generatedAt: GENERATED_AT
    });

    assert.equal(eligibility.state, 'blocked');
    assert.equal(eligibility.reason, 'required-inputs-missing');
    assert.ok(eligibility.missingInputs.includes('evidenceRef'));
    assert.equal(eligibility.previewRequest, null);
    assert.equal(eligibility.confirmRequestShape, null);
    assertNoUnsafePayload(eligibility);
  });

  it('routes reviewer verdicts to symphony goal review instead of goal update', () => {
    const eligibility = buildSupervisorEventRegistrationEligibility({
      goalId: GOAL_ID,
      pendingResult: pendingResult(workerResult({
        role: 'reviewer',
        eventToRegister: 'reviewer.approved'
      })),
      threadContinuationDecision: checkpointDecision(),
      generatedAt: GENERATED_AT
    });

    assert.equal(eligibility.state, 'blocked');
    assert.equal(eligibility.reason, 'event-routed-to-goal-review');
    assert.equal(eligibility.recommendedEvent.command, 'review');
    assert.equal(eligibility.recommendedEvent.commandName, 'symphony goal review');
    assert.equal(eligibility.previewRequest, null);
    assert.equal(eligibility.allowedEvents.includes('reviewer.approved'), false);
    assert.ok(eligibility.blockedEvents.some((event) => (
      event.eventType === 'reviewer.approved' &&
      event.commandName === 'symphony goal review'
    )));
  });

  it('routes main verification to symphony goal gate instead of goal update', () => {
    const eligibility = buildSupervisorEventRegistrationEligibility({
      goalId: GOAL_ID,
      pendingResult: pendingResult(workerResult({
        role: 'main-verifier',
        eventToRegister: 'main.verification-passed'
      })),
      threadContinuationDecision: checkpointDecision(),
      generatedAt: GENERATED_AT
    });

    assert.equal(eligibility.state, 'blocked');
    assert.equal(eligibility.reason, 'event-routed-to-goal-gate');
    assert.equal(eligibility.recommendedEvent.command, 'gate');
    assert.equal(eligibility.recommendedEvent.commandName, 'symphony goal gate');
    assert.equal(eligibility.previewRequest, null);
    assert.equal(eligibility.allowedEvents.includes('main.verification-passed'), false);
  });

  it('routes release gates to symphony goal gate instead of goal update', () => {
    const eligibility = buildSupervisorEventRegistrationEligibility({
      goalId: GOAL_ID,
      pendingResult: pendingResult(workerResult({
        role: 'release-manager',
        taskId: null,
        eventToRegister: 'release.gate-passed'
      })),
      threadContinuationDecision: checkpointDecision({
        taskId: null
      }),
      generatedAt: GENERATED_AT
    });

    assert.equal(eligibility.state, 'blocked');
    assert.equal(eligibility.reason, 'event-routed-to-goal-gate');
    assert.equal(eligibility.recommendedEvent.command, 'gate');
    assert.equal(eligibility.recommendedEvent.commandName, 'symphony goal gate');
    assert.ok(eligibility.blockedEvents.some((event) => (
      event.eventType === 'release.gate-passed' &&
      event.commandName === 'symphony goal gate'
    )));
  });

  it('blocks eligibility when supervisor continuation is blocked by missing transcript state', () => {
    const eligibility = buildSupervisorEventRegistrationEligibility({
      goalId: GOAL_ID,
      pendingResult: pendingResult(workerResult({
        eventToRegister: 'worker.evidence-recorded'
      })),
      threadContinuationDecision: {
        ...checkpointDecision(),
        decision: 'blocked',
        reason: 'no-readable-session-transcript',
        blockedFields: ['transcriptAvailability']
      },
      generatedAt: GENERATED_AT
    });

    assert.equal(eligibility.state, 'blocked');
    assert.equal(eligibility.reason, 'no-readable-session-transcript');
    assert.ok(eligibility.missingInputs.includes('transcriptAvailability'));
    assert.equal(eligibility.previewRequest, null);
  });

  it('projects eligibility from the app read model without changing v49 read-only boundaries', () => {
    const model = buildGoalSupervisorAppReadModel({
      goalId: GOAL_ID,
      coreProjection: {
        contractName: 'goal-supervisor-core-projection.v1',
        goalId: GOAL_ID,
        current: {
          taskId: TASK_ID,
          role: 'worker',
          threadId: THREAD_ID
        },
        route: {
          state: 'active',
          current: {
            taskId: TASK_ID,
            role: 'worker',
            threadId: THREAD_ID
          },
          pendingResult: {
            source: 'recorded-result-state',
            result: workerResult({
              eventToRegister: 'worker.evidence-recorded'
            })
          }
        },
        progress: {},
        routeInput: {
          resultIntake: {
            source: 'thread-result',
            status: 'pending',
            record: workerResult({
              eventToRegister: 'worker.evidence-recorded'
            }),
            reason: 'valid-result-awaits-registration'
          }
        }
      },
      sessionContext: {
        transcriptAvailability: 'readable',
        missingTranscriptState: {
          missing: false,
          reason: null
        },
        staleTranscriptState: {
          stale: false,
          reason: null
        },
        resultBlockEvidence: {
          status: 'present',
          present: true,
          evidenceRef: EVIDENCE_REF
        },
        contextUtilization: {
          status: 'available',
          ratio: 0.2
        }
      },
      nowMs: Date.parse(GENERATED_AT)
    });

    assert.equal(model.readOnly, true);
    assert.equal(model.willMutate, false);
    assert.equal(model.threadContinuationDecision.contractName, 'threadContinuationDecision.v1');
    assert.equal(model.supervisorEventRegistrationEligibility.contractName, SUPERVISOR_EVENT_REGISTRATION_ELIGIBILITY_CONTRACT_NAME);
    assert.equal(model.supervisorEventRegistrationEligibility.state, 'eligible');
    assert.equal(model.supervisorEventRegistrationEligibility.boundaries.providerLaunchAvailable, false);
    assert.equal(model.supervisorEventRegistrationEligibility.boundaries.eventLogWriteAvailable, false);
    assertNoUnsafePayload(model.supervisorEventRegistrationEligibility);
  });
});

function pendingResult(record) {
  return {
    status: 'pending',
    reason: 'valid-result-awaits-registration',
    record
  };
}

function workerResult(overrides = {}) {
  return {
    goalId: GOAL_ID,
    taskId: TASK_ID,
    role: 'worker',
    threadId: THREAD_ID,
    eventToRegister: 'worker.evidence-recorded',
    evidenceRef: EVIDENCE_REF,
    branch: 'codex/v50-supervisor-event-eligibility-projection',
    headCommit: 'abcdef1234567890',
    ...overrides
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
    threadId: THREAD_ID,
    checkpointRef: EVIDENCE_REF,
    blockedFields: [],
    requiredEvidence: ['pending-result-registration'],
    sourceContracts: [
      {
        contractName: 'contextAdvisory.v1',
        contractVersion: 1,
        generatedAt: GENERATED_AT,
        readOnly: true
      }
    ],
    ...overrides
  };
}

function assertNoUnsafePayload(value) {
  const serialized = JSON.stringify(value).toLowerCase();

  assert.equal(serialized.includes('/users/andy'), false);
  assert.equal(serialized.includes('.jsonl'), false);
  assert.equal(serialized.includes('rawtranscript'), false);
  assert.equal(serialized.includes('stdout'), false);
  assert.equal(serialized.includes('prompt'), false);
  assert.equal(serialized.includes('secret'), false);
  assert.equal(serialized.includes('file:'), false);
}
