# v43 task-1 independent review evidence

## Findings

1. `NEEDS_REVISION`: `recordThreadBinding` can mark a child active from a readback that is not bound to the requested thread. In `src/symphony/app-thread-result-protocol.js:146`, the function normalizes the binding thread id, but at `src/symphony/app-thread-result-protocol.js:191` it accepts any plain `readback` with `readable === true`. It does not require the stable capability shape from `readThread(threadId)`, and it does not compare `readback.capability.callShape.threadId` or `readback.response.id` with `binding.threadId` before returning `active: true` at `src/symphony/app-thread-result-protocol.js:214`. Reproduction run in the target worktree:

   ```sh
   node --input-type=module <<'NODE'
   import { recordThreadBinding } from './src/symphony/app-thread-result-protocol.js';
   const binding = {
     goalId: 'v43-goal-supervisor-stabilization',
     taskId: 'task-1',
     role: 'worker',
     requestId: 'request-task-1-worker',
     threadId: 'thread-expected',
     worktree: '/Users/andy/.codex/worktrees/v43-task-1-app-thread-result-protocol',
     baseCommit: '5e645c5c68c72c489ff938ffa076e33725bc05f9'
   };
   const result = recordThreadBinding({
     bindings: [],
     binding,
     readback: {
       status: 'readable',
       readable: true,
       response: { id: 'thread-other' },
       capability: { method: 'readThread', callShape: { threadId: 'thread-other' } }
     }
   });
   console.log(JSON.stringify({
     accepted: result.accepted,
     active: result.active,
     recordThreadId: result.record?.threadId,
     readbackThreadId: result.record?.readCapability?.callShape?.threadId
   }, null, 2));
   NODE
   ```

   Output:

   ```json
   {
     "accepted": true,
     "active": true,
     "recordThreadId": "thread-expected",
     "readbackThreadId": "thread-other"
   }
   ```

   This misses the task-1 requirement that active child state is only set after valid App readback, and it fails the review instruction to verify result/thread identity binding.

2. `NEEDS_REVISION`: the canonical branch cannot carry the reviewed work into the documented main-verification path. `git rev-parse HEAD main` returned the same commit, `5e645c5c68c72c489ff938ffa076e33725bc05f9`, and `git status --short` showed the implementation as working-tree changes: `M src/symphony/supervisor-runner.js`, untracked `src/symphony/app-thread-result-protocol.js`, untracked `tests/v43-app-thread-result-protocol.test.js`, and untracked worker evidence. The worker evidence lists those files as changed at `docs/plans/v43-task-1-worker-evidence-2026-06-07.md:36`, while the main-verifier prompt requires `git merge --ff-only v43-task-1-app-thread-result-protocol` at `docs/plans/v43-goal-supervisor-stabilization-execution-prompts-2026-06-07.md:141`. As currently delivered, that merge would bring no task-1 implementation.

## Verdict

`NEEDS_REVISION`

## Review Metadata

- Goal: `v43-goal-supervisor-stabilization`
- Task: `task-1`
- Role: `independent reviewer`
- Branch reviewed: `v43-task-1-app-thread-result-protocol`
- Worktree reviewed: `/Users/andy/.codex/worktrees/v43-task-1-app-thread-result-protocol`
- Worker evidence read: `docs/plans/v43-task-1-worker-evidence-2026-06-07.md`
- Review evidence path: `docs/plans/v43-task-1-review-evidence-2026-06-07.md`

## Sources Checked

- `/Users/andy/Documents/project/multi-coding-agent-symphony/docs/plans/v43-goal-supervisor-stabilization-plan-2026-06-07.md`
- `/Users/andy/Documents/project/multi-coding-agent-symphony/docs/plans/v43-goal-supervisor-stabilization-execution-prompts-2026-06-07.md`
- `/Users/andy/Documents/project/multi-coding-agent-symphony/docs/plans/v43-goal-supervisor-stabilization-replay-test-matrix-2026-06-07.md`
- `/Users/andy/Documents/project/multi-coding-agent-symphony/docs/plans/app-core-v43-goal-runbooks/v43_goal-supervisor-stabilization_goal_runbook_latest.md`
- `/Users/andy/Documents/project/multi-coding-agent-symphony/fixtures/contracts/goal-runbook.v43-goal-supervisor-stabilization.v1.json`
- `/Users/andy/.codex/worktrees/v43-task-1-app-thread-result-protocol/docs/plans/v43-task-1-worker-evidence-2026-06-07.md`
- `/Users/andy/.codex/worktrees/v43-task-1-app-thread-result-protocol/src/symphony/app-thread-result-protocol.js`
- `/Users/andy/.codex/worktrees/v43-task-1-app-thread-result-protocol/src/symphony/supervisor-runner.js`
- `/Users/andy/.codex/worktrees/v43-task-1-app-thread-result-protocol/tests/v43-app-thread-result-protocol.test.js`

## Coverage Checked

- Duplicate binding rejection is covered in `tests/v43-app-thread-result-protocol.test.js`.
- Unreadable thread id rejection is covered.
- Missing result block, invalid JSON, missing required fields, markdown fenced payloads, and wrong result thread id are covered.
- `notLoaded` remains `mutatesState: false`.
- Pending valid recorded result is selected before live active-thread readback.
- `consumeParsedResult` is append-only and idempotent for repeated record ids.
- Reviewer, main-verifier, and release-manager accepted terminal events include non-success outcomes.
- Correction is bounded to one result-only prompt before manual recovery.

The gap is the readback identity check before activation, not the result-block parser's wrong-thread-id check.

## Commands Run

| Command | Result |
| --- | --- |
| `pnpm check` | Exit `0` |
| `pnpm test` | Exit `0`; `1093` tests passed, `0` failed |
| `pnpm workbench:build` | Exit `0`; Vite build completed |
| `git diff --check` | Exit `0` |
| identity mismatch reproduction command above | Exit `0`; showed `accepted: true` with mismatched readback thread id |

## Boundary Notes

- I did not implement changes.
- I did not register `reviewer.approved` or `reviewer.needs-revision`.
- I did not run main verification or release gates beyond the required review checks.
