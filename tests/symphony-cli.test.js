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

describe('v8 prompt-driven symphony CLI', () => {
  it('runs scan as the product intake alias and writes latest state pointers', async () => {
    const root = await mkdtemp(join(tmpdir(), 'symphony-v8-scan-'));

    try {
      await writeFixtureProject(root);

      const stateDir = join(root, '.symphony');
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

      const scan = JSON.parse(output.stdoutText());

      assert.equal(scan.command, 'symphony scan');
      assert.equal(scan.intent, 'scan-project');
      assert.equal(scan.safetyMode, 'read-only');
      assert.equal(scan.projectWrites, false);
      assert.equal(scan.runtimeWrites, true);
      assert.equal(scan.externalCalls, false);
      assert.equal(scan.modelInvocation, false);
      assert.equal(existsSync(scan.contextArtifactPath), true);
      assert.equal(existsSync(join(stateDir, 'context', 'latest.json')), true);
      assert.equal(existsSync(join(stateDir, 'runs', 'latest.json')), true);
      assert.equal(existsSync(join(stateDir, 'runs', `${scan.runId}.json`)), true);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it('runs do and verify aliases through cached context with product summaries', async () => {
    const root = await mkdtemp(join(tmpdir(), 'symphony-v8-work-'));

    try {
      await writeFixtureProject(root);

      const stateDir = join(root, '.symphony');
      const scanOutput = createOutput();

      await runSymphonyCli({
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
        stdout: scanOutput.stdout,
        stderr: scanOutput.stderr,
        runner: new MissingToolRunner()
      });

      const doOutput = createOutput();
      const doExitCode = await runSymphonyCli({
        argv: [
          'do',
          '--project-dir',
          root,
          '--state-dir',
          stateDir,
          '--work-dir',
          join(root, 'work'),
          '--dry-run',
          '--json',
          'inspect README'
        ],
        stdout: doOutput.stdout,
        stderr: doOutput.stderr
      });

      assert.equal(doExitCode, 0);
      assert.equal(doOutput.stderrText(), '');

      const work = JSON.parse(doOutput.stdoutText());

      assert.equal(work.command, 'symphony do');
      assert.equal(work.intent, 'work');
      assert.equal(work.semanticCommand, 'do');
      assert.deepEqual(work.pipeline, ['scan-if-needed', 'do']);
      assert.equal(work.contextReused, true);
      assert.equal(work.safetyMode, 'dry-run');
      assert.equal(work.verifierStatus, 'passed');
      assert.equal(existsSync(work.taskPacketPath), true);

      const verifyOutput = createOutput();
      const verifyExitCode = await runSymphonyCli({
        argv: [
          'verify',
          '--project-dir',
          root,
          '--state-dir',
          stateDir,
          '--work-dir',
          join(root, 'verify-work'),
          '--dry-run',
          '--json',
          'inspect README'
        ],
        stdout: verifyOutput.stdout,
        stderr: verifyOutput.stderr
      });

      assert.equal(verifyExitCode, 0);
      assert.equal(verifyOutput.stderrText(), '');

      const verify = JSON.parse(verifyOutput.stdoutText());

      assert.equal(verify.command, 'symphony verify');
      assert.equal(verify.intent, 'verify');
      assert.equal(verify.semanticCommand, 'verify');
      assert.equal(verify.workflowMode, 'qa-swarm');
      assert.equal(verify.projectWrites, false);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it('routes natural-language prompts without model classification', async () => {
    const root = await mkdtemp(join(tmpdir(), 'symphony-v8-router-'));

    try {
      await writeFixtureProject(root);

      const stateDir = join(root, '.symphony');
      const scanOutput = createOutput();
      const scanExitCode = await runSymphonyCli({
        argv: [
          '--json',
          '扫描这个仓库',
          '--project-dir',
          root,
          '--output-dir',
          join(root, 'scan-out'),
          '--state-dir',
          stateDir
        ],
        stdout: scanOutput.stdout,
        stderr: scanOutput.stderr,
        runner: new MissingToolRunner()
      });

      assert.equal(scanExitCode, 0);

      const scan = JSON.parse(scanOutput.stdoutText());

      assert.equal(scan.intent, 'scan-project');
      assert.equal(scan.routeDecision.intent, 'scan-project');
      assert.equal(scan.matchedSignals.includes('扫描'), true);

      const reviewOutput = createOutput();
      const reviewExitCode = await runSymphonyCli({
        argv: [
          '--json',
          '审查当前改动',
          '--project-dir',
          root,
          '--state-dir',
          stateDir,
          '--work-dir',
          join(root, 'review-work')
        ],
        stdout: reviewOutput.stdout,
        stderr: reviewOutput.stderr
      });

      assert.equal(reviewExitCode, 0);

      const review = JSON.parse(reviewOutput.stdoutText());

      assert.equal(review.intent, 'review');
      assert.equal(review.semanticCommand, 'review');
      assert.equal(review.safetyMode, 'read-only');
      assert.equal(review.workflowMode, 'qa-swarm');
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it('prints status and artifacts from state only', async () => {
    const root = await mkdtemp(join(tmpdir(), 'symphony-v8-state-'));

    try {
      await writeFixtureProject(root);

      const stateDir = join(root, '.symphony');
      const scanOutput = createOutput();

      await runSymphonyCli({
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
        stdout: scanOutput.stdout,
        stderr: scanOutput.stderr,
        runner: new MissingToolRunner()
      });

      const statusOutput = createOutput();
      const statusExitCode = await runSymphonyCli({
        argv: ['status', '--state-dir', stateDir, '--json'],
        stdout: statusOutput.stdout,
        stderr: statusOutput.stderr
      });

      assert.equal(statusExitCode, 0);
      assert.equal(JSON.parse(statusOutput.stdoutText()).latestIntent, 'scan-project');

      const artifactsOutput = createOutput();
      const artifactsExitCode = await runSymphonyCli({
        argv: ['artifacts', '--state-dir', stateDir, '--json'],
        stdout: artifactsOutput.stdout,
        stderr: artifactsOutput.stderr
      });

      assert.equal(artifactsExitCode, 0);
      assert.equal(existsSync(JSON.parse(artifactsOutput.stdoutText()).contextArtifactPath), true);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it('previews new projects without creating the target directory', async () => {
    const root = await mkdtemp(join(tmpdir(), 'symphony-v8-new-'));

    try {
      const targetDir = join(root, 'demo');
      const output = createOutput();
      const exitCode = await runSymphonyCli({
        argv: [
          'new',
          targetDir,
          '--template',
          'empty',
          '--dry-run',
          '--runtime-dir',
          join(root, 'runtime'),
          '--state-dir',
          join(root, '.symphony'),
          '--json'
        ],
        stdout: output.stdout,
        stderr: output.stderr
      });

      assert.equal(exitCode, 0);
      assert.equal(output.stderrText(), '');
      assert.equal(existsSync(targetDir), false);

      const summary = JSON.parse(output.stdoutText());

      assert.equal(summary.intent, 'new-project');
      assert.equal(summary.template, 'empty');
      assert.equal(summary.projectWrites, false);
      assert.equal(existsSync(summary.scaffoldManifestArtifactPath), true);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it('writes a limited node-cli template only when write mode is explicit', async () => {
    const root = await mkdtemp(join(tmpdir(), 'symphony-v8-new-write-'));

    try {
      const targetDir = join(root, 'demo-cli');
      const output = createOutput();
      const exitCode = await runSymphonyCli({
        argv: [
          'new',
          targetDir,
          '--template',
          'node-cli',
          '--write',
          '--runtime-dir',
          join(root, 'runtime'),
          '--state-dir',
          join(root, '.symphony'),
          '--json'
        ],
        stdout: output.stdout,
        stderr: output.stderr,
        runner: new MissingToolRunner()
      });

      assert.equal(exitCode, 0);
      assert.equal(output.stderrText(), '');
      assert.equal(existsSync(join(targetDir, 'README.md')), true);
      assert.equal(existsSync(join(targetDir, 'AGENTS.md')), true);
      assert.equal(existsSync(join(targetDir, 'package.json')), true);
      assert.equal(existsSync(join(targetDir, 'scripts', 'cli.js')), true);

      const summary = JSON.parse(output.stdoutText());

      assert.equal(summary.intent, 'new-project');
      assert.equal(summary.template, 'node-cli');
      assert.equal(summary.projectWrites, true);
      assert.equal(existsSync(summary.contextArtifactPath), true);
      assert.equal(existsSync(summary.scaffoldManifestArtifactPath), true);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it('routes new project prompts to the limited node-cli template preview', async () => {
    const root = await mkdtemp(join(tmpdir(), 'symphony-v8-new-prompt-'));

    try {
      const targetDir = join(root, 'node-demo');
      const output = createOutput();
      const exitCode = await runSymphonyCli({
        argv: [
          '--json',
          '创建一个新的 node cli 项目',
          '--dry-run',
          '--target',
          targetDir,
          '--runtime-dir',
          join(root, 'runtime'),
          '--state-dir',
          join(root, '.symphony')
        ],
        stdout: output.stdout,
        stderr: output.stderr
      });

      assert.equal(exitCode, 0);
      assert.equal(existsSync(targetDir), false);

      const summary = JSON.parse(output.stdoutText());

      assert.equal(summary.intent, 'new-project');
      assert.equal(summary.template, 'node-cli');
      assert.equal(summary.routeDecision.intent, 'new-project');
    } finally {
      await rm(root, { recursive: true, force: true });
    }
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
