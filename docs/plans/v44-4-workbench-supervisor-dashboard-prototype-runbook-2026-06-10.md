# v44.4 Workbench Supervisor Dashboard Prototype Runbook

Date: 2026-06-10
Timezone: Asia/Shanghai
Goal id draft: `v44-4-workbench-supervisor-dashboard-prototype`
Branch: `codex/v44-4-supervisor-dashboard-runbook`
Baseline checked: `v44.3` / `origin/main` at `55c01b8a5faa3ce67388adb12d481f93250dcd63`

## Scope

v44.4 builds a read-only Workbench supervisor dashboard prototype on top of the v44.3 app read model. It is an information architecture and component boundary phase before v45.

The prototype reads `goal-supervisor-app-read-model.v1` from the existing Workbench API route:

```text
GET /api/goals/latest/supervisor
GET /api/goals/<goal-id>/supervisor
```

It must not expand the supervisor kernel, change orchestration ownership, or add command execution. The only runtime surface it may consume is the v44.3 read model and normal Workbench route state metadata.

This PR-0 adds the runbook only. It does not implement UI, fixtures, API client changes, tests, static assets, or release evidence.

## Baseline

v44.3 is complete on `main` and tagged `v44.3`.

Current state checked for this runbook:

- `git status --short --branch`: clean worktree after branch creation.
- `HEAD`: `55c01b8a5faa3ce67388adb12d481f93250dcd63`.
- `v44.3^{}`: `55c01b8a5faa3ce67388adb12d481f93250dcd63`.
- v44.3 closeout: `docs/plans/v44-3-app-contract-context-supervisor-closeout-snapshot-2026-06-10.md`.
- v44.3 runbook: `docs/plans/v44-3-app-contract-context-supervisor-runbook-2026-06-10.md`.

v44.3 delivered:

- `src/symphony/goal-supervisor/app-read-model.js`
- `src/symphony/goal-supervisor/app-read-model-pipeline.js`
- `src/symphony/goal-supervisor/session-context.js`
- `src/symphony/goal-supervisor/policy.js`
- `GET /api/goals/latest/supervisor`
- `GET /api/goals/<goal-id>/supervisor`
- `pnpm --silent symphony supervisor status --goal <goal-id|latest> --json`
- Workbench route allowlist entries in `frontend/workbench/src/api/contracts.js`
- Workbench static bundle sync under `src/symphony/workbench-static/`

v44.3 explicitly did not add a Workbench supervisor panel.

## Workbench Entry Points

The implementation PRs should keep the Workbench shape already in place:

- `frontend/workbench/src/App.jsx` owns route selection through `currentWorkbenchRoute()`.
- Current routes are `/workbench/`, `/workbench/prompts/`, and `/workbench/desktop/`.
- `WORKBENCH_NAV_ITEMS` defines the home route anchor navigation and the route links.
- `frontend/workbench/src/api/client.js` fetches allowlisted JSON with `fetchReadonlyRoute()`.
- `frontend/workbench/src/api/contracts.js` defines read-only route descriptors, route state projection, and panel view models.
- `tests/workbench-api-client.test.js` asserts the read-only API allowlist and supervisor route contract.
- `tests/workbench-shell.test.js` asserts Workbench route and source-level UI boundaries.
- `pnpm workbench:build` writes generated assets into `src/symphony/workbench-static/`.

The preferred route for the prototype is `/workbench/supervisor/`. If the implementation chooses a home-route section instead, it must explain why a separate route would make browser QA or navigation worse. A separate route is easier to test because it keeps the supervisor dashboard first-screen without rearranging the existing active-goal home path.

The route should be registered by adding a Workbench nav item such as:

```text
{ id: 'supervisor', label: 'Supervisor', route: '/workbench/supervisor/' }
```

Route detection must remain a small pathname check in `currentWorkbenchRoute()`. Do not introduce a router dependency for this phase.

## Data Boundary

The dashboard reads one supervisor model:

```text
results.goalSupervisor.data
  -> projectSupervisorDashboard(...)
  -> model.supervisorDashboard
  -> SupervisorDashboard
```

The frontend must not rebuild supervisor state by reading lower-level sources. It may show source contract names and evidence refs already present in the read model, but evidence refs stay identifiers.

