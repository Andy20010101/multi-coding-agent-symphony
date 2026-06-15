# v69 Recovery, Resume, Diagnostics, and Observability closeout snapshot

Date: 2026-06-15
Timezone: Asia/Shanghai
Goal: `v69-recovery-resume-diagnostics-observability`
PR-5 branch: `codex/v69-closeout-handoff`
Pre-closeout main commit: `1c58789ff9488eac7ff100e0b338e19c4800bdf3`

## Shipped State

v69 ships bounded recovery and diagnostics for interrupted, failed, timeout, and blocked operation runs:

```text
operationTimeline.v1
-> operationFailureClassification.v1
-> operationRecoveryPreview.v1
-> operationRecoveryConfirmation.v1
-> operationUsageTimeObservability.v1
-> operationDiagnosticsSummary.v1
-> Workbench Recovery / Timeline panel
```

The shipped scope is:

- v69 start evidence on top of verified v68 tag and GitHub Release;
- timeline and failure taxonomy contracts, fixtures, validators, and tests;
- controlled recovery preview and confirmation with `planHash` and source fingerprint binding;
- diagnostics summary with bounded redaction and copy-only evidence refs;
- usage/time observability that preserves unknown and unavailable token/cost values;
- Workbench recovery surface showing timeline, failure layer, resume eligibility, recovery preview/confirmation, usage/time status, diagnostics, and boundary flags;
- rebuilt Workbench static assets;
- v69 acceptance record, closeout snapshot, and v70 release-manager handoff runbook.

v69 does not ship generic shell or terminal UI, arbitrary renderer command execution, frontend local JSONL/session/provider folder reads, `.symphony` internals reads, goal ledger or event-log reads, raw transcript exposure, raw model output exposure, raw provider output exposure, unsupported provider claims, provider-output mutation, direct task completion, direct adoption, main verification pass, release readiness, hidden retries, implicit provider switching, fabricated token/cost values, automatic self-review, automatic worktree creation, automatic next-version goal creation, product-level git merge/push/tag/publish, GitHub Release automation, public distribution, notarization, or auto-update claims.

## PR Scope Record

| Runbook slot | GitHub PR | Branch | Merge commit | Merged at | Evidence |
| --- | --- | --- | --- | --- | --- |
| PR-0 runbook | #162 `https://github.com/Andy20010101/multi-coding-agent-symphony/pull/162` | `codex/v69-runbook-start` | `3c21dd00e7db3c44f3511534529919b3e01399cf` | 2026-06-15T00:29:37Z | Added v69 startup evidence and latest runbook. |
| PR-1 timeline and failure taxonomy contracts | #163 `https://github.com/Andy20010101/multi-coding-agent-symphony/pull/163` | `codex/v69-recovery-contracts` | `a0308503def736c8c40fad4a09cc72e504c47117` | 2026-06-15T00:37:21Z | Added operation timeline, failure classification, fixtures, validators, and tests. |
| PR-2 recovery preview and controlled resume | #164 `https://github.com/Andy20010101/multi-coding-agent-symphony/pull/164` | `codex/v69-recovery-preview-resume` | `45c85dec66daee5406027cbd71814f3da82b708c` | 2026-06-15T00:43:18Z | Added recovery preview/confirmation with `planHash`, classification, operation, step, action, and source fingerprint binding. |
| PR-3 diagnostics and usage/time observability | #165 `https://github.com/Andy20010101/multi-coding-agent-symphony/pull/165` | `codex/v69-diagnostics-observability` | `68b9097eca08b162d20e499362bfc5f84643c22d` | 2026-06-15T00:49:05Z | Added usage/time observability, diagnostics summary, redaction, and tests. |
| PR-4 Workbench recovery surface | #166 `https://github.com/Andy20010101/multi-coding-agent-symphony/pull/166` | `codex/v69-workbench-recovery-surface` | `1c58789ff9488eac7ff100e0b338e19c4800bdf3` | 2026-06-15T00:59:21Z | Added Workbench recovery projection, read-only panel, tests, static assets, and Browser smoke. |
| PR-5 acceptance, closeout, and v70 handoff | This PR | `codex/v69-closeout-handoff` | Pending until merge | Pending until merge | Adds v69 acceptance, closeout snapshot, and v70 runbook. |

## PR-5 Files

| File | Purpose |
| --- | --- |
| `docs/qa/v69-recovery-resume-diagnostics-observability-acceptance.md` | Acceptance record for contracts, recovery preview/confirm, diagnostics, usage/time observability, Workbench surface, validation, residual risk, and rollback. |
| `docs/plans/v69-recovery-resume-diagnostics-observability-closeout-snapshot-2026-06-14.md` | Closeout snapshot for shipped scope, PR chain, validation, rollback, tag/release notes, and v70 handoff. |
| `docs/plans/v70-release-manager-practical-loop-runbook-2026-06-14.md` | Next-version handoff for release-manager practical loop. |

## Validation Evidence

