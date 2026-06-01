# v32 task-3 review evidence

Date: 2026-06-01

Goal id: `v32-release-manager-workspace-v2`
Release: `v32 Release Manager Workspace v2`
Task id: `task-3`
Task title: `Release and tag evidence workspace`
Role: independent reviewer
Verdict: approved

## Evidence inspected

- Runbook task-3 scope in `docs/plans/workbench-v29-v32-goal-runbooks/v32_release-manager-workspace-v2_goal_runbook_latest.md`.
- v32 plan in `docs/plans/v32-release-manager-workspace-v2-plan-2026-06-01.md`.
- Runbook fixture `fixtures/contracts/goal-runbook.v32-release-manager-workspace-v2.v1.json`.
- Worker evidence `docs/plans/v32-task-3-worker-evidence-2026-06-01.md`.
- Current dirty checkout diff and current file contents for the worker-touched areas.
- Generated Workbench static output under `src/symphony/workbench-static/`.
- Read-only managed goal state and event journal entries for `v32-release-manager-workspace-v2`.

## Code, tests, and docs inspected

- `frontend/workbench/src/api/contracts.js`
  - `projectReleaseEvidenceDraft` builds `ReleaseEvidenceDraftWriter` from closeout, baseline, event log, and checklist fields.
  - `projectTagEvidencePrompt` builds `TagEvidenceDraftWriter` with tag recommendation, target commit, release notes summary, latest `release.tag-evidence` refs, and `copyOnlyTagCommand`.
  - Tag command result fields are fixed to `not-run-by-workbench`.
  - Safety fields for both drafts keep evidence writing, shell execution, tag creation, tag push, release publishing, merge, local file open, artifact download, and `release.ready` declaration unavailable from the draft.
- `frontend/workbench/src/App.jsx`
  - Closeout Gaps renders the release baseline resolver, release checklist, release evidence draft, and tag evidence draft.
  - `ReleaseEvidenceDraft` displays release evidence ref, tag evidence ref, target commit, release notes summary, command/result rows, markdown text, and boundary text.
  - `TagEvidencePrompt` displays tag recommendation, target commit, copy-only tag command, latest tag gate refs, release notes summary, command/result fields, and boundary text.
- `tests/workbench-api-client.test.js`
  - Covers v32 release/tag evidence refs, target commit, tag recommendation, copy-only tag command, latest tag evidence ref, `not-run-by-workbench`, and false tag/push/publish safety fields.
  - Covers dirty/non-main baseline blocking `release.ready` registration.
- `tests/workbench-shell.test.js`
  - Covers Closeout Gaps UI wiring for `ReleaseEvidenceDraftWriter`, `TagEvidenceDraftWriter`, `copyOnlyTagCommand`, and absence of browser shell, clipboard, merge, and tag execution handlers in the inspected panel body.
  - Covers Workbench top navigation around active goal, prompt handoff, operations, implementation, adoption, review, verification, release, and closeout rather than the old v8 command list.
- `docs/workbench-operator-guide.md` and `docs/symphony-product-contracts.md`
  - Document v32 release/tag draft sources and boundaries: no evidence file writes, no shell execution, no tag/push/publish, no `release.ready` inference, and no status inference from filenames, branch names, commit messages, prompt text, task titles, frontend state, or release notes text.

## Commands and outcomes