Do not read these sources from the frontend or from new Workbench helper code:

- `.symphony/goals/**`
- goal ledger files
- goal event log files
- runner state files
- app thread transport files
- `~/.codex/sessions/**`
- `~/.claude/projects/**`
- provider JSONL

Do not call the CLI from the frontend, tests, or prototype fixtures. The CLI mirror exists for operator inspection, not as a Workbench data source.

## First Screen

The user-provided sketch is the layout contract for v44.4 IA. It is not a final visual design. The implementation should treat `Supervisor Command Center` as a working title for the route, not as a marketing hero. Workbench is an operating surface, so the first screen should be compact, scannable, and closer to a status console than a landing page.

Baseline layout:

```text
┌──────────────────────────────────────────────────────────────┐
│ Supervisor Command Center                                    │
│ goal id / generated at / readOnly / willMutate                │
├───────────────────────────────┬──────────────────────────────┤
│ Goal Snapshot                 │ Recommended Next Action       │
│ - title                       │ - action id                   │
│ - completed / total           │ - label                       │
│ - active task                 │ - reason                      │
│ - active role                 │ - target role/task            │
│ - release readiness           │ - checkpoint / wait / block   │
├───────────────────────────────┼──────────────────────────────┤
│ Active Lease                  │ Context Status                │
│ - lease id                    │ - provider summaries          │
│ - thread id                   │ - transcript availability     │
│ - status / phase              │ - latest tool call            │
│ - duplicate dispatch guard    │ - context utilization         │
├───────────────────────────────┼──────────────────────────────┤
│ Pending Result                │ Command Boundary              │
│ - status                      │ - disabled/dry-run/confirm    │
│ - evidence ref                │ - copyOnly                    │
│ - event to register           │ - blocked command families    │
│ - parser reason               │ - safe command preview        │
├───────────────────────────────┴──────────────────────────────┤
│ Goal Timeline                                                  │
│ event id / task / role / status / evidence ref / hash state    │
└──────────────────────────────────────────────────────────────┘
```

The first viewport should answer these questions without scrolling on desktop:

- Which goal and task is the supervisor describing?
- Is the goal release-ready, blocked, waiting, checkpointing, or still running?
- Who owns orchestration and what PR owns delivery?
- Is there a healthy active lease, a pending result, or a blocking gate?
- What is the recommended next action, and why is execution unavailable from Workbench?
- Are session context and token information present, stale, missing, or near limit?

Recommended first-screen layout:

```text
SupervisorDashboard
  top status bar: goal id, task, role, generatedAt, readOnly/willMutate
  row 1: GoalSnapshotSummary, RecommendedNextActionCard
  row 2: ActiveLeasePanel, ContextStatusPanel
  row 3: PendingResultPanel, CommandBoundaryPanel
  row 4: GoalTimeline
  secondary status: CurrentGateCard and OwnershipPanel, either as compact rows inside the above cards or as the next visible band below the timeline on desktop
```

Panel priority:

1. `GoalSnapshotSummary`: goal id, title, active task, active role, completed/total task count, blocker count, release readiness, source contracts, generated timestamp.
2. `RecommendedNextActionCard`: action id, label, reason, target role/task, checkpoint/wait/block state, safe command preview only when the read model marks it copy-only.
3. `ActiveLeasePanel`: lease id, thread id, task, role, phase, status, started/updated timestamps, age, duplicate-dispatch guard.
4. `ContextStatusPanel`: providers, transcript availability, exchange count, latest turn/tool call, token usage, context utilization, stale/missing transcript state, drift markers.
5. `PendingResultPanel`: status, source, event to register, evidence ref, parser reason, stale/missing markers.
6. `CommandBoundaryPanel`: boundary state, execution availability, copy-only flag, allowed command families, blocked command families, required confirmation fields.
7. `GoalTimeline`: ordered task and gate events, event ids, task ids, roles, statuses, evidence refs, hash-chain state if exposed.
8. `CurrentGateCard`: gate id, status, required command family, blocking reason, evidence requirement, closeout authorization state.
9. `OwnershipPanel`: orchestration owner, delivery boundary, active PR, branch, rollback boundary, daemon state, controller intervention reason.

On mobile, stack the same IA order vertically:

```text
Header
GoalSnapshotSummary
RecommendedNextActionCard
ActiveLeasePanel
ContextStatusPanel
PendingResultPanel
CommandBoundaryPanel
GoalTimeline
CurrentGateCard
OwnershipPanel
```

No mobile panel should rely on a two-column table that forces horizontal scrolling. Long command-family lists should wrap or use compact rows.

## Component Boundaries

The UI should use these component names so later PRs can divide review cleanly:

| Component | Input | Responsibility |
| --- | --- | --- |
| `SupervisorDashboard` | projected dashboard model, route state, refresh handler | Page layout, loading/empty/failed states, and route-level grouping. |
| `GoalSnapshotSummary` | `goalSnapshot` | Summarizes goal/task/release/blocker/source state without recalculating from ledger or events. |
| `CurrentGateCard` | `currentGate` | Shows current gate status and why it blocks or allows progress. |
| `RecommendedNextActionCard` | `recommendedNextAction`, `commandBoundary` | Shows the next action and copy-only preview state. It does not run commands. |
| `ActiveLeasePanel` | `activeLease`, `contextStatus` | Shows active child status and transcript freshness. It does not dispatch or repair leases. |
| `PendingResultPanel` | `pendingResult` | Shows pending, missing, invalid, unavailable, and consumed states. It does not register events. |
| `GoalTimeline` | `goalTimeline` | Renders task/gate events in order with evidence refs as text. It does not fetch evidence files. |
| `ContextStatusPanel` | `contextStatus` | Shows provider/session/token/stale/missing/drift information. It does not read transcript files. |
| `OwnershipPanel` | `ownership` | Shows daemon/controller/PR/rollback ownership. It does not start or stop the daemon. |
| `CommandBoundaryPanel` | `commandBoundary` | Shows disabled, dry-run, or confirm-required boundaries. It does not execute commands or create confirmations. |

Projection helpers may live in `frontend/workbench/src/api/contracts.js` for the prototype if that matches the current Workbench pattern. If the implementation extracts dashboard-specific helpers, keep the file under `frontend/workbench/src/api/` and update tests at the same boundary.

## Fixture and Mock Scenarios

PR-1 should build fixture-driven UI before wiring the live route deeper into the shell. The fixtures can live under `frontend/workbench/src/fixtures/` or `fixtures/contracts/goal-supervisor/` if tests reuse backend replay data. Pick one location and document it in the PR.

Required scenarios:

| Scenario | Required visible state |
| --- | --- |
| `release-ready` | Goal snapshot shows release readiness from the read model, no blocker count, command boundary still prevents tag/publish/GitHub Release. |
| `healthy active lease` | Active lease is recent, transcript is readable, recommended action is `continue` or `wait`, duplicate-dispatch guard is visible. |
| `pending result` | Pending result shows event to register, evidence ref, parser status, and checkpoint recommendation. No register button. |
| `stale transcript` | Context status marks stale transcript, active lease shows last update age, recommended action explains checkpoint/recover/open handoff. |
| `blocked gate` | Current gate shows blocking reason and required evidence or confirmation fields. Release closeout remains blocked unless authorized by the read model. |
| `missing/empty context` | Context status shows missing transcript or empty provider summary without inferring failure or success. Empty copy names the missing contract field. |

Fixture assertions should check text that operators need, not CSS implementation details. Use source-level tests only for hard boundaries such as no event registration, no CLI execution, no daemon controls, and no direct JSONL paths.

## PR Order

Keep v44.4 to six PRs.

### PR-0 runbook

This PR. It adds only:

- `docs/plans/v44-4-workbench-supervisor-dashboard-prototype-runbook-2026-06-10.md`

Validation:

- `git diff --check`

Do not run mutation, audit, provider CLI, real CLI, daemon, or release commands.

### PR-1 fixture-driven UI prototype

Purpose: build `SupervisorDashboard` and the required component shells from fixtures or mocked projected data, using the sketch in this runbook as the IA baseline.

Allowed areas:

- `frontend/workbench/src/App.jsx`
- `frontend/workbench/src/styles/workbench.css`
- optional fixture files under `frontend/workbench/src/fixtures/` or `fixtures/contracts/goal-supervisor/`
- focused Workbench tests

