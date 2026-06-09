# v43+ Local Goal Supervisor Escrow Reader Order Replay Evidence

Local run date: 2026-06-08
Timezone: Asia/Shanghai

Goal id: `v43-plus-local-goal-supervisor-stability`
Backlog item: `B4`

Implementation target:

```text
/Users/andy/.codex/local-goal-supervisor/bin/local-goal-supervisor.mjs
```

Scratch goal:

- goal id: `b4-release-escrow-clean-1780892580`
- scratch repo worktree: `/tmp/b4-escrow-replay2.upOtnt`
- clean assigned release worktree: `/tmp/b4-release-thread.zKLkBj`

The scratch goal used one runbook task and one scoped release gate:

- task: `task-1`
- release gate: `release.docs-updated`

Before the replay started, the scratch goal was advanced through:

- `worker.evidence-recorded`
- `reviewer.approved`
- `main.verification-passed`
- `release.gate-passed` for `release.docs-updated`

At that point `pnpm --silent symphony goal next --goal b4-release-escrow-clean-1780892580 --json` returned:

- role: `release-manager`
- phase: `release-prep`
- reason: `All runbook tasks are main-verified and release gates are passed, but release.ready-declared is missing.`

## Why This Replay Exists

B4 was no longer about whether escrow-first ordering existed in code. The missing proof was closeout-phase behavior when the thread reader is stale, unreadable, or unavailable.

This replay bound release-manager leases to nonexistent thread ids on purpose:

- `missing-release-prep`
- `missing-complete-active`

If the runner tried to read or steer those threads first, the replay would fail. A successful replay therefore proves that valid escrow result consumption really does happen before thread-read dependence in these closeout paths.

## Replay A: release-prep Registers From Valid Escrow Without A Readable Thread

The runner state was initialized, then a manual adopted release-manager lease was bound as:

- thread id: `missing-release-prep`
- task id: `release`
- role: `release-manager`
- phase: `release-prep`
- assigned worktree: `/tmp/b4-release-thread.zKLkBj`

A valid bounded result was written directly to:

```text
/Users/andy/.codex/local-goal-supervisor/results/b4-release-escrow-clean-1780892580/missing-release-prep.txt
```

The result block used:

- `eventToRegister: release.ready-declared`
- `validation: closeout is waiting only for release.ready-declared`
- `filesChanged: none`

`tick --goal b4-release-escrow-clean-1780892580 --allow-closeout` returned:

- status: `completed-active-child`
- thread id: `missing-release-prep`
- recorded status: `result-ready`
- `recorded.recorded.readerCall.source: result-escrow-file`
- registered event id: `evt_c8f4aa1ddaac1a4c`
- registered event type: `release.ready-declared`

The validation stayed clean:

- `validation.valid: true`
- `cleanWorktreeGate.status: clean`
- `evidenceGate.status: passed`

After that tick, `pnpm --silent symphony goal next --goal b4-release-escrow-clean-1780892580 --json` returned:

- status: `complete`
- reason: `release.ready-declared is recorded and all runbook release gates have passed.`

This is the core B4 proof: the runner consumed and registered a valid closeout result from escrow even though the bound thread id was intentionally unreadable.

## Replay B: goal-next-complete Retires The Lease From Valid Escrow Without A Readable Thread

The runner state was then reinitialized after the goal already reached `complete`.

A second manual adopted release-manager lease was bound as:

- thread id: `missing-complete-active`
- task id: `release`
- role: `release-manager`
- phase: `release-prep`
- assigned worktree: `/tmp/b4-release-thread.zKLkBj`

Another valid bounded result was written directly to:

```text
/Users/andy/.codex/local-goal-supervisor/results/b4-release-escrow-clean-1780892580/missing-complete-active.txt
```

The result block used:

- `eventToRegister: release.ready-declared`
- `validation: release ready already declared; retire the active lease using the bounded result`

`plan --goal b4-release-escrow-clean-1780892580 --allow-closeout` returned:

- status: `action-required`
- action kind: `complete-active-thread`
- pending result source: `result-escrow-file`
- reason: `Goal next is complete, and the active lease already has a valid result. Retire the lease instead of treating the stale active pointer as a hard block.`

`tick --goal b4-release-escrow-clean-1780892580 --allow-closeout` then returned:

- status: `completed-active-thread-after-goal-complete`
- thread id: `missing-complete-active`

Again, no readable thread was required to finish the closeout-phase cleanup path.

## Boundary Note

The first scratch attempt for this replay bound the release-manager lease to the scratch repo root and failed before registration because the assigned worktree was dirty from the temporary fixture file.

That failure was useful. It shows two independent rules are active at once:

1. valid escrow can outrank thread-read dependence;
2. release-manager results still must come from a clean assigned worktree.

The successful replay switched only the assigned worktree to a separate clean detached checkout. The escrow-first ordering then passed exactly as intended.

## What This Replay Proved

- Closeout-phase result consumption does not need a readable active thread when a valid bounded escrow result already exists.
- The runner uses `result-escrow-file` as the authoritative source before any thread-read path in both:
  - release-prep event registration
  - post-complete stale-lease retirement
- Reader availability and worktree cleanliness are separate concerns. An unreadable thread is acceptable when escrow is valid; a dirty assigned worktree is not.
