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

const GOAL_ID = 'v21-goal-event-registration-workbench';
const RUNBOOK_FIXTURE = 'fixtures/contracts/goal-runbook.v21-goal-event-registration-workbench.v1.json';

describe('v21 Workbench goal event dry-run plan preview API', () => {
  it('serves a latest goal update dry-run preview with plan hash and event summary without writing state', async () => {
    const context = await startPreviewConsoleServer();

    try {
      const before = await snapshotDirectoryFiles(context.stateDir);
      const response = await fetch(`${context.baseUrl}/api/goals/latest/event-plan-preview?${new URLSearchParams({
        command: 'update',
        task: 'task-2',
        event: 'worker.evidence-recorded',
        actor: 'codex-v21-task-2-worker',
        evidenceRef: 'docs/plans/v21-task-2-worker-evidence-2026-05-29.md',
        statement: 'Task 2 worker evidence is ready for independent review.',
        branch: 'v21-task-2-dry-run-plan-preview-endpoint'
      })}`);
      const plan = await response.json();

      assert.equal(response.status, 200);
      assert.deepEqual(validateGoalUpdatePlanContract(plan), {
        ok: true,
        errors: []
      });
      assert.match(plan.planHash, /^sha256:[a-f0-9]{64}$/u);
      assert.equal(plan.command.name, 'symphony goal update');
      assert.equal(plan.eventSummary.eventType, 'worker.evidence-recorded');
      assert.equal(plan.eventSummary.taskId, 'task-2');
      assert.equal(plan.eventSummary.actorId, 'codex-v21-task-2-worker');
      assert.equal(plan.eventSummary.evidenceRefs[0].ref, 'docs/plans/v21-task-2-worker-evidence-2026-05-29.md');
      assert.equal(plan.eventSummary.planHash, plan.planHash);
      assert.equal(plan.eventSummary.writesInDryRun, false);
      assert.equal(plan.previewEndpoint.dryRunOnly, true);
      assert.equal(plan.previewEndpoint.genericShellRunner, false);
      assert.equal(plan.previewEndpoint.confirmAvailable, false);
      assert.equal(plan.confirm.copyOnlyCommand.includes('--confirm --plan-hash'), true);

      assert.deepEqual(await snapshotDirectoryFiles(context.stateDir), before);
    } finally {
      await cleanupPreviewConsoleServer(context);
    }
  });

  it('serves review and gate dry-run previews only through constrained command parameters', async () => {
    const context = await startPreviewConsoleServer();

    try {
      const before = await snapshotDirectoryFiles(context.stateDir);
      const reviewResponse = await fetch(`${context.baseUrl}/api/goals/${GOAL_ID}/event-plan-preview?${new URLSearchParams({
        command: 'review',
        task: 'task-2',
        reviewer: 'codex-v21-task-2-reviewer',
        verdict: 'approved',
        evidenceRef: 'docs/plans/v21-task-2-review-evidence-2026-05-29.md'
      })}`);
      const gateResponse = await fetch(`${context.baseUrl}/api/goals/${GOAL_ID}/event-plan-preview?${new URLSearchParams({
        command: 'gate',
        task: 'task-2',
        gate: 'main-verification',
        status: 'passed',
        verifier: 'codex-v21-task-2-main-verifier',
        evidenceRef: 'docs/plans/v21-task-2-main-verification-evidence-2026-05-29.md'
      })}`);
      const reviewPlan = await reviewResponse.json();
      const gatePlan = await gateResponse.json();

      assert.equal(reviewResponse.status, 200);
      assert.equal(gateResponse.status, 200);
      assert.deepEqual(validateGoalUpdatePlanContract(reviewPlan), {
        ok: true,
        errors: []
      });
      assert.deepEqual(validateGoalUpdatePlanContract(gatePlan), {
        ok: true,
        errors: []
      });
      assert.equal(reviewPlan.command.name, 'symphony goal review');
      assert.equal(reviewPlan.eventSummary.verdict, 'APPROVED');
      assert.equal(reviewPlan.eventSummary.actorRole, 'reviewer');
      assert.equal(gatePlan.command.name, 'symphony goal gate');
      assert.equal(gatePlan.eventSummary.gate, 'main-verification');
      assert.equal(gatePlan.eventSummary.gateStatus, 'passed');
      assert.equal(gatePlan.eventSummary.actorRole, 'main-verifier');

      assert.deepEqual(await snapshotDirectoryFiles(context.stateDir), before);
    } finally {
      await cleanupPreviewConsoleServer(context);
    }
  });

  it('rejects arbitrary commands, confirm inputs, unknown parameters, and unsafe goal refs safely', async () => {
    const context = await startPreviewConsoleServer();

    try {
      const before = await snapshotDirectoryFiles(context.stateDir);
      const probes = [
        {
          path: '/api/goals/latest/event-plan-preview?command=scan&task=task-2',
          status: 400,
          code: 'unsupported-goal-preview-command'
        },
        {
          path: '/api/goals/latest/event-plan-preview?command=update&task=task-2&event=worker.started&actor=codex-worker&confirm=true',
          status: 400,
          code: 'invalid-goal-preview-request'
        },
        {
          path: '/api/goals/latest/event-plan-preview?command=update&task=task-2&event=worker.started&actor=codex-worker&path=package.json',
          status: 400,
          code: 'invalid-goal-preview-request'
        },
        {
          path: '/api/goals/%2e%2e%2fpackage.json/event-plan-preview?command=update&task=task-2&event=worker.started&actor=codex-worker',
          status: 400,
          code: 'invalid-goal-ref'
        }
      ];

      for (const probe of probes) {
        const response = await fetch(`${context.baseUrl}${probe.path}`);
        const body = await response.text();
        const envelope = JSON.parse(body);

        assert.equal(response.status, probe.status, probe.path);
        assert.equal(envelope.contractName, 'error-envelope.v1');
        assert.equal(envelope.error.code, probe.code);
        assert.deepEqual(validateErrorEnvelopeContract(envelope), {
          ok: true,
          errors: []
        });
        assert.doesNotMatch(body, /\/Users\/|multi-coding-agent-symphony|lockfileVersion|createSymphonyConsoleServer/u);
      }

      assert.deepEqual(await snapshotDirectoryFiles(context.stateDir), before);
    } finally {
      await cleanupPreviewConsoleServer(context);
    }
  });
});

async function startPreviewConsoleServer() {
  const stateDir = await mkdtemp(join(tmpdir(), 'symphony-v21-preview-api-'));
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

async function cleanupPreviewConsoleServer(context) {
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

async function snapshotDirectoryFiles(root) {
  const files = await collectFiles(root, root);
  const entries = await Promise.all(files.map(async (file) => [
    file,
    await readFile(join(root, file), 'utf8')
  ]));

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
