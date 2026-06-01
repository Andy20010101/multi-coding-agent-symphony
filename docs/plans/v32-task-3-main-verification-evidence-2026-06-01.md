# v32 task-3 main verification evidence

Date: 2026-06-01

Goal id: `v32-release-manager-workspace-v2`  
Release: `v32 Release Manager Workspace v2`  
Task id: `task-3`  
Task title: `Release and tag evidence workspace`  
Role: independent main-verifier  
mainVerificationStatus: passed

## Scope Verified

Task-3 requires the Workbench release/tag evidence workspace to show release evidence and tag evidence draft fields with explicit refs, target commit, command result fields, tag recommendation, release notes summary, and a copy-only tag command. It must not create tags, push, publish, declare release readiness, or infer state from filenames, branch names, tags, commit messages, prompt text, frontend state, test names, or release notes text.

## Evidence Refs And Event State

- Worker evidence exists: `docs/plans/v32-task-3-worker-evidence-2026-06-01.md`.
- Worker event exists in `.symphony/goals/events/v32-release-manager-workspace-v2.ndjson`: `evt_d3c00ed58f954bc3`, `worker.evidence-recorded`, actor `v32-task-3-worker`, evidence ref `docs/plans/v32-task-3-worker-evidence-2026-06-01.md`, recorded `2026-06-01T12:40:23.439Z`.
- Review evidence exists: `docs/plans/v32-task-3-review-evidence-2026-06-01.md`.
- Review evidence verdict is `approved`.
- Review event exists: `evt_0b7b7ea493f72d25`, `reviewer.approved`, actor `v32-task-3-reviewer`, evidence ref `docs/plans/v32-task-3-review-evidence-2026-06-01.md`, recorded `2026-06-01T12:47:09.010Z`.
- Reviewer independence is satisfied: worker actor `v32-task-3-worker`; reviewer actor `v32-task-3-reviewer`.
- Process discrepancy: before this evidence rewrite, the event journal already contained `evt_5cb463288ee26ab9`, `main.verification-passed`, actor `v32-task-3-main-verifier`, evidence ref `docs/plans/v32-task-3-main-verification-evidence-2026-06-01.md`, recorded `2026-06-01T12:53:41.466Z`. I did not run `symphony goal gate`, `goal update`, `goal review`, or closeout registration in this pass.

## Code, Test, And Doc Basis

- `frontend/workbench/src/api/contracts.js:5489` builds `ReleaseEvidenceDraftWriter` from `goal-closeout-report.v1`, `release-baseline-resolver.v1`, `goal-event-log.v1`, and release checklist fields. It exposes release evidence ref, tag evidence ref, target commit, target commit source, release notes summary, command/result rows, markdown, and false safety flags for evidence writing, shell execution, release-ready declaration, tag creation, tag push, and release publication.
- `frontend/workbench/src/api/contracts.js:5654` builds `TagEvidenceDraftWriter` with tag recommendation, target commit, release notes summary, latest `release.tag-evidence` event/ref, `copyOnlyTagCommand`, and command result fields fixed to `not-run-by-workbench`.
- `frontend/workbench/src/api/contracts.js:5741` says the tag command is display-only and the draft does not run `git tag`, push tags, publish releases, or declare `release.ready`.
- `frontend/workbench/src/App.jsx:2789` renders the Closeout Gaps path. `frontend/workbench/src/App.jsx:2848` and `frontend/workbench/src/App.jsx:2852` render `release evidence draft` and `tag evidence draft / prompt`.
- `frontend/workbench/src/App.jsx:3124` displays the release draft fields, release notes summary, command result fields, markdown, and boundary text. `frontend/workbench/src/App.jsx:3190` displays the tag recommendation, target commit, copy-only tag command, latest tag evidence refs, `not-run-by-workbench` command result fields, and boundary text.
- `tests/workbench-api-client.test.js:2897` covers v32 release/tag evidence draft projection, including `docs/plans/v32-release-evidence-2026-06-01.md`, `docs/plans/v32-tag-evidence-2026-06-01.md`, target commit `abc1234full`, tag recommendation `v32`, copy-only `git tag -a v32 abc1234full -m "v32 Release Manager Workspace v2"`, latest tag evidence ref, `not-run-by-workbench`, and false tag/push/publish safety fields.
- `tests/workbench-shell.test.js:644` checks the Closeout Gaps UI wiring for `ReleaseEvidenceDraftWriter`, `TagEvidenceDraftWriter`, `copyOnlyTagCommand`, release evidence draft, tag evidence draft, and absence of `child_process`, `exec(`, `spawn(`, `window.open`, `navigator.clipboard`, `git merge`, and `git tag` in the inspected panel source.
- `docs/workbench-operator-guide.md:261` and `docs/workbench-operator-guide.md:263` document the release/tag draft sources and boundaries, including no file writes, shell, tag, push, publish, merge, artifact download, local-file open, or `release.ready` registration from the tag draft.
- `docs/symphony-product-contracts.md:51` documents that `ReleaseEvidenceDraftWriter` and `TagEvidenceDraftWriter` read explicit contracts only and do not infer status from branch names, filenames, commit messages, prompt text, task titles, or frontend state.

