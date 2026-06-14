# v58 Release Closeout Operator Handoff Pack runbook

Date: 2026-06-14
Timezone: Asia/Shanghai
Goal id: `v58-release-closeout-operator-handoff-pack`
Branch draft: `codex/v58-release-closeout-operator-handoff-pack`
Start condition: v57 `review-gate-workbench-surface` is reviewed, merged, tagged, and released by the controller.

## Objective

v58 should turn v57 review/gate readiness and the existing closeout model into a bounded operator handoff pack for release closeout.

The target path is:

```text
reviewGatePreview.v1
-> reviewGateControlledConfirmationState.v1
-> goal-closeout-report.v1
-> releaseCloseoutHandoffPack.v1
-> operator performs tag and GitHub Release steps outside the product path
```

The version is successful only if an operator can inspect release evidence refs, tag target metadata, release note inputs, known blockers, rollback steps, and next-version start context without Workbench or backend product code running git, publishing a release, declaring release readiness, or creating the next version automatically.

## Boundary

Allowed work:

- backend-owned `releaseCloseoutHandoffPack.v1` projection from v57 review/gate preview state, existing closeout report state, release baseline state, event log state, and read-only goal state;
- read-only source refs for reviewer evidence, main gate evidence, release gate evidence, validation commands, target commit, tag evidence, GitHub Release URL after publication, and next-version runbook path;
- copy-only operator checklist text for tag/release steps, with command result fields marked not run by product code;
- Workbench display of release evidence refs, target commit, known blockers, rollback path, and next-version start context;
- fixtures and tests for ready closeout handoff, blocked missing reviewer gate, blocked missing main gate, blocked missing release evidence, dirty baseline, stale target commit, unsafe local path, unsafe command route, and missing next-version runbook.

Forbidden work:

- automatic reviewer verdicts;
- automatic main verification gate mutation;
- automatic release gate mutation;
- release-ready declaration from Workbench;
- `git tag`, `git push`, `gh release create`, `gh release edit`, publish, or GitHub Release automation inside product code;
- provider launch;
- Codex launch;
- Claude Code launch;
- generic shell or terminal UI;
- arbitrary command execution from Workbench;
- frontend reads of local JSONL files, provider session folders, goal ledgers, event logs, raw transcripts, or raw model output;
- direct goal event append outside the existing controlled event registration path;
- direct task completion;
- automatic worktree creation;
- automatic next-version goal creation.

## Contract direction

Add read-model contracts around release closeout handoff state:

```text
releaseCloseoutHandoffPack.v1
releaseEvidenceCarryoverRefs.v1
tagReleaseOperatorChecklist.v1
githubReleaseDraftNotice.v1
nextVersionStartContext.v1
```

`releaseCloseoutHandoffPack.v1` should include:

```text
contractName
contractVersion
generatedAt
goal
reviewGateSource
closeoutSource
releaseBaseline
targetCommit
evidenceRefs[]
knownFacts[]
blockedReasons[]
operatorChecklist
tagReleaseChecklist
nextVersionContext
boundaries
```

Required boundary values:

- `readOnly`: `true`
- `willMutate`: `false`
- `releaseReadyDeclarationAvailable`: `false`
- `gitTagAvailable`: `false`
- `gitPushAvailable`: `false`
- `githubReleaseCreateAvailable`: `false`
- `providerLaunchAvailable`: `false`
- `shellAvailable`: `false`
- `directGoalEventAppendAvailable`: `false`
- `automaticNextVersionGoalAvailable`: `false`

## Workbench surface

Add a Release Closeout Handoff lane after the v57 Review Gate lane.

Allowed visible labels:

```text
Release Closeout Handoff
Release Evidence Refs
Target Commit
Tag and Release Checklist
Known Blockers
Rollback Path
Next Version Context
```

Forbidden visible labels:

```text
Run Tag
Push Tag
Publish Release
Create GitHub Release
Declare Release Ready
Launch Provider
Run Shell
Terminal
Read Session File
Open Transcript
Append Event Directly
Mark Complete
Create Next Goal
```

The panel should show source refs and copy-only checklist fields. It must not expose raw transcript, raw model output, provider session paths, local JSONL paths, shell execution controls, tag execution controls, publish controls, or release-ready controls.

## PR breakdown

### PR-0: Runbook

File:

- `docs/plans/v58-release-closeout-operator-handoff-pack-runbook-2026-06-14.md`

Validation:

```sh
git diff --check
git diff --cached --check
```

### PR-1: Contracts, fixtures, and tests

