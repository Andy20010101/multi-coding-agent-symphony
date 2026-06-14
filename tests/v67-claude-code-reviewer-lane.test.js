import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  REVIEWER_RUN_BOUNDARIES,
  REVIEWER_RUN_COMMAND_TEMPLATE_ID,
  REVIEWER_RUN_HANDOFF_CONTRACT_NAME,
  REVIEWER_RUN_PROVIDER_ID,
  REVIEWER_RUN_ROLE,
  REVIEWER_RUN_VERDICT_CONTRACT_NAME,
  ReviewerRunContractError,
  buildReviewerRunHandoff,
  buildReviewerRunVerdict,
  computeReviewerRunPlanHash,
  validateReviewerRunHandoffContract,
  validateReviewerRunVerdictContract
} from '../src/symphony/reviewer-run-contracts.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, '..');
const FIXTURE_DIR = join(REPO_ROOT, 'fixtures/contracts/reviewer-run');
const PROVIDER_READINESS_DIR = join(REPO_ROOT, 'fixtures/contracts/provider-readiness');
const WORKER_RUN_DIR = join(REPO_ROOT, 'fixtures/contracts/worker-run');
const GENERATED_AT = '2026-06-15T05:10:00.000Z';

const VALID_HANDOFF_FIXTURES = Object.freeze([
  'handoff.ready.v1.json',
  'handoff.missing-worker-evidence.v1.json',
  'handoff.claude-readiness-blocked.v1.json',
  'handoff.self-review-blocked.v1.json'
]);
const VALID_VERDICT_FIXTURES = Object.freeze([
  'verdict.approved.v1.json',
  'verdict.needs-revision.v1.json',
  'verdict.blocked.v1.json'
]);

