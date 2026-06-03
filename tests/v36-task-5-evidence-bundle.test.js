import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile, mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import {
  EVIDENCE_BUNDLE_CONTRACT_NAME,
  EVIDENCE_BUNDLE_CONTRACT_VERSION,
  summarizeEvent,
  buildEvidenceBundle,
  validateEvidenceBundleContract,
  assertEvidenceBundleContract
} from '../src/symphony/evidence-bundle.js';
import { getManagedGoalEventJournalPath } from '../src/symphony/goal-event-journal.js';
import { computeGoalEventHash } from '../src/symphony/goal-event-contracts.js';

const V36_GOAL_ID = 'v36-artifact-evidence-index-workspace';

function stampEventHashChain(events) {
  let previous = null;
  for (let i = 0; i < events.length; i++) {
    events[i].sequence = i + 1;
    events[i].previousEventHash = previous;
    events[i].eventHash = computeGoalEventHash(events[i]);
    previous = events[i].eventHash;
  }
  return events;
}

function makeTestEvent(overrides = {}) {
  return {
    eventId: 'evt_001',
    goalId: V36_GOAL_ID,
    taskId: 'task-1',
    eventType: 'worker.evidence-recorded',
    phase: 'implement',
    actor: { role: 'worker', id: 'test-worker' },
    occurredAt: '2026-06-03T00:00:00.000Z',
    recordedAt: '2026-06-03T00:00:01.000Z',
    branch: null,
    commit: null,
    evidenceRefs: [],
    statement: 'Test event.',
    ...overrides
  };
}

