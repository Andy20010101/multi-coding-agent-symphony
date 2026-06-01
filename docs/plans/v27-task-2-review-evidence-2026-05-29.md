# v27 task-2 review evidence

Goal id: `v27-review-revision-loop`
Task id: `task-2`
Branch under review: `v27-task-2-independent-reviewer-handoff`
Worker evidence reviewed: `docs/plans/v27-task-2-worker-evidence-2026-05-29.md`
Review evidence path: `docs/plans/v27-task-2-review-evidence-2026-05-29.md`

## Verdict

APPROVED.

Approval scope is limited to task-2: Independent reviewer handoff. This does not verify main, merge readiness, release readiness, or any later v27 task.

## Reviewed files

- `docs/plans/workbench-v20-v28-goal-runbooks/v27_review-revision-loop_goal_runbook_latest.md`
- `docs/plans/v27-task-2-worker-evidence-2026-05-29.md`
- `frontend/workbench/src/api/client.js`
- `frontend/workbench/src/api/contracts.js`
- `frontend/workbench/src/App.jsx`
- `frontend/workbench/src/styles/workbench.css`
- `src/symphony/console.js`
- `src/symphony/goal-prompt-pack.js`
- `src/symphony/goal-review.js`
- `docs/workbench-operator-guide.md`
- `docs/symphony-product-contracts.md`
- `tests/workbench-api-client.test.js`
- `tests/workbench-shell.test.js`
- `tests/v19-goal-prompt-pack.test.js`
- `src/symphony/workbench-static/index.html`
- `src/symphony/workbench-static/assets/index-CVyMhr1m.css`
- `src/symphony/workbench-static/assets/index-CW0hq1tZ.js`

The built Workbench asset files were reviewed as generated output and verified through `pnpm workbench:build`.

## Independent findings

- Review Workspace now has an explicit reviewer prompt handoff path. The client builds `/api/goals/<goal-id>/prompt?task=<task-id>&role=reviewer` from the active goal and next task, fetches it as `goalReviewerPromptPack`, and passes it into the active goal projection. The projection uses `goal-prompt-pack.v1` prompt data to render reviewer prompt text, validation commands, role guidance, and the review evidence file.
- The handoff is not limited to the next-action role. The test `projects v27 reviewer handoff from an explicit goal prompt route before the next role changes` covers the case where `goal next` still points at the worker phase and Review Workspace still exposes the reviewer prompt and evidence path.
- Reviewer/worker separation is visible in both generated prompt text and Workbench projection. The reviewer prompt says the reviewer id used with `symphony goal review` must differ from the latest worker actor id. Review Workspace exposes `reviewerActorMustDifferFromLatestWorker: true`, `workerCanReviewOwnTask: false`, `workerCanApproveOwnTask: false`, and names the existing `symphony goal review` reviewer-is-not-worker precondition.
- The review evidence path is carried from the reviewer prompt pack `evidenceFile` into `reviewerHandoff.reviewerEvidencePath` and rendered in `ReviewWorkspacePanel` as `reviewer evidence path`.
- The Workbench path stays on the latest/v19 goal workflow: goal runbook, goal next, goal prompt, goal progress/events, closeout, and controlled goal review registration text. I did not find a new top-level v8 `scan/do/review/verify/status/continue/artifacts` action surface.
- I did not find a new generic safety layer, generic shell runner, permission system, goal framework, or artifact framework in task-2 handoff code. The panel remains display-only and does not execute shell commands, start agents, open workspaces, append review events, merge, tag, or claim release state.
- I did not find frontend approval or release readiness inference from filenames, branches, commits, prompt text, or command text. Existing tests still cover branch-looking and filename-looking false positives, and the new review workspace test keeps approval sourced from explicit `goal review` events only.
- Tests cover the user path: route fetch, reviewer prompt projection, evidence path projection, reviewer/worker separation fields, React panel rendering, display-only boundaries, and prompt-pack text.

## Command results

### `pnpm check`

Result: passed, exit `0`.

```text
> multi-coding-agent-symphony@0.1.0 check /Users/andy/Documents/project/multi-coding-agent-symphony
> node --check src/*.js src/adapters/*.js src/ensemble/*.js src/integrations/*.js src/intake/*.js src/symphony/*.js src/trackers/*.js scripts/*.js plugins/eval-replay/*.js tests/*.test.js
```

### `pnpm test`

Result: passed, exit `0`.

```text
> multi-coding-agent-symphony@0.1.0 test /Users/andy/Documents/project/multi-coding-agent-symphony
> node --test --test-concurrency=8

ℹ tests 721
ℹ suites 114
ℹ pass 721
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 6764.067708
```

### `pnpm workbench:build`

Result: passed, exit `0`.

```text
> multi-coding-agent-symphony@0.1.0 workbench:build /Users/andy/Documents/project/multi-coding-agent-symphony
> vite build --config frontend/workbench/vite.config.js

vite v8.0.14 building client environment for production...
transforming...✓ 17 modules transformed.
rendering chunks...
computing gzip size...
src/symphony/workbench-static/index.html                   0.42 kB │ gzip:   0.27 kB
src/symphony/workbench-static/assets/index-CVyMhr1m.css   16.31 kB │ gzip:   3.11 kB
src/symphony/workbench-static/assets/index-CW0hq1tZ.js   809.49 kB │ gzip: 150.41 kB

✓ built in 50ms
```

### `git diff --check`

Result: passed, exit `0`. Command produced no output.

## Boundary notes

- The checkout was on `v27-task-2-independent-reviewer-handoff`.
- The worktree already contained earlier task and prior-version dirty/untracked artifacts. I used the current-checkout review boundary and did not reset, delete, or revert unrelated files.
- Worker evidence was used as an input, not as approval evidence.
- No reviewer verdict event, main verification gate, release gate, merge, tag, or release-ready declaration was registered during this review.

## Blockers

None.
