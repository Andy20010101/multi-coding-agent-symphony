# v43 Evidence Skeletons

Date: 2026-06-07
Goal id: `v43-goal-supervisor-stabilization`
Baseline: `v42 Goal Supervisor Runtime Context Loop`

These skeletons define the minimum structure for v43 worker, reviewer, and main verification evidence. Fill them with real commands, real outputs, and real file paths only.

## Common worker skeleton

```md
# v43 task-<n> worker evidence

Goal: `v43-goal-supervisor-stabilization`
Task: `task-<n>` - <task title>
Role: `worker`
Thread: `<thread-id>`
Branch: `<task-branch>`
Worktree: `<absolute-worktree>`
Base commit: `<base-commit>`
Date: `2026-06-07`

## Sources checked
- <plan/runbook/fixture/tests/code paths actually read>

## Implementation summary
- <what changed>

## Files changed
- `<path>`

## Task-specific proof
- <task-specific replay/test rows covered>

## Commands run with exact results
| Command | Outcome |
| --- | --- |
| `pnpm check` | <exact result> |
| `pnpm test` | <exact result> |
| `pnpm workbench:build` | <exact result> |
| `git diff --check` | <exact result> |
| `pnpm --silent symphony goal-status --goal v43-goal-supervisor-stabilization --json` | <exact result> |
| `<task-specific command if required>` | <exact result> |

## Boundary notes
- <what remained out of scope>

## Reviewer handoff checklist
- <what reviewer must verify independently>
```

## Common reviewer skeleton

```md
# v43 task-<n> review evidence

Goal: `v43-goal-supervisor-stabilization`
Task: `task-<n>` - <task title>
Role: `reviewer`
Verdict: `APPROVED` or `NEEDS_REVISION`
Reviewed branch: `<task-branch>`
Reviewed diff base: `main`
Date: `2026-06-07`

## Scope reviewed
- <files and evidence reviewed>

## Findings
- <ordered findings or "No blocking findings.">

## Commands run with exact results
| Command | Outcome |
| --- | --- |
| `pnpm check` | <exact result or reviewed prior evidence> |
| `pnpm test` | <exact result or reviewed prior evidence> |
| `pnpm workbench:build` | <exact result or reviewed prior evidence> |
| `git diff --check` | <exact result> |

## Boundary notes
- <independent review boundaries>

## Required follow-up
- <only when NEEDS_REVISION>
```

## Common main verification skeleton

```md
# v43 task-<n> main verification evidence

Goal: `v43-goal-supervisor-stabilization`
Task: `task-<n>` - <task title>
Role: `main-verifier`
Verdict: `passed` or `blocked`
Merged branch: `<task-branch>`
Main base before merge: `<commit>`
Main head after merge: `<commit>`
Date: `2026-06-07`

## Preconditions
- Reviewer verdict path: `<review-evidence-path>`
- Main was clean before merge: <yes/no>
- Fast-forward merge succeeded: <yes/no>

## Commands run with exact results
| Command | Outcome |
| --- | --- |
| `git checkout main` | <exact result> |
| `git pull --ff-only` | <exact result> |
| `git merge --ff-only <task-branch>` | <exact result> |
| `pnpm check` | <exact result> |
| `pnpm test` | <exact result> |
| `pnpm workbench:build` | <exact result> |
| `git diff --check` | <exact result> |
| `pnpm --silent symphony goal-status --goal v43-goal-supervisor-stabilization --json` | <exact result> |
| `<task-specific command if required>` | <exact result> |

## Verification notes
- <what was directly verified on main>

## Boundary notes
- <what was not verified here>
```

## task-1: App thread and result protocol contracts

Worker evidence path: `docs/plans/v43-task-1-worker-evidence-2026-06-07.md`
Review evidence path: `docs/plans/v43-task-1-review-evidence-2026-06-07.md`
Main verification evidence path: `docs/plans/v43-task-1-main-verification-evidence-2026-06-07.md`

### Worker must include

