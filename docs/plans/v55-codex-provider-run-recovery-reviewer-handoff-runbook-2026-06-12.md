# v55 Codex Provider Run Recovery and Reviewer Handoff runbook

Date: 2026-06-12
Timezone: Asia/Shanghai
Goal id: `v55-codex-provider-run-recovery-reviewer-handoff`
Branch draft: `codex/v55-codex-provider-run-recovery-reviewer-handoff`
Start condition: v54 PR-5 closeout is reviewed, merged, tagged, and released by the controller.

## Objective

v55 should make a v54 Codex worker run recoverable and hand off accepted evidence to the next reviewer task without adding provider parity or automatic review.

The target path is:

```text
codexProviderRunRecord.v1
-> resultIntakeRequest.v1
-> pendingResult.v1
-> operator accepts, blocks, or rejects through v51 Result Intake
-> reviewerHandoffPreview.v1
-> operator copies reviewer handoff text
```

The version is successful only if blocked and completed Codex run records can be inspected from backend-owned state, recovered through explicit operator actions, and handed to a reviewer as copy-only context after v51 intake accepts the sanitized result.

## Boundary

Allowed work:

- read-only projection for completed and blocked `codexProviderRunRecord.v1` records when a backend source exists;
- recovery state for failed sanitizer, blocked provider result, missing result intake request, and stale preview hash;
- explicit operator recovery preview that explains the next safe action without starting a provider;
- v51 pending result linkage from `resultIntakeRequest.v1`;
- copy-only reviewer handoff preview after pending result acceptance;
- Workbench display of run recovery state, intake state, reviewer handoff preview, source contracts, and boundary flags;
- fixtures and tests for completed, blocked, stale, unsafe, and missing-run states.

Forbidden work:

- Claude Code execution;
- provider parity;
- automatic reviewer verdicts;
- automatic main verification gate mutation;
- automatic release gate mutation;
- direct goal event append from provider output or reviewer handoff;
- direct task completion from provider output or reviewer handoff;
- transcript compaction;
- new thread product capability;
- generic shell or terminal UI;
- arbitrary command execution from Workbench;
- frontend reads of local JSONL files, provider session folders, `.symphony` internals, goal ledgers, or event logs;
- raw transcript or raw model output exposure;
- automatic worktree creation;
- git merge, git push, tag creation, publish, GitHub Release creation, or release automation.

## Contract direction

Add read-model contracts around v54 run records and reviewer handoff:

```text
codexProviderRunRecovery.v1
reviewerHandoffPreview.v1
```

`codexProviderRunRecovery.v1` should include:

```text
contractName
contractVersion
generatedAt
goal
task
runId
providerId
role
previewHash
taskPackHash
runStatus
resultIntake
recoveryState
nextSafeAction
blockedReasons[]
sourceContracts[]
boundaries
```

`reviewerHandoffPreview.v1` should include:

```text
contractName
contractVersion
generatedAt
goal
workerTask
reviewerTask
pendingResultRef
acceptedResultSummary
handoffPack
copyOnly
willMutate
blockedReasons[]
sourceContracts[]
boundaries
```

Required values:

- `providerId`: `codex`
- `role`: `worker` for the source run record
- `resultIntake.contractName`: `resultIntakeRequest.v1`
- `pendingResult.contractName`: `pendingResult.v1`
- `copyOnly`: `true` for reviewer handoff preview
- `willMutate`: `false`
- `directGoalEventAppendAvailable`: `false`
- `directTaskCompleteAvailable`: `false`
- `reviewerMutationAvailable`: `false`
- `mainVerificationMutationAvailable`: `false`
- `releaseGateMutationAvailable`: `false`

## Workbench surface

Add a recovery and reviewer handoff lane after the v54 Codex Execution Preview lane.

Allowed visible labels:

```text
Codex Run Recovery
Result Intake State
Reviewer Handoff Preview
Copy Reviewer Handoff
Refresh State
```

Forbidden visible labels:

