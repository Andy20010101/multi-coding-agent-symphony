import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile, mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { createSymphonyConsoleServer } from '../src/symphony/console.js';
import {
  EVIDENCE_TIMELINE_CONTRACT_NAME,
  EVIDENCE_TIMELINE_CONTRACT_VERSION,
  RELEASE_BUNDLE_CONTRACT_NAME,
  RELEASE_BUNDLE_CONTRACT_VERSION,
  buildEvidenceTimelineContract,
  validateEvidenceTimelineContract,
  assertEvidenceTimelineContract,
  buildReleaseBundleContract,
  validateReleaseBundleContract,
  assertReleaseBundleContract
} from '../src/symphony/evidence-timeline-contract.js';
import {
  READONLY_API_ROUTE_ALLOWLIST
} from '../frontend/workbench/src/api/contracts.js';

const V36_GOAL_ID = 'v36-artifact-evidence-index-workspace';

function makeEvidenceRef(ref) {
  return { kind: 'repo-doc', ref, label: ref };
}

function makeEvent(overrides = {}) {
  return {
    eventId: `evt_${overrides.eventType ?? 'unknown'}_001`,
    sequence: 1,
    goalId: V36_GOAL_ID,
    taskId: 'task-1',
    phase: 'implement',
    actor: { id: 'claude-agent', role: 'worker' },
    occurredAt: '2026-06-03T00:00:00.000Z',
    recordedAt: '2026-06-03T00:00:01.000Z',
    branch: null,
    commit: null,
    evidenceRefs: [],
    statement: 'test event',
    previousEventHash: null,
    eventHash: 'sha256:0000000000000000000000000000000000000000000000000000000000000000',
    ...overrides
  };
}

