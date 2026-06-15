# v70 Release Manager Practical Loop closeout snapshot

Date: 2026-06-15
Timezone: Asia/Shanghai
Goal: `v70-release-manager-practical-loop`
PR-5 branch: `codex/v70-acceptance-closeout-handoff`
Pre-closeout main commit: `59cc3691f31825ec07f0f7416aa109c105a9b2eb`

## Shipped State

v70 ships a release-manager practical loop for preparing and reconciling a release without giving the product release-publication authority:

```text
releaseManagerReadiness.v1
-> releaseEvidenceDraft.v1
-> manualReleasePublicationPack.v1
-> postReleaseReconcileEvidence.v1
-> Workbench Release Manager Practical Loop panel
```

The shipped scope is:

- v70 start evidence on top of verified v69 tag and GitHub Release;
- readiness resolver contracts, fixtures, validators, and tests for branch, clean worktree, main/origin sync, open PRs, required gates, release notes, target commit, tag state, GitHub Release state, and asset policy;
- release evidence draft from explicit gate events and validation command evidence refs;
- manual publication pack with copy-only controller commands for tag, push tag, GitHub Release create, and GitHub Release view;
- post-release reconcile evidence contract for tag object, peeled commit, release URL, draft/prerelease flags, assets, targetCommitish, source evidence refs, and rollback refs;
- Workbench read-only release manager panel showing readiness, blockers, gates, manual commands, post-release reconcile, and disabled product actions;
- rebuilt Workbench static assets;
- v70 acceptance record, closeout snapshot, and v71 native packaging handoff runbook.

v70 does not ship generic shell or terminal UI, arbitrary renderer command execution, frontend local JSONL/session/provider folder reads, `.symphony` internals reads, goal ledger or event-log reads, raw transcript exposure, raw model output exposure, raw provider output exposure, unsupported provider claims, provider-output mutation, direct task completion, direct adoption, main verification pass, release-ready inference from tests alone, automatic self-review, automatic worktree creation, automatic next-version goal creation, product-level git merge/push/tag/publish, GitHub Release create/edit/upload automation, public distribution, notarization, or auto-update claims.

## PR Scope Record

| Runbook slot | GitHub PR | Branch | Merge commit | Merged at | Evidence |
| --- | --- | --- | --- | --- | --- |
| PR-0 runbook | #168 `https://github.com/Andy20010101/multi-coding-agent-symphony/pull/168` | `codex/v70-runbook-start` | `2bd38733e8c4b13790a11fe3d891b7572939fadb` | 2026-06-15T01:25:53Z | Added v70 start evidence and latest runbook. |
| PR-1 release readiness resolver | #169 `https://github.com/Andy20010101/multi-coding-agent-symphony/pull/169` | `codex/v70-release-readiness-resolver` | `9fd52169b51e678d38871c94e8f37814667c6208` | 2026-06-15T01:32:06Z | Added readiness contract, fixtures, validators, and tests. |
| PR-2 release evidence draft and manual pack | #170 `https://github.com/Andy20010101/multi-coding-agent-symphony/pull/170` | `codex/v70-release-evidence-manual-pack` | `132831406d625eb34968e920816fd97ea2f7c290` | 2026-06-15T01:38:06Z | Added release evidence draft and copy-only manual publication pack. |
| PR-3 Workbench release manager surface | #171 `https://github.com/Andy20010101/multi-coding-agent-symphony/pull/171` | `codex/v70-workbench-release-manager-surface` | `1bc44448a6a7ee1c42472df5aac02909b946020d` | 2026-06-15T01:47:05Z | Added Workbench read-only release manager panel, projection, tests, and static assets. |
| PR-4 post-release reconcile evidence | #172 `https://github.com/Andy20010101/multi-coding-agent-symphony/pull/172` | `codex/v70-post-release-reconcile` | `59cc3691f31825ec07f0f7416aa109c105a9b2eb` | 2026-06-15T01:53:34Z | Added post-release reconcile contract, fixtures, tests, Workbench projection, and static assets. |
| PR-5 acceptance, closeout, and v71 handoff | This PR | `codex/v70-acceptance-closeout-handoff` | Pending until merge | Pending until merge | Adds v70 acceptance, closeout snapshot, and v71 runbook. |

## PR-5 Files

| File | Purpose |
| --- | --- |
| `docs/qa/v70-release-manager-practical-loop-acceptance.md` | Acceptance record for release manager contracts, manual publication pack, post-release reconcile, Workbench surface, validation, residual risk, and rollback. |
| `docs/plans/v70-release-manager-practical-loop-closeout-snapshot-2026-06-14.md` | Closeout snapshot for shipped scope, PR chain, validation, rollback, tag/release notes, and v71 handoff. |
| `docs/plans/v71-native-packaging-personal-use-runbook-2026-06-14.md` | Next-version handoff for local personal-use Mac packaging. |

## Validation Evidence

