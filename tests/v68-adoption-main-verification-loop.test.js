import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { createSymphonyConsoleServer } from '../src/symphony/console.js';
import { readGoalOperationRuns } from '../src/symphony/goal-operation-run-registry.js';
import {
  ADOPTION_MAIN_VERIFICATION_BOUNDARIES,
  ADOPTION_READINESS_CONTRACT_NAME,
  buildAdoptionReadiness,
  computeAdoptionReadinessPlanHash,
  validateAdoptionReadinessContract
} from '../src/symphony/adoption-main-verification-loop-contracts.js';
import {
  ADOPTION_CONFIRMATION_CONTRACT_NAME,
  V68_ADOPTION_MAIN_VERIFICATION_GOAL_ID,
  AdoptionBackendError,
  buildAdoptionPreviewFromBackend,
  confirmAdoptionPreview
} from '../src/symphony/adoption-main-verification-loop-backend.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, '..');
const FIXTURE_DIR = join(REPO_ROOT, 'fixtures/contracts/adoption-main-verification');
const WORKER_RUN_DIR = join(REPO_ROOT, 'fixtures/contracts/worker-run');
const REVIEWER_RUN_DIR = join(REPO_ROOT, 'fixtures/contracts/reviewer-run');
const GENERATED_AT = '2026-06-15T06:20:00.000Z';
const SOURCE_FINGERPRINT = 'sha256:1111111111111111111111111111111111111111111111111111111111111111';
const PATCH_FINGERPRINT = 'sha256:2222222222222222222222222222222222222222222222222222222222222222';

const VALID_FIXTURES = Object.freeze([
  ['adoption-readiness.ready.v1.json', 'ready', []],
  ['adoption-readiness.missing-reviewer-approval.v1.json', 'blocked', ['missing-reviewer-approval']],
  ['adoption-readiness.dirty-worktree.v1.json', 'blocked', ['dirty-worktree']],
  ['adoption-readiness.patch-mismatch.v1.json', 'blocked', ['patch-fingerprint-mismatch']],
  ['adoption-readiness.stale-worker-run.v1.json', 'blocked', ['stale-worker-run']],
  ['adoption-readiness.unsafe-patch.v1.json', 'blocked', ['unsafe-patch']],
  ['adoption-readiness.unsupported-deletion.v1.json', 'blocked', ['unsupported-deletion']],
  ['adoption-readiness.missing-artifact.v1.json', 'blocked', ['missing-artifact']]
]);

