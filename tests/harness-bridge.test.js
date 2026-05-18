import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

import {
  TaskPacketValidationError,
  buildExpectedChecks,
  buildHarnessPolicy,
  taskPacketToTaskSpec,
  verifyHarnessResult
} from '../src/integrations/harness-bridge.js';
import { runMcasCli } from '../scripts/mcas.js';
import { buildHarnessCodexRealSmokeArgv } from '../scripts/smoke-harness-codex-real.js';

describe('Harness Bridge TaskPacket conversion', () => {
  it('converts TaskPacket intent, acceptance, write set, and verification commands', () => {
    const taskPacket = validTaskPacket();

    const taskSpec = taskPacketToTaskSpec(taskPacket);

    assert.deepEqual(taskSpec, {
      id: 'task.scaffold',
      source: 'manual',
      repository: 'Andy20010101/multi-coding-agent-symphony',
      objective: 'Create a Node CLI scaffold',
      constraints: [
        'harness.run_id:fixture-run',
        'write_set:synthetic-dry-run.txt',
        'write_set:src/**',
        'verification_command:pnpm test',
        'verification_command:pnpm check'
      ],
      acceptance: [
        'CLI prints help',
        'Harness verification records are written'
      ],
      priority: 'normal',
      version: '1'
    });
    assert.deepEqual(buildExpectedChecks(taskPacket), ['pnpm test', 'pnpm check']);
  });

  it('rejects TaskPackets without acceptance before adapter execution', () => {
    const taskPacket = {
      ...validTaskPacket(),
      acceptance: []
    };

    assert.throws(
      () => taskPacketToTaskSpec(taskPacket),
      (error) => error instanceof TaskPacketValidationError &&
        error.message === 'TaskPacket.acceptance must be a non-empty string array'
    );
  });

  it('rejects TaskPackets without a write set before adapter execution', () => {
    const taskPacket = {
      ...validTaskPacket(),
      write_set: []
    };

    assert.throws(
      () => taskPacketToTaskSpec(taskPacket),
      (error) => error instanceof TaskPacketValidationError &&
        error.message === 'TaskPacket.write_set must be a non-empty string array'
    );
  });

  it('builds Harness policy requests from write set and explicit requests', () => {
    const policy = buildHarnessPolicy({
      ...validTaskPacket(),
      policy: {
        deniedPaths: ['tmp/blocked/**'],
        requests: [{
          action: 'read',
          target: '.env'
        }]
      }
    });

    assert.deepEqual(policy.config.deniedPaths, ['tmp/blocked/**']);
    assert.deepEqual(policy.requests, [
      { action: 'write', target: 'synthetic-dry-run.txt' },
      { action: 'write', target: 'src/**' },
      { action: 'read', target: '.env' }
    ]);
  });

  it('fails Harness verification when evidence changes files outside the write set', async () => {
    const verification = await verifyHarnessResult({
      taskPacket: validTaskPacket(),
      workflowResult: workflowResult({
        verificationStatus: 'passed'
      }),
      readEvidence: async () => ({
        command: 'implement',
        changedFiles: ['src/index.js', 'docs/notes.md'],
        checks: [
          { name: 'pnpm test', status: 'passed', command: 'pnpm test', exitCode: 0, output: 'ok' },
          { name: 'pnpm check', status: 'passed', command: 'pnpm check', exitCode: 0, output: 'ok' }
        ]
      })
    });

    assert.equal(verification.status, 'failed');
    assert.equal(verification.reason, 'write-set-violation');
    assert.equal(verification.diagnosticLayer, 'workspace');
    assert.deepEqual(verification.writeSetViolations, [{
      command: 'implement',
      artifactId: 'implement-evidence',
      changedFiles: ['docs/notes.md']
    }]);
  });

  it('fails Harness verification when expected verification commands are missing from evidence', async () => {
    const verification = await verifyHarnessResult({
      taskPacket: validTaskPacket(),
      workflowResult: workflowResult({
        verificationStatus: 'passed'
      }),
      readEvidence: async () => ({
        command: 'implement',
        changedFiles: ['synthetic-dry-run.txt'],
        checks: [
          { name: 'pnpm test', status: 'passed', command: 'pnpm test', exitCode: 0, output: 'ok' }
        ]
      })
    });

    assert.equal(verification.status, 'failed');
    assert.equal(verification.reason, 'expected-check-missing');
    assert.equal(verification.diagnosticLayer, 'expected-check');
    assert.deepEqual(verification.missingExpectedChecks, [{
      command: 'workflow',
      artifactId: null,
      expectedCommands: ['pnpm check']
    }]);
  });

  it('classifies invalid structured model evidence as a schema-layer failure', async () => {
    const verification = await verifyHarnessResult({
      taskPacket: validTaskPacket(),
      workflowResult: {
        taskId: 'task.scaffold',
        status: 'failed',
        commands: [{
          command: 'implement',
          artifactId: 'implement-evidence',
          verification: {
            status: 'failed',
            reason: 'checks-missing'
          }
        }]
      },
      readEvidence: async () => ({
        command: 'implement',
        changedFiles: [],
        checks: [],
        knownRisks: ['real-cli-output-unverified'],
        agentSummary: 'Raw model output did not match EvidencePackage schema.'
      })
    });

    assert.equal(verification.status, 'failed');
    assert.equal(verification.diagnosticLayer, 'schema');
    assert.deepEqual(verification.diagnostics, [{
      command: 'implement',
      artifactId: 'implement-evidence',
      verificationStatus: 'failed',
      verificationReason: 'checks-missing',
      diagnosticLayer: 'schema'
    }]);
  });

  it('classifies verifier-readable but incomplete review evidence as a prompt-layer failure', async () => {
    const verification = await verifyHarnessResult({
      taskPacket: validTaskPacket(),
      workflowResult: {
        taskId: 'task.scaffold',
        status: 'failed',
        commands: [{
          command: 'review',
          artifactId: 'review-evidence',
          verification: {
            status: 'failed',
            reason: 'verification-insufficient'
          }
        }]
      },
      readEvidence: async () => ({
        command: 'review',
        changedFiles: [],
        checks: [
          { name: 'pnpm test', status: 'passed', command: 'pnpm test', exitCode: 0, output: 'ok' },
          { name: 'pnpm check', status: 'passed', command: 'pnpm check', exitCode: 0, output: 'ok' }
        ],
        knownRisks: [],
        agentSummary: 'Review omitted findings and no-finding rationale.'
      })
    });

    assert.equal(verification.status, 'failed');
    assert.equal(verification.reason, 'symphony-verification-failed');
    assert.equal(verification.diagnosticLayer, 'prompt');
  });

  it('accepts expected verification commands once across the workflow', async () => {
    const verification = await verifyHarnessResult({
      taskPacket: validTaskPacket(),
      workflowResult: {
        taskId: 'task.scaffold',
        status: 'passed',
        commands: [
          {
            command: 'implement',
            artifactId: 'implement-evidence',
            verification: { status: 'passed' }
          },
          {
            command: 'review',
            artifactId: 'review-evidence',
            verification: { status: 'passed' }
          }
        ]
      },
      async readEvidence(command) {
        if (command.command === 'implement') {
          return {
            command: 'implement',
            changedFiles: ['synthetic-dry-run.txt'],
            checks: [
              { name: 'pnpm test', status: 'passed', command: 'pnpm test', exitCode: 0, output: 'ok' },
              { name: 'pnpm check', status: 'passed', command: 'pnpm check', exitCode: 0, output: 'ok' }
            ]
          };
        }

        return {
          command: 'review',
          changedFiles: [],
          checks: [
            { name: 'review', status: 'passed', command: 'review', exitCode: 0, output: 'ok' }
          ]
        };
      }
    });

    assert.equal(verification.status, 'passed');
    assert.equal(verification.reason, 'checks-passed');
    assert.deepEqual(verification.missingExpectedChecks, []);
  });
});

