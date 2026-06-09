# v44 task-5 worker evidence

Date: 2026-06-08

Goal id: `v44-project-internal-goal-supervisor-core`

Task: `task-5` supervisor core projection and migration handoff

Branch: `v44-task-5-core-projection-handoff`

Worktree: `/Users/andy/.codex/worktrees/v44-task-5-core-projection-handoff`

## Implementation result

Added `goal-supervisor-core-projection.v1` in `src/symphony/goal-supervisor/core-projection.js`.

The projection composes the existing v44 repository-owned contracts:

- app-thread normalization and escrow-first result availability;
- route decision from `decideGoalSupervisorRoute(...)`;
- progress state from `observeGoalSupervisorProgress(...)`;
- migration handoff fields that keep the temporary external runner as the operational fallback.

`src/symphony/goal-supervisor/index.js` exports the projection module. `src/symphony/goal-supervisor/route-progress.js` now accepts `progressGraceMs` in `decideGoalSupervisorRoute(...)` so projection tests can replay the same grace window used by the progress observer.

## Handoff and rollback docs

Added `docs/plans/v44-task-5-supervisor-core-projection-handoff-2026-06-08.md`.

The handoff doc states that this repository owns read-only parity and dry-run previews after v44. It also lists the paths that remain external:

- daemon launch and PTY-backed process ownership;
- App notice-thread transport details;
- external-runner provenance capture mechanics;
- destructive task-worktree cleanup execution;
- live managed-goal event append confirmation;
- tag, push, publish, and release automation.

Rollback keeps this temporary runner as the operational path:

```text
/Users/andy/.codex/local-goal-supervisor/bin/local-goal-supervisor.mjs
```

## Replay coverage

Added `fixtures/contracts/goal-supervisor/core-projection.v44.replay.v1.json` and `tests/v44-goal-supervisor-core-projection.test.js`.

The replay fixture covers:

- a valid escrow result that renders `pending-result` route and progress state even when the thread read is `notLoaded`;
- a complete goal with no active lease;
- a release-manager route that remains blocked without operator authorization.

## Commands run

| Command | Result |
| --- | --- |
| `node --test tests/v44-goal-supervisor-core-projection.test.js tests/v44-goal-supervisor-route-progress.test.js tests/v44-goal-supervisor-app-thread-adapter.test.js tests/v44-goal-supervisor-result-protocol.test.js tests/v44-goal-supervisor-state-writer-event-registrar.test.js` | Pass. 24 tests, 5 suites. |
| `pnpm check` | Pass. JavaScript syntax check completed. |
| `pnpm test` | Pass. 1139 tests, 178 suites. |
| `pnpm workbench:build` | Pass. Vite built the Workbench static bundle. |
| `git diff --check` | Pass. No whitespace errors. |

## Boundary check

This task did not add a live daemon owner, provider CLI execution, generic shell runner, browser terminal automation, live managed-goal append, release closeout authorization bypass, tag automation, push automation, or publish automation.

The repository projection is comparison evidence for later handoff. The temporary external runner remains the v44 fallback.
