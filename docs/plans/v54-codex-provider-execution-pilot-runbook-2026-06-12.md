# v54 Codex Provider Execution Pilot runbook

Date: 2026-06-12
Timezone: Asia/Shanghai
Goal id: `v54-codex-provider-execution-pilot`
Branch draft: `codex/v54-codex-provider-execution-pilot`
Start condition: v53 PR-5 closeout is reviewed, merged, tagged, and released by the controller.

## Objective

v54 should run one narrow Codex worker execution path after v53 proves copy-only task packs and v51 Result Intake return shape.

The target path is:

```text
childDispatchPreview.v1
-> explicit Codex execution preview
-> explicit operator confirmation
-> bounded Codex provider run
-> sanitized resultEvidenceEscrow.v1 and pendingResult.v1
-> v51 Result Intake
```

The pilot is successful only if the provider output returns through v51 Result Intake and does not append a goal event directly.

## Boundary

Allowed work:

- Codex-only provider execution contract helpers, fixtures, and tests;
- backend-owned execution preview for one worker role task pack from `childTaskPack.v1`;
- operator confirmation that is bound to the preview hash and provider policy;
- bounded Codex execution runner with explicit input, timeout, cwd, and evidence refs;
- sanitized result intake request generation from provider output;
- Workbench display of preview, confirmation state, run status, and result-intake return state.

Forbidden work:

- Claude Code execution;
- provider parity;
- automatic reviewer verdicts;
- automatic main verification gate mutation;
- automatic release gate mutation;
- direct goal event append from provider output;
- direct task completion from provider output;
- transcript compaction;
- new thread product capability;
- generic shell or terminal UI;
- arbitrary command execution from Workbench;
- frontend reads of local JSONL files, provider session folders, `.symphony` internals, goal ledgers, or event logs;
- raw transcript or raw model output exposure;
- automatic worktree creation outside the explicit provider runner boundary;
- git merge, git push, tag creation, publish, GitHub Release creation, or release automation.

## Contract direction

Add a Codex-only execution preview contract. Suggested names:

```text
codexProviderExecutionPreview.v1
codexProviderExecutionConfirmation.v1
codexProviderRunRecord.v1
```

Required preview fields:

```text
contractName
contractVersion
generatedAt
goal
task
providerId
role
taskPackRef
taskPackHash
inputSummary
executionPolicy
resultReturn
blockedReasons[]
sourceContracts[]
boundaries
```

Required confirmation fields:

```text
previewHash
providerId
goalId
taskId
role
operatorId
confirmedAt
```

Required values:

- `providerId`: `codex`
- `role`: `worker`
- `resultReturn.returnPath`: `v51-result-intake`
- `resultReturn.resultIntakeContract`: `resultIntakeRequest.v1`
- `directGoalEventAppendAvailable`: `false`
- `directTaskCompleteAvailable`: `false`
- `reviewerMutationAvailable`: `false`
- `mainVerificationMutationAvailable`: `false`
- `releaseGateMutationAvailable`: `false`

## Workbench surface

Add a Codex execution pilot lane after the v53 Child Dispatch Preview lane.

Allowed visible labels:

