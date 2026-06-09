# Local goal supervisor v43+ task-D worker evidence

Task: evidence date, runner snapshot, and worktree cleanup runbook

Local run date: `2026-06-08`

Timezone: `Asia/Shanghai`

UTC generated timestamp: `2026-06-07T18:45:39.713Z`

## Scope

This worker phase changed the temporary external runner:

```text
/Users/andy/.codex/local-goal-supervisor/bin/local-goal-supervisor.mjs
```

Repository changes in this branch record the runbook note and this evidence file. The runner remains outside the product repository.

## Runner Changes

Leased child prompts now include an evidence clock with local run date, timezone, and UTC generated timestamp. The prompt tells workers, reviewers, and verifiers to use the local run date in evidence filenames and to record all three clock values in evidence bodies.

The runner has a new `runner-snapshot` command. The command records the runner script path, script digest, selftest command and result, daemon launcher command, launcher status, doctor command, doctor output citation status, and the fixes supplied through `--fixes`.

The runner has a new `worktree-cleanup-plan` command. The command is non-destructive. It lists worktree goal/task, branch, head, dirty state, merge state, evidence state, cleanup decision, and refusal reasons. Dirty, detached, unmerged, or evidence-incomplete worktrees are preserved.

## Runner Snapshot

Command:

```text
node /Users/andy/.codex/local-goal-supervisor/bin/local-goal-supervisor.mjs runner-snapshot --goal v43-plus-local-goal-supervisor-stability --fixes "task-D added evidence clock propagation; task-D added runner-snapshot; task-D added non-destructive worktree-cleanup-plan; task-D fixed managed runbook cleanup mapping"
```

Result: passed.

Snapshot fields checked:

- script path: `/Users/andy/.codex/local-goal-supervisor/bin/local-goal-supervisor.mjs`
- script digest: `sha256 13e623b4a20f26a67dd2370bf3c6d9d392d9383edf37659f16e0b2c3e0d32522`
- selftest command: `node /Users/andy/.codex/local-goal-supervisor/bin/local-goal-supervisor.mjs selftest`
- selftest result: `passed`
- launcher command: `node /Users/andy/.codex/local-goal-supervisor/bin/local-goal-supervisor.mjs daemon-start --goal v43-plus-local-goal-supervisor-stability --interval-ms 10000 --max-ticks 5000`
- doctor command: `node /Users/andy/.codex/local-goal-supervisor/bin/local-goal-supervisor.mjs doctor --goal v43-plus-local-goal-supervisor-stability`
- doctor output status: `not-run`; the command records the doctor command and accepts `--doctor-output` for an operator-authorized output file

## Worktree Cleanup Plan

Command:

```text
node /Users/andy/.codex/local-goal-supervisor/bin/local-goal-supervisor.mjs worktree-cleanup-plan --goal v43-plus-local-goal-supervisor-stability --repo /Users/andy/Documents/project/multi-coding-agent-symphony --base-ref main
```

Result: passed.

The summarized v43+ task rows were:

```text
task-1 branch v43-plus-task-b-daemon-launcher head f30bde38d8689c006b66502eee786372ff0612ea dirty false merge unmerged evidence evidence-not-merged removalAllowed false
task-2 branch v43-plus-task-c-progress-stall-classifier head 6aed9dad46c7ed72b255d9b0f9c5fa7951f70b43 dirty false merge unmerged evidence evidence-not-merged removalAllowed false
task-3 branch v43-plus-task-d-evidence-worktree-runbook head 6aed9dad46c7ed72b255d9b0f9c5fa7951f70b43 dirty false merge unmerged evidence no-recorded-evidence removalAllowed false
```

Each task worktree was preserved because the branch was not merged into `main`; task-1 and task-2 also had evidence not present on the cleanup base, and task-3 had no recorded evidence yet.

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

Selftest coverage added:

- evidence local date uses the configured timezone.
- `runner-snapshot` returns script digest and doctor citation status without running doctor.
- `worktree-cleanup-plan` blocks dirty, unmerged, evidence-incomplete task worktrees.
- managed runbook registry files that wrap the fixture under `runbook` map task branches correctly.

Command:

```text
git diff --check
```

Result: passed.

Command:

```text
pnpm --silent symphony goal-status --goal v43-plus-local-goal-supervisor-stability --json
```

Result: failed with exit code `64` and `goal not found` from the assigned worktree. The managed goal state exists in the root checkout, but the assigned task worktree does not carry `.symphony`.

## Boundary Notes

This task did not run mutation, audit, doctor, real CLI runner, provider CLI, tag, push, publish, or release closeout commands. It did not create, dispatch, steer, or wait on another Codex thread.
