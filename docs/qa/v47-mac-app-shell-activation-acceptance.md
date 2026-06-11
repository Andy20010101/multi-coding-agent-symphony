# v47 Mac App shell activation acceptance

Date: 2026-06-11
Timezone: Asia/Shanghai
Scope: `/workbench/desktop/`, Tauri shell host boundary, and v47 closeout documentation.

## User-visible acceptance

| Claim | Evidence | Acceptance condition |
| --- | --- | --- |
| The Tauri route lands on the App Home / enhanced Desktop surface. | `desktop/shell/src-tauri/tauri.conf.json` sets the main window URL to `/workbench/desktop/`. `frontend/workbench/src/App.jsx` renders `DesktopShellRoute` for the desktop route. `tests/workbench-shell.test.js` renders `/workbench/desktop/?goal=v47-mac-app-shell-activation&task=task-1` and checks `Symphony App Home`, `v47 Mac App Home`, and `workbench-shell desktop-shell-route`. | Opening the configured Tauri route shows the Desktop App Home surface, not a generic Workbench landing page or a browser error page. |
| The first screen shows project, sidecar, backend, active goal, next action, supervisor summary, route source, and boundary flags. | `frontend/workbench/src/App.jsx` renders the desktop topbar, `DesktopAppHomePanel`, `DesktopAppStateStrip`, `DesktopCurrentProjectCard`, `DesktopBackendHealthCard`, `DesktopSidecarCard`, `DesktopActiveGoalCard`, `DesktopNextActionCard`, `DesktopSupervisorSummaryCard`, `DesktopRouteProvenanceCard`, and `DesktopBoundaryCard`. `tests/workbench-shell.test.js` checks the rendered HTML for `backend`, `boundary`, `repo path source`, `route source`, `sidecar health`, `Active Goal`, `Next Action`, `Supervisor`, `Route Sources`, and `No Runner Surface`. | The initial desktop route includes the operational status needed to decide whether the local app is ready, degraded, or missing data. |
| Missing backend, sidecar, project, active goal, and supervisor model render as app states. | `frontend/workbench/src/api/contracts.js` projects `backendUnavailable`, `sidecarMissing`, `projectMissing`, `activeGoalMissing`, `supervisorModelUnavailable`, `staleSnapshot`, and `routeFailed`. `tests/workbench-shell.test.js` checks the visible state strip and verifies failed, missing, and stale text. `tests/workbench-api-client.test.js` verifies the same flags in `DesktopAppHomeViewModel`. | A missing contract appears as a named app state with route/source context. A successful React render is not treated as proof that the backend, sidecar, active goal, or supervisor model is healthy. |
| No visible UI control runs a command, launches a provider, mutates a goal, dispatches a child, pushes git state, tags, publishes, or creates a release. | `frontend/workbench/src/api/contracts.js` sets desktop boundary flags for read-only, no shell execution, no provider CLI from renderer, no child dispatch, no goal event registration, no local file open, no git write, no release action, no release-ready declaration, and inert evidence/command text. `tests/workbench-api-client.test.js` checks these booleans. `tests/workbench-shell.test.js` scans the desktop route body for absence of `fetch(`, `confirmGoalEventPlan`, `window.open`, clipboard calls, forms, and textareas. | Desktop App Home remains observational. Evidence refs and command previews are inert text. |
| Browser URL errors are not the primary explanation for app startup failures. | `frontend/workbench/src/api/contracts.js` derives `backendHealth.routeSource`, `routeProvenance`, and `appStates.routeFailed` from route states. `frontend/workbench/src/App.jsx` renders those fields before the lower desktop panels. `tests/workbench-shell.test.js` checks visible `runtime snapshot route failed`, `route failed`, and source provenance strings. | Startup failures are explained as app states tied to backend, sidecar, project, active goal, supervisor model, stale snapshot, or route failure, rather than by a bare browser URL error such as `Cannot GET /`. |
| Packaging remains smoke/boundary only. | `desktop/shell/src-tauri/tauri.conf.json` keeps `bundle.active` false. `desktop/shell/README.md` states that smoke and `cargo check` validate source-level host boundaries and compileability only. `scripts/desktop-shell-smoke.js` rejects updater, publish URL, signing, notarization, release automation, extra Tauri plugins, arbitrary path opening, and shell runner drift. | v47 does not claim signed distribution, notarization, auto-update, `.dmg` delivery, publish endpoint, GitHub Release, tag, or release automation. |

