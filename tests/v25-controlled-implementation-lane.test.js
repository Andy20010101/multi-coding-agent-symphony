import { mkdir, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, relative } from 'node:path';
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { runSymphonyCli } from '../scripts/symphony.js';
import { createSymphonyConsoleServer } from '../src/symphony/console.js';
import { validateErrorEnvelopeContract } from '../src/symphony/error-envelope.js';
import { validateGoalUpdatePlanContract } from '../src/symphony/goal-event-contracts.js';
import {
  buildGoalRunbookInitPlan,
  confirmGoalRunbookInit
} from '../src/symphony/goal-runbook-registry.js';

const GOAL_ID = 'v25-controlled-implementation-lane';
const RUNBOOK_FIXTURE = 'fixtures/contracts/goal-runbook.v25-controlled-implementation-lane.v1.json';
const TASK_5_EVIDENCE_REF = 'artifact-ref:artifact:run-v25-task-5:evidence';
const TASK_5_LEDGER_EVIDENCE_REF = 'artifact:run-v25-task-5:evidence';

describe('v25 controlled implementation lane fixtures', () => {
  it('freezes a write plan and confirms it only into an isolated workspace fixture', async () => {
    const root = await mkdtemp(join(tmpdir(), 'symphony-v25-controlled-plan-confirm-'));

    try {
      await writeFixtureProject(root);

      const stateDir = join(root, '.symphony');
      await scanFixtureProject({ root, stateDir });

      const planned = await planControlledImplementation({
        root,
        stateDir,
        real: false,
        prompt: 'implement task-5 fixture'
      });
      const plan = JSON.parse(await readFile(planned.executionPlanArtifactPath, 'utf8'));

      assert.equal(planned.status, 'planned');
      assert.equal(planned.mainWorktreeWrites, false);
      assert.equal(planned.workspaceWrites, true);
      assert.equal(planned.writeBoundary, 'isolated-workspace');
      assert.equal(plan.contractName, 'symphony.execution-plan');
      assert.equal(plan.mainWorktreeWrites, false);
      assert.equal(plan.workspaceWrites, true);
      assert.match(plan.confirmationCommand, /symphony do --confirm-plan/u);
      assert.equal(await readFile(join(root, 'README.md'), 'utf8'), '# Fixture\n');

      const harnessCalls = [];
      const confirmed = await confirmControlledImplementation({
        stateDir,
        planId: planned.executionPlanId,
        harnessCalls
      });

      assert.equal(harnessCalls.length, 1);
      assert.equal(harnessCalls[0].includes('--materialize-workspaces'), true);
      assert.equal(harnessCalls[0].includes('--real'), false);
      assert.equal(confirmed.status, 'passed');
      assert.equal(confirmed.executionPlanId, planned.executionPlanId);
      assert.equal(confirmed.mainWorktreeWrites, false);
      assert.equal(confirmed.workspaceWrites, true);
      assert.equal(confirmed.externalCalls, false);
      assert.equal(await readFile(join(root, 'README.md'), 'utf8'), '# Fixture\n');
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it('rejects missing adapter gates and stale frozen fingerprints before the harness can start', async () => {
    const root = await mkdtemp(join(tmpdir(), 'symphony-v25-controlled-reject-'));

    try {
      await writeFixtureProject(root);

      const stateDir = join(root, '.symphony');
      await scanFixtureProject({ root, stateDir });

      const realPlan = await planControlledImplementation({
        root,
        stateDir,
        real: true,
        prompt: 'implement task-5 fixture with real adapter gate'
      });
      const calls = [];
      const blockedHarness = async (invocation) => {
        calls.push(invocation.argv);
        throw new Error('confirmation should fail before the harness starts');
      };

      const ungated = await runCliJson({
        argv: ['do', '--state-dir', stateDir, '--confirm-plan', realPlan.executionPlanId, '--json'],
        mcasRunner: blockedHarness,
        env: {}
      });

      assert.equal(ungated.exitCode, 64);
      assert.match(ungated.stderr.message, /MCAS_RUN_REAL_CODEX/u);

      const dryPlan = await planControlledImplementation({
        root,
        stateDir,
        real: false,
        prompt: 'implement task-5 fixture with stale guard'
      });

      await writeFile(join(root, 'tests', 'fixture.test.js'), 'export const ok = false;\n', 'utf8');

      const stale = await runCliJson({
        argv: ['do', '--state-dir', stateDir, '--confirm-plan', dryPlan.executionPlanId, '--json'],
        mcasRunner: blockedHarness,
        env: {}
      });

      assert.equal(stale.exitCode, 64);
      assert.match(stale.stderr.message, /stale|fingerprint/u);
      assert.deepEqual(calls, []);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it('registers task-5 worker evidence through dry-run plus plan-hash confirm only', async () => {
    const context = await startV25ConsoleServer();

    try {
      const beforePreview = await snapshotGoalEventFiles(context.stateDir);
      const previewResponse = await fetch(`${context.baseUrl}/api/goals/latest/event-plan-preview?${new URLSearchParams({
        command: 'update',
        task: 'task-5',
        event: 'worker.evidence-recorded',
        actor: 'codex-v25-task-5-worker',
        evidenceRef: TASK_5_EVIDENCE_REF
      })}`);
      const preview = await previewResponse.json();

      assert.equal(previewResponse.status, 200);
      assert.deepEqual(validateGoalUpdatePlanContract(preview), {
        ok: true,
        errors: []
      });
      assert.equal(preview.goalId, GOAL_ID);
      assert.equal(preview.eventSummary.eventType, 'worker.evidence-recorded');
      assert.equal(preview.eventSummary.taskId, 'task-5');
      assert.equal(preview.eventSummary.writesInDryRun, false);
      assert.equal(preview.previewEndpoint.genericShellRunner, false);
      assert.equal(preview.previewEndpoint.dryRunOnly, true);
      assert.equal(preview.operationRun.status, 'dry-run-planned');
      assert.deepEqual(await snapshotGoalEventFiles(context.stateDir), beforePreview);

      const missingHashResponse = await fetch(`${context.baseUrl}/api/goals/${GOAL_ID}/event-plan-confirm`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          command: 'update',
          task: 'task-5',
          event: 'worker.evidence-recorded',
          actor: 'codex-v25-task-5-worker',
          evidenceRef: [TASK_5_EVIDENCE_REF]
        })
      });
      const missingHash = await missingHashResponse.json();

      assert.equal(missingHashResponse.status, 400);
      assert.equal(missingHash.error.code, 'invalid-goal-confirm-request');
      assert.match(missingHash.error.message, /planHash/u);
      assert.deepEqual(validateErrorEnvelopeContract(missingHash), {
        ok: true,
        errors: []
      });
      assert.deepEqual(await snapshotGoalEventFiles(context.stateDir), beforePreview);

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
          actor: 'codex-v25-task-5-worker',
          evidenceRef: [TASK_5_EVIDENCE_REF],
          planHash: preview.planHash
        })
      });
      const confirmation = await confirmResponse.json();

      assert.equal(confirmResponse.status, 200);
      assert.equal(confirmation.contractName, 'goal-event-confirmation.v1');
      assert.equal(confirmation.status, 'appended');
      assert.equal(confirmation.command, 'update');
      assert.equal(confirmation.eventSummary.eventType, 'worker.evidence-recorded');
      assert.equal(confirmation.eventSummary.actorId, 'codex-v25-task-5-worker');
      assert.equal(confirmation.operationRun.operationId, preview.operationRun.operationId);
      assert.equal(confirmation.operationRun.status, 'confirmed');
      assert.equal(confirmation.confirmEndpoint.genericShellRunner, false);
      assert.deepEqual(confirmation.confirmEndpoint.constrainedCommands, ['update', 'review', 'gate']);
      assert.equal(
        confirmation.refreshed.progress.tasks.find((task) => task.taskId === 'task-5').workerEvidenceRef,
        TASK_5_LEDGER_EVIDENCE_REF
      );
    } finally {
      await closeV25ConsoleServer(context);
    }
  });
});

