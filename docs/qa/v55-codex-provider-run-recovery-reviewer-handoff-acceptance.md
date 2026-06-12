# v55 Codex Provider Run Recovery and Reviewer Handoff acceptance

Date: 2026-06-13
Timezone: Asia/Shanghai
Goal: `v55-codex-provider-run-recovery-reviewer-handoff`
Acceptance baseline: `ec088787d919aa3cdb78c54852ea07b4e469d44d`

## Merged implementation record

| Scope | PR | Branch | Head commit | Merge commit | Merged at |
| --- | --- | --- | --- | --- | --- |
| Contracts, fixtures, and tests | #89 `https://github.com/Andy20010101/multi-coding-agent-symphony/pull/89` | `codex/v55-run-recovery-contracts-fixtures-tests` | `3a9259cf197a49a7148a709c85aadf176fa5495b` | `0fa730c7576c16eea3af5b3078d9513c92cb1ba7` | 2026-06-12T23:20:20Z |
| Backend recovery projection | #90 `https://github.com/Andy20010101/multi-coding-agent-symphony/pull/90` | `codex/v55-backend-run-recovery-projection` | `658670d34d1e52688d95818c05eeea2a80673d76` | `5081fab936d13b78f3b400e3cb965757e10c1a3f` | 2026-06-12T23:31:37Z |
| Reviewer handoff preview | #91 `https://github.com/Andy20010101/multi-coding-agent-symphony/pull/91` | `codex/v55-reviewer-handoff-preview` | `ed7eec10a622c419540c9a539ac739e6232a4d52` | `7c941fe3cb8f8221fa65441b286bd925013894e3` | 2026-06-12T23:43:04Z |
| Workbench recovery lane | #92 `https://github.com/Andy20010101/multi-coding-agent-symphony/pull/92` | `codex/v55-workbench-recovery-lane` | `d40d4669c15c2b30bca72fbe75e2e808ac09f9e6` | `ec088787d919aa3cdb78c54852ea07b4e469d44d` | 2026-06-12T23:53:04Z |

## Fixture acceptance

| Scenario | Fixture | Accepted state | Result intake state | Boundary evidence |
| --- | --- | --- | --- | --- |
| Completed Codex run linked to accepted pending result | `fixtures/contracts/codex-provider-run-recovery/recovery.completed-accepted.v1.json` | `providerId` is `codex`, `role` is `worker`, run status is `completed`, and `recoveryState` is `ready-for-reviewer-handoff`. | `resultIntake.contractName` is `resultIntakeRequest.v1`; linked pending result is `pendingResult.v1` with accepted state. | Recovery boundaries keep direct event append, direct task completion, reviewer mutation, main gate mutation, release gate mutation, shell, git, tag, publish, and release automation unavailable. |
| Blocked Codex run linked to pending blocker | `fixtures/contracts/codex-provider-run-recovery/recovery.blocked-pending-blocker.v1.json` | Run status is `blocked`; `recoveryState` keeps the operator in the recovery lane instead of converting the block into task completion. | Pending result state is not accepted for reviewer handoff. | The fixture carries blocker context through result intake state and does not append goal events directly. |
| Missing result intake request | `fixtures/contracts/codex-provider-run-recovery/recovery.missing-result-intake.v1.json` | Recovery state is blocked for missing intake linkage. | No accepted pending result is inferred. | The backend must not invent a result intake request from local files, transcripts, or frontend state. |
| Stale preview hash | `fixtures/contracts/codex-provider-run-recovery/recovery.stale-preview-hash.v1.json` | Recovery state is blocked by preview hash mismatch. | Reviewer handoff remains unavailable. | The recovery path requires current backend-owned hashes before producing next-role context. |
| Unsafe raw-output rejection | `fixtures/contracts/codex-provider-run-recovery/recovery.raw-transcript.invalid.v1.json` | Contract validation rejects raw transcript or raw model-output drift. | Unsafe output never becomes an accepted pending result. | Raw transcript, raw model output, provider session paths, local JSONL paths, and direct mutation routes stay outside the read model. |
| Reviewer handoff ready | `fixtures/contracts/codex-provider-run-recovery/reviewer-handoff.ready.v1.json` | `copyOnly` is `true`, `willMutate` is `false`, and the accepted pending result matches the recovery record. | Handoff text includes accepted summary, evidence refs, changed files, validation commands, risks, and blockers when present. | The preview creates text for an operator to copy; it does not create a reviewer verdict or task-completion event. |
| Reviewer handoff blocked before intake acceptance | `fixtures/contracts/codex-provider-run-recovery/reviewer-handoff.blocked-before-intake.v1.json` | Handoff remains blocked until the pending result is accepted. | No accepted result summary or handoff pack is exposed before intake acceptance. | The preview cannot bypass v51 Result Intake. |
| Unsafe handoff mutation rejection | `fixtures/contracts/codex-provider-run-recovery/reviewer-handoff.unsafe-mutation.invalid.v1.json` | Contract validation rejects unsafe route text and mutation drift. | No handoff pack is accepted. | Event confirm routes, direct task completion, git, tag, publish, release routes, local paths, and raw outputs are rejected. |

## Contract and backend evidence

