# v45 Backend Entrypoint Decomposition Runbook

Date: 2026-06-10
Timezone: Asia/Shanghai
Goal id draft: `v45-backend-entrypoint-decomposition`
Branch draft: `codex/v45-backend-entrypoint-decomposition-runbook`
Baseline checked for PR-0: `main` / `origin/main` at `62a2721b509d3f246a7296f87141feaa974a9adc`

## Scope

v45 reduces the size and coupling of the two backend entrypoint files that now carry most CLI and Workbench HTTP behavior:

- `src/symphony/console.js`
- `scripts/symphony.js`

The work is a decomposition of existing behavior. It keeps the v44.3 and v44.4 app-facing contracts stable while moving implementation into smaller modules.

This runbook lands after v44.4 PR-5. Code PRs for v45 must still check the trigger conditions below before changing runtime code.

## Trigger Conditions

Start v45 code work only after all of these are true:

- v44.4 PR-5 has landed with visual QA for `/workbench/supervisor/`.
- The v44.4 closeout snapshot exists at `docs/plans/v44-4-workbench-supervisor-dashboard-prototype-closeout-snapshot-2026-06-10.md`.
- Desktop and mobile QA for the supervisor dashboard recorded no blocking overlap, hidden command-boundary state, or misleading empty/stale/blocked state.
- `goal-supervisor-app-read-model.v1` has no known field gap blocking the dashboard.
- `main` is clean before the v45 branch starts.

If v44.4 PR-5 finds a missing backend field, fix the read model first. Do not combine contract changes with entrypoint decomposition.

PR-0 status on 2026-06-10: v44.4 PR-5 has landed at `62a2721b509d3f246a7296f87141feaa974a9adc` with the dashboard closeout snapshot present.

## Baseline Pressure

The current file sizes checked while drafting this runbook:

```text
12498 src/symphony/console.js
 8894 scripts/symphony.js
10058 frontend/workbench/src/App.jsx
12456 frontend/workbench/src/api/contracts.js
 7609 tests/workbench-api-client.test.js
 1881 tests/workbench-shell.test.js
 6181 tests/symphony-cli.test.js
```

The problem is not runtime performance. The risk is that app-facing route work and CLI command work now require edits inside large entrypoints with many unrelated responsibilities.

## Stable Interfaces

These interfaces must not change during v45:

- `GET /api/goals/latest/supervisor`
- `GET /api/goals/<goal-id>/supervisor`
- `goal-supervisor-app-read-model.v1`
- `pnpm --silent symphony supervisor status --goal <goal-id|latest> --json`
- Existing Workbench read-only route behavior in `frontend/workbench/src/api/client.js` and `frontend/workbench/src/api/contracts.js`
- Existing CLI JSON fields for `status`, `artifacts`, `goal-status`, and `supervisor status`

If a PR needs to change one of these interfaces, stop and write a separate contract runbook. Do not hide contract work inside the decomposition PR.

## Non-Goals

v45 does not:

- rewrite the backend in Rust or another runtime;
- change supervisor kernel semantics;
- change daemon ownership, child dispatch, result registration, or release closeout behavior;
- add command execution to Workbench;
- add new Workbench panels or fields;
- move frontend code into the backend decomposition PRs;
- create a broad `utils.js` file for unrelated helpers;
- run mutation, audit, provider CLI, real CLI, tag, publish, GitHub Release, or release closeout commands unless a later runbook explicitly authorizes them.

## Target Shape

The target is smaller entrypoint files with compatibility shims kept in place.

```text
src/symphony/
  console/
    index.js
    server.js
    request.js
    response.js
    errors.js
    static-workbench.js
    route-registry.js
    routes/
      summary.js
      readiness.js
      goals.js
      runs.js
      artifacts.js
      diagnostics.js
      actions.js
      providers.js
      app-core.js
      handoff.js
    services/
      console-snapshot.js
      console-readiness.js
      goal-supervisor-service.js
      safe-artifact-preview-service.js

  cli/
    index.js
    dispatcher.js
    errors.js
    output.js
    commands/
      supervisor.js
      status.js
      artifacts.js
      goal.js
      work.js
      stage.js
      evidence.js
      app-core.js
```

