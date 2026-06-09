# v44 task-5 review evidence

Date: 2026-06-08

Goal id: `v44-project-internal-goal-supervisor-core`

Task: `task-5` supervisor core projection and migration handoff

Branch: `v44-task-5-core-projection-handoff`

Worktree: `/Users/andy/.codex/worktrees/v44-task-5-core-projection-handoff`

Reviewed head: `77c57e1 Add v44 supervisor core projection handoff`

## Review verdict

Approved.

The worker change matches the task-5 acceptance criteria:

- `src/symphony/goal-supervisor/core-projection.js` renders a read-only `goal-supervisor-core-projection.v1` from managed state, goal-next input, active lease state, app-thread readback, escrow result text, and release gate context.
- `src/symphony/goal-supervisor/index.js` exports the projection surface with the other v44 supervisor core contracts.
- `fixtures/contracts/goal-supervisor/core-projection.v44.replay.v1.json` and `tests/v44-goal-supervisor-core-projection.test.js` cover pending escrow, complete-goal, and closeout-blocked projection paths.
- `docs/plans/v44-task-5-supervisor-core-projection-handoff-2026-06-08.md` keeps daemon ownership, App notice transport, provenance capture, destructive cleanup, live event append confirmation, and release automation outside repository ownership for v44.
- Rollback guidance keeps `/Users/andy/.codex/local-goal-supervisor/bin/local-goal-supervisor.mjs` as the operational path when repository projection and external runner behavior disagree.

## Boundary review

No live daemon owner, provider CLI execution, generic shell runner, browser terminal automation, managed-goal append confirmation, tag, push, publish, or release closeout bypass was introduced.

The `progressGraceMs` addition to `decideGoalSupervisorRoute(...)` is scoped to passing the same grace window through to `observeGoalSupervisorProgress(...)`; existing route tests still pass.

## Commands run

| Command | Result |
| --- | --- |
| `node --test tests/v44-goal-supervisor-core-projection.test.js tests/v44-goal-supervisor-route-progress.test.js tests/v44-goal-supervisor-app-thread-adapter.test.js tests/v44-goal-supervisor-result-protocol.test.js tests/v44-goal-supervisor-state-writer-event-registrar.test.js` | Pass. 24 tests, 5 suites. |
| `pnpm check` | Pass. JavaScript syntax check completed. |
| `pnpm test` | Pass. 1139 tests, 178 suites. |
| `pnpm workbench:build` | Pass. Vite built the Workbench static bundle. |
| `git diff --check 26b04a5132f1b6955b0cb2628fbf860d0c8c1ee1...HEAD` | Pass. No whitespace errors. |

## Risks

No blocking review findings. Main verification should rerun the default v44 checks from the reviewer head and confirm the evidence ref exists in the assigned worktree.