describe('v68 Adoption and Main Verification Workbench Loop contracts', () => {
  it('validates adoption readiness fixtures with planHash and safety boundaries', () => {
    for (const [name, state, blockedReasons] of VALID_FIXTURES) {
      const readiness = fixture(name);
      const validation = validateAdoptionReadinessContract(readiness);

      assert.equal(validation.ok, true, `${name}: ${validation.errors.join('; ')}`);
      assert.equal(readiness.contractName, ADOPTION_READINESS_CONTRACT_NAME);
      assert.equal(readiness.state, state);
      assert.deepEqual(readiness.boundaries, ADOPTION_MAIN_VERIFICATION_BOUNDARIES);
      assert.equal(readiness.planHash, computeAdoptionReadinessPlanHash(readiness));

      for (const reason of blockedReasons) {
        assert.ok(readiness.blockedReasons.includes(reason), `${name}: expected ${reason}`);
      }

      assertNoUnsafeStringValues(readiness, name);
    }
  });

  it('builds ready adoption readiness only from approved reviewer evidence and clean patch state', () => {
    const readiness = buildAdoptionReadiness(readyInput());

    assert.equal(readiness.state, 'ready');
    assert.deepEqual(readiness.blockedReasons, []);
    assert.equal(readiness.workerEvidence.workerProviderId, 'codex-cli');
    assert.equal(readiness.workerEvidence.taskState, 'needs-review');
    assert.equal(readiness.workerEvidence.reviewRequired, true);
    assert.equal(readiness.workerEvidence.taskCompleted, false);
    assert.equal(readiness.workerEvidence.reviewApproved, false);
    assert.equal(readiness.reviewerEvidence.status, 'approved');
    assert.equal(readiness.reviewerEvidence.reviewApproved, true);
    assert.equal(readiness.reviewerEvidence.adoptionReady, false);
    assert.equal(readiness.worktreeState.dirty, false);
    assert.equal(readiness.sourceFingerprint.current, SOURCE_FINGERPRINT);
    assert.equal(readiness.patchPlan.patchFingerprint, PATCH_FINGERPRINT);
    assert.equal(readiness.patchPlan.appliesToFingerprint, SOURCE_FINGERPRINT);
    assert.equal(readiness.patchPlan.applyCheck, 'passed');
    assert.equal(readiness.adoptionPolicy.providerInvocationAllowed, false);
    assert.equal(readiness.confirmation.requiresPlanHash, true);
    assert.equal(readiness.confirmation.workerRunId, readiness.workerEvidence.workerRunId);
    assert.equal(readiness.confirmation.reviewerVerdictId, readiness.reviewerEvidence.verdictId);
    assertNoUnsafeStringValues(readiness, 'ready builder');
  });

  it('blocks adoption when reviewer evidence is not approved', () => {
    const reviewerVerdict = {
      ...reviewerVerdictFixture('verdict.needs-revision.v1.json'),
      reviewedWorkerRunId: workerEvidence().runId
    };
    const readiness = buildAdoptionReadiness({
      ...readyInput(),
      reviewerVerdict
    });

    assert.equal(readiness.state, 'blocked');
    assert.ok(readiness.blockedReasons.includes('missing-reviewer-approval'));
    assert.ok(readiness.blockedReasons.includes('reviewer-approval-not-recorded'));
    assert.equal(validateAdoptionReadinessContract(readiness).ok, true);
  });

  it('blocks dirty worktrees, stale worker evidence, and patch mismatches before confirmation', () => {
    const dirty = buildAdoptionReadiness({
      ...readyInput(),
      worktreeState: {
        state: 'dirty',
        branch: 'main',
        dirty: true,
        expectedMainWorktree: true,
        sourceRef: 'backend-worktree-state:v68-dirty'
      }
    });
    const stale = buildAdoptionReadiness({
      ...readyInput(),
      reviewerVerdict: {
        ...reviewerEvidence(),
        reviewedWorkerRunId: 'worker-run-v66-stale'
      }
    });
    const mismatch = buildAdoptionReadiness({
      ...readyInput(),
      patchPlan: {
        ...patchPlan(),
        expectedPatchFingerprint: 'sha256:3333333333333333333333333333333333333333333333333333333333333333'
      }
    });

    assert.equal(dirty.state, 'blocked');
    assert.ok(dirty.blockedReasons.includes('dirty-worktree'));
    assert.equal(stale.state, 'blocked');
    assert.ok(stale.blockedReasons.includes('stale-worker-run'));
    assert.equal(mismatch.state, 'blocked');
    assert.ok(mismatch.blockedReasons.includes('patch-fingerprint-mismatch'));
  });

  it('blocks unsafe patches, deletion operations, and missing artifacts without exposing unsafe refs', () => {
    const unsafePatch = buildAdoptionReadiness({
      ...readyInput(),
      patchPlan: {
        ...patchPlan(),
        fileChanges: [{
          path: '../main-worktree/.codex/raw.jsonl',
          operation: 'modify',
          fingerprintBefore: SOURCE_FINGERPRINT,
          fingerprintAfter: PATCH_FINGERPRINT
        }]
      }
    });
    const unsupportedDeletion = buildAdoptionReadiness({
      ...readyInput(),
      patchPlan: {
        ...patchPlan(),
        fileChanges: [{
          path: 'src/symphony/adoption-main-verification-loop-contracts.js',
          operation: 'delete',
          fingerprintBefore: SOURCE_FINGERPRINT,
          fingerprintAfter: PATCH_FINGERPRINT
        }]
      }
    });
    const missingArtifact = buildAdoptionReadiness({
      ...readyInput(),
      artifactRefs: []
    });

    assert.equal(unsafePatch.state, 'blocked');
    assert.ok(unsafePatch.blockedReasons.includes('unsafe-patch'));
    assert.equal(unsafePatch.patchPlan.fileChanges[0].path, 'blocked-unsafe-patch-path-1');
    assertNoUnsafeStringValues(unsafePatch, 'unsafe patch');
    assert.equal(unsupportedDeletion.state, 'blocked');
    assert.ok(unsupportedDeletion.blockedReasons.includes('unsupported-deletion'));
    assert.equal(validateAdoptionReadinessContract(unsupportedDeletion).ok, true);
    assert.equal(missingArtifact.state, 'blocked');
    assert.ok(missingArtifact.blockedReasons.includes('missing-artifact'));
    assert.equal(validateAdoptionReadinessContract(missingArtifact).ok, true);
  });

  it('rejects stale plan hashes and reviewer adoption drift in ready contracts', () => {
    const ready = buildAdoptionReadiness(readyInput());
    const staleHash = {
      ...ready,
      planHash: 'sha256:4444444444444444444444444444444444444444444444444444444444444444'
    };
    const adoptionDrift = structuredClone(ready);

    adoptionDrift.reviewerEvidence.adoptionReady = true;
    adoptionDrift.planHash = computeAdoptionReadinessPlanHash(adoptionDrift);

    assertValidationIncludes(
      validateAdoptionReadinessContract(staleHash),
      'planHash must match adoption readiness content'
    );
    assertValidationIncludes(
      validateAdoptionReadinessContract(adoptionDrift),
      'reviewerEvidence.adoptionReady must be false'
    );
    const blockedDrift = buildAdoptionReadiness({
      ...readyInput(),
      reviewerVerdict: {
        ...reviewerEvidence(),
        nextState: {
          ...reviewerEvidence().nextState,
          adoptionReady: true
        }
      }
    });

    assert.equal(blockedDrift.state, 'blocked');
    assert.ok(blockedDrift.blockedReasons.includes('reviewer-output-approves-adoption'));
    assert.equal(validateAdoptionReadinessContract(blockedDrift).ok, true);
  });

  it('confirms adoption previews only after journaling the bounded backend apply request', async () => {
    const preview = backendReadyPreview();
    const journals = [];
    const invocations = [];
    const confirmation = await confirmAdoptionPreview({
      preview,
      input: adoptionConfirmInput(preview),
      startedAt: '2026-06-15T06:25:00.000Z',
      finishedAt: '2026-06-15T06:25:01.000Z',
      writeJournal: async (journal) => {
        journals.push(journal);
        assert.equal(journal.status, 'applying');
        assert.equal(journal.adoptionId, preview.adoptionId);
        assert.equal(journal.planHash, preview.planHash);
      },
      applyAdoption: async (request) => {
        invocations.push(request);
        assert.equal(journals.length, 1);
        assert.equal(Object.hasOwn(request, 'command'), false);
        assert.equal(Object.hasOwn(request, 'cwd'), false);
        assert.equal(Object.hasOwn(request, 'env'), false);

        return {
          status: 'applied',
          appliedPatchRef: request.patchRef,
          changedFiles: request.fileChanges.map((change) => change.path),
          journalAppendRequired: true,
          verifierStatus: 'passed',
          mainVerified: true,
          gateDraftReady: true,
          releaseReady: true,
          rawTranscript: 'raw transcript must not be projected'
        };
      }
    });

    assert.equal(confirmation.contractName, ADOPTION_CONFIRMATION_CONTRACT_NAME);
    assert.equal(confirmation.status, 'applied');
    assert.equal(confirmation.nextState.adoptionApplied, true);
    assert.equal(confirmation.nextState.taskCompleted, false);
    assert.equal(confirmation.nextState.mainVerified, false);
    assert.equal(confirmation.nextState.gateDraftReady, false);
    assert.equal(confirmation.nextState.releaseReady, false);
    assert.equal(confirmation.applyResult.verifierStatus, 'not-run');
    assert.equal(confirmation.applyResult.mainVerified, false);
    assert.equal(confirmation.applyResult.gateDraftReady, false);
    assert.equal(confirmation.applyResult.releaseReady, false);
    assert.equal(confirmation.confirmContext.journalWrittenBeforeApply, true);
    assert.equal(confirmation.safety.providerInvocationAvailable, false);
    assert.equal(confirmation.safety.githubReleaseAutomationAvailable, false);
    assert.equal(journals.length, 1);
    assert.equal(invocations.length, 1);
    assertNoUnsafeStringValues(confirmation, 'backend confirmation');
  });

  it('rejects stale adoption confirm hashes and command fields before apply', async () => {
    const preview = backendReadyPreview();
    const stale = {
      ...adoptionConfirmInput(preview),
      planHash: 'sha256:4444444444444444444444444444444444444444444444444444444444444444'
    };
    const command = {
      ...adoptionConfirmInput(preview),
      command: 'git apply unsafe.patch'
    };
    let calls = 0;
    const applyAdoption = async () => {
      calls += 1;
      return { status: 'applied' };
    };

    await assert.rejects(
      () => confirmAdoptionPreview({ preview, input: stale, applyAdoption }),
      (error) => (
        error instanceof AdoptionBackendError &&
        error.safeDetails.errors.includes('planHash must match adoption preview')
      )
    );
    await assert.rejects(
      () => confirmAdoptionPreview({ preview, input: command, applyAdoption }),
      (error) => (
        error instanceof AdoptionBackendError &&
        error.safeDetails.errors.includes('command is not an allowed adoption confirm field')
      )
    );
    assert.equal(calls, 0);
  });

  it('serves adoption readiness preview and confirm through constrained backend routes', async () => {
    const root = await mkdtemp(join(tmpdir(), 'v68-adoption-readiness-route-'));
    const stateDir = join(root, '.symphony');
    const invocations = [];
    const server = createSymphonyConsoleServer({
      cwd: root,
      stateDir,
      env: {},
      adoptionWorkerEvidence: workerEvidence(),
      adoptionReviewerVerdict: reviewerEvidence(),
      adoptionWorktreeState: cleanWorktree(),
      adoptionSourceFingerprint: sourceFingerprint(),
      adoptionPatchPlan: patchPlan(),
      adoptionArtifactRefs: artifactRefs(),
      adoptionApplicator: async (request) => {
        invocations.push(request);

        return {
          status: 'applied',
          appliedPatchRef: request.patchRef,
          changedFiles: request.fileChanges.map((change) => change.path),
          journalAppendRequired: true,
          verifierStatus: 'passed',
          mainVerified: true,
          gateDraftReady: true,
          releaseReady: true,
          rawModelOutput: 'raw model output must not be projected'
        };
      }
    });
    const baseUrl = await listenOnRandomPort(server);

    try {
      const params = new URLSearchParams({
        task: 'pr-2-adoption-preview-confirm'
      });
      const previewResponse = await fetch(`${baseUrl}/api/goals/${V68_ADOPTION_MAIN_VERIFICATION_GOAL_ID}/adoption-readiness-preview?${params}`);
      const preview = await previewResponse.json();

      assert.equal(previewResponse.status, 200, JSON.stringify(preview));
      assert.equal(preview.contractName, ADOPTION_READINESS_CONTRACT_NAME);
      assert.equal(preview.state, 'ready');
      assert.equal(preview.confirmation.requiresPlanHash, true);
      assert.equal(preview.confirmation.requiredFields.includes('goalId'), true);
      assert.equal(preview.confirmation.requiredFields.includes('taskId'), true);
      assertNoUnsafeStringValues(preview, 'route preview');

      const invalidPreviewResponse = await fetch(`${baseUrl}/api/goals/${V68_ADOPTION_MAIN_VERIFICATION_GOAL_ID}/adoption-readiness-preview?${new URLSearchParams({
        task: 'pr-2-adoption-preview-confirm',
        command: 'git apply unsafe.patch'
      })}`);
      const invalidPreview = await invalidPreviewResponse.json();

      assert.equal(invalidPreviewResponse.status, 400);
      assert.equal(invalidPreview.error.code, 'invalid-adoption-readiness-preview-request');
      assert.equal(invocations.length, 0);

      const confirmResponse = await fetch(`${baseUrl}/api/goals/${V68_ADOPTION_MAIN_VERIFICATION_GOAL_ID}/adoption-readiness-confirm`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(adoptionConfirmInput(preview))
      });
      const confirmation = await confirmResponse.json();
      const registry = await readGoalOperationRuns({
        stateDir,
        goalId: V68_ADOPTION_MAIN_VERIFICATION_GOAL_ID
      });

      assert.equal(confirmResponse.status, 200, JSON.stringify(confirmation));
      assert.equal(confirmation.contractName, ADOPTION_CONFIRMATION_CONTRACT_NAME);
      assert.equal(confirmation.status, 'applied');
      assert.equal(confirmation.operationRun.status, 'confirmed');
      assert.equal(confirmation.operationRun.commandKind, 'adoption-confirm');
      assert.equal(confirmation.operationRun.commandName, 'adoption readiness preview/confirm');
      assert.equal(confirmation.operationRun.verifierSummary.adoptionApplied, true);
      assert.equal(confirmation.operationRun.verifierSummary.taskCompleted, false);
      assert.equal(confirmation.operationRun.verifierSummary.mainVerified, false);
      assert.equal(confirmation.operationRun.verifierSummary.gateDraftReady, false);
      assert.equal(confirmation.operationRun.verifierSummary.releaseReady, false);
      assert.equal(confirmation.operationRun.verifierSummary.journalWrittenBeforeApply, true);
      assert.equal(confirmation.refreshed.operations.operationCount, 1);
      assert.equal(registry.operationCount, 1);
      assert.equal(invocations.length, 1);
      assert.equal(Object.hasOwn(invocations[0], 'command'), false);
      assert.equal(Object.hasOwn(invocations[0], 'cwd'), false);
      assert.equal(Object.hasOwn(invocations[0], 'env'), false);
      assertNoUnsafeStringValues(confirmation, 'route confirmation');

      const invalidConfirmResponse = await fetch(`${baseUrl}/api/goals/${V68_ADOPTION_MAIN_VERIFICATION_GOAL_ID}/adoption-readiness-confirm`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...adoptionConfirmInput(preview),
          command: 'git apply unsafe.patch'
        })
      });
      const invalidConfirm = await invalidConfirmResponse.json();

      assert.equal(invalidConfirmResponse.status, 400);
      assert.equal(invalidConfirm.error.code, 'invalid-adoption-readiness-confirm-request');
      assert.equal(invocations.length, 1);
    } finally {
      await closeServer(server);
      await rm(root, { recursive: true, force: true });
    }
  });
});

