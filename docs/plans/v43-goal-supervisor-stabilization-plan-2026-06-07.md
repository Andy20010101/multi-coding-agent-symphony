# v43 Goal Supervisor Stabilization Plan

Date: 2026-06-07

Goal id draft: `v43-goal-supervisor-stabilization`

Baseline:

- v42 release is complete and frozen.
- GitHub Release: `https://github.com/Andy20010101/multi-coding-agent-symphony/releases/tag/v42`
- Tag: `v42`
- Tag peeled commit: `3ccacc5a6ce27318064ab7d5f2d3551d41a0388e`
- `origin/main` at planning handoff: `d558b88e4dd9bff25d01736b940804cc9091681f`

Source evidence:

- `docs/plans/v42-goal-supervisor-runtime-context-loop-plan-2026-06-06.md`
- `docs/plans/app-core-v41-v42-goal-runbooks/v42_goal-supervisor-runtime-context-loop_goal_runbook_latest.md`
- `fixtures/contracts/goal-runbook.v42-goal-supervisor-runtime-context-loop.v1.json`
- `docs/plans/controller/local-goal-supervisor-v42-mvp-notes-2026-06-06.md`
- `docs/plans/v42-release-evidence-2026-06-06.md`
- `docs/plans/v42-github-release-evidence-2026-06-06.md`
- `docs/plans/workbench-v33-v40-app-runtime-runbooks/00_GLOBAL_RULES_AND_FLOW_LATEST_COMMANDS.md`
- `docs/plans/app-core-v41-v42-goal-runbooks/00_GLOBAL_RULES_AND_FLOW_LATEST_COMMANDS.md`
- `docs/release-checklist.md`

Planning deliverables:

- `docs/plans/v43-goal-supervisor-stabilization-plan-2026-06-07.md`
- `docs/plans/v43-goal-supervisor-stabilization-execution-prompts-2026-06-07.md`
- `docs/plans/v43-goal-supervisor-stabilization-replay-test-matrix-2026-06-07.md`
- `docs/plans/v43-goal-supervisor-stabilization-evidence-skeletons-2026-06-07.md`
- `docs/plans/v43-planning-pr-brief-2026-06-07.md`
- `docs/plans/app-core-v43-goal-runbooks/00_GLOBAL_RULES_AND_FLOW_LATEST_COMMANDS.md`
- `docs/plans/app-core-v43-goal-runbooks/v43_goal-supervisor-stabilization_goal_runbook_latest.md`
- `docs/plans/app-core-v43-goal-runbooks/README_HOW_TO_START.md`
- `fixtures/contracts/goal-runbook.v43-goal-supervisor-stabilization.v1.json`

Task support docs:

- Replay/test matrix: `docs/plans/v43-goal-supervisor-stabilization-replay-test-matrix-2026-06-07.md`
- Evidence skeletons: `docs/plans/v43-goal-supervisor-stabilization-evidence-skeletons-2026-06-07.md`
- PR brief: `docs/plans/v43-planning-pr-brief-2026-06-07.md`

## Positioning

v43 is a stabilization release. It takes the experience from the temporary project-external supervisor and coding loop used during v41-v42, then turns the stable parts into project-internal planning for a controlled supervisor runtime.

v43 does not mean the external system has already been fully merged into the product. It defines the minimum project-internal contracts, gates, replay coverage, and operator-visible behavior needed before that kind of loop can be treated as a reliable product surface.

## Scope

v43 includes:

- App thread binding and result consumption contracts for managed child roles.
- Result-block parsing, correction, replay, and manual recovery boundaries.
- Worktree preparation, dependency preflight, verified dirty-baseline inheritance, and evidence-location checks.
- Deterministic route transitions from worker to reviewer to main verifier to release closeout.
- Reconciliation between supervisor routing and existing `goal-status` summaries.
- Daemon, heartbeat, stale-runner, active-child, and operator-notification behavior.
- Progress records for long controlled provider-runner operations, using v41 controlled runner outputs only.

v43 excludes:

- Promoting Gemini CLI, Kiro CLI, or DeepSeek to active providers.
- Raw provider CLI execution, arbitrary shell execution, browser terminals, or renderer-owned command construction.
- A new product surface beyond the supervisor stabilization path.
- A broad rewrite of v41 controlled provider runner stability.
- Tagging, publishing, or release closeout automation without explicit operator approval.
- Inferring task completion, approval, main verification, release readiness, provider readiness, or worktree safety from branch names, filenames, prompt text, frontend state, or command text.

