# v57 Review Gate Workbench Surface runbook

Date: 2026-06-14
Timezone: Asia/Shanghai
Goal id: `v57-review-gate-workbench-surface`
Branch draft: `codex/v57-review-gate-workbench-surface`
Start condition: v56 `thread-continuation-reviewer-handoff-pack` is reviewed, merged, tagged, and released by the controller.

## Objective

v57 should turn v56 copy-only continuation and reviewer handoff evidence into a controlled Workbench surface for review and gate registration.

The target path is:

```text
threadHandoffPack.v1
-> reviewer handoff evidence
-> controlled review/gate preview
-> explicit operator confirmation
-> existing goal event registration path
```

The version is successful only if review and gate preview state can be inspected from backend-owned evidence without automatic reviewer approval, automatic main gate mutation, automatic release gate mutation, provider launch, shell execution, raw transcript exposure, or direct mutation from provider result text.

## Boundary

Allowed work:

- backend-owned review and gate preview contracts that consume `threadHandoffPack.v1`, accepted reviewer handoff evidence, and existing goal state;
- controlled confirmation paths that require a fresh plan hash and explicit operator confirmation;
- Workbench display of review/gate readiness, source refs, blocked reasons, required evidence refs, and plan-hash-bound confirmation state;
- tests for ready, blocked, stale, mismatched evidence, and unsafe source refs;
- documentation of operator recovery when review or gate evidence is missing.

Forbidden work:

- automatic reviewer verdicts;
- provider self-approval;
- main verification gate mutation from provider output or handoff text;
- release gate mutation from provider output or handoff text;
- automatic transcript compact;
- automatic new thread creation;
- Codex launch;
- Claude Code launch;
- provider parity;
- generic shell or terminal UI;
- arbitrary command execution from Workbench;
- frontend reads of local JSONL files, provider session folders, goal ledgers, or event logs;
- raw transcript or raw model output exposure;
- direct goal event append outside the existing controlled event registration path;
- direct task completion from review or gate preview;
- automatic worktree creation;
- git merge, git push, tag creation, publish, GitHub Release creation, or release automation.

## Contract direction

Add read-model contracts around review and gate preview state:

```text
reviewGatePreview.v1
reviewGateConfirmationPreview.v1
reviewGateSourceEvidence.v1
reviewGateBoundaryNotice.v1
```

`reviewGatePreview.v1` should include:

```text
contractName
contractVersion
generatedAt
goal
task
sourceThreadHandoffPack
reviewReadiness
mainGateReadiness
releaseGateReadiness
blockedReasons[]
requiredEvidenceRefs[]
sourceContracts[]
nextSafeAction
boundaries
```

Required values:

- `automaticReviewerVerdictAvailable`: `false`
- `providerSelfApprovalAvailable`: `false`
- `mainVerificationMutationAvailable`: `false` unless a controlled confirmation preview with a matching plan hash is present
- `releaseGateMutationAvailable`: `false` unless a controlled confirmation preview with a matching plan hash is present
- `providerLaunchAvailable`: `false`
- `directGoalEventAppendAvailable`: `false` outside the existing controlled event registration path
- `directTaskCompleteAvailable`: `false`
- `genericShellAvailable`: `false`
- `gitMutationAvailable`: `false`
- `tagAutomationAvailable`: `false`
- `publishAutomationAvailable`: `false`

## Workbench surface

Add a review and gate lane after the v56 Thread Continuation Pack lane.

Allowed visible labels:

```text
Review Gate Preview
Review Readiness
Main Gate Readiness
Release Gate Readiness
Preview Confirmation
Refresh State
```

Forbidden visible labels:

```text
Auto Approve
Provider Approves
Launch Codex
Launch Claude Code
Run Provider
Run Shell
Terminal
Read Session File
Open Transcript
Append Event Directly
Mark Complete
Confirm Main Gate Automatically
Confirm Release Gate Automatically
Push
Tag
Publish
Release
```

The panel should show source handoff pack refs, reviewer evidence refs, gate readiness, blocked reasons, plan hash state, and boundary flags. It must not expose raw provider transcript, raw model output, provider session paths, local JSONL paths, or command text that can be executed from the renderer.

## PR breakdown

### PR-0: Runbook

File:

- `docs/plans/v57-review-gate-workbench-surface-runbook-2026-06-14.md`

Validation:

```sh
git diff --check
git diff --cached --check
```

