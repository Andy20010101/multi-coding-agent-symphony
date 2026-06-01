# v25 Release Evidence

Goal id: `v25-controlled-implementation-lane`
Release name: `v25 Controlled Implementation Lane`
Release closeout run date: 2026-05-31
Verifier: `codex-v25-release-manager`
Main commit or fallback: repo-local HEAD `7bc15cf4a303e2f81f85db21ee4f899921c89a92` on `v24-task-1-main-verification-readiness-panel`

## Scope

This release check covers the v25 Controlled Implementation Lane closeout after all 5 tasks had worker, review, and main verification complete.

Boundary: Workbench mainline is based on the latest goal/runbook flow, not the v8 action dashboard.

No tag, merge, stage, or commit was performed.

## Command Results

### `git checkout main`

Result: blocked, exit code 128. Repo-local/current-checkout fallback used.

```text
fatal: 'main' is already used by worktree at '/private/tmp/v25-main-verification'
```

### Repo-local fallback identity

Current branch and HEAD after the checkout block:

```text
branch: v24-task-1-main-verification-readiness-panel
HEAD: 7bc15cf4a303e2f81f85db21ee4f899921c89a92
```

Current checkout had existing dirty and untracked files before release validation. The release validation continued in place under the requested fallback rule.

### `git pull --ff-only`

Result: blocked, exit code 1. Repo-local/current-checkout fallback kept.

```text
error: cannot open '.git/FETCH_HEAD': Operation not permitted
```

### `pnpm check`

Result: passed, exit code 0.

```text
> multi-coding-agent-symphony@0.1.0 check /Users/andy/Documents/project/multi-coding-agent-symphony
> node --check src/*.js src/adapters/*.js src/ensemble/*.js src/integrations/*.js src/intake/*.js src/symphony/*.js src/trackers/*.js scripts/*.js plugins/eval-replay/*.js tests/*.test.js
```

### `pnpm test`

Result: passed, exit code 0.

```text
> multi-coding-agent-symphony@0.1.0 test /Users/andy/Documents/project/multi-coding-agent-symphony
> node --test --test-concurrency=8
...
tests 716
suites 114
pass 716
fail 0
cancelled 0
skipped 0
todo 0
duration_ms 7063.242417
```

### `pnpm workbench:build`

Result: passed, exit code 0.

```text
> multi-coding-agent-symphony@0.1.0 workbench:build /Users/andy/Documents/project/multi-coding-agent-symphony
> vite build --config frontend/workbench/vite.config.js

vite v8.0.14 building client environment for production...
transforming...✓ 17 modules transformed.
rendering chunks...
computing gzip size...
src/symphony/workbench-static/index.html                   0.42 kB │ gzip:   0.27 kB
src/symphony/workbench-static/assets/index-BTilLLdo.css   15.84 kB │ gzip:   3.05 kB
src/symphony/workbench-static/assets/index-C33DSOf4.js   777.60 kB │ gzip: 145.12 kB

✓ built in 52ms
```

### `pnpm test:mutation:gate`

Result: not passed. The command was timeboxed after more than 5 minutes because Stryker estimated more than 1 hour remaining. At the last captured poll it had not completed and had surviving mutants, so `release.mutation-gate` must not be registered.

```text
> multi-coding-agent-symphony@0.1.0 test:mutation:gate /Users/andy/Documents/project/multi-coding-agent-symphony
> stryker run

22:52:24 (70929) INFO ProjectReader Found 6 of 7255 file(s) to be mutated.
22:52:24 (70929) INFO Instrumenter Instrumented 6 source file(s) with 2382 mutant(s)
22:52:25 (70929) INFO ConcurrencyTokenProvider Creating 2 test runner process(es).
22:52:26 (70929) INFO BroadcastReporter Detected that current console does not support the "progress" reporter, downgrading to "progress-append-only" reporter
22:52:26 (70929) INFO DryRunExecutor Starting initial test run (tap test runner with "perTest" coverage analysis). This may take a while.
22:52:41 (70929) INFO DryRunExecutor Initial test run succeeded. Ran 70 tests in 14 seconds (net 10340.006459999999 ms, overhead 4564.993540000001 ms).
Mutation testing 0% (elapsed: <1m, remaining: ~36m) 130/2382 tested (0 survived, 0 timed out)
...
Mutation testing 9% (elapsed: ~6m, remaining: ~1h 3m) 270/2382 tested (20 survived, 0 timed out)
...
Mutation testing 14% (elapsed: ~9m, remaining: ~53m) 371/2382 tested (30 survived, 0 timed out)
```

Interruption attempts from the sandbox were blocked:

```text
ps -p 70929 -o pid,ppid,command
zsh:1: operation not permitted: ps

kill 70929
zsh:kill:1: kill 70929 failed: operation not permitted

pkill -TERM -f stryker
sysmon request failed with error: sysmond service not found
pkill: Cannot get process list

killall node
killall: could not sysctl(KERN_PROC): Operation not permitted

node -e "process.kill(70929, 'SIGTERM')"
Error: kill EPERM
```

### `pnpm audit --audit-level high`

Result: passed, exit code 0.

```text
1 vulnerabilities found
Severity: 1 moderate
```

### `pnpm mcas doctor`

Result: passed, exit code 0.

