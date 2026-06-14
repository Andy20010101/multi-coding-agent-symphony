import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { mkdir, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { createSymphonyConsoleServer } from '../src/symphony/console.js';
import {
  ACTIVE_PROVIDER_IDS,
  PROVIDER_READINESS_BOUNDARIES,
  PROVIDER_READINESS_CONTRACT_NAME,
  ProviderReadinessContractError,
  assertProviderReadinessContract,
  buildProviderReadiness,
  buildProviderReadinessProjection,
  deriveProviderReadinessBlockedReasons,
  validateProviderReadinessContract
} from '../src/symphony/provider-readiness-contracts.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, '..');
const FIXTURE_DIR = join(REPO_ROOT, 'fixtures/contracts/provider-readiness');

const VALID_FIXTURES = Object.freeze([
  'provider-readiness.both-ready.v1.json',
  'provider-readiness.codex-missing.v1.json',
  'provider-readiness.claude-missing.v1.json',
  'provider-readiness.claude-provider-mismatch.v1.json',
  'provider-readiness.missing-deepseek-config.v1.json',
  'provider-readiness.kiro-historical.v1.json',
  'provider-readiness.unsupported-provider-claim-blocked.v1.json'
]);

const INVALID_FIXTURES = Object.freeze([
  [
    'provider-readiness.secret-like-value.invalid.v1.json',
    'configuration.secretValue is not allowed'
  ],
  [
    'provider-readiness.local-session-path.invalid.v1.json',
    'must not contain secrets, raw provider output, local session refs, or command material'
  ],
  [
    'provider-readiness.raw-provider-output.invalid.v1.json',
    'helpSmoke.rawStdout is not allowed'
  ],
  [
    'provider-readiness.unsupported-active-provider.invalid.v1.json',
    'activeProviders[2].providerId must be one of codex-cli, claude-code-cli'
  ]
]);

describe('v65 Provider Readiness: Codex and Claude Code only', () => {
  it('validates provider readiness fixtures without exposing secrets, sessions, or raw output', () => {
    for (const name of VALID_FIXTURES) {
      const contract = fixture(name);
      const validation = validateProviderReadinessContract(contract);

      assert.equal(validation.ok, true, `${name}: ${validation.errors.join('; ')}`);
      assert.equal(contract.contractName, PROVIDER_READINESS_CONTRACT_NAME);
      assert.equal(contract.readOnly, true, name);
      assert.equal(contract.willMutate, false, name);
      assert.deepEqual(contract.boundaries, PROVIDER_READINESS_BOUNDARIES, name);
      assert.equal(contract.boundaries.providerExecutionFromReadinessAvailable, false, name);
      assert.equal(contract.boundaries.genericProviderPickerAvailable, false, name);
      assert.equal(contract.boundaries.rawProviderCliLauncherAvailable, false, name);
      assert.equal(contract.boundaries.frontendLocalJsonlReadAvailable, false, name);
      assert.equal(contract.boundaries.frontendProviderFolderReadAvailable, false, name);
      assert.equal(contract.boundaries.rawTranscriptExposureAvailable, false, name);
      assert.equal(contract.boundaries.rawStdoutExposureAvailable, false, name);
      assert.equal(contract.boundaries.rawStderrExposureAvailable, false, name);
      assert.equal(contract.boundaries.secretValueExposureAvailable, false, name);
      assert.equal(contract.boundaries.gitMergeAvailable, false, name);
      assert.equal(contract.boundaries.githubReleaseAutomationAvailable, false, name);
      assert.equal(contract.evidencePolicy.sanitizedReadinessOnly, true, name);
      assert.equal(contract.evidencePolicy.rawProviderOutputAllowed, false, name);
      assert.equal(contract.evidencePolicy.localSessionPathAllowed, false, name);
      assertNoUnsafeStringValues(contract, name);
    }
  });

  it('keeps the active provider line to Codex worker and Claude Code reviewer only', () => {
    const ready = fixture('provider-readiness.both-ready.v1.json');
    const [codex, claude] = ready.activeProviders;

    assert.deepEqual(ready.activeProviders.map((provider) => provider.providerId), ACTIVE_PROVIDER_IDS);
    assert.equal(codex.role, 'worker');
    assert.equal(codex.lane, 'codex-worker-candidate');
    assert.equal(codex.configuration.kind, 'codex-cli');
    assert.equal(codex.configuration.deepSeekConfigStatus, 'not-required');
    assert.equal(claude.role, 'reviewer');
    assert.equal(claude.lane, 'claude-code-reviewer-candidate');
    assert.equal(claude.configuration.kind, 'claude-code-provider-config');
    assert.equal(claude.configuration.deepSeekConfigStatus, 'present');
    assert.equal(claude.configuration.deepSeekAsIndependentProvider, false);
    assert.equal(ready.operatorRole.providerId, 'operator');
    assert.equal(ready.operatorRole.role, 'main-verifier');
    assert.equal(ready.operatorRole.willMutateInProduct, false);
    assert.deepEqual(deriveProviderReadinessBlockedReasons(ready), []);
  });

  it('records missing and mismatched readiness as explicit blockers', () => {
    const codexMissing = fixture('provider-readiness.codex-missing.v1.json');
    const claudeMissing = fixture('provider-readiness.claude-missing.v1.json');
    const claudeMismatch = fixture('provider-readiness.claude-provider-mismatch.v1.json');
    const missingDeepSeek = fixture('provider-readiness.missing-deepseek-config.v1.json');

    assert.equal(codexMissing.state, 'missing');
    assert.ok(codexMissing.blockedReasons.includes('codex-cli-missing'));
    assert.ok(codexMissing.blockedReasons.includes('codex-cli-binary-missing'));
    assert.ok(codexMissing.blockedReasons.includes('codex-cli-help-smoke-not-run'));

    assert.equal(claudeMissing.state, 'missing');
    assert.ok(claudeMissing.blockedReasons.includes('claude-code-cli-missing'));
    assert.ok(claudeMissing.blockedReasons.includes('claude-code-cli-deepseek-config-missing'));

    assert.equal(claudeMismatch.state, 'blocked');
    assert.ok(claudeMismatch.blockedReasons.includes('claude-code-cli-deepseek-config-mismatch'));

    assert.equal(missingDeepSeek.state, 'blocked');
    assert.ok(missingDeepSeek.blockedReasons.includes('claude-code-cli-deepseek-config-missing'));
  });

  it('keeps Kiro historical and blocks unsupported provider claims without making them active', () => {
    const kiroHistorical = fixture('provider-readiness.kiro-historical.v1.json');
    const unsupportedClaim = fixture('provider-readiness.unsupported-provider-claim-blocked.v1.json');

    assert.equal(kiroHistorical.historicalProviders[0].providerId, 'kiro-cli');
    assert.equal(kiroHistorical.historicalProviders[0].status, 'historical');
    assert.equal(kiroHistorical.historicalProviders[0].activeWorkbenchProvider, false);
    assert.deepEqual(
      deriveProviderReadinessBlockedReasons({
        ...kiroHistorical,
        historicalProviders: [{
          ...kiroHistorical.historicalProviders[0],
          activeWorkbenchProvider: true
        }]
      }),
      ['kiro-cli-historical-active-claim']
    );

    assert.equal(unsupportedClaim.state, 'blocked');
    assert.equal(unsupportedClaim.unsupportedProviders[0].providerId, 'gemini-cli');
    assert.equal(unsupportedClaim.unsupportedProviders[0].status, 'blocked');
    assert.equal(unsupportedClaim.unsupportedProviders[0].activeWorkbenchProvider, false);
    assert.ok(unsupportedClaim.blockedReasons.includes('unsupported-provider-active-claim-gemini-cli'));
  });

  it('rejects invalid fixtures with secret values, local session paths, raw provider output, and unsupported active providers', () => {
    for (const [name, expectedError] of INVALID_FIXTURES) {
      const validation = validateProviderReadinessContract(fixture(name));

      assert.equal(validation.ok, false, name);
      assert.ok(
        validation.errors.some((error) => error.includes(expectedError)),
        `${name}: expected ${expectedError}; got ${validation.errors.join('; ')}`
      );
    }
  });

  it('builds provider readiness contracts from sanitized backend-owned status inputs', () => {
    const ready = fixture('provider-readiness.both-ready.v1.json');
    const builtReady = buildProviderReadiness({
      generatedAt: ready.generatedAt,
      currentProject: ready.currentProject,
      activeProviders: ready.activeProviders,
      historicalProviders: ready.historicalProviders,
      operatorRole: ready.operatorRole,
      evidencePolicy: ready.evidencePolicy
    });

    assertProviderReadinessContract(builtReady);
    assert.equal(builtReady.state, 'ready');
    assert.deepEqual(builtReady.blockedReasons, []);

    const missingCodex = buildProviderReadiness({
      generatedAt: ready.generatedAt,
      currentProject: ready.currentProject,
      activeProviders: ready.activeProviders.map((provider) => provider.providerId === 'codex-cli'
        ? {
            ...provider,
            status: 'missing',
            binaryPresence: { state: 'missing', checked: true, evidenceRef: null, reason: 'codex cli missing' },
            modelProfile: { state: 'missing', checked: true, evidenceRef: null, reason: 'codex profile missing' },
            helpSmoke: { state: 'not-run', checked: false, evidenceRef: null, reason: 'codex cli missing' }
          }
        : provider),
      historicalProviders: ready.historicalProviders,
      operatorRole: ready.operatorRole,
      evidencePolicy: ready.evidencePolicy
    });

    assert.equal(missingCodex.state, 'missing');
    assert.ok(missingCodex.blockedReasons.includes('codex-cli-missing'));
  });

  it('projects provider readiness from backend provider health without running provider CLIs', async () => {
    const env = {
      OPENAI_API_KEY: 'sk-test-secret-value',
      ANTHROPIC_API_KEY: 'sk-test-secret-value',
      DEEPSEEK_API_KEY: 'sk-test-secret-value'
    };
    const readiness = buildProviderReadinessProjection({
      generatedAt: '2026-06-15T03:05:00.000Z',
      env
    });

    assert.equal(validateProviderReadinessContract(readiness).ok, true);
    assert.equal(readiness.contractName, PROVIDER_READINESS_CONTRACT_NAME);
    assert.equal(readiness.state, 'degraded');
    assert.deepEqual(readiness.activeProviders.map((provider) => provider.providerId), ACTIVE_PROVIDER_IDS);
    assert.equal(readiness.activeProviders[0].binaryPresence.state, 'unknown');
    assert.equal(readiness.activeProviders[0].helpSmoke.state, 'not-run');
    assert.equal(readiness.activeProviders[1].configuration.kind, 'claude-code-provider-config');
    assert.equal(readiness.activeProviders[1].configuration.deepSeekConfigStatus, 'present');
    assert.equal(readiness.activeProviders[1].configuration.deepSeekAsIndependentProvider, false);
    assert.equal(readiness.unsupportedProviders.find((provider) => provider.providerId === 'deepseek-cli').status, 'blocked');
    assert.equal(readiness.evidencePolicy.rawProviderOutputAllowed, false);
    assert.equal(readiness.boundaries.providerExecutionFromReadinessAvailable, false);
    assert.doesNotMatch(JSON.stringify(readiness), /sk-test-secret-value/u);

    const root = await mkdtemp(join(tmpdir(), 'symphony-v65-provider-readiness-api-'));

    try {
      await mkdir(join(root, '.git'));
      const server = createSymphonyConsoleServer({
        stateDir: join(root, '.symphony'),
        cwd: root,
        env
      });
      const baseUrl = await listenOnRandomPort(server);

      try {
        const response = await fetch(`${baseUrl}/api/providers/readiness`);

        assert.equal(response.status, 200);

        const apiReadiness = await response.json();

        assert.equal(validateProviderReadinessContract(apiReadiness).ok, true);
        assert.equal(apiReadiness.contractName, PROVIDER_READINESS_CONTRACT_NAME);
        assert.doesNotMatch(JSON.stringify(apiReadiness), /sk-test-secret-value/u);

        const postResponse = await fetch(`${baseUrl}/api/providers/readiness`, { method: 'POST' });
        const queryResponse = await fetch(`${baseUrl}/api/providers/readiness?provider=deepseek-cli`);

        assert.equal(postResponse.status, 405);
        assert.equal((await postResponse.json()).contractName, 'error-envelope.v1');
        assert.equal(queryResponse.status, 400);
        assert.equal((await queryResponse.json()).error.code, 'invalid-provider-readiness-request');
      } finally {
        await closeServer(server);
      }
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it('throws before building from unsafe provider readiness source material', () => {
    const ready = fixture('provider-readiness.both-ready.v1.json');

    for (const source of [
      {
        activeProviders: [{
          ...ready.activeProviders[0],
          configuration: { ...ready.activeProviders[0].configuration, apiKey: 'sk-test-secret-value' }
        }, ready.activeProviders[1]]
      },
      {
        activeProviders: [{
          ...ready.activeProviders[0],
          sourceRefs: ['/Users/andy/.codex/sessions/provider.jsonl']
        }, ready.activeProviders[1]]
      },
      {
        activeProviders: [{
          ...ready.activeProviders[0],
          helpSmoke: { ...ready.activeProviders[0].helpSmoke, rawStdout: 'raw provider output' }
        }, ready.activeProviders[1]]
      }
    ]) {
      assert.throws(
        () => buildProviderReadiness({
          generatedAt: ready.generatedAt,
          currentProject: ready.currentProject,
          activeProviders: ready.activeProviders,
          historicalProviders: ready.historicalProviders,
          operatorRole: ready.operatorRole,
          evidencePolicy: ready.evidencePolicy,
          ...source
        }),
        (error) => {
          assert.equal(error instanceof ProviderReadinessContractError, true);
          assert.equal(error.code, 'unsafe-provider-readiness-source');
          return true;
        }
      );
    }
  });
});

function fixture(name) {
  return JSON.parse(readFileSync(join(FIXTURE_DIR, name), 'utf8'));
}

function assertNoUnsafeStringValues(value, label) {
  for (const text of collectStrings(value)) {
    assert.doesNotMatch(text, /\/Users\/|\.jsonl|sk-[A-Za-z0-9_-]{8,}|raw provider output|raw stdout|raw stderr|raw transcript|raw model output/iu, label);
  }
}

function collectStrings(value) {
  if (Array.isArray(value)) {
    return value.flatMap((item) => collectStrings(item));
  }

  if (value !== null && typeof value === 'object') {
    return Object.values(value).flatMap((item) => collectStrings(item));
  }

  return typeof value === 'string' ? [value] : [];
}

async function listenOnRandomPort(server) {
  await new Promise((resolvePromise, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      server.off('error', reject);
      resolvePromise();
    });
  });

  const address = server.address();

  assert.equal(typeof address, 'object');
  assert.notEqual(address, null);

  return `http://127.0.0.1:${address.port}`;
}

async function closeServer(server) {
  await new Promise((resolvePromise, reject) => {
    server.close((error) => {
      if (error) {
        reject(error);
        return;
      }

      resolvePromise();
    });
  });
}