Compatibility entrypoints stay:

```text
src/symphony/console.js
scripts/symphony.js
```

Those files should re-export or delegate to the new modules so existing imports and package scripts continue to work.

## PR Order

Keep v45 to five PRs unless a PR becomes too large to review safely.

### PR-0 runbook

Adds this file only:

- `docs/plans/v45-backend-entrypoint-decomposition-runbook-2026-06-10.md`

Validation:

```text
git diff --check
```

No runtime code, no generated static assets, no frontend changes.

### PR-1 console HTTP foundation

Purpose: move low-risk HTTP helpers out of `src/symphony/console.js`.

Allowed new files:

- `src/symphony/console/request.js`
- `src/symphony/console/response.js`
- `src/symphony/console/errors.js`
- `src/symphony/console/static-workbench.js`
- `src/symphony/console/index.js`

Allowed edits:

- `src/symphony/console.js`
- focused tests only if import paths need coverage

Rules:

- Keep all API paths and response bodies unchanged.
- Keep static Workbench behavior unchanged.
- Do not introduce a route registry yet if that makes the first PR harder to review.

Required checks:

```text
node --test tests/symphony-cli.test.js tests/workbench-api-client.test.js
pnpm check
git diff --check
```

### PR-2 console route registry and app-facing routes

Purpose: move Workbench-facing routes into route modules and keep `console.js` as a server entrypoint.

Priority routes:

- `/api/goals/latest/supervisor`
- `/api/goals/<goal-id>/supervisor`
- `/api/summary`
- `/api/readiness`
- `/api/health`

Allowed new files:

- `src/symphony/console/server.js`
- `src/symphony/console/route-registry.js`
- `src/symphony/console/routes/goals.js`
- `src/symphony/console/routes/summary.js`
- `src/symphony/console/routes/readiness.js`

Rules:

- `goal-supervisor-app-read-model.v1` stays unchanged.
- POST rejection and method-not-allowed behavior stay unchanged.
- Frontend route allowlists stay unchanged unless a test proves an existing descriptor is wrong.
- Do not split every route in this PR. Move only the routes needed to protect the v44.4 dashboard and core Workbench startup.

Required checks:

```text
node --test tests/workbench-api-client.test.js tests/workbench-shell.test.js tests/symphony-cli.test.js
pnpm check
pnpm workbench:build
git diff --check
pnpm --silent symphony supervisor status --goal v19-fixture --json
```

### PR-3 console services

Purpose: separate route handling from state and contract assembly.

Allowed new files:

- `src/symphony/console/services/console-snapshot.js`
- `src/symphony/console/services/console-readiness.js`
- `src/symphony/console/services/goal-supervisor-service.js`
- `src/symphony/console/services/safe-artifact-preview-service.js`

Candidate route areas after the app-facing routes are stable:

- artifacts and safe previews;
- diagnostics;
- action manifest, availability, and preview;
- app-core backup, restore, release manager, and diagnostics bundle.

Rules:

- Route modules handle HTTP shape and validation.
- Service modules read state and assemble existing contracts.
- Do not change contract names, versions, or field semantics.
- Do not move supervisor internals as part of this PR.

Required checks:

```text
node --test tests/workbench-api-client.test.js tests/symphony-cli.test.js
pnpm check
git diff --check
```

### PR-4 CLI dispatcher

Purpose: move command dispatch out of `scripts/symphony.js` while keeping the script as the package entrypoint.

Allowed new files:

- `src/symphony/cli/index.js`
- `src/symphony/cli/dispatcher.js`
- `src/symphony/cli/errors.js`
- `src/symphony/cli/output.js`
- `src/symphony/cli/commands/supervisor.js`
- `src/symphony/cli/commands/status.js`
- `src/symphony/cli/commands/artifacts.js`
- `src/symphony/cli/commands/goal.js`

Rules:

- `scripts/symphony.js` should delegate to `runSymphonyCli()` and keep existing exports that tests import.
- CLI JSON output must stay byte-for-byte compatible where tests assert exact shapes.
- If moving all commands is too large, move the dispatcher plus `supervisor`, `status`, `artifacts`, and `goal` first. Leave the rest in place behind compatibility functions.
- Do not rewrite argument parsing unless it is only moved with no behavior change.

