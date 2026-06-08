# v43+ Local Goal Supervisor Progress Classifier Evidence

Local run date: 2026-06-08
Timezone: Asia/Shanghai

Goal id: `v43-plus-local-goal-supervisor-stability`
Backlog item: `B6`

Implementation target:

```text
/Users/andy/.codex/local-goal-supervisor/bin/local-goal-supervisor.mjs
```

## Purpose

- Make active-child progress classification explicit instead of inferring status from scattered state fields.
- Put the active-child classifier into `doctor` so operator triage has one screen for thread state, escrow state, worktree head, and latest relevant goal event.

## Change Summary

The external runner now classifies active child state with explicit outcomes:

- `recent-progress`
- `stalled`
- `not-loaded-wait`
- `terminal-no-result`
- `completed-unconsumed-result`
- `result-invalid`
- `waiting`

The classifier now combines:

- latest observable turn status
- age of the latest observable activity
- thread-record status
- bounded result availability from the active thread
- bounded result availability from the result escrow file

`doctor` now emits `activeProgress` as a first-class field instead of only showing the active lease metadata.

## Focused Validation

Commands run:

```text
node --check /Users/andy/.codex/local-goal-supervisor/bin/local-goal-supervisor.mjs
node /Users/andy/.codex/local-goal-supervisor/bin/local-goal-supervisor.mjs selftest
node /Users/andy/.codex/local-goal-supervisor/bin/local-goal-supervisor.mjs doctor --goal v43-plus-local-goal-supervisor-stability
```

`selftest` passed after adding:

- completed terminal turn without a result block is detected as a terminal-no-result recovery case
- completed child with a still-unconsumed bounded result block is classified as `completed-unconsumed-result`
- recent progress and stalled progress continue to classify correctly

`doctor` now reports the active-child panel directly. In the current live state it showed:

- `classification`: `stalled`
- `resultEscrow.exists`: `false`
- `assignedWorktree.head`: `3908d431eac6e0238e3606d4d41ff8f921684ab3`
- `latestRelevantGoalEvent.eventId`: `evt_4f245a9b55d1b352`

That is the one-screen view B6 needed: latest thread progress classification, escrow state, assigned worktree head, and latest relevant ledger event are all in one structure.

## Current Limit

- This run used selftest plus current-goal doctor output. It did not add a separate scratch replay that walks the same active lease through `recent-progress -> stalled -> completed-unconsumed-result`.
- The classifier is implemented and surfaced, but one replay is still useful before moving B6 beyond `watch`.
