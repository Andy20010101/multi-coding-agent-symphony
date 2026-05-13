import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

import { ArtifactStore } from '../src/artifact-store.js';
import { SessionEventLog } from '../src/session-event-log.js';
import {
  buildReplaySampleFromSession,
  loadReplaySample,
  runEvalReplay
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