| Command | Result |
| --- | --- |
| `pnpm workbench:build` | Passed on PR-5 branch; static output is `index-D0VJl4Kp.css` and `index-C7QMJj8P.js`. |
| `node --test tests/v70-release-manager-practical-loop.test.js` | Passed on PR-5 branch: 11 tests, 11 passed. |
| `node --test tests/v69-recovery-resume-diagnostics-observability.test.js` | Passed on PR-5 branch: 15 tests, 15 passed. |
| `node --test tests/v58-release-closeout-operator-handoff-pack.test.js tests/v59-release-publication-evidence.test.js` | Passed on PR-5 branch: 12 tests, 12 passed. |
| `node --test tests/workbench-api-client.test.js tests/workbench-shell.test.js tests/workbench-route-smoke.test.js` | Passed on PR-5 branch: 133 tests, 133 passed. A non-failing Vite WebSocket warning reported port `24678` already in use. |
| `pnpm check` | Passed on PR-5 branch. |
| `git diff --check` | Passed on PR-5 branch before writing closeout docs. |

`pnpm test` remains the final tag-before-publication gate. It must run on the final post-PR-5 `origin/main` commit before creating the annotated `v70` tag.

## Release Evidence

The v70 release-manager path is covered by `tests/v70-release-manager-practical-loop.test.js`:

- readiness fixtures validate ready, dirty worktree, branch mismatch, main/origin drift, open PRs, missing gates, wrong tag target, draft/prerelease release, and unexpected assets;
- release evidence draft requires readiness, gate events, validation command evidence refs, release notes, target commit, and rollback refs;
- manual publication pack emits only the allowed copy-only controller commands and rejects arbitrary command drift;
- post-release reconcile blocks missing tags, wrong peeled commits, missing releases, draft/prerelease releases, unexpected assets, release target mismatches, and missing source evidence;
- unsafe raw transcripts, raw model output, provider output, local session refs, shell routes, and mutation routes are rejected.

## Rollback Path

Rollback is PR-scoped:

- revert PR #172 if post-release reconcile accepts missing tag/release evidence, wrong target commits, unexpected assets, release target mismatch, or unsafe source refs;
- revert PR #171 if Workbench exposes execution controls, shell or terminal UI, frontend local session reads, raw output, direct event writes, task completion, git writes, or GitHub Release automation;
- revert PR #170 if manual publication pack accepts arbitrary commands or product-side execution;
- revert PR #169 if readiness ignores dirty baselines, branch drift, open PRs, missing gates, wrong tag targets, unsafe releases, or asset drift;
- keep v69 Recovery, Resume, Diagnostics, and Observability as the fallback state.

## Tag and Release State Before v70 Publication

| Check | Result |
| --- | --- |
| `v69` tag and release | Existing and verified before v70 implementation. |
| `v70` tag | Absent before PR-5 merge. |
| `v70` GitHub Release | Not created before PR-5 merge. |
| Open PR state | `[]` before PR-5 was opened; PR-5 is the only expected open PR while this snapshot is under review. |

After PR-5 is reviewed, merged, and synced to `main`, the controller should:

1. Reconcile `main` and `origin/main`.
2. Verify `v70` tag and GitHub Release are still absent.
3. Run `pnpm test` on the final post-PR-5 `origin/main` commit.
4. Create an annotated `v70` tag on the final `origin/main` commit.
5. Push the `v70` tag.
6. Create the GitHub Release for `v70`.
7. Verify `v70^{}` dereferences to the final `origin/main` commit.
8. Verify the GitHub Release is non-draft, non-prerelease, has no assets, and has targetCommitish `main`.

Release note draft:

```text
v70: Release Manager Practical Loop

- Adds releaseManagerReadiness.v1 for clean main, branch, origin/main sync, open PR, required gate, release notes, target commit, tag, GitHub Release, and asset policy checks.
- Adds releaseEvidenceDraft.v1 and manualReleasePublicationPack.v1 for source-backed release evidence and copy-only controller publication commands.
- Adds postReleaseReconcileEvidence.v1 for tag object, peeled commit, GitHub Release URL, draft/prerelease flags, assets, targetCommitish, source evidence refs, and rollback refs.
- Adds the Workbench Release Manager Practical Loop panel from backend contracts only.
- Keeps release publication outside product code and does not add merge, tag, push, publish, GitHub Release create/edit/upload, shell, terminal, local session reads, raw transcript, provider output, public distribution, notarization, or auto-update automation.
```

## Residual Risks

v70 proves release-manager preparation and reconcile through fixtures, validators, Workbench projection, source tests, static build, and GitHub CI. It does not prove public distribution, notarization, auto-update, or product-side publication.

The real tag object, peeled commit, release URL, release flags, assets, and targetCommitish are controller evidence created after PR-5 merge. They are not present in this pre-publication closeout snapshot.

## v71 Handoff

v71 should be `v71-native-packaging-personal-use`.

The handoff target is:

```text
local Tauri shell
-> local package build
-> app identity/icon/version
-> sidecar lifecycle in packaged app
-> install/reinstall/rollback docs
-> v71 closeout and v72 handoff
```

v71 should make a local personal-use Mac app package. It must not claim public distribution, notarization, auto-update, public `.dmg` release, publish secrets, unsupported providers, broad filesystem access, broad shell access, product-level git writes, or GitHub Release automation.
