# v39 task-4 main verification evidence

Goal id: `v39-backup-diagnostics-migration-workspace`  
Task id: `task-4`  
Branch: `v39-task-4-diagnostics-bundle`  
Main verifier thread: `019e96cd-0071-7af3-9cbd-e5415c33203e`  
Verification target: `/Users/andy/.codex/worktrees/v39-task-4-diagnostics-bundle`  
Worker evidence: `docs/plans/v39-task-4-worker-evidence-2026-06-02.md`  
Review evidence: `docs/plans/v39-task-4-review-evidence-2026-06-02.md`  
Base commit: `cd58ec2973748062ccc317859caf0f1ff7f1b9ca`  
Head commit: `0dd311201bb128cfbf55509f5afb6cb7873149dd`

## Verdict

PASSED.

## Scope Verified

The task-4 implementation adds `app-core-diagnostics-bundle.v1` for sanitized App Core diagnostics. The verified path includes the backend contract builder, `symphony diagnostics bundle`, `GET /api/diagnostics/bundle`, Workbench projection, Desktop Shell readiness fields, docs, fixture, and tests.

The verifier did not run merge, tag, push, publish, provider CLI, release closeout, or release-ready registration commands. The leased verification target was the task worktree, not a main-branch merge checkout.

## Commands Run

`pwd && git branch --show-current && git rev-parse HEAD && git rev-parse --show-toplevel`

Result: passed, exit code 0.

```text
/Users/andy/.codex/worktrees/v39-task-4-diagnostics-bundle
v39-task-4-diagnostics-bundle
0dd311201bb128cfbf55509f5afb6cb7873149dd
/Users/andy/.codex/worktrees/v39-task-4-diagnostics-bundle
```

`sed -n '620,820p' docs/plans/app-core-v34-v40-goal-runbooks/v39_backup-diagnostics-migration-workspace_goal_runbook_latest.md`

Result: passed, exit code 0. Confirmed task-4 scope, acceptance, reviewer precondition, and main verification evidence expectation.

`sed -n '1,240p' docs/plans/v39-task-4-worker-evidence-2026-06-02.md`

Result: passed, exit code 0. Worker evidence was present in the verification target and matched the diagnostics bundle scope.

`sed -n '1,240p' docs/plans/v39-task-4-review-evidence-2026-06-02.md`

Result: passed, exit code 0. Reviewer verdict was `APPROVED`.

`git diff --stat cd58ec2973748062ccc317859caf0f1ff7f1b9ca..HEAD && git diff --name-status cd58ec2973748062ccc317859caf0f1ff7f1b9ca..HEAD`

Result: passed, exit code 0. The changed files were scoped to diagnostics bundle implementation, Workbench/API projection, docs, fixture, generated Workbench static output, and task tests.

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
duration_ms 8219.38575
```

`pnpm workbench:build`

Result: passed, exit code 0.

```text
vite v8.0.14 building client environment for production...
17 modules transformed.
src/symphony/workbench-static/index.html                     0.42 kB
src/symphony/workbench-static/assets/index-CILC3208.css     36.97 kB
src/symphony/workbench-static/assets/index-MRhrrIIw.js   1,272.31 kB
built in 184ms
```

`git diff --check cd58ec2973748062ccc317859caf0f1ff7f1b9ca..HEAD`

Result: passed, exit code 0. No whitespace errors.

`pnpm --silent symphony diagnostics bundle --goal v39-backup-diagnostics-migration-workspace --task task-4 --json`

Result: passed, exit code 0. The assigned task worktree has no ignored managed `.symphony` state, so the bundle returned `gateStatus.state: "missing"` while keeping `readOnly: true`, `includesRawLogBodies: false`, `shellExecutionAvailable: false`, `modelInvocationAvailable: false`, and `releaseDecisionAvailable: false`.

`pnpm --silent symphony diagnostics bundle --state-dir /Users/andy/Documents/project/multi-coding-agent-symphony/.symphony --goal v39-backup-diagnostics-migration-workspace --task task-4 --json`

Result: passed, exit code 0. Against the authoritative managed state, the bundle returned `gateStatus.state: "available"`, `taskCount: 5`, `mainVerifiedCount: 3`, `releaseReady: false`, no recent failures, and the same disabled boundary flags.

`pnpm --silent symphony goal-status --goal v39-backup-diagnostics-migration-workspace --json`

Result in the assigned task worktree: failed, exit code 64.

```text
{
  "version": "1",
  "status": "error",
  "exitCode": 64,
  "message": "goal not found"
}
```

Context: the task worktree does not contain the ignored managed `.symphony` goal state. This matches the worker and reviewer evidence caveat.

Same command from `/Users/andy/Documents/project/multi-coding-agent-symphony` with authoritative managed state:

Result: passed, exit code 0.

```text
summary.totalTasks: 5
summary.completedTasks: 4
summary.releaseReady: false
task-4.status: approved
task-4.reviewVerdict: APPROVED
task-4.workerEvidenceRef: docs/plans/v39-task-4-worker-evidence-2026-06-02.md
task-4.reviewEvidenceRef: docs/plans/v39-task-4-review-evidence-2026-06-02.md
task-4.mainVerificationRef: null
nextActions[0].label: Start task-5
```

## Boundary Check

- `GET /api/diagnostics/bundle` accepts only `goal` and `task` query parameters and rejects unsafe refs.
- The backend builder sources status from runtime health, diagnostics, goal ledger, goal event log, and managed run state.
- Recent failure text is redacted and truncated; structured log refs use `managed-state://...` URIs and do not copy stdout, stderr, event bodies, repository source, or artifact payloads.
- The Workbench panel consumes backend contract fields and does not add shell execution, model invocation, arbitrary local file reads, git writes, merge, push, tag, publish, self-approval, or release-ready controls.

## Residual Notes

The assigned task worktree cannot demonstrate populated goal ledger state without pointing the CLI at the authoritative managed `.symphony` state. The implementation handles that by returning a `missing` gate state rather than inferring status from branch, filename, prompt text, or frontend state.
