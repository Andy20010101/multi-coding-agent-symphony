# v44 task-2 main verification evidence

Local run date: 2026-06-08
Timezone: Asia/Shanghai
Goal: v44-project-internal-goal-supervisor-core
Task: task-2
Role: main-verifier
Assigned thread: 019ea667-1b2c-7803-8b34-34fd9feef42e
Branch: v44-task-2-app-thread-adapter-result-consumer
Worktree: /Users/andy/.codex/worktrees/v44-task-2-app-thread-adapter-result-consumer
Base commit: 76bc744f9c75a55a96de0605a3350d3ef392c1ab
Verified head before evidence commit: b11581e9ddf477e229e87671b617a50fd8ecd4b7

## Verification target

- Worker result escrow: `/Users/andy/.codex/local-goal-supervisor/results/v44-project-internal-goal-supervisor-core/019ea65f-3ac5-7e71-97f1-85186a500e86.txt`
- Worker evidence: `docs/plans/v44-task-2-worker-evidence-2026-06-08.md`
- Reviewer result escrow: `/Users/andy/.codex/local-goal-supervisor/results/v44-project-internal-goal-supervisor-core/019ea664-b143-7982-99e2-9ffeec44fc64.txt`
- Reviewer evidence: `docs/plans/v44-task-2-review-evidence-2026-06-08.md`

## Acceptance check

- `src/symphony/goal-supervisor/app-thread-adapter.js` normalizes App thread reads without mutation flags and treats unreadable or `notLoaded` reads as wait inputs.
- `buildEscrowFirstRouteInput(...)` consumes a valid escrow result before falling back to thread result availability.
- `duplicateDispatchGuard(...)` blocks dispatch when a live active lease or live thread is present.
- `fixtures/contracts/goal-supervisor/app-thread-adapter.v44.replay.v1.json` covers unreadable-thread handling with valid escrow and unreadable `notLoaded` without a valid result.
- `tests/v44-goal-supervisor-app-thread-adapter.test.js` exercises the task-2 paths above.

## Commands run

| Command | Result |
| --- | --- |
| `git -C /Users/andy/.codex/worktrees/v44-task-2-app-thread-adapter-result-consumer status --short --branch` | Passed, clean before verification evidence was added. |
| `sed -n '1,120p' /Users/andy/.codex/local-goal-supervisor/results/v44-project-internal-goal-supervisor-core/019ea65f-3ac5-7e71-97f1-85186a500e86.txt` | Passed; worker result block points to task-2 worker evidence and commit `3790c44e15ae57f1b46fcaa659c45c9aa66bbc2d`. |
| `sed -n '1,120p' /Users/andy/.codex/local-goal-supervisor/results/v44-project-internal-goal-supervisor-core/019ea664-b143-7982-99e2-9ffeec44fc64.txt` | Passed; reviewer result block approves task-2 at commit `b11581e9ddf477e229e87671b617a50fd8ecd4b7`. |
| `node --test tests/v44-goal-supervisor-app-thread-adapter.test.js` | Passed, 5 tests. |
| `git diff --check 76bc744f9c75a55a96de0605a3350d3ef392c1ab...HEAD` | Passed. |
| `pnpm check` | Passed. |
| `pnpm test` | Passed, 1126 tests. |
| `pnpm workbench:build` | Passed. |
| `git status --short --branch` | Passed, clean after verification commands and before this evidence file was added. |

## Verdict

Task-2 passes main verification. The repository-owned adapter satisfies the read-only normalization, escrow-first result consumption, duplicate dispatch guard, and unreadable-thread replay coverage required by the v44 runbook.
