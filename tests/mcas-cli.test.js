import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

import { validateTaskSpec } from '../src/contracts.js';
import { CodexAdapter } from '../src/adapters/codex-adapter.js';
import { TaskQueue } from '../src/task-queue.js';
import { runMcasCli } from '../scripts/mcas.js';

describe('Phase 8 user-facing CLI', () => {
  it('prints a doctor health summary', async () => {
    const output = createOutput();

    const exitCode = await runMcasCli({
      argv: ['doctor'],
      stdout: output.stdout,
      stderr: output.stderr
    });

    assert.equal(exitCode, 0);
    assert.equal(output.stderrText(), '');

    const doctor = JSON.parse(output.stdoutText());

    assert.equal(doctor.version, '1');
    assert.equal(doctor.status, 'ok');
    assert.equal(doctor.packageManager, 'pnpm');
    assert.equal(typeof doctor.nodeVersion, 'string');
    assert.deepEqual(doctor.commands, [
      'doctor',
      'github issue',
      'queue manual',
      'run-next',
      'run-task'
    ]);
  });

  it('reads a GitHub issue through the CLI without invoking a model', async () => {
    const runner = new FakeRunner({
      exitCode: 0,
      stdout: JSON.stringify({
        number: 42,
        title: 'Add release checklist',
        body: '- [ ] release checklist exists',
        labels: [{ name: 'priority:high' }],
        createdAt: '2026-05-13T12:00:00.000Z'
      })
    });
    const output = createOutput();

    const exitCode = await runMcasCli({
      argv: [
        'github',
        'issue',
        '--repo',
        'Andy20010101/multi-coding-agent-symphony',
        '--number',
        '42'
      ],
      stdout: output.stdout,
      stderr: output.stderr,
      runner
    });

    assert.equal(exitCode, 0);
    assert.equal(output.stderrText(), '');
    assert.deepEqual(runner.calls, [{
      executable: 'gh',
      args: [
        'issue',
        'view',
        '42',
        '--repo',
        'Andy20010101/multi-coding-agent-symphony',
        '--json',
        'number,title,body,labels,createdAt'
      ]
    }]);

    const intake = JSON.parse(output.stdoutText());

    assert.equal(intake.version, '1');
    assert.equal(intake.command, 'github issue');
    assert.equal(intake.mode, 'read-only-intake');
    assert.equal(intake.modelInvocation, false);
    assert.equal(validateTaskSpec(intake.taskSpec), intake.taskSpec);
    assert.equal(intake.taskSpec.id, 'github-issue-42');
    assert.equal(intake.taskSpec.priority, 'high');
    assert.deepEqual(intake.taskSpec.acceptance, ['release checklist exists']);
  });

  it('queues a manual task to a configured state file', async () => {
    const root = await mkdtemp(join(tmpdir(), 'mcas-cli-queue-'));

    try {
      const stateFile = join(root, 'queue.json');
      const output = createOutput();

      const exitCode = await runMcasCli({
        argv: [
          'queue',
          'manual',
          '--state-file',
          stateFile,
          '--id',
          'manual-release-checklist',
          '--repo',
          'Andy20010101/multi-coding-agent-symphony',
          '--objective',
          'Create a release checklist',
          '--acceptance',
          'release checklist exists',
          '--priority',
          'high'
        ],
        stdout: output.stdout,
        stderr: output.stderr
      });

      assert.equal(exitCode, 0);
      assert.equal(output.stderrText(), '');

      const queued = JSON.parse(output.stdoutText());

      assert.deepEqual(queued, {
        version: '1',
        command: 'queue manual',
        status: 'queued',
        modelInvocation: false,
        stateFile,
        taskId: 'manual-release-checklist',
        queueStatus: 'queued',
        sequence: 1,
        createdEventId: 'task-queue-1-created'
      });

      const queueState = JSON.parse(await readFile(stateFile, 'utf8'));

      assert.equal(queueState.version, '1');
      assert.equal(queueState.sequence, 1);
      assert.equal(queueState.records.length, 1);
      assert.equal(validateTaskSpec(queueState.records[0].task), queueState.records[0].task);
      assert.deepEqual(queueState.records[0].task, {
        id: 'manual-release-checklist',
        source: 'manual',
        repository: 'Andy20010101/multi-coding-agent-symphony',
        objective: 'Create a release checklist',
        acceptance: ['release checklist exists'],
        priority: 'high',
        version: '1'
      });
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it('runs the next queued task through the CLI dry-run workflow', async () => {
    const root = await mkdtemp(join(tmpdir(), 'mcas-cli-run-next-'));

    try {
      const stateFile = join(root, 'queue.json');
      const queue = new TaskQueue({ stateFile });

      queue.enqueue(manualTask, {
        now: '2026-05-13T00:00:00.000Z'
      });

      const output = createOutput();
      const exitCode = await runMcasCli({
        argv: [
          'run-next',
          '--state-file',
          stateFile,
          '--runtime-dir',
          root,
          '--session-id',
          'session-cli',
          '--now',
          '2026-05-13T00:00:01.000Z'
        ],
        stdout: output.stdout,
        stderr: output.stderr
      });

      assert.equal(exitCode, 0);
      assert.equal(output.stderrText(), '');

      const run = JSON.parse(output.stdoutText());

      assert.equal(run.version, '1');
      assert.equal(run.command, 'run-next');
      assert.equal(run.status, 'passed');
      assert.equal(run.exitCode, 0);
      assert.equal(run.stateFile, stateFile);
      assert.equal(run.artifactDirectory, join(root, 'artifacts'));
      assert.equal(run.eventDirectory, join(root, 'events'));
      assert.equal(run.workspaceDirectory, join(root, 'workspaces'));
      assert.equal(run.taskId, 'manual-release-checklist');
      assert.deepEqual(run.commands.map((command) => command.command), [
        'implement',
        'review',
        'qa'
      ]);
      assert.deepEqual(run.commands.map((command) => command.verificationStatus), [
        'passed',
        'passed',
        'passed'
      ]);
      assert.equal(new TaskQueue({ stateFile }).get('manual-release-checklist').status, 'completed');
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it('returns nonzero when run-next fails verification', async () => {
    const root = await mkdtemp(join(tmpdir(), 'mcas-cli-run-next-failure-'));

    try {
      const stateFile = join(root, 'queue.json');
      const queue = new TaskQueue({ stateFile });

      queue.enqueue(manualTask, {
        now: '2026-05-13T00:00:00.000Z'
      });

      const output = createOutput();
      const exitCode = await runMcasCli({
        argv: [
          'run-next',
          '--state-file',
          stateFile,
          '--runtime-dir',
          root,
          '--session-id',
          'session-cli',
          '--now',
          '2026-05-13T00:00:01.000Z'
        ],
        stdout: output.stdout,
        stderr: output.stderr,
        adapterFactory: () => new FailingRunNextAdapter()
      });

      assert.equal(exitCode, 70);
      assert.equal(output.stderrText(), '');

      const run = JSON.parse(output.stdoutText());
      const record = new TaskQueue({ stateFile }).get('manual-release-checklist');

      assert.equal(run.status, 'failed');
      assert.equal(run.exitCode, 70);
      assert.equal(run.failedCommand, 'implement');
      assert.equal(record.status, 'queued');
      assert.equal(record.failedEventId, 'task-queue-1-failed-1');
      assert.equal(record.retryPlan.retry, true);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it('runs a TaskSpec file through the CLI dry-run workflow without queue state', async () => {
    const root = await mkdtemp(join(tmpdir(), 'mcas-cli-run-task-'));

    try {
      const taskFile = join(root, 'task.json');
      await writeFile(taskFile, `${JSON.stringify(manualTask, null, 2)}\n`, 'utf8');

      const output = createOutput();
      const exitCode = await runMcasCli({
        argv: [
          'run-task',
          '--task-file',
          taskFile,
          '--runtime-dir',
          root,
          '--session-id',
          'session-cli'
        ],
        stdout: output.stdout,
        stderr: output.stderr
      });

      assert.equal(exitCode, 0);
      assert.equal(output.stderrText(), '');

      const run = JSON.parse(output.stdoutText());

      assert.equal(run.version, '1');
      assert.equal(run.command, 'run-task');
      assert.equal(run.status, 'passed');
      assert.equal(run.exitCode, 0);
      assert.equal(run.taskFile, taskFile);
      assert.equal(run.taskId, 'manual-release-checklist');
      assert.deepEqual(run.commands.map((command) => command.command), [
        'implement',
        'review',
        'qa'
      ]);
      assert.deepEqual(run.commands.map((command) => command.verificationStatus), [
        'passed',
        'passed',
        'passed'
      ]);
      await assert.rejects(
        () => readFile(join(root, 'queue.json'), 'utf8'),
        /ENOENT/
      );
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });
});

const manualTask = {
  id: 'manual-release-checklist',
  source: 'manual',
  repository: 'Andy20010101/multi-coding-agent-symphony',
  objective: 'Create a release checklist',
  acceptance: ['release checklist exists'],
  priority: 'high',
  version: '1'
};

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

class FakeRunner {
  constructor(result) {
    this.result = result;
    this.calls = [];
  }

  async run(invocation) {
    this.calls.push(invocation);
    return this.result;
  }
}

class FailingRunNextAdapter extends CodexAdapter {
  constructor() {
    super({ cliVersion: 'synthetic-failing' });
  }

  async collectEvidence(handle) {
    return {
      command: handle.command,
      taskId: handle.taskId,
      workspaceId: handle.workspaceId,
      diffSummary: [],
      changedFiles: [],
      checks: [],
      knownRisks: ['synthetic-verifier-failure'],
      agentSummary: 'Synthetic failing evidence.',
      version: '1'
    };
  }
}
