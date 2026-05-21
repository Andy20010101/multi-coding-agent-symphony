import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

import { taskPacketToTaskSpec } from '../src/integrations/harness-bridge.js';
import {
  buildSymphonyWorkTaskPacket,
  runSymphonyCli
} from '../scripts/symphony.js';
import { runMcasCli } from '../scripts/mcas.js';

const FAKE_SECRET_VALUE = ['deepseek', 'secret', 'value'].join('-');
const FAKE_OPENAI_TOKEN = ['sk', '123456789012345678901234'].join('-');
const FAKE_BEARER_TOKEN = ['abcdefghijkl', 'mnopqrstuvwx'].join('');

describe('v5 symphony CLI identity', () => {
  it('declares symphony and mcas package bins without replacing the mcas script', async () => {
    const pkg = JSON.parse(await readFile('package.json', 'utf8'));

    assert.deepEqual(pkg.bin, {
      symphony: 'scripts/symphony.js',
      mcas: 'scripts/mcas.js'
    });
    assert.equal(pkg.scripts.symphony, 'node scripts/symphony.js');
    assert.equal(pkg.scripts.mcas, 'node scripts/mcas.js');
  });

  it('reuses the mcas doctor health path', async () => {
    const symphonyOutput = createOutput();
    const mcasOutput = createOutput();

    const symphonyExitCode = await runSymphonyCli({
      argv: ['doctor'],
      stdout: symphonyOutput.stdout,
      stderr: symphonyOutput.stderr
    });
    const mcasExitCode = await runMcasCli({
      argv: ['doctor'],
      stdout: mcasOutput.stdout,
      stderr: mcasOutput.stderr
    });

    assert.equal(symphonyExitCode, 0);
    assert.equal(mcasExitCode, 0);
    assert.equal(symphonyOutput.stderrText(), '');
    assert.equal(mcasOutput.stderrText(), '');
    assert.deepEqual(JSON.parse(symphonyOutput.stdoutText()), JSON.parse(mcasOutput.stdoutText()));
  });

  it('passes harness and replay commands through to the mcas kernel CLI', async () => {
    const calls = [];
    const mcasRunner = async ({ argv, stdout }) => {
      calls.push(argv);
      stdout.write(`${JSON.stringify({ version: '1', argv })}\n`);
      return 0;
    };

    for (const argv of [
      ['harness', 'run-taskpacket', '--run-id', 'fixture-run'],
      ['replay', '--artifacts', 'tmp/artifacts', '--reason', 'model-upgrade']
    ]) {
      const output = createOutput();
      const exitCode = await runSymphonyCli({
        argv,
        stdout: output.stdout,
        stderr: output.stderr,
        mcasRunner
      });

      assert.equal(exitCode, 0);
      assert.equal(output.stderrText(), '');
    }

    assert.deepEqual(calls, [
      ['harness', 'run-taskpacket', '--run-id', 'fixture-run'],
      ['eval', 'replay', '--artifacts', 'tmp/artifacts', '--reason', 'model-upgrade']
    ]);
  });
});