describe('v36 task-4 evidence timeline contract', () => {
  const SAMPLE_ENTRIES = [
    {
      artifact_ref: 'task-1/worker-evidence',
      content_hash: 'sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      kind: 'evidence',
      goal_id: V36_GOAL_ID,
      task_id: 'task-1',
      run_id: null,
      job_id: null,
      evidence_kind: 'worker',
      timestamps: {
        created_at: '2026-06-03T00:00:00.000Z',
        indexed_at: '2026-06-03T01:00:00.000Z'
      },
      labels: ['evidence', 'worker'],
      file_path: null
    },
    {
      artifact_ref: 'task-1/review-evidence',
      content_hash: 'sha256:bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
      kind: 'evidence',
      goal_id: V36_GOAL_ID,
      task_id: 'task-1',
      run_id: null,
      job_id: null,
      evidence_kind: 'reviewer',
      timestamps: {
        created_at: '2026-06-03T00:30:00.000Z',
        indexed_at: '2026-06-03T01:00:00.000Z'
      },
      labels: ['evidence', 'reviewer'],
      file_path: null
    }
  ];

  const SAMPLE_GOAL_EVENTS = [
    makeEvent({
      eventId: 'evt_worker_001',
      eventType: 'worker.evidence-recorded',
      actor: { id: 'claude-v36-task-1-worker', role: 'worker' },
      evidenceRefs: [makeEvidenceRef('docs/plans/v36-task-1-worker-evidence-2026-06-02.md')]
    }),
    makeEvent({
      eventId: 'evt_reviewer_001',
      eventType: 'reviewer.approved',
      actor: { id: 'claude-v36-task-1-reviewer', role: 'reviewer' },
      occurredAt: '2026-06-03T00:35:00.000Z',
      review: { verdict: 'APPROVED' },
      evidenceRefs: [makeEvidenceRef('docs/plans/v36-task-1-review-evidence-2026-06-02.md')]
    }),
    makeEvent({
      eventId: 'evt_mainver_001',
      eventType: 'main.verification-passed',
      actor: { id: 'codex-v36-main-verifier', role: 'main-verifier' },
      occurredAt: '2026-06-03T01:00:00.000Z',
      gate: { name: 'main-verification', status: 'passed' },
      evidenceRefs: [makeEvidenceRef('docs/plans/v36-task-1-main-verification-evidence-2026-06-02.md')]
    })
  ];

  it('builds a valid evidence timeline contract with entries', () => {
    const contract = buildEvidenceTimelineContract({
      goalId: V36_GOAL_ID,
      taskId: 'task-1',
      entries: SAMPLE_ENTRIES,
      goalEvents: SAMPLE_GOAL_EVENTS
    });

    assert.equal(contract.contractName, EVIDENCE_TIMELINE_CONTRACT_NAME);
    assert.equal(contract.contractVersion, EVIDENCE_TIMELINE_CONTRACT_VERSION);
    assert.equal(contract.readOnly, true);
    assert.ok(typeof contract.generatedAt === 'string');
    assert.ok(Array.isArray(contract.timeline));
    assert.ok(contract.timeline.length >= 2);
  });

  it('validates a correct evidence timeline contract', () => {
    const contract = buildEvidenceTimelineContract({
      goalId: V36_GOAL_ID,
      taskId: 'task-1',
      entries: SAMPLE_ENTRIES,
      goalEvents: SAMPLE_GOAL_EVENTS
    });
    const result = validateEvidenceTimelineContract(contract);

    assert.equal(result.ok, true);
    assert.deepEqual(result.errors, []);
  });

  it('rejects an evidence timeline contract with wrong contract name', () => {
    const contract = buildEvidenceTimelineContract({ goalId: V36_GOAL_ID });
    const mutated = { ...contract, contractName: 'wrong-name.v1' };
    const result = validateEvidenceTimelineContract(mutated);

    assert.equal(result.ok, false);
    assert.ok(result.errors.some((e) => e.includes('contractName')));
  });

  it('rejects an evidence timeline contract with readOnly set to false', () => {
    const contract = buildEvidenceTimelineContract({ goalId: V36_GOAL_ID });
    const mutated = { ...contract, readOnly: false };
    const result = validateEvidenceTimelineContract(mutated);

    assert.equal(result.ok, false);
  });

  it('assertEvidenceTimelineContract throws on invalid contract', () => {
    assert.throws(() => {
      assertEvidenceTimelineContract({ contractName: 'wrong' });
    }, /Invalid evidence timeline contract/);
  });

  it('has disabled boundaries for shell, model, and file access', () => {
    const contract = buildEvidenceTimelineContract({ goalId: V36_GOAL_ID });

    assert.equal(contract.boundaries.readOnly, true);
    assert.equal(contract.boundaries.shellExecutionAvailable, false);
    assert.equal(contract.boundaries.modelInvocationAvailable, false);
    assert.equal(contract.boundaries.arbitraryPathReadAvailable, false);
    assert.equal(contract.boundaries.arbitraryCommandExecutionAvailable, false);
    assert.equal(contract.boundaries.gitWriteAvailable, false);
    assert.equal(contract.boundaries.mergeAvailable, false);
    assert.equal(contract.boundaries.pushAvailable, false);
    assert.equal(contract.boundaries.tagAvailable, false);
    assert.equal(contract.boundaries.publishAvailable, false);
    assert.equal(contract.boundaries.artifactDownloadAvailable, false);
    assert.equal(contract.boundaries.localFileOpenAvailable, false);
    assert.equal(contract.boundaries.selfApprovalAvailable, false);
    assert.equal(contract.boundaries.secondArtifactStoreAvailable, false);
  });

  it('sorts timeline entries by timestamp', () => {
    const earlyEntries = [{
      artifact_ref: 'task-1/early',
      content_hash: 'sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      kind: 'evidence',
      goal_id: 'v36-test',
      task_id: 'task-1',
      run_id: null,
      job_id: null,
      evidence_kind: 'worker',
      timestamps: {
        created_at: '2026-06-01T00:00:00.000Z',
        indexed_at: '2026-06-01T00:00:00.000Z'
      },
      labels: [],
      file_path: null
    }];

    const lateEntries = [{
      artifact_ref: 'task-1/late',
      content_hash: 'sha256:bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
      kind: 'evidence',
      goal_id: 'v36-test',
      task_id: 'task-1',
      run_id: null,
      job_id: null,
      evidence_kind: 'reviewer',
      timestamps: {
        created_at: '2026-06-03T00:00:00.000Z',
        indexed_at: '2026-06-03T00:00:00.000Z'
      },
      labels: [],
      file_path: null
    }];

    const contract = buildEvidenceTimelineContract({
      goalId: 'v36-test',
      entries: [...lateEntries, ...earlyEntries]
    });

    const timeline = contract.timeline;
    assert.ok(timeline.length >= 2);
    const firstTs = timeline[0].timestamp;
    const secondTs = timeline[1].timestamp;

    if (firstTs !== null && secondTs !== null) {
      assert.ok(firstTs <= secondTs, 'Timeline should be sorted by timestamp ascending');
    }
  });
});

