# v44 task-5 supervisor core projection handoff

Date: 2026-06-08

Goal id: `v44-project-internal-goal-supervisor-core`

## Repository-owned projection

`src/symphony/goal-supervisor/core-projection.js` composes the v44 result parser, app-thread adapter, route engine, and progress observer into `goal-supervisor-core-projection.v1`.

The projection is read-only. It renders:

- the current route decision from managed goal input and active lease state;
- the progress state for active child, pending result, stalled child, blocked route, or complete goal;
- the escrow-first result consumer status when an expected result context is supplied;
- the v44 migration boundary and rollback path.

The module is exported through `src/symphony/goal-supervisor/index.js`. Tests use `fixtures/contracts/goal-supervisor/core-projection.v44.replay.v1.json` to replay a pending escrow result, a complete goal, and a release-manager route that remains blocked without operator authorization.

## Still external after v44

The operational runner remains:

```text
/Users/andy/.codex/local-goal-supervisor/bin/local-goal-supervisor.mjs
```

These paths stay outside repository ownership in v44:

- daemon launch and PTY-backed process ownership;
- App notice-thread transport details;
- external-runner provenance capture mechanics;
- destructive task-worktree cleanup execution;
- live managed-goal event append confirmation;
- tag, push, publish, and release automation.

The repository module may read and project state, parse results, classify progress, and build dry-run write previews. It must not become the live daemon owner in v44.

## Rollback guidance

If the repository projection disagrees with the temporary runner, keep the temporary runner as the operational path and treat the projection output as comparison evidence. Do not retire the external runner until a later release proves route, progress, result consumption, write-preview, and event-registration parity through main verification.

Rollback action:

```text
continue using /Users/andy/.codex/local-goal-supervisor/bin/local-goal-supervisor.mjs
```

The rollback path does not require tag, push, publish, provider CLI, mutation, audit, doctor, or release closeout commands.