- `record-thread` duplicate rejection proof.
- Unreadable thread id rejection proof.
- `notLoaded` wait-state proof.
- Missing or malformed result block correction proof.
- Repeated invalid output -> manual recovery proof.
- Accepted terminal event set proof beyond success-only output.
- `pnpm --silent symphony goal next --goal v43-goal-supervisor-stabilization --json` result.

### Reviewer must include

- Whether result parsing is append-only and idempotent.
- Whether accepted terminal events cover success and non-success outcomes.
- Whether correction remains bounded to one retry before recovery.
- Whether any chat-prose-only path still exists.

### Main verifier must include

- Main-branch validation of parser, adapter, and replay tests.
- Confirmation that `goal-status` and `goal next` still return valid JSON after merge.

## task-2: Workspace and evidence safety

Worker evidence path: `docs/plans/v43-task-2-worker-evidence-2026-06-07.md`
Review evidence path: `docs/plans/v43-task-2-review-evidence-2026-06-07.md`
Main verification evidence path: `docs/plans/v43-task-2-main-verification-evidence-2026-06-07.md`

### Worker must include

- Missing dependency / `node_modules` blocker proof.
- Dependency setup failure blocker proof.
- Dirty-baseline inheritance record proof.
- File inventory proof for tracked, staged, deleted, and untracked files.
- Evidence outside assigned worktree rejection proof.
- Root checkout mutation guard proof.

### Reviewer must include

- Whether dispatch can still happen on a known-bad workspace.
- Whether evidence-location checks run before event registration.
- Whether root checkout safety is explicit rather than implied from branch names or prompts.

### Main verifier must include

- Main-branch validation of workspace-preflight and evidence-location tests.
- Confirmation that no new root-checkout mutation path was introduced by merge.

## task-3: Route engine and status reconciliation

Worker evidence path: `docs/plans/v43-task-3-worker-evidence-2026-06-07.md`
Review evidence path: `docs/plans/v43-task-3-review-evidence-2026-06-07.md`
Main verification evidence path: `docs/plans/v43-task-3-main-verification-evidence-2026-06-07.md`

### Worker must include

- Worker -> reviewer route proof.
- Reviewer `needs-revision` -> worker route proof.
- Failed main verification -> worker -> reviewer -> main verifier route proof.
- Reviewer approval not counted as main verification proof.
- `goal-status` mismatch warning proof.
- One consumed valid result -> one goal event proof.
- `pnpm --silent symphony goal next --goal v43-goal-supervisor-stabilization --json` result.

### Reviewer must include

- Whether any route still infers completion from summarized ledger state alone.
- Whether release closeout remains blocked without explicit authorization.
- Whether duplicate result consumption can still append duplicate events.

### Main verifier must include

- Main-branch validation of route replay coverage.
- Confirmation that `goal-status` and `goal next` remain coherent after merge.

## task-4: Daemon, heartbeat, notifications, and progress visibility

Worker evidence path: `docs/plans/v43-task-4-worker-evidence-2026-06-07.md`
Review evidence path: `docs/plans/v43-task-4-review-evidence-2026-06-07.md`
Main verification evidence path: `docs/plans/v43-task-4-main-verification-evidence-2026-06-07.md`

### Worker must include

- Distinct daemon-active / daemon-stopped / daemon-stale / manual-tick-recent proof.
- Stale active-child no-duplicate-dispatch proof.
- Approval-required notification proof.
- Provider progress projection proof with sanitized fields only.
- Recovery or restart path proof for stopped idle runner.

### Reviewer must include

- Whether manual ticks can still be mistaken for daemon health.
- Whether blocked or approval-required states are visible without raw state JSON.
- Whether any raw provider output or secret-bearing field leaks through progress surfaces.

### Main verifier must include

- Main-branch validation of daemon/progress tests.
- Confirmation that supervisor visibility still respects the v41 controlled-runner boundary.

## Review rule

If a task evidence file omits a task-specific required insert from this document, reviewer evidence should call that out directly rather than treating the document shape as optional.
