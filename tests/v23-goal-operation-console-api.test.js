import { mkdir, mkdtemp, readFile, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, relative } from 'node:path';
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { createSymphonyConsoleServer } from '../src/symphony/console.js';
import { validateErrorEnvelopeContract } from '../src/symphony/error-envelope.js';
import { validateGoalUpdatePlanContract } from '../src/symphony/goal-event-contracts.js';
import {
  buildGoalRunbookInitPlan,
  confirmGoalRunbookInit
} from '../src/symphony/goal-runbook-registry.js';

const GOAL_ID = 'v23-goal-operation-run-console';
const RUNBOOK_FIXTURE = 'fixtures/contracts/goal-runbook.v23-goal-operation-run-console.v1.json';

describe('v23 Workbench goal operation console API', () => {
  it('serves a successful dry-run preview through the latest goal workflow and records the operation run only', async () => {
    const context = await startOperationConsoleServer();

    try {
      const before = await snapshotGoalEventFiles(context.stateDir);
      const response = await fetch(`${context.baseUrl}/api/goals/latest/event-plan-preview?${new URLSearchParams({
        command: 'update',
        task: 'task-5',
        event: 'worker.evidence-recorded',
        actor: 'codex-v23-task-5-worker',
        evidenceRef: 'docs/plans/v23-task-5-worker-evidence-2026-05-29.md'
      })}`);
      const plan = await response.json();

      assert.equal(response.status, 200);
      assert.deepEqual(validateGoalUpdatePlanContract(plan), {
        ok: true,
        errors: []
      });
      assert.equal(plan.goalId, GOAL_ID);
      assert.equal(plan.command.name, 'symphony goal update');
      assert.equal(plan.eventSummary.eventType, 'worker.evidence-recorded');
      assert.equal(plan.eventSummary.taskId, 'task-5');
      assert.equal(plan.eventSummary.writesInDryRun, false);
      assert.match(plan.planHash, /^sha256:[a-f0-9]{64}$/u);
      assert.equal(plan.operationRun.goalId, GOAL_ID);
      assert.equal(plan.operationRun.taskId, 'task-5');
      assert.equal(plan.operationRun.role, 'worker');
      assert.equal(plan.operationRun.commandKind, 'update');
      assert.equal(plan.operationRun.status, 'dry-run-planned');
      assert.deepEqual(plan.operationRun.eventIds, []);
      assert.equal(plan.previewEndpoint.genericShellRunner, false);
      assert.equal(plan.previewEndpoint.dryRunOnly, true);
      assert.equal(plan.confirm.copyOnlyCommand.includes('--confirm --plan-hash'), true);
      assert.deepEqual(await snapshotGoalEventFiles(context.stateDir), before);

      const operationsResponse = await fetch(`${context.baseUrl}/api/goals/${GOAL_ID}/operations`);
      const operations = await operationsResponse.json();

      assert.equal(operationsResponse.status, 200);
      assert.equal(operations.contractName, 'goal-operation-runs.v1');
      assert.equal(operations.goalId, GOAL_ID);
      assert.equal(operations.operationCount, 1);
      assert.equal(operations.latestOperationId, plan.operationRun.operationId);
      assert.equal(operations.runs[0].status, 'dry-run-planned');
      assert.equal(operations.runs[0].source, 'workbench.event-plan-preview');
    } finally {
      await cleanupOperationConsoleServer(context);
    }
  });

  it('confirms a successful operation with the returned plan hash and refreshes goal events, progress, and next action', async () => {
    const context = await startOperationConsoleServer();

    try {
      const preview = await previewTask5WorkerEvidence(context);
      const confirmResponse = await fetch(`${context.baseUrl}/api/goals/${GOAL_ID}/event-plan-confirm`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          command: 'update',
          task: 'task-5',
          event: 'worker.evidence-recorded',
          actor: 'codex-v23-task-5-worker',
          evidenceRef: ['docs/plans/v23-task-5-worker-evidence-2026-05-29.md'],
          planHash: preview.planHash
        })
      });
      const confirmation = await confirmResponse.json();

      assert.equal(confirmResponse.status, 200);
      assert.equal(confirmation.contractName, 'goal-event-confirmation.v1');
      assert.equal(confirmation.goalId, GOAL_ID);
      assert.equal(confirmation.command, 'update');
      assert.equal(confirmation.status, 'appended');
      assert.equal(confirmation.written, true);
      assert.equal(confirmation.appendOnly, true);
      assert.equal(confirmation.planHash, preview.planHash);
      assert.equal(confirmation.eventSummary.eventType, 'worker.evidence-recorded');
      assert.equal(confirmation.eventSummary.taskId, 'task-5');
      assert.equal(confirmation.eventSummary.actorId, 'codex-v23-task-5-worker');
      assert.equal(confirmation.operationRun.operationId, preview.operationRun.operationId);
      assert.equal(confirmation.operationRun.status, 'confirmed');
      assert.deepEqual(confirmation.operationRun.eventIds, [confirmation.eventSummary.eventId]);
      assert.equal(confirmation.refreshed.events.contractName, 'goal-event-log.v1');
      assert.equal(confirmation.refreshed.events.log.eventCount, 1);
      assert.equal(confirmation.refreshed.progress.contractName, 'goal-progress-ledger.v1');
      assert.equal(confirmation.refreshed.progress.tasks.find((task) => task.taskId === 'task-5').workerEvidenceRef, 'docs/plans/v23-task-5-worker-evidence-2026-05-29.md');
      assert.equal(confirmation.refreshed.nextAction.contractName, 'goal-next-action.v1');
      assert.equal(confirmation.confirmEndpoint.genericShellRunner, false);
      assert.deepEqual(confirmation.confirmEndpoint.constrainedCommands, ['update', 'review', 'gate']);

      const operationsResponse = await fetch(`${context.baseUrl}/api/goals/latest/operations`);
      const operations = await operationsResponse.json();

      assert.equal(operationsResponse.status, 200);
      assert.equal(operations.latestOperationId, preview.operationRun.operationId);
      assert.equal(operations.runs[0].status, 'confirmed');
      assert.deepEqual(operations.runs[0].eventIds, [confirmation.eventSummary.eventId]);
      assert.equal(operations.runs[0].source, 'workbench.event-plan-confirm');
    } finally {
      await cleanupOperationConsoleServer(context);
    }
  });

  it('confirms a review verdict operation and refreshes task review state', async () => {
    const context = await startOperationConsoleServer();

    try {
      const workerPreview = await previewTask5WorkerEvidence(context);

      await confirmTask5WorkerEvidence(context, workerPreview);

      const reviewResponse = await fetch(`${context.baseUrl}/api/goals/${GOAL_ID}/event-plan-preview?${new URLSearchParams({
        command: 'review',
        task: 'task-5',
        reviewer: 'codex-v23-task-5-reviewer',
        verdict: 'needs-revision',
        evidenceRef: 'docs/plans/v23-task-5-review-evidence-2026-05-29.md'
      })}`);
      const reviewPreview = await reviewResponse.json();

      assert.equal(reviewResponse.status, 200);
      assert.deepEqual(validateGoalUpdatePlanContract(reviewPreview), {
        ok: true,
        errors: []
      });
      assert.equal(reviewPreview.command.name, 'symphony goal review');
      assert.equal(reviewPreview.eventSummary.verdict, 'NEEDS_REVISION');
      assert.equal(reviewPreview.operationRun.commandKind, 'review');
      assert.equal(reviewPreview.operationRun.role, 'reviewer');

      const confirmResponse = await fetch(`${context.baseUrl}/api/goals/${GOAL_ID}/event-plan-confirm`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          command: 'review',
          task: 'task-5',
          reviewer: 'codex-v23-task-5-reviewer',
          verdict: 'needs-revision',
          evidenceRef: ['docs/plans/v23-task-5-review-evidence-2026-05-29.md'],
          planHash: reviewPreview.planHash
        })
      });
      const confirmation = await confirmResponse.json();
      const refreshedTask = confirmation.refreshed.progress.tasks.find((task) => task.taskId === 'task-5');

      assert.equal(confirmResponse.status, 200);
      assert.equal(confirmation.contractName, 'goal-event-confirmation.v1');
      assert.equal(confirmation.command, 'review');
      assert.equal(confirmation.status, 'appended');
      assert.equal(confirmation.eventSummary.eventType, 'reviewer.needs-revision');
      assert.equal(confirmation.eventSummary.actorId, 'codex-v23-task-5-reviewer');
      assert.equal(confirmation.eventSummary.verdict, 'NEEDS_REVISION');
      assert.equal(confirmation.operationRun.operationId, reviewPreview.operationRun.operationId);
      assert.equal(confirmation.operationRun.status, 'confirmed');
      assert.equal(confirmation.refreshed.events.log.eventCount, 2);
      assert.equal(refreshedTask.status, 'needs-revision');
      assert.equal(refreshedTask.reviewVerdict, 'NEEDS_REVISION');
      assert.equal(refreshedTask.reviewEvidenceRef, 'docs/plans/v23-task-5-review-evidence-2026-05-29.md');
      assert.equal(confirmation.refreshed.nextAction.contractName, 'goal-next-action.v1');
    } finally {
      await cleanupOperationConsoleServer(context);
    }
  });

  it('rejects confirm requests that omit planHash before appending goal events', async () => {
    const context = await startOperationConsoleServer();

    try {
      await previewTask5WorkerEvidence(context);
      const before = await snapshotGoalEventFiles(context.stateDir);
      const response = await fetch(`${context.baseUrl}/api/goals/${GOAL_ID}/event-plan-confirm`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          command: 'update',
          task: 'task-5',
          event: 'worker.evidence-recorded',
          actor: 'codex-v23-task-5-worker',
          evidenceRef: ['docs/plans/v23-task-5-worker-evidence-2026-05-29.md']
        })
      });
      const envelope = await response.json();

      assert.equal(response.status, 400);
      assert.equal(envelope.contractName, 'error-envelope.v1');
      assert.equal(envelope.error.code, 'invalid-goal-confirm-request');
      assert.match(envelope.error.message, /requires planHash/u);
      assert.equal(envelope.error.safeDetails.field, 'planHash');
      assert.deepEqual(validateErrorEnvelopeContract(envelope), {
        ok: true,
        errors: []
      });
      assert.deepEqual(await snapshotGoalEventFiles(context.stateDir), before);
    } finally {
      await cleanupOperationConsoleServer(context);
    }
  });

  it('returns safe goal-not-found envelopes for unknown goal operation routes', async () => {
    const context = await startOperationConsoleServer();

    try {
      const before = await snapshotGoalEventFiles(context.stateDir);
      const missingGoal = 'v23-missing-goal-operation-console';
      const previewResponse = await fetch(`${context.baseUrl}/api/goals/${missingGoal}/event-plan-preview?${new URLSearchParams({
        command: 'update',
        task: 'task-5',
        event: 'worker.evidence-recorded',
        actor: 'codex-v23-task-5-worker',
        evidenceRef: 'docs/plans/v23-task-5-worker-evidence-2026-05-29.md'
      })}`);
      const confirmResponse = await fetch(`${context.baseUrl}/api/goals/${missingGoal}/event-plan-confirm`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          command: 'update',
          task: 'task-5',
          event: 'worker.evidence-recorded',
          actor: 'codex-v23-task-5-worker',
          evidenceRef: ['docs/plans/v23-task-5-worker-evidence-2026-05-29.md'],
          planHash: 'sha256:0000000000000000000000000000000000000000000000000000000000000000'
        })
      });
      const operationsResponse = await fetch(`${context.baseUrl}/api/goals/${missingGoal}/operations`);

      for (const [label, response] of [
        ['preview', previewResponse],
        ['confirm', confirmResponse],
        ['operations', operationsResponse]
      ]) {
        const body = await response.text();
        const envelope = JSON.parse(body);

        assert.equal(response.status, 404, label);
        assert.equal(envelope.contractName, 'error-envelope.v1', label);
        assert.equal(envelope.error.code, 'goal-not-found', label);
        assert.deepEqual(validateErrorEnvelopeContract(envelope), {
          ok: true,
          errors: []
        }, label);
        assert.doesNotMatch(body, /\/Users\/|multi-coding-agent-symphony|lockfileVersion|createSymphonyConsoleServer/u, label);
      }
      assert.deepEqual(await snapshotGoalEventFiles(context.stateDir), before);
    } finally {
      await cleanupOperationConsoleServer(context);
    }
  });

  it('rejects unsupported subcommands without creating operation runs or goal events', async () => {
    const context = await startOperationConsoleServer();

    try {
      const before = await snapshotGoalEventAndOperationFiles(context.stateDir);
      const previewResponse = await fetch(`${context.baseUrl}/api/goals/latest/event-plan-preview?command=scan&task=task-5`);
      const previewEnvelope = await previewResponse.json();
      const confirmResponse = await fetch(`${context.baseUrl}/api/goals/latest/event-plan-confirm`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          command: 'scan',
          planHash: 'sha256:0000000000000000000000000000000000000000000000000000000000000000'
        })
      });
      const confirmEnvelope = await confirmResponse.json();

      assert.equal(previewResponse.status, 400);
      assert.equal(previewEnvelope.contractName, 'error-envelope.v1');
      assert.equal(previewEnvelope.error.code, 'unsupported-goal-preview-command');
      assert.equal(previewEnvelope.error.safeDetails.command, 'scan');
      assert.deepEqual(validateErrorEnvelopeContract(previewEnvelope), {
        ok: true,
        errors: []
      });
      assert.equal(confirmResponse.status, 400);
      assert.equal(confirmEnvelope.contractName, 'error-envelope.v1');
      assert.equal(confirmEnvelope.error.code, 'unsupported-goal-confirm-command');
      assert.equal(confirmEnvelope.error.safeDetails.command, 'scan');
      assert.deepEqual(validateErrorEnvelopeContract(confirmEnvelope), {
        ok: true,
        errors: []
      });
      assert.deepEqual(await snapshotGoalEventAndOperationFiles(context.stateDir), before);
    } finally {
      await cleanupOperationConsoleServer(context);
    }
  });
});