describe('v67 Claude Code Reviewer Lane contracts', () => {
  it('validates reviewer handoff fixtures with fixed Claude reviewer boundaries', () => {
    for (const name of VALID_HANDOFF_FIXTURES) {
      const handoff = fixture(name);
      const validation = validateReviewerRunHandoffContract(handoff);

      assert.equal(validation.ok, true, `${name}: ${validation.errors.join('; ')}`);
      assert.equal(handoff.contractName, REVIEWER_RUN_HANDOFF_CONTRACT_NAME);
      assert.equal(handoff.provider.providerId, REVIEWER_RUN_PROVIDER_ID);
      assert.equal(handoff.provider.role, REVIEWER_RUN_ROLE);
      assert.equal(handoff.commandTemplate.templateId, REVIEWER_RUN_COMMAND_TEMPLATE_ID);
      assert.equal(handoff.commandTemplate.fixed, true);
      assert.equal(handoff.commandTemplate.acceptsFreeformCommand, false);
      assert.equal(handoff.confirmation.requiresPlanHash, true);
      assert.equal(handoff.confirmation.providerId, REVIEWER_RUN_PROVIDER_ID);
      assert.equal(handoff.confirmation.role, REVIEWER_RUN_ROLE);
      assert.deepEqual(handoff.boundaries, REVIEWER_RUN_BOUNDARIES);
      assert.equal(handoff.planHash, computeReviewerRunPlanHash(handoff));
      assertNoUnsafeStringValues(handoff, name);
    }
  });

  it('keeps ready handoff bound to sanitized Codex worker evidence', () => {
    const handoff = fixture('handoff.ready.v1.json');

    assert.equal(handoff.state, 'ready');
    assert.equal(handoff.workerEvidence.state, 'ready');
    assert.equal(handoff.workerEvidence.workerProviderId, 'codex-cli');
    assert.equal(handoff.workerEvidence.workerRole, 'worker');
    assert.equal(handoff.workerEvidence.taskState, 'needs-review');
    assert.equal(handoff.workerEvidence.reviewRequired, true);
    assert.equal(handoff.workerEvidence.taskCompleted, false);
    assert.equal(handoff.workerEvidence.reviewApproved, false);
    assert.equal(handoff.workerEvidence.mainVerified, false);
    assert.equal(handoff.workerEvidence.releaseReady, false);
    assert.equal(handoff.reviewPolicy.requiresIndependentReviewer, true);
    assert.equal(handoff.reviewPolicy.verdictCompletesTask, false);
    assert.equal(handoff.reviewPolicy.adoptionAvailable, false);
    assert.equal(handoff.reviewPolicy.mainVerificationAvailable, false);
    assert.equal(handoff.reviewPolicy.releaseReadinessAvailable, false);
  });

  it('records missing worker evidence, Claude readiness, and self-review as blocked handoffs', () => {
    const missing = fixture('handoff.missing-worker-evidence.v1.json');
    const claudeBlocked = fixture('handoff.claude-readiness-blocked.v1.json');
    const selfReview = fixture('handoff.self-review-blocked.v1.json');

    assert.equal(missing.state, 'blocked');
    assert.deepEqual(missing.blockedReasons, ['worker-evidence-missing', 'worker-evidence-not-needs-review', 'worker-evidence-review-not-required']);
    assert.equal(missing.workerEvidence.state, 'missing');

    assert.equal(claudeBlocked.state, 'blocked');
    assert.ok(claudeBlocked.blockedReasons.includes('claude-code-cli-provider-blocked'));

    assert.equal(selfReview.state, 'blocked');
    assert.ok(selfReview.blockedReasons.includes('self-review-blocked'));
    assert.equal(selfReview.workerEvidence.workerActorId, selfReview.reviewerIdentity.reviewerActorId);
  });

  it('rejects unsafe raw output refs before reviewer handoff can be confirmed', () => {
    const unsafe = fixture('handoff.unsafe-raw-output-ref.invalid.v1.json');
    const validation = validateReviewerRunHandoffContract(unsafe);

    assert.equal(validation.ok, false);
    assert.ok(
      validation.errors.some((error) => error.includes('workerEvidence.evidenceRefs[0].ref must be a safe ref')),
      validation.errors.join('; ')
    );
  });

  it('sanitizes worker evidence material and blocks raw-source input', () => {
    const handoff = buildReviewerRunHandoff({
      generatedAt: GENERATED_AT,
      goal: activeGoal(),
      task: activeTask(),
      providerReadiness: providerReadiness('provider-readiness.both-ready.v1.json'),
      reviewerIdentity: reviewerIdentity(),
      workerEvidence: {
        ...workerResult(),
        rawTranscript: 'raw worker transcript must not appear',
        rawModelOutput: 'raw model output must not appear',
        changedFiles: [
          'src/symphony/reviewer-run-contracts.js',
          '.codex/sessions/raw.jsonl',
          '../main-worktree/src/symphony/reviewer-run-contracts.js'
        ],
        validationCommands: [
          'node --test tests/v67-claude-code-reviewer-lane.test.js',
          'cat .codex/sessions/raw.jsonl'
        ]
      }
    });

    assert.equal(handoff.state, 'blocked');
    assert.ok(handoff.blockedReasons.includes('unsafe-worker-evidence-source'));
    assert.deepEqual(handoff.workerEvidence.changedFiles, ['src/symphony/reviewer-run-contracts.js']);
    assert.deepEqual(handoff.workerEvidence.validationCommands, [
      'node --test tests/v67-claude-code-reviewer-lane.test.js'
    ]);
    assertNoUnsafeStringValues(handoff, 'sanitized handoff');
  });

  it('validates reviewer verdict fixtures without approving adoption, main verification, or release readiness', () => {
    const handoff = fixture('handoff.ready.v1.json');

    for (const name of VALID_VERDICT_FIXTURES) {
      const verdict = fixture(name);
      const validation = validateReviewerRunVerdictContract(verdict, { handoff });

      assert.equal(validation.ok, true, `${name}: ${validation.errors.join('; ')}`);
      assert.equal(verdict.contractName, REVIEWER_RUN_VERDICT_CONTRACT_NAME);
      assert.equal(verdict.providerId, REVIEWER_RUN_PROVIDER_ID);
      assert.equal(verdict.role, REVIEWER_RUN_ROLE);
      assert.equal(verdict.commandTemplateId, REVIEWER_RUN_COMMAND_TEMPLATE_ID);
      assert.equal(verdict.handoffPlanHash, handoff.planHash);
      assert.equal(verdict.handoffPackRef, handoff.handoffPackRef);
      assert.notEqual(verdict.reviewerActorId, verdict.workerActorId);
      assert.equal(verdict.realClaudeSmokeOptIn, false);
      assert.equal(verdict.nextState.taskCompleted, false);
      assert.equal(verdict.nextState.adoptionReady, false);
      assert.equal(verdict.nextState.mainVerified, false);
      assert.equal(verdict.nextState.releaseReady, false);
      assert.deepEqual(verdict.boundaries, REVIEWER_RUN_BOUNDARIES);
      assertNoUnsafeStringValues(verdict, name);
    }
  });

  it('builds structured reviewer verdicts from sanitized fake Claude output', () => {
    const handoff = fixture('handoff.ready.v1.json');
    const verdict = buildReviewerRunVerdict({
      handoff,
      verdictId: 'reviewer-verdict-v67-pr1-generated',
      startedAt: '2026-06-15T05:20:00.000Z',
      finishedAt: '2026-06-15T05:21:00.000Z',
      status: 'needs-revision',
      reviewerOutput: {
        summary: 'Fake Claude reviewer requested a revision.',
        rawModelOutput: 'raw model output must not appear',
        findings: [{
          severity: 'major',
          file: 'src/symphony/reviewer-run-contracts.js',
          line: 12,
          statement: 'Reviewer verdict must stay separate from main verification.',
          recommendation: 'Keep main verification owned by v68.'
        }],
        validationCommands: [
          'node --test tests/v67-claude-code-reviewer-lane.test.js',
          'cat .claude/raw-output.jsonl'
        ],
        evidenceRefs: [{
          kind: 'repo-doc',
          ref: 'docs/qa/v67-claude-code-reviewer-lane-acceptance.md',
          label: 'v67 reviewer evidence'
        }]
      }
    });

    assert.equal(validateReviewerRunVerdictContract(verdict, { handoff }).ok, true);
    assert.equal(verdict.status, 'needs-revision');
    assert.equal(verdict.nextState.revisionRequired, true);
    assert.deepEqual(verdict.sanitizedVerdict.validationCommands, [
      'node --test tests/v67-claude-code-reviewer-lane.test.js'
    ]);
    assertNoUnsafeStringValues(verdict, 'generated verdict');
  });

  it('rejects stale handoff hashes, self-review verdicts, raw output fields, and release-ready drift', () => {
    const handoff = fixture('handoff.ready.v1.json');
    const approved = fixture('verdict.approved.v1.json');
    const stale = {
      ...approved,
      handoffPlanHash: 'sha256:2222222222222222222222222222222222222222222222222222222222222222'
    };
    const selfReview = {
      ...approved,
      reviewerActorId: approved.workerActorId
    };
    const unsafe = structuredClone(approved);
    const releaseReady = structuredClone(approved);

    unsafe.sanitizedVerdict.rawModelOutput = 'raw model output';
    releaseReady.nextState.releaseReady = true;

    assertValidationIncludes(
      validateReviewerRunVerdictContract(stale, { handoff }),
      'handoffPlanHash must match reviewer handoff'
    );
    assertValidationIncludes(
      validateReviewerRunVerdictContract(selfReview, { handoff }),
      'reviewerActorId must differ from workerActorId'
    );
    assertValidationIncludes(
      validateReviewerRunVerdictContract(unsafe, { handoff }),
      'sanitizedVerdict.rawModelOutput is not allowed'
    );
    assertValidationIncludes(
      validateReviewerRunVerdictContract(releaseReady, { handoff }),
      'nextState.releaseReady must be false'
    );
    assert.throws(
      () => buildReviewerRunVerdict({
        handoff: fixture('handoff.self-review-blocked.v1.json'),
        verdictId: 'reviewer-verdict-self-review',
        reviewerOutput: {
          evidenceRefs: [{
            kind: 'repo-doc',
            ref: 'docs/qa/v67-claude-code-reviewer-lane-acceptance.md',
            label: 'v67 reviewer evidence'
          }]
        }
      }),
      (error) => error instanceof ReviewerRunContractError &&
        error.code === 'invalid-reviewer-run-verdict'
    );
  });
});