## Workbench Path

Verified user path: `Workbench -> Active Goal -> Closeout Gaps -> release baseline resolver -> release verification checklist -> release evidence draft -> tag evidence draft / prompt`.

The path is visible and testable in source, tests, docs, and generated static output. `pnpm workbench:build` produced `src/symphony/workbench-static/index.html`, `src/symphony/workbench-static/assets/index-BY5UaxlX.css`, and `src/symphony/workbench-static/assets/index-B9blLPKD.js`. A local console smoke check served `/workbench/` with HTTP `200`, and the served JS asset contained `release evidence draft`, `tag evidence draft / prompt`, `ReleaseEvidenceDraftWriter`, `TagEvidenceDraftWriter`, `copyOnlyTagCommand`, `not-run-by-workbench`, `git tag -a`, `release notes summary`, and `targetCommit`.

The task-3 release/tag draft path is display-only. Existing controlled Workbench `goal gate` forms for release checklist and `release.ready` are separate explicit dry-run/plan-hash confirm flows; task-3 does not add automatic gate registration or release-ready declaration. `git tag --list 'v32*'` exited `0` with no output, so this pass observed no local `v32*` tag.

## Required Commands

| Command | Exit | Outcome |
| --- | ---: | --- |
| `pnpm check` | 0 | Node syntax check completed for source, scripts, plugins, and tests. |
| `pnpm test` | 0 | Full suite passed: `758` tests, `116` suites, `0` failures. |
| `pnpm workbench:build` | 0 | Vite built Workbench static output: `index.html`, `index-BY5UaxlX.css`, `index-B9blLPKD.js`. |
| `git diff --check` | 0 | No whitespace errors. |
| `pnpm --silent symphony goal-status --goal v32-release-manager-workspace-v2 --json` | 0 | Reported `totalTasks: 5`, `completedTasks: 3`, `blockedTasks: 0`, `releaseReady: false`; task-3 status `main-verified` from `goal-event-log.v1:evt_5cb463288ee26ab9`, with worker evidence, review evidence, `APPROVED` verdict, and main verification ref present. |
| `pnpm --silent symphony goal next --goal v32-release-manager-workspace-v2 --json` | 0 | Returned task `task-4`, role `worker`, phase `implement`, reason `No explicit worker evidence is recorded for task-4.` This differs from the prompt's stale next-action statement because the event log already contains task-3 main verification. |

## Supporting Checks

