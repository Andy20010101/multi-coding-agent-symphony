# v19 Task 6 Review Evidence

Date: 2026-05-29
Goal ID: `v19-goal-runbook-next-action`
Task ID: `task-6`
Branch reviewed: `v19-task6-workbench-active-goal`
Base reviewed: `main`
Verdict: APPROVED

## Review Scope

I reviewed the current branch diff against `main`, not only the worker evidence. The branch diff contains the Task 6 Workbench and console API changes plus the worker evidence file:

- `docs/plans/v19-task6-worker-evidence-2026-05-29.md`
- `frontend/workbench/src/App.jsx`
- `frontend/workbench/src/api/client.js`
- `frontend/workbench/src/api/contracts.js`
- `frontend/workbench/src/styles/workbench.css`
- `src/symphony/console.js`
- `src/symphony/workbench-static/index.html`
- `src/symphony/workbench-static/assets/index-D3K9Dk14.css`
- `src/symphony/workbench-static/assets/index-Duy8jdh2.js`
- `tests/workbench-api-client.test.js`
- `tests/workbench-route-smoke.test.js`
- `tests/workbench-shell.test.js`

I also read the required context:

- `docs/plans/v19-goal-runbook-next-action-plan-2026-05-29.md`
- `docs/plans/v19-task6-worker-evidence-2026-05-29.md`
- `docs/workbench-operator-guide.md`
- `tests/workbench-route-smoke.test.js`
- Task 1-5 implementation files:
  - `src/symphony/goal-runbook-contracts.js`
  - `src/symphony/goal-runbook-registry.js`
  - `src/symphony/goal-runbook-context.js`
  - `src/symphony/goal-next-action-resolver.js`
  - `src/symphony/goal-prompt-pack.js`
  - `src/symphony/goal-closeout-report.js`

## Findings

No blocking issues found.

The Task 6 diff matches the v19 plan boundary. `src/symphony/console.js` keeps the server-level method guard before route dispatch, returning `405` for non-GET requests. The new v19 routes only read and return `goal-runbook.v1`, `goal-next-action.v1`, `goal-prompt-pack.v1`, and `goal-closeout-report.v1` outputs. The route parser rejects query parameters, encoded traversal, absolute-looking refs, `file:` probes, and unsafe goal segments.

The Workbench frontend remains display-only. `frontend/workbench/src/api/client.js` uses the existing read-only fetch wrapper with `method: 'GET'`, `cache: 'no-store'`, and no request body. Active goal progress/events routes are derived only from backend `goal-runbook.v1` or `goal-next-action.v1` goal ids.

The Active Goal Control Center panels are read-only:

- Active Goal Runbook displays runbook fields plus task status/evidence fields from active goal ledger/events routes.
- Next Action Card displays resolver output, after-completion metadata, copy-only commands, and safety fields.
- Prompt Preview filters to `copyOnly === true` prompt text and renders it in `<pre><code>`.
- Closeout Gaps displays closeout report summary, missing evidence/gates, release gates, next action text, and safety fields.

Prompt Preview has no execute, confirm, run, button, form, link, click handler, terminal, download, open-local-file, model, or agent entry point. The panel renders text only.

The frontend does not mark tasks `approved`, `main-verified`, or `release-ready` from branch names, filenames, task titles, command text, or prompt text. Task status and evidence refs come from backend ledger/events contracts. Existing Evidence Matrix behavior still uses explicit event types and evidence refs; it does not read evidence document bodies or open refs.

No artifact download, open local file, browser terminal, shell execution, model invocation, event-log write, runbook registry write, merge, tag, or confirm flow was added to the browser surface.

The v16 safe artifact preview, v17 goal progress, and v18 event timeline/evidence matrix paths remain present. The diff adds v19 panels after the v17 goal progress section and before the v18 event panels, without replacing those existing panels. Route smoke still covers safe preview registered refs, non-GET blocking, traversal probes, Workbench fallback boundaries, and static source entrypoint bans.

One non-blocking note: `docs/workbench-operator-guide.md` still describes the v18 Workbench surface and does not list the new v19 Active Goal routes. The v19 plan assigns operator-guide updates to Task 7, so this is not a Task 6 blocker.

## Commands Run

```text
pnpm check
exit 0

> multi-coding-agent-symphony@0.1.0 check /Users/andy/Documents/project/multi-coding-agent-symphony
> node --check src/*.js src/adapters/*.js src/ensemble/*.js src/integrations/*.js src/intake/*.js src/symphony/*.js src/trackers/*.js scripts/*.js plugins/eval-replay/*.js tests/*.test.js
```

```text
pnpm test
exit 0

> multi-coding-agent-symphony@0.1.0 test /Users/andy/Documents/project/multi-coding-agent-symphony
> node --test --test-concurrency=8

Relevant passing suites included:
- v16 Workbench route smoke and server parity
- v15 Workbench read-only API client
- v15 Workbench React/Vite shell
- v16 safe artifact preview contract tests
- v17 read-only console API routes
- v17 goal-progress-ledger.v1 contract fixtures
- v18 read-only goal events API routes
- v18 goal event resolver to goal-progress-ledger.v1
- v19 event-aware goal-next-action.v1 resolver
- v19 goal next, goal closeout, and symphony next CLI
- v19 goal prompt pack generator and CLI
- v19 goal runbook, next action, prompt pack, and closeout contracts
- v19 symphony goal init CLI

Summary:
tests 660
suites 109
pass 660
fail 0
cancelled 0
skipped 0
todo 0
duration_ms 3434.407584
```

```text
pnpm workbench:build
exit 0

> multi-coding-agent-symphony@0.1.0 workbench:build /Users/andy/Documents/project/multi-coding-agent-symphony
> vite build --config frontend/workbench/vite.config.js

(node:1761) ExperimentalWarning: WASI is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
(node:1761) ExperimentalWarning: WASI is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
vite v8.0.14 building client environment for production...
(node:1761) ExperimentalWarning: WASI is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
transforming...
17 modules transformed.
rendering chunks...
computing gzip size...
src/symphony/workbench-static/index.html                   0.42 kB | gzip:   0.27 kB
src/symphony/workbench-static/assets/index-D3K9Dk14.css    7.95 kB | gzip:   2.10 kB
src/symphony/workbench-static/assets/index-Duy8jdh2.js   627.71 kB | gzip: 117.91 kB

built in 133ms
```

```text
git diff --check
exit 0
stdout: <empty>
stderr: <empty>
```

## Reviewed Checks

- Active Goal Runbook, Next Action Card, Prompt Preview, and Closeout Gaps are read-only display surfaces.
- Prompt Preview is copy-only text and has no execute, confirm, run, terminal, model, download, link, form, or button control.
- Frontend display is based on backend contracts and explicit backend ledger/events fields.
- API remains GET-only.
- No artifact download, open local file, browser terminal, shell/model invocation, event write, merge, or tag action was introduced.
- Existing v16 safe artifact preview, v17 progress, and v18 timeline/matrix behavior remains covered and present.

## Blockers

None.
