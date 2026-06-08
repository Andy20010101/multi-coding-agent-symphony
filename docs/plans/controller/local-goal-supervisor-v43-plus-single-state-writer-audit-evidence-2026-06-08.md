# v43+ Local Goal Supervisor Single State Writer Audit Evidence

Local run date: 2026-06-08
Timezone: Asia/Shanghai

Goal id: `v43-plus-local-goal-supervisor-stability`
Backlog item: `B1`

External implementation target:

```text
/Users/andy/.codex/local-goal-supervisor/bin/local-goal-supervisor.mjs
```

## Purpose

- Close the remaining B1 gap after the release-prep incident where a child thread wrote `release.ready-declared` directly.
- Keep the external runner as the only state writer even when `goal next` already reports `complete`.
- Preserve the valid stale-lease recovery path when the external runner itself already consumed and registered the bounded result.

## Runner Changes

The external runner now does two additional checks around goal-event registration and completion recovery:

1. `registerGoalEventFromResult(...)` appends a `goal-event-registered` audit entry to the runner log after successful CLI confirmation.
2. `planFromGoalNext(...)` blocks `goal next = complete` for `release.ready-declared` when:
   - the goal ledger already contains `release.ready-declared`;
   - a valid release-prep bounded result still exists on the active lease; and
   - the runner log has no matching `goal-event-registered` audit entry.

In that state the plan returns `status: blocked` with `action.kind: recovery-required` instead of silently retiring the lease.

The prior valid path still remains:

- if the ledger contains `release.ready-declared`;
- the active release-prep lease has a valid bounded result; and
- the runner log shows that the external runner registered that event,

then the plan still returns `action-required / complete-active-thread` so the stale lease can be retired deterministically.

## Validation

Commands run:

```sh
node --check /Users/andy/.codex/local-goal-supervisor/bin/local-goal-supervisor.mjs
node /Users/andy/.codex/local-goal-supervisor/bin/local-goal-supervisor.mjs selftest
```

Observed result:

- `node --check`: exited `0`
- `selftest`: returned `contractName: local-goal-supervisor-selftest.v1` and `status: passed`

## Selftest Coverage Added

The runner selftest now covers both sides of the B1 boundary:

1. `goal complete escrow recovery selftest`
   - scratch goal ledger already contains `release.ready-declared`
   - bounded result escrow is valid
   - a matching runner `goal-event-registered` audit entry exists
   - expected plan result: `action-required / complete-active-thread`

2. `goal complete bypass conflict selftest`
   - scratch goal ledger already contains `release.ready-declared`
   - bounded result escrow is valid
   - no matching runner registration audit exists
   - expected plan result: `blocked / recovery-required`

## Why This Matters

The original B1 failure was not only “child produced the wrong thing”. The more important failure was that the runner could no longer tell whether `release.ready-declared` came from bounded result consumption or from an out-of-band ledger write. That ambiguity made `goal next = complete` unsafe.

This change restores that distinction without moving the temporary runner into repository code:

- the ledger remains the source of goal truth;
- the external runner log now proves write authority for the event it consumed;
- completion recovery only trusts `release.ready-declared` when both records agree.

## Remaining Limit

This evidence is still selftest-only. One bounded scratch replay or live replay should still be captured before B1 moves from `watch` to `harvested` in the stability backlog.
