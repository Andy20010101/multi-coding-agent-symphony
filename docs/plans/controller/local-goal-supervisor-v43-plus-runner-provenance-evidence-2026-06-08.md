# v43+ Local Goal Supervisor Runner Provenance Evidence

Local run date: 2026-06-08
Timezone: Asia/Shanghai

Goal id: `v43-plus-local-goal-supervisor-stability`
Backlog item: `B8`

Implementation target:

```text
/Users/andy/.codex/local-goal-supervisor/bin/local-goal-supervisor.mjs
```

Captured snapshot artifacts:

- `docs/plans/controller/local-goal-supervisor-v43-plus-runner-snapshot-2026-06-08.json`
- `docs/plans/controller/local-goal-supervisor-v43-plus-runner-snapshot-doctor-2026-06-08.json`

## Purpose

- Make major external-runner runs cite the exact script revision that produced the result.
- Remove the manual gap where `runner-snapshot` only remembered a doctor command string but did not capture doctor output itself.
- Keep one reusable provenance snapshot that later evidence can cite without re-explaining operator shell history.

## Change Summary

`runner-snapshot` now captures doctor output directly instead of only pointing at an operator-prepared file.

The snapshot contract now records:

- runner script path and SHA-256 digest
- selftest command and status
- daemon launcher command and current launcher health
- doctor command, SHA-256 digest, byte count, generated timestamp, and bounded doctor summary

When `--doctor-output <path>` is supplied, the same command now writes the full doctor payload to that path and records the written artifact in the snapshot. When the flag is omitted, the snapshot keeps the doctor payload inline.

Selftest now covers both paths:

- inline doctor capture
- captured doctor payload written to a file

## Captured Result

The refreshed snapshot pair produced on this run recorded:

- snapshot contract: `local-goal-supervisor-runner-snapshot.v2`
- snapshot UTC timestamp: `2026-06-08T06:50:20.626Z`
- runner script digest: `sha256 f1d4b2c15ba346c10edb0c5a123739030267fde7aeae2fd6b531a44dd2ab109a`
- selftest status: `passed`
- doctor payload digest: `sha256 9e3c5ef94add2c58a1a119f5f54510a94f5ae51c862660113ca5248a737ac0ad`
- doctor payload bytes: `8958`

The same snapshot also preserved the launcher command that would restart the daemon:

```text
node /Users/andy/.codex/local-goal-supervisor/bin/local-goal-supervisor.mjs daemon-start --goal v43-plus-local-goal-supervisor-stability --interval-ms 10000 --max-ticks 5000
```

The captured doctor summary showed the current live state at snapshot time:

- plan status: `complete`
- active thread: none
- active progress classification: none
- daemon status: `stale`
- root branch/head: `codex/v43-plus-task-a-runner-quiesce` at `f84b1c4f9834923b1c8a60604c719190e447f8ad`
- target worktree branch/head: `v43-plus-task-e-supervisor-migration-spec` at `e27e5e424ca04c0adf8678f47263ce0d2a581c8b`

The snapshot also recorded:

- `externalRunnerFixesSinceLastRelease[0]`: `B6 activeProgress surfaced through context and heartbeat summary`
- `externalRunnerFixesSinceLastRelease[1]`: `B7 operator notice payload exposed through context and live replayed through daemon`

That is the provenance trail B8 needed: the evidence now cites the exact runner bytes, the selftest status, the launcher command, the doctor payload that described the run, and the bounded list of runner-only fixes carried after the last release.

## Snapshot Reuse

This refreshed pair is now the shared provenance baseline for later v43+ evidence on the same runner revision.

The operator notice replay evidence now cites these same artifacts instead of restating standalone runner digest notes:

- `docs/plans/controller/local-goal-supervisor-v43-plus-runner-snapshot-2026-06-08.json`
- `docs/plans/controller/local-goal-supervisor-v43-plus-runner-snapshot-doctor-2026-06-08.json`

That closes the earlier discipline gap where the snapshot existed as a one-off repair but later evidence still relied on ad hoc script references.

## Focused Validation

Commands run:

```text
node --check /Users/andy/.codex/local-goal-supervisor/bin/local-goal-supervisor.mjs
node /Users/andy/.codex/local-goal-supervisor/bin/local-goal-supervisor.mjs selftest
node /Users/andy/.codex/local-goal-supervisor/bin/local-goal-supervisor.mjs runner-snapshot --goal v43-plus-local-goal-supervisor-stability --doctor-output /Users/andy/Documents/project/multi-coding-agent-symphony/docs/plans/controller/local-goal-supervisor-v43-plus-runner-snapshot-doctor-2026-06-08.json --fixes 'B6 activeProgress surfaced through context and heartbeat summary;B7 operator notice payload exposed through context and live replayed through daemon' > /Users/andy/Documents/project/multi-coding-agent-symphony/docs/plans/controller/local-goal-supervisor-v43-plus-runner-snapshot-2026-06-08.json
```

`selftest` passed with the B8 coverage in place. The live `runner-snapshot` command then rewrote both the snapshot JSON and the full doctor JSON from one command invocation, and later evidence in this branch now cites that refreshed pair directly.

## Remaining Limit

- Because the snapshot artifacts themselves are written into the repository during capture, the doctor payload sees the root checkout as dirty at snapshot time even though the underlying task state is otherwise clean.
- The provenance contract is still attached to the temporary external runner path under `/Users/andy/.codex/local-goal-supervisor`.
