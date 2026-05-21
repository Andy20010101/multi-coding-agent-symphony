import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

import { validateTaskSpec } from '../src/contracts.js';
import { CodexAdapter } from '../src/adapters/codex-adapter.js';
import { TaskQueue } from '../src/task-queue.js';
import { runMcasCli } from '../scripts/mcas.js';

const PACKAGE_ROOT = process.cwd();

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
      'intake',
      'github issue',
      'harness run-taskpacket',
      'queue manual',
      'run-next',
      'run-task',
      'smoke',
      'eval replay'
    ]);
  });

  it('runs project intake and writes project context artifacts without invoking a model', async () => {
    const root = await mkdtemp(join(tmpdir(), 'mcas-intake-cli-'));

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
      const exitCode = await runMcasCli({
        argv: [
          'intake',
          '--project-dir',
          root,
          '--runtime-dir',
          join(root, 'runtime')
        ],
        stdout: output.stdout,
        stderr: output.stderr,
        runner: new MissingToolRunner()
      });

      assert.equal(exitCode, 0);
      assert.equal(output.stderrText(), '');

      const intake = JSON.parse(output.stdoutText());

      assert.equal(intake.version, '1');
      assert.equal(intake.command, 'intake');
      assert.equal(intake.taskId, 'project-intake');
      assert.equal(intake.contextArtifactId, 'project-context');
      assert.equal(intake.summaryArtifactId, 'intake-summary');
      assert.equal(intake.modelInvocation, false);
      assert.equal(intake.providerStatus, 'builtin');
      assert.equal(intake.contextArtifactPath, join(root, 'runtime', 'artifacts', 'project-intake', 'project-context.json'));
      assert.equal(intake.summaryArtifactPath, join(root, 'runtime', 'artifacts', 'project-intake', 'intake-summary.json'));
      assert.equal(existsSync(intake.contextArtifactPath), true);
      assert.equal(existsSync(intake.summaryArtifactPath), true);

      const context = JSON.parse(await readFile(intake.contextArtifactPath, 'utf8'));

      assert.equal(context.kind, 'project-context');
      assert.equal(context.provider.modelInvocation, false);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it('returns verifier failure when fail-on threshold is met', async () => {
    const root = await mkdtemp(join(tmpdir(), 'mcas-intake-fail-on-'));

    try {
      const output = createOutput();
      const exitCode = await runMcasCli({
        argv: [
          'intake',
          '--project-dir',
          root,
          '--runtime-dir',
          join(root, 'runtime'),
          '--fail-on',
          'high'
        ],
        stdout: output.stdout,
        stderr: output.stderr,
        runner: new MissingToolRunner()
      });

      assert.equal(exitCode, 70);
      assert.equal(output.stderrText(), '');

      const intake = JSON.parse(output.stdoutText());

      assert.equal(intake.status, 'failed');
      assert.equal(intake.exitCode, 70);
      assert.equal(intake.riskCounts.high >= 1, true);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it('keeps grill-me-docs optional unless the provider is required', async () => {
    const root = await mkdtemp(join(tmpdir(), 'mcas-intake-provider-'));

    try {
      const optionalOutput = createOutput();
      const optionalExitCode = await runMcasCli({
        argv: [
          'intake',
          '--project-dir',
          root,
          '--runtime-dir',
          join(root, 'runtime-optional'),
          '--provider',
          'grill-me-docs'
        ],
        stdout: optionalOutput.stdout,
        stderr: optionalOutput.stderr,
        runner: new MissingToolRunner()
      });

      assert.equal(optionalExitCode, 0);
      assert.equal(optionalOutput.stderrText(), '');
      assert.equal(JSON.parse(optionalOutput.stdoutText()).providerStatus, 'unavailable');

      const requiredOutput = createOutput();
      const requiredExitCode = await runMcasCli({
        argv: [
          'intake',
          '--project-dir',
          root,
          '--runtime-dir',
          join(root, 'runtime-required'),
          '--provider',
          'grill-me-docs',
          '--require-provider'
        ],
        stdout: requiredOutput.stdout,
        stderr: requiredOutput.stderr,
        runner: new MissingToolRunner()
      });

      assert.equal(requiredExitCode, 64);
      assert.equal(requiredOutput.stdoutText(), '');
      assert.match(JSON.parse(requiredOutput.stderrText()).message, /provider is unavailable/);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it('preflights real CLI adapters and writes a doctor proof artifact', async () => {
    const root = await mkdtemp(join(tmpdir(), 'mcas-real-cli-doctor-'));

    try {
      const configFile = join(root, 'real-cli-release.json');
      const proofDirectory = join(root, 'proofs');

      await writeFile(configFile, JSON.stringify({
        version: '1',
        models: {
          'claude-code': 'deepseek-v4-pro'
        },
        providers: {
          'claude-code': 'deepseek'
        }
      }));

      const runner = new QueueRunner([
        { exitCode: 0, stdout: 'codex 1.2.3\n', stderr: '' },
        { exitCode: 0, stdout: 'codex help\n', stderr: '' },
        { exitCode: 0, stdout: 'claude 2.1.123\n', stderr: '' },
        { exitCode: 0, stdout: 'claude help\n', stderr: '' },
        { exitCode: 0, stdout: '{"loggedIn":true,"authMethod":"oauth_token","apiProvider":"deepseek"}', stderr: '' },
        { exitCode: 0, stdout: 'kiro-cli 0.9.0\n', stderr: '' },
        { exitCode: 0, stdout: 'kiro help\n', stderr: '' }
      ]);
      const output = createOutput();

      const exitCode = await runMcasCli({
        argv: [
          'doctor',
          '--real-cli',
          '--real-cli-config',
          configFile,
          '--proof-dir',
          proofDirectory
        ],
        stdout: output.stdout,
        stderr: output.stderr,
        runner,
        env: {
          MCAS_RUN_REAL_CODEX: '1',
          MCAS_RUN_REAL_CLAUDE: '1',
          MCAS_RUN_REAL_KIRO: '1'
        }
      });

      assert.equal(exitCode, 0);
      assert.equal(output.stderrText(), '');
      assert.deepEqual(runner.calls.map((call) => [call.executable, call.args]), [
        ['codex', ['--version']],
        ['codex', ['exec', '--help']],
        ['claude', ['--version']],
        ['claude', ['--help']],
        ['claude', ['auth', 'status']],
        ['kiro-cli', ['--version']],
        ['kiro-cli', ['--help']]
      ]);

      const doctor = JSON.parse(output.stdoutText());

      assert.equal(doctor.status, 'ok');
      assert.equal(doctor.realCli.status, 'ok');
      assert.equal(doctor.realCli.modelInvocation, false);
      assert.equal(doctor.realCli.releaseConfig.path, configFile);
      assert.equal(doctor.realCli.proofArtifactPath, join(proofDirectory, 'real-cli-doctor-proof.json'));

      const claude = doctor.realCli.adapters.find((adapter) => adapter.adapterId === 'claude-code');

      assert.equal(claude.cli.status, 'available');
      assert.equal(claude.cli.version, 'claude 2.1.123');
      assert.equal(claude.gate.status, 'enabled');
      assert.equal(claude.model.profile, 'deepseek-v4-pro');
      assert.equal(claude.model.source, 'release-config');
      assert.equal(claude.provider.name, 'deepseek');
      assert.equal(claude.auth.status, 'checked');
      assert.equal(claude.auth.apiProvider, 'deepseek');

      const proof = JSON.parse(await readFile(doctor.realCli.proofArtifactPath, 'utf8'));

      assert.equal(proof.version, '1');
      assert.equal(proof.kind, 'real-cli-doctor');
      assert.equal(proof.realCli.status, 'ok');
      assert.deepEqual(
        proof.realCli.adapters.map((adapter) => adapter.adapterId),
        ['codex', 'claude-code', 'kiro-cli']
      );
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it('fails fast when Claude release preflight would use the adapter default model', async () => {
    const root = await mkdtemp(join(tmpdir(), 'mcas-real-cli-doctor-default-'));

    try {
      const configFile = join(root, 'real-cli-release.json');

      await writeFile(configFile, JSON.stringify({
        version: '1',
        models: {},
        providers: {}
      }));

      const runner = new QueueRunner([
        { exitCode: 0, stdout: 'claude 2.1.123\n', stderr: '' },
        { exitCode: 0, stdout: 'claude help\n', stderr: '' },
        { exitCode: 0, stdout: '{"loggedIn":true,"authMethod":"oauth_token","apiProvider":"firstParty"}', stderr: '' }
      ]);
      const output = createOutput();

      const exitCode = await runMcasCli({
        argv: [
          'doctor',
          '--real-cli',
          '--adapter',
          'claude',
          '--real-cli-config',
          configFile
        ],
        stdout: output.stdout,
        stderr: output.stderr,
        runner,
        env: {
          MCAS_RUN_REAL_CLAUDE: '1'
        }
      });

      assert.equal(exitCode, 1);
      assert.equal(output.stderrText(), '');

      const doctor = JSON.parse(output.stdoutText());
      const [claude] = doctor.realCli.adapters;

      assert.equal(doctor.status, 'failed');
      assert.equal(doctor.realCli.status, 'failed');
      assert.equal(claude.model.profile, 'deepseek-claude-code');
      assert.equal(claude.model.source, 'adapter-default');
      assert.equal(claude.model.status, 'failed');
      assert.match(claude.model.recommendation, /MCAS_CLAUDE_MODEL/);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it('fails fast when Claude auth provider does not match the release config provider', async () => {
    const root = await mkdtemp(join(tmpdir(), 'mcas-real-cli-doctor-auth-'));

    try {
      const configFile = join(root, 'real-cli-release.json');

      await writeFile(configFile, JSON.stringify({
        version: '1',
        models: {
          'claude-code': 'deepseek-v4-pro'
        },
        providers: {
          'claude-code': 'deepseek'
        }
      }));

      const runner = new QueueRunner([
        { exitCode: 0, stdout: 'claude 2.1.123\n', stderr: '' },
        { exitCode: 0, stdout: 'claude help\n', stderr: '' },
        { exitCode: 0, stdout: '{"loggedIn":true,"authMethod":"oauth_token","apiProvider":"firstParty"}', stderr: '' }
      ]);
      const output = createOutput();

      const exitCode = await runMcasCli({
        argv: [
          'doctor',
          '--real-cli',
          '--adapter',
          'claude',
          '--real-cli-config',
          configFile
        ],
        stdout: output.stdout,
        stderr: output.stderr,
        runner,
        env: {
          MCAS_RUN_REAL_CLAUDE: '1'
        }
      });

      assert.equal(exitCode, 1);
      assert.equal(output.stderrText(), '');

      const doctor = JSON.parse(output.stdoutText());
      const [claude] = doctor.realCli.adapters;

      assert.equal(doctor.realCli.status, 'failed');
      assert.equal(claude.model.status, 'configured');
      assert.equal(claude.auth.status, 'failed');
      assert.equal(claude.auth.apiProvider, 'firstParty');
      assert.match(claude.auth.recommendation, /provider is deepseek/);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
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

  it('runs a TaskSpec file through a selected real CLI lane', async () => {
    const root = await mkdtemp(join(tmpdir(), 'mcas-cli-run-task-real-'));
    let adapter;

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
          'session-cli',
          '--real',
          '--adapter',
          'codex'
        ],
        stdout: output.stdout,
        stderr: output.stderr,
        adapterFactory(options) {
          adapter = new RecordingRealCliAdapter(options);
          return adapter;
        }
      });

      assert.equal(exitCode, 0);
      assert.equal(output.stderrText(), '');
      assert.deepEqual(adapter.executionModes, ['real', 'real', 'real']);

      const run = JSON.parse(output.stdoutText());

      assert.equal(run.executionMode, 'real');
      assert.equal(run.adapterId, 'codex');
      assert.deepEqual(run.commands.map((command) => command.adapterId), [
        'codex',
        'codex',
        'codex'
      ]);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it('dispatches smoke checks through existing package scripts', async () => {
    const runner = new QueueRunner([
      {
        exitCode: 0,
        stdout: 'codex help ok',
        stderr: ''
      },
      {
        exitCode: 0,
        stdout: 'claude help ok',
        stderr: ''
      },
      {
        exitCode: 0,
        stdout: 'kiro help ok',
        stderr: ''
      }
    ]);
    const outputs = [];

    for (const adapter of ['codex', 'claude', 'kiro']) {
      const output = createOutput();
      const exitCode = await runMcasCli({
        argv: ['smoke', adapter],
        stdout: output.stdout,
        stderr: output.stderr,
        runner
      });

      assert.equal(exitCode, 0);
      assert.equal(output.stderrText(), '');
      outputs.push(JSON.parse(output.stdoutText()));
    }

    assert.deepEqual(runner.calls, [
      {
        executable: 'pnpm',
        args: ['smoke:codex:help'],
        cwd: PACKAGE_ROOT
      },
      {
        executable: 'pnpm',
        args: ['smoke:claude:help'],
        cwd: PACKAGE_ROOT
      },
      {
        executable: 'pnpm',
        args: ['smoke:kiro:help'],
        cwd: PACKAGE_ROOT
      }
    ]);
    assert.deepEqual(outputs.map((output) => output.script), [
      'smoke:codex:help',
      'smoke:claude:help',
      'smoke:kiro:help'
    ]);
    assert.deepEqual(outputs.map((output) => output.status), [
      'passed',
      'passed',
      'passed'
    ]);
  });

  it('propagates smoke command exit codes', async () => {
    const runner = new FakeRunner({
      exitCode: 2,
      stdout: '',
      stderr: 'codex missing'
    });
    const output = createOutput();

    const exitCode = await runMcasCli({
      argv: ['smoke', 'codex'],
      stdout: output.stdout,
      stderr: output.stderr,
      runner
    });

    assert.equal(exitCode, 2);
    assert.equal(output.stderrText(), '');
    assert.deepEqual(JSON.parse(output.stdoutText()), {
      version: '1',
      command: 'smoke',
      adapter: 'codex',
      smoke: 'help',
      script: 'smoke:codex:help',
      status: 'failed',
      exitCode: 2,
      stdout: '',
      stderr: 'codex missing'
    });
  });

  it('dispatches eval replay with pass-through arguments', async () => {
    const runner = new FakeRunner({
      exitCode: 0,
      stdout: '{"reportRef":{"taskId":"eval","artifactId":"report"}}',
      stderr: ''
    });
    const output = createOutput();

    const exitCode = await runMcasCli({
      argv: [
        'eval',
        'replay',
        '--artifacts',
        'tmp/artifacts',
        '--events',
        'tmp/events',
        '--reason',
        'model-upgrade'
      ],
      stdout: output.stdout,
      stderr: output.stderr,
      runner
    });

    assert.equal(exitCode, 0);
    assert.equal(output.stderrText(), '');
    assert.deepEqual(runner.calls, [{
      executable: 'pnpm',
      args: [
        'eval:replay',
        '--',
        '--artifacts',
        'tmp/artifacts',
        '--events',
        'tmp/events',
        '--reason',
        'model-upgrade'
      ],
      cwd: PACKAGE_ROOT
    }]);
    assert.deepEqual(JSON.parse(output.stdoutText()), {
      version: '1',
      command: 'eval replay',
      script: 'eval:replay',
      status: 'passed',
      exitCode: 0,
      args: [
        '--artifacts',
        'tmp/artifacts',
        '--events',
        'tmp/events',
        '--reason',
        'model-upgrade'
      ],
      stdout: '{"reportRef":{"taskId":"eval","artifactId":"report"}}',
      stderr: '',
      reportRef: {
        taskId: 'eval',
        artifactId: 'report'
      }
    });
  });

  it('strips the CLI separator before dispatching eval replay arguments', async () => {
    const runner = new FakeRunner({
      exitCode: 0,
      stdout: [
        '> multi-coding-agent-symphony@0.1.0 eval:replay',
        '{"reportArtifactPath":"tmp/eval-reports/report.json"}'
      ].join('\n'),
      stderr: ''
    });
    const output = createOutput();

    const exitCode = await runMcasCli({
      argv: [
        'eval',
        'replay',
        '--',
        '--artifacts',
        'tmp/eval-replay-comparison-artifacts',
        '--workflow-comparison-fixture',
        'workflow-comparison'
      ],
      stdout: output.stdout,
      stderr: output.stderr,
      runner
    });

    assert.equal(exitCode, 0);
    assert.equal(output.stderrText(), '');
    assert.deepEqual(runner.calls, [{
      executable: 'pnpm',
      args: [
        'eval:replay',
        '--',
        '--artifacts',
        'tmp/eval-replay-comparison-artifacts',
        '--workflow-comparison-fixture',
        'workflow-comparison'
      ],
      cwd: PACKAGE_ROOT
    }]);
    assert.deepEqual(JSON.parse(output.stdoutText()), {
      version: '1',
      command: 'eval replay',
      script: 'eval:replay',
      status: 'passed',
      exitCode: 0,
      args: [
        '--artifacts',
        'tmp/eval-replay-comparison-artifacts',
        '--workflow-comparison-fixture',
        'workflow-comparison'
      ],
      stdout: [
        '> multi-coding-agent-symphony@0.1.0 eval:replay',
        '{"reportArtifactPath":"tmp/eval-reports/report.json"}'
      ].join('\n'),
      stderr: '',
      reportArtifactPath: 'tmp/eval-reports/report.json'
    });
  });

  it('propagates eval replay exit codes', async () => {
    const runner = new FakeRunner({
      exitCode: 3,
      stdout: '',
      stderr: 'missing artifacts'
    });
    const output = createOutput();

    const exitCode = await runMcasCli({
      argv: ['eval', 'replay', '--artifacts', 'missing'],
      stdout: output.stdout,
      stderr: output.stderr,
      runner
    });

    assert.equal(exitCode, 3);
    assert.equal(output.stderrText(), '');
    assert.equal(JSON.parse(output.stdoutText()).status, 'failed');
  });

  it('runs package script dispatch from the package root when invoked elsewhere', async () => {
    const callerProject = await mkdtemp(join(tmpdir(), 'mcas-cli-caller-project-'));
    const originalCwd = process.cwd();

    try {
      process.chdir(callerProject);

      const runner = new QueueRunner([
        { exitCode: 0, stdout: 'codex help ok', stderr: '' },
        { exitCode: 0, stdout: '{"reportArtifactPath":"tmp/eval-reports/report.json"}', stderr: '' }
      ]);
      const smokeOutput = createOutput();
      const smokeExitCode = await runMcasCli({
        argv: ['smoke', 'codex'],
        stdout: smokeOutput.stdout,
        stderr: smokeOutput.stderr,
        runner
      });
      const replayOutput = createOutput();
      const replayExitCode = await runMcasCli({
        argv: ['eval', 'replay', '--workflow-comparison-fixture', 'workflow-comparison'],
        stdout: replayOutput.stdout,
        stderr: replayOutput.stderr,
        runner
      });

      assert.equal(smokeExitCode, 0);
      assert.equal(replayExitCode, 0);
      assert.deepEqual(runner.calls.map((call) => call.cwd), [PACKAGE_ROOT, PACKAGE_ROOT]);
    } finally {
      process.chdir(originalCwd);
      await rm(callerProject, { recursive: true, force: true });
    }
  });

  it('loads runtime defaults from config and lets flags override them', async () => {
    const root = await mkdtemp(join(tmpdir(), 'mcas-cli-config-'));

    try {
      const stateFile = join(root, 'configured-queue.json');
      const artifactDirectory = join(root, 'configured-artifacts');
      const eventDirectory = join(root, 'configured-events');
      const workspaceDirectory = join(root, 'configured-workspaces');
      const overrideArtifactDirectory = join(root, 'override-artifacts');
      const configFile = join(root, 'mcas.config.json');
      const queue = new TaskQueue({ stateFile });

      queue.enqueue(manualTask, {
        now: '2026-05-13T00:00:00.000Z'
      });
      await writeFile(configFile, `${JSON.stringify({
        version: '1',
        runtime: {
          stateFile,
          artifactDirectory,
          eventDirectory,
          workspaceDirectory,
          sessionId: 'configured-session'
        }
      }, null, 2)}\n`, 'utf8');

      const configuredOutput = createOutput();
      const configuredExitCode = await runMcasCli({
        argv: [
          'run-next',
          '--config',
          configFile,
          '--now',
          '2026-05-13T00:00:01.000Z'
        ],
        stdout: configuredOutput.stdout,
        stderr: configuredOutput.stderr
      });

      assert.equal(configuredExitCode, 0);

      const configuredRun = JSON.parse(configuredOutput.stdoutText());

      assert.equal(configuredRun.configFile, configFile);
      assert.equal(configuredRun.stateFile, stateFile);
      assert.equal(configuredRun.artifactDirectory, artifactDirectory);
      assert.equal(configuredRun.eventDirectory, eventDirectory);
      assert.equal(configuredRun.workspaceDirectory, workspaceDirectory);
      assert.equal(configuredRun.sessionId, 'configured-session');

      new TaskQueue({ stateFile }).enqueue({
        ...manualTask,
        id: 'manual-release-checklist-2'
      });

      const overrideOutput = createOutput();
      const overrideExitCode = await runMcasCli({
        argv: [
          'run-next',
          '--config',
          configFile,
          '--artifact-dir',
          overrideArtifactDirectory
        ],
        stdout: overrideOutput.stdout,
        stderr: overrideOutput.stderr
      });

      assert.equal(overrideExitCode, 0);
      assert.equal(JSON.parse(overrideOutput.stdoutText()).artifactDirectory, overrideArtifactDirectory);
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

class QueueRunner {
  constructor(results) {
    this.results = [...results];
    this.calls = [];
  }

  async run(invocation) {
    this.calls.push(invocation);
    return this.results.shift();
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

class RecordingRealCliAdapter {
  constructor({ adapterId = 'codex' } = {}) {
    this.adapterId = adapterId;
    this.cliName = adapterId;
    this.cliVersion = 'synthetic-real';
    this.modelProfiles = ['gpt-codex-default'];
    this.runs = new Map();
    this.executionModes = [];
  }

  async probe() {
    return {
      adapterId: this.adapterId,
      cliName: this.cliName,
      cliVersion: this.cliVersion,
      supportedCommands: ['plan', 'implement', 'review', 'fix-ci', 'qa'],
      modelProfiles: [...this.modelProfiles],
      supportsNonInteractive: true,
      supportsResume: true,
      supportsCancel: true,
      supportsHooks: true,
      supportsMcp: true,
      supportsStructuredOutput: true,
      workspaceIsolation: 'external-workspace',
      logStrategy: 'jsonl-stdout',
      version: '1'
    };
  }

  async start(input) {
    this.executionModes.push(input.executionMode);
    assert.equal(existsSync(input.workspace), true);
    const runId = `${this.adapterId}-${input.commandSpec.name}-${this.runs.size + 1}`;
    const handle = {
      runId,
      adapterId: this.adapterId,
      status: 'completed',
      dryRun: false,
      command: input.commandSpec.name,
      taskId: input.contextPack.task.id,
      workspaceId: input.workspace
    };

    this.runs.set(runId, handle);
    return structuredClone(handle);
  }

  async *streamEvents(handle) {
    yield {
      type: 'adapter.started',
      runId: handle.runId,
      adapterId: this.adapterId,
      dryRun: false
    };
    yield {
      type: 'command.finished',
      runId: handle.runId,
      adapterId: this.adapterId,
      status: 'completed'
    };
  }

  async collectEvidence(handle) {
    return {
      command: handle.command,
      taskId: handle.taskId,
      workspaceId: handle.workspaceId,
      diffSummary: handle.command === 'implement' ? ['Synthetic real CLI change summary.'] : [],
      changedFiles: handle.command === 'implement' ? ['synthetic-real.txt'] : [],
      checks: [{
        name: 'mcas-cli-real',
        status: 'passed',
        command: 'mcas-cli-real',
        exitCode: 0,
        artifactId: `${handle.command}-real-cli-check`,
        output: 'Synthetic real CLI check passed.'
      }],
      knownRisks: [],
      agentSummary: 'Synthetic real CLI evidence.',
      ...(handle.command === 'review' ? { noFindingRationale: 'Synthetic real review found no issues.' } : {}),
      version: '1'
    };
  }
}
