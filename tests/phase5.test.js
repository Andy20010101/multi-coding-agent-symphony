import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

import { ArtifactStore } from '../src/artifact-store.js';
import {
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

