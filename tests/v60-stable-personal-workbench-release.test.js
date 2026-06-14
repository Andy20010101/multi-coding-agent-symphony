import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  STABLE_WORKBENCH_RELEASE_BOUNDARIES,
  STABLE_WORKBENCH_RELEASE_CONTRACT_NAME,
  STABLE_WORKBENCH_REQUIRED_SURFACE_IDS,
  StableWorkbenchReleaseContractError,
  assertStableWorkbenchReleaseContract,
  buildStableWorkbenchRelease,
  deriveStableWorkbenchReleaseBlockedReasons,
  validateStableWorkbenchReleaseContract
} from '../src/symphony/stable-workbench-release-contracts.js';
import {
  buildGoalSupervisorAppReadModel
} from '../src/symphony/goal-supervisor/index.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, '..');
const FIXTURE_DIR = join(REPO_ROOT, 'fixtures/contracts/stable-workbench-release');
const GENERATED_AT = '2026-06-14T05:00:00.000Z';
const TARGET_COMMIT = '6e4ca4e2e7e459629e66b5c89b37abca78eddb19';

const VALID_FIXTURES = Object.freeze([
  'stable-workbench-release.ready.v1.json',
  'stable-workbench-release.blocked-missing-surface.v1.json',
  'stable-workbench-release.blocked-release-boundary-drift.v1.json',
  'stable-workbench-release.blocked-unsupported-provider-claim.v1.json',
  'stable-workbench-release.blocked-local-session-or-transcript-exposure.v1.json',
  'stable-workbench-release.blocked-command-execution.v1.json',
  'stable-workbench-release.blocked-direct-mutation.v1.json',
  'stable-workbench-release.blocked-automatic-worktree-or-next-goal.v1.json'
]);

