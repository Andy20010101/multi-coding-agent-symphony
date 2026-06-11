# v47 Mac App Shell Activation Runbook

Date: 2026-06-11
Timezone: Asia/Shanghai
Goal id draft: `v47-mac-app-shell-activation`
Branch draft: `codex/v47-mac-app-shell-activation`
Baseline checked for docs: `main` / `origin/main` at `1b99b96d98cb2e622d59b561d09dbb36cf4b8eb1`
Current tag: `v46`

## Scope

v47 changes the next mainline direction from more Web Workbench dashboard work to Mac App shell activation.

The repo already has a Tauri desktop boundary from v37 under `desktop/shell/src-tauri/` and a runnable Workbench desktop route at `/workbench/desktop/`. v46 added a read-only Supervisor Dashboard at `/workbench/supervisor/`, but the daily operator path is still `pnpm workbench:build`, `symphony console`, and a browser URL.

v47 should make the existing Tauri shell feel like the primary app entry for local supervision work. It should improve startup state, first screen, sidecar/backend visibility, and error handling. It should not add execution controls.

## Baseline

Checked files for this route change:

- `README.md`
- `docs/plans/v37-desktop-shell-ux-brief-2026-06-02.md`
- `docs/plans/v37-release-evidence-2026-06-04.md`
- `docs/plans/app-core-v34-v40-goal-runbooks/v37_desktop-shell-mvp_goal_runbook_latest.md`
- `docs/plans/v46-workbench-supervisor-dashboard-closeout-snapshot-2026-06-11.md`
- `desktop/shell/README.md`
- `desktop/shell/src-tauri/`
- `frontend/workbench/src/App.jsx`
- `frontend/workbench/src/api/client.js`
- `frontend/workbench/src/api/contracts.js`
- `package.json`
- `scripts/desktop-shell-smoke.js`
- `tests/workbench-shell.test.js`

Facts from the baseline:

- `desktop/shell/src-tauri/` exists and uses Tauri v2.
- The Tauri window route is `/workbench/desktop/`.
- The dev URL is `http://127.0.0.1:5173/workbench/desktop/`.
- The native command surface is limited to `attach_sidecar` and `launch_sidecar`.
- The fixed launcher command id is `symphony.console.sidecar.launch`.
- `pnpm desktop:shell:smoke` validates the Tauri boundary without running a full native build.
- v46 is a read-only Web Workbench dashboard release, not a packaged Mac App release.

## User Problem

The current operator experience still feels like a web console because the visible daily path is:

```text
pnpm workbench:build
symphony console
open http://127.0.0.1:8765/workbench/
```

The existing Tauri shell is present, but it is not yet the default product entry. A local failure can still look like a browser routing error, such as `Cannot GET /`, instead of an app-level state that says the backend, sidecar, project, or active goal is unavailable.

v47 should correct that product direction before adding more dashboard fields.

## Target App Path

The intended v47 path is:

```text
Open Symphony Desktop Shell
  -> App Home / Desktop route loads inside a native window
  -> app checks sidecar/backend state
  -> app shows current project, active goal, next action, supervisor summary, and boundaries
  -> app keeps all command execution unavailable from the renderer
```

The screen can still reuse `/workbench/desktop/`, but it should read as the app home surface, not as another browser page. The user should not need to inspect `127.0.0.1` to understand whether the app is ready.

## Stable Boundaries

v47 keeps these boundaries unchanged:

- No generic shell runner.
- No browser terminal.
- No renderer-side shell execution.
- No renderer-side local file open.
- No provider CLI, real CLI, model invocation, or prompt dispatch.
- No daemon start, stop, restart, child dispatch, or goal event registration.
- No git merge, push, tag, publish, GitHub Release, or release closeout automation.
- No release-ready inference from branch name, filename, prompt text, task title, route path, or frontend state.
- No claim that signed distribution, notarization, auto-update, or installable `.dmg` packaging is complete.

The native bridge may keep the fixed sidecar attach/launch contract already present in v37. It must not accept arbitrary command text, executable paths, local file paths, provider options, git actions, release actions, or user-supplied shell fragments.

## Required First Screen

The v47 App Home or enhanced `/workbench/desktop/` first screen should show:

- current project name and repo path source
- sidecar state and fixed launcher contract
- backend health and route source
- active goal id and title when exposed
- next action, role, task, phase, and reason
- supervisor status summary from the app-facing read model when available
- read-only and will-mutate boundary flags
- route/source provenance for live, fallback, stale, missing, or failed data
- explicit boundary text for no browser terminal, no generic shell runner, no provider CLI from renderer, and no git/release action from the app surface

Missing state should be visible:

- backend unavailable
- sidecar missing
- project missing
- active goal missing
- supervisor model unavailable
- stale snapshot
- route failed

Do not hide these states behind a decorative empty state or generic loading copy.

## PR Order

Keep v47 small enough to review. Split implementation by product boundary, not by arbitrary file count.

### PR-0 route documentation

Purpose: document the route change before implementation.

Allowed files:

- `README.md`
- `desktop/shell/README.md`
- `docs/plans/v47-mac-app-shell-activation-runbook-2026-06-11.md`

Validation:

```text
git diff --check
```

