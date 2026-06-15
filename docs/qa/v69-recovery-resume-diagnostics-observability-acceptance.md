# v69 Recovery, Resume, Diagnostics, and Observability acceptance

Date: 2026-06-15
Timezone: Asia/Shanghai
Goal: `v69-recovery-resume-diagnostics-observability`

## Accepted Scope

v69 records recoverable execution-loop state without turning Workbench into an executor:

```text
operation run
-> operationTimeline.v1
-> operationFailureClassification.v1
-> operationRecoveryPreview.v1
-> operationRecoveryConfirmation.v1
-> operationDiagnosticsSummary.v1
-> Workbench read-only recovery surface
```

Accepted changes:

- v69 runbook and start evidence are recorded in `docs/plans/v69-recovery-resume-diagnostics-observability-runbook-2026-06-14.md` and `docs/plans/workbench-v61-v72-real-use-runbooks/v69_recovery-resume-diagnostics-observability_goal_runbook_latest.md`.
- `operationTimeline.v1` records bounded operation steps, status, failure links, elapsed time, and evidence refs.
- `operationFailureClassification.v1` records failure layer, failure code, retryability, resume eligibility, blocked reasons, and next safe action.
- Fixtures cover provider timeout, provider unavailable, dirty worktree, missing artifact, verification failure, reviewer blocked, adoption failure, stale plan hash, and unknown failure.
- `operationRecoveryPreview.v1` produces controlled retry, resume, handoff, mark-blocked, or manual-controller actions from a classification.
- `operationRecoveryConfirmation.v1` is bound to `planHash`, operation id, step id, classification id, action id, and source fingerprint.
- `operationUsageTimeObservability.v1` records elapsed time, provider call count, token input/output status, and cost status without fabricating unknown values.
- `operationDiagnosticsSummary.v1` records copy-only diagnostics with raw logs, raw provider output, raw transcripts, local session paths, and secrets excluded or redacted.
- Workbench shows the Recovery / Timeline panel from backend operation records only.
- Rebuilt Workbench static assets point to CSS asset `index-BX8171d6.css` and JS asset `index-Cu8TRE1-.js`.
- v70 handoff is recorded in `docs/plans/v70-release-manager-practical-loop-runbook-2026-06-14.md`.

Out of scope:

- generic shell or terminal UI;
- arbitrary renderer-side command execution;
- frontend reads of local JSONL files, provider session folders, `.symphony` internals, goal ledgers, event logs, raw transcripts, raw provider output, or raw model output;
- unsupported provider claims;
- direct provider-output mutation, task completion, adoption, main verification, or release readiness;
- hidden retries or implicit provider switching;
- token or cost fabrication;
- automatic self-review, automatic worktree creation, or automatic next-version goal creation;
- product-level git merge, push, tag, publish, or GitHub Release automation;
- public distribution, notarization, or auto-update claims.

## Evidence

| Check | Result |
| --- | --- |
| `node --test tests/v69-recovery-resume-diagnostics-observability.test.js` | Passed on PR-4 branch: 15 tests, 15 passed. |
| `node --test tests/v68-adoption-main-verification-loop.test.js` | Passed on PR-2 branch: 13 tests, 13 passed. |
| `node --test tests/security-policy.test.js` | Passed on PR-3 branch: 7 tests, 7 passed. |
| `node --test tests/workbench-api-client.test.js tests/workbench-shell.test.js tests/workbench-route-smoke.test.js` | Passed on PR-4 branch: 133 tests, 133 passed. A non-failing Vite WebSocket warning reported port `24678` already in use. |
| `pnpm workbench:build` | Passed on PR-4 branch. Built `src/symphony/workbench-static/index.html`, CSS asset `index-BX8171d6.css`, and JS asset `index-Cu8TRE1-.js`. |
| Browser smoke for `http://127.0.0.1:5173/workbench/` | Passed on PR-4 branch. `#recovery-timeline-panel` rendered with no button, form, textarea, input, or select controls; no `git merge`, `git tag`, `git push`, `sessionPath`, `jsonl`, `rawModelOutput`, or `rawTranscript` text was present in the panel. |
| `pnpm check` | Passed on PR-4 branch. |
| `git diff --check` | Passed on PR-4 branch before staging. |
| `git diff --cached --check` | Passed after PR-4 staging. |
| PR-5 closeout validation | Passed on PR-5 branch: `pnpm workbench:build`, `node --test tests/v69-recovery-resume-diagnostics-observability.test.js`, `node --test tests/v68-adoption-main-verification-loop.test.js`, `node --test tests/security-policy.test.js`, `node --test tests/workbench-api-client.test.js tests/workbench-shell.test.js tests/workbench-route-smoke.test.js`, `pnpm check`, and `pnpm test`. The Workbench three-suite passed 133 tests; `pnpm test` passed 1444 tests. Non-failing Vite WebSocket warnings again reported port `24678` already in use. |

## Acceptance Criteria

| Criterion | Evidence |
| --- | --- |
| Recovery state is structured. | `src/symphony/run-recovery-contracts.js`, fixtures in `fixtures/contracts/run-recovery/`, and `tests/v69-recovery-resume-diagnostics-observability.test.js`. |
| Failure classification is bounded. | Failure layers are enumerated and unsafe raw/session/local/provider payload fields are rejected by validators and tests. |
| Resume and retry are controlled. | Recovery confirmation requires the preview `planHash`, source fingerprint, action id, operation id, step id, and classification id. |
| Diagnostics are copy-only and redacted. | Diagnostics summary tests assert redaction and rejection of raw logs, raw provider output, raw transcripts, local session paths, and secret drift. |
| Usage and time observability do not invent data. | Usage metrics preserve `observed`, `unknown`, or `unavailable` status instead of converting unknown token or cost values into numbers. |
| Workbench remains read-only. | `frontend/workbench/src/App.jsx`, `frontend/workbench/src/api/contracts.js`, Workbench tests, rebuilt static assets, and Browser smoke. |
| v70 handoff is scoped to release-manager practical loop. | `docs/plans/v70-release-manager-practical-loop-runbook-2026-06-14.md`. |

## Residual Risk

v69 proves recovery and diagnostics through contracts, fixtures, source tests, Workbench projection, static build, and Browser smoke. It does not run a real provider retry, real failed provider resume, or real release-manager loop.

v69 records recovery previews and confirmations as bounded state. It does not execute a retry from Workbench, mutate provider output, register gates, merge branches, tag, push, or publish releases from product code.

## Rollback

If recovery contracts accept raw transcripts, raw provider output, local session paths, secrets, unsupported provider claims, hidden retry, stale `planHash`, or source fingerprint drift, revert PR #163, PR #164, and dependent diagnostics or Workbench changes.

If diagnostics include raw logs, raw provider output, raw transcripts, local session paths, or fabricated token/cost values, revert PR #165 and dependent Workbench changes.

If Workbench exposes shell, terminal, arbitrary command launch, frontend local session reads, raw transcripts, raw provider output, direct retry execution, provider invocation, git writes, or GitHub Release automation, revert PR #166 and rebuild static assets from the reverted source.
