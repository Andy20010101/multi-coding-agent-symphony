# v43+ Goal Supervisor Stability Prep

Date: 2026-06-08

Baseline:

- v43 task implementation is complete through `task-4`.
- Latest verified v43 worktree: `/Users/andy/.codex/worktrees/v43-task-4-daemon-heartbeat-progress`
- Latest verified v43 branch: `v43-task-4-daemon-heartbeat-progress`
- Latest verified v43 head: `841904b62f46069317b43e8cca29f59d684aaac6`
- Root checkout at inspection: `/Users/andy/Documents/project/multi-coding-agent-symphony`
- Root branch after full release: `main`
- Root head after scoped closeout: `172140938503637dae909dc0daf87367ea5e9832`
- Root head after GitHub release evidence: `2a8ae51fd4c6ebebb99727cfdf6c9716e8b94665`
- `origin/main` after GitHub release evidence: `2a8ae51fd4c6ebebb99727cfdf6c9716e8b94665`
- Release evidence: `docs/plans/v43-release-evidence-2026-06-08.md`
- GitHub release evidence: `docs/plans/v43-github-release-evidence-2026-06-08.md`
- Release closeout state after scoped closeout: `releaseReady: true`
- Release tag evidence gate after full release: `passed`
- Repository tag: `v43`
- Tag object: `22b197e88d2a698b5c2ddc3a65f24e5e67447b64`
- Tag peeled commit: `172140938503637dae909dc0daf87367ea5e9832`
- GitHub Release: `https://github.com/Andy20010101/multi-coding-agent-symphony/releases/tag/v43`
- GitHub Release published at: `2026-06-07T17:42:15Z`
- External supervisor script: `/Users/andy/.codex/local-goal-supervisor/bin/local-goal-supervisor.mjs`
- External supervisor goal: `v43-goal-supervisor-stabilization`
- Doctor timestamp after scoped closeout: `2026-06-07T17:38:54.831Z`

## Purpose

This prep note separates the completed v43 scoped closeout from the next stabilization work for the temporary project-external coding system.

The items below should not be silently added to v43 release scope unless a release blocker proves they are required. They are the backlog for making the temporary supervisor reliable enough to keep serving v44+ work, and they are also the input for a later project-internal module.

## Current State

The temporary supervisor has already handled the important v43 flow:

- worker, reviewer, and main-verifier child phases for `task-4` returned valid bounded results.
- task-4 evidence was written in the assigned worktree.
- default gates passed in the verified task worktree: `pnpm check`, `pnpm test`, `pnpm workbench:build`, and `git diff --check`.
- root checkout was clean after the release evidence commit.
- no child thread was active after the release evidence commit.
- goal ledger reported `releaseReady: true`.
- goal ledger reported `tagEvidence: passed` after GitHub release evidence registration.
- `v43` was published as an annotated tag and GitHub Release.

Before closeout, the active block was explicit release authorization:

```text
Release closeout requires --allow-closeout.
```

That block is still useful as a stabilization input because the daemon recorded repeated blocked ticks before closeout. Operator notifications were created for the closeout block:

- notification id: `notice_fe0b27ae-38ac-453c-b008-c55a2c66a95f`
- notification thread: `019ea308-f338-7720-966e-6a245dcae51a`
- notification turn: `019ea308-f38a-7811-a7ef-3a0af3cb33a7`
- notification id: `notice_b34272b5-e7aa-44ce-ade5-5e254f60381e`
- notification thread: `019ea326-51f8-7011-90f2-910ea7690a2f`
- notification turn: `019ea326-5249-7f73-a77f-243ba944b9c0`

After closeout, doctor reported the plan complete and the daemon stopped:

- plan status: `complete`
- plan reason: `release.ready-declared is recorded and all runbook release gates have passed.`
- daemon status: `stale`
- daemon health status: `stopped`
- stopped at: `2026-06-07T17:34:49.106Z`

## Immediate Stabilization Items

### 1. Blocked-state quiesce

When the runner reaches a deterministic operator block and a notification already exists, the daemon should stop writing identical blocked ticks every interval.

Required behavior:

- keep the daemon health record readable.
- preserve the latest blocked plan and exact unblock command.
- create only one operator notification for the same block key.
- move the daemon to a waiting-operator state instead of producing repeated `tick blocked` records.
- resume only after the operator command changes state, for example by running release closeout with `--allow-closeout`.

Replay cases:

- release closeout blocked without an existing notification creates one notice.
- the same release block with an existing notice does not create a second notice.
- repeated daemon intervals do not append duplicate blocked ticks.
- an operator unblock command clears the waiting state and lets the runner continue.

### 2. PTY-backed daemon launcher

The reliable daemon launch path currently uses `script` to give the process a PTY. A plain `nohup node ... daemon` path has failed in practice. This should become a small launcher command instead of a remembered shell pattern.

Required behavior:

- launch with the known-good PTY path.
- write the process id, PTY log path, daemon id, goal id, interval, and max tick budget.
- expose one doctor field that says whether the daemon is running under the expected launcher.
- provide a matching stop command that shuts down the recorded daemon process without touching unrelated terminals.
- keep the manual one-shot tick command separate from daemon health.

Replay cases:

- launcher starts a daemon and doctor reports `daemon-active`.
- stale pid file with no running process reports `daemon-stopped`.
- manual tick does not make doctor report a healthy daemon.
- stop command records a daemon stop event and leaves no active child lease behind.

### 3. Active progress and stall classifier