describe('Harness Bridge CLI dry-run E2E', () => {
  it('runs a TaskPacket through Symphony dry-run and writes Harness evidence files', async () => {
    const root = await mkdtemp(join(tmpdir(), 'mcas-harness-cli-'));

    try {
      const taskPacketFile = join(root, 'taskpacket.json');
      const runtimeDirectory = join(root, 'runtime');
      const harnessDirectory = join(root, 'harness');

      await writeFile(taskPacketFile, `${JSON.stringify(validTaskPacket(), null, 2)}\n`, 'utf8');

      const output = createOutput();
      const exitCode = await runMcasCli({
        argv: [
          'harness',
          'run-taskpacket',
          '--run-id',
          'fixture-run',
          '--taskpacket',
          taskPacketFile,
          '--runtime-dir',
          runtimeDirectory,
          '--harness-dir',
          harnessDirectory,
          '--session-id',
          'harness-session'
        ],
        stdout: output.stdout,
        stderr: output.stderr
      });

      assert.equal(exitCode, 0);
      assert.equal(output.stderrText(), '');

      const run = JSON.parse(output.stdoutText());
      const evidenceMap = JSON.parse(await readFile(join(harnessDirectory, 'runs', 'fixture-run', 'evidence-map.json'), 'utf8'));
      const summary = JSON.parse(await readFile(join(harnessDirectory, 'runs', 'fixture-run', 'summary.json'), 'utf8'));
      const verification = await readFile(join(harnessDirectory, 'runs', 'fixture-run', 'verification.md'), 'utf8');

      assert.equal(run.command, 'harness run-taskpacket');
      assert.equal(run.status, 'passed');
      assert.equal(run.taskId, 'task.scaffold');
      assert.equal(run.symphonyStatus, 'passed');
      assert.equal(run.verifierStatus, 'passed');
      assert.deepEqual(run.evidencePaths, {
        evidenceMapPath: join(harnessDirectory, 'runs', 'fixture-run', 'evidence-map.json'),
        verificationPath: join(harnessDirectory, 'runs', 'fixture-run', 'verification.md'),
        summaryPath: join(harnessDirectory, 'runs', 'fixture-run', 'summary.json')
      });
      assert.equal(evidenceMap.taskId, 'task.scaffold');
      assert.deepEqual(evidenceMap.expectedChecks, ['pnpm test', 'pnpm check']);
      assert.deepEqual(evidenceMap.artifacts.map((artifact) => artifact.artifactId), [
        'implement-evidence',
        'review-evidence',
        'qa-evidence'
      ]);
      assert.equal(summary.status, 'passed');
      assert.equal(summary.artifactDirectory, join(runtimeDirectory, 'artifacts'));
      assert.match(verification, /Status: passed/);
      assert.match(verification, /implement-evidence/);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it('runs a TaskPacket through the writer-reviewer ensemble workflow', async () => {
    const root = await mkdtemp(join(tmpdir(), 'mcas-harness-writer-reviewer-'));

    try {
      const taskPacketFile = join(root, 'taskpacket.json');
      const runtimeDirectory = join(root, 'runtime');
      const harnessDirectory = join(root, 'harness');

      await writeFile(taskPacketFile, `${JSON.stringify(writerReviewerTaskPacket(), null, 2)}\n`, 'utf8');

      const output = createOutput();
      const exitCode = await runMcasCli({
        argv: [
          'harness',
          'run-taskpacket',
          '--run-id',
          'fixture-writer-reviewer',
          '--taskpacket',
          taskPacketFile,
          '--runtime-dir',
          runtimeDirectory,
          '--harness-dir',
          harnessDirectory,
          '--session-id',
          'harness-session'
        ],
        stdout: output.stdout,
        stderr: output.stderr
      });

      assert.equal(exitCode, 0);
      assert.equal(output.stderrText(), '');

      const run = JSON.parse(output.stdoutText());
      const evidenceMap = JSON.parse(await readFile(join(harnessDirectory, 'runs', 'fixture-writer-reviewer', 'evidence-map.json'), 'utf8'));
      const summary = JSON.parse(await readFile(join(harnessDirectory, 'runs', 'fixture-writer-reviewer', 'summary.json'), 'utf8'));
      const verification = await readFile(join(harnessDirectory, 'runs', 'fixture-writer-reviewer', 'verification.md'), 'utf8');

      assert.equal(run.workflowMode, 'writer-reviewer');
      assert.deepEqual(run.commands.map((command) => ({
        stage: command.stage,
        role: command.role,
        agentId: command.agentId,
        command: command.command,
        artifactId: command.artifactId,
        verificationStatus: command.verificationStatus
      })), [
        {
          stage: 'writer',
          role: 'writer',
          agentId: 'codex-writer',
          command: 'implement',
          artifactId: 'implement-evidence',
          verificationStatus: 'passed'
        },
        {
          stage: 'reviewer:codex-reviewer',
          role: 'reviewer',
          agentId: 'codex-reviewer',
          command: 'review',
          artifactId: 'review-codex-reviewer-evidence',
          verificationStatus: 'passed'
        }
      ]);
      assert.equal(evidenceMap.workflowMode, 'writer-reviewer');
      assert.deepEqual(evidenceMap.stages.map((stage) => ({
        stage: stage.stage,
        role: stage.role,
        agentId: stage.agentId,
        command: stage.command,
        verificationStatus: stage.verificationStatus
      })), [
        {
          stage: 'writer',
          role: 'writer',
          agentId: 'codex-writer',
          command: 'implement',
          verificationStatus: 'passed'
        },
        {
          stage: 'reviewer:codex-reviewer',
          role: 'reviewer',
          agentId: 'codex-reviewer',
          command: 'review',
          verificationStatus: 'passed'
        }
      ]);
      assert.deepEqual(summary.verificationMap, evidenceMap.verificationMap);
      assert.match(verification, /Workflow mode: writer-reviewer/);
      assert.match(verification, /Stage: reviewer:codex-reviewer/);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it('runs a TaskPacket through the parallel-lanes ensemble workflow', async () => {
    const root = await mkdtemp(join(tmpdir(), 'mcas-harness-parallel-lanes-'));

    try {
      const taskPacketFile = join(root, 'taskpacket.json');
      const runtimeDirectory = join(root, 'runtime');
      const harnessDirectory = join(root, 'harness');

      await writeFile(taskPacketFile, `${JSON.stringify(parallelLanesTaskPacket(), null, 2)}\n`, 'utf8');

      const output = createOutput();
      const exitCode = await runMcasCli({
        argv: [
          'harness',
          'run-taskpacket',
          '--run-id',
          'fixture-parallel-lanes',
          '--taskpacket',
          taskPacketFile,
          '--runtime-dir',
          runtimeDirectory,
          '--harness-dir',
          harnessDirectory,
          '--session-id',
          'harness-session'
        ],
        stdout: output.stdout,
        stderr: output.stderr
      });

      assert.equal(exitCode, 0);
      assert.equal(output.stderrText(), '');

      const run = JSON.parse(output.stdoutText());
      const evidenceMap = JSON.parse(await readFile(join(harnessDirectory, 'runs', 'fixture-parallel-lanes', 'evidence-map.json'), 'utf8'));
      const summary = JSON.parse(await readFile(join(harnessDirectory, 'runs', 'fixture-parallel-lanes', 'summary.json'), 'utf8'));
      const verification = await readFile(join(harnessDirectory, 'runs', 'fixture-parallel-lanes', 'verification.md'), 'utf8');

      assert.equal(run.workflowMode, 'parallel-lanes');
      assert.deepEqual(run.commands.map((command) => ({
        stage: command.stage,
        role: command.role,
        laneId: command.laneId,
        agentId: command.agentId,
        command: command.command,
        artifactId: command.artifactId,
        verificationStatus: command.verificationStatus
      })), [
        {
          stage: 'lane:docs-lane',
          role: 'parallel-writer',
          laneId: 'docs-lane',
          agentId: 'codex-docs',
          command: 'implement',
          artifactId: 'implement-docs-lane-evidence',
          verificationStatus: 'passed'
        },
        {
          stage: 'lane:src-lane',
          role: 'parallel-writer',
          laneId: 'src-lane',
          agentId: 'codex-src',
          command: 'implement',
          artifactId: 'implement-src-lane-evidence',
          verificationStatus: 'passed'
        }
      ]);
      assert.equal(evidenceMap.workflowMode, 'parallel-lanes');
      assert.deepEqual(evidenceMap.artifacts.map((artifact) => artifact.artifactId), [
        'implement-docs-lane-evidence',
        'implement-src-lane-evidence'
      ]);
      assert.deepEqual(evidenceMap.stages.map((stage) => ({
        stage: stage.stage,
        role: stage.role,
        laneId: stage.laneId,
        agentId: stage.agentId,
        command: stage.command,
        verificationStatus: stage.verificationStatus,
        writeSet: stage.writeSet
      })), [
        {
          stage: 'lane:docs-lane',
          role: 'parallel-writer',
          laneId: 'docs-lane',
          agentId: 'codex-docs',
          command: 'implement',
          verificationStatus: 'passed',
          writeSet: ['docs/parallel-lanes.md']
        },
        {
          stage: 'lane:src-lane',
          role: 'parallel-writer',
          laneId: 'src-lane',
          agentId: 'codex-src',
          command: 'implement',
          verificationStatus: 'passed',
          writeSet: ['src/parallel-lanes.js']
        }
      ]);
      assert.deepEqual(summary.verificationMap, evidenceMap.verificationMap);
      assert.match(verification, /Workflow mode: parallel-lanes/);
      assert.match(verification, /Stage: lane:docs-lane/);
      assert.match(verification, /Stage: lane:src-lane/);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it('runs a TaskPacket through the qa-swarm ensemble workflow', async () => {
    const root = await mkdtemp(join(tmpdir(), 'mcas-harness-qa-swarm-'));

    try {
      const taskPacketFile = join(root, 'taskpacket.json');
      const runtimeDirectory = join(root, 'runtime');
      const harnessDirectory = join(root, 'harness');
      const taskPacket = JSON.parse(await readFile('fixtures/harness/qa-swarm-taskpacket.json', 'utf8'));

      await writeFile(taskPacketFile, `${JSON.stringify(taskPacket, null, 2)}\n`, 'utf8');

      const output = createOutput();
      const exitCode = await runMcasCli({
        argv: [
          'harness',
          'run-taskpacket',
          '--run-id',
          'fixture-qa-swarm',
          '--taskpacket',
          taskPacketFile,
          '--runtime-dir',
          runtimeDirectory,
          '--harness-dir',
          harnessDirectory,
          '--session-id',
          'harness-session'
        ],
        stdout: output.stdout,
        stderr: output.stderr
      });

      assert.equal(exitCode, 0);
      assert.equal(output.stderrText(), '');

      const run = JSON.parse(output.stdoutText());
      const evidenceMap = JSON.parse(await readFile(join(harnessDirectory, 'runs', 'fixture-qa-swarm', 'evidence-map.json'), 'utf8'));
      const summary = JSON.parse(await readFile(join(harnessDirectory, 'runs', 'fixture-qa-swarm', 'summary.json'), 'utf8'));
      const verification = await readFile(join(harnessDirectory, 'runs', 'fixture-qa-swarm', 'verification.md'), 'utf8');
      const ensembleRun = JSON.parse(await readFile(join(runtimeDirectory, 'artifacts', 'task.qa-swarm', 'ensemble-run-ensemble-qa-swarm.json'), 'utf8'));

      assert.equal(run.workflowMode, 'qa-swarm');
      assert.equal(run.verifierStatus, 'passed');
      assert.deepEqual(run.commands.map((command) => ({
        stage: command.stage,
        role: command.role,
        laneId: command.laneId,
        agentId: command.agentId,
        command: command.command,
        adapterId: command.adapterId,
        artifactId: command.artifactId,
        runArtifactId: command.runArtifactId,
        routeDecisionArtifactId: command.routeDecisionArtifactId,
        verificationStatus: command.verificationStatus
      })), [
        {
          stage: 'qa:acceptance-audit',
          role: 'qa',
          laneId: 'acceptance-audit',
          agentId: 'codex-qa-a',
          command: 'qa',
          adapterId: 'codex',
          artifactId: 'qa-acceptance-audit-evidence',
          runArtifactId: 'qa-acceptance-audit-run',
          routeDecisionArtifactId: 'qa-acceptance-audit-route-decision',
          verificationStatus: 'passed'
        },
        {
          stage: 'qa:regression-audit',
          role: 'qa',
          laneId: 'regression-audit',
          agentId: 'codex-qa-b',
          command: 'qa',
          adapterId: 'codex',
          artifactId: 'qa-regression-audit-evidence',
          runArtifactId: 'qa-regression-audit-run',
          routeDecisionArtifactId: 'qa-regression-audit-route-decision',
          verificationStatus: 'passed'
        }
      ]);
      assert.deepEqual(ensembleRun.qaLanes.map((lane) => ({
        laneId: lane.laneId,
        workspaceRole: lane.workspace.role,
        writable: lane.workspace.writable
      })), [
        {
          laneId: 'acceptance-audit',
          workspaceRole: 'review',
          writable: false
        },
        {
          laneId: 'regression-audit',
          workspaceRole: 'review',
          writable: false
        }
      ]);
      assert.equal(evidenceMap.workflowMode, 'qa-swarm');
      assert.deepEqual(evidenceMap.artifacts.map((artifact) => artifact.artifactId), [
        'qa-acceptance-audit-evidence',
        'qa-regression-audit-evidence'
      ]);
      assert.deepEqual(evidenceMap.stages.map((stage) => ({
        stage: stage.stage,
        role: stage.role,
        laneId: stage.laneId,
        agentId: stage.agentId,
        command: stage.command,
        adapterId: stage.adapterId,
        findings: stage.findings,
        missingEvidence: stage.missingEvidence,
        noFindingRationale: stage.noFindingRationale,
        artifactId: stage.artifactId,
        runArtifactId: stage.runArtifactId,
        routeDecisionArtifactId: stage.routeDecisionArtifactId,
        verificationStatus: stage.verificationStatus
      })), [
        {
          stage: 'qa:acceptance-audit',
          role: 'qa',
          laneId: 'acceptance-audit',
          agentId: 'codex-qa-a',
          command: 'qa',
          adapterId: 'codex',
          findings: [],
          missingEvidence: [],
          noFindingRationale: 'Synthetic dry-run qa found no issues.',
          artifactId: 'qa-acceptance-audit-evidence',
          runArtifactId: 'qa-acceptance-audit-run',
          routeDecisionArtifactId: 'qa-acceptance-audit-route-decision',
          verificationStatus: 'passed'
        },
        {
          stage: 'qa:regression-audit',
          role: 'qa',
          laneId: 'regression-audit',
          agentId: 'codex-qa-b',
          command: 'qa',
          adapterId: 'codex',
          findings: [],
          missingEvidence: [],
          noFindingRationale: 'Synthetic dry-run qa found no issues.',
          artifactId: 'qa-regression-audit-evidence',
          runArtifactId: 'qa-regression-audit-run',
          routeDecisionArtifactId: 'qa-regression-audit-route-decision',
          verificationStatus: 'passed'
        }
      ]);
      assert.deepEqual(evidenceMap.verificationMap.map((entry) => ({
        stage: entry.stage,
        laneId: entry.laneId,
        agentId: entry.agentId,
        command: entry.command,
        adapterId: entry.adapterId,
        findings: entry.findings,
        missingEvidence: entry.missingEvidence,
        noFindingRationale: entry.noFindingRationale,
        artifactId: entry.artifactId,
        runArtifactId: entry.runArtifactId,
        routeDecisionArtifactId: entry.routeDecisionArtifactId,
        verificationStatus: entry.verificationStatus
      })), [
        {
          stage: 'qa:acceptance-audit',
          laneId: 'acceptance-audit',
          agentId: 'codex-qa-a',
          command: 'qa',
          adapterId: 'codex',
          findings: [],
          missingEvidence: [],
          noFindingRationale: 'Synthetic dry-run qa found no issues.',
          artifactId: 'qa-acceptance-audit-evidence',
          runArtifactId: 'qa-acceptance-audit-run',
          routeDecisionArtifactId: 'qa-acceptance-audit-route-decision',
          verificationStatus: 'passed'
        },
        {
          stage: 'qa:regression-audit',
          laneId: 'regression-audit',
          agentId: 'codex-qa-b',
          command: 'qa',
          adapterId: 'codex',
          findings: [],
          missingEvidence: [],
          noFindingRationale: 'Synthetic dry-run qa found no issues.',
          artifactId: 'qa-regression-audit-evidence',
          runArtifactId: 'qa-regression-audit-run',
          routeDecisionArtifactId: 'qa-regression-audit-route-decision',
          verificationStatus: 'passed'
        }
      ]);
      assert.deepEqual(summary.verificationMap, evidenceMap.verificationMap);
      assert.match(verification, /Workflow mode: qa-swarm/);
      assert.match(verification, /Stage: qa:acceptance-audit/);
      assert.match(verification, /qa-acceptance-audit-evidence/);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it('runs a TaskPacket through the competitive-patch ensemble workflow', async () => {
    const root = await mkdtemp(join(tmpdir(), 'mcas-harness-competitive-patch-'));
    let adapter;

    try {
      const taskPacketFile = join(root, 'taskpacket.json');
      const runtimeDirectory = join(root, 'runtime');
      const harnessDirectory = join(root, 'harness');
      const taskPacket = JSON.parse(await readFile('fixtures/harness/competitive-patch-taskpacket.json', 'utf8'));

      await writeFile(taskPacketFile, `${JSON.stringify(taskPacket, null, 2)}\n`, 'utf8');

      const output = createOutput();
      const exitCode = await runMcasCli({
        argv: [
          'harness',
          'run-taskpacket',
          '--run-id',
          'fixture-competitive-patch',
          '--taskpacket',
          taskPacketFile,
          '--runtime-dir',
          runtimeDirectory,
          '--harness-dir',
          harnessDirectory,
          '--session-id',
          'harness-session'
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
      assert.deepEqual(adapter.starts.map((start) => start.modelProfile), [
        'gpt-codex-default',
        'gpt-codex-default',
        'gpt-codex-default'
      ]);

      const run = JSON.parse(output.stdoutText());
      const evidenceMap = JSON.parse(await readFile(join(harnessDirectory, 'runs', 'fixture-competitive-patch', 'evidence-map.json'), 'utf8'));
      const summary = JSON.parse(await readFile(join(harnessDirectory, 'runs', 'fixture-competitive-patch', 'summary.json'), 'utf8'));
      const verification = await readFile(join(harnessDirectory, 'runs', 'fixture-competitive-patch', 'verification.md'), 'utf8');
      const ensembleRun = JSON.parse(await readFile(join(runtimeDirectory, 'artifacts', 'task.competitive-patch', 'ensemble-run-ensemble-competitive-patch.json'), 'utf8'));

      assert.equal(run.workflowMode, 'competitive-patch');
      assert.equal(run.completionGate, 'verifier');
      assert.equal(run.verifierStatus, 'passed');
      assert.equal(run.selectedCandidateId, 'candidate-a');
      assert.equal(ensembleRun.candidates.filter((candidate) => candidate.selected).length, 1);
      assert.deepEqual(run.commands.map((command) => ({
        stage: command.stage,
        role: command.role,
        candidateId: command.candidateId,
        agentId: command.agentId,
        command: command.command,
        adapterId: command.adapterId,
        patchArtifactId: command.patchArtifactId,
        commandArtifactId: command.commandArtifactId,
        routeDecisionArtifactId: command.routeDecisionArtifactId,
        verificationStatus: command.verificationStatus,
        selected: command.selected,
        rejectedReason: command.rejectedReason
      })), [
        {
          stage: 'candidate:candidate-a',
          role: 'competitive-candidate',
          candidateId: 'candidate-a',
          agentId: 'codex-candidate-a',
          command: 'implement',
          adapterId: 'codex',
          patchArtifactId: 'competitive-patch-candidate-a-patch',
          commandArtifactId: 'implement-candidate-a-run',
          routeDecisionArtifactId: 'implement-candidate-a-route-decision',
          verificationStatus: 'passed',
          selected: true,
          rejectedReason: undefined
        },
        {
          stage: 'candidate:candidate-b',
          role: 'competitive-candidate',
          candidateId: 'candidate-b',
          agentId: 'codex-candidate-b',
          command: 'implement',
          adapterId: 'codex',
          patchArtifactId: 'competitive-patch-candidate-b-patch',
          commandArtifactId: 'implement-candidate-b-run',
          routeDecisionArtifactId: 'implement-candidate-b-route-decision',
          verificationStatus: 'passed',
          selected: false,
          rejectedReason: 'not selected'
        },
        {
          stage: 'candidate:candidate-c',
          role: 'competitive-candidate',
          candidateId: 'candidate-c',
          agentId: 'codex-candidate-c',
          command: 'implement',
          adapterId: 'codex',
          patchArtifactId: 'competitive-patch-candidate-c-patch',
          commandArtifactId: 'implement-candidate-c-run',
          routeDecisionArtifactId: 'implement-candidate-c-route-decision',
          verificationStatus: 'passed',
          selected: false,
          rejectedReason: 'not selected'
        }
      ]);
      assert.deepEqual(run.verificationMap.map((entry) => ({
        stage: entry.stage,
        candidateId: entry.candidateId,
        agentId: entry.agentId,
        command: entry.command,
        adapterId: entry.adapterId,
        patchArtifactId: entry.patchArtifactId,
        commandArtifactId: entry.commandArtifactId,
        artifactId: entry.artifactId,
        runArtifactId: entry.runArtifactId,
        routeDecisionArtifactId: entry.routeDecisionArtifactId,
        verificationStatus: entry.verificationStatus,
        selected: entry.selected,
        rejectedReason: entry.rejectedReason
      })), run.commands.map((command) => ({
        stage: command.stage,
        candidateId: command.candidateId,
        agentId: command.agentId,
        command: command.command,
        adapterId: command.adapterId,
        patchArtifactId: command.patchArtifactId,
        commandArtifactId: command.commandArtifactId,
        artifactId: command.artifactId,
        runArtifactId: command.runArtifactId,
        routeDecisionArtifactId: command.routeDecisionArtifactId,
        verificationStatus: command.verificationStatus,
        selected: command.selected,
        rejectedReason: command.rejectedReason
      })));
      assert.equal(evidenceMap.workflowMode, 'competitive-patch');
      assert.equal(evidenceMap.completionGate, 'verifier');
      assert.deepEqual(evidenceMap.stages.map((stage) => ({
        stage: stage.stage,
        candidateId: stage.candidateId,
        agentId: stage.agentId,
        patchArtifactId: stage.patchArtifactId,
        commandArtifactId: stage.commandArtifactId,
        routeDecisionArtifactId: stage.routeDecisionArtifactId,
        verificationStatus: stage.verificationStatus,
        selected: stage.selected,
        rejectedReason: stage.rejectedReason
      })), run.commands.map((command) => ({
        stage: command.stage,
        candidateId: command.candidateId,
        agentId: command.agentId,
        patchArtifactId: command.patchArtifactId,
        commandArtifactId: command.commandArtifactId,
        routeDecisionArtifactId: command.routeDecisionArtifactId,
        verificationStatus: command.verificationStatus,
        selected: command.selected,
        rejectedReason: command.rejectedReason
      })));
      assert.deepEqual(summary.verificationMap, evidenceMap.verificationMap);
      assert.match(verification, /Workflow mode: competitive-patch/);
      assert.match(verification, /Completion gate: verifier/);
      assert.match(verification, /Stage: candidate:candidate-a/);
      assert.match(verification, /competitive-patch-candidate-a-patch/);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it('fails a competitive-patch workflow when no candidate passes verifier evidence', async () => {
    const root = await mkdtemp(join(tmpdir(), 'mcas-harness-competitive-none-'));

    try {
      const taskPacketFile = join(root, 'taskpacket.json');
      const runtimeDirectory = join(root, 'runtime');
      const harnessDirectory = join(root, 'harness');
      const taskPacket = JSON.parse(await readFile('fixtures/harness/competitive-patch-taskpacket.json', 'utf8'));

      await writeFile(taskPacketFile, `${JSON.stringify(taskPacket, null, 2)}\n`, 'utf8');

      const output = createOutput();
      const exitCode = await runMcasCli({
        argv: [
          'harness',
          'run-taskpacket',
          '--run-id',
          'fixture-competitive-none',
          '--taskpacket',
          taskPacketFile,
          '--runtime-dir',
          runtimeDirectory,
          '--harness-dir',
          harnessDirectory,
          '--session-id',
          'harness-session'
        ],
        stdout: output.stdout,
        stderr: output.stderr,
        adapterFactory(options) {
          return new FailingCompetitivePatchAdapter(options);
        }
      });

      assert.equal(exitCode, 70);
      assert.equal(output.stderrText(), '');

      const run = JSON.parse(output.stdoutText());
      const evidenceMap = JSON.parse(await readFile(join(harnessDirectory, 'runs', 'fixture-competitive-none', 'evidence-map.json'), 'utf8'));

      assert.equal(run.workflowMode, 'competitive-patch');
      assert.equal(run.status, 'failed');
      assert.equal(run.symphonyStatus, 'failed');
      assert.equal(run.verifierStatus, 'failed');
      assert.equal(run.reason, 'symphony-verification-failed');
      assert.equal('selectedCandidateId' in run, false);
      assert.equal(evidenceMap.selectedCandidateId, undefined);
      assert.equal(evidenceMap.completionGate, 'verifier');
      assert.deepEqual(run.commands.map((command) => ({
        candidateId: command.candidateId,
        verificationStatus: command.verificationStatus,
        selected: command.selected,
        rejectedReason: command.rejectedReason
      })), [
        {
          candidateId: 'candidate-a',
          verificationStatus: 'failed',
          selected: false,
          rejectedReason: 'verifier failed: check-failed'
        },
        {
          candidateId: 'candidate-b',
          verificationStatus: 'failed',
          selected: false,
          rejectedReason: 'verifier failed: check-failed'
        },
        {
          candidateId: 'candidate-c',
          verificationStatus: 'failed',
          selected: false,
          rejectedReason: 'verifier failed: check-failed'
        }
      ]);
      assert.deepEqual(run.verificationMap.map((entry) => ({
        candidateId: entry.candidateId,
        patchArtifactId: entry.patchArtifactId,
        commandArtifactId: entry.commandArtifactId,
        verificationStatus: entry.verificationStatus,
        selected: entry.selected,
        rejectedReason: entry.rejectedReason
      })), run.commands.map((command) => ({
        candidateId: command.candidateId,
        patchArtifactId: command.patchArtifactId,
        commandArtifactId: command.commandArtifactId,
        verificationStatus: command.verificationStatus,
        selected: command.selected,
        rejectedReason: command.rejectedReason
      })));
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it('rejects duplicate competitive-patch candidate ids before adapter execution', async () => {
    const root = await mkdtemp(join(tmpdir(), 'mcas-harness-competitive-duplicate-'));
    let adapter;

    try {
      const taskPacketFile = join(root, 'taskpacket.json');
      const runtimeDirectory = join(root, 'runtime');
      const harnessDirectory = join(root, 'harness');
      const taskPacket = JSON.parse(await readFile('fixtures/harness/competitive-patch-taskpacket.json', 'utf8'));

      taskPacket.workflow.candidates[1].candidate_id = taskPacket.workflow.candidates[0].candidate_id;
      await writeFile(taskPacketFile, `${JSON.stringify(taskPacket, null, 2)}\n`, 'utf8');

      const output = createOutput();
      const exitCode = await runMcasCli({
        argv: [
          'harness',
          'run-taskpacket',
          '--run-id',
          'fixture-competitive-duplicate',
          '--taskpacket',
          taskPacketFile,
          '--runtime-dir',
          runtimeDirectory,
          '--harness-dir',
          harnessDirectory,
          '--session-id',
          'harness-session'
        ],
        stdout: output.stdout,
        stderr: output.stderr,
        adapterFactory(options) {
          adapter = new RecordingRealCliAdapter(options);
          return adapter;
        }
      });

      assert.equal(exitCode, 64);
      assert.equal(output.stdoutText(), '');
      assert.match(output.stderrText(), /TaskPacket\.workflow\.candidates\[\]\.candidate_id must be unique/);
      assert.deepEqual(adapter?.executionModes ?? [], []);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it('rejects unsupported workflow modes before adapter execution', async () => {
    const root = await mkdtemp(join(tmpdir(), 'mcas-harness-unsupported-mode-'));
    let adapter;

    try {
      const taskPacketFile = join(root, 'taskpacket.json');
      const runtimeDirectory = join(root, 'runtime');
      const harnessDirectory = join(root, 'harness');

      await writeFile(taskPacketFile, `${JSON.stringify({
        ...validTaskPacket(),
        workflow: {
          mode: 'competitive_patch'
        }
      }, null, 2)}\n`, 'utf8');

      const output = createOutput();
      const exitCode = await runMcasCli({
        argv: [
          'harness',
          'run-taskpacket',
          '--run-id',
          'fixture-unsupported-mode',
          '--taskpacket',
          taskPacketFile,
          '--runtime-dir',
          runtimeDirectory,
          '--harness-dir',
          harnessDirectory,
          '--session-id',
          'harness-session'
        ],
        stdout: output.stdout,
        stderr: output.stderr,
        adapterFactory(options) {
          adapter = new RecordingRealCliAdapter(options);
          return adapter;
        }
      });

      assert.equal(exitCode, 64);
      assert.equal(output.stdoutText(), '');
      assert.match(output.stderrText(), /TaskPacket\.workflow\.mode must be one of: linear, writer-reviewer, parallel-lanes, competitive-patch, qa-swarm/);
      assert.deepEqual(adapter?.executionModes ?? [], []);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it('rejects writable qa-swarm lanes before adapter execution', async () => {
    const root = await mkdtemp(join(tmpdir(), 'mcas-harness-qa-swarm-writable-'));
    let adapter;

    try {
      const taskPacketFile = join(root, 'taskpacket.json');
      const runtimeDirectory = join(root, 'runtime');
      const harnessDirectory = join(root, 'harness');
      const taskPacket = JSON.parse(await readFile('fixtures/harness/qa-swarm-taskpacket.json', 'utf8'));

      taskPacket.workflow.qa_lanes[0].write_set = ['src/should-not-write.js'];
      await writeFile(taskPacketFile, `${JSON.stringify(taskPacket, null, 2)}\n`, 'utf8');

      const output = createOutput();
      const exitCode = await runMcasCli({
        argv: [
          'harness',
          'run-taskpacket',
          '--run-id',
          'fixture-qa-swarm-writable',
          '--taskpacket',
          taskPacketFile,
          '--runtime-dir',
          runtimeDirectory,
          '--harness-dir',
          harnessDirectory,
          '--session-id',
          'harness-session'
        ],
        stdout: output.stdout,
        stderr: output.stderr,
        adapterFactory(options) {
          adapter = new RecordingRealCliAdapter(options);
          return adapter;
        }
      });

      assert.equal(exitCode, 64);
      assert.equal(output.stdoutText(), '');
      assert.match(output.stderrText(), /qa-swarm lanes must be read-only/);
      assert.deepEqual(adapter?.executionModes ?? [], []);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it('rejects duplicate qa-swarm lane ids before adapter execution', async () => {
    const root = await mkdtemp(join(tmpdir(), 'mcas-harness-qa-swarm-duplicate-'));
    let adapter;

    try {
      const taskPacketFile = join(root, 'taskpacket.json');
      const runtimeDirectory = join(root, 'runtime');
      const harnessDirectory = join(root, 'harness');
      const taskPacket = JSON.parse(await readFile('fixtures/harness/qa-swarm-taskpacket.json', 'utf8'));

      taskPacket.workflow.qa_lanes[1].lane_id = taskPacket.workflow.qa_lanes[0].lane_id;
      await writeFile(taskPacketFile, `${JSON.stringify(taskPacket, null, 2)}\n`, 'utf8');

      const output = createOutput();
      const exitCode = await runMcasCli({
        argv: [
          'harness',
          'run-taskpacket',
          '--run-id',
          'fixture-qa-swarm-duplicate',
          '--taskpacket',
          taskPacketFile,
          '--runtime-dir',
          runtimeDirectory,
          '--harness-dir',
          harnessDirectory,
          '--session-id',
          'harness-session'
        ],
        stdout: output.stdout,
        stderr: output.stderr,
        adapterFactory(options) {
          adapter = new RecordingRealCliAdapter(options);
          return adapter;
        }
      });

      assert.equal(exitCode, 64);
      assert.equal(output.stdoutText(), '');
      assert.match(output.stderrText(), /TaskPacket\.workflow\.qa_lanes\[\]\.lane_id must be unique/);
      assert.deepEqual(adapter?.executionModes ?? [], []);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it('rejects overlapping parallel lane write sets before adapter execution', async () => {
    const root = await mkdtemp(join(tmpdir(), 'mcas-harness-parallel-overlap-'));
    let adapter;

    try {
      const taskPacketFile = join(root, 'taskpacket.json');
      const runtimeDirectory = join(root, 'runtime');
      const harnessDirectory = join(root, 'harness');

      await writeFile(taskPacketFile, `${JSON.stringify({
        ...parallelLanesTaskPacket(),
        workflow: {
          ...parallelLanesTaskPacket().workflow,
          lanes: [
            {
              lane_id: 'one',
              agent_id: 'codex-one',
              write_set: ['src/shared.js']
            },
            {
              lane_id: 'two',
              agent_id: 'codex-two',
              write_set: ['src/shared.js']
            }
          ]
        }
      }, null, 2)}\n`, 'utf8');

      const output = createOutput();
      const exitCode = await runMcasCli({
        argv: [
          'harness',
          'run-taskpacket',
          '--run-id',
          'fixture-parallel-overlap',
          '--taskpacket',
          taskPacketFile,
          '--runtime-dir',
          runtimeDirectory,
          '--harness-dir',
          harnessDirectory,
          '--session-id',
          'harness-session'
        ],
        stdout: output.stdout,
        stderr: output.stderr,
        adapterFactory(options) {
          adapter = new RecordingRealCliAdapter(options);
          return adapter;
        }
      });

      assert.equal(exitCode, 64);
      assert.equal(output.stdoutText(), '');
      assert.match(output.stderrText(), /parallel lane write sets overlap/);
      assert.deepEqual(adapter.executionModes, []);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it('rejects parallel lane write sets outside the TaskPacket write set before adapter execution', async () => {
    const root = await mkdtemp(join(tmpdir(), 'mcas-harness-parallel-escape-'));
    let adapter;

    try {
      const taskPacketFile = join(root, 'taskpacket.json');
      const runtimeDirectory = join(root, 'runtime');
      const harnessDirectory = join(root, 'harness');

      await writeFile(taskPacketFile, `${JSON.stringify({
        ...parallelLanesTaskPacket(),
        write_set: ['docs/parallel-lanes.md'],
        workflow: {
          ...parallelLanesTaskPacket().workflow,
          lanes: [{
            lane_id: 'escape',
            agent_id: 'codex-escape',
            write_set: ['src/outside-lock.js']
          }]
        }
      }, null, 2)}\n`, 'utf8');

      const output = createOutput();
      const exitCode = await runMcasCli({
        argv: [
          'harness',
          'run-taskpacket',
          '--run-id',
          'fixture-parallel-escape',
          '--taskpacket',
          taskPacketFile,
          '--runtime-dir',
          runtimeDirectory,
          '--harness-dir',
          harnessDirectory,
          '--session-id',
          'harness-session'
        ],
        stdout: output.stdout,
        stderr: output.stderr,
        adapterFactory(options) {
          adapter = new RecordingRealCliAdapter(options);
          return adapter;
        }
      });

      assert.equal(exitCode, 64);
      assert.equal(output.stdoutText(), '');
      assert.match(output.stderrText(), /parallel lane write set escapes TaskPacket\.write_set/);
      assert.deepEqual(adapter.executionModes, []);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it('records policy denial in Symphony events and Harness evidence', async () => {
    const root = await mkdtemp(join(tmpdir(), 'mcas-harness-policy-'));

    try {
      const taskPacketFile = join(root, 'taskpacket.json');
      const runtimeDirectory = join(root, 'runtime');
      const harnessDirectory = join(root, 'harness');

      await writeFile(taskPacketFile, `${JSON.stringify({
        ...validTaskPacket(),
        write_set: ['.env']
      }, null, 2)}\n`, 'utf8');

      const output = createOutput();
      const exitCode = await runMcasCli({
        argv: [
          'harness',
          'run-taskpacket',
          '--run-id',
          'fixture-run',
          '--taskpacket',
          taskPacketFile,
          '--runtime-dir',
          runtimeDirectory,
          '--harness-dir',
          harnessDirectory,
          '--session-id',
          'harness-session'
        ],
        stdout: output.stdout,
        stderr: output.stderr
      });

      assert.equal(exitCode, 70);
      assert.equal(output.stderrText(), '');

      const run = JSON.parse(output.stdoutText());
      const events = JSON.parse(await readFile(join(runtimeDirectory, 'events', 'harness-session.json'), 'utf8'));
      const verification = await readFile(join(harnessDirectory, 'runs', 'fixture-run', 'verification.md'), 'utf8');

      assert.equal(run.status, 'failed');
      assert.equal(run.verifierStatus, 'failed');
      assert.equal(run.policyDenied.reason, 'sensitive-path');
      assert.deepEqual(events.map((event) => event.type), [
        'command.queued',
        'policy.decision'
      ]);
      assert.match(verification, /Policy denied: sensitive-path/);
      assert.match(verification, /\.env/);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });
});

describe('Harness Bridge CLI real lane', () => {
  it('builds a rerunnable real Codex Harness smoke command with unique runtime paths', () => {
    assert.deepEqual(buildHarnessCodexRealSmokeArgv({
      now: new Date('2026-05-14T07:24:31.000Z')
    }), [
      'harness',
      'run-taskpacket',
      '--run-id',
      'fixture-real-smoke-standard-2026-05-14T07-24-31-000Z',
      '--taskpacket',
      'fixtures/harness/real-smoke-taskpacket.json',
      '--runtime-dir',
      'tmp/harness-bridge-real-smoke-standard-fixture-real-smoke-standard-2026-05-14T07-24-31-000Z',
      '--harness-dir',
      'tmp/harness-bridge-real-smoke-harness-standard',
      '--real',
      '--adapter',
      'codex',
      '--sequence',
      'standard',
      '--timeout-ms',
      '180000'
    ]);
  });

  it('requires the adapter-specific real CLI gate before production real execution', async () => {
    const root = await mkdtemp(join(tmpdir(), 'mcas-harness-real-gate-'));
    const previousGate = process.env.MCAS_RUN_REAL_CODEX;

    try {
      delete process.env.MCAS_RUN_REAL_CODEX;

      const taskPacketFile = join(root, 'taskpacket.json');

      await writeFile(taskPacketFile, `${JSON.stringify(validTaskPacket(), null, 2)}\n`, 'utf8');

      const output = createOutput();
      const exitCode = await runMcasCli({
        argv: [
          'harness',
          'run-taskpacket',
          '--run-id',
          'fixture-run',
          '--taskpacket',
          taskPacketFile,
          '--runtime-dir',
          join(root, 'runtime'),
          '--real',
          '--adapter',
          'codex'
        ],
        stdout: output.stdout,
        stderr: output.stderr
      });

      assert.equal(exitCode, 64);
      assert.equal(output.stdoutText(), '');
      assert.match(JSON.parse(output.stderrText()).message, /MCAS_RUN_REAL_CODEX=1/);
    } finally {
      if (previousGate === undefined) {
        delete process.env.MCAS_RUN_REAL_CODEX;
      } else {
        process.env.MCAS_RUN_REAL_CODEX = previousGate;
      }

      await rm(root, { recursive: true, force: true });
    }
  });

  it('passes real execution mode to the selected CLI adapter and writes Harness evidence', async () => {
    const root = await mkdtemp(join(tmpdir(), 'mcas-harness-real-cli-'));
    let adapter;

    try {
      const taskPacketFile = join(root, 'taskpacket.json');
      const runtimeDirectory = join(root, 'runtime');
      const harnessDirectory = join(root, 'harness');

      await writeFile(taskPacketFile, `${JSON.stringify(validTaskPacket(), null, 2)}\n`, 'utf8');

      const output = createOutput();
      const exitCode = await runMcasCli({
        argv: [
          'harness',
          'run-taskpacket',
          '--run-id',
          'fixture-run',
          '--taskpacket',
          taskPacketFile,
          '--runtime-dir',
          runtimeDirectory,
          '--harness-dir',
          harnessDirectory,
          '--session-id',
          'harness-session',
          '--adapter',
          'codex',
          '--real'
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
      const evidenceMap = JSON.parse(await readFile(join(harnessDirectory, 'runs', 'fixture-run', 'evidence-map.json'), 'utf8'));

      assert.equal(run.executionMode, 'real');
      assert.equal(run.adapterId, 'codex');
      assert.equal(evidenceMap.executionMode, 'real');
      assert.deepEqual(run.commands.map((command) => command.adapterId), [
        'codex',
        'codex',
        'codex'
      ]);
      assert.deepEqual(evidenceMap.artifacts.map((artifact) => artifact.adapterId), [
        'codex',
        'codex',
        'codex'
      ]);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it('passes the selected command sequence through the Harness CLI', async () => {
    const root = await mkdtemp(join(tmpdir(), 'mcas-harness-real-sequence-'));
    let adapter;

    try {
      const taskPacketFile = join(root, 'taskpacket.json');
      const runtimeDirectory = join(root, 'runtime');
      const harnessDirectory = join(root, 'harness');

      await writeFile(taskPacketFile, `${JSON.stringify(validTaskPacket(), null, 2)}\n`, 'utf8');

      const output = createOutput();
      const exitCode = await runMcasCli({
        argv: [
          'harness',
          'run-taskpacket',
          '--run-id',
          'fixture-run',
          '--taskpacket',
          taskPacketFile,
          '--runtime-dir',
          runtimeDirectory,
          '--harness-dir',
          harnessDirectory,
          '--session-id',
          'harness-session',
          '--adapter',
          'codex',
          '--real',
          '--sequence',
          'implement-only'
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
      assert.deepEqual(adapter.executionModes, ['real']);

      const run = JSON.parse(output.stdoutText());
      const evidenceMap = JSON.parse(await readFile(join(harnessDirectory, 'runs', 'fixture-run', 'evidence-map.json'), 'utf8'));

      assert.deepEqual(run.commands.map((command) => command.command), ['implement']);
      assert.deepEqual(evidenceMap.artifacts.map((artifact) => artifact.artifactId), [
        'implement-evidence'
      ]);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });
});

function validTaskPacket() {
  return {
    version: '1',
    id: 'task.scaffold',
    run_id: 'fixture-run',
    repository: 'Andy20010101/multi-coding-agent-symphony',
    intent: 'Create a Node CLI scaffold',
    acceptance: [
      'CLI prints help',
      'Harness verification records are written'
    ],
    write_set: [
      'synthetic-dry-run.txt',
      'src/**'
    ],
    verification: {
      commands: [
        'pnpm test',
        'pnpm check'
      ]
    }
  };
}

function writerReviewerTaskPacket() {
  return {
    ...validTaskPacket(),
    id: 'task.writer-reviewer',
    intent: 'Create a Node CLI scaffold through writer-reviewer mode',
    workflow: {
      mode: 'writer-reviewer',
      ensemble_id: 'ensemble-writer-reviewer',
      writer: {
        agent_id: 'codex-writer',
        model_profile: 'gpt-codex-default'
      },
      reviewers: [{
        agent_id: 'codex-reviewer',
        model_profile: 'gpt-codex-default'
      }]
    }
  };
}

function parallelLanesTaskPacket() {
  return {
    ...validTaskPacket(),
    id: 'task.parallel-lanes',
    run_id: 'fixture-parallel-lanes',
    intent: 'Create two disjoint artifacts through parallel-lanes mode',
    acceptance: [
      'docs lane evidence is recorded',
      'source lane evidence is recorded',
      'Harness maps each lane to its artifact and verification result'
    ],
    write_set: [
      'docs/parallel-lanes.md',
      'src/parallel-lanes.js'
    ],
    verification: {
      commands: [
        'pnpm test'
      ]
    },
    workflow: {
      mode: 'parallel-lanes',
      ensemble_id: 'ensemble-parallel-lanes',
      lanes: [
        {
          lane_id: 'docs-lane',
          agent_id: 'codex-docs',
          model_profile: 'gpt-codex-default',
          write_set: ['docs/parallel-lanes.md']
        },
        {
          lane_id: 'src-lane',
          agent_id: 'codex-src',
          model_profile: 'gpt-codex-default',
          write_set: ['src/parallel-lanes.js']
        }
      ]
    }
  };
}

class RecordingRealCliAdapter {
  constructor({ checkCommands = ['mcas-cli-real'] } = {}) {
    this.adapterId = 'codex';
    this.cliName = 'codex';
    this.cliVersion = 'synthetic-real';
    this.modelProfiles = ['gpt-codex-default'];
    this.checkCommands = [...checkCommands];
    this.runs = new Map();
    this.executionModes = [];
    this.starts = [];
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
    this.starts.push({
      command: input.commandSpec.name,
      executionMode: input.executionMode,
      modelProfile: input.modelProfile,
      agentId: input.contextPack.agentId,
      workspace: input.workspace
    });
    this.executionModes.push(input.executionMode);
    if (input.executionMode === 'real') {
      assert.equal(existsSync(input.workspace), true);
    }
    const runId = `${this.adapterId}-${input.commandSpec.name}-${this.runs.size + 1}`;
    const handle = {
      runId,
      adapterId: this.adapterId,
      status: 'completed',
      dryRun: false,
      command: input.commandSpec.name,
      agentId: input.contextPack.agentId,
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
      changedFiles: handle.command === 'implement' ? ['synthetic-dry-run.txt'] : [],
      checks: this.checkCommands.map((command) => ({
        name: command,
        status: 'passed',
        command,
        exitCode: 0,
        artifactId: `${handle.command}-real-cli-check`,
        output: `Synthetic real CLI check passed: ${command}`
      })),
      knownRisks: [],
      agentSummary: 'Synthetic real CLI evidence.',
      ...(handle.command === 'review' ? { noFindingRationale: 'Synthetic real review found no issues.' } : {}),
      version: '1'
    };
  }
}

class FailingCompetitivePatchAdapter extends RecordingRealCliAdapter {
  async collectEvidence(handle) {
    return {
      command: handle.command,
      taskId: handle.taskId,
      workspaceId: handle.workspaceId,
      diffSummary: ['Synthetic rejected competitive patch.'],
      changedFiles: ['synthetic-dry-run.txt'],
      checks: this.checkCommands.map((command) => ({
        name: command,
        status: 'failed',
        command,
        exitCode: 1,
        artifactId: `${handle.agentId}-${handle.command}-failed-check`,
        output: `Synthetic competitive patch failed: ${command}`
      })),
      knownRisks: [],
      agentSummary: 'Synthetic competitive patch evidence failed verifier checks.',
      version: '1'
    };
  }
}

function workflowResult({ verificationStatus }) {
  return {
    taskId: 'task.scaffold',
    status: verificationStatus === 'passed' ? 'passed' : 'failed',
    commands: [{
      command: 'implement',
      artifactId: 'implement-evidence',
      runArtifactId: 'implement-run',
      routeDecisionArtifactId: 'implement-route-decision',
      verification: {
        status: verificationStatus
      }
    }],
    artifactRefs: []
  };
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