```text
Codex Execution Preview
Confirm Codex Run
Codex Run Status
Return Through Result Intake
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

The panel should show the preview hash, task pack hash, provider id, role, result return path, and blocked reasons. It must not expose raw provider transcript or raw model output.

## PR breakdown

### PR-0: Runbook

File:

- `docs/plans/v54-codex-provider-execution-pilot-runbook-2026-06-12.md`

Validation:

```sh
git diff --check
git diff --cached --check
```

### PR-1: Contracts, fixtures, and tests

Fixtures should cover:

```text
codex execution preview ready
codex execution preview blocked missing task pack
codex execution preview blocked unsupported provider
codex run record completed with sanitized result
codex run record blocked with sanitized blocker
unsafe raw transcript rejection
unsafe local session ref rejection
direct event append rejection
```

Validation:

```sh
node --test tests/v54-codex-provider-execution-pilot.test.js
pnpm check
git diff --check
```

### PR-2: Backend preview and confirmation

Scope:

- build Codex execution preview from `childDispatchPreview.v1` and `childTaskPack.v1`;
- bind confirmation to a preview hash;
- reject unsupported provider ids, reviewer roles, missing active task, stale preview hash, and unsafe source refs;
- do not start Codex in preview.

Validation:

```sh
node --test tests/v54-codex-provider-execution-pilot.test.js tests/v53-child-dispatch-preview.test.js
pnpm check
git diff --check
```

### PR-3: Bounded Codex runner

Scope:

- start Codex only after explicit confirmation;
- pass a bounded task pack input;
- capture sanitized status, changed files, validation command list, risks, blockers, and controlled evidence refs;
- write a run record and a v51 Result Intake request shape;
- reject raw transcript and raw model output fields from read-model projection.

Validation:

```sh
node --test tests/v54-codex-provider-execution-pilot.test.js
node --test tests/v51-result-intake-evidence-escrow.test.js
pnpm check
git diff --check
```

### PR-4: Workbench pilot lane

Scope:

- render Codex execution preview;
- render confirmation readiness;
- render run status from backend-owned run records;
- render result-intake return state;
- assert no shell, terminal, Claude Code, provider parity, direct event append, gate mutation, git, tag, publish, or release controls.

Validation:

```sh
pnpm workbench:build
node --test tests/workbench-api-client.test.js tests/workbench-shell.test.js tests/workbench-route-smoke.test.js
node --test tests/v54-codex-provider-execution-pilot.test.js
pnpm check
git diff --check
```

### PR-5: Acceptance and closeout

Acceptance should record:

- one fake ready preview;
- one blocked unsupported provider preview;
- one completed Codex run record with sanitized result;
- one blocked Codex run record with sanitized blocker;
- v51 Result Intake return shape;
- absence of direct goal event append, task completion, reviewer mutation, main gate mutation, release gate mutation, shell UI, tag, publish, and GitHub Release automation.

## Acceptance path

1. Open Workbench Desktop App Home.
2. Confirm v53 Child Dispatch Preview can produce or explain a Codex worker task pack.
3. Open Codex Execution Preview.
4. Confirm provider id is `codex` and role is `worker`.
5. Confirm preview hash and task pack hash are visible.
6. Confirm unsupported provider and non-worker role are blocked.
7. Confirm `Confirm Codex Run` requires the current preview hash.
8. Run the bounded Codex pilot after explicit confirmation.
9. Confirm the run record produces sanitized result intake fields only.
10. Confirm the result returns through v51 Result Intake.
11. Confirm no direct event append, task completion, review/gate mutation, shell UI, git, tag, publish, or GitHub Release control appears.

## Validation commands

```sh
node --test tests/v54-codex-provider-execution-pilot.test.js
node --test tests/v53-child-dispatch-preview.test.js
node --test tests/v51-result-intake-evidence-escrow.test.js
node --test tests/workbench-api-client.test.js tests/workbench-shell.test.js tests/workbench-route-smoke.test.js
pnpm workbench:build
pnpm check
git diff --check
```

Run `pnpm test` if v54 touches shared console routing, provider runner lifecycle, result intake state, Workbench static serving, or goal event command paths.

## Rollback path

If Codex execution starts without a matching preview hash and explicit confirmation, revert the backend confirmation PR.

If provider output bypasses v51 Result Intake or appends a goal event directly, revert the runner PR and keep v54 blocked at preview.

If Workbench exposes a shell, terminal, arbitrary command runner, Claude Code execution, provider parity, review/gate mutation, git, tag, publish, or GitHub Release control, revert the Workbench PR and rebuild generated assets.

## v55 handoff

v55 should not be planned until v54 proves one Codex worker execution can return sanitized evidence through v51 Result Intake.

Possible v55 scopes are provider-run recovery or reviewer handoff. v55 should not add Claude Code parity, automatic review, or release automation unless v54 closeout records the Codex pilot as stable.
