# v43 Replay + Test Matrix

Date: 2026-06-07
Goal id: `v43-goal-supervisor-stabilization`
Baseline: `v42 Goal Supervisor Runtime Context Loop`

This document defines the minimum replay, fixture, and command evidence that v43 task work should produce. It is a planning contract, not proof that the tests already exist.

## Common scoped gates

Every task still uses the scoped closeout gate set from the v43 fixture:

- `pnpm check`
- `pnpm test`
- `pnpm workbench:build`
- `git diff --check`
- `pnpm --silent symphony goal-status --goal v43-goal-supervisor-stabilization --json`

Tasks that affect next-action routing should also run:

- `pnpm --silent symphony goal next --goal v43-goal-supervisor-stabilization --json`

## task-1: App thread and result protocol contracts

### Required replay and test coverage

| Case | Minimum proof surface | Expected signal |
| --- | --- | --- |
| Created thread is unreadable on first readback | Adapter/unit test or replay sample | Thread is not marked active; state remains unchanged except for the recorded wait or blocker signal. |
| Duplicate `record-thread` binding | Binding validation test | Second binding is rejected; no duplicate active lease or thread map entry is created. |
| `notLoaded` App response | Adapter replay sample | Result is treated as a non-mutating wait state, not a failed child result. |
| Valid recorded result exists before live thread read | Result-consume test | Pending valid result is consumed first; the live reader does not overwrite the accepted result basis. |
| Invalid JSON result block | Parser replay sample | Result is rejected; one bounded correction path is emitted. |
| Markdown fence instead of raw result block | Parser replay sample | Fence content is either normalized into the accepted block shape or rejected with one correction path. |
| Missing required fields | Parser replay sample | Result is rejected without registering a terminal event. |
| Wrong thread id in result block | Parser validation test | Result is rejected as context mismatch. |
| Missing result block entirely | Reader/replay sample | One correction prompt is queued; no terminal event is registered. |
| Repeated invalid output after one correction | Replay sample | Flow escalates to explicit manual recovery; it does not loop corrections forever. |
| Accepted terminal events beyond success | Fixture/contract test | Reviewer, main verifier, and release-manager role contracts list all valid terminal events, not only success. |

### Minimum command evidence

- `pnpm check`
- `pnpm test`
- `pnpm workbench:build`
- `git diff --check`
- `pnpm --silent symphony goal-status --goal v43-goal-supervisor-stabilization --json`
- `pnpm --silent symphony goal next --goal v43-goal-supervisor-stabilization --json`

## task-2: Workspace and evidence safety

### Required replay and test coverage

| Case | Minimum proof surface | Expected signal |
| --- | --- | --- |
| Assigned package worktree is missing `node_modules` | Workspace-preflight test | Dispatch is blocked before child creation. |
| Deterministic dependency setup fails | Workspace-preflight replay sample | `workspace-dependency-setup-failed` blocker is recorded with the failed setup command or blocker reason. |
| Verified dirty-baseline inheritance | Worktree preparation test | Source worktree, target worktree, copied files, deleted files, and base commit are recorded. |
| Root checkout mutates during child phase | Root-status guard test | Event registration is blocked and the mutation is surfaced explicitly. |
| Evidence exists only in root checkout | Evidence-location validation test | Result is rejected before `goal update`, `goal review`, or `goal gate` registration. |
| Evidence exists outside assigned worktree | Evidence-location validation test | Result is rejected as out-of-scope evidence. |
| File inventory completeness | Inventory test | Output includes tracked modifications, staged changes, deletions, and untracked files. |
| Gate failure classification | Validation or fixture test | Failure evidence distinguishes environment setup failure, shell-command typo, implementation failure, and optional diagnostic failure. |

### Minimum command evidence

- `pnpm check`
- `pnpm test`
- `pnpm workbench:build`
- `git diff --check`
- `pnpm --silent symphony goal-status --goal v43-goal-supervisor-stabilization --json`

## task-3: Route engine and status reconciliation

### Required replay and test coverage

| Case | Minimum proof surface | Expected signal |
| --- | --- | --- |
| Worker completion | Route replay sample | Next action resolves to reviewer. |
| Reviewer `needs-revision` | Route replay sample | Next action resolves back to worker revision. |
| Reviewer approval only | Route reconciliation test | Task is not counted as main-verified or fully complete. |
| Main verification failure | Route replay sample | Flow returns to worker revision, then reviewer, then main verifier. |
| Release closeout without authorization | Closeout guard test | Closeout remains blocked with exact operator action required. |
| One consumed valid result | Event registration test | Exactly one goal event is appended. |
| Duplicate consume attempt | Idempotency test | No second goal event is appended. |
| `goal-status` mismatch after reviewer approval | Reconciliation replay sample | Warning surfaces that reviewer approval is not main verification. |
| `goal-status` mismatch after failed main verification | Reconciliation replay sample | Warning surfaces route disagreement until valid worker/reviewer/main-verifier sequence is restored. |

### Minimum command evidence

- `pnpm check`
- `pnpm test`
- `pnpm workbench:build`
- `git diff --check`
- `pnpm --silent symphony goal-status --goal v43-goal-supervisor-stabilization --json`
- `pnpm --silent symphony goal next --goal v43-goal-supervisor-stabilization --json`

## task-4: Daemon, heartbeat, notifications, and progress visibility

### Required replay and test coverage

| Case | Minimum proof surface | Expected signal |
| --- | --- | --- |
| Healthy daemon with active child | Daemon-state test | Status reports daemon-active; no duplicate work is created. |
| Stopped daemon with no active lease | Daemon-state test | One documented restart path is available. |
| Stale daemon with active child | Heartbeat replay sample | Status reports stale child and asks for operator inspection or restart; it does not dispatch duplicate work. |
| Recent manual tick without daemon process | State projection test | Output distinguishes manual freshness from daemon health. |
| Daemon stopped with recent provider progress | Progress projection test | Output shows recent progress without claiming daemon-active. |
| Approval-required state | Notification test | Operator-visible notification includes the exact blocked command or flag. |
| Controlled provider operation progress | Progress projection test | Summary cites provider id, operation id, timeout policy, sanitized status, artifact refs, and recovery note only. |
| Secret-bearing provider output | Redaction boundary test | Raw provider output and secret-looking values are not exposed in status or notifications. |

### Minimum command evidence

- `pnpm check`
- `pnpm test`
- `pnpm workbench:build`
- `git diff --check`
- `pnpm --silent symphony goal-status --goal v43-goal-supervisor-stabilization --json`

## Review rule

Reviewer evidence should call out missing rows from this matrix as concrete gaps. Main verification evidence should state which task-specific rows were validated directly and which remained covered only by worker or reviewer proof.
