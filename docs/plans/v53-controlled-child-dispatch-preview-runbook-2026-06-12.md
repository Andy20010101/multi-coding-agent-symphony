# v53 Controlled Child Dispatch Preview Runbook

Date: 2026-06-12
Timezone: Asia/Shanghai
Goal id: `v53-controlled-child-dispatch-preview`
Branch draft: `codex/v53-controlled-child-dispatch-preview`
Start condition: v52 PR-5 acceptance and closeout docs are reviewed and merged.
Supported providers for task pack targeting: `codex`, `claude-code`

## Objective

v53 defines how the system prepares child work without starting a child.

The operator should be able to preview a child task pack, inspect why it is safe to hand off, copy it manually, and return any external result through v51 Result Intake.

The path is:

```text
Supervisor next action
-> Child Dispatch Preview
-> childTaskPack.v1
-> operator copies the pack manually
-> external worker or reviewer result returns through v51 Result Intake
```

## Boundary

v53 may prepare work. It may not perform work.

Allowed work:

- `childDispatchRequest.v1`, `childDispatchPreview.v1`, `childTaskPack.v1`, `childResultExpectation.v1`, and `providerRoleRecommendation.v1` contract helpers, fixtures, and tests;
- backend-owned preview from active goal, next action, `systemGoldenPath.v1`, provider policy, and source contract refs;
- copy-only task packs for `codex` and `claude-code`;
- expected result block shape for v51 Result Intake;
- Workbench display of preview readiness, blocked reasons, provider recommendation, forbidden actions, and copy-only text.

Forbidden work:

- provider execution;
- actual child dispatch;
- launching Codex;
- launching Claude Code;
- spawning child processes;
- creating worktrees automatically;
- transcript compaction;
- new thread creation;
- generic shell or terminal UI;
- arbitrary renderer-side command execution;
- frontend reads of local JSONL files, session files, provider transcript folders, `.symphony` internals, goal ledgers, or event logs;
- raw transcript or raw model output exposure;
- direct goal event append from a child result;
- direct task completion from a child result;
- reviewer verdict, main verification gate, or release gate mutation from the child dispatch lane;
- git write, merge, push, tag, publish, GitHub Release creation, or release automation.

The v52 tag and GitHub Release remain controller-owned. This runbook does not authorize tag or release creation.

## Contract direction

Add `childDispatchPreview.v1` as a no-write preview contract.

Required top-level fields:

```text
contractName
contractVersion
generatedAt
goal
task
requestedRole
providerRecommendation
readiness
blockedReasons[]
sourceContracts[]
sourceRefs[]
taskPack
resultExpectation
boundaries
```

`providerRecommendation.providerId` must be one of:

```text
codex
claude-code
```

`childTaskPack.v1` should include:

```text
goalId
taskId
role
preferredProvider
allowedProviders[]
projectContextRefs[]
sourceContracts[]
taskPrompt
acceptanceCriteria[]
requiredEvidenceRefs[]
forbiddenActions[]
expectedResultBlock
returnPath
copyOnly
willMutate
```

Required values:

- `returnPath`: `v51-result-intake`
- `copyOnly`: `true`
- `willMutate`: `false`
- `providerExecutionAvailable`: `false`
- `actualChildDispatchAvailable`: `false`

Allowed child roles:

```text
worker
reviewer
blocker-investigator
verifier
```

## Workbench surface

Add a controlled preview/copy lane after the v52 System Golden Path panel can be read.

Allowed visible labels:

```text
Preview Child Task
Copy Child Task Pack
Copy Codex Task Pack
Copy Claude Code Task Pack
Expected Result Block
Return Through Result Intake
Refresh State
```

Forbidden visible labels:

```text
Dispatch Child
Run Child
Launch Codex
Launch Claude Code
Execute
Run Provider
Confirm Child Result
Append Event
Mark Complete
Push
Tag
Publish
Release
```

The panel should show readiness and blocked reasons. It should not make copyable work look executed.

## PR breakdown

### PR-0: Runbook

