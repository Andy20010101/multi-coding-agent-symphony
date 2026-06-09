# Local Goal Supervisor v44 Parallel Hardening Plan

Date: 2026-06-08

Support lane for: `v44-project-internal-goal-supervisor-core`

Implementation target:

```text
/Users/andy/.codex/local-goal-supervisor/bin/local-goal-supervisor.mjs
```

## Purpose

Keep the temporary project-external runner stable enough to continue serving repository work while v44 moves stable contracts into product code.

This is not the v44 product spine. It is a bounded support lane for problems that would still slow or mislead later version work if left alone.

## Why This Stays Parallel

The v43+ harvest matrix already shows the split:

- repository-owned core work is ready for B1, B2, B3, B4, B6, and B10;
- daemon launcher mechanics, App notice transport, provenance capture mechanics, and destructive cleanup execution remain temporary-runner concerns.

The hardening lane should therefore reduce operational risk without bloating v44 into another external-runner-only release.

## Hardening Items

### H1: launcher consistency and live daemon ownership

Problem:

Task-B added the expected launcher contract, but live state can still show daemon health that was started through a direct path or through a path that did not preserve expected launcher metadata.

Focus:

- make `daemon-start`, `daemon-status`, `doctor`, and restart flows agree about `startedThroughExpectedLauncher`;
- make stale direct-launch health obvious instead of silently looking healthy enough;
- make restart instructions unambiguous when the launcher contract is missing.

Done when:

- one live replay proves `daemon-start -> daemon-status -> doctor -> restart -> complete` all preserve expected launcher ownership;
- direct-launch leftovers are reported as non-conforming state, not healthy daemon ownership.

### H2: session continuity and follow-up degradation

Problem:

The system still depends on same-session follow-up capability for some correction paths. When the app-server session is gone, the system is stable only if it degrades immediately and predictably.

Focus:

- make same-session follow-up capability declaration exact;
- make later-session mismatch degrade immediately to result-only or operator recovery;
- avoid repeated retries against a dead follow-up path.

Done when:

- one replay proves same-session correction still works;
- one replay proves session-mismatch recovery exits in one bounded operator-visible step with no duplicate retry loop.

### H3: ledger and evidence integrity

Problem:

Managed goal state can look more complete than the file-level evidence that supposedly backs it. That weakens operator trust even when routing is otherwise correct.

Focus:

- surface missing or mismatched evidence refs as warnings instead of silently trusting populated fields;
- make closeout and doctor outputs distinguish `field present` from `evidence file verified`;
- keep the external runner as the only state writer while improving audit readability.

Done when:

- one bounded replay or scratch check proves missing evidence refs are surfaced explicitly;
- operator-facing state makes it clear when a reference exists in state but the file is absent.

## What Not To Do In This Lane

- Do not turn this into a full external-runner rewrite.
- Do not add raw provider CLI execution.
- Do not add browser terminal automation.
- Do not retire the temporary runner in this lane.
- Do not make automatic destructive cleanup the default.
- Do not make notice-thread transport a productized UX surface in this lane.

## Success Condition

The temporary runner remains good enough to keep serving version work while v44 lands repository-owned supervisor core logic.

That means:

- version work can keep running through the temporary system without frequent operator confusion;
- live daemon or session mismatches fail loudly and predictably;
- evidence and ledger mismatches become visible enough to reconcile early;
- the support lane does not steal the main release scope from v44.