## Source checks

`projectDesktopShell` in `frontend/workbench/src/api/contracts.js` builds the `DesktopAppHomeViewModel` from existing read-only Workbench contracts. The model carries the desktop route, shell decision, sidecar health, backend health, workspace, project list, active goal status, next action detail, supervisor summary, route provenance, app states, and explicit boundary flags.

`DesktopShellRoute` in `frontend/workbench/src/App.jsx` renders that model. The route includes in-page anchor navigation, but the desktop route body does not expose a command runner, provider launcher, goal mutation form, child dispatch action, git action, tag action, publish action, or release creation action.

`desktop/shell/src-tauri/src/lib.rs` exposes only `attach_sidecar` and `launch_sidecar`. The launch path is fixed to `pnpm symphony console --host <loopback> --port <allowed-port>` from the repo root. It accepts only `127.0.0.1` or `localhost` and ports from `1024` through `65535`. The renderer launch, renderer shell execution, generic shell runner, arbitrary command, arbitrary path, model invocation, git write, and release write flags remain false.

## Required validation

| Command | Result |
| --- | --- |
| `pnpm workbench:build` | Passed after `pnpm install --frozen-lockfile` restored missing `node_modules` in this worktree. Vite built `src/symphony/workbench-static/index.html`, `assets/index-CTsPdN5P.css`, and `assets/index-ChtRsTTb.js` with no tracked asset diff. |
| `pnpm desktop:shell:smoke` | Passed. JSON output reported `desktop-shell-smoke.v1`, `status: "ok"`, renderer route `/workbench/desktop/`, bridge commands `attach_sidecar` and `launch_sidecar`, launcher id `symphony.console.sidecar.launch`, allowed hosts `127.0.0.1` and `localhost`, port range `1024` through `65535`, and packaging flags for bundle, publish, signing, notarization, and auto-update all unavailable. |
| `cargo check --manifest-path desktop/shell/src-tauri/Cargo.toml --target-dir tmp/tauri-target` | Passed. Cargo finished the Tauri host `dev` profile check for `symphony-desktop-shell`. |
| `node --test tests/workbench-api-client.test.js tests/workbench-shell.test.js` | Passed: 89 tests, 0 failures. The run included `projects the v47 Desktop App Home view model from existing read-only contracts`, `projects v47 Desktop startup unavailable state flags from route and model states`, and `renders the v47 Desktop App Home route as a native-first read-only surface`. |
| `pnpm check` | Passed. Node syntax check completed across source, scripts, plugin, and test files. |
| `git diff --check` | Passed. |

`pnpm test` is not required for PR-4 unless this branch changes shared projection helpers, shared route state, generated Workbench assets, runtime code, or tests. PR-4 changes only the two v47 documentation files.

## Failure recovery

If the desktop route no longer opens the App Home surface, inspect `desktop/shell/src-tauri/tauri.conf.json`, `frontend/workbench/src/App.jsx`, and `tests/workbench-shell.test.js` before changing Tauri host commands.

If the first screen hides missing state, inspect `projectDesktopAppStateFlags` in `frontend/workbench/src/api/contracts.js` and the `DesktopAppStateStrip` render path in `frontend/workbench/src/App.jsx`.

If the smoke check reports a packaging, updater, signing, notarization, shell, provider, git, or release drift, restore the v47 PR-3 boundary before rerunning validation. Do not compensate by adding a browser-side fallback command.