describe('v60 stable personal Workbench release contracts', () => {
  it('validates ready and blocked fixtures as read-only stable baseline evidence', () => {
    for (const name of VALID_FIXTURES) {
      const contract = fixture(name);
      const validation = validateStableWorkbenchReleaseContract(contract);

      assert.equal(validation.ok, true, `${name}: ${validation.errors.join('; ')}`);
      assert.equal(contract.contractName, STABLE_WORKBENCH_RELEASE_CONTRACT_NAME);
      assert.equal(contract.readOnly, true);
      assert.equal(contract.willMutate, false);
      assert.deepEqual(contract.boundaries, STABLE_WORKBENCH_RELEASE_BOUNDARIES, name);
      assert.deepEqual(contract.surfaces.map((surface) => surface.id), STABLE_WORKBENCH_REQUIRED_SURFACE_IDS, name);

      for (const surface of contract.surfaces) {
        assert.equal(surface.readOnly, true, `${name}:${surface.id}`);
        assert.equal(surface.willMutate, false, `${name}:${surface.id}`);
      }

      assertManualReleaseBoundary(contract, name);
      assert.equal(contract.providerBoundary.rawProviderCliEvidenceAllowed, false, name);
      assertNoLocalRefs(contract, name);
    }

    const ready = fixture('stable-workbench-release.ready.v1.json');
    const missingSurface = fixture('stable-workbench-release.blocked-missing-surface.v1.json');
    const releaseBoundaryDrift = fixture('stable-workbench-release.blocked-release-boundary-drift.v1.json');
    const unsupportedProvider = fixture('stable-workbench-release.blocked-unsupported-provider-claim.v1.json');
    const localSessionExposure = fixture('stable-workbench-release.blocked-local-session-or-transcript-exposure.v1.json');
    const commandExecution = fixture('stable-workbench-release.blocked-command-execution.v1.json');
    const directMutation = fixture('stable-workbench-release.blocked-direct-mutation.v1.json');
    const automaticWorkflow = fixture('stable-workbench-release.blocked-automatic-worktree-or-next-goal.v1.json');

    assert.equal(ready.state, 'ready');
    assert.deepEqual(ready.blockedReasons, []);
    assert.equal(ready.release.currentTaggedRelease, 'v59');
    assert.equal(ready.release.activeVersion, 'v60');
    assert.equal(ready.release.currentTagCommit, TARGET_COMMIT);
    assert.equal(ready.release.activeTagExists, false);
    assert.equal(ready.release.activeGithubReleaseExists, false);

    assert.equal(missingSurface.state, 'blocked');
    assert.ok(missingSurface.blockedReasons.includes('missing-stable-workbench-surface'));
    assert.equal(surfaceById(missingSurface, 'child-task-planning').state, 'missing');

    assert.equal(releaseBoundaryDrift.state, 'blocked');
    assert.ok(releaseBoundaryDrift.blockedReasons.includes('release-boundary-drift'));
    assert.equal(releaseBoundaryDrift.releaseBoundary.automationObserved, true);

    assert.equal(unsupportedProvider.state, 'blocked');
    assert.ok(unsupportedProvider.blockedReasons.includes('unsupported-provider-claim'));
    assert.ok(unsupportedProvider.providerBoundary.activeWorkbenchProviderClaims.some((claim) => claim.provider === 'kiro-cli'));

    assert.equal(localSessionExposure.state, 'blocked');
    assert.ok(localSessionExposure.blockedReasons.includes('local-session-or-transcript-exposure'));
    assert.equal(localSessionExposure.safety.rawTranscriptObserved, true);
    assert.equal(localSessionExposure.safety.rawModelOutputObserved, true);
    assert.equal(localSessionExposure.safety.frontendLocalSessionReadObserved, true);
    assert.equal(localSessionExposure.safety.frontendProviderFolderReadObserved, true);

    assert.equal(commandExecution.state, 'blocked');
    assert.ok(commandExecution.blockedReasons.includes('command-execution-boundary-drift'));
    assert.equal(commandExecution.safety.rendererCommandExecutionObserved, true);
    assert.equal(commandExecution.safety.genericShellObserved, true);
    assert.equal(commandExecution.safety.genericTerminalObserved, true);

    assert.equal(directMutation.state, 'blocked');
    assert.ok(directMutation.blockedReasons.includes('direct-mutation-boundary-drift'));
    assert.equal(directMutation.safety.directGoalEventAppendObserved, true);
    assert.equal(directMutation.safety.directTaskCompletionObserved, true);

    assert.equal(automaticWorkflow.state, 'blocked');
    assert.ok(automaticWorkflow.blockedReasons.includes('automatic-worktree-or-next-goal'));
    assert.equal(automaticWorkflow.safety.automaticWorktreeCreationObserved, true);
    assert.equal(automaticWorkflow.safety.automaticNextVersionGoalObserved, true);
  });

  it('builds a ready stable baseline from explicit v59 and v60 controller facts', () => {
    const contract = buildStableWorkbenchRelease(readyInput());

    assertStableWorkbenchReleaseContract(contract);
    assert.equal(contract.state, 'ready');
    assert.equal(contract.goal.goalId, 'v60-stable-personal-workbench-release');
    assert.equal(contract.release.currentTaggedRelease, 'v59');
    assert.equal(contract.release.activeVersion, 'v60');
    assert.equal(contract.release.currentTagCommit, TARGET_COMMIT);
    assert.equal(contract.release.activeTagExists, false);
    assert.equal(contract.release.activeGithubReleaseExists, false);
    assert.deepEqual(contract.blockedReasons, []);
    assert.deepEqual(deriveStableWorkbenchReleaseBlockedReasons(contract), []);
    assert.equal(contract.providerBoundary.activeWorkbenchProviderClaims[0].provider, 'codex-cli');
    assert.equal(contract.providerBoundary.activeWorkbenchProviderClaims[0].status, 'tested-preview');
    assertManualReleaseBoundary(contract, 'built-ready');
  });

  it('blocks missing surfaces, release automation drift, unsupported provider claims, and local session exposure', () => {
    const ready = buildStableWorkbenchRelease(readyInput());

    assertBlocked(
      buildStableWorkbenchRelease({
        ...readyInput(),
        surfaces: ready.surfaces.map((surface) => surface.id === 'release-publication'
          ? { ...surface, state: 'missing', sourceContract: null, sourceRef: null, blockedReasons: ['missing-v59-publication-evidence'] }
          : surface)
      }),
      'missing-stable-workbench-surface'
    );

    assertBlocked(
      buildStableWorkbenchRelease({
        ...readyInput(),
        releaseBoundary: {
          ...ready.releaseBoundary,
          automationObserved: true,
          blockedReasons: ['github-release-create-route-observed']
        }
      }),
      'release-boundary-drift'
    );

    assertBlocked(
      buildStableWorkbenchRelease({
        ...readyInput(),
        providerBoundary: {
          ...ready.providerBoundary,
          activeWorkbenchProviderClaims: [
            ...ready.providerBoundary.activeWorkbenchProviderClaims,
            {
              provider: 'kiro',
              claim: 'active-workbench-execution-provider',
              status: 'tested-preview',
              sourceContract: 'kiroProviderExecution.v1',
              sourceRef: {
                kind: 'contract',
                ref: 'kiroProviderExecution.v1',
                label: 'unsupported provider claim'
              },
              blockedReasons: []
            }
          ]
        }
      }),
      'unsupported-provider-claim'
    );

    assertBlocked(
      buildStableWorkbenchRelease({
        ...readyInput(),
        safety: {
          ...ready.safety,
          rawModelOutputObserved: true,
          frontendLocalJsonlReadObserved: true,
          blockedReasons: ['raw-output-or-local-jsonl-observed']
        }
      }),
      'local-session-or-transcript-exposure'
    );

    assertBlocked(
      buildStableWorkbenchRelease({
        ...readyInput(),
        safety: {
          ...ready.safety,
          automaticWorktreeCreationObserved: true,
          automaticNextVersionGoalObserved: true,
          blockedReasons: ['automatic-workflow-observed']
        }
      }),
      'automatic-worktree-or-next-goal'
    );
  });

  it('rejects hidden mutation fields, boundary mutation drift, and unsafe local refs', () => {
    const hiddenRoute = fixture('stable-workbench-release.ready.v1.json');
    hiddenRoute.writeRoute = '/api/releases/create';
    hiddenRoute.surfaces[0].executeRoute = '/api/shell';
    hiddenRoute.releaseBoundary.githubReleaseOperation.willMutate = true;
    hiddenRoute.boundaries.githubReleaseCreateAvailable = true;
    hiddenRoute.evidenceRefs[0].ref = '/Users/andy/.codex/sessions/v60.jsonl';
    hiddenRoute.knownFacts.push('raw model output in /Users/andy/.codex/sessions/v60.jsonl');
    hiddenRoute.safety.blockedReasons.push('raw model output in /Users/andy/.codex/sessions/v60.jsonl');
    delete hiddenRoute.safety.genericShellObserved;

    const validation = validateStableWorkbenchReleaseContract(hiddenRoute);

    assert.equal(validation.ok, false);
    assert.ok(validation.errors.includes('contract.writeRoute is not allowed'));
    assert.ok(validation.errors.includes('surfaces[0].executeRoute is not allowed'));
    assert.ok(validation.errors.includes('releaseBoundary.githubReleaseOperation.willMutate must be false'));
    assert.ok(validation.errors.includes('boundaries.githubReleaseCreateAvailable must be false'));
    assert.ok(
      validation.errors.some((error) => error.includes('evidenceRefs[0].ref must not contain raw provider output')),
      validation.errors.join('; ')
    );
    assert.ok(
      validation.errors.some((error) => error.includes('knownFacts[3] must not contain raw provider output')),
      validation.errors.join('; ')
    );
    assert.ok(
      validation.errors.some((error) => error.includes('safety.blockedReasons[0] must not contain raw provider output')),
      validation.errors.join('; ')
    );
    assert.ok(validation.errors.includes('safety.genericShellObserved must be boolean'));
  });

  it('throws before building from raw transcript or local provider session refs', () => {
    assert.throws(
      () => buildStableWorkbenchRelease({
        ...readyInput(),
        release: {
          ...readyInput().release,
          sourceRefs: [{
            kind: 'repo-doc',
            ref: '/Users/andy/.codex/sessions/v60.jsonl',
            label: 'local session file'
          }]
        }
      }),
      (error) => {
        assert.equal(error instanceof StableWorkbenchReleaseContractError, true);
        assert.equal(error.code, 'unsafe-stable-workbench-release-source');
        assert.match(error.details.reason, /sourceRefs/u);
        return true;
      }
    );

    assert.throws(
      () => buildStableWorkbenchRelease({
        ...readyInput(),
        knownFacts: [
          ...readyInput().knownFacts,
          'raw model output in /Users/andy/.codex/sessions/v60.jsonl'
        ]
      }),
      (error) => {
        assert.equal(error instanceof StableWorkbenchReleaseContractError, true);
        assert.equal(error.code, 'unsafe-stable-workbench-release-source');
        assert.match(error.details.reason, /knownFacts/u);
        return true;
      }
    );
  });

  it('exposes the stable baseline through the goal supervisor read model', () => {
    const model = buildGoalSupervisorAppReadModel({
      goalId: 'v60-stable-personal-workbench-release',
      title: 'v60: Stable Personal Workbench Release',
      stableWorkbenchRelease: readyInput(),
      nowMs: Date.parse(GENERATED_AT)
    });
    const contract = model.stableWorkbenchRelease;
    const validation = validateStableWorkbenchReleaseContract(contract);

    assert.equal(contract.contractName, STABLE_WORKBENCH_RELEASE_CONTRACT_NAME);
    assert.equal(validation.ok, true, validation.errors.join('; '));
    assert.equal(contract.state, 'ready');
    assert.equal(contract.goal.goalId, 'v60-stable-personal-workbench-release');
    assert.equal(contract.release.currentTaggedRelease, 'v59');
    assert.equal(contract.release.activeVersion, 'v60');
    assert.equal(contract.release.currentTagCommit, TARGET_COMMIT);
    assert.equal(contract.providerBoundary.activeWorkbenchProviderClaims[0].provider, 'codex-cli');
    assert.equal(contract.releaseBoundary.githubReleaseOperation.commandResult, 'not-run-by-product-code');
    assert.equal(contract.safety.rendererCommandExecutionObserved, false);
    assert.deepEqual(contract.boundaries, STABLE_WORKBENCH_RELEASE_BOUNDARIES);
    assertNoLocalRefs(contract, 'backend-ready');
  });

  it('derives a blocked stable baseline when backend source surfaces are not ready', () => {
    const model = buildGoalSupervisorAppReadModel({
      goalId: 'v60-stable-personal-workbench-release',
      title: 'v60: Stable Personal Workbench Release',
      nowMs: Date.parse(GENERATED_AT)
    });
    const contract = model.stableWorkbenchRelease;
    const validation = validateStableWorkbenchReleaseContract(contract);

    assert.equal(contract.contractName, STABLE_WORKBENCH_RELEASE_CONTRACT_NAME);
    assert.equal(validation.ok, true, validation.errors.join('; '));
    assert.equal(contract.state, 'blocked');
    assert.ok(contract.blockedReasons.includes('blocked-stable-workbench-surface'));
    assert.equal(surfaceById(contract, 'release-publication').state, 'blocked');
    assert.equal(contract.releaseBoundary.manualControllerActionRequired, true);
    assert.equal(contract.releaseBoundary.automationObserved, false);
    assert.equal(contract.safety.frontendLocalJsonlReadObserved, false);
    assertNoLocalRefs(contract, 'backend-derived-blocked');
  });
});

