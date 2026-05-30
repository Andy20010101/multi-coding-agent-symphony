# v20 Task 2 Worker Evidence

Date: 2026-05-31
Goal ID: `v20-goal-workbench-active-goal-surface`
Task ID: `task-2`
Task title: Active Goal Runbook panel and task queue

## Summary

Workbench now puts the active goal runbook and task queue at the top of the page. The first workflow panels are `Active Goal Runbook` and `Active Goal Task Queue`, followed by the supporting ActiveGoalViewModel, next action, prompt preview, and closeout panels.

Task queue state is projected from explicit contracts:

- `goal-runbook.v1` provides task order, task id, title, role order, acceptance, and expected evidence.
- `goal-progress-ledger.v1` provides task status, status source, evidence refs, review verdict, main verification ref, blockers, and summary counts.
- `goal-event-log.v1` provides event-backed markers such as latest event id, event type, and event sequence.
- `goal-next-action.v1` provides the current next task, role, phase, and reason.

The queue does not derive task state from branch names, file names, task titles, prompt text, commit messages, or command text.

## Files Changed

- `frontend/workbench/src/api/contracts.js`
- `frontend/workbench/src/App.jsx`
- `frontend/workbench/src/styles/workbench.css`
- `tests/workbench-api-client.test.js`
- `tests/workbench-shell.test.js`
- `src/symphony/workbench-static/index.html`
- `src/symphony/workbench-static/assets/index-rKukkB3g.js`
- `src/symphony/workbench-static/assets/index-heZv0jz2.css`

The Vite rebuild also replaced the prior generated Workbench static asset names. Existing task-1 edits and generated v20 runbook docs were left in place.

## Command Results

### `pnpm check`

Exit code: 0

```text
> multi-coding-agent-symphony@0.1.0 check /Users/andy/Documents/project/multi-coding-agent-symphony
> node --check src/*.js src/adapters/*.js src/ensemble/*.js src/integrations/*.js src/intake/*.js src/symphony/*.js src/trackers/*.js scripts/*.js plugins/eval-replay/*.js tests/*.test.js
```

### `pnpm test`

Exit code: 0

```text
tests 662
suites 109
pass 662
fail 0
cancelled 0
skipped 0
todo 0
duration_ms 3493.414334
```

### `pnpm workbench:build`

Exit code: 0

```text
> multi-coding-agent-symphony@0.1.0 workbench:build /Users/andy/Documents/project/multi-coding-agent-symphony
> vite build --config frontend/workbench/vite.config.js

vite v8.0.14 building client environment for production...
17 modules transformed.
src/symphony/workbench-static/index.html                   0.42 kB | gzip:   0.27 kB
src/symphony/workbench-static/assets/index-heZv0jz2.css    8.24 kB | gzip:   2.14 kB
src/symphony/workbench-static/assets/index-rKukkB3g.js   644.22 kB | gzip: 120.44 kB
built in 137ms
```

The command also printed repeated Node WASI experimental warnings before and during the Vite build.

### `git diff --check`

Exit code: 0

```text

```

## Additional Self-Checks

- `node --test tests/workbench-api-client.test.js`: exit 0. `tests 10`, `pass 10`, `fail 0`.
- `node --test tests/workbench-shell.test.js`: exit 0. `tests 9`, `pass 9`, `fail 0`.
- Browser check at `http://127.0.0.1:8765/workbench/`: page title `v20 Workbench`; first panels were `Active Goal Runbook`, `Active Goal Task Queue`, `ActiveGoalViewModel`, `Next Action Card`, and `Prompt Preview`; `task-2` was visible; browser action/form/link control count was `0`.

## Blockers

None.

## Reviewer Handoff

- Check `projectActiveGoalTaskQueue` and `projectActiveGoalTaskQueueItem` in `frontend/workbench/src/api/contracts.js`.
- Check that `frontend/workbench/src/App.jsx` renders the primary workflow grid before the older summary/readiness/run panels.
- Check `tests/workbench-api-client.test.js` coverage for branch/title/command text that looks terminal while the queue status remains ledger/event-backed.
- This evidence records worker implementation and self-test only. No reviewer approval, main verification, release gate, or goal event registration was performed.
