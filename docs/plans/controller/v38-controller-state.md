# v38 Controller State

Date: 2026-06-05

## Current Goal

Goal id: `v38-provider-hub-capability-profiles`

Goal title: `v38 Agent CLI Provider Hub MVP`

Baseline:

```text
v37 release tag: v37
v37 tag peeled commit: 075990a0b67c334220bd33b95ff4eb4f88e274bd
origin/main: 7f0108b8c9c4658219f91aa8c687f3b1ae03cfd0
GitHub Release: https://github.com/Andy20010101/multi-coding-agent-symphony/releases/tag/v37
```

Managed-goal state:

```text
v38 managed runbook is registered.
Registered by controller command: /goal continue
Plan hash: sha256:3ab0de93b8fc56bff95d75d7df230fe66073ae0782d0030b571b371bdcf3dfe7
Runbook state: .symphony/goals/runbooks/v38-provider-hub-capability-profiles.json
Latest active goal pointer: .symphony/goals/latest-active-goal.json
```

Use v37 release, tag, and GitHub Release evidence on `origin/main` as the v37 baseline source.

## Active Work

Active v38 branch:

```text
codex/v38-task-5-provider-hub-panel-evidence
```

Active v38 worktree:

```text
/Users/andy/.codex/worktrees/v38-task-5/multi-coding-agent-symphony
```

Controller ops branch:

```text
codex/controller-loop-ops
```

## v38 Task Order

1. `task-1`: Agent CLI provider profile contract
2. `task-2`: Agent CLI health check API
3. `task-3`: Capability profile mapping
4. `task-4`: Worker/reviewer lane assignment preview
5. `task-5`: Agent CLI Provider Hub panel + evidence

Current controller state:

```text
task-1 through task-5 are release-ready in the managed goal ledger.
All fixture release gates are passed.
Release readiness is declared.
Latest release-ready source: goal-event-log.v1:evt_32261d4927aea700.
controller command policy: use phase rotation; /goal continue is one-step compatibility only.
after automatic compaction, the compacted controller thread must not continue review, verification, gates, or event registration.
```

## Scope Decisions

- v38 only does Agent CLI Provider Hub MVP.
- Active providers are `claude-code-cli` and `codex-cli`.
- Gemini CLI, Kiro CLI, and DeepSeek active provider are out of scope.
- DeepSeek may only be a sanitized backend profile behind an existing CLI provider.
- v38 does not implement a real CLI runner.
- v41 owns Controlled CLI Provider Runner + Backend Completion.

## Release Gates

Use fixture `releaseGates` as source of truth:

```text
release.pnpm-check
release.pnpm-test
release.workbench-build
release.diff-check
release.docs-updated
```

Default commands:

```sh
pnpm check
pnpm test
pnpm workbench:build
git diff --check
```

Do not run mutation, audit, doctor, real CLI, tag, push, or publish unless explicitly requested or explicitly listed in the current runbook.

## Latest Closeout

Date: 2026-06-05

Command context:

```text
Received approval to continue v38 scoped closeout.
This closeout followed the v38 runbook fixture releaseGates only.
No repository tag/full release was requested.
No mutation, audit, doctor, real CLI, tag, push, or publish command was run.
```

Release evidence:

```text
Evidence ref: docs/plans/v38-release-gates-evidence-2026-06-05.md.
Evidence branch: codex/v38-task-5-provider-hub-panel-evidence.
Evidence commit: 996044c77305ec355a31bcfa3aeba63252d0c768.
Product gate commit before evidence file: 8372185077d922a48029f99561942bd2c00e2dc3.
```

Default gates run from the task-5 worktree:

```text
pnpm check: passed.
pnpm test: passed, 1015 tests passed and 0 failed.
pnpm workbench:build: passed.
git diff --check: passed.
```

Registered release gate events:

```text
release.pnpm-check: evt_d60e9f5c7fa33186.
release.pnpm-test: evt_b71ef02de191b436.
release.workbench-build: evt_e050f9bfbfa56a5a.
release.diff-check: evt_8785fb3b1c9e5d2b.
release.docs-updated: evt_9c64796cd99cf686.
release.ready-declared: evt_32261d4927aea700.
```

Post-closeout state:

```text
Managed goal next action: complete.
Managed ledger releaseReady: true.
Release ready source: goal-event-log.v1:evt_32261d4927aea700.
All 5 v38 tasks are release-ready in the managed ledger.
```

## Latest Reconciliation

Date: 2026-06-05

Command context:

```text
Received /goal verify task-5 --fresh-controller.
This fresh controller consumed the completed task-5 main-verifier result only.
No release closeout, mutation, audit, doctor, real CLI, tag, push, publish, or release gate execution was run.
```

Reconciled state before registration:

```text
Controller branch: codex/controller-loop-ops.
Controller HEAD before registration: e9b08c1c59e0a17708e69a6ad85ee08f12a8f781.
origin/main: 7f0108b8c9c4658219f91aa8c687f3b1ae03cfd0.
Task-5 worktree: /Users/andy/.codex/worktrees/v38-task-5/multi-coding-agent-symphony.
Task-5 branch: codex/v38-task-5-provider-hub-panel-evidence.
Task-5 HEAD: b9711646c55117ce1a9a48fbed34dd1ecd70387d.
Managed ledger before registration: task-5 approved, reviewVerdict APPROVED, mainVerificationRef null.
Managed next action before registration: task-5 main-verifier/main-verification because reviewer approved task-5 but main verification was missing.
Expected evidence existed in the task-5 worktree: docs/plans/v38-task-5-main-verification-evidence-2026-06-02.md.
Expected evidence was not present in the controller ops worktree.
```

Verifier result consumed:

```text
Verifier subagent thread id: 019e955c-683a-7831-8851-7855ce7780ba.
Verifier status: passed.
Event requested: main.verification-passed.
Evidence ref: docs/plans/v38-task-5-main-verification-evidence-2026-06-02.md.
Validation reported by verifier: git diff --check passed; pnpm check passed; pnpm test passed with 1015 tests; pnpm workbench:build passed.
Risks reported by verifier: task worktree lacks .symphony managed-goal state; ledger context was verified from controller root.
```

Controller action:

```text
Dry-run command: pnpm --silent symphony goal gate --goal v38-provider-hub-capability-profiles --gate main-verification --status passed --verifier 019e955c-683a-7831-8851-7855ce7780ba --evidence-ref docs/plans/v38-task-5-main-verification-evidence-2026-06-02.md --task task-5 --dry-run.
Dry-run plan hash: sha256:994e30367a03e9800888c768e3d60f456b815acbb376daa9d84d29a5bd71f997.
Confirmed in the same controller turn with that plan hash.
Registered event: evt_73afffc64276405d.
Registered event type: main.verification-passed.
```

Post-registration state:

```text
task-5 status: main-verified.
task-5 status source: goal-event-log.v1:evt_73afffc64276405d.
task-5 mainVerificationRef: docs/plans/v38-task-5-main-verification-evidence-2026-06-02.md.
All 5 tasks are completed in the managed goal ledger.
ReleaseReady remains false.
Next ledger action: release manager / release-gate, starting with release.pnpm-check.
Dirty controller files: docs/plans/controller/v38-controller-state.md and docs/plans/controller/subagent-dispatch-log.md.
Dirty task-5 worktree file: docs/plans/v38-task-5-main-verification-evidence-2026-06-02.md is untracked in /Users/andy/.codex/worktrees/v38-task-5/multi-coding-agent-symphony.
```

Next suggested command:

```text
/supervisor tick
```

## Previous Reconciliation 2026-06-05 Task-5 Verifier Dispatch

Date: 2026-06-05

Command context:

```text
Received /goal verify task-5 --fresh-controller.
This controller owns only the task-5 main-verifier/main-verification phase.
No release closeout, mutation, audit, doctor, real CLI, tag, push, publish, or gate execution was run.
```

Reconciled state:

```text
Controller branch: codex/controller-loop-ops.
Controller HEAD: a0f5c59f20805fd3ff7bf31b94da1b978b520ec6.
origin/main: 7f0108b8c9c4658219f91aa8c687f3b1ae03cfd0.
Task-5 worktree: /Users/andy/.codex/worktrees/v38-task-5/multi-coding-agent-symphony.
Task-5 branch: codex/v38-task-5-provider-hub-panel-evidence.
Task-5 HEAD: b9711646c55117ce1a9a48fbed34dd1ecd70387d.
Managed ledger status: task-5 approved, reviewVerdict APPROVED, mainVerificationRef null.
Managed next action: task-5 main-verifier/main-verification because reviewer approved task-5 but main verification is missing.
Worker evidence exists in task-5 worktree: docs/plans/v38-task-5-worker-evidence-2026-06-02.md.
Review evidence exists in task-5 worktree: docs/plans/v38-task-5-review-evidence-2026-06-02.md.
Main verification evidence is missing before dispatch.
```

Controller action:

```text
Dispatched one main-verifier subagent.
Subagent thread/agent id: 019e955c-683a-7831-8851-7855ce7780ba.
Expected evidence: docs/plans/v38-task-5-main-verification-evidence-2026-06-02.md.
Event to register after completed evidence inspection: main.verification-passed or main.verification-failed.
```

Next suggested command:

```text
/goal verify task-5 --fresh-controller
```

## Previous Reconciliation

Date: 2026-06-05

Command context:

```text
User observed another controller thread auto-compacting while entering /goal review task-5.
This shows the previous context prompt was too reactive and did not force rotation before the expensive review phase.
During this controller-rule edit, task-5 review advanced in the managed ledger; the durable next action is now task-5 main verification.
```

Files reviewed:

```text
docs/plans/controller/context-management.md
docs/plans/controller/master-once-prompt.md
docs/plans/controller/README.md
docs/plans/controller/v38-controller-state.md
docs/plans/controller/subagent-dispatch-log.md
```

Git state before controller-rule edits:

```text
controller worktree branch: codex/controller-loop-ops
controller HEAD: b1bafdb304aceb5c507ffdbd85d31eb590e39316
origin/main: 7f0108b8c9c4658219f91aa8c687f3b1ae03cfd0
```

Managed goal status:

```text
pnpm --silent symphony goal-status --goal v38-provider-hub-capability-profiles --json
returned 5 total tasks, 5 completed tasks, 0 blocked tasks, releaseReady false.
task-1 status: main-verified, statusSource evt_548effa7b5868c34.
task-2 status: main-verified, statusSource evt_21473cc906078ffe.
task-3 status: main-verified, statusSource evt_c620c304a45ceb3c.
task-4 status: main-verified, statusSource evt_2233de7321b33673, commit afaa644a6044d95679d4d59bdc794cf8b346a8f1.
task-5 status: approved, statusSource evt_8c3b18b25e978e22, branch codex/v38-task-5-provider-hub-panel-evidence, commit b9711646c55117ce1a9a48fbed34dd1ecd70387d.
task-5 mainVerificationRef is missing.
```

Next action from ledger:

```text
pnpm --silent symphony goal next --goal v38-provider-hub-capability-profiles --json
returned task-5 main-verifier main-verification because reviewer approved task-5 but main verification is missing.
worker evidence ref: docs/plans/v38-task-5-worker-evidence-2026-06-02.md
review evidence ref: docs/plans/v38-task-5-review-evidence-2026-06-02.md
main verification ref: missing
```

Controller rule update:

```text
context-management.md now makes phase rotation mandatory before review, main verification, release closeout, gates, or broad evidence inspection after any prior non-reconcile phase.
master-once-prompt.md now treats /goal run as an unattended state machine across fresh phase controllers, not one long controller thread.
README.md now documents the same phase-rotation operating model.
```

