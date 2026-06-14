# v64 First-run Project Setup and Local Settings acceptance

Date: 2026-06-15
Timezone: Asia/Shanghai
Goal: `v64-first-run-project-setup-local-settings`

## Accepted Scope

v64 makes first-run project setup visible and recoverable without turning Workbench into a local file browser, terminal, or provider launcher.

Accepted changes:

- v64 runbook is recorded in `docs/plans/v64-first-run-project-setup-local-settings-runbook-2026-06-14.md`.
- `personalWorkbenchSettings.v1` records first-run state, local settings source, preferences, current project binding, recent projects, recovery actions, blocked reasons, and safety boundaries.
- Ready, missing-settings, stale-binding, invalid project id, secret-like value, and unsafe path fixtures are covered by focused contract tests.
- `/api/settings/personal-workbench` exposes the first-run projection as read-only `GET` state and rejects query/body mutation probes.
- `pnpm --silent symphony runtime settings --json` exposes the same projection for controller inspection without writing repo files.
- Desktop App Home renders a read-only First-run Project Setup panel after Project Launcher and before App Home summary.
- The panel shows current project, settings source, preferred providers, default port, runtime dir ref, recent projects, next safe action, recovery rows, and disabled boundary flags.
- Rebuilt Workbench static assets point to CSS asset `index-C0f--kJC.css` and JS asset `index-DphMY-EF.js`.

Out of scope:

- generic shell or terminal UI;
- renderer command execution;
- full disk scanning;
- arbitrary renderer path input or path reads;
- local JSONL, session, provider folder, raw transcript, or raw model output reads;
- secret storage in local settings;
- provider launch or provider execution from first-run state;
- automatic goal creation, self-review, worktree creation, next-version goal creation, git write, tag write, release write, public distribution, notarization, or auto-update claims.

## Evidence

| Check | Result |
| --- | --- |
| `node --test tests/v64-first-run-project-setup-local-settings.test.js` | Passed: 5 tests, 5 passed. |
| `node --test tests/workbench-api-client.test.js` | Passed: 67 tests, 67 passed. A non-failing Vite WebSocket warning reported port `24678` already in use. |
| `node --test tests/workbench-shell.test.js` | Passed: 44 tests, 44 passed. |
| `node --test tests/v64-first-run-project-setup-local-settings.test.js tests/workbench-route-smoke.test.js` | Passed: 17 tests, 17 passed. |
| `pnpm workbench:build` | Passed. Built `src/symphony/workbench-static/index.html`, CSS asset `index-C0f--kJC.css`, and JS asset `index-DphMY-EF.js`. |
| `pnpm check` | Passed. |
| `pnpm test` | Passed: 1377 tests, 1377 passed. A non-failing Vite WebSocket warning reported port `24678` already in use. |
| `git diff --check` | Passed. |
| `git diff --cached --check` | Passed. |

## Acceptance Criteria

| Criterion | Evidence |
| --- | --- |
| First-run state is backed by explicit contracts and fixtures. | `src/symphony/personal-workbench-settings-contracts.js`, `fixtures/contracts/personal-workbench-settings/*.json`, and `tests/v64-first-run-project-setup-local-settings.test.js`. |
| Workbench shows project and settings source without adding execution. | `frontend/workbench/src/App.jsx` renders `DesktopFirstRunProjectSetupPanel`; `tests/workbench-shell.test.js` asserts no button, form, input, textarea, fetch, window open, clipboard, provider launch, shell, tag, or release controls in the panel. |
| Backend route is read-only and rejects unsafe probes. | `tests/workbench-api-client.test.js` covers `GET /api/settings/personal-workbench`, query rejection, and `POST` rejection. |
| Missing and stale recovery is visible but inert. | Missing settings and stale binding fixtures expose copy-only recovery actions with `willMutate: false`; Workbench SSR asserts those rows render. |
| Raw local data and secrets stay outside payloads. | Contract tests reject secret-like values, local sessions, raw provider refs, arbitrary paths, and boundary drift. |
| Closeout records validation, rollback, and next handoff. | `docs/plans/v64-first-run-project-setup-local-settings-closeout-snapshot-2026-06-14.md` and `docs/plans/v65-provider-readiness-codex-claude-only-runbook-2026-06-14.md`. |

## Residual Risk

v64 does not ship an interactive first-run wizard or settings writer. It exposes read-only state, backend-known project binding, recent projects, and recovery guidance. A future settings write flow must use backend-owned preview/confirm or another explicit manual controller path.

v64 does not prove provider readiness. Preferred providers are preferences only; v65 owns Codex and Claude Code readiness.

## Rollback

If settings payloads expose secrets, raw provider paths, local sessions, raw transcripts, or raw model output, revert PR #137 and dependent PRs.

If `/api/settings/personal-workbench` accepts arbitrary paths, writes settings from renderer input, or expands beyond read-only state, revert PR #138.

If Desktop App Home adds first-run execution controls, provider launch, file open, or mutation buttons, revert PR #139 and keep Project Launcher as the visible project surface.
