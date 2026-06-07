# v43 task-4 review evidence

Goal: `v43-goal-supervisor-stabilization`
Task: `task-4` - Daemon, heartbeat, notifications, and progress visibility
Role: `reviewer`
Thread: `019ea2fc-56b6-7e42-bb88-c41b09474f5a`
Branch: `v43-task-4-daemon-heartbeat-progress`
Worktree: `/Users/andy/.codex/worktrees/v43-task-4-daemon-heartbeat-progress`
Base commit: `6939d4dcd126df851f935d353e4ebe585eab96ea`
Reviewed worker evidence: `docs/plans/v43-task-4-worker-evidence-2026-06-07.md`
Date: `2026-06-08`

## Verdict

NEEDS_REVISION

## Finding

1. `src/symphony/supervisor-runner.js:617` and `src/symphony/supervisor-runner.js:619` pass provider status and recovery note through `sanitizeStatus`, but `sanitizeStatus` at `src/symphony/supervisor-runner.js:792` only redacts `TOKEN=`-style values and `sk-...` keys. It does not remove common secret-bearing values such as `SECRET=...`, `password=...`, or `credential=...`. That misses the task-4 boundary that provider progress must expose sanitized v41 operation progress only and must not expose raw provider output, secret-bearing state, or credential data.

Reproducer:

```sh
node --input-type=module - <<'NODE'
import { buildSupervisorObservability } from './src/symphony/supervisor-runner.js';
const visibility = buildSupervisorObservability({
  generatedAt: '2026-06-07T12:05:00.000Z',
  providerOperationId: 'op_v41_provider_9',
  providerProgressAt: '2026-06-07T12:04:00.000Z',
  providerStatus: 'SECRET=do-not-print password=hunter2 credential=abc123',
  providerRecoveryNote: 'recover after PASSWORD=keep-out'
});
console.log(JSON.stringify({
  status: visibility.providerProgress.sanitizedStatus,
  recoveryNote: visibility.providerProgress.recoveryNote
}));
NODE
```

Observed output:

```json
{"status":"SECRET=do-not-print password=hunter2 credential=abc123","recoveryNote":"recover after PASSWORD=keep-out"}
```

## Checks Passed

- `daemon`, `manualTick`, and `providerProgress` are separate fields in `goal-supervisor-observability.v1`.
- Stale daemon plus active child blocks the supervisor cycle with `duplicateDispatchAllowed: false`.
- Healthy daemon plus active child also blocks duplicate dispatch.
- Approval-required notification exposes the caller-supplied command and flag.
- Provider progress suppresses `providerRawOutput` and filters secret-looking artifact refs.
- Stopped idle runner exposes a single documented launch command: `pnpm --silent symphony supervisor run --goal <goalId> --json`.

## Commands Run

| Command | Outcome |
| --- | --- |
| `sed -n '1,260p' docs/plans/v43-task-4-worker-evidence-2026-06-07.md` | Exit `0`; worker evidence present in the assigned worktree. |
| `git diff --stat 6939d4dcd126df851f935d353e4ebe585eab96ea..HEAD && git diff --name-status 6939d4dcd126df851f935d353e4ebe585eab96ea..HEAD` | Exit `0`; reviewed changes to `src/symphony/supervisor-runner.js`, `tests/v43-daemon-heartbeat-progress.test.js`, and worker evidence. |
| `git diff --check 6939d4dcd126df851f935d353e4ebe585eab96ea..HEAD` | Exit `0`; no whitespace errors in the reviewed diff. |
| `node --input-type=module - <<'NODE' ... NODE` | Exit `0`; reproduced provider status and recovery-note secret leakage shown above. |
| `pnpm check` | Exit `0`; JavaScript syntax checks passed. |
| `pnpm test` | Exit `0`; `1112` tests passed, `0` failed. |
| `pnpm workbench:build` | Exit `0`; Vite build completed. |
| `git diff --check` | Exit `0`; no whitespace errors. |

## Revision Needed

Tighten provider progress redaction so `sanitizedStatus`, `recoveryNote`, and any notification text derived from them cannot contain secret-looking keys or values. Add a regression test that fails on `SECRET=...`, `PASSWORD=...`, and `credential=...` in provider status or recovery note, not only `TOKEN=` and `sk-...`.
