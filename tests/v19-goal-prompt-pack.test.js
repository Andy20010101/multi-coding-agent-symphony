import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { runSymphonyCli } from '../scripts/symphony.js';
import { appendGoalEvent } from '../src/symphony/goal-event-journal.js';
import {
  buildGoalUpdatePlan,
  confirmGoalUpdate
} from '../src/symphony/goal-update.js';
import {
  buildGoalPromptPack,
  renderGoalPromptPackMarkdown,
  renderGoalPromptPackText
} from '../src/symphony/goal-prompt-pack.js';
import {
  buildGoalRunbookInitPlan,
  confirmGoalRunbookInit,
  getManagedGoalRunbookPath
} from '../src/symphony/goal-runbook-registry.js';
import { validateGoalPromptPackContract } from '../src/symphony/goal-runbook-contracts.js';

const RUNBOOK_FIXTURE = 'fixtures/contracts/goal-runbook.valid.v1.json';
const V22_RUNBOOK_FIXTURE = 'fixtures/contracts/goal-runbook.v22-goal-prompt-handoff-workspace.v1.json';
const FIXTURE_GOAL_ID = 'v19-fixture';
const MANAGED_GOAL_ID = 'v19-prompt-managed';
const NEXT_GOAL_ID = 'v19-goal-runbook-next-action';
const V22_GOAL_ID = 'v22-goal-prompt-handoff-workspace';
const GENERATED_AT = '2026-05-29T10:00:00.000Z';

