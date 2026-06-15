import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  RELEASE_MANAGER_PRACTICAL_BOUNDARIES,
  RELEASE_MANAGER_READINESS_CONTRACT_NAME,
  ReleaseManagerPracticalContractError,
  assertReleaseManagerReadinessContract,
  buildReleaseManagerReadiness,
  validateReleaseManagerReadinessContract
} from '../src/symphony/release-manager-practical-contracts.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, '..');
const FIXTURE_DIR = join(REPO_ROOT, 'fixtures/contracts/release-manager-practical');
const GENERATED_AT = '2026-06-15T01:30:00.000Z';
const TARGET_COMMIT = '0da5b6fd31a987aa9ac9c54c3496e8c2517c60af';
const STALE_COMMIT = 'd5ac61070ed52ee48902dafbca2333e822cbf192';
const RELEASE_URL = 'https://github.com/Andy20010101/multi-coding-agent-symphony/releases/tag/v70';

const VALID_FIXTURES = Object.freeze([
  'release-manager-readiness.ready.v1.json',
  'release-manager-readiness.blocked-dirty-worktree.v1.json',
  'release-manager-readiness.blocked-branch-mismatch.v1.json',
  'release-manager-readiness.blocked-main-origin-drift.v1.json',
  'release-manager-readiness.blocked-open-prs.v1.json',
  'release-manager-readiness.blocked-missing-gates.v1.json',
  'release-manager-readiness.blocked-tag-wrong-commit.v1.json',
  'release-manager-readiness.blocked-release-draft-prerelease.v1.json',
  'release-manager-readiness.blocked-unexpected-assets.v1.json'
]);

