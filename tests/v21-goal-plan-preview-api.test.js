import { mkdir, mkdtemp, readFile, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, relative } from 'node:path';
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { createSymphonyConsoleServer } from '../src/symphony/console.js';
import { appendGoalEvent } from '../src/symphony/goal-event-journal.js';
import { validateErrorEnvelopeContract } from '../src/symphony/error-envelope.js';
import { validateGoalUpdatePlanContract } from '../src/symphony/goal-event-contracts.js';
import {
  buildGoalRunbookInitPlan,
  confirmGoalRunbookInit
} from '../src/symphony/goal-runbook-registry.js';

const GOAL_ID = 'v21-goal-event-registration-workbench';
const RUNBOOK_FIXTURE = 'fixtures/contracts/goal-runbook.v21-goal-event-registration-workbench.v1.json';
const TASK_IDS = Object.freeze(['task-1', 'task-2', 'task-3', 'task-4', 'task-5']);
const RELEASE_GATES_WITHOUT_TAG = Object.freeze([
  'release.pnpm-check',
  'release.pnpm-test',
  'release.workbench-build',
  'release.mutation-gate',
  'release.audit-high',
  'release.diff-check',
  'release.mcas-doctor',
  'release.docs-updated'
]);

describe('v21 Workbench goal event dry-run plan preview API', () => {
  it('serves a latest goal update dry-run preview with plan hash, event summary, and operation tracking without writing goal event state', async () => {
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
      assert.equal(plan.operationRun.goalId, GOAL_ID);
      assert.equal(plan.operationRun.taskId, 'task-2');
      assert.equal(plan.operationRun.role, 'worker');
      assert.equal(plan.operationRun.commandKind, 'update');
      assert.equal(plan.operationRun.status, 'dry-run-planned');
      assert.match(plan.operationRun.operationId, /^op_[a-f0-9]{16}$/u);
      assert.equal(plan.previewEndpoint.dryRunOnly, true);
      assert.equal(plan.previewEndpoint.genericShellRunner, false);
      assert.equal(plan.previewEndpoint.confirmAvailable, false);
      assert.equal(plan.confirm.copyOnlyCommand.includes('--confirm --plan-hash'), true);

      assert.deepEqual(await snapshotDirectoryFiles(context.stateDir), before);

      const operationsResponse = await fetch(`${context.baseUrl}/api/goals/latest/operations`);
      const operations = await operationsResponse.json();

      assert.equal(operationsResponse.status, 200);
      assert.equal(operations.contractName, 'goal-operation-runs.v1');
      assert.equal(operations.operationCount, 1);
      assert.equal(operations.latestOperationId, plan.operationRun.operationId);
      assert.equal(operations.runs[0].status, 'dry-run-planned');
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

  it('accepts controlled repo-doc and managed artifact evidence refs in preview plans', async () => {
    const context = await startPreviewConsoleServer();

    try {
      const probes = [
        {
          command: 'update',
          params: {
            command: 'update',
            task: 'task-4',
            event: 'worker.evidence-recorded',
            actor: 'codex-v21-task-4-worker',
            evidenceRef: [
              'docs/plans/v21-task-4-worker-evidence-2026-05-29.md',
              'artifact-ref:artifact:run-1:evidence'
            ]
          }
        },
        {
          command: 'review',
          params: {
            command: 'review',
            task: 'task-4',
            reviewer: 'codex-v21-task-4-reviewer',
            verdict: 'needs-revision',
            evidenceRef: [
              'repo-doc:docs/plans/v21-task-4-review-evidence-2026-05-29.md',
              'artifact-ref:artifact:run-1:review'
            ]
          }
        },
        {
          command: 'gate',
          params: {
            command: 'gate',
            task: 'task-4',
            gate: 'main-verification',
            status: 'failed',
            verifier: 'codex-v21-task-4-main-verifier',
            evidenceRef: [
              'docs/plans/v21-task-4-main-verification-evidence-2026-05-29.md',
              'artifact-ref:artifact:run-1:gate'
            ]
          }
        }
      ];

      for (const probe of probes) {
        const response = await fetch(`${context.baseUrl}/api/goals/${GOAL_ID}/event-plan-preview?${buildSearchParams(probe.params)}`);
        const plan = await response.json();

        assert.equal(response.status, 200, probe.command);
        assert.deepEqual(validateGoalUpdatePlanContract(plan), {
          ok: true,
          errors: []
        }, probe.command);
        assert.deepEqual(plan.eventSummary.evidenceRefs.map((ref) => ref.kind), ['repo-doc', 'artifact-ref'], probe.command);
        assert.match(plan.eventSummary.evidenceRefs[0].ref, /^docs\/plans\//u, probe.command);
        assert.equal(plan.eventSummary.evidenceRefs[1].ref, `artifact:run-1:${probe.command === 'update' ? 'evidence' : probe.command}`, probe.command);
        assert.equal(plan.previewEndpoint.genericShellRunner, false, probe.command);
        assert.equal(plan.eventSummary.writesInDryRun, false, probe.command);
      }
    } finally {
      await cleanupPreviewConsoleServer(context);
    }
  });

  it('returns a clear error envelope for uncontrolled preview evidence refs without appending', async () => {
    const context = await startPreviewConsoleServer();

    try {
      const before = await snapshotDirectoryFiles(context.stateDir);
      const probes = [
        {
          name: 'update command evidence',
          params: {
            command: 'update',
            task: 'task-4',
            event: 'worker.evidence-recorded',
            actor: 'codex-v21-task-4-worker',
            evidenceRef: 'command-evidence:approved-looking-note'
          }
        },
        {
          name: 'review external note',
          params: {
            command: 'review',
            task: 'task-4',
            reviewer: 'codex-v21-task-4-reviewer',
            verdict: 'approved',
            evidenceRef: 'external-note:approved'
          }
        },
        {
          name: 'gate command evidence',
          params: {
            command: 'gate',
            task: 'task-4',
            gate: 'main-verification',
            status: 'passed',
            verifier: 'codex-v21-task-4-main-verifier',
            evidenceRef: 'command-evidence:gate-passed'
          }
        },
        {
          name: 'absolute path',
          params: {
            command: 'update',
            task: 'task-4',
            event: 'worker.evidence-recorded',
            actor: 'codex-v21-task-4-worker',
            evidenceRef: '/Users/example/secret.md'
          }
        }
      ];

      for (const probe of probes) {
        const response = await fetch(`${context.baseUrl}/api/goals/${GOAL_ID}/event-plan-preview?${buildSearchParams(probe.params)}`);
        const envelope = await response.json();

        assert.equal(response.status, 400, probe.name);
        assert.equal(envelope.contractName, 'error-envelope.v1', probe.name);
        assert.equal(envelope.error.code, 'invalid-evidence-ref', probe.name);
        assert.match(envelope.error.message, /controlled docs\/plans or managed artifact reference/u, probe.name);
        assert.deepEqual(validateErrorEnvelopeContract(envelope), {
          ok: true,
          errors: []
        }, probe.name);
      }
      assert.deepEqual(await snapshotDirectoryFiles(context.stateDir), before);
    } finally {
      await cleanupPreviewConsoleServer(context);
    }
  });

  it('rejects uncontrolled confirm evidence refs before appending', async () => {
    const context = await startPreviewConsoleServer();

    try {
      const before = await snapshotDirectoryFiles(context.stateDir);
      const probes = [
        {
          name: 'update command evidence',
          body: {
            command: 'update',
            task: 'task-4',
            event: 'worker.evidence-recorded',
            actor: 'codex-v21-task-4-worker',
            evidenceRef: ['command-evidence:approved-looking-note'],
            planHash: 'sha256:0000000000000000000000000000000000000000000000000000000000000000'
          }
        },
        {
          name: 'review external note',
          body: {
            command: 'review',
            task: 'task-4',
            reviewer: 'codex-v21-task-4-reviewer',
            verdict: 'approved',
            evidenceRef: ['external-note:approved'],
            planHash: 'sha256:0000000000000000000000000000000000000000000000000000000000000000'
          }
        },
        {
          name: 'gate command evidence',
          body: {
            command: 'gate',
            task: 'task-4',
            gate: 'main-verification',
            status: 'passed',
            verifier: 'codex-v21-task-4-main-verifier',
            evidenceRef: ['command-evidence:gate-passed'],
            planHash: 'sha256:0000000000000000000000000000000000000000000000000000000000000000'
          }
        }
      ];

      for (const probe of probes) {
        const response = await fetch(`${context.baseUrl}/api/goals/${GOAL_ID}/event-plan-confirm`, {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(probe.body)
        });
        const envelope = await response.json();

        assert.equal(response.status, 400, probe.name);
        assert.equal(envelope.contractName, 'error-envelope.v1', probe.name);
        assert.equal(envelope.error.code, 'invalid-evidence-ref', probe.name);
        assert.match(envelope.error.message, /controlled docs\/plans or managed artifact reference/u, probe.name);
        assert.deepEqual(validateErrorEnvelopeContract(envelope), {
          ok: true,
          errors: []
        }, probe.name);
      }

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

  it('confirms a matching update plan hash, appends one event, and returns refreshed goal state', async () => {
    const context = await startPreviewConsoleServer();

    try {
      const previewResponse = await fetch(`${context.baseUrl}/api/goals/latest/event-plan-preview?${new URLSearchParams({
        command: 'update',
        task: 'task-3',
        event: 'worker.evidence-recorded',
        actor: 'codex-v21-task-3-worker',
        evidenceRef: 'docs/plans/v21-task-3-worker-evidence-2026-05-29.md',
        statement: 'Task 3 worker evidence is ready for independent review.',
        branch: 'v21-task-3-confirm-event-append-flow'
      })}`);
      const previewPlan = await previewResponse.json();
      const confirmResponse = await fetch(`${context.baseUrl}/api/goals/latest/event-plan-confirm`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          command: 'update',
          task: 'task-3',
          event: 'worker.evidence-recorded',
          actor: 'codex-v21-task-3-worker',
          evidenceRef: ['docs/plans/v21-task-3-worker-evidence-2026-05-29.md'],
          statement: 'Task 3 worker evidence is ready for independent review.',
          branch: 'v21-task-3-confirm-event-append-flow',
          planHash: previewPlan.planHash
        })
      });
      const confirmation = await confirmResponse.json();

      assert.equal(confirmResponse.status, 200);
      assert.equal(confirmation.contractName, 'goal-event-confirmation.v1');
      assert.equal(confirmation.command, 'update');
      assert.equal(confirmation.status, 'appended');
      assert.equal(confirmation.written, true);
      assert.equal(confirmation.appendOnly, true);
      assert.equal(confirmation.planHash, previewPlan.planHash);
      assert.equal(confirmation.eventSummary.eventType, 'worker.evidence-recorded');
      assert.equal(confirmation.eventSummary.taskId, 'task-3');
      assert.equal(confirmation.eventSummary.actorId, 'codex-v21-task-3-worker');
      assert.equal(confirmation.operationRun.operationId, previewPlan.operationRun.operationId);
      assert.equal(confirmation.operationRun.status, 'confirmed');
      assert.deepEqual(confirmation.operationRun.eventIds, [confirmation.eventSummary.eventId]);
      assert.equal(confirmation.refreshed.events.contractName, 'goal-event-log.v1');
      assert.equal(confirmation.refreshed.events.log.eventCount, 1);
      assert.equal(confirmation.refreshed.progress.contractName, 'goal-progress-ledger.v1');
      assert.equal(confirmation.refreshed.progress.tasks.find((task) => task.taskId === 'task-3').workerEvidenceRef, 'docs/plans/v21-task-3-worker-evidence-2026-05-29.md');
      assert.equal(confirmation.refreshed.nextAction.contractName, 'goal-next-action.v1');
      assert.equal(confirmation.confirmEndpoint.genericShellRunner, false);
      assert.deepEqual(confirmation.confirmEndpoint.constrainedCommands, ['update', 'review', 'gate']);
    } finally {
      await cleanupPreviewConsoleServer(context);
    }
  });

  it('confirms controlled worker success and failure events without frontend-created status', async () => {
    const context = await startPreviewConsoleServer();

    try {
      const passedConfirmation = await previewAndConfirmGoalEvent(context, {
        previewParams: {
          command: 'update',
          task: 'task-5',
          event: 'worker.self-check-passed',
          actor: 'codex-v21-task-5-worker',
          evidenceRef: 'docs/plans/v21-task-5-worker-evidence-2026-05-29.md',
          statement: 'Task 5 worker self-check passed.',
          branch: 'v21-task-5-event-registration-tests-and-docs'
        },
        confirmBody: {
          command: 'update',
          task: 'task-5',
          event: 'worker.self-check-passed',
          actor: 'codex-v21-task-5-worker',
          evidenceRef: ['docs/plans/v21-task-5-worker-evidence-2026-05-29.md'],
          statement: 'Task 5 worker self-check passed.',
          branch: 'v21-task-5-event-registration-tests-and-docs'
        }
      });
      const failedConfirmation = await previewAndConfirmGoalEvent(context, {
        previewParams: {
          command: 'update',
          task: 'task-4',
          event: 'worker.self-check-failed',
          actor: 'codex-v21-task-4-worker',
          evidenceRef: 'docs/plans/v21-task-4-worker-evidence-2026-05-29.md',
          statement: 'Task 4 worker self-check failed.'
        },
        confirmBody: {
          command: 'update',
          task: 'task-4',
          event: 'worker.self-check-failed',
          actor: 'codex-v21-task-4-worker',
          evidenceRef: ['docs/plans/v21-task-4-worker-evidence-2026-05-29.md'],
          statement: 'Task 4 worker self-check failed.'
        }
      });

      assert.equal(passedConfirmation.command, 'update');
      assert.equal(passedConfirmation.eventSummary.eventType, 'worker.self-check-passed');
      assert.equal(passedConfirmation.eventSummary.actorRole, 'worker');
      assert.equal(passedConfirmation.refreshed.progress.tasks.find((task) => task.taskId === 'task-5').status, 'self-checked');
      assert.equal(failedConfirmation.command, 'update');
      assert.equal(failedConfirmation.eventSummary.eventType, 'worker.self-check-failed');
      assert.equal(failedConfirmation.eventSummary.actorRole, 'worker');
      assert.equal(failedConfirmation.refreshed.progress.tasks.find((task) => task.taskId === 'task-4').status, 'unknown');
      assert.equal(failedConfirmation.refreshed.events.log.eventCount, 2);
      assert.deepEqual(
        failedConfirmation.refreshed.events.events.map((event) => event.eventType),
        ['worker.self-check-passed', 'worker.self-check-failed']
      );
      assert.equal(failedConfirmation.confirmEndpoint.genericShellRunner, false);
    } finally {
      await cleanupPreviewConsoleServer(context);
    }
  });

  it('confirms review approved and needs-revision verdicts and rejects worker self-approval', async () => {
    const context = await startPreviewConsoleServer();

    try {
      await previewAndConfirmGoalEvent(context, {
        previewParams: {
          command: 'update',
          task: 'task-1',
          event: 'worker.evidence-recorded',
          actor: 'codex-v21-task-1-worker',
          evidenceRef: 'docs/plans/v21-task-1-worker-evidence-2026-05-29.md'
        },
        confirmBody: {
          command: 'update',
          task: 'task-1',
          event: 'worker.evidence-recorded',
          actor: 'codex-v21-task-1-worker',
          evidenceRef: ['docs/plans/v21-task-1-worker-evidence-2026-05-29.md']
        }
      });

      const beforeSelfApprovalProbe = await snapshotDirectoryFiles(context.stateDir);
      const selfApprovalResponse = await fetch(`${context.baseUrl}/api/goals/${GOAL_ID}/event-plan-preview?${new URLSearchParams({
        command: 'review',
        task: 'task-1',
        reviewer: 'codex-v21-task-1-worker',
        verdict: 'approved',
        evidenceRef: 'docs/plans/v21-task-1-review-evidence-2026-05-29.md'
      })}`);
      const selfApprovalEnvelope = await selfApprovalResponse.json();

      assert.equal(selfApprovalResponse.status, 400);
      assert.equal(selfApprovalEnvelope.contractName, 'error-envelope.v1');
      assert.equal(selfApprovalEnvelope.error.code, 'reviewer-worker-conflict');
      assert.match(selfApprovalEnvelope.error.message, /Reviewer id must differ/u);
      assert.deepEqual(validateErrorEnvelopeContract(selfApprovalEnvelope), {
        ok: true,
        errors: []
      });
      assert.deepEqual(await snapshotDirectoryFiles(context.stateDir), beforeSelfApprovalProbe);

      const approvedConfirmation = await previewAndConfirmGoalEvent(context, {
        previewParams: {
          command: 'review',
          task: 'task-1',
          reviewer: 'codex-v21-task-1-reviewer',
          verdict: 'approved',
          evidenceRef: 'docs/plans/v21-task-1-review-evidence-2026-05-29.md'
        },
        confirmBody: {
          command: 'review',
          task: 'task-1',
          reviewer: 'codex-v21-task-1-reviewer',
          verdict: 'approved',
          evidenceRef: ['docs/plans/v21-task-1-review-evidence-2026-05-29.md']
        }
      });
      const needsRevisionConfirmation = await previewAndConfirmGoalEvent(context, {
        previewParams: {
          command: 'review',
          task: 'task-2',
          reviewer: 'codex-v21-task-2-reviewer',
          verdict: 'needs-revision',
          evidenceRef: 'docs/plans/v21-task-2-review-evidence-2026-05-29.md',
          failedCommand: 'pnpm test'
        },
        confirmBody: {
          command: 'review',
          task: 'task-2',
          reviewer: 'codex-v21-task-2-reviewer',
          verdict: 'needs-revision',
          evidenceRef: ['docs/plans/v21-task-2-review-evidence-2026-05-29.md'],
          failedCommand: ['pnpm test']
        }
      });

      assert.equal(approvedConfirmation.command, 'review');
      assert.equal(approvedConfirmation.eventSummary.eventType, 'reviewer.approved');
      assert.equal(approvedConfirmation.eventSummary.verdict, 'APPROVED');
      assert.equal(approvedConfirmation.refreshed.progress.tasks.find((task) => task.taskId === 'task-1').status, 'approved');
      assert.equal(needsRevisionConfirmation.command, 'review');
      assert.equal(needsRevisionConfirmation.eventSummary.eventType, 'reviewer.needs-revision');
      assert.equal(needsRevisionConfirmation.eventSummary.verdict, 'NEEDS_REVISION');
      assert.deepEqual(needsRevisionConfirmation.eventSummary.failedCommands, ['pnpm test']);
      assert.deepEqual(needsRevisionConfirmation.refreshed.events.events.at(-1).metadata.failedCommands, ['pnpm test']);
      assert.equal(needsRevisionConfirmation.refreshed.progress.tasks.find((task) => task.taskId === 'task-2').status, 'needs-revision');
      assert.equal(needsRevisionConfirmation.refreshed.progress.tasks.find((task) => task.taskId === 'task-2').reviewVerdict, 'NEEDS_REVISION');
      assert.equal(needsRevisionConfirmation.refreshed.events.log.eventCount, 3);
    } finally {
      await cleanupPreviewConsoleServer(context);
    }
  });

  it('confirms main verification passed and failed gates and rejects incomplete gate input', async () => {
    const context = await startPreviewConsoleServer();

    try {
      const passedConfirmation = await previewAndConfirmGoalEvent(context, {
        previewParams: {
          command: 'gate',
          task: 'task-1',
          gate: 'main-verification',
          status: 'passed',
          verifier: 'codex-v21-task-1-main-verifier',
          evidenceRef: 'docs/plans/v21-task-1-main-verification-evidence-2026-05-29.md'
        },
        confirmBody: {
          command: 'gate',
          task: 'task-1',
          gate: 'main-verification',
          status: 'passed',
          verifier: 'codex-v21-task-1-main-verifier',
          evidenceRef: ['docs/plans/v21-task-1-main-verification-evidence-2026-05-29.md']
        }
      });
      const failedConfirmation = await previewAndConfirmGoalEvent(context, {
        previewParams: {
          command: 'gate',
          task: 'task-2',
          gate: 'main-verification',
          status: 'failed',
          verifier: 'codex-v21-task-2-main-verifier',
          evidenceRef: 'docs/plans/v21-task-2-main-verification-evidence-2026-05-29.md',
          failedCommand: 'pnpm workbench:build'
        },
        confirmBody: {
          command: 'gate',
          task: 'task-2',
          gate: 'main-verification',
          status: 'failed',
          verifier: 'codex-v21-task-2-main-verifier',
          evidenceRef: ['docs/plans/v21-task-2-main-verification-evidence-2026-05-29.md'],
          failedCommand: ['pnpm workbench:build']
        }
      });

      const beforeInvalidGateProbe = await snapshotDirectoryFiles(context.stateDir);
      const invalidGateResponse = await fetch(`${context.baseUrl}/api/goals/${GOAL_ID}/event-plan-preview?${new URLSearchParams({
        command: 'gate',
        gate: 'main-verification',
        status: 'passed',
        verifier: 'codex-v21-main-verifier',
        evidenceRef: 'docs/plans/v21-main-verification-evidence-2026-05-29.md'
      })}`);
      const invalidGateEnvelope = await invalidGateResponse.json();

      assert.equal(passedConfirmation.command, 'gate');
      assert.equal(passedConfirmation.eventSummary.eventType, 'main.verification-passed');
      assert.equal(passedConfirmation.eventSummary.gate, 'main-verification');
      assert.equal(passedConfirmation.eventSummary.gateStatus, 'passed');
      assert.equal(passedConfirmation.refreshed.progress.tasks.find((task) => task.taskId === 'task-1').status, 'main-verified');
      assert.equal(failedConfirmation.command, 'gate');
      assert.equal(failedConfirmation.eventSummary.eventType, 'main.verification-failed');
      assert.equal(failedConfirmation.eventSummary.gateStatus, 'failed');
      assert.deepEqual(failedConfirmation.eventSummary.failedCommands, ['pnpm workbench:build']);
      assert.deepEqual(failedConfirmation.refreshed.events.events.at(-1).metadata.failedCommands, ['pnpm workbench:build']);
      assert.equal(failedConfirmation.refreshed.progress.tasks.find((task) => task.taskId === 'task-2').status, 'unknown');
      assert.equal(failedConfirmation.refreshed.events.log.eventCount, 2);
      assert.equal(invalidGateResponse.status, 400);
      assert.equal(invalidGateEnvelope.contractName, 'error-envelope.v1');
      assert.equal(invalidGateEnvelope.error.code, 'missing-main-verification-task');
      assert.deepEqual(validateErrorEnvelopeContract(invalidGateEnvelope), {
        ok: true,
        errors: []
      });
      assert.deepEqual(await snapshotDirectoryFiles(context.stateDir), beforeInvalidGateProbe);
    } finally {
      await cleanupPreviewConsoleServer(context);
    }
  });

  it('refreshes closeout after controlled release.ready dry-run and plan-hash confirm', async () => {
    const context = await startPreviewConsoleServer();

    try {
      await appendCompleteV21EvidenceExceptReleaseReady({
        stateDir: context.stateDir
      });

      const previewResponse = await fetch(`${context.baseUrl}/api/goals/${GOAL_ID}/event-plan-preview?${new URLSearchParams({
        command: 'gate',
        gate: 'release.ready',
        status: 'declared',
        verifier: 'codex-v21-release-manager',
        evidenceRef: 'docs/plans/v21-release-evidence-2026-05-29.md'
      })}`);
      const preview = await previewResponse.json();

      assert.equal(previewResponse.status, 200);
      assert.equal(preview.command.name, 'symphony goal gate');
      assert.equal(preview.eventSummary.eventType, 'release.ready-declared');
      assert.equal(preview.eventSummary.gate, 'release.ready');
      assert.equal(preview.eventSummary.gateStatus, 'declared');
      assert.match(preview.confirm.copyOnlyCommand, /--gate release\.ready --status declared/u);
      assert.match(preview.confirm.copyOnlyCommand, /--confirm --plan-hash sha256:[a-f0-9]{64}/u);

      const confirmResponse = await fetch(`${context.baseUrl}/api/goals/${GOAL_ID}/event-plan-confirm`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          command: 'gate',
          gate: 'release.ready',
          status: 'declared',
          verifier: 'codex-v21-release-manager',
          evidenceRef: ['docs/plans/v21-release-evidence-2026-05-29.md'],
          planHash: preview.planHash
        })
      });
      const confirmation = await confirmResponse.json();

      assert.equal(confirmResponse.status, 200);
      assert.equal(confirmation.contractName, 'goal-event-confirmation.v1');
      assert.equal(confirmation.eventSummary.eventType, 'release.ready-declared');
      assert.equal(confirmation.refreshed.closeout.contractName, 'goal-closeout-report.v1');
      assert.equal(confirmation.refreshed.closeout.summary.releaseReady, true);
      assert.equal(confirmation.refreshed.closeout.missing.length, 0);
      assert.deepEqual(
        confirmation.confirmEndpoint.refreshes,
        [
          'goal-progress-ledger.v1',
          'goal-event-log.v1',
          'goal-next-action.v1',
          'goal-closeout-report.v1'
        ]
      );
      assert.equal(confirmation.safety.genericShellRunner, false);
      assert.equal(confirmation.safety.browserExecutionAvailable, false);
    } finally {
      await cleanupPreviewConsoleServer(context);
    }
  });

  it('rejects mismatched plan hashes, unsupported confirm commands, unknown fields, and unsafe goal refs without appending', async () => {
    const context = await startPreviewConsoleServer();

    try {
      const before = await snapshotDirectoryFiles(context.stateDir);
      const previewResponse = await fetch(`${context.baseUrl}/api/goals/${GOAL_ID}/event-plan-preview?${new URLSearchParams({
        command: 'update',
        task: 'task-3',
        event: 'worker.started',
        actor: 'codex-v21-task-3-worker'
      })}`);
      const previewPlan = await previewResponse.json();
      const probes = [
        {
          path: `/api/goals/${GOAL_ID}/event-plan-confirm`,
          body: {
            command: 'update',
            task: 'task-3',
            event: 'worker.started',
            actor: 'codex-v21-task-3-worker',
            planHash: 'sha256:0000000000000000000000000000000000000000000000000000000000000000'
          },
          code: 'plan-hash-mismatch'
        },
        {
          path: `/api/goals/${GOAL_ID}/event-plan-confirm`,
          body: {
            command: 'scan',
            planHash: previewPlan.planHash
          },
          code: 'unsupported-goal-confirm-command'
        },
        {
          path: `/api/goals/${GOAL_ID}/event-plan-confirm`,
          body: {
            command: 'update',
            task: 'task-3',
            event: 'worker.started',
            actor: 'codex-v21-task-3-worker',
            path: 'package.json',
            planHash: previewPlan.planHash
          },
          code: 'invalid-goal-confirm-request'
        },
        {
          path: '/api/goals/%2e%2e%2fpackage.json/event-plan-confirm',
          body: {
            command: 'update',
            task: 'task-3',
            event: 'worker.started',
            actor: 'codex-v21-task-3-worker',
            planHash: previewPlan.planHash
          },
          code: 'invalid-goal-ref'
        }
      ];

      for (const probe of probes) {
        const response = await fetch(`${context.baseUrl}${probe.path}`, {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(probe.body)
        });
        const body = await response.text();
        const envelope = JSON.parse(body);

        assert.equal(response.status, 400, probe.path);
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

async function appendCompleteV21EvidenceExceptReleaseReady({ stateDir }) {
  for (const taskId of TASK_IDS) {
    await appendCompleteTaskLifecycle({
      stateDir,
      taskId
    });
  }

  for (const gateName of RELEASE_GATES_WITHOUT_TAG) {
    await appendPassedReleaseGate({
      stateDir,
      gateName
    });
  }
}

async function appendCompleteTaskLifecycle({ stateDir, taskId }) {
  const safeTaskId = taskId.replaceAll('-', '_');
  const events = [{
    eventId: `evt_v21_${safeTaskId}_worker_evidence`,
    eventType: 'worker.evidence-recorded',
    phase: 'implement',
    actor: {
      role: 'worker',
      id: `codex-v21-${taskId}-worker`
    },
    evidenceRefs: [{
      kind: 'repo-doc',
      ref: `docs/plans/v21-${taskId}-worker-evidence-2026-05-29.md`,
      label: `${taskId} worker evidence`
    }],
    statement: `${taskId} worker evidence recorded.`
  }, {
    eventId: `evt_v21_${safeTaskId}_reviewer_approved`,
    eventType: 'reviewer.approved',
    phase: 'review',
    actor: {
      role: 'reviewer',
      id: `codex-v21-${taskId}-reviewer`
    },
    evidenceRefs: [{
      kind: 'repo-doc',
      ref: `docs/plans/v21-${taskId}-review-evidence-2026-05-29.md`,
      label: `${taskId} review evidence`
    }],
    statement: `${taskId} reviewer approved.`,
    review: {
      verdict: 'APPROVED'
    }
  }, {
    eventId: `evt_v21_${safeTaskId}_main_verified`,
    eventType: 'main.verification-passed',
    phase: 'main-verification',
    actor: {
      role: 'main-verifier',
      id: `codex-v21-${taskId}-main-verifier`
    },
    evidenceRefs: [{
      kind: 'repo-doc',
      ref: `docs/plans/v21-${taskId}-main-verification-evidence-2026-05-29.md`,
      label: `${taskId} main verification evidence`
    }],
    statement: `${taskId} main verification passed.`,
    gate: {
      name: 'main-verification',
      status: 'passed'
    }
  }];

  for (const event of events) {
    await appendGoalEvent({
      stateDir,
      mode: 'confirm',
      event: {
        goalId: GOAL_ID,
        taskId,
        occurredAt: '2026-05-31T00:06:32.754Z',
        branch: null,
        commit: null,
        ...event
      }
    });
  }
}

async function appendPassedReleaseGate({ stateDir, gateName }) {
  await appendGoalEvent({
    stateDir,
    mode: 'confirm',
    event: {
      eventId: `evt_v21_${gateName.replaceAll('.', '_').replaceAll('-', '_')}_passed`,
      goalId: GOAL_ID,
      taskId: null,
      eventType: 'release.gate-passed',
      phase: 'release-gate',
      actor: {
        role: 'release-verifier',
        id: 'codex-v21-release-manager'
      },
      occurredAt: '2026-05-31T00:06:32.754Z',
      branch: null,
      commit: null,
      evidenceRefs: [{
        kind: 'repo-doc',
        ref: 'docs/plans/v21-release-evidence-2026-05-29.md',
        label: `${gateName} evidence`
      }],
      statement: `Release gate ${gateName} passed.`,
      gate: {
        name: gateName,
        status: 'passed'
      }
    }
  });
}

async function previewAndConfirmGoalEvent(context, { previewParams, confirmBody }) {
  const previewResponse = await fetch(`${context.baseUrl}/api/goals/${GOAL_ID}/event-plan-preview?${buildSearchParams(previewParams)}`);
  const previewPlan = await previewResponse.json();

  assert.equal(previewResponse.status, 200, JSON.stringify(previewParams));
  assert.deepEqual(validateGoalUpdatePlanContract(previewPlan), {
    ok: true,
    errors: []
  }, JSON.stringify(previewParams));
  assert.equal(previewPlan.eventSummary.writesInDryRun, false);

  const confirmResponse = await fetch(`${context.baseUrl}/api/goals/${GOAL_ID}/event-plan-confirm`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      ...confirmBody,
      planHash: previewPlan.planHash
    })
  });
  const confirmation = await confirmResponse.json();

  assert.equal(confirmResponse.status, 200, JSON.stringify(confirmBody));
  assert.equal(confirmation.contractName, 'goal-event-confirmation.v1');
  assert.equal(confirmation.status, 'appended');
  assert.equal(confirmation.written, true);
  assert.equal(confirmation.appendOnly, true);
  assert.equal(confirmation.planHash, previewPlan.planHash);
  assert.equal(confirmation.refreshed.events.contractName, 'goal-event-log.v1');
  assert.equal(confirmation.refreshed.progress.contractName, 'goal-progress-ledger.v1');
  assert.equal(confirmation.refreshed.nextAction.contractName, 'goal-next-action.v1');
  assert.equal(confirmation.confirmEndpoint.genericShellRunner, false);
  assert.deepEqual(confirmation.confirmEndpoint.constrainedCommands, ['update', 'review', 'gate']);

  return confirmation;
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
  const entries = await Promise.all(
    files
      .filter((file) => !file.startsWith('goals/operations/'))
      .map(async (file) => [
        file,
        await readFile(join(root, file), 'utf8')
      ])
  );

  return Object.fromEntries(entries.sort(([left], [right]) => left.localeCompare(right)));
}

function buildSearchParams(params) {
  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (Array.isArray(value)) {
      for (const entry of value) {
        searchParams.append(key, entry);
      }
    } else {
      searchParams.append(key, value);
    }
  }

  return searchParams;
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