async function scanFixtureProject({ root, stateDir }) {
  const output = createOutput();
  const exitCode = await runSymphonyCli({
    argv: [
      'scan',
      '--project-dir',
      root,
      '--output-dir',
      join(root, 'scan-out'),
      '--state-dir',
      stateDir,
      '--json'
    ],
    stdout: output.stdout,
    stderr: output.stderr,
    runner: new MissingToolRunner()
  });

  assert.equal(exitCode, 0);
  assert.equal(output.stderrText(), '');
}

async function planControlledImplementation({ root, stateDir, real, prompt }) {
  const output = createOutput();
  const argv = [
    'do',
    '--project-dir',
    root,
    '--state-dir',
    stateDir,
    '--work-dir',
    join(root, real ? 'work-real' : 'work'),
    '--write',
    '--json',
    prompt
  ];

  if (real) {
    argv.splice(7, 0, '--real', 'codex');
  }

  const exitCode = await runSymphonyCli({
    argv,
    stdout: output.stdout,
    stderr: output.stderr,
    mcasRunner: async () => {
      throw new Error('planning must not invoke the harness');
    }
  });

  assert.equal(exitCode, 0);
  assert.equal(output.stderrText(), '');

  return JSON.parse(output.stdoutText());
}

async function confirmControlledImplementation({ stateDir, planId, harnessCalls }) {
  const output = createOutput();
  const exitCode = await runSymphonyCli({
    argv: ['do', '--state-dir', stateDir, '--confirm-plan', planId, '--json'],
    stdout: output.stdout,
    stderr: output.stderr,
    mcasRunner: async (invocation) => fakeControlledHarnessRunner(invocation, harnessCalls)
  });

  assert.equal(exitCode, 0);
  assert.equal(output.stderrText(), '');

  return JSON.parse(output.stdoutText());
}