describe('v36 task-4 release bundle contract — real managed goal event types', () => {
  it('groups worker.evidence-recorded into workerEvidence', () => {
    const events = [
      makeEvent({
        eventType: 'worker.evidence-recorded',
        taskId: 'task-1',
        actor: { id: 'worker-agent', role: 'worker' },
        evidenceRefs: [makeEvidenceRef('docs/plans/worker-ev.md')]
      })
    ];

    const contract = buildReleaseBundleContract({
      goalId: V36_GOAL_ID,
      entries: [],
      goalEvents: events
    });

    assert.equal(contract.bundle.taskCount, 1);
    const task = contract.bundle.tasks[0];
    assert.equal(task.taskId, 'task-1');
    assert.equal(task.workerEvidence.length, 1);
    assert.equal(task.workerEvidence[0].actor, 'worker-agent');
    assert.equal(task.reviewEvidence.length, 0);
    assert.equal(task.mainVerification.length, 0);
    assert.equal(task.releaseEvidence.length, 0);
  });

  it('groups reviewer.approved into reviewEvidence with event.review.verdict', () => {
    const events = [
      makeEvent({
        eventType: 'reviewer.approved',
        taskId: 'task-1',
        actor: { id: 'reviewer-agent', role: 'reviewer' },
        review: { verdict: 'APPROVED' },
        evidenceRefs: [makeEvidenceRef('docs/plans/review-ev.md')]
      })
    ];

    const contract = buildReleaseBundleContract({
      goalId: V36_GOAL_ID,
      entries: [],
      goalEvents: events
    });

    const task = contract.bundle.tasks[0];
    assert.equal(task.reviewEvidence.length, 1);
    assert.equal(task.reviewEvidence[0].verdict, 'APPROVED');
    assert.equal(task.reviewEvidence[0].reviewer, 'reviewer-agent');
    assert.equal(task.reviewEvidence[0].evidenceRefs[0], 'docs/plans/review-ev.md');
  });

  it('groups reviewer.needs-revision into reviewEvidence with NEEDS_REVISION verdict', () => {
    const events = [
      makeEvent({
        eventType: 'reviewer.needs-revision',
        taskId: 'task-1',
        actor: { id: 'reviewer-agent', role: 'reviewer' },
        review: { verdict: 'NEEDS_REVISION' },
        evidenceRefs: [makeEvidenceRef('docs/plans/review-revision-ev.md')]
      })
    ];

    const contract = buildReleaseBundleContract({
      goalId: V36_GOAL_ID,
      entries: [],
      goalEvents: events
    });

    const task = contract.bundle.tasks[0];
    assert.equal(task.reviewEvidence.length, 1);
    assert.equal(task.reviewEvidence[0].verdict, 'NEEDS_REVISION');
  });

  it('groups main.verification-passed into mainVerification with event.gate.status', () => {
    const events = [
      makeEvent({
        eventType: 'main.verification-passed',
        taskId: 'task-1',
        actor: { id: 'main-verifier-agent', role: 'main-verifier' },
        gate: { name: 'main-verification', status: 'passed' },
        evidenceRefs: [makeEvidenceRef('docs/plans/main-verification-ev.md')]
      })
    ];

    const contract = buildReleaseBundleContract({
      goalId: V36_GOAL_ID,
      entries: [],
      goalEvents: events
    });

    const task = contract.bundle.tasks[0];
    assert.equal(task.mainVerification.length, 1);
    assert.equal(task.mainVerification[0].status, 'passed');
    assert.equal(task.mainVerification[0].gate, 'main-verification');
    assert.equal(task.mainVerification[0].verifier, 'main-verifier-agent');
  });

  it('groups main.verification-failed into mainVerification with failed gate status', () => {
    const events = [
      makeEvent({
        eventType: 'main.verification-failed',
        taskId: 'task-1',
        actor: { id: 'main-verifier-agent', role: 'main-verifier' },
        gate: { name: 'main-verification', status: 'failed' },
        evidenceRefs: [makeEvidenceRef('docs/plans/main-verification-fail-ev.md')]
      })
    ];

    const contract = buildReleaseBundleContract({
      goalId: V36_GOAL_ID,
      entries: [],
      goalEvents: events
    });

    const task = contract.bundle.tasks[0];
    assert.equal(task.mainVerification.length, 1);
    assert.equal(task.mainVerification[0].status, 'failed');
  });

  it('records release.gate-passed in releaseGates but does NOT set releaseReady', () => {
    const events = [
      makeEvent({
        eventType: 'release.gate-passed',
        taskId: 'task-1',
        actor: { id: 'release-verifier', role: 'release-verifier' },
        gate: { name: 'pnpmCheck', status: 'passed' },
        evidenceRefs: [makeEvidenceRef('docs/plans/gate-ev.md')]
      })
    ];

    const contract = buildReleaseBundleContract({
      goalId: V36_GOAL_ID,
      entries: [],
      goalEvents: events
    });

    assert.equal(contract.bundle.releaseGates.length, 1);
    assert.equal(contract.bundle.releaseGates[0].gate, 'pnpmCheck');
    assert.equal(contract.bundle.releaseGates[0].status, 'passed');
    assert.equal(contract.bundle.releaseGates[0].verifier, 'release-verifier');

    // release.gate-passed must NOT set releaseReady
    assert.equal(contract.bundle.releaseReady, false);
  });

  it('records release.gate-failed in releaseGates without setting releaseReady', () => {
    const events = [
      makeEvent({
        eventType: 'release.gate-failed',
        taskId: 'task-1',
        actor: { id: 'release-verifier', role: 'release-verifier' },
        gate: { name: 'auditHigh', status: 'failed' },
        evidenceRefs: [makeEvidenceRef('docs/plans/gate-fail-ev.md')]
      })
    ];

    const contract = buildReleaseBundleContract({
      goalId: V36_GOAL_ID,
      entries: [],
      goalEvents: events
    });

    assert.equal(contract.bundle.releaseGates.length, 1);
    assert.equal(contract.bundle.releaseGates[0].gate, 'auditHigh');
    assert.equal(contract.bundle.releaseGates[0].status, 'failed');
    assert.equal(contract.bundle.releaseReady, false);
  });

  it('release.ready-declared sets releaseReady = true and records in releaseGates', () => {
    const events = [
      makeEvent({
        eventType: 'release.ready-declared',
        taskId: null,
        actor: { id: 'release-manager-agent', role: 'release-manager' },
        gate: { name: 'release.ready', status: 'declared' },
        evidenceRefs: [makeEvidenceRef('docs/plans/release-evidence.md')]
      })
    ];

    const contract = buildReleaseBundleContract({
      goalId: V36_GOAL_ID,
      entries: [],
      goalEvents: events
    });

    assert.equal(contract.bundle.releaseReady, true);
    assert.equal(contract.bundle.releaseGates.length, 1);
    assert.equal(contract.bundle.releaseGates[0].gate, 'release.ready');
    assert.equal(contract.bundle.releaseGates[0].status, 'declared');
  });

  it('releaseReady stays false when only release.gate-passed events exist', () => {
    const events = [
      makeEvent({
        eventType: 'release.gate-passed',
        taskId: 'task-1',
        actor: { id: 'rv-1', role: 'release-verifier' },
        gate: { name: 'pnpmCheck', status: 'passed' },
        evidenceRefs: [makeEvidenceRef('docs/e1.md')]
      }),
      makeEvent({
        eventId: 'evt_rg2',
        sequence: 2,
        eventType: 'release.gate-passed',
        taskId: 'task-2',
        actor: { id: 'rv-2', role: 'release-verifier' },
        gate: { name: 'pnpmTest', status: 'passed' },
        evidenceRefs: [makeEvidenceRef('docs/e2.md')]
      }),
      makeEvent({
        eventId: 'evt_rg3',
        sequence: 3,
        eventType: 'release.gate-passed',
        taskId: 'task-3',
        actor: { id: 'rv-3', role: 'release-verifier' },
        gate: { name: 'workbenchBuild', status: 'passed' },
        evidenceRefs: [makeEvidenceRef('docs/e3.md')]
      })
    ];

    const contract = buildReleaseBundleContract({
      goalId: V36_GOAL_ID,
      entries: [],
      goalEvents: events
    });

    // Three release gates recorded
    assert.equal(contract.bundle.releaseGates.length, 3);

    // But releaseReady must still be false — only release.ready-declared sets it
    assert.equal(contract.bundle.releaseReady, false,
      'release.ready-declared is the only event type that sets releaseReady');
  });

  it('full v36 task flow: worker → reviewer.approved → main.verification-passed → release.gate-passed → release.ready-declared', () => {
    const events = [
      makeEvent({
        eventId: 'evt_flow_1',
        eventType: 'worker.evidence-recorded',
        taskId: 'task-1',
        actor: { id: 'worker-1', role: 'worker' },
        evidenceRefs: [makeEvidenceRef('docs/plans/t1-worker.md')]
      }),
      makeEvent({
        eventId: 'evt_flow_2',
        sequence: 2,
        eventType: 'reviewer.approved',
        taskId: 'task-1',
        actor: { id: 'reviewer-1', role: 'reviewer' },
        review: { verdict: 'APPROVED' },
        evidenceRefs: [makeEvidenceRef('docs/plans/t1-review.md')]
      }),
      makeEvent({
        eventId: 'evt_flow_3',
        sequence: 3,
        eventType: 'main.verification-passed',
        taskId: 'task-1',
        actor: { id: 'main-verifier-1', role: 'main-verifier' },
        gate: { name: 'main-verification', status: 'passed' },
        evidenceRefs: [makeEvidenceRef('docs/plans/t1-main.md')]
      }),
      makeEvent({
        eventId: 'evt_flow_4',
        sequence: 4,
        eventType: 'release.gate-passed',
        taskId: 'task-1',
        actor: { id: 'rv-1', role: 'release-verifier' },
        gate: { name: 'pnpmCheck', status: 'passed' },
        evidenceRefs: [makeEvidenceRef('docs/plans/gate-check.md')]
      }),
      makeEvent({
        eventId: 'evt_flow_5',
        sequence: 5,
        eventType: 'release.ready-declared',
        taskId: null,
        actor: { id: 'rm-1', role: 'release-manager' },
        gate: { name: 'release.ready', status: 'declared' },
        evidenceRefs: [makeEvidenceRef('docs/plans/release.md')]
      })
    ];

    const contract = buildReleaseBundleContract({
      goalId: V36_GOAL_ID,
      entries: [],
      goalEvents: events
    });

    // Task grouping
    assert.equal(contract.bundle.taskCount, 1);
    const task = contract.bundle.tasks[0];
    assert.equal(task.taskId, 'task-1');

    // worker evidence
    assert.equal(task.workerEvidence.length, 1);
    assert.equal(task.workerEvidence[0].actor, 'worker-1');
    assert.deepEqual(task.workerEvidence[0].evidenceRefs, ['docs/plans/t1-worker.md']);

    // review evidence
    assert.equal(task.reviewEvidence.length, 1);
    assert.equal(task.reviewEvidence[0].verdict, 'APPROVED');
    assert.equal(task.reviewEvidence[0].reviewer, 'reviewer-1');

    // main verification
    assert.equal(task.mainVerification.length, 1);
    assert.equal(task.mainVerification[0].gate, 'main-verification');
    assert.equal(task.mainVerification[0].status, 'passed');

    // release gates (including release.ready-declared)
    assert.equal(contract.bundle.releaseGates.length, 2);

    const pnpmGate = contract.bundle.releaseGates.find((g) => g.gate === 'pnpmCheck');
    assert.ok(pnpmGate !== undefined);
    assert.equal(pnpmGate.status, 'passed');

    const releaseReadyGate = contract.bundle.releaseGates.find((g) => g.gate === 'release.ready');
    assert.ok(releaseReadyGate !== undefined);
    assert.equal(releaseReadyGate.status, 'declared');

    // releaseReady must only come from release.ready-declared
    assert.equal(contract.bundle.releaseReady, true);
  });
});

