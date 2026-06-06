import { readFile } from 'node:fs/promises';
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  buildControlledProviderRunnerContract,
  validateControlledProviderRunnerContract,
  V41_ACTIVE_PROVIDER_RUNNER_IDS
} from '../src/symphony/controlled-provider-runner-contract.js';

describe('v41 controlled-provider-runner.v1 contract', () => {
  it('validates the fixture and generated contract with exactly the v41 active providers', async () => {
    const fixture = JSON.parse(await readFile('fixtures/contracts/controlled-provider-runner.v1.json', 'utf8'));
    const generated = buildControlledProviderRunnerContract({
      generatedAt: '2026-06-06T00:00:00.000Z'
    });

    assert.deepEqual(validateControlledProviderRunnerContract(fixture), {
      ok: true,
      errors: []
    });
    assert.deepEqual(validateControlledProviderRunnerContract(generated), {
      ok: true,
      errors: []
    });
    assert.deepEqual(generated, fixture);
    assert.deepEqual(
      fixture.activeProviders.map((provider) => provider.providerId).sort(),
      [...V41_ACTIVE_PROVIDER_RUNNER_IDS].sort()
    );
    assert.deepEqual(
      fixture.boundaries.activeProviderIds.sort(),
      ['claude-code-cli', 'codex-cli']
    );
  });

  it('rejects Gemini, Kiro, and DeepSeek as active provider drift', async () => {
    const fixture = JSON.parse(await readFile('fixtures/contracts/controlled-provider-runner.v1.json', 'utf8'));
    const drift = structuredClone(fixture);

    drift.activeProviders.push({
      ...structuredClone(fixture.activeProviders[0]),
      providerId: 'deepseek',
      adapterId: 'deepseek',
      sourceProfileRef: 'deepseek.backend-profile'
    });
    drift.commandTemplates[0].providerId = 'gemini-cli';
    drift.boundaries.activeProviderIds.push('kiro-cli');

    const errors = validateControlledProviderRunnerContract(drift).errors;

    assert.equal(errors.includes('activeProviders must contain exactly claude-code-cli and codex-cli'), true);
    assert.equal(errors.includes('activeProviders must not include gemini-cli, kiro-cli, or deepseek'), true);
    assert.equal(errors.includes('commandTemplates[0].providerId must be one of claude-code-cli,codex-cli'), true);
    assert.equal(errors.includes('boundaries.activeProviderIds must match claude-code-cli,codex-cli'), true);
  });

  it('rejects arbitrary shell command, path, and renderer-owned command construction drift', async () => {
    const fixture = JSON.parse(await readFile('fixtures/contracts/controlled-provider-runner.v1.json', 'utf8'));
    const drift = structuredClone(fixture);

    drift.runnerInput.acceptedFields.push('command');
    drift.runnerInput.acceptedFields.push('cwd');
    drift.runnerInput.commandTextInputAvailable = true;
    drift.runnerInput.arbitraryPathInputAvailable = true;
    drift.runnerInput.rendererCommandConstructionAvailable = true;
    drift.commandTemplates[0].rawCommand = 'claude --dangerously-run-prompt';
    drift.commandTemplates[0].cwd = '/tmp';
    drift.commandTemplates[0].owner = 'renderer';
    drift.commandTemplates[0].commandTextAvailable = true;
    drift.commandTemplates[0].rendererConstructionAvailable = true;
    drift.commandTemplates[0].shellExpansionAvailable = true;
    drift.boundaries.rendererProviderInvocationAvailable = true;
    drift.boundaries.rawShellCommandAvailable = true;
    drift.boundaries.genericShellRunnerAvailable = true;
    drift.boundaries.arbitraryCommandExecutionAvailable = true;

    const errors = validateControlledProviderRunnerContract(drift).errors;

    assert.equal(errors.includes('runnerInput.acceptedFields must not include forbidden field command'), true);
    assert.equal(errors.includes('runnerInput.acceptedFields must not include forbidden field cwd'), true);
    assert.equal(errors.includes('runnerInput.commandTextInputAvailable must be false'), true);
    assert.equal(errors.includes('runnerInput.arbitraryPathInputAvailable must be false'), true);
    assert.equal(errors.includes('runnerInput.rendererCommandConstructionAvailable must be false'), true);
    assert.equal(errors.includes('commandTemplates[0].rawCommand is not allowed because runner templates are backend-owned'), true);
    assert.equal(errors.includes('commandTemplates[0].cwd is not allowed because runner templates are backend-owned'), true);
    assert.equal(errors.includes('commandTemplates[0].owner must be "backend"'), true);
    assert.equal(errors.includes('commandTemplates[0].commandTextAvailable must be false'), true);
    assert.equal(errors.includes('commandTemplates[0].rendererConstructionAvailable must be false'), true);
    assert.equal(errors.includes('commandTemplates[0].shellExpansionAvailable must be false'), true);
    assert.equal(errors.includes('boundaries.rendererProviderInvocationAvailable must be false'), true);
    assert.equal(errors.includes('boundaries.rawShellCommandAvailable must be false'), true);
    assert.equal(errors.includes('boundaries.genericShellRunnerAvailable must be false'), true);
    assert.equal(errors.includes('boundaries.arbitraryCommandExecutionAvailable must be false'), true);
  });

  it('rejects forbidden runner input payload properties when present as extra keys', async () => {
    const fixture = JSON.parse(await readFile('fixtures/contracts/controlled-provider-runner.v1.json', 'utf8'));
    const drift = structuredClone(fixture);

    Object.assign(drift.runnerInput, {
      command: 'claude --dangerously-run-prompt',
      rawCommand: 'codex exec unsafe',
      commandLine: 'claude -p raw',
      shell: '/bin/zsh',
      args: ['--dangerously-skip-permissions'],
      argv: ['codex', 'exec'],
      cwd: '/tmp',
      path: '/Users/andy/.ssh',
      localPath: '/tmp/worktree',
      absolutePath: '/etc/passwd',
      executablePath: '/usr/local/bin/claude',
      commandPath: '/opt/homebrew/bin/codex',
      env: { SAFE_LOOKING: 'present' },
      apiKey: 'redacted-api-key-ref',
      authToken: 'redacted-auth-token-ref',
      oauthToken: 'redacted-oauth-token-ref',
      credentialFile: '/Users/andy/.config/provider/token',
      credentialFileContents: 'redacted-credential-file-contents-ref',
      secretValue: 'redacted-secret-ref',
      rawProviderSettings: { approvalMode: 'renderer-owned' },
      rendererCommandTemplate: 'renderer-built-template'
    });

    const errors = validateControlledProviderRunnerContract(drift).errors;

    for (const key of [
      'command',
      'rawCommand',
      'commandLine',
      'shell',
      'args',
      'argv',
      'cwd',
      'path',
      'localPath',
      'absolutePath',
      'executablePath',
      'commandPath',
      'env',
      'apiKey',
      'authToken',
      'oauthToken',
      'credentialFile',
      'credentialFileContents',
      'secretValue',
      'rawProviderSettings',
      'rendererCommandTemplate'
    ]) {
      assert.equal(
        errors.includes(`runnerInput.${key} is not allowed because controlled runner inputs are backend-scoped`),
        true
      );
    }
  });

  it('requires the exact runner input context fields', async () => {
    const fixture = JSON.parse(await readFile('fixtures/contracts/controlled-provider-runner.v1.json', 'utf8'));
    const drift = structuredClone(fixture);

    drift.runnerInput.requiredFields = ['goalId'];

    const errors = validateControlledProviderRunnerContract(drift).errors;

    assert.equal(
      errors.includes('runnerInput.requiredFields must match goalId,mode,promptRef,providerId,role,runId,taskId'),
      true
    );
  });

  it('rejects mismatched command template ids, provider ids, and roles', async () => {
    const fixture = JSON.parse(await readFile('fixtures/contracts/controlled-provider-runner.v1.json', 'utf8'));
    const drift = structuredClone(fixture);

    drift.commandTemplates[0].providerId = 'codex-cli';
    drift.commandTemplates[0].commandRef = 'codex';
    drift.commandTemplates[1].supportedRoles = ['worker'];

    const errors = validateControlledProviderRunnerContract(drift).errors;

    assert.equal(errors.includes('commandTemplates[0].providerId must be "claude-code-cli"'), true);
    assert.equal(errors.includes('commandTemplates[1].supportedRoles must match reviewer'), true);
  });

  it('rejects unexpected runner output fields before raw provider output can be exposed', async () => {
    const fixture = JSON.parse(await readFile('fixtures/contracts/controlled-provider-runner.v1.json', 'utf8'));
    const drift = structuredClone(fixture);

    drift.runnerOutput.rawProviderOutput = 'provider transcript without a secret-looking token';
    drift.runnerOutput.rawProviderTranscript = 'sanitized-looking but still raw output';

    const errors = validateControlledProviderRunnerContract(drift).errors;

    assert.equal(
      errors.includes('runnerOutput.rawProviderOutput is not an allowed field because runner output must be sanitized'),
      true
    );
    assert.equal(
      errors.includes('runnerOutput.rawProviderTranscript is not an allowed field because runner output must be sanitized'),
      true
    );
  });

  it('rejects secret-bearing fields and secret-looking output while preserving explicit false boundary flags', async () => {
    const fixture = JSON.parse(await readFile('fixtures/contracts/controlled-provider-runner.v1.json', 'utf8'));
    const drift = structuredClone(fixture);

    drift.runnerInput.apiKey = 'sk-test-secret-leak';
    drift.runnerInput.credentialFileContents = 'token=plain-text';
    drift.activeProviders[0].backendRunner.secretMaterialAvailable = true;
    drift.inactiveProviders[0].reason = 'sk-test-secret-leak';
    drift.runnerOutput.rawProviderOutput = '-----BEGIN PRIVATE KEY-----';
    drift.boundaries.envValueExposureAvailable = true;

    const errors = validateControlledProviderRunnerContract(drift).errors;

    assert.equal(errors.includes('runnerInput.apiKey is not allowed because controlled runner contracts must be sanitized'), true);
    assert.equal(errors.includes('runnerInput.credentialFileContents is not allowed because controlled runner contracts must be sanitized'), true);
    assert.equal(errors.includes('activeProviders[0].backendRunner.secretMaterialAvailable is not allowed because controlled runner contracts must be sanitized'), true);
    assert.equal(errors.includes('inactiveProviders[0].reason must not contain secret-looking values'), true);
    assert.equal(errors.includes('runnerOutput.rawProviderOutput must not contain secret-looking values'), true);
    assert.equal(errors.includes('boundaries.envValueExposureAvailable is not allowed because controlled runner contracts must be sanitized'), true);

    assert.deepEqual(validateControlledProviderRunnerContract(fixture), {
      ok: true,
      errors: []
    });
  });

  it('records backend-only execution, sanitized output fields, and bounded failure layers without implementing task-2', async () => {
    const fixture = JSON.parse(await readFile('fixtures/contracts/controlled-provider-runner.v1.json', 'utf8'));

    assert.equal(fixture.boundaries.providerCliExecutionAvailableOnlyThroughBackendRunner, true);
    assert.equal(fixture.boundaries.task2ExecutionAdapterImplemented, false);
    assert.equal(fixture.boundaries.rendererProviderInvocationAvailable, false);
    assert.equal(fixture.boundaries.genericShellRunnerAvailable, false);
    assert.equal(fixture.runnerOutput.rawProviderOutputAvailable, false);
    assert.equal(fixture.runnerOutput.sanitizedSummaryRequired, true);
    assert.equal(fixture.runnerOutput.redactionStatusRequired, true);
    assert.deepEqual(
      fixture.failureStates.map((state) => state.failureLayer).sort(),
      [
        'command-execution',
        'expected-check',
        'provider-availability',
        'redaction',
        'schema',
        'timeout',
        'workspace'
      ]
    );

    for (const template of fixture.commandTemplates) {
      assert.equal(template.owner, 'backend');
      assert.equal(template.argvShape, 'backend-owned-template');
      assert.equal(template.commandTextAvailable, false);
      assert.equal(template.rendererConstructionAvailable, false);
    }
  });
});