Fixtures should cover:

```text
release closeout handoff ready
release closeout blocked by missing reviewer verdict
release closeout blocked by missing main gate evidence
release closeout blocked by missing release evidence
release closeout blocked by dirty release baseline
release closeout blocked by stale target commit
release closeout rejects local session refs
release closeout rejects raw transcript refs
release closeout rejects git/tag/publish mutation routes
```

Validation:

```sh
node --test tests/v58-release-closeout-operator-handoff-pack.test.js
node --test tests/v57-review-gate-workbench-surface.test.js
pnpm check
git diff --check
```

### PR-2: Backend handoff projection

Scope:

- project `releaseCloseoutHandoffPack.v1` from `reviewGatePreview.v1`, `reviewGateControlledConfirmationState.v1`, `goal-closeout-report.v1`, release baseline state, event log state, and read-only goal state;
- preserve evidence refs, target commit source, blocked reasons, known facts, next safe action, and boundary flags;
- block missing review gate, missing main gate, missing release evidence, dirty baseline, stale target commit, unsafe refs, and tag/publish mutation routes;
- do not append events, complete tasks, declare release-ready, tag, push, publish, create GitHub Releases, launch providers, or run shell commands.

Validation:

```sh
node --test tests/v58-release-closeout-operator-handoff-pack.test.js tests/v57-review-gate-backend-projection.test.js
pnpm check
git diff --check
```

### PR-3: Operator checklist state

Scope:

- create copy-only checklist state for tag and GitHub Release operator steps;
- bind checklist to target commit, tag name, release title, release notes source refs, validation evidence refs, rollback refs, and next-version runbook path;
- mark all command result fields as not run by product code until the controller records external results in PR-5/release evidence;
- reject any route or payload that asks product code to run `git`, `gh`, shell, provider CLI, or release-ready mutation.

Validation:

```sh
node --test tests/v58-release-closeout-operator-handoff-pack.test.js tests/workbench-api-client.test.js
pnpm check
git diff --check
```

### PR-4: Workbench Release Closeout Handoff lane

Scope:

- render release evidence refs, target commit, known facts, blockers, tag/release checklist fields, rollback path, and next-version context;
- assert no tag, push, publish, GitHub Release, shell, terminal, provider launch, direct event append, task completion, release-ready, or next-goal creation controls appear;
- rebuild generated Workbench static assets.

Validation:

```sh
pnpm workbench:build
node --test tests/workbench-api-client.test.js tests/workbench-shell.test.js tests/workbench-route-smoke.test.js
node --test tests/v58-release-closeout-operator-handoff-pack.test.js tests/v57-review-gate-workbench-surface.test.js
pnpm check
git diff --check
```

### PR-5: Acceptance and closeout

Acceptance should record:

- one ready release closeout handoff pack with explicit review, main, release, validation, target commit, and next-version refs;
- one blocked pack for missing reviewer verdict;
- one blocked pack for missing main gate evidence;
- one blocked pack for missing release evidence;
- one blocked pack for dirty or diverged release baseline;
- one blocked pack for stale target commit;
- rejection of local session refs, raw transcript refs, direct event append, tag mutation, publish mutation, and GitHub Release automation routes;
- Workbench display evidence that the lane is read-only and contains no executable controls.

## Validation commands

```sh
node --test tests/v58-release-closeout-operator-handoff-pack.test.js
node --test tests/v57-review-gate-workbench-surface.test.js
node --test tests/workbench-api-client.test.js tests/workbench-shell.test.js tests/workbench-route-smoke.test.js
pnpm workbench:build
pnpm check
git diff --check
```

Run `pnpm test` if v58 changes shared release closeout, release baseline, event registration, Workbench route registration, tag evidence, or next-version handoff paths.

## Rollback path

If contract validation accepts raw transcripts, raw model output, provider output, provider session paths, local JSONL paths, direct event append, task completion, release-ready declaration, git tag, git push, publish, GitHub Release creation, or shell routes, revert the contract PR.

If backend projection reads frontend files, provider session folders, local JSONL, raw transcripts, raw model output, or local release artifacts outside registered source refs, revert the backend projection PR.

If operator checklist state exposes executable tag, push, publish, GitHub Release, provider, shell, release-ready, or next-goal controls, revert the checklist PR.

If Workbench exposes tag, push, publish, release, shell, terminal, arbitrary command, event append, task completion, release-ready, provider launch, local file, transcript, or next-goal creation controls, revert the Workbench PR and rebuild static assets from the reverted source state.