describe('v36 task-4 release bundle — deduplication (goalEvents + artifact index entries)', () => {
  const SHARED_EVIDENCE_REF = 'docs/plans/v36-task-1-worker-evidence-2026-06-02.md';

  it('does not double-count worker evidence when both goal event and index entry carry same ref', () => {
    const goalEvents = [
      makeEvent({
        eventId: 'evt_w_001',
        eventType: 'worker.evidence-recorded',
        taskId: 'task-1',
        actor: { id: 'worker-agent', role: 'worker' },
        evidenceRefs: [makeEvidenceRef(SHARED_EVIDENCE_REF)]
      })
    ];

    const artifactEntries = [
      {
        artifact_ref: SHARED_EVIDENCE_REF,
        content_hash: 'sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
        kind: 'evidence',
        goal_id: V36_GOAL_ID,
        task_id: 'task-1',
        evidence_kind: 'worker',
        timestamps: { created_at: '2026-06-03T00:00:00.000Z', indexed_at: '2026-06-03T01:00:00.000Z' },
        labels: [],
        file_path: null
      }
    ];

    const contract = buildReleaseBundleContract({
      goalId: V36_GOAL_ID,
      entries: artifactEntries,
      goalEvents
    });

    const task = contract.bundle.tasks[0];

    // Must be 1, not 2 — artifact index entry is skipped because goal event already covered the ref
    assert.equal(task.workerEvidence.length, 1,
      'workerEvidence should have exactly 1 entry; goal event version is kept, index duplicate is dropped');
    assert.equal(task.workerEvidence[0].actor, 'worker-agent');
    assert.deepEqual(task.workerEvidence[0].evidenceRefs, [SHARED_EVIDENCE_REF]);
  });

  it('does not double-count review evidence; preserves verdict and reviewer id', () => {
    const goalEvents = [
      makeEvent({
        eventId: 'evt_r_001',
        eventType: 'reviewer.approved',
        taskId: 'task-1',
        actor: { id: 'reviewer-agent', role: 'reviewer' },
        review: { verdict: 'APPROVED' },
        evidenceRefs: [makeEvidenceRef('docs/plans/t1-review.md')]
      })
    ];

    const artifactEntries = [
      {
        artifact_ref: 'docs/plans/t1-review.md',
        content_hash: 'sha256:bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
        kind: 'evidence',
        goal_id: V36_GOAL_ID,
        task_id: 'task-1',
        evidence_kind: 'reviewer',
        timestamps: { created_at: '2026-06-03T00:30:00.000Z', indexed_at: '2026-06-03T01:00:00.000Z' },
        labels: [],
        file_path: null
      }
    ];

    const contract = buildReleaseBundleContract({
      goalId: V36_GOAL_ID,
      entries: artifactEntries,
      goalEvents
    });

    const task = contract.bundle.tasks[0];

    assert.equal(task.reviewEvidence.length, 1,
      'reviewEvidence should be 1, not 2');
    assert.equal(task.reviewEvidence[0].verdict, 'APPROVED',
      'verdict must be preserved from goal event version');
    assert.equal(task.reviewEvidence[0].reviewer, 'reviewer-agent',
      'reviewer id must be preserved from goal event version');
  });

  it('does not double-count main verification; preserves gate/status/verifier', () => {
    const goalEvents = [
      makeEvent({
        eventId: 'evt_m_001',
        eventType: 'main.verification-passed',
        taskId: 'task-1',
        actor: { id: 'main-verifier-agent', role: 'main-verifier' },
        gate: { name: 'main-verification', status: 'passed' },
        evidenceRefs: [makeEvidenceRef('docs/plans/t1-main.md')]
      })
    ];

    const artifactEntries = [
      {
        artifact_ref: 'docs/plans/t1-main.md',
        content_hash: 'sha256:cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc',
        kind: 'evidence',
        goal_id: V36_GOAL_ID,
        task_id: 'task-1',
        evidence_kind: 'main-verifier',
        timestamps: { created_at: '2026-06-03T01:00:00.000Z', indexed_at: '2026-06-03T01:00:00.000Z' },
        labels: [],
        file_path: null
      }
    ];

    const contract = buildReleaseBundleContract({
      goalId: V36_GOAL_ID,
      entries: artifactEntries,
      goalEvents
    });

    const task = contract.bundle.tasks[0];

    assert.equal(task.mainVerification.length, 1,
      'mainVerification should be 1, not 2');
    assert.equal(task.mainVerification[0].gate, 'main-verification');
    assert.equal(task.mainVerification[0].status, 'passed');
    assert.equal(task.mainVerification[0].verifier, 'main-verifier-agent');
  });

  it('still includes artifact-only evidence as supplement (not covered by any goal event)', () => {
    const goalEvents = [
      makeEvent({
        eventId: 'evt_w_001',
        eventType: 'worker.evidence-recorded',
        taskId: 'task-1',
        actor: { id: 'worker-agent', role: 'worker' },
        evidenceRefs: [makeEvidenceRef('docs/plans/only-in-event.md')]
      })
    ];

    const artifactEntries = [
      {
        artifact_ref: 'docs/plans/only-in-event.md',  // covered → skipped
        content_hash: 'sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
        kind: 'evidence',
        goal_id: V36_GOAL_ID,
        task_id: 'task-1',
        evidence_kind: 'worker',
        timestamps: { created_at: '2026-06-03T00:00:00.000Z' },
        labels: [],
        file_path: null
      },
      {
        artifact_ref: 'docs/plans/only-in-artifact.md',  // not covered → supplement
        content_hash: 'sha256:dddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd',
        kind: 'evidence',
        goal_id: V36_GOAL_ID,
        task_id: 'task-1',
        evidence_kind: 'worker',
        timestamps: { created_at: '2026-06-03T00:10:00.000Z' },
        labels: ['supplemental'],
        file_path: null
      }
    ];

    const contract = buildReleaseBundleContract({
      goalId: V36_GOAL_ID,
      entries: artifactEntries,
      goalEvents
    });

    const task = contract.bundle.tasks[0];

    // 2 total: 1 from goal event + 1 artifact-only supplement
    assert.equal(task.workerEvidence.length, 2);
    assert.equal(task.workerEvidence[0].actor, 'worker-agent');
    assert.equal(task.workerEvidence[1].artifact_ref, 'docs/plans/only-in-artifact.md');
    assert.deepEqual(task.workerEvidence[1].labels, ['supplemental']);
  });

  it('releaseReady stays false with only release.gate-passed, even with artifact entries', () => {
    const goalEvents = [
      makeEvent({
        eventId: 'evt_rg_001',
        eventType: 'release.gate-passed',
        taskId: 'task-1',
        actor: { id: 'rv-1', role: 'release-verifier' },
        gate: { name: 'pnpmCheck', status: 'passed' },
        evidenceRefs: [makeEvidenceRef('docs/plans/gate.md')]
      })
    ];

    const artifactEntries = [
      {
        artifact_ref: 'docs/plans/gate.md',
        content_hash: 'sha256:eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
        kind: 'evidence',
        goal_id: V36_GOAL_ID,
        task_id: 'task-1',
        evidence_kind: 'release-manager',
        timestamps: { created_at: '2026-06-03T00:00:00.000Z' },
        labels: [],
        file_path: null
      }
    ];

    const contract = buildReleaseBundleContract({
      goalId: V36_GOAL_ID,
      entries: artifactEntries,
      goalEvents
    });

    assert.equal(contract.bundle.releaseGates.length, 1);
    assert.equal(contract.bundle.releaseReady, false);
  });

  it('deduplicates release gates by eventId', () => {
    const goalEvents = [
      makeEvent({
        eventId: 'evt_rg_dup',
        eventType: 'release.gate-passed',
        taskId: 'task-1',
        actor: { id: 'rv-1', role: 'release-verifier' },
        gate: { name: 'pnpmCheck', status: 'passed' },
        evidenceRefs: [makeEvidenceRef('docs/plans/gate.md')]
      }),
      // Same eventId — must not create a second gate entry
      makeEvent({
        eventId: 'evt_rg_dup',
        sequence: 2,
        eventType: 'release.gate-passed',
        taskId: 'task-2',
        actor: { id: 'rv-2', role: 'release-verifier' },
        gate: { name: 'pnpmCheck', status: 'passed' },
        evidenceRefs: [makeEvidenceRef('docs/plans/gate-dup.md')]
      })
    ];

    const contract = buildReleaseBundleContract({
      goalId: V36_GOAL_ID,
      entries: [],
      goalEvents
    });

    // Only 1 release gate despite 2 events with same eventId
    assert.equal(contract.bundle.releaseGates.length, 1,
      'duplicate release gate by eventId must be dropped');
  });
});

