import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { runSymphonyCli } from '../scripts/symphony.js';
import { appendGoalEvent } from '../src/symphony/goal-event-journal.js';
import {
  buildGoalRunbookInitPlan,
  confirmGoalRunbookInit
} from '../src/symphony/goal-runbook-registry.js';

const GOAL_ID = 'v27-review-revision-loop';
const RUNBOOK_FIXTURE = 'fixtures/contracts/goal-runbook.v27-review-revision-loop.v1.json';
const GENERATED_AT = '2026-05-29T10:00:00.000Z';
const TASK_ID = 'task-5';

describe('v27 review -> revision -> verify loop', () => {
  it('routes approved task-5 review evidence to main verification', async () => {
    const context = await setupV27Task5State('approved');

    try {
      await confirmGoalCli([
        'goal',
        'update',
        '--state-dir',
        context.stateDir,
        '--goal',
        GOAL_ID,
        '--task',
        TASK_ID,
        '--event',
        'worker.evidence-recorded',
        '--actor',
        'codex-v27-task-5-worker',
        '--evidence-ref',
        workerEvidenceRef()
      ]);
      await confirmGoalCli([
        'goal',
        'review',
        '--state-dir',
        context.stateDir,
        '--goal',
        GOAL_ID,
        '--task',
        TASK_ID,
        '--reviewer',
        'codex-v27-task-5-reviewer',
        '--verdict',
        'approved',
        '--evidence-ref',
        reviewEvidenceRef()
      ]);

      const nextAction = await runCliJson([
        'goal',
        'next',
        '--state-dir',
        context.stateDir,
        '--goal',
        GOAL_ID,
        '--json'
      ]);
      const status = await runCliJson([
        'goal-status',
        '--state-dir',
        context.stateDir,
        '--goal',
        GOAL_ID,
        '--json'
      ]);

      assert.equal(status.tasks.find((task) => task.taskId === TASK_ID).status, 'approved');
      assert.equal(nextAction.status, 'action-required');
      assert.equal(nextAction.next.taskId, TASK_ID);
      assert.equal(nextAction.next.role, 'main-verifier');
      assert.equal(nextAction.next.phase, 'main-verification');
      assert.match(nextAction.next.reason, /Reviewer approved task-5 but main verification is missing/u);
      assert.deepEqual(nextAction.afterCompletion.allowedEvents, [
        'main.verification-passed',
        'main.verification-failed'
      ]);
    } finally {
      await cleanup(context);
    }
  });

  it('turns needs-revision into a revision prompt and hands revised task-5 evidence back to a reviewer', async () => {
    const context = await setupV27Task5State('needs-revision');

    try {
      await confirmGoalCli([
        'goal',
        'update',
        '--state-dir',
        context.stateDir,
        '--goal',
        GOAL_ID,
        '--task',
        TASK_ID,
        '--event',
        'worker.evidence-recorded',
        '--actor',
        'codex-v27-task-5-worker-a',
        '--evidence-ref',
        workerEvidenceRef()
      ]);
      await writeLatestRun({
        stateDir: context.stateDir,
        run: {
          runId: 'run-v27-task5-review-needs-revision',
          status: 'passed',
          verifierStatus: 'passed',
          command: 'symphony do --dry-run "v27 task-5"',
          changedFiles: [
            'tests/v27-review-revision-loop.test.js',
            'docs/workbench-operator-guide.md'
          ],
          createdFiles: []
        }
      });
      await confirmGoalCli([
        'goal',
        'review',
        '--state-dir',
        context.stateDir,
        '--goal',
        GOAL_ID,
        '--task',
        TASK_ID,
        '--reviewer',
        'codex-v27-task-5-reviewer',
        '--verdict',
        'needs-revision',
        '--evidence-ref',
        reviewEvidenceRef(),
        '--failed-command',
        'pnpm test'
      ]);

      const revisionNextAction = await runCliJson([
        'goal',
        'next',
        '--state-dir',
        context.stateDir,
        '--goal',
        GOAL_ID,
        '--json'
      ]);
      const revisionPrompt = await runCliText([
        'goal',
        'prompt',
        '--state-dir',
        context.stateDir,
        '--goal',
        'latest',
        '--next',
        '--markdown'
      ]);

      assert.equal(revisionNextAction.next.taskId, TASK_ID);
      assert.equal(revisionNextAction.next.role, 'worker');
      assert.equal(revisionNextAction.next.phase, 'revision');
      assert.match(revisionNextAction.next.reason, /reviewer\.needs-revision/u);
      assert.match(revisionPrompt, /revision worker/u);
      assert.match(revisionPrompt, /reviewer\.needs-revision/u);
      assert.match(revisionPrompt, /Failed commands recorded by the failure event:\n- pnpm test/u);
      assert.match(revisionPrompt, /Changed files from latest exposed run \(run-v27-task5-review-needs-revision\):/u);
      assert.match(revisionPrompt, /tests\/v27-review-revision-loop\.test\.js/u);
      assert.match(revisionPrompt, /Acceptance delta to close:/u);
      assert.doesNotMatch(revisionPrompt, /执行 .* main verification/u);

      await confirmGoalCli([
        'goal',
        'update',
        '--state-dir',
        context.stateDir,
        '--goal',
        GOAL_ID,
        '--task',
        TASK_ID,
        '--event',
        'worker.evidence-recorded',
        '--actor',
        'codex-v27-task-5-worker-b',
        '--evidence-ref',
        workerEvidenceRef()
      ]);

      const reviewerHandoff = await runCliJson([
        'goal',
        'next',
        '--state-dir',
        context.stateDir,
        '--goal',
        GOAL_ID,
        '--json'
      ]);

      assert.equal(reviewerHandoff.next.taskId, TASK_ID);
      assert.equal(reviewerHandoff.next.role, 'reviewer');
      assert.equal(reviewerHandoff.next.phase, 'review');
      assert.match(reviewerHandoff.next.reason, /Worker evidence exists for task-5 but reviewer verdict is missing/u);
      assert.deepEqual(reviewerHandoff.afterCompletion.allowedEvents, [
        'reviewer.approved',
        'reviewer.needs-revision'
      ]);
      assert.equal(reviewerHandoff.evidenceState.workerEvidenceRef, workerEvidenceRef());
      assert.equal(reviewerHandoff.evidenceState.reviewEvidenceRef, reviewEvidenceRef());
    } finally {
      await cleanup(context);
    }
  });

  it('turns failed main verification into a revision prompt and sends fixed task-5 work through reviewer again', async () => {
    const context = await setupV27Task5State('main-failed');

    try {
      await confirmGoalCli([
        'goal',
        'update',
        '--state-dir',
        context.stateDir,
        '--goal',
        GOAL_ID,
        '--task',
        TASK_ID,
        '--event',
        'worker.evidence-recorded',
        '--actor',
        'codex-v27-task-5-worker-a',
        '--evidence-ref',
        workerEvidenceRef()
      ]);
      await confirmGoalCli([
        'goal',
        'review',
        '--state-dir',
        context.stateDir,
        '--goal',
        GOAL_ID,
        '--task',
        TASK_ID,
        '--reviewer',
        'codex-v27-task-5-reviewer',
        '--verdict',
        'approved',
        '--evidence-ref',
        reviewEvidenceRef()
      ]);
      await writeLatestRun({
        stateDir: context.stateDir,
        run: {
          runId: 'run-v27-task5-main-verification-failed',
          status: 'failed',
          verifierStatus: 'failed',
          command: 'pnpm workbench:build',
          changedFiles: [
            'frontend/workbench/src/api/contracts.js',
            'tests/workbench-api-client.test.js'
          ],
          createdFiles: []
        }
      });
      await confirmGoalCli([
        'goal',
        'gate',
        '--state-dir',
        context.stateDir,
        '--goal',
        GOAL_ID,
        '--task',
        TASK_ID,
        '--gate',
        'main-verification',
        '--status',
        'failed',
        '--verifier',
        'codex-v27-task-5-main-verifier',
        '--evidence-ref',
        mainEvidenceRef(),
        '--failed-command',
        'pnpm workbench:build'
      ]);

      const revisionPrompt = await runCliText([
        'goal',
        'prompt',
        '--state-dir',
        context.stateDir,
        '--goal',
        'latest',
        '--next',
        '--markdown'
      ]);

      assert.match(revisionPrompt, /revision worker/u);
      assert.match(revisionPrompt, /main\.verification-failed/u);
      assert.match(revisionPrompt, /Failed commands recorded by the failure event:\n- pnpm workbench:build/u);
      assert.match(revisionPrompt, /Commands to rerun before reviewer handoff:\n- pnpm workbench:build/u);
      assert.match(revisionPrompt, /Changed files from latest exposed run \(run-v27-task5-main-verification-failed\):/u);
      assert.match(revisionPrompt, /frontend\/workbench\/src\/api\/contracts\.js/u);
      assert.doesNotMatch(revisionPrompt, /release\.ready --status declared/u);

      await confirmGoalCli([
        'goal',
        'update',
        '--state-dir',
        context.stateDir,
        '--goal',
        GOAL_ID,
        '--task',
        TASK_ID,
        '--event',
        'worker.evidence-recorded',
        '--actor',
        'codex-v27-task-5-worker-b',
        '--evidence-ref',
        workerEvidenceRef()
      ]);

      const reviewerHandoff = await runCliJson([
        'goal',
        'next',
        '--state-dir',
        context.stateDir,
        '--goal',
        GOAL_ID,
        '--json'
      ]);

      assert.equal(reviewerHandoff.next.taskId, TASK_ID);
      assert.equal(reviewerHandoff.next.role, 'reviewer');
      assert.equal(reviewerHandoff.next.phase, 'review');
      assert.deepEqual(reviewerHandoff.afterCompletion.allowedEvents, [
        'reviewer.approved',
        'reviewer.needs-revision'
      ]);
    } finally {
      await cleanup(context);
    }
  });
});

