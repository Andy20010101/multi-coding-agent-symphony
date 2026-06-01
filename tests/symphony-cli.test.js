import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync } from 'node:fs';
import { link, mkdir, mkdtemp, readFile, readdir, rm, symlink, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { promisify } from 'node:util';

import { taskPacketToTaskSpec } from '../src/integrations/harness-bridge.js';
import {
  buildSymphonyWorkTaskPacket,
  runSymphonyCli
} from '../scripts/symphony.js';
import { runMcasCli } from '../scripts/mcas.js';
import {
  buildConsoleReadiness,
  buildConsoleSnapshot,
  createSymphonyConsoleServer
} from '../src/symphony/console.js';
import {
  checkStageCharterConsistency,
  defaultStageCharter,
  renderStageCharterHtml
} from '../src/symphony/stage.js';
import {
  SAFE_ARTIFACT_PREVIEW_CONTRACT_NAME,
  validateSafeArtifactPreviewContract
} from '../src/symphony/safe-artifact-preview.js';
import {
  validateErrorEnvelopeContract
} from '../src/symphony/error-envelope.js';

const FAKE_SECRET_VALUE = ['deepseek', 'secret', 'value'].join('-');
const FAKE_OPENAI_TOKEN = ['sk', '123456789012345678901234'].join('-');
const FAKE_BEARER_TOKEN = ['abcdefghijkl', 'mnopqrstuvwx'].join('');
const V15_CONSOLE_CONTRACT_GENERATED_AT = '2026-05-27T00:00:00.000Z';
const V15_CONSOLE_CONTRACT_STAGE_ID = 'v14-stage-kernel-refactor';
const V15_CONSOLE_CONTRACT_MISSING_STAGE_ID = 'v15-missing-charter-fixture';
const V15_CONSOLE_CONTRACT_RUN_ID = 'v15-contract-run';
const V15_CONSOLE_CONTRACT_ADOPTION_ID = 'adopt-v15-contract';
const execFileAsync = promisify(execFile);

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

  it('preserves work --mode qa-swarm as the advanced legacy path', async () => {
    const root = await mkdtemp(join(tmpdir(), 'symphony-work-qa-swarm-'));

    try {
      const output = createOutput();
      const exitCode = await runSymphonyCli({
        argv: [
          'work',
          '--mode',
          'qa-swarm',
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

      assert.equal(summary.command, 'symphony work');
      assert.equal(summary.intent, undefined);
      assert.equal(summary.status, 'passed');
      assert.equal(summary.workflowMode, 'qa-swarm');
      assert.equal(summary.executionMode, 'dry-run');
      assert.equal(summary.verifierStatus, 'passed');
      assert.deepEqual(summary.changedFiles, []);
      assert.equal(existsSync(summary.taskPacketPath), true);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it('routes direct review and qa shortcuts through v8 product work summaries', async () => {
    const root = await mkdtemp(join(tmpdir(), 'symphony-shortcut-cli-'));

    try {
      await writeFixtureProject(root);

      for (const shortcut of ['review', 'qa']) {
        const output = createOutput();
        const exitCode = await runSymphonyCli({
          argv: [
            shortcut,
            '--project-dir',
            root,
            '--state-dir',
            join(root, '.symphony'),
            '--work-dir',
            join(root, `${shortcut}-work`),
            '--dry-run',
            '--json',
            'inspect README'
          ],
          stdout: output.stdout,
          stderr: output.stderr,
          runner: new MissingToolRunner()
        });

        assert.equal(exitCode, 0);
        assert.equal(output.stderrText(), '');

        const summary = JSON.parse(output.stdoutText());

        assert.equal(summary.command, `symphony ${shortcut}`);
        assert.equal(summary.intent, shortcut === 'review' ? 'review' : 'verify');
        assert.equal(summary.semanticCommand, shortcut === 'review' ? 'review' : 'verify');
        assert.equal(summary.workflowMode, 'qa-swarm');
        assert.equal(summary.projectWrites, false);
        assert.equal(summary.executionMode, 'dry-run');
        assert.equal(summary.verifierStatus, 'passed');
        assert.deepEqual(summary.changedFiles, []);
        assert.equal(existsSync(summary.contextArtifactPath), true);
        assert.equal(existsSync(summary.taskPacketPath), true);
      }
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it('persists qa shortcut proof metadata as verify semantic command', async () => {
    const root = await mkdtemp(join(tmpdir(), 'symphony-qa-proof-'));

    try {
      await writeFixtureProject(root);

      const stateDir = join(root, '.symphony');
      const scanOutput = createOutput();

      await runSymphonyCli({
        argv: [
          'scan',
          '--project-dir',
          root,
          '--state-dir',
          stateDir,
          '--output-dir',
          join(root, 'scan-out'),
          '--json'
        ],
        stdout: scanOutput.stdout,
        stderr: scanOutput.stderr,
        runner: new MissingToolRunner()
      });

      const output = createOutput();
      const exitCode = await runSymphonyCli({
        argv: [
          'qa',
          '--project-dir',
          root,
          '--state-dir',
          stateDir,
          '--work-dir',
          join(root, 'work'),
          '--proof-dir',
          join(root, 'proofs'),
          '--real',
          'codex',
          '--json',
          'inspect README'
        ],
        stdout: output.stdout,
        stderr: output.stderr,
        env: {
          MCAS_RUN_REAL_CODEX: '1'
        },
        mcasRunner: fakePassingHarnessRunner
      });

      assert.equal(exitCode, 0);
      assert.equal(output.stderrText(), '');

      const summary = JSON.parse(output.stdoutText());
      const proof = JSON.parse(await readFile(summary.proofArtifactPath, 'utf8'));

      assert.equal(summary.command, 'symphony qa');
      assert.equal(summary.intent, 'verify');
      assert.equal(summary.semanticCommand, 'verify');
      assert.equal(summary.executionMode, 'real');
      assert.equal(proof.summary.command, 'symphony qa');
      assert.equal(proof.summary.intent, 'verify');
      assert.equal(proof.summary.semanticCommand, 'verify');
      assert.deepEqual(proof.summary.pipeline, ['scan-if-needed', 'verify']);
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
          join(stateDir, 'scan-out'),
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
      assert.equal(scan.contractVersion, '1');
      assert.equal(scan.contractName, 'symphony.product-summary');
      assert.equal(scan.contract.stability, 'stable');
      assert.equal(scan.identity.runId, scan.runId);
      assert.equal(scan.safety.mode, 'read-only');
      assert.deepEqual(scan.artifactRefs.map((artifact) => artifact.kind), ['context', 'summary']);
      assert.equal(scan.action.next, scan.nextAction);
      assert.equal(scan.intent, 'scan-project');
      assert.equal(scan.safetyMode, 'read-only');
      assert.equal(scan.projectWrites, false);
      assert.equal(scan.runtimeWrites, true);
      assert.equal(scan.externalCalls, false);
      assert.equal(scan.modelInvocation, false);
      assert.equal(scan.providerMode, 'auto');
      assert.deepEqual(scan.providerAttempts, [
        {
          provider: 'grill-me-docs',
          runId: scan.runId.replace(/-builtin$/u, ''),
          status: 'unavailable',
          exitCode: 0
        },
        {
          provider: 'builtin',
          runId: scan.runId,
          status: 'builtin',
          exitCode: 0
        }
      ]);
      assert.deepEqual(scan.providerFallback, {
        from: 'grill-me-docs',
        to: 'builtin',
        reason: 'unavailable'
      });
      assert.equal(scan.provider, 'builtin');
      assert.equal(scan.providerStatus, 'builtin');
      assert.equal(existsSync(scan.contextArtifactPath), true);
      assert.equal(existsSync(join(stateDir, 'context', 'latest.json')), true);
      assert.equal(existsSync(join(stateDir, 'runs', 'latest.json')), true);
      assert.equal(existsSync(join(stateDir, 'runs', `${scan.runId}.json`)), true);

      const persistedRun = JSON.parse(await readFile(join(stateDir, 'runs', `${scan.runId}.json`), 'utf8'));

      assert.equal(persistedRun.contractName, 'symphony.run-state');
      assert.equal(persistedRun.identity.runId, scan.runId);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it('keeps builtin scan mode builtin-only with provider metadata', async () => {
    const root = await mkdtemp(join(tmpdir(), 'symphony-v8-scan-builtin-'));

    try {
      await writeFixtureProject(root);

      const output = createOutput();
      const exitCode = await runSymphonyCli({
        argv: [
          'scan',
          '--builtin',
          '--project-dir',
          root,
          '--output-dir',
          join(root, 'scan-out'),
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

      const scan = JSON.parse(output.stdoutText());

      assert.equal(scan.providerMode, 'builtin');
      assert.deepEqual(scan.providerAttempts, [{
        provider: 'builtin',
        runId: scan.runId,
        status: 'builtin',
        exitCode: 0
      }]);
      assert.equal(scan.providerFallback, null);
      assert.equal(scan.provider, 'builtin');
      assert.equal(scan.providerStatus, 'builtin');
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it('fails require-grill scan mode when grill-me-docs is missing', async () => {
    const root = await mkdtemp(join(tmpdir(), 'symphony-v8-scan-require-grill-'));

    try {
      await writeFixtureProject(root);

      const output = createOutput();
      const exitCode = await runSymphonyCli({
        argv: [
          'scan',
          '--require-grill',
          '--project-dir',
          root,
          '--output-dir',
          join(root, 'scan-out'),
          '--state-dir',
          join(root, '.symphony'),
          '--json'
        ],
        stdout: output.stdout,
        stderr: output.stderr,
        runner: new MissingToolRunner()
      });

      assert.equal(exitCode, 64);
      assert.equal(output.stdoutText(), '');
      assert.match(JSON.parse(output.stderrText()).message, /provider is unavailable: grill-me-docs/u);
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

  it('keeps repeated product do dry-runs from colliding in state or runtime paths', async () => {
    const root = await mkdtemp(join(tmpdir(), 'symphony-v8-work-runid-'));

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

      const summaries = [];

      for (let index = 0; index < 2; index += 1) {
        const output = createOutput();
        const exitCode = await runSymphonyCli({
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
          stdout: output.stdout,
          stderr: output.stderr
        });

        assert.equal(exitCode, 0);
        assert.equal(output.stderrText(), '');
        summaries.push(JSON.parse(output.stdoutText()));
      }

      assert.notEqual(summaries[0].runId, summaries[1].runId);
      assert.notEqual(summaries[0].taskPacketPath, summaries[1].taskPacketPath);
      assert.notEqual(summaries[0].harnessOutputPath, summaries[1].harnessOutputPath);
      assert.equal(existsSync(join(stateDir, 'runs', `${summaries[0].runId}.json`)), true);
      assert.equal(existsSync(join(stateDir, 'runs', `${summaries[1].runId}.json`)), true);
      assert.equal(JSON.parse(await readFile(join(stateDir, 'runs', 'latest.json'), 'utf8')).runId, summaries[1].runId);
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

  it('plans v11 controlled write execution without starting adapters', async () => {
    const root = await mkdtemp(join(tmpdir(), 'symphony-v11-plan-'));

    try {
      await writeFixtureProject(root);

      const stateDir = join(root, 'state dir');
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

      const planOutput = createOutput();
      const blockedMcasRunner = async () => {
        throw new Error('planning must not invoke the kernel workflow');
      };
      const exitCode = await runSymphonyCli({
        argv: [
          'do',
          '--project-dir',
          root,
          '--state-dir',
          stateDir,
          '--work-dir',
          join(root, 'work'),
          '--write',
          '--json',
          'inspect README'
        ],
        stdout: planOutput.stdout,
        stderr: planOutput.stderr,
        mcasRunner: blockedMcasRunner
      });

      assert.equal(exitCode, 0);
      assert.equal(planOutput.stderrText(), '');

      const planned = JSON.parse(planOutput.stdoutText());

      assert.equal(planned.status, 'planned');
      assert.equal(planned.verifierStatus, 'not-run');
      assert.equal(planned.safetyMode, 'write');
      assert.equal(planned.projectWrites, true);
      assert.equal(planned.mainWorktreeWrites, false);
      assert.equal(planned.workspaceWrites, true);
      assert.equal(planned.writeBoundary, 'isolated-workspace');
      assert.equal(planned.executionPlanId, planned.runId);
      assert.match(planned.nextAction, new RegExp(`symphony do --confirm-plan ${planned.executionPlanId}`, 'u'));
      assert.equal(planned.nextAction.includes(`--state-dir '${stateDir}'`), true);
      assert.equal(existsSync(planned.executionPlanArtifactPath), true);
      assert.equal(await readFile(join(root, 'README.md'), 'utf8'), '# Fixture\n');

      const plan = JSON.parse(await readFile(planned.executionPlanArtifactPath, 'utf8'));

      assert.equal(plan.contractName, 'symphony.execution-plan');
      assert.equal(plan.planId, planned.executionPlanId);
      assert.equal(plan.prompt, 'inspect README');
      assert.equal(plan.projectRoot, root);
      assert.equal(plan.mainWorktreeWrites, false);
      assert.equal(plan.workspaceWrites, true);
      assert.equal(plan.confirmationCommand, planned.nextAction);

      const statusOutput = createOutput();

      await runSymphonyCli({
        argv: ['status', '--state-dir', stateDir, '--json'],
        stdout: statusOutput.stdout,
        stderr: statusOutput.stderr
      });

      const status = JSON.parse(statusOutput.stdoutText());

      assert.equal(status.status, 'planned');
      assert.equal(status.executionPlanId, planned.executionPlanId);
      assert.equal(status.executionPlanArtifactPath, planned.executionPlanArtifactPath);

      const diagnoseOutput = createOutput();
      const diagnoseExitCode = await runSymphonyCli({
        argv: ['diagnose', '--state-dir', stateDir, '--json'],
        stdout: diagnoseOutput.stdout,
        stderr: diagnoseOutput.stderr,
        runner: new DiagnosticReadinessRunner(),
        env: { HOME: root }
      });

      assert.equal(diagnoseExitCode, 0);
      assert.equal(diagnoseOutput.stderrText(), '');

      const diagnostics = JSON.parse(diagnoseOutput.stdoutText());

      assert.equal(diagnostics.snapshot.latestRun.status, 'planned');
      assert.equal(diagnostics.snapshot.latestRun.executionPlanId, planned.executionPlanId);
      assert.equal(
        diagnostics.snapshot.latestRun.artifactRefs.some((artifact) => artifact.kind === 'execution-plan'),
        true
      );

      const humanOutput = createOutput();

      await runSymphonyCli({
        argv: [
          'do',
          '--project-dir',
          root,
          '--state-dir',
          stateDir,
          '--work-dir',
          join(root, 'work-human'),
          '--write',
          'inspect README'
        ],
        stdout: humanOutput.stdout,
        stderr: humanOutput.stderr,
        mcasRunner: blockedMcasRunner
      });

      assert.match(humanOutput.stdoutText(), /Status: planned/u);
      assert.match(humanOutput.stdoutText(), /Execution plan:/u);
      assert.match(humanOutput.stdoutText(), /Next: symphony do --confirm-plan/u);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it('confirms v11 execution plans through the frozen plan', async () => {
    const root = await mkdtemp(join(tmpdir(), 'symphony-v11-confirm-'));

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

      const planOutput = createOutput();

      await runSymphonyCli({
        argv: [
          'do',
          '--project-dir',
          root,
          '--state-dir',
          stateDir,
          '--work-dir',
          join(root, 'work'),
          '--write',
          '--json',
          'inspect README'
        ],
        stdout: planOutput.stdout,
        stderr: planOutput.stderr,
        mcasRunner: async () => {
          throw new Error('planning must not invoke the kernel workflow');
        }
      });

      const planned = JSON.parse(planOutput.stdoutText());
      const confirmOutput = createOutput();
      const harnessCalls = [];
      const exitCode = await runSymphonyCli({
        argv: [
          'do',
          '--state-dir',
          stateDir,
          '--confirm-plan',
          planned.executionPlanId,
          '--json'
        ],
        stdout: confirmOutput.stdout,
        stderr: confirmOutput.stderr,
        mcasRunner: async (invocation) => fakeControlledHarnessRunner(invocation, harnessCalls)
      });

      assert.equal(exitCode, 0);
      assert.equal(confirmOutput.stderrText(), '');
      assert.equal(harnessCalls.length, 1);
      assert.equal(harnessCalls[0].includes('--materialize-workspaces'), true);
      assert.equal(harnessCalls[0].includes('--real'), false);

      const confirmed = JSON.parse(confirmOutput.stdoutText());

      assert.equal(confirmed.status, 'passed');
      assert.equal(confirmed.plannedRunId, planned.executionPlanId);
      assert.equal(confirmed.executionPlanId, planned.executionPlanId);
      assert.equal(confirmed.executionPlanArtifactPath, planned.executionPlanArtifactPath);
      assert.equal(confirmed.safetyMode, 'write');
      assert.equal(confirmed.projectWrites, true);
      assert.equal(confirmed.mainWorktreeWrites, false);
      assert.equal(confirmed.workspaceWrites, true);
      assert.equal(confirmed.externalCalls, false);
      assert.equal(existsSync(confirmed.evidenceArtifactPath), true);
      assert.equal(await readFile(join(root, 'README.md'), 'utf8'), '# Fixture\n');

      const snapshotOutput = createOutput();

      await runSymphonyCli({
        argv: ['console', '--snapshot', '--state-dir', stateDir, '--json'],
        stdout: snapshotOutput.stdout,
        stderr: snapshotOutput.stderr
      });

      const snapshot = JSON.parse(snapshotOutput.stdoutText());

      assert.equal(snapshot.latestRun.executionPlanId, planned.executionPlanId);
      assert.equal(snapshot.latestRun.artifactRefs.some((artifact) => artifact.kind === 'execution-plan'), true);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it('rejects invalid, stale, and ungated v11 plan confirmations before adapters start', async () => {
    const root = await mkdtemp(join(tmpdir(), 'symphony-v11-confirm-reject-'));

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

      const planOutput = createOutput();

      await runSymphonyCli({
        argv: [
          'do',
          '--project-dir',
          root,
          '--state-dir',
          stateDir,
          '--write',
          '--real',
          'codex',
          '--json',
          'inspect README'
        ],
        stdout: planOutput.stdout,
        stderr: planOutput.stderr,
        mcasRunner: async () => {
          throw new Error('planning must not invoke the kernel workflow');
        }
      });

      const planned = JSON.parse(planOutput.stdoutText());

      assert.equal(planned.status, 'planned');
      assert.equal(planned.externalCalls, true);
      assert.equal(planned.requiresGate, 'MCAS_RUN_REAL_CODEX');

      const calls = [];
      const blockedMcasRunner = async (invocation) => {
        calls.push(invocation.argv);
        throw new Error('confirmation should fail before the kernel workflow');
      };

      for (const argv of [
        ['do', '--state-dir', stateDir, '--confirm-plan', '../bad', '--json'],
        ['do', '--state-dir', stateDir, '--confirm-plan', 'missing-plan', '--json'],
        ['do', '--state-dir', stateDir, '--confirm-plan', planned.executionPlanId, '--json', 'inspect README']
      ]) {
        const output = createOutput();
        const exitCode = await runSymphonyCli({
          argv,
          stdout: output.stdout,
          stderr: output.stderr,
          mcasRunner: blockedMcasRunner,
          env: {}
        });

        assert.equal(exitCode, 64);
        assert.match(JSON.parse(output.stderrText()).message, /plan|confirm/u);
      }

      const ungatedOutput = createOutput();
      const ungatedExitCode = await runSymphonyCli({
        argv: ['do', '--state-dir', stateDir, '--confirm-plan', planned.executionPlanId, '--json'],
        stdout: ungatedOutput.stdout,
        stderr: ungatedOutput.stderr,
        mcasRunner: blockedMcasRunner,
        env: {}
      });

      assert.equal(ungatedExitCode, 64);
      assert.match(JSON.parse(ungatedOutput.stderrText()).message, /MCAS_RUN_REAL_CODEX/u);

      const tamperedPlan = JSON.parse(await readFile(planned.executionPlanArtifactPath, 'utf8'));

      tamperedPlan.externalCalls = false;
      tamperedPlan.requiresGate = null;
      tamperedPlan.workspaceWrites = false;
      await writeFile(planned.executionPlanArtifactPath, `${JSON.stringify(tamperedPlan, null, 2)}\n`, 'utf8');

      const tamperedOutput = createOutput();
      const tamperedExitCode = await runSymphonyCli({
        argv: ['do', '--state-dir', stateDir, '--confirm-plan', planned.executionPlanId, '--json'],
        stdout: tamperedOutput.stdout,
        stderr: tamperedOutput.stderr,
        mcasRunner: blockedMcasRunner,
        env: { MCAS_RUN_REAL_CODEX: '1' }
      });

      assert.equal(tamperedExitCode, 64);
      assert.match(JSON.parse(tamperedOutput.stderrText()).message, /execution plan/u);

      const dryPlanOutput = createOutput();

      await runSymphonyCli({
        argv: [
          'do',
          '--project-dir',
          root,
          '--state-dir',
          stateDir,
          '--write',
          '--json',
          'inspect README'
        ],
        stdout: dryPlanOutput.stdout,
        stderr: dryPlanOutput.stderr,
        mcasRunner: async () => {
          throw new Error('planning must not invoke the kernel workflow');
        }
      });

      const dryPlan = JSON.parse(dryPlanOutput.stdoutText());

      await writeFile(join(root, 'tests', 'fixture.test.js'), 'export const ok = false;\n', 'utf8');

      const staleOutput = createOutput();
      const staleExitCode = await runSymphonyCli({
        argv: ['do', '--state-dir', stateDir, '--confirm-plan', dryPlan.executionPlanId, '--json'],
        stdout: staleOutput.stdout,
        stderr: staleOutput.stderr,
        mcasRunner: blockedMcasRunner,
        env: {}
      });

      assert.equal(staleExitCode, 64);
      assert.match(JSON.parse(staleOutput.stderrText()).message, /stale|fingerprint/u);
      assert.deepEqual(calls, []);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it('plans and confirms v12 verified adoption from a passed isolated workspace run', async () => {
    const root = await mkdtemp(join(tmpdir(), 'symphony-v12-adopt-'));
    let server;

    try {
      await writeFixtureProject(root);
      await initFixtureGit(root);

      const stateDir = join(root, 'state dir');
      const stageOutput = createOutput();

      await runSymphonyCli({
        argv: [
          'stage',
          'activate',
          'v14-stage-kernel-refactor',
          '--state-dir',
          stateDir,
          '--json'
        ],
        stdout: stageOutput.stdout,
        stderr: stageOutput.stderr
      });

      const sourceRun = await createConfirmedAdoptionSourceRun({
        root,
        stateDir,
        workspaceText: '# Fixture\n\nAdopted v12 change.\n'
      });

      assert.equal(await readFile(join(root, 'README.md'), 'utf8'), '# Fixture\n');
      assert.equal(existsSync(sourceRun.sourceWorkspaceManifestPath), true);

      const planOutput = createOutput();
      const exitCode = await runSymphonyCli({
        argv: [
          'adopt',
          '--run',
          sourceRun.runId,
          '--state-dir',
          stateDir,
          '--json'
        ],
        stdout: planOutput.stdout,
        stderr: planOutput.stderr,
        mcasRunner: async () => {
          throw new Error('adoption planning must not invoke the kernel');
        }
      });

      assert.equal(exitCode, 0);
      assert.equal(planOutput.stderrText(), '');

      const planned = JSON.parse(planOutput.stdoutText());

      assert.equal(planned.command, 'symphony adopt');
      assert.equal(planned.status, 'adoption-planned');
      assert.equal(planned.verifierStatus, 'not-run');
      assert.equal(planned.sourceRunId, sourceRun.runId);
      assert.equal(planned.executionPlanId, sourceRun.executionPlanId);
      assert.equal(planned.mainWorktreeWrites, false);
      assert.equal(planned.workspaceWrites, false);
      assert.deepEqual(planned.changedFiles, ['README.md']);
      assert.deepEqual(planned.fileOperations.map((operation) => operation.operation), ['modify']);
      assert.equal(existsSync(planned.adoptionPlanArtifactPath), true);
      assert.equal(existsSync(planned.patchArtifactPath), true);
      assert.equal(planned.nextAction, planned.confirmationCommand);
      assert.equal(planned.stageAdoptionSummary.behavior, 'summary-only');
      assert.equal(planned.stageAdoptionSummary.v12ApplyLogicChanged, false);
      assert.equal(
        planned.confirmationCommand,
        `symphony adopt --confirm ${planned.adoptionPlanId} --state-dir '${stateDir}'`
      );
      assert.equal(await readFile(join(root, 'README.md'), 'utf8'), '# Fixture\n');

      const adoptionPlan = JSON.parse(await readFile(planned.adoptionPlanArtifactPath, 'utf8'));
      const patch = await readFile(planned.patchArtifactPath, 'utf8');

      assert.equal(adoptionPlan.contractName, 'symphony.adoption-plan');
      assert.equal(adoptionPlan.contractVersion, '1');
      assert.equal(adoptionPlan.mainWorktreeWrites, true);
      assert.equal(adoptionPlan.patchHash, planned.patchHash);
      assert.equal(patch.includes('+Adopted v12 change.'), true);

      const snapshotOutput = createOutput();

      await runSymphonyCli({
        argv: ['console', '--snapshot', '--state-dir', stateDir, '--json'],
        stdout: snapshotOutput.stdout,
        stderr: snapshotOutput.stderr
      });

      const snapshot = JSON.parse(snapshotOutput.stdoutText());

      assert.equal(snapshot.latestRun.adoptionPlanId, planned.adoptionPlanId);
      assert.equal(snapshot.latestRun.artifactRefs.some((artifact) => artifact.kind === 'adoption-plan'), true);
      assert.equal(snapshot.latestRun.artifactRefs.some((artifact) => artifact.kind === 'adoption-patch'), true);
      assert.equal(snapshot.adoptionPlans.some((plan) => plan.adoptionPlanId === planned.adoptionPlanId), true);
      assert.equal(snapshot.adoptionSummary.status, 'pending');
      assert.equal(snapshot.adoptionSummary.pendingCount, 1);
      assert.equal(['attention', 'blocked'].includes(snapshot.overview.status), true);
      assert.equal(snapshot.overview.topRisks.length <= 3, true);
      assert.equal(snapshot.overview.topRisks.some((risk) => risk.category === 'pending_adoption'), true);

      const diagnoseOutput = createOutput();

      await runSymphonyCli({
        argv: ['diagnose', '--state-dir', stateDir, '--json'],
        stdout: diagnoseOutput.stdout,
        stderr: diagnoseOutput.stderr,
        runner: new DiagnosticReadinessRunner(),
        env: { HOME: root }
      });

      const diagnostics = JSON.parse(diagnoseOutput.stdoutText());

      assert.equal(diagnostics.snapshot.adoptionSummary.status, 'dirty-blocked');
      assert.equal(diagnostics.snapshot.adoptionSummary.dirtyBlocked, true);
      assert.equal(diagnostics.snapshot.overview.status, 'blocked');
      assert.equal(diagnostics.snapshot.overview.nextAction, 'git status --short');
      assert.equal(diagnostics.risks.items.some((risk) => risk.category === 'pending_adoption'), true);
      assert.equal(diagnostics.risks.items.some((risk) => risk.category === 'dirty_worktree_blocks_adoption'), true);
      assert.equal(diagnostics.risks.items.some((risk) => risk.category === 'adoption_dirty_file_details'), true);
      assert.deepEqual(
        diagnostics.risks.items.find((risk) => risk.category === 'adoption_dirty_file_details').dirtyPaths,
        ['README.md', 'tmp.txt']
      );

      server = createSymphonyConsoleServer({ stateDir });
      const baseUrl = await listenOnRandomPort(server);
      const patchPreviewResponse = await fetch(`${baseUrl}/api/runs/latest/artifacts/adoption-patch`);

      assert.equal(patchPreviewResponse.status, 200);

      const patchPreview = await patchPreviewResponse.json();

      assert.equal(patchPreview.artifact.kind, 'adoption-patch');
      assert.equal(patchPreview.artifact.truncated, false);
      assert.equal(patchPreview.artifact.content.includes('Adopted v12 change.'), true);

      await closeServer(server);
      server = undefined;

      let observedApplyingState = false;
      const preApplyRunner = new PreApplyInspectingGitRunner({
        stateDir,
        adoptionId: planned.adoptionPlanId,
        onBeforeApply: async () => {
          const applyingRun = JSON.parse(await readFile(join(stateDir, 'runs', 'latest.json'), 'utf8'));
          const journalPath = join(stateDir, 'adoptions', `${planned.adoptionPlanId}-journal.json`);
          const journal = JSON.parse(await readFile(journalPath, 'utf8'));

          observedApplyingState = true;
          assert.equal(applyingRun.status, 'applying');
          assert.equal(applyingRun.mainWorktreeWrites, false);
          assert.equal(applyingRun.adoptionJournalArtifactPath, journalPath);
          assert.equal(applyingRun.artifactRefs.some((artifact) => artifact.kind === 'adoption-journal'), true);
          assert.equal(journal.kind, 'symphony.adoption-journal');
          assert.equal(journal.contractVersion, '1');
          assert.equal(journal.status, 'applying');
          assert.equal(journal.adoptionPlanId, planned.adoptionPlanId);
          assert.equal(journal.confirmationRunId, applyingRun.runId);
          assert.equal(journal.patchHash, planned.patchHash);
          assert.deepEqual(journal.changedFiles, ['README.md']);
          assert.deepEqual(journal.beforeFiles, [{
            path: 'README.md',
            exists: true,
            hash: planned.fileOperations[0].beforeHash,
            size: Buffer.byteLength('# Fixture\n'),
            textEncoding: 'utf8'
          }]);

          const applyingSnapshot = await buildConsoleSnapshot({ stateDir });

          assert.equal(applyingSnapshot.adoptionSummary.status, 'applying');
          assert.equal(applyingSnapshot.adoptionSummary.applyingCount, 1);
        }
      });
      const confirmOutput = createOutput();
      const confirmExitCode = await runSymphonyCli({
        argv: [
          'adopt',
          '--confirm',
          planned.adoptionPlanId,
          '--state-dir',
          stateDir,
          '--json'
        ],
        stdout: confirmOutput.stdout,
        stderr: confirmOutput.stderr,
        runner: preApplyRunner,
        mcasRunner: async () => {
          throw new Error('adoption confirmation must not invoke the kernel');
        }
      });

      assert.equal(confirmExitCode, 0);
      assert.equal(confirmOutput.stderrText(), '');
      assert.equal(observedApplyingState, true);

      const confirmed = JSON.parse(confirmOutput.stdoutText());

      assert.equal(confirmed.status, 'passed');
      assert.equal(confirmed.verifierStatus, 'passed');
      assert.equal(confirmed.adoptionPlanId, planned.adoptionPlanId);
      assert.equal(confirmed.plannedAdoptionRunId, planned.runId);
      assert.equal(confirmed.mainWorktreeWrites, true);
      assert.equal(confirmed.workspaceWrites, false);
      assert.deepEqual(confirmed.changedFiles, ['README.md']);
      assert.equal(existsSync(confirmed.evidenceArtifactPath), true);
      assert.equal(existsSync(confirmed.adoptionJournalArtifactPath), true);
      assert.equal(confirmed.artifactRefs.some((artifact) => artifact.kind === 'adoption-journal'), true);
      assert.equal(confirmed.stageAdoptionSummary.v12ApplyLogicChanged, false);
      assert.equal(await readFile(join(root, 'README.md'), 'utf8'), '# Fixture\n\nAdopted v12 change.\n');

      const finalRunState = JSON.parse(await readFile(join(stateDir, 'runs', 'latest.json'), 'utf8'));
      const finalJournal = JSON.parse(await readFile(confirmed.adoptionJournalArtifactPath, 'utf8'));

      assert.equal(finalRunState.status, 'passed');
      assert.equal(finalRunState.mainWorktreeWrites, true);
      assert.equal(finalRunState.adoptionJournalArtifactPath, confirmed.adoptionJournalArtifactPath);
      assert.equal(finalRunState.artifactRefs.some((artifact) => artifact.kind === 'adoption-journal'), true);
      assert.equal(finalJournal.status, 'applied');

      const beforeInspectSnapshot = await snapshotDirectoryFiles(stateDir);
      const inspectOutput = createOutput();
      const inspectExitCode = await runSymphonyCli({
        argv: ['adopt', '--inspect', planned.adoptionPlanId, '--state-dir', stateDir, '--json'],
        stdout: inspectOutput.stdout,
        stderr: inspectOutput.stderr
      });
      const afterInspectSnapshot = await snapshotDirectoryFiles(stateDir);
      const inspection = JSON.parse(inspectOutput.stdoutText());

      assert.equal(inspectExitCode, 0);
      assert.equal(inspectOutput.stderrText(), '');
      assert.deepEqual(afterInspectSnapshot, beforeInspectSnapshot);
      assert.equal(inspection.status, 'inspected');
      assert.equal(inspection.safety.runtimeWrites, false);
      assert.equal(inspection.adoptionPlanRefs.patchArtifactPath, planned.patchArtifactPath);
      assert.equal(inspection.journalRef.path, confirmed.adoptionJournalArtifactPath);
      assert.equal(inspection.sourceRun.runId, sourceRun.runId);
      assert.equal(inspection.latestConfirmationRun.status, 'passed');
      assert.equal(inspection.currentWorktreeMatchesAfterHash, true);
      assert.equal(inspection.currentWorktreeMatchesJournalBeforeFiles, false);
      assert.equal(inspection.currentWorktreeMatchesAfterHashDetails.files[0].matches, true);
      assert.equal(inspection.currentWorktreeMatchesJournalBeforeFilesDetails.files[0].matches, false);

      const beforeApiInspectSnapshot = await snapshotDirectoryFiles(stateDir);

      server = createSymphonyConsoleServer({ stateDir });
      const inspectBaseUrl = await listenOnRandomPort(server);
      const apiInspectResponse = await fetch(`${inspectBaseUrl}/api/adoptions/${encodeURIComponent(planned.adoptionPlanId)}/inspect`);
      const unsafeInspectResponse = await fetch(`${inspectBaseUrl}/api/adoptions/${encodeURIComponent('../bad')}/inspect`);
      const afterApiInspectSnapshot = await snapshotDirectoryFiles(stateDir);

      assert.equal(apiInspectResponse.status, 200);
      const apiInspection = await apiInspectResponse.json();

      assert.deepEqual(afterApiInspectSnapshot, beforeApiInspectSnapshot);
      assert.equal(apiInspection.contractName, 'symphony.console-adoption-inspect');
      assert.equal(apiInspection.adoptionPlanId, planned.adoptionPlanId);
      assert.equal(apiInspection.journalRef.path, confirmed.adoptionJournalArtifactPath);
      assert.equal(apiInspection.latestConfirmationRun.status, 'passed');
      assert.equal(apiInspection.currentWorktreeMatchesAfterHash, inspection.currentWorktreeMatchesAfterHash);
      assert.equal(apiInspection.currentWorktreeMatchesJournalBeforeFiles, inspection.currentWorktreeMatchesJournalBeforeFiles);
      assert.equal(apiInspection.recommendedCommands.every((command) => command.mode === 'copy-only'), true);
      assert.equal(unsafeInspectResponse.status, 400);

      await closeServer(server);
      server = undefined;
    } finally {
      if (server !== undefined) {
        await closeServer(server);
      }

      await rm(root, { recursive: true, force: true });
    }
  });

  it('records post-apply adoption evidence failures without rolling back the main worktree', async () => {
    const root = await mkdtemp(join(tmpdir(), 'symphony-v12-adopt-post-apply-fail-'));

    try {
      await writeFixtureProject(root);
      await initFixtureGit(root);

      const stateDir = join(root, '.symphony');
      const sourceRun = await createConfirmedAdoptionSourceRun({
        root,
        stateDir,
        workspaceText: '# Fixture\n\nPost apply failure.\n'
      });
      const planOutput = createOutput();

      await runSymphonyCli({
        argv: ['adopt', '--run', sourceRun.runId, '--state-dir', stateDir, '--json'],
        stdout: planOutput.stdout,
        stderr: planOutput.stderr
      });

      const planned = JSON.parse(planOutput.stdoutText());
      const adoptionPlan = JSON.parse(await readFile(planned.adoptionPlanArtifactPath, 'utf8'));

      adoptionPlan.fileOperations[0].afterHash = 'sha256:not-the-real-post-apply-hash';
      await writeFile(planned.adoptionPlanArtifactPath, `${JSON.stringify(adoptionPlan, null, 2)}\n`, 'utf8');

      const confirmOutput = createOutput();
      const confirmExitCode = await runSymphonyCli({
        argv: ['adopt', '--confirm', planned.adoptionPlanId, '--state-dir', stateDir, '--json'],
        stdout: confirmOutput.stdout,
        stderr: confirmOutput.stderr
      });

      assert.equal(confirmExitCode, 64);
      assert.match(JSON.parse(confirmOutput.stderrText()).message, /post-apply file hash mismatch/u);
      assert.equal(await readFile(join(root, 'README.md'), 'utf8'), '# Fixture\n\nPost apply failure.\n');

      const failedRun = JSON.parse(await readFile(join(stateDir, 'runs', 'latest.json'), 'utf8'));
      const journalPath = join(stateDir, 'adoptions', `${planned.adoptionPlanId}-journal.json`);
      const journal = JSON.parse(await readFile(journalPath, 'utf8'));
      const snapshot = await buildConsoleSnapshot({ stateDir });

      assert.equal(failedRun.status, 'failed');
      assert.equal(failedRun.mainWorktreeWrites, true);
      assert.equal(failedRun.failurePhase, 'post-apply-evidence');
      assert.equal(failedRun.adoptionJournalArtifactPath, journalPath);
      assert.equal(failedRun.nextAction, 'symphony status');
      assert.equal(failedRun.artifactRefs.some((artifact) => artifact.kind === 'adoption-journal'), true);
      assert.equal(journal.status, 'applying');
      assert.equal(snapshot.adoptionSummary.status, 'post-apply-failed');
      assert.equal(snapshot.adoptionSummary.postApplyFailedCount, 1);

      const diagnoseOutput = createOutput();

      await runSymphonyCli({
        argv: ['diagnose', '--state-dir', stateDir, '--json'],
        stdout: diagnoseOutput.stdout,
        stderr: diagnoseOutput.stderr,
        runner: new DiagnosticReadinessRunner(),
        env: { HOME: root }
      });

      const diagnostics = JSON.parse(diagnoseOutput.stdoutText());

      assert.equal(diagnostics.risks.items.some((risk) => risk.category === 'adoption_post_apply_failed'), true);
      assert.equal(diagnostics.risks.items.some((risk) => risk.category === 'adoption_apply_in_progress'), true);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it('rejects v12 adoption modes and pre-write drift without touching the main worktree', async () => {
    const root = await mkdtemp(join(tmpdir(), 'symphony-v12-adopt-reject-'));

    try {
      await writeFixtureProject(root);
      await initFixtureGit(root);

      const stateDir = join(root, '.symphony');
      const sourceRun = await createConfirmedAdoptionSourceRun({
        root,
        stateDir,
        workspaceText: '# Fixture\n\nFrozen patch.\n'
      });
      const planOutput = createOutput();

      await runSymphonyCli({
        argv: ['adopt', '--run', sourceRun.runId, '--state-dir', stateDir, '--json'],
        stdout: planOutput.stdout,
        stderr: planOutput.stderr
      });

      const planned = JSON.parse(planOutput.stdoutText());

      for (const argv of [
        ['adopt', '--run', sourceRun.runId, '--confirm', planned.adoptionPlanId, '--state-dir', stateDir, '--json'],
        ['adopt', '--confirm', planned.adoptionPlanId, '--state-dir', stateDir, '--write', '--json'],
        ['adopt', '--confirm', planned.adoptionPlanId, '--state-dir', stateDir, '--json', 'apply it'],
        ['adopt', '--inspect', planned.adoptionPlanId, '--state-dir', stateDir, '--write', '--json'],
        ['adopt', '--inspect', planned.adoptionPlanId, '--state-dir', stateDir, '--json', 'apply it'],
        ['adopt', '--inspect', planned.adoptionPlanId, '--confirm', planned.adoptionPlanId, '--state-dir', stateDir, '--json'],
        ['adopt', '--inspect', planned.adoptionPlanId, '--state-dir', stateDir]
      ]) {
        const output = createOutput();
        const exitCode = await runSymphonyCli({
          argv,
          stdout: output.stdout,
          stderr: output.stderr
        });

        assert.equal(exitCode, 64);
        assert.match(JSON.parse(output.stderrText()).message, /adopt|confirm|argument|option/u);
      }

      await writeFile(planned.patchArtifactPath, 'tampered\n', 'utf8');

      const tamperedOutput = createOutput();
      const tamperedExitCode = await runSymphonyCli({
        argv: ['adopt', '--confirm', planned.adoptionPlanId, '--state-dir', stateDir, '--json'],
        stdout: tamperedOutput.stdout,
        stderr: tamperedOutput.stderr
      });

      assert.equal(tamperedExitCode, 64);
      assert.match(JSON.parse(tamperedOutput.stderrText()).message, /patch|hash/u);
      assert.equal(await readFile(join(root, 'README.md'), 'utf8'), '# Fixture\n');
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it('rejects v12 adoption planning for legacy, dirty, and unsupported source workspaces', async () => {
    const root = await mkdtemp(join(tmpdir(), 'symphony-v12-adopt-source-reject-'));
    let unsupportedRoot;

    try {
      await writeFixtureProject(root);
      await initFixtureGit(root);

      const stateDir = join(root, '.symphony');
      const legacySourceRun = await createConfirmedLegacySourceRun({ root, stateDir });
      const legacyOutput = createOutput();
      const legacyExitCode = await runSymphonyCli({
        argv: ['adopt', '--run', legacySourceRun.runId, '--state-dir', stateDir, '--json'],
        stdout: legacyOutput.stdout,
        stderr: legacyOutput.stderr
      });

      assert.equal(legacyExitCode, 64);
      assert.match(JSON.parse(legacyOutput.stderrText()).message, /workspace-ref/u);

      const sourceRun = await createConfirmedAdoptionSourceRun({
        root,
        stateDir,
        workspaceText: '# Fixture\n\nUnsupported check.\n'
      });

      await writeFile(join(root, 'tests', 'fixture.test.js'), 'export const ok = false;\n', 'utf8');

      const dirtyOutput = createOutput();
      const dirtyExitCode = await runSymphonyCli({
        argv: ['adopt', '--run', sourceRun.runId, '--state-dir', stateDir, '--json'],
        stdout: dirtyOutput.stdout,
        stderr: dirtyOutput.stderr
      });

      assert.equal(dirtyExitCode, 64);
      assert.match(JSON.parse(dirtyOutput.stderrText()).message, /dirty worktree/u);

      unsupportedRoot = await mkdtemp(join(tmpdir(), 'symphony-v12-adopt-unsupported-'));
      await writeFixtureProject(unsupportedRoot);
      await initFixtureGit(unsupportedRoot);

      const unsupportedStateDir = join(unsupportedRoot, '.symphony');
      const unsupportedSourceRun = await createConfirmedAdoptionSourceRun({
        root: unsupportedRoot,
        stateDir: unsupportedStateDir,
        workspaceText: '# Fixture\n\nUnsupported check.\n'
      });

      await writeFile(join(unsupportedSourceRun.sourceWorkspacePath, 'README.md'), Buffer.from([0, 1, 2]));

      const binaryOutput = createOutput();
      const binaryExitCode = await runSymphonyCli({
        argv: ['adopt', '--run', unsupportedSourceRun.runId, '--state-dir', unsupportedStateDir, '--json'],
        stdout: binaryOutput.stdout,
        stderr: binaryOutput.stderr
      });

      assert.equal(binaryExitCode, 64);
      assert.match(JSON.parse(binaryOutput.stderrText()).message, /unsupported adoption changes/u);

      const latestRun = JSON.parse(await readFile(join(unsupportedStateDir, 'runs', 'latest.json'), 'utf8'));

      assert.equal(latestRun.status, 'failed');
      assert.equal(latestRun.failurePhase, 'adoption-planning');
      assert.equal(latestRun.mainWorktreeWrites, false);
      assert.equal(latestRun.unsupportedChanges.some((change) => /binary/u.test(change.reason)), true);
    } finally {
      if (unsupportedRoot !== undefined) {
        await rm(unsupportedRoot, { recursive: true, force: true });
      }

      await rm(root, { recursive: true, force: true });
    }
  });

  it('validates Stage Charter JSON, generated HTML, render modes, activation, summary, and next', async () => {
    const root = await mkdtemp(join(tmpdir(), 'symphony-v14-stage-cli-'));

    try {
      const stateDir = join(root, '.symphony');
      const stage = await writeStageFixture(root, { html: 'missing' });
      const initialConsistency = await checkStageCharterConsistency({
        stageId: stage.stageId,
        docsDir: stage.docsDir
      });

      assert.equal(initialConsistency.status, 'failed');
      assert.equal(initialConsistency.errors.some((error) => error.code === 'stage-charter-html-missing'), true);

      const renderMissingOutput = createOutput();
      const renderMissingExitCode = await runSymphonyCli({
        argv: [
          'stage',
          'render',
          stage.stageId,
          '--stage-docs-dir',
          stage.docsDir,
          '--json'
        ],
        stdout: renderMissingOutput.stdout,
        stderr: renderMissingOutput.stderr
      });

      assert.equal(renderMissingExitCode, 0);
      const generated = JSON.parse(renderMissingOutput.stdoutText());

      assert.equal(generated.status, 'generated');
      assert.equal(existsSync(stage.htmlPath), true);
      assert.match(generated.html, /v14 Stage Kernel Refactor/u);

      const passedConsistency = await checkStageCharterConsistency({
        stageId: stage.stageId,
        docsDir: stage.docsDir
      });

      assert.equal(passedConsistency.status, 'passed');

      await writeFile(stage.htmlPath, 'stale html\n', 'utf8');

      const previewOutput = createOutput();
      const previewExitCode = await runSymphonyCli({
        argv: [
          'stage',
          'render',
          stage.stageId,
          '--stage-docs-dir',
          stage.docsDir,
          '--json'
        ],
        stdout: previewOutput.stdout,
        stderr: previewOutput.stderr
      });

      assert.equal(previewExitCode, 0);
      assert.equal(JSON.parse(previewOutput.stdoutText()).status, 'preview');
      assert.equal(await readFile(stage.htmlPath, 'utf8'), 'stale html\n');

      const overwriteOutput = createOutput();
      const overwriteExitCode = await runSymphonyCli({
        argv: [
          'stage',
          'render',
          stage.stageId,
          '--stage-docs-dir',
          stage.docsDir,
          '--write',
          '--json'
        ],
        stdout: overwriteOutput.stdout,
        stderr: overwriteOutput.stderr
      });

      assert.equal(overwriteExitCode, 0);
      assert.equal(JSON.parse(overwriteOutput.stdoutText()).status, 'written');
      assert.equal((await checkStageCharterConsistency({
        stageId: stage.stageId,
        docsDir: stage.docsDir
      })).status, 'passed');

      const activateOutput = createOutput();
      const activateExitCode = await runSymphonyCli({
        argv: [
          'stage',
          'activate',
          stage.stageId,
          '--state-dir',
          stateDir,
          '--stage-docs-dir',
          stage.docsDir,
          '--json'
        ],
        stdout: activateOutput.stdout,
        stderr: activateOutput.stderr
      });

      assert.equal(activateExitCode, 0);
      assert.equal(JSON.parse(activateOutput.stdoutText()).status, 'active');
      assert.equal(existsSync(join(stateDir, 'stages', 'latest.json')), true);

      const helpOutput = createOutput();
      const helpExitCode = await runSymphonyCli({
        argv: ['stage', 'create', '--help'],
        stdout: helpOutput.stdout,
        stderr: helpOutput.stderr
      });

      assert.equal(helpExitCode, 0);
      assert.match(helpOutput.stdoutText(), /symphony stage create/u);
      assert.equal(helpOutput.stderrText(), '');

      const beforeReadOnly = await snapshotDirectoryFiles(stateDir);

      for (const argv of [
        ['stage', '--state-dir', stateDir, '--stage-docs-dir', stage.docsDir, '--json'],
        ['stage', 'summary', '--state-dir', stateDir, '--stage-docs-dir', stage.docsDir, '--json'],
        ['next', '--state-dir', stateDir, '--stage-docs-dir', stage.docsDir, '--json']
      ]) {
        const output = createOutput();
        const exitCode = await runSymphonyCli({
          argv,
          stdout: output.stdout,
          stderr: output.stderr
        });

        assert.equal(exitCode, 0);
        assert.equal(output.stderrText(), '');
        const summary = JSON.parse(output.stdoutText());

        assert.equal(summary.stageId, stage.stageId);
        if (argv[0] === 'stage') {
          assert.equal(summary.contractName, 'symphony.stage-status');
          assert.equal(summary.contractVersion, '1.0');
          assert.equal(summary.activeStage.stageId, stage.stageId);
        } else {
          assert.equal(summary.nextAction, 'symphony do --dry-run "inspect README"');
        }
      }

      const humanStageOutput = createOutput();
      const humanStageExitCode = await runSymphonyCli({
        argv: ['stage', '--state-dir', stateDir, '--stage-docs-dir', stage.docsDir],
        stdout: humanStageOutput.stdout,
        stderr: humanStageOutput.stderr
      });

      assert.equal(humanStageExitCode, 0);
      assert.match(humanStageOutput.stdoutText(), new RegExp(stage.stageId, 'u'));
      assert.match(humanStageOutput.stdoutText(), /v14 Stage Kernel Refactor/u);
      assert.match(humanStageOutput.stdoutText(), /Upgrade Symphony/u);
      assert.match(humanStageOutput.stdoutText(), /Status: active/u);
      assert.match(humanStageOutput.stdoutText(), /Blocker: none/u);
      assert.match(humanStageOutput.stdoutText(), /Next: symphony do --dry-run "inspect README"/u);

      assert.deepEqual(await snapshotDirectoryFiles(stateDir), beforeReadOnly);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it('records active Stage binding for do, review, and verify while honoring --no-stage', async () => {
    const root = await mkdtemp(join(tmpdir(), 'symphony-v14-stage-binding-'));

    try {
      await writeFixtureProject(root);

      const stateDir = join(root, '.symphony');
      const stage = await writeStageFixture(root);
      const activateOutput = createOutput();

      await runSymphonyCli({
        argv: [
          'stage',
          'activate',
          stage.stageId,
          '--state-dir',
          stateDir,
          '--stage-docs-dir',
          stage.docsDir,
          '--json'
        ],
        stdout: activateOutput.stdout,
        stderr: activateOutput.stderr
      });

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

      for (const command of ['do', 'review', 'verify']) {
        const output = createOutput();
        const exitCode = await runSymphonyCli({
          argv: [
            command,
            '--project-dir',
            root,
            '--state-dir',
            stateDir,
            '--stage-docs-dir',
            stage.docsDir,
            '--work-dir',
            join(stateDir, `${command}-work`),
            '--dry-run',
            '--json',
            'inspect README'
          ],
          stdout: output.stdout,
          stderr: output.stderr,
          runner: new MissingToolRunner(),
          mcasRunner: fakePassingHarnessRunner
        });

        assert.equal(exitCode, 0);
        assert.equal(output.stderrText(), '');
        const summary = JSON.parse(output.stdoutText());

        assert.equal(summary.stageBinding.stageId, stage.stageId);
        assert.equal(summary.stageBinding.bindingSource, 'active-stage');
        assert.equal(summary.stageBinding.boundaryCheck.status, 'passed');

        const persisted = JSON.parse(await readFile(join(stateDir, 'runs', `${summary.runId}.json`), 'utf8'));

        assert.equal(persisted.stageBinding.stageId, stage.stageId);
      }

      const explicitStageOutput = createOutput();
      const explicitStageExitCode = await runSymphonyCli({
        argv: [
          'verify',
          '--project-dir',
          root,
          '--state-dir',
          stateDir,
          '--stage-docs-dir',
          stage.docsDir,
          '--stage',
          stage.stageId,
          '--work-dir',
          join(stateDir, 'explicit-stage-work'),
          '--dry-run',
          '--json',
          'inspect README'
        ],
        stdout: explicitStageOutput.stdout,
        stderr: explicitStageOutput.stderr,
        runner: new MissingToolRunner(),
        mcasRunner: fakePassingHarnessRunner
      });
      const explicitStage = JSON.parse(explicitStageOutput.stdoutText());

      assert.equal(explicitStageExitCode, 0);
      assert.equal(explicitStage.stageBinding.stageId, stage.stageId);
      assert.equal(explicitStage.stageBinding.bindingSource, 'explicit-stage');
      assert.equal(explicitStage.stageBinding.boundaryCheck.status, 'passed');

      const noStageOutput = createOutput();
      const noStageExitCode = await runSymphonyCli({
        argv: [
          'verify',
          '--project-dir',
          root,
          '--state-dir',
          stateDir,
          '--stage-docs-dir',
          stage.docsDir,
          '--no-stage',
          '--work-dir',
          join(stateDir, 'no-stage-work'),
          '--dry-run',
          '--json',
          'inspect README'
        ],
        stdout: noStageOutput.stdout,
        stderr: noStageOutput.stderr,
        runner: new MissingToolRunner(),
        mcasRunner: fakePassingHarnessRunner
      });

      assert.equal(noStageExitCode, 0);
      const noStage = JSON.parse(noStageOutput.stdoutText());

      assert.equal(noStage.stageBinding.stageId, null);
      assert.equal(noStage.stageBinding.bindingSource, 'no-stage');
      assert.equal(noStage.stageBinding.boundaryCheck.status, 'not-run');

      const noActiveStateDir = join(root, '.symphony-no-active');
      const noActiveScanOutput = createOutput();

      await runSymphonyCli({
        argv: [
          'scan',
          '--project-dir',
          root,
          '--output-dir',
          join(noActiveStateDir, 'scan-out'),
          '--state-dir',
          noActiveStateDir,
          '--json'
        ],
        stdout: noActiveScanOutput.stdout,
        stderr: noActiveScanOutput.stderr,
        runner: new MissingToolRunner()
      });

      const noActiveOutput = createOutput();
      const noActiveExitCode = await runSymphonyCli({
        argv: [
          'verify',
          '--project-dir',
          root,
          '--state-dir',
          noActiveStateDir,
          '--stage-docs-dir',
          stage.docsDir,
          '--work-dir',
          join(noActiveStateDir, 'work'),
          '--dry-run',
          '--json',
          'inspect README'
        ],
        stdout: noActiveOutput.stdout,
        stderr: noActiveOutput.stderr,
        runner: new MissingToolRunner(),
        mcasRunner: fakePassingHarnessRunner
      });
      const noActive = JSON.parse(noActiveOutput.stdoutText());

      assert.equal(noActiveExitCode, 0);
      assert.equal(noActive.stageBinding.stageId, null);
      assert.equal(noActive.stageBinding.bindingSource, 'no-active-stage');
      assert.equal(noActive.stageBinding.boundaryCheck.status, 'not-run');
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it('blocks Stage Charter mismatches before executions and creates blocker repair artifacts without a normal run', async () => {
    const root = await mkdtemp(join(tmpdir(), 'symphony-v14-stage-gate-'));

    try {
      await writeFixtureProject(root);

      const stateDir = join(root, '.symphony');
      const stage = await writeStageFixture(root, { html: 'stale html\n' });
      const activateOutput = createOutput();

      await runSymphonyCli({
        argv: [
          'stage',
          'activate',
          stage.stageId,
          '--state-dir',
          stateDir,
          '--stage-docs-dir',
          stage.docsDir,
          '--json'
        ],
        stdout: activateOutput.stdout,
        stderr: activateOutput.stderr
      });

      assert.equal(JSON.parse(activateOutput.stdoutText()).status, 'attention');

      const blockedOutput = createOutput();
      const blockedExitCode = await runSymphonyCli({
        argv: [
          'do',
          '--project-dir',
          root,
          '--state-dir',
          stateDir,
          '--stage-docs-dir',
          stage.docsDir,
          '--work-dir',
          join(root, 'work'),
          '--dry-run',
          '--json',
          'inspect README'
        ],
        stdout: blockedOutput.stdout,
        stderr: blockedOutput.stderr,
        runner: new MissingToolRunner(),
        mcasRunner: async () => {
          throw new Error('stage gate must block before execution');
        }
      });

      assert.equal(blockedExitCode, 64);
      assert.match(JSON.parse(blockedOutput.stderrText()).message, /Stage Charter consistency gate blocked/u);
      assert.equal(existsSync(join(stateDir, 'runs', 'latest.json')), false);

      const stageState = JSON.parse(await readFile(join(stateDir, 'stages', `${stage.stageId}.json`), 'utf8'));

      assert.equal(stageState.status, 'blocked');
      assert.equal(stageState.blocker.reason, 'stage-charter-inconsistent');
      assert.equal(stageState.gateEvents[0].normalRunCreated, false);
      assert.equal(existsSync(stageState.blocker.repairArtifactPath), true);
      assert.equal(existsSync(stageState.blocker.blockedSnapshotPath), true);
      assert.equal(stageState.blockedSnapshot.kind, 'symphony.stage-blocked-snapshot-summary');
      assert.equal(stageState.blockedSnapshot.projectState, undefined);
      assert.equal(stageState.blockedSnapshot.frozenRefs, undefined);
      assert.match(stageState.blockedSnapshotRef.uri, /^artifact:\/\//u);
      assert.match(stageState.blocker.repairArtifactRef.uri, /^artifact:\/\//u);

      const fullBlockedSnapshot = JSON.parse(await readFile(stageState.blockedSnapshotRef.path, 'utf8'));

      assert.equal(fullBlockedSnapshot.kind, 'symphony.stage-blocked-snapshot');
      assert.equal(fullBlockedSnapshot.frozenRefs.repairPlanRef.uri, stageState.blocker.repairArtifactRef.uri);
      assert.equal(fullBlockedSnapshot.frozenRefs.executionPlanHash, null);

      for (const argv of [
        ['status', '--state-dir', stateDir, '--json'],
        ['stage', '--state-dir', stateDir, '--stage-docs-dir', stage.docsDir, '--json']
      ]) {
        const output = createOutput();
        const exitCode = await runSymphonyCli({
          argv,
          stdout: output.stdout,
          stderr: output.stderr
        });

        assert.equal(exitCode, 0);
        assert.equal(output.stderrText(), '');
      }

      const consoleOutput = createOutput();
      const consoleExitCode = await runSymphonyCli({
        argv: ['console', '--snapshot', '--state-dir', stateDir, '--json'],
        stdout: consoleOutput.stdout,
        stderr: consoleOutput.stderr
      });
      const snapshot = JSON.parse(consoleOutput.stdoutText());

      assert.equal(consoleExitCode, 0);
      assert.equal(snapshot.stageSummary.stageId, stage.stageId);
      assert.equal(snapshot.stageSummary.status, 'blocked');
      assert.equal(snapshot.overview.stage.blocker.reason, 'stage-charter-inconsistent');

      const repairOutput = createOutput();
      const repairExitCode = await runSymphonyCli({
        argv: [
          'stage',
          'render',
          stage.stageId,
          '--stage-docs-dir',
          stage.docsDir,
          '--write',
          '--json'
        ],
        stdout: repairOutput.stdout,
        stderr: repairOutput.stderr
      });

      assert.equal(repairExitCode, 0);
      assert.equal(JSON.parse(repairOutput.stdoutText()).status, 'written');

      const scanOutput = createOutput();

      await runSymphonyCli({
        argv: [
          'scan',
          '--project-dir',
          root,
          '--output-dir',
          join(stateDir, 'scan-out'),
          '--state-dir',
          stateDir,
          '--json'
        ],
        stdout: scanOutput.stdout,
        stderr: scanOutput.stderr,
        runner: new MissingToolRunner()
      });

      const unblockedOutput = createOutput();
      const unblockedExitCode = await runSymphonyCli({
        argv: [
          'do',
          '--project-dir',
          root,
          '--state-dir',
          stateDir,
          '--stage-docs-dir',
          stage.docsDir,
          '--work-dir',
          join(root, 'work'),
          '--dry-run',
          '--json',
          'inspect README'
        ],
        stdout: unblockedOutput.stdout,
        stderr: unblockedOutput.stderr,
        runner: new MissingToolRunner(),
        mcasRunner: fakePassingHarnessRunner
      });
      const unblocked = JSON.parse(unblockedOutput.stdoutText());
      const repairedStageState = JSON.parse(await readFile(join(stateDir, 'stages', `${stage.stageId}.json`), 'utf8'));

      assert.equal(unblockedExitCode, 0);
      assert.equal(unblocked.stageGate.status, 'passed');
      assert.equal(repairedStageState.status, 'active');
      assert.equal(repairedStageState.blocker, null);
      assert.equal(repairedStageState.gateEvents.some((event) => event.status === 'resolved'), true);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it('keeps Stage blocker frozen when Stage JSON changes after a block', async () => {
    const root = await mkdtemp(join(tmpdir(), 'symphony-v14-stage-json-drift-'));

    try {
      await writeFixtureProject(root);

      const stateDir = join(root, '.symphony');
      const stage = await writeStageFixture(root, { html: 'stale html\n' });
      const activateOutput = createOutput();

      await runSymphonyCli({
        argv: ['stage', 'activate', stage.stageId, '--state-dir', stateDir, '--stage-docs-dir', stage.docsDir, '--json'],
        stdout: activateOutput.stdout,
        stderr: activateOutput.stderr
      });

      const blockedOutput = createOutput();
      const blockedExitCode = await runSymphonyCli({
        argv: [
          'do',
          '--project-dir',
          root,
          '--state-dir',
          stateDir,
          '--stage-docs-dir',
          stage.docsDir,
          '--work-dir',
          join(stateDir, 'work'),
          '--dry-run',
          '--json',
          'inspect README'
        ],
        stdout: blockedOutput.stdout,
        stderr: blockedOutput.stderr,
        runner: new MissingToolRunner(),
        mcasRunner: fakePassingHarnessRunner
      });

      assert.equal(blockedExitCode, 64);

      const charter = JSON.parse(await readFile(stage.charterPath, 'utf8'));

      charter.goal = 'Changed after the blocker was frozen.';
      await writeFile(stage.charterPath, `${JSON.stringify(charter, null, 2)}\n`, 'utf8');

      const repairOutput = createOutput();

      await runSymphonyCli({
        argv: ['stage', 'render', stage.stageId, '--stage-docs-dir', stage.docsDir, '--write', '--json'],
        stdout: repairOutput.stdout,
        stderr: repairOutput.stderr
      });

      const retryOutput = createOutput();
      const retryExitCode = await runSymphonyCli({
        argv: [
          'do',
          '--project-dir',
          root,
          '--state-dir',
          stateDir,
          '--stage-docs-dir',
          stage.docsDir,
          '--work-dir',
          join(stateDir, 'work'),
          '--dry-run',
          '--json',
          'inspect README'
        ],
        stdout: retryOutput.stdout,
        stderr: retryOutput.stderr,
        runner: new MissingToolRunner(),
        mcasRunner: fakePassingHarnessRunner
      });
      const stageState = JSON.parse(await readFile(join(stateDir, 'stages', `${stage.stageId}.json`), 'utf8'));

      assert.equal(retryExitCode, 64);
      assert.match(JSON.parse(retryOutput.stderrText()).message, /Stage Charter consistency gate blocked/u);
      assert.equal(stageState.status, 'blocked');
      assert.equal(stageState.blocker.reason, 'stage-charter-inconsistent');
      assert.equal(stageState.gateEvents.some((event) => event.status === 'resolved'), false);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it('keeps Stage blocker frozen when a different effective action is retried', async () => {
    const root = await mkdtemp(join(tmpdir(), 'symphony-v14-stage-action-drift-'));

    try {
      await writeFixtureProject(root);

      const stateDir = join(root, '.symphony');
      const stage = await writeStageFixture(root, { html: 'stale html\n' });
      const activateOutput = createOutput();

      await runSymphonyCli({
        argv: ['stage', 'activate', stage.stageId, '--state-dir', stateDir, '--stage-docs-dir', stage.docsDir, '--json'],
        stdout: activateOutput.stdout,
        stderr: activateOutput.stderr
      });

      const blockedOutput = createOutput();
      const blockedExitCode = await runSymphonyCli({
        argv: [
          'do',
          '--project-dir',
          root,
          '--state-dir',
          stateDir,
          '--stage-docs-dir',
          stage.docsDir,
          '--work-dir',
          join(stateDir, 'work'),
          '--dry-run',
          '--json',
          'inspect README'
        ],
        stdout: blockedOutput.stdout,
        stderr: blockedOutput.stderr,
        runner: new MissingToolRunner(),
        mcasRunner: fakePassingHarnessRunner
      });

      assert.equal(blockedExitCode, 64);

      await runSymphonyCli({
        argv: ['stage', 'render', stage.stageId, '--stage-docs-dir', stage.docsDir, '--write', '--json'],
        stdout: createOutput().stdout,
        stderr: createOutput().stderr
      });

      const changedActionOutput = createOutput();
      const changedActionExitCode = await runSymphonyCli({
        argv: [
          'do',
          '--project-dir',
          root,
          '--state-dir',
          stateDir,
          '--stage-docs-dir',
          stage.docsDir,
          '--work-dir',
          join(stateDir, 'write-work'),
          '--write',
          '--json',
          'different prompt'
        ],
        stdout: changedActionOutput.stdout,
        stderr: changedActionOutput.stderr,
        runner: new MissingToolRunner(),
        mcasRunner: fakePassingHarnessRunner
      });
      const stageState = JSON.parse(await readFile(join(stateDir, 'stages', `${stage.stageId}.json`), 'utf8'));

      assert.equal(changedActionExitCode, 64);
      assert.match(JSON.parse(changedActionOutput.stderrText()).message, /Stage Charter consistency gate blocked/u);
      assert.equal(stageState.status, 'blocked');
      assert.equal(stageState.gateEvents.some((event) => event.status === 'resolved'), false);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it('stores real execution plan hashes in Stage blocked snapshots', async () => {
    const root = await mkdtemp(join(tmpdir(), 'symphony-v14-stage-plan-hash-'));

    try {
      await writeFixtureProject(root);

      const stateDir = join(root, '.symphony');
      const stage = await writeStageFixture(root);

      await runSymphonyCli({
        argv: ['stage', 'activate', stage.stageId, '--state-dir', stateDir, '--stage-docs-dir', stage.docsDir, '--json'],
        stdout: createOutput().stdout,
        stderr: createOutput().stderr
      });

      const scanOutput = createOutput();

      await runSymphonyCli({
        argv: [
          'scan',
          '--project-dir',
          root,
          '--output-dir',
          join(stateDir, 'scan-out'),
          '--state-dir',
          stateDir,
          '--json'
        ],
        stdout: scanOutput.stdout,
        stderr: scanOutput.stderr,
        runner: new MissingToolRunner()
      });

      const planOutput = createOutput();
      const planExitCode = await runSymphonyCli({
        argv: [
          'do',
          '--project-dir',
          root,
          '--state-dir',
          stateDir,
          '--stage-docs-dir',
          stage.docsDir,
          '--work-dir',
          join(stateDir, 'planned-work'),
          '--write',
          '--json',
          'inspect README'
        ],
        stdout: planOutput.stdout,
        stderr: planOutput.stderr,
        runner: new MissingToolRunner(),
        mcasRunner: async () => {
          throw new Error('write planning must not invoke the kernel');
        }
      });

      assert.equal(planExitCode, 0);
      const planned = JSON.parse(planOutput.stdoutText());

      await writeFile(stage.htmlPath, 'stale html\n', 'utf8');

      const blockedOutput = createOutput();
      const blockedExitCode = await runSymphonyCli({
        argv: [
          'do',
          '--confirm-plan',
          planned.executionPlanId,
          '--state-dir',
          stateDir,
          '--stage-docs-dir',
          stage.docsDir,
          '--json'
        ],
        stdout: blockedOutput.stdout,
        stderr: blockedOutput.stderr,
        runner: new MissingToolRunner(),
        mcasRunner: fakePassingHarnessRunner
      });
      const stageState = JSON.parse(await readFile(join(stateDir, 'stages', `${stage.stageId}.json`), 'utf8'));
      const blockedSnapshot = JSON.parse(await readFile(stageState.blockedSnapshotRef.path, 'utf8'));

      assert.equal(blockedExitCode, 64);
      assert.match(blockedSnapshot.frozenRefs.executionPlanHash, /^sha256:/u);
      assert.notEqual(blockedSnapshot.frozenRefs.executionPlanHash, planned.executionPlanId);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it('blocks symphony new --write when active Stage Charter is inconsistent', async () => {
    const root = await mkdtemp(join(tmpdir(), 'symphony-v14-stage-new-gate-'));

    try {
      const stateDir = join(root, '.symphony');
      const targetDir = join(root, 'created-app');
      const stage = await writeStageFixture(root, { html: 'stale html\n' });
      const activateOutput = createOutput();

      await runSymphonyCli({
        argv: ['stage', 'activate', stage.stageId, '--state-dir', stateDir, '--stage-docs-dir', stage.docsDir, '--json'],
        stdout: activateOutput.stdout,
        stderr: activateOutput.stderr
      });

      const newOutput = createOutput();
      const newExitCode = await runSymphonyCli({
        argv: [
          'new',
          targetDir,
          '--template',
          'node-cli',
          '--write',
          '--state-dir',
          stateDir,
          '--stage-docs-dir',
          stage.docsDir,
          '--runtime-dir',
          join(stateDir, 'new-runtime'),
          '--json'
        ],
        stdout: newOutput.stdout,
        stderr: newOutput.stderr,
        runner: new MissingToolRunner(),
        mcasRunner: fakePassingHarnessRunner
      });

      assert.equal(newExitCode, 64);
      assert.match(JSON.parse(newOutput.stderrText()).message, /Stage Charter consistency gate blocked/u);
      assert.equal(existsSync(targetDir), false);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it('serves a read-only local console snapshot and API from state', async () => {
    const root = await mkdtemp(join(tmpdir(), 'symphony-v8-console-'));
    let server;

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

      const snapshotOutput = createOutput();
      const snapshotExitCode = await runSymphonyCli({
        argv: ['console', '--snapshot', '--state-dir', stateDir, '--json'],
        stdout: snapshotOutput.stdout,
        stderr: snapshotOutput.stderr
      });

      assert.equal(snapshotExitCode, 0);
      assert.equal(snapshotOutput.stderrText(), '');

      const snapshot = JSON.parse(snapshotOutput.stdoutText());

      assert.equal(snapshot.contractName, 'symphony.console-snapshot');
      assert.equal(snapshot.status, 'ready');
      assert.equal(snapshot.overview.status, 'ready');
      assert.equal(snapshot.overview.latestRunId, JSON.parse(scanOutput.stdoutText()).runId);
      assert.equal(snapshot.overview.topRisks.length <= 3, true);
      assert.equal(snapshot.adoptionSummary.status, 'clear');
      assert.equal(snapshot.runs.length, 1);
      assert.equal(snapshot.latestRun.runId, JSON.parse(scanOutput.stdoutText()).runId);
      assert.equal(snapshot.latestRun.artifactRefs.some((artifact) => artifact.kind === 'context'), true);

      server = createSymphonyConsoleServer({
        stateDir,
        cwd: root,
        env: {
          MCAS_RUN_REAL_CODEX: '1'
        },
        runner: new ConsoleReadinessRunner()
      });
      const baseUrl = await listenOnRandomPort(server);

      const htmlResponse = await fetch(baseUrl);
      const summaryResponse = await fetch(`${baseUrl}/api/summary`);
      const readinessResponse = await fetch(`${baseUrl}/api/readiness`);
      const latestRunResponse = await fetch(`${baseUrl}/api/runs/latest`);
      const timelineResponse = await fetch(`${baseUrl}/api/runs/latest/timeline`);
      const contextPreviewResponse = await fetch(`${baseUrl}/api/runs/latest/artifacts/context`);
      const writeResponse = await fetch(`${baseUrl}/api/summary`, { method: 'POST' });

      assert.equal(htmlResponse.status, 200);
      const html = await htmlResponse.text();

      assert.match(html, /Symphony Workbench/u);
      assert.match(html, /当前 Stage/u);
      assert.match(html, /data-view="overview"/u);
      assert.match(html, /data-view="adoptions"/u);
      assert.match(html, /data-view="runs"/u);
      assert.match(html, /data-view="diagnostics"/u);
      assert.match(html, /data-view="artifacts"/u);
      assert.match(html, /\/api\/readiness/u);
      assert.match(html, /\/api\/adoptions\//u);
      assert.match(html, /copyCommand/u);
      assert.match(html, /前三风险/u);
      assert.match(html, /run-filters/u);
      assert.match(html, /detailSection\('意图'/u);
      assert.match(html, /detailSection\('验证'/u);
      assert.equal(summaryResponse.status, 200);
      const serverSnapshot = await summaryResponse.json();

      assert.equal(serverSnapshot.contractName, 'symphony.console-snapshot');
      assert.equal(serverSnapshot.runStats.total, 1);
      assert.equal(serverSnapshot.runStats.recentRuns.length, 1);
      assert.equal(serverSnapshot.runStats.verifier.passRate, 1);
      assert.equal(serverSnapshot.runStats.artifacts.status, 'ok');
      assert.equal(serverSnapshot.commandGroups.some((group) => group.group === 'Inspect'), true);
      assert.equal(serverSnapshot.latestRun.timeline.some((event) => event.id === 'artifacts'), true);
      assert.equal(serverSnapshot.latestRun.recommendedCommands.every((command) => command.mode === 'copy-only'), true);
      assert.equal(serverSnapshot.recommendedCommands.some((command) => command.command === 'symphony console'), true);
      assert.equal(readinessResponse.status, 200);

      const readiness = await readinessResponse.json();

      assert.equal(readiness.contractName, 'symphony.console-readiness');
      assert.equal(readiness.readOnly, true);
      assert.equal(readiness.modelInvocation, false);
      assert.equal(readiness.tools.packageManager.version, '10.30.3');
      assert.equal(readiness.tools.git.branch, 'main');
      assert.equal(readiness.tools.git.dirty, true);
      assert.equal(readiness.tools.github.account, 'Andy20010101');
      assert.equal(readiness.tools.github.ci.latest.conclusion, 'success');
      assert.equal(readiness.tools.realCli.adapters.find((adapter) => adapter.adapterId === 'codex').gate.status, 'enabled');
      assert.equal(readiness.checks.find((check) => check.id === 'git').status, 'attention');
      assert.equal(readiness.riskSummary.items.some((risk) => risk.category === 'dirty_git'), true);
      assert.equal(readiness.recommendedCommands.some((command) => command.command === 'git status --short'), true);
      assert.equal(readiness.commandGroups.some((group) => group.group === 'Real-agent gates'), true);
      assert.equal(JSON.stringify(readiness).includes('ghp_abcdefghijklmnopqrstuvwxyz123456'), false);
      assert.equal(latestRunResponse.status, 200);
      const latestRun = await latestRunResponse.json();

      assert.equal(latestRun.run.runId, snapshot.latestRun.runId);
      assert.equal(latestRun.run.timeline.some((event) => event.id === 'verification'), true);
      assert.equal(latestRun.run.recommendedCommands.some((command) => command.command === latestRun.run.nextAction), true);
      assert.equal(timelineResponse.status, 200);

      const timeline = await timelineResponse.json();

      assert.equal(timeline.contractName, 'symphony.console-run-timeline');
      assert.equal(timeline.runId, snapshot.latestRun.runId);
      assert.equal(timeline.timeline.some((event) => event.id === 'safety'), true);
      assert.equal(timeline.recommendedCommands.every((command) => command.mode === 'copy-only'), true);
      assert.equal(contextPreviewResponse.status, 403);

      const contextPreview = await contextPreviewResponse.json();

      assert.equal(contextPreview.contractName, 'symphony.console-artifact');
      assert.equal(contextPreview.status, 'blocked-artifact-path');
      assert.equal(contextPreview.artifact.kind, 'context');
      assert.equal(contextPreview.artifact.type, 'file');
      assert.equal(contextPreview.artifact.format, 'not-previewable');
      assert.equal(contextPreview.artifact.previewAvailable, false);
      assert.equal(contextPreview.artifact.safeToRenderInline, false);
      assert.equal(contextPreview.artifact.truncated, false);
      assert.equal(Object.hasOwn(contextPreview.artifact, 'content'), false);
      assert.equal(writeResponse.status, 405);
      assert.match((await writeResponse.json()).error.message, /read-only/u);
    } finally {
      if (server !== undefined) {
        await closeServer(server);
      }

      await rm(root, { recursive: true, force: true });
    }
  });

  it('serves an empty read-only workbench state with missing readiness tools', async () => {
    const root = await mkdtemp(join(tmpdir(), 'symphony-v9-console-empty-'));
    let server;

    try {
      const stateDir = join(root, '.symphony');

      server = createSymphonyConsoleServer({
        stateDir,
        cwd: root,
        runner: new MissingReadinessRunner(),
        env: {}
      });
      const baseUrl = await listenOnRandomPort(server);
      const summary = await (await fetch(`${baseUrl}/api/summary`)).json();
      const readiness = await (await fetch(`${baseUrl}/api/readiness`)).json();

      assert.equal(summary.status, 'no-runs');
      assert.equal(summary.overview.status, 'no-runs');
      assert.equal(summary.overview.nextAction, 'symphony scan');
      assert.equal(summary.adoptionSummary.status, 'clear');
      assert.equal(summary.latestRun, null);
      assert.equal(summary.recommendedCommands.some((command) => command.command === 'symphony scan'), true);
      assert.equal(summary.recommendedCommands.every((command) => command.mode === 'copy-only'), true);
      assert.equal(readiness.status, 'attention');
      assert.equal(readiness.tools.packageManager.status, 'unavailable');
      assert.equal(readiness.tools.github.status, 'unavailable');
      assert.equal(readiness.riskSummary.items.some((risk) => risk.id === 'missing_tool:pnpm'), true);
      assert.equal(readiness.riskSummary.items.some((risk) => risk.category === 'missing_tools'), true);
      assert.equal(readiness.recommendedCommands.some((command) => command.command === 'corepack enable'), true);
      assert.equal(readiness.commandGroups.some((group) => group.group === 'Inspect'), true);
      assert.equal(readiness.tools.realCli.adapters.every((adapter) => adapter.modelInvocation === false), true);
    } finally {
      if (server !== undefined) {
        await closeServer(server);
      }

      await rm(root, { recursive: true, force: true });
    }
  });

  it('aggregates v9.1 run diagnostics, filters, risks, and grouped copy-only commands', async () => {
    const root = await mkdtemp(join(tmpdir(), 'symphony-v91-console-diagnostics-'));
    let server;

    try {
      const stateDir = join(root, '.symphony');
      const runsDir = join(stateDir, 'runs');
      const artifactDir = join(root, 'artifacts');
      const availableArtifactPath = join(artifactDir, 'available.json');
      const missingArtifactPath = join(artifactDir, 'missing.json');

      await mkdir(runsDir, { recursive: true });
      await mkdir(artifactDir, { recursive: true });
      await writeFile(availableArtifactPath, '{"ok":true}\n', 'utf8');

      const runStates = [
        diagnosticRunState({
          runId: 'scan-passed',
          command: 'symphony scan',
          semanticCommand: 'scan',
          intent: 'scan-project',
          status: 'passed',
          verifierStatus: 'passed',
          safetyMode: 'read-only',
          executionMode: 'dry-run',
          contextArtifactPath: availableArtifactPath,
          updatedAt: '2026-05-23T00:00:01.000Z'
        }),
        diagnosticRunState({
          runId: 'verify-failed',
          command: 'symphony verify',
          semanticCommand: 'verify',
          intent: 'verify',
          status: 'failed',
          verifierStatus: 'failed',
          safetyMode: 'read-only',
          executionMode: 'dry-run',
          contextArtifactPath: missingArtifactPath,
          updatedAt: '2026-05-23T00:00:02.000Z'
        }),
        diagnosticRunState({
          runId: 'real-do',
          command: 'symphony do',
          semanticCommand: 'do',
          intent: 'work',
          status: 'passed',
          verifierStatus: 'passed',
          safetyMode: 'real',
          executionMode: 'real',
          externalCalls: true,
          projectWrites: true,
          contextArtifactPath: availableArtifactPath,
          updatedAt: '2026-05-23T00:00:03.000Z'
        }),
        diagnosticRunState({
          runId: 'new-preview',
          command: 'symphony new',
          semanticCommand: 'new',
          intent: 'new-project',
          status: 'preview',
          verifierStatus: 'not-run',
          safetyMode: 'dry-run',
          executionMode: 'dry-run',
          unsupportedRequests: [{ request: 'react', reason: 'framework generators are disabled' }],
          contextArtifactPath: availableArtifactPath,
          updatedAt: '2026-05-23T00:00:04.000Z'
        }),
        diagnosticRunState({
          runId: 'dry-do',
          command: 'symphony do',
          semanticCommand: 'do',
          intent: 'work',
          status: 'passed',
          verifierStatus: 'passed',
          safetyMode: 'dry-run',
          executionMode: 'dry-run',
          contextArtifactPath: availableArtifactPath,
          updatedAt: '2026-05-23T00:00:05.000Z'
        }),
        diagnosticRunState({
          runId: 'qa-passed',
          command: 'symphony qa',
          semanticCommand: 'verify',
          intent: 'verify',
          status: 'passed',
          verifierStatus: 'passed',
          safetyMode: 'read-only',
          executionMode: 'dry-run',
          contextArtifactPath: availableArtifactPath,
          updatedAt: '2026-05-23T00:00:06.000Z'
        })
      ];

      for (const runState of runStates) {
        await writeFile(join(runsDir, `${runState.runId}.json`), JSON.stringify(runState, null, 2), 'utf8');
      }

      await writeFile(join(runsDir, 'latest.json'), JSON.stringify(runStates.at(-1), null, 2), 'utf8');

      server = createSymphonyConsoleServer({ stateDir });
      const baseUrl = await listenOnRandomPort(server);
      const summary = await (await fetch(`${baseUrl}/api/summary`)).json();

      assert.equal(summary.runStats.total, 6);
      assert.equal(summary.runStats.recentRuns.length, 5);
      assert.equal(summary.runStats.recentRuns[0].runId, 'qa-passed');
      assert.equal(summary.runStats.failedCount, 1);
      assert.equal(summary.runStats.verifier.passed, 4);
      assert.equal(summary.runStats.verifier.failed, 1);
      assert.equal(summary.runStats.artifacts.status, 'missing');
      assert.equal(summary.runStats.artifacts.missing, 1);
      assert.equal(summary.runStats.filters.find((filter) => filter.id === 'failed').count, 1);
      assert.equal(summary.runStats.filters.find((filter) => filter.id === 'real').count, 1);
      assert.equal(summary.runStats.filters.find((filter) => filter.id === 'adoption').count, 0);
      assert.equal(summary.overview.topRisks.length, 3);
      assert.equal(summary.overview.status, 'blocked');
      assert.equal(summary.riskSummary.items.some((risk) => risk.category === 'verifier_failed'), true);
      assert.equal(summary.riskSummary.items.some((risk) => risk.category === 'unsupported_requests'), true);
      assert.equal(summary.riskSummary.items.some((risk) => risk.category === 'external_calls'), true);
      assert.equal(summary.riskSummary.items.some((risk) => risk.category === 'project_writes'), true);
      assert.equal(summary.riskSummary.items.some((risk) => risk.category === 'runtime_writes'), true);
      assert.equal(summary.riskSummary.items.some((risk) => risk.category === 'missing_artifacts'), true);
      assert.equal(summary.latestRun.commandGroups.every((group) => group.commands.every((command) => command.mode === 'copy-only')), true);

      const failedRuns = await (await fetch(`${baseUrl}/api/runs?filter=failed`)).json();
      const realRuns = await (await fetch(`${baseUrl}/api/runs?filter=real`)).json();
      const scanRuns = await (await fetch(`${baseUrl}/api/runs?filter=scan`)).json();
      const verifyRuns = await (await fetch(`${baseUrl}/api/runs?filter=verify`)).json();
      const invalidFilterRuns = await (await fetch(`${baseUrl}/api/runs?filter=unsupported`)).json();

      assert.deepEqual(failedRuns.runs.map((run) => run.runId), ['verify-failed']);
      assert.deepEqual(realRuns.runs.map((run) => run.runId), ['real-do']);
      assert.deepEqual(scanRuns.runs.map((run) => run.runId), ['scan-passed']);
      assert.deepEqual(verifyRuns.runs.map((run) => run.runId), ['qa-passed', 'verify-failed']);
      assert.equal(invalidFilterRuns.filter, 'all');
      assert.equal(invalidFilterRuns.runs.length, 6);
    } finally {
      if (server !== undefined) {
        await closeServer(server);
      }

      await rm(root, { recursive: true, force: true });
    }
  });

  it('reports v10 controlled diagnostics as JSON, text, and static escaped HTML', async () => {
    const root = await mkdtemp(join(tmpdir(), 'symphony-v10-diagnose-'));

    try {
      const stateDir = join(root, '.symphony');
      const runsDir = join(stateDir, 'runs');
      const artifactDir = join(root, 'artifacts');
      const availableArtifactPath = join(artifactDir, 'available.json');
      const missingArtifactPath = join(artifactDir, 'missing.json');
      const unsafeCommand = 'symphony verify <script>alert(1)</script>';
      const runStates = [
        diagnosticRunState({
          runId: 'diagnose-older',
          command: 'symphony scan',
          semanticCommand: 'scan',
          intent: 'scan-project',
          status: 'passed',
          verifierStatus: 'passed',
          safetyMode: 'read-only',
          executionMode: 'dry-run',
          contextArtifactPath: availableArtifactPath,
          updatedAt: '2026-05-23T01:00:00.000Z'
        }),
        diagnosticRunState({
          runId: 'diagnose-latest',
          command: unsafeCommand,
          semanticCommand: 'verify',
          intent: 'verify',
          status: 'failed',
          verifierStatus: 'failed',
          safetyMode: 'read-only',
          executionMode: 'dry-run',
          contextArtifactPath: missingArtifactPath,
          nextAction: 'symphony artifacts diagnose-latest',
          updatedAt: '2026-05-23T01:01:00.000Z'
        })
      ];

      await mkdir(runsDir, { recursive: true });
      await mkdir(artifactDir, { recursive: true });
      await writeFile(availableArtifactPath, '{"ok":true}\n', 'utf8');

      for (const runState of runStates) {
        await writeFile(join(runsDir, `${runState.runId}.json`), JSON.stringify(runState, null, 2), 'utf8');
      }

      await writeFile(join(runsDir, 'latest.json'), JSON.stringify(runStates.at(-1), null, 2), 'utf8');

      const jsonOutput = createOutput();
      const jsonExitCode = await runSymphonyCli({
        argv: ['diagnose', '--state-dir', stateDir, '--json'],
        stdout: jsonOutput.stdout,
        stderr: jsonOutput.stderr,
        runner: new DiagnosticReadinessRunner(),
        env: { HOME: root }
      });

      assert.equal(jsonExitCode, 0);
      assert.equal(jsonOutput.stderrText(), '');

      const report = JSON.parse(jsonOutput.stdoutText());

      assert.equal(report.contractName, 'symphony.diagnostics-report');
      assert.equal(report.contractVersion, '1');
      assert.equal(report.status, 'attention');
      assert.equal(report.snapshot.contractName, 'symphony.console-snapshot');
      assert.equal(report.snapshot.runStats.total, 2);
      assert.equal(report.snapshot.runStats.artifacts.status, 'missing');
      assert.equal(report.readiness.contractName, 'symphony.console-readiness');
      assert.equal(report.readiness.tools.packageManager.status, 'unavailable');
      assert.equal(report.readiness.tools.git.dirty, true);
      assert.equal(report.commands.mode, 'copy-only');
      assert.equal(report.commands.items.every((command) => command.mode === 'copy-only'), true);
      assert.deepEqual(report.commands.groups.map((group) => group.group), [
        'Inspect',
        'Verify',
        'Artifacts',
        'Real-agent gates'
      ]);
      assert.equal(report.risks.items.some((risk) => risk.category === 'dirty_git'), true);
      assert.equal(report.risks.items.some((risk) => risk.id === 'missing_tool:pnpm'), true);
      assert.equal(report.risks.items.some((risk) => risk.id === 'missing_tool:codex'), true);
      assert.equal(report.risks.items.some((risk) => risk.category === 'verifier_failed'), true);
      assert.equal(report.risks.items.some((risk) => risk.category === 'missing_artifacts'), true);
      assert.equal(JSON.stringify(report).includes('ghp_abcdefghijklmnopqrstuvwxyz123456'), false);

      const textOutput = createOutput();
      const textExitCode = await runSymphonyCli({
        argv: ['diagnose', '--state-dir', stateDir],
        stdout: textOutput.stdout,
        stderr: textOutput.stderr,
        runner: new DiagnosticReadinessRunner(),
        env: { HOME: root }
      });

      assert.equal(textExitCode, 0);
      assert.match(textOutput.stdoutText(), /Status: attention/u);
      assert.match(textOutput.stdoutText(), /Latest run: diagnose-latest/u);
      assert.match(textOutput.stdoutText(), /Risks:/u);
      assert.match(textOutput.stdoutText(), /Commands:/u);
      assert.equal(textOutput.stdoutText().includes('ghp_abcdefghijklmnopqrstuvwxyz123456'), false);

      const htmlOutput = createOutput();
      const htmlExitCode = await runSymphonyCli({
        argv: ['diagnose', '--state-dir', stateDir, '--html'],
        stdout: htmlOutput.stdout,
        stderr: htmlOutput.stderr,
        runner: new DiagnosticReadinessRunner(),
        env: { HOME: root }
      });

      assert.equal(htmlExitCode, 0);

      const html = htmlOutput.stdoutText();

      assert.match(html, /^<!doctype html>/u);
      assert.match(html, /<title>Symphony Diagnostics Report<\/title>/u);
      assert.match(html, /Copy-Only Commands/u);
      assert.match(html, /&lt;script&gt;alert\(1\)&lt;\/script&gt;/u);
      assert.equal(/<script/i.test(html), false);
      assert.equal(/\s(?:src|href)=["']https?:\/\//iu.test(html), false);
      assert.equal(html.includes('ghp_abcdefghijklmnopqrstuvwxyz123456'), false);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it('reports no-runs diagnostics and rejects conflicting diagnose output modes', async () => {
    const root = await mkdtemp(join(tmpdir(), 'symphony-v10-diagnose-empty-'));

    try {
      const stateDir = join(root, '.symphony');
      const jsonOutput = createOutput();
      const jsonExitCode = await runSymphonyCli({
        argv: ['diagnose', '--state-dir', stateDir, '--json'],
        stdout: jsonOutput.stdout,
        stderr: jsonOutput.stderr,
        runner: new MissingReadinessRunner(),
        env: {}
      });

      assert.equal(jsonExitCode, 0);

      const report = JSON.parse(jsonOutput.stdoutText());

      assert.equal(report.status, 'no-runs');
      assert.equal(report.action.next, 'symphony scan');
      assert.equal(report.snapshot.recommendedCommands.some((command) => command.command === 'symphony scan'), true);
      assert.equal(report.risks.items.some((risk) => risk.id === 'missing_tool:pnpm'), true);

      const textOutput = createOutput();

      await runSymphonyCli({
        argv: ['diagnose', '--state-dir', stateDir],
        stdout: textOutput.stdout,
        stderr: textOutput.stderr,
        runner: new MissingReadinessRunner(),
        env: {}
      });

      assert.match(textOutput.stdoutText(), /Status: no-runs/u);
      assert.match(textOutput.stdoutText(), /Latest run: none/u);
      assert.match(textOutput.stdoutText(), /Next: symphony scan/u);

      for (const argv of [
        ['diagnose', '--state-dir', stateDir, '--json', '--html'],
        ['diagnose', '--state-dir', stateDir, '--bogus']
      ]) {
        const output = createOutput();
        const exitCode = await runSymphonyCli({
          argv,
          stdout: output.stdout,
          stderr: output.stderr
        });

        assert.equal(exitCode, 64);
        assert.match(JSON.parse(output.stderrText()).message, /diagnose/u);
      }
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it('keeps console artifact previews bounded to registered refs', async () => {
    const root = await mkdtemp(join(tmpdir(), 'symphony-v8-console-artifacts-'));
    let server;

    try {
      const stateDir = join(root, '.symphony');
      const runsDir = join(stateDir, 'runs');
      const artifactDir = join(root, 'artifacts');
      const runId = 'console-edge-run';
      const missingArtifactPath = join(artifactDir, 'missing.json');
      const malformedArtifactPath = join(artifactDir, 'malformed.json');
      const directoryArtifactPath = join(artifactDir, 'directory-artifact');
      const largeArtifactPath = join(artifactDir, 'large.txt');
      const now = '2026-05-22T00:00:00.000Z';
      const runState = {
        version: '1',
        kind: 'symphony-run-state',
        contractVersion: '1',
        contractName: 'symphony.run-state',
        runId,
        command: 'symphony new',
        intent: 'new-project',
        semanticCommand: 'new',
        pipeline: ['new', 'scan'],
        routeDecision: {
          intent: 'new-project',
          safetyMode: 'dry-run'
        },
        safetyMode: 'dry-run',
        projectWrites: false,
        runtimeWrites: true,
        externalCalls: false,
        destructiveWrites: false,
        providerMode: 'auto',
        providerFallback: {
          from: 'grill-me-docs',
          to: 'builtin',
          reason: 'unavailable'
        },
        unsupportedRequests: [{
          type: 'framework-generator',
          value: 'react'
        }],
        scaffoldPlan: {
          template: 'empty',
          networkInstall: false
        },
        changedFiles: ['README.md'],
        verifierStatus: 'not-run',
        status: 'preview',
        contextArtifactPath: missingArtifactPath,
        summaryArtifactPath: malformedArtifactPath,
        evidenceArtifactPath: directoryArtifactPath,
        harnessOutputPath: largeArtifactPath,
        createdAt: now,
        updatedAt: now,
        nextAction: 'symphony status'
      };

      await mkdir(runsDir, { recursive: true });
      await mkdir(directoryArtifactPath, { recursive: true });
      await writeFile(malformedArtifactPath, '{', 'utf8');
      for (let index = 0; index < 105; index += 1) {
        await writeFile(join(directoryArtifactPath, `entry-${String(index).padStart(3, '0')}.txt`), `${index}\n`, 'utf8');
      }
      await writeFile(largeArtifactPath, Buffer.alloc((200 * 1024) + 8, 'a'));
      await writeFile(join(runsDir, `${runId}.json`), JSON.stringify(runState, null, 2), 'utf8');
      await writeFile(join(runsDir, 'latest.json'), JSON.stringify(runState, null, 2), 'utf8');

      server = createSymphonyConsoleServer({ stateDir });
      const baseUrl = await listenOnRandomPort(server);
      const summary = await (await fetch(`${baseUrl}/api/summary`)).json();

      assert.equal(summary.latestRun.routeDecision.intent, 'new-project');
      assert.equal(summary.latestRun.providerMode, 'auto');
      assert.equal(summary.latestRun.providerFallback.reason, 'unavailable');
      assert.deepEqual(summary.latestRun.unsupportedRequests, runState.unsupportedRequests);
      assert.deepEqual(summary.latestRun.scaffoldPlan, runState.scaffoldPlan);
      assert.deepEqual(summary.latestRun.changedFiles, ['README.md']);
      assert.deepEqual(summary.latestRun.artifactHealth, {
        status: 'registered',
        total: 4,
        kinds: ['context', 'summary', 'evidence', 'harness']
      });
      assert.equal(summary.latestRun.timeline.some((event) => event.id === 'route'), true);
      assert.equal(summary.latestRun.recommendedCommands.every((command) => command.mode === 'copy-only'), true);
      assert.equal(summary.latestRun.artifactStatus.status, 'missing');
      assert.equal(summary.latestRun.artifactStatus.missing, 1);
      assert.equal(summary.riskSummary.items.some((risk) => risk.category === 'missing_artifacts'), true);

      const missingResponse = await fetch(`${baseUrl}/api/runs/latest/artifacts/context`);
      const malformedResponse = await fetch(`${baseUrl}/api/runs/latest/artifacts/summary`);
      const directoryResponse = await fetch(`${baseUrl}/api/runs/latest/artifacts/evidence`);
      const largeResponse = await fetch(`${baseUrl}/api/runs/latest/artifacts/harness`);
      const unregisteredResponse = await fetch(`${baseUrl}/api/runs/latest/artifacts/proof?path=${encodeURIComponent(malformedArtifactPath)}`);

      assert.equal(missingResponse.status, 404);
      const missingPreview = await missingResponse.json();

      assert.equal(missingPreview.status, 'missing-artifact');
      assert.equal(missingPreview.artifact.message, 'artifact file is missing');
      assert.equal(malformedResponse.status, 200);
      const malformedPreview = await malformedResponse.json();

      assert.equal(malformedPreview.artifact.format, 'malformed-json');
      assert.match(malformedPreview.artifact.parseError, /JSON/u);
      assert.equal(directoryResponse.status, 200);

      const directoryPreview = await directoryResponse.json();

      assert.equal(directoryPreview.artifact.type, 'directory');
      assert.equal(directoryPreview.artifact.previewAvailable, false);
      assert.equal(directoryPreview.artifact.safeToRenderInline, false);
      assert.equal(directoryPreview.artifact.format, 'not-previewable');
      assert.equal(Object.hasOwn(directoryPreview.artifact, 'entries'), false);
      assert.equal(largeResponse.status, 200);

      const largePreview = await largeResponse.json();

      assert.equal(largePreview.artifact.truncated, true);
      assert.equal(largePreview.artifact.previewLimitBytes, 200 * 1024);
      assert.equal(largePreview.artifact.message, `preview truncated to ${200 * 1024} bytes`);
      assert.equal(largePreview.artifact.content.length, 200 * 1024);
      assert.equal(unregisteredResponse.status, 400);
      assertValidErrorEnvelope(await unregisteredResponse.json(), 'invalid-artifact-ref');
    } finally {
      if (server !== undefined) {
        await closeServer(server);
      }

      await rm(root, { recursive: true, force: true });
    }
  });

  it('serves v16 safe artifact preview contracts for registered artifacts only', async () => {
    const root = await mkdtemp(join(tmpdir(), 'symphony-v16-safe-preview-route-'));
    let server;

    try {
      const stateDir = join(root, '.symphony');
      const runsDir = join(stateDir, 'runs');
      const artifactDir = join(root, 'artifacts');
      const runId = 'v16-safe-preview-run';
      const summaryArtifactPath = join(artifactDir, 'summary.json');
      const htmlArtifactPath = join(artifactDir, 'unsafe.html');
      const binaryArtifactPath = join(artifactDir, 'proof.bin');
      const largeArtifactPath = join(artifactDir, 'large.txt');
      const blockedPackagePath = join(process.cwd(), 'package.json');
      const blockedReadmePath = join(process.cwd(), 'README.md');
      const blockedOutsidePath = join(root, 'outside-local.json');
      const symlinkToBlockedPackagePath = join(artifactDir, 'linked-summary.json');
      const hardlinkToBlockedOutsidePath = join(artifactDir, 'hardlink-summary.json');
      const now = '2026-05-27T00:00:00.000Z';
      const runState = {
        version: '1',
        kind: 'symphony-run-state',
        contractVersion: '1',
        contractName: 'symphony.run-state',
        runId,
        command: 'symphony verify',
        intent: 'verify',
        semanticCommand: 'verify',
        pipeline: ['verify'],
        safetyMode: 'read-only',
        executionMode: 'dry-run',
        projectWrites: false,
        runtimeWrites: true,
        externalCalls: false,
        destructiveWrites: false,
        modelInvocation: false,
        verifierStatus: 'passed',
        status: 'passed',
        contextArtifactPath: blockedPackagePath,
        summaryArtifactPath,
        harnessOutputPath: htmlArtifactPath,
        proofArtifactPath: binaryArtifactPath,
        evidenceArtifactPath: largeArtifactPath,
        scaffoldPlanArtifactPath: symlinkToBlockedPackagePath,
        adoptionPlanArtifactPath: hardlinkToBlockedOutsidePath,
        adoptionJournalArtifactPath: blockedReadmePath,
        createdAt: now,
        updatedAt: now,
        nextAction: 'symphony status'
      };

      await mkdir(runsDir, { recursive: true });
      await mkdir(artifactDir, { recursive: true });
      await writeFile(summaryArtifactPath, '{"ok":true}\n', 'utf8');
      await writeFile(htmlArtifactPath, '<script>alert("unsafe")</script>\n', 'utf8');
      await writeFile(binaryArtifactPath, Buffer.from([0, 1, 2, 3, 255]));
      await writeFile(largeArtifactPath, Buffer.alloc((200 * 1024) + 9, 'b'));
      await writeFile(blockedOutsidePath, '{"outsideLocalSecret":true}\n', 'utf8');
      await symlink(blockedPackagePath, symlinkToBlockedPackagePath);
      await link(blockedOutsidePath, hardlinkToBlockedOutsidePath);
      await writeFile(join(runsDir, `${runId}.json`), JSON.stringify(runState, null, 2), 'utf8');
      await writeFile(join(runsDir, 'latest.json'), JSON.stringify(runState, null, 2), 'utf8');

      server = createSymphonyConsoleServer({ stateDir });
      const baseUrl = await listenOnRandomPort(server);
      const summaryPreview = await (await fetch(`${baseUrl}/api/runs/${runId}/artifacts/summary/preview`)).json();

      assertValidSafePreview(summaryPreview);
      assert.equal(summaryPreview.contractName, SAFE_ARTIFACT_PREVIEW_CONTRACT_NAME);
      assert.equal(summaryPreview.sourceRunId, runId);
      assert.equal(summaryPreview.mime, 'application/json');
      assert.equal(summaryPreview.previewAvailable, true);
      assert.equal(summaryPreview.safeToRenderInline, true);
      assert.equal(summaryPreview.contentText, '{"ok":true}\n');
      assert.equal(summaryPreview.downloadAvailable, false);
      assert.equal(Object.hasOwn(summaryPreview, 'path'), false);

      const htmlResponse = await fetch(`${baseUrl}/api/runs/${runId}/artifacts/harness/preview`);
      const htmlBody = await htmlResponse.text();
      const htmlPreview = JSON.parse(htmlBody);

      assert.equal(htmlResponse.status, 200);
      assertValidSafePreview(htmlPreview);
      assert.equal(htmlPreview.mime, 'text/html; charset=utf-8');
      assert.equal(htmlPreview.previewAvailable, false);
      assert.equal(htmlPreview.safeToRenderInline, false);
      assert.equal(Object.hasOwn(htmlPreview, 'contentText'), false);
      assert.doesNotMatch(htmlBody, /<script|alert/u);

      const binaryPreview = await (await fetch(`${baseUrl}/api/runs/${runId}/artifacts/proof/preview`)).json();

      assertValidSafePreview(binaryPreview);
      assert.equal(binaryPreview.mime, 'application/octet-stream');
      assert.equal(binaryPreview.previewAvailable, false);
      assert.equal(binaryPreview.safeToRenderInline, false);
      assert.equal(Object.hasOwn(binaryPreview, 'contentText'), false);

      const largePreview = await (await fetch(`${baseUrl}/api/runs/${runId}/artifacts/evidence/preview`)).json();

      assertValidSafePreview(largePreview);
      assert.equal(largePreview.previewAvailable, true);
      assert.equal(largePreview.safeToRenderInline, true);
      assert.equal(largePreview.truncated, true);
      assert.equal(largePreview.truncationReason, 'size-exceeds-max-preview-bytes');
      assert.equal(largePreview.contentText.length, 200 * 1024);

      const blockedPackageResponse = await fetch(`${baseUrl}/api/runs/${runId}/artifacts/context/preview`);
      const blockedPackageBody = await blockedPackageResponse.text();
      const blockedPackagePreview = JSON.parse(blockedPackageBody);

      assert.equal(blockedPackageResponse.status, 403);
      assertValidErrorEnvelope(blockedPackagePreview, 'blocked-artifact-path');
      assert.equal(Object.hasOwn(blockedPackagePreview, 'contentText'), false);
      assert.doesNotMatch(blockedPackageBody, /multi-coding-agent-symphony|lockfileVersion/u);

      const blockedSymlinkResponse = await fetch(`${baseUrl}/api/runs/${runId}/artifacts/scaffold-plan/preview`);
      const blockedSymlinkBody = await blockedSymlinkResponse.text();
      const blockedSymlinkPreview = JSON.parse(blockedSymlinkBody);

      assert.equal(blockedSymlinkResponse.status, 403);
      assertValidErrorEnvelope(blockedSymlinkPreview, 'blocked-artifact-path');
      assert.equal(Object.hasOwn(blockedSymlinkPreview, 'contentText'), false);
      assert.doesNotMatch(blockedSymlinkBody, /multi-coding-agent-symphony|lockfileVersion/u);

      const blockedHardlinkResponse = await fetch(`${baseUrl}/api/runs/${runId}/artifacts/adoption-plan/preview`);
      const blockedHardlinkBody = await blockedHardlinkResponse.text();
      const blockedHardlinkPreview = JSON.parse(blockedHardlinkBody);

      assert.equal(blockedHardlinkResponse.status, 403);
      assertValidErrorEnvelope(blockedHardlinkPreview, 'blocked-artifact-path');
      assert.equal(Object.hasOwn(blockedHardlinkPreview, 'contentText'), false);
      assert.doesNotMatch(blockedHardlinkBody, /outsideLocalSecret/u);

      const blockedReadmeResponse = await fetch(`${baseUrl}/api/runs/${runId}/artifacts/adoption-journal/preview`);
      const blockedReadmeBody = await blockedReadmeResponse.text();
      const blockedReadmePreview = JSON.parse(blockedReadmeBody);

      assert.equal(blockedReadmeResponse.status, 403);
      assertValidErrorEnvelope(blockedReadmePreview, 'blocked-artifact-path');
      assert.equal(Object.hasOwn(blockedReadmePreview, 'contentText'), false);
      assert.doesNotMatch(blockedReadmeBody, /#|multi-coding-agent-symphony|Symphony/u);

      const postResponse = await fetch(`${baseUrl}/api/runs/${runId}/artifacts/summary/preview`, { method: 'POST' });

      assert.equal(postResponse.status, 405);

      const probes = [
        [`/api/runs/${runId}/artifacts/summary/preview?path=${encodeURIComponent('package.json')}`, 400],
        [`/api/runs/${runId}/artifacts/%2e%2e%2fpackage.json/preview`, 400],
        [`/api/runs/%2e%2e%2fpackage.json/artifacts/summary/preview`, 400],
        [`/api/runs/${runId}/artifacts/package.json/preview`, 404],
        [`/api/runs/${runId}/artifacts/task-packet/preview`, 404]
      ];

      for (const [path, status] of probes) {
        const response = await fetch(`${baseUrl}${path}`);
        const body = await response.text();

        assert.equal(response.status, status, path);
        assert.doesNotMatch(body, /multi-coding-agent-symphony|lockfileVersion|createSymphonyConsoleServer/u, path);
      }
    } finally {
      if (server !== undefined) {
        await closeServer(server);
      }

      await rm(root, { recursive: true, force: true });
    }
  });

  describe('v15 Workbench console API fixture contracts', () => {
    it('freezes empty state, no-run summary, and readiness attention contracts', async () => {
      const root = await mkdtemp(join(tmpdir(), 'symphony-v15-console-empty-'));
      let server;

      try {
        const stateDir = join(root, '.symphony');
        const normalize = createV15ConsoleFixtureNormalizer({ root, stateDir });
        const directSummary = await buildConsoleSnapshot({
          stateDir,
          generatedAt: V15_CONSOLE_CONTRACT_GENERATED_AT
        });
        const directReadiness = await buildConsoleReadiness({
          stateDir,
          cwd: root,
          env: {},
          runner: new MissingReadinessRunner(),
          generatedAt: V15_CONSOLE_CONTRACT_GENERATED_AT
        });

        server = createSymphonyConsoleServer({
          stateDir,
          cwd: root,
          runner: new MissingReadinessRunner(),
          env: {}
        });

        const baseUrl = await listenOnRandomPort(server);
        const routeSummary = await (await fetch(`${baseUrl}/api/summary`)).json();
        const routeReadiness = await (await fetch(`${baseUrl}/api/readiness`)).json();
        const health = await (await fetch(`${baseUrl}/api/health`)).json();

        routeSummary.generatedAt = V15_CONSOLE_CONTRACT_GENERATED_AT;
        routeReadiness.generatedAt = V15_CONSOLE_CONTRACT_GENERATED_AT;

        const expectedSummary = {
          keys: [
            'action',
            'adoptionJournals',
            'adoptionPlans',
            'adoptionSummary',
            'commandGroups',
            'contract',
            'contractName',
            'contractVersion',
            'generatedAt',
            'latestContext',
            'latestRun',
            'overview',
            'recommendedCommands',
            'riskSummary',
            'runStats',
            'runs',
            'stageSummary',
            'stateDir',
            'status'
          ],
          contractName: 'symphony.console-snapshot',
          contractVersion: '1',
          contract: {
            name: 'symphony.console-snapshot',
            version: '1',
            stability: 'stable',
            minimumCli: 'v8.2'
          },
          generatedAt: V15_CONSOLE_CONTRACT_GENERATED_AT,
          stateDir: '<STATE_DIR>',
          status: 'no-runs',
          hasCapabilities: false,
          overview: {
            keys: [
              'adoptionStatus',
              'headline',
              'latestRun',
              'nextAction',
              'runCount',
              'status',
              'topRisks'
            ],
            status: 'no-runs',
            headline: 'No Symphony runs found yet.',
            latestRunId: null,
            latestRun: null,
            runCount: 0,
            topRiskCategories: [],
            stage: null,
            nextAction: 'symphony scan',
            adoptionStatus: 'clear'
          },
          stage: {
            status: 'available',
            stageId: V15_CONSOLE_CONTRACT_STAGE_ID,
            active: false,
            activeStageId: null,
            stageIdFromStage: V15_CONSOLE_CONTRACT_STAGE_ID,
            topRiskIds: [
              'adoption-regression',
              'charter-drift',
              'workbench-write-controls'
            ],
            blocker: null,
            blockedSnapshot: null,
            blockedSnapshotRef: null,
            repairArtifactRef: null,
            gateEventStatuses: [],
            consistency: {
              status: 'passed',
              stageId: V15_CONSOLE_CONTRACT_STAGE_ID,
              errorCodes: []
            },
            nextAction: 'symphony stage activate v14-stage-kernel-refactor'
          },
          adoptionSummary: {
            status: 'clear',
            pendingCount: 0,
            applyingCount: 0,
            postApplyFailedCount: 0,
            staleCount: 0,
            unsupportedCount: 0,
            completedCount: 0,
            dirtyBlocked: false
          },
          latestContext: null,
          latestRun: null,
          runs: [],
          adoptionPlans: [],
          adoptionJournals: [],
          runStats: {
            total: 0,
            recentRunIds: [],
            failedCount: 0,
            verifier: {
              total: 0,
              passed: 0,
              failed: 0,
              passRate: null
            },
            artifacts: {
              status: 'empty',
              registered: 0,
              missing: 0,
              runsWithMissing: 0
            },
            filters: [
              ['all', 0],
              ['passed', 0],
              ['failed', 0],
              ['dry-run', 0],
              ['real', 0],
              ['scan', 0],
              ['verify', 0],
              ['adoption', 0]
            ]
          },
          riskSummary: {
            status: 'ok',
            total: 0,
            counts: {
              high: 0,
              medium: 0,
              low: 0
            },
            categories: [],
            ids: []
          },
          recommendedCommands: [
            ['scan', 'symphony scan', 'Inspect', 'copy-only'],
            ['doctor', 'symphony doctor', 'Inspect', 'copy-only'],
            ['console', 'symphony console', 'Inspect', 'copy-only']
          ],
          commandGroups: [
            ['Inspect', ['scan', 'doctor', 'console']]
          ],
          action: {
            next: 'symphony scan'
          }
        };
        const expectedReadiness = {
          keys: [
            'checks',
            'commandGroups',
            'contract',
            'contractName',
            'contractVersion',
            'cwd',
            'generatedAt',
            'modelInvocation',
            'readOnly',
            'recommendedCommands',
            'riskSummary',
            'stateDir',
            'status',
            'tools'
          ],
          contractName: 'symphony.console-readiness',
          contractVersion: '1',
          contract: {
            name: 'symphony.console-readiness',
            version: '1',
            stability: 'stable',
            minimumCli: 'v8.2'
          },
          generatedAt: V15_CONSOLE_CONTRACT_GENERATED_AT,
          stateDir: '<STATE_DIR>',
          cwd: '<ROOT>',
          status: 'attention',
          readOnly: true,
          modelInvocation: false,
          hasCapabilities: false,
          tools: {
            node: {
              status: 'available',
              version: '<NODE_VERSION>',
              executable: '<NODE_EXECUTABLE>'
            },
            packageManager: {
              name: 'pnpm',
              status: 'unavailable',
              command: 'pnpm --version',
              message: 'spawn pnpm ENOENT'
            },
            git: {
              status: 'unavailable',
              message: 'spawn git ENOENT'
            },
            github: {
              status: 'unavailable',
              authStatus: 'failed',
              message: 'spawn /usr/local/bin/gh ENOENT',
              ci: {
                status: 'skipped',
                reason: 'GitHub auth is not available'
              }
            },
            realCli: {
              status: 'unavailable',
              adapters: [
                ['codex', 'unavailable', 'not-enabled', false],
                ['claude-code', 'unavailable', 'not-enabled', false],
                ['kiro-cli', 'unavailable', 'not-enabled', false]
              ]
            }
          },
          checks: [
            ['node', 'ok'],
            ['pnpm', 'attention'],
            ['git', 'attention'],
            ['github', 'optional'],
            ['real-cli', 'optional']
          ],
          riskSummary: {
            status: 'attention',
            total: 6,
            counts: {
              high: 2,
              medium: 0,
              low: 4
            },
            categories: ['missing_tools'],
            ids: [
              'missing_tool:pnpm',
              'missing_tool:git',
              'github_auth',
              'missing_tool:codex',
              'missing_tool:claude-code',
              'missing_tool:kiro-cli'
            ]
          },
          recommendedCommandIds: [
            'doctor',
            'enable-pnpm',
            'check-pnpm',
            'check-git-worktree',
            'gh-auth-status',
            'gh-auth-login',
            'check',
            'test',
            'check-codex',
            'check-claude-code',
            'check-kiro-cli',
            'real-codex',
            'real-claude',
            'real-kiro'
          ],
          commandGroups: [
            ['Inspect', [
              'doctor',
              'enable-pnpm',
              'check-pnpm',
              'check-git-worktree',
              'gh-auth-status',
              'gh-auth-login'
            ]],
            ['Verify', ['check', 'test']],
            ['Real-agent gates', [
              'check-codex',
              'check-claude-code',
              'check-kiro-cli',
              'real-codex',
              'real-claude',
              'real-kiro'
            ]]
          ]
        };

        assert.deepEqual(consoleSnapshotContractProjection(directSummary, normalize), expectedSummary);
        assert.deepEqual(consoleSnapshotContractProjection(routeSummary, normalize), expectedSummary);
        assert.deepEqual(consoleReadinessContractProjection(directReadiness, normalize), expectedReadiness);
        assert.deepEqual(consoleReadinessContractProjection(routeReadiness, normalize), expectedReadiness);
        assert.deepEqual(health, {
          status: 'ok',
          readOnly: true
        });
      } finally {
        if (server !== undefined) {
          await closeServer(server);
        }

        await rm(root, { recursive: true, force: true });
      }
    });

    it('freezes active, blocked, and charter-inconsistent Stage summary scenarios', async () => {
      const root = await mkdtemp(join(tmpdir(), 'symphony-v15-console-stage-'));

      try {
        const activeStateDir = join(root, 'active-state');
        const blockedStateDir = join(root, 'blocked-state');
        const mismatchStateDir = join(root, 'mismatch-state');

        await writeV15ConsoleStageState({
          stateDir: activeStateDir,
          status: 'active'
        });
        await writeV15ConsoleStageState({
          stateDir: blockedStateDir,
          status: 'blocked'
        });
        await writeV15ConsoleStageState({
          stateDir: mismatchStateDir,
          stageId: V15_CONSOLE_CONTRACT_MISSING_STAGE_ID,
          status: 'attention'
        });

        const activeSummary = await buildConsoleSnapshot({
          stateDir: activeStateDir,
          generatedAt: V15_CONSOLE_CONTRACT_GENERATED_AT
        });
        const blockedSummary = await buildConsoleSnapshot({
          stateDir: blockedStateDir,
          generatedAt: V15_CONSOLE_CONTRACT_GENERATED_AT
        });
        const mismatchSummary = await buildConsoleSnapshot({
          stateDir: mismatchStateDir,
          generatedAt: V15_CONSOLE_CONTRACT_GENERATED_AT
        });

        assert.deepEqual(stageScenarioContractProjection(activeSummary), {
          snapshotStatus: 'no-runs',
          overviewStatus: 'ready',
          overviewTopRiskCategories: [],
          overviewStage: {
            stageId: V15_CONSOLE_CONTRACT_STAGE_ID,
            status: 'active',
            active: true,
            blockerReason: null
          },
          stageStatus: 'active',
          active: true,
          activeStageId: V15_CONSOLE_CONTRACT_STAGE_ID,
          stageIdFromStage: V15_CONSOLE_CONTRACT_STAGE_ID,
          blocker: null,
          gateEventStatuses: [],
          consistency: {
            status: 'passed',
            stageId: V15_CONSOLE_CONTRACT_STAGE_ID,
            errorCodes: []
          },
          nextAction: 'symphony do --dry-run "inspect README"'
        });
        assert.deepEqual(stageScenarioContractProjection(blockedSummary), {
          snapshotStatus: 'no-runs',
          overviewStatus: 'blocked',
          overviewTopRiskCategories: ['stage_blocker'],
          overviewStage: {
            stageId: V15_CONSOLE_CONTRACT_STAGE_ID,
            status: 'blocked',
            active: true,
            blockerReason: 'stage-charter-inconsistent'
          },
          stageStatus: 'blocked',
          active: true,
          activeStageId: V15_CONSOLE_CONTRACT_STAGE_ID,
          stageIdFromStage: V15_CONSOLE_CONTRACT_STAGE_ID,
          blocker: {
            status: 'blocked',
            reason: 'stage-charter-inconsistent',
            actionKind: 'do',
            highRisk: false,
            repairArtifactKind: 'charter-repair-plan',
            blockedSnapshotKind: 'blocked-snapshot'
          },
          gateEventStatuses: ['blocked'],
          consistency: {
            status: 'passed',
            stageId: V15_CONSOLE_CONTRACT_STAGE_ID,
            errorCodes: []
          },
          nextAction: 'symphony stage render v14-stage-kernel-refactor --write'
        });
        assert.deepEqual(stageScenarioContractProjection(mismatchSummary), {
          snapshotStatus: 'no-runs',
          overviewStatus: 'ready',
          overviewTopRiskCategories: ['stage_charter_inconsistent'],
          overviewStage: {
            stageId: V15_CONSOLE_CONTRACT_MISSING_STAGE_ID,
            status: 'attention',
            active: true,
            blockerReason: null
          },
          stageStatus: 'attention',
          active: true,
          activeStageId: null,
          stageIdFromStage: null,
          blocker: null,
          gateEventStatuses: [],
          consistency: {
            status: 'failed',
            stageId: V15_CONSOLE_CONTRACT_MISSING_STAGE_ID,
            errorCodes: [
              'stage-charter-invalid',
              'stage-charter-html-missing'
            ]
          },
          nextAction: 'symphony stage render v15-missing-charter-fixture --write'
        });
      } finally {
        await rm(root, { recursive: true, force: true });
      }
    });

    it('freezes run list, latest run, timeline, and artifact preview route contracts', async () => {
      const root = await mkdtemp(join(tmpdir(), 'symphony-v15-console-routes-'));
      let server;

      try {
        const stateDir = join(root, '.symphony');
        const fixture = await writeV15ConsoleRunFixture({ root, stateDir });
        const normalize = createV15ConsoleFixtureNormalizer({ root, stateDir });

        server = createSymphonyConsoleServer({ stateDir });
        const baseUrl = await listenOnRandomPort(server);
        const summary = await (await fetch(`${baseUrl}/api/summary`)).json();
        const runs = await (await fetch(`${baseUrl}/api/runs`)).json();
        const latest = await (await fetch(`${baseUrl}/api/runs/latest`)).json();
        const timeline = await (await fetch(`${baseUrl}/api/runs/${V15_CONSOLE_CONTRACT_RUN_ID}/timeline`)).json();
        const filePreview = await (await fetch(`${baseUrl}/api/runs/${V15_CONSOLE_CONTRACT_RUN_ID}/artifacts/summary`)).json();
        const directoryPreview = await (await fetch(`${baseUrl}/api/runs/${V15_CONSOLE_CONTRACT_RUN_ID}/artifacts/evidence`)).json();
        const missingPreviewResponse = await fetch(`${baseUrl}/api/runs/${V15_CONSOLE_CONTRACT_RUN_ID}/artifacts/context`);
        const missingKindResponse = await fetch(`${baseUrl}/api/runs/${V15_CONSOLE_CONTRACT_RUN_ID}/artifacts/proof`);
        const missingPreview = await missingPreviewResponse.json();
        const missingKind = await missingKindResponse.json();

        summary.generatedAt = V15_CONSOLE_CONTRACT_GENERATED_AT;

        assert.equal(summary.status, 'ready');
        assert.equal(summary.stageSummary.active, false);
        assert.equal(summary.overview.latestRunId, V15_CONSOLE_CONTRACT_RUN_ID);
        assert.equal(summary.latestRun.runId, V15_CONSOLE_CONTRACT_RUN_ID);
        assert.equal(summary.latestRun.modelInvocation, false);
        assert.equal(summary.latestRun.artifactRefs.map((artifact) => artifact.kind).join(','), 'context,summary,evidence,harness');
        assert.equal(summary.latestRun.artifactStatus.status, 'missing');
        assert.equal(summary.riskSummary.items.some((risk) => risk.category === 'missing_artifacts'), true);
        assert.deepEqual(consoleRunsRouteProjection(runs, normalize), {
          keys: [
            'availableFilters',
            'contractName',
            'contractVersion',
            'filter',
            'runs'
          ],
          contractVersion: '1',
          contractName: 'symphony.console-runs',
          filter: 'all',
          availableFilters: [
            'all',
            'passed',
            'failed',
            'dry-run',
            'real',
            'scan',
            'verify',
            'adoption'
          ],
          runs: [{
            keys: [
              'artifactHealth',
              'artifactRefs',
              'artifactStatus',
              'changedFiles',
              'command',
              'commandGroups',
              'createdAt',
              'destructiveWrites',
              'evidenceArtifactPath',
              'executionMode',
              'externalCalls',
              'intent',
              'modelInvocation',
              'nextAction',
              'pipeline',
              'projectWrites',
              'recommendedCommands',
              'riskSummary',
              'routeDecision',
              'runId',
              'runtimeWrites',
              'safetyMode',
              'semanticCommand',
              'status',
              'timeline',
              'updatedAt',
              'verifierStatus'
            ],
            runId: V15_CONSOLE_CONTRACT_RUN_ID,
            command: 'symphony do',
            semanticCommand: 'do',
            status: 'passed',
            verifierStatus: 'passed',
            safetyMode: 'dry-run',
            executionMode: 'dry-run',
            modelInvocation: false,
            evidenceArtifactPath: '<ROOT>/artifacts/evidence-dir',
            hasCapabilities: false,
            artifactRefs: [
              ['context', '<ROOT>/artifacts/missing-context.json'],
              ['summary', '<ROOT>/artifacts/summary.json'],
              ['evidence', '<ROOT>/artifacts/evidence-dir'],
              ['harness', '<ROOT>/artifacts/harness.txt']
            ],
            artifactHealth: {
              status: 'registered',
              total: 4,
              kinds: ['context', 'summary', 'evidence', 'harness']
            },
            artifactStatus: {
              status: 'missing',
              total: 4,
              available: 3,
              missing: 1,
              unknown: 0,
              missingKinds: ['context'],
              missingRefs: [
                ['context', '<ROOT>/artifacts/missing-context.json', 'missing']
              ]
            },
            timeline: [
              ['created', 'done'],
              ['route', 'done'],
              ['safety', 'done'],
              ['execution', 'done'],
              ['verification', 'done'],
              ['artifacts', 'done']
            ],
            riskSummary: {
              status: 'attention',
              total: 2,
              counts: {
                high: 1,
                medium: 0,
                low: 1
              },
              categories: ['runtime_writes', 'missing_artifacts'],
              ids: [
                'v15-contract-run:runtime_writes',
                'v15-contract-run:missing_artifacts'
              ]
            },
            recommendedCommands: [
              ['next', 'symphony artifacts v15-contract-run', 'Artifacts', 'copy-only'],
              ['status', 'symphony status', 'Inspect', 'copy-only']
            ],
            commandGroups: [
              ['Inspect', ['status']],
              ['Artifacts', ['next']]
            ],
            nextAction: 'symphony artifacts v15-contract-run',
            createdAt: '2026-05-27T00:00:00.000Z',
            updatedAt: '2026-05-27T00:00:00.000Z'
          }]
        });
        assert.deepEqual(consoleRunRouteProjection(latest, normalize), {
          keys: [
            'contractName',
            'contractVersion',
            'rawRunState',
            'run'
          ],
          contractVersion: '1',
          contractName: 'symphony.console-run',
          run: consoleRunProjection(runs.runs[0], normalize),
          rawRunState: {
            contractName: 'symphony.run-state',
            contractVersion: '1',
            runId: V15_CONSOLE_CONTRACT_RUN_ID,
            status: 'passed',
            modelInvocation: false,
            artifactPathFields: [
              ['contextArtifactPath', '<ROOT>/artifacts/missing-context.json'],
              ['summaryArtifactPath', '<ROOT>/artifacts/summary.json'],
              ['evidenceArtifactPath', '<ROOT>/artifacts/evidence-dir'],
              ['harnessOutputPath', '<ROOT>/artifacts/harness.txt']
            ]
          }
        });
        assert.deepEqual(consoleTimelineRouteProjection(timeline), {
          keys: [
            'contractName',
            'contractVersion',
            'recommendedCommands',
            'runId',
            'timeline'
          ],
          contractVersion: '1',
          contractName: 'symphony.console-run-timeline',
          runId: V15_CONSOLE_CONTRACT_RUN_ID,
          timeline: [
            ['created', 'done'],
            ['route', 'done'],
            ['safety', 'done'],
            ['execution', 'done'],
            ['verification', 'done'],
            ['artifacts', 'done']
          ],
          recommendedCommandIds: ['next', 'status']
        });
        assert.deepEqual(artifactPreviewContractProjection(filePreview, normalize), {
          httpStatus: 200,
          keys: ['artifact', 'contractName', 'contractVersion', 'runId'],
          contractVersion: '1',
          contractName: 'symphony.console-artifact',
          runId: V15_CONSOLE_CONTRACT_RUN_ID,
          artifact: {
            keys: [
              'artifactKind',
              'content',
              'displayTitle',
              'downloadAvailable',
              'format',
              'json',
              'kind',
              'maxPreviewBytes',
              'mime',
              'path',
              'previewAvailable',
              'previewLimitBytes',
              'ref',
              'safePreview',
              'safeToRenderInline',
              'size',
              'sizeBytes',
              'sourceRunId',
              'title',
              'truncated',
              'truncationReason',
              'type',
              'uri'
            ],
            kind: 'summary',
            path: '<ROOT>/artifacts/summary.json',
            type: 'file',
            format: 'json',
            truncated: false,
            size: fixture.summaryContent.length,
            previewLimitBytes: 200 * 1024,
            content: fixture.summaryContent,
            json: {
              kind: 'v15-console-summary',
              runId: V15_CONSOLE_CONTRACT_RUN_ID,
              stable: true
            },
            contractGapFieldsPresent: artifactContractGapFields()
          }
        });
        assert.deepEqual(artifactPreviewContractProjection(directoryPreview, normalize), {
          httpStatus: 200,
          keys: ['artifact', 'contractName', 'contractVersion', 'runId'],
          contractVersion: '1',
          contractName: 'symphony.console-artifact',
          runId: V15_CONSOLE_CONTRACT_RUN_ID,
          artifact: {
            keys: [
              'artifactKind',
              'displayTitle',
              'downloadAvailable',
              'format',
              'kind',
              'maxPreviewBytes',
              'mime',
              'path',
              'previewAvailable',
              'ref',
              'safePreview',
              'safeToRenderInline',
              'sizeBytes',
              'sourceRunId',
              'title',
              'truncated',
              'truncationReason',
              'type',
              'uri'
            ],
            kind: 'evidence',
            path: '<ROOT>/artifacts/evidence-dir',
            type: 'directory',
            format: 'not-previewable',
            truncated: false,
            contractGapFieldsPresent: artifactContractGapFields()
          }
        });
        assert.equal(missingPreviewResponse.status, 404);
        assert.deepEqual(artifactPreviewContractProjection(missingPreview, normalize), {
          httpStatus: 404,
          keys: [
            'artifact',
            'contractName',
            'contractVersion',
            'runId',
            'status'
          ],
          contractVersion: '1',
          contractName: 'symphony.console-artifact',
          runId: V15_CONSOLE_CONTRACT_RUN_ID,
          status: 'missing-artifact',
          artifact: {
            keys: [
              'artifactKind',
              'displayTitle',
              'downloadAvailable',
              'format',
              'kind',
              'maxPreviewBytes',
              'message',
              'mime',
              'path',
              'previewAvailable',
              'ref',
              'safePreview',
              'safeToRenderInline',
              'sizeBytes',
              'sourceRunId',
              'status',
              'title',
              'truncated',
              'truncationReason',
              'type',
              'uri'
            ],
            kind: 'context',
            path: '<ROOT>/artifacts/missing-context.json',
            type: 'missing',
            format: 'not-previewable',
            truncated: false,
            message: 'artifact file is missing',
            contractGapFieldsPresent: artifactContractGapFields()
          }
        });
        assert.equal(missingKindResponse.status, 404);
        assert.deepEqual(artifactPreviewContractProjection(missingKind, normalize), {
          httpStatus: 404,
          keys: [
            'artifactKind',
            'contractName',
            'contractVersion',
            'runId',
            'status'
          ],
          contractVersion: '1',
          contractName: 'symphony.console-artifact',
          runId: V15_CONSOLE_CONTRACT_RUN_ID,
          status: 'missing',
          artifactKind: 'proof'
        });
      } finally {
        if (server !== undefined) {
          await closeServer(server);
        }

        await rm(root, { recursive: true, force: true });
      }
    });

    it('freezes pending and dirty adoption inspection contracts', async () => {
      const root = await mkdtemp(join(tmpdir(), 'symphony-v15-console-adoption-'));
      let server;

      try {
        const stateDir = join(root, '.symphony');
        const fixture = await writeV15ConsoleAdoptionFixture({ root, stateDir });
        const normalize = createV15ConsoleFixtureNormalizer({ root, stateDir });

        server = createSymphonyConsoleServer({
          stateDir,
          cwd: root,
          runner: new DirtyGitReadinessRunner(),
          env: {
            MCAS_RUN_REAL_CODEX: '1'
          }
        });
        const baseUrl = await listenOnRandomPort(server);
        const summary = await (await fetch(`${baseUrl}/api/summary`)).json();
        const readiness = await (await fetch(`${baseUrl}/api/readiness`)).json();
        const inspect = await (await fetch(`${baseUrl}/api/adoptions/${V15_CONSOLE_CONTRACT_ADOPTION_ID}/inspect`)).json();

        readiness.generatedAt = V15_CONSOLE_CONTRACT_GENERATED_AT;

        assert.equal(summary.adoptionSummary.status, 'pending');
        assert.equal(summary.adoptionSummary.pendingCount, 1);
        assert.equal(summary.latestRun.adoptionPlanId, V15_CONSOLE_CONTRACT_ADOPTION_ID);
        assert.equal(summary.latestRun.artifactRefs.some((artifact) => artifact.kind === 'adoption-plan'), true);
        assert.equal(summary.latestRun.artifactRefs.some((artifact) => artifact.kind === 'adoption-patch'), true);
        assert.equal(summary.overview.topRisks.some((risk) => risk.category === 'pending_adoption'), true);
        assert.equal(readiness.tools.git.dirty, true);
        assert.equal(readiness.tools.git.dirtyFilesCount, 2);
        assert.deepEqual(readiness.tools.git.dirtyPaths, ['README.md', 'src/fixture.js']);
        assert.equal(readiness.riskSummary.items.some((risk) => risk.category === 'dirty_git'), true);
        assert.equal(readiness.readOnly, true);
        assert.equal(readiness.modelInvocation, false);
        assert.equal(Object.hasOwn(readiness, 'capabilities'), false);
        assert.deepEqual(adoptionInspectContractProjection(inspect, normalize), {
          keys: [
            'adoptionPlanArtifactPath',
            'adoptionPlanId',
            'adoptionPlanRefs',
            'changedFiles',
            'command',
            'contractName',
            'contractVersion',
            'currentWorktreeMatchesAfterHash',
            'currentWorktreeMatchesAfterHashDetails',
            'currentWorktreeMatchesJournalBeforeFiles',
            'currentWorktreeMatchesJournalBeforeFilesDetails',
            'destructiveWrites',
            'executionPlanArtifactPath',
            'executionPlanId',
            'exitCode',
            'externalCalls',
            'fileOperations',
            'intent',
            'journal',
            'journalRef',
            'latestConfirmationRun',
            'mainWorktreeWrites',
            'nextAction',
            'patchArtifactPath',
            'patchHash',
            'pipeline',
            'projectWrites',
            'recommendedCommands',
            'runtimeWrites',
            'safetyMode',
            'semanticCommand',
            'sourceRun',
            'sourceRunArtifactPath',
            'sourceRunId',
            'stageAdoptionSummary',
            'stageBinding',
            'status',
            'verifierStatus',
            'version',
            'workspaceWrites'
          ],
          contractVersion: '1',
          contractName: 'symphony.console-adoption-inspect',
          status: 'inspected',
          safety: {
            safetyMode: 'read-only',
            projectWrites: false,
            mainWorktreeWrites: false,
            workspaceWrites: false,
            runtimeWrites: false,
            externalCalls: false,
            destructiveWrites: false,
            verifierStatus: 'not-run'
          },
          adoptionPlanId: V15_CONSOLE_CONTRACT_ADOPTION_ID,
          adoptionPlanArtifactPath: '<STATE_DIR>/adoptions/adopt-v15-contract.json',
          adoptionJournalArtifactPath: null,
          adoptionPlanRefs: {
            adoptionPlanArtifactPath: '<STATE_DIR>/adoptions/adopt-v15-contract.json',
            executionPlanArtifactPath: '<ROOT>/artifacts/execution-plan.json',
            patchArtifactPath: '<ROOT>/artifacts/adopt.patch',
            sourceRunArtifactPath: '<STATE_DIR>/runs/source-v15-contract-run.json'
          },
          journalRef: null,
          sourceRun: {
            runId: 'source-v15-contract-run',
            artifactPath: '<STATE_DIR>/runs/source-v15-contract-run.json',
            verifierStatus: 'passed',
            workspacePath: '<ROOT>/workspace',
            workspaceManifestPath: '<ROOT>/workspace/workspace-manifest.json'
          },
          executionPlanId: 'plan-v15-contract',
          executionPlanArtifactPath: '<ROOT>/artifacts/execution-plan.json',
          patchArtifactPath: '<ROOT>/artifacts/adopt.patch',
          patchHash: 'sha256:v15patchfixture',
          changedFiles: ['README.md'],
          fileOperations: [{
            path: 'README.md',
            operation: 'modify',
            afterHash: fixture.afterHash,
            size: fixture.afterContent.length,
            textEncoding: 'utf8'
          }],
          stageBinding: {
            stageId: V15_CONSOLE_CONTRACT_STAGE_ID,
            bindingSource: 'active-stage',
            boundaryCheckStatus: 'passed'
          },
          stageAdoptionSummary: {
            behavior: 'summary-only',
            v12ApplyLogicChanged: false,
            stageId: V15_CONSOLE_CONTRACT_STAGE_ID,
            adoptionPlanId: V15_CONSOLE_CONTRACT_ADOPTION_ID
          },
          journal: null,
          latestConfirmationRun: null,
          currentWorktreeMatchesAfterHash: true,
          currentWorktreeMatchesJournalBeforeFiles: null,
          currentWorktreeMatchesAfterHashDetails: {
            matches: true,
            files: [{
              path: 'README.md',
              matches: true,
              expected: {
                exists: true,
                hash: fixture.afterHash,
                size: fixture.afterContent.length,
                textEncoding: 'utf8'
              },
              actual: {
                path: 'README.md',
                exists: true,
                hash: fixture.afterHash,
                size: fixture.afterContent.length,
                textEncoding: 'utf8'
              }
            }]
          },
          currentWorktreeMatchesJournalBeforeFilesDetails: {
            matches: null,
            reason: 'adoption journal not found',
            files: []
          },
          recommendedCommands: [
            ['inspect-adoption', "symphony adopt --inspect adopt-v15-contract --state-dir '<STATE_DIR>' --json", 'copy-only'],
            ['confirm-adoption', 'symphony adopt --confirm adopt-v15-contract --state-dir <STATE_DIR>', 'copy-only'],
            ['status', 'symphony status', 'copy-only'],
            ['diagnose', "symphony diagnose --state-dir '<STATE_DIR>' --json", 'copy-only']
          ],
          nextAction: 'symphony adopt --confirm adopt-v15-contract --state-dir <STATE_DIR>',
          hasCapabilities: false,
          hasModelInvocation: false
        });
      } finally {
        if (server !== undefined) {
          await closeServer(server);
        }

        await rm(root, { recursive: true, force: true });
      }
    });
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
      assert.equal(summary.projectKind, 'node-cli');
      assert.equal(summary.networkInstall, false);
      assert.equal(existsSync(summary.scaffoldPlanArtifactPath), true);
      assert.equal(summary.routeDecision.intent, 'new-project');
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it('plans framework-flavored new project prompts without installing dependencies', async () => {
    const root = await mkdtemp(join(tmpdir(), 'symphony-v8-new-react-prompt-'));

    try {
      const output = createOutput();
      const exitCode = await runSymphonyCli({
        argv: [
          '--json',
          '创建一个新的 React 看板项目',
          '--dry-run',
          '--runtime-dir',
          join(root, 'runtime'),
          '--state-dir',
          join(root, '.symphony')
        ],
        stdout: output.stdout,
        stderr: output.stderr
      });

      assert.equal(exitCode, 0);
      assert.equal(output.stderrText(), '');

      const summary = JSON.parse(output.stdoutText());
      const planArtifact = JSON.parse(await readFile(summary.scaffoldPlanArtifactPath, 'utf8'));
      const manifestArtifact = JSON.parse(await readFile(summary.scaffoldManifestArtifactPath, 'utf8'));

      assert.equal(summary.intent, 'new-project');
      assert.equal(summary.projectKind, 'web-app');
      assert.deepEqual(summary.detectedStack.frameworks, ['react']);
      assert.deepEqual(summary.detectedStack.features, ['board']);
      assert.equal(summary.projectWrites, false);
      assert.equal(summary.networkInstall, false);
      assert.equal(summary.scaffoldPlan.networkInstall, false);
      assert.deepEqual(summary.unsupportedRequests, [{
        request: 'react',
        reason: 'framework generators and dependency installation are disabled'
      }]);
      assert.equal(existsSync(summary.targetDir), false);
      assert.equal(existsSync(summary.scaffoldPlanArtifactPath), true);
      assert.equal(existsSync(summary.scaffoldManifestArtifactPath), true);
      assert.deepEqual(planArtifact, summary.scaffoldPlan);
      assert.deepEqual(manifestArtifact.scaffoldPlan, summary.scaffoldPlan);
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

function createV15ConsoleFixtureNormalizer({ root, stateDir }) {
  const replacements = [
    [stateDir, '<STATE_DIR>'],
    [root, '<ROOT>'],
    [process.execPath, '<NODE_EXECUTABLE>']
  ].filter(([value]) => typeof value === 'string' && value !== '')
    .sort(([left], [right]) => right.length - left.length);

  function normalize(value) {
    if (typeof value === 'string') {
      let normalized = value;

      for (const [actual, marker] of replacements) {
        normalized = normalized.replaceAll(actual, marker);
      }

      return normalized;
    }

    if (Array.isArray(value)) {
      return value.map((entry) => normalize(entry));
    }

    if (value !== null && typeof value === 'object') {
      return Object.fromEntries(
        Object.entries(value).map(([key, entryValue]) => [key, normalize(entryValue)])
      );
    }

    return value;
  }

  return normalize;
}

function consoleSnapshotContractProjection(snapshot, normalize) {
  return {
    keys: sortedKeys(snapshot),
    contractName: snapshot.contractName,
    contractVersion: snapshot.contractVersion,
    contract: snapshot.contract,
    generatedAt: snapshot.generatedAt,
    stateDir: normalize(snapshot.stateDir),
    status: snapshot.status,
    hasCapabilities: Object.hasOwn(snapshot, 'capabilities'),
    overview: {
      keys: sortedKeys(snapshot.overview),
      status: snapshot.overview.status,
      headline: snapshot.overview.headline,
      latestRunId: snapshot.overview.latestRunId ?? null,
      latestRun: snapshot.overview.latestRun ?? null,
      runCount: snapshot.overview.runCount,
      topRiskCategories: snapshot.overview.topRisks.map((risk) => risk.category),
      stage: snapshot.overview.stage === undefined
        ? null
        : {
            stageId: snapshot.overview.stage.stageId,
            status: snapshot.overview.stage.status,
            active: snapshot.overview.stage.active,
            blockerReason: snapshot.overview.stage.blocker?.reason ?? null
          },
      nextAction: snapshot.overview.nextAction,
      adoptionStatus: snapshot.overview.adoptionStatus
    },
    stage: stageSummaryContractProjection(snapshot.stageSummary),
    adoptionSummary: snapshot.adoptionSummary,
    latestContext: snapshot.latestContext,
    latestRun: snapshot.latestRun === null ? null : consoleRunProjection(snapshot.latestRun, normalize),
    runs: snapshot.runs.map((run) => consoleRunProjection(run, normalize)),
    adoptionPlans: normalize(snapshot.adoptionPlans),
    adoptionJournals: normalize(snapshot.adoptionJournals),
    runStats: {
      total: snapshot.runStats.total,
      recentRunIds: snapshot.runStats.recentRuns.map((run) => run.runId),
      failedCount: snapshot.runStats.failedCount,
      verifier: snapshot.runStats.verifier,
      artifacts: snapshot.runStats.artifacts,
      filters: snapshot.runStats.filters.map((filter) => [filter.id, filter.count])
    },
    riskSummary: riskSummaryProjection(snapshot.riskSummary),
    recommendedCommands: commandTupleProjection(snapshot.recommendedCommands, normalize),
    commandGroups: commandGroupProjection(snapshot.commandGroups),
    action: snapshot.action
  };
}

function stageSummaryContractProjection(stageSummary) {
  return {
    status: stageSummary.status,
    stageId: stageSummary.stageId,
    active: stageSummary.active,
    activeStageId: stageSummary.activeStage?.stageId ?? null,
    stageIdFromStage: stageSummary.stage?.stageId ?? null,
    topRiskIds: stageSummary.topRisks.map((risk) => risk.id),
    blocker: stageSummary.blocker === null
      ? null
      : {
          status: stageSummary.blocker.status,
          reason: stageSummary.blocker.reason,
          actionKind: stageSummary.blocker.action?.kind ?? null,
          highRisk: stageSummary.blocker.highRisk,
          repairArtifactKind: stageSummary.blocker.repairArtifactRef?.kind,
          blockedSnapshotKind: stageSummary.blocker.blockedSnapshotRef?.kind
        },
    blockedSnapshot: stageSummary.blockedSnapshot === null
      ? null
      : {
          kind: stageSummary.blockedSnapshot.kind,
          stageId: stageSummary.blockedSnapshot.stageId,
          blockedReason: stageSummary.blockedSnapshot.blockedReason
        },
    blockedSnapshotRef: stageSummary.blockedSnapshotRef === null
      ? null
      : {
          kind: stageSummary.blockedSnapshotRef.kind,
          uri: stageSummary.blockedSnapshotRef.uri
        },
    repairArtifactRef: stageSummary.repairArtifactRef === null
      ? null
      : {
          kind: stageSummary.repairArtifactRef.kind,
          uri: stageSummary.repairArtifactRef.uri
        },
    gateEventStatuses: stageSummary.gateEvents.map((event) => event.status),
    consistency: {
      status: stageSummary.consistency.status,
      stageId: stageSummary.consistency.stageId,
      errorCodes: stageSummary.consistency.errors.map((error) => error.code)
    },
    nextAction: stageSummary.nextAction
  };
}

function stageScenarioContractProjection(snapshot) {
  return {
    snapshotStatus: snapshot.status,
    overviewStatus: snapshot.overview.status,
    overviewTopRiskCategories: snapshot.overview.topRisks.map((risk) => risk.category),
    overviewStage: snapshot.overview.stage === undefined
      ? null
      : {
          stageId: snapshot.overview.stage.stageId,
          status: snapshot.overview.stage.status,
          active: snapshot.overview.stage.active,
          blockerReason: snapshot.overview.stage.blocker?.reason ?? null
        },
    stageStatus: snapshot.stageSummary.status,
    active: snapshot.stageSummary.active,
    activeStageId: snapshot.stageSummary.activeStage?.stageId ?? null,
    stageIdFromStage: snapshot.stageSummary.stage?.stageId ?? null,
    blocker: stageSummaryContractProjection(snapshot.stageSummary).blocker,
    gateEventStatuses: snapshot.stageSummary.gateEvents.map((event) => event.status),
    consistency: {
      status: snapshot.stageSummary.consistency.status,
      stageId: snapshot.stageSummary.consistency.stageId,
      errorCodes: snapshot.stageSummary.consistency.errors.map((error) => error.code)
    },
    nextAction: snapshot.stageSummary.nextAction
  };
}

function consoleReadinessContractProjection(readiness, normalize) {
  return {
    keys: sortedKeys(readiness),
    contractName: readiness.contractName,
    contractVersion: readiness.contractVersion,
    contract: readiness.contract,
    generatedAt: readiness.generatedAt,
    stateDir: normalize(readiness.stateDir),
    cwd: normalize(readiness.cwd),
    status: readiness.status,
    readOnly: readiness.readOnly,
    modelInvocation: readiness.modelInvocation,
    hasCapabilities: Object.hasOwn(readiness, 'capabilities'),
    tools: {
      node: {
        status: readiness.tools.node.status,
        version: '<NODE_VERSION>',
        executable: normalize(readiness.tools.node.executable)
      },
      packageManager: normalize(readiness.tools.packageManager),
      git: normalize(readiness.tools.git),
      github: normalize(readiness.tools.github),
      realCli: {
        status: readiness.tools.realCli.status,
        adapters: readiness.tools.realCli.adapters.map((adapter) => [
          adapter.adapterId,
          adapter.status,
          adapter.gate.status,
          adapter.modelInvocation
        ])
      }
    },
    checks: readiness.checks.map((check) => [check.id, check.status]),
    riskSummary: riskSummaryProjection(readiness.riskSummary),
    recommendedCommandIds: readiness.recommendedCommands.map((command) => command.id),
    commandGroups: commandGroupProjection(readiness.commandGroups)
  };
}

function consoleRunsRouteProjection(runsResponse, normalize) {
  return {
    keys: sortedKeys(runsResponse),
    contractVersion: runsResponse.contractVersion,
    contractName: runsResponse.contractName,
    filter: runsResponse.filter,
    availableFilters: runsResponse.availableFilters,
    runs: runsResponse.runs.map((run) => consoleRunProjection(run, normalize))
  };
}

function consoleRunRouteProjection(runResponse, normalize) {
  return {
    keys: sortedKeys(runResponse),
    contractVersion: runResponse.contractVersion,
    contractName: runResponse.contractName,
    run: consoleRunProjection(runResponse.run, normalize),
    rawRunState: {
      contractName: runResponse.rawRunState.contractName,
      contractVersion: runResponse.rawRunState.contractVersion,
      runId: runResponse.rawRunState.runId,
      status: runResponse.rawRunState.status,
      modelInvocation: runResponse.rawRunState.modelInvocation,
      artifactPathFields: [
        ['contextArtifactPath', normalize(runResponse.rawRunState.contextArtifactPath)],
        ['summaryArtifactPath', normalize(runResponse.rawRunState.summaryArtifactPath)],
        ['evidenceArtifactPath', normalize(runResponse.rawRunState.evidenceArtifactPath)],
        ['harnessOutputPath', normalize(runResponse.rawRunState.harnessOutputPath)]
      ]
    }
  };
}

function consoleRunProjection(run, normalize) {
  return {
    keys: sortedKeys(run),
    runId: run.runId,
    command: run.command,
    semanticCommand: run.semanticCommand,
    status: run.status,
    verifierStatus: run.verifierStatus,
    safetyMode: run.safetyMode,
    executionMode: run.executionMode,
    modelInvocation: run.modelInvocation,
    evidenceArtifactPath: normalize(run.evidenceArtifactPath),
    hasCapabilities: Object.hasOwn(run, 'capabilities'),
    artifactRefs: run.artifactRefs.map((artifact) => [artifact.kind, normalize(artifact.path)]),
    artifactHealth: run.artifactHealth,
    artifactStatus: {
      ...run.artifactStatus,
      missingRefs: (run.artifactStatus.missingRefs ?? []).map((artifact) => [
        artifact.kind,
        normalize(artifact.path),
        artifact.status
      ])
    },
    timeline: run.timeline.map((event) => [event.id, event.status]),
    riskSummary: riskSummaryProjection(run.riskSummary),
    recommendedCommands: commandTupleProjection(run.recommendedCommands, normalize),
    commandGroups: commandGroupProjection(run.commandGroups),
    nextAction: run.nextAction,
    createdAt: run.createdAt,
    updatedAt: run.updatedAt
  };
}

function consoleTimelineRouteProjection(timelineResponse) {
  return {
    keys: sortedKeys(timelineResponse),
    contractVersion: timelineResponse.contractVersion,
    contractName: timelineResponse.contractName,
    runId: timelineResponse.runId,
    timeline: timelineResponse.timeline.map((event) => [event.id, event.status]),
    recommendedCommandIds: timelineResponse.recommendedCommands.map((command) => command.id)
  };
}

function artifactPreviewContractProjection(preview, normalize) {
  const base = {
    httpStatus: preview.status === 'missing' || preview.status === 'missing-artifact' ? 404 : 200,
    keys: sortedKeys(preview),
    contractVersion: preview.contractVersion,
    contractName: preview.contractName,
    runId: preview.runId
  };

  if (preview.artifactKind !== undefined) {
    return {
      ...base,
      status: preview.status,
      artifactKind: preview.artifactKind
    };
  }

  const artifact = preview.artifact;

  return {
    ...base,
    ...(preview.status ? { status: preview.status } : {}),
    artifact: {
      keys: sortedKeys(artifact),
      kind: artifact.kind,
      path: normalize(artifact.path),
      type: artifact.type,
      ...(artifact.format ? { format: artifact.format } : {}),
      ...(typeof artifact.truncated === 'boolean' ? { truncated: artifact.truncated } : {}),
      ...(typeof artifact.size === 'number' ? { size: artifact.size } : {}),
      ...(typeof artifact.previewLimitBytes === 'number' ? { previewLimitBytes: artifact.previewLimitBytes } : {}),
      ...(artifact.content !== undefined ? { content: artifact.content } : {}),
      ...(artifact.json !== undefined ? { json: artifact.json } : {}),
      ...(artifact.entries !== undefined
        ? { entries: artifact.entries.map((entry) => [entry.name, entry.type]) }
        : {}),
      ...(typeof artifact.entryCount === 'number' ? { entryCount: artifact.entryCount } : {}),
      ...(typeof artifact.limit === 'number' ? { limit: artifact.limit } : {}),
      ...(artifact.message ? { message: artifact.message } : {}),
      contractGapFieldsPresent: artifactContractGapFields().filter((field) => Object.hasOwn(artifact, field))
    }
  };
}

function adoptionInspectContractProjection(inspect, normalize) {
  return {
    keys: sortedKeys(inspect),
    contractVersion: inspect.contractVersion,
    contractName: inspect.contractName,
    status: inspect.status,
    safety: {
      safetyMode: inspect.safetyMode,
      projectWrites: inspect.projectWrites,
      mainWorktreeWrites: inspect.mainWorktreeWrites,
      workspaceWrites: inspect.workspaceWrites,
      runtimeWrites: inspect.runtimeWrites,
      externalCalls: inspect.externalCalls,
      destructiveWrites: inspect.destructiveWrites,
      verifierStatus: inspect.verifierStatus
    },
    adoptionPlanId: inspect.adoptionPlanId,
    adoptionPlanArtifactPath: normalize(inspect.adoptionPlanArtifactPath),
    adoptionJournalArtifactPath: normalize(inspect.adoptionJournalArtifactPath ?? null),
    adoptionPlanRefs: normalize(inspect.adoptionPlanRefs),
    journalRef: normalize(inspect.journalRef),
    sourceRun: normalize(inspect.sourceRun),
    executionPlanId: inspect.executionPlanId,
    executionPlanArtifactPath: normalize(inspect.executionPlanArtifactPath),
    patchArtifactPath: normalize(inspect.patchArtifactPath),
    patchHash: inspect.patchHash,
    changedFiles: inspect.changedFiles,
    fileOperations: inspect.fileOperations,
    stageBinding: {
      stageId: inspect.stageBinding.stageId,
      bindingSource: inspect.stageBinding.bindingSource,
      boundaryCheckStatus: inspect.stageBinding.boundaryCheck.status
    },
    stageAdoptionSummary: {
      behavior: inspect.stageAdoptionSummary.behavior,
      v12ApplyLogicChanged: inspect.stageAdoptionSummary.v12ApplyLogicChanged,
      stageId: inspect.stageAdoptionSummary.stageId,
      adoptionPlanId: inspect.stageAdoptionSummary.adoptionPlanId
    },
    journal: inspect.journal,
    latestConfirmationRun: inspect.latestConfirmationRun,
    currentWorktreeMatchesAfterHash: inspect.currentWorktreeMatchesAfterHash,
    currentWorktreeMatchesJournalBeforeFiles: inspect.currentWorktreeMatchesJournalBeforeFiles,
    currentWorktreeMatchesAfterHashDetails: inspect.currentWorktreeMatchesAfterHashDetails,
    currentWorktreeMatchesJournalBeforeFilesDetails: inspect.currentWorktreeMatchesJournalBeforeFilesDetails,
    recommendedCommands: inspect.recommendedCommands.map((command) => [
      command.id,
      normalize(command.command),
      command.mode
    ]),
    nextAction: normalize(inspect.nextAction),
    hasCapabilities: Object.hasOwn(inspect, 'capabilities'),
    hasModelInvocation: Object.hasOwn(inspect, 'modelInvocation')
  };
}

function riskSummaryProjection(riskSummary) {
  return {
    status: riskSummary.status,
    total: riskSummary.total,
    counts: riskSummary.counts,
    categories: [...new Set(riskSummary.items.map((risk) => risk.category))],
    ids: riskSummary.items.map((risk) => risk.id)
  };
}

function commandTupleProjection(commands, normalize) {
  return commands.map((command) => [
    command.id,
    normalize(command.command),
    command.group,
    command.mode
  ]);
}

function commandGroupProjection(commandGroups) {
  return commandGroups.map((group) => [
    group.group,
    group.commands.map((command) => command.id)
  ]);
}

function sortedKeys(value) {
  return Object.keys(value).sort();
}

function artifactContractGapFields() {
  return [
    'uri',
    'ref',
    'mime',
    'title',
    'displayTitle',
    'safeToRenderInline',
    'sourceRunId',
    'artifactKind',
    'previewAvailable',
    'sizeBytes'
  ];
}

function assertValidSafePreview(preview) {
  assert.deepEqual(validateSafeArtifactPreviewContract(preview), {
    ok: true,
    errors: []
  });
}

function assertValidErrorEnvelope(envelope, code) {
  assert.deepEqual(validateErrorEnvelopeContract(envelope), {
    ok: true,
    errors: []
  });
  assert.equal(envelope.contractName, 'error-envelope.v1');
  assert.equal(envelope.error.code, code);
}

async function writeV15ConsoleStageState({
  stateDir,
  stageId = V15_CONSOLE_CONTRACT_STAGE_ID,
  status
}) {
  const now = V15_CONSOLE_CONTRACT_GENERATED_AT;
  const blocked = status === 'blocked';
  const gateEventId = 'stage-gate-v15-contract';
  const repairArtifactRef = {
    kind: 'charter-repair-plan',
    taskId: `stage-${stageId}`,
    artifactId: `${gateEventId}-charter-repair-plan`,
    uri: `artifact://stage-${stageId}/${gateEventId}-charter-repair-plan`,
    path: join(stateDir, 'artifacts', `stage-${stageId}`, `${gateEventId}-charter-repair-plan.json`)
  };
  const blockedSnapshotRef = {
    kind: 'blocked-snapshot',
    taskId: `stage-${stageId}`,
    artifactId: `${gateEventId}-blocked-snapshot`,
    uri: `artifact://stage-${stageId}/${gateEventId}-blocked-snapshot`,
    path: join(stateDir, 'artifacts', `stage-${stageId}`, `${gateEventId}-blocked-snapshot.json`)
  };
  const gateEvent = {
    version: '1',
    kind: 'symphony.stage-gate-event',
    contractName: 'symphony.stage-gate-event',
    contractVersion: '1',
    gateEventId,
    stageId,
    action: {
      kind: 'do',
      command: 'symphony do --dry-run "inspect README"',
      semanticCommand: 'do'
    },
    attemptedCommand: 'symphony do --dry-run "inspect README"',
    highRisk: false,
    status: 'blocked',
    reason: 'stage-charter-inconsistent',
    normalRunCreated: false,
    blockedSnapshotRef,
    repairArtifactRef,
    createdAt: now
  };
  const blocker = {
    status: 'blocked',
    reason: 'stage-charter-inconsistent',
    action: gateEvent.action,
    attemptedCommand: gateEvent.attemptedCommand,
    highRisk: false,
    gateEventId,
    gateEventPath: join(stateDir, 'stages', `${stageId}-${gateEventId}.json`),
    repairArtifactRef,
    blockedSnapshotRef,
    repairArtifactPath: repairArtifactRef.path,
    blockedSnapshotPath: blockedSnapshotRef.path,
    createdAt: now
  };
  const stageState = {
    version: '1',
    kind: 'symphony-stage-state',
    stageId,
    status,
    active: true,
    charterPath: `docs/stages/${stageId}.stage.json`,
    htmlPath: `docs/stages/${stageId}.html`,
    charterHash: 'sha256:v15fixturecharter',
    htmlHash: 'sha256:v15fixturehtml',
    consistency: {
      status: blocked ? 'failed' : 'passed',
      stageId,
      errors: []
    },
    blocker: blocked ? blocker : null,
    gateEvents: blocked ? [gateEvent] : [],
    blockedSnapshot: blocked
      ? {
          version: '1',
          kind: 'symphony.stage-blocked-snapshot-summary',
          gateId: gateEventId,
          stageId,
          blockedReason: 'stage-charter-consistency-mismatch',
          highRisk: false,
          createdAt: now
        }
      : null,
    blockedSnapshotRef: blocked ? blockedSnapshotRef : null,
    repairArtifactRef: blocked ? repairArtifactRef : null,
    repairArtifactPath: blocked ? repairArtifactRef.path : null,
    activatedAt: now,
    updatedAt: now
  };

  await writeFixtureJson(join(stateDir, 'stages', `${stageId}.json`), stageState);
  await writeFixtureJson(join(stateDir, 'stages', 'latest.json'), stageState);
}

async function writeV15ConsoleRunFixture({ root, stateDir }) {
  const artifactDir = join(root, 'artifacts');
  const summaryPath = join(artifactDir, 'summary.json');
  const missingContextPath = join(artifactDir, 'missing-context.json');
  const evidencePath = join(artifactDir, 'evidence-dir');
  const harnessPath = join(artifactDir, 'harness.txt');
  const summaryContent = `${JSON.stringify({
    kind: 'v15-console-summary',
    runId: V15_CONSOLE_CONTRACT_RUN_ID,
    stable: true
  })}\n`;
  const runState = diagnosticRunState({
    runId: V15_CONSOLE_CONTRACT_RUN_ID,
    command: 'symphony do',
    semanticCommand: 'do',
    intent: 'work',
    pipeline: ['do'],
    status: 'passed',
    verifierStatus: 'passed',
    safetyMode: 'dry-run',
    executionMode: 'dry-run',
    modelInvocation: false,
    contextArtifactPath: missingContextPath,
    summaryArtifactPath: summaryPath,
    evidenceArtifactPath: evidencePath,
    harnessOutputPath: harnessPath,
    routeDecision: {
      intent: 'work',
      safetyMode: 'dry-run'
    },
    changedFiles: [],
    nextAction: `symphony artifacts ${V15_CONSOLE_CONTRACT_RUN_ID}`,
    updatedAt: V15_CONSOLE_CONTRACT_GENERATED_AT
  });

  await mkdir(evidencePath, { recursive: true });
  await writeFile(summaryPath, summaryContent, 'utf8');
  await writeFile(harnessPath, 'v15 bounded text artifact\n', 'utf8');
  await writeFile(join(evidencePath, 'alpha.txt'), 'alpha\n', 'utf8');
  await mkdir(join(evidencePath, 'nested'), { recursive: true });
  await writeFixtureJson(join(stateDir, 'runs', `${V15_CONSOLE_CONTRACT_RUN_ID}.json`), runState);
  await writeFixtureJson(join(stateDir, 'runs', 'latest.json'), runState);

  return {
    summaryContent
  };
}

async function writeV15ConsoleAdoptionFixture({ root, stateDir }) {
  const afterContent = '# Fixture\n\nAdopted v15 fixture.\n';
  const afterHash = sha256Utf8(afterContent);
  const artifactDir = join(root, 'artifacts');
  const executionPlanPath = join(artifactDir, 'execution-plan.json');
  const patchPath = join(artifactDir, 'adopt.patch');
  const workspacePath = join(root, 'workspace');
  const workspaceManifestPath = join(workspacePath, 'workspace-manifest.json');
  const sourceRunArtifactPath = join(stateDir, 'runs', 'source-v15-contract-run.json');
  const adoptionPlanArtifactPath = join(stateDir, 'adoptions', `${V15_CONSOLE_CONTRACT_ADOPTION_ID}.json`);
  const fileOperations = [{
    path: 'README.md',
    operation: 'modify',
    afterHash,
    size: afterContent.length,
    textEncoding: 'utf8'
  }];
  const stageBinding = {
    stageId: V15_CONSOLE_CONTRACT_STAGE_ID,
    bindingSource: 'active-stage',
    boundaryCheck: {
      status: 'passed',
      riskLevel: 'low',
      goalRelation: 'serves-current-stage',
      nonGoalViolations: [],
      boundaryViolations: []
    }
  };
  const stageAdoptionSummary = {
    version: '1',
    kind: 'symphony.stage-adoption-summary',
    behavior: 'summary-only',
    v12ApplyLogicChanged: false,
    stageId: V15_CONSOLE_CONTRACT_STAGE_ID,
    bindingSource: 'active-stage',
    sourceRunId: 'source-v15-contract-run',
    adoptionPlanId: V15_CONSOLE_CONTRACT_ADOPTION_ID,
    note: 'Stage metadata wraps the adoption summary without changing frozen v12 adoption apply behavior.'
  };
  const plan = {
    kind: 'symphony.adoption-plan',
    contractName: 'symphony.adoption-plan',
    contractVersion: '1',
    adoptionId: V15_CONSOLE_CONTRACT_ADOPTION_ID,
    projectRoot: root,
    sourceRunId: 'source-v15-contract-run',
    sourceRunArtifactPath,
    sourceWorkspacePath: workspacePath,
    sourceWorkspaceManifestPath: workspaceManifestPath,
    sourceWorkspaceFingerprint: 'sha256:v15workspacefixture',
    sourceVerifierStatus: 'passed',
    executionPlanId: 'plan-v15-contract',
    executionPlanArtifactPath: executionPlanPath,
    patchArtifactPath: patchPath,
    patchHash: 'sha256:v15patchfixture',
    changedFiles: ['README.md'],
    fileOperations,
    stageBinding,
    stageAdoptionSummary,
    confirmationCommand: `symphony adopt --confirm ${V15_CONSOLE_CONTRACT_ADOPTION_ID} --state-dir ${stateDir}`,
    createdAt: V15_CONSOLE_CONTRACT_GENERATED_AT
  };
  const adoptionRun = diagnosticRunState({
    runId: 'adoption-plan-v15-contract',
    command: 'symphony adopt',
    semanticCommand: 'adopt',
    intent: 'adopt',
    pipeline: ['adopt'],
    status: 'adoption-planned',
    verifierStatus: 'not-run',
    safetyMode: 'read-only',
    executionMode: 'dry-run',
    modelInvocation: false,
    adoptionPlanId: V15_CONSOLE_CONTRACT_ADOPTION_ID,
    adoptionPlanArtifactPath,
    sourceRunId: 'source-v15-contract-run',
    sourceRunArtifactPath,
    sourceVerifierStatus: 'passed',
    executionPlanId: 'plan-v15-contract',
    executionPlanArtifactPath: executionPlanPath,
    patchArtifactPath: patchPath,
    patchHash: 'sha256:v15patchfixture',
    changedFiles: ['README.md'],
    fileOperations,
    stageBinding,
    stageAdoptionSummary,
    confirmationCommand: plan.confirmationCommand,
    nextAction: plan.confirmationCommand,
    updatedAt: V15_CONSOLE_CONTRACT_GENERATED_AT
  });
  const sourceRun = diagnosticRunState({
    runId: 'source-v15-contract-run',
    command: 'symphony do',
    semanticCommand: 'do',
    intent: 'work',
    status: 'passed',
    verifierStatus: 'passed',
    safetyMode: 'dry-run',
    executionMode: 'dry-run',
    modelInvocation: false,
    sourceWorkspacePath: workspacePath,
    sourceWorkspaceManifestPath: workspaceManifestPath,
    updatedAt: '2026-05-26T23:59:00.000Z'
  });

  await writeFile(join(root, 'README.md'), afterContent, 'utf8');
  await mkdir(workspacePath, { recursive: true });
  await writeFixtureJson(workspaceManifestPath, {
    version: '1',
    workspaceId: 'workspace-v15-contract',
    path: workspacePath
  });
  await writeFixtureJson(executionPlanPath, {
    version: '1',
    planId: 'plan-v15-contract'
  });
  await writeFile(patchPath, 'diff --git a/README.md b/README.md\n+Adopted v15 fixture.\n', 'utf8');
  await writeFixtureJson(sourceRunArtifactPath, sourceRun);
  await writeFixtureJson(join(stateDir, 'runs', 'adoption-plan-v15-contract.json'), adoptionRun);
  await writeFixtureJson(join(stateDir, 'runs', 'latest.json'), adoptionRun);
  await writeFixtureJson(adoptionPlanArtifactPath, plan);

  return {
    afterContent,
    afterHash
  };
}

async function writeFixtureJson(path, value) {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function sha256Utf8(content) {
  return `sha256:${createHash('sha256').update(content).digest('hex')}`;
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

class PreApplyInspectingGitRunner {
  constructor({ onBeforeApply }) {
    this.onBeforeApply = onBeforeApply;
  }

  async run({ executable, args, cwd }) {
    if (executable !== 'git') {
      return commandResult({
        exitCode: 1,
        stderr: `unexpected command: ${executable} ${args.join(' ')}`
      });
    }

    if (args[0] === 'apply' && args[1] !== '--check') {
      await this.onBeforeApply();
    }

    try {
      const result = await execFileAsync('git', args, { cwd });

      return commandResult({
        stdout: result.stdout,
        stderr: result.stderr
      });
    } catch (error) {
      return commandResult({
        exitCode: error.exitCode ?? 1,
        stdout: error.stdout ?? '',
        stderr: error.stderr ?? error.message
      });
    }
  }
}

class ConsoleReadinessRunner {
  async run({ executable, args }) {
    if (executable === 'pnpm' && args[0] === '--version') {
      return commandResult({ stdout: '10.30.3\n' });
    }

    if (executable === 'git' && args.join(' ') === 'rev-parse --is-inside-work-tree') {
      return commandResult({ stdout: 'true\n' });
    }

    if (executable === 'git' && args.join(' ') === 'branch --show-current') {
      return commandResult({ stdout: 'main\n' });
    }

    if (executable === 'git' && args.join(' ') === 'rev-parse --short HEAD') {
      return commandResult({ stdout: 'abc1234\n' });
    }

    if (executable === 'git' && args.join(' ') === 'status --porcelain') {
      return commandResult({ stdout: ' M README.md\n' });
    }

    if (executable === 'gh' && args.join(' ') === 'auth status') {
      return commandResult({
        stderr: 'Logged in to github.com account Andy20010101\nToken: ghp_abcdefghijklmnopqrstuvwxyz123456\n'
      });
    }

    if (executable === 'gh' && args[0] === 'run' && args[1] === 'list') {
      return commandResult({
        stdout: `${JSON.stringify([{
          databaseId: 123,
          workflowName: 'CI',
          displayTitle: 'v8.2',
          status: 'completed',
          conclusion: 'success',
          headBranch: 'main',
          headSha: 'abcdef123456',
          createdAt: '2026-05-23T00:00:00Z'
        }])}\n`
      });
    }

    if (executable === 'codex' && args.join(' ') === '--version') {
      return commandResult({ stdout: 'codex 1.0.0\n' });
    }

    if (executable === 'claude' && args.join(' ') === '--version') {
      return commandResult({
        exitCode: 1,
        stderr: 'missing\n'
      });
    }

    if (executable === 'kiro-cli' && args.join(' ') === '--version') {
      const error = new Error('spawn kiro-cli ENOENT');
      error.code = 'ENOENT';
      throw error;
    }

    return commandResult({
      exitCode: 1,
      stderr: `unexpected command: ${executable} ${args.join(' ')}`
    });
  }
}

class DiagnosticReadinessRunner {
  async run({ executable, args }) {
    if (executable.endsWith('pnpm') && args[0] === '--version') {
      const error = new Error(`spawn ${executable} ENOENT`);
      error.code = 'ENOENT';
      throw error;
    }

    if (executable === 'git' && args.join(' ') === 'rev-parse --is-inside-work-tree') {
      return commandResult({ stdout: 'true\n' });
    }

    if (executable === 'git' && args.join(' ') === 'branch --show-current') {
      return commandResult({ stdout: 'diagnostics\n' });
    }

    if (executable === 'git' && args.join(' ') === 'rev-parse --short HEAD') {
      return commandResult({ stdout: 'def5678\n' });
    }

    if (executable === 'git' && args.join(' ') === 'status --porcelain') {
      return commandResult({ stdout: ' M README.md\n?? tmp.txt\n' });
    }

    if (executable === 'gh' && args.join(' ') === 'auth status') {
      return commandResult({
        stderr: 'Logged in to github.com account Andy20010101\nToken: ghp_abcdefghijklmnopqrstuvwxyz123456\n'
      });
    }

    if (executable === 'gh' && args[0] === 'run' && args[1] === 'list') {
      return commandResult({
        stdout: `${JSON.stringify([{
          databaseId: 321,
          workflowName: 'CI',
          displayTitle: 'diagnostics',
          status: 'completed',
          conclusion: 'success',
          headBranch: 'diagnostics',
          headSha: 'def5678',
          createdAt: '2026-05-23T01:00:00Z'
        }])}\n`
      });
    }

    if (['codex', 'claude', 'kiro-cli'].includes(executable)) {
      const error = new Error(`spawn ${executable} ENOENT`);
      error.code = 'ENOENT';
      throw error;
    }

    return commandResult({
      exitCode: 1,
      stderr: `unexpected command: ${executable} ${args.join(' ')}`
    });
  }
}

class MissingReadinessRunner {
  async run({ executable }) {
    const error = new Error(`spawn ${executable} ENOENT`);
    error.code = 'ENOENT';
    throw error;
  }
}

class DirtyGitReadinessRunner {
  async run({ executable, args }) {
    if (executable === 'pnpm' && args[0] === '--version') {
      return commandResult({ stdout: '10.30.3\n' });
    }

    if (executable === 'git' && args.join(' ') === 'rev-parse --is-inside-work-tree') {
      return commandResult({ stdout: 'true\n' });
    }

    if (executable === 'git' && args.join(' ') === 'branch --show-current') {
      return commandResult({ stdout: 'v15-contract\n' });
    }

    if (executable === 'git' && args.join(' ') === 'rev-parse --short HEAD') {
      return commandResult({ stdout: 'v15abc1\n' });
    }

    if (executable === 'git' && args.join(' ') === 'status --porcelain') {
      return commandResult({ stdout: ' M README.md\n?? src/fixture.js\n' });
    }

    if (executable === 'codex' && args.join(' ') === '--version') {
      return commandResult({ stdout: 'codex 1.0.0\n' });
    }

    const error = new Error(`spawn ${executable} ENOENT`);
    error.code = 'ENOENT';
    throw error;
  }
}

function commandResult({
  exitCode = 0,
  stdout = '',
  stderr = ''
} = {}) {
  return {
    exitCode,
    stdout,
    stderr
  };
}

async function snapshotDirectoryFiles(root) {
  const files = {};

  async function visit(directory, relativeDirectory = '') {
    let entries;

    try {
      entries = await readdir(directory, { withFileTypes: true });
    } catch (error) {
      if (error.code === 'ENOENT') {
        return;
      }

      throw error;
    }

    for (const entry of entries) {
      const relativePath = relativeDirectory === '' ? entry.name : `${relativeDirectory}/${entry.name}`;
      const fullPath = join(directory, entry.name);

      if (entry.isDirectory()) {
        await visit(fullPath, relativePath);
        continue;
      }

      files[relativePath] = await readFile(fullPath, 'utf8');
    }
  }

  await visit(root);
  return files;
}

function diagnosticRunState(overrides) {
  return {
    version: '1',
    kind: 'symphony-run-state',
    contractVersion: '1',
    contractName: 'symphony.run-state',
    pipeline: [overrides.semanticCommand ?? 'do'],
    routeDecision: {
      intent: overrides.intent ?? 'work',
      safetyMode: overrides.safetyMode ?? 'dry-run'
    },
    projectWrites: false,
    runtimeWrites: true,
    externalCalls: false,
    destructiveWrites: false,
    createdAt: overrides.updatedAt,
    nextAction: 'symphony status',
    ...overrides
  };
}

async function fakePassingHarnessRunner({ argv, stdout }) {
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
    changedFiles: [],
    checks: [{
      command: 'fake real harness',
      exitCode: 0
    }]
  }, null, 2)}\n`, 'utf8');

  stdout.write(`${JSON.stringify({
    version: '1',
    command: 'harness run-taskpacket',
    status: 'passed',
    exitCode: 0,
    runId,
    workflowMode: 'qa-swarm',
    executionMode: 'real',
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

async function createConfirmedAdoptionSourceRun({ root, stateDir, workspaceText }) {
  const scanOutput = createOutput();

  await runSymphonyCli({
    argv: [
      'scan',
      '--project-dir',
      root,
      '--output-dir',
      join(stateDir, 'scan-out'),
      '--state-dir',
      stateDir,
      '--json'
    ],
    stdout: scanOutput.stdout,
    stderr: scanOutput.stderr,
    runner: new MissingToolRunner()
  });

  const planOutput = createOutput();

  await runSymphonyCli({
    argv: [
      'do',
      '--project-dir',
      root,
      '--state-dir',
      stateDir,
      '--work-dir',
      join(stateDir, 'work'),
      '--write',
      '--json',
      'edit README'
    ],
    stdout: planOutput.stdout,
    stderr: planOutput.stderr,
    mcasRunner: async () => {
      throw new Error('planning must not invoke the kernel workflow');
    }
  });

  const planned = JSON.parse(planOutput.stdoutText());
  const confirmOutput = createOutput();

  await runSymphonyCli({
    argv: ['do', '--state-dir', stateDir, '--confirm-plan', planned.executionPlanId, '--json'],
    stdout: confirmOutput.stdout,
    stderr: confirmOutput.stderr,
    mcasRunner: (invocation) => fakeAdoptionHarnessRunner(invocation, { workspaceText })
  });

  return JSON.parse(confirmOutput.stdoutText());
}

async function createConfirmedLegacySourceRun({ root, stateDir }) {
  const scanOutput = createOutput();

  await runSymphonyCli({
    argv: [
      'scan',
      '--project-dir',
      root,
      '--output-dir',
      join(stateDir, 'legacy-scan-out'),
      '--state-dir',
      stateDir,
      '--json'
    ],
    stdout: scanOutput.stdout,
    stderr: scanOutput.stderr,
    runner: new MissingToolRunner()
  });

  const planOutput = createOutput();

  await runSymphonyCli({
    argv: [
      'do',
      '--project-dir',
      root,
      '--state-dir',
      stateDir,
      '--work-dir',
      join(stateDir, 'legacy-work'),
      '--write',
      '--json',
      'edit README'
    ],
    stdout: planOutput.stdout,
    stderr: planOutput.stderr,
    mcasRunner: async () => {
      throw new Error('planning must not invoke the kernel workflow');
    }
  });

  const planned = JSON.parse(planOutput.stdoutText());
  const confirmOutput = createOutput();

  await runSymphonyCli({
    argv: ['do', '--state-dir', stateDir, '--confirm-plan', planned.executionPlanId, '--json'],
    stdout: confirmOutput.stdout,
    stderr: confirmOutput.stderr,
    mcasRunner: async (invocation) => fakeControlledHarnessRunner(invocation, [])
  });

  return JSON.parse(confirmOutput.stdoutText());
}

async function fakeAdoptionHarnessRunner({ argv, stdout }, { workspaceText }) {
  assert.equal(argv.includes('--materialize-workspaces'), true);

  const runId = optionValue(argv, '--run-id');
  const runtimeDir = optionValue(argv, '--runtime-dir');
  const artifactDirectory = join(runtimeDir, 'artifacts');
  const workspaceDirectory = join(runtimeDir, 'workspaces');
  const taskId = `symphony.work.${runId}`;
  const artifactId = 'implement-evidence';
  const workspaceId = `${taskId}-primary-writer-1`;
  const workspacePath = join(workspaceDirectory, taskId, workspaceId);
  const workspaceManifestPath = join(workspacePath, 'workspace-manifest.json');

  await mkdir(join(artifactDirectory, taskId), { recursive: true });
  await mkdir(workspacePath, { recursive: true });
  await writeFile(workspaceManifestPath, `${JSON.stringify({
    version: '1',
    workspaceId,
    taskId,
    role: 'primary-writer',
    adapterId: 'codex',
    path: workspacePath,
    writable: true,
    allocatedAt: '2026-05-24T00:00:00.000Z'
  }, null, 2)}\n`, 'utf8');
  await writeFile(join(workspacePath, 'README.md'), workspaceText, 'utf8');
  await writeFile(join(artifactDirectory, taskId, `${artifactId}.json`), `${JSON.stringify({
    version: '1',
    changedFiles: ['README.md'],
    checks: [{
      command: 'fake adoption harness',
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
    workspaceDirectory,
    verifierStatus: 'passed',
    commands: [{
      role: 'primary-writer',
      command: 'implement',
      workspaceId,
      workspacePath,
      workspaceManifestPath,
      artifactId,
      verificationStatus: 'passed'
    }]
  }, null, 2)}\n`);

  return 0;
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
      command: 'controlled dry-run harness',
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

async function listenOnRandomPort(server) {
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      server.off('error', reject);
      resolve();
    });
  });

  return `http://127.0.0.1:${server.address().port}`;
}

async function closeServer(server) {
  if (!server.listening) {
    return;
  }

  await new Promise((resolve, reject) => {
    server.close((error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });
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

async function writeStageFixture(root, { html = 'generated' } = {}) {
  const docsDir = join(root, 'stage-docs');
  const stageId = 'v14-stage-kernel-refactor';
  const charter = defaultStageCharter({
    stageId,
    createdAt: '2026-05-26T00:00:00.000Z'
  });
  const charterPath = join(docsDir, `${stageId}.stage.json`);
  const htmlPath = join(docsDir, `${stageId}.html`);

  await mkdir(docsDir, { recursive: true });
  await writeFile(charterPath, `${JSON.stringify(charter, null, 2)}\n`, 'utf8');

  if (html !== 'missing') {
    await writeFile(
      htmlPath,
      html === 'generated' ? renderStageCharterHtml(charter) : html,
      'utf8'
    );
  }

  return {
    docsDir,
    stageId,
    charter,
    charterPath,
    htmlPath
  };
}

async function initFixtureGit(root) {
  try {
    await git(root, ['init', '-b', 'main']);
  } catch {
    await git(root, ['init']);
    try {
      await git(root, ['checkout', '-b', 'main']);
    } catch {
      // Older/newer git defaults may already be on main; branch name is not relevant for adoption.
    }
  }

  await git(root, ['config', 'user.email', 'fixture@example.test']);
  await git(root, ['config', 'user.name', 'Fixture']);
  await git(root, ['add', '.']);
  await git(root, ['commit', '-m', 'initial fixture']);
}

async function git(cwd, args) {
  await execFileAsync('git', args, { cwd });
}
