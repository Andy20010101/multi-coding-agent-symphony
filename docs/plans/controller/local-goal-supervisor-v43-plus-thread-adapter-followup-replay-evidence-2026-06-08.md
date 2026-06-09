# v43+ Local Goal Supervisor Thread Adapter Follow-Up Replay Evidence

Local run date: 2026-06-08
Timezone: Asia/Shanghai

Goal id: `v43-plus-local-goal-supervisor-stability`
Backlog item: `B3`

Implementation target:

```text
/Users/andy/.codex/local-goal-supervisor/bin/local-goal-supervisor.mjs
```

Scratch replay workspace:

```text
/tmp/b3-thread-followup-replay.R39xSx
```

The scratch worktree registered temporary managed goals derived from `fixtures/contracts/goal-runbook.valid.v1.json`. The live threads still used the runner-assigned task worktree:

```text
/Users/andy/.codex/worktrees/v19-task1-goal-runbook-contracts
```

## Purpose

- Prove the follow-up capability gate in live runner execution, not only in selftest.
- Show that a daemon-created `codex-app-stdio` thread accepts correction follow-up only while the same daemon process still owns the app-server session.
- Show that a later tick with a different session id refuses the same correction path and returns operator recovery instead.

## Replay A: Same-Session Correction Succeeds

Scratch goal:

- goal id: `b3-thread-followup-daemon-same2-1780892068`
- daemon id: `daemon_b3_same_session2`
- thread id: `019ea570-8566-7fb1-8aeb-249e732c9e13`

The runner was started as a persistent daemon with:

```sh
node /Users/andy/.codex/local-goal-supervisor/bin/local-goal-supervisor.mjs daemon \
  --goal b3-thread-followup-daemon-same2-1780892068 \
  --interval-ms 30000 \
  --max-ticks 2 \
  --daemon-id daemon_b3_same_session2
```

Tick 1 created the thread and recorded:

- `followUpMessaging.mode: same-app-server-session`
- `followUpMessaging.sessionId: daemon_b3_same_session2`

Before tick 2, an invalid bounded result block was written into the runner escrow file:

```text
/Users/andy/.codex/local-goal-supervisor/results/b3-thread-followup-daemon-same2-1780892068/019ea570-8566-7fb1-8aeb-249e732c9e13.txt
```

The only deliberate validation failure was:

- `eventToRegister: reviewer.approved` for role `worker`

The daemon's second tick then recorded:

- status: `result-invalid-correction-sent`
- correction turn id: `019ea570-fc6b-7561-8ae6-5ff0c36e5df2`
- validation error: `eventToRegister is not valid for role worker in phase implement`

No operator recovery path was returned on this tick. The runner stayed in the same app-server session and sent a correction prompt to the active thread.

## Replay B: Session Mismatch Falls Back To Operator Recovery

Scratch goal:

- goal id: `b3-thread-followup-mismatch-1780892188`
- source daemon id: `daemon_b3_mismatch_source`
- later tick daemon id: `daemon_b3_mismatch_other`
- thread id: `019ea572-43cd-7182-a528-4f03f5fc90cb`

The source daemon created the thread with one tick:

```sh
node /Users/andy/.codex/local-goal-supervisor/bin/local-goal-supervisor.mjs daemon \
  --goal b3-thread-followup-mismatch-1780892188 \
  --interval-ms 30000 \
  --max-ticks 1 \
  --daemon-id daemon_b3_mismatch_source
```

After that daemon exited, the same invalid escrow shape was written for the active thread. A later manual tick then ran with a different session id:

```sh
node /Users/andy/.codex/local-goal-supervisor/bin/local-goal-supervisor.mjs tick \
  --goal b3-thread-followup-mismatch-1780892188 \
  --daemon-id daemon_b3_mismatch_other
```

That tick returned:

- status: `operator-thread-follow-up-recovery-required`
- next action: `operator-thread-follow-up-recovery`
- follow-up availability: `unavailable`
- declared session: `daemon_b3_mismatch_source`
- runtime session: `daemon_b3_mismatch_other`
- reason: `Active child result block failed supervisor validation. Follow-up messaging is unavailable for this thread, so the runner will not send a correction prompt.`

The validation error was the same as Replay A:

- `eventToRegister is not valid for role worker in phase implement`

This proves the operator/manual path is chosen because the session boundary changed, not because the invalid result shape changed.

## What This Replay Proved

- The follow-up capability declaration is not just documentation. It changes live control flow.
- A daemon-created `codex-app-stdio` thread can be corrected in place when the same persistent daemon process consumes the invalid result.
- The same thread becomes no-follow-up when a later tick uses a different session id.
- The fallback is explicit and bounded:
  - `status: operator-thread-follow-up-recovery-required`
  - `nextAction.kind: operator-thread-follow-up-recovery`
  - session mismatch reason is returned in `followUpMessaging`

## Boundary Note

An earlier scratch attempt used a thread created through the general Codex thread tool surface instead of the runner-owned app-server session. That thread was not reliable for this proof because the runner later saw `thread not found` / `notLoaded`. The final replay used runner-created `codex-app-stdio` threads only.

That is the boundary the future in-project App thread adapter must preserve:

- create thread
- read thread
- declare follow-up capability
- consume result

all need to speak the same thread/runtime surface.
