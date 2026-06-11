# v48 Project Launcher and Recent Projects Runbook

Date: 2026-06-11
Timezone: Asia/Shanghai
Goal id draft: `v48-project-launcher-recent-projects`
Branch draft: `codex/v48-project-launcher-runbook`
Baseline checked for docs: detached `HEAD` at `1e7988a7aa36922881c8b0b9f620417a4c70bff4`
Baseline tag: `v47`
GitHub Release: `v47: Mac App shell activation`

## Reconcile

| Check | Result |
| --- | --- |
| `git status -sb` | `## HEAD (no branch)` before branch creation; no local file changes. |
| `git branch --show-current` | Empty output before branch creation because the worktree was detached. |
| `git fetch origin main --tags` | Completed from `https://github.com/Andy20010101/multi-coding-agent-symphony`, fetched `main` and tags. |
| `git tag --list v47` | `v47` exists locally after fetch. |
| `git rev-list -n 1 v47` | `1e7988a7aa36922881c8b0b9f620417a4c70bff4`. |
| `gh release view v47 --json tagName,name,url,isDraft,isPrerelease,publishedAt` | Release exists, not draft, not prerelease, published at `2026-06-11T10:36:11Z`: `https://github.com/Andy20010101/multi-coding-agent-symphony/releases/tag/v47`. |
| `gh pr list --state open --json number,title,headRefName,baseRefName,url,isDraft` | No open PRs returned before this PR-0 branch. |

Files read before writing this runbook:

- `docs/plans/v47-mac-app-shell-activation-runbook-2026-06-11.md`
- `docs/plans/v47-mac-app-shell-activation-closeout-snapshot-2026-06-11.md`
- `docs/qa/v47-mac-app-shell-activation-acceptance.md`
- `frontend/workbench/src/App.jsx`
- `frontend/workbench/src/api/contracts.js`
- `tests/workbench-shell.test.js`

## v48 Objective

v47 made `/workbench/desktop/` the trusted App Home for the Mac App shell. It is still read-only and does not claim signed distribution, notarization, `.dmg` packaging, or auto-update.

v48 should make the first app step project-aware. The app should open to a Project Launcher / Recent Projects entry instead of silently binding the visible App Home to whichever repo the console sidecar started from.

v48 covers four connected outcomes:

- Project Launcher / Recent Projects: the desktop route shows recent or known projects from a backend contract, with clear empty, missing, stale, and degraded states.
- Current Project binding: selecting a project changes the app-selected project state through an explicit backend/app contract.
- Project health snapshot after selection: the selected project shows status, source, route provenance, last goal/run pointers when available, and missing-state reasons when not available.
- App state based on selected project: desktop App Home panels read the selected project binding and show whether active goal, next action, supervisor summary, run health, and artifact readiness are available for that project.

The user-visible behavior should be simple: open the app, choose or confirm the project, then see the App Home state for that selected project.

## Boundary Decision

Project selection is an app state mutation. It is not a goal mutation, provider execution, git operation, release operation, child dispatch, or generic shell command.

That mutation may exist in v48 only if it uses a narrow backend/app contract. The frontend must not scan the filesystem, read arbitrary paths, derive project health from local files, or repair missing backend state by itself.

Allowed for v48:

- Read recent projects from a backend read model.
- Display an explicit current project binding.
- Submit a safe selection request that identifies a backend-known project by stable id.
- Refresh read-only app state after selection.
- Show disabled command-boundary rows where later PRs may add scoped selection-only controls.

Forbidden for v48:

- Frontend filesystem scanning.
- Frontend arbitrary path reads or local file previews.
- Provider CLI launch.
- Goal event mutation or goal selection mutation.
- Child dispatch.
- Job execution.
- Git push, tag, merge, publish, or release actions.
- GitHub Release creation.
- Generic shell runner, raw runner surface, or browser terminal.
- Direct frontend reads from runner ledgers, session files, provider transcripts, `.symphony`, JSONL files, Codex sessions, Claude sessions, or temporary daemon files.

If a later PR adds a selection request, its request body must carry a backend-known project id or registry token. It must not accept arbitrary command text, executable paths, shell fragments, provider options, git refs, release ids, or unchecked local filesystem paths.

## Contract Shape

The existing baseline already exposes `/api/projects` as `project-registry.v1`, projects `Project Registry` in Workbench, and uses `currentProjectFromRegistry(projectRegistry)` as part of `DesktopAppHomeViewModel`. v48 should build on that instead of adding renderer-side discovery.

### `recentProjects` read model

Purpose: feed the Project Launcher and Recent Projects list.

Expected fields:

- `contractName`: `recent-projects.v1`
- `contractVersion`
- `generatedAt`
- `state`: `available`, `empty`, `missing`, `stale`, or `failed`
- `source.kind`: registry, explicit cwd, managed recent list, fixture, or unavailable
- `source.scanScope`: explicit value such as `known-projects-only`
- `readOnly`: `true`
- `items[]`: project id, display name, repo path display value, default branch, remote display value, pinned flag, last opened time, last goal id, last run id, health summary, and degraded reason
- `boundaries`: no disk scan, no arbitrary path read, no command execution, no model invocation, no git write, no release write

