import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { validateTaskSpec } from '../src/contracts.js';
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
      'github issue'
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
});

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
