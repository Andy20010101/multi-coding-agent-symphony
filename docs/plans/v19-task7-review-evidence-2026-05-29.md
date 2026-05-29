# v19 Task 7 review evidence

Date: 2026-05-29
Goal id: `v19-goal-runbook-next-action`
Task id: `task-7`
Branch reviewed: `v19-task7-docs-operator-guide`
Verdict: `NEEDS_REVISION`

## Reviewed files

- `docs/plans/v19-goal-runbook-next-action-plan-2026-05-29.md`
- `docs/plans/v19-task7-worker-evidence-2026-05-29.md`
- `README.md`
- `docs/symphony-product-contracts.md`
- `docs/workbench-operator-guide.md`
- `docs/plans/v19-task-evidence-index-2026-05-29.md`
- `docs/plans/v19-release-evidence-2026-05-29.md`
- Task 7 worker diff reviewed against `main`: 6 files changed, 300 insertions, 4 deletions. This review evidence file was added after the worker diff review.

## Findings

### Blocker 1: task-7 evidence state is stale in the evidence index and release draft

`docs/plans/v19-task-evidence-index-2026-05-29.md` still says task-7 has no `worker.evidence-recorded` event. `docs/plans/v19-release-evidence-2026-05-29.md` repeats that task-7 worker evidence still needs to be written and that no task-7 event is registered by the draft.

That no longer matches the current local event log or `goal-status`.

Checked evidence:

- `.symphony/goals/events/v19-goal-runbook-next-action.ndjson` line 21 contains `goal-event-log.v1:evt_f7f1d97c224c6cdb`, task `task-7`, event type `worker.evidence-recorded`, evidence ref `docs/plans/v19-task7-worker-evidence-2026-05-29.md`.
- `pnpm --silent symphony goal-status --goal v19-goal-runbook-next-action --json` reports task-7 with `status: "in-progress"`, `workerEvidenceRef: "docs/plans/v19-task7-worker-evidence-2026-05-29.md"`, `reviewEvidenceRef: null`, and `mainVerificationRef: null`.
- `docs/plans/v19-task7-worker-evidence-2026-05-29.md` records the same event id and hash.

Required change:

- Update the task-7 row in `docs/plans/v19-task-evidence-index-2026-05-29.md` to record `evt_f7f1d97c224c6cdb` as worker evidence, while keeping review and main verification missing.
- Update `docs/plans/v19-release-evidence-2026-05-29.md` so task-7 is not described as missing worker evidence. Remaining task-7 work should be independent review and main verification.

### Blocker 2: `goal-closeout-report.v1` docs omit required implementation fields

`docs/symphony-product-contracts.md` documents the v19 contract family, but the `goal-closeout-report.v1` example is not field-accurate against the implementation.

Implementation requires:

- `generatedAt`, enforced by `validateGoalCloseoutReportContract`.
- `safety`, including `readOnly`, `copyOnly`, `workbenchWriteAvailable`, `browserExecutionAvailable`, `modelInvocationAvailable`, `writesInDryRun`, `confirmRequiredForWrites`, and `releaseReadyRequiresEvidence`.
- `releaseGates.mcasDoctor`, because `GOAL_PROGRESS_RELEASE_GATE_IDS` includes `mcasDoctor`.

The current `goal-closeout-report.v1` example in `docs/symphony-product-contracts.md` omits `generatedAt`, omits `safety`, and omits `mcasDoctor` from `releaseGates`.

Required change:

- Update the `goal-closeout-report.v1` example in `docs/symphony-product-contracts.md` to include every required implementation field.
- While updating the contract docs, explicitly name the `goal-prompt-pack.v1` top-level fields `generatedAt`, `prompts`, and `safety`; the validator requires them, but the current section mainly describes per-prompt fields.

## Checks that passed

- README keeps `Latest completed mainline release` and `Current released repository tag` at `v18`; it does not move latest released tag to v19.
- Workbench operator guide states Active Goal Control Center is read-only and shows copy-only prompt text only. It says Workbench cannot confirm runbooks, execute prompts, register events, call models, merge, tag, or infer release-ready.
- Release evidence draft does not fabricate release gate pass events. It keeps release gate event state as `unknown`, status as `NOT READY`, and says passing local commands do not create release-ready.
- No reviewed file claims a v19 tag exists. `git tag --list 'v19'` returned no output.

## Commands run

| Command | Result |
|---|---|
| `git status --short --branch` | Exit 0. Output: `## v19-task7-docs-operator-guide`. |
| `git diff --stat main...HEAD` | Exit 0, before this reviewer evidence file was added. Output: `README.md` 14 changed lines; `docs/plans/v19-release-evidence-2026-05-29.md` 89 added lines; `docs/plans/v19-task-evidence-index-2026-05-29.md` 51 added lines; `docs/plans/v19-task7-worker-evidence-2026-05-29.md` 64 added lines; `docs/symphony-product-contracts.md` 27 changed lines; `docs/workbench-operator-guide.md` 59 changed lines; total 300 insertions, 4 deletions. |
| `pnpm --silent symphony goal-status --goal v19-goal-runbook-next-action --json` | Exit 0. Key output: `summary.totalTasks: 9`, `summary.completedTasks: 7`, `summary.releaseReady: false`, all release gates `unknown`; task-7 has worker evidence ref `docs/plans/v19-task7-worker-evidence-2026-05-29.md`, review evidence `null`, main verification `null`. |
| `pnpm --silent symphony goal next --goal v19-goal-runbook-next-action --json` | Exit 0. Output contract `goal-next-action.v1`, `status: "missing-runbook"`, reason `No active managed goal runbook is registered.` |
| `git tag --list 'v19'` | Exit 0. No output. |
| `git rev-parse --verify refs/tags/v18` | Exit 0. Output: `5b68630aded51007416cbf357546acad3b6a1f2e`. |
| `pnpm check` | Exit 0. `node --check` completed for `src/*.js`, adapter, ensemble, integration, intake, symphony, tracker, script, plugin, and test files. |
| `pnpm test` | Exit 0. Node test runner reported `tests 660`, `suites 109`, `pass 660`, `fail 0`, `cancelled 0`, `skipped 0`, `todo 0`, `duration_ms 3512.965417`. |
| `pnpm workbench:build` | Exit 0. Vite `v8.0.14` transformed 17 modules and built `src/symphony/workbench-static/index.html`, `index-D3K9Dk14.css`, and `index-Duy8jdh2.js` in `135ms`; Node printed the existing WASI experimental warning. |
| `git diff --check` | Exit 0. No output. |

## Verdict

`NEEDS_REVISION`

The branch passes the required commands, and the README/operator guide/release-ready wording is mostly within the intended boundary. The evidence index and release draft are stale after the task-7 worker event was registered, and the product contract docs are not field-accurate for `goal-closeout-report.v1`. These need to be corrected before approval.
