# v39 task-4 main verification evidence

Goal id: `v39-backup-diagnostics-migration-workspace`  
Task id: `task-4`  
Branch: `v39-task-4-diagnostics-bundle`  
Main verifier thread: `019e96cf-87ee-7070-9c78-4f0401098a00`  
Verification target: `/Users/andy/.codex/worktrees/v39-task-4-diagnostics-bundle`  
Worker evidence: `docs/plans/v39-task-4-worker-evidence-2026-06-02.md`  
Review evidence: `docs/plans/v39-task-4-review-evidence-2026-06-02.md`  
Base commit: `cd58ec2973748062ccc317859caf0f1ff7f1b9ca`  
Head commit: `0dd311201bb128cfbf55509f5afb6cb7873149dd`

## Verdict

PASSED.

## Preconditions checked

- Worker evidence is present in the verification target: `docs/plans/v39-task-4-worker-evidence-2026-06-02.md`.
- Reviewer evidence is present in the verification target: `docs/plans/v39-task-4-review-evidence-2026-06-02.md`.
- Reviewer verdict is `APPROVED`.
- Verification used the assigned task-4 worktree from the lease. The runbook's main-branch merge step was not run because this leased phase allowed verification in the assigned worktree and did not authorize branch mutation, push, tag, release closeout, provider CLI, or release-ready registration.

## Scope verified

The implementation adds `app-core-diagnostics-bundle.v1` for sanitized App Core diagnostics. The verified path includes:

- Backend builder and validator: `src/symphony/app-core-diagnostics-bundle.js`.
- CLI: `symphony diagnostics bundle --goal <goal-id> --task <task-id> --json`.
- Workbench route: `GET /api/diagnostics/bundle`.
- Workbench projection and panel for health, versions, recent failures, gate status, and structured log refs.
- Desktop Shell readiness fields for diagnostics bundle state.
- Fixture, docs, generated static Workbench output, and task tests.

## Commands run

`pwd && git status --short --branch && git rev-parse HEAD && git branch --show-current`

Result: passed, exit code 0.

```text
/Users/andy/.codex/worktrees/v39-task-4-diagnostics-bundle
## v39-task-4-diagnostics-bundle
?? docs/plans/v39-task-4-main-verification-evidence-2026-06-02.md
?? docs/plans/v39-task-4-main-verification-evidence-2026-06-05.md
?? docs/plans/v39-task-4-review-evidence-2026-06-02.md
0dd311201bb128cfbf55509f5afb6cb7873149dd
v39-task-4-diagnostics-bundle
```

`sed -n '620,900p' docs/plans/app-core-v34-v40-goal-runbooks/v39_backup-diagnostics-migration-workspace_goal_runbook_latest.md`

Result: passed, exit code 0. Confirmed task-4 scope, acceptance, reviewer precondition, and main verification evidence path.

`sed -n '1,220p' docs/plans/v39-task-4-worker-evidence-2026-06-02.md`

Result: passed, exit code 0. Worker evidence is present and matches the diagnostics bundle scope.

`sed -n '1,220p' docs/plans/v39-task-4-review-evidence-2026-06-02.md`

Result: passed, exit code 0. Reviewer evidence is present and records `APPROVED` for `/Users/andy/.codex/worktrees/v39-task-4-diagnostics-bundle` at `0dd311201bb128cfbf55509f5afb6cb7873149dd`.

`git diff --stat cd58ec2973748062ccc317859caf0f1ff7f1b9ca..HEAD`

Result: passed, exit code 0. The diff is scoped to diagnostics bundle implementation, Workbench route/projection/panel changes, docs, fixture, generated Workbench static output, and tests.

`git diff --name-status cd58ec2973748062ccc317859caf0f1ff7f1b9ca..HEAD`

Result: passed, exit code 0. The changed files are:

```text
M README.md
A docs/plans/v39-task-4-worker-evidence-2026-06-02.md
M docs/symphony-product-contracts.md
M docs/workbench-operator-guide.md
A fixtures/contracts/app-core-diagnostics-bundle.v1.json
M frontend/workbench/src/App.jsx
M frontend/workbench/src/api/contracts.js
M scripts/symphony.js
A src/symphony/app-core-diagnostics-bundle.js
M src/symphony/console.js
R099 src/symphony/workbench-static/assets/index-BQhXXbtn.js src/symphony/workbench-static/assets/index-MRhrrIIw.js
M src/symphony/workbench-static/index.html
A tests/v39-diagnostics-bundle.test.js
M tests/workbench-api-client.test.js
M tests/workbench-route-smoke.test.js
M tests/workbench-shell.test.js
```

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
duration_ms 9150.033958
```

`pnpm workbench:build`

Result: passed, exit code 0.

```text
vite v8.0.14 building client environment for production...
17 modules transformed.
src/symphony/workbench-static/index.html                     0.42 kB
src/symphony/workbench-static/assets/index-CILC3208.css     36.97 kB
src/symphony/workbench-static/assets/index-MRhrrIIw.js   1,272.31 kB
built in 71ms
```

`git diff --check cd58ec2973748062ccc317859caf0f1ff7f1b9ca..HEAD`

Result: passed, exit code 0. No whitespace errors.

`pnpm --silent symphony diagnostics bundle --goal v39-backup-diagnostics-migration-workspace --task task-4 --json`

Result: passed, exit code 0. In the assigned task worktree, the ignored managed `.symphony` goal state is absent, so the bundle returned `gateStatus.state: "missing"`. It still returned `readOnly: true`, `includesSecretValues: false`, `includesRawLogBodies: false`, `shellExecutionAvailable: false`, `modelInvocationAvailable: false`, `arbitraryPathReadAvailable: false`, and `releaseDecisionAvailable: false`.

`pnpm --silent symphony diagnostics bundle --state-dir /Users/andy/Documents/project/multi-coding-agent-symphony/.symphony --goal v39-backup-diagnostics-migration-workspace --task task-4 --json`

Result: passed, exit code 0. Against the authoritative managed state, the bundle returned `gateStatus.state: "available"`, `goalStatus: "in-progress"`, `taskCount: 5`, `mainVerifiedCount: 3`, `releaseReady: false`, no recent failures, and the same disabled boundary flags.

`pnpm --silent symphony diagnostics bundle --goal ../bad --task task-4 --json`

Result: failed as expected, exit code 64.

```text
{
  "version": "1",
  "status": "error",
  "exitCode": 64,
  "message": "diagnostics goal and task values must be safe refs"
}
```

`pnpm --silent symphony diagnostics bundle --goal v39-backup-diagnostics-migration-workspace --task task-4 --output diagnostics.json`

Result: failed as expected, exit code 64.

```text
{
  "version": "1",
  "status": "error",
  "exitCode": 64,
  "message": "diagnostics bundle is sanitized JSON/text only; redirect stdout if you need a file"
}
```

`pnpm --silent symphony goal-status --goal v39-backup-diagnostics-migration-workspace --json`

Result in `/Users/andy/.codex/worktrees/v39-task-4-diagnostics-bundle`: failed, exit code 64.

```text
{
  "version": "1",
  "status": "error",
  "exitCode": 64,
  "message": "goal not found"
}
```

The assigned task worktree does not contain the ignored managed `.symphony` goal state. This matches the worker and reviewer evidence caveat.

`pnpm --silent symphony goal-status --goal v39-backup-diagnostics-migration-workspace --json`

Result in `/Users/andy/Documents/project/multi-coding-agent-symphony`: passed, exit code 0.

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

## Boundary notes

- No release-ready event was registered.
- No tag, push, publish, provider CLI, mutation, audit, doctor, release closeout, or real CLI command was run.
- No branch mutation or main-branch merge was performed in this leased verification phase.
- The route accepts only `goal` and `task` query parameters and rejects unsafe refs.
- The backend builder sources status from runtime health, diagnostics, goal ledger, goal event log, and managed run state.
- Recent failure text is redacted and truncated. Structured log refs use `managed-state://...` URIs and do not copy stdout, stderr, event bodies, repository source, artifact payloads, or arbitrary local paths.
- The Workbench panel consumes backend contract fields and does not add shell execution, model invocation, arbitrary local file reads, git writes, merge, push, tag, publish, self-approval, or release-ready controls.
