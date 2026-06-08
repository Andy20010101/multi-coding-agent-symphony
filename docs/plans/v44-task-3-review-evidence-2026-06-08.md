# v44 task-3 review evidence

Local run date: 2026-06-08
Timezone: Asia/Shanghai
Goal: v44-project-internal-goal-supervisor-core
Task: task-3
Role: reviewer
Assigned thread: 019ea670-c80f-7ff2-ba14-98457abb8703
Branch: v44-task-3-route-progress-parity
Worktree: /Users/andy/.codex/worktrees/v44-task-3-route-progress-parity
Base commit: b0a4189246cf21aff5060e24536f167c90f0e118
Worker evidence reviewed: docs/plans/v44-task-3-worker-evidence-2026-06-08.md
Worker thread reviewed: 019ea669-b4e3-7cd0-a2e9-78871fa28f14

## Verdict

Needs revision.

## Finding

`latestValidResultForCurrent()` treats previously registered reviewer results as pending when the result record has no `consumed` or `registered` marker. The external runner's durable state for this goal stores registered results under `state.results[].result` without a consumed flag. In that live shape, a worker revision after `reviewer.needs-revision` routes to `pending-result` and `register-recorded-result` for the old reviewer result instead of dispatching the fresh reviewer phase.

Relevant code:

- `src/symphony/goal-supervisor/route-progress.js:118` checks for pending results after revision override.
- `src/symphony/goal-supervisor/route-progress.js:244` scans historical `state.results`.
- `src/symphony/goal-supervisor/route-progress.js:252` only filters records marked consumed or registered inside the nested result.
- `fixtures/contracts/goal-supervisor/route-progress.v44.replay.v1.json:30` adds `consumed: true` to the replay data, so the test does not cover the live durable state shape.

Reproduction command:

```text
node --input-type=module <<'NODE'
import { decideGoalSupervisorRoute } from './src/symphony/goal-supervisor/route-progress.js';
const state = { active: null, threads: [], results: [
  { valid: true, result: { taskId: 'task-3', role: 'reviewer', eventToRegister: 'reviewer.needs-revision' } },
  { valid: true, result: { taskId: 'task-3', role: 'worker', eventToRegister: 'worker.evidence-recorded' } }
] };
const decision = decideGoalSupervisorRoute({ state, goalNext: { status: 'action-required', next: { taskId: 'task-3', role: 'worker', phase: 'revision' }, reason: 'worker revision requested' } });
console.log(JSON.stringify({ state: decision.state, role: decision.current.role, phase: decision.current.phase, pendingRole: decision.pendingResult?.result?.role, pendingEvent: decision.pendingResult?.result?.eventToRegister, action: decision.action.kind, reason: decision.reason }, null, 2));
NODE
```

Observed output:

```text
{
  "state": "pending-result",
  "role": "reviewer",
  "phase": "review",
  "pendingRole": "reviewer",
  "pendingEvent": "reviewer.needs-revision",
  "action": "register-recorded-result",
  "reason": "recorded-result-awaits-registration"
}
```

Expected behavior: the same event sequence should route to a dispatchable reviewer phase with reason `worker-revision-recorded-after-reviewer-needs-revision`.

Impact: this breaks the task acceptance point that replay coverage proves revision routing, and can leave the project-internal route parity layer trying to re-register an already-recorded reviewer result instead of progressing the revision loop.

## Commands run

| Command | Result |
| --- | --- |
| `git status --short --branch` in `/Users/andy/.codex/worktrees/v44-task-3-route-progress-parity` | Passed. |
| `git rev-parse HEAD` in `/Users/andy/.codex/worktrees/v44-task-3-route-progress-parity` | Passed, `08e689517c9860943c89ae7ae860045feae93ac3`. |
| `sed -n '1,220p' docs/plans/app-core-v44-goal-runbooks/00_GLOBAL_RULES_AND_FLOW_LATEST_COMMANDS.md` | Passed. |
| `sed -n '1,260p' docs/plans/app-core-v44-goal-runbooks/v44_project-internal-goal-supervisor-core_goal_runbook_latest.md` | Passed. |
| `sed -n '1,220p' docs/plans/v44-task-3-worker-evidence-2026-06-08.md` | Passed. |
| `sed -n '1,80p' /Users/andy/.codex/local-goal-supervisor/results/v44-project-internal-goal-supervisor-core/019ea669-b4e3-7cd0-a2e9-78871fa28f14.txt` | Passed. |
| `git diff --stat b0a4189246cf21aff5060e24536f167c90f0e118...HEAD` | Passed. |
| `git diff --name-status b0a4189246cf21aff5060e24536f167c90f0e118...HEAD` | Passed. |
| `sed -n '1,620p' src/symphony/goal-supervisor/route-progress.js` | Passed. |
| `sed -n '1,260p' tests/v44-goal-supervisor-route-progress.test.js` | Passed. |
| `sed -n '1,280p' fixtures/contracts/goal-supervisor/route-progress.v44.replay.v1.json` | Passed. |
| `node --test tests/v44-goal-supervisor-route-progress.test.js` | Passed, 4 tests. |
| `git diff --check b0a4189246cf21aff5060e24536f167c90f0e118...HEAD` | Passed. |
| `node -e "const fs=require('fs'); const s=JSON.parse(fs.readFileSync('/Users/andy/.codex/local-goal-supervisor/state/v44-project-internal-goal-supervisor-core.json','utf8')); console.log(JSON.stringify({keys:Object.keys(s), active:s.active, results:s.results?.slice(-4), latestResults:s.latestResults?.slice?.(-4)}, null, 2));"` | Passed; confirmed durable `state.results[].result` entries lack consumed markers. |
| Revision-path reproduction command above | Failed expectation; returned `pending-result` for old reviewer result. |

## Boundary notes

No mutation, audit, doctor, real CLI, provider CLI, tag, push, publish, release closeout, event registration, dispatch, subagent, or supervisor state mutation command was run.