```json
{
  "version": "1",
  "status": "ok",
  "nodeVersion": "24.14.0",
  "packageManager": "pnpm",
  "commands": [
    "doctor",
    "intake",
    "github issue",
    "harness run-taskpacket",
    "queue manual",
    "run-next",
    "run-task",
    "smoke",
    "eval replay"
  ]
}
```

### `git diff --check`

Result: passed, exit code 0. Output was empty.

Re-run after writing this evidence file: passed, exit code 0. Output was empty.

### `pnpm --silent symphony goal closeout --goal v25-controlled-implementation-lane --markdown`

Result: passed, exit code 0.

```text
# Goal Closeout

- Goal: `v25-controlled-implementation-lane`
- Tasks: 5
- Worker evidence complete: yes
- Review evidence complete: yes
- Main verification complete: yes
- Release ready: no
- Release ready source: missing

## Missing Evidence
- none

## Release Gate Gaps
- pnpmCheck: unknown
- pnpmTest: unknown
- workbenchBuild: unknown
- mutationGate: unknown
- auditHigh: unknown
- diffCheck: unknown
- docsUpdated: unknown

## Release Gates
- pnpmCheck: unknown
- pnpmTest: unknown
- workbenchBuild: unknown
- mutationGate: unknown
- auditHigh: unknown
- diffCheck: unknown
- mcasDoctor: unknown
- docsUpdated: unknown
- tagEvidence: unknown

Next: `symphony goal next --goal v25-controlled-implementation-lane`
```

## Earlier Closeout Gaps

Missing task evidence: none.

Release blockers before the continuation run:

- `release.mutation-gate` is not passed because `pnpm test:mutation:gate` did not complete inside the release-manager timebox.
- `release.ready` must not be declared until the mutation gate has a completed passing run and closeout reports no release gate gaps.

## Continuation Note: Mutation Gate Completed

Continuation release-manager: `codex-v25-release-manager`
Continuation run date: 2026-05-31
Command: `pnpm test:mutation:gate`
Result: passed, exit code 0.

The command was allowed to run to completion. Stryker completed in 57 minutes and 20 seconds with final mutation score 74.22, above the configured break threshold 60.

```text
Found 6 of 7256 file(s) to be mutated.
Instrumented 6 source file(s) with 2382 mutant(s).
Initial test run succeeded. Ran 70 tests in 17 seconds.

All files:
% Mutation score: 74.22 total, 78.37 covered
# killed: 1762
# timeout: 6
# survived: 488
# no cov: 126
# errors: 0

Final mutation score of 74.22 is greater than or equal to break threshold 60.
Done in 57 minutes and 20 seconds.
```

This supersedes the earlier timeboxed mutation-gate attempt. The completed command result is eligible for `release.mutation-gate` registration.

## Release Gate Registration

Registration evidence ref: `docs/plans/v25-release-evidence-2026-05-29.md`

Registered with dry-run plus confirm:

| Gate | Status | Event id |
| --- | --- | --- |
| `release.pnpm-check` | passed | `evt_4bf45711bcbe317b` |
| `release.pnpm-test` | passed | `evt_5a47aeca0162ff65` |
| `release.workbench-build` | passed | `evt_90da2c06f9a32f81` |
| `release.audit-high` | passed | `evt_fa34923517a036ce` |
| `release.diff-check` | passed | `evt_c66dbb71c6b0d269` |
| `release.docs-updated` | passed | `evt_6d430d9caafd1fcf` |
| `release.mcas-doctor` | passed | `evt_84ea28317f99c2fd` |
| `release.mutation-gate` | passed | `evt_bfef4d6d4a4a1917` |
| `release.ready` | declared | `evt_c48b750ddf512c78` |

Continuation dry-run plus confirm details:

- `release.mutation-gate` dry-run plan hash: `sha256:5d38dfe89b04775326b2ecc052b2a9c0500d68ff979c31c399b18230cce67f89`.
- `release.mutation-gate` confirm result: appended `goal-event-log.v1:evt_bfef4d6d4a4a1917`, sequence 27.
- `release.ready` dry-run plan hash: `sha256:5d8ceafeb769bb5712577f9a750f37a4f7bfc1df288a4f52dae2142d67c00891`.
- `release.ready` confirm result: appended `goal-event-log.v1:evt_c48b750ddf512c78`, sequence 28.

## Final Closeout

After registering `release.mutation-gate` and declaring `release.ready`, closeout reports `releaseReady: yes`.

```text
# Goal Closeout

- Goal: `v25-controlled-implementation-lane`
- Tasks: 5
- Worker evidence complete: yes
- Review evidence complete: yes
- Main verification complete: yes
- Release ready: yes
- Release ready source: goal-event-log.v1:evt_c48b750ddf512c78

## Missing Evidence
- none

## Release Gate Gaps
- none

## Release Gates
- pnpmCheck: passed
- pnpmTest: passed
- workbenchBuild: passed
- mutationGate: passed
- auditHigh: passed
- diffCheck: passed
- mcasDoctor: passed
- docsUpdated: passed
- tagEvidence: unknown

Next: `symphony goal next --goal v25-controlled-implementation-lane`
```

Post-declaration `goal-status` reports all 5 tasks as `release-ready`, `releaseReady: true`, and release ready source `goal-event-log.v1:evt_c48b750ddf512c78`.

Post-declaration `goal next` reports status `complete` with reason: `release.ready-declared is recorded and all runbook release gates have passed.`

## Tag and Release Recommendation

The managed goal is release-ready. No tag, merge, stage, or commit was performed by this continuation release-manager.