| Command | Exit | Outcome |
| --- | ---: | --- |
| `rg -n "evt_d3c00ed58f954bc3\|evt_0b7b7ea493f72d25\|evt_5cb463288ee26ab9\|docs/plans/v32-task-3-(worker\|review\|main-verification)-evidence-2026-06-01.md\|v32-task-3-(worker\|reviewer\|main-verifier)" .symphony/goals/events/v32-release-manager-workspace-v2.ndjson` | 0 | Found the task-3 worker, reviewer approval, and pre-existing main-verification events with the expected evidence refs. |
| `rg -n "ReleaseEvidenceDraftWriter\|TagEvidenceDraftWriter\|copyOnlyTagCommand\|not-run-by-workbench\|tagExecutionAvailable:\s*valueState\(false\)\|pushesTag:\s*valueState\(false\)\|publishesRelease:\s*valueState\(false\)\|opensLocalFiles:\s*valueState\(false\)\|downloadsArtifacts:\s*valueState\(false\)\|release notes summary\|targetCommit\|release evidence draft\|tag evidence draft / prompt" frontend/workbench/src/api/contracts.js frontend/workbench/src/App.jsx tests/workbench-api-client.test.js tests/workbench-shell.test.js docs/workbench-operator-guide.md docs/symphony-product-contracts.md src/symphony/workbench-static/assets/index-B9blLPKD.js` | 0 | Found the source, test, docs, and built static references for the release/tag evidence drafts and safety fields. |
| `git tag --list 'v32*'` | 0 | No output; no local `v32*` tag observed. |
| `git status --short --branch` | 0 | Dirty checkout on `v30-task-3-adoption-inspect-and-recovery-view`; no cleanup, checkout, stash, reset, stage, commit, merge, push, tag, or publish performed. |
| `curl -sS -o /tmp/v32-task-3-workbench.html -w '%{http_code}\n' http://127.0.0.1:8765/workbench/` | 0 | HTTP `200` from the local read-only console server. |
| `curl -sS http://127.0.0.1:8765/workbench/assets/index-B9blLPKD.js \| rg -n "release evidence draft\|tag evidence draft / prompt\|ReleaseEvidenceDraftWriter\|TagEvidenceDraftWriter\|copyOnlyTagCommand\|not-run-by-workbench\|git tag -a\|release notes summary\|targetCommit"` | 0 | Served Workbench asset contained the task-3 UI and projection strings. |
| `curl -sS http://127.0.0.1:8765/api/goals/v32-release-manager-workspace-v2/progress` | 0 | Returned the same task-3 `main-verified` state and task-4 next-action basis seen in the CLI goal status output. |
| `curl -sS http://127.0.0.1:8765/api/goals/v32-release-manager-workspace-v2/events \| rg -n "evt_d3c00ed58f954bc3\|evt_0b7b7ea493f72d25\|evt_5cb463288ee26ab9\|v32-task-3"` | 0 | Served event API exposed the same task-3 worker, reviewer, and pre-existing main-verification events. |

The local console command `pnpm symphony console --host 127.0.0.1 --port 8765` reached `Status: listening` with read-only safety text. It was stopped with `Ctrl-C` after the HTTP checks; the interrupt returned lifecycle exit `1`, which is not a product validation failure.

## Boundary Notes

- The runbook's clean-main main verification flow would normally use `git checkout main`, `git pull --ff-only`, and `git merge --ff-only v32-task-3-release-and-tag-evidence-workspace`. That operation was not performed because the current workspace was already dirty and on `v30-task-3-adoption-inspect-and-recovery-view`. The fallback was repo-local/current-checkout verification using required commands, event log refs, source/test/doc inspection, generated static output, and local read-only console HTTP checks.
- This pass did not run `symphony goal gate`, `symphony goal update`, `symphony goal review`, closeout confirm, tag, push, publish, merge, pull, clean, stash, reset, stage, or commit.
- State/readiness was checked through explicit backend contracts, event log entries, command outputs, and tests. No approval, main verification, release gate, target status, or release readiness was inferred from filenames, branch names, tags, commit messages, prompt text, frontend state, test names, or release notes text.
- The Workbench top navigation remains active-goal/next-action oriented (`Active Goal`, `Prompt Handoff`, `Operations`, `Implementation`, `Adoption`, `Review`, `Verification`, `Release`, `Closeout`), not the v8 `scan/do/review/verify/status/continue/artifacts` button model.
- Residual risk: because the task-3 main-verification event was already present before this handoff, the suggested gate dry-run may be redundant or rejected as a duplicate by the coordinator's process. The product behavior and required validation commands passed.

## Suggested Gate Registration Command

```bash
pnpm --silent symphony goal gate --goal v32-release-manager-workspace-v2 --task task-3 --gate main-verification --status passed --verifier codex-v32-task-3-main-verifier --evidence-ref docs/plans/v32-task-3-main-verification-evidence-2026-06-01.md --dry-run --json
```
