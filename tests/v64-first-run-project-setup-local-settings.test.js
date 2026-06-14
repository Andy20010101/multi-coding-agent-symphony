import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { runSymphonyCli } from '../scripts/symphony.js';
import {
  PERSONAL_WORKBENCH_SETTINGS_BOUNDARIES,
  PERSONAL_WORKBENCH_SETTINGS_CONTRACT_NAME,
  PersonalWorkbenchSettingsContractError,
  assertPersonalWorkbenchSettingsContract,
  buildPersonalWorkbenchSettings,
  buildPersonalWorkbenchSettingsProjection,
  derivePersonalWorkbenchSettingsBlockedReasons,
  validatePersonalWorkbenchSettingsContract
} from '../src/symphony/personal-workbench-settings-contracts.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, '..');
const FIXTURE_DIR = join(REPO_ROOT, 'fixtures/contracts/personal-workbench-settings');

const VALID_FIXTURES = Object.freeze([
  'personal-workbench-settings.ready.v1.json',
  'personal-workbench-settings.missing-settings.v1.json',
  'personal-workbench-settings.stale-project-binding.v1.json'
]);

const INVALID_FIXTURES = Object.freeze([
  [
    'personal-workbench-settings.invalid-project-id.invalid.v1.json',
    'currentProjectBinding.selectedProjectId must be a backend-known project id token'
  ],
  [
    'personal-workbench-settings.secret-like-value.invalid.v1.json',
    'preferences.apiKey is not allowed'
  ],
  [
    'personal-workbench-settings.unsupported-path-input.invalid.v1.json',
    'contract.projectPathInput is not allowed'
  ]
]);

