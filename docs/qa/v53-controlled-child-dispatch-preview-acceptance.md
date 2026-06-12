# v53 Controlled Child Dispatch Preview acceptance

Date: 2026-06-12
Timezone: Asia/Shanghai
Goal: `v53-controlled-child-dispatch-preview`
Acceptance baseline: `92509cee98f140dc9e1023ef4537e8405fcedce6`

## Merged implementation record

| Scope | PR | Branch | Head commit | Merge commit | Merged at |
| --- | --- | --- | --- | --- | --- |
| Contracts, fixtures, and tests | #79 `https://github.com/Andy20010101/multi-coding-agent-symphony/pull/79` | `codex/v53-child-dispatch-preview-contracts` | `6687ab54ccfb507fb66c7c12f6e1d76ba89fb828` | `73554bf15f037771aa32b3c3eb7e158d9224cfaa` | 2026-06-12T16:54:00Z |
| Backend preview projection | #80 `https://github.com/Andy20010101/multi-coding-agent-symphony/pull/80` | `codex/v53-child-dispatch-preview-backend-projection` | `45d72bead81240e5094ddae30a8834bae2174007` | `f8095693c6b1240f27cf6069d86d88e77c00b171` | 2026-06-12T17:07:16Z |
| Workbench preview lane | #81 `https://github.com/Andy20010101/multi-coding-agent-symphony/pull/81` | `codex/v53-child-dispatch-preview-workbench-lane` | `f6e206e5329ce5bf78528786bdc025992cc52d87` | `92509cee98f140dc9e1023ef4537e8405fcedce6` | 2026-06-12T17:28:28Z |

## Fake data acceptance

| Scenario | Fixture | Accepted state | Result return path | Boundary evidence |
| --- | --- | --- | --- | --- |
| Codex worker task pack | `fixtures/contracts/child-dispatch-preview.codex-worker.v1.json` | `providerRecommendation.providerId` is `codex`, `requestedRole` is `worker`, `readiness.copyAvailable` is `true`, and `taskPack.copyOnly` is `true`. | `taskPack.returnPath` and `resultExpectation.returnPath` are `v51-result-intake`; `resultExpectation.resultIntakeContract` is `resultIntakeRequest.v1`; `expectedResultBlock.willAppendGoalEvent` is `false`. | The fixture keeps `providerExecutionAvailable`, `actualChildDispatchAvailable`, `directGoalEventAppendAvailable`, `directTaskCompleteAvailable`, reviewer mutation, main gate mutation, release gate mutation, git mutation, tag automation, publish automation, and GitHub Release automation false. |
| Claude Code reviewer task pack | `fixtures/contracts/child-dispatch-preview.claude-reviewer.v1.json` | `providerRecommendation.providerId` is `claude-code`, `requestedRole` is `reviewer`, `readiness.copyAvailable` is `true`, and `taskPack.copyOnly` is `true`. | `taskPack.returnPath` and `resultExpectation.returnPath` are `v51-result-intake`; `resultExpectation.resultIntakeContract` is `resultIntakeRequest.v1`; `expectedResultBlock.workerRole` is `reviewer`; `expectedResultBlock.willAppendGoalEvent` is `false`. | The fixture keeps provider start, child start, event append, task completion, gate mutation, git mutation, tag automation, publish automation, and GitHub Release automation unavailable. |
| Unsupported provider block | `fixtures/contracts/child-dispatch-preview.blocked-unsupported-provider.v1.json` | `readiness.state` is `blocked`, `copyAvailable` is `false`, and `blockedReasons` includes the unsupported-provider state. | `taskPack` and `resultExpectation` are absent because the provider is not allowed. | The blocked fixture does not retain an executable provider id, does not produce a task pack, and does not expose a result block that could bypass v51 Result Intake. |
| Missing active goal block | `fixtures/contracts/child-dispatch-preview.blocked-missing-goal.v1.json` | `readiness.state` is `blocked`, `copyAvailable` is `false`, and the active-goal or active-task fields are missing. | `taskPack` and `resultExpectation` are absent because there is no safe target task. | The blocked fixture does not infer a task from local files, session files, branch names, or frontend state. |

These scenarios use repository fixtures only. They do not start Codex, start Claude Code, create a child process, create a worktree, read provider transcript folders, read local JSONL files, write a goal event, or update a gate.

## Contract and backend evidence

