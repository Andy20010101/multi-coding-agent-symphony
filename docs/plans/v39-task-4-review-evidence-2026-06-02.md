# v39 task-4 review evidence

Goal id: `v39-backup-diagnostics-migration-workspace`  
Task id: `task-4`  
Branch: `v39-task-4-diagnostics-bundle`  
Reviewer thread: `019e96c9-5d53-7081-b8f0-52c3c470a150`  
Review target: `/Users/andy/.codex/worktrees/v39-task-4-diagnostics-bundle`  
Base commit: `cd58ec2973748062ccc317859caf0f1ff7f1b9ca`  
Head commit: `0dd311201bb128cfbf55509f5afb6cb7873149dd`

## Verdict

APPROVED.

## What changed

The branch adds `app-core-diagnostics-bundle.v1` for v39 task-4. The bundle reports sanitized runtime health, contract versions, diagnostics check counts, gate status, recent failure summaries, and structured managed-state log refs.

The user path is visible in Workbench through `GET /api/diagnostics/bundle` and the `Diagnostics Bundle` panel. The CLI path is `symphony diagnostics bundle --goal <goal-id> --task <task-id> --json`.

## Review checks

- The backend bundle builder validates the output contract and marks the payload read-only.
- Recent failures are sourced from goal event journals and managed run state, then redacted before display.
- Log output is limited to structured refs such as `managed-state://...`; raw stdout/stderr or event bodies are not copied into the bundle.
- Workbench accepts only `goal` and `task` query parameters for the diagnostics bundle route and rejects unsafe refs.
- The React panel consumes the projected backend contract. It does not add shell execution, model invocation, local file opening, git write, merge, push, tag, publish, or release-ready controls.
- The new `--state-dir` CLI option matches the existing v39 backup export operator pattern and is not exposed as a Workbench arbitrary path read.

## Commands run

`pwd && git branch --show-current && git rev-parse HEAD && git rev-parse --show-toplevel`

Result: passed, exit code 0. Confirmed the assigned review target:

```text
/Users/andy/.codex/worktrees/v39-task-4-diagnostics-bundle
v39-task-4-diagnostics-bundle
0dd311201bb128cfbf55509f5afb6cb7873149dd
/Users/andy/.codex/worktrees/v39-task-4-diagnostics-bundle
```

`sed -n '637,820p' docs/plans/app-core-v34-v40-goal-runbooks/v39_backup-diagnostics-migration-workspace_goal_runbook_latest.md`

Result: passed, exit code 0. Confirmed task-4 scope, reviewer expectations, and evidence path.

`sed -n '1,260p' docs/plans/v39-task-4-worker-evidence-2026-06-02.md`

Result: passed, exit code 0. Worker evidence was present and matched the task-4 diagnostics bundle scope.

`git diff --stat cd58ec2973748062ccc317859caf0f1ff7f1b9ca..HEAD && git diff --name-status cd58ec2973748062ccc317859caf0f1ff7f1b9ca..HEAD`

Result: passed, exit code 0. Reviewed the task-4 file set and confirmed the diff is scoped to diagnostics bundle implementation, Workbench projection/panel updates, docs, fixture, generated static Workbench output, and tests.

`pnpm check`

Result: passed, exit code 0.

```text
node --check src/*.js src/adapters/*.js src/ensemble/*.js src/integrations/*.js src/intake/*.js src/symphony/*.js src/trackers/*.js scripts/*.js plugins/eval-replay/*.js tests/*.test.js
```

`pnpm test`

Result: passed, exit code 0.

```text
tests 1026
suites 160
pass 1026
fail 0
cancelled 0
skipped 0
todo 0
duration_ms 7627.874917
```

`pnpm workbench:build`

Result: passed, exit code 0.

```text
vite v8.0.14 building client environment for production...
17 modules transformed.
src/symphony/workbench-static/index.html                     0.42 kB
src/symphony/workbench-static/assets/index-CILC3208.css     36.97 kB
src/symphony/workbench-static/assets/index-MRhrrIIw.js   1,272.31 kB
built in 208ms
```

`git diff --check cd58ec2973748062ccc317859caf0f1ff7f1b9ca..HEAD`

Result: passed, exit code 0. No whitespace errors.

`node - <<'NODE' ... buildAppCoreDiagnosticsBundle(...) ... NODE`

Result: passed, exit code 0.

```json
{
  "contractName": "app-core-diagnostics-bundle.v1",
  "health": "warning",
  "gateState": "missing",
  "recentFailures": 0,
  "logRefs": 1,
  "rawBodies": false,
  "shell": false
}
```

The assigned worktree does not contain the ignored managed `.symphony` goal state, so `gateState` is `missing` there. The worker evidence records the same managed-state caveat for `goal-status`; this does not change the reviewed code boundary.

## Blocking findings

None.

## Risks

- The assigned task worktree has no ignored managed `.symphony` state, so local route/CLI output cannot demonstrate populated gate status from that checkout alone. Worker evidence records a root-checkout managed-state pass for the active v39 goal.
- Generated static Workbench output changed as part of `pnpm workbench:build`; this matches existing repository practice for Workbench tasks.