describe('v70 release manager practical loop contracts', () => {
  it('validates ready and blocked readiness fixtures as read-only release manager state', () => {
    for (const name of VALID_FIXTURES) {
      const readiness = fixture(name);
      const validation = validateReleaseManagerReadinessContract(readiness);

      assert.equal(validation.ok, true, `${name}: ${validation.errors.join('; ')}`);
      assert.equal(readiness.contractName, RELEASE_MANAGER_READINESS_CONTRACT_NAME);
      assert.equal(readiness.readOnly, true);
      assert.equal(readiness.willMutate, false);
      assert.deepEqual(readiness.boundaries, RELEASE_MANAGER_PRACTICAL_BOUNDARIES, name);
      assert.equal(readiness.boundaries.gitMergeAvailable, false);
      assert.equal(readiness.boundaries.gitTagAvailable, false);
      assert.equal(readiness.boundaries.gitPushAvailable, false);
      assert.equal(readiness.boundaries.githubReleaseCreateAvailable, false);
      assert.equal(readiness.boundaries.githubReleaseEditAvailable, false);
      assert.equal(readiness.boundaries.githubReleaseUploadAvailable, false);
      assert.equal(readiness.boundaries.shellAvailable, false);
      assert.equal(readiness.boundaries.rendererLocalFileReadAvailable, false);
      assert.equal(readiness.boundaries.rawTranscriptAvailable, false);
      assert.equal(readiness.boundaries.releaseReadyInferenceFromTestsAvailable, false);
      assertNoUnsafePayload(readiness);
    }

    const ready = fixture('release-manager-readiness.ready.v1.json');
    const dirty = fixture('release-manager-readiness.blocked-dirty-worktree.v1.json');
    const branchMismatch = fixture('release-manager-readiness.blocked-branch-mismatch.v1.json');
    const drift = fixture('release-manager-readiness.blocked-main-origin-drift.v1.json');
    const openPrs = fixture('release-manager-readiness.blocked-open-prs.v1.json');
    const missingGates = fixture('release-manager-readiness.blocked-missing-gates.v1.json');
    const tagWrongCommit = fixture('release-manager-readiness.blocked-tag-wrong-commit.v1.json');
    const draftPrerelease = fixture('release-manager-readiness.blocked-release-draft-prerelease.v1.json');
    const unexpectedAssets = fixture('release-manager-readiness.blocked-unexpected-assets.v1.json');

    assert.equal(ready.state, 'ready');
    assert.deepEqual(ready.blockedReasons, []);
    assert.equal(ready.releaseBaseline.openPrs.length, 0);
    assert.equal(ready.requiredGates.length, 3);
    assert.equal(ready.tagState.exists, false);
    assert.equal(ready.githubReleaseState.exists, false);
    assert.equal(ready.assetPolicy.expected, 'none');

    assertBlocked(dirty, 'release-baseline-dirty');
    assertBlocked(branchMismatch, 'release-baseline-not-main');
    assertBlocked(drift, 'main-origin-diverged');
    assertBlocked(openPrs, 'open-prs-present');
    assertBlocked(missingGates, 'missing-gate-evidence');
    assertBlocked(tagWrongCommit, 'tag-target-mismatch');
    assertBlocked(draftPrerelease, 'github-release-is-draft');
    assertBlocked(draftPrerelease, 'github-release-is-prerelease');
    assertBlocked(unexpectedAssets, 'unexpected-release-assets');
  });

  it('builds ready release readiness from explicit main, gate, notes, and absent publication facts', () => {
    const readiness = buildReleaseManagerReadiness(readyInput());

    assertReleaseManagerReadinessContract(readiness);
    assert.equal(readiness.state, 'ready');
    assert.equal(readiness.version, 'v70');
    assert.equal(readiness.targetTag, 'v70');
    assert.equal(readiness.targetCommit, TARGET_COMMIT);
    assert.equal(readiness.releaseBaseline.state, 'ready');
    assert.equal(readiness.releaseNotesDraft.state, 'ready');
    assert.equal(readiness.tagState.state, 'ready');
    assert.equal(readiness.tagState.exists, false);
    assert.equal(readiness.githubReleaseState.state, 'ready');
    assert.equal(readiness.githubReleaseState.exists, false);
    assert.deepEqual(readiness.boundaries, RELEASE_MANAGER_PRACTICAL_BOUNDARIES);
    assertNoUnsafePayload(readiness);
  });

  it('blocks dirty or drifted release baselines, open PRs, missing gates, unsafe release state, and asset drift', () => {
    assertBlocked(
      buildReleaseManagerReadiness({
        ...readyInput(),
        releaseBaseline: {
          ...readyReleaseBaseline(),
          clean: false
        }
      }),
      'release-baseline-dirty'
    );
    assertBlocked(
      buildReleaseManagerReadiness({
        ...readyInput(),
        releaseBaseline: {
          ...readyReleaseBaseline(),
          currentBranch: 'codex/v70-release-manager'
        }
      }),
      'release-baseline-not-main'
    );
    assertBlocked(
      buildReleaseManagerReadiness({
        ...readyInput(),
        releaseBaseline: {
          ...readyReleaseBaseline(),
          mainHead: STALE_COMMIT
        }
      }),
      'main-origin-diverged'
    );
    assertBlocked(
      buildReleaseManagerReadiness({
        ...readyInput(),
        openPrs: [openPr()]
      }),
      'open-prs-present'
    );
    assertBlocked(
      buildReleaseManagerReadiness({
        ...readyInput(),
        requiredGates: [
          {
            gateName: 'main.verification-passed',
            state: 'missing',
            required: true,
            evidenceRefs: []
          }
        ]
      }),
      'missing-gate-evidence'
    );
    assertBlocked(
      buildReleaseManagerReadiness({
        ...readyInput(),
        tagEvidence: {
          tagName: 'v70',
          exists: true,
          tagObjectSha: '1b430dc938471cdd20395d06d2eb51b481fcbb92',
          dereferencedCommit: STALE_COMMIT,
          annotated: true
        }
      }),
      'tag-target-mismatch'
    );
    assertBlocked(
      buildReleaseManagerReadiness({
        ...readyInput(),
        githubRelease: {
          tagName: 'v70',
          exists: true,
          url: RELEASE_URL,
          isDraft: true,
          isPrerelease: true,
          targetCommitish: 'main',
          assets: []
        }
      }),
      'github-release-is-draft'
    );
    assertBlocked(
      buildReleaseManagerReadiness({
        ...readyInput(),
        githubRelease: {
          tagName: 'v70',
          exists: true,
          url: RELEASE_URL,
          isDraft: false,
          isPrerelease: false,
          targetCommitish: 'main',
          assets: [{ name: 'unexpected.zip', size: 10, url: RELEASE_URL }]
        }
      }),
      'unexpected-release-assets'
    );
  });

  it('throws before building from raw transcript, local session, shell, or mutation source fields', () => {
    assert.throws(
      () => buildReleaseManagerReadiness({
        ...readyInput(),
        releaseEvidenceRefs: [{
          kind: 'repo-doc',
          ref: '/Users/andy/.codex/sessions/v70.jsonl',
          label: 'local session file'
        }]
      }),
      (error) => {
        assert.equal(error instanceof ReleaseManagerPracticalContractError, true);
        assert.equal(error.code, 'unsafe-release-manager-readiness-source');
        assert.match(error.details.reason, /releaseEvidenceRefs/u);
        return true;
      }
    );
  });

  it('rejects boundary drift in asserted readiness packs', () => {
    const readiness = fixture('release-manager-readiness.ready.v1.json');

    readiness.boundaries.githubReleaseCreateAvailable = true;

    assert.throws(
      () => assertReleaseManagerReadinessContract(readiness),
      (error) => {
        assert.equal(error instanceof ReleaseManagerPracticalContractError, true);
        assert.equal(error.code, 'invalid-release-manager-readiness');
        assert.ok(error.details.errors.includes('boundaries.githubReleaseCreateAvailable must be false'));
        return true;
      }
    );
  });
});