function fixture(name) {
  return JSON.parse(readFileSync(join(FIXTURE_DIR, name), 'utf8'));
}

function workerResultFixture(name) {
  return JSON.parse(readFileSync(join(WORKER_RUN_DIR, name), 'utf8'));
}

function reviewerVerdictFixture(name) {
  return JSON.parse(readFileSync(join(REVIEWER_RUN_DIR, name), 'utf8'));
}

function readyInput() {
  return {
    adoptionId: 'adoption-v68-pr1-ready',
    generatedAt: GENERATED_AT,
    goal: activeGoal(),
    task: activeTask(),
    workerEvidence: workerEvidence(),
    reviewerVerdict: reviewerEvidence(),
    worktreeState: cleanWorktree(),
    sourceFingerprint: sourceFingerprint(),
    patchPlan: patchPlan(),
    artifactRefs: artifactRefs()
  };
}

function activeGoal() {
  return {
    goalId: 'v68-adoption-main-verification-loop',
    title: 'v68 Adoption and Main Verification Workbench Loop',
    state: 'active',
    sourceContract: 'goal-next-action.v1',
    sourceRef: 'goal-next-action:v68'
  };
}

function activeTask() {
  return {
    taskId: 'pr-1-adoption-readiness-contracts',
    title: 'Adoption readiness contracts',
    state: 'active',
    sourceContract: 'goal-next-action.v1',
    sourceRef: 'goal-next-action:v68:pr-1'
  };
}

