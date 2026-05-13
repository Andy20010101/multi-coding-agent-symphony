import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

import { AdapterMappingRegistry } from '../src/adapter-mapping-registry.js';
import { ModelProfileRegistry } from '../src/model-profile-registry.js';

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
});

function modelProfile({ id, model, costClass }) {
  return {
    id,
    provider: 'openai',
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