function readyInput() {
  return {
    generatedAt: GENERATED_AT,
    release: {
      currentTagCommit: TARGET_COMMIT,
      sourceRefs: [
        {
          kind: 'tag',
          ref: 'v59',
          label: 'v59 annotated tag'
        },
        {
          kind: 'github-release',
          ref: 'https://github.com/Andy20010101/multi-coding-agent-symphony/releases/tag/v59',
          label: 'v59 GitHub Release'
        }
      ]
    },
    evidenceRefs: [
      {
        kind: 'repo-doc',
        ref: 'docs/daily-workflow-runbook.md',
        label: 'daily workflow runbook'
      },
      {
        kind: 'repo-doc',
        ref: 'docs/provider-boundary-guide.md',
        label: 'provider boundary guide'
      },
      {
        kind: 'repo-doc',
        ref: 'docs/recovery-guide.md',
        label: 'recovery guide'
      }
    ],
    knownFacts: [
      'v59 tag and GitHub Release are complete',
      'v60 tag and GitHub Release do not exist yet',
      'tag push and GitHub Release publication remain controller manual actions'
    ]
  };
}

function fixture(name) {
  return JSON.parse(readFileSync(join(FIXTURE_DIR, name), 'utf8'));
}

function surfaceById(contract, id) {
  return contract.surfaces.find((surface) => surface.id === id);
}