async function startOperationConsoleServer() {
  const stateDir = await mkdtemp(join(tmpdir(), 'symphony-v23-operation-console-api-'));
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

  const server = createSymphonyConsoleServer({ stateDir });

  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      server.off('error', reject);
      resolve();
    });
  });

  const address = server.address();

  return {
    stateDir,
    server,
    baseUrl: `http://127.0.0.1:${address.port}`
  };
}

async function previewTask5WorkerEvidence(context) {
  const response = await fetch(`${context.baseUrl}/api/goals/${GOAL_ID}/event-plan-preview?${new URLSearchParams({
    command: 'update',
    task: 'task-5',
    event: 'worker.evidence-recorded',
    actor: 'codex-v23-task-5-worker',
    evidenceRef: 'docs/plans/v23-task-5-worker-evidence-2026-05-29.md'
  })}`);
  const plan = await response.json();

  assert.equal(response.status, 200);
  assert.deepEqual(validateGoalUpdatePlanContract(plan), {
    ok: true,
    errors: []
  });

  return plan;
}

async function confirmTask5WorkerEvidence(context, preview) {
  const response = await fetch(`${context.baseUrl}/api/goals/${GOAL_ID}/event-plan-confirm`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      command: 'update',
      task: 'task-5',
      event: 'worker.evidence-recorded',
      actor: 'codex-v23-task-5-worker',
      evidenceRef: ['docs/plans/v23-task-5-worker-evidence-2026-05-29.md'],
      planHash: preview.planHash
    })
  });
  const confirmation = await response.json();

  assert.equal(response.status, 200);
  assert.equal(confirmation.status, 'appended');

  return confirmation;
}

async function cleanupOperationConsoleServer(context) {
  await new Promise((resolve, reject) => {
    context.server.close((error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });
  await rm(context.stateDir, {
    recursive: true,
    force: true
  });
}

async function snapshotGoalEventFiles(root) {
  return await snapshotDirectoryFiles(root, (file) => !file.startsWith('goals/operations/'));
}

async function snapshotGoalEventAndOperationFiles(root) {
  return await snapshotDirectoryFiles(root, () => true);
}

async function snapshotDirectoryFiles(root, includeFile) {
  const files = await collectFiles(root, root);
  const entries = await Promise.all(
    files
      .filter(includeFile)
      .map(async (file) => [
        file,
        await readFile(join(root, file), 'utf8')
      ])
  );

  return Object.fromEntries(entries.sort(([left], [right]) => left.localeCompare(right)));
}

async function collectFiles(root, current) {
  const entries = await readdir(current, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = join(current, entry.name);

    if (entry.isDirectory()) {
      files.push(...await collectFiles(root, fullPath));
    } else if (entry.isFile()) {
      files.push(relative(root, fullPath));
    }
  }

  return files;
}