### PR-1: Contracts, fixtures, and tests

Fixtures should cover:

```text
review gate preview ready for reviewer verdict registration
review gate preview ready for main gate registration
review gate preview blocked by missing thread handoff pack
review gate preview blocked by missing reviewer evidence
review gate preview blocked by stale plan hash
review gate preview unsafe raw transcript rejection
review gate preview unsafe local session rejection
review gate preview unsafe mutation rejection
```

Validation:

```sh
node --test tests/v57-review-gate-workbench-surface.test.js
node --test tests/v56-thread-continuation-reviewer-handoff-pack.test.js
pnpm check
git diff --check
```

### PR-2: Backend review and gate projection

Scope:

- project `reviewGatePreview.v1` from `threadHandoffPack.v1`, accepted reviewer handoff evidence, and backend-owned goal state;
- preserve source refs, evidence refs, blocked reasons, next safe action, and boundary flags;
- block missing handoff pack, missing reviewer evidence, stale refs, unsafe raw context, local session refs, and direct mutation routes;
- do not append events, complete tasks, confirm reviewer verdicts, mutate gates, launch providers, or run shell commands.

Validation:

```sh
node --test tests/v57-review-gate-workbench-surface.test.js tests/v56-thread-continuation-reviewer-handoff-pack.test.js
pnpm check
git diff --check
```

### PR-3: Controlled confirmation preview

Scope:

- create review/gate confirmation preview state only after backend preview is eligible;
- bind confirmation to goal id, task id, event family, required evidence refs, preview hash, plan hash, and explicit operator id;
- reuse existing controlled event registration boundaries where possible;
- reject stale plan hash, mismatched event family, missing evidence, provider-originated approval, and raw output refs.

Validation:

```sh
node --test tests/v57-review-gate-workbench-surface.test.js tests/workbench-api-client.test.js
pnpm check
git diff --check
```

### PR-4: Workbench review gate lane

Scope:

- render review readiness, main gate readiness, release gate readiness, source refs, blocked reasons, confirmation preview state, and boundary flags;
- assert no auto-approve, provider self-approval, provider launch, shell, terminal, transcript, direct event append, task completion, automatic gate mutation, git, tag, publish, or release controls appear;
- rebuild generated Workbench static assets.

Validation:

```sh
pnpm workbench:build
node --test tests/workbench-api-client.test.js tests/workbench-shell.test.js tests/workbench-route-smoke.test.js
node --test tests/v57-review-gate-workbench-surface.test.js tests/v56-thread-continuation-reviewer-handoff-pack.test.js
pnpm check
git diff --check
```

### PR-5: Acceptance and closeout

Acceptance should record:

- one ready reviewer verdict registration preview;
- one ready main gate registration preview;
- one ready release gate registration preview if release evidence is in scope;
- one blocked preview for missing thread handoff pack;
- one blocked preview for missing reviewer evidence;
- one blocked preview for stale plan hash;
- absence of automatic reviewer verdicts, provider self-approval, automatic main gate mutation, automatic release gate mutation, provider launch, direct event append, task completion, shell UI, tag, publish, and GitHub Release automation.

## Validation commands

```sh
node --test tests/v57-review-gate-workbench-surface.test.js
node --test tests/v56-thread-continuation-reviewer-handoff-pack.test.js
node --test tests/workbench-api-client.test.js tests/workbench-shell.test.js tests/workbench-route-smoke.test.js
pnpm workbench:build
pnpm check
git diff --check
```

Run `pnpm test` if v57 changes shared event registration, gate readiness, Workbench route registration, provider runner lifecycle, or release closeout paths.

## Rollback path

If contract validation accepts provider self-approval, raw transcript, raw model output, provider session paths, local JSONL paths, direct event append, task completion, gate mutation without controlled preview, git, tag, publish, or release routes, revert the contract PR.

If backend projection reads frontend files, provider session folders, local JSONL, goal ledgers, event logs, raw transcripts, or raw model output, revert the backend projection PR.

If confirmation preview accepts stale plan hash, missing evidence refs, provider-originated approval, automatic gate mutation, or release mutation without explicit operator confirmation, revert the confirmation PR.

If Workbench exposes auto-approve, provider launch, shell, terminal, arbitrary command, transcript, direct event append, task completion, automatic gate mutation, git, tag, publish, release, form, textarea, or button controls outside existing controlled event registration boundaries, revert the Workbench PR and rebuild generated assets.
