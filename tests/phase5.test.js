import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

import { ArtifactStore } from '../src/artifact-store.js';
import { SessionEventLog } from '../src/session-event-log.js';
import {
  buildReplaySampleFromSession,
  buildWorkflowComparisonInputFromArtifacts,
  loadReplayFixture,
  loadReplaySample,
  loadWorkflowComparisonFixture,
  runEvalReplay,
  runWorkflowModeComparison,
  writeEvalReportArtifact
} from '../plugins/eval-replay/index.js';

describe('Phase 5 external eval replay plugin', () => {
  it('loads replay samples from stored artifacts without adapter state', async () => {
    const root = await mkdtemp(join(tmpdir(), 'mcas-eval-artifacts-'));

    try {
      const store = new ArtifactStore(root);
      await store.writeArtifact('task-1', 'baseline', {
        taskId: 'task-1',
        variant: 'baseline',
        verified: true,
        costUsd: 1,
        latencySeconds: 10,
        failureCategory: null
      });
      await store.writeArtifact('task-1', 'candidate', {
        taskId: 'task-1',
        variant: 'candidate',
        verified: true,
        costUsd: 0.8,
        latencySeconds: 8,
        failureCategory: null
      });

      assert.deepEqual(await loadReplaySample({
        artifactStore: store,
        tasks: [
          {
            taskId: 'task-1',
            artifactIds: ['baseline', 'candidate']
          }
        ]
      }), {
        id: 'sample-task-1',
        resultsByTask: {
          'task-1': [
            {
              taskId: 'task-1',
              variant: 'baseline',
              verified: true,
              costUsd: 1,
              latencySeconds: 10,
              failureCategory: null
            },
            {
              taskId: 'task-1',
              variant: 'candidate',
              verified: true,
              costUsd: 0.8,
              latencySeconds: 8,
              failureCategory: null
            }
          ]
        }
      });
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it('builds replay samples from session log artifact events and evidence artifacts', async () => {
    const root = await mkdtemp(join(tmpdir(), 'mcas-eval-session-'));

    try {
      const store = new ArtifactStore(join(root, 'artifacts'));
      const eventLog = new SessionEventLog(join(root, 'events'), 'session-1');

      await store.writeArtifact('task-1', 'baseline-implement-evidence', {
        command: 'implement',
        taskId: 'task-1',
        workspaceId: 'workspace-1',
        variant: 'baseline',
        taskClass: 'adapter-regression',
        diffSummary: [],
        changedFiles: ['src/example.js'],
        checks: [{ name: 'pnpm test', status: 'passed', artifactId: 'test-log' }],
        knownRisks: [],
        costUsd: 1.4,
        latencySeconds: 32,
        agentSummary: 'Baseline completed.',
        version: '1'
      });
      await store.writeArtifact('task-1', 'candidate-implement-evidence', {
        command: 'implement',
        taskId: 'task-1',
        workspaceId: 'workspace-2',
        variant: 'candidate',
        taskClass: 'adapter-regression',
        diffSummary: [],
        changedFiles: ['src/example.js'],
        checks: [{ name: 'pnpm test', status: 'failed', artifactId: 'test-log', output: 'failed' }],
        knownRisks: [],
        costUsd: 1.1,
        latencySeconds: 28,
        agentSummary: 'Candidate failed tests.',
        version: '1'
      });
      await store.writeArtifact('task-1', 'implement-run', {
        command: 'implement',
        verificationStatus: 'passed',
        version: '1'
      });
      await appendArtifactEvent(eventLog, 'event-1', 'task-1', 'baseline-implement-evidence');
      await appendArtifactEvent(eventLog, 'event-2', 'task-1', 'candidate-implement-evidence');
      await appendArtifactEvent(eventLog, 'event-3', 'task-1', 'implement-run');

      assert.deepEqual(await buildReplaySampleFromSession({
        artifactStore: store,
        eventLog,
        taskIds: ['task-1']
      }), {
        id: 'sample-task-1',
        resultsByTask: {
          'task-1': [
            {
              taskId: 'task-1',
              variant: 'baseline',
              verified: true,
              costUsd: 1.4,
              latencySeconds: 32,
              failureCategory: null,
              command: 'implement',
              taskClass: 'adapter-regression',
              evidenceArtifactId: 'baseline-implement-evidence'
            },
            {
              taskId: 'task-1',
              variant: 'candidate',
              verified: false,
              costUsd: 1.1,
              latencySeconds: 28,
              failureCategory: 'check-failed',
              command: 'implement',
              taskClass: 'adapter-regression',
              evidenceArtifactId: 'candidate-implement-evidence'
            }
          ]
        }
      });
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it('compares model profiles on the same sample and preserves resource profile', () => {
    const resourceProfile = {
      cpu: '4',
      memoryMb: 8192,
      timeoutSeconds: 3600,
      concurrency: 1,
      network: 'restricted',
      version: '1'
    };

    const report = runEvalReplay({
      reason: 'model-upgrade',
      baseline: 'gpt-codex-default.v1',
      candidate: 'gpt-codex-default.v2',
      sample: {
        id: 'sample-task-1-task-2',
        resultsByTask: {
          'task-1': [
            {
              taskId: 'task-1',
              variant: 'baseline',
              verified: false,
              costUsd: 1,
              latencySeconds: 20,
              failureCategory: 'test-failed'
            },
            {
              taskId: 'task-1',
              variant: 'candidate',
              verified: true,
              costUsd: 1.2,
              latencySeconds: 18,
              failureCategory: null
            }
          ],
          'task-2': [
            {
              taskId: 'task-2',
              variant: 'baseline',
              verified: true,
              costUsd: 2,
              latencySeconds: 40,
              failureCategory: null
            },
            {
              taskId: 'task-2',
              variant: 'candidate',
              verified: true,
              costUsd: 1.5,
              latencySeconds: 30,
              failureCategory: null
            }
          ]
        }
      },
      resourceProfile
    });

    assert.equal(report.scores.baseline.verifiedSuccessRate, 0.5);
    assert.equal(report.scores.candidate.verifiedSuccessRate, 1);
    assert.equal(report.scores.baseline.meanCostUsd, 1.5);
    assert.equal(report.scores.candidate.p50LatencySeconds, 18);
    assert.deepEqual(report.resourceProfile, resourceProfile);
    assert.deepEqual(report.failureDelta, {
      'test-failed': -1
    });
  });

  it('compares bundled replay fixtures by task class', async () => {
    const modelUpgradeFixture = await loadReplayFixture({ name: 'model-upgrade' });
    const modelUpgradeReport = runEvalReplay(modelUpgradeFixture);

    assert.equal(
      modelUpgradeReport.taskClassSummary['model-upgrade'].scores.baseline.verifiedSuccessRate,
      0.5
    );
    assert.equal(
      modelUpgradeReport.taskClassSummary['model-upgrade'].scores.candidate.verifiedSuccessRate,
      1
    );
    assert.deepEqual(modelUpgradeReport.taskClassSummary['model-upgrade'].failureDelta, {
      'model-off-task': -1
    });

    const adapterRegressionFixture = await loadReplayFixture({ name: 'adapter-regression' });
    const adapterRegressionReport = runEvalReplay(adapterRegressionFixture);

    assert.equal(
      adapterRegressionReport.taskClassSummary['adapter-regression'].scores.baseline.verifiedSuccessRate,
      1
    );
    assert.equal(
      adapterRegressionReport.taskClassSummary['adapter-regression'].scores.candidate.verifiedSuccessRate,
      0.5
    );
    assert.deepEqual(adapterRegressionReport.taskClassSummary['adapter-regression'].failureDelta, {
      'adapter-crashed': 1
    });
  });

  it('reports success and cost tradeoffs with affected files and contracts', () => {
    const report = runEvalReplay({
      reason: 'model-upgrade',
      baseline: 'gpt-codex-default.v1',
      candidate: 'gpt-codex-default.v2',
      sample: {
        id: 'sample-task-1',
        resultsByTask: {
          'task-1': [
            {
              taskId: 'task-1',
              variant: 'baseline',
              verified: false,
              costUsd: 1,
              latencySeconds: 20,
              failureCategory: 'test-failed'
            },
            {
              taskId: 'task-1',
              variant: 'candidate',
              verified: true,
              costUsd: 2,
              latencySeconds: 20,
              failureCategory: null
            }
          ]
        }
      },
      resourceProfile: {
        cpu: '4',
        memoryMb: 8192,
        timeoutSeconds: 3600,
        concurrency: 1,
        network: 'restricted',
        version: '1'
      },
      affectedFiles: ['src/router-scheduler.js'],
      affectedContracts: ['ModelProfile']
    });

    assert.deepEqual(report.recommendations, [
      {
        type: 'review-routing',
        reason: 'candidate-verified-success-rate-improved',
        candidate: 'gpt-codex-default.v2',
        tradeoffs: ['higher-cost'],
        affectedFiles: ['src/router-scheduler.js'],
        affectedContracts: ['ModelProfile']
      }
    ]);
  });

  it('qualifies comparisons when resource profiles differ', () => {
    const baselineResourceProfile = {
      cpu: '4',
      memoryMb: 8192,
      timeoutSeconds: 3600,
      concurrency: 1,
      network: 'restricted',
      version: '1'
    };
    const candidateResourceProfile = {
      ...baselineResourceProfile,
      timeoutSeconds: 1800,
      network: 'enabled'
    };
    const report = runEvalReplay({
      reason: 'model-upgrade',
      baseline: 'gpt-codex-default.v1',
      candidate: 'gpt-codex-default.v2',
      sample: {
        id: 'sample-task-1',
        resultsByTask: {
          'task-1': [
            {
              taskId: 'task-1',
              variant: 'baseline',
              verified: true,
              costUsd: 1,
              latencySeconds: 20,
              failureCategory: null
            },
            {
              taskId: 'task-1',
              variant: 'candidate',
              verified: true,
              costUsd: 1,
              latencySeconds: 20,
              failureCategory: null
            }
          ]
        }
      },
      baselineResourceProfile,
      candidateResourceProfile
    });

    assert.deepEqual(report.resourceProfile, {
      baseline: baselineResourceProfile,
      candidate: candidateResourceProfile
    });
    assert.deepEqual(report.resourceQualification, {
      comparable: false,
      reasons: ['resource-profile-mismatch'],
      mismatchedFields: ['timeoutSeconds', 'network']
    });
  });

  it('writes eval reports as artifacts without mutating the report', async () => {
    const root = await mkdtemp(join(tmpdir(), 'mcas-eval-report-'));

    try {
      const store = new ArtifactStore(root);
      const report = Object.freeze({
        id: 'eval-model-upgrade-sample-task-1',
        reason: 'model-upgrade',
        baseline: 'gpt-codex-default.v1',
        candidate: 'gpt-codex-default.v2',
        taskSample: 'sample-task-1',
        scores: Object.freeze({}),
        failureDelta: Object.freeze({}),
        recommendations: Object.freeze([]),
        resourceProfile: Object.freeze({
          cpu: '4',
          memoryMb: 8192,
          timeoutSeconds: 3600,
          concurrency: 1,
          network: 'restricted',
          version: '1'
        }),
        mutatedCoreConfig: false,
        version: '1'
      });

      assert.deepEqual(await writeEvalReportArtifact({
        artifactStore: store,
        report,
        taskId: 'eval-reports'
      }), {
        taskId: 'eval-reports',
        artifactId: 'eval-model-upgrade-sample-task-1'
      });
      assert.deepEqual(await store.readArtifact('eval-reports', 'eval-model-upgrade-sample-task-1'), report);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it('runs the eval replay gate command from stored artifacts and writes a report ref', async () => {
    const root = await mkdtemp(join(tmpdir(), 'mcas-eval-gate-'));

    try {
      const artifactDirectory = join(root, 'artifacts');
      const eventLogDirectory = join(root, 'events');
      const store = new ArtifactStore(artifactDirectory);
      const eventLog = new SessionEventLog(eventLogDirectory, 'session-1');

      await store.writeArtifact('task-1', 'baseline-evidence', {
        command: 'implement',
        taskId: 'task-1',
        workspaceId: 'workspace-baseline',
        variant: 'baseline',
        taskClass: 'model-upgrade',
        diffSummary: [],
        changedFiles: ['src/router-scheduler.js'],
        checks: [{ name: 'pnpm test', status: 'failed', artifactId: 'baseline-test-log' }],
        knownRisks: [],
        verified: false,
        costUsd: 1,
        latencySeconds: 20,
        agentSummary: 'Baseline failed.',
        version: '1'
      });
      await store.writeArtifact('task-1', 'candidate-evidence', {
        command: 'implement',
        taskId: 'task-1',
        workspaceId: 'workspace-candidate',
        variant: 'candidate',
        taskClass: 'model-upgrade',
        diffSummary: [],
        changedFiles: ['src/router-scheduler.js'],
        checks: [{ name: 'pnpm test', status: 'passed', artifactId: 'candidate-test-log' }],
        knownRisks: [],
        verified: true,
        costUsd: 2,
        latencySeconds: 18,
        agentSummary: 'Candidate passed.',
        version: '1'
      });
      await appendArtifactEvent(eventLog, 'event-1', 'task-1', 'baseline-evidence');
      await appendArtifactEvent(eventLog, 'event-2', 'task-1', 'candidate-evidence');

      const result = spawnSync(process.execPath, [
        'scripts/eval-replay.js',
        '--artifacts', artifactDirectory,
        '--events', eventLogDirectory,
        '--session', 'session-1',
        '--tasks', 'task-1',
        '--reason', 'model-upgrade',
        '--baseline', 'gpt-codex-default.v1',
        '--candidate', 'gpt-codex-default.v2',
        '--resource-profile-json', JSON.stringify({
          cpu: '4',
          memoryMb: 8192,
          timeoutSeconds: 3600,
          concurrency: 1,
          network: 'restricted',
          version: '1'
        }),
        '--affected-files', 'src/router-scheduler.js',
        '--affected-contracts', 'ModelProfile'
      ], {
        cwd: process.cwd(),
        env: childProcessEnvironment(),
        encoding: 'utf8'
      });

      assert.equal(result.status, 0, result.stderr);

      const output = JSON.parse(result.stdout);
      assert.equal(output.status, 'passed');
      assert.deepEqual(output.reportRef, {
        taskId: 'eval-reports',
        artifactId: 'eval-model-upgrade-sample-task-1'
      });
      assert.equal(output.report.mutatedCoreConfig, false);
      assert.deepEqual(output.report.recommendations, [
        {
          type: 'review-routing',
          reason: 'candidate-verified-success-rate-improved',
          candidate: 'gpt-codex-default.v2',
          tradeoffs: ['higher-cost'],
          affectedFiles: ['src/router-scheduler.js'],
          affectedContracts: ['ModelProfile']
        }
      ]);
      assert.deepEqual(await store.readArtifact('eval-reports', 'eval-model-upgrade-sample-task-1'), output.report);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it('compares workflow modes from replayable structured artifacts', async () => {
    const fixture = await loadWorkflowComparisonFixture({ name: 'workflow-comparison' });
    const report = runWorkflowModeComparison(fixture);

    assert.equal(report.id, 'eval-workflow-comparison-workflow-mode-comparison-workflow-comparison');
    assert.equal(report.comparedAt, '2026-05-16T00:00:00.000Z');
    assert.deepEqual(report.modes, [
      'linear',
      'proposal-only',
      'writer-reviewer',
      'parallel-lanes',
      'qa-swarm',
      'competitive-patch'
    ]);
    assert.deepEqual(Object.fromEntries(report.modes.map((mode) => [
      mode,
      report.resultsByMode[mode].status
    ])), {
      linear: 'passed',
      'proposal-only': 'passed',
      'writer-reviewer': 'passed',
      'parallel-lanes': 'passed',
      'qa-swarm': 'failed',
      'competitive-patch': 'passed'
    });
    assert.deepEqual(report.verifierSummary.failedModes, ['qa-swarm']);
    assert.equal(report.verifierSummary.byMode['qa-swarm'].finalVerificationStatus, 'failed');
    assert.equal(report.verifierSummary.byMode['proposal-only'].finalVerificationStatus, 'unknown');
    assert.deepEqual(report.resultsByMode.linear.evidenceArtifactIds, ['linear-implement-evidence']);
    assert.equal(report.resultsByMode.linear.resourceProfile.status, 'known');
    assert.equal(report.resultsByMode['writer-reviewer'].resourceProfile.status, 'unknown');
    assert.equal(
      report.resultsByMode['writer-reviewer'].resourceProfile.unknownResourceProfileReason,
      'resource-profile-not-recorded'
    );
    assert.equal(report.resultsByMode['writer-reviewer'].costProfile.status, 'unknown');
    assert.equal(
      report.resultsByMode['writer-reviewer'].costProfile.unknownCostProfileReason,
      'cost-profile-not-recorded'
    );
    assert.equal(
      report.unknownResourceProfileReason,
      'resource-profile-not-recorded: proposal-only, writer-reviewer, parallel-lanes, qa-swarm, competitive-patch'
    );
    assert.equal(
      report.unknownCostProfileReason,
      'cost-profile-not-recorded: proposal-only, writer-reviewer, parallel-lanes, qa-swarm, competitive-patch'
    );
    assert.deepEqual(report.operatorNotes, ['Fixture uses structured replay artifacts only.']);
    assert.deepEqual(report.recommendations, []);
  });

  it('preserves workflow-specific verifier evidence in comparisons', async () => {
    const report = runWorkflowModeComparison(await loadWorkflowComparisonFixture({ name: 'workflow-comparison' }));
    const competitivePatch = report.workflowSpecificSummary['competitive-patch'];
    const qaSwarm = report.workflowSpecificSummary['qa-swarm'];
    const parallelLanes = report.workflowSpecificSummary['parallel-lanes'];
    const writerReviewer = report.workflowSpecificSummary['writer-reviewer'];
    const candidatesById = Object.fromEntries(competitivePatch.candidates.map((candidate) => [
      candidate.candidateId,
      candidate
    ]));
    const qaLanesById = Object.fromEntries(qaSwarm.qaLanes.map((lane) => [
      lane.laneId,
      lane
    ]));

    assert.equal(competitivePatch.selectedCandidateId, 'candidate-b');
    assert.equal(candidatesById['candidate-b'].selected, true);
    assert.equal(candidatesById['candidate-b'].verifierStatus, 'passed');
    assert.equal(candidatesById['candidate-b'].patchArtifactId, 'competitive-patch-candidate-b-patch');
    assert.equal(candidatesById['candidate-a'].rejectedReason, 'verifier failed: check-failed');
    assert.equal(candidatesById['candidate-c'].rejectedReason, 'not selected');
    assert.equal(candidatesById['candidate-a'].commandArtifactId, 'implement-candidate-a-run');
    assert.equal(candidatesById['candidate-a'].routeDecisionArtifactId, 'implement-candidate-a-route-decision');

    assert.equal(qaSwarm.findingsArtifactId, 'qa-swarm-findings-ensemble-qa-swarm');
    assert.equal(qaSwarm.missingEvidenceArtifactId, 'qa-swarm-missing-evidence-ensemble-qa-swarm');
    assert.deepEqual(qaLanesById['regression-audit'].findings, ['Regression proof is missing.']);
    assert.deepEqual(qaLanesById['regression-audit'].missingEvidence, ['regression-test-log']);
    assert.equal(qaLanesById['regression-audit'].verificationStatus, 'failed');
    assert.equal(qaLanesById['acceptance-audit'].noFindingRationale, 'No blocking issues found.');

    assert.deepEqual(parallelLanes.lanes.map((lane) => ({
      laneId: lane.laneId,
      agentId: lane.agentId,
      writeSet: lane.writeSet,
      verificationStatus: lane.verificationStatus
    })), [
      {
        laneId: 'docs-lane',
        agentId: 'codex-docs',
        writeSet: ['docs/parallel-lanes.md'],
        verificationStatus: 'passed'
      },
      {
        laneId: 'src-lane',
        agentId: 'codex-src',
        writeSet: ['src/parallel-lanes.js'],
        verificationStatus: 'passed'
      }
    ]);
    assert.equal(writerReviewer.writer.agentId, 'codex-writer');
    assert.equal(writerReviewer.writer.verificationStatus, 'passed');
    assert.equal(writerReviewer.writer.evidenceArtifactId, 'implement-evidence');
    assert.deepEqual(writerReviewer.reviewers.map((reviewer) => ({
      agentId: reviewer.agentId,
      evidenceArtifactId: reviewer.evidenceArtifactId,
      verificationStatus: reviewer.verificationStatus
    })), [{
      agentId: 'codex-reviewer',
      evidenceArtifactId: 'review-codex-reviewer-evidence',
      verificationStatus: 'passed'
    }]);
    assert.equal(report.evidenceArtifacts.some((artifact) => artifact.confidence !== undefined), false);
  });

  it('builds workflow comparison input from stored artifact refs', async () => {
    const root = await mkdtemp(join(tmpdir(), 'mcas-workflow-comparison-artifacts-'));

    try {
      const store = new ArtifactStore(root);

      await store.writeArtifact('task.stored-parallel', 'stored-evidence-map', {
        version: '1',
        runId: 'fixture-stored-parallel',
        taskId: 'task.stored-parallel',
        status: 'passed',
        verifierStatus: 'passed',
        symphonyStatus: 'passed',
        workflowMode: 'parallel-lanes',
        stages: [
          {
            stage: 'lane:docs-lane',
            role: 'parallel-writer',
            laneId: 'docs-lane',
            agentId: 'codex-docs',
            command: 'implement',
            adapterId: 'codex',
            writeSet: ['docs/stored.md'],
            artifactId: 'stored-docs-evidence',
            runArtifactId: 'stored-docs-run',
            routeDecisionArtifactId: 'stored-docs-route-decision',
            verificationStatus: 'passed',
            verificationReason: 'checks-passed'
          }
        ],
        verificationMap: [
          {
            stage: 'lane:docs-lane',
            laneId: 'docs-lane',
            agentId: 'codex-docs',
            command: 'implement',
            adapterId: 'codex',
            writeSet: ['docs/stored.md'],
            artifactId: 'stored-docs-evidence',
            runArtifactId: 'stored-docs-run',
            routeDecisionArtifactId: 'stored-docs-route-decision',
            verificationStatus: 'passed',
            verificationReason: 'checks-passed'
          }
        ]
      });

      const input = await buildWorkflowComparisonInputFromArtifacts({
        artifactStore: store,
        comparison: {
          reason: 'workflow-mode-comparison',
          comparedAt: '2026-05-16T00:00:00.000Z',
          samples: [
            {
              id: 'stored-parallel',
              artifacts: [
                {
                  taskId: 'task.stored-parallel',
                  artifactId: 'stored-evidence-map',
                  kind: 'evidenceMap'
                }
              ]
            }
          ]
        }
      });
      const report = runWorkflowModeComparison(input);

      assert.deepEqual(report.modes, ['parallel-lanes']);
      assert.equal(report.resultsByMode['parallel-lanes'].status, 'passed');
      assert.deepEqual(report.samples[0].sourceArtifacts, [
        {
          taskId: 'task.stored-parallel',
          artifactId: 'stored-evidence-map',
          kind: 'evidenceMap'
        }
      ]);
      assert.deepEqual(report.workflowSpecificSummary['parallel-lanes'].lanes[0].writeSet, ['docs/stored.md']);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it('runs workflow comparison through the eval replay command and writes a report artifact', async () => {
    const root = await mkdtemp(join(tmpdir(), 'mcas-workflow-comparison-gate-'));

    try {
      const artifactDirectory = join(root, 'artifacts');
      const comparisonFile = join(root, 'workflow-comparison.json');
      const store = new ArtifactStore(artifactDirectory);

      await writeFile(comparisonFile, `${JSON.stringify({
        comparedAt: '2026-05-16T00:00:00.000Z',
        samples: [
          {
            id: 'cli-writer-reviewer',
            taskId: 'task.cli-writer-reviewer',
            ensembleRun: {
              version: '1',
              id: 'ensemble-cli-writer-reviewer',
              taskId: 'task.cli-writer-reviewer',
              mode: 'writer-reviewer',
              writer: {
                agentId: 'codex-writer',
                adapterId: 'codex',
                evidenceArtifactId: 'implement-evidence',
                runArtifactId: 'implement-run',
                routeDecisionArtifactId: 'implement-route-decision',
                verificationStatus: 'passed'
              },
              reviewers: [],
              decision: 'accepted',
              finalVerificationStatus: 'passed',
              rejectionReasons: []
            }
          }
        ]
      }, null, 2)}\n`, 'utf8');

      const result = spawnSync(process.execPath, [
        'scripts/eval-replay.js',
        '--',
        '--artifacts', artifactDirectory,
        '--workflow-comparison-file', comparisonFile,
        '--reason', 'workflow-mode-comparison',
        '--report-artifact-id', 'eval-workflow-comparison-cli'
      ], {
        cwd: process.cwd(),
        env: childProcessEnvironment(),
        encoding: 'utf8'
      });

      assert.equal(result.status, 0, result.stderr);

      const output = JSON.parse(result.stdout);

      assert.equal(output.status, 'passed');
      assert.deepEqual(output.reportRef, {
        taskId: 'eval-reports',
        artifactId: 'eval-workflow-comparison-cli'
      });
      assert.equal(
        output.reportArtifactPath,
        join(artifactDirectory, 'eval-reports', 'eval-workflow-comparison-cli.json')
      );
      assert.deepEqual(output.report.modes, ['writer-reviewer']);
      assert.equal(output.report.resultsByMode['writer-reviewer'].status, 'passed');
      assert.deepEqual(await store.readArtifact('eval-reports', 'eval-workflow-comparison-cli'), output.report);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it('emits recommendations without mutating core configuration', () => {
    const coreRouterConfig = Object.freeze({
      commandRoutes: Object.freeze({
        implement: 'gpt-codex-default.v1'
      })
    });

    const report = runEvalReplay({
      reason: 'model-upgrade',
      baseline: 'gpt-codex-default.v1',
      candidate: 'gpt-codex-default.v2',
      sample: {
        id: 'sample-task-1',
        resultsByTask: {
          'task-1': [
            {
              taskId: 'task-1',
              variant: 'baseline',
              verified: false,
              costUsd: 1,
              latencySeconds: 20,
              failureCategory: 'test-failed'
            },
            {
              taskId: 'task-1',
              variant: 'candidate',
              verified: true,
              costUsd: 1,
              latencySeconds: 20,
              failureCategory: null
            }
          ]
        }
      },
      resourceProfile: {
        cpu: '4',
        memoryMb: 8192,
        timeoutSeconds: 3600,
        concurrency: 1,
        network: 'restricted',
        version: '1'
      },
      coreRouterConfig
    });

    assert.equal(report.mutatedCoreConfig, false);
    assert.deepEqual(coreRouterConfig.commandRoutes, {
      implement: 'gpt-codex-default.v1'
    });
    assert.deepEqual(report.recommendations, [
      {
        type: 'review-routing',
        reason: 'candidate-verified-success-rate-improved',
        candidate: 'gpt-codex-default.v2'
      }
    ]);
  });
});

async function appendArtifactEvent(eventLog, id, taskId, artifactId) {
  await eventLog.append({
    id,
    type: 'artifact.written',
    timestamp: '2026-05-13T00:00:00.000Z',
    actor: 'orchestrator',
    payload: {
      taskId,
      artifactId
    },
    version: '1'
  });
}

function childProcessEnvironment() {
  const env = { ...process.env };

  delete env.NODE_TEST_CONTEXT;

  return env;
}
