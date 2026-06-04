# v37 Desktop Shell UX Brief

Date: 2026-06-02
Goal id: `v37-desktop-shell-mvp`
Task id: `task-1`
Runnable route: `/workbench/desktop/`

## Product Boundary

The Desktop Shell MVP is a native-app direction for the local Workbench. Task-1 creates the shell information architecture and a runnable renderer route. It does not create the Tauri host, launch the sidecar, run jobs, execute shell commands, call models, open files, write git state, approve review, pass main verification, or declare release readiness.

State must come from explicit backend contracts:

- `app-state-snapshot.v1`
- `goal-runbook.v1`
- `goal-next-action.v1`
- `goal-progress-ledger.v1`
- `goal-event-log.v1`
- `action-manifest.v1`, `action-availability.v1`, `action-preview.v1`
- `job-model.v1`, `job-creation.v1`, `job-timeline-log-stream.v1`, `job-run-control.v1`
- `artifact-index.v1`, `evidence-timeline.v1`, `release-bundle.v1`

ArtifactStore remains canonical. The artifact/evidence index is a derived view for preview, search, and readiness display.

## Desktop Technology Decision

Use Tauri first. Electron is deferred.

This repo already has a local console sidecar, Vite/React Workbench assets, and backend contracts for runtime health, current project, active goal, action preview, job state, and artifact/evidence views. Tauri fits that boundary because the native host can stay small: start or attach to the local sidecar, load the existing renderer, and keep privileged actions outside the browser renderer.

Electron would add a larger main-process and packaging surface before this task needs it. Task-1 does not need Node IPC, direct filesystem access, shell execution, or model invocation from the desktop host. Those capabilities are explicitly out of scope.

## First Screen

The first screen is the shell itself, not a landing page.

Layout:

- Left navigation: Overview, Lifecycle, Run State, Artifacts, Boundaries.
- Top bar: project, active goal, shell state, desktop decision.
- First row: sidecar health, active goal, next action, run health.
- Lower grid: lifecycle timeline, job/run state, artifact/evidence readiness, Tauri decision, no-runner boundary.

The route is `/workbench/desktop/`. It uses the existing Workbench fetch path through `fetchWorkbenchContracts()` and the same local API routes.

## Visual Direction

The visual language follows the provided warm parchment command-center dashboard reference without copying its v32 wording or example business data.

Applied direction:

- ivory/parchment page background with light paper texture
- warm thin borders
- subtle shadows
- compact operational cards
- left navigation plus top status bar
- first row for active goal, next action, and run health
- lower sections for lifecycle, active run, blockers/readiness, and artifacts
- plum for selected/primary shell affordances
- olive for healthy/available states
- amber/copper for warning, stale, partial, or blocked states
- dark ink typography
- small dense labels
- cards around 8px radius

Avoided:

- marketing hero
- decorative gradient-orb background
- generic command palette
- browser terminal
- one-color beige-only theme

## Navigation

The Workbench nav gains a `Desktop` entry that links to `/workbench/desktop/`. Existing Workbench sections remain available. The Desktop route is a separate product surface over the same contracts, not a replacement for the Workbench operator path.

The Desktop side navigation stays within the route:

- Overview: first-row shell status.
- Lifecycle: active goal task timeline.
- Run State: job/run contract summary.
- Artifacts: artifact preview and evidence readiness.
- Boundaries: no-runner desktop constraints.

## Top Bar Status

Top bar fields:

- project: from `current_project.currentProject.project_name`
- goal: from route context or current project `last_goal_id`
- state: from `DesktopShellMvpViewModel.state`
- decision: `Tauri-first desktop shell`

Empty, loading, failed, stale, and blocked states keep the same data contract source. They do not fill missing values from branch, filename, prompt text, task title, or frontend route text.

## Sidecar Health

The sidecar card reads `app-state-snapshot.v1` and displays:

- runtime status
- runtime mode
- runtime version
- kernel version
- runtime route
- route state
- launcher availability
- task-2 handoff