describe('v36 task-5 evidence bundle', () => {
  describe('summarizeEvent gate mapping', () => {
    it('maps a main.verification-passed gate event with gate.name', () => {
      const event = {
        eventId: 'evt_main_001',
        eventType: 'main.verification-passed',
        phase: 'main-verification',
        taskId: 'task-1',
        gate: { name: 'main-verification', status: 'passed' },
        evidenceRefs: [{ kind: 'repo-doc', ref: 'docs/plans/v36-task-1-main-verification-evidence.md', label: 'test' }],
        statement: 'Main verification passed for task-1.',
        occurredAt: '2026-06-03T00:00:00.000Z'
      };

      const result = summarizeEvent(event);

      assert.equal(result.gate_name, 'main-verification');
      assert.equal(result.status, 'passed');
      assert.equal(result.eventType, 'main.verification-passed');
      assert.equal(result.taskId, 'task-1');
    });

    it('falls back to event.gate.gate when event.gate.name is missing', () => {
      const event = {
        eventId: 'evt_legacy_001',
        eventType: 'main.verification-passed',
        phase: 'main-verification',
        taskId: 'task-2',
        gate: { gate: 'main-verification', status: 'passed' },
        evidenceRefs: [],
        statement: 'Legacy gate event.',
        occurredAt: '2026-06-03T00:00:00.000Z'
      };

      const result = summarizeEvent(event);

      assert.equal(result.gate_name, 'main-verification');
      assert.equal(result.status, 'passed');
    });

    it('prefers event.gate.name over event.gate.gate when both present', () => {
      const event = {
        eventId: 'evt_both_001',
        eventType: 'release.gate-passed',
        phase: 'release-gate',
        gate: { name: 'pnpmCheck', gate: 'release.pnpm-check', status: 'passed' },
        evidenceRefs: [],
        statement: 'Both fields present.',
        occurredAt: '2026-06-03T00:00:00.000Z'
      };

      const result = summarizeEvent(event);

      assert.equal(result.gate_name, 'pnpmCheck');
      assert.equal(result.status, 'passed');
    });

    it('returns null gate_name and status when gate is absent', () => {
      const event = {
        eventId: 'evt_no_gate_001',
        eventType: 'worker.evidence-recorded',
        phase: 'implement',
        taskId: 'task-1',
        evidenceRefs: [],
        statement: 'No gate.',
        occurredAt: '2026-06-03T00:00:00.000Z'
      };

      const result = summarizeEvent(event);

      assert.equal(result.gate_name, null);
      assert.equal(result.status, null);
    });

    it('handles gate.name for main.verification-passed producing expected output', () => {
      const event = {
        eventId: 'evt_expected_001',
        eventType: 'main.verification-passed',
        phase: 'main-verification',
        taskId: 'task-4',
        gate: { name: 'main-verification', status: 'passed' },
        evidenceRefs: [{ kind: 'repo-doc', ref: 'docs/plans/v36-task-4-main-verification-evidence.md', label: 'test' }],
        statement: 'Main verification passed for task-4.',
        occurredAt: '2026-06-03T00:00:00.000Z'
      };

      const result = summarizeEvent(event);

      assert.deepEqual(
        { gate_name: result.gate_name, status: result.status },
        { gate_name: 'main-verification', status: 'passed' }
      );
    });

    it('returns null for non-plain-object input', () => {
      assert.equal(summarizeEvent(null), null);
      assert.equal(summarizeEvent(undefined), null);
      assert.equal(summarizeEvent('not-an-object'), null);
    });
  });

  describe('buildEvidenceBundle integration', () => {
    let root;
    let stateDir;

    before(async () => {
      root = await mkdtemp(join(tmpdir(), 'symphony-v36-evidence-bundle-'));
      stateDir = join(root, '.symphony');
    });

    after(async () => {
      await rm(root, { recursive: true, force: true });
    });

    it('builds a bundle from an event journal with gate events', async () => {
      const journalPath = getManagedGoalEventJournalPath({ stateDir, goalId: V36_GOAL_ID });
      await mkdir(join(stateDir, 'goals', 'events'), { recursive: true });

      const events = stampEventHashChain([
        makeTestEvent({
          eventId: 'evt_worker_001',
          taskId: 'task-1',
          eventType: 'worker.evidence-recorded',
          evidenceRefs: [{ kind: 'repo-doc', ref: 'docs/plans/v36-task-1-worker-evidence.md', label: 'test' }],
          statement: 'Worker evidence recorded.'
        }),
        makeTestEvent({
          eventId: 'evt_mainver_001',
          taskId: 'task-1',
          eventType: 'main.verification-passed',
          phase: 'main-verification',
          actor: { role: 'main-verifier', id: 'test-verifier' },
          occurredAt: '2026-06-03T01:00:00.000Z',
          recordedAt: '2026-06-03T01:00:01.000Z',
          evidenceRefs: [{ kind: 'repo-doc', ref: 'docs/plans/v36-task-1-main-verification-evidence.md', label: 'test' }],
          statement: 'Main verification passed for task-1.',
          gate: { name: 'main-verification', status: 'passed' }
        })
      ]);

      await writeFile(journalPath, events.map((e) => JSON.stringify(e)).join('\n') + '\n', 'utf8');

      const bundle = await buildEvidenceBundle({ stateDir, goalId: V36_GOAL_ID });

      assert.equal(bundle.contractName, EVIDENCE_BUNDLE_CONTRACT_NAME);
      assert.equal(bundle.contractVersion, EVIDENCE_BUNDLE_CONTRACT_VERSION);
      assert.equal(bundle.readOnly, true);
      assert.equal(bundle.context.goalId, V36_GOAL_ID);
      assert.equal(bundle.context.totalEvents, 2);
      assert.equal(bundle.events.length, 2);

      const gateEvent = bundle.gateEvents.find((e) => e.eventType === 'main.verification-passed');
      assert.ok(gateEvent);
      assert.equal(gateEvent.gate_name, 'main-verification');
      assert.equal(gateEvent.status, 'passed');
    });

    it('filters events by taskId when provided', async () => {
      const journalPath = getManagedGoalEventJournalPath({ stateDir, goalId: V36_GOAL_ID });

      const events = stampEventHashChain([
        makeTestEvent({
          eventId: 'evt_task1_001',
          taskId: 'task-1',
          eventType: 'worker.evidence-recorded',
          evidenceRefs: [{ kind: 'repo-doc', ref: 'docs/plans/v36-task-1-worker-evidence.md', label: 'test' }],
          statement: 'Worker evidence.'
        }),
        makeTestEvent({
          eventId: 'evt_task5_001',
          taskId: 'task-5',
          eventType: 'worker.evidence-recorded',
          occurredAt: '2026-06-03T00:30:00.000Z',
          recordedAt: '2026-06-03T00:30:01.000Z',
          evidenceRefs: [{ kind: 'repo-doc', ref: 'docs/plans/v36-task-5-worker-evidence.md', label: 'test' }],
          statement: 'Worker evidence task 5.'
        })
      ]);

      await writeFile(journalPath, events.map((e) => JSON.stringify(e)).join('\n') + '\n', 'utf8');

      const bundle = await buildEvidenceBundle({ stateDir, goalId: V36_GOAL_ID, taskId: 'task-5' });

      assert.equal(bundle.context.matchedEvents, 1);
      assert.equal(bundle.events.length, 1);
      assert.equal(bundle.events[0].taskId, 'task-5');
    });
  });

  describe('validateEvidenceBundleContract', () => {
    it('validates a correct bundle', () => {
      const bundle = {
        contractName: EVIDENCE_BUNDLE_CONTRACT_NAME,
        contractVersion: EVIDENCE_BUNDLE_CONTRACT_VERSION,
        generatedAt: '2026-06-03T00:00:00.000Z',
        readOnly: true,
        context: { goalId: 'test-goal', taskId: null, totalEvents: 0, summarizedEvents: 0, matchedEvents: 0, gateEvents: 0, dataSource: 'goal-event-log.v1' },
        events: [],
        gateEvents: [],
        boundaries: { readOnly: true }
      };

      const result = validateEvidenceBundleContract(bundle);
      assert.equal(result.ok, true);
      assert.deepEqual(result.errors, []);
    });

    it('rejects a bundle with wrong contract name', () => {
      const bundle = {
        contractName: 'wrong-name',
        contractVersion: EVIDENCE_BUNDLE_CONTRACT_VERSION,
        generatedAt: '2026-06-03T00:00:00.000Z',
        readOnly: true,
        context: { goalId: 'test-goal', taskId: null, totalEvents: 0, summarizedEvents: 0, matchedEvents: 0, gateEvents: 0, dataSource: 'goal-event-log.v1' },
        events: [],
        gateEvents: [],
        boundaries: { readOnly: true }
      };

      const result = validateEvidenceBundleContract(bundle);
      assert.equal(result.ok, false);
    });

    it('assertEvidenceBundleContract throws on invalid bundle', () => {
      assert.throws(() => {
        assertEvidenceBundleContract({ contractName: 'wrong' });
      }, /Invalid evidence bundle contract/);
    });
  });
});