function fixture(name) {
  return JSON.parse(readFileSync(join(FIXTURE_DIR, name), 'utf8'));
}

function readyInput() {
  return {
    generatedAt: GENERATED_AT,
    version: 'v70',
    targetTag: 'v70',
    releaseTitle: 'v70: Release Manager Practical Loop',
    targetCommit: TARGET_COMMIT,
    releaseBaseline: readyReleaseBaseline(),
    openPrs: [],
    requiredGates: readyGates(),
    releaseEvidenceRefs: [
      repoDocEvidence('docs/plans/v69-recovery-resume-diagnostics-observability-closeout-snapshot-2026-06-14.md', 'v69 closeout snapshot'),
      repoDocEvidence('docs/plans/v70-release-manager-practical-loop-runbook-2026-06-14.md', 'v70 runbook')
    ],
    releaseNotesDraft: {
      title: 'v70: Release Manager Practical Loop',
      body: 'Prepare release readiness, manual publication commands, and post-release reconcile without product-level publication automation.',
      sourceRefs: [repoDocEvidence('docs/plans/v70-release-manager-practical-loop-runbook-2026-06-14.md', 'v70 runbook')]
    },
    tagEvidence: {
      tagName: 'v70',
      exists: false
    },
    githubRelease: {
      tagName: 'v70',
      exists: false,
      assets: []
    }
  };
}

function readyReleaseBaseline() {
  return {
    currentBranch: 'main',
    currentHead: TARGET_COMMIT,
    mainHead: TARGET_COMMIT,
    originMainHead: TARGET_COMMIT,
    clean: true,
    openPrs: [],
    sourceRef: {
      kind: 'branch',
      ref: 'origin/main',
      label: 'origin/main'
    }
  };
}

function readyGates() {
  return [
    {
      gateName: 'reviewer.accepted',
      state: 'ready',
      required: true,
      evidenceRefs: [repoDocEvidence('docs/qa/v70-release-manager-practical-loop-acceptance.md', 'acceptance record')]
    },
    {
      gateName: 'main.verification-passed',
      state: 'ready',
      required: true,
      evidenceRefs: [repoDocEvidence('docs/plans/v70-release-manager-practical-loop-closeout-snapshot-2026-06-14.md', 'closeout validation')]
    },
    {
      gateName: 'release.validation-passed',
      state: 'ready',
      required: true,
      evidenceRefs: [repoDocEvidence('tests/v70-release-manager-practical-loop.test.js', 'v70 focused tests')]
    }
  ];
}

function openPr() {
  return {
    number: 168,
    title: 'Open v70 work',
    headRefName: 'codex/v70-followup',
    baseRefName: 'main',
    url: 'https://github.com/Andy20010101/multi-coding-agent-symphony/pull/168',
    isDraft: false
  };
}

function assertBlocked(readiness, reason) {
  const validation = validateReleaseManagerReadinessContract(readiness);

  assert.equal(validation.ok, true, validation.errors.join('; '));
  assert.equal(readiness.state, 'blocked');
  assert.ok(readiness.blockedReasons.includes(reason), readiness.blockedReasons.join('; '));
  assertNoUnsafePayload(readiness);
}

function assertNoUnsafePayload(value) {
  const serialized = JSON.stringify(value);

  assert.doesNotMatch(serialized, /raw transcript|raw model output|provider output|provider session|session path|goal ledger|\.jsonl/iu);
  assert.doesNotMatch(serialized, /append event directly|mark complete|declare release ready|git merge|git push|git tag|gh release create|gh release edit|gh release upload|run shell|terminal|provider launch|create next goal/iu);
}

function repoDocEvidence(ref, label) {
  return {
    kind: 'repo-doc',
    ref,
    label
  };
}