describe('v64 first-run project setup and local settings contracts', () => {
  it('validates ready, missing settings, and stale binding fixtures without unsafe local data exposure', () => {
    for (const name of VALID_FIXTURES) {
      const contract = fixture(name);
      const validation = validatePersonalWorkbenchSettingsContract(contract);

      assert.equal(validation.ok, true, `${name}: ${validation.errors.join('; ')}`);
      assert.equal(contract.contractName, PERSONAL_WORKBENCH_SETTINGS_CONTRACT_NAME);
      assert.equal(contract.readOnly, true, name);
      assert.equal(contract.willMutate, false, name);
      assert.deepEqual(contract.boundaries, PERSONAL_WORKBENCH_SETTINGS_BOUNDARIES, name);
      assert.equal(contract.boundaries.secretStorageAvailable, false, name);
      assert.equal(contract.boundaries.rendererArbitraryPathInputAvailable, false, name);
      assert.equal(contract.boundaries.rendererCommandExecutionAvailable, false, name);
      assert.equal(contract.boundaries.goalCreationAvailable, false, name);
      assert.equal(contract.boundaries.gitWriteAvailable, false, name);
      assert.equal(contract.boundaries.releaseWriteAvailable, false, name);

      for (const value of Object.values(contract.safety)) {
        assert.equal(value, false, name);
      }

      assertNoRawLocalOrSecretRefs(contract, name);
    }

    const ready = fixture('personal-workbench-settings.ready.v1.json');
    const missingSettings = fixture('personal-workbench-settings.missing-settings.v1.json');
    const staleBinding = fixture('personal-workbench-settings.stale-project-binding.v1.json');

    assert.equal(ready.state, 'ready');
    assert.deepEqual(ready.blockedReasons, []);
    assert.equal(ready.currentProjectBinding.state, 'bound');
    assert.equal(ready.recentProjects.state, 'available');
    assert.deepEqual(ready.preferences.preferredProviders, ['codex-cli', 'claude-code-cli']);

    assert.equal(missingSettings.state, 'missing');
    assert.ok(missingSettings.blockedReasons.includes('local-settings-unavailable'));
    assert.equal(missingSettings.settingsSource.state, 'missing');
    assert.equal(missingSettings.recoveryActions[0].mode, 'manual-controller');
    assert.equal(missingSettings.recoveryActions[0].willMutate, false);

    assert.equal(staleBinding.state, 'stale');
    assert.ok(staleBinding.blockedReasons.includes('current-project-binding-stale'));
    assert.equal(staleBinding.currentProjectBinding.routeState, 'stale');
    assert.equal(staleBinding.recoveryActions[0].endpointId, '/api/projects/current-binding');
  });

  it('rejects invalid project ids, secret-like settings values, and arbitrary path input', () => {
    for (const [name, expectedError] of INVALID_FIXTURES) {
      const contract = fixture(name);
      const validation = validatePersonalWorkbenchSettingsContract(contract);

      assert.equal(validation.ok, false, name);
      assert.ok(
        validation.errors.some((error) => error.includes(expectedError)),
        `${name}: expected ${expectedError}; got ${validation.errors.join('; ')}`
      );
    }
  });

  it('builds ready, missing, and stale projections from explicit backend-owned contracts', () => {
    const readyFixture = fixture('personal-workbench-settings.ready.v1.json');
    const builtReady = buildPersonalWorkbenchSettings({
      generatedAt: readyFixture.generatedAt,
      settingsSource: readyFixture.settingsSource,
      preferences: readyFixture.preferences,
      currentProjectBinding: readyFixture.currentProjectBinding,
      recentProjects: readyFixture.recentProjects
    });

    assertPersonalWorkbenchSettingsContract(builtReady);
    assert.equal(builtReady.state, 'ready');
    assert.deepEqual(derivePersonalWorkbenchSettingsBlockedReasons(builtReady), []);
    assert.deepEqual(builtReady.blockedReasons, []);

    const builtMissing = buildPersonalWorkbenchSettings({
      generatedAt: readyFixture.generatedAt,
      settingsSource: {
        kind: 'unavailable',
        state: 'missing',
        ref: null,
        sourceContract: null,
        generatedAt: null,
        readOnly: true,
        writePolicy: 'manual-controller-or-preview-confirm-only'
      },
      preferences: readyFixture.preferences,
      currentProjectBinding: readyFixture.currentProjectBinding,
      recentProjects: readyFixture.recentProjects
    });

    assert.equal(builtMissing.state, 'missing');
    assert.ok(builtMissing.blockedReasons.includes('local-settings-unavailable'));

    const staleBinding = {
      ...readyFixture.currentProjectBinding,
      state: 'stale',
      routeState: 'stale',
      fallbackReason: 'selected project id is stale'
    };
    const builtStale = buildPersonalWorkbenchSettings({
      generatedAt: readyFixture.generatedAt,
      settingsSource: readyFixture.settingsSource,
      preferences: readyFixture.preferences,
      currentProjectBinding: staleBinding,
      recentProjects: readyFixture.recentProjects
    });

    assert.equal(builtStale.state, 'stale');
    assert.ok(builtStale.blockedReasons.includes('current-project-binding-stale'));
  });

  it('projects first-run settings from the current checkout and exposes CLI JSON without writing repo files', async () => {
    const root = await createProjectFixture('symphony-v64-settings-projection');

    try {
      const settings = await buildPersonalWorkbenchSettingsProjection({
        cwd: root,
        stateDir: join(root, '.symphony'),
        generatedAt: '2026-06-14T19:30:00.000Z'
      });

      assertPersonalWorkbenchSettingsContract(settings);
      assert.equal(settings.state, 'ready');
      assert.equal(settings.settingsSource.ref, 'built-in:first-run-local-settings');
      assert.equal(settings.currentProjectBinding.state, 'bound');
      assert.equal(settings.currentProjectBinding.selectedProjectName, 'v64-settings-projection-fixture');
      assert.equal(settings.recentProjects.state, 'available');
      assert.deepEqual(settings.preferences.preferredProviders, ['codex-cli', 'claude-code-cli']);
      assert.equal(settings.boundaries.settingsWriteAvailable, false);
      assert.equal(settings.boundaries.rendererArbitraryPathInputAvailable, false);
      assert.equal(settings.boundaries.providerLaunchAvailable, false);
      assert.equal(settings.boundaries.goalCreationAvailable, false);

      const before = await snapshotManagedFiles(root);
      const output = createOutput();
      const originalCwd = process.cwd();

      try {
        process.chdir(root);
        const exitCode = await runSymphonyCli({
          argv: ['runtime', 'settings', '--state-dir', join(root, '.symphony'), '--json'],
          stdout: output.stdout,
          stderr: output.stderr
        });

        assert.equal(exitCode, 0);
      } finally {
        process.chdir(originalCwd);
      }

      assert.equal(output.stderrText(), '');

      const cliSettings = JSON.parse(output.stdoutText());

      assert.deepEqual(validatePersonalWorkbenchSettingsContract(cliSettings), {
        ok: true,
        errors: []
      });
      assert.equal(cliSettings.contractName, PERSONAL_WORKBENCH_SETTINGS_CONTRACT_NAME);
      assert.equal(cliSettings.currentProjectBinding.selectedProjectName, 'v64-settings-projection-fixture');
      assert.deepEqual(await snapshotManagedFiles(root), before);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it('throws before building from secrets, raw provider refs, local sessions, or arbitrary paths', () => {
    const readyFixture = fixture('personal-workbench-settings.ready.v1.json');

    for (const source of [
      { preferences: { ...readyFixture.preferences, apiKey: 'sk-test-secret-value' } },
      { settingsSource: { ...readyFixture.settingsSource, ref: '/Users/andy/.codex/sessions/run.jsonl' } },
      { recoveryActions: [{ id: 'open-terminal', label: 'Run shell command', endpointId: '/api/shell', copyOnly: true, willMutate: false }] }
    ]) {
      assert.throws(
        () => buildPersonalWorkbenchSettings({
          generatedAt: readyFixture.generatedAt,
          settingsSource: readyFixture.settingsSource,
          preferences: readyFixture.preferences,
          currentProjectBinding: readyFixture.currentProjectBinding,
          recentProjects: readyFixture.recentProjects,
          ...source
        }),
        (error) => {
          assert.equal(error instanceof PersonalWorkbenchSettingsContractError, true);
          assert.equal(error.code, 'unsafe-personal-workbench-settings-source');
          return true;
        }
      );
    }
  });
});

function fixture(name) {
  return JSON.parse(readFileSync(join(FIXTURE_DIR, name), 'utf8'));
}

async function createProjectFixture(prefix) {
  const root = await mkdtemp(join(tmpdir(), `${prefix}-`));

  await mkdir(join(root, '.git'));
  await writeFile(join(root, '.git', 'HEAD'), 'ref: refs/heads/main\n', 'utf8');
  await writeFile(join(root, '.git', 'config'), [
    '[remote "origin"]',
    '\turl = git@example.com:fixture/v64-settings-projection.git',
    ''
  ].join('\n'), 'utf8');
  await writeFile(join(root, 'package.json'), `${JSON.stringify({
    name: 'v64-settings-projection-fixture'
  }, null, 2)}\n`, 'utf8');
  await mkdir(join(root, '.symphony', 'runs'), { recursive: true });
  await writeFile(join(root, '.symphony', 'runs', 'latest.json'), `${JSON.stringify({
    runId: 'run-v64-settings-projection',
    status: 'passed',
    updatedAt: '2026-06-14T19:30:00.000Z'
  }, null, 2)}\n`, 'utf8');

  return root;
}

async function snapshotManagedFiles(root) {
  return JSON.stringify({
    packageJson: readFileSync(join(root, 'package.json'), 'utf8'),
    latestRun: readFileSync(join(root, '.symphony', 'runs', 'latest.json'), 'utf8')
  });
}

function createOutput() {
  const stdoutChunks = [];
  const stderrChunks = [];

  return {
    stdout: {
      write(chunk) {
        stdoutChunks.push(String(chunk));
      }
    },
    stderr: {
      write(chunk) {
        stderrChunks.push(String(chunk));
      }
    },
    stdoutText() {
      return stdoutChunks.join('');
    },
    stderrText() {
      return stderrChunks.join('');
    }
  };
}

function assertNoRawLocalOrSecretRefs(value, label) {
  const serialized = JSON.stringify(value);

  assert.equal(serialized.includes('/Users/'), false, label);
  assert.equal(serialized.includes('.jsonl'), false, label);
  assert.equal(serialized.includes('sk-'), false, label);
  assert.equal(/raw transcript/iu.test(serialized), false, label);
  assert.equal(/raw model output/iu.test(serialized), false, label);
}