describe('v5 symphony work', () => {
  it('builds a minimal Harness TaskPacket from a prompt and workflow mode', () => {
    const taskPacket = buildSymphonyWorkTaskPacket({
      prompt: 'update README',
      mode: 'writer-reviewer',
      runId: 'symphony-work-test',
      adapter: 'codex'
    });

    assert.equal(taskPacket.version, '1');
    assert.equal(taskPacket.id, 'symphony.work.symphony-work-test');
    assert.equal(taskPacket.run_id, 'symphony-work-test');
    assert.equal(taskPacket.intent, 'update README');
    assert.deepEqual(taskPacket.acceptance, [
      'Task intent is addressed with verifier-readable evidence.',
      'Harness verification records are written.'
    ]);
    assert.deepEqual(taskPacket.write_set, ['symphony-work-output.txt']);
    assert.deepEqual(taskPacket.verification.commands, ['symphony-work-dry-run']);
    assert.equal(taskPacket.workflow.mode, 'writer-reviewer');
    assert.equal(taskPacket.workflow.writer.agent_id, 'codex-writer');
    assert.deepEqual(taskPacket.workflow.reviewers.map((reviewer) => reviewer.agent_id), ['codex-reviewer']);
    assert.equal(taskPacketToTaskSpec(taskPacket).objective, 'update README');
  });

  it('runs a dry-run work prompt through the existing Harness Bridge', async () => {
    const root = await mkdtemp(join(tmpdir(), 'symphony-work-cli-'));

    try {
      const output = createOutput();
      const exitCode = await runSymphonyCli({
        argv: [
          'work',
          '--mode',
          'writer-reviewer',
          '--dry-run',
          '--work-dir',
          root,
          'inspect README'
        ],
        stdout: output.stdout,
        stderr: output.stderr
      });

      assert.equal(exitCode, 0);
      assert.equal(output.stderrText(), '');

      const summary = JSON.parse(output.stdoutText());

      assert.equal(summary.version, '1');
      assert.equal(summary.command, 'symphony work');
      assert.equal(summary.status, 'passed');
      assert.equal(summary.workflowMode, 'writer-reviewer');
      assert.equal(summary.adapter, 'codex');
      assert.equal(summary.executionMode, 'dry-run');
      assert.equal(summary.verifierStatus, 'passed');
      assert.deepEqual(summary.changedFiles, ['symphony-work-output.txt']);
      assert.equal(summary.harnessOutputPath, join(root, summary.runId, 'harness'));
      assert.equal(summary.taskPacketPath, join(root, summary.runId, 'taskpacket.json'));
      assert.equal(summary.evidenceArtifactPath, join(root, summary.runId, 'runtime', 'artifacts', 'symphony.work.' + summary.runId, 'implement-evidence.json'));
      assert.equal(existsSync(summary.taskPacketPath), true);
      assert.equal(existsSync(summary.evidenceArtifactPath), true);
      assert.equal(existsSync(join(summary.harnessOutputPath, 'runs', summary.runId, 'summary.json')), true);
      assert.match(summary.nextAction, /harnessOutputPath/);

      const taskPacket = JSON.parse(await readFile(summary.taskPacketPath, 'utf8'));

      assert.equal(taskPacket.constraints, undefined);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it('runs a standalone symphony intake workflow through the mcas kernel', async () => {
    const root = await mkdtemp(join(tmpdir(), 'symphony-intake-cli-'));

    try {
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

      const output = createOutput();
      const exitCode = await runSymphonyCli({
        argv: [
          'intake',
          '--project-dir',
          root,
          '--output-dir',
          join(root, 'out')
        ],
        stdout: output.stdout,
        stderr: output.stderr,
        runner: new MissingToolRunner()
      });

      assert.equal(exitCode, 0);
      assert.equal(output.stderrText(), '');

      const intake = JSON.parse(output.stdoutText());

      assert.equal(intake.command, 'symphony intake');
      assert.equal(intake.provider, 'builtin');
      assert.equal(intake.modelInvocation, false);
      assert.equal(intake.taskId, 'project-intake');
      assert.equal(existsSync(intake.contextArtifactPath), true);
      assert.equal(existsSync(intake.summaryArtifactPath), true);
      assert.match(intake.nextAction, /--intake-artifact/);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it('runs preflight intake before dry-run work and carries context into the TaskPacket', async () => {
    const root = await mkdtemp(join(tmpdir(), 'symphony-preflight-work-'));

    try {
      const output = createOutput();
      const exitCode = await runSymphonyCli({
        argv: [
          'work',
          '--preflight-intake',
          '--dry-run',
          '--work-dir',
          root,
          'inspect README'
        ],
        stdout: output.stdout,
        stderr: output.stderr,
        runner: new MissingToolRunner()
      });

      assert.equal(exitCode, 0);
      assert.equal(output.stderrText(), '');

      const summary = JSON.parse(output.stdoutText());

      assert.equal(summary.command, 'symphony work');
      assert.equal(summary.status, 'passed');
      assert.equal(existsSync(summary.intakeContextArtifactPath), true);
      assert.equal(existsSync(summary.intakeSummaryArtifactPath), true);

      const taskPacket = JSON.parse(await readFile(summary.taskPacketPath, 'utf8'));

      assert.equal(taskPacket.constraints.includes(`project_context_artifact:${summary.intakeContextArtifactPath}`), true);
      assert.equal(taskPacket.constraints.some((constraint) => constraint.startsWith('recommended_workflow:')), true);
      assert.equal(taskPacket.constraints.some((constraint) => constraint === 'verification_command:pnpm check'), true);
      assert.equal(taskPacket.constraints.some((constraint) => constraint === 'verification_command:pnpm test'), true);
      assert.equal(taskPacketToTaskSpec(taskPacket).constraints.includes(`project_context_artifact:${summary.intakeContextArtifactPath}`), true);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it('reuses an existing intake artifact for work without running preflight', async () => {
    const root = await mkdtemp(join(tmpdir(), 'symphony-intake-artifact-work-'));

    try {
      const intakeOutput = createOutput();
      const intakeExitCode = await runSymphonyCli({
        argv: [
          'intake',
          '--project-dir',
          '.',
          '--output-dir',
          join(root, 'intake')
        ],
        stdout: intakeOutput.stdout,
        stderr: intakeOutput.stderr,
        runner: new MissingToolRunner()
      });
      const intake = JSON.parse(intakeOutput.stdoutText());

      assert.equal(intakeExitCode, 0);

      const workOutput = createOutput();
      const workExitCode = await runSymphonyCli({
        argv: [
          'work',
          '--intake-artifact',
          intake.contextArtifactPath,
          '--dry-run',
          '--work-dir',
          join(root, 'work'),
          'inspect README'
        ],
        stdout: workOutput.stdout,
        stderr: workOutput.stderr
      });

      assert.equal(workExitCode, 0);
      assert.equal(workOutput.stderrText(), '');

      const summary = JSON.parse(workOutput.stdoutText());
      const taskPacket = JSON.parse(await readFile(summary.taskPacketPath, 'utf8'));

      assert.equal(summary.intakeContextArtifactPath, intake.contextArtifactPath);
      assert.equal(summary.intakeSummaryArtifactPath, undefined);
      assert.equal(taskPacket.constraints.includes(`project_context_artifact:${intake.contextArtifactPath}`), true);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it('returns usage failure when an intake artifact is missing or invalid', async () => {
    const root = await mkdtemp(join(tmpdir(), 'symphony-missing-intake-artifact-'));

    try {
      const output = createOutput();
      const exitCode = await runSymphonyCli({
        argv: [
          'work',
          '--intake-artifact',
          join(root, 'missing.json'),
          '--dry-run',
          '--work-dir',
          root,
          'inspect README'
        ],
        stdout: output.stdout,
        stderr: output.stderr
      });

      assert.equal(exitCode, 64);
      assert.equal(output.stdoutText(), '');
      assert.match(JSON.parse(output.stderrText()).message, /--intake-artifact/);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it('runs review and qa shortcuts through qa-swarm work mode', async () => {
    const root = await mkdtemp(join(tmpdir(), 'symphony-shortcut-cli-'));

    try {
      for (const shortcut of ['review', 'qa']) {
        const output = createOutput();
        const exitCode = await runSymphonyCli({
          argv: [
            shortcut,
            '--dry-run',
            '--work-dir',
            root,
            'inspect README'
          ],
          stdout: output.stdout,
          stderr: output.stderr
        });

        assert.equal(exitCode, 0);
        assert.equal(output.stderrText(), '');

        const summary = JSON.parse(output.stdoutText());

        assert.equal(summary.command, `symphony ${shortcut}`);
        assert.equal(summary.status, 'passed');
        assert.equal(summary.workflowMode, 'qa-swarm');
        assert.equal(summary.executionMode, 'dry-run');
        assert.equal(summary.verifierStatus, 'passed');
        assert.deepEqual(summary.changedFiles, []);
        assert.equal(existsSync(summary.taskPacketPath), true);
      }
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it('passes through kernel errors when real work is missing its gate', async () => {
    const output = createOutput();
    const kernelError = {
      version: '1',
      status: 'error',
      exitCode: 64,
      message: 'Set MCAS_RUN_REAL_CODEX=1 to invoke the real codex CLI lane.'
    };

    const exitCode = await runSymphonyCli({
      argv: ['work', '--real', 'codex', 'inspect README'],
      stdout: output.stdout,
      stderr: output.stderr,
      mcasRunner: async ({ stderr }) => {
        stderr.write(`${JSON.stringify(kernelError, null, 2)}\n`);
        return 64;
      }
    });

    assert.equal(exitCode, 64);
    assert.equal(output.stdoutText(), '');
    assert.deepEqual(JSON.parse(output.stderrText()), kernelError);
  });
});

describe('v5 symphony native agent passthrough', () => {
  it('dry-runs claude /review without invoking the native CLI and writes proof metadata', async () => {
    const root = await mkdtemp(join(tmpdir(), 'symphony-agent-dry-'));
    const runner = new RecordingRunner({
      exitCode: 0,
      stdout: 'should not be used',
      stderr: ''
    });

    try {
      const output = createOutput();
      const exitCode = await runSymphonyCli({
        argv: [
          'agent',
          'claude',
          '/review',
          '--dry-run',
          '--proof-dir',
          root
        ],
        stdout: output.stdout,
        stderr: output.stderr,
        runner
      });

      assert.equal(exitCode, 0);
      assert.equal(output.stderrText(), '');
      assert.deepEqual(runner.calls, []);

      const summary = JSON.parse(output.stdoutText());
      const proof = JSON.parse(await readFile(summary.proofArtifactPath, 'utf8'));

      assert.equal(summary.command, 'symphony agent');
      assert.equal(summary.status, 'passed');
      assert.equal(summary.adapter, 'claude');
      assert.equal(summary.nativeCommand, '/review');
      assert.equal(summary.executionMode, 'dry-run');
      assert.equal(summary.verifierStatus, 'unverified');
      assert.equal(proof.kind, 'native-agent-proof');
      assert.equal(proof.adapterId, 'claude');
      assert.deepEqual(proof.nativeCommand, {
        executable: 'claude',
        args: ['-p', '/review'],
        command: '/review',
        prompt: ''
      });
      assert.equal(proof.modelInvocation, false);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it('gates real claude passthrough before invoking the native CLI', async () => {
    const runner = new RecordingRunner({
      exitCode: 0,
      stdout: 'unused',
      stderr: ''
    });
    const output = createOutput();

    const exitCode = await runSymphonyCli({
      argv: ['agent', 'claude', '/review', '--real'],
      stdout: output.stdout,
      stderr: output.stderr,
      runner,
      env: {}
    });

    assert.equal(exitCode, 64);
    assert.equal(output.stdoutText(), '');
    assert.deepEqual(runner.calls, []);

    const error = JSON.parse(output.stderrText());

    assert.equal(error.status, 'error');
    assert.match(error.message, /MCAS_RUN_REAL_CLAUDE=1/);
  });

  it('captures redacted real passthrough stdout and stderr in proof artifacts', async () => {
    const root = await mkdtemp(join(tmpdir(), 'symphony-agent-real-'));
    const runner = new RecordingRunner({
      exitCode: 0,
      stdout: `ANTHROPIC_AUTH_TOKEN=${FAKE_SECRET_VALUE} Bearer ${FAKE_BEARER_TOKEN} /tmp/.env`,
      stderr: FAKE_OPENAI_TOKEN
    });

    try {
      const output = createOutput();
      const exitCode = await runSymphonyCli({
        argv: [
          'agent',
          'claude',
          '/review',
          '--real',
          '--proof-dir',
          root
        ],
        stdout: output.stdout,
        stderr: output.stderr,
        runner,
        env: {
          MCAS_RUN_REAL_CLAUDE: '1'
        }
      });

      assert.equal(exitCode, 0);
      assert.equal(output.stderrText(), '');
      assert.deepEqual(runner.calls, [{
        executable: 'claude',
        args: ['-p', '/review']
      }]);

      const summary = JSON.parse(output.stdoutText());
      const proof = JSON.parse(await readFile(summary.proofArtifactPath, 'utf8'));
      const stdoutArtifact = await readFile(proof.stdoutArtifactPath, 'utf8');
      const stderrArtifact = await readFile(proof.stderrArtifactPath, 'utf8');

      assert.equal(summary.executionMode, 'real');
      assert.equal(summary.verifierStatus, 'unverified');
      assert.equal(proof.modelInvocation, true);
      assert.equal(JSON.stringify(proof).includes('deepseek-secret-value'), false);
      assert.match(stdoutArtifact, /ANTHROPIC_AUTH_TOKEN=\[REDACTED_TOKEN\]/);
      assert.match(stdoutArtifact, /Bearer \[REDACTED_TOKEN\]/);
      assert.match(stdoutArtifact, /\[REDACTED_PATH\]/);
      assert.match(stderrArtifact, /\[REDACTED_TOKEN\]/);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
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

class RecordingRunner {
  constructor(result) {
    this.result = result;
    this.calls = [];
  }

  async run(invocation) {
    this.calls.push({
      executable: invocation.executable,
      args: invocation.args
    });

    return this.result;
  }
}

class MissingToolRunner {
  constructor() {
    this.calls = [];
  }

  async run(invocation) {
    this.calls.push(invocation);
    return {
      exitCode: 1,
      stdout: '',
      stderr: 'missing'
    };
  }
}
