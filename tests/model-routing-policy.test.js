import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

import { AdapterMappingRegistry } from '../src/adapter-mapping-registry.js';
import { ModelProfileRegistry } from '../src/model-profile-registry.js';
import { RouterScheduler } from '../src/router-scheduler.js';

describe('Phase 6 model profiles and routing policy', () => {
  it('persists model profiles and queries by cost and structured output', async () => {
    const root = await mkdtemp(join(tmpdir(), 'mcas-model-profiles-'));

    try {
      const registry = new ModelProfileRegistry(root);
      const lowCostProfile = modelProfile({
        id: 'gpt-review-low',
        model: 'gpt-5.4-mini',
        costClass: 'low'
      });
      const highCostProfile = modelProfile({
        id: 'gpt-implement-high',
        model: 'gpt-5.5',
        costClass: 'high'
      });

      await registry.register(lowCostProfile);
      await registry.register(highCostProfile);

      const reloaded = new ModelProfileRegistry(root);

      assert.deepEqual(await reloaded.get('gpt-review-low'), lowCostProfile);
      assert.deepEqual(await reloaded.find({
        costClass: 'low',
        supportsStructuredOutput: true
      }), [lowCostProfile]);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it('persists adapter mappings and filters candidates by command and capability', async () => {
    const root = await mkdtemp(join(tmpdir(), 'mcas-adapter-mappings-'));

    try {
      const registry = new AdapterMappingRegistry(root);
      const codexReviewMapping = adapterMapping({
        adapter: 'codex',
        command: 'review',
        modelProfile: 'gpt-review-low'
      });
      const kiroReviewMapping = adapterMapping({
        adapter: 'kiro-cli',
        command: 'review',
        modelProfile: 'claude-review-default'
      });
      const codexImplementMapping = adapterMapping({
        adapter: 'codex',
        command: 'implement',
        modelProfile: 'gpt-implement-high'
      });

      await registry.register(codexReviewMapping);
      await registry.register(kiroReviewMapping);
      await registry.register(codexImplementMapping);

      const reloaded = new AdapterMappingRegistry(root);

      assert.deepEqual(await reloaded.findByCommand('review'), [
        codexReviewMapping,
        kiroReviewMapping
      ]);
      assert.deepEqual(await reloaded.findCandidates({
        command: 'review',
        capabilityReports: [
          {
            adapterId: 'codex',
            supportedCommands: ['implement', 'review'],
            supportsNonInteractive: true
          },
          {
            adapterId: 'kiro-cli',
            supportedCommands: ['review'],
            supportsNonInteractive: true
          },
          {
            adapterId: 'claude-code',
            supportedCommands: ['review'],
            supportsNonInteractive: false
          }
        ],
        excludedAdapters: ['kiro-cli']
      }), [codexReviewMapping]);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it('routes around retryable adapter failures and explains model selection policy', () => {
    const scheduler = new RouterScheduler({
      capabilityReports: [
        capabilityReport({ adapterId: 'codex', supportedCommands: ['implement', 'review'] }),
        capabilityReport({ adapterId: 'kiro-cli', supportedCommands: ['implement', 'review'] })
      ]
    });
    const modelProfiles = [
      modelProfile({
        id: 'gpt-implement-high',
        model: 'gpt-5.5',
        costClass: 'high'
      }),
      modelProfile({
        id: 'claude-implement-medium',
        provider: 'anthropic',
        model: 'claude-sonnet-4-6',
        costClass: 'medium'
      }),
      modelProfile({
        id: 'gpt-review-high',
        model: 'gpt-5.5',
        costClass: 'high'
      }),
      modelProfile({
        id: 'claude-review-low',
        provider: 'anthropic',
        model: 'claude-sonnet-4-6',
        costClass: 'low'
      })
    ];
    const adapterMappings = [
      adapterMapping({
        adapter: 'codex',
        command: 'implement',
        modelProfile: 'gpt-implement-high'
      }),
      adapterMapping({
        adapter: 'kiro-cli',
        command: 'implement',
        modelProfile: 'claude-implement-medium'
      }),
      adapterMapping({
        adapter: 'codex',
        command: 'review',
        modelProfile: 'gpt-review-high'
      }),
      adapterMapping({
        adapter: 'kiro-cli',
        command: 'review',
        modelProfile: 'claude-review-low'
      })
    ];

    const retryRoute = scheduler.route({
      commandSpec: commandSpec('implement'),
      adapterMappings,
      modelProfiles,
      failureHistory: [
        {
          adapterId: 'codex',
          retryable: true,
          category: 'adapter-crashed'
        }
      ]
    });

    assert.equal(retryRoute.adapterId, 'kiro-cli');
    assert.equal(retryRoute.modelProfile, 'claude-implement-medium');
    assert.deepEqual(retryRoute.routeDecision.excludedAdapters, ['codex']);
    assert.equal(retryRoute.routeDecision.reason, 'retryable-failure-excluded');

    const reviewRoute = scheduler.route({
      commandSpec: commandSpec('review'),
      adapterMappings,
      modelProfiles
    });

    assert.equal(reviewRoute.adapterId, 'kiro-cli');
    assert.equal(reviewRoute.modelProfile, 'claude-review-low');
    assert.equal(reviewRoute.routeDecision.reason, 'lower-cost-review-profile');

    const explicitRoute = scheduler.route({
      commandSpec: commandSpec('review'),
      adapterMappings,
      modelProfiles,
      explicitModelProfile: 'gpt-review-high'
    });

    assert.equal(explicitRoute.adapterId, 'codex');
    assert.equal(explicitRoute.modelProfile, 'gpt-review-high');
    assert.equal(explicitRoute.routeDecision.reason, 'explicit-model-override');
  });

  it('keeps eval recommendations advisory until release approval names the candidate model profile', () => {
    const scheduler = new RouterScheduler({
      capabilityReports: [
        capabilityReport({ adapterId: 'codex', supportedCommands: ['review'] }),
        capabilityReport({ adapterId: 'kiro-cli', supportedCommands: ['review'] })
      ]
    });
    const modelProfiles = [
      modelProfile({
        id: 'gpt-review-high',
        model: 'gpt-5.5',
        costClass: 'high'
      }),
      modelProfile({
        id: 'claude-review-low',
        provider: 'anthropic',
        model: 'claude-sonnet-4-6',
        costClass: 'low'
      })
    ];
    const adapterMappings = [
      adapterMapping({
        adapter: 'codex',
        command: 'review',
        modelProfile: 'gpt-review-high'
      }),
      adapterMapping({
        adapter: 'kiro-cli',
        command: 'review',
        modelProfile: 'claude-review-low'
      })
    ];
    const evalRecommendations = [{
      id: 'eval-model-upgrade-sample-1',
      type: 'review-routing',
      reason: 'candidate-verified-success-rate-improved',
      candidate: 'gpt-review-high'
    }];

    const advisoryRoute = scheduler.route({
      commandSpec: commandSpec('review'),
      adapterMappings,
      modelProfiles,
      evalRecommendations
    });

    assert.equal(advisoryRoute.modelProfile, 'claude-review-low');
    assert.equal(advisoryRoute.routeDecision.reason, 'lower-cost-review-profile');

    const approvedRoute = scheduler.route({
      commandSpec: commandSpec('review'),
      adapterMappings,
      modelProfiles,
      evalRecommendations,
      releaseApprovals: [{
        approvalId: 'release-approval-1',
        modelProfile: 'gpt-review-high',
        approvedBy: 'release-manager'
      }]
    });

    assert.equal(approvedRoute.adapterId, 'codex');
    assert.equal(approvedRoute.modelProfile, 'gpt-review-high');
    assert.equal(approvedRoute.routeDecision.reason, 'approved-eval-recommendation');
    assert.equal(approvedRoute.routeDecision.approvalId, 'release-approval-1');
  });
});

function modelProfile({ id, provider = 'openai', model, costClass }) {
  return {
    id,
    provider,
    model,
    contextTokens: 400000,
    maxOutputTokens: 128000,
    supportsStructuredOutput: true,
    supportsVisionInput: false,
    reasoningControls: ['low', 'medium', 'high'],
    costClass,
    retryPolicy: 'standard-coding',
    version: '1'
  };
}

function adapterMapping({ adapter, command, modelProfile }) {
  return {
    adapter,
    command,
    commandVersion: '1',
    modelProfile,
    configTemplate: `${adapter}-${command}-config`,
    promptTemplate: `${command}-prompt`,
    outputParser: 'evidence-package-json',
    failureMapper: `${adapter}-failure-mapper`
  };
}

function capabilityReport({ adapterId, supportedCommands }) {
  return {
    adapterId,
    cliName: adapterId,
    cliVersion: '1.0.0',
    supportedCommands,
    modelProfiles: [],
    supportsNonInteractive: true,
    supportsResume: true,
    supportsCancel: true,
    supportsHooks: true,
    supportsMcp: true,
    supportsStructuredOutput: true,
    workspaceIsolation: 'worktree',
    logStrategy: 'jsonl',
    version: '1'
  };
}

function commandSpec(name) {
  return {
    name,
    version: '1',
    allowedTools: ['read'],
    workspacePolicy: name === 'implement' ? 'primary-writer' : 'review-only',
    doneCriteria: ['evidence-written'],
    evidenceSchema: `${name}-evidence.v1`
  };
}