async function runCliJson(options) {
  const output = createOutput();
  const exitCode = await runSymphonyCli({
    ...options,
    stdout: output.stdout,
    stderr: output.stderr
  });

  return {
    exitCode,
    stdout: output.stdoutText() === '' ? null : JSON.parse(output.stdoutText()),
    stderr: output.stderrText() === '' ? null : JSON.parse(output.stderrText())
  };
}

async function startV25ConsoleServer() {
  const stateDir = await mkdtemp(join(tmpdir(), 'symphony-v25-worker-evidence-registration-'));
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

async function closeV25ConsoleServer(context) {
  await new Promise((resolve, reject) => {
    context.server.close((error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });

  await rm(context.stateDir, { recursive: true, force: true });
}

async function snapshotGoalEventFiles(root) {
  return await snapshotDirectoryFiles(root, (file) => !file.startsWith('goals/operations/'));
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

async function fakeControlledHarnessRunner({ argv, stdout }, calls) {
  calls.push([...argv]);
  assert.equal(argv[0], 'harness');
  assert.equal(argv[1], 'run-taskpacket');

  const runId = optionValue(argv, '--run-id');
  const runtimeDir = optionValue(argv, '--runtime-dir');
  const artifactDirectory = join(runtimeDir, 'artifacts');
  const taskId = `symphony.work.${runId}`;
  const artifactId = 'implement-evidence';

  await mkdir(join(artifactDirectory, taskId), { recursive: true });
  await writeFile(join(artifactDirectory, taskId, `${artifactId}.json`), `${JSON.stringify({
    version: '1',
    changedFiles: ['isolated-workspace-output.txt'],
    checks: [{
      command: 'v25 fake controlled harness',
      exitCode: 0
    }]
  }, null, 2)}\n`, 'utf8');

  stdout.write(`${JSON.stringify({
    version: '1',
    command: 'harness run-taskpacket',
    status: 'passed',
    exitCode: 0,
    runId,
    workflowMode: 'writer-reviewer',
    executionMode: 'dry-run',
    adapterId: 'codex',
    taskId,
    artifactDirectory,
    verifierStatus: 'passed',
    commands: [{
      artifactId
    }]
  }, null, 2)}\n`);

  return 0;
}

function optionValue(argv, option) {
  const index = argv.indexOf(option);

  assert.notEqual(index, -1);
  return argv[index + 1];
}

async function writeFixtureProject(root) {
  await writeFile(join(root, 'README.md'), '# Fixture\n', 'utf8');
  await writeFile(join(root, 'AGENTS.md'), 'You must run tests.\n', 'utf8');
  await mkdir(join(root, 'tests'));
  await writeFile(join(root, 'tests', 'fixture.test.js'), 'export const ok = true;\n', 'utf8');
  await writeFile(join(root, 'package.json'), `${JSON.stringify({
    name: 'fixture',
    packageManager: 'pnpm@10.30.3',
    scripts: {
      check: 'node --check index.js',
      test: 'node --test'
    }
  }, null, 2)}\n`, 'utf8');
}

function createOutput() {
  const stdout = [];
  const stderr = [];

  return {
    stdout: {
      write(chunk) {
        stdout.push(String(chunk));
      }
    },
    stderr: {
      write(chunk) {
        stderr.push(String(chunk));
      }
    },
    stdoutText() {
      return stdout.join('');
    },
    stderrText() {
      return stderr.join('');
    }
  };
}

class MissingToolRunner {
  async run() {
    return {
      exitCode: 1,
      stdout: '',
      stderr: 'missing'
    };
  }
}