Required checks:

- `node --test tests/workbench-shell.test.js`
- `git diff --check`

Acceptance:

- the page shows `Supervisor Command Center` or an equally direct operating title without hero-style marketing copy;
- the first desktop viewport follows the two-column IA: Goal Snapshot / Recommended Next Action, Active Lease / Context Status, Pending Result / Command Boundary, then Goal Timeline;
- fixture states cover release-ready, healthy active lease, pending result, stale transcript, blocked gate, and missing/empty context;
- mobile stacks the same panel order vertically;
- command boundary is visible in the first screen for every fixture, even before it is fully bound to live data;
- there are no buttons or controls for event registration, child dispatch, daemon start/stop, provider CLI, real CLI, tag, publish, or GitHub Release.

Do not fetch the live supervisor route in this PR beyond existing Workbench startup reads. Do not claim final visual polish; this PR validates the layout contract and empty/state copy.

### PR-2 route and API client

Purpose: add `/workbench/supervisor/` route/nav and project `goalSupervisor` into `model.supervisorDashboard`.

Allowed areas:

- `frontend/workbench/src/App.jsx`
- `frontend/workbench/src/api/client.js`
- `frontend/workbench/src/api/contracts.js`
- `tests/workbench-api-client.test.js`
- `tests/workbench-shell.test.js`

Required checks:

- `node --test tests/workbench-api-client.test.js tests/workbench-shell.test.js`
- `git diff --check`

The API client must continue to use `fetchReadonlyRoute()`. Do not add a bespoke fetch path, POST route, CLI bridge, or local file reader.

### PR-3 core panels

Purpose: bind the upper supervisor status components from the live read model while preserving the PR-1 IA.

Components:

- `GoalSnapshotSummary`
- `RecommendedNextActionCard`
- `ActiveLeasePanel`
- `PendingResultPanel`
- `CurrentGateCard` as a compact gate status surface if gate state is needed to explain block/release readiness before PR-4

Required checks:

- focused React/source tests for release-ready, active lease, pending result, stale transcript, blocked gate, and empty context
- `pnpm check`
- `pnpm workbench:build`
- `git diff --check`

Browser QA:

- desktop viewport on `/workbench/supervisor/`
- mobile viewport on `/workbench/supervisor/`
- confirm the Goal Snapshot / Recommended Next Action and Active Lease / Pending Result surfaces render without overlap
- confirm command-boundary placeholder or projected summary remains visible until PR-4 binds the full panel

### PR-4 timeline, context, ownership, and command boundary

Purpose: bind the remaining dashboard panels that complete the sketch and the ownership boundary.

Components:

- `GoalTimeline`
- `ContextStatusPanel`
- `OwnershipPanel`
- `CommandBoundaryPanel`

Required checks:

- focused tests for context/token state, stale transcript, missing transcript, ownership, and blocked command families
- `pnpm check`
- `pnpm workbench:build`
- `git diff --check`

Browser QA:

- desktop and mobile scroll path from first screen to timeline
- blocked command families visible without requiring horizontal scroll
- evidence refs render as text, not clickable local file opens
- ownership is visible close enough to the first screen that an operator can tell daemon/controller/PR responsibility before taking action

### PR-5 visual QA, empty/stale/blocked states, and closeout snapshot

Purpose: finish the prototype with visual QA records and a v44.4 closeout snapshot.

Allowed areas:

- Workbench UI files touched by PR-1 through PR-4
- `src/symphony/workbench-static/` generated by `pnpm workbench:build`
- `docs/plans/v44-4-workbench-supervisor-dashboard-prototype-closeout-snapshot-2026-06-10.md`

Required checks:

- focused Workbench tests
- `pnpm check`
- `pnpm workbench:build`
- browser desktop visual QA
- browser mobile visual QA
- `git diff --check`

The closeout snapshot should record merged PRs, route, component coverage, fixture scenarios, QA commands, known risks, and rollback path. It must not tag, publish, create a GitHub Release, or declare v45 scope complete.

## QA Policy

Use focused checks while the dashboard is being built:

```text
node --test tests/workbench-api-client.test.js
node --test tests/workbench-shell.test.js
pnpm check
pnpm workbench:build
git diff --check
```