Fresh controller handoff:

```text
Thread id: 019e955a-c1e7-7a23-8037-1f8eefae1d1f
Command: /goal verify task-5 --fresh-controller
Purpose: task-5 main-verifier/main-verification phase only.
Status observed from controller supervisor: active; first response says it is reconciling from repository/controller docs and not using chat memory.
The supervisor thread did not run task-5 verification, release closeout, mutation, audit, doctor, real CLI, tag, push, or publish.
```

Next suggested command:

```text
/goal status
```

## Historical Reconciliation 2026-06-04

Command received:

```text
/goal dispatch task-1 worker-revision
```

Files read:

```text
docs/plans/controller/master-once-prompt.md
docs/plans/controller/README.md
docs/plans/controller/v38-controller-state.md
docs/plans/controller/subagent-result-format.md
docs/plans/controller/subagent-dispatch-log.md
fixtures/contracts/goal-runbook.v38-provider-hub-capability-profiles.v1.json
docs/plans/app-core-v34-v40-goal-runbooks/v38_provider-hub-capability-profiles_goal_runbook_latest.md
docs/plans/workbench-v33-v40-app-runtime-runbooks/00_GLOBAL_RULES_AND_FLOW_LATEST_COMMANDS.md
docs/release-checklist.md
docs/plans/v38-task-1-worker-evidence-2026-06-02.md
docs/plans/v38-task-1-review-evidence-2026-06-02.md
```

Missing files recorded during startup read:

```text
docs/plans/v37-release-process-audit-2026-06-04.md
docs/plans/v37-release-to-v38-agent-cli-provider-handoff-2026-06-04.md
docs/plans/v38-agent-cli-provider-hub-mvp-2026-06-04.md
```

Git state before dispatch:

```text
controller worktree is dirty in controller README/master prompt plus checkpoint/log files; this turn only updates checkpoint/log.
main is aligned with origin/main at 7f0108b.
v38 task-1 worktree exists at branch codex/v38-task-1-provider-profile-contract, commit 7f0108b, with worker implementation, worker evidence, review evidence, worker revision, and reviewer re-review changes.
remote branch origin/codex/test-hardening-convergence remains for separate review.
local archive/v37-legacy-task0-runbook-09c926f remains as short-term safety reference.
```

Reconcile before action:

```text
pnpm --silent symphony goal-status --goal v38-provider-hub-capability-profiles --json
returned goal-progress-ledger.v1 with task-1 status needs-revision, statusSource evt_895cd535d94d7e36, workerEvidenceRef docs/plans/v38-task-1-worker-evidence-2026-06-02.md, reviewEvidenceRef docs/plans/v38-task-1-review-evidence-2026-06-02.md, and reviewVerdict NEEDS_REVISION.

pnpm --silent symphony goal next --goal v38-provider-hub-capability-profiles --json
returned action-required: task-1 reviewer, phase review, reason: Worker evidence exists for task-1 but reviewer verdict is missing.
```

Reviewer re-review result inspected:

```text
Worktree: /Users/andy/.codex/worktrees/0845/multi-coding-agent-symphony
Branch: codex/v38-task-1-provider-profile-contract
Evidence ref exists in worker worktree: docs/plans/v38-task-1-worker-evidence-2026-06-02.md
Review evidence exists: docs/plans/v38-task-1-review-evidence-2026-06-02.md
Review evidence now contains Re-review 2026-06-04 with verdict APPROVED.
Reviewer thread 019e9278-122d-7fa0-9108-c43e778220a1 is idle and completed the re-review.
Reviewer final block: role reviewer, status completed, eventToRegister reviewer.approved, evidenceRef docs/plans/v38-task-1-review-evidence-2026-06-02.md.
Reviewer validation: node task test passed 6 tests; pnpm check passed; pnpm test passed 998 tests; pnpm workbench:build passed; git diff --check passed; old blocker and allowlist drift probes all returned ok=false.
```