function workerEvidence() {
  return {
    ...workerResultFixture('result.sanitized-success.v1.json'),
    workerActorId: 'codex-worker-v66'
  };
}

function reviewerEvidence() {
  return {
    ...reviewerVerdictFixture('verdict.approved.v1.json'),
    reviewedWorkerRunId: workerEvidence().runId
  };
}

function cleanWorktree() {
  return {
    state: 'clean',
    branch: 'main',
    dirty: false,
    expectedMainWorktree: true,
    sourceRef: 'backend-worktree-state:v68-clean'
  };
}

function sourceFingerprint() {
  return {
    expected: SOURCE_FINGERPRINT,
    current: SOURCE_FINGERPRINT,
    workerRecorded: SOURCE_FINGERPRINT,
    reviewerRecorded: SOURCE_FINGERPRINT
  };
}

function patchPlan() {
  return {
    patchId: 'patch-v68-pr1-ready',
    patchRef: 'artifact-ref:v68:pr1-ready-patch',
    patchFingerprint: PATCH_FINGERPRINT,
    expectedPatchFingerprint: PATCH_FINGERPRINT,
    appliesToFingerprint: SOURCE_FINGERPRINT,
    applyCheck: 'passed',
    fileChanges: [{
      path: 'src/symphony/adoption-main-verification-loop-contracts.js',
      operation: 'modify',
      fingerprintBefore: SOURCE_FINGERPRINT,
      fingerprintAfter: PATCH_FINGERPRINT
    }]
  };
}