```text
Launch Claude Code
Run Any Provider
Run Shell
Terminal
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

The panel should show run id, provider id, role, preview hash, result intake request id or missing state, pending result state, recovery reason, next safe action, and blocked reasons. It must not expose raw provider transcript, raw model output, provider session paths, or local JSONL paths.

## PR breakdown

### PR-0: Runbook

File:

- `docs/plans/v55-codex-provider-run-recovery-reviewer-handoff-runbook-2026-06-12.md`

Validation:

```sh
git diff --check
git diff --cached --check
```

### PR-1: Contracts, fixtures, and tests

Fixtures should cover:

```text
codex run recovery completed with accepted pending result
codex run recovery blocked with pending blocker
codex run recovery missing result intake request
codex run recovery stale preview hash
codex run recovery unsafe raw transcript rejection
reviewer handoff preview ready
reviewer handoff preview blocked before intake acceptance
reviewer handoff preview unsafe mutation rejection
```

Validation:

```sh
node --test tests/v55-codex-provider-run-recovery-reviewer-handoff.test.js
node --test tests/v54-codex-provider-execution-pilot.test.js
pnpm check
git diff --check
```

### PR-2: Backend recovery projection

Scope:

- project `codexProviderRunRecovery.v1` from backend-owned run records and v51 result intake state;
- preserve run id, preview hash, task pack hash, provider id, role, and source contract refs;
- classify completed, blocked, missing-intake, stale-preview, and unsafe states;
- do not start Codex or mutate Result Intake.

Validation:

```sh
node --test tests/v55-codex-provider-run-recovery-reviewer-handoff.test.js tests/v54-codex-provider-execution-pilot.test.js tests/v51-result-intake-evidence-escrow.test.js
pnpm check
git diff --check
```

### PR-3: Reviewer handoff preview

Scope:

- build copy-only reviewer handoff preview after v51 intake accepts sanitized worker evidence;
- include accepted result summary, evidence refs, changed files, validation commands, risks, and blockers when present;
- block handoff when pending result is missing, rejected, stale, unsafe, or still awaiting operator decision;
- do not create a reviewer verdict or task-completion event.

Validation:

```sh
node --test tests/v55-codex-provider-run-recovery-reviewer-handoff.test.js tests/v53-child-dispatch-preview.test.js
pnpm check
git diff --check
```

### PR-4: Workbench recovery lane

Scope:

- render Codex run recovery state;
- render v51 Result Intake state;
- render reviewer handoff preview as copy-only text;
- assert no shell, terminal, provider parity, Claude Code execution, direct event append, task completion, reviewer verdict mutation, main gate mutation, release gate mutation, git, tag, publish, or release controls.

Validation:

```sh
pnpm workbench:build
node --test tests/workbench-api-client.test.js tests/workbench-shell.test.js tests/workbench-route-smoke.test.js
node --test tests/v55-codex-provider-run-recovery-reviewer-handoff.test.js
pnpm check
git diff --check
```

### PR-5: Acceptance and closeout

Acceptance should record:

- one completed Codex run recovery fixture linked to accepted v51 pending result state;
- one blocked Codex run recovery fixture linked to pending blocker state;
- one missing-intake recovery fixture;
- one stale preview hash block;
- one reviewer handoff preview ready state;
- one reviewer handoff blocked-before-intake state;
- absence of direct goal event append, task completion, reviewer verdict mutation, main gate mutation, release gate mutation, shell UI, tag, publish, and GitHub Release automation.

## Acceptance path

1. Open Workbench Desktop App Home.
2. Confirm the v54 Codex Execution Preview lane still shows Codex worker preview state.
3. Open Codex Run Recovery.
4. Confirm completed and blocked run records are projected only from backend-owned state.
5. Confirm missing Result Intake request, stale preview hash, and unsafe raw-output states are blocked.
6. Confirm Result Intake State shows v51 pending result state and does not append events directly.
7. Confirm Reviewer Handoff Preview is unavailable before intake acceptance.
8. Accept a sanitized pending result through the existing v51 path.
9. Confirm Reviewer Handoff Preview becomes copy-only and does not create a verdict.
10. Confirm no shell, terminal, provider parity, Claude Code execution, direct event append, task completion, gate mutation, git, tag, publish, or GitHub Release control appears.

## Validation commands

```sh
node --test tests/v55-codex-provider-run-recovery-reviewer-handoff.test.js
node --test tests/v54-codex-provider-execution-pilot.test.js
node --test tests/v51-result-intake-evidence-escrow.test.js
node --test tests/workbench-api-client.test.js tests/workbench-shell.test.js tests/workbench-route-smoke.test.js
pnpm workbench:build
pnpm check
git diff --check
```

Run `pnpm test` if v55 touches shared Workbench route registration, Result Intake confirm behavior, provider runner lifecycle, or goal event command paths.

## Rollback path

If recovery projection reads local JSONL, provider session folders, transcript folders, `.symphony` internals, goal ledgers, or event logs from the frontend, revert the backend recovery PR.

If recovery state turns a provider run into direct goal event append, direct task completion, reviewer verdict mutation, main gate mutation, release gate mutation, git mutation, tag automation, publish automation, or GitHub Release automation, revert the contract and backend recovery PRs.

If reviewer handoff preview creates a reviewer verdict, mutates task state, starts Claude Code, starts Codex, or launches any provider, revert the reviewer handoff PR and keep v55 blocked at recovery display.

If Workbench exposes shell, terminal, arbitrary command, provider parity, Claude Code execution, direct event append, task completion, reviewer verdict, gate mutation, git, tag, publish, or release controls, revert the Workbench PR and rebuild generated assets.