| Check | Evidence | Result |
| --- | --- | --- |
| The contract helpers reject execution and write drift. | `src/symphony/child-dispatch-preview-contracts.js` defines `childDispatchPreview.v1`, `childTaskPack.v1`, `childResultExpectation.v1`, `providerRoleRecommendation.v1`, allowed providers `codex` and `claude-code`, and copy-only boundaries. `tests/v53-child-dispatch-preview.test.js` mutates fixtures to reject provider routes, child dispatch routes, local session refs, raw transcript fields, raw model output fields, event append routes, git routes, release routes, and `willMutate: true`. | Task packs are handoff text, not execution requests. |
| Expected result blocks return through v51 Result Intake. | The Codex worker and Claude reviewer fixtures include `returnPath: "v51-result-intake"`, `contractName: "resultIntakeRequest.v1"`, `resultExpectation.resultIntakeContract: "resultIntakeRequest.v1"`, and `willAppendGoalEvent: false`. | External child results must come back through v51 intake and cannot append goal events directly. |
| Backend projection is read-model owned. | PR #80 added `buildGoalSupervisorChildDispatchPreview` inside `src/symphony/goal-supervisor/app-read-model.js`. It builds preview state from active goal, active task, next action, `systemGoldenPath.v1`, provider policy, and read-only source refs. | The preview is exposed through `goal-supervisor-app-read-model.v1`; it does not add a dispatch API, provider runner, child process, worktree creation path, event append route, or gate mutation route. |
| Backend blocks unsafe state. | `tests/v53-child-dispatch-preview.test.js` covers missing active goal, missing active task, unsupported provider policy, raw or local source refs, unsupported result roles, and unsafe route text. | The backend keeps task packs unavailable when a safe target or allowed provider is missing. |

## Workbench acceptance

| Check | Evidence | Result |
| --- | --- | --- |
| The v53 panel is placed after the v52 System Golden Path panel. | PR #81 renders `ChildDispatchPreviewPanel` after `SystemGoldenPathPanel` on `/workbench/desktop/`. `tests/workbench-shell.test.js` checks `id="system-golden-path-panel"` appears before `id="child-dispatch-preview-panel"` and before the desktop app state strip. | The child preview lane is downstream of the daily path state and does not replace the v52 refresh path. |
| Required labels are visible. | `tests/workbench-shell.test.js` checks `Preview Child Task`, `Copy Child Task Pack`, `Copy Codex Task Pack`, `Copy Claude Code Task Pack`, `Expected Result Block`, `Return Through Result Intake`, and the existing `Refresh State` label. | The operator can inspect the provider target, copy-only task pack, and v51 result return shape in Workbench. |
| Forbidden labels and controls are absent. | `tests/workbench-shell.test.js` checks the v53 panel does not contain `Dispatch Child`, `Run Child`, `Launch Codex`, `Launch Claude Code`, `Execute`, `Run Provider`, `Confirm Child Result`, `Append Event`, `Mark Complete`, `Push`, `Tag`, `Publish`, or `Release`. It also checks the panel has no `button`, `form`, or `textarea`. | Workbench does not present the preview as an action that starts work or mutates state. |
| Copy text is display-only. | `frontend/workbench/src/App.jsx` renders copyable content in `<pre className="copy-block child-dispatch-copy-block">` and does not call `navigator.clipboard`, `fetch`, `window.open`, or `confirmGoalEventPlan` from the v53 panel slice. | Copy is manual text selection, not a browser-side execution or write path. |

## Validation evidence

| Command | Result |
| --- | --- |
| `node --test tests/v53-child-dispatch-preview.test.js` | Passed during PR #81 verification: 16 tests, 0 failures. |
| `node --test tests/workbench-api-client.test.js tests/workbench-shell.test.js tests/workbench-route-smoke.test.js` | Passed during PR #81 verification: 116 tests, 0 failures. The run printed a non-failing Vite WebSocket warning for port `24678`. |
| `pnpm workbench:build` | Passed during PR #81 verification. Vite built `src/symphony/workbench-static/index.html`, `assets/index-N07rqJeo.css`, and `assets/index-D4R-8DGo.js`. |
| `pnpm check` | Passed during PR #81 verification. |
| Browser check through `pnpm symphony console --host 127.0.0.1 --port 8767` | Passed for the console-served desktop page: `#child-dispatch-preview-panel` existed after `#system-golden-path-panel`, before `.desktop-app-state-strip`, showed the required labels, had no forbidden labels, and contained no `button`, `form`, or `textarea`. The checked local state was blocked because no active task was available; it still showed `childDispatchPreview.v1`, allowed providers, and provider/child start flags as false. |
| `git diff --check` | Passed for this PR-4 doc worktree. |
| `git diff --cached --check` | Passed for this PR-4 doc worktree after staging the acceptance document. |

## Boundary result

v53 accepts copy-only child task pack preview and expected v51 Result Intake return shape. It does not run a provider, dispatch a child, launch Codex, launch Claude Code, spawn child processes, create worktrees automatically, compact transcripts, create new threads, add a shell or terminal UI, read local JSONL or provider session files from the frontend, expose raw transcript or raw model output, append goal events directly, complete tasks directly, mutate reviewer verdicts, mutate main verification gates, mutate release gates, write git state, create tags, publish, or create a GitHub Release.

The next product step may pilot narrow Codex provider execution, but v53 does not implement that execution.
