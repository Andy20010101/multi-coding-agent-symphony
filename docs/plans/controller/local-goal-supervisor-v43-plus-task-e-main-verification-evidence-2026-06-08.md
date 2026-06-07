# Local goal supervisor v43+ task-E main verification evidence

Task: project-internal supervisor migration spec

Local run date: `2026-06-08`

Timezone: `Asia/Shanghai`

UTC generated timestamp: `2026-06-07T19:01:56Z`

Verified worker result:

```text
/Users/andy/.codex/local-goal-supervisor/results/v43-plus-local-goal-supervisor-stability/019ea36f-a4d5-7de2-880d-d180720a142a.txt
```

Verified reviewer result:

```text
/Users/andy/.codex/local-goal-supervisor/results/v43-plus-local-goal-supervisor-stability/019ea372-f3f9-7bf3-95ce-c21307d63b0f.txt
```

Verified worktree:

```text
/Users/andy/.codex/worktrees/v43-plus-task-e-supervisor-migration-spec
```

Worker evidence ref:

```text
docs/plans/controller/local-goal-supervisor-v43-plus-task-e-worker-evidence-2026-06-08.md
```

Review evidence ref:

```text
docs/plans/controller/local-goal-supervisor-v43-plus-task-e-review-evidence-2026-06-08.md
```

## Verdict

Main verification passed.

The migration spec satisfies task-E acceptance in `docs/plans/app-core-v43-plus-goal-runbooks/v43_plus_local-goal-supervisor-stability_goal_runbook_latest.md` and `fixtures/contracts/goal-runbook.v43-plus-local-goal-supervisor-stability.v1.json`.

## Acceptance Verification

The spec defines the required project-internal supervisor module boundaries:

- single state writer;
- app thread adapter;
- workspace manager;
- result protocol and parser;
- event registrar;
- route engine;
- progress observer;
- operator notification bridge.

The active provider policy remains unchanged:

```text
claude-code-cli
codex-cli
```

The spec keeps raw provider CLI execution, browser terminal automation, generic shell execution, tag automation, push automation, publish automation, GitHub Release automation, unauthorized release closeout, self-approval, and inferred verification out of scope.

The temporary external runner remains the operational path until project-internal parity, tests, dry-run writer previews, staged handoff, and rollback guidance are reviewed and verified.

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

Result: failed with exit code `64` and `goal not found`. The assigned task worktree does not carry the managed `.symphony` goal state, matching worker and reviewer evidence. This does not block main verification of the documentation-only task.

Command:

```text
git status --short --branch
```

Result before this evidence file was added: clean on `v43-plus-task-e-supervisor-migration-spec`.

## Risk Notes

No implementation or provider-execution risk found in this verification. The remaining operational limitation is that managed goal status cannot be read from the assigned task worktree because its `.symphony` goal state is absent.
