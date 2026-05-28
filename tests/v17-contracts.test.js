import { readFile } from 'node:fs/promises';
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  GOAL_PROGRESS_LEDGER_CONTRACT_NAME,
  GOAL_PROGRESS_LEDGER_CONTRACT_VERSION,
  GOAL_PROGRESS_RELEASE_GATE_IDS,
  GOAL_PROGRESS_TASK_STATUSES,
  assertGoalProgressLedgerContract,
  validateGoalProgressLedgerContract
} from '../src/symphony/goal-progress-ledger.js';
import {
  assertCapabilitiesContract,
  buildCapabilitiesContract,
  validateCapabilitiesContract
} from '../src/symphony/capabilities.js';
import {
  assertDiagnosticsContract,
  validateDiagnosticsContract
} from '../src/symphony/diagnostics.js';
import {
  assertErrorEnvelopeContract,
  buildErrorEnvelope,
  validateErrorEnvelopeContract
} from '../src/symphony/error-envelope.js';

const GOAL_PROGRESS_FIXTURES = Object.freeze([
  '../fixtures/contracts/goal-progress-ledger.planned.v1.json',
  '../fixtures/contracts/goal-progress-ledger.approved.v1.json',
  '../fixtures/contracts/goal-progress-ledger.needs-revision.v1.json',
  '../fixtures/contracts/goal-progress-ledger.blocked.v1.json',
  '../fixtures/contracts/goal-progress-ledger.unknown.v1.json',
  '../fixtures/contracts/goal-progress-ledger.release-ready.v1.json'
]);

describe('v17 goal-progress-ledger.v1 contract fixtures', () => {
  it('validates planned, approved, needs-revision, blocked, unknown, and release-ready fixtures', async () => {
    const ledgers = await Promise.all(GOAL_PROGRESS_FIXTURES.map(loadFixture));

    for (const ledger of ledgers) {
      assert.deepEqual(validateGoalProgressLedgerContract(ledger), {
        ok: true,
        errors: []
      }, ledger.tasks[0].status);
      assert.equal(assertGoalProgressLedgerContract(ledger), ledger);
      assert.equal(ledger.contractName, GOAL_PROGRESS_LEDGER_CONTRACT_NAME);
      assert.equal(ledger.contractVersion, GOAL_PROGRESS_LEDGER_CONTRACT_VERSION);
    }

    assert.deepEqual(ledgers.map((ledger) => ledger.tasks[0].status), [
      'planned',
      'approved',
      'needs-revision',
      'blocked',
      'unknown',
      'release-ready'
    ]);
    assert.deepEqual(Object.keys(ledgers[0].releaseGates), GOAL_PROGRESS_RELEASE_GATE_IDS);
  });

  it('rejects invalid statuses, verdicts, release gates, missing fields, and executable next actions', async () => {
    const planned = await loadFixture(GOAL_PROGRESS_FIXTURES[0]);

    const missingContract = structuredClone(planned);
    delete missingContract.contractName;

    assert.deepEqual(validateGoalProgressLedgerContract(missingContract), {
      ok: false,
      errors: [
        'contractName is required',
        'contractName must be goal-progress-ledger.v1'
      ]
    });

    const badStatus = structuredClone(planned);
    badStatus.tasks[0].status = 'done';

    assert.equal(
      validateGoalProgressLedgerContract(badStatus).errors.includes(`tasks[0].status must be one of ${GOAL_PROGRESS_TASK_STATUSES.join(', ')}`),
      true
    );

    const badVerdict = structuredClone(planned);
    badVerdict.tasks[0].reviewVerdict = 'LGTM';

    assert.equal(
      validateGoalProgressLedgerContract(badVerdict).errors.includes('tasks[0].reviewVerdict must be null or one of APPROVED, NEEDS_REVISION, PENDING, UNKNOWN'),
      true
    );

    const badReleaseGate = structuredClone(planned);
    badReleaseGate.releaseGates.pnpmCheck = 'green';

    assert.equal(
      validateGoalProgressLedgerContract(badReleaseGate).errors.includes('releaseGates.pnpmCheck must be one of unknown, missing, pending, passed, failed, blocked'),
      true
    );

    const badCommand = structuredClone(planned);
    badCommand.nextActions[0].command = 'curl -X POST /api/goals/latest/progress';

    assert.equal(
      validateGoalProgressLedgerContract(badCommand).errors.includes('nextActions[0].command must not contain write HTTP methods'),
      true
    );
  });

  it('requires explicit evidence for approved, needs-revision, main-verified, and release-ready states', async () => {
    const approved = await loadFixture('../fixtures/contracts/goal-progress-ledger.approved.v1.json');
    approved.tasks[0].reviewEvidenceRef = null;

    assert.equal(
      validateGoalProgressLedgerContract(approved).errors.includes('tasks[0].reviewEvidenceRef is required when status is approved'),
      true
    );

    const releaseReady = await loadFixture('../fixtures/contracts/goal-progress-ledger.release-ready.v1.json');
    releaseReady.releaseGates.auditHigh = 'unknown';

    assert.equal(
      validateGoalProgressLedgerContract(releaseReady).errors.includes('summary.releaseReady requires all release gates to be passed'),
      true
    );
  });
});