describe('v36 task-4 release bundle contract — basic validation', () => {
  it('builds a valid empty release bundle contract', () => {
    const contract = buildReleaseBundleContract({
      goalId: V36_GOAL_ID,
      entries: [],
      goalEvents: []
    });

    assert.equal(contract.contractName, RELEASE_BUNDLE_CONTRACT_NAME);
    assert.equal(contract.contractVersion, RELEASE_BUNDLE_CONTRACT_VERSION);
    assert.equal(contract.readOnly, true);
    assert.ok(typeof contract.generatedAt === 'string');
    assert.ok(typeof contract.bundle === 'object');
    assert.equal(contract.bundle.goalId, V36_GOAL_ID);
    assert.ok(Array.isArray(contract.bundle.tasks));
    assert.ok(Array.isArray(contract.bundle.releaseGates));
    assert.equal(contract.bundle.releaseReady, false);
  });

  it('validates a correct release bundle contract', () => {
    const contract = buildReleaseBundleContract({
      goalId: V36_GOAL_ID,
      entries: [],
      goalEvents: []
    });
    const result = validateReleaseBundleContract(contract);

    assert.equal(result.ok, true);
    assert.deepEqual(result.errors, []);
  });

  it('rejects a release bundle with mismatched contract name', () => {
    const contract = buildReleaseBundleContract({ goalId: V36_GOAL_ID });
    const mutated = { ...contract, contractName: 'wrong-bundle.v1' };
    const result = validateReleaseBundleContract(mutated);

    assert.equal(result.ok, false);
  });

  it('rejects a release bundle with readOnly set to false', () => {
    const contract = buildReleaseBundleContract({ goalId: V36_GOAL_ID });
    const mutated = { ...contract, readOnly: false };
    const result = validateReleaseBundleContract(mutated);

    assert.equal(result.ok, false);
  });

  it('assertReleaseBundleContract throws on invalid contract', () => {
    assert.throws(() => {
      assertReleaseBundleContract({ contractName: 'wrong' });
    }, /Invalid release bundle contract/);
  });

  it('has disabled boundaries including release decision', () => {
    const contract = buildReleaseBundleContract({ goalId: V36_GOAL_ID });

    assert.equal(contract.boundaries.readOnly, true);
    assert.equal(contract.boundaries.shellExecutionAvailable, false);
    assert.equal(contract.boundaries.modelInvocationAvailable, false);
    assert.equal(contract.boundaries.arbitraryPathReadAvailable, false);
    assert.equal(contract.boundaries.gitWriteAvailable, false);
    assert.equal(contract.boundaries.publishAvailable, false);
    assert.equal(contract.boundaries.artifactDownloadAvailable, false);
    assert.equal(contract.boundaries.localFileOpenAvailable, false);
    assert.equal(contract.boundaries.selfApprovalAvailable, false);
    assert.equal(contract.boundaries.releaseDecisionAvailable, false);
  });
});

