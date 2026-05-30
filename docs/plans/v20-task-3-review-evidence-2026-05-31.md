# v20 task-3 review evidence

## Findings

No acceptance-blocking findings.

## Validation command results

### `pnpm check`

Exit code: 0

```text
> multi-coding-agent-symphony@0.1.0 check /Users/andy/Documents/project/multi-coding-agent-symphony
> node --check src/*.js src/adapters/*.js src/ensemble/*.js src/integrations/*.js src/intake/*.js src/symphony/*.js src/trackers/*.js scripts/*.js plugins/eval-replay/*.js tests/*.test.js
```

### `pnpm test`

Exit code: 0

```text
> multi-coding-agent-symphony@0.1.0 test /Users/andy/Documents/project/multi-coding-agent-symphony
> node --test --test-concurrency=8

ℹ tests 666
ℹ suites 109
ℹ pass 666
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 3529.38875
```

### `pnpm workbench:build`

Exit code: 0

```text
> multi-coding-agent-symphony@0.1.0 workbench:build /Users/andy/Documents/project/multi-coding-agent-symphony
> vite build --config frontend/workbench/vite.config.js

(node:22852) ExperimentalWarning: WASI is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
(node:22852) ExperimentalWarning: WASI is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
vite v8.0.14 building client environment for production...
(node:22852) ExperimentalWarning: WASI is an experimental feature and might change at any time
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

## Files and contracts inspected

- `docs/plans/v20-task-3-worker-evidence-2026-05-31.md`
- `frontend/workbench/src/App.jsx`
- `frontend/workbench/src/api/contracts.js`
- `frontend/workbench/src/api/client.js`
- `frontend/workbench/src/styles/workbench.css`
- `tests/workbench-api-client.test.js`
- `tests/workbench-shell.test.js`
- `src/symphony/goal-next-action-resolver.js`
- `src/symphony/goal-runbook-contracts.js`
- `fixtures/contracts/goal-runbook.v20-goal-workbench-active-goal-surface.v1.json`
- Current `git diff --stat` and focused diffs for task-3 Workbench files and related tests.

## Acceptance review

`NextActionCard` renders the contract name, next task, role, phase, reason, evidence refs, `afterCompletion.registrationCommand`, `afterCompletion.registerWith`, allowed events, copy-only command list, and safety state. `projectGoalNextAction` projects these values from `goal-next-action.v1`; the unavailable path keeps the panel unavailable instead of deriving next action from task titles, branches, file names, or prompt text.

`PromptPreviewDrawer` renders as an `aside` and shows only prompt text projected by `projectGoalPromptPreview`. The projector filters `goal-prompt-pack.v1` prompts to `copyOnly === true`, falls back only to the explicit `goal-next-action.v1` copy-only prompt, and maps prompt items to display fields without carrying `registration`, `dryRunCommand`, or `confirmCommand` into the Workbench model.

The Workbench client continues to fetch read-only routes with `GET` only. The shell tests assert no browser action controls, write methods, clipboard hooks, browser-side confirm/dry-run controls, model invocation entry points, or frontend event-registration command paths.

## Verdict

APPROVED

## Blockers

None.
