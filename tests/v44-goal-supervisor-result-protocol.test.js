import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

import {
  RELEASE_MANAGER_EVENTS_BY_PHASE,
  RECORDED_RESULT_INTAKE_STATUSES,
  RESULT_REQUIRED_FIELDS,
  acceptedResultEventsForContext,
  formatResultBlock,
  inspectRecordedResultIntake,
  isPendingRecordedResultIntake,
  parseGoalSupervisorResultBlock
} from '../src/symphony/goal-supervisor/result-protocol.js';

const FIXTURE_PATH = new URL('../fixtures/contracts/goal-supervisor/result-protocol.v44.replay.v1.json', import.meta.url);

describe('v44 goal supervisor result protocol', () => {
  it('parses replay-safe valid result blocks from fixtures', async () => {
    const fixture = await readFixture();

    for (const sample of fixture.validResults) {
      const parsed = parseGoalSupervisorResultBlock({
        text: formatResultBlock(sample.fields),
        expected: sample.expected,
        releaseGates: fixture.releaseGates
      });

      assert.equal(parsed.valid, true, sample.name);
      assert.equal(parsed.record.goalId, fixture.goalId);
      assert.equal(parsed.record.threadId, sample.expected.threadId);
      assert.equal(parsed.record.recordId.startsWith('sha256:'), true);
      assert.deepEqual(Object.keys(sample.fields), RESULT_REQUIRED_FIELDS);
    }
  });

  it('requires exactly one bounded result block per role phase', async () => {
    const { validResults, releaseGates } = await readFixture();
    const sample = validResults[0];
    const missing = parseGoalSupervisorResultBlock({
      text: 'implementation finished; evidence is in docs/plans/v44-task-1-worker-evidence-2026-06-08.md',
      expected: sample.expected,
      releaseGates
    });
    const multiple = parseGoalSupervisorResultBlock({
      text: `${formatResultBlock(sample.fields)}\n${formatResultBlock(sample.fields)}`,
      expected: sample.expected,
      releaseGates
    });

    assert.equal(missing.valid, false);
    assert.equal(missing.reason, 'missing-result-block');
    assert.equal(multiple.valid, false);
    assert.equal(multiple.reason, 'multiple-result-blocks');
  });

  it('enforces exact required string fields and rejects malformed blocks', async () => {
    const { validResults, releaseGates } = await readFixture();
    const sample = validResults[0];
    const missingField = { ...sample.fields };
    delete missingField.validation;
    const extraField = {
      ...sample.fields,
      summary: 'extra field is not part of the contract'
    };
    const nonStringJson = {
      ...sample.fields,
      commandsRun: [{ command: 'pnpm test', status: 'passed' }]
    };

    const missing = parseGoalSupervisorResultBlock({
      text: formatRawBlock(missingField),
      expected: sample.expected,
      releaseGates
    });
    const unexpected = parseGoalSupervisorResultBlock({
      text: formatRawBlock(extraField),
      expected: sample.expected,
      releaseGates
    });
    const nonString = parseGoalSupervisorResultBlock({
      text: formatJsonBlock(nonStringJson),
      expected: sample.expected,
      releaseGates
    });
    const fenced = parseGoalSupervisorResultBlock({
      text: `RESULT_BLOCK_START\n\`\`\`json\n${JSON.stringify(sample.fields)}\n\`\`\`\nRESULT_BLOCK_END`,
      expected: sample.expected,
      releaseGates
    });

    assert.equal(missing.valid, false);
    assert.equal(missing.reason, 'missing-field:validation');
    assert.equal(unexpected.valid, false);
    assert.equal(unexpected.reason, 'unexpected-field:summary');
    assert.equal(nonString.valid, false);
    assert.equal(nonString.reason, 'non-string-field:commandsRun');
    assert.equal(fenced.valid, false);
    assert.equal(fenced.reason, 'markdown-fenced-result-block');
  });

  it('rejects wrong thread, branch, worktree, evidence ref, and unsafe evidence paths explicitly', async () => {
    const { validResults, releaseGates } = await readFixture();
    const sample = validResults[0];

    const wrongThread = parseSample(sample, releaseGates, { threadId: 'thread-from-another-phase' });
    const wrongBranch = parseSample(sample, releaseGates, { branch: 'wrong-branch' });
    const wrongWorktree = parseSample(sample, releaseGates, { worktree: '/Users/andy/.codex/worktrees/wrong' });
    const wrongEvidence = parseSample(sample, releaseGates, { evidenceRef: 'docs/plans/other.md' });
    const unsafeEvidence = parseSample(sample, releaseGates, { evidenceRef: '../outside.md' });

    assert.equal(wrongThread.valid, false);
    assert.equal(wrongThread.reason, 'context-mismatch:threadId');
    assert.equal(wrongBranch.valid, false);
    assert.equal(wrongBranch.reason, 'context-mismatch:branch');
    assert.equal(wrongWorktree.valid, false);
    assert.equal(wrongWorktree.reason, 'context-mismatch:worktree');
    assert.equal(wrongEvidence.valid, false);
    assert.equal(wrongEvidence.reason, 'context-mismatch:evidenceRef');
    assert.equal(unsafeEvidence.valid, false);
    assert.equal(unsafeEvidence.reason, 'unsafe-evidence-ref');
  });

  it('validates eventToRegister by role and release-manager phase', async () => {
    const { validResults, releaseGates } = await readFixture();
    const worker = validResults.find((sample) => sample.name === 'task-1-worker');
    const releaseGate = validResults.find((sample) => sample.name === 'release-gate');
    const releasePrep = validResults.find((sample) => sample.name === 'release-prep');

    const wrongWorkerEvent = parseSample(worker, releaseGates, { eventToRegister: 'reviewer.approved' });
    const readyDuringGate = parseSample(releaseGate, releaseGates, {
      eventToRegister: 'release.ready-declared',
      validation: 'release prep declared too early'
    });
    const gateDuringPrep = parseSample(releasePrep, releaseGates, {
      eventToRegister: 'release.gate-passed',
      validation: 'release.pnpm-check passed during prep'
    });

    assert.deepEqual(acceptedResultEventsForContext({ role: 'worker', phase: 'implement' }), [
      'worker.evidence-recorded',
      'worker.self-check-passed',
      'worker.self-check-failed'
    ]);
    assert.deepEqual(RELEASE_MANAGER_EVENTS_BY_PHASE['release-gate'], [
      'release.gate-passed',
      'release.gate-failed'
    ]);
    assert.deepEqual(RELEASE_MANAGER_EVENTS_BY_PHASE['release-prep'], [
      'release.ready-declared'
    ]);
    assert.equal(wrongWorkerEvent.valid, false);
    assert.equal(wrongWorkerEvent.reason, 'invalid-event-for-context:reviewer.approved');
    assert.equal(readyDuringGate.valid, false);
    assert.equal(readyDuringGate.reason, 'invalid-event-for-context:release.ready-declared');
    assert.equal(gateDuringPrep.valid, false);
    assert.equal(gateDuringPrep.reason, 'invalid-event-for-context:release.gate-passed');
  });

  it('keeps release-gate basis concrete and release-prep free of gate-specific event claims', async () => {
    const { validResults, releaseGates } = await readFixture();
    const releaseGate = validResults.find((sample) => sample.name === 'release-gate');
    const releasePrep = validResults.find((sample) => sample.name === 'release-prep');
    const missingConcreteGate = parseSample(releaseGate, releaseGates, {
      commandsRun: 'pnpm check: passed',
      validation: 'all scoped checks passed'
    });
    const prepWithGateMention = parseSample(releasePrep, releaseGates, {
      validation: 'release.diff-check is ready for closeout'
    });

    assert.equal(missingConcreteGate.valid, false);
    assert.equal(missingConcreteGate.reason, 'release-gate-result-must-cite-one-gate:0');
    assert.equal(prepWithGateMention.valid, false);
    assert.equal(prepWithGateMention.reason, 'release-prep-result-must-not-cite-gates:release.diff-check');
  });

  it('projects recorded result intake states behind the result protocol', async () => {
    const { validResults, releaseGates } = await readFixture();
    const sample = validResults[0];
    const pending = inspectRecordedResultIntake({
      source: 'result-escrow-file',
      text: formatResultBlock(sample.fields),
      expected: sample.expected,
      releaseGates
    });
    const missing = inspectRecordedResultIntake({
      source: 'result-escrow-file',
      text: null,
      expected: sample.expected,
      releaseGates,
      missingReason: 'missing-result-escrow'
    });
    const malformed = inspectRecordedResultIntake({
      source: 'app-thread',
      text: 'RESULT_BLOCK_START\nthis is not key value syntax\nRESULT_BLOCK_END',
      expected: sample.expected,
      releaseGates
    });
    const invalid = inspectRecordedResultIntake({
      source: 'app-thread',
      text: formatResultBlock({
        ...sample.fields,
        threadId: 'thread-from-another-phase'
      }),
      expected: sample.expected,
      releaseGates
    });
    const consumed = inspectRecordedResultIntake({
      source: 'result-escrow-file',
      text: formatResultBlock(sample.fields),
      expected: sample.expected,
      releaseGates,
      consumedResultIds: [pending.record.recordId]
    });

    assert.equal(pending.status, 'pending');
    assert.deepEqual(RECORDED_RESULT_INTAKE_STATUSES, [
      'pending',
      'missing',
      'invalid',
      'unavailable',
      'consumed'
    ]);
    assert.equal(isPendingRecordedResultIntake(pending), true);
    assert.equal(missing.status, 'missing');
    assert.equal(missing.reason, 'missing-result-escrow');
    assert.equal(malformed.status, 'invalid');
    assert.equal(malformed.reason, 'malformed-result-line');
    assert.equal(invalid.status, 'invalid');
    assert.equal(invalid.reason, 'context-mismatch:threadId');
    assert.equal(consumed.status, 'consumed');
    assert.equal(consumed.reason, 'recorded-result-already-registered');
    assert.equal(isPendingRecordedResultIntake(consumed), false);
  });
});

async function readFixture() {
  return JSON.parse(await readFile(FIXTURE_PATH, 'utf8'));
}

function parseSample(sample, releaseGates, overrides) {
  return parseGoalSupervisorResultBlock({
    text: formatResultBlock({
      ...sample.fields,
      ...overrides
    }),
    expected: sample.expected,
    releaseGates
  });
}

function formatRawBlock(fields) {
  return [
    'RESULT_BLOCK_START',
    ...Object.entries(fields).map(([key, value]) => `${key}: ${value}`),
    'RESULT_BLOCK_END'
  ].join('\n');
}

function formatJsonBlock(fields) {
  return [
    'RESULT_BLOCK_START',
    JSON.stringify(fields, null, 2),
    'RESULT_BLOCK_END'
  ].join('\n');
}
