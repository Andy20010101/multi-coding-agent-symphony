import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  ValidationError,
  validateAdapterMapping,
  validateEvidencePackage,
  validateModelProfile
} from '../src/contracts.js';

describe('Complete core contract validation', () => {
  it('validates AdapterMapping contracts with typed errors', () => {
    const mapping = {
      adapter: 'codex',
      command: 'implement',
      commandVersion: '1',
      modelProfile: 'gpt-codex-default',
      configTemplate: 'codex-config',
      promptTemplate: 'implement-prompt',
      outputParser: 'jsonl-parser',
      failureMapper: 'codex-failure-mapper'
    };

    assert.equal(validateAdapterMapping(mapping), mapping);
    assert.throws(
      () => validateAdapterMapping({ ...mapping, modelProfile: '' }),
      ValidationError
    );
  });

  it('validates ModelProfile contracts with typed errors', () => {
    const profile = {
      id: 'gpt-codex-default',
      provider: 'openai',
      model: 'gpt-codex',
      contextTokens: 400000,
      maxOutputTokens: 128000,
      supportsStructuredOutput: true,
      supportsVisionInput: true,
      reasoningControls: ['low', 'medium', 'high'],
      costClass: 'high',
      retryPolicy: 'standard-coding',
      version: '1'
    };

    assert.equal(validateModelProfile(profile), profile);
    assert.throws(
      () => validateModelProfile({ ...profile, contextTokens: 0 }),
      ValidationError
    );
  });

  it('validates evidence packages with typed errors', () => {
    const evidence = {
      command: 'implement',
      taskId: 'task-123',
      workspaceId: 'workspace-123',
      diffSummary: ['added contracts'],
      changedFiles: ['src/contracts.js'],
      checks: [{
        name: 'pnpm test',
        status: 'passed',
        command: 'pnpm test',
        exitCode: 0,
        output: '48 tests passed',
        artifactId: 'test-log',
        startedAt: '2026-05-13T00:00:00.000Z',
        finishedAt: '2026-05-13T00:00:01.000Z'
      }],
      knownRisks: [],
      agentSummary: 'Implemented validators.',
      noOpRationale: 'No code changes were needed.',
      findings: ['No blocking findings.'],
      noFindingRationale: 'Review found no issues.',
      version: '1'
    };

    assert.equal(validateEvidencePackage(evidence), evidence);
    assert.throws(
      () => validateEvidencePackage({ ...evidence, checks: [] }),
      ValidationError
    );
    assert.throws(
      () => validateEvidencePackage({
        ...evidence,
        checks: [{ name: 'pnpm test', status: 'passed' }]
      }),
      ValidationError
    );
    assert.equal(validateEvidencePackage({
      ...evidence,
      checks: [{ name: 'pnpm test', status: 'passed', artifactId: 'test-log' }]
    }).checks[0].artifactId, 'test-log');
    assert.throws(
      () => validateEvidencePackage({
        ...evidence,
        checks: [{ name: 'pnpm test', status: 'passed', output: 'ok', startedAt: 'not-a-date' }]
      }),
      ValidationError
    );
    assert.throws(
      () => validateEvidencePackage({ ...evidence, diffSummary: undefined }),
      ValidationError
    );
    assert.throws(
      () => validateEvidencePackage({ ...evidence, noFindingRationale: '' }),
      ValidationError
    );
  });
});
