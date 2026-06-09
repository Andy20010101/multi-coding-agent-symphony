# Local goal supervisor v43+ task-A evidence

Task: blocked-state quiesce and approval resume
Recorded at: `2026-06-08 01:54:07 CST`
Updated at: `2026-06-08 02:00:00 CST`

## Scope

This evidence records a project-external runner fix. The changed script is outside this repository:

```text
/Users/andy/.codex/local-goal-supervisor/bin/local-goal-supervisor.mjs
```

The repository change in this branch only records evidence for the temporary coding system. It does not add a project-internal supervisor module.

## Runner snapshot

- Script digest after task-A and remaining-task bootstrap: `sha256 ff65ee3c14cd3f5e4b391dca3a91bec125e649ee60e66e7299b34dcf9e084673`
- Branch used for evidence: `codex/v43-plus-task-a-runner-quiesce`
- Repository base head before evidence commit: `3b656d7911a6a0f57edb3f5f8e53e559a1be76ba`

## Behavior changed

The runner now handles deterministic operator approval blocks without continuing to write the same daemon tick every interval.

Changes made in the external runner:

- `operatorNoticeKey` ignores phase for the same goal, task, role, and block reason. The release closeout block no longer creates separate notices for `release-gate` and `release-prep`.
- daemon ticks that reach an operator block and create or find an operator notice return `waiting-operator`.
- the daemon loop exits on `waiting-operator` instead of sleeping and ticking again.
- daemon health can report `waiting-operator` without classifying the stopped pid as stale.
- operator notifications include a `resumeCommand` and `requiresDaemonRestart` field.
- the notice prompt shows the exact resume command and whether a daemon restart is required.
- runtime workspace roots now include `/Users/andy/.codex/local-goal-supervisor`, so leased child threads can edit the temporary external runner when the active runbook explicitly asks for local goal supervisor changes.
- bound child prompts now distinguish repo evidence edits from allowed project-external runner edits.

For release closeout, the generated resume command is:

```text
node /Users/andy/.codex/local-goal-supervisor/bin/local-goal-supervisor.mjs daemon --goal <goalId> --interval-ms 10000 --max-ticks 500 --allow-closeout
```

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

Selftest now includes:

- same closeout approval block with phases `release-gate` and `release-prep` uses one operator notice key.
- daemon tick quiesce applies to daemon ticks, not manual ticks.
- daemon health status `waiting-operator` is not treated as stale by pid.
- runtime workspace roots include the target repo, assigned worktree, local goal supervisor root, and result escrow root.

Command:

```text
node /Users/andy/.codex/local-goal-supervisor/bin/local-goal-supervisor.mjs daemon --goal v43-goal-supervisor-stabilization --interval-ms 1000 --max-ticks 1
```

Result: passed.

Observed output:

- daemon status: `stopped`
- waiting operator: `false`
- resume command: none
- tick status: `complete`
- plan status: `complete`
- active thread: none

Doctor after validation:

- generated at: `2026-06-07T17:54:24.457Z`
- plan status: `complete`
- active thread: none
- root branch: `codex/v43-plus-task-a-runner-quiesce`
- root head: `b1180de05d4477cad04ac5007ba4bdd3d53f88aa`
- root dirty: false
- daemon status: `daemon-stopped-with-recent-progress`
- daemon health status: `stopped`
- latest tick: `complete`
- latest plan status: `complete`

## Boundary notes

- This task did not run tag, push, publish, provider CLI commands, real CLI runner commands, mutation gates, audit, or full release gates.
- This task did not create new child threads.
- This task did not change active provider policy.
- This task did not move the external runner into the repository.

## Remaining v43+ work

The next stability items are still open:

- task-B: PTY-backed daemon launcher and stop command.
- task-C: active progress and stall classifier.
- task-D: evidence date/version snapshot and worktree cleanup runbook.
- task-E: project-internal supervisor migration spec.
