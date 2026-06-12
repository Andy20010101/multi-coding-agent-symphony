# v54 Codex Provider Execution Pilot acceptance

Date: 2026-06-12
Timezone: Asia/Shanghai
Goal: `v54-codex-provider-execution-pilot`
Acceptance baseline: `84f94a4686ba1813a1079bbcddfa0af2e0850d80`

## Merged implementation record

| Scope | PR | Branch | Head commit | Merge commit | Merged at |
| --- | --- | --- | --- | --- | --- |
| Contracts, fixtures, and tests | #84 `https://github.com/Andy20010101/multi-coding-agent-symphony/pull/84` | `codex/v54-codex-provider-execution-contracts` | `fb9fbb857483753786a5737c22ff06530151382b` | `b6b2dbc89c3d93d0ba959633193d4b766ef44570` | 2026-06-12T17:55:28Z |
| Backend preview and confirmation | #85 `https://github.com/Andy20010101/multi-coding-agent-symphony/pull/85` | `codex/v54-codex-provider-execution-backend-preview` | `8d5607b3cd1ab15f2b30dae16e3ab5105aa7293e` | `58071218a33a32beaf7b652d82468a17145689e7` | 2026-06-12T18:02:07Z |
| Bounded Codex runner | #86 `https://github.com/Andy20010101/multi-coding-agent-symphony/pull/86` | `codex/v54-codex-provider-execution-runner` | `b10a9c39ef0694bbf3143dfe54dc45d36980a9c7` | `05de4ea8ddec12f8056beb91448b1641f3bd24cf` | 2026-06-12T18:07:16Z |
| Workbench pilot lane | #87 `https://github.com/Andy20010101/multi-coding-agent-symphony/pull/87` | `codex/v54-codex-provider-execution-workbench-lane` | `39db6cb2e85f9485c6471bff0fc7a91f78e3616a` | `84f94a4686ba1813a1079bbcddfa0af2e0850d80` | 2026-06-12T18:15:17Z |

## Fixture acceptance

| Scenario | Fixture | Accepted state | Result return path | Boundary evidence |
| --- | --- | --- | --- | --- |
| Ready Codex worker preview | `fixtures/contracts/codex-provider-execution/preview.ready.v1.json` | `providerId` is `codex`, `role` is `worker`, `blockedReasons` is empty, `previewHash` and `taskPackHash` are `sha256:` values. | `resultReturn.returnPath` is `v51-result-intake`; `resultReturn.resultIntakeContract` is `resultIntakeRequest.v1`. | The fixture keeps provider parity, Claude Code execution, direct goal event append, direct task completion, reviewer mutation, main gate mutation, release gate mutation, generic shell, arbitrary command, frontend JSONL read, local session file read, raw transcript, raw model output, git mutation, tag automation, publish automation, and GitHub Release automation unavailable. |
| Missing task pack block | `fixtures/contracts/codex-provider-execution/preview.missing-task-pack.v1.json` | The preview is blocked and includes `task-pack-missing`; it does not expose a runnable task pack hash. | Result return policy remains `v51-result-intake`; no provider execution can start from this preview. | The blocked fixture does not infer task pack content from local files, provider session files, JSONL logs, or frontend state. |
| Unsupported provider block | `fixtures/contracts/codex-provider-execution/preview.unsupported-provider.v1.json` | The preview is blocked for provider policy; the accepted provider remains `codex` and role remains `worker`. | The blocked preview cannot produce a valid confirmation for a non-Codex provider. | The fixture rejects provider parity and does not expose Claude Code execution. |
| Completed run record | `fixtures/contracts/codex-provider-execution/run-record.completed.v1.json` | `status` is `completed`; the record contains sanitized summary, changed files, validation commands, risks, and evidence refs. | `resultIntakeRequest.contractName` is `resultIntakeRequest.v1`; the request returns a sanitized result block through v51 Result Intake. | The run record does not expose raw transcript, raw model output, provider output, direct event append, task completion, gate mutation, git, tag, publish, or release automation fields. |
| Blocked run record | `fixtures/contracts/codex-provider-execution/run-record.blocked.v1.json` | `status` is `blocked`; the result intake request carries a sanitized blocker result instead of a direct task-completion write. | The blocker still returns through `resultIntakeRequest.v1`; it does not append a goal event directly. | The blocked record keeps the same no-write boundaries as the completed record. |
| Unsafe run record rejection | `run-record.raw-transcript.invalid.v1.json`, `run-record.direct-event-append.invalid.v1.json`, and `preview.local-session-ref.invalid.v1.json` | Contract validation rejects raw transcript fields, direct event append drift, and local session refs. | Unsafe records do not become result intake requests. | The rejection path blocks transcript leakage, model-output leakage, local file references, and direct mutation drift. |

These scenarios use repository fixtures and an injected test executor. They do not start Claude Code, run provider parity, add an automatic reviewer verdict, append goal events directly, mutate gates, create tags, publish, or create a GitHub Release.