Controller action:

```text
Registered reviewer.approved for task-1.

Dry-run:
pnpm --silent symphony goal review --goal v38-provider-hub-capability-profiles --task task-1 --verdict approved --reviewer codex-v38-task-1-reviewer --evidence-ref docs/plans/v38-task-1-review-evidence-2026-06-02.md --dry-run --json
returned validation ok and planHash sha256:17bb96737368652e6795e467be7f4b43d9b2e2eb9b3a8c70abb8128388ab1444.

Confirm:
pnpm --silent symphony goal review --goal v38-provider-hub-capability-profiles --task task-1 --reviewer codex-v38-task-1-reviewer --verdict approved --evidence-ref docs/plans/v38-task-1-review-evidence-2026-06-02.md --confirm --plan-hash sha256:17bb96737368652e6795e467be7f4b43d9b2e2eb9b3a8c70abb8128388ab1444
appended event evt_8259bd487042edb9 with eventHash sha256:62a155eac893f49996a7736d9fa4c4c86f3aed8dfdae0ba2e46a8703ab3ed41b.

No mutation, audit, doctor, real CLI, tag, push, or publish command run by the controller.
```

Reconcile after action:

```text
pnpm --silent symphony goal-status --goal v38-provider-hub-capability-profiles --json
returned task-1 status unknown, statusSource evt_54b41ed97732c6be, reviewVerdict APPROVED, mainVerificationRef docs/plans/v38-task-1-main-verification-evidence-2026-06-02.md.

pnpm --silent symphony goal next --goal v38-provider-hub-capability-profiles --json
returned action-required: task-1 worker, phase revision, reason: Latest main verification failed for task-1.

task-1 worktree remains dirty with expected worker/review implementation and evidence files plus main verification failure evidence.

Main-verifier thread 019e929e-de99-79d0-95ae-72806f6fb74c wrote docs/plans/v38-task-1-main-verification-evidence-2026-06-02.md and reported main.verification-failed.
Controller registered main.verification-failed event evt_54b41ed97732c6be with plan hash sha256:bd4e0acb8ea81ccf74b9ad4c92ebeb4bc4b2e6b79fe4a03020195529fdf6c580.
Failure blocker: task implementation is uncommitted in the task worktree; branch ref codex/v38-task-1-provider-profile-contract has no diff from origin/main, so clean ff-only merge would merge no task-1 implementation.

Controller steered existing worker thread 019e9206-5ad3-7db0-b032-fe5cb100f8e2 for task-1 worker revision.
Worker revision prompt asks it to preserve existing task-1 dirty/untracked work, create local commit(s) on codex/v38-task-1-provider-profile-contract containing task-1 implementation/evidence, update worker evidence, run required validations, and not push/tag/release/merge/register events.
No goal event registered in this dispatch turn.
```

Evidence refs:

```text
task-1 worker evidence: docs/plans/v38-task-1-worker-evidence-2026-06-02.md
task-1 review evidence: docs/plans/v38-task-1-review-evidence-2026-06-02.md
task-1 main verification evidence: docs/plans/v38-task-1-main-verification-evidence-2026-06-02.md
```

Subagent:

```text
task-1 worker thread: 019e9206-5ad3-7db0-b032-fe5cb100f8e2
status: paused after appending worker evidence section; no stage, commit, push, or event registration; initial worker event evt_a78443418d567eb3; prior revision worker event evt_4309fb40ea68305e
task-1 reviewer thread: 019e9278-122d-7fa0-9108-c43e778220a1
status: re-review completed; prior reviewer.needs-revision event evt_895cd535d94d7e36; reviewer.approved event evt_8259bd487042edb9
task-1 main-verifier thread: 019e929e-de99-79d0-95ae-72806f6fb74c
status: completed; main.verification-failed event evt_54b41ed97732c6be
```

## Historical Next Suggested Command

```text
/goal status
```