The model may include repo paths returned by the backend registry. It must not claim the frontend can browse the disk.

### `currentProject` binding model

Purpose: describe the app-selected project separately from the repo that launched the sidecar.

Expected fields:

- `contractName`: `current-project-binding.v1`
- `state`: `bound`, `unbound`, `missing`, `stale`, or `failed`
- `selectedProjectId`
- `selectedProjectName`
- `repoPath`
- `bindingSource`: user selection, cwd fallback, persisted app state, or backend default
- `persisted`: boolean value from backend state
- `selectionUpdatedAt`
- `fallbackReason`
- `routeState`
- `readOnly`: `false` only for the selection endpoint; the model itself is read-only

The binding must not update active goal ledgers or create goal events. It only changes which project the App Home reads from.

### `projectHealth` snapshot

Purpose: show whether the selected project is ready for App Home state.

Expected fields:

- `contractName`: `project-health-snapshot.v1`
- `projectId`
- `state`: `healthy`, `degraded`, `missing`, `stale`, or `failed`
- `repo`: path display value, branch display value, remote display value, dirty state if backend already exposes it safely
- `backend`: route availability, freshness, sidecar compatibility, contract freshness
- `activeGoal`: state, goal id, title, task count, next task, missing reason
- `supervisor`: read model state, pending result state, command boundary state
- `runs`: latest run id, run health, last opened time when available
- `artifacts`: safe preview availability and counts from existing artifact contracts
- `routeProvenance[]`: route, route state, source contract, error display value
- `boundaries`: no frontend file read, no command execution, no provider launch, no git write, no release write

Project health should say exactly what is missing. A successful React render is not project health.

### `selectedProject` app state

Purpose: provide one stable app state object the desktop route can render.

Expected fields:

- `selectedProject.state`: `selected`, `needs-selection`, `empty`, `missing`, `degraded`, or `failed`
- `selectedProject.projectId`
- `selectedProject.displayName`
- `selectedProject.repoPath`
- `selectedProject.healthState`
- `selectedProject.appStates`: backend unavailable, registry unavailable, binding missing, project missing, active goal missing, supervisor unavailable, stale snapshot, route failed
- `selectedProject.sourcePolicy`: backend contracts only
- `selectedProject.selectionControl`: state, disabled reason, endpoint id if implemented, confirmation requirements

The Workbench desktop route should use `selectedProject` as the first app-level decision. Existing cards for current project, backend, sidecar, active goal, next action, supervisor summary, run health, artifacts, provider availability, route provenance, and boundaries can remain, but they should be scoped to the selected project.

### Command Boundary

v48 may show the command boundary, but it should be disabled/no-execution by default.

Allowed display:

- Selection control state.
- Disabled command families.
- Fixed statement that project selection is app state only.
- Route/source provenance after selection.

Forbidden display:

- Run, execute, dispatch, approve, verify, publish, tag, release, open terminal, open folder, scan disk, or launch provider controls.
- Actionable-looking command previews for provider, git, release, shell, runner, ledger, or session access.

If a later PR scopes a safe selection action, it must be limited to `selectProject(projectId, expectedRegistryVersion?)` or equivalent. It must not include a generic command executor.

## PR Breakdown

### PR-0 Runbook and architecture contract

Scope:

- Add this v48 runbook.
- Record v47 baseline, release state, boundary decision, contract shape, PR split, acceptance, rollback, and model policy.

Forbidden scope:

- Runtime code.
- UI code.
- Generated Workbench assets.
- Backend route implementations.
- Tests beyond docs-only validation.
- Git tag, GitHub Release, or release closeout.

Required validation:

```text
git diff --check
```

Reviewer checklist:

- The runbook separates app selection state from goal/provider/git/release actions.
- It keeps discovery and health behind backend contracts.
- It gives later PRs enough contract detail to implement without adding a generic runner.
- It does not claim v48 implementation has already shipped.

### PR-1 Recent projects read model, fixtures, and tests

Scope:

- Add or extend backend read contracts for `recent-projects.v1`.
- Add fixtures covering available, empty, missing, stale, degraded, and failed states.
- Add projection tests for recent projects and boundary flags.
- Keep `project-registry.v1` compatibility or document a narrow migration path if the new read model wraps it.

Forbidden scope:

- Project selection mutation.
- Frontend filesystem scan.
- Arbitrary path input.
- Provider launch.
- Goal mutation.
- Git or release writes.
- Runtime shell runner.

Required validation:

```text
node --test tests/workbench-api-client.test.js tests/workbench-shell.test.js
pnpm check
git diff --check
```

Run `pnpm workbench:build` if source changes require generated Workbench asset refresh.

Reviewer checklist:

- Recent project data comes from backend-known registry state.
- Empty and missing states are visible in the projection.
- Boundary flags explicitly deny disk scan, arbitrary path read, command execution, model invocation, git write, and release write.
- Fixtures do not contain claims that the frontend can browse the filesystem.

### PR-2 Project Launcher UI in Workbench/App shell

Scope:

