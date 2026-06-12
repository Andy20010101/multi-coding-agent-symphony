# v52 System Golden Path Closeout Runbook

Date: 2026-06-12
Timezone: Asia/Shanghai
Goal id: `v52-system-golden-path-closeout`
Branch draft: `codex/v52-system-golden-path-closeout`
Handoff source: v51 PR-5 acceptance and closeout

## Start condition

At this PR-5 handoff point, v51 PR #68 through PR #72 are merged into `main` at `d78edf3e5db97edaf6679f64a9b90378dd94d78c`.

The v51 tag and GitHub Release do not exist yet. `git tag --list 'v51' 'v50'` returned only `v50`, and `gh release view v51` returned `release not found`.

v52 should start after the v51 acceptance closeout PR is reviewed and merged. v52 must not create the v51 tag, publish a release, or treat release work as already complete.

## Objective

v52 turns the current Workbench path into one visible daily Golden Path.

The path is:

```text
Project Launcher
-> App Home
-> Supervisor
-> Context Advisory
-> Result Intake
-> Event Preview / Confirm
-> Review / Gate
-> Closeout
```

The operator should be able to answer these questions from the app without running a provider:

```text
Which project is selected?
Which goal and task are active?
Which step is ready?
Which step is blocked?
Which contract proves that state?
What is the next safe action?
```

## Boundary

v52 is a read-model, Workbench visibility, and acceptance version. It is not a provider execution version.

Allowed work:

- docs updates;
- `systemGoldenPath.v1` contract helpers, fixtures, and tests;
- backend-owned read-only projection from existing safe contracts;
- Workbench display of the golden path;
- generated Workbench assets tied to Workbench source changes;
- acceptance and closeout evidence.

Forbidden work:

- provider execution;
- child dispatch;
- transcript compaction;
- new thread creation;
- generic shell or terminal UI;
- arbitrary renderer-side command execution;
- frontend reads of local JSONL files, session files, provider transcript folders, `.symphony` internals, goal ledgers, or event logs;
- raw transcript or raw model output exposure;
- result intake confirm beyond the existing v51 route;
- event append beyond the existing v50 event preview and confirm route;
- reviewer verdict, main verification, or release gate mutation from the new Golden Path panel;
- git write, merge, push, tag, publish, GitHub Release creation, or release automation.

## Contract direction

Add `systemGoldenPath.v1`.

Required top-level fields:

```text
contractName
contractVersion
generatedAt
project
goal
steps[]
overallState
nextSafeAction
blockedReasons[]
sourceContracts[]
routeProvenance
boundaries
```

Each step should include:

```text
id
label
state
sourceContract
sourceRef
blockedReasons[]
nextSafeAction
willMutate
```

Allowed step states:

```text
ready
pending
blocked
missing
stale
degraded
manual-required
```

Required step ids:

```text
project-binding
app-home
supervisor
context-advisory
result-intake
event-preview
event-confirm
review-gate
closeout
```

`review-gate` should default to `manual-required` unless a later scoped version opens a controlled review/gate surface.

## Workbench surface

Add a read-only `System Golden Path` panel to `/workbench/desktop/` or `/workbench/supervisor/`.

Allowed visible labels:

```text
System Golden Path
Next Safe Action
Source Contract
Blocked Reason
Manual CLI Required
Refresh State
```

Forbidden visible labels:

```text
Run Agent
Execute
Launch Provider
Dispatch Child
Compact Now
New Thread
Push
Tag
Publish
Release
```

The panel should show readiness and blocked reasons. It should not make blocked work look executable.

## PR breakdown

### PR-0: Runbook

File:

- `docs/plans/v52-system-golden-path-closeout-runbook-2026-06-12.md`

Validation:

```sh
git diff --check
git diff --cached --check
```

### PR-1: Current-state docs

Scope:

- update operator docs that describe the current daily path;
- state that v52 starts after v51 acceptance and before provider execution;
- keep historical release evidence intact;
- keep provider execution out of the daily path.

