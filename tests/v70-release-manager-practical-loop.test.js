import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  MANUAL_PUBLICATION_PACK_CONTRACT_NAME,
  POST_RELEASE_RECONCILE_EVIDENCE_CONTRACT_NAME,
  RELEASE_EVIDENCE_DRAFT_CONTRACT_NAME,
  RELEASE_MANAGER_PRACTICAL_BOUNDARIES,
  RELEASE_MANAGER_READINESS_CONTRACT_NAME,
  ReleaseManagerPracticalContractError,
  assertManualPublicationPackContract,
  assertPostReleaseReconcileEvidenceContract,
  assertReleaseEvidenceDraftContract,
  assertReleaseManagerReadinessContract,
  buildManualPublicationPack,
  buildPostReleaseReconcileEvidence,
  buildReleaseEvidenceDraft,
  buildReleaseManagerReadiness,
  validateManualPublicationPackContract,
  validatePostReleaseReconcileEvidenceContract,
  validateReleaseEvidenceDraftContract,
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
const PR2_FIXTURES = Object.freeze([
  'release-evidence-draft.ready.v1.json',
  'manual-publication-pack.ready.v1.json'
]);
const PR4_FIXTURES = Object.freeze([
  'post-release-reconcile.ready.v1.json',
  'post-release-reconcile.blocked-missing-release.v1.json'
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

  it('validates release evidence draft and manual publication pack fixtures', () => {
    const draft = fixture('release-evidence-draft.ready.v1.json');
    const pack = fixture('manual-publication-pack.ready.v1.json');
    const readyReconcile = fixture('post-release-reconcile.ready.v1.json');
    const missingReleaseReconcile = fixture('post-release-reconcile.blocked-missing-release.v1.json');

    assert.deepEqual(PR2_FIXTURES.map((name) => fixture(name).contractName), [
      RELEASE_EVIDENCE_DRAFT_CONTRACT_NAME,
      MANUAL_PUBLICATION_PACK_CONTRACT_NAME
    ]);
    assert.deepEqual(PR4_FIXTURES.map((name) => fixture(name).contractName), [
      POST_RELEASE_RECONCILE_EVIDENCE_CONTRACT_NAME,
      POST_RELEASE_RECONCILE_EVIDENCE_CONTRACT_NAME
    ]);
    assert.equal(validateReleaseEvidenceDraftContract(draft).ok, true);
    assert.equal(validateManualPublicationPackContract(pack).ok, true);
    assert.equal(validatePostReleaseReconcileEvidenceContract(readyReconcile).ok, true);
    assert.equal(validatePostReleaseReconcileEvidenceContract(missingReleaseReconcile).ok, true);
    assert.equal(draft.state, 'ready');
    assert.equal(pack.state, 'ready');
    assert.equal(readyReconcile.state, 'ready');
    assert.equal(missingReleaseReconcile.state, 'blocked');
    assertBlocked(missingReleaseReconcile, 'github-release-missing', validatePostReleaseReconcileEvidenceContract);
    assert.equal(pack.publicationMode, 'manual-controller-action');
    assert.equal(pack.externalActionRequired, true);
    assert.equal(pack.copyOnly, true);
    assert.equal(pack.commands.length, 4);
    assertManualCommandsAreCopyOnly(pack);
    assertNoUnsafePayload(readyReconcile);
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

  it('builds release evidence draft and copy-only manual publication commands from explicit gate evidence', () => {
    const readiness = buildReleaseManagerReadiness(readyInput());
    const draft = buildReleaseEvidenceDraft(readyEvidenceDraftInput(readiness));
    const pack = buildManualPublicationPack(readyManualPackInput(draft));

    assertReleaseEvidenceDraftContract(draft);
    assertManualPublicationPackContract(pack);
    assert.equal(draft.state, 'ready');
    assert.equal(draft.gateEvents.length, 4);
    assert.equal(draft.validationCommandEvidenceRefs.length, 2);
    assert.equal(pack.state, 'ready');
    assert.equal(pack.targetTag, 'v70');
    assert.equal(pack.targetCommit, TARGET_COMMIT);
    assert.deepEqual(pack.commands.map((command) => command.commandId), [
      'create-annotated-tag',
      'push-tag',
      'create-github-release',
      'view-github-release'
    ]);
    assert.ok(pack.commands[0].command.includes(`git tag -a v70 ${TARGET_COMMIT}`));
    assert.ok(pack.commands[1].command.includes('git push origin v70'));
    assert.ok(pack.commands[2].command.includes('gh release create v70 --repo Andy20010101/multi-coding-agent-symphony'));
    assert.ok(pack.commands[3].command.includes('gh release view v70 --repo Andy20010101/multi-coding-agent-symphony'));
    assertManualCommandsAreCopyOnly(pack);
  });

  it('builds post-release reconcile evidence from explicit tag and GitHub Release query results', () => {
    const reconcile = buildPostReleaseReconcileEvidence(readyPostReleaseReconcileInput());

    assertPostReleaseReconcileEvidenceContract(reconcile);
    assert.equal(reconcile.contractName, POST_RELEASE_RECONCILE_EVIDENCE_CONTRACT_NAME);
    assert.equal(reconcile.state, 'ready');
    assert.equal(reconcile.targetTag, 'v70');
    assert.equal(reconcile.targetCommit, TARGET_COMMIT);
    assert.equal(reconcile.releaseBaseline.state, 'ready');
    assert.equal(reconcile.tagState.exists, true);
    assert.equal(reconcile.tagState.annotated, true);
    assert.equal(reconcile.tagState.matchesTarget, true);
    assert.equal(reconcile.githubReleaseState.exists, true);
    assert.equal(reconcile.githubReleaseState.isDraft, false);
    assert.equal(reconcile.githubReleaseState.isPrerelease, false);
    assert.equal(reconcile.githubReleaseState.targetCommitMatches, true);
    assert.equal(reconcile.assetPolicy.state, 'ready');
    assert.equal(reconcile.sourceEvidenceRefs.length, 2);
    assert.equal(reconcile.rollbackRefs.length, 2);
    assert.deepEqual(reconcile.boundaries, RELEASE_MANAGER_PRACTICAL_BOUNDARIES);
    assertNoUnsafePayload(reconcile);
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

  it('blocks evidence drafts without validation command evidence and packs whose source draft is not ready', () => {
    const readiness = buildReleaseManagerReadiness(readyInput());
    const blockedDraft = buildReleaseEvidenceDraft({
      ...readyEvidenceDraftInput(readiness),
      validationCommandEvidenceRefs: []
    });
    const blockedPack = buildManualPublicationPack(readyManualPackInput(blockedDraft));

    assertBlocked(blockedDraft, 'missing-validation-command-evidence', validateReleaseEvidenceDraftContract);
    assertBlocked(blockedPack, 'release-evidence-draft-not-ready', validateManualPublicationPackContract);
  });

  it('blocks post-release reconcile when tag, release, target, assets, or source evidence are not verified', () => {
    assertBlocked(
      buildPostReleaseReconcileEvidence({
        ...readyPostReleaseReconcileInput(),
        tagEvidence: {
          tagName: 'v70',
          exists: false
        }
      }),
      'post-release-tag-missing',
      validatePostReleaseReconcileEvidenceContract
    );
    assertBlocked(
      buildPostReleaseReconcileEvidence({
        ...readyPostReleaseReconcileInput(),
        tagEvidence: {
          ...readyTagEvidence(),
          dereferencedCommit: STALE_COMMIT
        }
      }),
      'tag-target-mismatch',
      validatePostReleaseReconcileEvidenceContract
    );
    assertBlocked(
      buildPostReleaseReconcileEvidence({
        ...readyPostReleaseReconcileInput(),
        githubRelease: {
          ...readyGithubReleaseEvidence(),
          exists: false,
          url: null,
          publishedAt: null
        }
      }),
      'github-release-missing',
      validatePostReleaseReconcileEvidenceContract
    );
    assertBlocked(
      buildPostReleaseReconcileEvidence({
        ...readyPostReleaseReconcileInput(),
        githubRelease: {
          ...readyGithubReleaseEvidence(),
          isDraft: true,
          isPrerelease: true,
          assets: [{ name: 'unexpected.zip', size: 10, url: RELEASE_URL }]
        },
        sourceEvidenceRefs: []
      }),
      'github-release-is-draft',
      validatePostReleaseReconcileEvidenceContract
    );
    assertBlocked(
      buildPostReleaseReconcileEvidence({
        ...readyPostReleaseReconcileInput(),
        githubRelease: {
          ...readyGithubReleaseEvidence(),
          targetCommitish: STALE_COMMIT
        }
      }),
      'github-release-target-mismatch',
      validatePostReleaseReconcileEvidenceContract
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

  it('rejects arbitrary manual command drift even when command text is copy-only', () => {
    const readiness = buildReleaseManagerReadiness(readyInput());
    const draft = buildReleaseEvidenceDraft(readyEvidenceDraftInput(readiness));
    const pack = buildManualPublicationPack(readyManualPackInput(draft));

    pack.commands[0].command = 'gh release edit v70 --repo Andy20010101/multi-coding-agent-symphony --draft';

    const validation = validateManualPublicationPackContract(pack);

    assert.equal(validation.ok, false);
    assert.ok(validation.errors.some((error) => error.includes('copy-only command')), validation.errors.join('; '));
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

function readyEvidenceDraftInput(readiness) {
  return {
    generatedAt: GENERATED_AT,
    readiness,
    gateEvents: [
      {
        gateName: 'reviewer.accepted',
        eventType: 'reviewer.accepted',
        state: 'ready',
        evidenceRefs: [repoDocEvidence('docs/qa/v70-release-manager-practical-loop-acceptance.md', 'review acceptance')]
      },
      {
        gateName: 'main.verification-passed',
        eventType: 'main.verification-passed',
        state: 'ready',
        evidenceRefs: [repoDocEvidence('docs/plans/v70-release-manager-practical-loop-closeout-snapshot-2026-06-14.md', 'main validation')]
      },
      {
        gateName: 'release.validation-passed',
        eventType: 'release.validation-passed',
        state: 'ready',
        evidenceRefs: [repoDocEvidence('tests/v70-release-manager-practical-loop.test.js', 'release validation')]
      },
      {
        gateName: 'validation.command-passed',
        eventType: 'validation.command-passed',
        state: 'ready',
        evidenceRefs: [repoDocEvidence('docs/plans/v70-release-manager-practical-loop-closeout-snapshot-2026-06-14.md', 'validation command evidence')]
      }
    ],
    validationCommandEvidenceRefs: [
      repoDocEvidence('tests/v70-release-manager-practical-loop.test.js', 'v70 focused validation'),
      repoDocEvidence('tests/v58-release-closeout-operator-handoff-pack.test.js', 'release boundary regression validation')
    ],
    knownFacts: [
      'v70 publication remains a controller action outside product code',
      'manual commands are copy-only and require clean reconcile before use'
    ],
    rollbackRefs: [repoDocEvidence('docs/plans/v69-recovery-resume-diagnostics-observability-closeout-snapshot-2026-06-14.md', 'v69 fallback state')]
  };
}

function readyManualPackInput(draft) {
  return {
    generatedAt: GENERATED_AT,
    evidenceDraft: draft,
    repository: 'Andy20010101/multi-coding-agent-symphony',
    sourceEvidenceRefs: draft.validationCommandEvidenceRefs,
    rollbackRefs: draft.rollbackRefs
  };
}

function readyPostReleaseReconcileInput() {
  return {
    generatedAt: GENERATED_AT,
    version: 'v70',
    targetTag: 'v70',
    targetCommit: TARGET_COMMIT,
    releaseBaseline: readyReleaseBaseline(),
    openPrs: [],
    tagEvidence: readyTagEvidence(),
    githubRelease: readyGithubReleaseEvidence(),
    sourceEvidenceRefs: [
      {
        kind: 'command-evidence',
        ref: 'git-show-ref-tags-v70',
        label: 'tag ref verification'
      },
      {
        kind: 'command-evidence',
        ref: 'gh-release-view-v70',
        label: 'GitHub Release verification'
      }
    ],
    rollbackRefs: [
      {
        kind: 'git-ref',
        ref: 'refs/tags/v69',
        label: 'v69 rollback tag'
      },
      {
        kind: 'release-url',
        ref: 'https://github.com/Andy20010101/multi-coding-agent-symphony/releases/tag/v69',
        label: 'v69 release page'
      }
    ]
  };
}

function readyTagEvidence() {
  return {
    tagName: 'v70',
    exists: true,
    tagObjectSha: '4d4a1f8fe7d519c2d109cc9f6ad2eec652be0fd5',
    dereferencedCommit: TARGET_COMMIT,
    annotated: true,
    sourceRefs: [
      {
        kind: 'git-ref',
        ref: 'refs/tags/v70',
        label: 'v70 tag object'
      }
    ]
  };
}

function readyGithubReleaseEvidence() {
  return {
    tagName: 'v70',
    exists: true,
    name: 'v70: Release Manager Practical Loop',
    url: RELEASE_URL,
    isDraft: false,
    isPrerelease: false,
    publishedAt: '2026-06-15T01:30:00Z',
    targetCommitish: 'main',
    assets: [],
    sourceRefs: [
      {
        kind: 'github-release',
        ref: 'v70',
        label: 'v70 GitHub Release'
      }
    ]
  };
}

function assertBlocked(readiness, reason, validator = validateReleaseManagerReadinessContract) {
  const validation = validator(readiness);

  assert.equal(validation.ok, true, validation.errors.join('; '));
  assert.equal(readiness.state, 'blocked');
  assert.ok(readiness.blockedReasons.includes(reason), readiness.blockedReasons.join('; '));
  if (readiness.contractName !== MANUAL_PUBLICATION_PACK_CONTRACT_NAME) {
    assertNoUnsafePayload(readiness);
  }
}

function assertManualCommandsAreCopyOnly(pack) {
  for (const command of pack.commands) {
    assert.equal(command.copyOnly, true);
    assert.equal(command.willMutate, false);
    assert.equal(command.allowedActor, 'release-controller');
    assert.equal(command.requiresCleanReconcile, true);
  }
  assert.equal(pack.boundaries.gitTagAvailable, false);
  assert.equal(pack.boundaries.gitPushAvailable, false);
  assert.equal(pack.boundaries.githubReleaseCreateAvailable, false);
  assert.equal(pack.boundaries.githubReleaseEditAvailable, false);
  assert.equal(pack.boundaries.githubReleaseUploadAvailable, false);
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