| Command | Result |
| --- | --- |
| `pnpm workbench:build` | Passed on PR-4 branch; static output is `index-BX8171d6.css` and `index-Cu8TRE1-.js`. |
| `node --test tests/v69-recovery-resume-diagnostics-observability.test.js` | Passed on PR-4 branch: 15 tests, 15 passed. |
| `node --test tests/v68-adoption-main-verification-loop.test.js` | Passed on PR-2 branch: 13 tests, 13 passed. |
| `node --test tests/security-policy.test.js` | Passed on PR-3 branch: 7 tests, 7 passed. |
| `node --test tests/workbench-api-client.test.js tests/workbench-shell.test.js tests/workbench-route-smoke.test.js` | Passed on PR-4 branch: 133 tests, 133 passed. A non-failing Vite WebSocket warning reported port `24678` already in use. |
| Browser smoke for `http://127.0.0.1:5173/workbench/` | Passed on PR-4 branch. `#recovery-timeline-panel` rendered with no button, form, textarea, input, or select controls; no `git merge`, `git tag`, `git push`, `sessionPath`, `jsonl`, `rawModelOutput`, or `rawTranscript` text was present in the panel. |
| `pnpm check` | Passed on PR-4 branch. |
| `git diff --check` | Passed on PR-4 branch before staging. |
| `git diff --cached --check` | Passed after PR-4 staging. |
| PR-5 closeout validation | Passed on PR-5 branch: `pnpm workbench:build`, `node --test tests/v69-recovery-resume-diagnostics-observability.test.js`, `node --test tests/v68-adoption-main-verification-loop.test.js`, `node --test tests/security-policy.test.js`, `node --test tests/workbench-api-client.test.js tests/workbench-shell.test.js tests/workbench-route-smoke.test.js`, `pnpm check`, and `pnpm test`. The Workbench three-suite passed 133 tests; `pnpm test` passed 1444 tests. Non-failing Vite WebSocket warnings again reported port `24678` already in use. |

## Recovery Evidence

The v69 recovery path is covered by `tests/v69-recovery-resume-diagnostics-observability.test.js`:

- operation timelines preserve step order, status, failure refs, elapsed time, and bounded evidence refs;
- failure classifications use enumerated layers and explicit resume eligibility;
- recovery previews select retry, resume, handoff, mark-blocked, or manual-controller actions from the classification;
- recovery confirmations reject stale `planHash`, mismatched action ids, mismatched operation ids, mismatched step ids, mismatched classification ids, and source fingerprint drift;
- unavailable requested actions return a blocked preview instead of falling back to a different action;
- diagnostics summaries redact unsafe refs and reject raw logs, raw provider output, raw transcripts, local session paths, and secret drift;
- usage/time observability keeps token and cost values `unknown` or `unavailable` when no measured value exists.

## Rollback Path

Rollback is PR-scoped:

- revert PR #166 if Workbench exposes execution controls, raw output, local provider/session paths, frontend local session reads, hidden retry controls, direct provider invocation, product git writes, or GitHub Release automation;
- revert PR #165 if diagnostics include raw logs, raw provider output, raw transcripts, local session paths, secrets, or fabricated token/cost values;
- revert PR #164 if recovery confirmation accepts stale `planHash`, fingerprint drift, mismatched operation/classification/step/action ids, hidden retries, provider invocation, git mutation, or raw payload capture;
- revert PR #163 if timeline or failure taxonomy accepts raw/local/session fields, unsupported provider claims, freeform failure layers, or unsafe evidence refs;
- keep v68 Adoption and Main Verification Workbench Loop as the fallback state.

## Tag and Release State Before v69 Publication

| Check | Result |
| --- | --- |
| `v68` tag and release | Existing and verified before v69 implementation. |
| `v69` tag | Absent before PR-5 merge. |
| `v69` GitHub Release | Not created before PR-5 merge. |
| Open PR state | Empty before v69 start; PR-5 is the only expected open PR while this snapshot is under review. |

After PR-5 is reviewed, merged, and synced to `main`, the controller should:

1. Reconcile `main` and `origin/main`.
2. Verify `v69` tag and GitHub Release are still absent.
3. Confirm closeout validation is green.
4. Create an annotated `v69` tag on the post-PR-5 `origin/main` commit.
5. Push the `v69` tag.
6. Create the GitHub Release for `v69`.
7. Verify `v69^{}` dereferences to the post-PR-5 `origin/main` commit.
8. Verify the GitHub Release is non-draft, non-prerelease, has no assets, and points at the release tag.

Release note draft:

```text
v69: Recovery, Resume, Diagnostics, and Observability

- Adds operationTimeline.v1 and operationFailureClassification.v1 for bounded run state, failure layers, retryability, resume eligibility, blocked reasons, and next safe action.
- Adds operationRecoveryPreview.v1 and operationRecoveryConfirmation.v1 with planHash, operation id, step id, classification id, action id, and source fingerprint binding.
- Adds operationUsageTimeObservability.v1 and operationDiagnosticsSummary.v1 for elapsed time, provider call count, token/cost status, copy-only diagnostics, and redaction.
- Adds the Workbench Recovery / Timeline panel from backend operation records only.
- Keeps recovery state separate from provider execution, direct task completion, adoption, main verification, release readiness, git mutation, and GitHub Release publication.
- Does not add a generic shell, terminal, arbitrary command launcher, frontend local session reads, raw transcripts, raw provider output, hidden retries, implicit provider switching, fabricated token/cost, product-level git write, release automation, public distribution, notarization, or auto-update.
```

## Residual Risks

v69 proves recovery and diagnostics through fake and bounded operation evidence, fixtures, validators, Workbench projection, source tests, static build, Browser smoke, and GitHub CI. It does not prove a real provider retry, real interrupted provider resume, or real release-manager workflow.

v69 provides recovery previews and confirmations as structured state. It does not execute retries from Workbench, switch providers automatically, mutate provider output, register gates, merge, tag, push, or publish releases from product code.

## v70 Handoff

v70 should be `v70-release-manager-practical-loop`.

The handoff target is:

```text
main verified goal
-> release readiness resolver
-> release evidence draft
-> manual publication pack
-> controller tag/release
-> post-release reconcile
-> v70 closeout and v71 handoff
```

v70 should make release preparation practical without moving release publication into the product. It may generate readiness, blockers, release notes, target commit, manual copy-only tag/push/release commands, and post-release reconcile evidence. It must not run git or GitHub publication from Workbench, infer release readiness from passing tests alone, expose raw transcripts or local session paths, or claim public distribution, notarization, or auto-update.