Validation:

```sh
pnpm check
git diff --check
```

### PR-2: `systemGoldenPath.v1` contracts and fixtures

Fixtures:

```text
system-golden-path.ready.v1.json
system-golden-path.missing-project.v1.json
system-golden-path.missing-supervisor.v1.json
system-golden-path.result-intake-blocked.v1.json
system-golden-path.event-preview-blocked.v1.json
system-golden-path.review-gate-manual.v1.json
system-golden-path.closeout-gaps.v1.json
```

Expected test:

```sh
node --test tests/v52-system-golden-path.test.js
```

### PR-3: Backend read-model projection

Scope:

- project existing contracts into `systemGoldenPath.v1`;
- preserve missing, stale, degraded, blocked, and manual-required states;
- include source contracts and source refs;
- do not infer health from UI render success;
- do not read local files from the frontend.

Validation:

```sh
node --test tests/v52-system-golden-path.test.js tests/v44-goal-supervisor-app-read-model.test.js
pnpm check
git diff --check
```

### PR-4: Workbench panel

Scope:

- render `System Golden Path`;
- show each step state, source contract, blocked reason, and next safe action;
- provide refresh only through existing Workbench contract refresh behavior;
- refresh generated Workbench assets after source changes;
- assert forbidden controls are absent.

Validation:

```sh
pnpm workbench:build
node --test tests/workbench-api-client.test.js tests/workbench-shell.test.js tests/workbench-route-smoke.test.js
node --test tests/v52-system-golden-path.test.js
pnpm check
git diff --check
```

### PR-5: Acceptance and closeout

Files:

- `docs/qa/v52-system-golden-path-closeout-acceptance.md`
- `docs/plans/v52-system-golden-path-closeout-snapshot-2026-06-12.md`
- `docs/plans/v53-controlled-child-dispatch-preview-runbook-2026-06-12.md`

Scope:

- prove the daily path from project selection through result intake and event registration;
- record readiness, blocked reasons, source contracts, and manual-required review/gate state;
- hand v53 to controlled child dispatch preview only;
- keep provider execution out of v52.

## Acceptance path

1. Start Workbench.
2. Select or bind the project.
3. Confirm App Home is ready or displays the exact degraded or missing state.
4. Confirm Supervisor is readable.
5. Confirm Context Advisory is visible.
6. Confirm Result Intake readiness from v51 is visible.
7. Confirm Event Preview and Event Confirm readiness from v50 is visible.
8. Confirm Review/Gate displays `manual-required` or controlled-disabled state.
9. Confirm Closeout readiness or closeout gaps are visible.
10. Confirm no provider execution, child dispatch, terminal, session read, transcript compaction, new thread, git write, tag, publish, or GitHub Release automation controls appear.

## Validation commands

```sh
pnpm workbench:build
node --test tests/v52-system-golden-path.test.js
node --test tests/v51-result-intake-evidence-escrow.test.js
node --test tests/v50-supervisor-event-registration-eligibility.test.js tests/v44-goal-supervisor-app-read-model.test.js
node --test tests/workbench-api-client.test.js tests/workbench-shell.test.js tests/workbench-route-smoke.test.js
pnpm check
git diff --check
```

Run `pnpm test` if v52 changes shared contract helpers, console routes, `ArtifactStore`, or the goal event command path.

## Rollback path

If `systemGoldenPath.v1` misstates readiness, revert the contract/projection PR and keep existing v51 result intake and v50 event registration surfaces independent.

If the Workbench panel exposes execution controls or hides blocked state, revert the Workbench PR and keep v52 as docs and backend contract evidence until the panel is corrected.

If acceptance text claims provider execution or release readiness, revert the PR-5 documentation commit before starting v53.

## v53 handoff

v53 should implement controlled child dispatch preview and child task packs. It should stay preview/copy-only and should not execute Codex, Claude Code, or any provider.