function fixture(name) {
  return JSON.parse(readFileSync(join(FIXTURE_DIR, name), 'utf8'));
}

function providerReadiness(name) {
  return JSON.parse(readFileSync(join(PROVIDER_READINESS_DIR, name), 'utf8'));
}

function workerResult() {
  return {
    ...JSON.parse(readFileSync(join(WORKER_RUN_DIR, 'result.sanitized-success.v1.json'), 'utf8')),
    workerActorId: 'codex-worker-v66'
  };
}

function activeGoal() {
  return {
    goalId: 'v67-claude-code-reviewer-lane',
    title: 'v67 Claude Code Reviewer Lane',
    state: 'active',
    sourceContract: 'goal-next-action.v1',
    sourceRef: 'goal-next-action:v67'
  };
}

function activeTask() {
  return {
    taskId: 'pr-1-reviewer-run-contracts',
    title: 'Reviewer handoff and verdict contracts',
    state: 'active',
    sourceContract: 'goal-next-action.v1',
    sourceRef: 'goal-next-action:v67:pr-1'
  };
}

function reviewerIdentity() {
  return {
    reviewerActorId: 'claude-reviewer-v67',
    sourceContract: 'operator-reviewer-identity.v1',
    sourceRef: 'operator-reviewer:claude-reviewer-v67'
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
