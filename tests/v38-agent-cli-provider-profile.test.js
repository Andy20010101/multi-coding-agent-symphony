import { readFile } from 'node:fs/promises';
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  buildAgentCliProviderProfileContract,
  validateAgentCliProviderProfileContract,
  V38_ACTIVE_AGENT_CLI_PROVIDER_IDS
} from '../src/symphony/agent-cli-provider-profile.js';

describe('v38 agent-cli-provider.v1 contract', () => {
  it('validates the fixture and generated contract with only the two v38 active providers', async () => {
    const fixture = JSON.parse(await readFile('fixtures/contracts/agent-cli-provider.v1.json', 'utf8'));
    const generated = buildAgentCliProviderProfileContract({
      generatedAt: '2026-06-04T00:00:00.000Z'
    });

    assert.deepEqual(validateAgentCliProviderProfileContract(fixture), {
      ok: true,
      errors: []
    });
    assert.deepEqual(validateAgentCliProviderProfileContract(generated), {
      ok: true,
      errors: []
    });

    assert.deepEqual(
      fixture.activeProviders.map((provider) => provider.providerId).sort(),
      [...V38_ACTIVE_AGENT_CLI_PROVIDER_IDS].sort()
    );
    assert.deepEqual(
      fixture.activeProviders.map((provider) => provider.localCommand.command).sort(),
      ['claude', 'codex']
    );
    assert.deepEqual(
      fixture.activeProviders.map((provider) => provider.providerKind),
      ['agent-cli', 'agent-cli']
    );
  });

  it('rejects Gemini, Kiro, and DeepSeek as v38 active provider drift', async () => {
    const fixture = JSON.parse(await readFile('fixtures/contracts/agent-cli-provider.v1.json', 'utf8'));
    const drift = structuredClone(fixture);

    drift.activeProviders.push({
      ...structuredClone(fixture.activeProviders[0]),
      providerId: 'deepseek',
      displayName: 'DeepSeek',
      adapterId: 'deepseek',
      localCommand: {
        ...structuredClone(fixture.activeProviders[0].localCommand),
        command: 'deepseek'
      }
    });

    const errors = validateAgentCliProviderProfileContract(drift).errors;

    assert.equal(errors.includes('activeProviders must contain exactly claude-code-cli and codex-cli'), true);
    assert.equal(errors.includes('activeProviders must not include gemini-cli, kiro-cli, or deepseek'), true);
    assert.equal(errors.includes('activeProviders must match claude-code-cli,codex-cli'), true);

    for (const forbiddenProviderId of ['gemini-cli', 'kiro-cli']) {
      const forbidden = structuredClone(fixture);
      forbidden.activeProviders[1].providerId = forbiddenProviderId;

      assert.equal(
        validateAgentCliProviderProfileContract(forbidden).errors.includes('activeProviders must not include gemini-cli, kiro-cli, or deepseek'),
        true
      );
    }
  });

  it('rejects backend profile secret material and raw provider settings', async () => {
    const fixture = JSON.parse(await readFile('fixtures/contracts/agent-cli-provider.v1.json', 'utf8'));
    const secretLeak = structuredClone(fixture);

    secretLeak.activeProviders[0].backendProfile.apiKey = 'sk-test-secret-leak';
    secretLeak.activeProviders[0].backendProfile.password = 'plain-text-password';
    secretLeak.activeProviders[0].backendProfile.authToken = 'plain-auth-token';
    secretLeak.activeProviders[0].backendProfile.rawProviderSettings = {
      credentialFileContents: 'token=abc123'
    };
    secretLeak.activeProviders[1].backendProfile.profileRef = 'codex-cli.backend-profile';

    const errors = validateAgentCliProviderProfileContract(secretLeak).errors;

    assert.equal(
      errors.includes('activeProviders[0].backendProfile.apiKey is not allowed because backend profiles must be sanitized'),
      true
    );
    assert.equal(
      errors.includes('activeProviders[0].backendProfile.password is not allowed because backend profiles must be sanitized'),
      true
    );
    assert.equal(
      errors.includes('activeProviders[0].backendProfile.authToken is not allowed because backend profiles must be sanitized'),
      true
    );
    assert.equal(
      errors.includes('activeProviders[0].backendProfile.rawProviderSettings is not allowed because backend profiles must be sanitized'),
      true
    );

    const secretValue = structuredClone(fixture);
    secretValue.activeProviders[0].availability.blocker = '-----BEGIN PRIVATE KEY-----';

    assert.equal(
      validateAgentCliProviderProfileContract(secretValue).errors.includes('activeProviders[0].availability.blocker must not contain secret-looking values'),
      true
    );
  });

  it('rejects raw shell, provider CLI execution, prompt dispatch, and model invocation drift', async () => {
    const fixture = JSON.parse(await readFile('fixtures/contracts/agent-cli-provider.v1.json', 'utf8'));
    const drift = structuredClone(fixture);

    drift.activeProviders[0].localCommand.args = ['--dangerously-run-prompt'];
    drift.activeProviders[0].localCommand.commandPath = '/usr/bin/claude';
    drift.activeProviders[0].localCommand.commandExecutionAvailable = true;
    drift.activeProviders[0].promptBoundary.promptDispatchAvailable = true;
    drift.activeProviders[0].promptBoundary.sendsPromptToProvider = true;
    drift.activeProviders[1].execution.providerCliExecutionAvailable = true;
    drift.activeProviders[1].execution.rawShellCommandAvailable = true;
    drift.activeProviders[1].execution.genericShellRunnerAvailable = true;
    drift.activeProviders[1].execution.modelInvocationAvailable = true;
    drift.boundaries.providerCliExecutionAvailable = true;
    drift.boundaries.rendererProviderInvocationAvailable = true;
    drift.boundaries.promptDispatchAvailable = true;
    drift.boundaries.modelInvocationAvailable = true;
    drift.boundaries.genericShellRunnerAvailable = true;

    const errors = validateAgentCliProviderProfileContract(drift).errors;

    assert.equal(errors.includes('activeProviders[0].localCommand.args is not allowed in v38 task-1'), true);
    assert.equal(errors.includes('activeProviders[0].localCommand.commandPath is not allowed in v38 task-1'), true);
    assert.equal(errors.includes('activeProviders[0].localCommand.commandExecutionAvailable must be false'), true);
    assert.equal(errors.includes('activeProviders[0].promptBoundary.promptDispatchAvailable must be false'), true);
    assert.equal(errors.includes('activeProviders[0].promptBoundary.sendsPromptToProvider must be false'), true);
    assert.equal(errors.includes('activeProviders[1].execution.providerCliExecutionAvailable must be false'), true);
    assert.equal(errors.includes('activeProviders[1].execution.rawShellCommandAvailable must be false'), true);
    assert.equal(errors.includes('activeProviders[1].execution.genericShellRunnerAvailable must be false'), true);
    assert.equal(errors.includes('activeProviders[1].execution.modelInvocationAvailable must be false'), true);
    assert.equal(errors.includes('boundaries.providerCliExecutionAvailable must be false'), true);
    assert.equal(errors.includes('boundaries.rendererProviderInvocationAvailable must be false'), true);
    assert.equal(errors.includes('boundaries.promptDispatchAvailable must be false'), true);
    assert.equal(errors.includes('boundaries.modelInvocationAvailable must be false'), true);
    assert.equal(errors.includes('boundaries.genericShellRunnerAvailable must be false'), true);
  });

  it('rejects unknown backend profile and local command fields through strict allowlists', async () => {
    const fixture = JSON.parse(await readFile('fixtures/contracts/agent-cli-provider.v1.json', 'utf8'));
    const drift = structuredClone(fixture);

    drift.activeProviders[0].backendProfile.region = 'us-east-1';
    drift.activeProviders[0].localCommand.timeoutMs = 1000;

    const errors = validateAgentCliProviderProfileContract(drift).errors;

    assert.equal(errors.includes('activeProviders[0].backendProfile.region is not an allowed field'), true);
    assert.equal(errors.includes('activeProviders[0].localCommand.timeoutMs is not an allowed field'), true);
  });

  it('keeps task-2, task-3, and task-5 surfaces disabled in the task-1 contract', async () => {
    const fixture = JSON.parse(await readFile('fixtures/contracts/agent-cli-provider.v1.json', 'utf8'));

    assert.equal(fixture.boundaries.healthCheckApiAvailable, false);
    assert.equal(fixture.boundaries.task3CapabilityMappingAvailable, false);
    assert.equal(fixture.boundaries.providerHubPanelAvailable, false);

    for (const provider of fixture.activeProviders) {
      assert.equal(provider.availability.healthCheckImplementedInV38Task1, false);
      assert.equal(provider.capabilityBoundary.task3MappingImplemented, false);
      assert.equal(provider.execution.providerCliExecutionAvailable, false);
      assert.equal(provider.promptBoundary.sendsPromptToProvider, false);
    }
  });
});
