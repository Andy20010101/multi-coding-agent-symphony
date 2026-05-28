import { readFile } from 'node:fs/promises';
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  GOAL_EVENT_LOG_CONTRACT_NAME,
  GOAL_UPDATE_PLAN_CONTRACT_NAME,
  validateGoalEventLogContract,
  validateGoalUpdatePlanContract
} from '../src/symphony/goal-event-contracts.js';

describe('v18 goal-event-log.v1 and goal-update-plan.v1 contract baseline', () => {
  it('validates empty event log, full event scenario log, and dry-run update plan fixtures', async () => {
    const emptyLog = await loadFixture('../fixtures/contracts/goal-event-log.empty.v1.json');
    const scenarioLog = await loadFixture('../fixtures/contracts/goal-event-log.valid-scenarios.v1.json');
    const updatePlan = await loadFixture('../fixtures/contracts/goal-update-plan.dry-run.v1.json');

    assert.deepEqual(validateGoalEventLogContract(emptyLog), {
      ok: true,
      errors: []
    });
    assert.deepEqual(validateGoalEventLogContract(scenarioLog), {
      ok: true,
      errors: []
    });
    assert.deepEqual(validateGoalUpdatePlanContract(updatePlan), {
      ok: true,
      errors: []
    });
    assert.equal(emptyLog.contractName, GOAL_EVENT_LOG_CONTRACT_NAME);
    assert.deepEqual(scenarioLog.events.map((event) => event.eventType), [
      'worker.self-check-passed',
      'reviewer.approved',
      'reviewer.needs-revision',
      'main.verification-passed',
      'release.gate-passed',
      'release.gate-failed',
      'release.ready-declared'
    ]);
    assert.equal(updatePlan.contractName, GOAL_UPDATE_PLAN_CONTRACT_NAME);
  });

  it('rejects event logs without contractName or contractVersion', async () => {
    const eventLog = await loadFixture('../fixtures/contracts/goal-event-log.valid-scenarios.v1.json');

    const missingName = structuredClone(eventLog);
    delete missingName.contractName;

    assert.equal(
      validateGoalEventLogContract(missingName).errors.includes('contractName is required'),
      true
    );
    assert.equal(
      validateGoalEventLogContract(missingName).errors.includes('contractName must be goal-event-log.v1'),
      true
    );

    const missingVersion = structuredClone(eventLog);
    delete missingVersion.contractVersion;

    assert.equal(
      validateGoalEventLogContract(missingVersion).errors.includes('contractVersion is required'),
      true
    );
    assert.equal(
      validateGoalEventLogContract(missingVersion).errors.includes('contractVersion must be 1'),
      true
    );
  });

  it('rejects update plans without contractName or contractVersion', async () => {
    const updatePlan = await loadFixture('../fixtures/contracts/goal-update-plan.dry-run.v1.json');

    const missingName = structuredClone(updatePlan);
    delete missingName.contractName;

    assert.equal(
      validateGoalUpdatePlanContract(missingName).errors.includes('contractName is required'),
      true
    );
    assert.equal(
      validateGoalUpdatePlanContract(missingName).errors.includes('contractName must be goal-update-plan.v1'),
      true
    );

    const missingVersion = structuredClone(updatePlan);
    delete missingVersion.contractVersion;

    assert.equal(
      validateGoalUpdatePlanContract(missingVersion).errors.includes('contractVersion is required'),
      true
    );
    assert.equal(
      validateGoalUpdatePlanContract(missingVersion).errors.includes('contractVersion must be 1'),
      true
    );
  });

  it('rejects update plans without planHash or with dry-run writes', async () => {
    const updatePlan = await loadFixture('../fixtures/contracts/goal-update-plan.dry-run.v1.json');

    const missingHash = structuredClone(updatePlan);
    delete missingHash.planHash;

    assert.equal(
      validateGoalUpdatePlanContract(missingHash).errors.includes('planHash is required'),
      true
    );
    assert.equal(
      validateGoalUpdatePlanContract(missingHash).errors.includes('planHash must be a sha256 hash'),
      true
    );

    const writesInDryRun = structuredClone(updatePlan);
    writesInDryRun.wouldAppend.writesInDryRun = true;
    writesInDryRun.safety.dryRunWrites = true;

    assert.equal(
      validateGoalUpdatePlanContract(writesInDryRun).errors.includes('wouldAppend.writesInDryRun must be false'),
      true
    );
    assert.equal(
      validateGoalUpdatePlanContract(writesInDryRun).errors.includes('safety.dryRunWrites must be false'),
      true
    );
  });

  it('rejects dangerous evidence refs in goal-update-plan proposed events', async () => {
    const updatePlan = await loadFixture('../fixtures/contracts/goal-update-plan.dry-run.v1.json');

    for (const ref of ['/Users/example/secret.md', 'file:///tmp/evidence.md', '../secret.md', '~/secret.md']) {
      const unsafe = structuredClone(updatePlan);
      unsafe.proposedEvents[0].evidenceRefs = [{
        kind: 'repo-doc',
        ref,
        label: 'Unsafe evidence'
      }];

      assert.equal(
        validateGoalUpdatePlanContract(unsafe).errors.some((error) => error.includes('controlled evidence reference')),
        true,
        ref
      );
    }
  });
});

async function loadFixture(path) {
  return JSON.parse(await readFile(new URL(path, import.meta.url), 'utf8'));
}
