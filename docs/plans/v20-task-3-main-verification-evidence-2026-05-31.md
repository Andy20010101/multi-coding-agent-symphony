# v20 task-3 main verification evidence

## Outcome

PASSED

## Scope checked

- Goal: `v20-goal-workbench-active-goal-surface`
- Task: `task-3`
- Task title: `Next Action Card and Prompt Preview Drawer`
- Checked branch: `main`
- Checked commit: `a5778f2c9749c0f87fefd0ed52ac9336f8d3f8b3`

## Evidence prerequisites

- Worker evidence exists: `docs/plans/v20-task-3-worker-evidence-2026-05-31.md`
- Reviewer evidence exists: `docs/plans/v20-task-3-review-evidence-2026-05-31.md`
- Reviewer approval confirmation: the review evidence file has `Verdict` set to `APPROVED` and says there are no acceptance-blocking findings.
- Current `pnpm --silent symphony goal-status --goal v20-goal-workbench-active-goal-surface --json` output shows `task-3` with:
  - `status`: `approved`
  - `statusSource`: `goal-event-log.v1:evt_aa472eb6bedd0f55`
  - `workerEvidenceRef`: `docs/plans/v20-task-3-worker-evidence-2026-05-31.md`
  - `reviewEvidenceRef`: `docs/plans/v20-task-3-review-evidence-2026-05-31.md`
  - `reviewVerdict`: `APPROVED`
  - `mainVerificationRef`: `null`

## Current next action contract

`pnpm --silent symphony goal next --goal v20-goal-workbench-active-goal-surface --json` returned `goal-next-action.v1` with:

- `next.taskId`: `task-3`
- `next.role`: `main-verifier`
- `next.phase`: `main-verification`
- `reason`: `Reviewer approved task-3 but main verification is missing.`
- `evidenceState.workerEvidenceRef`: `docs/plans/v20-task-3-worker-evidence-2026-05-31.md`
- `evidenceState.reviewEvidenceRef`: `docs/plans/v20-task-3-review-evidence-2026-05-31.md`
- `evidenceState.mainVerificationRef`: `null`
- `afterCompletion.registerWith`: `symphony goal gate --gate main-verification`
- `afterCompletion.allowedEvents`: `main.verification-passed`, `main.verification-failed`
- `safety.workbenchWriteAvailable`: `false`
- `safety.browserExecutionAvailable`: `false`
- `safety.modelInvocationAvailable`: `false`

## Files and contracts checked

- `frontend/workbench/src/App.jsx`
- `frontend/workbench/src/api/contracts.js`
- `frontend/workbench/src/styles/workbench.css`
- `tests/workbench-api-client.test.js`
- `tests/workbench-shell.test.js`
- `fixtures/contracts/goal-runbook.v20-goal-workbench-active-goal-surface.v1.json`

Checks performed:

- `NextActionCard` renders `contractName`, `goalId`, `reason`, `next.taskId`, `next.role`, `next.phase`, evidence refs, `afterCompletion.registrationCommand`, `afterCompletion.registerWith`, allowed events, copy-only command list, and safety fields.
- `projectGoalNextAction` projects those fields from `goal-next-action.v1`; the unavailable route path stays unavailable instead of deriving next action from task titles, branches, file names, prompt text, or command text.
- `projectAfterCompletion` sets `registrationCommand` from `afterCompletion.registerWith`, so the Workbench display is a direct projection of the next-action contract field.
- `PromptPreviewDrawer` renders as an `aside` and displays only projected prompt text.
- `projectGoalPromptPreview` filters to `copyOnly === true` prompt text, falls back only to the explicit `goal-next-action.v1` copy-only prompt, and maps prompt items to display fields without carrying `registration`, `dryRunCommand`, or `confirmCommand`.
- `tests/workbench-shell.test.js` checks the frontend sources do not include browser action controls, submit/click handlers, clipboard hooks, browser-side confirm/dry-run controls, write methods, or goal registration command paths.
- `tests/workbench-api-client.test.js` checks Next Action and Prompt Preview projection from explicit contracts, including absence of `registration`, `dryRunCommand`, and `confirmCommand` on prompt preview items.

