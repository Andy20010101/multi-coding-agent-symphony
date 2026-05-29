import { readFile } from 'node:fs/promises';
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  GOAL_CLOSEOUT_REPORT_CONTRACT_NAME,
  GOAL_NEXT_ACTION_CONTRACT_NAME,
  GOAL_PROMPT_PACK_CONTRACT_NAME,
  GOAL_PROMPT_PACK_ROLES,
  GOAL_RUNBOOK_CONTRACT_NAME,
  assertGoalCloseoutReportContract,
  assertGoalNextActionContract,
  assertGoalPromptPackContract,
  assertGoalRunbookContract,
  validateGoalCloseoutReportContract,
  validateGoalNextActionContract,
  validateGoalPromptPackContract,
  validateGoalRunbookContract
} from '../src/symphony/goal-runbook-contracts.js';

describe('v19 goal runbook, next action, prompt pack, and closeout contracts', () => {
  it('validates all v19 valid fixtures', async () => {
    const runbook = await loadFixture('../fixtures/contracts/goal-runbook.valid.v1.json');
    const nextAction = await loadFixture('../fixtures/contracts/goal-next-action.valid.v1.json');
    const promptPack = await loadFixture('../fixtures/contracts/goal-prompt-pack.valid.v1.json');
    const closeoutReport = await loadFixture('../fixtures/contracts/goal-closeout-report.valid.v1.json');

    assert.deepEqual(validateGoalRunbookContract(runbook), {
      ok: true,
      errors: []
    });
    assert.deepEqual(validateGoalNextActionContract(nextAction), {
      ok: true,
      errors: []
    });
    assert.deepEqual(validateGoalPromptPackContract(promptPack), {
      ok: true,
      errors: []
    });
    assert.deepEqual(validateGoalCloseoutReportContract(closeoutReport), {
      ok: true,
      errors: []
    });

    assert.equal(assertGoalRunbookContract(runbook), runbook);
    assert.equal(assertGoalNextActionContract(nextAction), nextAction);
    assert.equal(assertGoalPromptPackContract(promptPack), promptPack);
    assert.equal(assertGoalCloseoutReportContract(closeoutReport), closeoutReport);
    assert.equal(runbook.contractName, GOAL_RUNBOOK_CONTRACT_NAME);
    assert.equal(nextAction.contractName, GOAL_NEXT_ACTION_CONTRACT_NAME);
    assert.equal(promptPack.contractName, GOAL_PROMPT_PACK_CONTRACT_NAME);
    assert.equal(closeoutReport.contractName, GOAL_CLOSEOUT_REPORT_CONTRACT_NAME);
    assert.deepEqual(promptPack.prompts.map((prompt) => prompt.role), GOAL_PROMPT_PACK_ROLES);
  });

  it('rejects unsafe refs, including encoded traversal', async () => {
    const unsafeRef = await loadFixture('../fixtures/contracts/goal-runbook.unsafe-ref.invalid.v1.json');
    assertHasError(
      validateGoalRunbookContract(unsafeRef),
      'baseline.evidenceRef must be a controlled evidence reference'
    );

    const encodedTraversal = await loadFixture('../fixtures/contracts/goal-runbook.valid.v1.json');
    encodedTraversal.baseline.evidenceRef = 'docs/plans/%2e%2e/secret.md';
    assertHasError(
      validateGoalRunbookContract(encodedTraversal),
      'baseline.evidenceRef must be a controlled evidence reference'
    );
  });

  it('rejects raw parent directory segments in controlled refs', async () => {
    const terminalRepoDocTraversal = await loadFixture('../fixtures/contracts/goal-runbook.raw-parent-segment.invalid.v1.json');
    assertHasError(
      validateGoalRunbookContract(terminalRepoDocTraversal),
      'baseline.evidenceRef must be a controlled evidence reference'
    );

    const nestedRepoDocTraversal = await loadFixture('../fixtures/contracts/goal-runbook.valid.v1.json');
    nestedRepoDocTraversal.baseline.evidenceRef = 'docs/plans/subdir/..';
    assertHasError(
      validateGoalRunbookContract(nestedRepoDocTraversal),
      'baseline.evidenceRef must be a controlled evidence reference'
    );

    const terminalManagedArtifactTraversal = await loadFixture('../fixtures/contracts/goal-runbook.valid.v1.json');
    terminalManagedArtifactTraversal.baseline.evidenceRef = 'artifacts/run/..';
    assertHasError(
      validateGoalRunbookContract(terminalManagedArtifactTraversal),
      'baseline.evidenceRef must be a controlled evidence reference'
    );
  });

  it('rejects duplicate task ids and empty acceptance criteria', async () => {
    const duplicateTaskId = await loadFixture('../fixtures/contracts/goal-runbook.duplicate-task-id.invalid.v1.json');
    const emptyAcceptance = await loadFixture('../fixtures/contracts/goal-runbook.empty-acceptance.invalid.v1.json');

    assertHasError(validateGoalRunbookContract(duplicateTaskId), 'tasks[1].taskId must be unique');
    assertHasError(validateGoalRunbookContract(emptyAcceptance), 'tasks[0].acceptance must be a non-empty array');
  });

  it('rejects unknown roles in runbooks and prompt packs', async () => {
    const promptPack = await loadFixture('../fixtures/contracts/goal-prompt-pack.unknown-role.invalid.v1.json');
    assertHasError(
      validateGoalPromptPackContract(promptPack),
      'prompts[0].role must be one of worker, reviewer, main-verifier, release-manager'
    );

    const runbook = await loadFixture('../fixtures/contracts/goal-runbook.valid.v1.json');
    runbook.tasks[0].roleOrder[0] = 'approver';
    assertHasError(
      validateGoalRunbookContract(runbook),
      'tasks[0].roleOrder[0] must be one of worker, reviewer, main-verifier'
    );
  });

  it('rejects unknown event types in expected evidence and closeout gaps', async () => {
    const runbook = await loadFixture('../fixtures/contracts/goal-runbook.unknown-event-type.invalid.v1.json');
    const closeoutReport = await loadFixture('../fixtures/contracts/goal-closeout-report.unknown-event-type.invalid.v1.json');

    assertHasErrorStartingWith(
      validateGoalRunbookContract(runbook),
      'tasks[0].expectedEvidence.worker must be one of '
    );
    assertHasErrorStartingWith(
      validateGoalCloseoutReportContract(closeoutReport),
      'missing[0].expectedEvent must be one of '
    );
  });

  it('rejects missing copy-only prompts when next action says a prompt is available', async () => {
    const nextAction = await loadFixture('../fixtures/contracts/goal-next-action.copy-only-prompt-missing.invalid.v1.json');

    assertHasError(
      validateGoalNextActionContract(nextAction),
      'copyOnlyPrompt.text is required when copyOnlyPrompt.available is true'
    );
  });

  it('rejects dry-run and confirm registration fields that drift apart', async () => {
    const promptPack = await loadFixture('../fixtures/contracts/goal-prompt-pack.dry-run-confirm-inconsistent.invalid.v1.json');
    const result = validateGoalPromptPackContract(promptPack);

    assertHasError(result, 'prompts[0].registration.confirmRequired must be true');
    assertHasError(result, 'prompts[0].registration.writesInDryRun must be false');
    assertHasError(result, 'prompts[0].registration.dryRunCommand must include --dry-run');
    assertHasError(result, 'prompts[0].registration.dryRunCommand must not include --confirm');
    assertHasError(result, 'prompts[0].registration.confirmCommand must include --confirm');
    assertHasError(result, 'prompts[0].registration.confirmCommand must include --plan-hash');
  });

  it('requires main-verifier prompts to register through goal gate', async () => {
    const promptPack = await loadFixture('../fixtures/contracts/goal-prompt-pack.valid.v1.json');
    const mainVerifierPrompt = promptPack.prompts.find((prompt) => prompt.role === 'main-verifier');

    mainVerifierPrompt.registration.dryRunCommand = 'symphony goal update --goal v19-goal-runbook-next-action --task task-1 --event main.verification-passed --actor codex-main-verifier --evidence-ref docs/plans/v19-task1-main-verification-evidence-2026-05-29.md --dry-run';
    mainVerifierPrompt.registration.confirmCommand = 'symphony goal update --goal v19-goal-runbook-next-action --task task-1 --event main.verification-passed --actor codex-main-verifier --evidence-ref docs/plans/v19-task1-main-verification-evidence-2026-05-29.md --confirm --plan-hash sha256:0000000000000000000000000000000000000000000000000000000000000000';

    const result = validateGoalPromptPackContract(promptPack);

    assertHasError(result, 'prompts[2].registration.dryRunCommand must use symphony goal gate for main verification');
    assertHasError(result, 'prompts[2].registration.dryRunCommand must include --gate main-verification');
    assertHasError(result, 'prompts[2].registration.dryRunCommand must not register main verification through --event');
    assertHasError(result, 'prompts[2].registration.confirmCommand must use symphony goal gate for main verification');
    assertHasError(result, 'prompts[2].registration.confirmCommand must include --gate main-verification');
    assertHasError(result, 'prompts[2].registration.confirmCommand must not register main verification through --event');
  });
});

async function loadFixture(path) {
  return JSON.parse(await readFile(new URL(path, import.meta.url), 'utf8'));
}

function assertHasError(result, expectedError) {
  assert.equal(result.ok, false);
  assert.equal(
    result.errors.includes(expectedError),
    true,
    `Expected ${expectedError}, got ${result.errors.join('; ')}`
  );
}

function assertHasErrorStartingWith(result, expectedPrefix) {
  assert.equal(result.ok, false);
  assert.equal(
    result.errors.some((error) => error.startsWith(expectedPrefix)),
    true,
    `Expected error starting with ${expectedPrefix}, got ${result.errors.join('; ')}`
  );
}
