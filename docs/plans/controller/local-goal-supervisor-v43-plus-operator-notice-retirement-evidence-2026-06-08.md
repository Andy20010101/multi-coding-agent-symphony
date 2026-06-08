# v43+ Local Goal Supervisor Operator Notice Retirement Evidence

Local run date: 2026-06-08
Timezone: Asia/Shanghai

Goal id: `v43-plus-local-goal-supervisor-stability`
Backlog item: `B7`

Implementation target:

```text
/Users/andy/.codex/local-goal-supervisor/bin/local-goal-supervisor.mjs
```

## Purpose

- Stop treating historical operator notices as live state.
- Keep `state.operatorNotifications` limited to currently actionable notices.
- Preserve retirement history in the log stream instead of the live state file.

## Change Summary

The external runner now retires resolved operator notices during normal state transitions:

- when a planned goal status becomes `complete`
- when a notice targets a thread that is no longer a live active child
- when a stale notice is no longer the current actionable item

Retired notices are removed from `state.operatorNotifications` and recorded as `operator-notification-retired` log entries with:

- original notice payload
- `retiredAt`
- retirement reason
- target thread id when available

This keeps `doctor`, `plan`, and the persisted state file aligned on the same rule: live state shows open operator work only.

## Focused Validation

Commands run:

```text
node --check /Users/andy/.codex/local-goal-supervisor/bin/local-goal-supervisor.mjs
node /Users/andy/.codex/local-goal-supervisor/bin/local-goal-supervisor.mjs selftest
node /Users/andy/.codex/local-goal-supervisor/bin/local-goal-supervisor.mjs plan --goal v43-plus-local-goal-supervisor-stability
node /Users/andy/.codex/local-goal-supervisor/bin/local-goal-supervisor.mjs doctor --goal v43-plus-local-goal-supervisor-stability
jq '{updatedAt,status,active,operatorNotifications}' /Users/andy/.codex/local-goal-supervisor/state/v43-plus-local-goal-supervisor-stability.json
rg -n 'operator-notification-retired' /Users/andy/.codex/local-goal-supervisor/logs/v43-plus-local-goal-supervisor-stability.jsonl | tail -n 6
```

Observed results:

- `selftest` passed, including the new notice-retirement checks.
- `plan --goal v43-plus-local-goal-supervisor-stability` returned `status: "complete"`.
- persisted state now shows:

```json
{
  "updatedAt": "2026-06-08T03:04:56.855Z",
  "status": "complete",
  "active": null,
  "operatorNotifications": []
}
```

- `doctor --goal ...` now reports:

```json
{
  "generatedAt": "2026-06-08T03:06:19.085Z",
  "planStatus": "complete",
  "active": null,
  "activeProgress": null,
  "operatorNotifications": []
}
```

- the audit trail kept the retired records in `logs/v43-plus-local-goal-supervisor-stability.jsonl` as `operator-notification-retired` entries around lines `1196` to `1201`

## Result

Historical blocked and recovery notices no longer stay in live state after the goal is complete. Audit history remains available in the append-only log without polluting current operator status.

## Remaining Limit

- This change does not yet define a bounded retention window or compaction policy for the audit log itself.
- B7 still needs one fresh daemon-created blocked notice replay so the notice lifecycle is covered from creation through retirement in one run.
