import { readFile } from 'node:fs/promises';
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  GUIDED_GOAL_HANDOFF_COMMAND_BLOCK_IDS,
  GUIDED_GOAL_HANDOFF_CONTRACT_NAME,
  GUIDED_GOAL_HANDOFF_CONTRACT_VERSION,
  GUIDED_GOAL_HANDOFF_ROLE_IDS,
  assertGuidedGoalHandoffContract,
  validateGuidedGoalHandoffContract
} from '../src/symphony/guided-goal-handoff.js';

const FIXTURE_URL = new URL('../fixtures/contracts/guided-goal-handoff.v1.json', import.meta.url);

describe('v16 guided goal handoff contract fixtures', () => {
  it('validates the bundled guided-goal-handoff.v1 fixture', async () => {
    const handoff = await loadHandoffFixture();
    const result = validateGuidedGoalHandoffContract(handoff);

    assert.deepEqual(result, {
      ok: true,
      errors: []
    });
    assert.equal(assertGuidedGoalHandoffContract(handoff), handoff);
    assert.deepEqual(Object.keys(handoff), [
      'contractName',
      'contractVersion',
      'goalId',
      'title',
      'titleZh',
      'baseline',
      'scope',
      'nonGoals',
      'safetyBoundaries',
      'roles',
      'tasks',
      'commands',
      'reviewModel',
      'releaseGates',
      'stopConditions',
      'deferredContracts'
    ]);
  });

  it('freezes baseline, roles, task list, and evidence paths', async () => {
    const handoff = await loadHandoffFixture();

    assert.equal(handoff.contractName, GUIDED_GOAL_HANDOFF_CONTRACT_NAME);
    assert.equal(handoff.contractVersion, GUIDED_GOAL_HANDOFF_CONTRACT_VERSION);
    assert.equal(handoff.baseline.releaseTag, 'v15');
    assert.equal(handoff.baseline.releaseTagCommit, '2c1b9b9');
    assert.equal(handoff.baseline.planningCommit, '14c9c93');
    assert.equal(handoff.baseline.approvalCommit, '3410509');
    assert.deepEqual(
      handoff.roles.map((role) => role.id),
      GUIDED_GOAL_HANDOFF_ROLE_IDS
    );
    assert.deepEqual(
      handoff.tasks.map((task) => task.id),
      [
        'task-1',
        'task-2',
        'task-3',
        'task-4',
        'task-5',
        'task-6',
        'task-7',
        'task-8',
        'task-9',
        'task-10',
        'task-11',
        'task-12'
      ]
    );
    assert.deepEqual(
      handoff.tasks.map((task) => task.evidencePath),
      [
        'docs/plans/v16-task1-plan-approval-evidence-2026-05-27.md',
        'docs/plans/v16-task2-handoff-contract-fixtures-evidence-2026-05-27.md',
        'docs/plans/v16-task3-cli-handoff-generation-evidence-2026-05-27.md',
        'docs/plans/v16-task4-readonly-handoff-api-evidence-2026-05-27.md',
        'docs/plans/v16-task5-workbench-handoff-panel-evidence-2026-05-27.md',
        'docs/plans/v16-task6-safe-preview-contract-fixtures-evidence-2026-05-27.md',
        'docs/plans/v16-task7-safe-preview-implementation-evidence-2026-05-27.md',
        'docs/plans/v16-task8-workbench-preview-consumption-evidence-2026-05-27.md',
        'docs/plans/v16-task9-route-smoke-security-evidence-2026-05-27.md',
        'docs/plans/v16-task10-docs-operator-guide-evidence-2026-05-27.md',
        'docs/plans/v16-task11-release-verification-evidence-2026-05-27.md',
        'docs/plans/v16-final-closure-evidence-2026-05-27.md'
      ]
    );
    assert.equal(handoff.tasks.find((task) => task.id === 'task-11').role, 'verifier');
    assert.equal(handoff.tasks.find((task) => task.id === 'task-12').role, 'release-evidence');
    assert.equal(handoff.tasks.every((task) => task.reviewGate.includes('Independent reviewer')), true);
  });

  it('keeps next commands copy-only and free of execution endpoint fields', async () => {
    const handoff = await loadHandoffFixture();

    assert.equal(handoff.commands.copyOnly, true);
    assert.deepEqual(
      handoff.commands.blocks.map((block) => block.id),
      GUIDED_GOAL_HANDOFF_COMMAND_BLOCK_IDS
    );

    for (const block of handoff.commands.blocks) {
      assert.equal(block.copyOnly, true);
      assert.equal(Array.isArray(block.commands), true);
      assert.equal(block.commands.every((command) => typeof command === 'string' && command.trim() !== ''), true);

      for (const forbidden of ['apiRoute', 'endpoint', 'handler', 'httpMethod', 'method', 'route', 'writeEndpoint']) {
        assert.equal(Object.hasOwn(block, forbidden), false);
      }
    }

    const commandText = handoff.commands.blocks.flatMap((block) => block.commands).join('\n');
    assert.doesNotMatch(commandText, /\b(curl|fetch)\b.*\/api\//iu);
    assert.doesNotMatch(commandText, /\b(POST|PUT|PATCH|DELETE)\b/u);
    assert.doesNotMatch(commandText, /\b(adopt|apply|retry|rollback)\b.*\/api\//iu);
  });

  it('covers review, verifier, release gates, stop conditions, and deferred contracts', async () => {
    const handoff = await loadHandoffFixture();

    assert.equal(handoff.reviewModel.contextIsolation, true);
    assert.equal(handoff.reviewModel.workerSelfCheckIsFinal, false);
    assert.deepEqual(handoff.reviewModel.allowedStatuses, ['APPROVED', 'NEEDS_REVISION']);
    assert.equal(handoff.reviewModel.requirements.some((requirement) => /diff/u.test(requirement)), true);

    assert.equal(handoff.releaseGates.some((gate) => gate.id === 'main-check'), true);
    assert.equal(handoff.releaseGates.some((gate) => gate.id === 'main-test'), true);
    assert.equal(handoff.releaseGates.some((gate) => gate.id === 'route-security'), true);
    assert.equal(handoff.stopConditions.some((condition) => condition.id === 'browser-execution'), true);
    assert.equal(handoff.stopConditions.some((condition) => condition.id === 'arbitrary-path'), true);
    assert.deepEqual(
      handoff.deferredContracts.map((contract) => [contract.contractName, contract.status]),
      [
        ['diagnostics.v1', 'backlog'],
        ['capabilities.v1', 'backlog'],
        ['error-envelope.v1', 'backlog']
      ]
    );
  });

  it('rejects missing required fields, non-copy-only commands, and invalid task evidence', async () => {
    const handoff = await loadHandoffFixture();
    const missingStopConditions = structuredClone(handoff);
    delete missingStopConditions.stopConditions;

    assert.deepEqual(validateGuidedGoalHandoffContract(missingStopConditions), {
      ok: false,
      errors: [
        'stopConditions is required',
        'stopConditions must be a non-empty array'
      ]
    });

    const executableCommands = structuredClone(handoff);
    executableCommands.commands.blocks[0].copyOnly = false;
    executableCommands.commands.blocks[0].method = 'POST';

    assert.deepEqual(validateGuidedGoalHandoffContract(executableCommands), {
      ok: false,
      errors: [
        'commands.blocks[0].method is not allowed in copy-only command blocks',
        'commands.blocks[0].copyOnly must be true'
      ]
    });

    const missingEvidence = structuredClone(handoff);
    missingEvidence.tasks[1].evidencePath = '';

    assert.deepEqual(validateGuidedGoalHandoffContract(missingEvidence), {
      ok: false,
      errors: [
        'tasks[1].evidencePath must be a non-empty string'
      ]
    });
  });
});

async function loadHandoffFixture() {
  return JSON.parse(await readFile(FIXTURE_URL, 'utf8'));
}