describe('v17 capabilities.v1, diagnostics.v1, and error-envelope.v1 contracts', () => {
  it('validates capabilities fixtures and rejects mutation/execution capability drift', async () => {
    const fixture = await loadFixture('../fixtures/contracts/capabilities.v1.json');

    assert.deepEqual(validateCapabilitiesContract(fixture), {
      ok: true,
      errors: []
    });
    assert.deepEqual(validateCapabilitiesContract(buildCapabilitiesContract()), {
      ok: true,
      errors: []
    });
    assert.equal(assertCapabilitiesContract(fixture), fixture);

    const drift = structuredClone(fixture);
    drift.browserExecutionAvailable = true;

    assert.deepEqual(validateCapabilitiesContract(drift), {
      ok: false,
      errors: ['browserExecutionAvailable must be false']
    });
  });

  it('validates diagnostics fixtures and rejects invalid status/severity', async () => {
    const fixture = await loadFixture('../fixtures/contracts/diagnostics.v1.json');

    assert.deepEqual(validateDiagnosticsContract(fixture), {
      ok: true,
      errors: []
    });
    assert.equal(assertDiagnosticsContract(fixture), fixture);

    const drift = structuredClone(fixture);
    drift.checks[0].status = 'passed';
    drift.checks[1].severity = 'critical';

    assert.equal(validateDiagnosticsContract(drift).errors.includes('checks[0].status must be one of ok, warning, error, unknown'), true);
    assert.equal(validateDiagnosticsContract(drift).errors.includes('checks[1].severity must be one of info, warning, error'), true);
  });

  it('validates error-envelope fixtures and redacts unsafe message/details at construction', async () => {
    const fixture = await loadFixture('../fixtures/contracts/error-envelope.v1.json');

    assert.deepEqual(validateErrorEnvelopeContract(fixture), {
      ok: true,
      errors: []
    });
    assert.equal(assertErrorEnvelopeContract(fixture), fixture);

    const envelope = buildErrorEnvelope({
      code: 'internal-error',
      message: 'boom at fn (/Users/example/repo/src/file.js:1:2)',
      status: 500,
      route: '/api/diagnostics?path=/Users/example/secret',
      method: 'GET',
      safeDetails: {
        reason: '/Users/example/secret'
      }
    });

    assert.equal(envelope.error.message, 'Request failed safely.');
    assert.equal(envelope.error.route, '/api/diagnostics');
    assert.equal(envelope.error.safeDetails.reason, 'redacted');
    assert.deepEqual(validateErrorEnvelopeContract(envelope), {
      ok: true,
      errors: []
    });
  });
});

async function loadFixture(path) {
  return JSON.parse(await readFile(new URL(path, import.meta.url), 'utf8'));
}
