# v70 Release Manager Practical Loop acceptance

Date: 2026-06-15
Timezone: Asia/Shanghai
Goal: `v70-release-manager-practical-loop`

## Accepted Scope

v70 makes the release manager loop explicit without moving release publication into product code:

```text
releaseManagerReadiness.v1
-> releaseEvidenceDraft.v1
-> manualReleasePublicationPack.v1
-> postReleaseReconcileEvidence.v1
-> Workbench Release Manager Practical Loop panel
```

Accepted changes:

- v70 start evidence is recorded in `docs/plans/v70-release-manager-practical-loop-runbook-2026-06-14.md` and `docs/plans/workbench-v61-v72-real-use-runbooks/v70_release-manager-practical-loop_goal_runbook_latest.md`.
- `releaseManagerReadiness.v1` checks clean main, branch, `main` and `origin/main` sync, open PRs, required gates, release evidence refs, release notes draft, target commit, tag state, GitHub Release state, and asset policy.
- Readiness fixtures cover ready, dirty worktree, branch mismatch, main/origin drift, open PRs, missing gates, wrong tag target, draft/prerelease release, and unexpected assets.
- `releaseEvidenceDraft.v1` records explicit gate events, validation command evidence refs, release notes draft, known facts, and rollback refs.
- `manualReleasePublicationPack.v1` records copy-only commands for annotated tag creation, tag push, GitHub Release creation, and GitHub Release inspection. The pack marks publication as `manual-controller-action` with `externalActionRequired: true`.
- `postReleaseReconcileEvidence.v1` records actual tag object, dereferenced commit, GitHub Release URL, draft/prerelease flags, asset policy, target commitish, source evidence refs, and rollback refs after controller publication.
- Workbench shows readiness, blockers, gate evidence, manual publication commands, post-release reconcile evidence, and disabled product actions in a read-only panel.
- Rebuilt Workbench static assets point to CSS asset `index-D0VJl4Kp.css` and JS asset `index-C7QMJj8P.js`.
- v71 handoff is recorded in `docs/plans/v71-native-packaging-personal-use-runbook-2026-06-14.md`.

Out of scope:

- generic shell or terminal UI;
- arbitrary renderer-side command execution;
- frontend reads of local JSONL files, provider session folders, `.symphony` internals, goal ledgers, event logs, raw transcripts, raw provider output, or raw model output;
- unsupported provider claims;
- direct provider-output mutation, task completion, adoption, main verification, or release readiness;
- automatic self-review, automatic worktree creation, or automatic next-version goal creation;
- product-level git merge, push, tag, publish, GitHub Release create, GitHub Release edit, or asset upload automation;
- release-ready inference from passing tests alone;
- public distribution, notarization, or auto-update claims.

## Evidence

| Check | Result |
| --- | --- |
| `pnpm workbench:build` | Passed on PR-5 branch. Built `src/symphony/workbench-static/index.html`, CSS asset `index-D0VJl4Kp.css`, and JS asset `index-C7QMJj8P.js`. |
| `node --test tests/v70-release-manager-practical-loop.test.js` | Passed on PR-5 branch: 11 tests, 11 passed. |
| `node --test tests/v69-recovery-resume-diagnostics-observability.test.js` | Passed on PR-5 branch: 15 tests, 15 passed. |
| `node --test tests/v58-release-closeout-operator-handoff-pack.test.js tests/v59-release-publication-evidence.test.js` | Passed on PR-5 branch: 12 tests, 12 passed. |
| `node --test tests/workbench-api-client.test.js tests/workbench-shell.test.js tests/workbench-route-smoke.test.js` | Passed on PR-5 branch: 133 tests, 133 passed. A non-failing Vite WebSocket warning reported port `24678` already in use. |
| `pnpm check` | Passed on PR-5 branch. |
| `git diff --check` | Passed on PR-5 branch before writing closeout docs. |
| v70 tag pre-publication check | `git tag --list 'v70'` returned no tag. |
| v70 GitHub Release pre-publication check | `gh release view v70 --repo Andy20010101/multi-coding-agent-symphony` returned `release not found`. |
| Open PR pre-PR-5 check | `gh pr list --state open` returned `[]` before PR-5 was opened. |

## Acceptance Criteria

| Criterion | Evidence |
| --- | --- |
| Release readiness is explicit. | `src/symphony/release-manager-practical-contracts.js`, readiness fixtures, and v70 focused tests. |
| Release evidence is source-backed. | `releaseEvidenceDraft.v1` requires gate events, validation command evidence refs, release notes, target commit, and rollback refs. |
| Publication remains a controller action. | `manualReleasePublicationPack.v1` exposes copy-only commands and marks every command `willMutate: false` in product contracts. |
| Post-release reconcile records actual publication facts. | `postReleaseReconcileEvidence.v1` validates tag object, peeled commit, release flags, assets, target commitish, source evidence refs, and rollback refs. |
| Workbench remains read-only. | Workbench tests assert no form, button, textarea, arbitrary fetch, clipboard, window-open, shell, event-confirm, merge, tag, push, or release execution controls in the release manager panel. |
| v71 handoff is scoped. | `docs/plans/v71-native-packaging-personal-use-runbook-2026-06-14.md` keeps packaging personal-use only and excludes public distribution, notarization, auto-update, and broad filesystem or shell access. |

## Residual Risk

v70 proves release-manager state through contracts, fixtures, tests, Workbench projection, static build, and GitHub CI. It does not make the product publish releases.

The post-release reconcile contract is ready before publication. The real `v70` tag object, `v70^{}` commit, GitHub Release URL, flags, assets, and targetCommitish must be captured by the controller after PR-5 merges and the release is created.

## Rollback

If readiness accepts branch drift, open PRs, missing gates, wrong tag targets, draft/prerelease releases, unexpected assets, raw transcripts, local session paths, or provider payloads, revert PR #169 and dependent v70 changes.

If manual publication pack output becomes executable product behavior or accepts arbitrary commands, revert PR #170 and dependent Workbench changes.

If Workbench exposes shell, terminal, arbitrary command launch, frontend local file/session reads, raw transcripts, raw provider output, direct event append, task completion, git writes, or GitHub Release automation, revert PR #171 and rebuild static assets from the reverted source.

If post-release reconcile accepts missing tag/release evidence, wrong target commits, unexpected assets, or unsafe source refs, revert PR #172 and dependent closeout claims.
