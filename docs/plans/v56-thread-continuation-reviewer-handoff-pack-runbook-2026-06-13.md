# v56 Thread Continuation and Reviewer Handoff Pack runbook

Date: 2026-06-13
Timezone: Asia/Shanghai
Goal id: `v56-thread-continuation-reviewer-handoff-pack`
Branch draft: `codex/v56-thread-continuation-reviewer-handoff-pack`
Start condition: v55 `codex-provider-run-recovery-reviewer-handoff` is reviewed, merged, tagged, and released by the controller.

## Objective

v56 should turn v55 recovery and reviewer handoff state into bounded continuation artifacts that an operator can copy into the next session.

The target path is:

```text
codexProviderRunRecovery.v1
-> reviewerHandoffPreview.v1
-> contextAdvisory.v1
-> threadHandoffPack.v1
-> operator copies continuation or reviewer handoff text
```

The version is successful only if continuation, checkpoint, drift-recovery, and reviewer handoff packs can be inspected from backend-owned state without automatic compact, automatic thread creation, provider launch, raw transcript exposure, or direct goal mutation.

## Boundary

Allowed work:

- backend-owned handoff pack generation from `codexProviderRunRecovery.v1`, `reviewerHandoffPreview.v1`, `contextAdvisory.v1`, and read-only goal state;
- copy-only continuation blocks for continue, checkpoint, recover-drift, blocked, and reviewer-handoff cases;
- bounded checkpoint artifact metadata that excludes raw transcripts and provider session paths;
- evidence refs, source contract refs, known facts, blocked reasons, and next safe action;
- Workbench display of handoff decision, copy-only blocks, checkpoint ref, source contracts, and boundary flags;
- fixtures and tests for ready continuation, blocked continuation, drift recovery, missing source state, and unsafe raw context rejection.

Forbidden work:

- automatic transcript compact;
- automatic new thread creation;
- Codex launch;
- Claude Code launch;
- provider parity;
- generic shell or terminal UI;
- arbitrary command execution from Workbench;
- frontend reads of local JSONL files, provider session folders, `.symphony` internals, goal ledgers, or event logs;
- raw transcript or raw model output exposure;
- direct goal event append from provider output, reviewer handoff, or continuation pack;
- direct task completion from continuation pack;
- automatic reviewer verdicts;
- automatic main verification gate mutation;
- automatic release gate mutation;
- automatic worktree creation;
- git merge, git push, tag creation, publish, GitHub Release creation, or release automation.

## Contract direction

Add read-model contracts around continuation and reviewer handoff packs:

```text
threadHandoffPack.v1
providerContinuationPrompt.v1
checkpointSnapshot.v1
contextCarryoverRefs.v1
threadBoundaryNotice.v1
```

`threadHandoffPack.v1` should include:

```text
contractName
contractVersion
generatedAt
goal
task
decision
sourceRecovery
sourceReviewerHandoff
summary
knownFacts[]
openRisks[]
blockedReasons[]
nextSafeAction
requiredEvidenceRefs[]
sourceContracts[]
copyBlocks[]
checkpointRef
boundaries
```

Required values:

- `copyOnly`: `true` for all continuation and reviewer handoff blocks
- `willMutate`: `false`
- `automaticCompactAvailable`: `false`
- `automaticNewThreadAvailable`: `false`
- `providerLaunchAvailable`: `false`
- `directGoalEventAppendAvailable`: `false`
- `directTaskCompleteAvailable`: `false`
- `reviewerMutationAvailable`: `false`
- `mainVerificationMutationAvailable`: `false`
- `releaseGateMutationAvailable`: `false`
- `gitMutationAvailable`: `false`
- `tagAutomationAvailable`: `false`
- `publishAutomationAvailable`: `false`

## Workbench surface

Add a continuation and reviewer handoff pack lane after the v55 Reviewer Handoff Preview lane.

Allowed visible labels:

```text
Thread Continuation Pack
Continuation Decision
Copy Continuation Pack
Copy Reviewer Handoff Pack
Checkpoint Snapshot
Refresh State
```

Forbidden visible labels:

```text
Compact Now
Create New Thread
Launch Codex
Launch Claude Code
Run Provider
Run Shell
Terminal
Read Session File
Open Transcript
Append Event
Mark Complete
Confirm Reviewer Verdict
Confirm Main Gate
Confirm Release Gate
Push
Tag
Publish
Release
```

The panel should show decision, source recovery state, reviewer handoff readiness, checkpoint ref, next safe action, blocked reasons, source contracts, and boundary flags. It must not expose raw provider transcript, raw model output, provider session paths, local JSONL paths, or command text that can be executed from the renderer.

## PR breakdown

### PR-0: Runbook

File:

- `docs/plans/v56-thread-continuation-reviewer-handoff-pack-runbook-2026-06-13.md`

Validation:

```sh
git diff --check
git diff --cached --check
```

### PR-1: Contracts, fixtures, and tests

Fixtures should cover:

```text
thread handoff pack ready for continuation
thread handoff pack ready for reviewer handoff
thread handoff pack blocked by missing recovery state
thread handoff pack blocked by missing accepted reviewer handoff
thread handoff pack recover-drift decision
thread handoff pack unsafe raw transcript rejection
thread handoff pack unsafe local session rejection
thread handoff pack unsafe mutation rejection
```

Validation:

```sh
node --test tests/v56-thread-continuation-reviewer-handoff-pack.test.js
node --test tests/v55-codex-provider-run-recovery-reviewer-handoff.test.js
pnpm check
git diff --check
```