| Command | Exit | Outcome |
| --- | ---: | --- |
| `pnpm check` | 0 | Node syntax check passed for source, scripts, plugins, and tests. |
| `pnpm test` | 0 | Full suite passed: 758 tests, 116 suites, 0 failures. |
| `pnpm workbench:build` | 0 | Vite built `src/symphony/workbench-static/index.html`, `assets/index-BY5UaxlX.css`, and `assets/index-B9blLPKD.js`. |
| `git diff --check` | 0 | No whitespace errors. |
| `pnpm --silent symphony goal-status --goal v32-release-manager-workspace-v2 --json` | 0 | Reported `totalTasks: 5`, `completedTasks: 3`, `blockedTasks: 0`, `releaseReady: false`. Task-3 already showed `status: approved`, `reviewVerdict: APPROVED`, and review evidence ref `docs/plans/v32-task-3-review-evidence-2026-06-01.md`. |
| `pnpm --silent symphony goal next --goal v32-release-manager-workspace-v2 --json` | 0 | Returned task `task-3`, role `main-verifier`, phase `main-verification`, reason `Reviewer approved task-3 but main verification is missing.` |
| `rg -n "evt_0b7b7ea493f72d25\|docs/plans/v32-task-3-review-evidence-2026-06-01.md\|codex-v32-task-3-reviewer\|task-3" .symphony/goals/events/v32-release-manager-workspace-v2.ndjson` | 0 | Found pre-existing event `evt_0b7b7ea493f72d25`: `eventType: reviewer.approved`, actor `v32-task-3-reviewer`, evidence ref `docs/plans/v32-task-3-review-evidence-2026-06-01.md`, recorded at `2026-06-01T12:47:09.010Z`. |
| `git tag --list 'v32*'` | 0 | Returned no tags. |
| `git status --short --branch` | 0 | Checkout remained dirty on `v30-task-3-adoption-inspect-and-recovery-view`. |

## Findings

No product revision is required for task-3.

The Workbench user path for release/tag evidence is visible in Closeout Gaps and covered by source-level shell tests. The release draft shows explicit release evidence ref, tag evidence ref, target commit, target commit source, release notes summary, and per-gate command/result rows. The tag draft shows tag recommendation, target commit, release notes summary, latest `release.tag-evidence` event/ref, the copy-only tag command, and command/result fields marked `not-run-by-workbench`.

The tag command remains copy-only. I found no task-3 path that runs `git tag`, pushes tags, publishes a release, merges, opens local files, downloads artifacts, invokes a model, runs arbitrary shell, self-approves, or declares `release.ready` from the release/tag draft. The existing `release.ready` registration component is outside task-3 scope and remains blocked on the current dirty/non-main fallback baseline; this review does not approve task-4.

State projection comes from explicit backend contracts and command outputs: `goal-closeout-report.v1`, `ReleaseBaselineResolver`, `goal-event-log.v1`, and release checklist fields. The draft code does not infer release readiness or task state from filenames, branch names, tags, commit messages, prompt text, frontend state, tests, or release notes text.

v8 compatibility commands are not the top-level Workbench model. The inspected top navigation is centered on active goal, prompt handoff, operations, implementation, adoption, review, verification, release, and closeout. The header text names the current goal-status, goal next, goal prompt, goal update/review/gate, goal closeout, and scoped operations contracts.

Worker evidence did not claim reviewer approval, main verification, tag creation, push, publish, merge, or release readiness. The managed task-3 worker event and later review event have different actors: worker `v32-task-3-worker`; reviewer `v32-task-3-reviewer`.

## Boundary notes

- I did not run `symphony goal review`, `symphony goal update`, `symphony goal gate`, closeout confirm, tag, push, publish, merge, pull, clean, stash, reset, checkout, stage, or commit.
- The prompt said task-3 reviewer verdict was missing. Read-only goal commands and journal inspection showed a pre-existing task-3 `reviewer.approved` event before this handoff completed. I did not create or modify that managed event.
- The review was performed on the repo-local/current-checkout fallback because the worktree is dirty and on `v30-task-3-adoption-inspect-and-recovery-view`, not the runbook branch `v32-task-3-release-and-tag-evidence-workspace`.
- `pnpm workbench:build` was run because it is a required validation command. It rebuilt the already-dirty generated Workbench static output; no product source edits were made by this reviewer.
- This review does not certify a clean release baseline, task-3 main verification, task-4 `release.ready` closeout confirm, task-5 next-version handoff, tag creation, tag push, or release publication.

## Blockers

None for task-3 implementation.

Process discrepancy for the coordinator: the managed event journal already contains task-3 reviewer approval, so a new review registration may be duplicate or rejected depending on current goal command behavior.
