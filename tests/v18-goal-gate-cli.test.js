import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { runSymphonyCli } from '../scripts/symphony.js';
import {
  getManagedGoalEventJournalPath,
  readGoalEventJournal
} from '../src/symphony/goal-event-journal.js';

const GOAL_ID = 'v18-goal-event-journal-evidence-recorder';
const MAIN_VERIFICATION_EVIDENCE = 'docs/plans/v18-task1-main-verification-evidence-2026-05-28.md';
const RELEASE_EVIDENCE = 'docs/plans/v18-release-evidence-2026-05-28.md';

describe('v18 symphony goal gate CLI', () => {
  it('prints a main verification goal-update-plan.v1 dry-run without writing the journal', async () => {
    const root = await mkdtemp(join(tmpdir(), 'symphony-v18-goal-gate-main-dry-run-'));
    const stateDir = join(root, '.symphony');

    try {
      const output = createOutput();
      const exitCode = await runSymphonyCli({
        argv: [
          'goal',
          'gate',
          '--state-dir',
          stateDir,
          '--goal',
          GOAL_ID,
          '--gate',
          'main-verification',
          '--task',
          'task-1',
          '--status',
          'passed',
          '--verifier',
          'codex-main-verifier',
          '--evidence-ref',
          MAIN_VERIFICATION_EVIDENCE,
          '--dry-run'
        ],
        stdout: output.stdout,
        stderr: output.stderr
      });

      assert.equal(exitCode, 0);
      assert.equal(output.stderrText(), '');

      const plan = JSON.parse(output.stdoutText());

      assert.equal(plan.contractName, 'goal-update-plan.v1');
      assert.equal(plan.mode, 'dry-run');
      assert.match(plan.planHash, /^sha256:[a-f0-9]{64}$/u);
      assert.equal(plan.command.name, 'symphony goal gate');
      assert.equal(plan.command.intent, 'record-goal-gate');
      assert.equal(plan.actor.role, 'main-verifier');
      assert.equal(plan.actor.id, 'codex-main-verifier');
      assert.deepEqual(plan.proposedEvents.map((event) => event.eventType), ['main.verification-passed']);
      assert.equal(plan.proposedEvents[0].phase, 'main-verification');
      assert.equal(plan.proposedEvents[0].taskId, 'task-1');
      assert.equal(plan.proposedEvents[0].requiresEvidence, true);
      assert.equal(plan.proposedEvents[0].gate.name, 'main-verification');
      assert.equal(plan.proposedEvents[0].gate.status, 'passed');
      assert.deepEqual(plan.proposedEvents[0].evidenceRefs.map((ref) => ref.ref), [MAIN_VERIFICATION_EVIDENCE]);
      assert.equal(plan.wouldAppend.writesInDryRun, false);
      assert.equal(plan.safety.workbenchWriteAvailable, false);
      assert.match(plan.confirm.copyOnlyCommand, /goal gate .*--gate main-verification .*--status passed .*--confirm --plan-hash sha256:[a-f0-9]{64}/u);
      assert.equal(await pathExists(getManagedGoalEventJournalPath({ stateDir, goalId: GOAL_ID })), false);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it('confirms only when the plan hash matches and appends a release gate event', async () => {
    const root = await mkdtemp(join(tmpdir(), 'symphony-v18-goal-gate-release-confirm-'));
    const stateDir = join(root, '.symphony');
    const baseArgs = [
      'goal',
      'gate',
      '--state-dir',
      stateDir,
      '--goal',
      GOAL_ID,
      '--gate',
      'release.pnpm-check',
      '--status',
      'passed',
      '--verifier',
      'codex-release-verifier',
      '--evidence-ref',
      RELEASE_EVIDENCE
    ];

    try {
      const dryRun = createOutput();
      const dryRunExit = await runSymphonyCli({
        argv: [...baseArgs, '--dry-run'],
        stdout: dryRun.stdout,
        stderr: dryRun.stderr
      });
      const plan = JSON.parse(dryRun.stdoutText());

      assert.equal(dryRunExit, 0);
      assert.equal(plan.actor.role, 'release-verifier');
      assert.deepEqual(plan.proposedEvents.map((event) => event.eventType), ['release.gate-passed']);
      assert.equal(plan.proposedEvents[0].taskId, null);
      assert.equal(plan.proposedEvents[0].phase, 'release-gate');
      assert.equal(plan.proposedEvents[0].gate.name, 'release.pnpm-check');
      assert.equal(plan.ledgerPreview.changes[0].toStatus, 'release-gate-passed');

      const confirm = createOutput();
      const confirmExit = await runSymphonyCli({
        argv: [...baseArgs, '--confirm', '--plan-hash', plan.planHash],
        stdout: confirm.stdout,
        stderr: confirm.stderr
      });

      assert.equal(confirmExit, 0);
      assert.equal(confirm.stderrText(), '');

      const result = JSON.parse(confirm.stdoutText());

      assert.equal(result.mode, 'confirm');
      assert.equal(result.status, 'appended');
      assert.equal(result.written, true);
      assert.equal(result.event.eventType, 'release.gate-passed');
      assert.equal(result.event.gate.name, 'release.pnpm-check');
      assert.equal(result.event.gate.status, 'passed');

      const journal = await readGoalEventJournal({ stateDir, goalId: GOAL_ID });

      assert.equal(journal.log.eventCount, 1);
      assert.deepEqual(journal.events.map((event) => event.eventType), ['release.gate-passed']);
      assert.equal(journal.events.some((event) => event.eventType === 'release.ready-declared'), false);
      assert.equal(journal.events[0].actor.role, 'release-verifier');
      assert.equal(journal.events[0].actor.id, 'codex-release-verifier');
      assert.deepEqual(journal.events[0].evidenceRefs.map((ref) => ref.ref), [RELEASE_EVIDENCE]);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it('appends release.ready-declared only through explicit release.ready declared input', async () => {
    const root = await mkdtemp(join(tmpdir(), 'symphony-v18-goal-gate-ready-declared-'));
    const stateDir = join(root, '.symphony');
    const baseArgs = [
      'goal',
      'gate',
      '--state-dir',
      stateDir,
      '--goal',
      GOAL_ID,
      '--gate',
      'release.ready',
      '--status',
      'declared',
      '--verifier',
      'codex-release-manager',
      '--evidence-ref',
      RELEASE_EVIDENCE
    ];

    try {
      const dryRun = createOutput();
      const dryRunExit = await runSymphonyCli({
        argv: [...baseArgs, '--dry-run'],
        stdout: dryRun.stdout,
        stderr: dryRun.stderr
      });
      const plan = JSON.parse(dryRun.stdoutText());

      assert.equal(dryRunExit, 0);
      assert.equal(plan.actor.role, 'release-manager');
      assert.deepEqual(plan.proposedEvents.map((event) => event.eventType), ['release.ready-declared']);
      assert.equal(plan.proposedEvents[0].phase, 'release-prep');
      assert.equal(plan.proposedEvents[0].requiresEvidence, true);
      assert.equal(plan.ledgerPreview.changes[0].toStatus, 'release-ready');

      const confirm = createOutput();
      const confirmExit = await runSymphonyCli({
        argv: [...baseArgs, '--confirm', '--plan-hash', plan.planHash],
        stdout: confirm.stdout,
        stderr: confirm.stderr
      });

      assert.equal(confirmExit, 0);

      const journal = await readGoalEventJournal({ stateDir, goalId: GOAL_ID });

      assert.deepEqual(journal.events.map((event) => event.eventType), ['release.ready-declared']);
      assert.equal(journal.events[0].actor.role, 'release-manager');
      assert.equal(journal.events[0].gate.name, 'release.ready');
      assert.equal(journal.events[0].gate.status, 'declared');
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it('requires explicit evidence and does not infer readiness from release.ready gate name', async () => {
    const cases = [
      {
        name: 'missing evidence',
        args: [
          '--gate',
          'release.pnpm-check',
          '--status',
          'passed',
          '--verifier',
          'codex-release-verifier'
        ],
        message: /evidence ref is required/u
      },
      {
        name: 'release ready passed',
        args: [
          '--gate',
          'release.ready',
          '--status',
          'passed',
          '--verifier',
          'codex-release-manager',
          '--evidence-ref',
          RELEASE_EVIDENCE
        ],
        message: /release.ready requires --status declared/u
      },
      {
        name: 'declared non-ready gate',
        args: [
          '--gate',
          'release.pnpm-check',
          '--status',
          'declared',
          '--verifier',
          'codex-release-manager',
          '--evidence-ref',
          RELEASE_EVIDENCE
        ],
        message: /status declared is only valid for release.ready/u
      }
    ];

    for (const testCase of cases) {
      const root = await mkdtemp(join(tmpdir(), `symphony-v18-goal-gate-reject-${testCase.name.replaceAll(' ', '-')}-`));
      const stateDir = join(root, '.symphony');
      const output = createOutput();

      try {
        const exitCode = await runSymphonyCli({
          argv: [
            'goal',
            'gate',
            '--state-dir',
            stateDir,
            '--goal',
            GOAL_ID,
            ...testCase.args,
            '--dry-run'
          ],
          stdout: output.stdout,
          stderr: output.stderr
        });

        assert.equal(exitCode, 64, testCase.name);
        assert.match(output.stderrText(), testCase.message, testCase.name);
        assert.doesNotMatch(output.stderrText(), /\/Users\/andy|multi-coding-agent-symphony/u);
        assert.equal(await pathExists(getManagedGoalEventJournalPath({ stateDir, goalId: GOAL_ID })), false);
      } finally {
        await rm(root, { recursive: true, force: true });
      }
    }
  });

  it('refuses a mismatched plan hash without writing', async () => {
    const root = await mkdtemp(join(tmpdir(), 'symphony-v18-goal-gate-mismatch-'));
    const stateDir = join(root, '.symphony');
    const output = createOutput();

    try {
      const exitCode = await runSymphonyCli({
        argv: [
          'goal',
          'gate',
          '--state-dir',
          stateDir,
          '--goal',
          GOAL_ID,
          '--gate',
          'main-verification',
          '--task',
          'task-1',
          '--status',
          'failed',
          '--verifier',
          'codex-main-verifier',
          '--evidence-ref',
          MAIN_VERIFICATION_EVIDENCE,
          '--confirm',
          '--plan-hash',
          'sha256:0000000000000000000000000000000000000000000000000000000000000000'
        ],
        stdout: output.stdout,
        stderr: output.stderr
      });

      assert.equal(exitCode, 64);
      assert.match(output.stderrText(), /plan hash does not match/u);
      assert.equal(await pathExists(getManagedGoalEventJournalPath({ stateDir, goalId: GOAL_ID })), false);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });
});

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
