# v28 task-1 independent re-review evidence

Goal id: `v28-workbench-v1-release`
Task id: `task-1`
Task title: `Workbench app navigation and state header`
Reviewer role: independent reviewer
Latest worker actor under review: `codex-v28-task-1-revision-worker`
Review type: re-review after prior `NEEDS_REVISION`
Verdict: `APPROVED`

## Reviewed inputs

- Runbook: `docs/plans/workbench-v20-v28-goal-runbooks/v28_workbench-v1-release_goal_runbook_latest.md`
- Worker evidence: `docs/plans/v28-task-1-worker-evidence-2026-05-29.md`
- Prior review evidence: `docs/plans/v28-task-1-review-evidence-2026-05-29.md`
- Workbench app shell: `frontend/workbench/src/App.jsx`
- Workbench styles: `frontend/workbench/src/styles/workbench.css`
- Workbench API projection: `frontend/workbench/src/api/client.js`, `frontend/workbench/src/api/contracts.js`
- Workbench tests: `tests/workbench-shell.test.js`, `tests/workbench-route-smoke.test.js`, `tests/workbench-api-client.test.js`
- Generated Workbench static output: `src/symphony/workbench-static/index.html`, `src/symphony/workbench-static/assets/index-CKTfjAD4.js`, `src/symphony/workbench-static/assets/index-SlXwZMej.css`

## Commands run

### `pnpm check`

Exit code: 0

```text
> multi-coding-agent-symphony@0.1.0 check /Users/andy/Documents/project/multi-coding-agent-symphony
> node --check src/*.js src/adapters/*.js src/ensemble/*.js src/integrations/*.js src/intake/*.js src/symphony/*.js src/trackers/*.js scripts/*.js plugins/eval-replay/*.js tests/*.test.js
```

### `pnpm test`

Exit code: 0

```text
ℹ tests 731
ℹ suites 115
ℹ pass 731
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 6756.785917
```

Relevant passing suites included:

```text
✔ v15 Workbench read-only API client (75.914125ms)
✔ v16 Workbench route smoke and server parity (198.047375ms)
✔ v15 Workbench React/Vite shell (194.131667ms)
✔ v15 Workbench static serving (26.830917ms)
```

Relevant task-1 re-review test:

```text
✔ renders the v28 Workbench state header and navigates first-screen user paths (165.599541ms)
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
src/symphony/workbench-static/index.html                   0.42 kB │ gzip:   0.28 kB
src/symphony/workbench-static/assets/index-SlXwZMej.css   18.74 kB │ gzip:   3.47 kB
src/symphony/workbench-static/assets/index-CKTfjAD4.js   824.44 kB │ gzip: 153.29 kB

✓ built in 51ms
```

### `git diff --check`

Exit code: 0

```text
```

## Re-review assessment

The two prior blockers are resolved.

`WorkbenchNavigation` now renders usable scoped links, not inert spans. `WORKBENCH_NAV_ITEMS` defines the required eight sections: Active Goal, Prompt Handoff, Operations, Implementation, Adoption, Review, Verification, Closeout. Prompt Handoff links to `/workbench/prompts/`; the other sections link to known `/workbench/#<panel-id>` anchors. The active item is marked with `aria-current="page"`.

The v28 header is first-screen content. `WorkbenchShell` renders `WorkbenchStateHeader` and `WorkbenchNavigation` immediately after the top header and before the active goal panels. `buildWorkbenchStateHeader` projects goal, task, next action, latest operation, and route readiness from existing active goal, goal-next-action, and goal-operation-runs data.

The route model remains centered on latest/v19 goal workflow. Header copy and navigation note name `goal-status`, `goal next`, `goal prompt`, `goal update/review/gate`, `goal closeout`, and scoped operations contracts. I did not find the old v8 `scan/do/review/verify/status/continue/artifacts` command list used as the Workbench main action model.

The revised tests now render the Workbench shell through Vite SSR. `tests/workbench-shell.test.js` renders `/workbench/` and `/workbench/prompts/`, asserts all eight navigation labels in rendered HTML, checks state header before nav, nav before Active Goal, Active Goal before legacy summary panels, and verifies Prompt Handoff route activation. This addresses the prior source-string-only coverage blocker.

I did not find new frontend inference of task approval or release readiness from file names, branch names, commits, or prompt text in the reviewed task-1 surface. Branch and commit fields appear as displayed inputs/context for controlled event forms or readiness guidance, while approval/main/release state remains tied to explicit goal events, ledger fields, and closeout contracts.

I did not find a new generic shell runner, browser execution channel, permission system, generic safety framework, goal framework, or artifact framework added by the task-1 Workbench navigation/header changes. The allowed write path remains the existing controlled goal event dry-run/plan-hash confirm flow.

## Boundary notes

- Current checkout while reviewing: `v27-task-5-review-revision-tests-docs`.
- The worktree is dirty and contains broader v23-v28 changes. I reviewed task-1 acceptance against the current diff and worker evidence, but this approval is limited to v28 task-1 navigation/header scope.
- I did not modify implementation code.
- I did not approve my own work.
- I did not register a goal review event.
- This review does not claim main verification, release readiness, merge readiness, or tag readiness.

## Approval scope

Approved for v28 task-1 acceptance only: Workbench app navigation and state header, including the prior navigation and user-path test blockers.

## Verdict

`APPROVED`