function assertBlocked(contract, reason) {
  assertStableWorkbenchReleaseContract(contract);
  assert.equal(contract.state, 'blocked');
  assert.ok(contract.blockedReasons.includes(reason), `${reason} not found in ${contract.blockedReasons.join(', ')}`);
}

function assertManualReleaseBoundary(contract, label) {
  assert.equal(contract.releaseBoundary.manualControllerActionRequired, true, label);
  assert.equal(contract.releaseBoundary.automationObserved, contract.state === 'blocked' && contract.blockedReasons.includes('release-boundary-drift'), label);

  for (const operation of [
    contract.releaseBoundary.tagOperation,
    contract.releaseBoundary.pushTagOperation,
    contract.releaseBoundary.githubReleaseOperation,
    contract.releaseBoundary.releaseReadyDeclaration
  ]) {
    assert.equal(operation.state, 'manual-controller-action', label);
    assert.equal(operation.commandResult, 'not-run-by-product-code', label);
    assert.equal(operation.copyOnly, true, label);
    assert.equal(operation.willMutate, false, label);
  }
}

function assertNoLocalRefs(contract, label) {
  const serialized = JSON.stringify(contract);

  assert.equal(serialized.includes('/Users/'), false, label);
  assert.equal(serialized.includes('.jsonl'), false, label);
  assert.equal(serialized.includes('/.codex/'), false, label);
  assert.equal(serialized.includes('/.claude/'), false, label);
}