File:

- `docs/plans/v53-controlled-child-dispatch-preview-runbook-2026-06-12.md`

Validation:

```sh
git diff --check
git diff --cached --check
```

### PR-1: Contracts, fixtures, and tests

Fixtures:

```text
child-dispatch-preview.codex-worker.v1.json
child-dispatch-preview.claude-reviewer.v1.json
child-dispatch-preview.blocked-missing-goal.v1.json
child-dispatch-preview.blocked-unsupported-provider.v1.json
child-task-pack.worker.v1.json
child-task-pack.reviewer.v1.json
```

Expected test:

```sh
node --test tests/v53-child-dispatch-preview.test.js
```

The test must reject unsupported provider ids, hidden execution routes, local session refs, raw transcript fields, raw model output fields, event append routes, git routes, and `willMutate: true`.

### PR-2: Backend preview projection

Scope:

- build preview from active goal, next action, supervisor state, `systemGoldenPath.v1`, and provider policy;
- preserve source contract refs;
- preserve blocked and manual-required states;
- produce expected v51 Result Intake return shape;
- produce no writes.

Validation:

```sh
node --test tests/v53-child-dispatch-preview.test.js tests/v52-system-golden-path.test.js
pnpm check
git diff --check
```

### PR-3: Workbench preview lane

Scope:

- render child dispatch readiness;
- render provider recommendation;
- render copy-only child task pack;
- render expected result block for v51 Result Intake;
- assert no execution controls and no event append controls.

Validation:

```sh
pnpm workbench:build
node --test tests/workbench-api-client.test.js tests/workbench-shell.test.js tests/workbench-route-smoke.test.js
node --test tests/v53-child-dispatch-preview.test.js
pnpm check
git diff --check
```

### PR-4: Acceptance evidence

Acceptance should use fake data only:

```text
Codex worker task pack
Claude Code reviewer task pack
unsupported provider block
missing active goal block
```

Both task packs must include an expected result block that returns through v51 Result Intake. No provider should start and no goal event should be appended.

### PR-5: Closeout and v54 handoff

Closeout should record the task pack shape, provider policy, copy-only Workbench behavior, validation evidence, residual risks, and v54 handoff.

The v54 handoff may point to a narrow Codex provider execution pilot, but v53 must not implement provider execution.

## Acceptance path

1. Open Workbench.
2. Confirm `systemGoldenPath.v1` is readable.
3. Preview a Codex worker task pack.
4. Confirm the task pack is copy-only and `willMutate` is `false`.
5. Confirm the expected result block returns through v51 Result Intake.
6. Preview a Claude Code reviewer task pack.
7. Confirm provider separation is visible.
8. Confirm unsupported provider id is blocked.
9. Confirm no provider starts, no child process starts, and no goal event is appended.
10. Confirm Workbench does not expose dispatch, execution, git, tag, publish, or release controls.

## Validation commands

```sh
pnpm workbench:build
node --test tests/v53-child-dispatch-preview.test.js
node --test tests/v52-system-golden-path.test.js
node --test tests/v51-result-intake-evidence-escrow.test.js
node --test tests/workbench-api-client.test.js tests/workbench-shell.test.js tests/workbench-route-smoke.test.js
pnpm check
git diff --check
```

Run `pnpm test` if v53 changes shared contract helpers, console routes, `ArtifactStore`, goal event command paths, or generated Workbench assets in broad ways.

## Rollback path

If child task packs imply execution, revert the contract or Workbench PR that introduced the implication and keep v53 unavailable.

If provider recommendation accepts a provider outside `codex` or `claude-code`, revert the provider policy change and keep manual task packs outside Workbench until the allowlist is fixed.

If expected result blocks bypass v51 Result Intake, revert the backend projection PR and keep child task packs as documentation only.

## v54 handoff

v54 should be a narrow Codex provider execution pilot only after v53 proves copy-only child task packs and v51 result return shape.

v54 should not start Claude Code execution, provider parity, automatic review, or release automation. Those remain later-version work.