Use browser visual QA after UI appears:

- open the route served by the local Workbench build;
- check desktop viewport;
- check mobile viewport;
- capture or record the route, viewport, scenario, and result in the PR evidence;
- verify no text overlap, no blank first screen, no inaccessible command boundary, and no stale/blocked state hidden below unrelated panels.
- compare the page against the IA sketch in this runbook and record any intentional deviation with the reason.

Do not run these commands in v44.4 unless a later runbook explicitly authorizes them:

- `pnpm test:mutation:gate`
- audit commands
- provider CLI
- real CLI
- daemon start/stop
- child dispatch
- tag, publish, GitHub Release, or release closeout commands

## Forbidden Changes

v44.4 Workbench prototype PRs must not:

- register goal events;
- dispatch child threads;
- start or stop the daemon;
- repair active leases;
- consume or mutate pending result escrow;
- write goal ledger or event log files;
- directly read ledger, event log, runner state, app thread files, or provider JSONL;
- call provider CLI or real CLI;
- add a generic shell runner;
- infer approval, main verification, release readiness, or task completion from branch names, filenames, prompt text, task titles, or frontend state;
- add tag, push tag, publish, GitHub Release, or release closeout UI;
- add mutation/audit/provider checks to docs-only PRs.

Copy-only command previews may render only when the v44.3 read model includes them and `commandBoundary.copyOnly` is true. A visible preview is not an execution affordance.

## Stop Conditions

Stop the PR and write a short status note if any of these happen:

- the supervisor API route returns a contract other than `goal-supervisor-app-read-model.v1`;
- the route is missing required top-level objects and fixtures cannot represent the gap cleanly;
- UI work needs direct reads from ledger, event log, runner state, transcript JSONL, or local files;
- implementation needs a supervisor kernel change to make the page useful;
- a panel would need to register an event, run a command, dispatch a child, or alter daemon state;
- `pnpm workbench:build` changes unrelated static assets that cannot be explained by the Workbench source diff;
- browser QA shows first-screen overlap or hidden blocker/command-boundary state and the PR is already too broad to fix safely;
- CI path policy runs mutation/audit/provider/real CLI checks for docs-only or prototype-only work without explicit approval.

## Rollback Path

Rollback is per PR.

- PR-0: revert this runbook file.
- PR-1: remove fixture-only dashboard components and fixtures. No backend rollback should be needed.
- PR-2: remove `/workbench/supervisor/` route/nav and `model.supervisorDashboard` projection. Keep v44.3 backend routes intact.
- PR-3: remove core panels and related tests. Keep the route if PR-2 remains useful with fixture/empty state.
- PR-4: remove timeline/context/ownership/command-boundary panels and related tests.
- PR-5: revert the closeout snapshot and generated static bundle if the bundle only contains v44.4 dashboard output.

If live supervisor data causes Workbench failures, the frontend fallback should show the route state as `missing`, `unavailable`, or `failed` and keep the rest of Workbench usable. Do not roll back v44.3 backend contract code unless the API itself regresses outside the dashboard route.

## PR-0 Validation Record

Commands run for this document:

```text
git status --short --branch
git branch --show-current
git rev-parse HEAD
git rev-parse v44.3^{}
sed -n '1,240p' docs/plans/v44-3-app-contract-context-supervisor-runbook-2026-06-10.md
sed -n '1,260p' docs/plans/v44-3-app-contract-context-supervisor-closeout-snapshot-2026-06-10.md
rg -n "frontend/workbench|workbench-static|supervisor status|/api/goals/latest/supervisor|Supervisor|goals/latest/supervisor|workbench" -S .
rg -n "latest/supervisor|supervisor status|goal-supervisor-app-read-model|supervisor" frontend/workbench/src src/symphony tests -S
sed -n '1,180p' frontend/workbench/src/api/client.js
sed -n '1,260p' frontend/workbench/src/App.jsx
sed -n '9140,9278p' frontend/workbench/src/App.jsx
sed -n '480,880p' frontend/workbench/src/api/contracts.js
sed -n '930,1320p' frontend/workbench/src/api/contracts.js
```

PR-0 final validation must run:

```text
git diff --check
```

Current PR-0 result:

- `git diff --check`: passed, no whitespace errors.