describe('v19 goal prompt pack generator and CLI', () => {
  it('prints a copy-only worker markdown prompt for the controlled v19 fixture without writing state', async () => {
    const root = await mkdtemp(join(tmpdir(), 'symphony-v19-goal-prompt-fixture-'));
    const stateDir = join(root, '.symphony');
    const output = createOutput();

    try {
      const exitCode = await runSymphonyCli({
        argv: [
          'goal',
          'prompt',
          '--state-dir',
          stateDir,
          '--goal',
          FIXTURE_GOAL_ID,
          '--task',
          'task-1',
          '--role',
          'worker',
          '--markdown'
        ],
        stdout: output.stdout,
        stderr: output.stderr
      });

      const markdown = output.stdoutText();

      assert.equal(exitCode, 0);
      assert.equal(output.stderrText(), '');
      assert.match(markdown, /^\/goal\n/u);
      assert.match(markdown, /Task scope:/u);
      assert.match(markdown, /禁止 self-review/u);
      assert.match(markdown, /pnpm check/u);
      assert.match(markdown, /pnpm test/u);
      assert.match(markdown, /git diff --check/u);
      assert.match(markdown, /docs\/plans\/v19-task1-worker-evidence-2026-05-29\.md/u);
      assert.match(markdown, /symphony goal update/u);
      assert.match(markdown, /worker\.evidence-recorded/u);
      assert.match(markdown, /dry-run writes nothing/u);
      assert.doesNotMatch(markdown, /\b(button|click|execute button)\b|按钮/iu);
      assert.equal(await pathExists(getManagedGoalRunbookPath({ stateDir, goalId: FIXTURE_GOAL_ID })), false);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it('generates valid goal-prompt-pack.v1 JSON for all supported roles', async () => {
    const root = await mkdtemp(join(tmpdir(), 'symphony-v19-goal-prompt-json-'));
    const stateDir = join(root, '.symphony');

    try {
      await registerRunbook({ stateDir, goalId: MANAGED_GOAL_ID });

      const cases = [
        {
          taskId: 'task-1',
          role: 'worker',
          registration: /symphony goal update/u,
          text: /worker implementation/u
        },
        {
          taskId: 'task-1',
          role: 'reviewer',
          registration: /symphony goal review/u,
          text: /independent reviewer/u,
          extraText: [/--verdict approved/u, /--verdict needs-revision/u]
        },
        {
          taskId: 'task-1',
          role: 'main-verifier',
          registration: /symphony goal gate .*--gate main-verification/u,
          text: /reviewer\.approved evidence/u,
          extraText: [/--status passed/u, /--status failed/u]
        },
        {
          taskId: 'release',
          role: 'release-manager',
          registration: /symphony goal gate .*--gate release\.pnpm-check/u,
          text: /Release scope:/u,
          extraText: [/--status failed/u, /--gate release\.ready --status declared/u]
        }
      ];

      for (const testCase of cases) {
        const promptPack = await buildGoalPromptPack({
          stateDir,
          goalId: MANAGED_GOAL_ID,
          taskId: testCase.taskId,
          role: testCase.role,
          generatedAt: GENERATED_AT
        });

        assert.deepEqual(validateGoalPromptPackContract(promptPack), {
          ok: true,
          errors: []
        });
        assert.equal(promptPack.contractName, 'goal-prompt-pack.v1');
        assert.equal(promptPack.goalId, MANAGED_GOAL_ID);
        assert.equal(promptPack.prompts.length, 1);
        assert.equal(promptPack.prompts[0].role, testCase.role);
        assert.match(promptPack.prompts[0].registration.dryRunCommand, testCase.registration);
        assert.match(promptPack.prompts[0].registration.confirmCommand, /--confirm --plan-hash sha256:[a-f0-9]{64}/u);
        assert.match(promptPack.prompts[0].text, testCase.text);

        for (const expectedText of testCase.extraText ?? []) {
          assert.match(promptPack.prompts[0].text, expectedText);
        }
      }

      const output = createOutput();
      const exitCode = await runSymphonyCli({
        argv: [
          'goal',
          'prompt',
          '--state-dir',
          stateDir,
          '--goal',
          MANAGED_GOAL_ID,
          '--task',
          'task-1',
          '--role',
          'worker',
          '--json'
        ],
        stdout: output.stdout,
        stderr: output.stderr
      });
      const promptPack = JSON.parse(output.stdoutText());

      assert.equal(exitCode, 0);
      assert.equal(output.stderrText(), '');
      assert.equal(promptPack.contractName, 'goal-prompt-pack.v1');
      assert.equal(promptPack.prompts[0].copyOnly, true);
      assert.equal(renderGoalPromptPackMarkdown(promptPack), promptPack.prompts[0].text);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it('renders v22 role-specific prompts with goal-specific evidence paths and structured role guidance', async () => {
    const root = await mkdtemp(join(tmpdir(), 'symphony-v22-goal-prompt-roles-'));
    const stateDir = join(root, '.symphony');

    try {
      await registerRunbook({
        stateDir,
        goalId: V22_GOAL_ID,
        fromJson: V22_RUNBOOK_FIXTURE
      });

      const cases = [
        {
          taskId: 'task-2',
          role: 'worker',
          evidenceFile: 'docs/plans/v22-task-2-worker-evidence-2026-05-29.md',
          label: 'worker implementation',
          phase: 'implement',
          text: [/worker implementation/u, /Reviewer handoff/u]
        },
        {
          taskId: 'task-2',
          role: 'reviewer',
          evidenceFile: 'docs/plans/v22-task-2-review-evidence-2026-05-29.md',
          label: 'independent reviewer',
          phase: 'review',
          text: [
            /independent reviewer/u,
            /如果你参与过本 task 的 worker implementation，先停止并说明，不能 self-review/u,
            /reviewer id 必须不同于该 task 最近一次 worker actor id/u,
            /不复述 worker 总结当作结论/u,
            /Verdict: APPROVED or NEEDS_REVISION/u
          ]
        },
        {
          taskId: 'task-2',
          role: 'main-verifier',
          evidenceFile: 'docs/plans/v22-task-2-main-verification-evidence-2026-05-29.md',
          label: 'main verifier',
          phase: 'main-verification',
          text: [/reviewer\.approved evidence/u, /--gate main-verification/u]
        },
        {
          taskId: 'release',
          role: 'release-manager',
          evidenceFile: 'docs/plans/v22-release-evidence-2026-05-29.md',
          label: 'release manager',
          phase: 'release-gate',
          text: [/Release scope:/u, /release\.ready --status declared/u]
        }
      ];

      for (const testCase of cases) {
        const promptPack = await buildGoalPromptPack({
          stateDir,
          goalId: V22_GOAL_ID,
          taskId: testCase.taskId,
          role: testCase.role,
          generatedAt: GENERATED_AT
        });
        const [prompt] = promptPack.prompts;

        assert.deepEqual(validateGoalPromptPackContract(promptPack), {
          ok: true,
          errors: []
        });
        assert.equal(prompt.evidenceFile, testCase.evidenceFile);
        assert.equal(prompt.roleGuidance.label, testCase.label);
        assert.equal(prompt.roleGuidance.phase, testCase.phase);
        assert.equal(Array.isArray(prompt.roleGuidance.boundary), true);
        assert.equal(Array.isArray(prompt.roleGuidance.evidenceRequirements), true);
        assert.equal(Array.isArray(prompt.roleGuidance.handoffChecklist), true);
        assert.match(prompt.text, /Role boundary:/u);
        assert.match(prompt.text, /Role evidence checklist:/u);
        assert.match(prompt.text, /Handoff checklist:/u);
        assert.match(prompt.text, new RegExp(testCase.evidenceFile.replaceAll('.', '\\.'), 'u'));
        assert.doesNotMatch(prompt.text, /docs\/plans\/v19-/u);
        assert.match(prompt.text, /pnpm workbench:build/u);
        assert.match(prompt.text, /pnpm --silent symphony goal-status --goal v22-goal-prompt-handoff-workspace --json/u);

        for (const expectedText of testCase.text) {
          assert.match(prompt.text, expectedText);
        }
      }
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it('prints copy-only text output and can generate text-format prompt packs', async () => {
    const root = await mkdtemp(join(tmpdir(), 'symphony-v19-goal-prompt-text-'));
    const stateDir = join(root, '.symphony');
    const output = createOutput();

    try {
      const exitCode = await runSymphonyCli({
        argv: [
          'goal',
          'prompt',
          '--state-dir',
          stateDir,
          '--goal',
          FIXTURE_GOAL_ID,
          '--task',
          'task-1',
          '--role',
          'worker',
          '--format',
          'text'
        ],
        stdout: output.stdout,
        stderr: output.stderr
      });
      const text = output.stdoutText();
      const promptPack = await buildGoalPromptPack({
        stateDir,
        goalId: FIXTURE_GOAL_ID,
        taskId: 'task-1',
        role: 'worker',
        promptFormat: 'text',
        generatedAt: GENERATED_AT
      });

      assert.equal(exitCode, 0);
      assert.equal(output.stderrText(), '');
      assert.match(text, /^\/goal\n/u);
      assert.match(text, /Task scope:/u);
      assert.doesNotMatch(text, /^\{/u);
      assert.deepEqual(validateGoalPromptPackContract(promptPack), {
        ok: true,
        errors: []
      });
      assert.equal(promptPack.prompts[0].format, 'text');
      assert.equal(renderGoalPromptPackText(promptPack), promptPack.prompts[0].text);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it('uses goal-next-action resolver for latest --next markdown prompts', async () => {
    const root = await mkdtemp(join(tmpdir(), 'symphony-v19-goal-prompt-next-'));
    const stateDir = join(root, '.symphony');
    const output = createOutput();

    try {
      await registerRunbook({ stateDir, goalId: NEXT_GOAL_ID });

      const exitCode = await runSymphonyCli({
        argv: [
          'goal',
          'prompt',
          '--state-dir',
          stateDir,
          '--goal',
          'latest',
          '--next',
          '--markdown'
        ],
        stdout: output.stdout,
        stderr: output.stderr
      });
      const markdown = output.stdoutText();

      assert.equal(exitCode, 0);
      assert.equal(output.stderrText(), '');
      assert.match(markdown, /^\/goal\n/u);
      assert.match(markdown, /Goal: v19-goal-runbook-next-action/u);
      assert.match(markdown, /Task: task-1/u);
      assert.match(markdown, /No explicit worker evidence/u);
      assert.match(markdown, /symphony goal update/u);
      assert.doesNotMatch(markdown, /\b(button|click|execute button)\b|按钮/iu);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it('renders revision worker context from needs-revision events without manual prompt assembly', async () => {
    const root = await mkdtemp(join(tmpdir(), 'symphony-v19-goal-prompt-revision-'));
    const stateDir = join(root, '.symphony');

    try {
      await registerRunbook({ stateDir, goalId: NEXT_GOAL_ID });
      await appendPromptTaskEvent({
        stateDir,
        eventId: 'evt_task1_worker_evidence',
        taskId: 'task-1',
        eventType: 'worker.evidence-recorded',
        evidenceRefs: [workerEvidence('task-1')]
      });
      await appendPromptTaskEvent({
        stateDir,
        eventId: 'evt_task1_blocker_opened',
        taskId: 'task-1',
        eventType: 'blocker.opened',
        statement: 'Contract fixture blocker remains open.',
        blocker: {
          id: 'blocker-contract-fixture',
          reason: 'Contract fixture blocker remains open.',
          severity: 'error'
        }
      });
      await appendPromptTaskEvent({
        stateDir,
        eventId: 'evt_task1_needs_revision',
        taskId: 'task-1',
        eventType: 'reviewer.needs-revision',
        phase: 'review',
        actor: { role: 'reviewer', id: 'codex-reviewer-task-1' },
        evidenceRefs: [reviewEvidence('task-1')],
        statement: 'Reviewer found the invalid fixture acceptance delta still open.',
        review: { verdict: 'NEEDS_REVISION' }
      });
      await writeLatestPromptRun({
        stateDir,
        run: {
          runId: 'run-revision-source',
          status: 'passed',
          verifierStatus: 'passed',
          command: 'symphony do --dry-run "task-1"',
          changedFiles: [
            'src/symphony/goal-prompt-pack.js',
            'tests/v19-goal-prompt-pack.test.js'
          ],
          createdFiles: []
        }
      });

      const promptPack = await buildGoalPromptPack({
        stateDir,
        goalId: 'latest',
        next: true,
        generatedAt: GENERATED_AT
      });
      const [prompt] = promptPack.prompts;

      assert.deepEqual(validateGoalPromptPackContract(promptPack), {
        ok: true,
        errors: []
      });
      assert.equal(prompt.role, 'worker');
      assert.equal(prompt.phase, 'revision');
      assert.equal(prompt.roleGuidance.phase, 'revision');
      assert.equal(prompt.revisionContext.trigger.eventType, 'reviewer.needs-revision');
      assert.equal(prompt.revisionContext.blockers[0].id, 'blocker-contract-fixture');
      assert.equal(prompt.revisionContext.changedFiles.items.includes('src/symphony/goal-prompt-pack.js'), true);
      assert.equal(prompt.revisionContext.acceptanceDelta.length, 2);
      assert.match(prompt.text, /revision worker/u);
      assert.match(prompt.text, /Blockers to address:/u);
      assert.match(prompt.text, /Contract fixture blocker remains open/u);
      assert.match(prompt.text, /Failed commands recorded by the failure event:/u);
      assert.match(prompt.text, /Commands to rerun before reviewer handoff:/u);
      assert.match(prompt.text, /pnpm check/u);
      assert.match(prompt.text, /Changed files from latest exposed run \(run-revision-source\):/u);
      assert.match(prompt.text, /src\/symphony\/goal-prompt-pack\.js/u);
      assert.match(prompt.text, /Acceptance delta to close:/u);
      assert.match(prompt.text, /recheck-after-reviewer\.needs-revision: Valid fixtures pass all v19 contract validators\./u);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it('renders failed main verification as a worker revision prompt with command evidence', async () => {
    const root = await mkdtemp(join(tmpdir(), 'symphony-v19-goal-prompt-main-failed-'));
    const stateDir = join(root, '.symphony');

    try {
      await registerRunbook({ stateDir, goalId: NEXT_GOAL_ID });
      await appendPromptTaskEvent({
        stateDir,
        eventId: 'evt_task1_worker_evidence',
        taskId: 'task-1',
        eventType: 'worker.evidence-recorded',
        evidenceRefs: [workerEvidence('task-1')]
      });
      await appendPromptTaskEvent({
        stateDir,
        eventId: 'evt_task1_review_approved',
        taskId: 'task-1',
        eventType: 'reviewer.approved',
        phase: 'review',
        actor: { role: 'reviewer', id: 'codex-reviewer-task-1' },
        evidenceRefs: [reviewEvidence('task-1')],
        review: { verdict: 'APPROVED' }
      });
      await appendPromptTaskEvent({
        stateDir,
        eventId: 'evt_task1_main_failed',
        taskId: 'task-1',
        eventType: 'main.verification-failed',
        phase: 'main-verification',
        actor: { role: 'main-verifier', id: 'codex-main-verifier-task-1' },
        evidenceRefs: [mainEvidence('task-1')],
        statement: 'Main verification failed after pnpm test.',
        metadata: {
          commandResults: [{
            command: 'pnpm test',
            status: 'failed',
            exitCode: 1
          }]
        }
      });

      const promptPack = await buildGoalPromptPack({
        stateDir,
        goalId: 'latest',
        next: true,
        generatedAt: GENERATED_AT
      });
      const [prompt] = promptPack.prompts;

      assert.equal(prompt.role, 'worker');
      assert.equal(prompt.phase, 'revision');
      assert.equal(prompt.revisionContext.trigger.eventType, 'main.verification-failed');
      assert.deepEqual(prompt.revisionContext.failedCommands.recorded, ['pnpm test']);
      assert.equal(prompt.revisionContext.failedCommands.rerun.includes('pnpm test'), true);
      assert.match(prompt.text, /Latest main verification failed for task-1/u);
      assert.match(prompt.text, /main\.verification-failed/u);
      assert.match(prompt.text, /pnpm test/u);
      assert.match(prompt.text, /docs\/plans\/v19-task-1-main-verification-evidence-2026-05-29\.md/u);
      assert.doesNotMatch(prompt.text, /执行 .* main verification/u);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it('prints revision prompt with failed commands after controlled needs-revision registration', async () => {
    const root = await mkdtemp(join(tmpdir(), 'symphony-v19-goal-prompt-review-user-path-'));
    const stateDir = join(root, '.symphony');

    try {
      await registerRunbook({ stateDir, goalId: NEXT_GOAL_ID });
      await confirmGoalCli([
        'goal',
        'update',
        '--state-dir',
        stateDir,
        '--goal',
        NEXT_GOAL_ID,
        '--task',
        'task-1',
        '--event',
        'worker.evidence-recorded',
        '--actor',
        'codex-worker-task-1',
        '--evidence-ref',
        workerEvidence('task-1').ref
      ]);
      await confirmControlledGoalUpdate({
        stateDir,
        goalId: NEXT_GOAL_ID,
        taskId: 'task-1',
        eventType: 'blocker.opened',
        actorId: 'codex-worker-task-1',
        statement: 'Contract fixture blocker remains open.',
        blocker: {
          id: 'blocker-contract-fixture',
          reason: 'Contract fixture blocker remains open.',
          severity: 'error'
        }
      });
      await writeLatestPromptRun({
        stateDir,
        run: {
          runId: 'run-review-user-path',
          status: 'passed',
          verifierStatus: 'passed',
          command: 'symphony do --dry-run "task-1"',
          changedFiles: [
            'src/symphony/goal-review.js',
            'tests/v19-goal-prompt-pack.test.js'
          ],
          createdFiles: []
        }
      });
      await confirmGoalCli([
        'goal',
        'review',
        '--state-dir',
        stateDir,
        '--goal',
        NEXT_GOAL_ID,
        '--task',
        'task-1',
        '--reviewer',
        'codex-reviewer-task-1',
        '--verdict',
        'needs-revision',
        '--evidence-ref',
        reviewEvidence('task-1').ref,
        '--failed-command',
        'pnpm test -- --runInBand',
        '--statement',
        'Reviewer found the invalid fixture acceptance delta still open.'
      ]);

      const output = createOutput();
      const exitCode = await runSymphonyCli({
        argv: [
          'goal',
          'prompt',
          '--state-dir',
          stateDir,
          '--goal',
          'latest',
          '--next',
          '--markdown'
        ],
        stdout: output.stdout,
        stderr: output.stderr
      });
      const markdown = output.stdoutText();

      assert.equal(exitCode, 0);
      assert.equal(output.stderrText(), '');
      assert.match(markdown, /revision worker/u);
      assert.match(markdown, /reviewer\.needs-revision/u);
      assert.match(markdown, /Blockers to address:/u);
      assert.match(markdown, /blocker-contract-fixture: Contract fixture blocker remains open\. \(error\)/u);
      assert.match(markdown, /Failed commands recorded by the failure event:\n- pnpm test -- --runInBand/u);
      assert.match(markdown, /Changed files from latest exposed run \(run-review-user-path\):/u);
      assert.match(markdown, /src\/symphony\/goal-review\.js/u);
      assert.match(markdown, /Acceptance delta to close:/u);
      assert.match(markdown, /recheck-after-reviewer\.needs-revision: Valid fixtures pass all v19 contract validators\./u);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it('prints revision prompt with failed commands after controlled main gate registration', async () => {
    const root = await mkdtemp(join(tmpdir(), 'symphony-v19-goal-prompt-main-user-path-'));
    const stateDir = join(root, '.symphony');

    try {
      await registerRunbook({ stateDir, goalId: NEXT_GOAL_ID });
      await confirmGoalCli([
        'goal',
        'update',
        '--state-dir',
        stateDir,
        '--goal',
        NEXT_GOAL_ID,
        '--task',
        'task-1',
        '--event',
        'worker.evidence-recorded',
        '--actor',
        'codex-worker-task-1',
        '--evidence-ref',
        workerEvidence('task-1').ref
      ]);
      await confirmGoalCli([
        'goal',
        'review',
        '--state-dir',
        stateDir,
        '--goal',
        NEXT_GOAL_ID,
        '--task',
        'task-1',
        '--reviewer',
        'codex-reviewer-task-1',
        '--verdict',
        'approved',
        '--evidence-ref',
        reviewEvidence('task-1').ref
      ]);
      await writeLatestPromptRun({
        stateDir,
        run: {
          runId: 'run-main-user-path',
          status: 'failed',
          verifierStatus: 'failed',
          command: 'pnpm workbench:build',
          changedFiles: [
            'src/symphony/goal-gate.js',
            'frontend/workbench/src/App.jsx'
          ],
          createdFiles: []
        }
      });
      await confirmGoalCli([
        'goal',
        'gate',
        '--state-dir',
        stateDir,
        '--goal',
        NEXT_GOAL_ID,
        '--task',
        'task-1',
        '--gate',
        'main-verification',
        '--status',
        'failed',
        '--verifier',
        'codex-main-verifier-task-1',
        '--evidence-ref',
        mainEvidence('task-1').ref,
        '--failed-command',
        'pnpm workbench:build',
        '--statement',
        'Main verification failed after the Workbench build.'
      ]);

      const output = createOutput();
      const exitCode = await runSymphonyCli({
        argv: [
          'goal',
          'prompt',
          '--state-dir',
          stateDir,
          '--goal',
          'latest',
          '--next',
          '--markdown'
        ],
        stdout: output.stdout,
        stderr: output.stderr
      });
      const markdown = output.stdoutText();

      assert.equal(exitCode, 0);
      assert.equal(output.stderrText(), '');
      assert.match(markdown, /revision worker/u);
      assert.match(markdown, /main\.verification-failed/u);
      assert.match(markdown, /Failed commands recorded by the failure event:\n- pnpm workbench:build/u);
      assert.match(markdown, /Commands to rerun before reviewer handoff:\n- pnpm workbench:build/u);
      assert.match(markdown, /Changed files from latest exposed run \(run-main-user-path\):/u);
      assert.match(markdown, /src\/symphony\/goal-gate\.js/u);
      assert.match(markdown, /Acceptance delta to close:/u);
      assert.match(markdown, /recheck-after-main\.verification-failed: Valid fixtures pass all v19 contract validators\./u);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it('rejects ambiguous next prompts and write-flow flags', async () => {
    const cases = [
      {
        args: ['--goal', FIXTURE_GOAL_ID, '--next', '--task', 'task-1', '--role', 'worker'],
        message: /omit --task and --role/u
      },
      {
        args: ['--goal', FIXTURE_GOAL_ID, '--task', 'task-1', '--role', 'worker', '--confirm'],
        message: /does not accept write-flow flags/u
      },
      {
        args: ['--goal', FIXTURE_GOAL_ID, '--task', 'task-1', '--role', 'worker', '--output', 'prompt.md'],
        message: /does not write files/u
      }
    ];

    for (const testCase of cases) {
      const output = createOutput();
      const exitCode = await runSymphonyCli({
        argv: ['goal', 'prompt', ...testCase.args],
        stdout: output.stdout,
        stderr: output.stderr
      });

      assert.equal(exitCode, 64);
      assert.equal(output.stdoutText(), '');
      assert.match(output.stderrText(), testCase.message);
    }
  });
});

async function registerRunbook({ stateDir, goalId, fromJson = RUNBOOK_FIXTURE }) {
  const plan = await buildGoalRunbookInitPlan({
    stateDir,
    goalId,
    fromJson
  });

  await confirmGoalRunbookInit({
    stateDir,
    goalId,
    fromJson,
    planHash: plan.planHash
  });
}

async function confirmGoalCli(baseArgv) {
  const plan = await runCliJson([
    ...baseArgv,
    '--dry-run',
    '--json'
  ]);

  const result = await runCliJson([
    ...baseArgv,
    '--confirm',
    '--plan-hash',
    plan.planHash,
    '--json'
  ]);

  return {
    plan,
    result
  };
}

async function runCliJson(argv) {
  const output = createOutput();
  const exitCode = await runSymphonyCli({
    argv,
    stdout: output.stdout,
    stderr: output.stderr
  });

  assert.equal(exitCode, 0, output.stderrText());
  assert.equal(output.stderrText(), '');

  return JSON.parse(output.stdoutText());
}

async function confirmControlledGoalUpdate(options) {
  const plan = buildGoalUpdatePlan(options);

  return await confirmGoalUpdate({
    ...options,
    planHash: plan.planHash
  });
}

async function appendPromptTaskEvent({
  stateDir,
  eventId,
  taskId,
  eventType,
  phase = 'implement',
  actor = { role: 'worker', id: `codex-worker-${taskId}` },
  evidenceRefs = [],
  statement = `${eventType} recorded for ${taskId}.`,
  review,
  blocker,
  metadata
}) {
  await appendGoalEvent({
    stateDir,
    mode: 'confirm',
    recordedAt: '2026-05-29T10:00:00.000Z',
    event: stripUndefined({
      eventId,
      goalId: NEXT_GOAL_ID,
      taskId,
      eventType,
      phase,
      actor,
      occurredAt: '2026-05-29T10:00:00.000Z',
      branch: `codex/v19-${taskId}`,
      commit: null,
      evidenceRefs,
      statement,
      review,
      blocker,
      metadata
    })
  });
}

async function writeLatestPromptRun({ stateDir, run }) {
  const runsDir = join(stateDir, 'runs');

  await mkdir(runsDir, {
    recursive: true
  });
  await writeFile(join(runsDir, 'latest.json'), JSON.stringify(run, null, 2), 'utf8');
}

function workerEvidence(taskId) {
  return {
    kind: 'repo-doc',
    ref: `docs/plans/v19-${taskId}-worker-evidence-2026-05-29.md`,
    label: `${taskId} worker evidence`
  };
}

function reviewEvidence(taskId) {
  return {
    kind: 'repo-doc',
    ref: `docs/plans/v19-${taskId}-review-evidence-2026-05-29.md`,
    label: `${taskId} review evidence`
  };
}

function mainEvidence(taskId) {
  return {
    kind: 'repo-doc',
    ref: `docs/plans/v19-${taskId}-main-verification-evidence-2026-05-29.md`,
    label: `${taskId} main verification evidence`
  };
}

function stripUndefined(value) {
  return Object.fromEntries(
    Object.entries(value).filter(([, entry]) => entry !== undefined)
  );
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

async function pathExists(path) {
  try {
    await readFile(path, 'utf8');
    return true;
  } catch (error) {
    if (error.code === 'ENOENT') {
      return false;
    }

    throw error;
  }
}