## Contract and backend evidence

| Check | Evidence | Result |
| --- | --- | --- |
| v54 contracts are Codex worker only. | `src/symphony/codex-provider-execution-contracts.js` defines `codexProviderExecutionPreview.v1`, `codexProviderExecutionConfirmation.v1`, and `codexProviderRunRecord.v1`; constants keep `providerId` as `codex`, `role` as `worker`, and result return as `v51-result-intake`. | The contract layer has no provider parity or Claude Code execution path. |
| Confirmation is bound to the current preview. | `src/symphony/codex-provider-execution-backend.js` validates `previewHash`, `providerId`, `goalId`, `taskId`, `role`, and `operatorId` before returning `codexProviderExecutionConfirmation.v1`. | Stale preview hashes and unsafe confirm fields cannot start the runner helper. |
| Backend preview is read-model owned. | `src/symphony/goal-supervisor/app-read-model.js` projects `codexProviderExecutionPreview` from the supervisor app read model. | Workbench reads backend-owned preview state; it does not read local session files or infer task state in the frontend. |
| Runner requires an explicit executor. | `src/symphony/codex-provider-execution-runner.js` throws `missing-codex-executor` unless `executeCodex` is provided. It also checks preview readiness, matching confirmation, safe cwd, and bounded timeout. | v54 does not add a generic shell or Workbench-side arbitrary command runner. |
| Provider output is sanitized before intake. | `runConfirmedCodexProviderExecution` builds `codexProviderRunRecord.v1` and a `resultIntakeRequest.v1`; contract tests reject raw transcript, raw model output, provider output, direct event append, gate mutation, git, tag, publish, and release routes. | The only accepted return path is v51 Result Intake. |

## Workbench acceptance

| Check | Evidence | Result |
| --- | --- | --- |
| The v54 panel is placed after v53 child preview. | PR #87 renders `CodexProviderExecutionPreviewPanel` after `ChildDispatchPreviewPanel` and before `.desktop-app-state-strip` on `/workbench/desktop/`. `tests/workbench-shell.test.js` checks that order. | The Codex lane depends on the child task pack preview and does not replace v52/v53 state. |
| Required labels are visible. | `tests/workbench-shell.test.js` checks `Codex Execution Preview`, `Confirm Codex Run`, `Codex Run Status`, `Return Through Result Intake`, and `Refresh State`. | The operator can inspect provider id, role, preview hash, task pack hash, result return, and blocked reasons. |
| Forbidden labels and controls are absent. | The v54 SSR test checks the panel has no `button`, `form`, or `textarea`, and no `Launch Claude Code`, `Run Any Provider`, `Run Shell`, `Terminal`, `Append Event`, `Mark Complete`, `Confirm Reviewer Verdict`, `Confirm Main Gate`, `Confirm Release Gate`, `Push`, `Tag`, `Publish`, or `Release` label. | Workbench does not present the preview as a browser-side execution or release action. |
| Frontend stays display-only. | The v54 component slice is checked for absence of `fetch(`, `confirmGoalEventPlan`, `window.open`, `navigator.clipboard`, `button`, `form`, and `textarea`. | The panel displays backend projection only and does not write state from the renderer. |

## Validation evidence

| Command | Result |
| --- | --- |
| `node --test tests/v54-codex-provider-execution-pilot.test.js` | Passed during PR #87 verification: 16 tests, 0 failures. |
| `node --test tests/workbench-api-client.test.js tests/workbench-shell.test.js tests/workbench-route-smoke.test.js` | Passed during PR #87 verification: 118 tests, 0 failures. The run printed a non-failing Vite WebSocket warning for port `24678`. |
| `pnpm workbench:build` | Passed during PR #87 verification. Vite built `src/symphony/workbench-static/index.html`, `assets/index-CgzrgGcT.css`, and `assets/index-DSEicci2.js`. |
| `pnpm check` | Passed during PR #87 verification. |
| `git diff --check` | Passed during PR #87 verification before staging. |
| `git diff --cached --check` | Passed during PR #87 verification after staging. |
| GitHub CI for #84, #85, #86, and #87 | Passed on each merged implementation PR. |

## Boundary result

v54 accepts a Codex-only worker execution pilot contract path:

```text
childDispatchPreview.v1
-> codexProviderExecutionPreview.v1
-> codexProviderExecutionConfirmation.v1
-> explicit injected Codex executor
-> codexProviderRunRecord.v1
-> resultIntakeRequest.v1
-> v51 Result Intake
```

The implementation does not ship Claude Code execution, provider parity, automatic review, automatic main verification mutation, release gate mutation, direct goal event append, direct task completion, transcript compaction, new thread product capability, generic shell UI, terminal UI, frontend local JSONL reads, provider session file reads, raw transcript exposure, raw model output exposure, git mutation, tag automation, publish automation, or GitHub Release automation.

The Workbench lane displays preview, confirmation readiness, not-started run status, and Result Intake return state. It does not start Codex from the browser.
