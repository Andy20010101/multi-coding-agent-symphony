# v20 task-3 worker evidence

## Summary

Implemented the task-3 Workbench surface for `Next Action Card and Prompt Preview Drawer`.

- `Next Action Card` now displays `afterCompletion.registrationCommand` as a direct projection of `goal-next-action.v1` `afterCompletion.registerWith`, alongside next task, role, reason, evidence refs, allowed events, copy-only commands, and safety fields.
- `Prompt Preview Drawer` renders as an `aside` drawer-style read-only surface and only displays copy-only prompt text from `goal-prompt-pack.v1` or the explicit `goal-next-action.v1` copy-only prompt fallback.
- The drawer exposes no browser action controls. Tests check there are no buttons, forms, write methods, clipboard hooks, dry-run/confirm command controls, model invocation controls, or browser-side event registration paths.

## Files changed

- `frontend/workbench/src/App.jsx`
- `frontend/workbench/src/api/contracts.js`
- `frontend/workbench/src/styles/workbench.css`
- `tests/workbench-api-client.test.js`
- `tests/workbench-shell.test.js`
- `src/symphony/workbench-static/index.html`
- `src/symphony/workbench-static/assets/index-DGOQN4eH.css`
- `src/symphony/workbench-static/assets/index-Df9jkpCb.js`

The Workbench build regenerated the static asset hashes. The workspace already contained task-1/task-2 changes and generated Workbench assets before this task; those were not reverted.

## Command results

### `pnpm check`

Exit code: 0

```text
> multi-coding-agent-symphony@0.1.0 check /Users/andy/Documents/project/multi-coding-agent-symphony
> node --check src/*.js src/adapters/*.js src/ensemble/*.js src/integrations/*.js src/intake/*.js src/symphony/*.js src/trackers/*.js scripts/*.js plugins/eval-replay/*.js tests/*.test.js
```

### `pnpm test`

Exit code: 0

```text
ℹ tests 666
ℹ suites 109
ℹ pass 666
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 4694.383916
```

Focused Workbench tests also passed before the full suite:

```text
tests 22
suites 3
pass 22
fail 0
```

### `pnpm workbench:build`

Exit code: 0

```text
> multi-coding-agent-symphony@0.1.0 workbench:build /Users/andy/Documents/project/multi-coding-agent-symphony
> vite build --config frontend/workbench/vite.config.js

vite v8.0.14 building client environment for production...
transforming...✓ 17 modules transformed.
rendering chunks...
computing gzip size...
src/symphony/workbench-static/index.html                   0.42 kB │ gzip:   0.27 kB
src/symphony/workbench-static/assets/index-DGOQN4eH.css    8.32 kB │ gzip:   2.17 kB
src/symphony/workbench-static/assets/index-Df9jkpCb.js   645.18 kB │ gzip: 120.45 kB

✓ built in 139ms
```

The command also printed Node WASI experimental warnings. They did not fail the build.

### `git diff --check`

Exit code: 0

```text
```

No whitespace errors were reported.

## Browser self-check

Opened the rebuilt local Workbench at `http://127.0.0.1:8873/workbench/`.

- Document title: `v20 Workbench`
- `Next Action Card` present: yes
- `next.taskId`: `task-3`
- `next.role`: `worker`
- `reason`: `No explicit worker evidence is recorded for task-3.`
- `afterCompletion.registrationCommand`: `symphony goal update`
- `Prompt Preview Drawer` present: yes
- Prompt drawer element tag: `ASIDE`
- Prompt preview safety showed `workbenchWriteAvailable=false`, `browserExecutionAvailable=false`, and `modelInvocationAvailable=false`
- Browser action controls found with selector `button, form, input, select, textarea, a[href], [role="button"]`: `0`

## Blockers

No task-3 blockers.

## Reviewer handoff

Review the task-3 changes only. Confirm that the next-action fields are sourced from `goal-next-action.v1`, and that the prompt drawer remains copy-only with no browser-side execution, model invocation, event registration, or confirm/write controls.