| Check | Evidence | Result |
| --- | --- | --- |
| Recovery contracts are Codex worker recovery only. | `src/symphony/codex-provider-run-recovery-contracts.js` defines `codexProviderRunRecovery.v1` and `reviewerHandoffPreview.v1`; contract boundaries keep provider id `codex`, role `worker`, copy-only handoff, and no mutation flags. | v55 does not add provider parity, Claude Code execution, direct goal event append, task completion, gate mutation, git, tag, publish, or release automation. |
| Backend projection reads backend-owned run records. | `src/symphony/codex-provider-run-recovery-state.js` loads provider run records from the backend recovery store, and `src/symphony/goal-supervisor/app-read-model.js` projects recovery and handoff preview into `goal-supervisor-app-read-model.v1`. | Workbench receives read-model state; the frontend does not read local JSONL files, provider session folders, goal ledgers, event logs, raw transcripts, or raw model output. |
| Recovery state blocks unsafe or stale records. | `tests/v55-codex-provider-run-recovery-reviewer-handoff.test.js` covers completed accepted state, blocked pending blocker state, missing intake, stale preview hash, unsafe raw transcript, pending-result mismatch, and unsafe route text. | A completed or blocked Codex run is inspectable, but only an accepted matching pending result can unlock reviewer handoff. |
| Reviewer handoff binds to the accepted pending result. | PR #91 revised `buildReviewerHandoffPreview` to compare the supplied pending result with `recovery.resultIntake.pendingResult` by contract name, escrow ref, and state. | Mismatched or non-accepted pending results produce a blocked preview with no accepted summary and no handoff pack. |

## Workbench acceptance

| Check | Evidence | Result |
| --- | --- | --- |
| Recovery lane is placed after the v54 Codex Execution Preview lane. | PR #92 renders `CodexRunRecoveryPanel` and `ReviewerHandoffPreviewPanel` after the v54 panel on `/workbench/desktop/`; `tests/workbench-shell.test.js` checks the order. | The recovery path follows the provider run lane and does not replace v51 Result Intake or v54 execution preview state. |
| Required labels are visible. | `tests/workbench-shell.test.js` checks `Codex Run Recovery`, `Result Intake State`, `Reviewer Handoff Preview`, `Copy Reviewer Handoff`, and `Refresh State`. | Operators can inspect recovery state, intake state, source contracts, boundary flags, blocked reasons, and copy-only reviewer context. |
| Forbidden labels and controls are absent. | The Workbench tests check no `button`, `form`, or `textarea` appears in the v55 panels, and no `Launch Claude Code`, `Run Any Provider`, `Run Shell`, `Terminal`, `Append Event`, `Mark Complete`, `Confirm Reviewer Verdict`, `Confirm Main Gate`, `Confirm Release Gate`, `Push`, `Tag`, `Publish`, or `Release` label is exposed. | The v55 panels do not present browser-side execution, reviewer verdict confirmation, gate mutation, git, tag, publish, or release work. |
| Browser check used console-served Desktop App Home. | A local `pnpm symphony console --host 127.0.0.1 --port 8875` run was opened at `http://127.0.0.1:8875/workbench/desktop/#codex-run-recovery-panel`. | The panels rendered in the expected order, showed contract and boundary text, and exposed no forbidden mutation labels or controls. The checked live state was `missing` because this repository state did not include a current Codex run record. |

## Validation evidence

| Command | Result |
| --- | --- |
| `node --test tests/v55-codex-provider-run-recovery-reviewer-handoff.test.js tests/v54-codex-provider-execution-pilot.test.js tests/v51-result-intake-evidence-escrow.test.js` | Passed on the PR-5 branch: 41 tests, 0 failures. |
| `node --test tests/workbench-api-client.test.js tests/workbench-shell.test.js tests/workbench-route-smoke.test.js` | Passed on the PR-5 branch: 120 tests, 0 failures. The run printed a non-failing Vite WebSocket warning for port `24678`. |
| `pnpm workbench:build` | Passed on the PR-5 branch. Vite built the current tracked Workbench static output. |
| `pnpm check` | Passed on the PR-5 branch. |
| `git diff --check` | Passed on the PR-5 branch before staging. |
| `git diff --cached --check` | Passed on the PR-5 branch after staging. |
| GitHub checks for #89, #90, #91, and #92 | `gh pr checks` returned passing `changes`, `code-focused`, and `verify` jobs for #89-#92. #92 also returned passing `build` jobs because it changed Workbench assets. Skipped jobs matched workflow filters for the changed files. |

## Boundary result

v55 accepts this recovery and handoff path:

```text
codexProviderRunRecord.v1
-> resultIntakeRequest.v1
-> pendingResult.v1
-> operator accepts, blocks, or rejects through v51 Result Intake
-> codexProviderRunRecovery.v1
-> reviewerHandoffPreview.v1
-> operator copies reviewer handoff text
```

The shipped path makes completed and blocked Codex run records inspectable through backend-owned recovery state, blocks stale or unsafe recovery records, and exposes reviewer handoff only after the accepted pending result matches the recovery record.

v55 does not ship Claude Code execution, provider parity, automatic reviewer verdicts, automatic main verification mutation, release gate mutation, direct goal event append, direct task completion, transcript compaction, new thread product capability, generic shell UI, terminal UI, frontend local JSONL reads, provider session file reads, raw transcript exposure, raw model output exposure, automatic worktree creation, git mutation, tag automation, publish automation, or GitHub Release automation.
