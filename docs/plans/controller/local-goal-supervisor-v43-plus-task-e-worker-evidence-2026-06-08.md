# Local goal supervisor v43+ task-E worker evidence

Task: project-internal supervisor migration spec

Local run date: `2026-06-08`

Timezone: `Asia/Shanghai`

UTC generated timestamp: `2026-06-07T18:55:26Z`

## Scope

This worker phase added the migration spec for moving the temporary external supervisor toward a project-internal supervisor module:

```text
docs/plans/controller/local-goal-supervisor-v43-plus-task-e-project-internal-supervisor-migration-spec-2026-06-08.md
```

The temporary runner remains outside the repository:

```text
/Users/andy/.codex/local-goal-supervisor/bin/local-goal-supervisor.mjs
```

This task did not modify the external runner and did not add product execution code.

## Spec Coverage

The spec defines these project-internal module boundaries:

- single state writer;
- app thread adapter;
- workspace manager;
- result protocol and parser;
- event registrar;
- route engine;
- progress observer;
- operator notification bridge.

The spec keeps the active provider policy unchanged:

```text
claude-code-cli
codex-cli
```

It explicitly keeps these items out of scope:

- raw provider CLI execution;
- browser terminal automation;
- generic shell runner;
- tag, push, publish, and GitHub Release automation;
- unauthorized release closeout;
- self-approval or inferred reviewer/main-verifier outcomes.

The spec also states that the temporary runner remains usable while project-internal work is planned, and that retirement needs reviewed parity, tests, dry-run writer previews, staged handoff, and rollback guidance.

## Repository Changes

- Added `docs/plans/controller/local-goal-supervisor-v43-plus-task-e-project-internal-supervisor-migration-spec-2026-06-08.md`.
- Added this worker evidence file.
- Updated `docs/plans/controller/README.md` so the controller folder index includes the task-E migration spec.

## Validation

Command:

```text
node --check /Users/andy/.codex/local-goal-supervisor/bin/local-goal-supervisor.mjs
```

Result: passed.

Command:

```text
node /Users/andy/.codex/local-goal-supervisor/bin/local-goal-supervisor.mjs selftest
```

Result: passed.

Command:

```text
git diff --check
```

Result: passed.

Command:

```text
pnpm --silent symphony goal-status --goal v43-plus-local-goal-supervisor-stability --json
```

Result: failed with exit code `64` and `goal not found` from the assigned worktree. This matches task-D evidence: the assigned task worktree does not carry the root checkout's managed `.symphony` goal state.

## Boundary Notes

This task did not run mutation, audit, doctor, real CLI runner, provider CLI, tag, push, publish, release closeout, or event registration commands. It did not create, dispatch, steer, or wait on another Codex thread.
