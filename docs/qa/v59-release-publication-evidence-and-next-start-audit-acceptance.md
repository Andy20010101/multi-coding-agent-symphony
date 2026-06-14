# v59 Release Publication Evidence and Next Start Audit acceptance

Date: 2026-06-14
Timezone: Asia/Shanghai
Goal: `v59-release-publication-evidence-and-next-start-audit`
Acceptance branch: `codex/v59-acceptance-closeout-v60-handoff`
Main before PR-4: `c71da272ba5ea7271948674eb8ca696c6266514a`

## Accepted surfaces

v59 records the external v58 publication state as read-only evidence:

```text
releaseCloseoutHandoffPack.v1
-> tagPublicationEvidence.v1
-> githubReleasePublicationEvidence.v1
-> releasePublicationEvidence.v1
-> nextVersionStartAudit.v1
-> Workbench Release Publication Evidence lane
```

The product path now exposes the v58 tag object SHA, dereferenced commit, GitHub Release URL, draft and prerelease flags, asset list, publication time, target commit check, rollback refs, source refs, blockers, and v59 start audit state. It does not create tags, push tags, create or edit GitHub Releases, declare release-ready, launch providers, run shell commands, append events directly, complete tasks, create worktrees, or create the next version goal.

## Acceptance scenarios

| Scenario | Evidence |
| --- | --- |
| Ready publication evidence pack | `fixtures/contracts/release-publication-evidence/release-publication-evidence.ready.v1.json`; validated by `tests/v59-release-publication-evidence.test.js`. |
| Empty GitHub Release assets are preserved | `release-publication-evidence.empty-assets.v1.json`; the ready Workbench projection renders the asset count as `0 assets`. |
| Missing tag evidence blocks publication evidence | `release-publication-evidence.blocked-missing-tag.v1.json`; `blockedReasons` includes missing tag evidence. |
| Missing GitHub Release evidence blocks publication evidence | `release-publication-evidence.blocked-missing-github-release.v1.json`; `blockedReasons` includes missing GitHub Release evidence. |
| Tag target mismatch blocks publication evidence | `release-publication-evidence.blocked-tag-target-mismatch.v1.json`; `targetCommit.matchesTag` is `false`. |
| Release target mismatch blocks publication evidence | `release-publication-evidence.blocked-release-target-mismatch.v1.json`; `targetCommit.matchesReleaseTarget` is `false`. |
| Draft release blocks publication evidence | `release-publication-evidence.blocked-draft-release.v1.json`; `githubReleaseEvidence.isDraft` is `true`. |
| Prerelease release blocks publication evidence | `release-publication-evidence.blocked-prerelease-release.v1.json`; `githubReleaseEvidence.isPrerelease` is `true`. |
| Unexpected assets block publication evidence | `release-publication-evidence.blocked-unexpected-assets.v1.json`; assets are not accepted as silent success. |
| Local session refs are rejected | `release-publication-evidence.local-session.invalid.v1.json`; validation fails on local session path exposure. |
| Raw transcript refs are rejected | `release-publication-evidence.raw-transcript.invalid.v1.json`; validation fails on raw transcript exposure. |
| Mutation route drift is rejected | `release-publication-evidence.unsafe-mutation.invalid.v1.json`; validation fails on tag, push, publish, release automation, direct event append, task completion, shell, provider launch, worktree creation, or next-goal automation drift. |

## Publication evidence

The ready fixture and projection bind these external v58 facts:

- tag name `v58`;
- tag object SHA `d4046a05f8a5f44e998d2763ea3c11db4487401e`;
- dereferenced commit `7cedfbd8457f78f3f73fc91201a932d780119052`;
- GitHub Release URL `https://github.com/Andy20010101/multi-coding-agent-symphony/releases/tag/v58`;
- GitHub Release state: draft `false`, prerelease `false`, assets `[]`, published at `2026-06-14T02:26:15Z`;
- release `targetCommitish` `main`;
- target commit checks for tag and GitHub Release both `true`;
- next-version start audit points to `docs/plans/v59-runbook-2026-06-14.md` and marks automatic next-goal creation as unavailable.

The evidence is supplied to product code as controller-owned read-model input. Product code validates and projects it; product code does not run `git`, `gh`, shell commands, provider launch commands, or Workbench command execution to collect it.

## Backend projection evidence

`tests/v59-release-publication-backend-projection.test.js` verifies that `goal-supervisor-app-read-model.v1` projects `releasePublicationEvidence.v1` without reading frontend files, provider session folders, local JSONL, raw transcripts, raw model output, or goal ledger internals.

The same suite checks that unsafe source refs are converted into blocked reasons before the Workbench model receives them. The projected model preserves tag evidence, GitHub Release evidence, target commit status, boundary flags, source refs, rollback refs, and next-version audit fields.

## Workbench evidence

`tests/workbench-api-client.test.js` and `tests/workbench-shell.test.js` verify the Desktop App Home lane:

- `#release-publication-evidence-panel` renders after `#release-closeout-handoff-panel` and before `.desktop-app-state-strip`;
- sidebar link `Publication Evidence` targets the panel;
- visible section labels are `Release Publication Evidence`, `Tag Evidence`, `GitHub Release Evidence`, `Target Commit Check`, `Publication Blockers`, `Rollback Refs`, and `Next Version Start Audit`;
- the panel shows `releasePublicationEvidence.v1`, v58 tag object SHA, v58 dereferenced commit, v58 GitHub Release URL, draft `false`, prerelease `false`, `0 assets`, rollback refs, and `v59` runbook refs;
- boundary fields show tag write, remote tag write, release create, release update, provider control, local command control, goal event write, task completion write, worktree automation, and next goal automation as `false`;
- the panel contains no button, form, textarea, clipboard call, browser open call, controlled event confirm call, tag execution label, publish label, GitHub Release create/edit label, shell label, terminal label, transcript label, direct event append label, task completion label, worktree creation label, or next-goal creation label.

## Validation evidence

| Command | Result |
| --- | --- |
| `node --test tests/v59-release-publication-evidence.test.js tests/v58-release-closeout-operator-handoff-pack.test.js` | Passed on PR-4 branch: 12 tests, 0 failures. |
| `node --test tests/workbench-api-client.test.js tests/workbench-shell.test.js tests/workbench-route-smoke.test.js` | Passed on PR-4 branch: 120 tests, 0 failures. The Workbench run can print a non-failing Vite WebSocket warning for port `24678`. |
| `pnpm workbench:build` | Passed on PR-4 branch. |
| `pnpm check` | Passed on PR-4 branch. |
| `git diff --check` | Passed on PR-4 branch after docs were added. |

## Boundary check

v59 does not add product code for `git tag`, `git push`, `gh release create`, `gh release edit`, release publication, release-ready declaration, provider launch, shell execution, terminal UI, arbitrary Workbench command execution, frontend local JSONL reads, provider session folder reads, raw transcript exposure, raw model output exposure, direct goal event append, direct task completion, automatic worktree creation, or automatic next-version goal creation.
