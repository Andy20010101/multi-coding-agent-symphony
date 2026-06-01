# v27 task-1 review evidence

Goal id: `v27-review-revision-loop`
Task id: `task-1`
Branch reviewed: `v27-task-1-review-workspace-for-active-task`
Review evidence path: `docs/plans/v27-task-1-review-evidence-2026-05-29.md`
Verdict: `APPROVED`

## Reviewed scope

- Runbook: `docs/plans/workbench-v20-v28-goal-runbooks/v27_review-revision-loop_goal_runbook_latest.md`
- Worker evidence: `docs/plans/v27-task-1-worker-evidence-2026-05-29.md`
- Workbench frontend: `frontend/workbench/src/App.jsx`, `frontend/workbench/src/api/client.js`, `frontend/workbench/src/api/contracts.js`, `frontend/workbench/src/styles/workbench.css`
- Console/API support touched in this checkout: `src/symphony/console.js`, `src/symphony/contract.js`, `src/symphony/goal-operation-run-registry.js`
- Docs: `docs/workbench-operator-guide.md`, `docs/symphony-product-contracts.md`
- Tests: `tests/workbench-api-client.test.js`, `tests/workbench-shell.test.js`, `tests/v21-goal-plan-preview-api.test.js`, `tests/symphony-cli.test.js`
- v27 fixture: `fixtures/contracts/goal-runbook.v27-review-revision-loop.v1.json`
- Built Workbench output: `src/symphony/workbench-static/index.html`, `src/symphony/workbench-static/assets/index-CVyMhr1m.css`, `src/symphony/workbench-static/assets/index-DG1Wr-LV.js`

The current worktree also contains untracked v23, v24, v25, and v26 evidence/fixture/test files. I did not revert them. I reviewed the files that the current checkout depends on and kept this approval limited to v27 task-1.

## Independent findings

- The Workbench active goal path exposes a `Review Workspace` panel in the v20/v19 goal workflow, after the next action and prompt preview area. It does not replace the Workbench primary path with the old v8 `scan/do/review/verify/status/continue/artifacts` command list.
- The panel displays the task-1 review context required by the runbook: changed files, source run fields, worker evidence ref, reviewer prompt, review checklist, and expected verdict event. A live Workbench check at `http://127.0.0.1:9876/workbench/` found `#review-workspace-panel` rendered with all six required sections.
- The live panel included `docs/plans/v27-task-1-worker-evidence-2026-05-29.md`, reviewer prompt text, `reviewer.approved`, `reviewer.needs-revision`, and a display-only `symphony goal review ... --dry-run --json` command.
- The Review Workspace panel body does not include `GoalEventPlanPreview`, confirm controls, shell execution, workspace open, clipboard action, merge, tag, or model/subagent launch paths. The expected verdict is displayed as terminal dry-run text, not as frontend approval.
- Frontend status and readiness remain contract-backed. The Review Workspace shows unsupported inference sources as `file-name`, `branch`, `commit-message`, and `frontend-heuristic`, and it does not mark task approval, main verification, or release readiness from filenames, branch names, commit messages, copied commands, or frontend state.
- Tests cover the Workbench-facing path at the level used by this repo: `tests/workbench-api-client.test.js` projects an active reviewer task with changed files, source run, worker evidence, reviewer prompt, checklist, and expected verdict events; `tests/workbench-shell.test.js` verifies the visible Review Workspace panel wiring and display-only constraints. This is more than a helper-only test, and the live Workbench smoke check confirmed the rendered path.
- No generic safety layer, generic shell runner, permission system, new goal framework, or artifact framework was added for v27 task-1. The operation registry files in the current checkout are v23-scoped Workbench operation tracking, not a task approval or shell execution path.

## Commands run

### `pnpm check`

Result: exit code `0`.

```text
> multi-coding-agent-symphony@0.1.0 check /Users/andy/Documents/project/multi-coding-agent-symphony
> node --check src/*.js src/adapters/*.js src/ensemble/*.js src/integrations/*.js src/intake/*.js src/symphony/*.js src/trackers/*.js scripts/*.js plugins/eval-replay/*.js tests/*.test.js
```

### `pnpm test`

Result: exit code `0`.

```text
ℹ tests 720
ℹ suites 114
ℹ pass 720
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 4425.788458
```

### `pnpm workbench:build`

Result: exit code `0`.

```text
> multi-coding-agent-symphony@0.1.0 workbench:build /Users/andy/Documents/project/multi-coding-agent-symphony
> vite build --config frontend/workbench/vite.config.js

vite v8.0.14 building client environment for production...
transforming...✓ 17 modules transformed.
rendering chunks...
computing gzip size...
src/symphony/workbench-static/index.html                   0.42 kB │ gzip:   0.27 kB
src/symphony/workbench-static/assets/index-CVyMhr1m.css   16.31 kB │ gzip:   3.11 kB
src/symphony/workbench-static/assets/index-DG1Wr-LV.js   803.76 kB │ gzip: 149.47 kB

✓ built in 54ms
```

### `git diff --check`

Result: exit code `0`.

```text
<no output>
```

## Additional UI evidence

Started the local console with:

```text
pnpm --silent symphony console --host 127.0.0.1 --port 9876 --json
```

Result: server reported `status: "listening"` and `url: "http://127.0.0.1:9876/"`.

Browser check for `http://127.0.0.1:9876/workbench/`:

```json
{
  "panelPresent": true,
  "labelsVisible": {
    "source run": true,
    "changed files": true,
    "worker evidence": true,
    "review prompt": true,
    "review checklist": true,
    "expected verdict event": true
  },
  "hasWorkerEvidenceRef": true,
  "hasPromptText": true,
  "hasReviewerApproved": true,
  "hasReviewerNeedsRevision": true,
  "hasSafetyNoInference": true,
  "hasNoBrowserConfirm": true
}
```

## Approval scope

Approved for v27 task-1 only: Workbench now exposes the active task review context needed by an independent reviewer, through the latest goal/runbook/next-action Workbench path. This approval does not verify main, declare release readiness, approve unrelated prior-version files, or register a reviewer event.

## Blockers

No blockers for v27 task-1.