async function setupV27Task5State(prefix) {
  const root = await mkdtemp(join(tmpdir(), `symphony-v27-review-revision-${prefix}-`));
  const stateDir = join(root, '.symphony');

  await registerRunbook(stateDir);

  for (const taskId of ['task-1', 'task-2', 'task-3', 'task-4']) {
    await appendMainVerification({ stateDir, taskId });
  }

  return {
    root,
    stateDir
  };
}

async function registerRunbook(stateDir) {
  const plan = await buildGoalRunbookInitPlan({
    stateDir,
    goalId: GOAL_ID,
    fromJson: RUNBOOK_FIXTURE
  });

  await confirmGoalRunbookInit({
    stateDir,
    goalId: GOAL_ID,
    fromJson: RUNBOOK_FIXTURE,
    planHash: plan.planHash
  });
}

async function appendMainVerification({ stateDir, taskId }) {
  await appendGoalEvent({
    stateDir,
    mode: 'confirm',
    recordedAt: GENERATED_AT,
    event: {
      eventId: `evt_${taskId.replaceAll('-', '_')}_main_verified`,
      goalId: GOAL_ID,
      taskId,
      eventType: 'main.verification-passed',
      phase: 'main-verification',
      actor: {
        role: 'main-verifier',
        id: `codex-v27-${taskId}-main-verifier`
      },
      occurredAt: GENERATED_AT,
      branch: `v27-${taskId}-seeded-main-verification`,
      commit: null,
      evidenceRefs: [{
        kind: 'repo-doc',
        ref: `docs/plans/v27-${taskId}-main-verification-evidence-2026-05-29.md`,
        label: `${taskId} main verification evidence`
      }],
      statement: `${taskId} main verification passed before task-5 loop test.`
    }
  });
}