No runtime code, generated assets, Tauri config, tests, or release evidence in PR-0.

### PR-1 App Home surface

Purpose: make `/workbench/desktop/` read as the native app first screen.

Likely files:

- `frontend/workbench/src/App.jsx`
- `frontend/workbench/src/api/contracts.js`
- `frontend/workbench/src/styles/workbench.css`
- `tests/workbench-shell.test.js`
- `src/symphony/workbench-static/` after `pnpm workbench:build`

Rules:

- Keep data sourced from existing read-only contracts.
- Do not add frontend fetches to runner state, goal ledgers, event logs, temporary supervisor files, provider JSONL, or arbitrary local paths.
- Do not add buttons that imply execution.
- Use inert text for evidence refs and command previews.

Required checks:

```text
pnpm workbench:build
node --test tests/workbench-shell.test.js
pnpm check
git diff --check
```

### PR-2 Startup and unavailable-state projection

Purpose: make local app failure modes legible inside the App Home surface.

Likely files:

- `frontend/workbench/src/api/contracts.js`
- `frontend/workbench/src/App.jsx`
- `tests/workbench-api-client.test.js`
- `tests/workbench-shell.test.js`

Required states:

- backend unavailable
- sidecar missing
- project missing
- active goal missing
- supervisor model unavailable
- stale snapshot
- route failed

Rules:

- The renderer may display the state, but it must not repair the state.
- If a native attach/launch action is exposed later, it must stay behind the existing fixed Tauri bridge contract and separate tests.
- Do not treat a successful React render as proof that the backend or supervisor is healthy.

Required checks:

```text
pnpm workbench:build
node --test tests/workbench-api-client.test.js tests/workbench-shell.test.js
pnpm desktop:shell:smoke
pnpm check
git diff --check
```

### PR-3 Desktop host boundary and smoke hardening

Purpose: make the Tauri boundary harder to regress while keeping packaging claims honest.

Likely files:

- `scripts/desktop-shell-smoke.js`
- `desktop/shell/README.md`
- `desktop/shell/src-tauri/tauri.conf.json`
- `desktop/shell/src-tauri/src/lib.rs`
- `tests/workbench-shell.test.js`

Rules:

- The Rust command surface remains fixed to `attach_sidecar` and `launch_sidecar`.
- The launcher command remains the fixed `pnpm symphony console --host <loopback> --port <allowed-port>` shape.
- Loopback and port guards stay in place.
- `bundle.active` remains disabled unless a later packaging runbook changes it.
- No updater, signing, notarization, publish URL, release automation, provider CLI, generic shell runner, or arbitrary path opening.

Required checks:

```text
pnpm desktop:shell:smoke
cargo check --manifest-path desktop/shell/src-tauri/Cargo.toml --target-dir tmp/tauri-target
pnpm check
git diff --check
```

### PR-4 Acceptance and closeout snapshot

Purpose: close v47 without overstating distribution support.

Required docs:

- `docs/qa/v47-mac-app-shell-activation-acceptance.md`
- `docs/plans/v47-mac-app-shell-activation-closeout-snapshot-2026-06-11.md`

Required checks:

```text
pnpm workbench:build
pnpm desktop:shell:smoke
cargo check --manifest-path desktop/shell/src-tauri/Cargo.toml --target-dir tmp/tauri-target
node --test tests/workbench-api-client.test.js tests/workbench-shell.test.js
pnpm check
git diff --check
```

Run `pnpm test` if PR-1 through PR-3 touch shared projection helpers, shared route state, or generated Workbench assets in a way that affects other routes.

## QA Notes

Acceptance should verify these user-visible claims:

- Opening the Tauri route lands on the App Home or enhanced Desktop surface.
- The first screen shows project, sidecar, backend, active goal, next action, supervisor summary, route source, and boundary flags.
- Missing backend, sidecar, project, active goal, and supervisor model states render as app states.
- No visible UI control appears to run a command, launch a provider, mutate a goal, dispatch a child, push git state, tag, publish, or create a release.
- Browser URL errors are not the primary explanation for app startup failures.
- Packaging remains smoke/boundary only. The docs do not claim signed distribution, notarization, auto-update, or `.dmg` delivery.

## Rollback Path

If the documentation route is wrong, revert PR-0.

If the App Home surface regresses other Workbench routes, revert PR-1 and keep `/workbench/desktop/` on the v46 behavior while preserving the runbook.

If unavailable-state projection introduces misleading status, revert PR-2 and require backend contract changes before reattempting it.

If desktop smoke hardening blocks legitimate Tauri compile checks, revert only the smoke assertion that is too strict. Do not loosen the generic shell, provider CLI, git, release, signing, notarization, or updater boundaries.

## Follow-Up

v48 should be Project Launcher / Recent Projects only after v47 makes the app shell a credible entry point.

v48 should cover:

- recent projects
- current project binding
- project health
- app state snapshot after project selection
- no arbitrary path preview or local file opening without a separate controlled contract

Context/session observability should follow once the app has a stable shell and project context. It should stay read-only and expose summarized context utilization, transcript availability, latest tool call, and near-limit advisory through backend contracts rather than direct frontend reads of Codex or Claude session files.