function artifactRefs() {
  return [{
    kind: 'artifact-ref',
    ref: 'artifact-ref:v68:pr1-ready-patch',
    label: 'bounded adoption patch'
  }];
}

function backendReadyPreview() {
  return buildAdoptionPreviewFromBackend({
    generatedAt: GENERATED_AT,
    goalId: V68_ADOPTION_MAIN_VERIFICATION_GOAL_ID,
    taskId: 'pr-2-adoption-preview-confirm',
    workerEvidence: workerEvidence(),
    reviewerVerdict: reviewerEvidence(),
    worktreeState: cleanWorktree(),
    sourceFingerprint: sourceFingerprint(),
    patchPlan: patchPlan(),
    artifactRefs: artifactRefs()
  });
}

function adoptionConfirmInput(preview) {
  return {
    planHash: preview.planHash,
    goalId: preview.goal.goalId,
    taskId: preview.task.taskId,
    adoptionId: preview.adoptionId,
    workerRunId: preview.workerEvidence.workerRunId,
    reviewerVerdictId: preview.reviewerEvidence.verdictId,
    patchFingerprint: preview.patchPlan.patchFingerprint,
    sourceFingerprint: preview.sourceFingerprint.current
  };
}

function assertValidationIncludes(validation, expectedError) {
  assert.equal(validation.ok, false);
  assert.ok(
    validation.errors.some((error) => error.includes(expectedError)),
    `expected ${expectedError}; got ${validation.errors.join('; ')}`
  );
}

function assertNoUnsafeStringValues(value, label) {
  for (const text of collectStringValues(value)) {
    assert.doesNotMatch(
      text,
      /\/Users\/|\.jsonl|raw transcript|raw worker transcript|raw model output|provider session|freeform command|generic terminal|arbitrary command|github release/iu,
      `${label}: ${text}`
    );
  }
}

function collectStringValues(value) {
  if (typeof value === 'string') {
    return [value];
  }

  if (Array.isArray(value)) {
    return value.flatMap(collectStringValues);
  }

  if (value && typeof value === 'object') {
    return Object.values(value).flatMap(collectStringValues);
  }

  return [];
}

async function listenOnRandomPort(server) {
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      server.off('error', reject);
      resolve();
    });
  });

  const address = server.address();

  return `http://127.0.0.1:${address.port}`;
}

async function closeServer(server) {
  await new Promise((resolve, reject) => {
    server.close((error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });
}