The runner needs a deterministic way to tell the difference between an active child, a stale child, a queued result-only prompt, and a completed child whose result has not yet been consumed.

Inputs to record:

- thread id and latest readable turn status.
- latest thread update timestamp when available.
- result escrow timestamp.
- assigned worktree branch, head, and dirty state.
- latest file inventory change time for assigned evidence paths.
- latest child event registered in the goal ledger.

Required behavior:

- do not dispatch a duplicate child while an active lease exists.
- do not call a child stale during a bounded grace period after observable progress.
- surface a stalled child as an operator-visible state with the exact recovery action.
- consume a valid pending result before consulting a lossy app-server reader.

Replay cases:

- active thread with recent progress waits.
- active thread with no progress after the grace window reports stalled.
- completed valid result in escrow is consumed before app-server `notLoaded`.
- completed result with dirty assigned worktree is rejected before event registration.

### 4. Approval and release resume path

Operator-required actions must be visible without requiring the user to read raw state files.

Required behavior:

- include the exact command, required flag, goal id, target role, and current worktree in the notice.
- say whether the daemon can continue after the command or must be restarted.
- record the notice status change after operator action.
- keep tag, push, publish, and release closeout behind explicit operator approval.

Replay cases:

- release closeout without authorization blocks and emits a notice.
- closeout with authorization runs only the runbook-defined release gates.
- tag or GitHub Release publication is not attempted unless the runbook and operator action require it.

## Medium Priority Items

### 5. Fixed run date and timezone propagation

Evidence files currently mix local dates and UTC timestamps. That is acceptable for audit logs, but generated evidence names and evidence bodies should say which clock they use.

Required behavior:

- pass `runDate`, `timezone`, and `generatedAtUtc` into child prompts and evidence skeletons.
- use the same `runDate` for evidence filenames created by one role.
- keep UTC timestamps for machine records.

### 6. External runner version snapshot

The temporary runner lives outside the repository. Its behavior can change without a commit. Before relying on it for v44+ work, each major supervisor run should capture a small version snapshot.

Required evidence:

- script path.
- script digest.
- selftest command and result.
- launcher command used for the active daemon.
- doctor output reference.
- list of external runner fixes applied since the last release.

Suggested evidence path:

```text
docs/plans/controller/local-goal-supervisor-v43-mvp-evidence-2026-06-08.md
```

### 7. Worktree archive policy

Many historical task worktrees are still present. They should not be removed before release closeout or before their branch/evidence status is reconciled.

Required behavior:

- after release merge, list worktrees by goal, branch, head, dirty state, and whether the branch was merged.
- never delete dirty task worktrees automatically.
- preserve task worktrees that contain evidence not yet merged.
- archive or remove only clean, merged worktrees after an explicit cleanup command.

### 8. Project-internal migration path

The stable pieces should eventually move from the project-external runner into the product as a controlled supervisor module.

Candidate module boundaries:

- single state writer.
- app thread adapter.
- workspace manager.
- result protocol and parser.
- event registrar.
- route engine.
- progress observer.
- operator notification bridge.

This migration should not expand raw CLI execution. Real provider execution still belongs behind the controlled v41 runner path and its future stabilization work.

## Not In Scope For This Prep

- raw provider CLI execution.
- adding Gemini CLI, Kiro CLI, DeepSeek, or other active providers.
- browser terminal automation.
- tag, push, publish, or GitHub Release automation without explicit release authorization.
- daemon self-mutation without explicit operator action.
- deleting historical worktrees before v43 release closeout is complete.

## Suggested v43+ Task Split

### task-A: Blocked-state quiesce and approval resume

Deliverables:

- waiting-operator daemon state.
- duplicate-notice guard.
- unblock command handling.
- replay fixtures for release authorization.

Acceptance:

- repeated release blocks do not spam tick logs.
- operator notice is created once per block key.
- authorized closeout resumes from the same route decision.

### task-B: Daemon launcher and health wrapper

Deliverables:

- PTY-backed start command.
- stop command.
- doctor launcher fields.
- daemon pid/log evidence.

Acceptance:

- the launcher reproduces the currently working `script`-backed daemon behavior.
- stale pid and manual tick states are distinguishable.

### task-C: Progress and stall classifier

Deliverables:

- child progress record.
- stale active lease detection.
- result escrow priority.
- duplicate dispatch guard tests.

Acceptance:

- live children are not replaced.
- stuck children produce a bounded recovery state.
- valid completed results are consumed before lossy reader checks.

### task-D: Evidence date, version snapshot, and worktree cleanup runbook

Deliverables:

- evidence clock contract.
- external runner snapshot evidence template.
- post-release worktree cleanup checklist.

Acceptance:

- evidence filenames and bodies identify their date source.
- every major run can be traced to a runner digest and selftest result.
- cleanup cannot remove dirty or unmerged task worktrees.

### task-E: Project-internal supervisor migration spec

Deliverables:

- module boundary document.
- state-writer contract.
- adapter contracts for threads, workspaces, events, and notifications.
- non-goal list preserving provider and release boundaries.

Acceptance:

- the migration spec can be implemented without changing active provider policy.
- the temporary runner remains usable while project-internal work is planned.

## Next Operator Actions

- Let the release thread finish v43 closeout from the runbook-defined release gates.
- Keep this prep branch separate from the release branch unless the release manager identifies one of these items as a required release blocker.
- After v43 release merge, decide whether to merge this prep doc as a v43+ planning note or fold it into the next version planning pack.