describe('v36 task-4 route allowlist', () => {
  it('includes evidence timeline route in READONLY_API_ROUTE_ALLOWLIST', () => {
    const found = READONLY_API_ROUTE_ALLOWLIST.find(
      (route) => route.path === '/api/evidence/timeline'
    );

    assert.ok(found !== undefined, 'Evidence timeline route should be in allowlist');
    assert.equal(found.method, 'GET');
    assert.equal(found.contractName, EVIDENCE_TIMELINE_CONTRACT_NAME);
  });

  it('includes release bundle route in READONLY_API_ROUTE_ALLOWLIST', () => {
    const found = READONLY_API_ROUTE_ALLOWLIST.find(
      (route) => route.path === '/api/release/bundle'
    );

    assert.ok(found !== undefined, 'Release bundle route should be in allowlist');
    assert.equal(found.method, 'GET');
    assert.equal(found.contractName, RELEASE_BUNDLE_CONTRACT_NAME);
  });

  it('evidence timeline route has correct properties in READONLY_API_ROUTE_ALLOWLIST', () => {
    const route = READONLY_API_ROUTE_ALLOWLIST.find(
      (r) => r.path === '/api/evidence/timeline'
    );
    assert.ok(route !== undefined);
    assert.equal(route.id, 'evidenceTimeline');
    assert.equal(route.method, 'GET');
    assert.equal(route.contractName, EVIDENCE_TIMELINE_CONTRACT_NAME);
  });

  it('release bundle route has correct properties in READONLY_API_ROUTE_ALLOWLIST', () => {
    const route = READONLY_API_ROUTE_ALLOWLIST.find(
      (r) => r.path === '/api/release/bundle'
    );
    assert.ok(route !== undefined);
    assert.equal(route.id, 'releaseBundle');
    assert.equal(route.method, 'GET');
    assert.equal(route.contractName, RELEASE_BUNDLE_CONTRACT_NAME);
  });
});

