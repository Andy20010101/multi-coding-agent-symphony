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
- Keep one reusable provenance snapshot that can be attached to later evidence without re-explaining operator shell history.

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

The live snapshot produced on this run recorded:

- snapshot contract: `local-goal-supervisor-runner-snapshot.v2`
- snapshot UTC timestamp: `2026-06-08T02:44:51.912Z`
- runner script digest: `sha256 0b296ea2a4b034800aba9b648b4a46c3b0381b2b10cb31704b89417179586022`
- selftest status: `passed`
- doctor payload digest: `sha256 7c121b7e24e2efa8fb54b60942ad05c32dc79bae264913aabbe9d252c8ac5c66`
- doctor payload bytes: `22902`

The same snapshot also preserved the launcher command that would restart the daemon:

```text
node /Users/andy/.codex/local-goal-supervisor/bin/local-goal-supervisor.mjs daemon-start --goal v43-plus-local-goal-supervisor-stability --interval-ms 10000 --max-ticks 5000
```

The captured doctor summary showed the current live state at snapshot time:

- plan status: `blocked`
- current phase: `release / release-manager / release-prep`
- active progress classification: `stalled`
- daemon status: `stale`
- target worktree branch/head: `v43-plus-task-e-supervisor-migration-spec` at `e27e5e424ca04c0adf8678f47263ce0d2a581c8b`

That is the provenance trail B8 needed: the evidence now cites the exact runner bytes, the selftest status, the launcher command, and the doctor payload that described the run.

## Focused Validation

Commands run:

```text
node --check /Users/andy/.codex/local-goal-supervisor/bin/local-goal-supervisor.mjs
node /Users/andy/.codex/local-goal-supervisor/bin/local-goal-supervisor.mjs selftest
node /Users/andy/.codex/local-goal-supervisor/bin/local-goal-supervisor.mjs runner-snapshot --goal v43-plus-local-goal-supervisor-stability --doctor-output /Users/andy/Documents/project/multi-coding-agent-symphony/docs/plans/controller/local-goal-supervisor-v43-plus-runner-snapshot-doctor-2026-06-08.json > /Users/andy/Documents/project/multi-coding-agent-symphony/docs/plans/controller/local-goal-supervisor-v43-plus-runner-snapshot-2026-06-08.json
```

`selftest` passed with the new B8 coverage in place. The live `runner-snapshot` command then wrote both the snapshot JSON and the full doctor JSON from one command invocation.

## Current Limit

- This change captures provenance for the current runner, but it does not resolve the still-blocked `release-prep` lease shown by the doctor snapshot.
- The provenance contract is still attached to the temporary external runner path under `/Users/andy/.codex/local-goal-supervisor`.
- One future major goal should reuse the same snapshot flow at start-of-run so B8 can move from `watch` to harvested evidence discipline instead of a one-off repair.