## Boundary With v41 and v42

v41 owns the controlled provider runner and backend provider evidence path. v43 may read v41 operation ids, sanitized artifact refs, provider ids, timeout state, and failure layers, but must not expand the provider allowlist or add raw provider CLI fallback.

v42 released the runtime context loop and recorded the external supervisor MVP notes. The tracked repository now also contains the restored v42 plan, runbook, and fixture entry points. v43 consumes all of those as planning input. v43 should not reopen v42 scope, move the v42 tag, or change v42 release evidence.

The existing goal/runbook command spine remains the project kernel:

```text
goal-status -> goal next -> goal prompt -> goal update/review/gate -> goal closeout -> symphony next --goal latest
```

v43 work must preserve explicit event semantics:

- worker events use `goal update`.
- reviewer verdicts use `goal review`.
- main verification and release readiness use `goal gate`.
- release closeout requires explicit operator intent.

## Task Plan

### task-1: App thread and result protocol contracts

Goal:

Define the project-internal contracts for child thread binding, minimal App reads, result block rendering, result parsing, correction prompts, and manual recovery.

Non-goals:

- Do not implement a new App product surface.
- Do not treat app-server `notLoaded` as a failed child result.
- Do not consume raw chat prose as final evidence.
- Do not loop correction prompts forever.

Input contract:

- Goal id, task id, role, request id, assigned thread id, assigned worktree, base commit, worker evidence refs when role requires them, and accepted terminal events for the role.
- App reader capability record with the exact call shape used. The minimal supported read path is `readThread(threadId)` with no optional paging or output parameters.
- Bound prompt generated after the final thread id is known.

Output contract:

- Append-only parsed result records.
- One accepted result block per consumed child phase.
- Correction action for one missing or malformed result block.
- Manual recovery action when correction cannot be delivered or when the child stays active behind a queued result-only prompt.
- Audit record for every `record-thread`, `record-result`, correction prompt, and consumed result.

Acceptance:

- A created thread is not marked active until it can be read back through the stable App-side adapter.
- `record-thread` rejects duplicate bindings and unreadable thread ids.
- App-server `notLoaded` is a non-mutating wait state.
- A pending valid recorded result is registered before the active thread reader is consulted.
- Reviewer, main-verifier, and release-manager result contracts show all valid terminal events, not only success events.
- Replay tests cover invalid JSON, Markdown fences, missing fields, wrong thread id, missing result block, one correction, repeated invalid output, and app-server `notLoaded`.

### task-2: Workspace and evidence safety

Goal:

Make assigned worktrees safe enough for unattended child phases by preparing dependencies, inheriting verified dirty baselines, generating file inventories, and rejecting evidence written outside the assigned worktree.

Non-goals:

- Do not merge dirty worktrees automatically.
- Do not let child prompts decide the write scope.
- Do not treat plain `git diff` as a complete inventory.
- Do not run full repository release gates unless the active runbook or operator requests them.

Input contract:

- Source task id when inheriting a verified dirty baseline.
- Source worktree, target worktree, branch, base commit, copied files, deleted files, and dependency setup status.
- Runtime workspace roots and evidence path policy.
- Required gate command templates for the role.

Output contract:

- Workspace preparation record.
- Dependency preflight result, including deterministic setup command or setup blocker.
- File inventory containing tracked modifications, staged changes, deletions, and untracked files.
- Root checkout status before and after each child phase.
- Evidence-location validation before event registration.

Acceptance:

- Missing `node_modules` in a package worktree is detected before dispatch.
- Dependency setup failures produce `workspace-dependency-setup-failed` blockers instead of dispatching a known-bad child.
- Verified dirty baseline inheritance records source and target details.
- Worker, reviewer, and main-verifier results are rejected when `evidenceRef` exists only in the root checkout or outside the assigned worktree.
- Root checkout mutations made by a child are surfaced as blockers before event registration.
- Gate evidence distinguishes environment setup failure, shell-command typo, implementation failure, and optional diagnostic failure.

### task-3: Route engine and status reconciliation

Goal:

Make supervisor route decisions deterministic and consistent with project goal status, especially after review approvals, failed main verification, worker revisions, and release closeout blocking.

Non-goals:

- Do not infer progress from latest ledger event type alone.
- Do not count reviewer approval as main verification.
- Do not dispatch release-manager closeout without explicit operator approval.
- Do not add new role semantics outside worker, reviewer, main-verifier, release-manager, and controller.

Input contract:

- Append-only goal events.
- Local valid result records.
- Current active lease, if any.
- Existing `goal-status`, `goal next`, and `goal closeout` outputs.
- Closeout authorization state.

Output contract:

- Next-route decision with task id, role, reason, source events, and blocking condition when blocked.
- Status reconciliation warning when supervisor routing and `goal-status` disagree.
- Closeout blocked notification with the exact required operator action.
- Replay fixture for every route transition.

Acceptance:

- Worker completion routes to reviewer.
- Reviewer `needs-revision` routes to worker revision.
- Main verification failure routes to worker revision, then reviewer, then back to main verifier after reviewer approval.
- Reviewer approval without main verification is not counted as fully completed in release or supervisor logic.
- Release closeout remains blocked until closeout authorization is recorded.
- Every consumed valid result appends exactly one goal event.
- Replay tests cover the task-4 and task-5 `goal-status` mismatch observed in v42 notes.

### task-4: Daemon, heartbeat, notifications, and progress visibility

Goal:

Make the supervisor runtime observable and restart-safe without creating duplicate child work or hiding operator-required actions.

Non-goals:

- Do not let a stale heartbeat create duplicate active leases.
- Do not make manual ticks look like daemon health.
- Do not auto-enter release closeout from a daemon wakeup.
- Do not expose raw provider output or secret-bearing provider state.

Input contract:

- Daemon pid file.
- Daemon health file.
- Last daemon tick timestamp.
- Last manual tick timestamp.
- Active lease id and child thread id.
- Current provider operation id when a controlled provider runner is active.
- Operator-notification queue.

Output contract:

- Daemon status split into daemon process health and runner progress.
- Stale active-child notification with thread id and next inspection command.
- Approval-required notification with the exact blocked command or flag.
- Provider progress summary with provider id, operation id, started-at time, timeout policy, latest sanitized status, and recovery note.
- Heartbeat decision that either does nothing, restarts a stopped idle runner, or asks for operator action.

Acceptance:

- `doctor` can distinguish `daemon-active`, `daemon-stopped`, `daemon-stale`, `manual-tick-recent`, and `daemon-stopped-with-recent-progress`.
- A stale daemon with an active child does not start duplicate work.
- A stopped daemon with no active lease can be restarted through one documented launch path.
- Approval-required and blocked states are visible without reading raw state JSON.
- Long controlled provider checks record progress before and after each provider attempt.
- Provider progress cites v41 controlled runner operation ids and sanitized artifact refs, not prose-only claims or raw CLI output.

## Deferred Past v43

Leave these for v44 or later:

- Full product UI for managing supervisor child threads.
- Multi-goal scheduling and prioritization.
- Cross-machine daemon supervision.
- Provider installation, login, OAuth flows, and credential repair.
- Gemini CLI, Kiro CLI, DeepSeek, or other active provider promotion.
- Raw provider CLI execution or generic shell execution.
- Automatic merge, push, tag, GitHub Release publication, or release note generation.
- Generalized model routing beyond the current controller, worker, reviewer, main-verifier, recovery, and release roles.
- Broad v41 controlled provider runner stability expansion beyond the operation status fields v43 needs to observe.

## Release Gates Draft

v43 explicitly inherits the scoped v37-v42 gate set in the current fixture draft. If later work expands the gate set, update the fixture and runbook together:

```sh
pnpm check
pnpm test
pnpm workbench:build
git diff --check
```

Repository tag/full release validation still follows `docs/release-checklist.md` and is outside a scoped closeout unless the operator asks for it.

## Planning Risks

- `goal-status` previously counted approved tasks as completed before main verification. If this is intentional copy-only progress, v43 needs a separate field name before supervisor logic can depend on it.
- The tracked v42 plan, runbook, and fixture were restored after the v42 release from managed state and release evidence. v43 should treat those files as the repository historical entry point, not as proof that a new v42 implementation pass was run on current `main`.