describe('v36 task-4 API routes', () => {
  let server;
  let baseUrl;
  let tmpDir;

  async function startServer() {
    return new Promise((resolve, reject) => {
      const s = createSymphonyConsoleServer({ stateDir: tmpDir });

      s.listen(0, '127.0.0.1', () => {
        const addr = s.address();

        resolve({ server: s, port: addr.port });
      });
    });
  }

  before(async () => {
    tmpDir = await mkdtemp(join(tmpdir(), 'symphony-v36-task4-'));
    await mkdir(join(tmpDir, 'artifacts'), { recursive: true });
    await mkdir(join(tmpDir, 'goals', 'events'), { recursive: true });

    const fixture = await startServer();

    server = fixture.server;
    baseUrl = `http://127.0.0.1:${fixture.port}`;
  });

  after(async () => {
    if (server) {
      server.close();
    }

    if (tmpDir) {
      await rm(tmpDir, { recursive: true, force: true });
    }
  });

  async function get(path) {
    const response = await fetch(`${baseUrl}${path}`);

    return {
      status: response.status,
      headers: response.headers,
      data: await response.json()
    };
  }

  it('GET /api/evidence/timeline returns a valid evidence timeline contract', async () => {
    const artDir = join(tmpDir, 'artifacts', V36_GOAL_ID);

    await mkdir(artDir, { recursive: true });
    await writeFile(
      join(artDir, 'task-1-worker-evidence.json'),
      JSON.stringify({
        evidenceRef: 'docs/plans/v36-task-1-worker-evidence-2026-06-02.md',
        goalId: V36_GOAL_ID,
        taskId: 'task-1',
        kind: 'evidence',
        labels: ['evidence', 'worker']
      })
    );

    const { status, data } = await get(
      `/api/evidence/timeline?goal=${V36_GOAL_ID}`
    );

    assert.equal(status, 200);
    assert.equal(data.contractName, EVIDENCE_TIMELINE_CONTRACT_NAME);
    assert.equal(data.contractVersion, EVIDENCE_TIMELINE_CONTRACT_VERSION);
    assert.equal(data.readOnly, true);
    assert.ok(Array.isArray(data.timeline));
    assert.ok(data.timeline.length >= 1);
    assert.equal(data.boundaries.readOnly, true);
    assert.equal(data.boundaries.shellExecutionAvailable, false);
    assert.equal(data.boundaries.modelInvocationAvailable, false);
    assert.equal(data.boundaries.arbitraryPathReadAvailable, false);
    assert.equal(data.boundaries.gitWriteAvailable, false);
    assert.equal(data.boundaries.publishAvailable, false);
    assert.equal(data.boundaries.artifactDownloadAvailable, false);
    assert.equal(data.boundaries.localFileOpenAvailable, false);
    assert.equal(data.boundaries.selfApprovalAvailable, false);
  });

  it('GET /api/release/bundle returns a valid release bundle contract', async () => {
    const { status, data } = await get(
      `/api/release/bundle?goal=${V36_GOAL_ID}`
    );

    assert.equal(status, 200);
    assert.equal(data.contractName, RELEASE_BUNDLE_CONTRACT_NAME);
    assert.equal(data.contractVersion, RELEASE_BUNDLE_CONTRACT_VERSION);
    assert.equal(data.readOnly, true);
    assert.ok(typeof data.bundle === 'object');
    assert.equal(data.bundle.goalId, V36_GOAL_ID);
    assert.ok(Array.isArray(data.bundle.tasks));
    assert.ok(Array.isArray(data.bundle.releaseGates));
    assert.equal(data.boundaries.readOnly, true);
    assert.equal(data.boundaries.releaseDecisionAvailable, false);
    assert.equal(data.boundaries.shellExecutionAvailable, false);
    assert.equal(data.boundaries.modelInvocationAvailable, false);
    assert.equal(data.boundaries.gitWriteAvailable, false);
    assert.equal(data.boundaries.publishAvailable, false);
    assert.equal(data.boundaries.selfApprovalAvailable, false);
  });

  it('GET /api/evidence/timeline rejects unsafe goal parameter', async () => {
    const unsafeGoal = 'bad/goal';
    const { status, data } = await get(
      `/api/evidence/timeline?goal=${unsafeGoal}`
    );

    assert.equal(status, 400);
    assert.ok(typeof data.error?.code === 'string');
  });

  it('GET /api/evidence/timeline rejects unexpected query parameters', async () => {
    const { status, data } = await get(
      '/api/evidence/timeline?goal=v36-test&unsafe=param'
    );

    assert.equal(status, 400);
  });

  it('GET /api/release/bundle rejects unsafe goal parameter', async () => {
    const unsafeGoal = 'bad/goal';
    const { status, data } = await get(
      `/api/release/bundle?goal=${unsafeGoal}`
    );

    assert.equal(status, 400);
    assert.ok(typeof data.error?.code === 'string');
  });

  it('GET /api/release/bundle rejects unexpected query parameters', async () => {
    const { status, data } = await get(
      '/api/release/bundle?goal=v36-test&extra=value'
    );

    assert.equal(status, 400);
  });

  it('both routes are GET only with no write capability', async () => {
    const routes = ['/api/evidence/timeline', '/api/release/bundle'];

    for (const path of routes) {
      const timelineRoute = READONLY_API_ROUTE_ALLOWLIST.find((r) => r.path === path);

      assert.ok(timelineRoute !== undefined);
      assert.equal(timelineRoute.method, 'GET');
    }
  });
});
