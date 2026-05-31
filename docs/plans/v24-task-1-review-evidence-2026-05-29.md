# v24 task-1 review evidence

## Verdict

APPROVED

Goal id: `v24-main-verification-workbench`  
Task id: `task-1`  
Branch reviewed: `v24-task-1-main-verification-readiness-panel`  
Reviewer role: independent reviewer subagent  
Worker evidence reviewed: `docs/plans/v24-task-1-worker-evidence-2026-05-29.md`

## Reviewed files

- `docs/plans/workbench-v20-v28-goal-runbooks/v24_main-verification-workbench_goal_runbook_latest.md`
- `docs/plans/v24-task-1-worker-evidence-2026-05-29.md`
- `fixtures/contracts/goal-runbook.v24-main-verification-workbench.v1.json`
- `frontend/workbench/src/App.jsx`
- `frontend/workbench/src/api/client.js`
- `frontend/workbench/src/api/contracts.js`
- `frontend/workbench/src/styles/workbench.css`
- `src/symphony/workbench-static/index.html`
- `src/symphony/workbench-static/assets/index-C-y1-j-H.js`
- `src/symphony/workbench-static/assets/index-D00NDVfk.css`
- `tests/workbench-api-client.test.js`
- `tests/workbench-shell.test.js`
- `src/symphony/console.js`
- `tests/v21-goal-plan-preview-api.test.js`

## Review findings

The Workbench user path adds `Main Verification Readiness` immediately after the Active Goal Runbook and Active Goal Task Queue panels and before the Next Action Card. The panel displays `reviewer.approved`, branch/main state, ff-only merge guidance, required verification commands, and the main verification evidence path.

The readiness projection is based on `goal-runbook.v1`, `goal-progress-ledger.v1`, `goal-event-log.v1`, `goal-next-action.v1`, `goal-closeout-report.v1`, and `/api/readiness`. It does not make the v8 `scan/do/review/verify/status/continue/artifacts` surface the Workbench main path.

The panel keeps task-1 as display/copy-only. It exposes merge and gate commands as text, does not run shell commands, does not write evidence, does not register a gate, does not call model APIs, and does not claim release readiness.

Tests cover the user path and evidence boundaries. `tests/workbench-api-client.test.js` checks the explicit `reviewer.approved` path, git readiness, runbook verification commands, evidence path, ff-only merge command, and the negative case where title, branch, and copy-only command text look approval-like but do not enable main verification. `tests/workbench-shell.test.js` checks that the panel is wired into the Workbench shell and remains copy-only without preview/confirm, window open, or clipboard behavior.

The static Workbench build assets are consistent with `pnpm workbench:build`: `index.html` points to `index-C-y1-j-H.js` and `index-D00NDVfk.css`, the old hashed assets are removed, and the built JS contains the readiness panel labels and fields.

## Acceptance assessment

- Shows `reviewer.approved`: passed.
- Shows branch/main state: passed.
- Shows ff-only merge guidance: passed.
- Shows required verification commands from the runbook task: passed.
- Shows main verification evidence path: passed.
- User can tell whether main verification can start: passed through `canEnterMainVerification`, reason text, reviewer state, branch state, and dirty worktree fields.
- Keeps Workbench on latest/v19 goal/runbook/next-action path: passed.
- Does not add a generic safety layer or generic shell runner for task-1: passed.
- Does not infer frontend approval from filenames, branch names, commit messages, prompt text, or command text: passed.
- Does not claim release ready: passed.

## Commands run

### `pnpm check`

Result: exit 0.

```text
> multi-coding-agent-symphony@0.1.0 check /Users/andy/Documents/project/multi-coding-agent-symphony
> node --check src/*.js src/adapters/*.js src/ensemble/*.js src/integrations/*.js src/intake/*.js src/symphony/*.js src/trackers/*.js scripts/*.js plugins/eval-replay/*.js tests/*.test.js
```

### `pnpm test`

Result: exit 0.

```text
ℹ tests 711
ℹ suites 113
ℹ pass 711
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 4143.589084
```

### `pnpm workbench:build`

Result: exit 0.

```text
vite v8.0.14 building client environment for production...
✓ 17 modules transformed.
rendering chunks...
computing gzip size...
src/symphony/workbench-static/index.html                   0.42 kB │ gzip:   0.27 kB
src/symphony/workbench-static/assets/index-D00NDVfk.css   15.41 kB │ gzip:   3.01 kB
src/symphony/workbench-static/assets/index-C-y1-j-H.js   768.56 kB │ gzip: 143.42 kB

✓ built in 151ms
```

The build also printed Node WASI `ExperimentalWarning` messages.

### `git diff --check`

Result: exit 0.

```text
no output
```

## Blockers

None.

## Approval scope

Approved for v24 task-1 review only: the Workbench readiness panel, readiness projection, user-path tests, boundary tests, worker evidence review, and refreshed Workbench static assets.

This approval does not perform main verification, does not merge to `main`, does not register goal events, does not approve later v24 tasks, and does not declare release readiness.
