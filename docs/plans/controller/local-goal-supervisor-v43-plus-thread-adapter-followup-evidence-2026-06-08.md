# v43+ Local Goal Supervisor Thread Adapter Follow-Up Evidence

Local run date: 2026-06-08
Timezone: Asia/Shanghai

Goal id: `v43-plus-local-goal-supervisor-stability`
Backlog item: `B3`

Implementation target:

```text
/Users/andy/.codex/local-goal-supervisor/bin/local-goal-supervisor.mjs
```

## Purpose

- Make App-thread follow-up support explicit before recovery tries to send a correction prompt.
- Stop assuming every active Codex App thread can accept `turn/start` follow-up from a later runner tick.
- Route missing-result and invalid-result recovery to operator/manual paths when follow-up messaging is not available.

## Change Summary

The external runner now records a thread-level follow-up messaging declaration when a thread is bound:

- `codex-app`: unavailable
- `manual-adopted-thread`: unavailable
- `codex-app-stdio` created inside the current daemon session: available only for that same daemon/app-server session
- `codex-app-stdio` created by a short-lived session: unavailable for later ticks

The recovery paths that previously tried to send a correction prompt now check that declaration first:

- terminal turn with no bounded result block
- idle active thread with no bounded result block
- invalid bounded result that would previously trigger a correction prompt

If follow-up messaging is unavailable, the runner returns operator recovery instead of calling `turn/start` on the existing thread.

## Failure Mode Covered

Historical closeout recovery hit:

```text
No AppServerManager registered for conversationId
```

That means the thread could still exist in the App, but the current runner-side app-server process could not steer it with a follow-up prompt. The new behavior treats this as adapter capability loss, not as child misbehavior.

## Focused Validation

Commands run:

```text
node --check /Users/andy/.codex/local-goal-supervisor/bin/local-goal-supervisor.mjs
node /Users/andy/.codex/local-goal-supervisor/bin/local-goal-supervisor.mjs selftest
```

`selftest` passed and returned the follow-up policy summary:

- `hostBound`: `unavailable`
- `daemonSessionBound`: `available`
- `daemonSessionMismatch`: `unavailable`

The same selftest also verifies that the unavailable path returns:

- status: `operator-thread-follow-up-recovery-required`
- next action kind: `operator-thread-follow-up-recovery`

## Current Limit

- This run did not replay a live App thread that ends without a bounded result block and then needs correction.
- The fix is implemented and selftested, but one live replay is still worth adding so B3 can move beyond `watch`.
