# v28 task-2 review evidence

Goal id: `v28-workbench-v1-release`
Task id: `task-2`
Task title: `Unified goal/task/run/evidence routes`
Review date: `2026-06-01 Asia/Shanghai`
Reviewer role: independent reviewer subagent

## Verdict

APPROVED

Approval scope: Workbench task-2 route context, navigation query preservation, scoped operations route usage, Prompt Handoff route initialization, and the related tests/static build in the current workspace. This approval does not cover unrelated dirty-worktree changes, main verification, release readiness, or any goal event registration.

## Reviewed Inputs

- Runbook: `docs/plans/workbench-v20-v28-goal-runbooks/v28_workbench-v1-release_goal_runbook_latest.md`
- Worker evidence: `docs/plans/v28-task-2-worker-evidence-2026-05-29.md`
- Workbench app: `frontend/workbench/src/App.jsx`
- Workbench API projection: `frontend/workbench/src/api/contracts.js`
- Workbench API client: `frontend/workbench/src/api/client.js`
- Console API operations route: `src/symphony/console.js`
- Tests: `tests/workbench-api-client.test.js`, `tests/workbench-shell.test.js`, `tests/workbench-route-smoke.test.js`
- Generated static assets: `src/symphony/workbench-static/index.html`, `src/symphony/workbench-static/assets/index-B-SzyFhZ.css`, `src/symphony/workbench-static/assets/index-CDondlJL.js`

## Review Checks

- Active context is projected in `projectWorkbenchContracts` as `routeContext` from active goal control plus latest run projection. The context carries goal id, task id, active role/phase, operation id, run id, and evidence refs. Evidence refs are collected from `goal-next-action.v1`, `ReviewWorkspaceContextModel`, `goal-prompt-pack.v1`, `goal-progress-ledger.v1`, event-form helper refs, and console run refs. The projection states that evidence refs do not imply approval, main verification, or release readiness.
- Scoped operations are fetched from `/api/goals/<goal-id>/operations` after active goal id resolution. The console server rejects query-bearing operations routes and unsafe goal refs, resolves `latest` through the managed goal context, and reads the managed operation registry. I did not find a generic shell runner or permission system added for task-2.
- Workbench renders the state header, navigation, and route context bar before module panels. Navigation entries cover Active Goal, Prompt Handoff, Operations, Implementation, Adoption, Review, Verification, and Closeout. Link generation keeps routes under `/workbench/` or `/workbench/prompts/` and adds `goal`, `task`, `role`, `operation`, `run`, and repeated `evidence` query params.
- Prompt Handoff initializes selected goal/task/role from route query params first and falls back to projected route context. It displays context operation, run, and evidence refs, and still reads prompt/runbook state through controlled goal routes.
- The Workbench top-level copy and navigation remain centered on latest/v19 goal/runbook/next-action flow. The old v8 `scan/do/review/verify/status/continue/artifacts` list is not used as the top-level button model.
- Tests are not limited to isolated projection snapshots. `tests/workbench-shell.test.js` renders the Workbench shell through Vite SSR for `/workbench/` and `/workbench/prompts/?goal=...&task=...&role=reviewer`, checks visible navigation/context, and checks query-preserving links. API projection tests cover route context and operation console projection. Route smoke tests keep section anchors scoped to `/workbench/` and continue checking for forbidden execution entry points.

## Command Results

### `pnpm check`

Exit code: `0`

```text
> multi-coding-agent-symphony@0.1.0 check /Users/andy/Documents/project/multi-coding-agent-symphony
> node --check src/*.js src/adapters/*.js src/ensemble/*.js src/integrations/*.js src/intake/*.js src/symphony/*.js src/trackers/*.js scripts/*.js plugins/eval-replay/*.js tests/*.test.js
```

### `pnpm test`

Exit code: `0`

```text
ℹ tests 732
ℹ suites 115
ℹ pass 732
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 6811.462458
```

### `pnpm workbench:build`

Exit code: `0`

```text
> multi-coding-agent-symphony@0.1.0 workbench:build /Users/andy/Documents/project/multi-coding-agent-symphony
> vite build --config frontend/workbench/vite.config.js

vite v8.0.14 building client environment for production...
transforming...✓ 17 modules transformed.
rendering chunks...
computing gzip size...
src/symphony/workbench-static/index.html                   0.42 kB │ gzip:   0.27 kB
src/symphony/workbench-static/assets/index-B-SzyFhZ.css   19.48 kB │ gzip:   3.54 kB
src/symphony/workbench-static/assets/index-CDondlJL.js   836.17 kB │ gzip: 155.33 kB

✓ built in 51ms
```

### `git diff --check`

Exit code: `0`

```text
No output.
```

## Acceptance Assessment

- PASS: Workbench modules/routes preserve active context across the required sections through the shared route context bar and query-preserving navigation.
- PASS: Context includes goal id, task id, operation id, run id, and evidence refs where available.
- PASS: Route context is derived from goal contracts, operation contracts, event/ledger-derived view models, and console run contracts. I found no task status or approval path that depends on filename, branch name, or commit-message heuristics.
- PASS: latest/v19 goal/runbook/next-action remains the main Workbench model; v8 command names are explicitly not used as top-level navigation.
- PASS: No generic shell runner, broad safety layer, permission system, new goal framework, or artifact framework was introduced for task-2.
- PASS: Tests cover the rendered route/user path, including Workbench home to Prompt Handoff context preservation, not only function snapshots.
- PASS: Boundary fallback is recorded in the worker evidence: the ideal task branch was not checked out, the actual branch was `v27-task-5-review-revision-tests-docs`, and the dirty-checkout fallback was used without switching or resetting.

## Boundary Notes

- I did not modify implementation code.
- I did not register a goal review event, main verification event, gate event, or release-ready event.
- Current branch during review: `v27-task-5-review-revision-tests-docs`.
- The worktree remains dirty with broader v23-v28 changes. This review approves only the task-2 context-routing behavior listed above.
- Evidence refs are surfaced as identifiers. They are not treated as proof of approval, main verification, or release readiness.

## Required Changes

None.