Required checks:

```text
node --test tests/symphony-cli.test.js tests/workbench-api-client.test.js
pnpm check
git diff --check
pnpm --silent symphony status --json
pnpm --silent symphony artifacts --json
pnpm --silent symphony goal-status --goal v19-fixture --json
pnpm --silent symphony supervisor status --goal v19-fixture --json
```

### PR-5 closeout

Purpose: record the final decomposition state and remaining risk.

Allowed files:

- `docs/plans/v45-backend-entrypoint-decomposition-closeout-snapshot-2026-06-10.md`
- generated static Workbench assets only if `pnpm workbench:build` changes them because of source changes already merged in v45

Required checks:

```text
node --test tests/workbench-api-client.test.js tests/workbench-shell.test.js tests/symphony-cli.test.js
pnpm check
pnpm workbench:build
git diff --check
pnpm --silent symphony supervisor status --goal v19-fixture --json
```

The closeout snapshot should record:

- PRs merged;
- files created;
- final line counts for `src/symphony/console.js` and `scripts/symphony.js`;
- unchanged API paths and CLI commands;
- checks run;
- known risks;
- rollback path.

## Stop Conditions

Stop the PR and write a short status note if any of these happen:

- a Workbench route returns a different contract name or version;
- `/workbench/supervisor/` breaks against live `goalSupervisor` data;
- a CLI command changes JSON shape without an explicit contract decision;
- route splitting requires a new contract field;
- the PR needs supervisor kernel changes to pass tests;
- the PR needs frontend UI changes beyond generated static assets;
- `pnpm workbench:build` changes unrelated static assets that cannot be explained by source changes;
- the review diff becomes mostly move noise plus behavior changes in the same files.

## Rollback Path

Rollback is per PR:

- PR-0: revert this runbook file.
- PR-1: move HTTP helpers back into `src/symphony/console.js` or revert the PR.
- PR-2: restore the route handling inside `src/symphony/console.js`; keep v44.4 frontend code unchanged.
- PR-3: restore service logic inside route modules or `src/symphony/console.js`.
- PR-4: restore direct command dispatch in `scripts/symphony.js`; keep any proven helper modules only if they are still imported by tests.
- PR-5: revert the closeout snapshot and generated static assets if they only document or package v45.

If a rollback is needed because the supervisor dashboard fails, keep v44.4 code intact and roll back the backend decomposition PR that changed route behavior.

## Verification Policy

Use focused checks during decomposition. Run broader test suites only when a PR touches shared state behavior outside the entrypoint move.

Default focused commands:

```text
node --test tests/workbench-api-client.test.js
node --test tests/workbench-shell.test.js
node --test tests/symphony-cli.test.js
pnpm check
pnpm workbench:build
git diff --check
```

CLI smoke commands:

```text
pnpm --silent symphony status --json
pnpm --silent symphony artifacts --json
pnpm --silent symphony goal-status --goal v19-fixture --json
pnpm --silent symphony supervisor status --goal v19-fixture --json
```

Do not run mutation, audit, provider CLI, real CLI, daemon start/stop, child dispatch, tag, publish, GitHub Release, or release closeout commands as part of v45 unless a later runbook explicitly adds them.

## PR-0 Validation Record

Commands run while drafting this runbook:

```text
git status --short --branch
git rev-parse HEAD
git log --oneline -6 --decorate
wc -l src/symphony/console.js scripts/symphony.js frontend/workbench/src/App.jsx frontend/workbench/src/api/contracts.js tests/workbench-api-client.test.js tests/workbench-shell.test.js tests/symphony-cli.test.js
sed -n '1,140p' docs/plans/v44-4-workbench-supervisor-dashboard-prototype-runbook-2026-06-10.md
rg -n "v44-4|PR-5|closeout|workbench:build|Browser QA|visual QA" docs/plans/v44-4-workbench-supervisor-dashboard-prototype-runbook-2026-06-10.md
```

PR-0 final validation:

```text
git diff --check
```

Current PR-0 result:

- `git diff --check`: passed, no whitespace errors.