Task-1 set launcher availability to `false`. Task-2 replaces that placeholder with `sidecar-host-lifecycle.v1` from `local-runtime-health.v1.sidecarHost`, carried through `app-state-snapshot.v1.runtime_health.sidecarHost`. The route displays attach state, launcher state, and the fixed launcher command id; it still does not execute the launcher from the renderer.

## Active Goal

The active goal card reads the projected active goal model from goal/runbook/progress contracts. It shows:

- goal id
- goal title when exposed
- state
- source contract

It does not infer current goal from the branch name or task branch.

## Next Action

The next action card reads `goal-next-action.v1` and the current task projection:

- task id
- role
- phase
- status
- reason

The card is display-only. Any worker evidence registration still uses the existing dry-run and plan-hash confirm flow outside this card.

## Job / Run State

The run health and job/run state cards read the v35 job contracts:

- `job-model.v1`
- `job-creation.v1`
- `job-timeline-log-stream.v1`
- `job-run-control.v1`

Task-4 displays job id, status, queue state, action id, timestamps, blocker, failure, timeline/log counts, route state, and available transitions. The transition list is read-only. It does not create, pause, cancel, resume, recover, or execute jobs.

## Artifact Preview / Evidence Readiness

The artifact readiness card reads:

- latest run artifact refs
- safe preview route count
- artifact index state
- evidence timeline state
- release bundle state

Task-4 adds artifact ref status, missing count, safe preview route count, backend preview availability, backend safe inline availability, artifact index entry count, evidence timeline entry count, release bundle task count, and release state. Safe preview content remains controlled by backend safe preview contracts. The renderer does not open arbitrary local paths and does not decide file safety from extensions, filenames, or UI state.

## Empty, Loading, Error, Blocked States

Loading:

- Shell shows the existing `读取中` state while `fetchWorkbenchContracts()` resolves.
- No fallback state is fabricated.

Error:

- Shell shows `读取失败` and asks for route refresh.
- Route-specific errors remain in route state fields.

Empty:

- Missing project, missing goal, no run, or empty artifact refs render as `未暴露`, `empty`, or `missing` from the projected contract.

Blocked:

- Blocked/stale/partial status uses amber treatment.
- Blocker text must come from `known_blockers`, goal event blockers, job blockers, or route errors.

## Reused Components

Reused from Web Workbench:

- Vite/React renderer
- `fetchWorkbenchContracts()`
- route state projection
- `FieldList`
- `EmptyBlock`
- runtime snapshot projection
- active goal/task queue projection
- job console projection
- artifact/evidence projection
- existing `/api/*` console routes

## Desktop-Only Pieces

Desktop-only pieces added in task-1:

- `/workbench/desktop/` route
- `DesktopShellMvpViewModel`
- desktop shell first-screen layout
- desktop side navigation
- sidecar health card with task-2 launcher handoff
- Tauri-first decision card
- no-runner boundary card
- `desktop/shell/README.md` workspace boundary

## Follow-Up Handoff

v37 task-2:

- Add Tauri host workspace.
- Start or attach to the local sidecar through a fixed native bridge.
- Feed sidecar health into the same `app-state-snapshot.v1` path.
- Keep renderer actions display-only unless a controlled backend/native contract already supports dry-run and plan-hash confirm.

v37 task-3:

- Bind project list, active goal, and next action to live sidecar data in the desktop route.
- Preserve the current route context and explicit status-source rules.
- Consume `project-registry.v1` for the project list and `app-state-snapshot.v1` / `goal-next-action.v1` / `goal-progress-ledger.v1` / `goal-event-log.v1` for active goal, next action, blocked, review, main verification, and release status.
- Keep the route display-only; status cards must not register review, main verification, release gates, tags, pushes, or release readiness.

v37 task-4:

- Bind job status and artifact preview to the existing job and artifact APIs.
- Display run-control transitions as read-only state, not execution controls.
- Display safe preview availability only from backend `safe-artifact-preview.v1`.
- Keep ArtifactStore canonical and the index derived.

v37 task-5:

- Run native desktop build smoke.
- Document packaging limits.
- Do not add auto-update, publish, push, tag, merge, self-approval, or release-ready paths.