## Worktree state checked

Before this evidence file was written, `git status --short --branch` returned:

```text
## main...origin/main
 M frontend/workbench/index.html
 M frontend/workbench/src/App.jsx
 M frontend/workbench/src/api/contracts.js
 M frontend/workbench/src/styles/workbench.css
 M src/symphony/console.js
 M src/symphony/goal-progress-ledger.js
 D src/symphony/workbench-static/assets/index-D3K9Dk14.css
 D src/symphony/workbench-static/assets/index-Duy8jdh2.js
 M src/symphony/workbench-static/index.html
 M tests/v18-console-events-api.test.js
 M tests/v19-goal-template.test.js
 M tests/workbench-api-client.test.js
 M tests/workbench-route-smoke.test.js
 M tests/workbench-shell.test.js
?? docs/plans/v20-task-1-main-verification-evidence-2026-05-31.md
?? docs/plans/v20-task-1-review-evidence-2026-05-31.md
?? docs/plans/v20-task-1-worker-evidence-2026-05-29.md
?? docs/plans/v20-task-2-main-verification-evidence-2026-05-31.md
?? docs/plans/v20-task-2-review-evidence-2026-05-31.md
?? docs/plans/v20-task-2-review-revision-evidence-2026-05-31.md
?? docs/plans/v20-task-2-worker-evidence-2026-05-31.md
?? docs/plans/v20-task-2-worker-revision-evidence-2026-05-31.md
?? docs/plans/v20-task-3-review-evidence-2026-05-31.md
?? docs/plans/v20-task-3-worker-evidence-2026-05-31.md
?? docs/plans/workbench-v20-v28-goal-runbooks-combined-2026-05-29.md
?? docs/plans/workbench-v20-v28-goal-runbooks/
?? fixtures/contracts/goal-runbook.v20-goal-workbench-active-goal-surface.v1.json
?? src/symphony/workbench-static/assets/index-DGOQN4eH.css
?? src/symphony/workbench-static/assets/index-Df9jkpCb.js
```

The worktree is dirty from existing v20 work and generated Workbench assets. I did not revert or edit those files.

## Required validation commands

### `pnpm check`

Exit code: 0

```text
> multi-coding-agent-symphony@0.1.0 check /Users/andy/Documents/project/multi-coding-agent-symphony
> node --check src/*.js src/adapters/*.js src/ensemble/*.js src/integrations/*.js src/intake/*.js src/symphony/*.js src/trackers/*.js scripts/*.js plugins/eval-replay/*.js tests/*.test.js
```

### `pnpm test`

Exit code: 0

The command emitted the full Node test output. The exact final summary was:

```text
ℹ tests 666
ℹ suites 109
ℹ pass 666
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 4199.068
```

Task-relevant passing tests included:

```text
✔ projects the Next Action card and Prompt Preview drawer from explicit copy-only contracts (0.214ms)
✔ keeps the next action card and prompt drawer display-only (1.660875ms)
```

### `pnpm workbench:build`

Exit code: 0

```text
> multi-coding-agent-symphony@0.1.0 workbench:build /Users/andy/Documents/project/multi-coding-agent-symphony
> vite build --config frontend/workbench/vite.config.js

(node:29088) ExperimentalWarning: WASI is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
(node:29088) ExperimentalWarning: WASI is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
vite v8.0.14 building client environment for production...
(node:29088) ExperimentalWarning: WASI is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
transforming...✓ 17 modules transformed.
rendering chunks...
computing gzip size...
src/symphony/workbench-static/index.html                   0.42 kB │ gzip:   0.27 kB
src/symphony/workbench-static/assets/index-DGOQN4eH.css    8.32 kB │ gzip:   2.17 kB
src/symphony/workbench-static/assets/index-Df9jkpCb.js   645.18 kB │ gzip: 120.45 kB

✓ built in 138ms
```

### `git diff --check`

Exit code: 0

```text
```

No whitespace errors were reported.

## Blockers

None.