async function confirmGoalCli(baseArgv) {
  const plan = await runCliJson([
    ...baseArgv,
    '--dry-run',
    '--json'
  ]);

  return await runCliJson([
    ...baseArgv,
    '--confirm',
    '--plan-hash',
    plan.planHash,
    '--json'
  ]);
}

async function runCliJson(argv) {
  const text = await runCliText(argv);

  return JSON.parse(text);
}

async function runCliText(argv) {
  const output = createOutput();
  const exitCode = await runSymphonyCli({
    argv,
    stdout: output.stdout,
    stderr: output.stderr
  });

  assert.equal(exitCode, 0, output.stderrText());
  assert.equal(output.stderrText(), '');

  return output.stdoutText();
}

async function writeLatestRun({ stateDir, run }) {
  const runsDir = join(stateDir, 'runs');

  await mkdir(runsDir, {
    recursive: true
  });
  await writeFile(join(runsDir, 'latest.json'), JSON.stringify(run, null, 2), 'utf8');
}

function workerEvidenceRef() {
  return 'docs/plans/v27-task-5-worker-evidence-2026-05-29.md';
}

function reviewEvidenceRef() {
  return 'docs/plans/v27-task-5-review-evidence-2026-05-29.md';
}

function mainEvidenceRef() {
  return 'docs/plans/v27-task-5-main-verification-evidence-2026-05-29.md';
}

async function cleanup(context) {
  await rm(context.root, {
    recursive: true,
    force: true
  });
}

function createOutput() {
  let stdoutText = '';
  let stderrText = '';

  return {
    stdout: {
      write(chunk) {
        stdoutText += chunk;
      }
    },
    stderr: {
      write(chunk) {
        stderrText += chunk;
      }
    },
    stdoutText() {
      return stdoutText;
    },
    stderrText() {
      return stderrText;
    }
  };
}