- Add a Project Launcher / Recent Projects entry to `/workbench/desktop/`.
- Show recent projects, current binding, empty/missing/degraded states, and route/source provenance.
- Keep mobile and desktop layout stable with no overlapping text or controls.
- Keep provider, goal, git, release, and command controls absent or disabled.

Forbidden scope:

- Selection mutation unless PR-3 has already supplied the contract and tests.
- Direct local file open.
- Frontend directory picker.
- Shell command preview that looks executable.
- Provider/goal/git/release controls.

Required validation:

```text
pnpm workbench:build
node --test tests/workbench-shell.test.js tests/workbench-api-client.test.js
pnpm check
git diff --check
```

Capture desktop and mobile screenshots if layout changes are substantial.

Reviewer checklist:

- The app opens to a project-aware entry, not a hidden cwd binding.
- Recent Projects is visible without promising arbitrary filesystem access.
- Empty, missing, stale, degraded, and failed states are easy to find.
- No visible control suggests provider launch, goal mutation, git action, release action, or terminal execution.

### PR-3 Selected project state binding

Scope:

- Add the narrow backend/app selection contract.
- Bind App Home state to the selected project.
- Refresh project health, active goal, next action, supervisor summary, run health, artifacts, and route provenance after selection.
- Persist selection only through the backend contract if persistence is in scope.

Forbidden scope:

- Arbitrary path submission.
- Goal id mutation.
- Provider CLI launch.
- Job execution.
- Child dispatch.
- Git push, tag, merge, publish, or release.
- Raw ledger/session/provider transcript reads.

Required validation:

```text
pnpm workbench:build
node --test tests/workbench-api-client.test.js tests/workbench-shell.test.js
pnpm check
git diff --check
```

Add focused backend tests for selection payload validation if the implementation introduces a POST route.

Reviewer checklist:

- Selection accepts only backend-known project ids or equivalent registry tokens.
- The selected project state is observable after refresh.
- Selecting a project does not create goal events, dispatch children, invoke providers, or write git state.
- Failure states include a recovery path such as "registry missing" or "project no longer available" without exposing raw filesystem access.

### PR-4 Acceptance, closeout, and tag prep

Scope:

- Add v48 acceptance evidence.
- Add closeout snapshot.
- Record validation commands and any generated asset changes from previous PRs.
- Prepare tag notes only after implementation PRs are merged and validated.

Forbidden scope:

- Runtime feature expansion.
- New execution controls.
- Git tag creation.
- GitHub Release creation.
- Signed distribution, notarization, `.dmg`, or auto-update claims.

Required validation:

```text
pnpm workbench:build
node --test tests/workbench-api-client.test.js tests/workbench-shell.test.js
pnpm check
git diff --check
```

Run broader tests if PR-1 through PR-3 touched shared contract helpers, route allowlists, generated assets, or backend projection code used by non-desktop routes.

Reviewer checklist:

- Acceptance evidence covers project launcher, recent projects, selected project binding, project health, degraded states, and boundary absence.
- Closeout text does not overstate packaging or execution support.
- The tag prep section is separate from any actual tag or release action.

## UX Acceptance

The v48 experience is accepted when these checks hold:

- Opening the app shows a project-aware entry before the user has to reason about the repo that launched the sidecar.
- Recent Projects are visible when the backend contract has known projects.
- Empty state says no backend-known recent projects are available.
- Missing state says which contract or route is missing.
- Degraded state says which part of the selected project is unavailable, stale, or failed.
- Project health appears after selection and includes route/source provenance.
- Desktop layout shows launcher, selected project, health, and App Home status without overlap.
- Mobile layout stays single-column or otherwise readable without hidden critical state.
- Provider, goal, child dispatch, job execution, git, tag, publish, GitHub Release, shell, runner, folder-open, scan-disk, and release controls are absent or visibly disabled with non-action copy.
- Evidence refs, command family names, and route names remain inert text unless a later runbook scopes a safe action.

## Cost and Model Policy

Do not use Claude Code or Fable for v48 by default.

Codex and DeepSeek are acceptable for follow-up implementation PRs. Each implementation PR must record:

- provider
- model
- usage if returned by the provider
- cost if returned by the provider
- "usage not returned" or "cost not returned" when the tool does not expose it

This PR-0 planning worker used Codex. Model usage and cost were not returned by the local tool surface.

## Rollback

If PR-0 is wrong, revert only this runbook and replace it before implementation starts.

If PR-1 introduces misleading project data, revert the read model and fixtures before adding selection state.

If PR-2 makes the launcher look actionable without a safe contract, revert the UI change and keep `/workbench/desktop/` on the v47 App Home surface.

If PR-3 selection writes the wrong state or crosses into goal/provider/git/release behavior, revert the selection contract and keep the recent projects read model as display-only.

If generated Workbench assets drift after UI work, rerun `pnpm workbench:build` from the intended source state and review only the generated asset diff tied to that source.

## Follow-up Boundary

v49 or later can consider context/session observability, controlled command-boundary expansion, or a narrower project maintenance workflow. Those follow-ups need separate contracts, tests, and acceptance evidence.

v48 should not expand execution controls. It should only establish project entry, selected project binding, and project health through explicit app/backend contracts.
