# Local goal supervisor v43+ task-E review evidence

Task: project-internal supervisor migration spec

Local run date: `2026-06-08`

Timezone: `Asia/Shanghai`

UTC generated timestamp: `2026-06-07T19:09:00Z`

Reviewed worker result:

```text
/Users/andy/.codex/local-goal-supervisor/results/v43-plus-local-goal-supervisor-stability/019ea36f-a4d5-7de2-880d-d180720a142a.txt
```

Reviewed worktree:

```text
/Users/andy/.codex/worktrees/v43-plus-task-e-supervisor-migration-spec
```

Reviewed head:

```text
fb13f951a51aea97af1efbd1562156bfe1eabd02
```

## Verdict

Approved.

The migration spec satisfies the task-E acceptance criteria in `docs/plans/app-core-v43-plus-goal-runbooks/v43_plus_local-goal-supervisor-stability_goal_runbook_latest.md` and `fixtures/contracts/goal-runbook.v43-plus-local-goal-supervisor-stability.v1.json`.

## Acceptance Review

The spec defines the required module boundaries:

- single state writer;
- app thread adapter;
- workspace manager;
- result protocol and parser;
- event registrar;
- route engine;
- progress observer;
- operator notification bridge.

The active provider policy remains limited to:

```text
claude-code-cli
codex-cli
```

The spec explicitly keeps raw provider CLI execution, browser terminal automation, generic shell execution, tag automation, push automation, publish automation, GitHub Release automation, unauthorized release closeout, self-approval, and inferred verification out of scope.

The temporary external runner remains the operational path until the project-internal module has reviewed parity, tests, dry-run writer previews, staged handoff, and rollback guidance.

## Diff Review

Changed files:

- `docs/plans/controller/README.md`
- `docs/plans/controller/local-goal-supervisor-v43-plus-task-e-project-internal-supervisor-migration-spec-2026-06-08.md`
- `docs/plans/controller/local-goal-supervisor-v43-plus-task-e-worker-evidence-2026-06-08.md`

The README update only adds the task-E spec to the controller folder index. The new spec is documentation-only and does not add product execution code, provider execution, release automation, or state mutation paths.

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
git diff --check c018e5c0fc982947e9cfe2de3935442a0897f2db..HEAD
```

Result: passed.

Command:

```text
pnpm --silent symphony goal-status --goal v43-plus-local-goal-supervisor-stability --json
```

Result: failed with exit code `64` and `goal not found`. The assigned task worktree does not include the managed `.symphony` goal state, matching the worker evidence limitation. This does not block review of the documentation change.

## Risks

No implementation risk found in this review. Main verification should use the same worker worktree and evidence ref because the managed goal state is absent from the assigned task worktree.