### PR-2: Backend handoff projection

Scope:

- project `threadHandoffPack.v1` from v55 recovery state, v55 reviewer handoff state, context advisory, and backend-owned read model state;
- preserve source refs, evidence refs, blocked reasons, known facts, open risks, and next safe action;
- block missing recovery state, missing reviewer handoff state, stale source refs, unsafe raw context, and local session refs;
- do not compact transcripts, create threads, start providers, or mutate goal events.

Validation:

```sh
node --test tests/v56-thread-continuation-reviewer-handoff-pack.test.js tests/v55-codex-provider-run-recovery-reviewer-handoff.test.js tests/v49-context-session-observability-supervisor-advisory.test.js
pnpm check
git diff --check
```

### PR-3: Checkpoint snapshot

Scope:

- write a bounded `checkpointSnapshot.v1` artifact only when source contracts are present and safe;
- include source refs, summary, known facts, blocked reasons, and next safe action;
- exclude raw transcript, raw model output, provider output, provider session paths, local JSONL paths, and goal ledger internals;
- do not create a provider thread, worktree, compacted transcript, event, task completion, reviewer verdict, gate decision, branch, tag, release note, or GitHub Release.

Validation:

```sh
node --test tests/v56-thread-continuation-reviewer-handoff-pack.test.js tests/v51-result-intake-evidence-escrow.test.js
pnpm check
git diff --check
```

### PR-4: Workbench continuation lane

Scope:

- render continuation decision, source recovery state, reviewer handoff readiness, copy-only blocks, checkpoint ref, source contracts, and boundary flags;
- assert no compact, new-thread, provider launch, shell, terminal, transcript, direct event append, task completion, reviewer verdict, gate mutation, git, tag, publish, or release controls appear;
- rebuild generated Workbench static assets.

Validation:

```sh
pnpm workbench:build
node --test tests/workbench-api-client.test.js tests/workbench-shell.test.js tests/workbench-route-smoke.test.js
node --test tests/v56-thread-continuation-reviewer-handoff-pack.test.js tests/v55-codex-provider-run-recovery-reviewer-handoff.test.js
pnpm check
git diff --check
```

### PR-5: Acceptance and closeout

Acceptance should record:

- one ready continuation pack;
- one ready reviewer handoff pack;
- one recover-drift pack;
- one blocked pack for missing recovery state;
- one blocked pack for missing accepted reviewer handoff state;
- one bounded checkpoint snapshot record if PR-3 writes snapshot metadata;
- absence of automatic compact, automatic new thread, provider launch, direct goal event append, task completion, reviewer verdict mutation, main gate mutation, release gate mutation, shell UI, tag, publish, and GitHub Release automation.

## Acceptance path

1. Open Workbench Desktop App Home.
2. Confirm the v55 Codex Run Recovery and Reviewer Handoff Preview lanes still render.
3. Open Thread Continuation Pack.
4. Confirm source recovery state and reviewer handoff readiness come from backend-owned read model state.
5. Confirm missing source state, stale source refs, raw transcript, raw model output, local session refs, and unsafe mutation routes are blocked.
6. Confirm continuation and reviewer handoff blocks are copy-only.
7. Confirm checkpoint snapshot metadata excludes raw transcript, raw model output, provider output, provider session paths, local JSONL paths, and goal ledger internals.
8. Confirm Workbench does not compact transcripts, create new threads, launch providers, run shell commands, append goal events, complete tasks, confirm reviewer verdicts, mutate gates, create branches, push, tag, publish, or create GitHub Releases.

## Validation commands

```sh
node --test tests/v56-thread-continuation-reviewer-handoff-pack.test.js
node --test tests/v55-codex-provider-run-recovery-reviewer-handoff.test.js
node --test tests/v54-codex-provider-execution-pilot.test.js
node --test tests/v51-result-intake-evidence-escrow.test.js
node --test tests/workbench-api-client.test.js tests/workbench-shell.test.js tests/workbench-route-smoke.test.js
pnpm workbench:build
pnpm check
git diff --check
```

Run `pnpm test` if v56 changes shared Workbench route registration, context advisory storage, checkpoint artifact persistence, Result Intake confirm behavior, provider runner lifecycle, or goal event command paths.

## Rollback path

If handoff contracts accept raw transcript, raw model output, provider output, provider session paths, local JSONL paths, direct event append, task completion, reviewer mutation, gate mutation, git, tag, publish, or release routes, revert the contract PR.

If backend projection reads frontend files, provider session folders, local JSONL, goal ledgers, event logs, raw transcripts, or raw model output, revert the backend handoff projection PR.

If checkpoint snapshot writes raw transcript, raw model output, provider output, provider session paths, local JSONL paths, goal ledger internals, branch state, tag state, release state, or provider thread refs, revert the checkpoint PR and keep v56 copy-only.

If Workbench exposes compact, new-thread, provider launch, shell, terminal, arbitrary command, transcript, event append, task completion, reviewer verdict, gate mutation, git, tag, publish, release, form, textarea, or button controls inside the continuation panel, revert the Workbench PR and rebuild generated assets.

## v57 handoff

v57 should create a review and gate Workbench surface that consumes accepted reviewer handoff and continuation evidence. It may add controlled review/gate preview and confirm only under a separate planHash path with explicit operator confirmation. It must not auto-approve provider output, let a provider approve its own work, or mutate main/release gates from provider result text.
